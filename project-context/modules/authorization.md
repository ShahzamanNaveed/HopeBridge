# authorization

Purpose: Deny-by-default role and branch access.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: authentication, branches.

Planned APIs (proposed, no routes implemented): Policy enforcement on each protected endpoint. Final paths and schemas await design approval.

Planned data relationships (not a finalized ERD): Roles, permissions and user/branch assignments.

Official Requirements: Server-enforced permissions and branch isolation for exactly five authenticated roles.

Confirmed HWF Decisions: Primary responsibilities are in [permissions](../../docs/permissions.md); they are not complete grants. HR is centralized at Head Office. Members are not a login role. Deny by default and authorize branch data using branch IDs; names/cities/addresses are not identifiers.

## FIX-02: approved authorization baseline (requirements only)

Exactly five authenticated staff roles: Super Admin, Finance Reviewer, Branch Lead, HR Lead and Content Editor. SA-002 permits exactly one role per staff account. Ordinary volunteer members have no staff login; anonymous Public Visitor is not a sixth role. Backend denies by default and authorizes each action AND current record/domain/branch, including direct IDs/exports. Frontend visibility/client claims never grant scope.

[Action-level permissions](../../docs/permissions.md) govern Super Admin staff/branch/lead administration and last-admin/replacement safeguards; HR alone application acceptance/decline/reversals and transfer decisions; Branch Lead scoped approved member/team/collection/report/adjustment/remittance requests; independent Finance Return/approval/confirmation/cancellation/adjustment decisions; Content Editor bilingual CMS lifecycle without mandatory Super Admin publication sign-off. Reads do not expand those write rights or permit Approved report edits. Unspecified team/status/edit actions need approval before execution.

- **PERM-001 to PERM-005 - DECIDED:** Respectively organization-wide sanitized Super Admin audit, organization-wide financial Finance audit/records, current-assigned-branch operational Lead audit/records, authorized organization-wide HR/member history/audit, authorized CMS history/audit. Exclude unrelated private domains/secrets; no application audit edit/delete. Transfer history must not leak another branch.
- **EXP-001 to EXP-004 - DECIDED:** Financial CSV/PDF for authorized organization-wide Super Admin/Finance and current-branch Lead only; HR/Content Editor/Public denied. Server filters/effective revision/exact Decimal totals, CSV/PDF safety and private successful-export audit required; no audit-file export grant.
- **AUTH-001 to AUTH-006 - DECIDED:** Approved server credential/session controls apply; temporary login cannot perform ordinary work, invalid/expired/revoked/inactive sessions fail. Current role/single assignment is authoritative on EVERY protected request. Deactivation/reset immediately revokes required sessions; branch replacement immediately invalidates outgoing scope even with old cookies/caches. Reassignment grants no automatic other branch; transaction failure retains old valid state/access.

Policy checks precede scoped service/repository operations and repeat inside critical transactions against current state/version. Shared auth/policy/audit implementation must not be duplicated by feature teams; [module/transaction ports](../../docs/architecture.md) define integration without cross-module repository imports. Future tests must exercise permitted and forbidden role/domain/branch/direct-ID/filter/session combinations, not UI-only hiding. No business policy middleware is implemented yet.

Current status: planned; no business implementation, tests or deployment. Placeholder directories establish ownership only.

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Pending Decisions: Unspecified member/team edits/status/archival, remaining action-specific/delegation grants beyond approved workflows and technical policy/query contracts. Unapproved actions remain denied; core action/read/export scopes below are DECIDED. See [clarifications](../../docs/requirements/clarifications.md).
