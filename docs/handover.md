# Deployment and handover

See README for local and Compose setup. Run all checks before release. Verify /health with PostgreSQL up and stopped, restore it, then confirm 200. Docker build: `docker build --target runtime -t shiplens:local .` Run Compose with `docker compose up --build`.

Render plan: create managed PostgreSQL and a Docker web service using the runtime target, set DATABASE_URL as a secret and NODE_ENV=production, let Render supply PORT, configure /health, and use a separately built migrate target as a controlled release job before promoting the application. Do not put Prisma CLI in the runtime image. Verify TLS, proxy settings, cookie security and backups before authentication rollout. Render deployment and account setup are not performed in this milestone.

Main is the integration branch. CI runs checks, PostgreSQL integration, coverage, browser tests and Docker build on pushes and pull requests. Public repository creation, MIT visibility, branch protection and actual green CI require account-side setup. No remote, push or pull request is created automatically.
