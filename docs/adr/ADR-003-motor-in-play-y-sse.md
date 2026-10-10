# ADR-003: Motor Matemático In-Play, Server-Sent Events (SSE) y Mock de Desbloqueo

## Estado
**Aceptado** (2026-10-10)

## Contexto
El cálculo de cuotas en vivo requiere modelar la probabilidad de goles restantes a medida que el tiempo avanza. En el MVP inicial se contemplaban cuotas fijas o manuales, lo cual no representaba un entorno de apuestas deportivas real.
Asimismo, el desarrollo del motor matemático avanzado (Distribución de Poisson bivariada ajustada por Dixon-Coles y decaimiento temporal) requiere tiempo de implementación, lo cual amenazaba con bloquear el avance del Módulo 2 (Betslip de Carlos).

## Decisión
1. **Responsabilidad del Motor:** El Integrante 1 (Módulo 1) asume en su totalidad el desarrollo del motor matemático en NestJS.
2. **Estrategia de Desbloqueo Inmediato (Mock SSE):**
   - El Integrante 1 entrega en el Día 1 un endpoint `GET /api/cuotas/stream` utilizando **Server-Sent Events (SSE)** que emite cuotas aleatorias, cambios de versión y estados de suspensión simulados.
   - Esto permite que Carlos (Módulo 2) construya la reactividad del Betslip de inmediato sin esperar la matemática final.
3. **Fundamento Matemático del Motor:**
   - **Tasa Base ($\lambda$):** $\lambda_L = \mu \cdot \text{Ataque}_L \cdot \text{Defensa}_V \cdot \gamma$ (donde $\gamma$ es la ventaja de local y $\mu$ la media de goles de la liga).
   - **Ajuste Dixon-Coles:** Corrección $\tau$ en los marcadores de baja puntuación (0-0, 1-0, 0-1, 1-1) con parámetro $\rho$ fijo y documentado para ajustar empates subestimados por Poisson puro.
   - **Time-Decay no lineal:** Ponderación con mayor peso de probabilidad en los tramos finales (minutos 75 a 90+).
   - **Margen de la Casa (Overround):** Aplicación proporcional de margen $m$ (6% por defecto) asegurando que $\sum (1 / \text{cuota}_i) > 1$.

## Consecuencias
- Desbloqueo inmediato del equipo frontend mediante contrato reactivo SSE estable.
- Modelo matemático riguroso con cuotas que respetan las leyes de probabilidad del mercado deportivo profesional.
