# weekly-reports

Purpose: Audited weekly reporting lifecycle.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: collections, authorization, audit.

Planned APIs (proposed, no routes implemented): Auto-draft, submit, return, resubmit, approve and lock actions. Final paths and schemas await design approval.

Planned data relationships (not a finalized ERD): Report snapshots, source collections and transition history.

Official Requirements: Auto-draft, submit, return, resubmit, approve and lock. The recorded draft -> submit -> return -> resubmit -> approve -> lock sequence is not a complete transition graph. Approved report figures are immutable even after source edits. Audit every transition atomically; use transactions for critical changes.

Confirmed HWF Decisions: Branch Lead manages assigned branch weekly reports; Finance Reviewer approves/returns reports. These responsibilities do not finalize every transition permission.

Current status: planned; no business implementation, tests or deployment. Placeholder directories establish ownership only.

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Pending Decisions: Week boundaries/timezone, auto-draft trigger/content, totals, full transition graph, detailed grants, lock authority/timing and immutable snapshot design. See [clarifications](../../docs/requirements/clarifications.md).
