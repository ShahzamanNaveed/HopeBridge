# Deployment status

Local source created; see testing status for executable verification. Docker/Compose and GitHub Actions are configured, not proof of deployment. Docker CLI exists but the engine pipe is unavailable. Render has not been provisioned or deployed. No remote repository or live CI run is configured by this task.

Pending verification commands: docker build --target runtime -t shiplens:local . ; docker compose up --build ; npm run test:integration against migrated PostgreSQL. Verify /health returns 200 with the database available and 503 when stopped. Follow ../docs/handover.md for Render migration/release planning.

Verified locally: production builds, workspace typechecks, ESLint, formatting, 10 backend tests with the 60% coverage gate, 3 browser tests and a production database-unavailable smoke test. Detailed evidence: 09-testing-status.md.
