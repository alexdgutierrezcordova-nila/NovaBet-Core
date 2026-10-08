# Workflow: Nuevo Componente Angular

## Descripción
Crea un componente Angular nuevo en la plataforma de apuestas siguiendo la arquitectura Domain-First prescriptiva.
Guía al agente a través de todas las decisiones necesarias: dominio, audiencia, ruta, naming,
conexión al service del dominio y registro en rutas. Invoca con `/nuevo-componente-angular`.

---

## Paso 1 — Recopilar información

Pregunta al usuario lo siguiente:

1. **¿Cómo se llama el componente?** (en kebab-case, ej: `betslip`, `evento-card`, `balance-card`)
2. **¿A qué dominio de negocio pertenece?**
   Opciones: `apuestas`, `deportes`, `eventos`, `cuotas`, `billetera`, `promociones`, `usuarios`, `dashboard`, o ninguno (UI agnóstica).
3. **¿Qué audiencia tiene?**
   - Solo panel admin (`/admin/*`)
   - Solo portal público / jugador
   - Compartido agnóstico (no sabe de ningún dominio)
   - Compartido admin (reutilizable entre features admin)
4. **¿Qué hace este componente en una frase?** (para el comentario del archivo)

---

## Paso 2 — Calcular y mostrar la ruta destino

Con las respuestas del Paso 1, calcula la ruta según estas reglas:

| Audiencia | Ruta |
|---|---|
| Admin + dominio | `apuestas-web/src/app/admin/features/<dominio>/<nombre>/` |
| Público + dominio | `apuestas-web/src/app/features/<dominio>/<nombre>/` |
| Compartido agnóstico | `apuestas-web/src/app/shared/ui/<nombre>/` |
| Compartido admin | `apuestas-web/src/app/admin/shared/<nombre>/` |

Muestra la ruta calculada al usuario y pide confirmación antes de continuar:
> "Voy a crear el componente en `<ruta-calculada>`. ¿Confirmamos?"

---

## Paso 3 — Verificar que el service del dominio existe

Si el componente pertenece a un dominio de negocio:

1. Verifica si existe `apuestas-web/src/app/domains/<dominio>/<dominio>.service.ts`
2. Si NO existe: informa al usuario y consulta si debe crearlo primero.
3. Si SÍ existe: continúa al Paso 4.

Si el componente es UI agnóstica: omite este paso.

---

## Paso 4 — Verificar anti-duplicados

Busca en el proyecto si ya existe algún componente con el mismo nombre o función similar:

1. Busca la carpeta `<nombre>` en `apuestas-web/src/app/`
2. Busca el selector `app-<nombre>` en archivos `.ts`
3. Si encuentras algo similar, alerta al usuario antes de proceder.

---

## Paso 5 — Crear los archivos

Crea los 4 archivos del componente con esta estructura:

### `<nombre>.ts`
```typescript
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

@Component({
  selector: 'app-<nombre>',
  standalone: true,
  imports: [],
  templateUrl: './<nombre>.html',
  styleUrls: ['./<nombre>.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class <NombreEnPascalCase> {
  // <descripción de una frase del componente>
}
```

### `<nombre>.html`
```html
<!-- <NombreEnPascalCase>: <descripción de una frase> -->
<div class="<nombre>">
  <!-- contenido -->
</div>
```

### `<nombre>.scss`
```scss
// <NombreEnPascalCase> styles
.<nombre> {
  display: block;
}
```

### `<nombre>.spec.ts`
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { <NombreEnPascalCase> } from './<nombre>';

describe('<NombreEnPascalCase>', () => {
  let component: <NombreEnPascalCase>;
  let fixture: ComponentFixture<<NombreEnPascalCase>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [<NombreEnPascalCase>]
    }).compileComponents();

    fixture = TestBed.createComponent(<NombreEnPascalCase>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

---

## Paso 6 — Registrar en rutas

### Si es una página admin (tiene ruta propia):
Agrega la entrada en `apuestas-web/src/app/admin/admin.routes.ts`:
```typescript
{
  path: '<ruta-en-el-admin>',
  loadComponent: () => import('./features/<dominio>/<nombre>/<nombre>')
    .then(m => m.<NombreEnPascalCase>)
}
```

### Si es una página pública (tiene ruta propia):
Agrega la entrada en `apuestas-web/src/app/app.routes.ts` o en las rutas del layout correspondiente.

### Si es un sub-componente (sin ruta propia):
Indícale al usuario que debe agregarlo al array `imports: []` del componente padre.

---

## Paso 7 — Resumen final

Al terminar, muestra un resumen de todo lo creado:

```
✅ Componente creado: <nombre>
📁 Ubicación: <ruta-completa>
📄 Archivos:
   - <nombre>.ts
   - <nombre>.html
   - <nombre>.scss
   - <nombre>.spec.ts
🔗 Dominio conectado: domains/<dominio>/<dominio>.service.ts
🛣️ Registrado en rutas: <archivo-de-rutas> → path: '<ruta>'
```
