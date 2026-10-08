# 📗 Guía de Implementación: Módulo 3 — Billetera Virtual & Historial de Usuario

> **Responsable:** Integrante 3  
> **Rama Git:** `feature/modulo-billetera-usuario`  
> **Issue en GitHub:** `Issue #3: [Módulo 3] Gestión de saldo virtual, recargas y panel de historial de apuestas`  
> **Enfoque:** Full-Stack del Feature (Base de datos + API NestJS + Header con Saldo & Historial Angular)

---

## 1. Misión de tu Módulo

Eres el dueño de la **billetera, el dinero del jugador y la auditoría de apuestas**. Tu trabajo consiste en:
1. **En Base de Datos (Mongoose):** Diseñar el modelo `usuario` con un balance inicial ficticio (\$1,000.00 USD).
2. **En Backend (NestJS):** Crear endpoints para consultar el saldo disponible, recargar saldo ficticio (`+ $500`) y listar el historial de tickets del usuario.
3. **En Frontend (Angular):**
   * Crear el **Header superior:** Muestra el logo **BetPulse**, el saldo actual en vivo en verde neón y el botón "+ Recargar".
   * Crear el componente **Historial:** Muestra la lista de apuestas realizadas con badges visuales de color según su estado:
     * 🟡 `PENDIENTE`
     * 🟢 `GANADA`
     * 🔴 `PERDIDA`

---

## 2. Requisitos Funcionales a Cumplir

* **RF3.1 (Monedero Virtual en MongoDB):** Almacenar un usuario ficticio principal con nombre, email y saldo decimal (mínimo 0). Crear un seeder que inicialice el usuario con \$1,000 si no existe.
* **RF3.2 (API de Billetera):**
  * `GET /api/usuario/perfil` retorna el saldo actual.
  * `POST /api/usuario/recargar` permite sumar fondos al saldo.
* **RF3.3 (Header con Balance en Angular):** Barra superior fija con el indicador de saldo reactivo y botón que sume \$500 al hacer clic.
* **RF3.4 (Historial de Tickets en Angular):** Renderizar las apuestas recientes con el partido, monto jugado, cuota y ganancia potencial.

---

## 3. Archivos que vas a crear en tu rama

### En el Backend (`apuestas-api/src/usuario/`):
```text
apuestas-api/src/usuario/
├── schemas/usuario.schema.ts     ← Esquema Mongoose del usuario y saldo
├── dto/recargar-saldo.dto.ts     ← DTO para validar monto positivo
├── usuario.service.ts            ← Lógica de consulta, débito y recarga
├── usuario.controller.ts         ← Endpoints GET /perfil y POST /recargar
└── usuario.module.ts             ← Módulo de NestJS (importar en app.module.ts)
```

### En el Frontend (`apuestas-web/src/app/`):
```text
apuestas-web/src/app/
├── shared/ui/header/
│   ├── header.ts                 ← Componente de cabecera con saldo
│   ├── header.html               ← Template con logo y badge de dinero
│   └── header.scss               ← Estilos del header
└── features/historial/
    ├── historial.ts              ← Componente de historial de boletos
    ├── historial.html            ← Template con lista de tickets y badges
    └── historial.scss            ← Estilos del historial
```

---

## 4. Guía Paso a Paso para Desarrollar

### Paso 1: Crear tu rama en Git
```bash
git checkout main
git pull origin main
git checkout -b feature/modulo-billetera-usuario
```

### Paso 2: Desarrollar el Backend
1. **Esquema (`usuario.schema.ts`):** Define `usuarioId`, `nombre`, `email` y `saldo` (number con `default: 1000, min: 0`).
2. **Seeder en `onModuleInit()`:** Si no existe el usuario demo, créalo automáticamente.
3. **Controlador y Servicio:** Implementa `GET /api/usuario/perfil` y `POST /api/usuario/recargar`.
4. **Importar módulo:** Agrega `UsuarioModule` a `app.module.ts`.

### Paso 3: Desarrollar el Frontend
1. **Header (`shared/ui/header/`):**
   * Muestra el logo de **BetPulse**.
   * Muestra el saldo formateado: `${{ saldo() | number:'1.2-2' }}`.
   * El botón "+ Recargar" invoca la recarga de saldo.
2. **Historial (`features/historial/`):**
   * Muestra cada tarjeta de ticket con sus badges de color.
3. **Insertar en la vista principal:**
   * En `app.html`, reemplaza el placeholder del header por `<app-header></app-header>`.
   * En `app.html`, reemplaza el placeholder del historial por `<app-historial></app-historial>`.

---

## 5. Criterio de Finalización y Commits

Haz commits frecuentes referenciando el Issue #3:
```bash
git commit -m "feat(usuario): esquema mongoose de billetera y endpoints de recarga (#3)"
git commit -m "feat(header): barra superior con saldo virtual y recarga interactiva (#3)"
git commit -m "feat(historial): visualizacion de apuestas realizadas y estados (#3)"
```

Al terminar, sube tu rama y abre tu Pull Request hacia `main`:
```bash
git push origin feature/modulo-billetera-usuario
```
