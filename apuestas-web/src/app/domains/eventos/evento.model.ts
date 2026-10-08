export type EstadoEvento = 'PROGRAMADO' | 'EN_VIVO' | 'FINALIZADO' | 'CANCELADO';
export type ResultadoGanador = 'LOCAL' | 'EMPATE' | 'VISITANTE' | 'SIN_RESULTADO';
export type OpcionSeleccionada = 'LOCAL' | 'EMPATE' | 'VISITANTE';

export interface CuotasMercado {
  local: number;     // Cuota victoria local (ej: 2.15)
  empate: number;    // Cuota empate (ej: 3.40)
  visitante: number; // Cuota victoria visitante (ej: 2.90)
}

export interface Evento {
  _id: string;                    // MongoDB ObjectId serializado como string
  deporte: string;
  liga: string;
  equipoLocal: string;
  equipoVisitante: string;
  fecha: string;                  // ISO 8601 string
  cuotas: CuotasMercado;
  estado: EstadoEvento;
  resultado: ResultadoGanador;
  marcadorFinal?: string;
}
