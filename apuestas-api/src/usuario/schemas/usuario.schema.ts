import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UsuarioDocument = Usuario & Document;

@Schema({ timestamps: true })
export class Usuario {
  @Prop({ required: true, default: 'usr-demo' })
  usuarioId: string;

  @Prop({ required: true, default: 'Apostador Demo' })
  nombre: string;

  @Prop({ required: true, default: 'demo@betpulse.com' })
  email: string;

  @Prop({ required: true, default: 1000.00, min: 0 })
  saldo: number;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);
