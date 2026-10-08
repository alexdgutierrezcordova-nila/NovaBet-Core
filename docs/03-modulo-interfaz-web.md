# 📗 Guía de Implementación: Módulo 3 — Interfaz Web y Experiencia del Usuario (UI/UX)

> **Rol Asignado:** Integrante 3 (Especialista en Frontend y Presentación)  
> **Rama Git:** `feature/modulo-interfaz-web`  
> **Issue de GitHub:** `Issue #3: [UI] Maquetación web moderna, cartelera deportiva interactiva y cupón de apuestas`  
> **Tecnologías:** Angular 22.0.5 (Standalone Components, Signals, SCSS, OnPush)  

---

## 1. Objetivo del Módulo

Construir la aplicación web completa del lado del cliente. Tu objetivo es lograr una interfaz visualmente impactante, con diseño moderno tipo casa de apuestas profesional (Dark Mode, tipografía nítida, tarjetas con sombras suaves y acentos verdes/dorados), y un cupón de apuestas (*Betslip*) reactivo en tiempo real con **Angular Signals**.

> 💡 **Trabajo sin bloqueos:** Puedes maquetar y probar el 100% de la web desde el minuto 1 usando el archivo de datos simulados (*Mock*) provisto abajo. No necesitas esperar a que el backend esté listo.

---

## 2. Requisitos a Implementar

### 2.1. Requisitos Funcionales (RF)
* **RF3.1 (Header y Saldo Virtual):** Barra superior fija con el logo **BetPulse**, indicador del saldo disponible (\$1,000.00) y botón para "+ Recargar Saldo" que abra un diálogo interactivo.
* **RF3.2 (Cartelera Deportiva):** Renderizar los partidos en tarjetas atractivas con:
  * Liga y hora del partido.
  * Equipos con tipografía destacada.
  * 3 botones de cuota interactivos: **1 (Local)**, **X (Empate)** y **2 (Visitante)**.
  * Al hacer clic en una cuota, el botón debe iluminarse y añadirse al Betslip.
* **RF3.3 (Boleto de Apuesta / Betslip Reactivo):** Panel lateral derecho que:
  * Muestra el partido seleccionado, el mercado y el valor de la cuota.
  * Permite ingresar el monto a apostar mediante un `<input type="number">`.
  * Calcula y muestra en tiempo real la **Ganancia Potencial** ($\text{Monto} \times \text{Cuota}$).
  * Botón "Confirmar Apuesta" que valida fondos suficientes y descuenta el saldo.
* **RF3.4 (Historial de Tickets):** Sección o modal para visualizar las apuestas activas e históricas con badges de color según su estado:
  * 🟡 `PENDIENTE` (Amarillo)
  * 🟢 `GANADA` (Verde)
  * 🔴 `PERDIDA` (Rojo)

---

## 3. Estructura de Archivos a Crear

Respetando el estándar de nomenclatura del proyecto (componentes como `nombre.ts` sin `.component.ts`):

```text
apuestas-web/src/app/
├── domains/
│   ├── apuestas/
│   │   ├── apuesta.model.ts
│   │   └── betslip.service.ts         ← Maneja el estado reactivo con Signals
│   └── eventos/
│       ├── evento.model.ts
│       ├── eventos.mock.ts            ← Mock inicial para no esperar al backend
│       └── eventos.service.ts
├── shared/
│   └── ui/
│       ├── header/
│       │   ├── header.ts
│       │   ├── header.html
│       │   └── header.scss
│       └── badge/
│           ├── badge.ts
│           └── badge.html
└── features/
    ├── cartelera/
    │   ├── cartelera.ts
    │   ├── cartelera.html
    │   └── cartelera.scss
    ├── betslip/
    │   ├── betslip.ts
    │   ├── betslip.html
    │   └── betslip.scss
    └── historial-apuestas/
        ├── historial-apuestas.ts
        ├── historial-apuestas.html
        └── historial-apuestas.scss
```

---

## 4. Implementación Técnica

### 4.1. Datos Simulados Iniciales (`domains/eventos/eventos.mock.ts`)
Con este archivo puedes desarrollar toda la interfaz sin necesidad de encender el backend:

```typescript
import { Evento } from './evento.model';

export const EVENTOS_MOCK: Evento[] = [
  {
    id: '1',
    deporte: 'Fútbol',
    liga: 'UEFA Champions League',
    equipoLocal: 'Real Madrid',
    equipoVisitante: 'Manchester City',
    fecha: '2026-10-15T19:00:00Z',
    cuotas: { local: 2.15, empate: 3.40, visitante: 2.90 },
    estado: 'PROGRAMADO',
    resultado: 'SIN_RESULTADO'
  },
  {
    id: '2',
    deporte: 'Fútbol',
    liga: 'UEFA Champions League',
    equipoLocal: 'Bayern Múnich',
    equipoVisitante: 'Arsenal',
    fecha: '2026-10-16T19:00:00Z',
    cuotas: { local: 1.95, empate: 3.50, visitante: 3.60 },
    estado: 'PROGRAMADO',
    resultado: 'SIN_RESULTADO'
  },
  {
    id: '3',
    deporte: 'Fútbol',
    liga: 'Premier League',
    equipoLocal: 'Liverpool',
    equipoVisitante: 'Chelsea',
    fecha: '2026-10-17T16:30:00Z',
    cuotas: { local: 1.65, empate: 3.90, visitante: 4.80 },
    estado: 'PROGRAMADO',
    resultado: 'SIN_RESULTADO'
  }
];
```

---

### 4.2. Servicio del Cupón de Apuestas con Signals (`domains/apuestas/betslip.service.ts`)
Gestiona el estado reactivo del cupón en memoria:

```typescript
import { Injectable, signal, computed } from '@angular/core';
import { Evento, OpcionSeleccionada } from '../eventos/evento.model';

export interface SeleccionActiva {
  evento: Evento;
  opcion: OpcionSeleccionada;
  cuota: number;
}

@Injectable({ providedIn: 'root' })
export class BetslipService {
  // Signals de estado
  readonly seleccion = signal<SeleccionActiva | null>(null);
  readonly montoApostado = signal<number>(10);
  readonly saldoUsuario = signal<number>(1000);

  // Signal computada: Ganancia Potencial automática
  readonly gananciaPotencial = computed(() => {
    const sel = this.seleccion();
    const monto = this.montoApostado();
    if (!sel || monto <= 0) return 0;
    return Number((monto * sel.cuota).toFixed(2));
  });

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

  debitarSaldo(monto: number): boolean {
    if (this.saldoUsuario() < monto) return false;
    this.saldoUsuario.update(s => s - monto);
    return true;
  }

  recargarSaldo(monto: number) {
    this.saldoUsuario.update(s => s + monto);
  }
}
```

---

### 4.3. Estética Visual Recomendada (SCSS / Dark Theme)
Aplica estas variables para lograr la apariencia de casas de apuestas profesionales:

```scss
// Paleta de colores recomendada en styles.scss
$bg-primary: #0b0e14;     // Fondo principal oscuro profundo
$bg-surface: #151c28;     // Tarjetas de partidos y contenedores
$bg-surface-hover: #1e2838;
$accent-neon: #00e676;    // Verde neón para cuotas seleccionadas y ganancias
$accent-gold: #ffb300;    // Dorado para cupones y saldos
$text-primary: #f8fafc;   // Blanco nítido
$text-muted: #94a3b8;     // Gris claro para subtítulos y ligas
$border-color: #243042;
```

---

## 5. Flujo de Trabajo en Git para Integrante 3

1. Crear la rama desde `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/modulo-interfaz-web
   ```
2. Realizar commits frecuentes referenciando el Issue #3:
   ```bash
   git commit -m "feat(ui): layout base con dark theme y header con balance (#3)"
   git commit -m "feat(cartelera): renderizado de tarjetas de partidos y seleccion de cuotas (#3)"
   git commit -m "feat(betslip): panel lateral reactivo con calculo en tiempo real (#3)"
   git commit -m "feat(historial): visualizacion de tickets apostados y estados (#3)"
   ```
3. Subir rama y abrir Pull Request:
   ```bash
   git push origin feature/modulo-interfaz-web
   ```
