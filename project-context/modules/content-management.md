# content-management

Purpose: Organisational content draft and publication.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: authorization, audit.

Planned APIs (proposed, no routes implemented): Draft editing, authorized Preview, Publish, Unpublish, Archive and actively published public reads. Final paths and schemas await design approval.

Planned data relationships (not a finalized ERD): Stable logical items, localized revisions, independent draft/published revision references, visibility and publish/archive metadata; no finalized tables/columns. Revision state and logical-item public visibility are distinct.

Official Requirements: Seven public pages: Home, About, Programs, Branches, Events, Get Involved and Contact. Content has draft/publish states; public/internal interfaces support English/Urdu RTL.

Confirmed HWF Decisions: Content Editor manages/publishes public content. Public navigation has no Login/Sign Up buttons; staff use a separate portal route and administratively provisioned accounts. Get Involved accepts account-free volunteer applications. Programs, branches and events use database-backed information connected to the staff backend/PostgreSQL. No online payment integration. Preserve current routes until implementation is authorized; organisation content follows [overview](../01-project-overview.md).


CE-001 - DECIDED: Active authenticated Content Editor may Create/Edit authorized Drafts, Preview, Publish, Unpublish and Archive with backend item/action checks; no normal Super Admin publication approval or separate Publisher role. Existing oversight unchanged; no HR, finance or operational branch grants implied.

CE-002 - DECIDED: Publish validates complete required English (en) and Urdu (ur) fields in the same logical revision, including nonempty trimmed values where applicable, types and safe rendering. English LTR, Urdu RTL. Incomplete bilingual content may be saved as Draft; optional fields are not all mandatory. System UI labels remain in i18n, not recreated as CMS fields.

CE-003 - DECIDED: Editing published content creates a new Draft; never mutate the current live revision in place. Old published revision remains live until successful validated publication atomically switches the published reference and appends actor/time/item/previous-new revision audit. Preserve historical revisions; stale concurrent writes reject and failed transaction leaves old publication unchanged.

CE-004 - DECIDED: Published events automatically appear in Past Events when their event period ends, using trusted clock and defined schedule. Classification does not unpublish/archive/delete, create a revision or rewrite audit; still-published Past events remain public. Exact date-only/multi-day/timezone representation remains PENDING, separate from approved automatic classification.

CE-005 - DECIDED: Normal Content Editor operations use Unpublish (remove current published visibility) or Archive (retire active item), not physical deletion of published content. Preserve stable identity, revisions, relationships and append-only audit with actor/time/old-new state. Visibility changes and audit are atomic/concurrency-safe; failed operation cannot partly change publication. Restore/republish archived policy remains PENDING.

Public APIs expose only actively published nonarchived content; visitors need no staff authentication. Draft/internal preview requires backend-authorized staff; unpublished/archived/historical revisions cannot leak as current public content. Public language switching uses corresponding published localization. Archive/unpublish of editorial sections cannot remove seven required routes or disable volunteer form/backend validation; CMS cannot modify protected branch/member/HR/financial data. Public caches/pointers reflect committed state; unsafe script/rich-text rendering must be prevented.

Workflow details: [Draft/Preview/Publish](../../docs/flows/content-editor/draft-preview-publish-content.md), [Events](../../docs/flows/content-editor/manage-events-content.md) and [Archive/Unpublish](../../docs/flows/content-editor/archive-unpublish-content.md).

Current status: planned; no business implementation, tests or deployment. Placeholder directories establish ownership only.

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Pending Decisions: Exact mandatory per-type schemas/constraints and approved page copy/branding; media formats/storage/dimensions/upload limits; rich-text format/sanitization implementation; date-only/multi-day/event-timezone scheduling details; archived restoration/republication and repeat-operation details; optional/mandatory editorial fallbacks, caching/invalidation and editorial notifications. CE-001 to CE-005 authority, bilingual publication, revision preservation, Past classification and Archive/Unpublish are DECIDED, not pending. See [clarifications](../../docs/requirements/clarifications.md).
