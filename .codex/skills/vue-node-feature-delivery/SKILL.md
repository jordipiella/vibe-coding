---
name: vue-node-feature-delivery
description: Implement Vue 3 + TypeScript frontend work and Node + TypeScript backend changes as one vertical slice. Use for features, bug fixes, refactors, API wiring, forms, validation, and tasks that touch UI, API, shared types, or documentation.
---

# Vue + Node feature delivery

Use this skill when the task changes product behavior and may affect frontend, backend, shared types, or API contracts.

Before starting, read `../../../docs/stack-profile.md` to align with the repo's chosen stack and expected layout.

## Workflow
1. Map the request to affected layers: `apps/web`, `apps/api`, `packages/contracts`, and docs.
2. Confirm contract changes first. If a route, payload, or schema changes, update `packages/contracts` before consumers.
3. Implement the smallest vertical slice that proves the behavior end to end.
4. Keep TypeScript types and Zod runtime validation aligned at boundaries.
5. Update docs and handoff notes when behavior, setup, routes, or contracts change.

## Frontend guardrails
- Prefer Vue 3 Composition API, `<script setup>`, and explicit TypeScript types.
- Keep state local unless the behavior is shared enough to justify a Pinia store.
- Avoid hidden coupling between components and transport formats.
- Keep transport and server state concerns out of presentational components.
- Validate user input at the boundary closest to the user and again at the server boundary when needed.

## Backend guardrails
- Keep Fastify handlers thin and move business rules into services or domain modules.
- Keep request/response contracts explicit through Zod schemas and inferred types.
- Return stable error shapes and avoid leaking internal details.
- Treat shared types as contracts, not incidental implementation details.

## Default repository assumptions
- `apps/web` contains Vue UI, routing, stores, and feature modules.
- `apps/api` contains Fastify routes, services, and infrastructure adapters.
- `packages/contracts` contains Zod schemas shared by web and api.
- Vitest is the default test runner across layers.

## Handoff output
- Files changed.
- Contract changes.
- Validation completed or still needed.
- Documentation updated or intentionally deferred.

## Related skills
- For validation-only work, use `quality-gate`.
- For review-only work, use `github-pr-review`.
