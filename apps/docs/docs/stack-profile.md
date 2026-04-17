# Stack

## Workspace
- Gestor: `pnpm` monorepo
- Apps: `apps/web`, `apps/api`
- Contratos compartidos: `packages/contracts`

## Frontend
- Vue 3 + Vite + TypeScript
- Routing: Vue Router
- Estado: Pinia

## Backend
- Node LTS + Fastify + TypeScript
- Validación: Zod

## Contratos compartidos
Los schemas Zod en `packages/contracts` son la fuente de verdad. Los tipos TypeScript se infieren desde ellos. Todo cambio de contrato viaja en el mismo commit por `web`, `api` y `contracts`.

## Testing
- Unit e integration: Vitest
- E2E: Playwright

## Validación
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Cambios en el API
- El formato del `timestamp` en la respuesta de salud ha cambiado a un string ISO.
- Se ha añadido un nuevo endpoint `/ready` que devuelve el estado de disponibilidad de la aplicación. La respuesta incluye un booleano `ready` y el `uptime` en segundos.