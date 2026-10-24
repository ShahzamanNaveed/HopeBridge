# members

Purpose: Approved member records.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: applications, branches, authorization.

Planned APIs (proposed, no routes implemented): Member listing and approved updates. Final paths and schemas await design approval.

Planned data relationships (not a finalized ERD): Members and approved applications.

Business rules: Only the stated responsibility is confirmed; detailed policies remain pending. Use transactions for critical state changes and preserve financial/audit integrity.

Current status: planned; no business implementation, tests or deployment. Placeholder directories establish ownership only.

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Unresolved questions: Membership identifiers and archival policy. See ../../docs/requirements/clarifications.md.
