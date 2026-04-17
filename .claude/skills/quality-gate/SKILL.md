---
name: quality-gate
description: Validate repository changes before merge. Use when you need lint, typecheck, tests, build, smoke checks, or documentation checks for Vue, TypeScript, and Node repositories.
---

# Quality gate

Use this skill when a change is ready to be checked before review or merge.

Before starting, read `../../docs/stack-profile.md` to align with the repo's target validation contract.

## Workflow
1. Discover the repo's validation commands from `package.json`, workspace config, CI files, or project docs.
2. Run the smallest command set that still proves the change is safe.
3. Separate failures into code defects, environment issues, and missing project setup.
4. Check whether docs, examples, API contracts, or setup instructions also changed.
5. Return a pass/fail summary with blockers first.

## Validation order
1. Static checks: format, lint, typecheck.
2. Automated tests: unit, integration, and targeted e2e when relevant.
3. Build or packaging checks.
4. Manual smoke checks for the changed flow if automation is absent.
5. Documentation consistency checks.

## Target script contract
For this repo, the expected command set is:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`

If one of these commands does not exist, treat it as a quality gap and report it explicitly.

## Stack-specific checks
- Frontend: Vue type safety, router changes, Pinia state regressions, and build integrity.
- Backend: Fastify route registration, Zod schema drift, and stable error handling.
- Shared contracts: schema/type drift between `packages/contracts`, `apps/web`, and `apps/api`.

## Output format
- Commands run.
- Commands not available.
- Passed checks.
- Failed checks.
- Risks that remain unvalidated.

## Guardrails
- Do not claim a change is safe if key checks were skipped.
- If the repo lacks validation scripts, state the gap and propose a minimal standard.
- Prefer narrow, relevant validation over expensive blanket runs when the impact is small.
