# 📕 Guía de Implementación: Módulo 2 — Motor de Apuestas y Reglas de Negocio

> **Rol Asignado:** Integrante 2 (Especialista en Lógica de Negocio y Backend)  
> **Rama Git:** `feature/modulo-motor-apuestas`  
> **Issue de GitHub:** `Issue #2: [Lógica] Motor de cálculo de apuestas, gestión de saldo virtual y emisión de tickets`  
> **Tecnologías:** NestJS 11.1.9 + MongoDB (Mongoose 8.20.2)  

---

## 1. Objetivo del Módulo

Construir el núcleo financiero y operativo de la plataforma. Tu responsabilidad es controlar el saldo del usuario (billetera virtual), validar y emitir boletos de apuestas (tickets), calcular ganancias potenciales de forma inmutable y ejecutar la liquidación de premios cuando se resuelven partidos.

---

## 2. Requisitos a Implementar

### 2.1. Requisitos Funcionales (RF)
* **RF2.1 (Monedero Virtual):** El sistema debe gestionar el saldo de un usuario ficticio principal (iniciando con \$1,000.00 USD) y permitir recargar saldo mediante `POST /api/usuario/recargar`.
* **RF2.2 (Validación de Fondos y Monto):** Al intentar apostar, el sistema debe rechazar la operación si:
  * El monto es menor o igual a 0.
  * El monto excede el saldo actual del usuario.
* **RF2.3 (Cálculo y Emisión de Ticket):**
  * Calcular la ganancia potencial: $\text{Ganancia} = \text{Monto Apostado} \times \text{Cuota}$.
  * Debitar el monto apostado del saldo del usuario inmediatamente.
  * Crear el ticket en estado `PENDIENTE`.
* **RF2.4 (Historial de Apuestas):** Exponer `GET /api/apuestas/historial` para consultar todos los tickets del usuario con sus estados.
* **RF2.5 (Motor de Liquidación de Ganancias):** Al resolverse un evento (cuando Módulo 1 marca el resultado):
  * Identificar todos los tickets pendientes vinculados a ese `eventoId`.
  * Si `ticket.seleccion === evento.resultado` $\rightarrow$ marcar `GANADA` y sumar `gananciaPotencial` al saldo del usuario.
  * Si no coincide $\rightarrow$ marcar `PERDIDA`.

### 2.2. Requisitos No Funcionales (RNF)
* **RNF2.1 (Integridad de Billetera):** El saldo del usuario nunca puede quedar negativo bajo ninguna condición de carrera o validación.
* **RNF2.2 (Inmutabilidad de Cuota):** La cuota registrada en el ticket queda congelada en el momento de la apuesta y no puede alterarse.

---

## 3. Estructura de Archivos a Crear

Trabajarás en el backend dentro de `apuestas-api/src/apuestas/` y `apuestas-api/src/usuario/`:

```text
apuestas-api/src/
├── usuario/
│   ├── schemas/
│   │   └── usuario.schema.ts
│   ├── dto/
│   │   └── recargar-saldo.dto.ts
│   ├── usuario.service.ts
│   ├── usuario.controller.ts
│   └── usuario.module.ts
└── apuestas/
    ├── schemas/
    │   └── ticket.schema.ts
    ├── dto/
    │   └── create-apuesta.dto.ts
    ├── apuestas.service.ts
    ├── apuestas.controller.ts
    └── apuestas.module.ts
```

---

## 4. Implementación Técnica

### 4.1. Esquema del Ticket (`apuestas/schemas/ticket.schema.ts`)
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TicketDocument = Ticket & Document;

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ required: true })
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

---

### 4.2. DTO de Creación de Apuesta (`apuestas/dto/create-apuesta.dto.ts`)
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
  @IsPositive({ message: 'El monto a apostar debe ser mayor a 0' })
  monto: number;
}
```

---

### 4.3. Lógica del Servicio de Apuesta (`apuestas/apuestas.service.ts`)
```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
// Inyectar Model<TicketDocument>, Model<EventoDocument> y UsuarioService

@Injectable()
export class ApuestasService {
  async crearApuesta(dto: CreateApuestaDto, usuarioId: string) {
    // 1. Buscar el evento y validar que esté disponible
    const evento = await this.eventoModel.findById(dto.eventoId);
    if (!evento || evento.estado !== 'PROGRAMADO') {
      throw new BadRequestException('El evento no está disponible para apuestas');
    }

    // 2. Extraer la cuota según la selección
    const cuota = dto.seleccion === 'LOCAL' 
      ? evento.cuotas.local 
      : dto.seleccion === 'EMPATE' 
        ? evento.cuotas.empate 
        : evento.cuotas.visitante;

    // 3. Verificar y debitar saldo del usuario
    const gananciaPotencial = Number((dto.monto * cuota).toFixed(2));
    await this.usuarioService.debitarSaldo(usuarioId, dto.monto);

    // 4. Crear y guardar el ticket
    const ticket = new this.ticketModel({
      usuarioId,
      eventoId: evento._id,
      eventoResumen: {
        partido: `${evento.equipoLocal} vs ${evento.equipoVisitante}`,
        liga: evento.liga
      },
      seleccion: dto.seleccion,
      cuotaJugada: cuota,
      montoApostado: dto.monto,
      gananciaPotencial,
      estado: 'PENDIENTE'
    });

    return await ticket.save();
  }

  async liquidarTicketsDeEvento(eventoId: string, resultadoGanador: string) {
    const tickets = await this.ticketModel.find({ eventoId, estado: 'PENDIENTE' });

    for (const ticket of tickets) {
      if (ticket.seleccion === resultadoGanador) {
        ticket.estado = 'GANADA';
        // Acreditar premio al usuario
        await this.usuarioService.acreditarSaldo(ticket.usuarioId, ticket.gananciaPotencial);
      } else {
        ticket.estado = 'PERDIDA';
      }
      ticket.resueltoEn = new Date();
      await ticket.save();
    }
  }
}
```

---

## 5. Endpoints a Entregar

| Verbo | Ruta | Body (JSON) | Respuesta Exitosa |
|---|---|---|---|
| `GET` | `/api/usuario/perfil` | Ninguno | `200 OK` con datos y saldo actual |
| `POST` | `/api/usuario/recargar` | `{"monto": 500}` | `200 OK` con saldo actualizado |
| `POST` | `/api/apuestas` | `{"eventoId": "...", "seleccion": "LOCAL", "monto": 50}` | `201 Created` con el ticket emitido |
| `GET` | `/api/apuestas/historial` | Ninguno | `200 OK` con lista de tickets |

---

## 6. Flujo de Trabajo en Git para Integrante 2

1. Crear la rama desde `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/modulo-motor-apuestas
   ```
2. Commits descriptivos referenciando el Issue #2:
   ```bash
   git commit -m "feat(usuario): servicio de billetera y control de balance virtual (#2)"
   git commit -m "feat(apuestas): validacion de monto, calculo de ganancia y emision de tickets (#2)"
   git commit -m "feat(apuestas): algoritmo de liquidacion de tickets ganados y perdidos (#2)"
   ```
3. Subir rama y abrir Pull Request:
   ```bash
   git push origin feature/modulo-motor-apuestas
   ```
