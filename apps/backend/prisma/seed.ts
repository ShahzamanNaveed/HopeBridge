import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import {
  assertDevelopmentCityTarget,
  seedDevelopmentCities,
} from './development-cities.js';
config({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
  quiet: true,
});
const developmentCities = process.argv.includes('--development-cities');
if (developmentCities)
  assertDevelopmentCityTarget(
    process.env.DATABASE_URL ?? '',
    process.env.NODE_ENV,
  );
const { db } = await import('../src/infrastructure/db/client.js');
try {
  if (developmentCities) {
    const result = await seedDevelopmentCities(db);
    for (const city of result)
      console.info(
        `${city.name} = ${city.code}: ${city.created ? 'created' : 'preserved'}`,
      );
  } else
    await db.foundationMarker.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: {},
    });
} finally {
  await db.$disconnect();
}
