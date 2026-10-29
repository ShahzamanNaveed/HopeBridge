import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import type { AuthUser } from '@shiplens/contracts';
import { HttpError } from '../../common/errors/http-error.js';
import { hashToken } from './token.js';

export type AuthTransaction = Prisma.TransactionClient;
export class AuthRepository {
  constructor(readonly database: PrismaClient) {}
  transaction<T>(work: (tx: AuthTransaction) => Promise<T>): Promise<T> {
    return this.database.$transaction(work, { timeout: 15000 });
  }
  async lockStaff(tx: AuthTransaction, ids: string[]) {
    for (const id of [...new Set(ids)].sort())
      await tx.$queryRaw`SELECT id FROM staff_users WHERE id = ${id}::uuid FOR UPDATE`;
  }
  async now(tx: AuthTransaction): Promise<Date> {
    const rows = await tx.$queryRaw<
      { now: Date }[]
    >`SELECT clock_timestamp() AS now`;
    return rows[0]!.now;
  }
  credentialByEmail(emailNormalized: string) {
    return this.database.staffCredential.findFirst({
      where: { staff: { emailNormalized } },
      include: { staff: true },
    });
  }
  credential(tx: AuthTransaction, staffId: string) {
    return tx.staffCredential.findUniqueOrThrow({
      where: { staffId },
      include: { staff: true },
    });
  }
  createSession(
    tx: AuthTransaction,
    data: Prisma.StaffSessionUncheckedCreateInput,
  ) {
    return tx.staffSession.create({ data });
  }
  revokeSession(tx: AuthTransaction, id: string, now: Date) {
    return tx.staffSession.update({ where: { id }, data: { revokedAt: now } });
  }
  revokeSessions(tx: AuthTransaction, staffId: string, now: Date) {
    return tx.staffSession.updateMany({
      where: { staffId, revokedAt: null },
      data: { revokedAt: now },
    });
  }
  updateCredential(
    tx: AuthTransaction,
    staffId: string,
    data: Prisma.StaffCredentialUpdateManyMutationInput,
  ) {
    return tx.staffCredential.update({ where: { staffId }, data });
  }
  recordCredentialEvent(
    tx: AuthTransaction,
    staffId: string,
    actorId: string | undefined,
    kind: 'PROVISION' | 'RESET' | 'CHANGE',
  ) {
    return tx.credentialEvent.create({ data: { staffId, actorId, kind } });
  }
  sessionByToken(tx: AuthTransaction, token: string) {
    return tx.staffSession.findUnique({
      where: { tokenHash: hashToken(token) },
    });
  }
  staffById(tx: AuthTransaction, id: string) {
    return tx.staffUser.findUnique({ where: { id } });
  }
  async lockBootstrap(tx: AuthTransaction) {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(72611902)::text`;
  }
  adminCount(tx: AuthTransaction) {
    return tx.staffUser.count({ where: { role: 'SUPER_ADMIN' } });
  }
  createInitialAdmin(
    tx: AuthTransaction,
    emailNormalized: string,
    displayName: string,
  ) {
    return tx.staffUser.create({
      data: { emailNormalized, displayName, role: 'SUPER_ADMIN' },
    });
  }
  createCredential(
    tx: AuthTransaction,
    data: Prisma.StaffCredentialUncheckedCreateInput,
  ) {
    return tx.staffCredential.create({ data });
  }
  async user(
    tx: AuthTransaction,
    staffId: string,
    restricted: boolean,
  ): Promise<AuthUser> {
    const staff = await tx.staffUser.findUniqueOrThrow({
      where: { id: staffId },
    });
    const credential = await tx.staffCredential.findUnique({
      where: { staffId },
    });
    if (staff.role === 'BRANCH_LEAD')
      await tx.$queryRaw`SELECT id FROM branch_lead_assignments WHERE lead_id = ${staffId}::uuid AND ended_at IS NULL FOR SHARE`;
    const assignment =
      staff.role === 'BRANCH_LEAD'
        ? await tx.branchLeadAssignment.findFirst({
            where: { leadId: staffId, endedAt: null },
            include: { branch: true },
          })
        : null;
    return {
      id: staff.id,
      email: staff.emailNormalized,
      displayName: staff.displayName,
      role: staff.role,
      status: staff.status,
      mustChangePassword: credential?.mustChangePassword ?? true,
      restricted,
      branch: assignment
        ? {
            id: assignment.branch.id,
            name: assignment.branch.name,
            code: assignment.branch.code,
          }
        : null,
    };
  }
  async session(tx: AuthTransaction, token: string | undefined) {
    if (!token || !/^[a-f0-9]{64}$/.test(token))
      throw new HttpError(401, 'SESSION_EXPIRED', 'Sign in again');
    const found = await tx.staffSession.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!found) throw new HttpError(401, 'SESSION_EXPIRED', 'Sign in again');
    await this.lockStaff(tx, [found.staffId]);
    // Re-read after the staff lock: reset/change/login use this same serialization boundary.
    const session = await tx.staffSession.findUniqueOrThrow({
      where: { id: found.id },
    });
    const now = await this.now(tx);
    const user = await this.user(tx, session.staffId, session.restricted);
    const credential = await tx.staffCredential.findUnique({
      where: { staffId: session.staffId },
    });
    if (
      session.revokedAt ||
      session.idleExpiresAt <= now ||
      session.absoluteExpiresAt <= now ||
      user.status !== 'ACTIVE'
    )
      throw new HttpError(401, 'SESSION_EXPIRED', 'Sign in again');
    if (
      credential?.mustChangePassword &&
      (!credential.temporaryExpiresAt || credential.temporaryExpiresAt <= now)
    )
      throw new HttpError(
        401,
        'TEMPORARY_PASSWORD_EXPIRED',
        'Contact your administrator',
      );
    return { session, user, now };
  }
  async touch(tx: AuthTransaction, id: string, now: Date, absolute: Date) {
    await tx.staffSession.update({
      where: { id },
      data: {
        lastActivityAt: now,
        idleExpiresAt: new Date(
          Math.min(now.getTime() + 8 * 3600000, absolute.getTime()),
        ),
      },
    });
  }
}
