# 📗 Guía de Implementación: Módulo 3 — Billetera Virtual, Libro Mayor (Ledger) e Historial

> **Responsable:** Integrante 3  
> **Rama Git:** `feature/modulo-billetera-usuario`  
> **Issue en GitHub:** `Issue #3: [Módulo 3] Gestión de saldo virtual en centavos, libro mayor transaccional e historial`  
> **Enfoque:** Full-Stack del Feature (Billetera y Ledger en MongoDB + API NestJS con soporte para Transacciones + Header e Historial en Angular)

---

## 1. Misión de tu Módulo en la Arquitectura v2

Eres el banquero y auditor de **todo el flujo financiero y contable de NovaBet**. En esta arquitectura profesional v2, tu responsabilidad es garantizar que ningún centavo desaparezca sin dejar rastro de auditoría:
1. **En Base de Datos (Mongoose):**
   - Diseñar la colección `billeteras` para el saldo disponible del usuario en **centavos enteros** (ej. 100,000 centavos = \$1,000.00 USD).
   - Diseñar la colección inmutable `transacciones` (**Libro Mayor o Ledger**): cada recarga, cobro de apuesta, premio o devolución queda registrado como un movimiento contable con referencia única.
2. **En Backend (NestJS):**
   - Implementar `BilleteraService` con soporte para recibir una `session?: ClientSession` de MongoDB. Esto permite que Carlos (Módulo 2) ejecute débitos dentro de su transacción ACID sin riesgo de desincronización.
   - Proveer métodos seguros de débito, crédito, reembolso y *clawback* (reversión por VAR).
3. **En Frontend (Angular):**
   - **Header superior:** Muestra el logo **NovaBet**, el saldo formateado (`saldoCentavos / 100`), botón de recarga rápida y escucha a `BetslipService.apuestaConfirmada$` para actualizar el saldo sin recargar la página.
   - **Historial de Apuestas:** Lista los tickets consumiendo `GET /api/apuestas/historial` mostrando fecha nativa (`createdAt`), montos en dólares y badges de estado (`PENDIENTE`, `GANADA`, `PERDIDA`, `ANULADA`).

---

## 2. Requisitos Funcionales a Cumplir

* **RF3.1 (Persistencia de Billetera y Ledger en Centavos):** Almacenar la billetera del usuario demo (`usuarioId: 'usr-demo'`) con saldo inicial de 100,000 centavos (\$1,000.00 USD). Seeder en `onModuleInit()` que crea usuario y billetera inicial si no existen.
* **RF3.2 (API Contable y de Billetera):**
  * `GET /api/billetera/balance` retorna el saldo y estado de bloqueo.
  * `POST /api/billetera/recargar` añade centavos al saldo y registra la transacción en el ledger.
* **RF3.3 (Integración Transaccional con Carlos):** Exportar `debitarSaldo(usuarioId, montoCentavos, referenciaIdempotente, session)` para ser consumido dentro de `session.withTransaction()` de Apuestas.
* **RF3.4 (Header y Formateo en Angular):** Transformar centavos a dólares con 2 decimales para la UI.
* **RF3.5 (Historial Auditado):** Visualizar tickets ordenados por fecha descendente con estados visuales claros.

---

## 3. Archivos que vas a crear en tu rama

### En el Backend (`apuestas-api/src/billetera/`):
```text
apuestas-api/src/billetera/
├── schemas/
│   ├── billetera.schema.ts          ← Balance actual en centavos y flag bloqueada
│   └── transaccion.schema.ts        ← Libro Mayor inmutable (append-only)
├── dto/recargar-saldo.dto.ts        ← Validación @IsInt, @IsPositive
├── billetera.service.ts             ← Lógica de débito, crédito, recarga y ledger
├── billetera.controller.ts          ← Endpoints GET /balance y POST /recargar
└── billetera.module.ts              ← Exporta BilleteraService para Carlos (M2)
```

### En el Frontend (`apuestas-web/src/app/`):
```text
apuestas-web/src/app/
├── domains/billetera/
│   ├── billetera.model.ts           ← Interfaces Billetera y TransaccionLedger
│   └── billetera.service.ts         ← Cliente HTTP para balance y recargas
├── shared/ui/header/
│   ├── header.ts                    ← Cabecera reactiva suscrita a apuestaConfirmada$
│   ├── header.html                  ← Barra superior con logo, saldo y botón recargar
│   └── header.scss                  ← Estilos usando var(--bg-header), var(--accent-green)
└── features/historial/
    ├── historial.ts                 ← Lista de tickets de apuestas
    ├── historial.html               ← Tabla o tarjetas con badges de color
    └── historial.scss               ← Estilos usando var(--color-pendiente), etc.
```

---

## 4. Esquemas Mongoose Oficiales

### 4.1. Esquema Billetera (`schemas/billetera.schema.ts`)
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BilleteraDocument = Billetera & Document;

@Schema({ timestamps: true })
export class Billetera {
  @Prop({ required: true, unique: true, default: 'usr-demo' })
  usuarioId: string;

  @Prop({ required: true, default: 100000, min: 0 }) // 100,000 centavos = $1,000 USD
  saldoCentavos: number;

  @Prop({ required: true, default: false })
  bloqueada: boolean; // Se bloquea si queda en negativo por un clawback de VAR
}

export const BilleteraSchema = SchemaFactory.createForClass(Billetera);
```

### 4.2. Esquema Libro Mayor / Ledger (`schemas/transaccion.schema.ts`)
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransaccionDocument = Transaccion & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } }) // Append-only inmutable
export class Transaccion {
  @Prop({ required: true })
  usuarioId: string;

  @Prop({ 
    required: true, 
    enum: ['RECARGA', 'APUESTA', 'PREMIO', 'REEMBOLSO', 'CLAWBACK'] 
  })
  tipo: string;

  @Prop({ required: true })
  montoCentavos: number; // Positivo para recarga/premio/reembolso, negativo para apuesta/clawback

  @Prop({ required: false })
  ticketId?: string;

  @Prop({ required: true, unique: true })
  referenciaIdempotente: string; // Garantiza que una operación no se audite dos veces
}

export const TransaccionSchema = SchemaFactory.createForClass(Transaccion);
TransaccionSchema.index({ usuarioId: 1, createdAt: -1 });
```

---

## 5. Servicio de Billetera Transaccional (`billetera.service.ts`)

> **ATENCIÓN:** El parámetro `session?: ClientSession` es la clave para que Carlos pueda llamarte dentro de su transacción ACID sin romper la atomicidad.

```typescript
import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { Billetera, BilleteraDocument } from './schemas/billetera.schema';
import { Transaccion, TransaccionDocument } from './schemas/transaccion.schema';

@Injectable()
export class BilleteraService implements OnModuleInit {
  constructor(
    @InjectModel(Billetera.name) private readonly billeteraModel: Model<BilleteraDocument>,
    @InjectModel(Transaccion.name) private readonly transaccionModel: Model<TransaccionDocument>
  ) {}

  async onModuleInit() {
    const demo = await this.billeteraModel.findOne({ usuarioId: 'usr-demo' });
    if (!demo) {
      await this.billeteraModel.create({
        usuarioId: 'usr-demo',
        saldoCentavos: 100000, // $1,000.00 USD inicial
        bloqueada: false
      });
      console.log('✅ [Seed]: Billetera inicial creada con $1,000.00 USD (100,000 centavos).');
    }
  }

  async obtenerBalance(usuarioId = 'usr-demo') {
    return this.billeteraModel.findOne({ usuarioId }).exec();
  }

  // Débito transaccional llamado por el Módulo 2 de Carlos
  async debitarSaldo(
    usuarioId: string, 
    montoCentavos: number, 
    referenciaIdempotente: string, 
    session?: ClientSession
  ) {
    // 1. Descontar saldo de forma atómica condicionada
    const res = await this.billeteraModel.findOneAndUpdate(
      { 
        usuarioId, 
        bloqueada: false, 
        saldoCentavos: { $gte: montoCentavos } 
      },
      { $inc: { saldoCentavos: -montoCentavos } },
      { new: true, session }
    );

    if (!res) {
      throw new BadRequestException('Saldo insuficiente o billetera bloqueada');
    }

    // 2. Registrar en el Ledger dentro de la MISMA sesión
    await this.transaccionModel.create([{
      usuarioId,
      tipo: 'APUESTA',
      montoCentavos: -montoCentavos,
      referenciaIdempotente
    }], { session });

    return res;
  }

  // Recarga simple de saldo
  async recargarSaldo(usuarioId = 'usr-demo', montoCentavos = 50000) { // $500 USD por defecto
    const ref = `recarga-${Date.now()}-${crypto.randomUUID()}`;
    const billetera = await this.billeteraModel.findOneAndUpdate(
      { usuarioId },
      { $inc: { saldoCentavos: montoCentavos } },
      { new: true }
    );

    await this.transaccionModel.create({
      usuarioId,
      tipo: 'RECARGA',
      montoCentavos,
      referenciaIdempotente: ref
    });

    return billetera;
  }
}
```

> **IMPORTANTE:** En `billetera.module.ts`, no olvides colocar `exports: [BilleteraService]`.

---

## 6. Integración en el Frontend (Header e Historial en Angular)

### 6.1. Header Reactivo (`header.ts`)
```typescript
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BilleteraService } from '../../../domains/billetera/billetera.service';
import { BetslipService } from '../../../domains/apuestas/betslip.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header implements OnInit {
  private readonly billeteraService = inject(BilleteraService);
  private readonly betslipService = inject(BetslipService);

  readonly saldoCentavos = signal<number>(100000);

  // Formato para mostrar al usuario en dólares
  readonly saldoFormateado = computed(() => {
    return (this.saldoCentavos() / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  });

  ngOnInit() {
    this.cargarBalance();

    // Cuando Carlos confirma una apuesta en el Betslip, refrescamos automáticamente
    this.betslipService.apuestaConfirmada$.subscribe(() => {
      this.cargarBalance();
    });
  }

  cargarBalance() {
    this.billeteraService.obtenerBalance().subscribe(b => {
      this.saldoCentavos.set(b.saldoCentavos);
    });
  }

  recargar() {
    // Recargar $500 USD (50,000 centavos)
    this.billeteraService.recargarSaldo(50000).subscribe(b => {
      this.saldoCentavos.set(b.saldoCentavos);
    });
  }
}
```

### 6.2. Historial de Tickets (`historial.ts`)
En el historial, renderizas los tickets consumiendo `GET /api/apuestas/historial` usando `ticket.createdAt` y formateando los montos dividiendo entre 100:
* 🟡 `PENDIENTE` (`var(--color-pendiente)`)
* 🟢 `GANADA` (`var(--color-ganada)`)
* 🔴 `PERDIDA` (`var(--color-perdida)`)
* ⚪ `ANULADA` (`var(--text-muted)`)
