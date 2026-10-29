import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';
import { fileURLToPath } from 'node:url';
config({
  path: fileURLToPath(new URL('../../.env', import.meta.url)),
  quiet: true,
});
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  // Generation needs no connection; data commands fail closed without a URL.
  datasource: process.env.DATABASE_URL
    ? { url: env('DATABASE_URL') }
    : undefined,
});
