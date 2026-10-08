# ⚡ NovaBet — Plataforma de Apuestas Deportivas Web (MVP)

> **Slogan:** *"Siente el pulso del deporte en cada jugada"*  
> **Tecnologías:** Angular 22.0.5 (SSR, Signals) | NestJS 11.1.9 | MongoDB (Mongoose 8.20.2)

---

## 🎯 Arquitectura del Proyecto (Módulos Verticales de Negocio)

El proyecto utiliza un enfoque **Full-Stack por Feature (Vertical Slices)**. Cada integrante es responsable de un módulo de negocio completo de principio a fin (Datos en MongoDB, Endpoints en NestJS y Componentes en Angular):

```text
Apuestas/
├── docs/                      ← Guías técnicas y contratos para cada integrante
│   ├── 00-contrato-global-mvp.md
│   ├── 01-modulo-eventos.md           (Guía completa para Integrante 1)
│   ├── 02-modulo-betslip.md           (Guía completa para Integrante 2)
│   └── 03-modulo-billetera-usuario.md (Guía completa para Integrante 3)
│
├── apuestas-web/              ← Frontend Angular 22 (SSR, Standalone, Signals)
│   └── src/app/
│       ├── domains/           ← Interfaces y modelos del contrato compartido
│       ├── shared/ui/header/  ← Módulo 3: Header con saldo (Integrante 3)
│       └── features/
│           ├── cartelera/     ← Módulo 1: Tarjetas de partidos y cuotas (Integrante 1)
│           ├── betslip/       ← Módulo 2: Cupón de apuestas interactivo (Integrante 2)
│           └── historial/     ← Módulo 3: Historial de tickets apostados (Integrante 3)
│
└── apuestas-api/              ← Backend NestJS 11 + Mongoose 8
    └── src/
        ├── eventos/           ← Módulo 1: Catálogo de partidos y resultados (Integrante 1)
        ├── apuestas/          ← Módulo 2: Motor de validación y tickets (Integrante 2)
        └── usuario/           ← Módulo 3: Billetera virtual y saldo (Integrante 3)
```

---

## 👥 Asignación de Módulos y Ramas de Git

| Integrante | Módulo Asignado | Alcance Full-Stack | Rama Git | Issue |
|---|---|---|---|---|
| **Integrante 1** | **Módulo 1: Eventos & Cartelera** | Partidos en Mongo + API de consulta/resultados + Tarjetas de cuotas en Angular | `feature/modulo-eventos` | `#1` |
| **Integrante 2** | **Módulo 2: Apuestas & Betslip** | Tickets en Mongo + API de emisión/cálculo + Cupón de apuestas en Angular | `feature/modulo-betslip` | `#2` |
| **Integrante 3** | **Módulo 3: Billetera & Historial** | Usuario/Saldo en Mongo + API de balance/recarga + Header e Historial en Angular | `feature/modulo-billetera-usuario` | `#3` |

Cada integrante debe consultar su guía detallada en [`docs/`](./docs/) antes de comenzar.

---

## 🚀 Cómo Iniciar el Proyecto en Local

### 1. Backend (`apuestas-api`)
```bash
cd apuestas-api
npm run start:dev
```
> Servidor disponible en: `http://localhost:3000/api`

### 2. Frontend (`apuestas-web`)
```bash
cd apuestas-web
npm run start
```
> Aplicación web disponible en: `http://localhost:4200`
