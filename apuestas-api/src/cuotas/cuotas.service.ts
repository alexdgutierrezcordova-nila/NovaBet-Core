import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  MessageEvent,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subject, Observable } from 'rxjs';
import { Mercado, MercadoDocument } from './schemas/mercado.schema';
import { Evento, EventoDocument } from '../eventos/schemas/evento.schema';
import {
  MercadoActualizadoStream,
  EstadoMercado,
} from './interfaces/cuotas-stream.interface';

@Injectable()
export class CuotasService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CuotasService.name);
  private readonly stream$ = new Subject<MessageEvent>();

  private intervalRef: NodeJS.Timeout | null = null;
  private readonly minutoSimuladoPorEvento = new Map<string, number>();
  private readonly eventosSuspendidosTemporalmente = new Set<string>();
  private eventoIndex = 0;

  constructor(
    @InjectModel(Mercado.name)
    private readonly mercadoModel: Model<MercadoDocument>,
    @InjectModel(Evento.name)
    private readonly eventoModel: Model<EventoDocument>,
  ) {}

  onModuleInit(): void {
    if (process.env.NODE_ENV !== 'test') {
      this.iniciarMotorInPlay();
    }
  }

  onModuleDestroy(): void {
    this.detenerMotorInPlay();
    this.stream$.complete();
  }

  /**
   * Retorna el stream SSE observable para clientes conectados vía HTTP.
   */
  obtenerStream(): Observable<MessageEvent> {
    return this.stream$.asObservable();
  }

  /**
   * Inicia el ciclo periódico de simulación In-Play y fluctuación de cuotas.
   */
  iniciarMotorInPlay(intervaloMs = 4000): void {
    if (this.intervalRef) {
      return;
    }

    this.logger.log(
      `⚡ [Motor In-Play]: Iniciado con intervalo de emisión cada ${intervaloMs}ms`,
    );

    this.intervalRef = setInterval(async () => {
      try {
        await this.ejecutarCicloSimulacion();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Error en ciclo de simulación In-Play: ${errorMsg}`);
      }
    }, intervaloMs);
  }

  /**
   * Detiene el motor In-Play.
   */
  detenerMotorInPlay(): void {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
      this.logger.log('🛑 [Motor In-Play]: Detenido correctamente.');
    }
  }

  /**
   * Ejecuta un ciclo de cálculo in-play:
   * 1. Selecciona un partido activo.
   * 2. Simula el avance del minuto y eventos del partido.
   * 3. Aplica fluctuación cuantitativa a las cuotas según el tiempo y marcador.
   * 4. Persiste en MongoDB con cuotasVersion incrementada (OCC).
   * 5. Emite el evento al stream SSE.
   */
  async ejecutarCicloSimulacion(): Promise<MercadoActualizadoStream | null> {
    const eventos = await this.eventoModel.find().lean().exec();
    if (!eventos || eventos.length === 0) {
      return null;
    }

    // Rotar eventos para alternar actualizaciones de forma balanceada
    this.eventoIndex = (this.eventoIndex + 1) % eventos.length;
    const eventoActual = eventos[this.eventoIndex];
    const eventoIdStr = (eventoActual._id as Types.ObjectId).toString();

    const mercado = await this.mercadoModel.findOne({ eventoId: eventoActual._id });
    if (!mercado) {
      return null;
    }

    // Minuto simulado: avanza progresivamente
    let minuto = this.minutoSimuladoPorEvento.get(eventoIdStr) ?? Math.floor(Math.random() * 20) + 1;
    minuto = Math.min(90, minuto + 1);
    this.minutoSimuladoPorEvento.set(eventoIdStr, minuto);

    let nuevoEstadoMercado: EstadoMercado = 'ABIERTO';
    let marcador = {
      local: eventoActual.marcador?.local ?? 0,
      visitante: eventoActual.marcador?.visitante ?? 0,
    };

    // ¿Estaba suspendido en el ciclo anterior por un evento crítico?
    if (this.eventosSuspendidosTemporalmente.has(eventoIdStr)) {
      this.eventosSuspendidosTemporalmente.delete(eventoIdStr);
      nuevoEstadoMercado = 'ABIERTO';
    } else {
      // 5% de probabilidad de gol o revisión VAR (simula suspensión momentánea)
      const chanceEventoCritico = Math.random();
      if (chanceEventoCritico < 0.05 && minuto < 88) {
        nuevoEstadoMercado = 'SUSPENDIDO';
        this.eventosSuspendidosTemporalmente.add(eventoIdStr);

        // Simulamos gol del local o visitante
        if (Math.random() > 0.5) {
          marcador.local += 1;
        } else {
          marcador.visitante += 1;
        }

        await this.eventoModel.findByIdAndUpdate(eventoActual._id, {
          marcador,
          estado: 'LIVE',
        });
      }
    }

    // Variación cuantitativa de cuotas (time-decay + ajuste estocástico)
    const factorTiempo = (90 - minuto) / 90;
    const deltaLocal = (Math.random() * 0.08 - 0.04) * (1 + factorTiempo * 0.2);
    const deltaEmpate = (Math.random() * 0.06 - 0.03);
    const deltaVisitante = (Math.random() * 0.08 - 0.04) * (1 + factorTiempo * 0.2);

    let cuotaLocal = this.redondearCuota(mercado.cuotas.local + deltaLocal);
    let cuotaEmpate = this.redondearCuota(mercado.cuotas.empate + deltaEmpate);
    let cuotaVisitante = this.redondearCuota(mercado.cuotas.visitante + deltaVisitante);

    // Si el marcador cambió, ajustar drásticamente las cuotas
    if (marcador.local > marcador.visitante) {
      cuotaLocal = this.redondearCuota(Math.max(1.15, cuotaLocal * 0.85));
      cuotaVisitante = this.redondearCuota(cuotaVisitante * 1.30);
    } else if (marcador.visitante > marcador.local) {
      cuotaVisitante = this.redondearCuota(Math.max(1.15, cuotaVisitante * 0.85));
      cuotaLocal = this.redondearCuota(cuotaLocal * 1.30);
    }

    // 1. Persistencia atómica en MongoDB incrementando cuotasVersion
    mercado.cuotas = {
      local: cuotaLocal,
      empate: cuotaEmpate,
      visitante: cuotaVisitante,
    };
    mercado.cuotasVersion += 1;
    mercado.estadoMercado = nuevoEstadoMercado;
    await mercado.save();

    // 2. Construcción del payload conforme a la interfaz del frontend
    const payload: MercadoActualizadoStream = {
      eventoId: eventoIdStr,
      estadoMercado: nuevoEstadoMercado,
      cuotas: {
        local: cuotaLocal,
        empate: cuotaEmpate,
        visitante: cuotaVisitante,
      },
      cuotasVersion: mercado.cuotasVersion,
      minutoSimulado: minuto,
      marcador,
      emitidoEn: new Date().toISOString(),
    };

    // 3. Emisión SSE hacia los clientes suscritos
    this.stream$.next({
      data: payload,
    });

    return payload;
  }

  private redondearCuota(valor: number): number {
    return Number(Math.max(1.05, Math.min(25.0, valor)).toFixed(2));
  }
}
