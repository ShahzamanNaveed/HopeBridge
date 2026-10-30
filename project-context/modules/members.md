# members

Purpose: Approved member records.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: authoritative branches, authorization and shared audit. Applications invokes member decision ports; members does not import applications repositories or require a cyclic implementation dependency.

Planned APIs (proposed, no routes implemented): Member listing and approved updates. Final paths and schemas await design approval.

Database relationships (initial DB-01 physical contract in docs/database.md): Members and approved applications.

Official Requirements: Approved member management.

Confirmed HWF Decisions (DECIDED):

- Members are records without separate login accounts and have one current primary branch. Branch Lead manages authorized assigned-branch members; detailed grants beyond confirmed responsibilities remain pending.
- Distinguish branch codes (LHR-001, LHR-002, FSD-001), application references (APP-000001 is a proposed format) and Volunteer/Member IDs (LHR-V0001, LHR-V0002, FSD-V0001). Database member primary keys are separate, internal and immutable.
- Generate a permanent ID only on initial successful HR acceptance. Use selected operational branch's authoritative current city code, not applicant residence, free text or blindly its immutable historical branch-code prefix. Each city has an independent member sequence shared across all its branches. IDs are globally unique, permanent, never reused and not manually editable; examples are not guaranteed allocation results.
- Database uniqueness constraints and concurrency-safe sequence/counter allocation are mandatory; never use MAX(id) + 1. Initial acceptance, exactly one Active member, branch/application links and decision audit commit atomically; failures leave no partial Accepted/member outcome.
- Accepted reversal returns application to Pending, retains its linked member Inactive and preserves ID, immutable primary key, branch/transfer, financial/operational and audit history. Reacceptance restores that same member Active with original ID; no second member, new number, city allocation or counter reset. Reversal/reacceptance and decision audit are atomic.
- **BL-005 - DECIDED:** Inactive members cannot receive new team/activity assignments, generate new member-associated collections or participate in new Active-required volunteer work. Backend staff-action checks must enforce status concurrency-safely, regardless of stale assignments. Preserve historical teams, collections, amounts, reports and audit; legitimate unpaid/unrouted collections remain visible for authorized financial reconciliation. BL-005 ends all current active assignments with end metadata and member/assignment audit atomically on any authorized inactivation; preserve original starts/history, never delete. Roll back assignment endings if status transition fails. Reacceptance does not reopen them; new assignment needs explicit authorized Branch Lead action. No seven-day correction exception is implied.
- **BL-004 - DECIDED:** Source Branch Lead requests transfer from their authorized branch; HR Lead approves/rejects. Only approved transfer changes current primary branch; no direct Branch Lead transfer, cross-branch escalation, new member or replacement ID. Preserve original ID/prefix/key across cities and historical source-branch attribution, with atomic transfer audit and concurrency validation. BL-004 requires member Active and different target Active at request and rechecked HR approval, with current source ownership/freshness validated. Consent, unfinished finance/report handling and other unresolved transfer details remain pending.

Authoritative identity and lifecycle details: [HR identification workflow](../../docs/flows/hr-lead/volunteer-identification.md).

**APP-007 - DECIDED:** Valid anonymous public submission creates one Pending application/reference with normalized contacts, explicit consent version/server timestamp and submission audit, never member/staff account/Volunteer ID. Only later authorized initial HR acceptance rechecks Active operational branch and atomically commits Accepted, exactly one Active member/selected-branch-authoritative-city permanent ID and decision audit. Existing reversal to linked Inactive member and reacceptance of that same member/ID remain unchanged; no new allocation/old assignment reopening. See [APP-001 to APP-008 form contract](applications.md) for intake, consent and normalized-contact safeguards; no extra member fields/login permissions introduced.

Planned acceptance: public success persists no member/ID/account; initial HR acceptance rolls back all member/decision/audit effects on failure, and reacceptance preserves the original ID. No tests executed.

Integration ownership: established backend/frontend module `members`. Own member status/permanent city Volunteer ID/team assignments/search/filter/transfer records. Application decision coordinator supplies approved decision/link/branch context to member commands using one transaction/audit; staff account roles remain separate. HR transfer approval composes branch checks; unresolved transfer paths remain gated. See [shared integration contracts](../../docs/architecture.md) and [API categories](../../docs/api.md). These are planned interfaces, not implemented services.

Documentation coverage gap: the known member-management scope includes team/operational-role/status management and search/filter. Existing workflow specifies scoped search/filter and Active-only permitted assignment with audited endings, but exact searchable/filterable fields, team/operational-role taxonomy, assignment action fields/validation, general edit/status/archival authority and independent-module state conflicts are not finalized. An operational volunteer role is not a sixth staff role. Obtain owner decisions for those affected actions; do not invent grants or declare full member-module readiness.

Current status: DB-01 shared storage is implemented and PostgreSQL-tested; module business services/endpoints/UI and full acceptance remain planned, not deployed. See [physical model/consumer contract](../../docs/database.md) and [DB-01 evidence](../12-development-handoff.md).

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures. Planned acceptance criteria (not implemented/passing tests):

- First acceptance creates exactly one linked Active member and audit atomically; selected branch city determines prefix even when residence differs.
- Same-city branches share a safe sequence; cities have independent sequences. Concurrent approvals cannot duplicate IDs; issued IDs and immutable database keys never change or recycle.
- Transfer/reversal/reacceptance retain original member and ID. Reacceptance performs no new member/ID allocation; failed transactions preserve prior state and history.
- Inactive members cannot receive new collection/team/activity operations, including status-change races; historical records, financial amounts and reconciliation items remain intact.
- Inactivation ends all active assignments atomically with end metadata/history/audit; failed status transition rolls back endings and reacceptance never reopens them.
- Only Active member/different Active target pass request and HR-approval rechecks; only valid HR-approved transfer updates one current branch after scoped Branch Lead request; unauthorized/stale/concurrent conflicts cannot corrupt assignment or historical attribution.

Pending Decisions: City-code governance/new-city codes, padding/overflow, remaining transfer consent, source-status-at-approval, cancellation/expiry/duplicate-request rules and financial handling and other transfer operational details; independent-module state conflicts, permitted updates and archival policy. Identifier city source, permanent format, transfer ownership and reversal/reacceptance invariants are decided. See [clarifications](../../docs/requirements/clarifications.md).
