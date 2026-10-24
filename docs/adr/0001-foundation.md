# ADR 0001: Modular monolith foundation

Date: 2026-10-24. Status: Accepted from the supplied brief.

Use npm workspaces with apps/frontend, apps/backend and packages/contracts inside HopeBridge. Use React/Vite, Express/TypeScript, PostgreSQL and Prisma. Same-origin production hosting avoids unnecessary CORS and cross-site cookie complexity. Shared contracts contain transport schemas only, never repositories or credentials.

Choose Node 24, Prisma 7 with prisma-client generation into a gitignored source directory and @prisma/adapter-pg. Keep CLI, adapter and client on the same release family. Tailwind uses its Vite plugin. TypeScript uses NodeNext for server/contracts and bundler resolution for the frontend. Explicit build order makes contracts available before app compilation.

The final Docker runtime excludes development dependencies. A separate migration target includes CLI tooling. This keeps database migration ownership explicit and avoids migrating on every HTTP worker startup.

Consequences: one release artifact and shared database; module boundaries must be enforced during review. No microservices, Nx, Turborepo or alternate frameworks. Dependency versions are captured by the root lockfile.

References: https://tailwindcss.com/docs/installation/using-vite and https://www.prisma.io/docs/orm/v7/prisma-schema/overview/generators.
