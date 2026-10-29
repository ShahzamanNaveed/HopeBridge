# Current state

## Authoritative entry points

Start at [AGENTS.md](../AGENTS.md), then read [11-team-ownership.md](11-team-ownership.md) for A/B allocation and single-editor shared files, and [12-development-handoff.md](12-development-handoff.md) for the SINGLE detailed development progress/next-action/handoff ledger. Identify the active profile explicitly before business implementation; no personal mapping is recorded. This file is a high-level baseline, not a duplicate per-module ledger. Verify status against actual code/Git/evidence in every new session.

## Implementation baseline inspected 2026-10-28

**Current addition, 2026-10-29:** A-02 authentication is implemented and locally tested: real PostgreSQL login/me/logout/password rotation/admin reset/bootstrap, current five-role/branch authorization ports, EN/UR staff screens from the supplied `.fig`, and real browser flow. See [the single ledger](12-development-handoff.md) and [implementation/limitations](../docs/authentication.md). Users/Branches mutation services and B consumer integration remain pending; no deployment/commit is claimed. The following 2026-10-28 baseline is historical.

Root HopeBridge; packages @shiplens/frontend, @shiplens/backend and @shiplens/contracts. Milestone 0 foundation exists: React/Vite public shells and /dashboard public preview, English/Urdu shell direction, Express version/health/middleware and DB/observability infrastructure, shared pagination/error/health contracts, infrastructure Prisma/migration/seed, tests and Docker/CI configuration. DB-01 now defines 33 models/21 enums and a tested shared audit writer/city-counter/input-validation foundation; other domain services remain placeholders. No functional five-role authentication/RBAC or HR/financial/report/CMS feature endpoints/UI or complete business acceptance exists; DB-01 schema/audit tests are distinct from full workflows. Source/UI branding still uses ShipLens; a public dashboard preview is not authorized financial functionality.

Local branch main and HEAD a34c4258f0299a6ac03abaeb545f39b0ba234879 were inspected with an initially clean working tree during handover setup. This is local evidence, not current remote CI/integration acceptance. See the ledger for dated source and session evidence; no code was implemented by the documentation setup.

## Approved documentation freeze baseline

27 role/public workflows documented; exactly five authenticated staff roles, anonymous Public Visitor and members without automatic staff accounts. Approved DECIDED policies: SA-001 to SA-008; HR-001 to HR-010; HWF-XM-001 to HWF-XM-004; BL-001 to BL-005; FIN-001 to FIN-018; AUTH-001 to AUTH-006; WR-001 to WR-006; APP-001 to APP-008; CE-001 to CE-005; CMS-001 to CMS-007; PERM-001 to PERM-005; EXP-001 to EXP-004. [Decision log](06-decisions-log.md), [permissions](../docs/permissions.md), [domain rules](../docs/domain-rules.md), module specs and workflows remain the business authority; A/B are contributor profiles, not new application roles.

[Architecture](../docs/architecture.md), [database](../docs/database.md) and [API](../docs/api.md) define shared Zod/DTO/error/money/time/module/transaction conventions. FIX-01 audit scopes, FIX-02 authorization, FIX-03 APP locale value/validation preservation and FIX-04 mandatory adjustment reason/optional adjustment/remittance evidence are documented. The [19-item coverage matrix](../docs/requirements/requirements-matrix.md) is documentation coverage only, not handbook inspection or completion.

Freeze means current approved policies guide development; future policy changes require explicit decision/affected-module impact review. It does not mean every business question resolved or software implemented/tested/deployed. [Classified pending paths](../docs/requirements/clarifications.md) include member/team/status/transfer/retained-member Decline and financial/legal/public projection exceptions; gate affected actions only. Nonessential library choices do not block independent approved tasks. Ownership setup introduces no new business decision.

## Verification and evidence limits

Historical local 2026-10-24 foundation build/typecheck/lint/10 backend tests/3 shell E2E/coverage and Docker limitations are in [09-testing-status.md](09-testing-status.md). Recorded 813e2ea CI passed foundation/PostgreSQL/browser/Docker build checks; later observed 145967d CI failed formatting and skipped downstream tests. No fresh remote inspection, latest green main CI or working Render deployment is established by this setup. Earlier foundation success is not current business readiness; [10-deployment-status.md](10-deployment-status.md) records deployment limits.

Official Participant Handbook, financial fixtures/expected KPI/unsent outputs and exact four-gate definitions remain unavailable. Financial fixture gate and live acceptance remain NOT VERIFIED; never invent sample financial values or claim direct handbook inspection. Prior Phase 0A line-ending-aware formatting passed while plain Windows checks failed on untouched CRLF files; its lint/typecheck tools were unavailable. Current setup runs documentation verification only, recorded in the handoff ledger; it does not run business tests/migrations/seeds/deployments.

## Current collaboration route

A owns administration/HR/identity/shared security, central schema/audit/backend/CI integration. B owns finance/reporting/CMS backend and UI, public UX/shared frontend/E2E. The approved [ownership authority](11-team-ownership.md) supersedes tentative earlier workstream proposals. [Roadmap](04-development-roadmap.md) sets dependency handoffs; detailed tasks/states/consumer verification belong only in the ledger. A consolidates branch-local ledger updates, preserving both contributors' evidence and existing work. New chats/computers see only synchronized repository files/history, not private changes. No commit/push/PR/deployment is automatic.

DB-01 local storage milestone: all three additive business migrations replayed on clean disposable PostgreSQL and applied to verified hopebridge_dev without resetting data. Seven unpublished page identities only, no staff credentials/financial fixtures. Shared schema/audit ready for parallel service implementation; producer contracts await B consumer verification. [Model contract](../docs/database.md) and [ledger evidence](12-development-handoff.md) are authoritative; latest remote CI/Render/official gates remain unverified.
