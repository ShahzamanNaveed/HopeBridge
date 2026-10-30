# A-03 Super Admin management

Developer A implementation, 2026-10-30. Uses the existing five-role auth, PostgreSQL schema, audit writer and StaffLayout. No schema/migration, financial service, CMS service, public intake, seed, commit or deployment is introduced. Verification and remaining work are recorded in [the single handoff ledger](../project-context/12-development-handoff.md).

## Screens and design

`/staff/super-admin` reads real administrative aggregates. `/staff/super-admin/staff-accounts`, `/branches`, `/lead-assignments` and `/audit` provide authenticated management under that root. Existing header/sidebar/profile/mobile drawer/RTL remain shared components. The old placeholders remain for other roles.

Figma file `eG6p1KxmQeswE6qRA0pmxT`, design guide `1:1127` and dashboard `1:300` were retrieved with design context and screenshots. The dashboard reuses that layout, colors, local fonts, metric glyph, cards and four-panel hierarchy. Source placeholder bars are replaced by actual labeled database counts/history. Management tables, forms and native modal dialogs are newly composed using the existing shared visual patterns, not claims of exact Figma frames. The existing shell/assets are retained. Tables scroll inside their container; controls and modal surfaces support mobile/RTL. All new UI labels/feedback use EN/UR resources; stored names/actions are data, not translated identity.

Attention is explicitly labeled as non-Closed branches that are Forming, Paused or have no current lead. This is an administrative operational definition, not an official financial KPI. Staff distribution counts all registered staff by role; Active staff is a separately labeled count. No invented financial statistics or sample chart values.

## HTTP contract

All endpoints below use `/api/v1/admin`, `{data: ...}` envelopes, current active unrestricted Super Admin authorization and `Cache-Control: no-store`. Missing/expired session: 401; another role/restricted session: 403; invalid shared-Zod input: 400; missing record: 404; stale/invalid business state: 409. POST requires exact trusted Origin and session-bound `X-CSRF-Token`. Existing `/api/v1/auth/staff/:id/reset-credential` is reused, not duplicated.

| Method | Suffix                 | Behavior                                                                                                                                    |
| ------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/overview`            | Real counts, branch statuses, staff roles, recent admin audit and branches                                                                  |
| GET    | `/staff`               | Search name/email, role/status, page/pageSize                                                                                               |
| GET    | `/staff/:id`           | Safe identity/current assignment and latest 100 related audit entries                                                                       |
| POST   | `/staff`               | Create Active staff, hash-only temporary credential, +24h expiry, mandatory change, credential event/audit; one-time post-commit disclosure |
| POST   | `/staff/:id/update`    | Allowed name/email/single-role/status edits with expected version and optional replacementId                                                |
| GET    | `/cities`              | Existing authoritative city mappings only                                                                                                   |
| GET    | `/branches`            | Search name/code/city, lifecycle status, page/pageSize                                                                                      |
| GET    | `/branches/:id`        | Details, latest 100 assignment and audit history entries                                                                                    |
| POST   | `/branches`            | Name/address/existing city; Forming, safely allocated permanent code and audit                                                              |
| POST   | `/branches/:id/update` | Name/address/existing city, expected version; code unchanged                                                                                |
| POST   | `/branches/:id/status` | Expected version and target status; exact SA-005 lifecycle, eligible lead before Active                                                     |
| POST   | `/branches/:id/lead`   | Expected version/current assignment ID (or null initially), eligible lead; atomic first assignment/replacement                              |
| GET    | `/audit`               | Organization-wide sanitized list; search action/entity, domain/action/actorId/branchId/from/to and pagination                               |
| GET    | `/audit/:id`           | Re-authorized sanitized detail; no edit/delete/export route                                                                                 |

Pagination defaults: page 1, pageSize 20, maximum 100 (page bounded to 100000). Ordering is createdAt/id descending; assignment history uses startedAt/id. Audit instants require ISO UTC timestamps; local datetime inputs convert to ISO. Invalid date ranges reject. Lists contain total/page/pageSize/items. Exact shared request and response schemas: `packages/contracts/src/admin/admin.schema.ts`. Existing auth schema supplies all five role identifiers.

Create staff uses existing email identity and displayName. Technical input bounds: trimmed nonempty name <=100, normalized valid email <=254; branch name <=100, required address <=500 and existing city ID. These constrain this interface, not an invented organization registration handbook or new city governance. Existing records and identities are preserved. No city creation/prefix-administration grant is added; absent mappings produce a clear empty/blocked branch form. Branch codes use the existing city allocator, minimum three-digit padding (`LHR-001`); no MAX+1/reuse or city edit rewriting old codes.

## Transaction and module ports

`admin.service.ts` owns the application transaction coordinator; controllers parse/call/respond. `AdministrationPorts` names the explicit transaction-capable Users, Branches, Audit and administration-only overview projection capabilities. The router is the composition root; services import port types only, never another module's runtime repository. Each repository owns its domain database queries. No B dashboard/financial repository is used. Consumers must not treat these internal capabilities as independent authorization.

Auth `withAuthorization` acquires the existing shared advisory lock `72942001` before actor row locking for administrative requests; reset uses the same order. All A-03 staff/branch writes are serialized with authorization/rechecks/audit in one transaction. This avoids actor/target lock inversion in competing administrator changes. Optimistic staff/branch versions and expected current assignment IDs reject stale forms. Global serialization is intentionally conservative for this administration workload; production throughput/shared infrastructure review remains separate.

Role/status/email changes revoke target sessions; deactivation blocks login and activation revives no old session/expired temporary credential. Last active Super Admin cannot be disabled/demoted, including concurrently/self-directed. Assigned-lead deactivation or role removal requires a different active unassigned Branch Lead; replacement, account changes, session revocation and old/new audit commit together. Lead assignment also increments branch version and revokes affected sessions. Assignment alone never activates a branch. Closed is terminal; closure does not erase/release an existing lead or financial/member history.

Temporary plaintext is generated transiently, stored as Argon2id hash only, disclosed after commit once, shown in a modal, never retrieved/emailed/logged/placed in URLs or browser persistent storage. Closing the modal discards it; lost disclosure needs authorized reset. Provision/reset dialogs cannot close during their mutation. Mutation cache lifetime is zero once unobserved/reset. Lists/details omit credential/session fields. Generic request logging omits bodies/query strings. Provision/update operations have a bounded per-process limiter in addition to existing API/auth limits; distributed limits remain production work.

Audit reads reapply the shared recursive allowlist even to historical JSON stored outside the writer. Available safe before/after/context is retained; private contact/credential payloads are redacted. Existing database append-only guards remain unchanged. Reads do not invent successful mutation/audit events. No audit export permission or other-role audit read is implemented by this module.

## Remaining boundaries

City registry administration, extra registration fields, extra eligibility/approval rules, restrictions beyond approved branch policies, production topology/least privilege/distributed limiting and audit retention/export remain outside scope. Other-role scoped audit views and Developer B financial/CMS/public services are not implemented. History panels explicitly show the latest 100; organization-wide audit has pagination for older records. B must review the small router/i18n/E2E integrations; shared shell source, central API client, shared styles/components, and B business modules are unchanged. No official handbook fixtures/KPIs or remote CI/deployment acceptance is claimed.

## Exact A-03 file inventory

```text
apps/backend/src/app.ts
apps/backend/src/modules/admin/admin.repository.ts
apps/backend/src/modules/admin/admin.router.ts
apps/backend/src/modules/admin/admin.service.ts
apps/backend/src/modules/audit/audit.repository.ts
apps/backend/src/modules/audit/audit.service.ts
apps/backend/src/modules/auth/auth.service.ts
apps/backend/src/modules/auth/authorization.ts
apps/backend/src/modules/branches/branches.repository.ts
apps/backend/src/modules/users/users.repository.ts
apps/backend/tests/admin.test.ts
apps/backend/tests/auth.test.ts
apps/backend/tests/integration/administration.test.ts
apps/frontend/src/app/router.tsx
apps/frontend/src/features/admin/admin-pages.tsx
apps/frontend/src/features/admin/admin.css
apps/frontend/src/i18n/en/translation.json
apps/frontend/src/i18n/ur/translation.json
docs/api.md
docs/architecture.md
docs/super-admin.md
e2e/auth.config.ts
e2e/playwright.config.ts
e2e/specs/admin.spec.ts
e2e/specs/layouts.spec.ts
packages/contracts/src/admin/admin.schema.ts
packages/contracts/src/index.ts
project-context/03-current-state.md
project-context/05-module-status.md
project-context/12-development-handoff.md
project-context/modules/audit-trail.md
project-context/modules/authorization.md
project-context/modules/branches.md
```
