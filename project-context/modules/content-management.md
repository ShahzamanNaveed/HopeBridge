# content-management

Purpose: Organisational content draft and publication.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: authorization, shared audit and branches approved public-data projection where needed.

Planned APIs (proposed, no routes implemented): Draft editing, authorized Preview, Publish, Unpublish, Archive and actively published public reads. Final paths and schemas await design approval.

Planned data relationships (not a finalized ERD): Stable logical items, localized revisions, independent draft/published revision references, visibility and publish/archive metadata; no finalized tables/columns. Revision state and logical-item public visibility are distinct.

Official Requirements: Seven public pages: Home, About, Programs, Branches, Events, Get Involved and Contact. Content has draft/publish states; public/internal interfaces support English/Urdu RTL.

Confirmed HWF Decisions: Content Editor manages/publishes public content. Public navigation has no Login/Sign Up buttons; staff use a separate portal route and administratively provisioned accounts. Get Involved accepts account-free volunteer applications. Programs, branches and events use database-backed information connected to the staff backend/PostgreSQL. No online payment integration. Preserve current routes until implementation is authorized; organisation content follows [overview](../01-project-overview.md).

CE-001 - DECIDED: Active authenticated Content Editor may Create/Edit authorized Drafts, Preview, Publish, Unpublish and Archive with backend item/action checks; no normal Super Admin publication approval or separate Publisher role. Existing oversight unchanged; no HR, finance or operational branch grants implied.

CE-002 - DECIDED: Publish validates complete required English (en) and Urdu (ur) fields in the same logical revision, including nonempty trimmed values where applicable, types and safe rendering. English LTR, Urdu RTL. Incomplete bilingual content may be saved as Draft; optional fields are not all mandatory. System UI labels remain in i18n, not recreated as CMS fields.

CE-003 - DECIDED: Editing published content creates a new Draft; never mutate the current live revision in place. Old published revision remains live until successful validated publication atomically switches the published reference and appends actor/time/item/previous-new revision audit. Preserve historical revisions; stale concurrent writes reject and failed transaction leaves old publication unchanged.

CE-004 - DECIDED: Published events automatically appear in Past Events when their event period ends, using trusted clock and defined schedule. Classification does not unpublish/archive/delete, create a revision or rewrite audit; still-published Past events remain public. CMS-002/CMS-006 fix Asia/Karachi scheduling and Past at server now >= end instant; date-only/multi-day variations beyond the start/end model remain implementation detail or separately PENDING.

CE-005 - DECIDED: Normal Content Editor operations use Unpublish (remove current published visibility) or Archive (retire active item), not physical deletion of published content. Preserve stable identity, revisions, relationships and append-only audit with actor/time/old-new state. Visibility changes and audit are atomic/concurrency-safe; failed operation cannot partly change publication. Restore/republish archived policy remains PENDING.

Public APIs expose only actively published nonarchived content; visitors need no staff authentication. Draft/internal preview requires backend-authorized staff; unpublished/archived/historical revisions cannot leak as current public content. Public language switching uses corresponding published localization. Archive/unpublish of editorial sections cannot remove seven required routes or disable volunteer form/backend validation; CMS cannot modify protected branch/member/HR/financial data. Public caches/pointers reflect committed state; unsafe script/rich-text rendering must be prevented.

Workflow details: [Draft/Preview/Publish](../../docs/flows/content-editor/draft-preview-publish-content.md), [Events](../../docs/flows/content-editor/manage-events-content.md) and [Archive/Unpublish](../../docs/flows/content-editor/archive-unpublish-content.md).

## CMS-001 to CMS-007 - DECIDED content contracts

Approved HWF policies refining CE-001 to CE-005; no CMS models, endpoints or business tests implemented. Fields below are conceptual, not finalized Prisma column names.

| Content type          | Required for Publish in the same revision                                        | Other supported fields                                        |
| --------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Program (CMS-001)     | English and Urdu title, summary and description                                  | Optional image; publication/workflow status; display ordering |
| Event (CMS-002)       | English and Urdu title and description; start date/time; end date/time; location | Optional image; publication/workflow status                   |
| Public page (CMS-003) | English and Urdu title and body; controlled page identifier/slug                 | Revision/publication status                                   |

- **CMS-001 - DECIDED:** Retain Education Support, Food Assistance, Healthcare Support and Emergency Relief; no new compulsory categories. Incomplete translated Drafts allowed. All mandatory EN/UR Program fields must be complete for Publish; image absence never blocks publication.
- **CMS-002 - DECIDED:** Event Publish requires the table's bilingual fields, location and valid start/end. Interpret scheduling in Asia/Karachi; persist unambiguous comparison-ready timestamps, validate server-side end > start and render localized English/Urdu date/time. Optional image; no registration/ticket/pricing/attendance requirement. Date-only/multi-day variations beyond approved start/end remain implementation detail or separately pending; no event-specific timezone override approved.
- **CMS-003 - DECIDED:** Protect Home /, About /about, Programs /programs, Branches /branches, Events /events, Get Involved /get-involved and Contact /contact. Controlled identifiers/slugs cannot remove these routes. Missing/retired CMS content uses safe unavailable/fallback presentation, never Draft/staff metadata. Structured Programs/Events and authorized public Branches data may supplement pages; routing is not arbitrary editable CMS slugs.
- **CMS-004 - DECIDED:** Save partial English/Urdu Drafts; backend Publish validates every mandatory field in both languages in the SAME revision. EN LTR/UR RTL; no silent partial translation publication. Published edits create a new Draft, preserving immutable old published revision/history and live visibility until another eligible publication or authorized retirement. Atomically switch published pointer with audit; no Super Admin publication approval or sixth Publisher role.
- **CMS-005 - DECIDED:** Server-side sanitize every publishable rich-text field; reject or sanitize unsafe HTML/scripts/event-handler attributes/dangerous URLs before safe public and protected staff preview rendering. Preview never bypasses publication authorization. Restrict image formats to validated safe types, inspect metadata AND actual file content, enforce configured sizes, safe storage paths/identifiers and revision-safe image references; never trust filename/MIME alone or expose private filesystem paths. Upload/edit requires authorized staff. Public responses contain sanitized actively published content only; no mandatory vendor/library chosen.
- **CMS-006 - DECIDED:** For published nonretired events, authoritative server now >= unambiguous end instant means Past, no longer upcoming/current exactly at end. Localized Asia/Karachi display; never browser-only timing/manual Past flag or publication-state transition. Preserve publication/revisions/history without automatic Archive/Unpublish/Delete. Draft/unpublished/archived events stay hidden regardless of date.
- **CMS-007 - DECIDED:** Authorized Archive/Unpublish immediately excludes retired content from public lists AND detail/direct-ID endpoints. Preserve identity, revisions, relationships and audit; no normal hard delete. Coordinate cache invalidation so newly fetched content cannot serve retired data as live. Staff history remains permission-scoped. Required routes retain safe fallback; restoration/reactivation policy remains PENDING.

### Planned CMS acceptance coverage (not implemented or executed)

1. Incomplete bilingual Draft saves.
2. Missing mandatory English field rejects Publish.
3. Missing mandatory Urdu field rejects Publish.
4. Complete bilingual Program publishes, including without optional image; ordering supported.
5. Complete bilingual Event with required location/start/end publishes without optional image.
6. Event end equal to or before start rejects server-side.
7. Authoritative server time classifies event Past exactly at end, despite browser clock differences.
8. Past classification never automatically archives/unpublishes/deletes or changes revision history.
9. Old published revision stays live during new Draft editing.
10. Eligible new revision pointer and audit publish atomically; failure leaves old live content.
11. Anonymous reads never reveal Draft/internal preview data.
12. Archived/unpublished content unavailable by direct ID as well as lists.
13. All seven mandatory public routes survive missing/retired editorial content.
14. Slug edits cannot remove mandatory routes.
15. Unsafe HTML/scripts/event handlers/dangerous URLs cannot cause stored XSS in public or staff preview.
16. Unsafe image actual-content/metadata/type/size/path input is rejected; safe references survive revisions.
17. Unauthorized role cannot Publish or bypass private preview/upload checks.
18. Authorized Content Editor publishes without Super Admin approval.
19. Archive/Unpublish preserves identity/revision/audit history and immediately hides public data, including newly fetched caches.
20. Same-revision English/Urdu content and event dates render localized LTR/RTL correctly.

Integration ownership: established backend/frontend module `content`. Own bilingual Program/Event/Page revisions/publication/retirement. Backend validates shared DTOs and sanitizes; public projections never expose Draft/history/private data. Use same transaction for pointer/history/audit and meet immediate retirement/cache guarantee; no operational branch repository edits. See [shared integration contracts](../../docs/architecture.md) and [API categories](../../docs/api.md). These are planned interfaces, not implemented services.

Current status: planned; no business implementation, tests or deployment. Placeholder directories establish ownership only.

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Pending Decisions: Approved page copy/branding, additional per-type constraints beyond CMS-001 to CMS-003; exact safe image-format allowlist, file-size/dimension limits, storage vendor, transformation pipeline, rich-text editor/format/sanitizer library and implementation; date-only/multi-day variations beyond approved start/end, archived restoration/reactivation/republication and repeat-operation details; specific safe fallback presentation, cache invalidation/storage/TTL mechanism and editorial notifications. Server sanitization/upload checks, Asia/Karachi/end-instant behavior, immediate retirement visibility and mandatory route survival are DECIDED, not pending guarantees. CE-001 to CE-005 remain unchanged. See [clarifications](../../docs/requirements/clarifications.md).
