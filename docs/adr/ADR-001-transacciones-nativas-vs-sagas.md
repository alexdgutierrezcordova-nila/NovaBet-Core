# ADR-001: Transacciones Nativas de MongoDB vs. Sagas Distribuidas (Módulos 2 y 3)

## Estado
**Aceptado** (2026-10-10)

## Contexto
El sistema NovaBet requiere que la emisión de un boleto de apuesta (Módulo 2 - Carlos) y la deducción de saldo financiero (Módulo 3 - Integrante 3) ocurran con **garantías de consistencia atómica e integridad financiera absoluta**. 

En la versión v1 del contrato, el saldo se debitaba mediante una llamada separada y posterior a la validación, lo cual introducía una ventana crítica de riesgo:
- Si el servidor fallaba o la red se interrumpía tras debitar el saldo pero antes de crear el ticket, el usuario perdía su dinero sin recibir comprobante.
- Si dos peticiones simultáneas alcanzaban el backend con fondos insuficientes, existía riesgo de carreras (race conditions) permitiendo apuestas sin saldo real.

Existían dos caminos arquitectónicos:
1. **Transacciones Distribuidas / Sagas:** Tratar a cada módulo como un microservicio independiente con compensación asíncrona (Transactional Outbox + Message Broker).
2. **Transacciones ACID Nativas:** Mantener una arquitectura de **Monolito Modular** y ejecutar ambas escrituras dentro de una sesión atómica de MongoDB (`session.withTransaction()`).

## Decisión
Se decide implementar **Transacciones ACID nativas de MongoDB** levantando una instancia local con Replica Set (`--replSet rs0`) a través de Docker.

1. **Límite Transaccional:** `ApuestasService` (Módulo 2) abre una `ClientSession` e invoca `BilleteraService.debitarSaldo(..., session)` y `ticketModel.create(..., { session })` dentro de la misma transacción.
2. **Monolito Modular:** El equipo descarta la separación en microservicios para esta fase de validación y desarrollo. Los módulos se organizan como Vertical Slices en el mismo proceso y base de datos.
3. **Libro Mayor (Ledger):** El Módulo 3 registra un movimiento inmutable en la colección `transacciones` dentro de la misma sesión.
4. **Reversiones y VAR (Clawback):** Si un gol es anulado por el VAR tras haberse pagado premios, no se eliminan registros; se inserta una transacción de compensación (débito contable). Si el saldo queda negativo, la cuenta queda marcada como `bloqueada: true`.

## Consecuencias y Trade-offs
### Positivas:
- **Cero inconsistencias financieras:** Imposible cobrar sin emitir ticket o emitir ticket sin cobrar. Rollback automático ante excepciones.
- **Simplicidad operativa:** Sin necesidad de configurar Kafka, RabbitMQ ni lógica compleja de rollback/compensación manual (Sagas).
- **Desarrollo ágil:** El equipo puede probar y depurar en local con Docker sin latencias de red interservicios.

### Costos / Trade-off Asumido:
- **Acoplamiento Transaccional entre M2 y M3:** Los módulos de Apuestas y Billetera comparten el mismo motor de base de datos y sesión transaccional.
- **Deuda Técnica para Microservicios:** Si en el futuro NovaBet supera la fase de validación y se decide separar Apuestas y Billetera en microservicios o bases de datos independientes, **este límite transaccional deberá ser reescrito obligatoriamente implementando el patrón Sagas + Transactional Outbox**. El equipo asume conscientemente este costo en favor de la robustez inmediata del MVP.
