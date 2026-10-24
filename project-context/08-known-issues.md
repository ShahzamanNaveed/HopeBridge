# Known issues and gaps

- Official participant handbook and sample data are unavailable; no final financial rules or exhaustive handbook traceability can be asserted.
- Business schema, role grants, report week/timezone, rounding, correction/locking rules and branch lifecycle need approval.
- Authentication, sessions, Argon2id, CSRF and business authorization are planned only.
- Docker CLI exists but engine is not running; container build and PostgreSQL integration remain unverified locally.
- Render service, public GitHub repository, branch protection and live CI require external account setup.
- Current rate limiting is per process. Production proxy trust and client IP handling require deployment-specific validation.
- Shell translations require native Urdu review. Real content, official branding and bundled fonts/images are not supplied.

A service listens on localhost:5432, but no test database URL is configured. Identify a dedicated development/test database before applying migrations; do not target an unknown existing database.
