# Clarifications required

## Official Requirements

The 2026-10-26 user-supplied update confirms branch statuses, the seven-day collection edit lock, auto-draft/report actions, immutable approved figures, audit, dashboard trends/unsent collections, exports and four mandatory pass/fail acceptance criteria. The official handbook and financial fixtures remain unavailable; obtain them to verify completeness and the exact four criteria.

## Confirmed HWF Decisions

Mission, programmes and organisation structure: [overview](../../project-context/01-project-overview.md). Role responsibilities: [permissions](../permissions.md). Branch/member identifiers, atomic application acceptance, application safeguards and public/staff design: [domain rules](../domain-rules.md). These decisions no longer await confirmation.


Resolved financial policies (DECIDED; see [domain rules](../domain-rules.md), [collections](../../project-context/modules/collections.md), [weekly reports](../../project-context/modules/weekly-reports.md) and [financial permissions](../permissions.md)):

- **BL-001/BL-002:** Authoritative server-created `created_at` plus seven elapsed days is the normal edit cutoff; at/after cutoff rejected, edits never reset it. Submitted collections locked until formal Return; Returned corrections still require original window; Approved/immutable snapshot inclusion permanently locked. Backend enforces scope/time/state together.
- **BL-003/FIN-001:** Asia/Karachi Monday 00:00 inclusive to following Monday 00:00 exclusive, one canonical branch/week report. Original attribution uses actual collection occurrence, not creation/edit time; exact money only.
- **FIN-002/FIN-005/FIN-006:** Expired originals/history remain unchanged; source Branch Lead requests a separate signed next-eligible-report adjustment, Finance Reviewer approves/rejects, only Approved recognized once. Locked-original-week late collections instead retain actual date/week and use a distinct original-linked Late Entry once in earliest subsequent same-branch eligible report, never Submitted/Approved; queue if none. No historical snapshot rewrite, duplicate recognition or automatic negative late-entry adjustment.
- **FIN-003/FIN-007/FIN-009:** Branch Lead records own-branch partial remittances; Finance Reviewer independently confirms once. Required positive exact amount, valid transfer date and trimmed nonempty reference; upload optional. Prevent over-remittance concurrency-safely using pending reservations; outstanding is recognized net less confirmed (subject to adjustment reconciliation), available is outstanding less committed pending claims. Unconfirmed is not confirmed receipt.
- **FIN-004/FIN-008:** Finance approval atomically locks snapshot and saves approval/lock metadata/audit; no separate manual lock. Return only from Submitted requires backend-validated meaningful nonempty trimmed reason and audited feedback, never resetting collection cutoff. Approved cannot be returned normally.

## Pending Decisions

- Branch registration approvals, allowed status transitions and effects of pause/closure; city-prefix registry/administration and code-allocation details.
- Full role-action grants, cross-branch visibility, delegation, staff provisioning/recovery and branch-lead replacement/multi-branch assignments.
- Application eligibility, required fields, consent/privacy, application-reference format, detailed duplicate matching, decline/reapplication policy and member archival/transfer workflow. Member identifier example is not a finalized formatting/overflow specification.
- Email OTP and CAPTCHA/Turnstile are proposed, not requirements. Exact application rate limits and duplicate-review thresholds are pending.
- Collection categories, currency/precision/rounding, backdating limits and late-entry evidence; adjustment evidence, sequential corrections/cumulative limits and Finance adjustment decision explanation requirements. Negative-balance recovery and adjustment effects after prior confirmed remittances remain PENDING; decided next-report correction model grants no guessed recovery policy.
- Auto-draft trigger/content, snapshot/revision implementation, remaining submission/transition constraints and dependencies not settled by approved workflows. Reporting calendar, occurrence/late-entry routing, adjustment request/approval ownership, mandatory Return reason and atomic approval/final lock are DECIDED, not awaiting approval.
- Immutable approved figures, atomic audit and concurrency safeguards are required; detailed snapshot/versioning/locking implementation remains to be designed, without reopening decided financial behavior.
- Remittance cancellation/expiry/disputes/rejection and reservation release (including stuck claims), collection-to-remittance allocations and settlement refinements remain PENDING. Financial notification requirements/providers/recipients remain PENDING; optional upload is not a notification requirement.
- Exact official KPI/dashboard formulas, fixture interpretation and expected source values remain unavailable/PENDING; preserve distinct operational outstanding/available balances rather than assuming every financial view uses the same measure. Official financial gate NOT VERIFIED. CSV/PDF export scope, fields and authorization remain pending.
- Detailed content publication/revision workflow, page content and branding assets.
- Audit retention/access/export/privacy; session lifetimes, password policy, cookie/CSRF delivery and deployment proxy policy.

Record answers with provenance and dates; do not invent financial values or grants. Confirmed decisions do not imply source implementation, testing or deployment.
