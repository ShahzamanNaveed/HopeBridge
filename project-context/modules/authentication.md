# authentication

Purpose: Identity and server-managed sessions.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: users, authorization.

Planned APIs (proposed, no routes implemented): login, logout and current-session endpoints. Final paths and schemas await design approval.

Planned data relationships (not a finalized ERD): Users, credentials and persistent sessions.

Official Requirements: Five authenticated roles; see [permissions](../../docs/permissions.md).

Confirmed HWF Decisions: Staff accounts are provisioned administratively and access a separate portal route. Public visitors and volunteer applicants need no account; members have no separate login role. No separate Head Office Admin role. Public navigation has no Login/Sign Up buttons. Existing session/Argon2id architecture remains planned, not implemented.

Current status: planned; no business implementation, tests or deployment. Placeholder directories establish ownership only.

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Pending Decisions: Authorized provisioning process, session expiry, password policy and recovery. See [clarifications](../../docs/requirements/clarifications.md).
