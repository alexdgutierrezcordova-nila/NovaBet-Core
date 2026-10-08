# 📗 Guía de Implementación: Módulo 3 — Billetera Virtual & Historial de Usuario

> **Responsable:** Integrante 3  
> **Rama Git:** `feature/modulo-billetera-usuario`  
> **Issue en GitHub:** `Issue #3: [Módulo 3] Gestión de saldo virtual, recargas y panel de historial de apuestas`  
> **Enfoque:** Full-Stack del Feature (Base de datos MongoDB + API NestJS + Header con Saldo & Historial Angular)

---

## 1. Misión de tu Módulo

Eres el dueño de la **billetera, el dinero del jugador y la auditoría de apuestas**. Tu trabajo consiste en:
1. **En Base de Datos (Mongoose):** Diseñar el modelo `usuario` con un balance inicial ficticio (\$1,000.00 USD para `'usr-demo'`).
2. **En Backend (NestJS):** Crear endpoints para consultar el saldo disponible, recargar saldo ficticio (`+ $500`), proveer funciones de débito/crédito que consumirá el Módulo 2 y servir el historial de boletos.
3. **En Frontend (Angular):**
   * Crear el **Header superior:** Muestra el logo **BetPulse**, el saldo actual en vivo formateado con decimales y el botón "+ Recargar". Escucha las confirmaciones de apuestas del Módulo 2 para refrescar el saldo automáticamente.
   * Crear el componente **Historial:** Muestra la lista de apuestas realizadas consumiendo `GET /api/apuestas/historial` con badges visuales de color según su estado:
     * 🟡 `PENDIENTE` (usando `var(--color-pendiente)`)
     * 🟢 `GANADA` (usando `var(--color-ganada)`)
     * 🔴 `PERDIDA` (usando `var(--color-perdida)`)

---

## 2. Requisitos Funcionales a Cumplir

* **RF3.1 (Monedero Virtual en MongoDB):** Almacenar un usuario ficticio (`usuarioId: 'usr-demo'`) con nombre, email y saldo decimal (mínimo 0). Crear un seeder en `onModuleInit()` que inserte este usuario con \$1,000.00 si no existe.
* **RF3.2 (API de Billetera):**
  * `GET /api/usuario/perfil` retorna los datos del usuario y su saldo.
  * `POST /api/usuario/recargar` permite sumar fondos al saldo.
* **RF3.3 (Header con Balance Reactivo):** Barra superior fija que consulta el saldo inicial al cargar la página y vuelve a consultarlo cada vez que se recarga dinero o el Betslip confirma una apuesta.
* **RF3.4 (Historial de Tickets):** Renderizar las apuestas recientes ordenadas por fecha descendente, indicando el partido, la opción jugada, el monto, la ganancia potencial y el estado actual.

---

## 3. Archivos que vas a crear en tu rama

### En el Backend (`apuestas-api/src/usuario/`):
```text
apuestas-api/src/usuario/
├── schemas/usuario.schema.ts     ← Esquema Mongoose del usuario y saldo
├── dto/recargar-saldo.dto.ts     ← DTO con validación @IsPositive()
├── usuario.service.ts            ← Lógica de balance, recarga, débito y crédito
├── usuario.controller.ts         ← Endpoints GET /perfil y POST /recargar
└── usuario.module.ts             ← Módulo exportando UsuarioService para Módulo 2
```

### En el Frontend (`apuestas-web/src/app/`):
```text
apuestas-web/src/app/
├── domains/usuario/
│   └── usuario.service.ts        ← Servicio HTTP para consultar y recargar saldo
├── shared/ui/header/
│   ├── header.ts                 ← Componente de cabecera que escucha eventos
│   ├── header.html               ← Template con logo y badge de saldo
│   └── header.scss               ← Estilos del header
└── features/historial/
    ├── historial.ts              ← Componente de historial que lista tickets
    ├── historial.html            ← Template con lista de tickets y badges
    └── historial.scss            ← Estilos usando var(--color-pendiente), etc.
```

---

## 4. Implementación Técnica y Modelos

### 4.1. Esquema Mongoose (`apuestas-api/src/usuario/schemas/usuario.schema.ts`)
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UsuarioDocument = Usuario & Document;

@Schema({ timestamps: true })
export class Usuario {
  @Prop({ required: true, default: 'usr-demo' })
  usuarioId: string;

  @Prop({ required: true, default: 'Apostador Demo' })
  nombre: string;

  @Prop({ required: true, default: 'demo@betpulse.com' })
  email: string;

  @Prop({ required: true, default: 1000.00, min: 0 })
  saldo: number;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);
```

### 4.2. DTO de Recarga (`apuestas-api/src/usuario/dto/recargar-saldo.dto.ts`)
```typescript
import { IsNumber, IsPositive } from 'class-validator';

export class RecargarSaldoDto {
  @IsNumber()
  @IsPositive({ message: 'El monto de recarga debe ser mayor a 0' })
  monto: number;
}
```

### 4.3. Servicio de Usuario en NestJS (`apuestas-api/src/usuario/usuario.service.ts`)
Debes exportar métodos para que el Integrante 2 pueda debitar y acreditar saldo:
```typescript
import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from './schemas/usuario.schema.js';

@Injectable()
export class UsuarioService implements OnModuleInit {
  constructor(
    @InjectModel(Usuario.name) private readonly usuarioModel: Model<UsuarioDocument>
  ) {}

  async onModuleInit() {
    const demo = await this.usuarioModel.findOne({ usuarioId: 'usr-demo' });
    if (!demo) {
      await this.usuarioModel.create({
        usuarioId: 'usr-demo',
        nombre: 'Apostador Demo',
        email: 'demo@betpulse.com',
        saldo: 1000.00
      });
      console.log('✅ [Seed]: Usuario demo inicial creado con $1,000.');
    }
  }

  async obtenerPerfil(usuarioId = 'usr-demo') {
    return this.usuarioModel.findOne({ usuarioId }).exec();
  }

  async recargarSaldo(usuarioId = 'usr-demo', monto: number) {
    return this.usuarioModel.findOneAndUpdate(
      { usuarioId },
      { $inc: { saldo: monto } },
      { new: true }
    ).exec();
  }

  async debitarSaldo(usuarioId = 'usr-demo', monto: number) {
    const user = await this.obtenerPerfil(usuarioId);
    if (!user || user.saldo < monto) {
      throw new BadRequestException('Saldo insuficiente para realizar la apuesta');
    }
    return this.usuarioModel.findOneAndUpdate(
      { usuarioId, saldo: { $gte: monto } },
      { $inc: { saldo: -monto } },
      { new: true }
    ).exec();
  }

  async acreditarSaldo(usuarioId = 'usr-demo', monto: number) {
    return this.usuarioModel.findOneAndUpdate(
      { usuarioId },
      { $inc: { saldo: monto } },
      { new: true }
    ).exec();
  }
}
```

> **IMPORTANTE:** En `usuario.module.ts`, debes colocar `exports: [UsuarioService]` para que el `ApuestasModule` del Integrante 2 pueda inyectarlo.

---

## 5. Integración en el Frontend (Refresco de Saldo e Historial)

### Cómo sincronizar el Header con el Betslip del Módulo 2:
En tu componente `header.ts`:
```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { UsuarioService } from '../../../domains/usuario/usuario.service';
import { BetslipService } from '../../../domains/apuestas/betslip.service';

export class Header implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly betslipService = inject(BetslipService);

  readonly saldo = signal<number>(1000);

  ngOnInit() {
    this.cargarSaldo();

    // Cuando el Integrante 2 confirma una apuesta, refrescamos el saldo automáticamente
    this.betslipService.apuestaConfirmada$.subscribe(() => {
      this.cargarSaldo();
    });
  }

  cargarSaldo() {
    this.usuarioService.obtenerPerfil().subscribe(usuario => {
      this.saldo.set(usuario.saldo);
    });
  }

  recargar() {
    this.usuarioService.recargarSaldo(500).subscribe(usuario => {
      this.saldo.set(usuario.saldo);
    });
  }
}
```

---

## 6. Flujo de Trabajo en Git

1. Crear tu rama:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/modulo-billetera-usuario
   ```
2. Realizar commits descriptivos referenciando el Issue #3:
   ```bash
   git commit -m "feat(usuario): esquema mongoose de usuario y seeder de $1000 (#3)"
   git commit -m "feat(usuario): endpoints GET /perfil y POST /recargar (#3)"
   git commit -m "feat(header): componente con saldo reactivo y boton de recarga (#3)"
   git commit -m "feat(historial): visualizacion de tickets apostados y estados (#3)"
   ```
3. Subir rama y abrir Pull Request:
   ```bash
   git push origin feature/modulo-billetera-usuario
   ```
