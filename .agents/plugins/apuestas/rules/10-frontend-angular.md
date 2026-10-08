---
trigger: glob
glob: apuestas-web/src/**/*.ts, apuestas-web/src/**/*.html, apuestas-web/src/**/*.scss
description: >
  Reglas específicas del frontend Angular de la plataforma de apuestas. Define la clasificación
  exacta de cada tipo de archivo, casos de negocio concretos y las reglas no negociables
  de arquitectura. Para convenciones de naming ver @05-naming-angular.md.
  Se activa automáticamente al editar cualquier archivo dentro de apuestas-web/src/.
---

# ⚛️ Frontend Angular — Plataforma de Apuestas

Aplica junto con `@00-core-arquitectura.md` y `@05-naming-angular.md`.

---

## Clasificación de archivos — Casos concretos

### `shared/ui/` vs `features/` o `domains/`

Los componentes que conocen el modelo de negocio **NO son `shared/ui/`**:

| Componente | Qué hace | Dónde va en la meta |
|---|---|---|
| `countdown` o `badge` | Widget agnóstico (muestra tiempo o etiqueta visual con `@Input`). | `shared/ui/countdown/` |
| `evento-card` | Conoce cuotas, equipos, mercados y evento deportivo. | `features/deportes/evento-card/` (o sub-componente) |
| `betslip` / `cupon` | Administra la selección de apuestas y monto a apostar. | `features/betslip/` o `domains/apuestas/` |
| `balance-widget` | Muestra saldo del usuario y botón de recarga. | `features/billetera/` o `domains/billetera/` |
| `admin-table` | Tabla genérica reutilizable en el panel admin. | `admin/shared/admin-table/` |

---

## Reglas no negociables

### Sobre la capa de datos
- `domains/<dominio>/` es la **única fuente** del modelo y del service HTTP de ese dominio.
- Un componente en `features/` o `admin/features/` **nunca** importa `HttpClient` directamente.
- Un componente **nunca** duplica una interfaz o un método HTTP que ya existe en `domains/`.

### Sobre separar admin de público
- La separación `admin/` vs `features/` es de PRESENTACIÓN, no de datos.
- Un mismo `domains/apuestas/apuestas.service.ts` sirve a ambos lados.
- `admin/shared/` y `shared/ui/` **no son intercambiables**:
  - ¿El componente conoce conceptos de gestión/backoffice (roles, auditoría, controles admin)? → `admin/shared/`
  - ¿El componente es agnóstico (modal, dropdown, botón, tabs)? → `shared/ui/`

### Sobre módulos y rutas
- Cada feature admin tiene sus rutas en `admin/admin.routes.ts` (lazy-loaded).
- Cada feature pública se registra en `app.routes.ts` o en las rutas del layout correspondiente.
- Un componente nuevo **siempre** se agrega a las rutas correspondientes en el mismo PR/tarea.

### Sobre detección de cambios y modern Angular
- Usa Angular Standalone (`standalone: true`).
- Usa `ChangeDetectionStrategy.OnPush` por defecto en todos los componentes.
- Prefiere `inject()` en lugar de constructores para inyección de dependencias.
- Manejo reactivo de estado con Signals o RxJS según aplique (ej. actualizaciones de cuotas en vivo).

### Sobre tests
- Los archivos `.spec.ts` viven junto al archivo que prueban, en la misma carpeta.
- No hay carpeta `__tests__/` ni `spec/` separada.

---

## Antes de crear un componente nuevo — Mini-checklist Angular

```
[ ] ¿Determiné a qué dominio de negocio pertenece? (apuestas, deportes, eventos, billetera, etc.)
[ ] ¿Es admin, público, o compartido agnóstico?
[ ] ¿Elegí la ruta correcta según el árbol objetivo en @00-core-arquitectura.md?
[ ] ¿El nombre del archivo sigue la convención sin sufijo para componentes (.ts, no .component.ts)?
[ ] ¿El service del dominio ya existe en domains/? Si no, ¿lo creé primero?
[ ] ¿Ya registré el componente en las rutas correspondientes?
[ ] ¿Verifiqué que no existe otro componente con el mismo nombre o función?
```
