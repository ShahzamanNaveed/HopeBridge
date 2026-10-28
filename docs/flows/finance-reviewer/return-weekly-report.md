# Activity: Return Weekly Report

**Primary Actor:** Finance Reviewer
**Supporting Actors:** Backend reporting/authorization/audit; Branch Lead inspects feedback and corrects/resubmits own branch.
**Status:** Return authority documented; FIN-008 mandatory reason DECIDED; not implemented or tested

## Purpose

Return a Submitted revision for branch review while retaining source evidence and enforcing original collection-edit restrictions.

## Preconditions

- Active authenticated Finance Reviewer, backend-authorized for report branch.
- Current canonical state Submitted and persisted revision available; Approved is permanently locked, not returnable.

## Inputs and Outputs

- Report/revision identity, review explanation and current concurrency expectations.
- **FIN-008 - DECIDED:** meaningful trimmed nonempty reason required; backend rejects missing/whitespace, keeping Submitted. Store reason with actor/time/report/from-to/revision and atomic audit; authorized Branch Lead sees feedback.
- Output committed Returned state with actor/time/feedback/revision audit or safe error; original submission preserved.

## Main Flow

1. Select Submitted report; backend authenticates/authorizes Finance scope and loads submitted snapshot.
2. Finance Reviewer inspects exact collections, authorized adjustments/remittance context and selects Return with review explanation.
3. Validate current state/revision and mandatory trimmed nonempty meaningful reason; no Return may commit without it.
4. Begin transaction; concurrency-safely recheck Submitted/state/revision/permission, set Returned, store feedback/actor/time and append transition audit. Commit together.
5. Branch Lead reads feedback and latest legitimately eligible Returned calculation, makes only BL-001/BL-002 valid corrections and [resubmits](../branch-lead/submit-and-resubmit-weekly-report.md) with a new immutable revision/submitter/time/event. Preserve prior frozen submitted evidence; no age reset or silent rewrite. Valid zero-activity reports follow the same flow.

## Alternative / Error Flows

- Unauthorized, missing/stale revision, non-Submitted or invalid feedback under approved policy: reject safely without return.
- Concurrent approval/return: at most one valid transition commits. Business/audit/commit failure rolls back all related changes.
- Expired collection error: original edit remains forbidden. FIN-002 requires next-report original-linked adjustment; FIN-006 source Branch Lead requests, Finance Reviewer approves/rejects once; only Approved recognized in next eligible report, so no bypass is granted by Return.

## Business Rules

- Return preserves submitted revision and prior decisions/audit. It never unlocks Approved, extends cutoff, gives Branch Lead approval authority or deletes original financial evidence.
- BL-001: strict authoritative created_at + 7 x 24 hours; exactly cutoff fails. BL-002: Returned correctable only inside original age window and without immutable inclusion; Submitted remains locked until formal Return.
- **FIN-002 - DECIDED:** Expired original stays unchanged; correction goes to separate auditable next-report adjustment under approved governance, not a historic snapshot edit.
- **FIN-004 - DECIDED:** Approved is already final-locked; no normal return path or later manual lock exists.
- **FIN-010 - DECIDED:** Financial evidence uses PKR NUMERIC(18,2)/Prisma Decimal, decimal-string APIs and decimal-safe arithmetic/comparisons; no JavaScript number money calculations. Reject nonfinite/unsupported precision/range, float-derived values and direct input with more than two fractional digits, never silently round it. Explicit HALF_UP only when calculation genuinely needs rounding; atomic audit, no invented fixtures/payments.

- **FIN-011 - DECIDED:** Scoped netRecognizedCollections minus confirmedRemittances gives signedOutstanding, possibly negative; show reconciliationDeficit = max(0, -signedOutstanding) separately to authorized Finance/Head Office. availableToRemit = max(0, signedOutstanding - active pending reservations), without double deficit deduction. Return does not rewrite original transactions, confirmed remittances or Approved snapshots, create a compensating payment/write-off, or permit over-remittance; exact external recovery/settlement remains PENDING.
- **FIN-012 - DECIDED:** Return is not remittance cancellation. Own-branch Branch Lead may request Pending cancellation; only Finance approves/rejects through [separate remittance workflow](confirm-head-office-remittance.md). Request/rejection retains Pending remittance/reservation, approval atomically cancels/releases once/audits. Concurrent confirmation/cancellation has one valid result; Confirmed cannot directly cancel/delete.
- **FIN-013 - DECIDED:** Source Branch Lead may request sequential original-linked corrections, one PendingReview per original; Finance decides/audits each. Recheck original plus all Approved deltas (including awaiting recognition) plus candidate >= zero in approval transaction. Only each Approved is recognized once in eligible period; Rejected has zero effect and a closed request does not bar later requests. Preserve locked original and Approved snapshots. See [adjustments](review-financial-adjustments.md); Return grants no cutoff override.
- **WR-004 - DECIDED:** Finance approval must recheck only unresolved issues capable of materially changing candidate eligible figures by branch/report/recognition scope. Unrelated branches/periods/non-affecting requests do not automatically block; no unapproved inclusion or blanket submission rule. Reassess after resolution; occurrence/recognition/reviewed periods distinguished. Exact multi-period treatment needs specification, not reopening basic relevance policy.

- **WR-003 - DECIDED:** Return preserves old immutable submission revision; Returned latest eligible figures may reflect permitted changes under original cutoff/state rules. Resubmit preserves old actor/time/evidence and captures new immutable revision, freezing it while Submitted. Approved final snapshot remains immutable after later financial events; Approved cannot Return.
- **WR-005/WR-006 - DECIDED:** Valid zero-activity report may Return with required nonempty reason through normal role/state/version checks. Return versus approval/duplicate Return must have one compatible outcome, state/feedback/revision context/audit atomic and safe conflict rollback. No separate manual Lock or Approved -> Draft/Returned.

- **FIX-04 / FIN-018 / FIN-009 - DECIDED:** Adjustment request reason is mandatory/nonempty, adjustment attachment optional; remittance evidence upload optional. These are distinct from FIN-008 mandatory report Return reason. Missing optional file alone is not grounds to reject an otherwise valid adjustment/remittance; file cannot replace reason or financial checks. Exact allowed types/size limits/storage mechanism, external bank-evidence validation and external settlement/disputes remain PENDING. Return changes none of these policies.

## Postconditions

- Success: Returned/feedback/actor/time/audit committed with original submitted revision intact.
- Failure: previous state/figures/history unchanged; expired original remains protected.

## Activity Diagram

```mermaid
flowchart TD
    A([Start]) --> B["Finance Reviewer selects Submitted report"]
    B --> C{"Backend: Finance role and scope allowed?"}
    C -->|No| X["Reject safely"]
    C -->|Yes| D["Load revision; inspect figures and enter feedback"]
    D --> E{"Return requested?"}
    E -->|No| Z([End])
    E -->|Yes| F{"Still Submitted and mandatory reason nonempty after trimming?"}
    F -->|No| X
    F -->|Yes| G["Transaction: recheck concurrency; set Returned, preserve revision, save feedback and audit"]
    G --> H{"Writes and commit successful?"}
    H -->|No| R["Rollback and report error"]
    H -->|Yes| I["Branch Lead views feedback; seven-day restrictions unchanged"]
    X --> Z
    R --> Z
    I --> Z
```

## Acceptance Criteria

- Unauthorized or Approved-report return fails; original revision/history never removed.
- Successful authorized return records feedback/actor/time/revision and audit atomically; blank/whitespace reason fails, valid reason is saved and visible to authorized Branch Lead under FIN-008.
- Cutoff/immutable restrictions unchanged; expired errors cannot be solved by direct original edit.
- Return/approve race cannot both commit; failed transaction leaves prior report state. Future tests only, not executed here.

- Return preserves FIN-010 exact amounts and FIN-011 explicit deficit/nonnegative availability; it does not cancel remittances, release reservations or overwrite historic transactions. Sequential corrections retain FIN-013 cumulative checks and exactly-once recognition without a lifetime-one-adjustment restriction. These are future criteria, not executed tests.

- Planned WR tests: Returned recalculation is age/state eligible without modifying prior submitted snapshot; resubmit captures new preserved revision. Zero-activity Return reason and normal flow work without fabricated transactions. Stale/version/role conflicts and Return/approve races leave no partial state/audit; final Approved snapshot cannot reopen. Relevant approval checks remain in approval workflow; no tests executed.

## Pending Decisions

- Exact attachment file-size/type/storage configuration, Finance adjustment decision explanations, exact external deficit clearing/refund/recovery and cross-period settlement, confirmed-remittance dispute investigation/authority/accounting, external bank evidence validation and exceptional settlement details. FIN-010 money, FIN-011 signed deficit, FIN-012 Pending cancellation and FIN-013 sequential/cumulative invariants are DECIDED.
- Financial notifications and finer review constraints not settled by FIN-008, exact multi-period issue treatment and Closed post-closure reporting. WR-003/WR-004/WR-005/WR-006 revision/relevance/zero-activity/concurrency rules, Return reason and adjustment ownership are DECIDED.
