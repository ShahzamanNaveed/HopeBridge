# Project overview

ShipLens connects volunteer-organisation branches and head office. Stakeholders include the public, volunteers, branch teams, HR, finance, content editors and administrators. Five roles are confirmed: Super Admin, Finance Reviewer, Content Editor, Branch Lead and HR Lead.

Scope: seven public pages, branch lifecycle, volunteer/HR/member workflows, offline collections, weekly reports, dashboard reporting, content publishing, audit trail and English/Urdu localization with RTL. Architecture is a modular monolith with React/Vite/Tailwind/shadcn-compatible Radix UI, TanStack Query, React Hook Form, Zod and Recharts; Express/Prisma/PostgreSQL with Pino and Helmet. Secure server-managed sessions and Argon2id hashing are planned for authentication. Vitest/Supertest, Playwright, GitHub Actions, Docker and Render support delivery.

Competition constraints from the supplied brief: 14-day delivery, PostgreSQL, at least 60% backend coverage, public MIT repository, CI on main, live Render deployment and technical documentation. Official handbook and sample data are not present in this workspace; completeness against the handbook cannot be asserted.
