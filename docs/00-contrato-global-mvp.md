# 📑 Contrato Global e Integración Técnica — MVP BetPulse

> **Nombre del Proyecto propuesto:** **BetPulse** (o **BetArena**)  
> **Plataforma:** Sistema de Apuestas Deportivas Web  
> **Stack Oficial:**
> - **Frontend:** Angular 22.0.5 (Standalone Components, Signals, OnPush)
> - **Backend:** NestJS 11.1.9
> - **Base de Datos / ODM:** MongoDB con Mongoose 8.20.2 (Driver 6.20.0)

---

## 1. Filosofía de Trabajo en Paralelo (Contract-First)

Para que los **3 integrantes** programen al mismo tiempo sin bloquearse:
1. **El Integrante 1 (Datos)** creará los esquemas Mongoose y la persistencia respetando este contrato.
2. **El Integrante 2 (Lógica)** construirá los servicios matemáticos y de negocio esperando estos mismos modelos.
3. **El Integrante 3 (Frontend)** usará un archivo de datos simulados (*Mock*) con esta estructura exacta desde el día 1.

---

## 2. Modelos TypeScript Compartidos (El Contrato Oficial)

### 2.1. Modelo: Evento Deportivo (`Evento`)
Representa un partido programado o finalizado.

```typescript
export type EstadoEvento = 'PROGRAMADO' | 'EN_VIVO' | 'FINALIZADO' | 'CANCELADO';
export type ResultadoGanador = 'LOCAL' | 'EMPATE' | 'VISITANTE' | 'SIN_RESULTADO';

export interface CuotasMercado {
  local: number;     // Ej: 1.85 (gana equipo local)
  empate: number;    // Ej: 3.40 (empate)
  visitante: number; // Ej: 4.20 (gana visitante)
}

export interface Evento {
  id: string;                     // UUID o MongoDB _id serializado como string
  deporte: string;                // Ej: "Fútbol"
  liga: string;                   // Ej: "UEFA Champions League"
  equipoLocal: string;            // Ej: "Real Madrid"
  equipoVisitante: string;        // Ej: "Manchester City"
  fecha: string;                  // ISO 8601 string: "2026-10-15T19:00:00Z"
  cuotas: CuotasMercado;
  estado: EstadoEvento;
  resultado: ResultadoGanador;    // Se define al finalizar el evento
  marcadorFinal?: string;         // Ej: "2 - 1" (opcional)
}
```

---

### 2.2. Modelo: Ticket de Apuesta (`TicketApuesta`)
Representa una apuesta colocada por el usuario.

```typescript
export type OpcionSeleccionada = 'LOCAL' | 'EMPATE' | 'VISITANTE';
export type EstadoTicket = 'PENDIENTE' | 'GANADA' | 'PERDIDA' | 'ANULADA';

export interface TicketApuesta {
  id: string;                     // Identificador único del boleto
  usuarioId: string;              // ID del apostador
  eventoId: string;               // ID del partido
  eventoResumen: {                // Snapshot de los datos al momento de apostar
    partido: string;              // "Real Madrid vs Manchester City"
    liga: string;                 // "UEFA Champions League"
  };
  seleccion: OpcionSeleccionada;  // Qué eligió el usuario
  cuotaJugada: number;            // Cuota fijada al momento de la apuesta (ej: 1.85)
  montoApostado: number;          // Monto colocado (ej: 50.00)
  gananciaPotencial: number;      // montoApostado * cuotaJugada (ej: 92.50)
  estado: EstadoTicket;
  creadoEn: string;               // ISO Date string
  resueltoEn?: string;            // ISO Date string cuando se liquida
}
```

---

### 2.3. Modelo: Usuario y Billetera Virtual (`Usuario`)
Representa el usuario ficticio para la demostración del MVP.

```typescript
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  saldo: number;                  // Saldo virtual disponible (ej: 1000.00)
}
```

---

## 3. Matriz de Endpoints REST del Backend

Todos los endpoints usan el prefijo `/api`:

| Método | Endpoint | Módulo Responsable | Descripción |
|---|---|---|---|
| `GET` | `/api/eventos` | M1 (Datos) | Lista todos los eventos activos |
| `GET` | `/api/eventos/:id` | M1 (Datos) | Detalle de un evento específico |
| `PATCH` | `/api/eventos/:id/resultado` | M1 (Datos) | Simula el resultado de un partido y dispara liquidación |
| `GET` | `/api/usuario/perfil` | M2 (Lógica) | Retorna usuario actual y su saldo |
| `POST` | `/api/usuario/recargar` | M2 (Lógica) | Añade saldo ficticio al usuario |
| `POST` | `/api/apuestas` | M2 (Lógica) | Valida saldo, crea ticket y debita balance |
| `GET` | `/api/apuestas/historial` | M2 (Lógica) | Lista de tickets del usuario |

---

## 4. Convención de Git para el Equipo

Para que la trazabilidad en GitHub sea limpia y evaluable por el docente:

* **Rama base:** `main`
* **Ramas individuales (1 por persona):**
  * Integrante 1: `feature/modulo-eventos-datos`
  * Integrante 2: `feature/modulo-motor-apuestas`
  * Integrante 3: `feature/modulo-interfaz-web`
* **Formato de Commits:**
  * `feat(eventos): creacion de schema mongoose y seed (#1)`
  * `feat(apuestas): validacion de saldo y calculo de cuotas (#2)`
  * `feat(ui): cartelera de partidos y panel betslip (#3)`
