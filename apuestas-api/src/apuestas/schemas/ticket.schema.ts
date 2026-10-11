import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TicketDocument = Ticket & Document;

@Schema({ _id: false })
export class EventoResumen {
  @Prop({ required: true })
  partido: string;

  @Prop({ required: true })
  liga: string;
}

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ required: true, default: 'usr-demo' })
  usuarioId: string;

  @Prop({ type: Types.ObjectId, ref: 'Evento', required: true })
  eventoId: Types.ObjectId;

  @Prop({ type: EventoResumen, required: true })
  eventoResumen: EventoResumen;

  @Prop({ required: true, enum: ['LOCAL', 'EMPATE', 'VISITANTE'] })
  seleccion: 'LOCAL' | 'EMPATE' | 'VISITANTE';

  @Prop({ required: true, min: 1.01 })
  cuotaJugada: number;

  @Prop({ required: true })
  cuotasVersion: number;

  @Prop({ required: true, min: 100 }) // Mínimo 100 centavos ($1.00 USD)
  montoCentavos: number;

  @Prop({ required: true })
  gananciaPotencialCentavos: number;

  @Prop({
    required: true,
    enum: ['PENDIENTE', 'GANADA', 'PERDIDA', 'ANULADA'],
    default: 'PENDIENTE',
  })
  estado: string;

  @Prop({ required: true })
  idempotencyKey: string;

  @Prop({ required: false })
  resueltoEn?: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

// Índices indispensables:
TicketSchema.index({ usuarioId: 1, idempotencyKey: 1 }, { unique: true });
TicketSchema.index({ eventoId: 1, estado: 1 });
TicketSchema.index({ usuarioId: 1, createdAt: -1 });
