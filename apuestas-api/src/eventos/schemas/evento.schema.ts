import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventoDocument = Evento & Document;

@Schema({ _id: false })
export class MarcadorSchema {
  @Prop({ type: Number, required: true, default: 0 })
  local: number;

  @Prop({ type: Number, required: true, default: 0 })
  visitante: number;
}

@Schema({ timestamps: true, optimisticConcurrency: true })
export class Evento {
  @Prop({ type: String, required: true, default: 'Fútbol' })
  deporte: string;

  @Prop({ type: String, required: true })
  liga: string;

  @Prop({ type: String, required: true })
  equipoLocal: string;

  @Prop({ type: String, required: true })
  equipoVisitante: string;

  // Parámetros de fuerza base para el motor Poisson In-Play
  @Prop({ type: Number, required: true, default: 1.25 })
  fuerzaAtaqueLocal: number;

  @Prop({ type: Number, required: true, default: 0.95 })
  fuerzaDefensaLocal: number;

  @Prop({ type: Number, required: true, default: 1.20 })
  fuerzaAtaqueVisitante: number;

  @Prop({ type: Number, required: true, default: 0.90 })
  fuerzaDefensaVisitante: number;

  @Prop({ type: Date, required: true })
  fechaProgramada: Date;

  @Prop({ type: Date, required: false })
  inicioReal?: Date;

  @Prop({
    type: String,
    required: true,
    enum: ['PRE-MATCH', 'LIVE', 'INTERRUMPIDO', 'FINALIZADO', 'EN_REVISION', 'CANCELADO'],
    default: 'PRE-MATCH',
  })
  estado: string;

  @Prop({ type: MarcadorSchema, default: () => ({ local: 0, visitante: 0 }) })
  marcador: MarcadorSchema;

  @Prop({
    type: String,
    required: true,
    enum: ['LOCAL', 'EMPATE', 'VISITANTE', 'SIN_RESULTADO'],
    default: 'SIN_RESULTADO',
  })
  resultado: string;

  @Prop({ type: String, required: false })
  marcadorFinal?: string;
}

export const EventoSchema = SchemaFactory.createForClass(Evento);

// Índice compuesto para acelerar consultas de cartelera por estado y fecha
EventoSchema.index({ estado: 1, fechaProgramada: 1 });
