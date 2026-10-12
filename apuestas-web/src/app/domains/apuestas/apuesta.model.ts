import { OpcionSeleccionada } from '../cuotas/mercado.model';

export type EstadoTicket = 'PENDIENTE' | 'GANADA' | 'PERDIDA' | 'ANULADA';

export interface TicketApuesta {
  _id: string; // MongoDB ObjectId serializado como string
  usuarioId: string; // 'usr-demo'
  eventoId: string;
  eventoResumen: {
    partido: string;
    liga: string;
  };
  seleccion: OpcionSeleccionada;
  cuotaJugada: number;
  cuotasVersion: number; // Versión congelada en el momento de la apuesta
  montoCentavos: number; // Estándar en centavos (ej: 1000 = $10.00 USD)
  gananciaPotencialCentavos: number; // Ganancia estimada en centavos (ej: 1850 = $18.50 USD)
  estado: EstadoTicket;
  idempotencyKey: string; // Clave anti-duplicados del frontend
  createdAt: string; // ISO 8601 nativo
  montoApostado?: number; // Compatibilidad UI en dólares
  gananciaPotencial?: number; // Compatibilidad UI en dólares
  creadoEn?: string; // Compatibilidad UI
  resueltoEn?: string;
}
