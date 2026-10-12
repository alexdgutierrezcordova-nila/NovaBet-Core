export type EstadoEvento =
  | 'PRE-MATCH'
  | 'LIVE'
  | 'INTERRUMPIDO'
  | 'FINALIZADO'
  | 'EN_REVISION'
  | 'CANCELADO';

export type ResultadoGanador = 'LOCAL' | 'EMPATE' | 'VISITANTE' | 'SIN_RESULTADO';

export interface Marcador {
  local: number;
  visitante: number;
}

export interface Evento {
  _id: string;
  deporte: string;
  liga: string;
  equipoLocal: string;
  equipoVisitante: string;
  fechaProgramada: string;        // ISO 8601
  inicioReal?: string;            // ISO 8601 (cuando pasa a LIVE)
  estado: EstadoEvento;
  marcador: Marcador;
  resultado: ResultadoGanador;
  createdAt?: string;
  updatedAt?: string;
}
