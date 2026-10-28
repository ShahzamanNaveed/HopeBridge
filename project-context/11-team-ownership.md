# Authoritative two-developer ownership

Approved repository ownership baseline: 2026-10-28. Developer A/B are contributor profiles, NOT staff login roles or personal identities. This allocation supersedes earlier tentative workstream proposals; it does not change any HWF business permission. [AGENTS.md](../AGENTS.md) is the instruction entry point, this file owns allocation, [12-development-handoff.md](12-development-handoff.md) owns current implementation/progress, and existing domain rules/workflows own business policy.

## Profile selection and scope

At implementation-session start read AGENTS, this file and the ledger. Use only explicit user profile selection or an explicit documented assignment. No individual-to-profile mapping is currently recorded. Never infer from machine/Git identity/hostname/folder/chat history. If unknown ask exactly once: "Is this session Developer A or Developer B?" No business-module editing until answered; this documentation setup selects neither profile. Do not persist personal identities, secrets, credentials or machine-specific directories as profile identifiers.

Each feature has one owner across backend, domain UI and domain tests unless a split below expressly applies. Reading any source/contract is allowed; uncoordinated editing outside ownership is not. For an outside-owner request explain the boundary and propose a handoff or obtain explicit coordination. Ownership is responsibility, not permission to implement unapproved member/financial/transfer rules. All approved SA/HR/XM/BL/FIN/AUTH/WR/APP/CE/CMS/PERM/EXP policies remain authoritative; no extra staff role, online payments or private-person fixture data.

## Developer A - administration, HR, identity and shared security

| Area                        | End-to-end responsibility                                                                                                                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication              | Staff login/logout; PostgreSQL server sessions; temporary password/expiry/first-login change/reset; deactivation/revocation; browser auth/CSRF; backend RBAC foundation and authentication acceptance tests                        |
| Users / Super Admin         | Five-role staff create/edit/activate/deactivate and single-role assignment; last-active-admin protection; staff history/audit; staff-management screens and permission/negative tests                                              |
| Branches / Super Admin      | Internal identity/city-scoped immutable codes/lifecycle/current lead; lead assignment/replacement; branch administration screens; public branch-list API and own-branch authorization integration                                  |
| Applications / HR           | Public submission BACKEND, shared application Zod schemas, validation/normalization/contact duplicates/consent; HR inbox/decision/reversal/reacceptance; atomic member linkage/creation; decision notifications/HR audit and tests |
| Members / Teams / Transfers | Permanent city Volunteer IDs/status/history/search; operational teams/roles; automatic assignment endings; Branch Lead member UI; transfer requests/HR decisions, authorization/tests within approved grants                       |
| Audit / Super Admin / HR    | One shared append-only audit persistence/service and sanitized read contracts; organization-wide Super Admin viewer and HR audit views, relevant denial tests                                                                      |
| Shared backend              | Central Prisma/migrations coordination, authorization/session infrastructure, backend central route registration and backend/CI/infrastructure coordination                                                                        |

A owns A's domain frontend screens as well as backend; B does not own all staff UI. Unresolved member/team/status/transfer actions stay gated until approved.

## Developer B - finance, reporting, content and public UX

| Area                             | End-to-end responsibility                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Collections                      | Branch Lead offline collection UI/backend, seven-day/report-state locks, actual-occurrence attribution, adjustments/Late Entry recognition, exact PKR arithmetic, authorization/tests                                           |
| Remittances (within collections) | Branch recording, partials/pending reservations, Finance confirmation/Pending cancellation review, signed outstanding/deficit/same-branch offset and accounting/concurrency tests                                               |
| Reports                          | Auto Draft/missed-week recovery/zero activity; Branch Lead Submit/Resubmit; Finance Return/Approve-Lock; immutable final snapshots/preserved revisions/relevant issue checks and full audited tests                             |
| Finance Reviewer                 | Report inbox/filters/review/decision screens, adjustment decisions, remittance confirmation/cancellation, finance audit projections and financial summary interfaces                                                            |
| Dashboard / Exports              | Head Office KPIs/trends/outstanding/unrouted presentation, canonical financial measures, scoped CSV/PDF backend/filter/download behavior and official-fixture assertions when sources exist                                     |
| Content Editor / CMS             | Program/Event/Page UI/backend, bilingual Draft/Preview/Publish/history/Archive/Unpublish, automatic Past Events, sanitizer/media safety and CMS authorization/tests                                                             |
| Public Website                   | Home /, About /about, Programs /programs, Branches /branches, Events /events, Get Involved /get-involved, Contact /contact; navigation/header/footer, responsive layouts, published integration, full EN/UR/RTL and browser E2E |
| Public application form          | FRONTEND ONLY: consumes A's shared Zod/application submission contract; no independent duplicate/consent/member-creation backend                                                                                                |
| Shared frontend                  | Central router, layouts/styles/components/i18next/API client and frontend E2E coordination                                                                                                                                      |

## Repository path ownership

These paths allocate existing placeholders and future domain implementation; they do not claim new directories/contracts already exist. Corresponding module-specific tests follow domain ownership even when stored in a common test tree. No separate remittances/export business module is required.

| Owner | Owned paths / coverage                                                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A     | apps/backend/src/modules/auth/, users/, branches/, applications/, members/, audit/ (all relative to apps/backend/src/modules/)                                                             |
| A     | apps/frontend/src/features/auth/, users/, branches/, applications/ (HR functions), members/ (all relative to apps/frontend/src/features/)                                                  |
| A     | apps/frontend/src/features/audit/ for Super Admin/HR audit screens; A exposes its page components for B's shared routing                                                                   |
| A     | Planned packages/contracts/src/auth/, users/, branches/, applications/, members/, audit/ domain files; corresponding A backend/frontend module tests                                       |
| B     | apps/backend/src/modules/collections/, reports/, dashboard/, content/ (relative to apps/backend/src/modules/)                                                                              |
| B     | apps/frontend/src/features/collections/, reports/, dashboard/, content/ (relative to apps/frontend/src/features/)                                                                          |
| B     | apps/frontend/src/pages/public/, apps/frontend/src/layouts/, apps/frontend/src/i18n/, apps/frontend/src/styles/, apps/frontend/src/components/, apps/frontend/src/lib/ shared UI utilities |
| B     | Planned packages/contracts/src/collections/, reports/, dashboard/, content/ domain files; corresponding B module tests and e2e/ coordination                                               |

Remittance contracts/services/tests belong under collections; financial exports under dashboard. Finance/CMS audit UI belongs within B's domain features and consumes A's shared audit query contract, avoiding conflicting edits in features/audit/. Public application UI belongs in B-owned public page composition; features/applications/ remains A's HR area. Application shared contract belongs to A.

### Single-editor shared files

| Coordinating editor | Shared surface                                                                                                                                     | Other developer's contribution                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| A                   | apps/backend/prisma/schema.prisma and apps/backend/prisma/migrations/; Prisma configuration/seed coordination                                      | B supplies Finance/CMS model/constraint/query/fixture requirements; A integrates approved schema/migration changes; B owns B's queries/services |
| A                   | apps/backend/src/app.ts central route registration; shared backend auth/authorization/session middleware and infrastructure; server/config changes | B supplies route adapters and integration requirements, never a duplicate auth/audit implementation                                             |
| A                   | packages/contracts/src/index.ts central exports                                                                                                    | Domain owners supply their schema exports; consumers review changes before A wires central index                                                |
| A                   | Root/backend package/config, .github/workflows/ci.yml, Docker/Compose/deployment/infrastructure coordination                                       | B supplies frontend/export/E2E/deployment requirements and performs agreed checks; no unilateral CI/package edits                               |
| B                   | apps/frontend/src/app/router.tsx, providers.tsx, main.tsx, services/api-client.ts, shared layouts/styles/components/lib/i18n                       | A supplies exported feature-page components and auth/error/CSRF requirements; B integrates routes/navigation/client with agreement              |
| A                   | This ownership authority, consolidated project-context/12-development-handoff.md and high-level status integration                                 | Both contribute branch-local update proposals; A consolidates after review, never drops B's evidence                                            |
| A                   | Deployment/acceptance coordination                                                                                                                 | B supplies public/CMS/finance/browser/export evidence; both verify affected integrations, official financial fixtures remain unavailable        |

Unlisted shared files require agreement on ONE editor before modification. A/B do not gain permission to overwrite each other's changes. Temporary editor delegation requires explicit coordination recorded in the ledger (surface, editor, scope and consumer review), not a silent ownership change.

## Cross-owner interfaces and handoffs

| Interface                 | Producer / owner                                                                                                               | Consumer / required review                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Public applications       | A backend/domain/shared application Zod contracts                                                                              | B public form UI; request/response/error/consent behavior changes require agreement                                  |
| Branch Lead portal        | A member/team/transfer features and backend branch policy; B finance/report/remittance features                                | B shared Branch Lead navigation/layout composes both; neither inherits other domain writes                           |
| Audit                     | A shared append writer/sanitized retrieval                                                                                     | Each domain owner emits transactional events; B finance/CMS projections, A Super Admin/HR views; no duplicate writer |
| Database                  | B provides Finance/CMS conceptual model/constraints; A central schema/migrations                                               | B owns its repository queries/services against coordinated schema; no simultaneous central schema edits              |
| Shared Zod                | Each domain owner provides domain files; A central index                                                                       | Consumer approval before breaking request/response/error/version changes; no incompatible copies                     |
| Frontend                  | A exports A's feature-page components; B shared router/layout/i18n/client                                                      | Agree page props/auth/route and error needs before integration                                                       |
| Finance/report accounting | B owns canonical Decimal calculations/report interfaces; A provides auth/audit/branch/member eligibility and seed coordination | Review transaction capability, version/source IDs, scope and fixtures together before financial integration          |

Current queue/version/consumer evidence belongs only in [the progress ledger](12-development-handoff.md), not duplicated here. Existing [architecture](../docs/architecture.md), [database](../docs/database.md), [API](../docs/api.md), [permissions](../docs/permissions.md) and [domain rules](../docs/domain-rules.md) remain integration/business requirements.

## Git and progress protocol

1. Start with current branch/status, latest synchronized ledger and actual code/test evidence. Each contributor uses an independent clone/worktree/feature branch; creating/switching Git state is not automatic authorization to commit/push.
2. Keep edits module-scoped and agree shared-file/interface changes first. Never destructive-reset/clean/checkout another developer's local work, blindly revert staged changes or silently resolve conflicts by dropping evidence.
3. No automatic commits, pushes or PRs; require explicit contributor instruction. Only synchronized repository history/files transfer between computers/new chats, not private changes or chat memory. These new documents are local until explicitly committed and synchronized; no cross-computer visibility is claimed before that.
4. Update the ledger with meaningful work in the same logical change set. Both developers prepare branch-local proposals in the SAME ledger path; A is the integration editor consolidating updates, checking both sides and preserving evidence. Do not create duplicate progress files.
5. New sessions verify ledger claims against source/Git/tests; report/reconcile discrepancies rather than claiming completion. Contract changes need consumer review; TESTED/INTEGRATED need evidence and cannot be inferred from filenames/future tests.
