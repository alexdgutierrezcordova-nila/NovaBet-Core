import {
  Injectable,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Ticket, TicketDocument } from './schemas/ticket.schema';
import { CreateApuestaDto } from './dto/create-apuesta.dto';
import { BilleteraService } from '../billetera/billetera.service';
import { Mercado, MercadoDocument } from '../cuotas/schemas/mercado.schema';

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

  async crearApuesta(usuarioId: string, dto: CreateApuestaDto) {
    // 1. Verificar idempotencia rápida
    const ticketExistente = await this.ticketModel.findOne({
      usuarioId,
      idempotencyKey: dto.idempotencyKey,
    });
    if (ticketExistente) {
      return ticketExistente; // Devuelve el ticket ya emitido sin cobrar doble
    }

    // 2. Validar estado y versión del mercado
    const mercado = await this.mercadoModel.findOne({ eventoId: dto.eventoId });
    if (!mercado) {
      throw new BadRequestException('El mercado para este evento no existe');
    }

    if (mercado.estadoMercado !== 'ABIERTO') {
      throw new HttpException(
        {
          statusCode: 423,
          message: 'Mercado suspendido temporalmente por incidente',
        },
        HttpStatus.LOCKED,
      );
    }

    if (mercado.cuotasVersion !== dto.cuotasVersion) {
      throw new ConflictException({
        statusCode: 409,
        message: 'La cuota ha cambiado',
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

    // 3. Ejecutar Transacción ACID de MongoDB
    const session = await this.connection.startSession();
    try {
      let nuevoTicket!: TicketDocument;
      await session.withTransaction(async () => {
        // A. Debitar de la billetera en la MISMA sesión
        await this.billeteraService.debitarSaldo(
          usuarioId,
          dto.montoCentavos,
          dto.idempotencyKey,
          session,
        );

        // B. Crear el ticket en la MISMA sesión
        const tickets = await this.ticketModel.create(
          [
            {
              usuarioId,
              eventoId: dto.eventoId,
              eventoResumen: { partido: 'Partido en vivo', liga: 'Liga Pro' },
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

      return nuevoTicket;
    } finally {
      await session.endSession();
    }
  }

  async obtenerHistorial(usuarioId = 'usr-demo') {
    return this.ticketModel
      .find({ usuarioId })
      .sort({ createdAt: -1 })
      .exec();
  }
}
