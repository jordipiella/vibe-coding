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

## Nuevos Endpoints de API
### GET /version
Este endpoint devuelve la versión y entorno de la aplicación. Asegúrate de utilizar la nueva función `fetchVersion` desde el cliente para obtener estos datos de manera efectiva.

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