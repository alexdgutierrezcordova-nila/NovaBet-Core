import { OpcionSeleccionada } from '../eventos/evento.model';

export type EstadoTicket = 'PENDIENTE' | 'GANADA' | 'PERDIDA' | 'ANULADA';

export interface TicketApuesta {
  id: string;
  usuarioId: string;
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
