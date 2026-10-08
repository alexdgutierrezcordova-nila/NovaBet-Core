# 📑 Contrato Global e Integración Técnica — MVP NovaBet

> **Enfoque de Trabajo:** **Módulos Verticales de Negocio (Full-Stack por Feature)**  
> **Stack Oficial:**
> - **Frontend:** Angular 22.0.5 (SSR, Standalone Components, Signals, OnPush)
> - **Backend:** NestJS 11.1.9
> - **Base de Datos / ODM:** MongoDB con Mongoose 8.20.2 (Driver 6.20.0)

---

## 1. Filosofía Arquitectónica: Módulos por Necesidad de Negocio

Cada integrante es dueño de un **flujo de negocio completo de principio a fin** (Datos en MongoDB → API NestJS → Componente Angular):

1. **Los 3 programan con IA a su propio ritmo** sin esperar que nadie termine.
2. **Los 3 tocan datos, backend y frontend**, demostrando capacidad full-stack.
3. Se respeta la arquitectura en 3 capas (Persistencia, Negocio, Presentación) dentro de cada módulo.

---

## 2. Asignación de Módulos y Ramas de Git

| Módulo | Responsable | Flujo de Negocio Asignado | Rama Git | Issue |
|---|---|---|---|---|
| **Módulo 1** | **Integrante 1** | **Catálogo de Eventos & Cartelera Deportiva:**<br/>Partidos en Mongo, API de consulta/resultados, tarjetas interactivas de cuotas en Angular. | `feature/modulo-eventos` | `#1` |
| **Módulo 2** | **Integrante 2** | **Motor de Apuestas & Cupón (Betslip):**<br/>Tickets en Mongo, API de validación/emisión, panel lateral del cupón en Angular. | `feature/modulo-betslip` | `#2` |
| **Módulo 3** | **Integrante 3** | **Billetera Virtual & Historial de Usuario:**<br/>Saldo en Mongo, API de recargas/liquidación, Header de balance e Historial en Angular. | `feature/modulo-billetera-usuario` | `#3` |

---

## 3. Modelos Compartidos (El Contrato Oficial)

> **REGLA CRÍTICA:** Estos modelos son el idioma común. Ningún integrante debe modificarlos sin avisar a los otros dos.

Están guardados en `apuestas-web/src/app/domains/`:

### 3.1. Modelo Evento (`domains/eventos/evento.model.ts`)
```typescript
export type EstadoEvento = 'PROGRAMADO' | 'EN_VIVO' | 'FINALIZADO' | 'CANCELADO';
export type ResultadoGanador = 'LOCAL' | 'EMPATE' | 'VISITANTE' | 'SIN_RESULTADO';
export type OpcionSeleccionada = 'LOCAL' | 'EMPATE' | 'VISITANTE';

export interface CuotasMercado {
  local: number;
  empate: number;
  visitante: number;
}

export interface Evento {
  _id: string;                    // MongoDB ObjectId serializado como string
  deporte: string;
  liga: string;
  equipoLocal: string;
  equipoVisitante: string;
  fecha: string;                  // ISO 8601
  cuotas: CuotasMercado;
  estado: EstadoEvento;           // Los 4 valores: PROGRAMADO, EN_VIVO, FINALIZADO, CANCELADO
  resultado: ResultadoGanador;
  marcadorFinal?: string;
}
```

### 3.2. Modelo Ticket de Apuesta (`domains/apuestas/apuesta.model.ts`)
```typescript
export type EstadoTicket = 'PENDIENTE' | 'GANADA' | 'PERDIDA' | 'ANULADA';

export interface TicketApuesta {
  _id: string;
  usuarioId: string;              // Siempre 'usr-demo' para este MVP
  eventoId: string;
  eventoResumen: {
    partido: string;
    liga: string;
  };
  seleccion: OpcionSeleccionada;
  cuotaJugada: number;
  montoApostado: number;
  gananciaPotencial: number;
  estado: EstadoTicket;
  creadoEn: string;
  resueltoEn?: string;
}
```

### 3.3. Modelo Usuario y Billetera (`domains/usuario/usuario.model.ts`)
```typescript
export interface Usuario {
  _id: string;
  usuarioId: string;              // Siempre 'usr-demo' para este MVP
  nombre: string;
  email: string;
  saldo: number;
}
```

---

## 4. Convenciones Técnicas Compartidas

### 4.1. Identificador de Usuario (Sin Login)
Este MVP **no tiene autenticación**. Se usará un usuario ficticio hardcodeado:
- **`usuarioId`:** `'usr-demo'`
- Todos los endpoints que requieren usuario usan este valor fijo.

### 4.2. MongoDB `_id` vs `id`
Mongoose devuelve `_id` por defecto. Para mantener la consistencia:
- **En los modelos de Angular** se usa `_id: string`.
- **En las respuestas de NestJS** se deja el `_id` por defecto de Mongoose (no se transforma).
- Si un integrante necesita un campo limpio `id`, puede usar `_id` directamente en el template de Angular.

### 4.3. URL Base de la API
El frontend debe consumir la API vía la constante:
```typescript
// apuestas-web/src/app/domains/api.config.ts
export const API_BASE_URL = 'http://localhost:3000/api';
```
Cada servicio HTTP importa esta constante en lugar de hardcodear la URL.

### 4.4. Paleta de Colores (CSS Custom Properties)
Las variables de color están definidas en `styles.scss` bajo `:root`. Los 3 integrantes deben usar estas variables en lugar de hardcodear colores:
```scss
// En cualquier .scss de componente:
background-color: var(--bg-surface);      // #151c28
color: var(--text-primary);               // #f8fafc
border: 1px solid var(--border-color);    // #243042
// Acento verde para cuotas seleccionadas y ganancias:
color: var(--accent-green);               // #00e676
// Estados de tickets:
color: var(--color-pendiente);            // #eab308 (amarillo)
color: var(--color-ganada);               // #22c55e (verde)
color: var(--color-perdida);              // #ef4444 (rojo)
```

### 4.5. Manejo de Errores del Backend en el Frontend
Cuando el backend rechace una petición (ej. saldo insuficiente, evento no disponible), responderá con un código HTTP `400` o `404` y un JSON:
```json
{ "statusCode": 400, "message": "Saldo insuficiente para realizar la apuesta" }
```
Cada integrante debe capturar el error en su servicio Angular y mostrar el `message` al usuario mediante una **alerta visual** en su componente (texto rojo debajo del botón, o un snackbar).

---

## 5. Matriz de Endpoints REST del Backend

Todos los endpoints usan el prefijo global `/api` (ya configurado en `main.ts`):

| Verbo | Endpoint | Módulo | Descripción |
|---|---|---|---|
| `GET` | `/api/eventos` | M1 (Integrante 1) | Retorna todos los partidos activos |
| `PATCH` | `/api/eventos/:id/resultado` | M1 (Integrante 1) | Simula el resultado y **dispara la liquidación** de tickets |
| `POST` | `/api/apuestas` | M2 (Integrante 2) | Valida fondos y emite el ticket |
| `GET` | `/api/apuestas/historial` | M2 (Integrante 2) | Retorna los tickets del usuario |
| `GET` | `/api/usuario/perfil` | M3 (Integrante 3) | Consulta datos y saldo del usuario |
| `POST` | `/api/usuario/recargar` | M3 (Integrante 3) | Añade saldo virtual al usuario |

---

## 6. Plan de Integración (Cómo se conectan los 3 Módulos)

Este es el punto más crítico del proyecto. Los 3 módulos necesitan comunicarse entre sí. Hay dos planos de integración: el **Backend (NestJS)** y el **Frontend (Angular)**.

### 6.1. Integración en el Frontend (Angular) — Servicio Compartido

Los componentes de Angular se comunican entre sí a través de un **servicio inyectable** (`BetslipService`), NO mediante `@Output()` entre componentes.

**Flujo:**
1. **Módulo 1 → Módulo 2:** Cuando el usuario hace clic en una cuota en la Cartelera, el componente del Integrante 1 **inyecta `BetslipService`** (creado por el Integrante 2) y llama a su método `seleccionarCuota(evento, opcion)` directamente. No se necesita `@Output()`.
2. **Módulo 2 → Módulo 3:** Cuando el usuario confirma una apuesta en el Betslip, el Integrante 2 llama a `POST /api/apuestas`. Si la respuesta es exitosa, el servicio emite una señal para que el Header (Módulo 3) re-consulte el saldo con `GET /api/usuario/perfil`.

**Mecanismo técnico recomendado:**
```typescript
// betslip.service.ts (Módulo 2, Integrante 2)
// El Integrante 1 inyecta este servicio y llama a seleccionarCuota()
// El Integrante 3 puede suscribirse a apuestaConfirmada$ para refrescar el saldo
readonly apuestaConfirmada$ = new Subject<void>();
```

### 6.2. Integración en el Backend (NestJS) — Cadena de Imports

**Flujo de liquidación de apuestas (el más complejo):**

Cuando el Integrante 1 simula el resultado de un partido (`PATCH /api/eventos/:id/resultado`), debe ocurrir lo siguiente automáticamente:
1. Se marca el evento como `FINALIZADO` (Módulo 1).
2. Se buscan todos los tickets `PENDIENTE` de ese evento y se liquidan como `GANADA` o `PERDIDA` (Módulo 2).
3. Se acredita la ganancia al saldo del usuario ganador (Módulo 3).

**¿Quién escribe ese código?** El **Integrante 1** en su endpoint de resultado. Para hacerlo, su `EventosModule` debe importar `ApuestasModule`, y `ApuestasModule` ya importa `UsuarioModule`. La cadena de dependencias es:

```text
EventosModule → importa → ApuestasModule → importa → UsuarioModule
```

En código NestJS:
```typescript
// eventos.module.ts (Integrante 1)
@Module({
  imports: [
    MongooseModule.forFeature([...]),
    ApuestasModule   // ← Importar para poder inyectar ApuestasService
  ],
  ...
})

// eventos.service.ts (Integrante 1)
// Al llamar a actualizarResultado():
// 1. Actualizar el evento a FINALIZADO
// 2. Llamar a this.apuestasService.liquidarTicketsDeEvento(eventoId, resultado)
```

> **IMPORTANTE:** Esta integración se hace en el **Día 4** cuando los 3 módulos ya están funcionando individualmente. No intentar hacer esto antes.

---

## 7. Cronograma Sugerido

| Día | Actividad |
|---|---|
| **Día 1** | Cada integrante lee su guía, crea su rama y programa su esquema Mongoose + seeder. |
| **Día 2** | Cada integrante termina sus endpoints NestJS y los prueba con Postman o el navegador. |
| **Día 3** | Cada integrante crea su componente Angular (puede usar datos mock locales si el backend aún no está listo). |
| **Día 4** | **Integración:** Se conectan los 3 módulos (frontend consume la API real, se cablea la liquidación). |
| **Día 5** | Pruebas finales, limpieza visual, PRs y merge a `main`. |
