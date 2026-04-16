# Stack profile

## Objetivo
Este documento fija el stack de referencia que usarán agentes, skills y revisiones. La idea no es que sea perfecto para todos los proyectos, sino que reduzca ambigüedad mientras aprendemos y construimos el sistema.

## Decisiones base

### Workspace
- Gestor: `pnpm`.
- Estructura: monorepo pequeño.
- Distribución objetivo:
  - `apps/web`
  - `apps/api`
  - `packages/contracts`

### Frontend
- Framework: Vue 3.
- Bundler/dev server: Vite.
- Lenguaje: TypeScript.
- Routing: Vue Router.
- Estado compartido: Pinia.

### Backend
- Runtime: Node LTS.
- Framework HTTP: Fastify.
- Lenguaje: TypeScript.
- Validación de entrada y contratos: Zod.

### Contratos compartidos
- Toda entrada/salida relevante entre frontend y backend debe tener contrato en `packages/contracts`.
- Los esquemas Zod son la fuente de verdad.
- Los tipos TypeScript se infieren desde esos esquemas cuando sea posible.

### Testing
- Unit e integration: Vitest.
- Frontend browser flows: Playwright.
- En API se priorizan tests de handler/servicio y, si hace falta, tests HTTP con el mecanismo propio del framework.

## Convenciones operativas

### Implementación
- Cada tarea debe intentar tocar el menor número de capas posible.
- Si cambia un contrato, el cambio debe viajar en el mismo commit por `web`, `api` y `contracts`.
- La lógica de negocio no debe quedarse dentro de componentes Vue ni de handlers Fastify.

### Validación
El contrato objetivo de scripts del repo será:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`

Si falta alguno:
- se documenta como brecha,
- no se afirma que el cambio está completamente validado,
- y se propone el mínimo estándar necesario.

### Documentación
- `README.md`: arranque del repo y comandos principales.
- `docs/`: decisiones, contratos, runbooks y guías de contribución.
- Un cambio que altere API, setup, flujos de usuario o convenciones internas debe reflejarse en documentación.

### Review de PR
La revisión prioriza:
1. Bugs funcionales.
2. Drift entre contratos compartidos y consumidores.
3. Ausencia de tests para lógica nueva o corregida.
4. Documentación desactualizada.
5. Riesgos de despliegue, rollback o migración.

## Qué dejamos fuera por ahora
- ORMs y base de datos concretos.
- Generación automática de clientes SDK.
- Storybook u otras herramientas de UI.
- CI/CD detallado.

Estas piezas se añaden después, cuando el proyecto las necesite de verdad.
