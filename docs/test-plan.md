# Test strategy

Foundation unit/HTTP tests cover database readiness outcomes through an injected checker, headers, request IDs, body validation, safe errors, not-found behavior, rate limiting and environment validation. These mocks do not prove PostgreSQL connectivity.

A separate integration suite uses the real Prisma adapter, SELECT 1, the migrated marker table and /health. It requires DATABASE_URL and migrations. CI supplies PostgreSQL. Backend coverage includes all handwritten source files, including startup/database code; generated client code is excluded. Enforce at least 60% lines, statements, functions and branches.

Playwright verifies navigation, the honest portal shell, recovery from unknown routes and Urdu RTL. Extend with responsive/accessibility checks and approved business workflows later.

Competition acceptance remains pending: official sample-data dashboard reconciliation, complete audited report lifecycle, exhaustive server permissions and live Render/CI verification. Do not replace these with placeholder passing tests.
