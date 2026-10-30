import type { AdminList } from '@shiplens/contracts';
import type { Prisma } from '../../generated/prisma/client.js';
import { sanitizeAuditValue } from './audit.service.js';
const include = {
  actor: { select: { displayName: true } },
  branch: { select: { id: true, name: true, code: true } },
} satisfies Prisma.AuditEventInclude;
export class AuditRepository {
  async recentAdministration(tx: Prisma.TransactionClient) {
    return (
      await tx.auditEvent.findMany({
        where: { domain: { in: ['auth', 'users', 'branches'] } },
        include,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 8,
      })
    ).map(auditDto);
  }
  async list(tx: Prisma.TransactionClient, q: AdminList, entityId?: string) {
    const where: Prisma.AuditEventWhereInput = {
      ...(entityId ? { entityId } : {}),
      ...(q.branchId ? { branchId: q.branchId } : {}),
      ...(q.domain ? { domain: q.domain } : {}),
      ...(q.actorId ? { actorId: q.actorId } : {}),
      ...(q.action
        ? { action: { contains: q.action, mode: 'insensitive' } }
        : {}),
      ...(q.from || q.to
        ? {
            createdAt: {
              ...(q.from ? { gte: new Date(q.from) } : {}),
              ...(q.to ? { lte: new Date(q.to) } : {}),
            },
          }
        : {}),
      ...(q.search
        ? {
            OR: [
              { action: { contains: q.search, mode: 'insensitive' } },
              { entityType: { contains: q.search, mode: 'insensitive' } },
              { entityId: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const total = await tx.auditEvent.count({ where });
    const rows = await tx.auditEvent.findMany({
      where,
      include,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    });
    return {
      items: rows.map(auditDto),
      total,
      page: q.page,
      pageSize: q.pageSize,
    };
  }
  async get(tx: Prisma.TransactionClient, id: string) {
    const row = await tx.auditEvent.findUnique({ where: { id }, include });
    return row ? auditDto(row) : null;
  }
}
function auditDto(
  row: Prisma.AuditEventGetPayload<{ include: typeof include }>,
) {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    actorId: row.actorId,
    actor: row.actor?.displayName ?? row.systemActor ?? 'System',
    domain: row.domain,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    branch: row.branch,
    before: row.before === null ? null : sanitizeAuditValue(row.before),
    after: row.after === null ? null : sanitizeAuditValue(row.after),
    metadata: row.metadata === null ? null : sanitizeAuditValue(row.metadata),
  };
}
