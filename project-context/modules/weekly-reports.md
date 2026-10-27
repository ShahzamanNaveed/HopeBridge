# weekly-reports

Purpose: Audited weekly reporting lifecycle.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: collections, authorization, audit.

Planned APIs (proposed, no routes implemented): Auto-draft, submit, return, resubmit and Finance approval actions; final locking is automatic in approval, not a separate API/user action. Final paths and schemas await design approval.

Planned data relationships (not a finalized ERD): Report snapshots, source collections and transition history.

Official Requirements: Auto-draft, submit, return, resubmit, approve and lock. The recorded draft -> submit -> return -> resubmit -> approve -> lock sequence is not a complete transition graph. Approved report figures are immutable even after source edits. Audit every transition atomically; use transactions for critical changes.

Confirmed HWF Decisions: Branch Lead manages assigned branch weekly reports; Finance Reviewer approves/returns reports. These responsibilities do not finalize every transition permission.


BL-003 - DECIDED: Reporting timezone is `Asia/Karachi`; week starts Monday 00:00 inclusive and ends the following Monday 00:00 exclusive. Each branch has one canonical weekly report per period, protected against duplicate concurrent generation. Store precise interval boundaries and use exact money types (approved integer currency units or exact NUMERIC), never binary floating-point approximations.

Preserve Draft -> Submit -> Return -> Resubmit -> Approve -> Lock lifecycle actions, with FIN-004 applying approval and locking atomically. Resubmission may return to Submitted with a new revision/event; no extra permanent status is implied. Return is not mandatory before approval. Approved snapshots remain immutable, and every critical transition and its audit commit atomically.


FIN-001 - DECIDED: Actual occurrence time selects original PKT Monday-to-next-Monday week, not created_at; created_at controls BL-001 edit cutoff and updated_at modification. Validate dates; backdating limits/evidence PENDING. FIN-005 handles already-Approved occurrence weeks without changing historical attribution.

FIN-002 - DECIDED: Expired originals keep ID, amount, occurrence/creation timestamps and audit unchanged. Correction is a separate signed original-linked next-eligible-report adjustment; gross/adjustment effects exact and separately explainable, never double-counted. FIN-006 defines Branch Lead request and Finance approval before recognition; evidence, sequential corrections and remitted-cash effects remain PENDING.

FIN-003 - DECIDED: Own-branch Branch Lead records remittance awaiting independent Finance confirmation; confirmation actor/time/state, audit and confirmed-outstanding updates atomic and once only. Unconfirmed is not settled. FIN-007 defines partial remittances/reservations and FIN-009 required details; no payment/bank integration.

FIN-004 - DECIDED: Canonical report states Draft, Submitted, Returned, Approved. Approved means permanently Locked, with locked_at/equivalent metadata applied in the same protected Finance Reviewer approval transaction as authorized submitted revision, approver/time and approval-lock audit. No later manual final lock, independent permission or Approved/editable state. Preserve submitted/returned/resubmitted revision and feedback history; concurrent approval/return/edit cannot corrupt finalization.


FIN-005 - DECIDED: Preserve actual occurrence and original week when entered after that report is Approved/Locked; recognize one distinct audited Late Entry line referencing original collection/week in earliest subsequent same-branch report eligible for new lines. Never insert into Submitted or Approved. If none exists, persist awaiting inclusion. One original and at most one active recognition line; never also recognize in original week or cumulative totals twice, nor create an automatic negative adjustment. Transactional/idempotent allocation and uniqueness guard entry/report-generation/approval races.

FIN-006 - DECIDED: Source-scoped Branch Lead requests expired or immutable-original correction with unique reference, original/branch link, signed exact amount, mandatory explanation, requester/time, applicable evidence reference, status and Finance metadata. States PendingReview -> Approved or Rejected, decision once by Finance Reviewer. Only Approved recognized once in next eligible report; persist Approved awaiting recognition if no report available. Rejected has zero effect/history retained. Recheck source, original eligibility, duplicate correction and balance integrity atomically with decision/audit/recognition. Submitted-only edit lock uses Return, not adjustment bypass. Evidence, sequential adjustment limits, Finance decision explanation and remitted-cash/negative-balance recovery remain PENDING.

FIN-007 - DECIDED: Partial remittances allowed; over-remittance rejected at submission and confirmation using exact protected branch balances. Outstanding-not-yet-confirmed = recognized net collections minus Finance-confirmed remittances, subject to approved adjustment reconciliation. Available-to-remit = outstanding minus committed active pending reservations. Submission reserves, not confirms. Confirmation converts its own reservation to confirmed effect once, excluding self from other pending reservations; retain same claim, never require amount to fit available balance again after subtracting itself. Concurrent submissions/confirmations cannot over-reserve or double-settle. Cancellation/expiry/dispute/rejection/reservation-release rules remain PENDING; stuck reservation is a known edge case.

FIN-008 - DECIDED: Finance return only from Submitted requires meaningful nonempty explanation after trimming; backend rejects blank/whitespace and preserves Submitted. Store reason with actor/time/report/from-to/revision and audit atomically. Branch Lead may read feedback; Approved cannot return and cutoff never resets. Return/approval race has one valid outcome.

FIN-009 - DECIDED: Remittance requires positive exact amount, valid transfer date, trimmed nonempty transfer reference and source branch derived from authorized Branch Lead assignment. Evidence upload optional: absence alone cannot invalidate; supported uploads require backend type/size/access/malware controls. Reference is not receipt proof; independent Finance confirmation and audit still required. No new financial notification requirement.

Financial categories: original occurrence collections; separate Late Entry recognition (not another collection); Approved signed adjustments; pending reserved remittances; confirmed remittances; outstanding and available-to-remit. Recognized net counts each original or its Late Entry once plus Approved recognized adjustments once. Weekly recognition, occurrence views, cumulative dashboards and Head Office reconciliation may differ; preserve official KPI/fixture interpretation when supplied. Official financial gate NOT VERIFIED: handbook/fixtures unavailable. All mutations audit actor/role/time/action/reference, branch/report context, before/after and required reasons without sensitive credentials; preserve historical snapshots/audit.

Current status: planned; no business implementation, tests or deployment. Placeholder directories establish ownership only.

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Pending Decisions: Late-entry/adjustment evidence, backdating limits, multiple sequential adjustments/cumulative limits, Finance adjustment decision explanations, confirmed-remittance negative-adjustment effects/recovery, remittance cancellation/expiry/rejection/dispute/reservation release (including stuck reservations), collection-level partial allocation, settlement semantics, financial notifications/provider/recipients and exact official KPI/fixtures. Unrelated auto-draft/snapshot/field details remain pending; resolved FIN-005 to FIN-009 authority, recognition, balances, reason and required remittance fields are DECIDED. See [clarifications](../../docs/requirements/clarifications.md).
