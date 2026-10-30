import type { PrismaClient } from '../src/generated/prisma/client.js';

// Explicit mappings in docs/flows/hr-lead/volunteer-identification.md.
// This is reference data, not authority for arbitrary city-code administration.
export const approvedDevelopmentCities = [
  { name: 'Lahore', code: 'LHR' },
  { name: 'Faisalabad', code: 'FSD' },
  { name: 'Islamabad', code: 'ISB' },
] as const;

export function assertDevelopmentCityTarget(
  databaseUrl: string,
  nodeEnv?: string,
) {
  const url = new URL(databaseUrl);
  if (
    nodeEnv === 'production' ||
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    url.pathname !== '/hopebridge_dev'
  )
    throw new Error('Development city seed requires local hopebridge_dev');
}

/** Caller opts into local reference data; never updates cities or counters.
 * A conflicting city name/code aborts the entire seed rather than remapping IDs.
 */
export async function seedDevelopmentCities(database: PrismaClient) {
  return database.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(72942001)::text`;
    const result: { name: string; code: string; created: boolean }[] = [];
    for (const city of approvedDevelopmentCities) {
      const matches = await tx.city.findMany({
        where: {
          OR: [
            { code: { equals: city.code, mode: 'insensitive' } },
            { name: { equals: city.name, mode: 'insensitive' } },
          ],
        },
      });
      if (
        matches.length > 1 ||
        (matches[0] &&
          (matches[0].code !== city.code || matches[0].name !== city.name))
      )
        throw new Error(`Conflicting reference mapping for ${city.code}`);
      if (!matches.length) await tx.city.create({ data: city });
      result.push({ ...city, created: matches.length === 0 });
    }
    return result;
  });
}
