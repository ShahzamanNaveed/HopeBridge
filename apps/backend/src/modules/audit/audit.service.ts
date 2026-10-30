import { z } from 'zod';
import type { Prisma } from '../../generated/prisma/client.js';

const actorSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('STAFF'), id: z.uuid() }).strict(),
  z
    .object({
      kind: z.literal('SYSTEM'),
      name: z.string().trim().min(1).max(100),
    })
    .strict(),
]);
const eventSchema = z
  .object({
    actor: actorSchema,
    domain: z.enum([
      'auth',
      'users',
      'branches',
      'applications',
      'members',
      'collections',
      'reports',
      'dashboard',
      'content',
      'audit',
    ]),
    action: z.string().trim().min(1).max(100),
    entityType: z.string().trim().min(1).max(100),
    entityId: z.string().trim().min(1).max(200),
    branchId: z.uuid().optional(),
    before: z.record(z.string(), z.json()).optional(),
    after: z.record(z.string(), z.json()).optional(),
    metadata: z.record(z.string(), z.json()).optional(),
  })
  .strict();
export type AuditInput = z.input<typeof eventSchema>;

// Conservative allowlist: raw names, contacts, notes, credentials and arbitrary payloads
// are redacted even when nested. Add domain-safe fields only after privacy review.
const allowed = new Set([
  'id',
  'status',
  'role',
  'version',
  'branchid',
  'reportid',
  'revisionid',
  'memberid',
  'applicationid',
  'collectionid',
  'adjustmentid',
  'remittanceid',
  'teamid',
  'actorid',
  'sourcebranchid',
  'targetbranchid',
  'previousbranchid',
  'amount',
  'state',
  'kind',
  'format',
  'scope',
  'filters',
  'sources',
  'period',
  'reportstatus',
  'classification',
  'approved',
  'pending',
  'recognizedadjustments',
  'confirmedremittances',
  'pendingreservations',
  'signedoutstanding',
  'reconciliationdeficit',
  'availabletoremit',
  'reportrevisionids',
  'reportids',
  'branchids',
  'before',
  'after',
  'fromstatus',
  'tostatus',
  'createdat',
  'occurredat',
  'startedat',
  'endedat',
  'weekstart',
  'weekend',
  'approvedat',
  'lockedat',
  'recognizedat',
  'count',
  'reference',
  'volunteerid',
  'code',
]);
export function sanitizeAuditValue(
  value: Prisma.InputJsonValue,
  depth = 0,
): Prisma.InputJsonValue {
  if (depth > 8) return '[REDACTED]';
  if (Array.isArray(value))
    return value.map((v) =>
      v === null ? null : sanitizeAuditValue(v, depth + 1),
    );
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [
        key,
        !allowed.has(key.toLowerCase().replace(/[^a-z0-9]/g, ''))
          ? '[REDACTED]'
          : v === null
            ? null
            : sanitizeAuditValue(v as Prisma.InputJsonValue, depth + 1),
      ]),
    );
  }
  return typeof value === 'string' ? value.slice(0, 500) : value;
}

/** Caller MUST supply the SAME interactive transaction as its business writes.
 * No transaction is opened/committed here. A failed audit write propagates and
 * rolls back the caller's transaction. This is an internal API, not authorization.
 */
export async function appendAudit(
  tx: Prisma.TransactionClient,
  raw: AuditInput,
) {
  if (typeof Reflect.get(tx, '$connect') === 'function')
    throw new TypeError('Audit requires an interactive transaction client');
  const input = eventSchema.parse(raw);
  return tx.auditEvent.create({
    data: {
      actorKind: input.actor.kind,
      actorId: input.actor.kind === 'STAFF' ? input.actor.id : undefined,
      systemActor: input.actor.kind === 'SYSTEM' ? input.actor.name : undefined,
      domain: input.domain,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      branchId: input.branchId,
      before: input.before ? sanitizeAuditValue(input.before) : undefined,
      after: input.after ? sanitizeAuditValue(input.after) : undefined,
      metadata: input.metadata ? sanitizeAuditValue(input.metadata) : undefined,
    },
    select: { id: true, createdAt: true },
  });
}
