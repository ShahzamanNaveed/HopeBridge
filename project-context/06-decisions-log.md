# Decisions

2026-10-24: accepted modular monolith and stack from the brief; apps/frontend and apps/backend naming from user correction; HopeBridge remains the root. ADR: ../docs/adr/0001-foundation.md. Node 24, Prisma 7 PostgreSQL adapter, same-origin production, explicit build ordering and separate migration image chosen for foundation compatibility. Final business schema and permission matrix remain pending.

2026-10-26 ? Confirmed HWF Decisions (source: user-supplied documentation update): organisation identity/mission/programmes and Head Office structure recorded in [overview](01-project-overview.md); role responsibilities in [permissions](../docs/permissions.md); city-based branch codes, member identity, transactional HR acceptance, application safeguards and public/staff separation in [domain rules](../docs/domain-rules.md). Detailed grants remain pending.

2026-10-26 ? Official Requirements clarified by the same update: Forming/Active/Paused/Closed branches, seven-day collection edit lock, auto-draft/report actions, immutable approved figures, audited changes/transitions, dashboard trends/unsent collections, CSV/PDF export and four mandatory pass/fail criteria. Handbook/fixtures and exact acceptance definitions remain missing. This is documentation confirmation only, not feature implementation.
