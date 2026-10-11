import {
  Injectable,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Ticket, TicketDocument } from './schemas/ticket.schema';
import { CreateApuestaDto } from './dto/create-apuesta.dto';
import { BilleteraService } from '../billetera/billetera.service';
import { Mercado, MercadoDocument } from '../cuotas/schemas/mercado.schema';

/**
 * Resultado interno de crearApuesta que incluye una bandera de idempotencia
 * para que el controlador pueda diferenciar 201 Created de 200 OK (RNF04).
 */
export interface ResultadoApuesta {
  ticket: TicketDocument;
  /** true → ticket recién creado (HTTP 201). false → ticket ya existía (HTTP 200) */
  esNuevo: boolean;
}

@Injectable()
export class ApuestasService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(Mercado.name)
    private readonly mercadoModel: Model<MercadoDocument>,
    private readonly billeteraService: BilleteraService,
  ) {}

  async crearApuesta(
    usuarioId: string,
    dto: CreateApuestaDto,
  ): Promise<ResultadoApuesta> {
    // 1. Verificar idempotencia rápida (RNF04)
    //    Si la clave ya fue procesada, devolvemos el ticket existente con esNuevo=false
    //    para que el controlador responda HTTP 200 OK (no 201) sin cobrar de nuevo.
    const ticketExistente = await this.ticketModel.findOne({
      usuarioId,
      idempotencyKey: dto.idempotencyKey,
    });
    if (ticketExistente) {
      return { ticket: ticketExistente, esNuevo: false };
    }

    // 2. Validar estado y versión del mercado
    const eventoObjectId = new Types.ObjectId(dto.eventoId);
    const mercado = await this.mercadoModel.findOne({
      eventoId: eventoObjectId,
    });
    if (!mercado) {
      throw new BadRequestException(
        'El mercado para este evento no existe. Verifica que el eventoId sea correcto.',
      );
    }

    // HTTP 423 Locked — mercado SUSPENDIDO o CERRADO (ADR-002)
    if (mercado.estadoMercado !== 'ABIERTO') {
      throw new HttpException(
        {
          statusCode: 423,
          message: 'Mercado suspendido temporalmente por incidente en el partido',
          estadoMercado: mercado.estadoMercado,
        },
        HttpStatus.LOCKED,
      );
    }

    // HTTP 409 Conflict — cuota cambió entre que el usuario la vio y confirmó (ADR-002)
    if (mercado.cuotasVersion !== dto.cuotasVersion) {
      throw new ConflictException({
        statusCode: 409,
        message: 'La cuota ha cambiado desde que realizaste tu selección',
        cuotaActualizada: mercado.cuotas,
        cuotasVersionActual: mercado.cuotasVersion,
      });
    }

    const cuotaElegida =
      dto.seleccion === 'LOCAL'
        ? mercado.cuotas.local
        : dto.seleccion === 'EMPATE'
          ? mercado.cuotas.empate
          : mercado.cuotas.visitante;

    const gananciaCentavos = Math.round(dto.montoCentavos * cuotaElegida);

    // 3. Obtener resumen real del evento (Punto 3 — eventoResumen dinámico)
    //    Consultamos la colección de Eventos del Integrante 1 si ya existe.
    //    Usamos un cast dinámico para no acoplar el schema de Eventos a este módulo.
    const eventoResumen = await this.resolverEventoResumen(dto.eventoId);

    // 4. Ejecutar Transacción ACID de MongoDB (RNF01 — ADR-001)
    //    Ambas escrituras (débito de billetera + creación de ticket) ocurren
    //    dentro de la misma sesión: se confirman juntas o revierten juntas.
    const session = await this.connection.startSession();
    try {
      let nuevoTicket!: TicketDocument;

      await session.withTransaction(async () => {
        // A. Debitar de la billetera en la MISMA sesión → HTTP 400 si saldo insuficiente
        await this.billeteraService.debitarSaldo(
          usuarioId,
          dto.montoCentavos,
          dto.idempotencyKey,
          session,
        );

        // B. Crear el ticket en la MISMA sesión (RNF02 — todo en centavos enteros)
        const tickets = await this.ticketModel.create(
          [
            {
              usuarioId,
              eventoId: eventoObjectId,
              eventoResumen,
              seleccion: dto.seleccion,
              cuotaJugada: cuotaElegida,
              cuotasVersion: dto.cuotasVersion,
              montoCentavos: dto.montoCentavos,
              gananciaPotencialCentavos: gananciaCentavos,
              estado: 'PENDIENTE',
              idempotencyKey: dto.idempotencyKey,
            },
          ],
          { session },
        );

        nuevoTicket = tickets[0];
      });

      return { ticket: nuevoTicket, esNuevo: true };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Intenta resolver el nombre real del partido y la liga desde la colección
   * de eventos (propiedad del Integrante 1). Si la colección no existe todavía
   * (el Módulo 1 aún no fue mergeado), devuelve un resumen genérico de respaldo
   * para no bloquear el desarrollo del Módulo 2.
   */
  private async resolverEventoResumen(
    eventoId: string,
  ): Promise<{ partido: string; liga: string }> {
    try {
      // Acceso dinámico sin importar el schema del Integrante 1 para evitar acoplamiento
      const eventosCollection = this.connection.collection('eventos');
      const evento = await eventosCollection.findOne({
        _id: new Types.ObjectId(eventoId),
      });

      if (evento) {
        const partido = `${evento['equipoLocal'] ?? '?'} vs ${evento['equipoVisitante'] ?? '?'}`;
        const liga = (evento['liga'] as string) ?? 'Sin liga';
        return { partido, liga };
      }
    } catch {
      // La colección de eventos no existe aún (Módulo 1 no mergeado) → usa respaldo
    }

    return { partido: 'Partido en vivo', liga: 'Liga Pro' };
  }

  async obtenerHistorial(usuarioId = 'usr-demo'): Promise<TicketDocument[]> {
    return this.ticketModel
      .find({ usuarioId })
      .sort({ createdAt: -1 })
      .exec();
  }
}
