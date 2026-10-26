# Domain rules

Source: user-supplied Milestone 0 brief and confirmed documentation update dated 2026-10-26. These are requirements/design decisions, not implemented business behaviour.

## Official Requirements

- Branch statuses: Forming, Active, Paused, Closed. Exact allowed transitions are pending.
- Track offline collections with a server-enforced seven-day edit lock. No online payment integration.
- Weekly reports support auto-draft, submit, return, resubmit, approve and lock. The previously recorded draft -> submit -> return -> resubmit -> approve -> lock sequence describes required actions, not an exhaustive transition graph.
- Approved report figures are immutable, including against subsequent source edits. Audit changes and report transitions; use atomic transactions for critical financial/report/audit writes.
- Head Office dashboard includes correct figures, monthly trends and unsent collections. CSV and PDF export are required; detailed scope is pending.
- Enforce five-role permissions and branch isolation on the server. English/Urdu RTL is required for public and internal interfaces.

## Confirmed HWF Decisions

Organisation and Head Office/branch structure: [project overview](../project-context/01-project-overview.md). Role responsibilities: [permissions](permissions.md).

- Each branch has a unique database ID and unique automatically generated city-based code. Prefixes map uniquely to cities; sequence numbers are per prefix and concurrency-safe. Examples: LHR-001/LHR-002, FSD-001/FSD-002, ISB-001. Codes are never reused, including after closure; changing city retains the original code. Names, cities and addresses are not global identifiers. Authorize access using branch IDs.
- Public Get Involved applications do not immediately create members. HR Lead acceptance creates exactly one member in the same database transaction; HR Lead may accept or decline applications.
- Members receive automatically generated globally unique identifiers (example: HWF-000001), retained across branch transfers. Each member has one primary branch at a time initially, with no separate login account. Application references and official Member IDs are separate.
- Validate applications in frontend and backend, with server-side rate limiting and duplicate checks. Different emails do not prove distinct identities; similar personal details may be flagged for HR review rather than automatically rejected. Do not require CNIC publicly or use real personal data in samples/tests.
- Public navigation has no Login or Sign Up buttons. Staff use a separate portal route and administratively provisioned accounts. Keep current routes until an implementation task authorizes changes.
- Public and staff systems share a connected backend and PostgreSQL database. Programs, branches and events use database-backed information; content supports draft/publish. These integrations remain unimplemented.

## Pending Decisions

See [clarifications](requirements/clarifications.md) for unresolved permissions, transitions, timing, financial rules, application safeguards and acceptance details. Do not infer formulas, grants or fixture values from examples.
