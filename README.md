# Vibe Coding

Monorepo base para trabajar con:

- `apps/web`: Vue 3 + Vite + TypeScript + Vue Router + Pinia
- `apps/api`: Fastify + TypeScript
- `packages/contracts`: contratos compartidos con Zod

## Arranque

```bash
pnpm install
pnpm dev
```

Comandos principales:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Estructura

```text
apps/
  api/
  web/
packages/
  contracts/
docs/
.codex/skills/
```

## Flujo recomendado

1. Define o ajusta el contrato en `packages/contracts`.
2. Implementa backend en `apps/api`.
3. Implementa consumo en `apps/web`.
4. Ejecuta `lint`, `typecheck`, `test` y `build`.
5. Si cambió comportamiento, actualiza `docs/`.

