# applications

Purpose: Volunteer applications and HR decisions.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: authoritative branches and members application ports, authorization and shared audit.

Planned APIs (proposed, no routes implemented): Application submission and HR review. Final paths and schemas await design approval.

Database relationships (initial DB-01 physical contract in docs/database.md): Applicants, branches, reviewers and resulting members.

Official Requirements: Volunteer application and HR review/member workflows.

Confirmed HWF Decisions: Visitors apply on public Get Involved without accounts. Submission creates no member; HR Lead accepts or declines centrally at Head Office. Acceptance creates exactly one member in the same transaction. Validate frontend/backend inputs; enforce server-side rate limiting and duplicate checks. Different emails do not prove distinct identities; similar personal details may be flagged for HR review rather than automatically rejected. No public CNIC collection; use no real personal data in samples/tests. Application references differ from Member IDs.

Approved policies (requirements, not implementation): [HR review](../../docs/flows/hr-lead/review-volunteer-application.md), [HR decisions](../../docs/flows/hr-lead/approve-decline-application.md) and [public submission](../../docs/flows/public-visitor/submit-volunteer-application.md).

- **HR-001 - DECIDED:** Reject new submissions when normalized email OR Pakistani phone exactly matches another Pending application or an Active membership, including Accepted applications linked to Active members. Historical Declined applications alone do not block reapplication; similar names alone never cause automatic rejection or merging. Shared-family-phone matches still reject. Matching contacts do not prove real-world identity; different contacts do not prove distinct people. Enforce concurrency-safe checks and return privacy-preserving conflicts without revealing other records. Acceptance/reacceptance and Declined reversal recheck other eligible conflicts, excluding the current application and its legitimately linked member.
- **HR-002 - DECIDED:** Initial acceptance and reacceptance require the selected operational branch to be Active, rechecked transactionally. No silent branch reassignment. APP-003 also finalizes Active-only public operational branch options; otherwise valid Accepted reversal does not require an Active branch.
- **HR-003 - DECIDED:** Decline requires a trimmed nonempty reason, decision metadata and atomic audit; no new member is created.
- **HR-004 - DECIDED:** A Declined applicant may submit a fresh Pending application with a new unique application reference after conflict checks. Preserve the original application, decline reason and audit history; review the new record independently.
- **HR-005 - DECIDED:** Authorized HR Lead may reverse supported decisions through controlled, audited state transitions, preserving application/member history.
- **HR-006 - DECIDED:** Declined reversal restores the original application to Pending with the same reference, retaining the original decline reason, actor and timestamp and appending reversal history. No member or new reference is created.
- **HR-007 - DECIDED:** Accepted reversal restores the original application to Pending and makes its existing linked member Inactive. Preserve the link, immutable database key, permanent Volunteer ID, branch/transfer history, collections, reports and audit. AcceptedReversed is a history event, not another application status; never delete the member or release its ID.
- **HR-008 - DECIDED:** Reacceptance reactivates the same original linked member and sets the application Accepted, retaining its Volunteer ID and database key. No new member, ID or city-sequence allocation; ended assignments are not automatically restored.
- **HR-009 - DECIDED:** Reversal requires authorized HR Lead and a trimmed nonempty reason, without extra Super Admin approval. Pending applications cannot be reversed. Backend enforces authorization, current state and linkage; other staff roles gain no HR decision permissions.
- **HR-010 - DECIDED:** No fixed reversal deadline. Preserve original timestamps and append reversal actor/time/reason and audit; current integrity and permission checks still apply.
- **HWF-XM-001 - DECIDED:** Initial Volunteer ID prefix comes from the selected operational branch's authoritative current city code, not applicant residence or blindly its historical branch-code prefix. Same-city branches share one city numbering sequence. Application references (APP-000001 is illustrative/proposed) differ from permanent city-based member IDs such as LHR-V0001/FSD-V0001 and internal immutable primary keys. Transfer, reversal and reacceptance retain the original ID; enforce database uniqueness and concurrency-safe allocation, never MAX(id) + 1.
- **HWF-XM-002 - DECIDED:** Inactive members cannot receive new member-associated collections, team assignments or active volunteer participation; enforce status on backend operations. Preserve identity and historical records/amounts, including unpaid/unrouted collections for authorized reconciliation. Under BL-005, Accepted reversal ends all current active team assignments with end metadata and audit in the same transaction, retaining original start dates/history; reacceptance does not reopen them.
- **HWF-XM-003 - DECIDED:** Source Branch Lead requests member transfers; HR Lead approves/rejects. No direct Branch Lead branch change. Preserve permanent Volunteer ID, key and historical branch attribution. BL-004 requires an Active member and different Active target, with source ownership/freshness and eligibility rechecked at request and HR approval; remaining transfer details follow the [identity contract](../../docs/flows/hr-lead/volunteer-identification.md).
- **HWF-XM-004 - DECIDED:** Email the application address after committed acceptance, decline, either reversal or reacceptance. Email failure cannot roll back the committed decision/member/audit. Delivery outcome is separate from decision success; do not expose private contact matches, credentials or internal audit. An outbox/job mechanism is recommended, not finalized; no submission-email requirement is introduced.

Persistence invariants: Successful public submission atomically creates one Pending application, unique reference, branch link and required audit/trace, without a member, Volunteer ID or staff account. Initial acceptance atomically creates exactly one Active member with acceptance and decision audit; reacceptance uses the retained member. Decisions/reversals, member effects, required assignment endings and audit commit together with concurrency-safe revalidation; any write/audit/commit failure rolls back all related changes. Application statuses remain Pending, Accepted and Declined; preserve append-only history and expose only committed outcomes.

## APP-001 to APP-008 - DECIDED public application contract

Approved HWF rules; no public form/API/full workflow tests implemented; DB-01 storage/constraint tests now exist. Existing HR-001 to HR-010 and HWF-XM-001 to HWF-XM-004 remain authoritative for decisions and identity.

### Fields and validation

| Field                                    | Required | Approved constraint                                                                                      |
| ---------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| Full name                                | Yes      | 2-100 characters                                                                                         |
| Email                                    | Yes      | Valid email, maximum 254 characters; trim and lowercase                                                  |
| Pakistani mobile number                  | Yes      | Valid supported Pakistani mobile input normalized to +923XXXXXXXXX; invalid/unsupported formats rejected |
| City                                     | Yes      | Exact option catalogue/additional limits not finalized                                                   |
| Preferred operational branch             | Yes      | Existing Active operational branch ID only; backend validates                                            |
| Area of interest                         | Yes      | Exact option catalogue/additional limits not finalized; retain documented HWF programme context          |
| Motivation                               | Yes      | 20-1000 characters                                                                                       |
| Availability                             | No       | Exact options/additional limits remain technical configuration or PENDING where business-significant     |
| Privacy/data-processing consent checkbox | Yes      | Initially unchecked; explicit applicant check required; approved text/version in en/ur                   |

- **APP-001 - DECIDED:** Fields/requiredness above are final, not a proposed baseline. Do not collect CNIC; no mandatory DOB, gender, photographs, identification uploads or other sensitive additions. Availability optional; consent also required. No new staff role/account.
- **APP-002 - DECIDED:** Apply approved name/email/mobile/motivation bounds consistently in client/server validation; backend authoritative. Reject unsupported/invalid mobile formats and excess lengths, never silently truncate. Canonical mobile +923XXXXXXXXX; additional city/interest/availability catalogues, unapproved limits and supported raw-input configuration remain technical choices or PENDING where business-significant.
- **APP-003 - DECIDED:** Public preferred-branch options Active operational only; exclude Head Office/Forming/Paused/Closed. Backend rechecks submitted ID/state, including concurrent eligibility change; safely reject and ask applicant to choose eligible branch, never silently reassign. HR acceptance independently rechecks Active branch. This intake rule does not finalize general public Branches directory visibility.
- **APP-004 - DECIDED:** Before duplicate checking trim/lowercase email and normalize supported Pakistani mobile to +923XXXXXXXXX. Reject exact email OR phone match to another Pending application or Active member, including existing HR-001 Accepted-linked-Active membership scope. Historical Declined alone does not block fresh reference reapplication; similar names alone never reject and contacts do not prove unique real-world identity. Enforce eligible-record scope concurrency-safely; HR rechecks exclude own application/legitimate member, preserving reversal/reacceptance. Public conflicts reveal no unnecessary private records. Do not apply unapproved provider-specific email transformations.
- **APP-005 - DECIDED:** Required privacy/data-processing checkbox defaults unchecked and must be explicitly checked; record approved consent-text version and authoritative server acceptance timestamp. Matching en/ur localized text refers to same approved version. Page visits, data entry or language switching never constitute consent. Exact legal wording, retention durations and public privacy-page publication remain separately PENDING; no legal claims invented.
- **APP-006 - DECIDED:** Backend application-submission rate limiting plus honeypot, generic abuse-safe errors, no private data/internal anti-bot classification leakage and no validation bypass. CAPTCHA not mandatory; no third-party provider selected. Exact thresholds/honeypot/deployment tuning remain technical configuration; no OTP requirement added.
- **APP-007 - DECIDED:** Anonymous success validates fields/consent/branch/contacts/abuse controls, then atomically creates one Pending application/new unique reference, normalized contacts, consent metadata and required auditable submission event. Recheck branch/contacts concurrency before commit; safe acknowledgement/reference only after commit, failure rolls back. No member, staff account or Volunteer ID/city sequence on submission. Later HR first acceptance transaction rechecks Active branch, creates exactly one member with permanent selected-branch-authoritative-city ID and decision audit; reversal/inactivation/reacceptance retain same identity under existing HR/XM rules.
- **APP-008 - DECIDED:** Form en/LTR and ur/RTL; translate labels, required indicators, field errors, status/acknowledgement and consent. Server provides stable validation error codes for localized client messages; associate errors with fields accessibly. Preserve applicant-entered values on ordinary validation failures and preserve values AND validation state on language change, with translated labels/errors and no implicit submission/consent or route change. No applicant data in URLs/analytics/public content endpoints. Anonymous, no staff login.

[Public submission](../../docs/flows/public-visitor/submit-volunteer-application.md) owns the form flow; [HR decision](../../docs/flows/hr-lead/approve-decline-application.md) owns later membership.

### Planned APP acceptance coverage (not implemented or executed)

1. All required fields including explicit consent checked; Availability optional and no CNIC.
2. Name 2/100 and motivation 20/1000 boundaries valid, below/above fail without truncation; email max 254 enforced consistently.
3. Invalid/unsupported Pakistani mobile rejected server-side.
4. Supported mobile inputs canonicalized to +923XXXXXXXXX consistently.
5. Email trimmed/lowercased consistently without unapproved provider transformations.
6. Exact normalized duplicate email against eligible Pending/Active membership rejected.
7. Exact normalized duplicate phone against eligible Pending/Active membership rejected.
8. Historical Declined alone permits fresh unique-reference reapplication.
9. Similar names alone cause no automatic rejection or identity merge.
10. Public branch options Active operational only, Head Office excluded.
11. Direct Forming/Paused/Closed branch submission and concurrent unavailability rejected safely without reassignment.
12. HR acceptance transaction independently rechecks selected Active branch.
13. Unchecked/missing consent rejected; visit/entry/language change never auto-checks it.
14. Correct approved bilingual consent version and server timestamp committed with submission.
15. Honeypot/backend rate limits enforced with generic errors; CAPTCHA not required and validation not bypassed.
16. Accessible en/ur field errors/status/acknowledgement, LTR/RTL and preserved form values on validation/language change.
17. Anonymous success creates exactly one Pending application/reference with normalized contacts/consent/submission audit.
18. No member/staff account/Volunteer ID before HR acceptance; no personal data in URLs/analytics/public content.
19. Concurrent duplicate contacts cannot both create eligible Pending records; failed branch/consent/audit/commit creates no partial state.
20. HR acceptance/member/decision audit atomic; reversal/reacceptance preserve original member/Volunteer ID.

Integration ownership: established backend/frontend module `applications`. Own intake/contact/consent/duplicate screening/application history and HR decisions. Coordinate members creation/reversal/reactivation through transaction-aware commands; no members repository import, second commit or second ID allocation on reacceptance. Email follows commit. See [shared integration contracts](../../docs/architecture.md) and [API categories](../../docs/api.md). These are planned interfaces, not implemented services.

Current status: DB-01 shared storage is implemented and PostgreSQL-tested; module business services/endpoints/UI and full acceptance remain planned, not deployed. See [physical model/consumer contract](../../docs/database.md) and [DB-01 evidence](../12-development-handoff.md).

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Pending Decisions: Exact city/interest/availability catalogues and additional unapproved limits, supported raw mobile-input configuration and identity-resolution/similarity details beyond APP-004/HR-001; exact application-reference formatting; approved legal consent wording, retention durations and public privacy-page publication. Rate thresholds/honeypot/deployment tuning remain technical configuration; CAPTCHA not mandatory, no OTP requirement. Email provider/retry/templates/infrastructure, safe new Decline on retained-member Pending, independent-module state conflicts beyond BL-005 and remaining transfer consent/financial coordination stay PENDING. APP-001 to APP-008 required fields/bounds/Active intake/normalization/consent control/anti-abuse/submission/localization are DECIDED, not implemented. See [clarifications](../../docs/requirements/clarifications.md).
