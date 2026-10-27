# Permission matrix - pending approval

## Official Requirements

Exactly five authenticated roles with server-enforced permissions and branch isolation.

## Confirmed HWF Decisions

| Role             | Primary responsibility                                         |
| ---------------- | -------------------------------------------------------------- |
| Super Admin      | Users, branches and overall administration                     |
| Finance Reviewer | Approve/return weekly reports and monitor unsent collections   |
| Content Editor   | Manage and publish public website content                      |
| Branch Lead      | Manage assigned branch members, collections and weekly reports |
| HR Lead          | Review and accept/decline volunteer applications               |

No separate Head Office Admin role. HR operations are centralized at Head Office initially. Volunteers are member records, not another login role; public visitors need no authentication. Staff accounts are provisioned through an authorized administrative process.

## Pending Decisions

Responsibilities do not constitute a complete action-level permission matrix. Unspecified grants/boundaries remain pending; the financial and CMS rows/sections below record approved financial and CE-001 to CE-005 operations, not unrelated grants.

| Resource/workflow              | Super Admin | Finance Reviewer | Content Editor | Branch Lead | HR Lead |
| ------------------------------ | ----------- | ---------------- | -------------- | ----------- | ------- |
| Branch lifecycle               | Pending     | Pending          | Pending        | Pending     | Pending |
| Volunteer/HR decisions         | Pending     | Pending          | Pending        | Pending     | Pending |
| Collections and weekly reports | Pending | Return with reason; approve/auto-lock authorized Submitted | Pending | Own-branch create/eligible edit; submit/resubmit | Pending |
| Financial adjustments | Pending | Approve/reject PendingReview within Finance scope | Pending | Request eligible own-source correction; cannot approve | Pending |
| Head Office remittances | Pending | Independently confirm eligible pending records | Pending | Record/view own-branch partial remittances; cannot confirm | Pending |
| CMS content lifecycle | Existing oversight unchanged; no normal publication approval required | No automatic CMS grant | Create/Edit Draft, Preview, Publish, Unpublish, Archive authorized CMS | No automatic CMS grant | No automatic CMS grant |
| Audit access                   | Pending     | Pending          | Pending        | Pending     | Pending |

Pending is not a grant. Default deny once authorization is introduced. Verify each approved action and forbidden role/branch combination with integration tests.

## DECIDED financial operation boundaries

- FIN-006: Branch Lead may request an eligible expired/immutable own-branch collection adjustment with signed amount/explanation; Finance Reviewer approves/rejects once. Only Approved recognition affects totals. No Finance self-proposal grant or Branch Lead approval grant.
- FIN-007/FIN-009: Branch Lead records partial remittances with required positive exact amount, valid transfer date, nonempty reference and backend-derived branch; optional evidence upload is not mandatory. Validate available balance/reservations. Branch Lead cannot Finance-confirm; Finance Reviewer independently confirms once within authorized central finance scope.
- FIN-008/FIN-004: Finance Reviewer returns Submitted only with trimmed nonempty reason, or approves and final-locks atomically. Branch Lead never self-approves.
- FIN-005 recognition follows approved report scope and immutable-history constraints; it grants no cross-branch mutation or manual override.
- Backend authenticates active staff and enforces current record ownership, branch scope, state/amount/concurrency checks on every operation. Finance scope across permitted branches gives no member/CMS permission or silent source-collection edit authority. Other role grants remain pending; all five official roles are retained.

## DECIDED CMS operation boundaries

- **CE-001 - DECIDED:** Active authenticated Content Editor may create/edit authorized Drafts, Preview, Publish, Unpublish and Archive public CMS content. Normal publication requires no Super Admin approval and introduces no Publisher role. Existing Super Admin oversight is unchanged; other staff roles do not automatically inherit Content Editor grants.
- **CE-002/CE-003 - DECIDED:** Publish requires complete required en/ur content (English LTR, Urdu RTL); incomplete Drafts allowed. Published edits create a new Draft while old published revision remains live until atomic revision-pointer publication/audit; preserve history.
- **CE-004/CE-005 - DECIDED:** Published events automatically classify as Past at event-period end, without automatic archive/unpublish/delete. Normal retirement uses Archive/Unpublish, preserving item identity/revisions/audit instead of hard deletion.
- Backend authorizes CMS item/action and protected Draft/Preview access on every request. Public visitors need no authentication to read actively published content, but cannot access Draft/internal preview, archived/unpublished or private historical revisions as current content.
- CMS grants no staff management/Branch Lead assignment, operational branch lifecycle, HR decision, collection/report/remittance or restricted internal audit permission. Required public routes and account-free volunteer application remain intact.
