import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MercadoDocument = Mercado & Document;

@Schema({ _id: false })
export class Cuotas1X2Schema {
  @Prop({ type: Number, required: true, min: 1.01 })
  local: number;

  @Prop({ type: Number, required: true, min: 1.01 })
  empate: number;

  @Prop({ type: Number, required: true, min: 1.01 })
  visitante: number;
}

@Schema({ timestamps: true })
export class Mercado {
  @Prop({ type: Types.ObjectId, ref: 'Evento', required: true, unique: true })
  eventoId: Types.ObjectId;

  @Prop({ type: String, required: true, default: '1X2' })
  tipo: string;

  @Prop({
    type: String,
    required: true,
    enum: ['ABIERTO', 'SUSPENDIDO', 'CERRADO'],
    default: 'ABIERTO',
  })
  estadoMercado: string;

  @Prop({ type: Cuotas1X2Schema, required: true })
  cuotas: Cuotas1X2Schema;

  @Prop({ type: Number, required: true, default: 1 })
  cuotasVersion: number;

  @Prop({ type: Number, required: true, default: 0.06 }) // Overround (margen de la casa, ej: 6%)
  margen: number;
}

export const MercadoSchema = SchemaFactory.createForClass(Mercado);
