# audit-trail

Purpose: Traceable critical mutations and report transitions.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: all mutating business modules.

Planned APIs (proposed, no routes implemented): PERM-scoped sanitized audit queries; audit-file export authority remains PENDING, distinct from EXP financial exports. Final paths and schemas await design approval.

Database relationships (initial DB-01 physical contract in docs/database.md): Actor, action, entity, timestamp and transaction context.

Official Requirements: Audit changes and report transitions, preserve immutable approved report figures and use transactions for critical financial/report/audit changes. CSV/PDF export is required system-wide; audit export scope is not finalized.

Confirmed HWF Decisions: Application acceptance and exactly one resulting member must be in the same transaction. Application samples/tests must not contain real personal data.

## FIX-01: approved audit visibility and shared writer

PERM-001 to PERM-005 are DECIDED. Every list/detail request authenticates active staff and enforces server-derived current role/domain/branch scope, minimization and secret redaction:

| Role             | Approved sanitized audit read                                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Super Admin      | Organization-wide history                                                                                                                                   |
| Finance Reviewer | Organization-wide related financial history only                                                                                                            |
| Branch Lead      | Authorized current-assigned-branch operational history only; immediate former-branch denial under AUTH-006, no cross-branch direct-ID/transfer-history leak |
| HR Lead          | Authorized organization-wide HR/member/application/decision/assignment/transfer history only; omit unnecessary finance                                      |
| Content Editor   | Authorized CMS/revision/publication/Archive/Unpublish history only                                                                                          |

No application role, including Super Admin, updates/deletes audit or receives credentials, session tokens, private keys or sensitive authentication artifacts. Read access adds no business write permission. Preserve financial history internally even when unrelated details omitted from HR/CMS views. Exact permitted metadata/projections follow [permissions](../../docs/permissions.md), not raw ORM response exposure.

The established audit module supplies ONE shared append writer: audited source mutations and sanitized actor/system identity, action, timestamp, affected entity/record, before/after and branch/context commit together through the caller's transaction capability. System report generation uses a system actor, never a fabricated human/sixth login role. Append-only application policy does not finalize privileged maintenance/retention operations.

EXP-004 successful financial exports append sanitized actor/action/time/effective scope/filters/format/source revision IDs; no unnecessary file contents/secrets. Failed/denied attempts are not successful-export audit. EXP-001 to EXP-004 do not grant audit-file exports. [Integration ownership](../../docs/architecture.md) and [transaction boundaries](../../docs/database.md) are planned contracts; none implemented. Future tests cover five role/domain reads, old-branch/direct-ID denial, secret exclusion, audit update/delete denial and transactional rollback.

Current status: DB-01 append-only storage and transaction-bound sanitized appendAudit service are implemented and unit/PostgreSQL-tested. Permission-scoped reads/audit UI/export operations remain unimplemented; no public mutation endpoint. See [database contract](../../docs/database.md) and [current evidence](../12-development-handoff.md).

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Pending Decisions: Audit retention, pagination/filter contract, redaction configuration, monitoring/alerting, storage immutability implementation and audit-file CSV/PDF export authority. PERM-001 to PERM-005 read scope and application append-only restrictions are DECIDED, not broadly pending. See [clarifications](../../docs/requirements/clarifications.md).
