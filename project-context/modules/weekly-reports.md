# weekly-reports

Purpose: Audited weekly reporting lifecycle.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: collections, authorization, audit.

Planned APIs (proposed, no routes implemented): Draft, submit, return, resubmit, approve and lock actions. Final paths and schemas await design approval.

Planned data relationships (not a finalized ERD): Report snapshots, source collections and transition history.

Business rules: The confirmed lifecycle is draft -> submit -> return -> resubmit -> approve -> lock; audit every transition atomically. Use transactions for critical state changes and preserve financial/audit integrity.

Current status: planned; no business implementation, tests or deployment. Placeholder directories establish ownership only.

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Unresolved questions: Week boundaries, totals, approval/locking authority. See ../../docs/requirements/clarifications.md.
