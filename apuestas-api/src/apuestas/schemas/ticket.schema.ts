import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TicketDocument = Ticket & Document;

@Schema({ _id: false })
export class EventoResumen {
  @Prop({ type: String, required: true })
  partido: string;

  @Prop({ type: String, required: true })
  liga: string;
}

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ type: String, required: true, default: 'usr-demo' })
  usuarioId: string;

  @Prop({ type: Types.ObjectId, ref: 'Evento', required: true })
  eventoId: Types.ObjectId;

  @Prop({ type: EventoResumen, required: true })
  eventoResumen: EventoResumen;

  @Prop({ type: String, required: true, enum: ['LOCAL', 'EMPATE', 'VISITANTE'] })
  seleccion: 'LOCAL' | 'EMPATE' | 'VISITANTE';

  @Prop({ type: Number, required: true, min: 1.01 })
  cuotaJugada: number;

  @Prop({ type: Number, required: true })
  cuotasVersion: number;

  @Prop({ type: Number, required: true, min: 100 }) // Mínimo 100 centavos ($1.00 USD)
  montoCentavos: number;

  @Prop({ type: Number, required: true })
  gananciaPotencialCentavos: number;

  @Prop({
    type: String,
    required: true,
    enum: ['PENDIENTE', 'GANADA', 'PERDIDA', 'ANULADA'],
    default: 'PENDIENTE',
  })
  estado: string;

  @Prop({ type: String, required: true })
  idempotencyKey: string;

  @Prop({ type: Date, required: false })
  resueltoEn?: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

// Índices indispensables:
TicketSchema.index({ usuarioId: 1, idempotencyKey: 1 }, { unique: true });
TicketSchema.index({ eventoId: 1, estado: 1 });
TicketSchema.index({ usuarioId: 1, createdAt: -1 });
