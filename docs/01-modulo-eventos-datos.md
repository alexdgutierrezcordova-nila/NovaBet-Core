# 📘 Guía de Implementación: Módulo 1 — Catálogo de Eventos y Datos

> **Rol Asignado:** Integrante 1 (Especialista en Datos y Persistencia)  
> **Rama Git:** `feature/modulo-eventos-datos`  
> **Issue de GitHub:** `Issue #1: [Datos] Modelado de eventos deportivos, catálogo y persistencia en MongoDB`  
> **Tecnologías:** NestJS 11.1.9 + MongoDB (Mongoose 8.20.2)  

---

## 1. Objetivo del Módulo

Construir la capa de persistencia y catálogo para los eventos deportivos. Tu responsabilidad es asegurar que la base de datos almacene los partidos con sus cuotas, proveer datos iniciales realistas (*seed*) y exponer la API para consultar y actualizar el resultado final de los eventos.

---

## 2. Requisitos a Implementar

### 2.1. Requisitos Funcionales (RF)
* **RF1.1 (Persistencia de Eventos):** El sistema debe almacenar eventos deportivos con deporte, liga, equipos local y visitante, fecha y cuotas 1X2 (Local, Empate, Visitante).
* **RF1.2 (Consulta de Catálogo):** El sistema debe proveer un endpoint (`GET /api/eventos`) que retorne los eventos activos y ordenados por fecha.
* **RF1.3 (Simulación de Resultados):** El sistema debe proveer un endpoint (`PATCH /api/eventos/:id/resultado`) para fijar el ganador de un partido (`LOCAL`, `EMPATE`, `VISITANTE`), marcando el evento como `FINALIZADO`.

### 2.2. Requisitos No Funcionales (RNF)
* **RNF1.1 (Validación de Esquema):** Mongoose debe validar que las cuotas sean números estrictamente mayores a 1.00.
* **RNF1.2 (Población Automática / Seeder):** Si la base de datos está vacía al iniciar el backend, se deben insertar automáticamente entre 6 y 8 partidos iniciales listos para apostar.

---

## 3. Estructura de Archivos a Crear

Trabajarás en el backend dentro de `apuestas-api/src/eventos/`:

```text
apuestas-api/src/
└── eventos/
    ├── dto/
    │   ├── create-evento.dto.ts
    │   └── update-resultado.dto.ts
    ├── schemas/
    │   └── evento.schema.ts
    ├── seeds/
    │   └── eventos.seed.ts
    ├── eventos.controller.ts
    ├── eventos.service.ts
    └── eventos.module.ts
```

---

## 4. Implementación Técnica

### 4.1. Esquema Mongoose (`schemas/evento.schema.ts`)
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventoDocument = Evento & Document;

@Schema({ _id: false })
export class CuotasMercado {
  @Prop({ required: true, min: 1.01 })
  local: number;

  @Prop({ required: true, min: 1.01 })
  empate: number;

  @Prop({ required: true, min: 1.01 })
  visitante: number;
}

@Schema({ timestamps: true })
export class Evento {
  @Prop({ required: true, default: 'Fútbol' })
  deporte: string;

  @Prop({ required: true })
  liga: string;

  @Prop({ required: true })
  equipoLocal: string;

  @Prop({ required: true })
  equipoVisitante: string;

  @Prop({ required: true })
  fecha: Date;

  @Prop({ type: CuotasMercado, required: true })
  cuotas: CuotasMercado;

  @Prop({ 
    required: true, 
    enum: ['PROGRAMADO', 'EN_VIVO', 'FINALIZADO', 'CANCELADO'], 
    default: 'PROGRAMADO' 
  })
  estado: string;

  @Prop({ 
    required: true, 
    enum: ['LOCAL', 'EMPATE', 'VISITANTE', 'SIN_RESULTADO'], 
    default: 'SIN_RESULTADO' 
  })
  resultado: string;

  @Prop({ required: false, default: '' })
  marcadorFinal?: string;
}

export const EventoSchema = SchemaFactory.createForClass(Evento);
```

---

### 4.2. DTO de Simulación de Resultado (`dto/update-resultado.dto.ts`)
```typescript
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateResultadoDto {
  @IsNotEmpty()
  @IsIn(['LOCAL', 'EMPATE', 'VISITANTE'])
  resultado: 'LOCAL' | 'EMPATE' | 'VISITANTE';

  @IsOptional()
  @IsString()
  marcadorFinal?: string; // Ej: "3 - 1"
}
```

---

### 4.3. Semilla de Datos Iniciales (`seeds/eventos.seed.ts`)
Genera partidos atractivos para que la web se vea profesional:
```typescript
export const EVENTOS_INICIALES = [
  {
    deporte: 'Fútbol',
    liga: 'UEFA Champions League',
    equipoLocal: 'Real Madrid',
    equipoVisitante: 'Manchester City',
    fecha: new Date(Date.now() + 86400000 * 2),
    cuotas: { local: 2.15, empate: 3.40, visitante: 2.90 },
    estado: 'PROGRAMADO',
    resultado: 'SIN_RESULTADO'
  },
  {
    deporte: 'Fútbol',
    liga: 'UEFA Champions League',
    equipoLocal: 'Bayern Múnich',
    equipoVisitante: 'Arsenal',
    fecha: new Date(Date.now() + 86400000 * 3),
    cuotas: { local: 1.95, empate: 3.50, visitante: 3.60 },
    estado: 'PROGRAMADO',
    resultado: 'SIN_RESULTADO'
  },
  {
    deporte: 'Fútbol',
    liga: 'Premier League',
    equipoLocal: 'Liverpool',
    equipoVisitante: 'Chelsea',
    fecha: new Date(Date.now() + 86400000),
    cuotas: { local: 1.65, empate: 3.90, visitante: 4.80 },
    estado: 'PROGRAMADO',
    resultado: 'SIN_RESULTADO'
  },
  {
    deporte: 'Fútbol',
    liga: 'LaLiga EA Sports',
    equipoLocal: 'FC Barcelona',
    equipoVisitante: 'Atlético de Madrid',
    fecha: new Date(Date.now() + 86400000 * 4),
    cuotas: { local: 1.80, empate: 3.60, visitante: 4.10 },
    estado: 'PROGRAMADO',
    resultado: 'SIN_RESULTADO'
  }
];
```

---

## 5. Endpoints a Entregar

| Verbo | Ruta | Body (JSON) | Respuesta Exitosa |
|---|---|---|---|
| `GET` | `/api/eventos` | Ninguno | `200 OK` con array de eventos |
| `GET` | `/api/eventos/:id` | Ninguno | `200 OK` con detalle del evento |
| `PATCH` | `/api/eventos/:id/resultado` | `{"resultado": "LOCAL", "marcadorFinal": "2 - 1"}` | `200 OK` con evento actualizado |

---

## 6. Flujo de Trabajo en Git para Integrante 1

1. Crear la rama desde `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/modulo-eventos-datos
   ```
2. Realizar commits claros referenciando el Issue #1:
   ```bash
   git commit -m "feat(eventos): definicion de esquema mongoose y cuotas (#1)"
   git commit -m "feat(eventos): implementacion de seeder y servicio de consulta (#1)"
   git commit -m "feat(eventos): controlador y endpoint de simulacion de resultados (#1)"
   ```
3. Subir rama y abrir Pull Request hacia `main`:
   ```bash
   git push origin feature/modulo-eventos-datos
   ```
