# dashboard

Purpose: Head-office and branch figures.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: collections, weekly reports, authorization.

Planned APIs (proposed, no routes implemented): Scoped summary and reporting endpoints. Final paths and schemas await design approval.

Planned data relationships (not a finalized ERD): Derived aggregates over collections and reports; exact source/approval filters depend on each metric.

Official Requirements: Head Office dashboard with correct figures, monthly trends and unsent collections; CSV/PDF export is required, with detailed scope pending.

Confirmed HWF Decisions: Head Office provides central oversight and is not an operational branch. Finance Reviewer monitors unsent collections. Server-enforced permissions and branch isolation apply.

Current status: planned; no business implementation, tests or deployment. Placeholder directories establish ownership only.

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Pending Decisions: Formulae, unsent definition, official expected sample totals, visibility and export scope/fields/grants. Aggregation sources must be defined per metric; do not assume unsent figures come only from approved reports. See [clarifications](../../docs/requirements/clarifications.md).
