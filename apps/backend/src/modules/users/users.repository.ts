import type { Prisma } from '../../generated/prisma/client.js';
import type { AdminList } from '@shiplens/contracts';

const selection = {
  id: true,
  emailNormalized: true,
  displayName: true,
  role: true,
  status: true,
  version: true,
  createdAt: true,
  branchLeadAssignment_lead: {
    where: { endedAt: null },
    include: { branch: { select: { id: true, name: true, code: true } } },
  },
} satisfies Prisma.StaffUserSelect;
export class UsersRepository {
  async list(tx: Prisma.TransactionClient, q: AdminList) {
    const where: Prisma.StaffUserWhereInput = {
      ...(q.role ? { role: q.role } : {}),
      ...(q.status === 'ACTIVE' || q.status === 'INACTIVE'
        ? { status: q.status }
        : {}),
      ...(q.search
        ? {
            OR: [
              { displayName: { contains: q.search, mode: 'insensitive' } },
              { emailNormalized: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const total = await tx.staffUser.count({ where });
    const items = await tx.staffUser.findMany({
      where,
      select: selection,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    });
    return {
      items: items.map(staffDto),
      total,
      page: q.page,
      pageSize: q.pageSize,
    };
  }
  async get(tx: Prisma.TransactionClient, id: string) {
    const row = await tx.staffUser.findUnique({
      where: { id },
      select: selection,
    });
    return row ? staffDto(row) : null;
  }
  async duplicate(tx: Prisma.TransactionClient, email: string, id?: string) {
    return tx.staffUser.findFirst({
      where: { emailNormalized: email, ...(id ? { id: { not: id } } : {}) },
      select: { id: true },
    });
  }
  async activeAdmins(tx: Prisma.TransactionClient) {
    return tx.staffUser.count({
      where: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
    });
  }
  create(tx: Prisma.TransactionClient, data: Prisma.StaffUserCreateInput) {
    return tx.staffUser.create({ data, select: { id: true } });
  }
  update(
    tx: Prisma.TransactionClient,
    id: string,
    data: Prisma.StaffUserUpdateInput,
  ) {
    return tx.staffUser.update({ where: { id }, data, select: { id: true } });
  }
}
function staffDto(
  row: Prisma.StaffUserGetPayload<{ select: typeof selection }>,
) {
  return {
    id: row.id,
    email: row.emailNormalized,
    displayName: row.displayName,
    role: row.role,
    status: row.status,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    branch: row.branchLeadAssignment_lead[0]?.branch ?? null,
  };
}
