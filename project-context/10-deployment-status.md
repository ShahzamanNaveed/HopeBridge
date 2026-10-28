# Deployment status

Foundation source exists; Docker/Compose and GitHub Actions are configured. The local Docker-engine failure is historical session evidence. [Public GitHub repository](https://github.com/ShahzamanNaveed/HopeBridge) and remote CI are verified: 813e2ea passed foundation tests, PostgreSQL integration and Docker build; later 145967d failed formatting, with downstream checks skipped. See [testing evidence](09-testing-status.md). No later green run is established; build success is not running deployment evidence. No working Render URL, deployed database connection or current container-runtime acceptance is verified.

Pending verification commands: docker build --target runtime -t shiplens:local . ; docker compose up --build ; npm run test:integration against migrated PostgreSQL. Verify /health returns 200 with the database available and 503 when stopped. Follow ../docs/handover.md for Render migration/release planning.

Historical local verification recorded for 2026-10-24: production builds, workspace typechecks, ESLint, formatting, 10 backend tests with the 60% coverage gate, 3 browser tests and a production database-unavailable smoke test. Detailed evidence: 09-testing-status.md.

Phase 0A changed only Markdown formatting: line-ending-adjusted check passed, plain Windows check remained blocked by untouched CRLF files, and lint/typecheck could not execute without dependencies. No deployment or new remote CI was performed. Current-tree release readiness remains unverified; business modules and their acceptance tests are absent.
