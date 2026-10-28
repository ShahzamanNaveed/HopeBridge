# Decisions

2026-10-24: accepted modular monolith and stack from the brief; apps/frontend and apps/backend naming from user correction; HopeBridge remains the root. ADR: ../docs/adr/0001-foundation.md. Node 24, Prisma 7 PostgreSQL adapter, same-origin production, explicit build ordering and separate migration image chosen for foundation compatibility. Final business schema and permission matrix remain pending.

2026-10-26 ? Confirmed HWF Decisions (source: user-supplied documentation update): organisation identity/mission/programmes and Head Office structure recorded in [overview](01-project-overview.md); role responsibilities in [permissions](../docs/permissions.md); city-based branch codes, member identity, transactional HR acceptance, application safeguards and public/staff separation in [domain rules](../docs/domain-rules.md). Detailed grants remain pending.

2026-10-26 ? Official Requirements clarified by the same update: Forming/Active/Paused/Closed branches, seven-day collection edit lock, auto-draft/report actions, immutable approved figures, audited changes/transitions, dashboard trends/unsent collections, CSV/PDF export and four mandatory pass/fail criteria. Handbook/fixtures and exact acceptance definitions remain missing. This is documentation confirmation only, not feature implementation.

## Approved workflow references (synchronized 2026-10-28)

These references consolidate existing approvals, not new decisions or inferred approval dates. All are DECIDED requirements; no business implementation/test/deployment is claimed.

- SA-001 to SA-008: [staff policies](../docs/flows/super-admin/manage-staff-accounts.md), [branch lifecycle/activation](../docs/flows/super-admin/manage-branches.md), [lead assignment](../docs/flows/super-admin/assign-branch-lead.md).
- HR-001 to HR-010 and HWF-XM-001 to HWF-XM-004: [HR decisions](../docs/flows/hr-lead/approve-decline-application.md) and [permanent city-based identity](../docs/flows/hr-lead/volunteer-identification.md).
- BL-001 to BL-005: [collections](../docs/flows/branch-lead/manage-offline-collections.md), [report calendar](../docs/flows/branch-lead/review-weekly-report-draft.md), [transfer eligibility](../docs/flows/branch-lead/request-member-transfer.md) and [assignment endings](../docs/flows/branch-lead/manage-branch-members.md).
- FIN-001 to FIN-009: [financial domain rules](../docs/domain-rules.md) and [weekly reports](modules/weekly-reports.md).
- CE-001 to CE-005: [CMS lifecycle](../docs/flows/content-editor/draft-preview-publish-content.md), [event classification](../docs/flows/content-editor/manage-events-content.md) and [archive/unpublish](../docs/flows/content-editor/archive-unpublish-content.md).

Five staff roles remain unchanged; Public Visitor is anonymous and members have no staff account. See [permissions](../docs/permissions.md). Remaining implementation/policy details and unavailable official fixture/handbook evidence stay in [clarifications](../docs/requirements/clarifications.md).

## FIN-010 to FIN-013 ? approved HWF decisions

The project owner explicitly approved these additional policies; this entry synchronizes them without claiming exact handbook mandates, source implementation or test evidence. Authoritative detail: [financial rules](../docs/domain-rules.md).

- **FIN-010 - DECIDED:** PKR NUMERIC(18,2)/Prisma Decimal, decimal-string transport, two fractional digits maximum; reject unsupported precision/nonfinite/float-derived values, no JS number money arithmetic. Direct records reject excess precision; HALF_UP only for genuinely required calculation rounding, consistently across totals/snapshots/exports.
- **FIN-011 - DECIDED:** Post-remittance negative corrections preserve history and may yield signed outstanding deficit; expose separately, clamp available after reservations to zero and block insufficient remittance. No automatic compensating payment/write-off; exact external deficit clearing/recovery/period settlement PENDING.
- **FIN-012 - DECIDED:** Branch Lead requests own Pending cancellation, Finance approves/rejects. Request/rejection retains reservation; approval atomically cancels non-reserving/releases once/audits. Serialize against confirmation; no Confirmed cancellation or erased history. Confirmed disputes/settlement and bank evidence validation PENDING.
- **FIN-013 - DECIDED:** Multiple sequential adjustments, at most one PendingReview per original. Finance decides each; Approved recognized once, Rejected zero. Cumulative original plus all Approved corrections/candidate cannot be negative; protect transactionally and preserve references/decisions/audit. Attachment technical configuration, external recovery and exceptional disputes PENDING; FIN-018 reason/optional-file policy DECIDED.

FIN-001 to FIN-009 and BL-001 to BL-003 cutoff/calendar/locks, role separation and immutable snapshots remain in force. Official financial fixture gate remains NOT VERIFIED.

## AUTH-001 to AUTH-006 - approved HWF decisions

Project-owner approvals synchronized as documentation, not implementation, test evidence or additional independently verified handbook mandates. Authoritative policy/acceptance detail: [security](../docs/security.md); [authentication module](modules/authentication.md).

- **AUTH-001 - DECIDED:** Super Admin hash-only secure temporary credential, server +24h expiry, mandatory-change/restricted session and one-time protected creation/reset disclosure; no later retrieval/log/email/storage. Lost secret needs fresh authorized reset.
- **AUTH-002 - DECIDED:** Super Admin-only allowed-target reset atomically replaces credential controls, revokes all target sessions and sanitizes audit; reveal once after commit. No public/email recovery or account/last-admin safeguard bypass.
- **AUTH-003 - DECIDED:** Server-managed revocable sessions, 8h inactivity/24h absolute earliest expiry, authorized-only idle refresh, no absolute extension/resurrection; login tracked, logout revoked, password change securely rotates/invalidates. Recheck current role/branch/active status.
- **AUTH-004 - DECIDED:** Immediate deactivation session revocation/new-login denial with consistent status/audit and last-admin/lead-replacement protection; identity/history retained. Reactivation restores no sessions/expired temporary credential.
- **AUTH-005 - DECIDED:** Opaque HttpOnly scoped cookie, Secure production, appropriate SameSite, no localStorage/logged secrets, CSRF plus Origin/CORS, deny by default, login throttling/generic failures, approved hashing and noncacheable/nonlogged one-time responses. Exact strength/threshold/topology/store/monitoring configuration pending.
- **AUTH-006 - DECIDED:** Atomic eligible-lead replacement preserves Active-branch leadership and old/new actor audit; immediately revoke former-branch authority via sessions/equivalent server invalidation, no stale grants or automatic other branch. SA-001 to SA-008, five roles and HR/finance/CMS rules unchanged.

## WR-001 to WR-006 - approved HWF weekly-report policies

Owner-approved operating decisions; no scheduler, schema, endpoint or acceptance implementation is claimed. Detail: [weekly reports](modules/weekly-reports.md), [domain rules](../docs/domain-rules.md).

- **WR-001 - DECIDED:** Automatic just-completed PKT Monday-week Drafts for eligible Active/Paused operational branches, independent of dashboard views; Head Office excluded, historical reports retained and FIN-014 ordinary Closed-branch future reports prohibited; legitimate pre-closure recognition container/period PENDING.
- **WR-002 - DECIDED:** Auditable/observable scheduled recovery detects missed eligible weeks; database branch/week uniqueness plus transactions ensures idempotent concurrent catch-up without overwriting/resetting existing reports. Scheduler technology unselected; no fake staff actor.
- **WR-003 - DECIDED:** Live eligible Draft/Returned calculations versus immutable preserved submit/resubmit revisions and atomically locked final Approved snapshot. Existing cutoff/locks remain, later finance records cannot rewrite history.
- **WR-004 - DECIDED:** Transactional approval blocks only unresolved issues capable of materially changing candidate eligible figures by branch/report/recognition scope; unrelated/non-affecting requests do not automatically block, no unapproved totals. Reassess after resolution; exact multi-period dependency treatment requires specification.
- **WR-005 - DECIDED:** Eligible zero-activity weeks still generate/submit/Return/approve through normal audited lifecycle, with correct zero activity totals and no fabricated transactions.
- **WR-006 - DECIDED:** Backend state/version/role/branch checks and atomic state/revision/snapshot/audit for all transitions; conflicting outcomes/duplicate success/recognition rejected. No Approved reopening or separate manual Lock. Existing BL/FIN/AUTH policies and five-role separation preserved.

## FIN-014 to FIN-018 - approved HWF finance policies

Owner-approved decisions synchronized as documentation only, not implemented/tested/deployed or invented handbook fixture values. Detail: [domain rules](../docs/domain-rules.md).

- **FIN-014 - DECIDED:** Closed remains terminal, no ordinary new collections/future-week reports, preserve all financial/report/snapshot/member/audit history. Legitimate pre-closure obligations need authorized separate audit; exact post-closure discovery recognition container/period PENDING, no reopened report/new lead access.
- **FIN-015 - DECIDED:** Clarifies WR-004 transactional relevant adjustment/Late Entry/material dependency checks only for candidate branch/period/recognition scope; unrelated/mere existence not blocking, no unapproved inclusion/automatic approval/global submission ban. Preserve frozen evidence and reassess after resolution.
- **FIN-016 - DECIDED:** Exact cumulative same-branch future recognized collections offset deficit automatically, correct periods and once, no payment/synthetic record/cross-branch offset/historical rewrite; concurrency-safe nonnegative availability. External/manual settlement/exceptional historical reconciliation PENDING.
- **FIN-017 - DECIDED:** Branch-level remittances need no mandatory individual collection allocation. Required amount/date/reference, optional evidence, own-branch recording/Finance confirmation, partial reservations and once-only cancellation/confirmation audit remain.
- **FIN-018 - DECIDED:** Adjustment reason nonempty mandatory, file optional and not substitute for reason/permission/financial correctness. Finance review/audit, optional remittance file and upload access/type/size/safe-storage controls retained; provider/limits technical configuration pending.

## APP-001 to APP-008 - approved HWF public application policies

Owner-approved details synchronized as documentation, not implemented form/schema/test evidence or independently verified handbook wording. Authoritative [application contract and future tests](modules/applications.md).

- **APP-001 - DECIDED:** Required name/email/Pakistani mobile/city/preferred operational branch/interest/motivation/explicit consent; availability optional, no CNIC/mandatory sensitive extras.
- **APP-002 - DECIDED:** Name 2-100/email max 254/motivation 20-1000; valid supported Pakistani mobile canonical +923XXXXXXXXX, invalid unsupported rejected, consistent client/server limits and no truncation.
- **APP-003 - DECIDED:** Active operational form options/server/HR checks only, Head Office/Forming/Paused/Closed excluded; no automatic reassignment.
- **APP-004 - DECIDED:** Email trim/lowercase/mobile canonical eligible email OR phone duplicates rejected concurrency-safely under HR-001; historical Declined alone/new reference allowed, names alone not rejection, contacts not identity proof, privacy-safe errors.
- **APP-005 - DECIDED:** Default unchecked explicit localized consent with approved matching text version/server timestamp; no consent by visit/input/language. Legal copy/retention/privacy page pending.
- **APP-006 - DECIDED:** Backend rate limit/honeypot, generic abuse-safe errors, no classification/private leaks or validation bypass; CAPTCHA not mandatory, exact thresholds/tuning technical choices.
- **APP-007 - DECIDED:** Anonymous atomic Pending/reference/normalized contacts/consent/submission audit only; no member/staff account/Volunteer ID. Later HR acceptance Active recheck/member/city-ID/decision audit atomic; reversal/reacceptance preserve original identity.
- **APP-008 - DECIDED:** Accessible en/LTR and ur/RTL labels/required/errors/status/acknowledgement/consent, stable server error codes and values preserved on ordinary validation/language change; no applicant data in URLs/analytics/public content. Existing HR/XM/five-role rules unchanged.

## CMS-001 to CMS-007 - DECIDED HWF content policies

Approved requirements, not implemented CMS or independently verified extra handbook wording. Full [content contract and future tests](modules/content-management.md) preserves CE-001 to CE-005.

- **CMS-001 - DECIDED:** Program Publish requires EN/UR title, summary and description; supports status/display ordering and optional image. Existing four programmes retained, no new compulsory categories; incomplete Draft allowed, image absence not a publication blocker.
- **CMS-002 - DECIDED:** Event Publish requires EN/UR title/description, start/end and location; image optional. Asia/Karachi interpretation, unambiguous stored instants, backend end > start, localized dates; no registration/ticket/payment/attendance requirement.
- **CMS-003 - DECIDED:** Public page EN/UR title/body, controlled identifier/slug and revision/publication status. Preserve Home/About/Programs/Branches/Events/Get Involved/Contact routes despite missing/retired content, safe fallback with no Draft/private metadata; no arbitrary slug removal.
- **CMS-004 - DECIDED:** Incomplete Drafts allowed; backend Publish requires mandatory BOTH-language fields of same revision. New Draft preserves live immutable published revision/history until atomic eligible pointer switch/audit or authorized retirement; EN LTR/UR RTL, no Super Admin approval/sixth role.
- **CMS-005 - DECIDED:** Server sanitize publishable rich text against unsafe HTML/scripts/handlers/URLs for public and authorized preview; validated safe image type/actual content/metadata/size/storage identifiers, no filename/MIME trust/private paths. Staff upload/edit checks and safe cross-revision references; vendor/editor/limits remain technical choices.
- **CMS-006 - DECIDED:** Published event Past at authoritative server now >= end instant, no longer upcoming/current at end; unambiguous comparison/localized timezone display, no browser-only/manual flag or automatic retirement/history rewrite. Hidden events stay hidden regardless of dates.
- **CMS-007 - DECIDED:** Archive/Unpublish immediately removes public list/detail/direct-ID visibility with cache coordination; retain identity/revisions/audit and scoped staff history, no normal hard delete. Required routes survive with safe fallback. Restoration remains PENDING.

## PERM-001 to PERM-005 / EXP-001 to EXP-004 - approved HWF policies

Documentation only; no implementation or passing-test claim. [Full approved scopes/controls](../docs/permissions.md) preserve prior policies, five roles and separation of reads/exports from writes.

- **PERM-001 - DECIDED:** Active Super Admin organization-wide sanitized audit; no application-role edit/delete or secrets, no additional source-write rights.
- **PERM-002 - DECIDED:** Finance organization-wide financial records/report revisions/deficits and related audit only, excluding unrelated HR/security/CMS; existing creation/approval separation intact.
- **PERM-003 - DECIDED:** Branch Lead approved current-branch operations/history/audit only; server assignment, direct-ID cross-branch denial and immediate former-branch revocation, no transfer-history leak.
- **PERM-004 - DECIDED:** Authorized HR organization-wide application/member/assignment/transfer history and HR audit; omit unnecessary finance/authentication details without deleting history, no Finance approval grant.
- **PERM-005 - DECIDED:** Authorized CMS Draft/published/history/preview/retirement audit only; no unrelated HR/finance/security access or mandatory Super Admin publication approval.
- **EXP-001 - DECIDED:** Financial CSV/PDF for authorized organization-wide Super Admin/Finance and current-branch Branch Lead only; HR/Content Editor/Public denied, backend/direct-URL enforcement.
- **EXP-002 - DECIDED:** Server period/branch/status/financial filters and approved fields/accounting classifications; distinguish estimates/frozen/Approved and cumulative/period scope, exact FIN-010 PKR, no invented official KPI/fixture outputs.
- **EXP-003 - DECIDED:** Same authorization/filters/effective revision/exact totals across formats; server CSV formula/encoding protection for untrusted text preserving signed money, sanitized PDF, no separate client totals.
- **EXP-004 - DECIDED:** Sanitized append-only successful-export actor/action/time/scope/filter/format/source metadata, no unnecessary file contents/private data/secrets; denied calls never successful exports, private nonpublic/nonunintentionally-cached responses.

Audited mutations and actor/system/action/time/entity/before-after/context audit commit together. System attribution is not a sixth human role. Audit-file export authority and technical retention/redaction/filter/monitoring/generation/presentation/streaming details remain pending; official financial results remain unverified.

## Final integration/documentation baseline (2026-10-28)

This records the owner's documentation-integration instruction, not a new approval date for prior policies or an implementation milestone. Established ten-module ownership, same-transaction application ports/shared audit, conceptual uniqueness/atomicity, shared Zod/API error/money/time conventions and an unassigned two-developer handoff proposal are in [architecture](../docs/architecture.md), [database](../docs/database.md), [API](../docs/api.md) and [roadmap](04-development-roadmap.md). These architectural conventions do not add business grants or financial rules.

FIX-01 PERM audit reads and FIX-02 action/current-role/branch/export boundaries no longer broadly PENDING; audit-file exports/retention/configuration remain open. FIX-03 APP-008 preserves same-route applicant values AND validation state on locale changes without submit/leak. FIX-04 FIN-018 reason mandatory/file optional and FIN-009 optional remittance evidence separated from upload/bank/settlement choices. Prior policy families remain DECIDED, no sixth role, write expansion or changed immutability/cutoff/offset.

[Freeze baseline](03-current-state.md) distinguishes approved documentation, existing foundation, absent business implementation/tests and unverified official financial/CI/Render evidence. Future policy changes require explicit decision/affected-module impact review; unresolved member/transfer/finance/source gaps are recorded, not silently resolved.
