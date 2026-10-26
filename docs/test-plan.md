# Test strategy

Foundation unit/HTTP tests cover database readiness outcomes through an injected checker, headers, request IDs, body validation, safe errors, not-found behavior, rate limiting and environment validation. These mocks do not prove PostgreSQL connectivity.

A separate integration suite uses the real Prisma adapter, SELECT 1, the migrated marker table and /health. It requires DATABASE_URL and migrations. CI supplies PostgreSQL. Backend coverage includes all handwritten source files, including startup/database code; generated client code is excluded. Enforce at least 60% lines, statements, functions and branches.

Playwright verifies navigation, the honest portal shell, recovery from unknown routes and Urdu RTL. Extend with responsive/accessibility checks and approved business workflows later.

Four mandatory pass/fail acceptance criteria are required, but their exact official definitions remain unavailable; do not label the following verification areas as the official four. Competition acceptance remains pending: official sample-data dashboard reconciliation, complete audited report lifecycle, exhaustive server permissions and live Render/CI verification. Do not replace these with placeholder passing tests.

Planned business checks must cover concurrent/non-reused branch codes, stable global member identifiers, atomic exactly-one-member acceptance, application validation/duplicate safeguards, branch statuses, seven-day edit-lock boundaries, auto-draft and invalid report transitions, immutable approved figures, monthly trends/unsent collections, and CSV/PDF exports. Detailed assertions depend on [pending decisions](requirements/clarifications.md). Use synthetic personal data only; no new business tests have been implemented.
