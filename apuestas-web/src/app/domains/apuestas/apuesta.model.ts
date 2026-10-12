import { OpcionSeleccionada } from '../eventos/evento.model';

export type EstadoTicket = 'PENDIENTE' | 'GANADA' | 'PERDIDA' | 'ANULADA';

export interface TicketApuesta {
  _id: string;                    // MongoDB ObjectId serializado como string
  usuarioId: string;              // 'usr-demo'
  eventoId: string;
  eventoResumen: {
    partido: string;
    liga: string;
  };
  seleccion: OpcionSeleccionada;
  cuotaJugada: number;
  cuotasVersion?: number;
  montoCentavos?: number;         // Estándar v2 en centavos (ej: 1000 = $10.00 USD)
  montoApostado?: number;         // Compatibilidad v1 en dólares
  gananciaPotencialCentavos?: number;
  gananciaPotencial?: number;
  estado: EstadoTicket;
  idempotencyKey?: string;
  createdAt?: string;
  creadoEn?: string;
  resueltoEn?: string;
}
