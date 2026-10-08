---
trigger: always_on
description: >
  Estándar único de nomenclatura de archivos para Angular.
  Define qué sufijo lleva cada tipo de artefacto, cuándo NO se usa .component,
  cómo se nombran carpetas, selectores, clases y exports. Aplica a TODO archivo
  nuevo o modificado en apuestas-web/.
---

# 📛 Estándar de Nomenclatura — Angular

La mezcla de nombres heterogéneos (`betslip.ts` junto a `cupon.component.ts`) en el mismo directorio
genera ruido que dificulta leer el árbol, entender el rol de cada archivo y automatizar tareas.
Este documento fija la regla única y definitiva.

---

## La Regla Central

> El sufijo en el nombre de archivo identifica el **rol técnico** del artefacto,
> no el framework que lo implementa. Los componentes Angular ya tienen su rol
> comunicado por la carpeta en la que viven — no necesitan repetirlo en el nombre.

---

## Tabla maestra de nomenclatura

| Tipo de artefacto | Sufijo en el archivo | Ejemplo real |
|---|---|---|
| Componente Angular (page, section, widget) | **ninguno** | `betslip.ts`, `evento-card.ts`, `balance-card.ts` |
| Angular Guard | `.guard.ts` | `auth.guard.ts`, `kyc.guard.ts` |
| Angular Service (HTTP o de estado) | `.service.ts` | `apuestas.service.ts`, `betslip.service.ts` |
| Angular Interceptor | `.interceptor.ts` | `server-error.interceptor.ts`, `auth.interceptor.ts` |
| Angular Routes | `.routes.ts` | `admin.routes.ts`, `app.routes.ts` |
| Angular Config | `.config.ts` | `app.config.ts` |
| Model (clase de dominio) | `.model.ts` | `apuesta.model.ts`, `evento.model.ts` |
| Interface (contrato de datos) | `.interface.ts` | `cuota.interface.ts` |
| Enum | `.enum.ts` | `estado-apuesta.enum.ts` |
| Validadores personalizados | sin sufijo de tipo | `custom-validators.ts` |
| Inicializador de app | `.initializer.ts` | `backend-health.initializer.ts` |
| Constantes globales | sin sufijo de tipo | `const.ts` |
| Test unitario | `.spec.ts` | `betslip.spec.ts` |

---

## Lo que está prohibido en archivos NUEVOS

```
❌  betslip.component.ts          ← sufijo .component innecesario
❌  BetslipComponent.ts           ← PascalCase en nombre de archivo
❌  betslip_widget.ts             ← snake_case en nombre de archivo
❌  BetslipWidget.component.ts    ← doble error
❌  betslip-widget-component.ts   ← guión en vez de punto antes del sufijo
```

```
✅  betslip.ts                    ← componente sin sufijo de tipo
✅  evento-card.ts                ← componente compuesto sin sufijo
```

---

## Nombres de carpetas

Siempre `kebab-case`, en singular o plural según el dominio:

```
✅  betslip/                      ← carpeta del componente
✅  evento-card/
✅  admin-header/
✅  historial-apuestas/

❌  Betslip/                      ← PascalCase prohibido en carpetas
❌  betslip_widget/               ← snake_case prohibido
❌  BetslipComponent/             ← sufijo en carpeta, jamás
```

La carpeta debe coincidir exactamente con el nombre base del archivo principal:
```
betslip/
  betslip.ts       ← mismo kebab-case
  betslip.html
  betslip.scss
  betslip.spec.ts
```

---

## Nombres de clases TypeScript (PascalCase interno)

La clase exportada usa PascalCase. El sufijo **dentro del nombre de clase** sigue
estas reglas:

| Tipo de archivo | Nombre de clase | Ejemplo |
|---|---|---|
| Componente (`.ts` sin sufijo) | Sin sufijo en la clase | `export class Betslip` |
| Guard | `+ Guard` | `export class AuthGuard` |
| Service | `+ Service` | `export class ApuestasService` |
| Interceptor | `+ Interceptor` | `export class ServerErrorInterceptor` |
| Model | sin sufijo (es una clase de datos) | `export class ApuestaModel` o `export class Apuesta` |
| Interface | `I + Nombre` o solo Nombre | `export interface Evento` |

> **Excepción:** Si el componente hereda o implementa una clase de diálogo de UI
> (ej. `MatDialogRef`), puede conservar el sufijo `Component` en la clase
> para satisfacer los tipos de Material/UI. El **archivo** sigue sin sufijo.

---

## Selectores Angular

El selector siempre es `app-` + el nombre en kebab-case del archivo:

```typescript
// archivo: betslip.ts
@Component({ selector: 'app-betslip', ... })
export class Betslip { }

// archivo: confirm-dialog.ts
@Component({ selector: 'app-confirm-dialog', ... })
export class ConfirmDialog { }
```

Nunca inventes un selector diferente al nombre de la carpeta/archivo.

---

## Checklist de naming antes de crear cualquier archivo

```
[ ] ¿El nombre de archivo está en kebab-case? (guiones, sin mayúsculas, sin underscores)
[ ] ¿Si es un componente, el nombre NO tiene .component en el archivo?
[ ] ¿Si es un guard/service/interceptor/model, tiene el sufijo correcto?
[ ] ¿El nombre de la carpeta coincide exactamente con el nombre base del archivo?
[ ] ¿El selector del @Component empieza con app- y usa el mismo kebab-case?
[ ] ¿El nombre de la clase exportada está en PascalCase?
```
