# Known issues and gaps

- Official participant handbook and sample data remain unavailable; approved HWF financial decisions are documented, but exhaustive handbook traceability and exact official KPI/fixture reconciliation cannot be asserted. Official financial gate NOT VERIFIED.
- Business schema, unspecified detailed role grants, rounding and allowed branch transitions still need clarification; do not treat already approved financial grants/rules as pending. BL-001/BL-002 creation-based seven-day cutoff and report locks, BL-003 PKT Monday-to-next-Monday calendar, FIN-001 occurrence attribution, FIN-002/FIN-006 next-report adjustments with Branch Lead request/Finance approval, FIN-003/FIN-007 partial remittances with Finance confirmation and over-reservation prevention, FIN-004 atomic approval/final lock, FIN-005 exactly-once next-eligible Late Entry, FIN-008 mandatory Return reason and FIN-009 required amount/date/reference with optional upload are DECIDED; see [domain rules](../docs/domain-rules.md). These are not implemented/tested/deployed features.
- PENDING financial details: late-entry/adjustment evidence, sequential correction limits, negative-balance/confirmed-remittance recovery, remittance cancellation/disputes/expiry/rejection and reservation release, individual collection allocations, financial notifications and exact official KPI/fixture interpretation. Snapshot/auto-draft implementation details remain unresolved; decided recognition, cutoff/calendar, approval ownership and lock behavior are not blockers awaiting business approval.
- Authentication, sessions, Argon2id, CSRF and business authorization are planned only.
- Docker CLI exists but engine is not running; container build and PostgreSQL integration remain unverified locally.
- Render service, public GitHub repository, branch protection and live CI require external account setup.
- Current rate limiting is per process. Production proxy trust and client IP handling require deployment-specific validation.
- Shell translations require native Urdu review. HWF mission/programmes are documented, but detailed page copy, branding assets and bundled fonts/images are not supplied.

A service listens on localhost:5432, but no test database URL is configured. Identify a dedicated development/test database before applying migrations; do not target an unknown existing database.
