# collections

Purpose: Offline financial collection tracking.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: branches, authorization, audit.

Planned APIs (proposed, no routes implemented): Collection entry and scoped listing. Final paths and schemas await design approval.

Planned data relationships (not a finalized ERD): Collections, branches and reporting periods.

Business rules: Only the stated responsibility is confirmed; detailed policies remain pending. Use transactions for critical state changes and preserve financial/audit integrity.

Current status: planned; no business implementation, tests or deployment. Placeholder directories establish ownership only.

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Unresolved questions: Categories, precision and corrections. See ../../docs/requirements/clarifications.md.
