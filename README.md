# ⚡ BetPulse — Plataforma de Apuestas Deportivas Web (MVP)

> **Slogan:** *"Siente el pulso del deporte en cada jugada"*  
> **Tecnologías:** Angular 22.0.5 (SSR, Signals) | NestJS 11.1.9 | MongoDB (Mongoose 8.20.2)

---

## 🎯 Arquitectura del Proyecto (Monorepo)

```text
Apuestas/
├── docs/                      ← Guías técnicas y contratos para cada integrante
│   ├── 00-contrato-global-mvp.md
│   ├── 01-modulo-eventos-datos.md
│   ├── 02-modulo-motor-apuestas.md
│   └── 03-modulo-interfaz-web.md
├── apuestas-web/              ← Frontend Angular 22 (SSR, Standalone, Signals)
│   └── src/app/
│       ├── domains/           ← Modelos y servicios compartidos (eventos, apuestas)
│       ├── shared/ui/         ← UI agnóstica (header con saldo virtual)
│       └── features/          ← Cartelera deportiva, Betslip y Historial
└── apuestas-api/              ← Backend NestJS 11 + Mongoose 8
    └── src/
        ├── eventos/           ← Módulo 1 (Persistencia, catálogo y resultados)
        ├── apuestas/          ← Módulo 2 (Motor de cálculo, tickets y liquidación)
        └── usuario/           ← Módulo 2 (Billetera virtual y control de saldo)
```

---

## 👥 Asignación por Integrante y Ramas de Git

| Integrante | Rol Técnico | Módulo | Rama Git | Issue |
|---|---|---|---|---|
| **Integrante 1** | Datos & Persistencia | Módulo 1: Catálogo de Eventos | `feature/modulo-eventos-datos` | `#1` |
| **Integrante 2** | Lógica & Backend | Módulo 2: Motor de Apuestas y Billetera | `feature/modulo-motor-apuestas` | `#2` |
| **Integrante 3** | Frontend & UI/UX | Módulo 3: Interfaz Web y Betslip | `feature/modulo-interfaz-web` | `#3` |

Cada integrante debe leer su guía en [`docs/`](./docs/) antes de comenzar a trabajar en su rama.

---

## 🚀 Cómo Ejecutar el Proyecto en Local

### 1. Iniciar el Backend (`apuestas-api`)
Requiere tener MongoDB corriendo en `localhost:27017` (o configurar `MONGODB_URI` en `.env`).

```bash
cd apuestas-api
npm install
npm run start:dev
```
> La API estará disponible en: `http://localhost:3000/api`

### 2. Iniciar el Frontend (`apuestas-web`)
El frontend ya incluye datos simulados (*Mock*) en `domains/eventos/eventos.mock.ts` para poder probarse inmediatamente:

```bash
cd apuestas-web
npm install
npm run start
```
> La aplicación web abrirá en: `http://localhost:4200`
