import { afterAll, expect, it } from 'vitest';
import request from 'supertest';
import { db, checkDatabase } from '../../src/infrastructure/db/client.js';
import { createApp } from '../../src/app.js';
afterAll(async () => {
  await db.$disconnect();
});
it('queries PostgreSQL, reads the migrated table, and reports health', async () => {
  await checkDatabase();
  expect(await db.foundationMarker.count()).toBeGreaterThanOrEqual(0);
  const result = await request(createApp({ checkDatabase })).get('/health');
  expect(result.status).toBe(200);
  expect(result.body.data.database).toBe('up');
});
