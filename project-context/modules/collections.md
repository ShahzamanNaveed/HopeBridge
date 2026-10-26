# collections

Purpose: Offline financial collection tracking.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: branches, authorization, audit.

Planned APIs (proposed, no routes implemented): Collection entry and scoped listing. Final paths and schemas await design approval.

Planned data relationships (not a finalized ERD): Collections, branches and reporting periods.

Official Requirements: Offline collection records with a server-enforced seven-day edit lock and audit trails. No online payment integration.

Confirmed HWF Decisions: Branch Lead manages assigned branch collections; Finance Reviewer monitors unsent collections. Exact role-action grants remain pending. Use authorized branch IDs and preserve financial/audit integrity through transactions.

Current status: planned; no business implementation, tests or deployment. Placeholder directories establish ownership only.

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Pending Decisions: Categories, currency/precision, correction rules, unsent definition and seven-day lock reference timestamp, timezone/boundary and exceptions. See [clarifications](../../docs/requirements/clarifications.md).
