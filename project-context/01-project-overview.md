# Project overview

## Confirmed HWF Decisions

HopeBridge Welfare Foundation (HWF) is a fictional Community Welfare NGO created for the ShipLens challenge. Mission: support underserved communities through education, food assistance, healthcare initiatives, and emergency relief. Core programmes: Education Support, Food Assistance, Healthcare Support, and Emergency Relief.

One Central Head Office handles administration and oversight; it is not an operational branch. Multiple operational branches, including multiple in one city, are allowed. Head Office and a branch may share an address; independent local operations and reporting require a separate operational branch. Each branch initially has one assigned Branch Lead and may have multiple volunteers/members.

Exactly five authenticated roles and their responsibilities are recorded in [permissions](../docs/permissions.md). HR is centralized at Head Office; members are records without a separate login role. Public visitors need no account. Use HWF for the organisation and retain ShipLens for the challenge and existing technical packages.

## Official Requirements

Scope supplied by the user: seven public pages (Home, About, Programs, Branches, Events, Get Involved, Contact), English/Urdu RTL, branch lifecycle, volunteer/HR/member workflows, offline collections, weekly reports, dashboards, content publishing, audit trails, and CSV/PDF export. No online payment integration is allowed. See [domain rules](../docs/domain-rules.md) and [requirements tracker](02-requirements-tracker.md).

Competition constraints: 14-day delivery, PostgreSQL, Docker, GitHub Actions, Render, at least 60% backend coverage, passing CI on main, public MIT repository, technical documentation and four mandatory pass/fail acceptance criteria.

## Technical architecture and current status

Modular monolith: React/Vite/Tailwind/shadcn-compatible Radix UI, TanStack Query, React Hook Form, Zod and Recharts; Express/Prisma/PostgreSQL with Pino and Helmet. Server-managed sessions and Argon2id are planned. Vitest/Supertest and Playwright support verification. Root: HopeBridge; packages retain @shiplens/frontend, @shiplens/backend and @shiplens/contracts.

Milestone 0 infrastructure and public shells exist; business modules remain unimplemented. See [current state](03-current-state.md).

## Pending Decisions

The official handbook and financial fixtures remain absent. The 2026-10-26 user-supplied documentation update confirms the requirements above, but is not exhaustive handbook extraction. Detailed grants, financial formulas, lifecycle transitions and the exact four acceptance criteria remain pending in [clarifications](../docs/requirements/clarifications.md).
