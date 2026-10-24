# dashboard

Purpose: Head-office and branch figures.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: collections, weekly reports, authorization.

Planned APIs (proposed, no routes implemented): Scoped summary and reporting endpoints. Final paths and schemas await design approval.

Planned data relationships (not a finalized ERD): Derived aggregates over approved source data.

Business rules: Only the stated responsibility is confirmed; detailed policies remain pending. Use transactions for critical state changes and preserve financial/audit integrity.

Current status: planned; no business implementation, tests or deployment. Placeholder directories establish ownership only.

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Unresolved questions: Official formulae and sample-data expected totals. See ../../docs/requirements/clarifications.md.
