# 📕 Guía de Implementación: Módulo 2 — Motor de Apuestas & Cupón (Betslip)

> **Responsable:** Integrante 2  
> **Rama Git:** `feature/modulo-betslip`  
> **Issue en GitHub:** `Issue #2: [Módulo 2] Motor de cálculo de cuotas y panel interactivo del cupón de apuestas`  
> **Enfoque:** Full-Stack del Feature (Base de datos MongoDB + API NestJS + Componente Betslip Angular)

---

## 1. Misión de tu Módulo

Eres el dueño del **corazón del juego: la colocación de la apuesta**. Tu trabajo consiste en:
1. **En Base de Datos (Mongoose):** Diseñar la colección `tickets` donde se guardan los boletos apostados con su cuota congelada y estado `PENDIENTE`.
2. **En Backend (NestJS):** Validar que el monto sea mayor a 0, calcular la ganancia matemática ($\text{Monto} \times \text{Cuota}$), verificar fondos con el `UsuarioService` (Módulo 3) y generar el ticket.
3. **En Frontend (Angular):** Crear el panel lateral flotante (*Betslip*) usando **Signals** para calcular en tiempo real la ganancia y permitir apostar. Además, proveerás el `BetslipService` al cual el Integrante 1 enviará las cuotas seleccionadas y el Integrante 3 escuchará cuando se confirme una apuesta.

---

## 2. Requisitos Funcionales a Cumplir

* **RF2.1 (Persistencia de Boletos):** Guardar en MongoDB cada ticket con `usuarioId` (`'usr-demo'`), `eventoId`, resumen del partido (`partido`, `liga`), `seleccion` ('LOCAL' | 'EMPATE' | 'VISITANTE'), `cuotaJugada`, `montoApostado`, `gananciaPotencial` y estado `PENDIENTE`.
* **RF2.2 (API de Apuestas):** `POST /api/apuestas` recibe `{ eventoId, seleccion, monto }`. Valida fondos con la billetera, debita el saldo y devuelve el ticket creado (`201 Created`).
* **RF2.3 (Servicio Reactivo Betslip):** En Angular, crear `betslip.service.ts` usando **Signals** para gestionar la selección activa, el monto y la ganancia computada automáticamente:
  $$\text{gananciaPotencial} = \text{monto} \times \text{cuota}$$
* **RF2.4 (Componente Betslip):** Renderizar el panel lateral derecho con el partido seleccionado, input numérico de monto, ganancia calculada, mensajes de error visuales si el saldo no alcanza y botón "Confirmar Apuesta".

---

## 3. Archivos que vas a crear en tu rama

### En el Backend (`apuestas-api/src/apuestas/`):
```text
apuestas-api/src/apuestas/
├── schemas/ticket.schema.ts      ← Esquema Mongoose de tickets
├── dto/create-apuesta.dto.ts     ← Validación de entrada (@IsPositive, @IsIn)
├── apuestas.service.ts           ← Validación de evento, débito y emisión de ticket
├── apuestas.controller.ts        ← Endpoints POST /api/apuestas y GET /api/apuestas/historial
└── apuestas.module.ts            ← Módulo de NestJS (importar en app.module.ts)
```

### En el Frontend (`apuestas-web/src/app/`):
```text
apuestas-web/src/app/
├── domains/apuestas/
│   └── betslip.service.ts        ← Signal Store reactivo y evento de confirmación
└── features/betslip/
    ├── betslip.ts                ← Componente Angular Standalone
    ├── betslip.html              ← Formulario interactivo del cupón
    └── betslip.scss              ← Estilos dark theme con variables CSS
```

---

## 4. Implementación Técnica y Modelos

### 4.1. Esquema Mongoose (`apuestas-api/src/apuestas/schemas/ticket.schema.ts`)
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TicketDocument = Ticket & Document;

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ required: true, default: 'usr-demo' })
  usuarioId: string;

  @Prop({ type: Types.ObjectId, ref: 'Evento', required: true })
  eventoId: Types.ObjectId;

  @Prop({ type: Object, required: true })
  eventoResumen: {
    partido: string;
    liga: string;
  };

  @Prop({ required: true, enum: ['LOCAL', 'EMPATE', 'VISITANTE'] })
  seleccion: 'LOCAL' | 'EMPATE' | 'VISITANTE';

  @Prop({ required: true, min: 1.01 })
  cuotaJugada: number;

  @Prop({ required: true, min: 1 })
  montoApostado: number;

  @Prop({ required: true })
  gananciaPotencial: number;

  @Prop({ 
    required: true, 
    enum: ['PENDIENTE', 'GANADA', 'PERDIDA', 'ANULADA'], 
    default: 'PENDIENTE' 
  })
  estado: string;

  @Prop({ required: false })
  resueltoEn?: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
```

### 4.2. DTO de Apuesta (`apuestas-api/src/apuestas/dto/create-apuesta.dto.ts`)
```typescript
import { IsIn, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateApuestaDto {
  @IsNotEmpty()
  @IsString()
  eventoId: string;

  @IsNotEmpty()
  @IsIn(['LOCAL', 'EMPATE', 'VISITANTE'])
  seleccion: 'LOCAL' | 'EMPATE' | 'VISITANTE';

  @IsNumber()
  @IsPositive({ message: 'El monto de la apuesta debe ser mayor a 0' })
  monto: number;
}
```

### 4.3. Servicio Reactivo Betslip (`apuestas-web/src/app/domains/apuestas/betslip.service.ts`)
Este servicio es el puente de comunicación en Angular:
```typescript
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Observable, tap } from 'rxjs';
import { Evento, OpcionSeleccionada } from '../eventos/evento.model';
import { TicketApuesta } from './apuesta.model';
import { API_BASE_URL } from '../api.config';

export interface SeleccionActiva {
  evento: Evento;
  opcion: OpcionSeleccionada;
  cuota: number;
}

@Injectable({ providedIn: 'root' })
export class BetslipService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/apuestas`;

  // Signals de estado
  readonly seleccion = signal<SeleccionActiva | null>(null);
  readonly montoApostado = signal<number>(10);

  // Notificador para que el Header (Módulo 3) refresque el saldo
  readonly apuestaConfirmada$ = new Subject<void>();

  // Ganancia computada automáticamente
  readonly gananciaPotencial = computed(() => {
    const sel = this.seleccion();
    const monto = this.montoApostado();
    if (!sel || monto <= 0) return 0;
    return Number((monto * sel.cuota).toFixed(2));
  });

  // Método que invoca el Integrante 1 desde la Cartelera
  seleccionarCuota(evento: Evento, opcion: OpcionSeleccionada) {
    const cuota = opcion === 'LOCAL' 
      ? evento.cuotas.local 
      : opcion === 'EMPATE' 
        ? evento.cuotas.empate 
        : evento.cuotas.visitante;

    this.seleccion.set({ evento, opcion, cuota });
  }

  limpiarSeleccion() {
    this.seleccion.set(null);
  }

  setMonto(nuevoMonto: number) {
    this.montoApostado.set(nuevoMonto);
  }

  // Enviar apuesta al backend
  enviarApuesta(): Observable<TicketApuesta> {
    const sel = this.seleccion();
    const monto = this.montoApostado();

    return this.http.post<TicketApuesta>(this.apiUrl, {
      eventoId: sel?._id,
      seleccion: sel?.opcion,
      monto
    }).pipe(
      tap(() => {
        this.limpiarSeleccion();
        this.apuestaConfirmada$.next(); // Notifica al Módulo 3
      })
    );
  }
}
```

---

## 5. Integración con los otros módulos

### Con Módulo 1 (Cartelera):
El Integrante 1 inyecta tu `BetslipService` y llama a `seleccionarCuota(evento, opcion)`. Tu signal `seleccion` se actualizará automáticamente y la UI del cupón se abrirá con el partido.

### Con Módulo 3 (Billetera / Saldo):
* **En el Backend:** Tu `apuestas.service.ts` inyecta `UsuarioService` para llamar a `debitarSaldo('usr-demo', dto.monto)` antes de crear el ticket. Si no hay saldo, lanza un `BadRequestException('Saldo insuficiente')`.
* **En el Frontend:** Cuando tu método `enviarApuesta()` tiene éxito, emite `apuestaConfirmada$.next()`. El Integrante 3 se suscribe a este observable en su Header para volver a consultar el saldo automáticamente.

---

## 6. Flujo de Trabajo en Git

1. Crear tu rama:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/modulo-betslip
   ```
2. Realizar commits frecuentes referenciando el Issue #2:
   ```bash
   git commit -m "feat(apuestas): esquema de tickets y endpoint POST /apuestas (#2)"
   git commit -m "feat(betslip): servicio con signals y calculo reactivo de ganancia (#2)"
   git commit -m "feat(betslip): componente visual del cupon con manejo de errores (#2)"
   ```
3. Subir rama y abrir Pull Request:
   ```bash
   git push origin feature/modulo-betslip
   ```
