# authorization

Purpose: Deny-by-default role and branch access.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: authentication, branches.

Planned APIs (proposed, no routes implemented): Policy enforcement on each protected endpoint. Final paths and schemas await design approval.

Planned data relationships (not a finalized ERD): Roles, permissions and user/branch assignments.

Official Requirements: Server-enforced permissions and branch isolation for exactly five authenticated roles.

Confirmed HWF Decisions: Primary responsibilities are in [permissions](../../docs/permissions.md); they are not complete grants. HR is centralized at Head Office. Members are not a login role. Deny by default and authorize branch data using branch IDs; names/cities/addresses are not identifiers.

Current status: planned; no business implementation, tests or deployment. Placeholder directories establish ownership only.

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Pending Decisions: Exact role-action grants, cross-branch visibility and assignment/delegation policies. See [clarifications](../../docs/requirements/clarifications.md).
