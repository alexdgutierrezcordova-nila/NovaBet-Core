import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Representa el tipo de documento Mongoose para el Libro Mayor de Transacciones.
 */
export type TransaccionDocument = Transaccion & Document;

/**
 * Tipos de movimientos contables permitidos en la plataforma.
 */
export type TipoTransaccion = 
  | 'RECARGA'    // Ingreso de dinero a la billetera virtual
  | 'APUESTA'    // Egreso por colocación de un ticket de apuesta
  | 'PREMIO'     // Ingreso por liquidación de apuesta ganadora
  | 'REEMBOLSO'  // Ingreso por anulación de evento deportivo
  | 'CLAWBACK';  // Corrección / reversión de premio por decisión arbitral o VAR

/**
 * @class Transaccion
 * @description Esquema inmutable (Append-Only) del Libro Mayor (Ledger Contable).
 * 
 * DECISIÓN ARQUITECTÓNICA (Libro Mayor Inmutable):
 * Cada movimiento que afecte el saldo de un usuario debe registrarse
 * como un asiento contable independiente e inmodificable.
 * Las transacciones nunca se eliminan ni se actualizan (updatedAt: false).
 * 
 * La propiedad `referenciaIdempotente` garantiza que solicitudes duplicadas
 * (por latencia o reintentos del cliente) no generen dobles cobros o dobles acreditaciones.
 */
@Schema({ 
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'transacciones'
})
export class Transaccion {
  /**
   * Identificador del usuario involucrado en la transacción.
   */
  @Prop({ required: true, index: true })
  usuarioId: string;

  /**
   * Tipo de movimiento contable.
   */
  @Prop({ 
    required: true, 
    enum: ['RECARGA', 'APUESTA', 'PREMIO', 'REEMBOLSO', 'CLAWBACK'] 
  })
  tipo: TipoTransaccion;

  /**
   * Importe del movimiento expresado en centavos enteros.
   * Valores positivos: Entradas de dinero (RECARGA, PREMIO, REEMBOLSO).
   * Valores negativos: Salidas de dinero (APUESTA, CLAWBACK).
   */
  @Prop({ required: true })
  montoCentavos: number;

  /**
   * Identificador del ticket de apuesta vinculado (opcional).
   * Presente cuando el tipo es APUESTA o PREMIO.
   */
  @Prop({ required: false, index: true })
  ticketId?: string;

  /**
   * Identificador del evento deportivo asociado (opcional).
   */
  @Prop({ required: false })
  eventoId?: string;

  /**
   * Clave única de idempotencia generada para la operación.
   * Evita transacciones duplicadas ante fallos transitorios de red.
   */
  @Prop({ required: true, unique: true })
  referenciaIdempotente: string;
}

/**
 * Generación del esquema Mongoose.
 */
export const TransaccionSchema = SchemaFactory.createForClass(Transaccion);

/**
 * Índices compuestos para optimizar consultas de auditoría e historial por usuario y fecha.
 */
TransaccionSchema.index({ usuarioId: 1, createdAt: -1 });
