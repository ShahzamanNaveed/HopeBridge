# ShipLens - HopeBridge repository

Milestone 0 foundation for HopeBridge Welfare Foundation (HWF), a fictional community welfare NGO for the ShipLens challenge. Confirmed organisation and business decisions are in project-context/01-project-overview.md and docs/domain-rules.md. The repository root is HopeBridge; package scope remains @shiplens. Business features are planned, not implemented.

## Local setup

Use Node.js 24 and npm. On Windows with restricted PowerShell execution policy, invoke npm.cmd.

1. Copy .env.example to .env and choose local database credentials. Keep DATABASE_URL consistent with POSTGRES_USER, POSTGRES_PASSWORD and POSTGRES_DB; URL-encode special characters in the URL password.
2. Run npm install, then npm run db:generate.
3. Start PostgreSQL with docker compose up -d database.
4. Run npm run db:deploy and optionally npm run db:seed.
5. Run npm run dev. Frontend: http://localhost:5173; backend: http://localhost:3000. Vite proxies /api and /health.

The development environment is loaded from the root .env. Contracts compile before application startup. For production, npm run build then npm start -w @shiplens/backend with NODE_ENV=production and DATABASE_URL set. The backend serves the built frontend from the same origin.

## Structure

- apps/frontend: React/Vite application, feature directories, public pages, shared UI and English/Urdu resources.
- apps/backend: Express modular monolith, common middleware, infrastructure, future domain modules, Prisma schema and migrations.
- packages/contracts: shared Zod schemas and transport types; no database or business implementations.
- project-context: living implementation, requirements, testing and deployment records.
- docs: architecture, ADRs, API/security conventions, requirements and handover.
- e2e: Playwright shell/navigation/localization checks.
- scripts: reserved for future maintenance tooling.

## Commands

npm run typecheck; npm run lint; npm run format:check; npm test; npm run test:integration; npm run build.
Install Chromium with npx playwright install chromium, then npm run test:e2e.
The integration suite requires a migrated PostgreSQL database and DATABASE_URL in the process environment. It is never silently skipped.

## Containers

Copy .env.example to .env, configure credentials, then docker compose up --build. A one-shot migration service runs before the application. Visit http://localhost:3000. The runtime image uses the node user and omits dev dependencies. The migrate target intentionally includes Prisma CLI tooling and is not the application runtime.

## Status and contribution

Read project-context/README.md and project-context/03-current-state.md. No deployment, business authorization or finance acceptance is claimed. Main is the integration branch; use feature branches and reviewed pull requests. Both developers must use their own accounts. Never commit credentials or personal data.

Production smoke check after building: `node scripts/smoke-production.mjs`. It deliberately uses an unavailable local database and expects HTTP 503; it does not replace the PostgreSQL integration suite.
