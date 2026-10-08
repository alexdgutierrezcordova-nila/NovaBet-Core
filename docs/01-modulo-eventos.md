# 📘 Guía de Implementación: Módulo 1 — Catálogo de Eventos & Cartelera Deportiva

> **Responsable:** Integrante 1  
> **Rama Git:** `feature/modulo-eventos`  
> **Issue en GitHub:** `Issue #1: [Módulo 1] Catálogo de eventos deportivos y cartelera interactiva de cuotas`  
> **Enfoque:** Full-Stack del Feature (Base de datos MongoDB + API NestJS + Pantalla Angular)

---

## 1. Misión de tu Módulo

Eres el dueño absoluto de los **partidos de fútbol y las cuotas**. Tu trabajo consiste en:
1. **En Base de Datos (Mongoose):** Crear el modelo de partidos y sembrar datos de prueba (Real Madrid vs City, Barcelona vs Atlético, etc.).
2. **En Backend (NestJS):** Crear los endpoints para listar partidos y para simular el resultado de un partido finalizado.
3. **En Frontend (Angular):** Crear las tarjetas visuales de los partidos con los botones de cuotas **1**, **X**, **2**. Al hacer clic en una cuota, debes enviar la selección al cupón de apuestas (`BetslipService`).

---

## 2. Requisitos Funcionales a Cumplir

* **RF1.1 (Persistencia y Semilla):** Guardar partidos en MongoDB con deporte, liga, equipos, fecha, cuotas decimales (`local`, `empate`, `visitante`) y estado (`'PROGRAMADO' | 'EN_VIVO' | 'FINALIZADO' | 'CANCELADO'`). Si la BD está vacía, insertar automáticamente 4 o 5 partidos de ejemplo.
* **RF1.2 (Endpoint de Consulta):** `GET /api/eventos` debe retornar los partidos ordenados por fecha ascendente.
* **RF1.3 (Simulador de Resultados):** `PATCH /api/eventos/:id/resultado` permite marcar si el partido terminó en victoria `LOCAL`, `EMPATE` o `VISITANTE` con su marcador final opcional (ej: `"2 - 1"`).
* **RF1.4 (Cartelera en Angular):** Maquetar el componente `cartelera` mostrando tarjetas modernas con la paleta de colores CSS definida en `styles.scss` y botones interactivos para cada cuota.

---

## 3. Archivos que vas a crear en tu rama

### En el Backend (`apuestas-api/src/eventos/`):
```text
apuestas-api/src/eventos/
├── schemas/evento.schema.ts      ← Esquema Mongoose de partidos y cuotas
├── seeds/eventos.seed.ts         ← Lista de partidos iniciales
├── dto/update-resultado.dto.ts   ← DTO para simular resultados con class-validator
├── eventos.service.ts            ← Lógica de consulta y actualización
├── eventos.controller.ts         ← Controlador con GET /api/eventos y PATCH /:id/resultado
└── eventos.module.ts             ← Módulo de NestJS (importar en app.module.ts)
```

### En el Frontend (`apuestas-web/src/app/`):
```text
apuestas-web/src/app/
├── domains/eventos/
│   └── eventos.service.ts        ← Servicio HTTP que consume GET /api/eventos
└── features/cartelera/
    ├── cartelera.ts              ← Componente Angular Standalone
    ├── cartelera.html            ← Template con grid de tarjetas de partidos
    └── cartelera.scss            ← Estilos usando var(--bg-surface), var(--accent-green)
```

---

## 4. Implementación Técnica y Modelos

### 4.1. Esquema Mongoose (`apuestas-api/src/eventos/schemas/evento.schema.ts`)
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

### 4.2. DTO de Resultado (`apuestas-api/src/eventos/dto/update-resultado.dto.ts`)
```typescript
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateResultadoDto {
  @IsNotEmpty()
  @IsIn(['LOCAL', 'EMPATE', 'VISITANTE'])
  resultado: 'LOCAL' | 'EMPATE' | 'VISITANTE';

  @IsOptional()
  @IsString()
  marcadorFinal?: string; // Ej: "2 - 1"
}
```

### 4.3. Servicio Angular (`apuestas-web/src/app/domains/eventos/eventos.service.ts`)
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evento, ResultadoGanador } from './evento.model';
import { API_BASE_URL } from '../api.config';

@Injectable({ providedIn: 'root' })
export class EventosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/eventos`;

  obtenerEventos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(this.apiUrl);
  }

  simularResultado(id: string, resultado: ResultadoGanador, marcadorFinal?: string): Observable<Evento> {
    return this.http.patch<Evento>(`${this.apiUrl}/${id}/resultado`, { resultado, marcadorFinal });
  }
}
```

---

## 5. Integración con el Módulo 2 (El Cupón / Betslip)

Para conectar tu Cartelera con el Cupón de Apuestas de tu compañero (Módulo 2):

1. **Inyección directa del servicio:**
   En tu componente `cartelera.ts`, inyectas el `BetslipService`:
   ```typescript
   import { BetslipService } from '../../domains/apuestas/betslip.service';

   export class Cartelera {
     private readonly betslipService = inject(BetslipService);

     seleccionarCuota(evento: Evento, opcion: 'LOCAL' | 'EMPATE' | 'VISITANTE') {
       this.betslipService.seleccionarCuota(evento, opcion);
     }
   }
   ```
2. **Durante Días 1 al 3 (Antes de la integración):**
   Si tu compañero del Módulo 2 aún no terminó su `betslip.service.ts`, puedes imprimir un `console.log('Cuota seleccionada:', evento, opcion)` para probar tu interfaz sin depender de él. En el **Día 4**, simplemente conectas la llamada al método del servicio.

---

## 6. Estilos recomendados (SCSS)
Utiliza las variables CSS de `styles.scss` para mantener la coherencia visual con tus compañeros:
```scss
.cartelera-container {
  padding: 1.5rem;
}

.evento-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.btn-cuota {
  background-color: var(--bg-surface-hover);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 8px;
  padding: 0.6rem 1rem;
  cursor: pointer;

  &:hover {
    border-color: var(--accent-green);
  }

  &.activa {
    background-color: var(--accent-green);
    color: var(--bg-primary);
  }
}
```

---

## 7. Flujo de Trabajo en Git

1. Crear tu rama:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/modulo-eventos
   ```
2. Hacer commits descriptivos referenciando el Issue #1:
   ```bash
   git commit -m "feat(eventos): esquema mongoose y seed de partidos (#1)"
   git commit -m "feat(eventos): endpoints GET /eventos y PATCH /:id/resultado (#1)"
   git commit -m "feat(cartelera): servicio angular y componente de cartelera de cuotas (#1)"
   ```
3. Subir rama y abrir Pull Request:
   ```bash
   git push origin feature/modulo-eventos
   ```
