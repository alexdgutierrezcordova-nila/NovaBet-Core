import { OpcionSeleccionada } from '../eventos/evento.model';

export type EstadoTicket = 'PENDIENTE' | 'GANADA' | 'PERDIDA' | 'ANULADA';

export interface TicketApuesta {
  _id: string;                    // MongoDB ObjectId serializado como string
  usuarioId: string;              // Siempre 'usr-demo' para este MVP
  eventoId: string;
  eventoResumen: {
    partido: string;
    liga: string;
  };
  seleccion: OpcionSeleccionada;
  cuotaJugada: number;
  montoApostado: number;
  gananciaPotencial: number;
  estado: EstadoTicket;
  creadoEn: string;
  resueltoEn?: string;
}
