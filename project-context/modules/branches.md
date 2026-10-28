# branches

Purpose: Branch registration and lifecycle.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: users/auth eligibility through application ports, authorization policies and shared audit.

Planned APIs (proposed, no routes implemented): Branch registration, review and lifecycle actions. Final paths and schemas await design approval.

Planned data relationships (not a finalized ERD): Branches and responsible users.

Official Requirements: Branch statuses are Forming, Active, Paused and Closed. **SA-005/SA-006 - DECIDED:** Super Admin alone changes lifecycle: Forming -> Active/Closed; Active -> Paused/Closed; Paused -> Active/Closed; Closed -> none. Closed is terminal; retain code/history. See [authoritative branch workflow](../../docs/flows/super-admin/manage-branches.md).

Confirmed HWF Decisions: Operational branches are distinct from the single Central Head Office. Multiple branches may share a city; Head Office and a branch may share an address. Independent operations/reporting require a separate branch. Creation starts Forming and may precede lead assignment. Activation requires an already assigned active eligible Branch Lead; an operating Active branch has accountable leadership, with at most one assigned active lead and one current branch per lead (SA-003/SA-006). Multiple members are allowed; assignment never automatically activates a branch. Unique database IDs and automatic concurrency-safe city codes follow [domain rules](../../docs/domain-rules.md); codes are never reused and survive city changes. Authorize data access by branch ID.

**AUTH-006 - DECIDED:** Super Admin replacement obeys SA-003/SA-004 account/assignment prerequisites atomically with old/new assignment/actor audit; any Active branch retains an eligible accountable lead. Immediately invalidate outgoing former-branch authority through affected-session revocation or equally immediate server-side session checks; no issued cookie/cache may retain scope. Current role/assignment/active status checked each request. No automatic other-branch grant; still-active outgoing user has independently authorized current permissions only. Related deactivation revokes all target sessions under AUTH-004; rollback preserves old lead/access/history. See [assignment workflow](../../docs/flows/super-admin/assign-branch-lead.md) and [security](../../docs/security.md). Future acceptance: old sessions fail former-branch requests immediately, concurrent replacements preserve uniqueness/leadership, and failures preserve prior assignment/access; no tests executed.

**FIN-014 - DECIDED:** Closed remains terminal under SA-005. Retain original collections, existing Submitted/Returned/Approved reports and immutable snapshots, adjustments/remittances/audit/member history. Deny new ordinary offline collections and ordinary future-week report generation, never treat Closed as Active or fabricate ordinary post-closure records. Legitimate pre-closure obligations need separately audited existing authorized Finance reconciliation with original occurrence/recognition metadata preserved; no revived access for inactive/unassigned Branch Lead. Exact recognition mechanism/container/accounting period for pre-closure late entries or Approved adjustments discovered after closure remains PENDING, no new report type/reopened snapshot inferred. Active/Paused automatic drafts and SA/AUTH replacement/access rules unchanged.

Future FIN-014 checks: new ordinary Closed collections fail; authorized historical report reads survive with immutable snapshots, no unauthorized post-closure settlement or staff access, and closure generates no ordinary future-week reports. These are planned tests, not implemented evidence.

Integration ownership: established backend/frontend module `branches`. Own branch IDs/city/code/lifecycle/current lead. Expose scoped authoritative branch eligibility/city/assignment DTOs; other modules cannot edit its repository. Staff replacement composes users/auth ports with one transaction/audit and immediate stale-scope invalidation. See [shared integration contracts](../../docs/architecture.md) and [API categories](../../docs/api.md). These are planned interfaces, not implemented services.

Current status: planned; no business implementation, tests or deployment. Placeholder directories establish ownership only.

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Pending Decisions: Exact registration fields, remaining operating restrictions for Paused/Closed branches beyond FIN-014, exact post-closure pre-closure-discovery recognition container/period, city-prefix registry/allocation administration and additional lead eligibility/approval details beyond SA-003/SA-004/SA-006. Core lifecycle, activation and mandatory atomic replacement before assigned-lead removal/deactivation are DECIDED. See [clarifications](../../docs/requirements/clarifications.md).
