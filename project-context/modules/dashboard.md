# dashboard

Purpose: Head-office and branch figures.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: collections canonical financial projections, reports revision/snapshot ports, authorization and shared audit.

Planned APIs (proposed, no routes implemented): Scoped summary and reporting endpoints. Final paths and schemas await design approval.

Planned data relationships (not a finalized ERD): Derived aggregates over collections and reports; exact source/approval filters depend on each metric.

Official Requirements: Head Office dashboard with correct figures, monthly trends and unsent collections; CSV/PDF financial export scope is DECIDED under EXP-001 to EXP-004; output implementation remains planned.

Confirmed HWF Decisions: Head Office provides central oversight and is not an operational branch. Finance Reviewer monitors unsent collections. Server-enforced permissions and branch isolation apply.

- **FIN-010 - DECIDED:** All PKR summaries, trends and dashboard/export calculations use NUMERIC(18,2)/Prisma Decimal and decimal-string transport, never JavaScript number money arithmetic. Reject unsupported input precision/nonfinite/float-derived values; maximum two fractional digits, no silent direct-record rounding. HALF_UP only for genuinely required calculation rounding.
- **FIN-011 - DECIDED:** In the selected accounting scope/timing, netRecognizedCollections counts each original-or-Late Entry once plus Approved recognized signed adjustments; confirmedRemittances counts confirmed amounts. signedOutstanding = netRecognizedCollections - confirmedRemittances may be negative; reconciliationDeficit = max(0, -signedOutstanding). availableToRemit = max(0, signedOutstanding - active pending reservations), never double-deduct deficit. Expose deficit explicitly to authorized Finance/Head Office, never hide it by clamping outstanding. Preserve original/recognition-week attribution and immutable snapshots/history; no automatic compensating payment/write-off. External clearing/recovery/period settlement remains PENDING.
- **FIN-012 - DECIDED:** Pending cancellation request/rejection retains reservation; only committed Finance-approved cancellation releases once, atomically with state/audit. Confirmation/cancellation race produces one valid outcome; cancelled/confirmed history cannot be rewritten or double-counted.
- **FIN-013 - DECIDED:** Each of multiple sequential Approved adjustments recognized once in eligible period; PendingReview/Rejected and Approved awaiting recognition excluded from recognized totals. Cumulative per-original Approved correction must stay nonnegative, checked including queued approvals; this differs from branch signed deficits. See [financial definitions](../../docs/domain-rules.md).

## WR report-state presentation - DECIDED

- **WR-001/WR-002/WR-005 - DECIDED:** Eligible Active/Paused operational branch/week Drafts are produced automatically after PKT week completion, recovered idempotently after missed runs, including zero activity; opening a dashboard never triggers the required generation. Head Office is not an operational branch. FIN-014 ordinary future-week Closed reports prohibited; legitimate pre-closure recognition container/period remains pending; preserve existing reports and do not invent transactions for empty weeks.
- **WR-003 - DECIDED:** Clearly distinguish live eligible Draft/Returned estimates, immutable Submitted revisions, immutable final Approved snapshots and separate pending/unrecognized financial context. Label state/revision/scope; never count Draft estimates as Approved Head Office totals or add revisions of the same canonical report twice. Resubmission preserves earlier evidence; later records/confirmed remittances may affect authorized current balance views but never rewrite historical snapshot figures. Official KPI formulas remain unavailable.
- **WR-004 - DECIDED:** Authorized review may show unresolved issues relevant to candidate branch/report/recognition scope; only potential material snapshot effect blocks Finance approval, not unrelated branch/period/non-affecting requests. Preserve occurrence-versus-recognition-versus-reviewed-period distinction and unapproved amount exclusion. Reassess after resolution; exact multi-period treatment needs implementation-level specification.
- **WR-006 - DECIDED:** Read views grant no transition authority. Mutation paths enforce current state/version/role/branch transactionally with audit; stale/conflicting actions fail safely. No Approved reopening, silent frozen refresh or separate manual Lock. See [weekly-report behavior](weekly-reports.md).

## FIN-014 to FIN-018 presentation and accounting - DECIDED

- **FIN-014 - DECIDED:** Authorized Closed-branch history/report snapshots stay readable/immutable; no ordinary future-week reports, new ordinary collections or fabricated settlement figures. Legitimate pre-closure obligations remain separately identifiable within existing authorized scope; exact discovery recognition container/period after closure PENDING, not a new report type or restored staff access.
- **FIN-015 - DECIDED:** Show only relevant unresolved approval dependencies by branch/report/period/recognition scope, same WR-004 criterion; unrelated/mere request existence not blanket blocking. Read view does not decide or incorporate unapproved amounts; mutation rechecks transactionally.
- **FIN-016 - DECIDED:** Cumulative same-branch future eligible recognized collections automatically offset signed deficit using FIN-011 exact Decimal measures, each collection once in correct period. Other branches never offset; no artificial collection/remittance/date shift/old snapshot rewrite. Illustrative, not official fixture: 9,500 recognized -10,000 confirmed = -500/deficit 500; later same-branch recognized 800 -> cumulative 300/deficit 0/available 300 before new reservations. Preserve explanation/history and concurrency-safe nonnegative available; current cumulative balance differs from immutable weekly evidence.
- **FIN-017 - DECIDED:** Branch-level remittance Pending reservations, Confirmed amounts and cancelled releases remain separately explainable, no mandatory collection-by-collection allocation. Required amount/date/reference/optional evidence, partials/once-only effects/over-remittance controls and audit preserved.
- **FIN-018 - DECIDED:** Adjustment reason mandatory/file optional; missing optional file is not an error flag implying invalid financial request, attachment alone not proof. Evidence visible only under authorized access; technical storage/provider/limits pending. No new public financial disclosure or external recovery endpoint.

Future checks cover correct same-branch cumulative offset/other-branch exclusion and immutable historical views, authorized Closed history, distinct Pending/Confirmed totals and no invented allocation/settlement data; no tests executed.

## PERM/EXP - DECIDED dashboard reads and financial exports

[Permissions and full contracts](../../docs/permissions.md) define PERM-001 organization-wide Super Admin audit; PERM-002 Finance organization-wide financial reports/revisions, collections, adjustments/decisions, remittances/states/deficits and related audit; PERM-003 Branch Lead current-branch approved operations/history/audit only with immediate former-branch denial; PERM-004 authorized HR identity/application/transfer history/audit without unnecessary finance; PERM-005 authorized CMS revisions/history/audit only. All staff reads require active server authorization; no new writes or audit edit/delete, secret disclosure or sixth role.

- **EXP-001 - DECIDED:** Super Admin/Finance export authorized organization-wide CSV/PDF; Branch Lead current assigned branch only; HR/Content Editor/Public denied, including direct URLs/record IDs.
- **EXP-002 - DECIDED:** Server validates period, branch, status and appropriate financial selections: totals, Approved/pending classification, recognized adjustments, confirmed remittances, pending reservations where relevant, signed outstanding/deficit/available. Label live Draft estimates, frozen Submitted revisions, immutable Approved figures and funds categories; period figures differ from cumulative balances. FIN-001 to FIN-018 exact PKR Decimal accounting remains unchanged, official KPIs/fixtures unavailable.
- **EXP-003 - DECIDED:** CSV/PDF share authorization/filters/effective revision or snapshot/exact aggregates and PKR totals. Server CSV formula protection for untrusted =,+,-,@ text, correct delimiter/quote/line-ending encoding, preserve legitimate signed monetary numbers. Sanitize/escape PDF text; no independent client financial totals or hidden staff data.
- **EXP-004 - DECIDED:** Every successful export appends sanitized actor/action/time/effective branch scope/filters/format/source report-revision IDs where available; no unnecessary sensitive file bodies/secrets/private applicant/member fields. Denied calls never successful-export events. Protect responses against unintended caching/public access; immutable snapshots unaffected.

### Planned PERM/EXP acceptance coverage (not implemented or executed)

1. Active Super Admin reads organization-wide sanitized audit.
2. Every application role, including Super Admin, denied audit update/delete.
3. Finance Reviewer reads only authorized financial audit, not unrelated HR/password/CMS records.
4. Branch Lead denied other-branch audit, including guessed IDs.
5. Former lead immediately denied former-branch audit after replacement/reassignment.
6. HR reads authorized organization-wide HR audit with unnecessary financial detail excluded; stored history preserved.
7. Content Editor reads authorized CMS history/audit but not unrelated HR/finance/security records.
8. Super Admin exports authorized organization-wide financial CSV/PDF.
9. Finance Reviewer exports authorized organization-wide financial CSV/PDF.
10. Branch Lead exports authorized current-branch reports only.
11. Branch Lead direct other-branch export IDs/URLs denied.
12. HR Lead, Content Editor and Public Visitor financial exports denied.
13. Both formats share effective revision/server filters and reconciled exact PKR totals.
14. Malicious untrusted =,+,-,@ text cannot execute CSV formulas; encoding correct and legitimate negative money preserved; PDF text safe.
15. Export never changes Approved snapshots or other financial source records.
16. Invalid/tampered filters cannot exceed current role/branch scope or mix period/cumulative measures.
17. Successful exports append sanitized scope/filter/format/source audit metadata.
18. Financial exports exclude unrelated private applicant/member/staff fields and prevent unintended caching/public reads.
19. Invalid/expired/revoked sessions cannot retrieve audit or financial exports.
20. Denied/failed requests never create false successful-export audit events.

Integration ownership: established backend/frontend module `dashboard`. Read scoped canonical measures/trends and orchestrate EXP financial CSV/PDF with same authorized effective revision/exact totals. No monetary source writes or invented official KPIs; technical renderers are adapters, not a second financial module. See [shared integration contracts](../../docs/architecture.md) and [API categories](../../docs/api.md). These are planned interfaces, not implemented services.

Current status: planned; no business implementation, tests or deployment. Placeholder directories establish ownership only.

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Pending Decisions: Official KPI/unsent interpretation and expected sample totals, additional scopes beyond PERM/EXP, audit pagination/filter/retention/redaction configuration, CSV/PDF libraries/column names/order/layout/file naming/streaming choices, exact external deficit-clearing/refund/recovery/period settlement and exceptional disputes, Exact legitimate pre-closure discovery recognition container/accounting period after closure and detailed multi-period dependency treatment. Scheduler hosting and snapshot presentation/storage implementation details remain unselected; WR-001 to WR-006 core behavior is DECIDED. FIN-010 exact money, FIN-011 operational measures, FIN-012 cancellation effects and FIN-013 sequential recognition are DECIDED. Aggregation sources must be defined per metric; do not assume unsent figures come only from approved reports. See [clarifications](../../docs/requirements/clarifications.md).
