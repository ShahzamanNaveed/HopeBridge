import { z } from 'zod';
import type { Prisma } from '../../generated/prisma/client.js';

/** Allocate within the caller's transaction. Formatting/padding/new-city policy
 * remains with the approved domain contract; this never uses MAX(id) + 1.
 */
export async function allocateCitySequence(
  tx: Prisma.TransactionClient,
  cityId: string,
  kind: 'BRANCH' | 'VOLUNTEER',
): Promise<bigint> {
  if (typeof Reflect.get(tx, '$connect') === 'function')
    throw new TypeError('Counter requires an interactive transaction client');
  z.uuid().parse(cityId);
  z.enum(['BRANCH', 'VOLUNTEER']).parse(kind);
  const rows = await tx.$queryRaw<{ value: bigint }[]>`
    INSERT INTO city_counters (city_id, kind, value)
    VALUES (${cityId}::uuid, ${kind}::"CitySequenceKind", 1)
    ON CONFLICT (city_id, kind) DO UPDATE
    SET value = city_counters.value + 1
    RETURNING value
  `;
  const row = rows[0];
  if (!row) throw new Error('City counter allocation failed');
  return row.value;
}
