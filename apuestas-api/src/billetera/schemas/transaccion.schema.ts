import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransaccionDocument = Transaccion & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } }) // Append-only inmutable
export class Transaccion {
  @Prop({ type: String, required: true })
  usuarioId: string;

  @Prop({
    type: String,
    required: true,
    enum: ['RECARGA', 'APUESTA', 'PREMIO', 'REEMBOLSO', 'CLAWBACK'],
  })
  tipo: string;

  @Prop({ type: Number, required: true })
  montoCentavos: number; // Positivo para recarga/premio/reembolso, negativo para apuesta/clawback

  @Prop({ type: String, required: false })
  ticketId?: string;

  @Prop({ type: String, required: true, unique: true })
  referenciaIdempotente: string; // Garantiza que una operación no se audite dos veces
}

export const TransaccionSchema = SchemaFactory.createForClass(Transaccion);
TransaccionSchema.index({ usuarioId: 1, createdAt: -1 });
