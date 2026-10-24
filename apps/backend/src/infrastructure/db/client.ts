import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { readEnv } from '../../config/env.js';
export const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: readEnv().DATABASE_URL,
    connectionTimeoutMillis: 3000,
    query_timeout: 3000,
    max: 5,
  }),
});
export async function checkDatabase() {
  await db.$queryRaw`SELECT 1`;
}
