import { beforeEach, describe, it, expect, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '../src/generated/prisma/client.js';
import {
  adminListSchema,
  staffCreateSchema,
  staffUpdateSchema,
  branchTransitionSchema,
  leadAssignSchema,
} from '@shiplens/contracts';
import { UsersRepository } from '../src/modules/users/users.repository.js';
import { BranchesRepository } from '../src/modules/branches/branches.repository.js';
import { AuditRepository } from '../src/modules/audit/audit.repository.js';
import { AdminRepository } from '../src/modules/admin/admin.repository.js';
import { AdminService } from '../src/modules/admin/admin.service.js';
import type { AuthService } from '../src/modules/auth/auth.service.js';
vi.mock('../src/modules/auth/password.js', () => ({
  generateTemporaryPassword: () => 'synthetic-temporary-password-for-unit-only',
  hashPassword: vi.fn(async () => '$argon2id$synthetic'),
}));
vi.mock('../src/infrastructure/db/city-sequence.js', () => ({
  allocateCitySequence: vi.fn(async () => 1n),
}));
vi.mock('../src/modules/audit/audit.service.js', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../src/modules/audit/audit.service.js')
  >()),
  appendAudit: vi.fn(async () => ({ id: randomUUID(), createdAt: new Date() })),
}));
const id = randomUUID(),
  cityId = randomUUID(),
  actor = randomUUID();
const now = new Date();
const staff = {
  id,
  emailNormalized: 'unit@example.test',
  displayName: 'Unit staff',
  role: 'HR_LEAD' as const,
  status: 'ACTIVE' as const,
  version: 0,
  createdAt: now,
  branchLeadAssignment_lead: [],
};
const branch = {
  id,
  code: 'LHR-001',
  name: 'Unit branch',
  address: 'Unit address',
  status: 'FORMING' as const,
  version: 0,
  cityId,
  createdAt: now,
  city: { id: cityId, name: 'Lahore', code: 'LHR' },
  branchLeadAssignment_branch: [],
};
const audit = {
  id,
  createdAt: now,
  actorId: actor,
  actor: { displayName: 'Unit actor' },
  systemActor: null,
  domain: 'users',
  action: 'STAFF_CREATED',
  entityType: 'StaffUser',
  entityId: id,
  branch: null,
  before: null,
  after: { status: 'ACTIVE', password: 'secret' },
  metadata: null,
};
function delegate(row: unknown) {
  return {
    count: vi.fn(async () => 1),
    findMany: vi.fn(async () => [row]),
    findUnique: vi.fn(async () => row),
    findFirst: vi.fn(async () => null),
    create: vi.fn(async () => ({ id })),
    update: vi.fn(async () => ({ id })),
    groupBy: vi.fn(async () => []),
  };
}
let tx: Prisma.TransactionClient;
let users: UsersRepository;
let branches: BranchesRepository;
let audits: AuditRepository;
let overview: AdminRepository;
let auth: AuthService;
let service: AdminService;
beforeEach(() => {
  vi.clearAllMocks();
  tx = {
    staffUser: delegate(staff),
    branch: delegate(branch),
    city: delegate(branch.city),
    branchLeadAssignment: delegate(null),
    auditEvent: delegate(audit),
  } as unknown as Prisma.TransactionClient;
  users = new UsersRepository();
  branches = new BranchesRepository();
  audits = new AuditRepository();
  overview = new AdminRepository();
  const user = { id: actor, role: 'SUPER_ADMIN' };
  auth = {
    withAuthorization: vi.fn(async (_t, _a, _b, work) => work(tx, user)),
    withMutationAuthorization: vi.fn(async (_t, _c, _a, _b, work) =>
      work(tx, user),
    ),
    revokeSessions: vi.fn(),
    repository: {
      now: vi.fn(async () => now),
      createCredential: vi.fn(),
      recordCredentialEvent: vi.fn(),
    },
  } as unknown as AuthService;
  service = new AdminService(auth, {
    users,
    branches,
    audit: audits,
    overview,
  });
});
describe('administration transport and repository projections', () => {
  it('validates five roles, normalized identity, optimistic versions and exact assignment expectation', () => {
    expect(
      staffCreateSchema.parse({
        email: 'TEST@EXAMPLE.TEST',
        displayName: ' Staff ',
        role: 'HR_LEAD',
      }).email,
    ).toBe('test@example.test');
    expect(
      staffCreateSchema.safeParse({
        email: 'a@example.test',
        displayName: 'x',
        role: ['HR_LEAD', 'SUPER_ADMIN'],
      }).success,
    ).toBe(false);
    expect(staffUpdateSchema.safeParse({}).success).toBe(false);
    expect(
      branchTransitionSchema.safeParse({ status: 'REOPENED', version: 0 })
        .success,
    ).toBe(false);
    expect(leadAssignSchema.safeParse({ version: 0, leadId: id }).success).toBe(
      false,
    );
    expect(
      adminListSchema.safeParse({
        from: '2026-10-30T00:00:00Z',
        to: '2026-10-29T00:00:00Z',
      }).success,
    ).toBe(false);
  });
  it('applies bounded search/status/role pagination and omits credentials', async () => {
    const result = await users.list(
      tx,
      adminListSchema.parse({
        search: 'unit',
        status: 'ACTIVE',
        role: 'HR_LEAD',
        page: 2,
        pageSize: 1,
      }),
    );
    expect(result.items[0]!.email).toBe(staff.emailNormalized);
    expect(result.items[0]).not.toHaveProperty('passwordHash');
    expect(tx.staffUser.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 1,
        take: 1,
        where: expect.objectContaining({ status: 'ACTIVE', role: 'HR_LEAD' }),
      }),
    );
    await users.list(tx, adminListSchema.parse({}));
  });
  it('projects branch/assignment identities and empty records safely', async () => {
    expect(
      (
        await branches.list(
          tx,
          adminListSchema.parse({ search: 'LHR', status: 'FORMING' }),
        )
      ).items[0]!.code,
    ).toBe('LHR-001');
    expect(await branches.get(tx, id)).toMatchObject({ currentLead: null });
    vi.mocked(tx.branch.findUnique).mockResolvedValueOnce(null);
    expect(await branches.get(tx, id)).toBeNull();
    vi.mocked(tx.staffUser.findUnique).mockResolvedValueOnce(null);
    expect(await users.get(tx, id)).toBeNull();
    vi.mocked(tx.branchLeadAssignment.findMany).mockResolvedValueOnce([
      {
        id,
        leadId: id,
        assignedById: actor,
        startedAt: now,
        endedAt: now,
        lead: { displayName: 'Lead' },
      },
    ] as never);
    expect(await branches.history(tx, id)).toHaveLength(1);
  });
  it('re-sanitizes stored audit and builds date/actor/branch/domain predicates', async () => {
    const result = await audits.list(
      tx,
      adminListSchema.parse({
        search: 'Staff',
        action: 'created',
        actorId: actor,
        branchId: id,
        domain: 'users',
        from: now.toISOString(),
        to: now.toISOString(),
      }),
      id,
    );
    expect(result.items[0]!.after).toEqual({
      status: 'ACTIVE',
      password: '[REDACTED]',
    });
    expect(await audits.get(tx, id)).toBeDefined();
    vi.mocked(tx.auditEvent.findUnique).mockResolvedValueOnce(null);
    expect(await audits.get(tx, id)).toBeNull();
    await audits.list(tx, adminListSchema.parse({}));
  });
});
describe('administration transaction coordinator', () => {
  const input = {
    displayName: 'Unit staff',
    email: 'unit@example.test',
    role: 'HR_LEAD' as const,
  };
  it('returns committed provisioning only through the mutation port', async () => {
    const result = await service.createStaff('token', 'csrf', input);
    expect(result.temporaryPassword).toContain('synthetic-temporary');
    expect(auth.repository.createCredential).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        mustChangePassword: true,
        temporaryExpiresAt: new Date(+now + 86400000),
      }),
    );
    expect(auth.withMutationAuthorization).toHaveBeenCalled();
  });
  it('rejects duplicates and maps repository constraints without disclosure', async () => {
    vi.spyOn(users, 'duplicate').mockResolvedValueOnce({ id });
    await expect(service.createStaff('t', 'c', input)).rejects.toMatchObject({
      code: 'IDENTITY_CONFLICT',
    });
    for (const code of [
      'P2002',
      'P2003',
      'P2025',
      'P2004',
      'P2010',
      'P2034',
      'unexpected',
    ]) {
      vi.spyOn(users, 'list').mockRejectedValueOnce({ code });
      await expect(
        service.staffList('t', adminListSchema.parse({})),
      ).rejects.toBeDefined();
    }
  });
  it('reads overview/lists/details/cities through current authorization', async () => {
    expect(await service.overview('t')).toMatchObject({
      totalBranches: 1,
      activeStaff: 1,
    });
    expect(
      (await service.staffList('t', adminListSchema.parse({}))).total,
    ).toBe(1);
    expect((await service.staffDetail('t', id)).staff.id).toBe(id);
    expect(
      (await service.branchList('t', adminListSchema.parse({}))).total,
    ).toBe(1);
    expect(await service.cities('t')).toHaveLength(1);
    vi.mocked(tx.branchLeadAssignment.findMany).mockResolvedValueOnce([]);
    expect((await service.branchDetail('t', id)).branch.id).toBe(id);
    expect(
      (await service.auditList('t', adminListSchema.parse({}))).total,
    ).toBe(1);
    expect((await service.auditDetail('t', id)).id).toBe(id);
  });
  it('returns stable not-found errors', async () => {
    vi.spyOn(users, 'get').mockResolvedValue(null);
    await expect(service.staffDetail('t', id)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    await expect(
      service.updateStaff('t', 'c', id, {
        ...input,
        status: 'ACTIVE',
        version: 0,
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    vi.spyOn(branches, 'get').mockResolvedValue(null);
    for (const action of [
      () => service.branchDetail('t', id),
      () =>
        service.updateBranch('t', 'c', id, {
          name: 'x',
          address: 'y',
          cityId,
          version: 0,
        }),
      () => service.transition('t', 'c', id, { status: 'ACTIVE', version: 0 }),
      () =>
        service.assign('t', 'c', id, {
          version: 0,
          leadId: id,
          expectedAssignmentId: null,
        }),
    ])
      await expect(action()).rejects.toMatchObject({ code: 'NOT_FOUND' });
    vi.spyOn(audits, 'get').mockResolvedValue(null);
    await expect(service.auditDetail('t', id)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
  it('enforces stale versions and last-active-admin protection', async () => {
    await expect(
      service.updateStaff('t', 'c', id, {
        ...input,
        status: 'ACTIVE',
        version: 99,
      }),
    ).rejects.toMatchObject({ code: 'STALE_VERSION' });
    vi.spyOn(users, 'get').mockResolvedValue({
      ...staff,
      email: input.email,
      role: 'SUPER_ADMIN',
      branch: null,
      createdAt: now.toISOString(),
    });
    await expect(
      service.updateStaff('t', 'c', id, {
        ...input,
        status: 'INACTIVE',
        version: 0,
      }),
    ).rejects.toMatchObject({ code: 'LAST_ACTIVE_ADMIN' });
  });
  it('updates permitted staff fields and revokes when role/contact/status changes', async () => {
    await service.updateStaff('t', 'c', id, {
      ...input,
      email: 'new@example.test',
      status: 'INACTIVE',
      version: 0,
    });
    expect(auth.revokeSessions).toHaveBeenCalledWith(tx, id, now);
    await service.updateStaff('t', 'c', id, {
      ...input,
      status: 'ACTIVE',
      version: 0,
    });
    vi.spyOn(users, 'duplicate').mockResolvedValueOnce({ id });
    await expect(
      service.updateStaff('t', 'c', id, {
        ...input,
        status: 'ACTIVE',
        version: 0,
      }),
    ).rejects.toMatchObject({ code: 'IDENTITY_CONFLICT' });
  });
  it('requires assigned-lead replacement without changing unrelated histories', async () => {
    vi.spyOn(branches, 'current').mockResolvedValue({
      id,
      branchId: id,
      leadId: id,
    } as never);
    await expect(
      service.updateStaff('t', 'c', id, {
        ...input,
        status: 'INACTIVE',
        version: 0,
      }),
    ).rejects.toMatchObject({ code: 'REPLACEMENT_REQUIRED' });
  });
  it('creates Forming with approved city mapping and immutable code sequence', async () => {
    expect(
      await service.createBranch('t', 'c', {
        name: 'New',
        address: 'Address',
        cityId,
      }),
    ).toMatchObject({ code: 'LHR-001' });
    vi.spyOn(branches, 'city').mockResolvedValueOnce(null);
    await expect(
      service.createBranch('t', 'c', {
        name: 'New',
        address: 'Address',
        cityId,
      }),
    ).rejects.toMatchObject({ code: 'CITY_MAPPING_REQUIRED' });
  });
  it('checks branch updates and stale lifecycle/assignment versions', async () => {
    await service.updateBranch('t', 'c', id, {
      name: 'New',
      address: 'Address',
      cityId,
      version: 0,
    });
    for (const action of [
      () =>
        service.updateBranch('t', 'c', id, {
          name: 'New',
          address: 'Address',
          cityId,
          version: 4,
        }),
      () => service.transition('t', 'c', id, { status: 'ACTIVE', version: 4 }),
      () =>
        service.assign('t', 'c', id, {
          version: 4,
          leadId: id,
          expectedAssignmentId: null,
        }),
    ])
      await expect(action()).rejects.toMatchObject({ code: 'STALE_VERSION' });
    vi.spyOn(branches, 'city').mockResolvedValueOnce(null);
    await expect(
      service.updateBranch('t', 'c', id, {
        name: 'New',
        address: 'Address',
        cityId,
        version: 0,
      }),
    ).rejects.toMatchObject({ code: 'CITY_MAPPING_REQUIRED' });
  });
  it('validates lifecycle/no-op/lead eligibility and writes allowed transitions', async () => {
    await service.transition('t', 'c', id, { status: 'FORMING', version: 0 });
    await service.transition('t', 'c', id, { status: 'CLOSED', version: 0 });
    await expect(
      service.transition('t', 'c', id, { status: 'PAUSED', version: 0 }),
    ).rejects.toMatchObject({ code: 'INVALID_BRANCH_TRANSITION' });
    await expect(
      service.transition('t', 'c', id, { status: 'ACTIVE', version: 0 }),
    ).rejects.toMatchObject({ code: 'ACTIVE_LEAD_REQUIRED' });
  });
  it('validates assignment state and candidate active/single role/unassigned eligibility', async () => {
    await expect(
      service.assign('t', 'c', id, {
        version: 0,
        leadId: id,
        expectedAssignmentId: actor,
      }),
    ).rejects.toMatchObject({ code: 'STALE_ASSIGNMENT' });
    await expect(
      service.assign('t', 'c', id, {
        version: 0,
        leadId: id,
        expectedAssignmentId: null,
      }),
    ).rejects.toMatchObject({ code: 'INELIGIBLE_LEAD' });
    vi.spyOn(users, 'get').mockResolvedValue({
      ...staff,
      email: staff.emailNormalized,
      role: 'BRANCH_LEAD',
      branch: null,
      createdAt: now.toISOString(),
    });
    await service.assign('t', 'c', id, {
      version: 0,
      leadId: id,
      expectedAssignmentId: null,
    });
    expect(auth.revokeSessions).toHaveBeenCalledWith(tx, id, now);
  });
});
