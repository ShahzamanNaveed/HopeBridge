# Activity: View Weekly Reports

**Primary Actor:** Finance Reviewer
**Supporting Actors:** Backend authorization, reporting/aggregation and audit services.
**Status:** Requirements documented; not implemented or tested

## Purpose

Inspect submitted revisions and historical weekly reports across authorized HWF branches, without modifying financial evidence.

## Preconditions

- Active authenticated Finance Reviewer; backend verifies role and permitted central finance scope on every request.
- Persisted canonical branch/week reports and revision/source links are available; no fabricated financial fixtures.

## Inputs and Outputs

- Branch, week, status/date-range filters, search/pagination and report identity; validate server-side.
- List branch/city, precise PKT period, status, submission time and exact summary. Detail shows source collections, Approved recognized signed adjustments with original reference separately, Late Entry lines with original occurrence-week reference, submitted revision, remittance context and decision history.
- Distinguish gross collections, adjustments, submitted/unconfirmed remittances, Finance-confirmed remittances, outstanding funds and immutable historical report totals. Operational outstanding = recognized net minus confirmed; available = outstanding minus active committed pending reservations (FIN-007), subject to adjustment reconciliation. Weekly recognition, original-occurrence views, cumulative dashboards and Head Office reconciliation need not have identical measure; official KPI/fixtures remain authoritative.

## Main Flow

1. Finance Reviewer logs in and opens Weekly Reports; backend verifies Finance permission and derives permitted scope.
2. Retrieve reports, validate/apply branch/week/status/date filters and display scoped results.
3. Select report; backend rechecks access and loads current state and persisted submitted revision/source financial evidence.
4. Display exact financial details and submit/return/approve history, with gross amounts and adjustment/remittance categories separately explainable.
5. For Submitted, offer separately authorized [Return](return-weekly-report.md) or [Approve and automatic lock](approve-and-lock-weekly-report.md). Approved is permanently locked/read-only; viewing alone changes nothing.

## Alternative / Error Flows

- Unauthorized role/scope or invalid filters: deny/validate without exposing other data.
- Missing record, empty results or database failure: safe not-found/empty/error result.
- Stale action/current state: reload and revalidate in mutation workflow; read view grants no mutation.

## Business Rules

- **FIN-001 - DECIDED:** Occurrence time, not created_at, determines collection week under Monday 00:00 inclusive to next Monday 00:00 exclusive Asia/Karachi. FIN-005 locked occurrence-week entry is separately recognized once in next open eligible same-branch report or retained awaiting inclusion, never Submitted/Approved; original history unchanged.
- **FIN-002 - DECIDED:** Expired corrections use separate original-linked next-report adjustments, under FIN-006 source Branch Lead request/Finance approval, Approved-only recognition; Rejected/PendingReview zero effect. Never overwrite originals or double-count.
- **FIN-003 - DECIDED:** Branch-recorded but unconfirmed remittance is distinct from Finance-confirmed settlement; only confirmed remittances affect confirmed-remittance outstanding aggregation.
- **FIN-004 - DECIDED:** Canonical states are Draft, Submitted, Returned, Approved; Approved means permanently Locked with locked_at/equivalent metadata from the same approval transaction. Locked is an effect, not a separate manual action/state here.
- Exact NUMERIC or approved minor units, no binary floats/payments or erased audit. Branch Lead cannot use central Finance permission or see other branches through their branch role.


- **FIN-005/FIN-006 - DECIDED:** Show original-week reference on distinct Late Entry, original collection on Approved signed correction, and awaiting inclusion separately if no eligible report. No normal-plus-late double effect; PendingReview/Rejected corrections contribute zero.
- **FIN-007/FIN-008 - DECIDED:** Separate partial pending reservation, confirmed, outstanding and available summaries; returned decision history includes mandatory meaningful trimmed nonempty reason. Read activity performs no recognition or return mutation.

## Postconditions

- Authorized report/revision/history displayed or safe error; no status, financial data or business audit event is mutated merely by opening it.

## Activity Diagram

```mermaid
flowchart TD
    A([Start]) --> B["Finance Reviewer logs in and opens Weekly Reports"]
    B --> C{"Backend: active Finance role and scope allowed?"}
    C -->|No| X["Deny safely"]
    C -->|Yes| D["Load permitted reports"]
    D --> E{"Retrieval successful?"}
    E -->|No| Y["Show safe retrieval error"]
    E -->|Yes| F["Finance Reviewer searches or filters"]
    F --> G{"Query valid?"}
    G -->|No| X
    G -->|Yes| H{"Matching reports?"}
    H -->|No| I["Show empty state"]
    H -->|Yes| J["Select report; load status and persisted revision"]
    J --> K{"Record available and accessible?"}
    K -->|No| Y
    K -->|Yes| AA{"Original Occurrence-Week Report Locked?"}
    AA -->|No| AB["Show normal occurrence attribution"]
    AA -->|Yes| AC["Show Late Entry original-week reference and recognition or awaiting status; preserve history"]
    AB --> L["Display Approved adjustments, partial pending/confirmed funds, outstanding/available and reasoned history"]
    AC --> L
    L --> M["Continue eligible separate Finance action or remain read-only"]
    X --> Z([End])
    Y --> Z
    I --> Z
    M --> Z
```

## Acceptance Criteria

- Finance Reviewer sees only permitted branches; Branch Lead/unauthorized users cannot inherit central finance access.
- Late Entry and Approved signed corrections reference original context and count once, pending remittances are not confirmed receipts, and outstanding/available shown separately. Return history contains mandatory explanation.
- Valid filters/revisions produce correct scoped data, approved read-only details and separately explained financial categories; viewing changes no report/audit business state.
- Backend fixture tests must reproduce actual official seed/dashboard values exactly when available; no fixture values or dashboard gate are verified here.
- Missing/invalid/empty/error paths safe; all criteria are future tests, not executed checks.

## Pending Decisions

- Exact official KPI/fixture interpretation, evidence/sequential adjustments, remitted-cash reconciliation and per-collection remittance allocations; FIN-005 routing/FIN-006 authority and FIN-007 operational balance formulas are DECIDED.
- Filter defaults/limits and any additional detail grants/financial notifications not already approved.
