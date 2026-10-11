import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Representa el tipo de documento Mongoose para la entidad Billetera.
 */
export type BilleteraDocument = Billetera & Document;

/**
 * @class Billetera
 * @description Esquema de persistencia para la billetera virtual del usuario.
 * 
 * DECISIÓN ARQUITECTÓNICA (Zero-Floats):
 * Todos los saldos financieros se almacenan en CENTAVOS ENTEROS (int).
 * Se prohíbe el uso de tipos de coma flotante (float/double) para evitar
 * errores de redondeo inherentes al estándar IEEE 754 de JavaScript.
 * Ejemplo: 100,000 centavos = $1,000.00 USD.
 */
@Schema({ 
  timestamps: true,
  collection: 'billeteras'
})
export class Billetera {
  /**
   * Identificador único de usuario propietario de la billetera.
   * En este MVP se asigna el usuario por defecto 'usr-demo'.
   */
  @Prop({ required: true, unique: true, default: 'usr-demo' })
  usuarioId: string;

  /**
   * Saldo disponible en centavos enteros.
   * Valor inicial por defecto: 100,000 centavos ($1,000.00 USD).
   * Restricción min: 0 asegura que ninguna operación normal permita saldo negativo.
   */
  @Prop({ required: true, default: 100000, min: 0 })
  saldoCentavos: number;

  /**
   * Bandera de bloqueo preventivo de cuenta.
   * Se marca en `true` si una reversión por VAR (clawback) deja el saldo
   * en negativo, requiriendo revisión administrativa antes de nuevas apuestas.
   */
  @Prop({ required: true, default: false })
  bloqueada: boolean;
}

/**
 * Generación del esquema Mongoose a partir de la clase decorada.
 */
export const BilleteraSchema = SchemaFactory.createForClass(Billetera);
