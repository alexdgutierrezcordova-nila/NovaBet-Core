import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BilleteraDocument = Billetera & Document;

@Schema({ timestamps: true })
export class Billetera {
  @Prop({ required: true, unique: true, default: 'usr-demo' })
  usuarioId: string;

  @Prop({ required: true, default: 100000, min: 0 }) // 100,000 centavos = $1,000 USD
  saldoCentavos: number;

  @Prop({ required: true, default: false })
  bloqueada: boolean; // Se bloquea si queda en negativo por un clawback de VAR
}

export const BilleteraSchema = SchemaFactory.createForClass(Billetera);
