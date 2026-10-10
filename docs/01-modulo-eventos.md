# 📘 Guía de Implementación: Módulo 1 — Catálogo de Eventos, Mercados In-Play y Simulación

> **Responsable:** Integrante 1  
> **Rama Git:** `feature/modulo-eventos`  
> **Issue en GitHub:** `Issue #1: [Módulo 1] Catálogo de eventos deportivos, mercados en vivo y motor matemático de cuotas`  
> **Enfoque:** Full-Stack del Feature (MongoDB con colecciones separadas + API NestJS con SSE + Pantalla Angular)

---

## 1. Misión de tu Módulo en la Arquitectura v2

Eres el dueño de los **partidos de fútbol, los mercados y el motor matemático de cuotas en tiempo real**. Tu trabajo consiste en:
1. **En Base de Datos (Mongoose):** 
   - Crear la colección `eventos` (datos estables: equipos, marcador, estados de partido).
   - Crear la colección `mercados` (datos de alta volatilidad: cuotas 1X2, `cuotasVersion`, estados de suspensión `ABIERTO | SUSPENDIDO | CERRADO`).
2. **En Backend (NestJS):**
   - **Paso Rápido (Desbloqueo para Carlos):** Exponer el endpoint `GET /api/cuotas/stream` vía Server-Sent Events (SSE) con un generador de cuotas Mock para que Carlos construya el cupón de inmediato.
   - **Paso Nuclear:** Construir el motor matemático In-Play (Poisson + corrección Dixon-Coles + time-decay en los últimos 15 min + margen de la casa overround).
   - Gestionar el simulador de reloj (el minuto no se guarda en Mongo cada segundo, se deriva de `inicioReal` para evitar colisiones de concurrencia).
   - Emitir eventos de dominio ante cambios críticos (`evento.finalizado`, `evento.cancelado`, `gol.anulado`).
3. **En Frontend (Angular):**
   - Tarjetas de cartelera deportiva actualizadas en tiempo real que reaccionan a los eventos SSE y envían selecciones al `BetslipService` de Carlos.

---

## 2. Requisitos Funcionales a Cumplir

* **RF1.1 (Persistencia de Eventos y Mercados):** Guardar eventos y mercados en colecciones desacopladas. Si la base está vacía, sembrar 4 o 5 partidos con sus atributos de ataque y defensa para alimentar el motor.
* **RF1.2 (Endpoint de Consulta de Cartelera):** `GET /api/eventos` retorna los partidos ordenados por fecha ascendente con su estado actual (`PRE-MATCH`, `LIVE`, `FINALIZADO`, etc.).
* **RF1.3 (Stream SSE de Mercados en Vivo):** `GET /api/cuotas/stream` envía actualizaciones continuas hacia los navegadores (cuotas, minutos, versiones y suspensiones).
* **RF1.4 (Gestión de Incidentes y Resultados):** `PATCH /api/eventos/:id/resultado` permite registrar goles, actualizar marcador y finalizar partidos con control de concurrencia optimista.

---

## 3. Archivos que vas a crear en tu rama

### En el Backend (`apuestas-api/src/`):
```text
apuestas-api/src/
├── eventos/
│   ├── schemas/evento.schema.ts         ← Esquema Mongoose de partidos y marcador
│   ├── dto/update-resultado.dto.ts      ← DTO para simular goles o resultados
│   ├── eventos.service.ts               ← Lógica de estados y control de partido
│   ├── eventos.controller.ts            ← Endpoints /api/eventos
│   └── eventos.module.ts                ← Módulo de eventos
├── cuotas/
│   ├── schemas/mercado.schema.ts        ← Esquema Mongoose de cuotas y cuotasVersion
│   ├── engine/poisson-engine.service.ts ← Motor de Poisson, Dixon-Coles y Time-Decay
│   ├── cuotas-mock.service.ts           ← Emisor SSE Mock (Paso 1 para Carlos)
│   ├── cuotas.controller.ts             ← GET /api/cuotas/stream (SSE)
│   └── cuotas.module.ts                 ← Módulo de cuotas
└── database/seeds/
    └── eventos-iniciales.seed.ts        ← Semilla de equipos y fuerzas ataque/defensa
```

### En el Frontend (`apuestas-web/src/app/`):
```text
apuestas-web/src/app/
├── domains/eventos/
│   ├── evento.model.ts                  ← Interfaz Evento, EstadoEvento, Marcador
│   └── eventos.service.ts               ← Cliente HTTP para GET /api/eventos
├── domains/cuotas/
│   ├── mercado.model.ts                 ← Interfaces Mercado, Cuotas1X2, MercadoActualizadoStream
│   └── cuotas-stream.service.ts         ← Servicio que abre EventSource (SSE) en el navegador
└── features/cartelera/
    ├── cartelera.ts                     ← Componente Angular Standalone OnPush
    ├── cartelera.html                   ← Grid de tarjetas de partidos en vivo
    └── cartelera.scss                   ← Estilos usando var(--bg-surface), animaciones de cuota
```

---

## 4. Esquemas Mongoose Oficiales

### 4.1. Esquema Evento (`apuestas-api/src/eventos/schemas/evento.schema.ts`)
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventoDocument = Evento & Document;

@Schema({ _id: false })
export class MarcadorSchema {
  @Prop({ required: true, default: 0 })
  local: number;

  @Prop({ required: true, default: 0 })
  visitante: number;
}

@Schema({ timestamps: true, optimisticConcurrency: true })
export class Evento {
  @Prop({ required: true, default: 'Fútbol' })
  deporte: string;

  @Prop({ required: true })
  liga: string;

  @Prop({ required: true })
  equipoLocal: string;

  @Prop({ required: true })
  equipoVisitante: string;

  // Parámetros base para alimentar el motor Poisson
  @Prop({ required: true, default: 1.2 })
  fuerzaAtaqueLocal: number;

  @Prop({ required: true, default: 0.9 })
  fuerzaDefensaVisitante: number;

  @Prop({ required: true })
  fechaProgramada: Date;

  @Prop({ required: false })
  inicioReal?: Date;

  @Prop({ 
    required: true, 
    enum: ['PRE-MATCH', 'LIVE', 'INTERRUMPIDO', 'FINALIZADO', 'EN_REVISION', 'CANCELADO'], 
    default: 'PRE-MATCH' 
  })
  estado: string;

  @Prop({ type: MarcadorSchema, default: () => ({ local: 0, visitante: 0 }) })
  marcador: MarcadorSchema;

  @Prop({ 
    required: true, 
    enum: ['LOCAL', 'EMPATE', 'VISITANTE', 'SIN_RESULTADO'], 
    default: 'SIN_RESULTADO' 
  })
  resultado: string;
}

export const EventoSchema = SchemaFactory.createForClass(Evento);
// Índice para acelerar la cartelera
EventoSchema.index({ estado: 1, fechaProgramada: 1 });
```

### 4.2. Esquema Mercado (`apuestas-api/src/cuotas/schemas/mercado.schema.ts`)
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MercadoDocument = Mercado & Document;

@Schema({ _id: false })
export class Cuotas1X2Schema {
  @Prop({ required: true, min: 1.01 })
  local: number;

  @Prop({ required: true, min: 1.01 })
  empate: number;

  @Prop({ required: true, min: 1.01 })
  visitante: number;
}

@Schema({ timestamps: true })
export class Mercado {
  @Prop({ type: Types.ObjectId, ref: 'Evento', required: true, unique: true })
  eventoId: Types.ObjectId;

  @Prop({ required: true, default: '1X2' })
  tipo: string;

  @Prop({ 
    required: true, 
    enum: ['ABIERTO', 'SUSPENDIDO', 'CERRADO'], 
    default: 'ABIERTO' 
  })
  estadoMercado: string;

  @Prop({ type: Cuotas1X2Schema, required: true })
  cuotas: Cuotas1X2Schema;

  @Prop({ required: true, default: 1 })
  cuotasVersion: number;

  @Prop({ required: true, default: 0.06 }) // Overround (margen de la casa, ej: 6%)
  margen: number;
}

export const MercadoSchema = SchemaFactory.createForClass(Mercado);
```

---

## 5. El Desbloqueo Inmediato para Carlos (Mock SSE)

Antes de terminar la matemática compleja, debes proveer este controlador funcional para que Carlos pueda conectar su interfaz:

```typescript
// apuestas-api/src/cuotas/cuotas.controller.ts
import { Controller, Sse } from '@nestjs/common';
import { Observable, interval, map } from 'rxjs';

@Controller('cuotas')
export class CuotasController {
  @Sse('stream')
  streamCuotas(): Observable<{ data: any }> {
    let version = 1;
    return interval(3000).pipe(
      map(() => {
        version++;
        // Simular cuotas fluctuantes y estados esporádicos de suspensión
        const suspendido = Math.random() < 0.1; // 10% de probabilidad de suspensión
        return {
          data: {
            eventoId: 'mock-evento-1',
            estadoMercado: suspendido ? 'SUSPENDIDO' : 'ABIERTO',
            cuotas: {
              local: Number((1.80 + Math.random() * 0.2).toFixed(2)),
              empate: Number((3.20 + Math.random() * 0.3).toFixed(2)),
              visitante: Number((4.00 + Math.random() * 0.5).toFixed(2))
            },
            cuotasVersion: version,
            minutoSimulado: 35,
            marcador: { local: 1, visitante: 0 },
            emitidoEn: new Date().toISOString()
          }
        };
      })
    );
  }
}
```

---

## 6. Integración con el Módulo 2 de Carlos

En tu componente de Cartelera (`cartelera.ts`):
1. Inyectas el `BetslipService` de Carlos:
   ```typescript
   private readonly betslipService = inject(BetslipService);

   seleccionarCuota(evento: Evento, mercado: Mercado, opcion: 'LOCAL' | 'EMPATE' | 'VISITANTE') {
     this.betslipService.seleccionarCuota(evento, mercado, opcion);
   }
   ```
2. Escuchas el stream de SSE con `cuotas-stream.service.ts` y actualizas tus tarjetas de forma reactiva con Angular Signals.
