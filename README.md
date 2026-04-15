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

1. El workflow lee el diff y llama al modelo definido por `OPENAI_PR_REVIEW_MODEL`.
2. Publica o actualiza un comentario top-level con findings y summary para el `Head SHA` actual.
3. El propietario de la PR debe responder en la conversación y actualizar el código si corresponde.

Configuración necesaria en GitHub:

```text
Repository secret: OPENAI_API_KEY
Repository variable (optional): OPENAI_PR_REVIEW_MODEL
```

El valor por defecto del modelo es `gpt-5-1-mini`.
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
