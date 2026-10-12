/**
 * mongo-rs-init.js
 * 
 * Este script se ejecuta automáticamente dentro del contenedor de MongoDB
 * la primera vez que arranca (mediante docker-entrypoint-initdb.d).
 * 
 * Inicializa el Replica Set "rs0" de un solo nodo, requisito obligatorio
 * para que session.withTransaction() (Transacciones ACID) funcione.
 * Ver ADR-001 y RNF06.
 */

// Esperar a que mongod esté listo antes de inicializar
sleep(2000);

try {
  rs.initiate({
    _id: 'rs0',
    members: [
      { _id: 0, host: 'localhost:27017', priority: 1 }
    ]
  });
  print('✅ [RS Init]: Replica Set rs0 iniciado correctamente.');
} catch (e) {
  // Si ya estaba iniciado (reinicio del contenedor), ignorar el error
  if (e.codeName !== 'AlreadyInitialized') {
    throw e;
  }
  print('ℹ️  [RS Init]: Replica Set rs0 ya estaba iniciado. Continuando...');
}
