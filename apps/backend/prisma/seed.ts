import { config } from 'dotenv';
config({ path: '../../.env', quiet: true });
const { db } = await import('../src/infrastructure/db/client.js');
try {
  await db.foundationMarker.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });
} finally {
  await db.$disconnect();
}
