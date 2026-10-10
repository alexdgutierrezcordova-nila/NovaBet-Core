# ADR-002: Máquina de Estados, Separación de Mercados y Suspensión Temporal

## Estado
**Aceptado** (2026-10-10)

## Contexto
En plataformas de apuestas en vivo (In-Play), los incidentes críticos (goles, tarjetas rojas, revisiones de VAR) ocurren en fracciones de segundo. El diseño v1 presentaba dos problemas graves:
1. **Contención en Base de Datos (HTTP 409):** El reloj del partido actualizaba el mismo documento `Evento` cada segundo. Cuando un administrador intentaba registrar un gol, ocurrían conflictos de versión por bloqueo optimista.
2. **Apuestas con Cuotas Obsoletas (Ventana de Latencia):** Cuando caía un gol, un apostador con conexión rápida podía enviar una apuesta con cuota pre-gol antes de que el motor recalculara las probabilidades.

## Decisión
1. **Separación de Colecciones:** Se divide el modelo en dos colecciones:
   - `eventos`: Datos relativamente estables (equipos, marcador, estado general del partido).
   - `mercados`: Datos altamente dinámicos (cuotas 1X2, `cuotasVersion`, estado de mercado).
2. **Máquina de Estados de Evento:** `PRE-MATCH` -> `LIVE` -> `INTERRUMPIDO` -> `FINALIZADO` -> `EN_REVISION` -> `CANCELADO`.
3. **Máquina de Estados de Mercado:** `ABIERTO` <-> `SUSPENDIDO` -> `CERRADO`.
4. **Flujo de Suspensión por Incidente:**
   - Ante un gol o incidente crítico, el mercado cambia inmediatamente a `SUSPENDIDO`. Toda petición entrante de `POST /apuestas` se rechaza con `HTTP 423 Locked`.
   - El motor recalcula las probabilidades y cuotas.
   - Se incrementa `cuotasVersion` y el mercado regresa a `ABIERTO`.
5. **Control de Versión de Cuotas e Idempotencia:**
   - El frontend envía en `POST /apuestas` la `cuotasVersion` que el usuario tenía en pantalla y un `idempotencyKey`.
   - Si la versión no coincide con la actual en base de datos, el backend rechaza con `HTTP 409 Conflict` devolviendo la nueva cuota para que el usuario confirme si la acepta.

## Consecuencias
- Cero contención entre el avance del reloj y la administración de goles.
- Protección total contra arbitraje por latencia de red.
- La interfaz de usuario de Carlos (Betslip) debe implementar diálogos de aceptación ante respuestas 409 y deshabilitar botones ante 423.
