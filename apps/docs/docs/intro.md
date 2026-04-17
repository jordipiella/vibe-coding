---
sidebar_position: 1
---

# Vibe Coding

Monorepo full-stack con Vue 3, Fastify y TypeScript, diseñado para acelerar el desarrollo con flujos asistidos por IA.

## Estructura

```
apps/
  api/       # Backend Fastify + TypeScript
  web/       # Frontend Vue 3 + TypeScript
  docs/      # Esta documentación
packages/
  contracts/ # Schemas Zod compartidos
```

## Arranque rápido

```bash
pnpm install
pnpm dev
```

| Comando | Descripción |
|---|---|
| `pnpm dev` | Arranca API y web en paralelo |
| `pnpm build` | Compila todos los paquetes |
| `pnpm test` | Ejecuta tests |
| `pnpm lint` | Linting |
| `pnpm typecheck` | Comprobación de tipos |
