---
sidebar_position: 3
---

# Sistema de agentes

## Qué es cada cosa
- **Agente**: rol operativo con responsabilidad clara dentro del flujo
- **Skill**: guía reusable y activable para ejecutar una clase de tareas
- **MCP**: conector que da acceso a sistemas externos (GitHub, navegador, base de datos)

## Agentes
| Agente | Responsabilidad |
|---|---|
| `architect` | Traduce una tarea en alcance, contratos y riesgos |
| `implementer` | Cambia código en frontend, backend y capas compartidas |
| `validator` | Comprueba calidad técnica antes de review |
| `documenter` | Mantiene la documentación alineada con el código |
| `pr-reviewer` | Revisión final con foco en bugs y regresiones |

## Skills
| Skill | Uso |
|---|---|
| `vue-node-feature-delivery` | Implementación de features o fixes de punta a punta |
| `quality-gate` | Validación técnica antes de merge |
| `github-pr-review` | Revisión de PR o diff local |

## Flujo recomendado
1. `architect` define el corte de trabajo
2. `implementer` aplica el cambio mínimo viable
3. `validator` verifica lint, tipos, tests, build
4. `documenter` actualiza lo que cambió
5. `pr-reviewer` revisa el diff antes de merge

## MCPs
| MCP | Prioridad | Uso |
|---|---|---|
| `github` | Alta | Leer PRs, archivos, comentarios, checks |
| `playwright` | Media-alta | Smoke tests, validación de UI |
| `docs/fetch` | Media | Consultar documentación oficial |
| `database` | Situacional | Revisar esquema, lecturas seguras |
