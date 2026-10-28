# Repository instructions

## Start every coding session here

AGENTS.md is the instruction entry point. Read [team ownership](project-context/11-team-ownership.md) (module/shared-file authority) and [development handoff](project-context/12-development-handoff.md) (current work/progress authority), then project-context/README.md and [current state](project-context/03-current-state.md). Domain rules, permissions and applicable workflows remain the business-requirements authority; never invent unavailable handbook requirements, fixtures or KPI expectations.

Before implementing, identify Developer A or Developer B from explicit user instruction or an explicit documented assignment. Never infer it from Git identity, computer, hostname, paths or chat history. If unknown, ask exactly once: "Is this session Developer A or Developer B?" Do not modify business modules until identified. These labels are contributor ownership, not application roles; do not store personal identities, secrets or machine-specific developer mappings. Documentation setup alone does not select a profile.

Read the relevant module context, applicable docs/flows workflows, [permissions](docs/permissions.md), [domain rules](docs/domain-rules.md), [architecture](docs/architecture.md), [database](docs/database.md), [API contracts](docs/api.md) and applicable ADRs. Inspect actual source/tests, current branch and Git status, and check the ledger/handoff queue for conflicting or completed work. Respect the authoritative ownership and single-editor shared-file boundaries; reading other domains is allowed. For out-of-owner work, explain the boundary and propose a handoff or obtain explicit coordination before editing. Implement only the requested scope.

Use independent clones/worktrees/feature branches and coordinate shared changes. Preserve others' staged/unstaged work; no destructive reset/clean/checkout of it. Do not commit/push/open PRs without explicit instruction. Run appropriate safe verification and record actual commands/results. After meaningful work, update the single handoff ledger in the same logical change set with changed paths, behavior, evidence, unfinished work and next task. Developer A consolidates ledger updates; other contributors maintain branch-local proposals until coordinated integration. Reconcile ledger/source conflicts honestly. New chats/computers see only synchronized repository files/history, not another developer's private local work.

Before changes, read project-context/README.md and project-context/03-current-state.md, relevant module context and ADRs. Inspect existing code before adding files.

Preserve the modular monolith: apps/frontend is feature-oriented React; apps/backend is modular Express. Keep the @shiplens/frontend, @shiplens/backend and @shiplens/contracts names. The root folder is HopeBridge.

Keep controllers thin; place business rules in services/domain policies and database access in repositories. Respect domain boundaries; do not import another module's repository without an explicit documented design. Validate inputs with Zod. Enforce authorization and branch scoping on the server; frontend visibility is not authorization. Use transactions for critical financial/report/audit changes. Preserve immutable approvals and audit integrity according to confirmed requirements. Do not invent financial rules or sample data.

Keep frontend server state in TanStack Query, forms in React Hook Form, requests in the central client, UI strings in translation resources and layouts RTL-compatible. Never access the database from the frontend.

Avoid unnecessary dependencies and unrelated edits. Write meaningful tests for implemented behavior; run relevant typecheck, lint, formatting, build and test checks. Update project context after meaningful changes. Distinguish planned, implemented, tested and deployed; never fabricate results. Never commit secrets. Do not create commits, push branches or open pull requests without explicit user instruction. Do not perform destructive Git operations without permission. Explain important decisions and keep changes incremental.
