import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TicketDocument = Ticket & Document;

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ required: true })
  usuarioId: string;

  @Prop({ type: Types.ObjectId, ref: 'Evento', required: true })
  eventoId: Types.ObjectId;

  @Prop({ type: Object, required: true })
  eventoResumen: {
    partido: string;
    liga: string;
  };

  @Prop({ required: true, enum: ['LOCAL', 'EMPATE', 'VISITANTE'] })
  seleccion: 'LOCAL' | 'EMPATE' | 'VISITANTE';

  @Prop({ required: true, min: 1.01 })
  cuotaJugada: number;

  @Prop({ required: true, min: 1 })
  montoApostado: number;

  @Prop({ required: true })
  gananciaPotencial: number;

  @Prop({ 
    required: true, 
    enum: ['PENDIENTE', 'GANADA', 'PERDIDA', 'ANULADA'], 
    default: 'PENDIENTE' 
  })
  estado: string;

  @Prop({ required: false })
  resueltoEn?: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
