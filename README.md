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

Toda PR dispara el workflow `Automated PR Review`.

1. El workflow lee el diff y llama a GitHub Models con el `GITHUB_TOKEN` del workflow.
2. Publica o actualiza un comentario top-level con findings y summary para el `Head SHA` actual.
3. El propietario de la PR debe responder en la conversación y actualizar el código si corresponde.
4. Un push nuevo vuelve a ejecutar la review con la version actual del workflow.
5. Si el workflow falla, revisa primero el log del paso `Run automated PR review`.

Configuración necesaria en GitHub:

```text
Repository setting: enable GitHub Models for the repository
Repository variable (optional): GITHUB_MODELS_PR_REVIEW_MODEL
```

Valores recomendados:

```text
GITHUB_MODELS_PR_REVIEW_MODEL=openai/gpt-4o-mini
```

GitHub Models incluye uso gratuito limitado para empezar y puede ejecutarse desde GitHub Actions con `models: read`.
El workflow `PR Review Gate` falla si el comentario automático falta o si quedó obsoleto tras un push nuevo.

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
5. Revisa y responde el comentario de `Automated PR Review`.
6. Si cambió comportamiento, actualiza `docs/`.
