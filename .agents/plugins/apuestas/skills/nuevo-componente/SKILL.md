---
name: nuevo-componente
description: >
  Guía paso a paso para crear correctamente un componente Angular nuevo en la plataforma de apuestas.
  Actívala cuando vayas a crear un componente, página, sección o feature nuevo en apuestas-web.
  Garantiza que el archivo va al lugar correcto, se nombra bien, se conecta al dominio correcto
  y se registra en las rutas correspondientes.
---

# 🧩 Skill: Nuevo Componente Angular en Plataforma de Apuestas

Sigue estos pasos **en orden** cada vez que debas crear un componente nuevo en `apuestas-web/`.

---

## PASO 1 — Determinar el dominio de negocio

Identifica a qué concepto de negocio pertenece el componente:

| Concepto | Dominio |
|---|---|
| Apuestas, ticket, betslip, historial | `apuestas` |
| Deportes, categorías, ligas, torneos | `deportes` |
| Partidos, encuentros en vivo, resultados | `eventos` |
| Cuotas, mercados, probabilidades | `cuotas` |
| Billetera, saldo, depósitos, retiros | `billetera` |
| Promociones, bonos, cupones | `promociones` |
| Perfil de usuario, autenticación, KYC | `usuarios` |
| Métricas, reportes, estadísticas admin | `dashboard` |

Si el componente no pertenece a ningún dominio de negocio (es un botón, un modal
genérico, un loader, un badge numérico), es UI agnóstica → ve directamente al Paso 3b.

---

## PASO 2 — Determinar la audiencia

| Audiencia | Descripción |
|---|---|
| **Admin** | Solo visible en el panel de administración (ruta `/admin/*`) |
| **Pública / Jugador** | Visible en el portal público o área del usuario registrado |
| **Compartida agnóstica** | UI reutilizable que no sabe de ningún dominio de negocio |
| **Admin compartida** | Reutilizable entre varias features del admin, pero con contexto de backoffice |

---

## PASO 3 — Calcular la ruta destino

### 3a. Componente de dominio (admin o público)

```
Admin    → apuestas-web/src/app/admin/features/<dominio>/<nombre-componente>/
Público  → apuestas-web/src/app/features/<dominio>/<nombre-componente>/
```

### 3b. Componente compartido

```
UI agnóstica      → apuestas-web/src/app/shared/ui/<nombre-componente>/
Admin compartida  → apuestas-web/src/app/admin/shared/<nombre-componente>/
Core / service    → apuestas-web/src/app/core/services/<nombre>.service.ts
```

---

## PASO 4 — Nombrar los archivos

Usa la convención sin sufijo de tipo para componentes:

```
<nombre-componente>/
  <nombre-componente>.ts        ← componente (no .component.ts)
  <nombre-componente>.html
  <nombre-componente>.scss
  <nombre-componente>.spec.ts   ← test (siempre incluir)
```

Ejemplo:
```
betslip/
  betslip.ts
  betslip.html
  betslip.scss
  betslip.spec.ts
```

---

## PASO 5 — Verificar el service del dominio

Antes de inyectar nada en el componente nuevo, verifica:

```
apuestas-web/src/app/domains/<dominio>/
```

- ¿Existe el service del dominio? Si no existe, créalo primero en `domains/<dominio>/`.
- ¿El componente necesita datos de la API? → Inyecta el service del dominio, nunca `HttpClient` directamente.
- ¿Necesitas un tipo nuevo? → Agrégalo al model/interface existente en `domains/<dominio>/`.

---

## PASO 6 — Registrar en rutas y módulo

### Features públicas → `app.routes.ts` o el routes del layout público
```typescript
{
  path: 'mi-ruta',
  loadComponent: () => import('./features/dominio/mi-componente/mi-componente')
    .then(m => m.MiComponente)
}
```

### Features admin → `admin/admin.routes.ts`
```typescript
{
  path: 'mi-ruta-admin',
  loadComponent: () => import('./features/dominio/mi-componente/mi-componente')
    .then(m => m.MiComponente)
}
```

### Componentes declarados en otro componente padre
Agrégalos al array `imports: []` del padre (Angular standalone).

---

## PASO 7 — Verificar anti-duplicados

Antes de finalizar, ejecuta mentalmente:

```
[ ] ¿Existe ya un componente con el mismo nombre en otra carpeta?
[ ] ¿El componente que estoy creando no es una copia de uno que ya existe?
[ ] ¿El nombre de la carpeta y el nombre del selector de Angular coinciden?
    (carpeta: betslip → selector: app-betslip)
[ ] ¿Agregué el componente a las rutas en el mismo trabajo (no como tarea pendiente)?
[ ] ¿Actualicé el modelo en domains/ si introduje campos nuevos?
```

---

## Estructura de componente Angular mínima (plantilla)

```typescript
// <nombre-componente>.ts
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

@Component({
  selector: 'app-<nombre-componente>',
  standalone: true,
  imports: [],
  templateUrl: './<nombre-componente>.html',
  styleUrls: ['./<nombre-componente>.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class <NombreComponente> {
  // Si necesita datos del dominio:
  // private readonly <dominio>Service = inject(<Dominio>Service);
}
```
