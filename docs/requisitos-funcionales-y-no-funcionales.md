# 📋 Especificación de Requisitos del Sistema — NovaBet v2

## 1. Tabla de Requisitos Funcionales (RF)

| Código | Requisito | Módulo / Responsable | Descripción | Criterio de Aceptación | Prioridad |
|---|---|---|---|---|:---:|
| **RF01** | Catálogo de Eventos y Mercados In-Play | **Módulo 1**<br/>(Integrante 1) | Almacenar y listar partidos y sus mercados de cuotas 1X2 en colecciones desacopladas (`eventos` y `mercados`). | Se visualizan al menos 4 partidos activos con sus cuotas y estados (`PRE-MATCH`, `LIVE`, etc.) al cargar la aplicación. | Alta |
| **RF02** | Motor de Simulación y Resultados | **Módulo 1**<br/>(Integrante 1) | Registrar goles, actualización de marcadores, estados de suspensión por VAR y resultado final del partido. | El cambio de estado a `FINALIZADO` emite evento de dominio que dispara la liquidación de boletos. | Alta |
| **RF03** | Stream de Cuotas en Tiempo Real | **Módulo 1**<br/>(Integrante 1) | Exponer un stream Server-Sent Events (SSE) `GET /api/cuotas/stream` que empuje variaciones de cuota, versión y suspensiones de mercado. | El frontend recibe actualizaciones continuas sin necesidad de polling HTTP continuo. | Alta |
| **RF04** | Cálculo Reactivo del Cupón | **Módulo 2**<br/>(Carlos) | Calcular en tiempo real la ganancia potencial multiplicando el monto en centavos por la cuota seleccionada. | La ganancia potencial se actualiza en $< 50\text{ ms}$ en el cupón mediante Angular Signals. | Alta |
| **RF05** | Emisión Transaccional de Tickets (ACID) | **Módulo 2**<br/>(Carlos) | Validar fondos, verificar versión de cuota (`cuotasVersion`), comprobar no-suspensión del mercado y registrar el ticket en una transacción atómica. | Si hay saldo y la cuota coincide, se emite el ticket con `idempotencyKey`. Si la cuota cambió, responde `HTTP 409`. Si está suspendido, responde `HTTP 423`. | Alta |
| **RF06** | Monedero Virtual en Centavos Enteros | **Módulo 3**<br/>(Integrante 3) | Gestionar cuenta demo (`usr-demo`) con saldo en centavos (100,000 centavos = \$1,000.00 USD inicial) y botón de recarga rápida (+50,000 centavos). | El saldo se almacena como número entero (`int`) para evitar errores de redondeo financiero. | Alta |
| **RF07** | Libro Mayor Contable (Ledger) | **Módulo 3**<br/>(Integrante 3) | Registrar de forma append-only cada movimiento de dinero (recargas, apuestas, premios, reembolsos o clawbacks de VAR). | Cada movimiento tiene `referenciaIdempotente` única; la suma de transacciones audita el balance actual. | Alta |
| **RF08** | Historial y Estados de Apuestas | **Módulo 3**<br/>(Integrante 3) | Renderizar el listado de tickets apostados indicando partido, selección, monto, ganancia y estado visual con fecha nativa (`createdAt`). | Cada ticket muestra su badge de color según su estado: `PENDIENTE` (amarillo), `GANADA` (verde), `PERDIDA` (rojo) o `ANULADA` (gris). | Media |

---

## 2. Tabla de Requisitos No Funcionales (RNF)

| Código | Categoría | Descripción | Métrica / Criterio de Cumplimiento |
|---|---|---|---|
| **RNF01** | **Integridad Financiera (ACID)** | Atomicidad absoluta entre la deducción de saldo y la creación del boleto de apuesta. | Transacciones ACID nativas de MongoDB entre M2 y M3 mediante `session.withTransaction()`. Imposible crear ticket sin cobro o cobrar sin generar ticket. |
| **RNF02** | **Moneda Entera (Zero-Floats)** | Erradicación total de números de coma flotante en persistencia de dinero. | Todos los saldos, montos y ganancias se calculan y persisten en **centavos enteros (`int`)**; la UI es la única responsable de formatear a dólares (`centavos / 100`). |
| **RNF03** | **Control de Concurrencia y Frescura** | Protección contra apuestas emitidas con cuotas obsoletas tras un gol o incidente. | Control de versiones (`cuotasVersion`) obligatorio en `POST /apuestas`: si la cuota cambió en el servidor, se aborta la apuesta con `HTTP 409 Conflict`. |
| **RNF04** | **Idempotencia Anti-Doble Clic** | Prevención de duplicados de tickets ante reintentos de red o clics repetidos del usuario. | `idempotencyKey` única por ticket: si el backend recibe una clave ya procesada, responde `HTTP 200` con el ticket existente sin debitar nuevamente. |
| **RNF05** | **Arquitectura Monolito Modular** | Agrupación vertical por dominios de negocio compartiendo un único proceso y base de datos. | Sin complejidad de microservicios ni brokers externos en esta fase; módulos delimitados con contratos de servicios inyectables claros. |
| **RNF06** | **Persistencia y Replica Set Local** | Entorno de base de datos preparado para transacciones y eventos en tiempo real. | MongoDB configurado con Replica Set de un nodo (`--replSet rs0`) en `docker-compose.yml`, habilitando transacciones ACID y Change Streams. |
| **RNF07** | **Reactividad en Tiempo Real** | Notificación instantánea de cambios de mercado al navegador. | Server-Sent Events (SSE) con `EventSource` en Angular; actualización en $< 100\text{ ms}$ de las cuotas en la pantalla del usuario. |
| **RNF08** | **Usabilidad y Rendimiento UI** | Estética dark mode coherente y renderizado optimizado en cliente. | Variables CSS centralizadas en `:root` (`styles.scss`); componentes standalone con `ChangeDetectionStrategy.OnPush` y Angular Signals. |
| **RNF09** | **Trazabilidad en Control de Versiones** | Trabajo desacoplado mediante ramas de feature independientes por integrante. | Ramas `feature/modulo-eventos`, `feature/modulo-betslip` y `feature/modulo-billetera-usuario` vinculadas a sus respectivos Issues. |
