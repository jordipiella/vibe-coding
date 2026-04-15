# GitHub MCP en Codex

## Objetivo
Usar el MCP oficial de GitHub desde Codex para revisar PRs con contexto remoto real: archivos cambiados, comentarios, checks, issues y metadatos del repositorio.

## Servidor elegido
- Servidor remoto oficial de GitHub.
- URL: `https://api.githubcopilot.com/mcp/`

## Estado actual del repo
- La skill de review ya asume uso preferente de `github` MCP.
- Codex ya puede registrar el servidor con `codex mcp add`.

## Cómo encaja en el flujo
1. Abrir una tarea o PR.
2. Usar `github` MCP para leer contexto remoto.
3. Aplicar la skill `github-pr-review`.
4. Emitir findings priorizados por severidad.

## Configuración recomendada en Codex
En este host, la opción más estable es usar PAT por variable de entorno.

### Variable de entorno
Nombre recomendado:

```bash
export GITHUB_PAT=tu_token_aqui
```

### Alta del servidor en Codex

```bash
codex mcp add github --url https://api.githubcopilot.com/mcp/ --bearer-token-env-var GITHUB_PAT
```

### Verificación

```bash
codex mcp list
codex mcp get github --json
```

## Permisos recomendados del PAT
Para review de PR en repos privados, la recomendación práctica es un fine-grained PAT con acceso solo a los repos necesarios y permisos de solo lectura en:

- Metadata
- Contents
- Pull requests
- Issues
- Actions

Permiso adicional opcional:
- Members, si necesitas contexto de equipos u organización.

Si prefieres un PAT clásico, `repo` cubre lectura de repos privados y PRs. `read:org` puede hacer falta en repos de organización.

## Qué podrás hacer con este MCP
- Leer PRs, diff y comentarios.
- Inspeccionar archivos de un repo remoto.
- Consultar checks y workflows.
- Revisar issues enlazadas a un PR.

## Qué no conviene hacer al principio
- Dar permisos de escritura si solo quieres review.
- Usar un token con acceso a todos los repos si solo revisarás unos pocos.
- Mezclar el secreto dentro del repo o de `.env` del proyecto.

## Comandos de trabajo recomendados
- `codex mcp list`
- `codex mcp get github --json`
- `codex review --help`

## Uso esperado en este repo
Cuando el MCP esté autenticado, la skill `github-pr-review` debe preferir GitHub MCP sobre diff local para:
- descripción del PR,
- archivos cambiados,
- comentarios previos,
- checks de CI,
- y riesgos de merge.
