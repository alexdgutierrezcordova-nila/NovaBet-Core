import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventoDocument = Evento & Document;

@Schema({ _id: false })
export class CuotasMercado {
  @Prop({ required: true, min: 1.01 })
  local: number;

  @Prop({ required: true, min: 1.01 })
  empate: number;

  @Prop({ required: true, min: 1.01 })
  visitante: number;
}

@Schema({ timestamps: true })
export class Evento {
  @Prop({ required: true, default: 'Fútbol' })
  deporte: string;

  @Prop({ required: true })
  liga: string;

  @Prop({ required: true })
  equipoLocal: string;

  @Prop({ required: true })
  equipoVisitante: string;

  @Prop({ required: true })
  fecha: Date;

  @Prop({ type: CuotasMercado, required: true })
  cuotas: CuotasMercado;

  @Prop({ 
    required: true, 
    enum: ['PROGRAMADO', 'EN_VIVO', 'FINALIZADO', 'CANCELADO'], 
    default: 'PROGRAMADO' 
  })
  estado: string;

  @Prop({ 
    required: true, 
    enum: ['LOCAL', 'EMPATE', 'VISITANTE', 'SIN_RESULTADO'], 
    default: 'SIN_RESULTADO' 
  })
  resultado: string;

  @Prop({ required: false, default: '' })
  marcadorFinal?: string;
}

export const EventoSchema = SchemaFactory.createForClass(Evento);
