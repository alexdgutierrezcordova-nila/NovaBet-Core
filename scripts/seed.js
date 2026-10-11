/**
 * seed.js — Semilla inicial de NovaBet (Módulo 2 — Carlos)
 * 
 * Inserta los documentos mínimos necesarios para que los endpoints del
 * Módulo 2 (POST /api/apuestas y GET /api/apuestas/historial) funcionen
 * de extremo a extremo sin depender de los otros módulos.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  Los Integrantes 1 y 3 extenderán estas seeds con sus propios datos │
 * │  cuando hagan merge de sus ramas. Esta seed es de respaldo (Módulo 2)│
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Cómo ejecutar manualmente (fuera de Docker):
 *   mongosh mongodb://localhost:27017/novabet scripts/seed.js
 *
 * En Docker Compose el servicio "seed" lo ejecuta automáticamente.
 */

'use strict';

const db = db.getSiblingDB('novabet');

print('\n🌱 [NovaBet Seed] Iniciando siembra de datos...\n');

// ══════════════════════════════════════════════════════════════════════════
// 1. BILLETERA DEMO (Módulo 3 — necesaria para debitar saldo en apuestas)
// ══════════════════════════════════════════════════════════════════════════
const billetera = db.billeteras.findOne({ usuarioId: 'usr-demo' });
if (!billetera) {
  db.billeteras.insertOne({
    usuarioId:      'usr-demo',
    saldoCentavos:  100000,   // $1,000.00 USD inicial
    bloqueada:      false,
    createdAt:      new Date(),
    updatedAt:      new Date(),
  });
  print('  ✅ Billetera demo creada con $1,000.00 USD (100,000 centavos)');
} else {
  print('  ℹ️  Billetera demo ya existe. Saldo actual: ' + billetera.saldoCentavos + ' centavos');
}

// ══════════════════════════════════════════════════════════════════════════
// 2. EVENTOS DE PRUEBA (normalmente son del Módulo 1 — Integrante 1)
//    Seed de respaldo para el Módulo 2 mientras el Integrante 1 hace merge
// ══════════════════════════════════════════════════════════════════════════
const eventosExistentes = db.eventos.countDocuments();
if (eventosExistentes === 0) {
  const eventosDemo = [
    {
      _id:              new ObjectId('670800000000000000000001'),
      deporte:          'Fútbol',
      liga:             'UEFA Champions League',
      equipoLocal:      'Real Madrid',
      equipoVisitante:  'Manchester City',
      fechaProgramada:  new Date(Date.now() + 1 * 60 * 60 * 1000), // en 1 hora
      estado:           'LIVE',
      marcador:         { local: 1, visitante: 1 },
      resultado:        'SIN_RESULTADO',
      fuerzaAtaqueLocal:       1.45,
      fuerzaDefensaVisitante:  0.82,
      createdAt:        new Date(),
      updatedAt:        new Date(),
    },
    {
      _id:              new ObjectId('670800000000000000000002'),
      deporte:          'Fútbol',
      liga:             'La Liga EA Sports',
      equipoLocal:      'Barcelona',
      equipoVisitante:  'Atlético de Madrid',
      fechaProgramada:  new Date(Date.now() + 2 * 60 * 60 * 1000), // en 2 horas
      estado:           'PRE-MATCH',
      marcador:         { local: 0, visitante: 0 },
      resultado:        'SIN_RESULTADO',
      fuerzaAtaqueLocal:       1.38,
      fuerzaDefensaVisitante:  0.91,
      createdAt:        new Date(),
      updatedAt:        new Date(),
    },
    {
      _id:              new ObjectId('670800000000000000000003'),
      deporte:          'Fútbol',
      liga:             'Premier League',
      equipoLocal:      'Liverpool',
      equipoVisitante:  'Arsenal',
      fechaProgramada:  new Date(Date.now() + 3 * 60 * 60 * 1000), // en 3 horas
      estado:           'PRE-MATCH',
      marcador:         { local: 0, visitante: 0 },
      resultado:        'SIN_RESULTADO',
      fuerzaAtaqueLocal:       1.52,
      fuerzaDefensaVisitante:  0.78,
      createdAt:        new Date(),
      updatedAt:        new Date(),
    },
    {
      _id:              new ObjectId('670800000000000000000004'),
      deporte:          'Fútbol',
      liga:             'Serie A TIM',
      equipoLocal:      'Inter de Milán',
      equipoVisitante:  'AC Milan',
      fechaProgramada:  new Date(Date.now() + 4 * 60 * 60 * 1000), // en 4 horas
      estado:           'PRE-MATCH',
      marcador:         { local: 0, visitante: 0 },
      resultado:        'SIN_RESULTADO',
      fuerzaAtaqueLocal:       1.30,
      fuerzaDefensaVisitante:  0.96,
      createdAt:        new Date(),
      updatedAt:        new Date(),
    },
  ];

  db.eventos.insertMany(eventosDemo);
  print('  ✅ Insertados ' + eventosDemo.length + ' eventos de prueba');
} else {
  print('  ℹ️  Colección "eventos" ya tiene ' + eventosExistentes + ' documento(s). Se omite seed.');
}

// ══════════════════════════════════════════════════════════════════════════
// 3. MERCADOS (cuotas 1X2 para cada evento)
//    Un mercado por evento: cuotas iniciales razonables, estado ABIERTO,
//    cuotasVersion = 1 para que el front pueda enviar sus primeras apuestas.
// ══════════════════════════════════════════════════════════════════════════
const mercadosExistentes = db.mercados.countDocuments();
if (mercadosExistentes === 0) {
  const mercadosDemo = [
    {
      eventoId:     new ObjectId('670800000000000000000001'), // Real Madrid vs Man City
      tipo:         '1X2',
      estadoMercado: 'ABIERTO',
      cuotas:       { local: 2.10, empate: 3.40, visitante: 3.25 },
      cuotasVersion: 1,
      margen:       0.06,
      createdAt:    new Date(),
      updatedAt:    new Date(),
    },
    {
      eventoId:     new ObjectId('670800000000000000000002'), // Barcelona vs Atlético
      tipo:         '1X2',
      estadoMercado: 'ABIERTO',
      cuotas:       { local: 1.95, empate: 3.60, visitante: 4.10 },
      cuotasVersion: 1,
      margen:       0.06,
      createdAt:    new Date(),
      updatedAt:    new Date(),
    },
    {
      eventoId:     new ObjectId('670800000000000000000003'), // Liverpool vs Arsenal
      tipo:         '1X2',
      estadoMercado: 'ABIERTO',
      cuotas:       { local: 2.25, empate: 3.20, visitante: 3.05 },
      cuotasVersion: 1,
      margen:       0.06,
      createdAt:    new Date(),
      updatedAt:    new Date(),
    },
    {
      eventoId:     new ObjectId('670800000000000000000004'), // Inter vs AC Milan
      tipo:         '1X2',
      estadoMercado: 'ABIERTO',
      cuotas:       { local: 2.45, empate: 3.30, visitante: 2.80 },
      cuotasVersion: 1,
      margen:       0.06,
      createdAt:    new Date(),
      updatedAt:    new Date(),
    },
  ];

  db.mercados.insertMany(mercadosDemo);
  print('  ✅ Insertados ' + mercadosDemo.length + ' mercados de prueba');
} else {
  print('  ℹ️  Colección "mercados" ya tiene ' + mercadosExistentes + ' documento(s). Se omite seed.');
}

// ══════════════════════════════════════════════════════════════════════════
// 4. ÍNDICES — Garantizan que los índices de producción estén presentes
//    incluso cuando la API todavía no los aplicó (ej: primer arranque)
// ══════════════════════════════════════════════════════════════════════════
db.tickets.createIndex(
  { usuarioId: 1, idempotencyKey: 1 },
  { unique: true, name: 'idx_ticket_idempotencia' }
);
db.tickets.createIndex({ eventoId: 1, estado: 1 }, { name: 'idx_ticket_evento_estado' });
db.tickets.createIndex({ usuarioId: 1, createdAt: -1 }, { name: 'idx_ticket_historial' });
db.transacciones.createIndex({ usuarioId: 1, createdAt: -1 }, { name: 'idx_transaccion_historial' });
db.eventos.createIndex({ estado: 1, fechaProgramada: 1 }, { name: 'idx_evento_cartelera' });

print('\n📦 Índices verificados/creados.\n');

// ══════════════════════════════════════════════════════════════════════════
// 5. RESUMEN FINAL
// ══════════════════════════════════════════════════════════════════════════
print('═══════════════════════════════════════════════════════');
print('  📊 Estado final de la base de datos "novabet":');
print('     billeteras:   ' + db.billeteras.countDocuments());
print('     eventos:      ' + db.eventos.countDocuments());
print('     mercados:     ' + db.mercados.countDocuments());
print('     tickets:      ' + db.tickets.countDocuments());
print('     transacciones:' + db.transacciones.countDocuments());
print('═══════════════════════════════════════════════════════');
print('\n🌱 [NovaBet Seed] Siembra completada exitosamente.\n');
