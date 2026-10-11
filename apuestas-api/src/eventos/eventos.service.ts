import {
  Injectable,
  OnModuleInit,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Evento, EventoDocument } from './schemas/evento.schema';
import { Mercado, MercadoDocument } from '../cuotas/schemas/mercado.schema';

@Injectable()
export class EventosService implements OnModuleInit {
  private readonly logger = new Logger(EventosService.name);

  constructor(
    @InjectModel(Evento.name)
    private readonly eventoModel: Model<EventoDocument>,
    @InjectModel(Mercado.name)
    private readonly mercadoModel: Model<MercadoDocument>,
  ) {}

  async onModuleInit() {
    await this.sembrarEventosIniciales();
  }

  /**
   * Seeder automático que puebla 4 partidos y sus mercados iniciales
   * si la colección de eventos está vacía.
   */
  async sembrarEventosIniciales() {
    const totalEventos = await this.eventoModel.countDocuments();
    if (totalEventos > 0) {
      return;
    }

    this.logger.log('Iniciando Seeder: poblando 4 eventos deportivos y mercados 1X2...');

    const ahora = new Date();

    const eventosSemilla = [
      {
        deporte: 'Fútbol',
        liga: 'UEFA Champions League',
        equipoLocal: 'Real Madrid',
        equipoVisitante: 'Manchester City',
        fuerzaAtaqueLocal: 1.35,
        fuerzaDefensaLocal: 0.90,
        fuerzaAtaqueVisitante: 1.40,
        fuerzaDefensaVisitante: 0.85,
        fechaProgramada: new Date(ahora.getTime() + 2 * 60 * 60 * 1000), // En 2 horas
        estado: 'PRE-MATCH',
        marcador: { local: 0, visitante: 0 },
        resultado: 'SIN_RESULTADO',
        cuotasIniciales: { local: 2.25, empate: 3.50, visitante: 2.90 },
      },
      {
        deporte: 'Fútbol',
        liga: 'UEFA Champions League',
        equipoLocal: 'FC Barcelona',
        equipoVisitante: 'Paris Saint-Germain',
        fuerzaAtaqueLocal: 1.25,
        fuerzaDefensaLocal: 1.05,
        fuerzaAtaqueVisitante: 1.30,
        fuerzaDefensaVisitante: 1.00,
        fechaProgramada: new Date(ahora.getTime() + 4 * 60 * 60 * 1000), // En 4 horas
        estado: 'PRE-MATCH',
        marcador: { local: 0, visitante: 0 },
        resultado: 'SIN_RESULTADO',
        cuotasIniciales: { local: 2.40, empate: 3.40, visitante: 2.80 },
      },
      {
        deporte: 'Fútbol',
        liga: 'UEFA Champions League',
        equipoLocal: 'Arsenal',
        equipoVisitante: 'Bayern Múnich',
        fuerzaAtaqueLocal: 1.20,
        fuerzaDefensaLocal: 0.85,
        fuerzaAtaqueVisitante: 1.25,
        fuerzaDefensaVisitante: 0.95,
        fechaProgramada: new Date(ahora.getTime() + 24 * 60 * 60 * 1000), // Mañana
        estado: 'PRE-MATCH',
        marcador: { local: 0, visitante: 0 },
        resultado: 'SIN_RESULTADO',
        cuotasIniciales: { local: 2.10, empate: 3.45, visitante: 3.30 },
      },
      {
        deporte: 'Fútbol',
        liga: 'UEFA Champions League',
        equipoLocal: 'Liverpool',
        equipoVisitante: 'Bayer Leverkusen',
        fuerzaAtaqueLocal: 1.30,
        fuerzaDefensaLocal: 0.90,
        fuerzaAtaqueVisitante: 1.15,
        fuerzaDefensaVisitante: 0.95,
        fechaProgramada: new Date(ahora.getTime() + 28 * 60 * 60 * 1000), // Mañana tarde
        estado: 'PRE-MATCH',
        marcador: { local: 0, visitante: 0 },
        resultado: 'SIN_RESULTADO',
        cuotasIniciales: { local: 1.95, empate: 3.60, visitante: 3.75 },
      },
    ];

    for (const item of eventosSemilla) {
      const { cuotasIniciales, ...datosEvento } = item;
      const nuevoEvento = await this.eventoModel.create(datosEvento);

      await this.mercadoModel.create({
        eventoId: nuevoEvento._id,
        tipo: '1X2',
        estadoMercado: 'ABIERTO',
        cuotas: cuotasIniciales,
        cuotasVersion: 1,
        margen: 0.06,
      });
    }

    this.logger.log('✅ [Seed Eventos]: 4 eventos y mercados iniciales creados exitosamente.');
  }

  /**
   * Retorna todos los eventos ordenados por fecha ascendente,
   * unificados con su mercado activo correspondiente.
   */
  async obtenerEventos() {
    const eventos = await this.eventoModel
      .find()
      .sort({ fechaProgramada: 1 })
      .lean()
      .exec();

    const eventosConMercados = await Promise.all(
      eventos.map(async (evento) => {
        const mercado = await this.mercadoModel
          .findOne({ eventoId: evento._id })
          .lean()
          .exec();

        return {
          ...evento,
          mercado: mercado ?? null,
        };
      }),
    );

    return eventosConMercados;
  }

  /**
   * Consulta un evento por su ID junto con su mercado.
   */
  async obtenerEventoPorId(id: string) {
    const evento = await this.eventoModel.findById(id).lean().exec();
    if (!evento) {
      throw new NotFoundException(`Evento con ID ${id} no encontrado`);
    }

    const mercado = await this.mercadoModel
      .findOne({ eventoId: evento._id })
      .lean()
      .exec();

    return {
      ...evento,
      mercado: mercado ?? null,
    };
  }

  /**
   * Actualiza el resultado final del evento y cierra su mercado.
   */
  async actualizarResultado(
    id: string,
    resultado: 'LOCAL' | 'EMPATE' | 'VISITANTE',
    marcadorFinal?: string,
  ) {
    const evento = await this.eventoModel.findById(id);
    if (!evento) {
      throw new NotFoundException(`Evento con ID ${id} no encontrado`);
    }

    if (evento.estado === 'FINALIZADO') {
      throw new ConflictException('El evento ya se encuentra FINALIZADO');
    }

    evento.estado = 'FINALIZADO';
    evento.resultado = resultado;
    if (marcadorFinal) {
      evento.marcadorFinal = marcadorFinal;
    }
    await evento.save();

    // Cerrar el mercado asociado y subir versión
    await this.mercadoModel.updateOne(
      { eventoId: evento._id },
      {
        $set: { estadoMercado: 'CERRADO' },
        $inc: { cuotasVersion: 1 },
      },
    );

    return evento;
  }
}
