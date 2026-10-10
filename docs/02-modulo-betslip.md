# 📕 Guía de Implementación: Módulo 2 — Motor de Apuestas & Cupón Reactivo (Betslip)

> **Responsable:** Integrante 2 (Carlos)  
> **Rama Git:** `feature/modulo-betslip`  
> **Issue en GitHub:** `Issue #2: [Módulo 2] Motor transaccional de apuestas, control de versiones y cupón reactivo`  
> **Enfoque:** Full-Stack del Feature (Tickets en MongoDB con Transacciones ACID + API NestJS + Betslip Angular con Signals)

---

## 1. Misión de tu Módulo en la Arquitectura v2

Carlos, eres el guardián de la **emisión de boletos y la integridad de las apuestas**. En este diseño v2 profesional, tu módulo resuelve los problemas que quiebran a las casas de apuestas reales:
1. **En Base de Datos (Mongoose):** Diseñar la colección `tickets` asegurando claves de idempotencia (`idempotencyKey`) para que un doble clic accidental del usuario nunca le cobre dos veces.
2. **En Backend (NestJS):**
   - Implementar `POST /api/apuestas` dentro de una **Transacción ACID de MongoDB** (`session.withTransaction()`).
   - Validar que el mercado no esté `SUSPENDIDO` (HTTP 423).
   - Validar que la cuota que el usuario vio en pantalla coincida con `cuotasVersion` en la base de datos (HTTP 409).
   - Comunicarte atómicamente con `BilleteraService` (Módulo 3) pasando la `session` de MongoDB para que el débito y la creación del boleto ocurran juntos o se reviertan juntos.
3. **En Frontend (Angular):**
   - Construir el panel flotante lateral (*Betslip*) usando **Signals**.
   - Conectar tu interfaz al stream de Server-Sent Events (SSE) que te entregará el Integrante 1 (con un Mock funcional desde el día 1) para ver cómo las cuotas parpadean en verde/rojo y el botón se desactiva si el mercado se suspende.
   - Manejar todo el dinero internamente en **centavos enteros** para evitar errores de coma flotante.

---

## 2. Requisitos Funcionales a Cumplir

* **RF2.1 (Persistencia Transaccional de Boletos):** Guardar cada boleto con `montoCentavos`, `cuotaJugada`, `cuotasVersion`, `idempotencyKey`, `gananciaPotencialCentavos` y estado `PENDIENTE`.
* **RF2.2 (API de Apuestas con Transacción ACID):** `POST /api/apuestas` recibe `{ eventoId, seleccion, montoCentavos, cuotasVersion, idempotencyKey }`. Si la `idempotencyKey` ya existe, devuelve el ticket creado anteriormente con `200 OK` sin volver a cobrar.
* **RF2.3 (Protección contra Cuotas Obsoletas y Suspensión):** Si `cuotasVersion` no coincide con la del mercado actual, responde con `409 Conflict` enviando la cuota vigente. Si el mercado está `SUSPENDIDO`, responde con `423 Locked`.
* **RF2.4 (Servicio Reactivo Betslip):** En Angular, `betslip.service.ts` calcula la ganancia en tiempo real multiplicando los centavos por la cuota y emite `apuestaConfirmada$` para que el Header (Módulo 3) refresque el saldo.

---

## 3. Archivos que vas a crear en tu rama

### En el Backend (`apuestas-api/src/apuestas/`):
```text
apuestas-api/src/apuestas/
├── schemas/ticket.schema.ts         ← Esquema Mongoose con índices de idempotencia
├── dto/create-apuesta.dto.ts        ← DTO con validaciones @IsInt, @IsPositive, @IsUUID
├── apuestas.service.ts              ← Lógica transaccional con session.withTransaction()
├── apuestas.controller.ts           ← POST /api/apuestas y GET /api/apuestas/historial
└── apuestas.module.ts               ← Módulo importando MongooseModule y BilleteraModule
```

### En el Frontend (`apuestas-web/src/app/`):
```text
apuestas-web/src/app/
├── domains/apuestas/
│   ├── apuesta.model.ts             ← Interfaz TicketApuesta
│   └── betslip.service.ts           ← Signals Store reactivo y llamada HTTP
└── features/betslip/
    ├── betslip.ts                   ← Componente Angular Standalone OnPush
    ├── betslip.html                 ← Cupón con input, alerta de cambio de cuota y botón
    └── betslip.scss                 ← Estilos dark theme con variables CSS
```

---

## 4. Esquema Mongoose Oficial (`schemas/ticket.schema.ts`)

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TicketDocument = Ticket & Document;

@Schema({ _id: false })
export class EventoResumen {
  @Prop({ required: true })
  partido: string;

  @Prop({ required: true })
  liga: string;
}

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ required: true, default: 'usr-demo' })
  usuarioId: string;

  @Prop({ type: Types.ObjectId, ref: 'Evento', required: true })
  eventoId: Types.ObjectId;

  @Prop({ type: EventoResumen, required: true })
  eventoResumen: EventoResumen;

  @Prop({ required: true, enum: ['LOCAL', 'EMPATE', 'VISITANTE'] })
  seleccion: 'LOCAL' | 'EMPATE' | 'VISITANTE';

  @Prop({ required: true, min: 1.01 })
  cuotaJugada: number;

  @Prop({ required: true })
  cuotasVersion: number;

  @Prop({ required: true, min: 100 }) // Mínimo 100 centavos ($1.00 USD)
  montoCentavos: number;

  @Prop({ required: true })
  gananciaPotencialCentavos: number;

  @Prop({ 
    required: true, 
    enum: ['PENDIENTE', 'GANADA', 'PERDIDA', 'ANULADA'], 
    default: 'PENDIENTE' 
  })
  estado: string;

  @Prop({ required: true })
  idempotencyKey: string;

  @Prop({ required: false })
  resueltoEn?: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

// Índices indispensables:
TicketSchema.index({ usuarioId: 1, idempotencyKey: 1 }, { unique: true });
TicketSchema.index({ eventoId: 1, estado: 1 });
TicketSchema.index({ usuarioId: 1, createdAt: -1 });
```

---

## 5. DTO de Apuesta con Validaciones (`dto/create-apuesta.dto.ts`)

```typescript
import { IsIn, IsInt, IsNotEmpty, IsPositive, IsString, IsUUID } from 'class-validator';

export class CreateApuestaDto {
  @IsNotEmpty()
  @IsString()
  eventoId: string;

  @IsNotEmpty()
  @IsIn(['LOCAL', 'EMPATE', 'VISITANTE'])
  seleccion: 'LOCAL' | 'EMPATE' | 'VISITANTE';

  @IsInt({ message: 'El monto debe expresarse en centavos enteros' })
  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  montoCentavos: number;

  @IsInt()
  @IsPositive()
  cuotasVersion: number;

  @IsNotEmpty()
  @IsString()
  idempotencyKey: string; // Generado en el frontend
}
```

---

## 6. Lógica Transaccional en el Backend (`apuestas.service.ts`)

Así es como coordinas la transacción ACID con el Módulo 3 de Billetera:

```typescript
import { Injectable, BadRequestException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Ticket, TicketDocument } from './schemas/ticket.schema';
import { CreateApuestaDto } from './dto/create-apuesta.dto';
import { BilleteraService } from '../billetera/billetera.service';
import { Mercado, MercadoDocument } from '../cuotas/schemas/mercado.schema';

@Injectable()
export class ApuestasService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(Mercado.name) private readonly mercadoModel: Model<MercadoDocument>,
    private readonly billeteraService: BilleteraService
  ) {}

  async crearApuesta(usuarioId: string, dto: CreateApuestaDto) {
    // 1. Verificar idempotencia rápida
    const ticketExistente = await this.ticketModel.findOne({
      usuarioId,
      idempotencyKey: dto.idempotencyKey
    });
    if (ticketExistente) {
      return ticketExistente; // Devuelve el ticket ya emitido sin cobrar doble
    }

    // 2. Validar estado y versión del mercado
    const mercado = await this.mercadoModel.findOne({ eventoId: dto.eventoId });
    if (!mercado) {
      throw new BadRequestException('El mercado para este evento no existe');
    }

    if (mercado.estadoMercado !== 'ABIERTO') {
      throw new HttpException(
        { statusCode: 423, message: 'Mercado suspendido temporalmente por incidente' },
        HttpStatus.LOCKED
      );
    }

    if (mercado.cuotasVersion !== dto.cuotasVersion) {
      throw new ConflictException({
        statusCode: 409,
        message: 'La cuota ha cambiado',
        cuotaActualizada: mercado.cuotas,
        cuotasVersionActual: mercado.cuotasVersion
      });
    }

    const cuotaElegida = dto.seleccion === 'LOCAL' 
      ? mercado.cuotas.local 
      : dto.seleccion === 'EMPATE' 
        ? mercado.cuotas.empate 
        : mercado.cuotas.visitante;

    const gananciaCentavos = Math.round(dto.montoCentavos * cuotaElegida);

    // 3. Ejecutar Transacción ACID de MongoDB
    const session = await this.connection.startSession();
    try {
      let nuevoTicket: TicketDocument;
      await session.withTransaction(async () => {
        // A. Debitar de la billetera en la MISMA sesión
        await this.billeteraService.debitarSaldo(
          usuarioId, 
          dto.montoCentavos, 
          dto.idempotencyKey, 
          session
        );

        // B. Crear el ticket en la MISMA sesión
        const tickets = await this.ticketModel.create([{
          usuarioId,
          eventoId: dto.eventoId,
          eventoResumen: { partido: 'Partido en vivo', liga: 'Liga Pro' },
          seleccion: dto.seleccion,
          cuotaJugada: cuotaElegida,
          cuotasVersion: dto.cuotasVersion,
          montoCentavos: dto.montoCentavos,
          gananciaPotencialCentavos: gananciaCentavos,
          estado: 'PENDIENTE',
          idempotencyKey: dto.idempotencyKey
        }], { session });

        nuevoTicket = tickets[0];
      });

      return nuevoTicket;
    } finally {
      await session.endSession();
    }
  }
}
```

---

## 7. Servicio Reactivo en Angular (`betslip.service.ts`)

```typescript
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/core/http';
import { Subject, Observable, catchError, throwError, tap } from 'rxjs';
import { Evento } from '../eventos/evento.model';
import { Mercado, OpcionSeleccionada } from '../cuotas/mercado.model';
import { TicketApuesta } from './apuesta.model';
import { API_BASE_URL } from '../api.config';

export interface SeleccionActiva {
  evento: Evento;
  mercado: Mercado;
  opcion: OpcionSeleccionada;
  cuota: number;
}

@Injectable({ providedIn: 'root' })
export class BetslipService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/apuestas`;

  readonly seleccion = signal<SeleccionActiva | null>(null);
  readonly montoUSD = signal<number>(10); // En dólares para el input del usuario
  readonly cuotaCambiadaAviso = signal<string | null>(null);

  readonly apuestaConfirmada$ = new Subject<void>();

  // Monto en centavos para enviar al backend
  readonly montoCentavos = computed(() => Math.round(this.montoUSD() * 100));

  readonly gananciaPotencialUSD = computed(() => {
    const sel = this.seleccion();
    const monto = this.montoUSD();
    if (!sel || monto <= 0) return 0;
    return Number((monto * sel.cuota).toFixed(2));
  });

  seleccionarCuota(evento: Evento, mercado: Mercado, opcion: OpcionSeleccionada) {
    const cuota = opcion === 'LOCAL' 
      ? mercado.cuotas.local 
      : opcion === 'EMPATE' 
        ? mercado.cuotas.empate 
        : mercado.cuotas.visitante;

    this.cuotaCambiadaAviso.set(null);
    this.seleccion.set({ evento, mercado, opcion, cuota });
  }

  confirmarApuesta(): Observable<TicketApuesta> {
    const sel = this.seleccion();
    if (!sel) return throwError(() => new Error('No hay selección'));

    const payload = {
      eventoId: sel.evento._id,
      seleccion: sel.opcion,
      montoCentavos: this.montoCentavos(),
      cuotasVersion: sel.mercado.cuotasVersion,
      idempotencyKey: crypto.randomUUID()
    };

    return this.http.post<TicketApuesta>(this.apiUrl, payload).pipe(
      tap(() => {
        this.seleccion.set(null);
        this.apuestaConfirmada$.next(); // Notifica al Header del Módulo 3
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 409) {
          this.cuotaCambiadaAviso.set('La cuota ha cambiado. Por favor confirma el nuevo valor.');
          // Actualizar cuota con el nuevo valor enviado por el backend
          if (err.error?.cuotaActualizada) {
            this.actualizarCuotaLocal(err.error.cuotaActualizada, err.error.cuotasVersionActual);
          }
        }
        return throwError(() => err);
      })
    );
  }

  private actualizarCuotaLocal(nuevasCuotas: any, nuevaVersion: number) {
    const actual = this.seleccion();
    if (!actual) return;
    const nuevaCuota = actual.opcion === 'LOCAL' 
      ? nuevasCuotas.local 
      : actual.opcion === 'EMPATE' 
        ? nuevasCuotas.empate 
        : nuevasCuotas.visitante;

    this.seleccion.set({
      ...actual,
      cuota: nuevaCuota,
      mercado: { ...actual.mercado, cuotasVersion: nuevaVersion, cuotas: nuevasCuotas }
    });
  }
}
```

---

## 8. ¿Cómo probar tu interfaz desde el Día 1 sin esperar a nadie?

El Integrante 1 te habilitará el endpoint Server-Sent Events (`GET /api/cuotas/stream`) con datos Mock. Abre una conexión en Angular usando `EventSource` para recibir cuotas fluctuantes, simular suspensiones y verificar que tu formulario reacciona a los errores `409 Conflict` y `423 Locked`.
