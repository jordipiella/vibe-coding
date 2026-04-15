# Blueprint inicial

## 1. Qué es cada cosa
- `Agente`: un rol operativo con responsabilidad clara dentro del flujo.
- `Skill`: una guía reusable y activable para ejecutar una clase de tareas.
- `MCP`: el conector que da acceso a sistemas externos como GitHub, navegador o base de datos.

## 2. Arquitectura mínima viable
Para un stack Vue + TypeScript + Node + GitHub no necesitas empezar con diez piezas. La base recomendada es:

### Agentes
- `architect`: traduce una tarea en alcance, contratos y riesgos.
- `implementer`: cambia código en frontend, backend y capas compartidas.
- `validator`: comprueba calidad técnica antes de review.
- `documenter`: mantiene la documentación alineada con el código.
- `pr-reviewer`: hace revisión final con foco en bugs y regresiones.

### Skills
- `vue-node-feature-delivery`: implementación de features o fixes de punta a punta.
- `quality-gate`: validación técnica y control de documentación antes de merge.
- `github-pr-review`: revisión de PR o diff local con salida accionable.

## 2.1 Stack elegido para este sistema
Para no dejar las skills en abstracto, fijamos un perfil base:

- Workspace: `pnpm` monorepo.
- `apps/web`: Vue 3 + Vite + TypeScript + Vue Router + Pinia.
- `apps/api`: Node + TypeScript + Fastify.
- `packages/contracts`: esquemas Zod compartidos e inferencia de tipos.
- Testing: Vitest en web y api; Playwright para smoke/e2e de frontend.

### Por qué este stack
- `Vite` simplifica el flujo de Vue y acelera iteración local.
- `Pinia` cubre estado compartido sin sobrecargar la app.
- `Fastify` encaja mejor que Express para TypeScript y validación explícita.
- `Zod` evita drift entre validación runtime y tipos estáticos.
- `Vitest` reduce fricción al compartir runner entre frontend y backend.

### MCPs
- `github`:
  - Prioridad: alta.
  - Motivo: sin esto, la revisión de PR queda limitada al diff local.
  - Uso: leer PRs, archivos, comentarios, checks y contexto de issues.
- `playwright`:
  - Prioridad: media-alta si hay UI.
  - Motivo: permite validar flujos reales de frontend en navegador.
  - Uso: smoke tests, capturas, errores de consola, validación de formularios.
- `docs/fetch`:
  - Prioridad: media.
  - Motivo: ayuda a consultar documentación oficial actualizada.
  - Uso: Vue, TypeScript, Node, Vitest, Vite, librerías de terceros.
- `database`:
  - Prioridad: situacional.
  - Motivo: útil cuando el backend depende de consultas o migraciones.
  - Uso: revisar esquema y ejecutar lecturas seguras.

## 3. Flujo recomendado por tarea
1. `architect` define el corte de trabajo.
2. `implementer` aplica el cambio mínimo viable.
3. `validator` verifica lint, tipos, tests, build y smoke checks.
4. `documenter` actualiza lo que cambió en contratos o uso.
5. `pr-reviewer` revisa el diff antes de merge.

## 4. Qué no conviene hacer al principio
- No instalar MCPs que no vayas a usar esta semana.
- No crear skills demasiado genéricas.
- No automatizar revisión de PR antes de tener claro el checklist.
- No mezclar implementación y review en una misma skill.

## 5. Qué hemos dejado preparado en este repo
- Un contrato base en `AGENTS.md`.
- Tres skills iniciales versionadas dentro del repo.
- Un mapa de prioridades para decidir qué MCP añadir primero.
- Un perfil de stack en `docs/stack-profile.md`.

## 6. Siguiente orden recomendado
1. Adaptar las skills al stack real del proyecto.
2. Añadir comandos concretos a la skill `quality-gate`.
3. Configurar el MCP de GitHub.
4. Añadir el MCP de Playwright si el frontend necesita validación visual o e2e.
5. Preparar una plantilla de review para PRs.
