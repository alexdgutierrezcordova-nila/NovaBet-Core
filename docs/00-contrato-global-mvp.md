# 📑 Contrato Global e Integración Técnica — MVP BetPulse

> **Enfoque de Trabajo:** **Módulos Verticales de Negocio (Full-Stack por Feature)**  
> **Stack Oficial:**
> - **Frontend:** Angular 22.0.5 (SSR, Standalone Components, Signals, OnPush)
> - **Backend:** NestJS 11.1.9
> - **Base de Datos / ODM:** MongoDB con Mongoose 8.20.2 (Driver 6.20.0)

---

## 1. Filosofía Arquitectónica: Módulos por Necesidad de Negocio

En lugar de que uno solo haga base de datos, otro solo lógica y otro solo frontend, **cada integrante es dueño de un flujo de negocio completo de principio a fin** (hace los datos, la API backend y el componente web de su funcionalidad).

Esto garantiza que:
1. **Los 3 programan con IA a su propio ritmo** sin esperar que nadie termine.
2. **Los 3 tocan datos, backend y frontend**, demostrando capacidad full-stack para la evaluación del docente.
3. Se respeta la arquitectura en 3 capas (Persistencia, Negocio y Presentación) dentro de cada módulo.

---

## 2. Asignación de Módulos y Ramas de Git

| Módulo | Responsable | Flujo de Negocio Asignado | Rama Git | Issue |
|---|---|---|---|---|
| **Módulo 1** | **Integrante 1** | **Catálogo de Eventos & Cartelera Deportiva:**<br/>Base de datos de partidos, API de consulta y tarjetas interactivas de cuotas en Angular. | `feature/modulo-eventos` | `#1` |
| **Módulo 2** | **Integrante 2** | **Motor de Apuestas & Cupón (Betslip):**<br/>Base de datos de tickets, API de validación/emisión de apuestas y panel lateral del cupón en Angular. | `feature/modulo-betslip` | `#2` |
| **Módulo 3** | **Integrante 3** | **Billetera Virtual & Historial de Usuario:**<br/>Base de datos de usuario/saldo, API de recargas/liquidación de premios, Header de balance e Historial de boletos en Angular. | `feature/modulo-billetera-usuario` | `#3` |

---

## 3. Modelos Compartidos (El Contrato Oficial)

Estos modelos están guardados en `apuestas-web/src/app/domains/` para que los 3 usen exactamente los mismos nombres de variables:

### 3.1. Modelo Evento (`domains/eventos/evento.model.ts`)
```typescript
export type EstadoEvento = 'PROGRAMADO' | 'EN_VIVO' | 'FINALIZADO' | 'CANCELADO';
export type ResultadoGanador = 'LOCAL' | 'EMPATE' | 'VISITANTE' | 'SIN_RESULTADO';
export type OpcionSeleccionada = 'LOCAL' | 'EMPATE' | 'VISITANTE';

export interface CuotasMercado {
  local: number;     // Ej: 2.15
  empate: number;    // Ej: 3.40
  visitante: number; // Ej: 2.90
}

export interface Evento {
  id: string;
  deporte: string;
  liga: string;
  equipoLocal: string;
  equipoVisitante: string;
  fecha: string;
  cuotas: CuotasMercado;
  estado: EstadoEvento;
  resultado: ResultadoGanador;
  marcadorFinal?: string;
}
```

### 3.2. Modelo Ticket de Apuesta (`domains/apuestas/apuesta.model.ts`)
```typescript
export type EstadoTicket = 'PENDIENTE' | 'GANADA' | 'PERDIDA' | 'ANULADA';

export interface TicketApuesta {
  id: string;
  usuarioId: string;
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
  id: string;
  usuarioId: string;
  nombre: string;
  email: string;
  saldo: number;
}
```

---

## 4. Matriz de Endpoints REST del Backend

Todos los endpoints usan el prefijo global `/api`:

| Verbo | Endpoint | Módulo Responsable | Descripción |
|---|---|---|---|
| `GET` | `/api/eventos` | Módulo 1 (Integrante 1) | Retorna todos los partidos activos |
| `PATCH` | `/api/eventos/:id/resultado` | Módulo 1 (Integrante 1) | Simula el resultado final de un partido |
| `POST` | `/api/apuestas` | Módulo 2 (Integrante 2) | Valida fondos y emite el ticket |
| `GET` | `/api/apuestas/historial` | Módulo 2 (Integrante 2) | Retorna los tickets del usuario |
| `GET` | `/api/usuario/perfil` | Módulo 3 (Integrante 3) | Consulta datos y saldo del usuario |
| `POST` | `/api/usuario/recargar` | Módulo 3 (Integrante 3) | Añade saldo virtual al usuario |

---

## 5. Puntos de Integración (Cómo se conectan los 3 módulos)

1. **Módulo 1 $\rightarrow$ Módulo 2:** Cuando el usuario hace clic en una cuota de la Cartelera (Módulo 1), emite el evento al Cupón Betslip (Módulo 2).
2. **Módulo 2 $\rightarrow$ Módulo 3:** Cuando el usuario confirma una apuesta en el Betslip (Módulo 2), se valida que el saldo de la Billetera (Módulo 3) sea suficiente y se descuenta el monto.
3. **Módulo 1 $\rightarrow$ Módulo 3:** Cuando el Integrante 1 simula la finalización de un partido, se liquidan las apuestas y si el usuario ganó, se acredita el dinero a su saldo (Módulo 3).
