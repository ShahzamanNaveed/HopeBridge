import type { Prisma } from '../../generated/prisma/client.js';
/** Organization administration projection only; no financial/dashboard-domain data. */
export class AdminRepository {
  async counts(tx: Prisma.TransactionClient) {
    const totalBranches = await tx.branch.count();
    const activeBranches = await tx.branch.count({
      where: { status: 'ACTIVE' },
    });
    const activeStaff = await tx.staffUser.count({
      where: { status: 'ACTIVE' },
    });
    // Operational attention means Forming/Paused or missing current leadership.
    // Closed branches are excluded; this is an administration projection, not a KPI.
    const attentionBranches = await tx.branch.count({
      where: {
        status: { not: 'CLOSED' },
        OR: [
          { status: { in: ['FORMING', 'PAUSED'] } },
          { branchLeadAssignment_branch: { none: { endedAt: null } } },
        ],
      },
    });
    const branchStatuses = (
      await tx.branch.groupBy({ by: ['status'], _count: true })
    ).map((x) => ({ status: x.status, count: x._count }));
    const staffRoles = (
      await tx.staffUser.groupBy({ by: ['role'], _count: true })
    ).map((x) => ({ role: x.role, count: x._count }));
    return {
      totalBranches,
      activeBranches,
      activeStaff,
      attentionBranches,
      branchStatuses,
      staffRoles,
    };
  }
}
