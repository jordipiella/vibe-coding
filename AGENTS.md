# Sistema de agentes del repo

## Objetivo
Este repositorio define un flujo de trabajo asistido por agentes para proyectos con Vue 3 + TypeScript en frontend y Node + TypeScript en backend. Todo cambio debe pasar por cuatro capacidades: implementar, validar, documentar y revisar antes del merge.

## Stack base del sistema
- Workspace: `pnpm` monorepo.
- Frontend: Vue 3, Vite, TypeScript, Vue Router y Pinia.
- Backend: Node + TypeScript con Fastify.
- Contratos compartidos: `packages/contracts` con esquemas Zod y tipos inferidos.
- Testing: Vitest para unit/integration y Playwright para smoke/e2e del frontend.
- Documentación viva: `README.md`, `docs/` y decisiones técnicas cortas cuando cambie un contrato o una convención.

## Layout esperado
- `apps/web`: interfaz Vue.
- `apps/api`: API Fastify.
- `packages/contracts`: contratos compartidos entre web y api.
- `docs/`: decisiones, guías y runbooks.
- `.codex/skills`: skills del flujo de trabajo.

## Roles
- `architect`: delimita alcance, contratos afectados, riesgos y criterio de aceptación.
- `implementer`: aplica cambios en frontend, backend y capas compartidas.
- `validator`: ejecuta o prepara lint, typecheck, tests, build y smoke checks.
- `documenter`: actualiza README, decisiones técnicas, ejemplos de uso y notas de cambio.
- `pr-reviewer`: revisa el diff con foco en bugs, regresiones, deuda técnica y falta de tests o docs.

## Flujo por defecto
1. Entender la tarea y localizar capas afectadas.
2. Implementar el menor corte vertical posible.
3. Validar el cambio con comandos y checks relevantes.
4. Actualizar documentación si cambian contratos, flujos o decisiones.
5. Esperar el comentario de `Automated PR Review` sobre el `Head SHA` actual del PR.
6. Responder findings, actualizar el código si aplica y documentar qué se acepta o se descarta.

## Artefactos mínimos por cambio
- Resumen funcional del cambio.
- Archivos o módulos afectados.
- Contratos alterados entre UI, API y dominio.
- Validaciones ejecutadas y validaciones pendientes.
- Impacto en documentación.
- Riesgos abiertos para revisión.
- Comentario automático de review para el `Head SHA` actual del PR.

## Contrato de scripts objetivo
Cuando el proyecto exista, el estándar será:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`

Si un repo no implementa alguno de estos comandos, el `validator` debe reportar la brecha.

## Skills versionadas en el repo
- `.codex/skills/vue-node-feature-delivery`
- `.codex/skills/quality-gate`
- `.codex/skills/github-pr-review`

## MCPs prioritarios
- `github`: obligatorio para issues, PRs, archivos cambiados y comentarios de review.
- `playwright`: recomendado para validar UX y flujos críticos de Vue.
- `docs/fetch`: opcional para consultar documentación oficial de librerías y APIs.
- `database`: opcional cuando el backend necesite inspección segura de datos o esquema.

## Gate de PR review
- Toda PR abierta en el mismo repositorio debe pasar el workflow `Automated PR Review`.
- Toda PR abierta debe pasar el workflow `PR Review Gate`.
- El comentario automático lleva los marcadores `<!-- auto-pr-review -->` y `<!-- pr-review-gate -->`.
- El comentario debe incluir `Head SHA`, `Findings` y `Summary`.
- Si cambia el `Head SHA`, el workflow vuelve a revisar la PR y actualiza el comentario.

## Regla de aprendizaje
Construir por capas. Primero definir roles, skills y criterios de calidad. Después añadir MCPs y, solo cuando el repositorio tenga comandos reales, automatizar validación y revisión.
