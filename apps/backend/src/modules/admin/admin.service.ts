import {
  adminListSchema,
  type StaffCreate,
  type StaffUpdate,
  type BranchCreate,
  type BranchUpdate,
  type BranchTransition,
  type LeadAssign,
  type AdminList,
  type AuthUser,
} from '@shiplens/contracts';
import type { Prisma } from '../../generated/prisma/client.js';
import { HttpError } from '../../common/errors/http-error.js';
import { allocateCitySequence } from '../../infrastructure/db/city-sequence.js';
import { appendAudit } from '../audit/audit.service.js';
import type { AuthService } from '../auth/auth.service.js';
import type { UsersRepository } from '../users/users.repository.js';
import type { BranchesRepository } from '../branches/branches.repository.js';
import type { AuditRepository } from '../audit/audit.repository.js';
import type { AdminRepository } from './admin.repository.js';
import { generateTemporaryPassword, hashPassword } from '../auth/password.js';

type Tx = Prisma.TransactionClient;
const missing = () => new HttpError(404, 'NOT_FOUND', 'Record unavailable');
const conflict = (code: string) =>
  new HttpError(
    409,
    code,
    'The record changed or the requested action is unavailable',
  );
const defaults = () => adminListSchema.parse({ pageSize: 100 });
// Explicit transaction-capable administration ports. Composition root supplies
// implementations; no service imports another domain's repository at runtime.
export type AdministrationPorts = {
  users: Pick<
    UsersRepository,
    'list' | 'get' | 'duplicate' | 'activeAdmins' | 'create' | 'update'
  >;
  branches: Pick<
    BranchesRepository,
    | 'cities'
    | 'city'
    | 'list'
    | 'get'
    | 'create'
    | 'update'
    | 'current'
    | 'endAssignment'
    | 'assign'
    | 'history'
  >;
  audit: Pick<AuditRepository, 'list' | 'get' | 'recentAdministration'>;
  overview: Pick<AdminRepository, 'counts'>;
};
export class AdminService {
  constructor(
    readonly auth: AuthService,
    readonly ports: AdministrationPorts,
  ) {}
  private async run<T>(
    token: string | undefined,
    csrf: string | undefined,
    work: (tx: Tx, user: AuthUser) => Promise<T>,
  ) {
    try {
      return await (csrf === undefined
        ? this.auth.withAuthorization(token, 'staff.manage', undefined, work)
        : this.auth.withMutationAuthorization(
            token,
            csrf,
            'staff.manage',
            undefined,
            work,
          ));
    } catch (error) {
      if (error instanceof HttpError) throw error;
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : '';
      if (code === 'P2002') throw conflict('IDENTITY_CONFLICT');
      if (['P2003', 'P2025', 'P2004', 'P2010', 'P2034'].includes(code))
        throw conflict('STATE_CONFLICT');
      throw error;
    }
  }
  overview(token: string | undefined) {
    return this.run(token, undefined, async (tx) => ({
      ...(await this.ports.overview.counts(tx)),
      recentActivity: await this.ports.audit.recentAdministration(tx),
      recentBranches: (
        await this.ports.branches.list(
          tx,
          adminListSchema.parse({ pageSize: 5 }),
        )
      ).items,
    }));
  }
  staffList(token: string | undefined, q: AdminList) {
    return this.run(token, undefined, (tx) => this.ports.users.list(tx, q));
  }
  staffDetail(token: string | undefined, id: string) {
    return this.run(token, undefined, async (tx) => {
      const staff = await this.ports.users.get(tx, id);
      if (!staff) throw missing();
      return {
        staff,
        history: (await this.ports.audit.list(tx, defaults(), id)).items,
      };
    });
  }
  async createStaff(
    token: string | undefined,
    csrf: string,
    input: StaffCreate,
  ) {
    await this.auth.withAuthorization(
      token,
      'staff.manage',
      undefined,
      async () => undefined,
    );
    // Argon2 outside row-lock transaction. Secret remains transient and is
    // returned only after the transaction successfully commits.
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);
    const result = await this.run(token, csrf, async (tx, user) => {
      if (await this.ports.users.duplicate(tx, input.email))
        throw conflict('IDENTITY_CONFLICT');
      const now = await this.auth.repository.now(tx);
      const expiresAt = new Date(+now + 86400000);
      const staff = await this.ports.users.create(tx, {
        displayName: input.displayName,
        emailNormalized: input.email,
        role: input.role,
      });
      await this.auth.repository.createCredential(tx, {
        staffId: staff.id,
        passwordHash,
        temporaryIssuedAt: now,
        temporaryExpiresAt: expiresAt,
        mustChangePassword: true,
      });
      await this.auth.repository.recordCredentialEvent(
        tx,
        staff.id,
        user.id,
        'PROVISION',
      );
      await appendAudit(tx, {
        actor: { kind: 'STAFF', id: user.id },
        domain: 'users',
        action: 'STAFF_CREATED',
        entityType: 'StaffUser',
        entityId: staff.id,
        after: { role: input.role, status: 'ACTIVE' },
      });
      return {
        staff: await this.ports.users.get(tx, staff.id),
        expiresAt: expiresAt.toISOString(),
      };
    });
    return { ...result, temporaryPassword };
  }
  updateStaff(
    token: string | undefined,
    csrf: string,
    id: string,
    input: StaffUpdate,
  ) {
    return this.run(token, csrf, async (tx, user) => {
      const old = await this.ports.users.get(tx, id);
      if (!old) throw missing();
      if (old.version !== input.version) throw conflict('STALE_VERSION');
      if (await this.ports.users.duplicate(tx, input.email, id))
        throw conflict('IDENTITY_CONFLICT');
      if (
        old.role === 'SUPER_ADMIN' &&
        old.status === 'ACTIVE' &&
        (input.role !== 'SUPER_ADMIN' || input.status !== 'ACTIVE') &&
        (await this.ports.users.activeAdmins(tx)) <= 1
      )
        throw conflict('LAST_ACTIVE_ADMIN');
      const now = await this.auth.repository.now(tx);
      const assignment = await this.ports.branches.current(tx, { leadId: id });
      if (
        assignment &&
        (input.role !== 'BRANCH_LEAD' || input.status !== 'ACTIVE')
      ) {
        if (!input.replacementId) throw conflict('REPLACEMENT_REQUIRED');
        const branch = await this.ports.branches.get(tx, assignment.branchId);
        if (!branch) throw missing();
        await this.replace(
          tx,
          user,
          branch.id,
          input.replacementId,
          assignment.id,
          now,
        );
        await this.ports.branches.update(tx, branch.id, {
          version: { increment: 1 },
        });
      }
      await this.ports.users.update(tx, id, {
        displayName: input.displayName,
        emailNormalized: input.email,
        role: input.role,
        status: input.status,
        version: { increment: 1 },
        deactivatedAt:
          input.status === 'INACTIVE'
            ? old.status === 'INACTIVE'
              ? undefined
              : now
            : null,
      });
      if (
        old.role !== input.role ||
        old.status !== input.status ||
        old.email !== input.email
      )
        await this.auth.revokeSessions(tx, id, now);
      await appendAudit(tx, {
        actor: { kind: 'STAFF', id: user.id },
        domain: 'users',
        action: 'STAFF_UPDATED',
        entityType: 'StaffUser',
        entityId: id,
        before: { role: old.role, status: old.status, version: old.version },
        after: {
          role: input.role,
          status: input.status,
          version: old.version + 1,
        },
      });
      return this.ports.users.get(tx, id);
    });
  }
  cities(token: string | undefined) {
    return this.run(token, undefined, (tx) => this.ports.branches.cities(tx));
  }
  branchList(token: string | undefined, q: AdminList) {
    return this.run(token, undefined, (tx) => this.ports.branches.list(tx, q));
  }
  branchDetail(token: string | undefined, id: string) {
    return this.run(token, undefined, async (tx) => {
      const branch = await this.ports.branches.get(tx, id);
      if (!branch) throw missing();
      return {
        branch,
        assignments: await this.ports.branches.history(tx, id),
        history: (
          await this.ports.audit.list(tx, { ...defaults(), branchId: id })
        ).items,
      };
    });
  }
  createBranch(token: string | undefined, csrf: string, input: BranchCreate) {
    return this.run(token, csrf, async (tx, user) => {
      const city = await this.ports.branches.city(tx, input.cityId);
      if (!city || !/^[A-Z]{3}$/.test(city.code))
        throw conflict('CITY_MAPPING_REQUIRED');
      const sequence = await allocateCitySequence(tx, city.id, 'BRANCH');
      const code = `${city.code}-${sequence.toString().padStart(3, '0')}`;
      const branch = await this.ports.branches.create(tx, {
        name: input.name,
        address: input.address,
        cityId: city.id,
        code,
        status: 'FORMING',
      });
      await appendAudit(tx, {
        actor: { kind: 'STAFF', id: user.id },
        domain: 'branches',
        action: 'BRANCH_CREATED',
        entityType: 'Branch',
        entityId: branch.id,
        branchId: branch.id,
        after: { status: 'FORMING', code },
      });
      return this.ports.branches.get(tx, branch.id);
    });
  }
  updateBranch(
    token: string | undefined,
    csrf: string,
    id: string,
    input: BranchUpdate,
  ) {
    return this.run(token, csrf, async (tx, user) => {
      const old = await this.ports.branches.get(tx, id);
      if (!old) throw missing();
      if (old.version !== input.version) throw conflict('STALE_VERSION');
      if (!(await this.ports.branches.city(tx, input.cityId)))
        throw conflict('CITY_MAPPING_REQUIRED');
      await this.ports.branches.update(tx, id, {
        name: input.name,
        address: input.address,
        cityId: input.cityId,
        version: { increment: 1 },
      });
      await appendAudit(tx, {
        actor: { kind: 'STAFF', id: user.id },
        domain: 'branches',
        action: 'BRANCH_UPDATED',
        entityType: 'Branch',
        entityId: id,
        branchId: id,
        before: { version: old.version },
        after: { version: old.version + 1 },
      });
      return this.ports.branches.get(tx, id);
    });
  }
  transition(
    token: string | undefined,
    csrf: string,
    id: string,
    input: BranchTransition,
  ) {
    return this.run(token, csrf, async (tx, user) => {
      const old = await this.ports.branches.get(tx, id);
      if (!old) throw missing();
      if (old.version !== input.version) throw conflict('STALE_VERSION');
      if (old.status === input.status) return old;
      const allowed: Record<string, string[]> = {
        FORMING: ['ACTIVE', 'CLOSED'],
        ACTIVE: ['PAUSED', 'CLOSED'],
        PAUSED: ['ACTIVE', 'CLOSED'],
        CLOSED: [],
      };
      if (!allowed[old.status]!.includes(input.status))
        throw conflict('INVALID_BRANCH_TRANSITION');
      if (input.status === 'ACTIVE') {
        const lead = old.currentLead
          ? await this.ports.users.get(tx, old.currentLead.leadId)
          : null;
        if (!lead || lead.role !== 'BRANCH_LEAD' || lead.status !== 'ACTIVE')
          throw conflict('ACTIVE_LEAD_REQUIRED');
      }
      await this.ports.branches.update(tx, id, {
        status: input.status,
        version: { increment: 1 },
      });
      await appendAudit(tx, {
        actor: { kind: 'STAFF', id: user.id },
        domain: 'branches',
        action: 'BRANCH_STATUS_CHANGED',
        entityType: 'Branch',
        entityId: id,
        branchId: id,
        before: { status: old.status },
        after: { status: input.status },
      });
      return this.ports.branches.get(tx, id);
    });
  }
  private async replace(
    tx: Tx,
    user: AuthUser,
    branchId: string,
    leadId: string,
    expected: string | null,
    now: Date,
  ) {
    const current = await this.ports.branches.current(tx, { branchId });
    if ((current?.id ?? null) !== expected) throw conflict('STALE_ASSIGNMENT');
    const lead = await this.ports.users.get(tx, leadId);
    if (!lead || lead.status !== 'ACTIVE' || lead.role !== 'BRANCH_LEAD')
      throw conflict('INELIGIBLE_LEAD');
    if (await this.ports.branches.current(tx, { leadId }))
      throw conflict('LEAD_ALREADY_ASSIGNED');
    if (current) await this.ports.branches.endAssignment(tx, current.id, now);
    const assignment = await this.ports.branches.assign(
      tx,
      branchId,
      leadId,
      user.id,
      now,
    );
    for (const staffId of [current?.leadId, leadId])
      if (staffId) await this.auth.revokeSessions(tx, staffId, now);
    await appendAudit(tx, {
      actor: { kind: 'STAFF', id: user.id },
      domain: 'branches',
      action: current ? 'BRANCH_LEAD_REPLACED' : 'BRANCH_LEAD_ASSIGNED',
      entityType: 'Branch',
      entityId: branchId,
      branchId,
      before: { id: current?.id ?? null, actorId: current?.leadId ?? null },
      after: { id: assignment.id, actorId: leadId },
    });
  }
  assign(
    token: string | undefined,
    csrf: string,
    id: string,
    input: LeadAssign,
  ) {
    return this.run(token, csrf, async (tx, user) => {
      const branch = await this.ports.branches.get(tx, id);
      if (!branch) throw missing();
      if (branch.version !== input.version) throw conflict('STALE_VERSION');
      await this.replace(
        tx,
        user,
        id,
        input.leadId,
        input.expectedAssignmentId,
        await this.auth.repository.now(tx),
      );
      await this.ports.branches.update(tx, id, { version: { increment: 1 } });
      return this.ports.branches.get(tx, id);
    });
  }
  auditList(token: string | undefined, q: AdminList) {
    return this.run(token, undefined, (tx) => this.ports.audit.list(tx, q));
  }
  auditDetail(token: string | undefined, id: string) {
    return this.run(token, undefined, async (tx) => {
      const row = await this.ports.audit.get(tx, id);
      if (!row) throw missing();
      return row;
    });
  }
}
