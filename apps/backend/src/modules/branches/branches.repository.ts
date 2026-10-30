import type { Prisma } from '../../generated/prisma/client.js';
import type { AdminList } from '@shiplens/contracts';
const include = {
  city: true,
  branchLeadAssignment_branch: {
    where: { endedAt: null },
    include: { lead: { select: { displayName: true } } },
  },
} satisfies Prisma.BranchInclude;
export class BranchesRepository {
  cities(tx: Prisma.TransactionClient) {
    return tx.city.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });
  }
  city(tx: Prisma.TransactionClient, id: string) {
    return tx.city.findUnique({
      where: { id },
      select: { id: true, name: true, code: true },
    });
  }
  async list(tx: Prisma.TransactionClient, q: AdminList) {
    const where: Prisma.BranchWhereInput = {
      ...(q.status &&
      ['FORMING', 'ACTIVE', 'PAUSED', 'CLOSED'].includes(q.status)
        ? { status: q.status as 'FORMING' | 'ACTIVE' | 'PAUSED' | 'CLOSED' }
        : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: 'insensitive' } },
              { code: { contains: q.search, mode: 'insensitive' } },
              { city: { name: { contains: q.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const total = await tx.branch.count({ where });
    const rows = await tx.branch.findMany({
      where,
      include,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    });
    return {
      items: rows.map(branchDto),
      total,
      page: q.page,
      pageSize: q.pageSize,
    };
  }
  async get(tx: Prisma.TransactionClient, id: string) {
    const row = await tx.branch.findUnique({ where: { id }, include });
    return row ? branchDto(row) : null;
  }
  create(
    tx: Prisma.TransactionClient,
    data: Prisma.BranchUncheckedCreateInput,
  ) {
    return tx.branch.create({ data, select: { id: true } });
  }
  update(
    tx: Prisma.TransactionClient,
    id: string,
    data: Prisma.BranchUncheckedUpdateInput,
  ) {
    return tx.branch.update({ where: { id }, data, select: { id: true } });
  }
  current(
    tx: Prisma.TransactionClient,
    where: { branchId?: string; leadId?: string },
  ) {
    return tx.branchLeadAssignment.findFirst({
      where: { ...where, endedAt: null },
    });
  }
  endAssignment(tx: Prisma.TransactionClient, id: string, now: Date) {
    return tx.branchLeadAssignment.update({
      where: { id },
      data: { endedAt: now },
    });
  }
  assign(
    tx: Prisma.TransactionClient,
    branchId: string,
    leadId: string,
    assignedById: string,
    now: Date,
  ) {
    return tx.branchLeadAssignment.create({
      data: { branchId, leadId, assignedById, startedAt: now },
    });
  }
  async history(tx: Prisma.TransactionClient, branchId: string) {
    return (
      await tx.branchLeadAssignment.findMany({
        where: { branchId },
        include: { lead: { select: { displayName: true } } },
        orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
        take: 100,
      })
    ).map(assignmentDto);
  }
}
function assignmentDto(row: {
  id: string;
  leadId: string;
  assignedById: string;
  startedAt: Date;
  endedAt: Date | null;
  lead: { displayName: string };
}) {
  return {
    id: row.id,
    leadId: row.leadId,
    leadName: row.lead.displayName,
    assignedById: row.assignedById,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null,
  };
}
function branchDto(row: Prisma.BranchGetPayload<{ include: typeof include }>) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    address: row.address,
    status: row.status,
    version: row.version,
    cityId: row.cityId,
    city: { id: row.city.id, name: row.city.name, code: row.city.code },
    createdAt: row.createdAt.toISOString(),
    currentLead: row.branchLeadAssignment_branch[0]
      ? assignmentDto(row.branchLeadAssignment_branch[0])
      : null,
  };
}
