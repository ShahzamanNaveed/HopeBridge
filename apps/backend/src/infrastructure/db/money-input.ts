import { z } from 'zod';
import { Prisma } from '../../generated/prisma/client.js';

// PostgreSQL NUMERIC(18,2) coerces excess scale before CHECK/trigger execution.
// Validate BEFORE assigning a Decimal to Prisma, never rely on DB rounding.
// This boundary validator performs no accounting calculations or role checks.
const moneyInput = z.string().regex(/^-?(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/);
export function databaseMoney(input: unknown): Prisma.Decimal {
  return new Prisma.Decimal(moneyInput.parse(input));
}
