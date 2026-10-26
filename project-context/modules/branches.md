# branches

Purpose: Branch registration and lifecycle.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: authorization, audit.

Planned APIs (proposed, no routes implemented): Branch registration, review and lifecycle actions. Final paths and schemas await design approval.

Planned data relationships (not a finalized ERD): Branches and responsible users.

Official Requirements: Branch statuses are Forming, Active, Paused and Closed; exact transitions are pending.

Confirmed HWF Decisions: Operational branches are distinct from the single Central Head Office. Multiple branches may share a city; Head Office and a branch may share an address. Independent operations/reporting require a separate branch. Initially one Branch Lead is assigned per branch, with multiple members allowed. Unique database IDs and automatic concurrency-safe city codes follow [domain rules](../../docs/domain-rules.md); codes are never reused and survive city changes. Authorize data access by branch ID.

Current status: planned; no business implementation, tests or deployment. Placeholder directories establish ownership only.

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Pending Decisions: Registration approvals, allowed status transitions, pause/closure effects, city-prefix registry and lead assignment details. See [clarifications](../../docs/requirements/clarifications.md).
