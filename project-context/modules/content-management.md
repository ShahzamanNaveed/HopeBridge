# content-management

Purpose: Organisational content draft and publication.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: authorization, audit.

Planned APIs (proposed, no routes implemented): Draft editing, publish actions and public reads. Final paths and schemas await design approval.

Planned data relationships (not a finalized ERD): Content records, revisions and publish metadata.

Official Requirements: Seven public pages: Home, About, Programs, Branches, Events, Get Involved and Contact. Content has draft/publish states; public/internal interfaces support English/Urdu RTL.

Confirmed HWF Decisions: Content Editor manages/publishes public content. Public navigation has no Login/Sign Up buttons; staff use a separate portal route and administratively provisioned accounts. Get Involved accepts account-free volunteer applications. Programs, branches and events use database-backed information connected to the staff backend/PostgreSQL. No online payment integration. Preserve current routes until implementation is authorized; organisation content follows [overview](../01-project-overview.md).

Current status: planned; no business implementation, tests or deployment. Placeholder directories establish ownership only.

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Pending Decisions: Detailed editorial grants, publication/revision constraints, page content and branding assets. See [clarifications](../../docs/requirements/clarifications.md).
