# members

Purpose: Approved member records.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: applications, branches, authorization.

Planned APIs (proposed, no routes implemented): Member listing and approved updates. Final paths and schemas await design approval.

Planned data relationships (not a finalized ERD): Members and approved applications.

Official Requirements: Approved member management.

Confirmed HWF Decisions: Application acceptance creates exactly one member atomically. Members are records without separate login accounts. Each has one primary branch initially and an automatically generated globally unique identifier (example HWF-000001), unchanged on transfer. Application references are separate. Branch Lead manages assigned branch members; detailed grants remain pending.

Current status: planned; no business implementation, tests or deployment. Placeholder directories establish ownership only.

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Pending Decisions: Exact identifier formatting/overflow, transfer workflow, permitted updates and archival policy. See [clarifications](../../docs/requirements/clarifications.md).
