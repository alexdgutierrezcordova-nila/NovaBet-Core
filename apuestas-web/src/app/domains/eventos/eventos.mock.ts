import { Evento } from './evento.model';

export const EVENTOS_MOCK: Evento[] = [
  {
    id: 'evt-1',
    deporte: 'Fútbol',
    liga: 'UEFA Champions League',
    equipoLocal: 'Real Madrid',
    equipoVisitante: 'Manchester City',
    fecha: '2026-10-15T19:00:00Z',
    cuotas: { local: 2.15, empate: 3.40, visitante: 2.90 },
    estado: 'PROGRAMADO',
    resultado: 'SIN_RESULTADO'
  },
  {
    id: 'evt-2',
    deporte: 'Fútbol',
    liga: 'UEFA Champions League',
    equipoLocal: 'Bayern Múnich',
    equipoVisitante: 'Arsenal',
    fecha: '2026-10-16T19:00:00Z',
    cuotas: { local: 1.95, empate: 3.50, visitante: 3.60 },
    estado: 'PROGRAMADO',
    resultado: 'SIN_RESULTADO'
  },
  {
    id: 'evt-3',
    deporte: 'Fútbol',
    liga: 'Premier League',
    equipoLocal: 'Liverpool',
    equipoVisitante: 'Chelsea',
    fecha: '2026-10-17T16:30:00Z',
    cuotas: { local: 1.65, empate: 3.90, visitante: 4.80 },
    estado: 'PROGRAMADO',
    resultado: 'SIN_RESULTADO'
  },
  {
    id: 'evt-4',
    deporte: 'Fútbol',
    liga: 'LaLiga EA Sports',
    equipoLocal: 'FC Barcelona',
    equipoVisitante: 'Atlético de Madrid',
    fecha: '2026-10-18T20:00:00Z',
    cuotas: { local: 1.80, empate: 3.60, visitante: 4.10 },
    estado: 'PROGRAMADO',
    resultado: 'SIN_RESULTADO'
  },
  {
    id: 'evt-5',
    deporte: 'Fútbol',
    liga: 'Serie A',
    equipoLocal: 'Inter de Milán',
    equipoVisitante: 'Juventus',
    fecha: '2026-10-19T18:45:00Z',
    cuotas: { local: 2.05, empate: 3.25, visitante: 3.50 },
    estado: 'PROGRAMADO',
    resultado: 'SIN_RESULTADO'
  }
];
