# Repository instructions

Before changes, read project-context/README.md and project-context/03-current-state.md, relevant module context and ADRs. Inspect existing code before adding files.

Preserve the modular monolith: apps/frontend is feature-oriented React; apps/backend is modular Express. Keep the @shiplens/frontend, @shiplens/backend and @shiplens/contracts names. The root folder is HopeBridge.

Keep controllers thin; place business rules in services/domain policies and database access in repositories. Respect domain boundaries; do not import another module's repository without an explicit documented design. Validate inputs with Zod. Enforce authorization and branch scoping on the server; frontend visibility is not authorization. Use transactions for critical financial/report/audit changes. Preserve immutable approvals and audit integrity according to confirmed requirements. Do not invent financial rules or sample data.

Keep frontend server state in TanStack Query, forms in React Hook Form, requests in the central client, UI strings in translation resources and layouts RTL-compatible. Never access the database from the frontend.

Avoid unnecessary dependencies and unrelated edits. Write meaningful tests for implemented behavior; run relevant typecheck, lint, formatting, build and test checks. Update project context after meaningful changes. Distinguish planned, implemented, tested and deployed; never fabricate results. Never commit secrets. Do not create commits, push branches or open pull requests without explicit user instruction. Do not perform destructive Git operations without permission. Explain important decisions and keep changes incremental.
