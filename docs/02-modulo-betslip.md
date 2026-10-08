# 📕 Guía de Implementación: Módulo 2 — Motor de Apuestas & Cupón (Betslip)

> **Responsable:** Integrante 2  
> **Rama Git:** `feature/modulo-betslip`  
> **Issue en GitHub:** `Issue #2: [Módulo 2] Motor de cálculo de cuotas y panel interactivo del cupón de apuestas`  
> **Enfoque:** Full-Stack del Feature (Base de datos + API NestJS + Componente Betslip Angular)

---

## 1. Misión de tu Módulo

Eres el dueño del **corazón del juego: la colocación de la apuesta**. Tu trabajo consiste en:
1. **En Base de Datos (Mongoose):** Diseñar la colección `tickets` donde se guardan los boletos apostados con su cuota congelada y estado `PENDIENTE`.
2. **En Backend (NestJS):** Validar que el monto sea mayor a 0, calcular la ganancia matemática ($\text{Monto} \times \text{Cuota}$), generar el ticket y guardarlo.
3. **En Frontend (Angular):** Crear el panel lateral flotante (*Betslip*). Cuando el usuario hace clic en una cuota en la cartelera, tu cupón debe mostrar el partido, permitir tipear el monto y calcular en tiempo real con **Signals** la ganancia potencial.

---

## 2. Requisitos Funcionales a Cumplir

* **RF2.1 (Persistencia de Boletos):** Guardar en MongoDB cada ticket con `usuarioId`, `eventoId`, resumen del partido, `seleccion` ('LOCAL', 'EMPATE', 'VISITANTE'), `cuotaJugada`, `montoApostado`, `gananciaPotencial` y estado `PENDIENTE`.
* **RF2.2 (API de Apuestas):** `POST /api/apuestas` recibe el evento, selección y monto. Valida los datos y devuelve el ticket creado.
* **RF2.3 (Servicio Reactivo Betslip):** En Angular, crear `betslip.service.ts` usando **Signals** para gestionar la selección activa, el monto y la ganancia computada automáticamente:
  $$\text{gananciaPotencial} = \text{monto} \times \text{cuota}$$
* **RF2.4 (Componente Betslip):** Renderizar el panel lateral derecho con el partido seleccionado, input numérico de monto, ganancia calculada y botón "Confirmar Apuesta". Si el cupón está vacío, mostrar mensaje amigable *"Selecciona una cuota para comenzar"*.

---

## 3. Archivos que vas a crear en tu rama

### En el Backend (`apuestas-api/src/apuestas/`):
```text
apuestas-api/src/apuestas/
├── schemas/ticket.schema.ts      ← Esquema Mongoose de tickets
├── dto/create-apuesta.dto.ts     ← Validación con class-validator
├── apuestas.service.ts           ← Lógica de cálculo y emisión
├── apuestas.controller.ts        ← Endpoint POST /api/apuestas
└── apuestas.module.ts            ← Módulo de NestJS (importar en app.module.ts)
```

### En el Frontend (`apuestas-web/src/app/`):
```text
apuestas-web/src/app/
├── domains/apuestas/
│   └── betslip.service.ts        ← Signal Store reactivo del cupón
└── features/betslip/
    ├── betslip.ts                ← Componente Angular Standalone
    ├── betslip.html              ← Template con formulario interactivo
    └── betslip.scss              ← Estilos dark theme
```

---

## 4. Guía Paso a Paso para Desarrollar

### Paso 1: Crear tu rama en Git
```bash
git checkout main
git pull origin main
git checkout -b feature/modulo-betslip
```

### Paso 2: Desarrollar el Backend
1. **Esquema (`ticket.schema.ts`):** Define los campos del boleto según el contrato [`00-contrato-global-mvp.md`](./00-contrato-global-mvp.md).
2. **DTO (`create-apuesta.dto.ts`):** Valida que `monto` sea `@IsPositive()` y `seleccion` sea `'LOCAL' | 'EMPATE' | 'VISITANTE'`.
3. **Servicio y Controlador:** Crea `POST /api/apuestas` que reciba el DTO, calcule la ganancia potencial y guarde el ticket en la base de datos.
4. **Importar módulo:** Agrega `ApuestasModule` a `app.module.ts`.

### Paso 3: Desarrollar el Frontend
1. **Servicio (`betslip.service.ts`):** Usa Angular Signals:
   ```typescript
   readonly seleccion = signal<any | null>(null);
   readonly monto = signal<number>(10);
   readonly ganancia = computed(() => {
     const s = this.seleccion();
     return s ? Number((this.monto() * s.cuota).toFixed(2)) : 0;
   });
   ```
2. **Componente Betslip (`betslip.ts`):**
   * Enlaza el input al signal `monto`.
   * Muestra la ganancia reactiva.
   * El botón "Apostar" debe invocar la creación del ticket.
3. **Insertar en la vista principal:** En `app.html`, reemplaza el placeholder del betslip por `<app-betslip></app-betslip>`.

---

## 5. Criterio de Finalización y Commits

Haz commits frecuentes referenciando el Issue #2:
```bash
git commit -m "feat(apuestas): esquema de tickets y endpoint de emision (#2)"
git commit -m "feat(betslip): servicio reactivo con signals para calculo de ganancia (#2)"
git commit -m "feat(betslip): componente visual del cupon de apuestas (#2)"
```

Al terminar, sube tu rama y abre tu Pull Request hacia `main`:
```bash
git push origin feature/modulo-betslip
```
