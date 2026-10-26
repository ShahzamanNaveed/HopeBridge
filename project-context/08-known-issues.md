# Known issues and gaps

- Official participant handbook and sample data are unavailable; no final financial rules or exhaustive handbook traceability can be asserted.
- Business schema, detailed role grants, report week/timezone, rounding, correction/lock timing and allowed branch transitions need approval. Branch status names, seven-day collection lock, approved-figure immutability and role responsibilities are confirmed; see ../docs/domain-rules.md.
- Authentication, sessions, Argon2id, CSRF and business authorization are planned only.
- Docker CLI exists but engine is not running; container build and PostgreSQL integration remain unverified locally.
- Render service, public GitHub repository, branch protection and live CI require external account setup.
- Current rate limiting is per process. Production proxy trust and client IP handling require deployment-specific validation.
- Shell translations require native Urdu review. HWF mission/programmes are documented, but detailed page copy, branding assets and bundled fonts/images are not supplied.

A service listens on localhost:5432, but no test database URL is configured. Identify a dedicated development/test database before applying migrations; do not target an unknown existing database.
