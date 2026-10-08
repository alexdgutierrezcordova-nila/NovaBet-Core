export const EVENTOS_INICIALES = [
  {
    deporte: 'Fútbol',
    liga: 'UEFA Champions League',
    equipoLocal: 'Real Madrid',
    equipoVisitante: 'Manchester City',
    fecha: new Date(Date.now() + 86400000 * 2),
    cuotas: { local: 2.15, empate: 3.40, visitante: 2.90 },
    estado: 'PROGRAMADO',
    resultado: 'SIN_RESULTADO'
  },
  {
    deporte: 'Fútbol',
    liga: 'UEFA Champions League',
    equipoLocal: 'Bayern Múnich',
    equipoVisitante: 'Arsenal',
    fecha: new Date(Date.now() + 86400000 * 3),
    cuotas: { local: 1.95, empate: 3.50, visitante: 3.60 },
    estado: 'PROGRAMADO',
    resultado: 'SIN_RESULTADO'
  },
  {
    deporte: 'Fútbol',
    liga: 'Premier League',
    equipoLocal: 'Liverpool',
    equipoVisitante: 'Chelsea',
    fecha: new Date(Date.now() + 86400000),
    cuotas: { local: 1.65, empate: 3.90, visitante: 4.80 },
    estado: 'PROGRAMADO',
    resultado: 'SIN_RESULTADO'
  },
  {
    deporte: 'Fútbol',
    liga: 'LaLiga EA Sports',
    equipoLocal: 'FC Barcelona',
    equipoVisitante: 'Atlético de Madrid',
    fecha: new Date(Date.now() + 86400000 * 4),
    cuotas: { local: 1.80, empate: 3.60, visitante: 4.10 },
    estado: 'PROGRAMADO',
    resultado: 'SIN_RESULTADO'
  }
];
