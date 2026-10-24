# Database conventions

PostgreSQL is authoritative. Use snake_case table/column names mapped to Prisma camelCase fields, explicit foreign keys and uniqueness constraints, query-driven indexes, and UTC timestamptz timestamps. Use integer paisa or exact NUMERIC for money; never binary floating point. Final currency, rounding and aggregation rules are pending handbook clarification.

Commit migrations; use npm run db:migrate for reviewed development migrations and npm run db:deploy in CI/production. Generate the Prisma client with npm run db:generate after schema changes. Seed is idempotent and creates only an infrastructure marker, not users or invented financial data. Production backups and restore validation must precede business rollout.

Finalize domain relationships, report snapshots, audit immutability and transactional boundaries before implementing business modules. Never run reset or destructive migrations against a shared database without explicit approval.
