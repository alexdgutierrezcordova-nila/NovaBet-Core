export type EstadoMercado = 'ABIERTO' | 'SUSPENDIDO' | 'CERRADO';

export interface Cuotas1X2 {
  local: number;
  empate: number;
  visitante: number;
}

export interface Marcador {
  local: number;
  visitante: number;
}

export interface MercadoActualizadoStream {
  eventoId: string;
  estadoMercado: EstadoMercado;
  cuotas: Cuotas1X2;
  cuotasVersion: number;
  minutoSimulado: number;
  marcador: Marcador;
  emitidoEn: string;
}
