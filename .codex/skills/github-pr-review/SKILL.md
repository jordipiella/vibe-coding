---
name: github-pr-review
description: Review GitHub pull requests or local diffs before merge. Use for bug-focused review, risk analysis, missing tests, documentation gaps, and suggested review comments.
---

# GitHub PR review

Use this skill when the task is review, not implementation.

Before starting, read `../../../docs/stack-profile.md` to align review criteria with the repo's chosen stack.
Prefer the `github` MCP server when it is configured and authenticated. Fall back to local diff review only when remote GitHub context is unavailable.

## Workflow
1. Collect context from the PR or local diff: description, changed files, linked issue, checks, and notable comments.
2. Review for correctness first, then regressions, then maintainability.
3. Prioritize findings that can break behavior, data integrity, or developer workflow.
4. Check whether tests and documentation match the claimed behavior.
5. Produce findings first, then open questions, then a short summary.

## Review checklist
- Does the code satisfy the stated behavior?
- Are there broken contracts between `apps/web`, `apps/api`, and `packages/contracts`?
- Are error paths, empty states, and loading states handled?
- Are tests missing for newly introduced logic?
- Is documentation stale after the change?
- Are there migration, deployment, or rollback risks?

## Stack-specific review focus
- Vue: reactive state misuse, router guard regressions, and component-to-transport coupling.
- Pinia: stores with hidden side effects or duplicated server state.
- Fastify: handlers doing business logic, missing schema validation, or route/response drift.
- Zod contracts: consumer drift after schema changes.
- Vitest and Playwright: missing coverage for changed flows.

## GitHub and local modes
- If GitHub context is available, use PR metadata, changed files, comments, and checks.
- If GitHub context is not available, review the local diff and explicitly note the missing remote context.

## Output format
- Findings ordered by severity.
- File references for each finding.
- Open questions or assumptions.
- Short change summary only after findings.
