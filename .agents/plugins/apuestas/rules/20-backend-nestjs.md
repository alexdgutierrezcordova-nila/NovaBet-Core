---
trigger: glob
glob: apuestas-api/src/**/*.ts
description: >
  Reglas específicas del backend NestJS de la plataforma de apuestas. Refuerza el Package-by-Feature,
  define la estructura prescriptiva para infraestructura transversal, la política de naming estándar
  de NestJS y el contrato Frontend ↔ Backend. Se activa automáticamente al editar en apuestas-api/src/.
---

# 🐈 Backend NestJS — Plataforma de Apuestas

Aplica junto con `@00-core-arquitectura.md`.

---

## Convención de Naming — NestJS (estándar, NO modificar)

El backend usa la convención **estándar de NestJS** con sufijos que identifican el rol:

```
apuestas.controller.ts          ← controlador HTTP
apuestas.service.ts             ← lógica de negocio
apuestas.module.ts              ← módulo NestJS
create-apuesta.dto.ts           ← Data Transfer Object de entrada
update-apuesta.dto.ts           ← DTO de actualización (extends PartialType)
apuesta.schema.ts               ← esquema Mongoose / Entity
estado-apuesta.enum.ts          ← enum tipado
jwt-auth.guard.ts               ← guard de autenticación
response-transform.interceptor.ts ← interceptor
request-logger.middleware.ts    ← middleware
```

**Esta convención NO se cambia.** Es la convención oficial de NestJS y la siguen todos
los generadores (`nest generate`). Nuevos archivos SIEMPRE siguen este patrón.

---

## Organización por Dominio de Negocio

Cada dominio de negocio tiene su propia carpeta autónoma:

```
<dominio>/
  dto/           → create-*.dto.ts, update-*.dto.ts
  schemas/       → *.schema.ts (o entities/)
  enums/         → *.enum.ts   (cuando aplica)
  *.controller.ts
  *.module.ts
  *.service.ts
```

Dominios típicos del sistema:
`apuestas/`, `deportes/`, `eventos/`, `cuotas/`, `billetera/`, `usuarios/`, `auth/`,
`promociones/`, `dashboard/`

Los controllers separados por responsabilidad dentro del mismo dominio también son válidos:
```
billetera/
  billetera.controller.ts          ← operaciones estándar (saldo, transferencias)
  webhook-pagos.controller.ts      ← ingesta de webhooks de pasarelas de pago
```
Responsabilidades distintas, mismo dominio: se mantienen dentro de la carpeta del dominio.

---

## Infraestructura transversal — Estructura META

Toda la infraestructura transversal vive dentro de `common/`:

```
common/
  helpers/        → odds-calculator.helper.ts, pagination.helper.ts
  middleware/     → request-logger.middleware.ts
  interceptors/   → response-transform.interceptor.ts
  guards/         → jwt-auth.guard.ts, roles.guard.ts
  types/          → common.types.ts
```

`src/config/` queda exclusivamente para configuración de infraestructura: `database.config.ts`, `jwt.config.ts`, `redis.config.ts`.

---

## Scripts y migraciones — Política

Los scripts de ejecución one-time (migraciones de datos, seeds manuales) van en:

```
database/
  scripts/    → migraciones
  seeds/      → initial-seed.data.ts
```

---

## Reglas no negociables

### Dominio nuevo
Siempre nace completo desde el primer commit:
```
<nuevo-dominio>/
  dto/
    create-<nuevo-dominio>.dto.ts
  schemas/
    <nuevo-dominio>.schema.ts
  <nuevo-dominio>.controller.ts
  <nuevo-dominio>.module.ts
  <nuevo-dominio>.service.ts
```
Nunca reutilices el DTO de otro dominio "para ahorrar un archivo". Cada dominio tiene su propia
copia para poder evolucionar de forma independiente.

### Contrato Frontend ↔ Backend
Cada lado mantiene su propia definición tipada:

| NestJS | Angular equivalente |
|---|---|
| `create-apuesta.dto.ts` | `apuesta.model.ts` / `apuesta.interface.ts` |
| `evento.schema.ts` | `evento.model.ts` / `evento.interface.ts` |
| `transaccion.schema.ts` | `transaccion.model.ts` |

**Regla:** Si modificas un DTO o schema en NestJS, señala explícitamente en tu respuesta
qué campo del modelo/interface equivalente en Angular debe actualizarse también.
Si eliminas o renombras un campo, márcalo como **breaking change** visible en tu respuesta.

### Tests
- Los archivos `.spec.ts` viven junto al archivo que prueban.
- `jwt-auth.guard.spec.ts` → junto a `jwt-auth.guard.ts` en `auth/` o `common/guards/`
- `webhook-pagos.controller.spec.ts` → junto al controller en `billetera/`

---

## Antes de crear un módulo nuevo — Mini-checklist NestJS

```
[ ] ¿El dominio tiene nombre claro de negocio (no genérico)?
[ ] ¿Creé la carpeta con dto/, schemas/, controller, module y service desde el inicio?
[ ] ¿El DTO usa class-validator decorators (@IsString, @IsNotEmpty, @IsNumber, etc.)?
[ ] ¿El module está importado en app.module.ts?
[ ] ¿Si tiene webhook o endpoint especial, está como controller separado en el mismo dominio?
[ ] ¿Señalé qué modelo/interface de Angular debe actualizarse para reflejar el contrato?
```
