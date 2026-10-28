# Activity: Submit and Resubmit Weekly Report

**Primary Actor:** Branch Lead (own-branch submission/resubmission)
**Supporting Actors:** Finance Reviewer (return/approve only under finance permission), report/collection services, audit; Super Admin oversight only under established grants.
**Status:** Required lifecycle documented; BL-001 to BL-003 and FIN-001 to FIN-004 DECIDED; not implemented or tested

## Purpose

Submit a valid own-branch draft, inspect finance feedback and resubmit after only eligible corrections, preserving immutable approval and complete transition history.

## Preconditions

- Active authenticated Branch Lead with one server-derived branch assignment and allowed report state.
- Canonical branch/week report follows [BL-003 calendar](review-weekly-report-draft.md), approved exact financial model and current source/revision checks.
- Finance return/approval is independently backend-authorized; Branch Lead cannot self-approve.

## Inputs and Outputs

- Report identity, branch/week, current state/revision and exact source totals; review feedback/return reason under applicable finance workflow.
- Output submitted revision/snapshot with actor/time, Returned feedback, approved immutable snapshot or safe error.
- Transition audit: report, branch/week, actor, from/to status, timestamp, applicable reason, revision/snapshot and meaningful before/after values. No mutation/deletion of previous events.

## Main Flow

1. Branch Lead opens own-branch Draft. Backend rechecks role/branch/current state, totals and consistency against current sources.
2. In one version/state-protected transaction, capture consistent immutable submission revision/snapshot with submitter/time, move Draft to Submitted, preserve previous revisions, append transition audit and enforce linked collection locks; commit before showing submission success to Finance Reviewer queue.
3. Finance Reviewer separately authorizes review. FIN-008 Return validates mandatory meaningful trimmed nonempty reason, records feedback and transition audit atomically and moves Submitted to Returned; approval follows permissible state checks and atomic approval audit.
4. On Returned, Branch Lead inspects feedback. Corrections use [BL-001/BL-002](manage-offline-collections.md): only original age less than seven days and permitted report/snapshot state. Return never resets created_at or grants override.
5. Reconcile current exact totals/revision after permitted correction, or without correction if appropriate and validations pass. Resubmit via protected state transition, new submission/revision event and audit; collections lock again while Submitted and finance reviews again.
6. Finance Reviewer approval transaction rechecks current role/scope/version and unresolved issues capable of materially changing this candidate report's eligible figures under WR-004. Relevant unresolved issue denies approval with report unchanged; unrelated branch/period/non-affecting request does not automatically block. Reassess after resolution, exclude unapproved amounts and use Return/resubmit if frozen figures need correction. Valid approval sets canonical Approved (permanently Locked), captures immutable authorized revision, reviewer/time/lock metadata and approval/locking audit together. No separate manual final-lock action or permission exists; Branch Lead cannot approve or Finance-confirm remittance.

## Alternative / Error Flows

- Wrong role, cross-branch report, missing/invalid state or stale revision: reject safely without submission or approval.
- Returned error concerns a collection at/after seven-day cutoff: deny original edit; FIN-002 requires separate original-linked signed next-report adjustment. FIN-006 Branch Lead request/Finance approval and next-eligible-report recognition apply; no return/resubmit bypass or financial override.
- Concurrent collection edit/submission/finance decision: protect source/revision/state validation so only compatible atomic result commits; cannot double-submit or rewrite Approved/Locked.
- Any state/history/audit/commit failure: rollback related changes; no partial locks, revisions or totals.
- Finance return/approval requires Finance Reviewer authorization even when shown in this end-to-end diagram. Branch Lead identity never supplies that permission.

## Business Rules

- **OFFICIAL lifecycle actions / FIN-004 representation:** Draft -> Submitted -> Returned -> Submitted (resubmission revision/event) -> Approved, with permanent locking applied atomically at approval. Canonical persisted states are Draft, Submitted, Returned, Approved; Locked describes the Approved effect, not a later manual state/action. Return is not mandatory before approval.
- **BL-001 - DECIDED:** Normal collection edits strictly before authoritative created_at + 7 x 24 hours UTC; exactly cutoff fails, edits/backdates never reset clock.
- **BL-002 - DECIDED:** Draft/Returned permit only eligible age/scoped correction; Submitted locks until formal Return, Approved/Locked and approved snapshot inclusion permanently lock. Return cannot reopen expired entries. Approved figures never change.
- **BL-003 - DECIDED:** Branch/week identity unique; Asia/Karachi Monday 00:00 inclusive to next Monday 00:00 exclusive. Exact money only. FIN-001 attributes by actual occurrence, not created_at; creation still controls seven-day edit cutoff.
- Branch Lead submit/resubmit only own branch. Finance Reviewer returns/approves; no self-approval or invented Super Admin override. FIN-004 final lock is automatic within Finance approval; no independent lock authority/timing policy is needed.
- Every transition, submitted revision and reason where applicable is auditable atomically. Track unsent funds under approved model; reporting alone does not establish remittance.
- Official fixture totals must reconcile exactly once supplied; never invent values or financial calculations.

- **FIN-001 - DECIDED:** Actual collected_at/equivalent selects PKT occurrence week; created_at is entry/edit age only. Late entered records cannot rewrite Submitted revision or Approved snapshot; FIN-005 separately recognizes locked occurrence-week Late Entry in next eligible report, without altering original week.
- **FIN-002 - DECIDED:** Expired original collection unchanged; corrections become separate signed original-linked lines in next applicable report under FIN-006 request/approval governance. Explain gross collections/authorized adjustments separately and avoid double application. Source Branch Lead requests; only Finance Reviewer approves/rejects and only Approved recognized.
- **FIN-003 - DECIDED:** Branch Lead records own-branch remittance; Finance Reviewer independently confirms. Report submission/approval never confirms funds receipt. Unconfirmed, confirmed and outstanding balances remain distinct under exact approved formulas.
- **FIN-004 - DECIDED:** Approval and final lock, snapshot, reviewer/time and append-only audit commit together. No Approved/editable persisted state and no later manual lock. Return/approval/collection races permit only consistent state/revision outcome.

- **FIN-005 - DECIDED:** Check original occurrence-week lock: no -> normal occurrence attribution in eligible report; yes -> distinct original-linked Late Entry referencing original week in earliest subsequent same-branch non-Approved report eligible for new lines, never Submitted. Queue if none; preserve history and exactly-once recognition with transaction/uniqueness/idempotency. No automatic negative adjustment or double cumulative count.
- **FIN-006 - DECIDED:** Separate signed original-linked correction request by source Branch Lead; Finance approves/rejects PendingReview once. Only Approved recognized once in next eligible report, queue if none; Rejected zero effect. Submitted-only lock uses Return, not adjustment bypass; no original/snapshot rewrite.
- **FIN-007 - DECIDED / FIN-011 alignment:** In the same scope/recognition timing, signedOutstanding = netRecognizedCollections - confirmedRemittances may be negative; reconciliationDeficit = max(0, -signedOutstanding) is shown separately to authorized Finance/Head Office. availableToRemit = max(0, signedOutstanding - active pending reservations), never double-deduct deficit. Count original-or-Late Entry and Approved recognized corrections once; queued approvals are not yet recognized totals. Separate partial pending versus confirmed remittances; report submission/approval never confirms receipt. Exact operational calculations do not replace official KPI/fixture semantics.
- **FIN-008 - DECIDED:** Return Submitted only with backend-validated meaningful trimmed nonempty reason; persist reason/actor/time/report/from-to/revision/audit atomically and show feedback to authorized Branch Lead. Blank fails leaving Submitted; cutoff unchanged and approval/return race safe.

- **FIN-010 - DECIDED:** PKR NUMERIC(18,2)/Prisma Decimal, decimal-string APIs and decimal-safe arithmetic/comparisons for report totals/snapshots. No JavaScript number money arithmetic; reject nonfinite/unsupported precision/range, float-derived money and direct input above two fractional digits, never silently round it. HALF_UP only where calculation genuinely requires rounding.
- **FIN-011 - DECIDED:** Signed outstanding/deficit and nonnegative available follow the scoped measures above. Deficit permits no alteration of locked originals, confirmed remittances, Approved snapshots or adjustment/period history, no automatic payment/write-off and no unauthorized over-remittance. Report submission/approval is not confirmation; exact external deficit clearing/refund/recovery/period settlement remains PENDING.
- **FIN-012 - DECIDED:** Own-branch Branch Lead requests Pending remittance cancellation; only Finance approves/rejects via [remittance workflow](../finance-reviewer/confirm-head-office-remittance.md). Request/rejection retains Pending remittance/reservation; approval atomically cancels non-reserving/releases exactly once/audits. Confirmation/cancellation race has one valid result; Confirmed cannot directly cancel/delete. Submission/Return/approval never itself releases a reservation.
- **FIN-013 - DECIDED:** Sequential original-linked corrections are permitted, one PendingReview per original at a time, each Finance-decided/audited. Approval rechecks original plus all Approved corrections (including awaiting recognition) plus candidate nonnegative; each Approved recognized once in eligible period, Rejected zero. Closing/rejection permits another request; preserve original/prior approvals/Approved snapshots. See [adjustments](../finance-reviewer/review-financial-adjustments.md).
- **WR-004 - DECIDED:** No blanket submission/approval block follows from pending requests. Finance approval must transactionally reject only unresolved issues capable of materially changing this candidate report's eligible figures in its branch/recognition scope. Unrelated branch/period/non-affecting requests do not block; distinguish occurrence/recognition/reviewed periods and reassess after resolution. Exact multi-period dependency treatment needs specification; PendingReview/Rejected/queued-unrecognized amounts never enter recognized totals.

- **WR-001/WR-002/WR-005 - DECIDED:** Scheduled/recovery system process, not manual dashboard opening, provides unique just-completed/missed eligible Active/Paused branch/week Drafts, zero activity included; retries preserve existing state/revisions. Head Office not operational, FIN-014 ordinary Closed-branch future reports prohibited; legitimate pre-closure recognition container/period PENDING, no fake transactions. A valid zero-activity report follows normal Branch Lead submit/resubmit and Finance reasoned Return/approval.
- **WR-003 - DECIDED:** Draft/Returned latest eligible values obey original cutoff/state/recognition rules; submitted/resubmitted figures frozen in separate preserved immutable revisions with submitter/time. Return never changes old revision; resubmission creates new one. Approved final snapshot never changes for later corrections/remittance confirmations/source records.
- **WR-006 - DECIDED:** Every transition backend-checks current role/branch/state/version or equivalent control. State/new revision or snapshot/audit commit together; conflicting/duplicate success or financial recognition rejected safely. Approved -> Draft/Returned forbidden; no separate manual Lock.

- **FIN-014 - DECIDED:** Closed permits no new ordinary collections/future-week reports; retain original/report/snapshot/financial/member/audit history. Pre-closure reconciliation needs existing authorization/separate audit, no revived inactive/unassigned lead access. Exact discovery recognition container/period after closure PENDING; no new report type/reopening; Active/Paused drafts unchanged.
- **FIN-015 - DECIDED:** Same WR-004 relevance rule: transactionally recheck candidate branch/report/period/recognition material effect. Unrelated/mere request existence does not block; exclude unapproved amounts, resolve then reassess. No automatic adjustment approval/global submission ban/frozen rewrite.
- **FIN-016/FIN-017 - DECIDED:** Future eligible same-branch recognized collections offset cumulative deficit exactly once/in correct period, not other-branch funds or artificial transfers. Preserve immutable weekly figures/nonnegative available. Remittance uses branch-level availability, no mandatory collection-ID allocation; role separation/reservations/confirmation/cancellation/audit/concurrency safeguards unchanged.
- **FIN-018 - DECIDED:** Adjustment reason mandatory/file optional; valid no-file allowed, attachment not substitute for reason/correctness. Finance review/upload controls apply; remittance file optional, amount/date/reference required. See [authoritative financial definitions](../../domain-rules.md); provider/limits are technical configuration.

## Postconditions

- Successful submission/resubmission is in finance review with linked edits locked and append-only transition/revision history.
- Returned contains traceable feedback; only eligible original edits or separately governed next-report adjustments are possible. Approved is already locked with immutable snapshot/history.
- Failed operations preserve consistent prior report/collection states and financial figures.

## Activity Diagram

```mermaid
flowchart TD
    A([Start]) --> B["Branch Lead opens own-branch Draft or Returned report"]
    B --> C{"Backend: Branch Lead authorized and state valid?"}
    C -->|No| X["Reject safely"]
    C -->|Yes| D{"Returned?"}
    D -->|No - Draft| E["Validate exact totals, source revision and consistency"]
    D -->|Yes| F["Branch Lead reads finance feedback"]
    F --> G{"Correction needed?"}
    G -->|No| E
    G -->|Yes| H{"BL-001 age and BL-002 editing eligibility pass?"}
    H -->|No| I["Deny original edit; inspect FIN-002 next-report adjustment policy; no override"]
    H -->|Yes| J["Protected correction/audit and eligible aggregate recalculation"]
    J --> K{"Correction commit successful?"}
    K -->|No| R["Rollback affected transaction; show error"]
    K -->|Yes| E
    E --> AA{"Original Occurrence-Week Report Locked?"}
    AA -->|No| AB["Validate normal occurrence lines"]
    AA -->|Yes| AC["Validate distinct next-eligible Late Entry references; preserve original snapshot"]
    AB --> ADJ["Validate Approved-only adjustment lines and exactly-once financial recognition"]
    AC --> ADJ
    ADJ --> L{"Current data and revision valid?"}
    L -->|No| X
    L -->|Yes| M["Transaction: recheck; submit or resubmit revision, audit and Submitted collection locks"]
    M --> N{"Submission commit successful?"}
    N -->|No| R
    N -->|Yes| O["Finance Reviewer inspects Submitted revision"]
    O --> P{"Backend: Finance Reviewer decision authorized?"}
    P -->|No| X
    P -->|Yes| Q{"Finance decision?"}
    Q -->|Return| RR{"Return Reason Valid after trimming?"}
    RR -->|No| RX["Validation error; keep Submitted"]
    RR -->|Yes| S["Transaction: recheck state; record feedback/reason, Returned and audit"]
    S --> T{"Return commit successful?"}
    T -->|No| R
    T -->|Yes| F
    Q -->|Approve| RI{"No relevant unresolved material report issue?"}
    RI -->|No| X
    RI -->|Yes| U["Transaction: recheck role/scope/state/version and relevant issues; approve/lock immutable snapshot and audit"]
    U --> V{"Approval commit successful?"}
    V -->|No| R
    V -->|Yes| AD["Approved already permanently Locked; no manual final-lock action"]
    RX --> Z([End])
    X --> Z
    R --> Z
    I --> Z
    AD --> Z
```

## Acceptance Criteria

- Own-branch Draft submission/Returned resubmission only; other-branch and self-approval requests fail server-side.
- Submitted collection edits locked; authorized Finance Reviewer return audited; Returned correction still requires original age strictly under seven days.
- Repeated/concurrent transitions cannot double-submit, accept stale revision or overwrite Approved figures. Cutoff errors do not enable override.
- Every submit/return/resubmit/approve/lock transition records actor/state/time/report/branch/week/revision and applicable feedback atomically; audit failures roll back business changes.
- Finance approval automatically locks snapshot in same transaction; no Approved/unlocked intermediate state or later manual step. Failed approval/audit/lock writes leave prior state.
- Occurrence-based attribution and signed adjustment lines remain separate from gross/confirmed/unconfirmed remittances; no approval-as-settlement inference or double effect.
- FIN-005 one normal-or-Late Entry effect and FIN-006 Approved-only signed adjustment recognition validated before submission; no duplicates or immutable snapshot changes. FIN-008 blank/whitespace return fails; valid reason visible to authorized Branch Lead.
- PKT boundaries, exact totals and official financial fixtures remain future verification targets, without guessed data. No tests are implemented/executed by this document.

- FIN-010 values remain exact; FIN-011 negative signedOutstanding is visible as deficit while available stays nonnegative. Report actions cannot silently confirm/cancel remittances or rewrite old transactions. FIN-012 reservation and FIN-013 sequential/Approved-only recognition constraints remain intact without automatically blocking every pending adjustment. Future criteria only.

- Planned WR tests: Active/Paused zero-activity Draft submission succeeds without fake transactions; Draft/Returned reflect eligible latest values, Submitted remains frozen and denies original edits; Return reason required and resubmit preserves earlier revision/actor/time.
- Relevant material unresolved issue blocks candidate approval in transaction, unrelated branch/period/non-affecting request does not; after resolution reassess without unapproved inclusion/frozen overwrite. Competing transitions permit one valid result, stale versions/forbidden roles/cross-branch submission fail, state/revision/audit roll back together and Approved cannot reopen. Final snapshot unchanged by later adjustments/remittance confirmation. No executed tests claimed.

- Planned FIN integration tests: preserve Closed history/no ordinary future report or new collection, deny unauthorized settlement; relevant material unresolved issue blocks candidate approval and unrelated issue does not. Correct same-branch/other-branch deficit behavior, no historic rewrite, exact branch-level partial remittance without collection allocation, reason/no-file validation and concurrent over-remittance prevention are planned for source workflows. No tests executed here.

## Pending Decisions

- Late-entry evidence and adjustment-upload technical configuration, backdating limits, Finance adjustment decision explanation, exact external deficit clearing/refund/recovery and cross-period settlement. FIN-010 monetary model, FIN-011 signed-deficit accounting and FIN-013 sequential/cumulative invariants are DECIDED.
- Confirmed-remittance dispute investigation/authority/accounting, external bank evidence validation, expiry/other rejection-release paths, exceptional historical allocation/reconciliation and settlement, financial notifications/provider/recipients, exact official KPI/fixtures, Exact legitimate pre-closure discovery recognition container/accounting period after closure, scheduler hosting and snapshot schema/storage details. Core WR generation/recovery/revision/zero-activity/concurrency behavior is DECIDED. FIN-012 Pending cancellation and exactly-once release are DECIDED.
- Recognition routing, adjustment ownership/approval-before-recognition, partial/over-remittance rules and mandatory Return reason are DECIDED, not pending.
