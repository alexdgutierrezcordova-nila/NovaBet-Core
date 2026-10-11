/**
 * Tipos de movimientos contables permitidos en la plataforma.
 * Coincide estrictamente con el contrato del backend.
 */
export type TipoTransaccion = 
  | 'RECARGA'    // Depósito o abono de saldo
  | 'APUESTA'    // Egreso por colocación de boleto
  | 'PREMIO'     // Acreditación de ganancias por boleto acertado
  | 'REEMBOLSO'  // Devolución por evento suspendido o anulado
  | 'CLAWBACK';  // Reversión administrativa o corrección por VAR

/**
 * @interface Billetera
 * @description Modelo de la billetera virtual del usuario.
 * 
 * REGLA ARQUITECTÓNICA (Zero-Floats):
 * `saldoCentavos` representa el balance disponible exclusivamente en CENTAVOS ENTEROS.
 * Para presentar al usuario en la interfaz, se debe dividir entre 100:
 * `const saldoEnDolares = billetera.saldoCentavos / 100;`
 * 
 * Ejemplo: 100,000 centavos = $1,000.00 USD.
 */
export interface Billetera {
  /** Identificador único del documento en MongoDB */
  _id: string;

  /** Identificador de usuario propietario ('usr-demo') */
  usuarioId: string;

  /** Balance disponible en centavos enteros */
  saldoCentavos: number;

  /** Indica si la cuenta fue congelada preventivamente tras un clawback */
  bloqueada: boolean;

  /** Marcas temporales generadas por el servidor */
  createdAt?: string;
  updatedAt?: string;
}

/**
 * @interface TransaccionLedger
 * @description Asiento contable individual del Libro Mayor (Ledger).
 * Representa un movimiento financiero inmutable para auditoría.
 */
export interface TransaccionLedger {
  /** Identificador único del movimiento en MongoDB */
  _id: string;

  /** Usuario al que corresponde el movimiento */
  usuarioId: string;

  /** Categoría del movimiento contable */
  tipo: TipoTransaccion;

  /**
   * Importe del movimiento en centavos enteros:
   * Positivo: Ingreso (RECARGA, PREMIO, REEMBOLSO)
   * Negativo: Egreso (APUESTA, CLAWBACK)
   */
  montoCentavos: number;

  /** ID del ticket asociado si la transacción proviene de una apuesta o premio */
  ticketId?: string;

  /** ID del evento deportivo asociado (opcional) */
  eventoId?: string;

  /** Clave única de idempotencia para garantizar auditoría sin duplicados */
  referenciaIdempotente: string;

  /** Fecha de creación en formato ISO 8601 */
  createdAt: string;
}
