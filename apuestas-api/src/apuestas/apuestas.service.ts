import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ticket, TicketDocument } from './schemas/ticket.schema.js';
import { Evento, EventoDocument } from '../eventos/schemas/evento.schema.js';
import { UsuarioService } from '../usuario/usuario.service.js';
import { CreateApuestaDto } from './dto/create-apuesta.dto.js';

@Injectable()
export class ApuestasService {
  constructor(
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(Evento.name) private readonly eventoModel: Model<EventoDocument>,
    private readonly usuarioService: UsuarioService
  ) {}

  async crearApuesta(dto: CreateApuestaDto, usuarioId = 'usr-demo'): Promise<Ticket> {
    if (!Types.ObjectId.isValid(dto.eventoId)) {
      throw new BadRequestException('ID de evento inválido');
    }

    const evento = await this.eventoModel.findById(dto.eventoId).exec();
    if (!evento) {
      throw new NotFoundException('El evento no existe');
    }

    if (evento.estado !== 'PROGRAMADO') {
      throw new BadRequestException('El evento ya no está disponible para apuestas');
    }

    // Seleccionar cuota según la opción
    const cuota = dto.seleccion === 'LOCAL' 
      ? evento.cuotas.local 
      : dto.seleccion === 'EMPATE' 
        ? evento.cuotas.empate 
        : evento.cuotas.visitante;

    const gananciaPotencial = Number((dto.monto * cuota).toFixed(2));

    // Debitar saldo del usuario (valida fondos)
    await this.usuarioService.debitarSaldo(usuarioId, dto.monto);

    // Crear y guardar el ticket
    const ticket = new this.ticketModel({
      usuarioId,
      eventoId: evento._id,
      eventoResumen: {
        partido: `${evento.equipoLocal} vs ${evento.equipoVisitante}`,
        liga: evento.liga
      },
      seleccion: dto.seleccion,
      cuotaJugada: cuota,
      montoApostado: dto.monto,
      gananciaPotencial,
      estado: 'PENDIENTE'
    });

    return await ticket.save();
  }

  async listarHistorial(usuarioId = 'usr-demo'): Promise<Ticket[]> {
    return this.ticketModel.find({ usuarioId }).sort({ createdAt: -1 }).exec();
  }

  async liquidarTicketsDeEvento(eventoId: string, resultadoGanador: string) {
    const tickets = await this.ticketModel.find({ 
      eventoId: new Types.ObjectId(eventoId), 
      estado: 'PENDIENTE' 
    }).exec();

    for (const ticket of tickets) {
      if (ticket.seleccion === resultadoGanador) {
        ticket.estado = 'GANADA';
        await this.usuarioService.acreditarSaldo(ticket.usuarioId, ticket.gananciaPotencial);
      } else {
        ticket.estado = 'PERDIDA';
      }
      ticket.resueltoEn = new Date();
      await ticket.save();
    }
  }
}
