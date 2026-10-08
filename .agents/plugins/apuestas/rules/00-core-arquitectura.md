---
trigger: always_on
description: >
  Núcleo arquitectónico de la plataforma de apuestas. Define la ley de organización
  por dominio de negocio (Domain-First), el árbol objetivo prescriptivo de frontend y backend,
  las convenciones de naming y el checklist obligatorio antes de crear o mover cualquier archivo.
  Activo en todo momento.
---

# 🏛️ Núcleo Arquitectónico — Plataforma de Apuestas

## Contexto del repositorio

Este es un **monorepo** con dos proyectos en el mismo repositorio Git:

```
apuestas/                  ← raíz del repo (.git aquí)
├── apuestas-web/          ← Frontend Angular 19 (SSR)
├── apuestas-api/          ← Backend NestJS + Base de Datos (MongoDB/PostgreSQL)
└── .agents/               ← configuración de Antigravity
```

Ambos proyectos comparten el mismo repositorio. No hay repos separados. Las reglas
y globs parten desde la raíz del repo, incluyendo el prefijo `apuestas-web/`
o `apuestas-api/` según corresponda.

---

## La Ley Fundamental: Dominio primero (Domain-First)

Todo lo relacionado con un concepto de negocio (`apuestas`, `deportes`, `eventos`,
`cuotas`, `billetera`, `promociones`, `usuarios`, `dashboard`) debe agruparse junto,
sin importar si es un componente, un servicio, un modelo o un controlador.

```
❌ PROHIBIDO: carpeta services/ con múltiples archivos mezclando dominios distintos
❌ PROHIBIDO: el modelo de un dominio en un lugar, su service en otro, su UI en un tercero
❌ PROHIBIDO: duplicar una interfaz o un service HTTP entre admin y público
❌ PROHIBIDO: un componente con nombre genérico (card, form, list) fuera de su contexto
✅ CORRECTO: domains/apuestas/ contiene modelo + service; admin y público lo importan de ahí
```

---

## Árbol Objetivo PRESCRIPTIVO — Frontend Angular (`apuestas-web/src/app/`)

Este es el estado META. Todo archivo nuevo o reubicado DEBE alinearse a esta estructura:

```
core/
  guards/              → auth.guard.ts, kyc.guard.ts, unsaved-changes.guard.ts
  services/            → auth.service.ts, storage.service.ts, notification.service.ts,
                          websocket.service.ts, global-snackbar.service.ts,
                          backend-health.initializer.ts
  interceptors/        → server-error.interceptor.ts, auth.interceptor.ts

domains/               ← ÚNICA fuente de modelo + service HTTP por dominio
  apuestas/            → apuesta.model.ts, apuestas.service.ts, betslip.service.ts
  deportes/            → deporte.model.ts, deportes.service.ts
  eventos/             → evento.model.ts, eventos.service.ts
  cuotas/              → cuota.model.ts, cuotas.service.ts
  billetera/           → transaccion.model.ts, billetera.service.ts
  promociones/         → promocion.model.ts, promociones.service.ts
  usuarios/            → usuario.model.ts, usuarios.service.ts
  dashboard/           → dashboard-stats.service.ts, estadistica.model.ts

layouts/               → admin-layout/, public-layout/, auth-layout/

shared/
  ui/                  ← SOLO UI agnóstica sin conocimiento de negocio
    header/, footer/, modal/, confirm-dialog/, dropdown/,
    tabs/, loader/, badge/, countdown/, data-table/
  validators/          → custom-validators.ts

admin/
  shared/              ← reutilizado entre features admin, pero no agnóstico
    admin-header/ (+admin-header.service.ts), admin-sidebar/, admin-row-controls/,
    admin-table/, metric-card/
  features/
    dashboard/, usuarios/, gestion-apuestas/, eventos-admin/,
    cuotas-admin/, transacciones/, promociones-admin/, configuracion/

features/              ← páginas y flujos públicos
  inicio/              (hero-banner/, eventos-destacados/, deportes-nav/)
  deportes/            (lista-deportes/, liga-detalle/, evento-detalle/)
  en-vivo/             (marcador-vivo/, streaming-widget/, mercados-vivo/)
  betslip/             (cupon-apuestas/, seleccion-item/, resumen-ganancias/)
  historial/           (apuestas-activas/, apuestas-resueltas/)
  billetera/           (depositar/, retirar/, balance-card/, movimientos/)
  promociones/         (lista/, bono-detalle/)
  perfil/              (datos-personales/, kyc-verificacion/, seguridad/)
  not-found/, server-error/
```

---

## Árbol Objetivo PRESCRIPTIVO — Backend NestJS (`apuestas-api/src/`)

```
<dominio>/             ← un módulo por dominio de negocio (apuestas, deportes, eventos, etc.)
  dto/                 → create-*.dto.ts, update-*.dto.ts
  schemas/             → *.schema.ts (o entities/ si es TypeORM/Prisma)
  enums/               → *.enum.ts (estado de apuesta, tipo de transacción, etc.)
  *.controller.ts, *.module.ts, *.service.ts

common/
  helpers/             → pagination.helper.ts, odds-calculator.helper.ts
  middleware/          → request-logger.middleware.ts
  interceptors/        → response-transform.interceptor.ts
  guards/              → jwt-auth.guard.ts, roles.guard.ts
  types/               → common.types.ts

config/                → database.config.ts, jwt.config.ts, redis.config.ts
database/
  seeds/               → initial-seed.data.ts
  scripts/             → migrations...
```

---

## Checklist obligatorio antes de crear o mover cualquier archivo

Responde estas preguntas en orden antes de actuar:

1. ¿Es lógica de datos (modelo + service HTTP) de un dominio? → `domains/<dominio>/`
2. ¿Es infraestructura transversal sin relación a un dominio? → `core/` (frontend) o `common/` (backend)
3. ¿Es UI que solo aparece en el panel admin y conoce conceptos del admin? → `admin/shared/`
4. ¿Es UI 100% agnóstica, sin saber qué es una apuesta, un evento o una cuota? → `shared/ui/`
5. ¿Es una página o flujo de la zona pública/usuario? → `features/<dominio>/`
6. ¿Es una página o flujo del panel de administración? → `admin/features/<dominio>/`
7. ¿Ya existe algo con nombre o función similar? → **Verificar antes de crear.** Si existe, reutilizar o extender.

**Si ninguna categoría encaja claramente, DETENTE y consulta antes de crear.**
