# 📘 Guía de Implementación: Módulo 1 — Catálogo de Eventos & Cartelera Deportiva

> **Responsable:** Integrante 1  
> **Rama Git:** `feature/modulo-eventos`  
> **Issue en GitHub:** `Issue #1: [Módulo 1] Catálogo de eventos deportivos y cartelera interactiva de cuotas`  
> **Enfoque:** Full-Stack del Feature (Base de datos + API NestJS + Pantalla Angular)

---

## 1. Misión de tu Módulo

Eres el dueño absoluto de los **partidos de fútbol y las cuotas**. Tu trabajo consiste en:
1. **En Base de Datos (Mongoose):** Crear el modelo de partidos y sembrar datos de prueba (Real Madrid vs City, Barcelona vs Atlético, etc.).
2. **En Backend (NestJS):** Crear los endpoints para listar partidos y para simular el resultado de un partido finalizado.
3. **En Frontend (Angular):** Crear las tarjetas visuales de los partidos con los botones de cuotas **1**, **X**, **2**. Al hacer clic en una cuota, debes emitir la selección para que el cupón de apuestas de tu compañero la capture.

---

## 2. Requisitos Funcionales a Cumplir

* **RF1.1 (Persistencia y Semilla):** Guardar partidos en MongoDB con fecha, liga, equipos y cuotas decimales (`local`, `empate`, `visitante`). Si la BD está vacía, insertar automáticamente 5 partidos de ejemplo.
* **RF1.2 (Endpoint de Consulta):** `GET /api/eventos` debe retornar los partidos ordenados por fecha.
* **RF1.3 (Simulador de Resultados):** `PATCH /api/eventos/:id/resultado` permite marcar si el partido terminó en victoria `LOCAL`, `EMPATE` o `VISITANTE` con su marcador final.
* **RF1.4 (Cartelera en Angular):** Maquetar el componente `cartelera` mostrando tarjetas modernas con modo oscuro y botones interactivos para cada cuota.

---

## 3. Archivos que vas a crear en tu rama

### En el Backend (`apuestas-api/src/eventos/`):
```text
apuestas-api/src/eventos/
├── schemas/evento.schema.ts      ← Esquema Mongoose de partidos y cuotas
├── seeds/eventos.seed.ts         ← Lista de partidos iniciales
├── dto/update-resultado.dto.ts   ← DTO para simular resultados
├── eventos.service.ts            ← Lógica de consulta y actualización
├── eventos.controller.ts         ← Controladores REST
└── eventos.module.ts             ← Módulo de NestJS (importar en app.module.ts)
```

### En el Frontend (`apuestas-web/src/app/`):
```text
apuestas-web/src/app/
├── domains/eventos/
│   └── eventos.service.ts        ← Servicio para consumir GET /api/eventos (o mock)
└── features/cartelera/
    ├── cartelera.ts              ← Componente Angular Standalone
    ├── cartelera.html            ← Template con grid de partidos
    └── cartelera.scss            ← Estilos dark theme
```

---

## 4. Guía Paso a Paso para Desarrollar

### Paso 1: Crear tu rama en Git
```bash
git checkout main
git pull origin main
git checkout -b feature/modulo-eventos
```

### Paso 2: Desarrollar el Backend
1. **Esquema (`evento.schema.ts`):** Define los campos `deporte`, `liga`, `equipoLocal`, `equipoVisitante`, `fecha`, `cuotas: { local, empate, visitante }`, `estado` ('PROGRAMADO' | 'FINALIZADO') y `resultado`.
2. **Seeder (`eventos.seed.ts`):** En `onModuleInit()` de tu servicio, si `countDocuments() === 0`, usa `insertMany()` con 4 o 5 partidos llamativos.
3. **Endpoints:** Crea `GET /api/eventos` y `PATCH /api/eventos/:id/resultado`.
4. **Importar módulo:** Agrega `EventosModule` al array `imports` de `app.module.ts`.

### Paso 3: Desarrollar el Frontend
1. **Servicio (`eventos.service.ts`):** Expón un método `obtenerEventos()`. Puedes comenzar usando una lista local en memoria (mock) y luego conectarlo con `HttpClient` a `http://localhost:3000/api/eventos`.
2. **Componente Cartelera (`cartelera.ts`):**
   * Muestra las tarjetas con `equipoLocal vs equipoVisitante`.
   * Agrega los 3 botones de cuota (`1`, `X`, `2`).
   * Al hacer clic en un botón, emite un evento con el partido y la opción elegida:
     ```typescript
     @Output() cuotaSeleccionada = new EventEmitter<{ evento: Evento, opcion: 'LOCAL' | 'EMPATE' | 'VISITANTE' }>();
     ```
3. **Insertar en la vista principal:** En `app.html`, reemplaza el placeholder de la cartelera por `<app-cartelera></app-cartelera>`.

---

## 5. Criterio de Finalización y Commits

Haz commits frecuentes referenciando el Issue #1:
```bash
git commit -m "feat(eventos): esquema mongoose y datos iniciales de partidos (#1)"
git commit -m "feat(eventos): endpoints para listar partidos y simular resultado (#1)"
git commit -m "feat(cartelera): componente angular con tarjetas de partidos y cuotas (#1)"
```

Al terminar, sube tu rama y abre tu Pull Request hacia `main`:
```bash
git push origin feature/modulo-eventos
```
