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

`pnpm dev` arranca web y API; la API recompila antes los contratos compartidos.
`pnpm test:e2e` levanta ambos servicios y valida el flujo real `web -> api -> contracts`.

## PR Review

Toda PR debe pasar por `github-pr-review` antes del merge.

1. Ejecuta el review sobre el diff final del PR.
2. Publica un comentario top-level usando la plantilla de `.github/pr-review-comment-template.md`.
3. Asegúrate de que el comentario apunte al `Head SHA` actual.

El workflow `PR Review Gate` falla si falta ese comentario o si quedó obsoleto tras un push nuevo.

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
