import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BilleteraDocument = Billetera & Document;

@Schema({ timestamps: true })
export class Billetera {
  @Prop({ type: String, required: true, unique: true, default: 'usr-demo' })
  usuarioId: string;

  @Prop({ type: Number, required: true, default: 100000, min: 0 }) // 100,000 centavos = $1,000 USD
  saldoCentavos: number;

  @Prop({ type: Boolean, required: true, default: false })
  bloqueada: boolean; // Se bloquea si queda en negativo por un clawback de VAR
}

export const BilleteraSchema = SchemaFactory.createForClass(Billetera);
