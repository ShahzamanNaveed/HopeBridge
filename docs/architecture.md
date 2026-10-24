# Architecture

Accepted: modular monolith using npm workspaces. React/Vite in apps/frontend communicates with versioned Express HTTP endpoints in apps/backend. Both consume packages/contracts. PostgreSQL is the source of truth, accessed through Prisma and its PostgreSQL driver adapter. Production Express serves frontend assets on the same origin; Vite proxies requests during development.

Frontend features own domain UI; shared components own reusable primitives; layouts own navigation. Backend modules will own routes/controllers, services/policies and repositories. Infrastructure owns database, sessions, exports, audit plumbing and observability. Do not duplicate business rules in the browser.

The only table currently defined is foundation_markers, an infrastructure marker used by optional idempotent seed infrastructure. It is not a proposed business model. Health runs SELECT 1 and returns 503 if PostgreSQL cannot be queried.

No domain ERD has been approved. Session persistence, exact permission grants and financial workflows require the next milestone. See adr/0001-foundation.md and requirements/clarifications.md.
