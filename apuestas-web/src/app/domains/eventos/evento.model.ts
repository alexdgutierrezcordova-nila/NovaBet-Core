export type EstadoEvento = 'PROGRAMADO' | 'EN_VIVO' | 'FINALIZADO' | 'CANCELADO';
export type ResultadoGanador = 'LOCAL' | 'EMPATE' | 'VISITANTE' | 'SIN_RESULTADO';
export type OpcionSeleccionada = 'LOCAL' | 'EMPATE' | 'VISITANTE';

export interface CuotasMercado {
  local: number;     // Cuota victoria local (ej: 1.85)
  empate: number;    // Cuota empate (ej: 3.40)
  visitante: number; // Cuota victoria visitante (ej: 4.20)
}

export interface Evento {
  id: string;
  deporte: string;
  liga: string;
  equipoLocal: string;
  equipoVisitante: string;
  fecha: string;                  // ISO 8601
  cuotas: CuotasMercado;
  estado: EstadoEvento;
  resultado: ResultadoGanador;
  marcadorFinal?: string;
}
