import { Marcador } from '../eventos/evento.model';

export type EstadoMercado = 'ABIERTO' | 'SUSPENDIDO' | 'CERRADO';
export type OpcionSeleccionada = 'LOCAL' | 'EMPATE' | 'VISITANTE';

export interface Cuotas1X2 {
  local: number;     // Decimal redondeado a 2 decimales (ej: 1.85)
  empate: number;    // ej: 3.40
  visitante: number; // ej: 4.20
}

export interface Mercado {
  _id: string;
  eventoId: string;
  tipo: '1X2';
  estadoMercado: EstadoMercado;
  cuotas: Cuotas1X2;
  cuotasVersion: number;          // Contador incremental con cada cambio de cuota
  actualizadoEn: string;
}

// Payload emitido por Server-Sent Events (SSE) hacia Angular:
export interface MercadoActualizadoStream {
  eventoId: string;
  estadoMercado: EstadoMercado;
  cuotas: Cuotas1X2;
  cuotasVersion: number;
  minutoSimulado: number;
  marcador: Marcador;
  emitidoEn: string;
}
