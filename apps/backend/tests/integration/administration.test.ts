import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client.js';
import { AuthRepository } from '../../src/modules/auth/auth.repository.js';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { bootstrapSuperAdmin } from '../../src/modules/auth/bootstrap.js';
import { verifyPassword } from '../../src/modules/auth/password.js';
import { AdminService } from '../../src/modules/admin/admin.service.js';
import { AdminRepository } from '../../src/modules/admin/admin.repository.js';
import { UsersRepository } from '../../src/modules/users/users.repository.js';
import { BranchesRepository } from '../../src/modules/branches/branches.repository.js';
import { AuditRepository } from '../../src/modules/audit/audit.repository.js';
import { adminListSchema } from '@shiplens/contracts';
import { createApp } from '../../src/app.js';

const name = `hopebridge_admin_test_${randomUUID().replaceAll('-', '')}`;
const origin = 'http://127.0.0.1:5173';
const password = 'Synthetic administrator test passphrase';
let db: PrismaClient;
let control: pg.Client;
let created = false;
let auth: AuthService;
let service: AdminService;
let owner: Awaited<ReturnType<AuthService['login']>>;
let app: ReturnType<typeof createApp>;
let cityId: string;
let serial = 0;
const fresh = () => ({
  displayName: 'Synthetic staff',
  email: `admin-fixture-${++serial}@example.test`,
  role: 'HR_LEAD' as const,
});
const headers = () => ({
  Origin: origin,
  'X-CSRF-Token': owner.csrfToken,
  Cookie: `hb_session=${owner.token}`,
});
async function staff(
  role:
    | 'HR_LEAD'
    | 'BRANCH_LEAD'
    | 'SUPER_ADMIN'
    | 'FINANCE_REVIEWER'
    | 'CONTENT_EDITOR' = 'HR_LEAD',
) {
  return service.createStaff(owner.token, owner.csrfToken, {
    ...fresh(),
    role,
  });
}
async function branch() {
  return (await service.createBranch(owner.token, owner.csrfToken, {
    name: 'Synthetic branch',
    address: 'Synthetic address',
    cityId,
  }))!;
}
beforeAll(async () => {
  const url = new URL(process.env.DATABASE_URL ?? 'invalid:');
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    throw new Error('Administration tests require local disposable PostgreSQL');
  control = new pg.Client({ connectionString: url.toString() });
  await control.connect();
  await control.query(`CREATE DATABASE "${name}"`);
  created = true;
  url.pathname = `/${name}`;
  execFileSync(
    process.execPath,
    ['../../node_modules/prisma/build/index.js', 'migrate', 'deploy'],
    { env: { ...process.env, DATABASE_URL: url.toString() }, stdio: 'pipe' },
  );
  db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url.toString(), max: 12 }),
  });
  auth = new AuthService(new AuthRepository(db));
  service = new AdminService(auth, {
    users: new UsersRepository(),
    branches: new BranchesRepository(),
    audit: new AuditRepository(),
    overview: new AdminRepository(),
  });
  const initial = (await bootstrapSuperAdmin(auth.repository, {
    email: 'admin-owner@example.test',
    displayName: 'Synthetic owner',
  }))!;
  const first = await auth.login(
    'admin-owner@example.test',
    initial.temporaryPassword,
  );
  owner = await auth.changePassword(
    first.token,
    first.csrfToken,
    {
      currentPassword: initial.temporaryPassword,
      newPassword: password,
      confirmPassword: password,
    },
    true,
  );
  cityId = (
    await db.city.create({ data: { name: 'Synthetic Lahore', code: 'LHR' } })
  ).id;
  app = createApp({
    checkDatabase: async () => {},
    rateLimitMax: 10000,
    auth: { service: auth, origins: [origin], secure: false, loginLimit: 1000 },
  });
}, 60000);
afterAll(async () => {
  if (db) await db.$disconnect();
  if (created) await control.query(`DROP DATABASE "${name}" WITH (FORCE)`);
  if (control) await control.end();
});
describe('A-03 real PostgreSQL administration', () => {
  it('creates hash-only 24h credentials, discloses once, and enforces first-login change', async () => {
    const response = await request(app)
      .post('/api/v1/admin/staff')
      .set(headers())
      .send(fresh())
      .expect(201);
    const value = response.body.data;
    const credential = await db.staffCredential.findUniqueOrThrow({
      where: { staffId: value.staff.id },
    });
    expect(
      await verifyPassword(value.temporaryPassword, credential.passwordHash),
    ).toBe(true);
    expect(
      +credential.temporaryExpiresAt! - +credential.temporaryIssuedAt!,
    ).toBe(86400000);
    const login = await auth.login(value.staff.email, value.temporaryPassword);
    expect(login.user.restricted).toBe(true);
    await expect(service.overview(login.token)).rejects.toMatchObject({
      code: 'PASSWORD_CHANGE_REQUIRED',
    });
    const details = await request(app)
      .get(`/api/v1/admin/staff/${value.staff.id}`)
      .set(headers())
      .expect(200);
    expect(JSON.stringify(details.body)).not.toContain(value.temporaryPassword);
    expect(JSON.stringify(details.body)).not.toContain('passwordHash');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(JSON.stringify(await db.auditEvent.findMany())).not.toContain(
      value.temporaryPassword,
    );
  });
  it('rejects duplicate/invalid identities and roles, including concurrent duplicate creation', async () => {
    const input = fresh();
    const results = await Promise.allSettled([
      service.createStaff(owner.token, owner.csrfToken, input),
      service.createStaff(owner.token, owner.csrfToken, input),
    ]);
    expect(results.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
    await request(app)
      .post('/api/v1/admin/staff')
      .set(headers())
      .send({ ...fresh(), role: 'PUBLISHER' })
      .expect(400);
    await request(app)
      .post('/api/v1/admin/staff')
      .set(headers())
      .send({ ...fresh(), status: 'ACTIVE' })
      .expect(400);
  });
  it('rejects expired temporary credentials at cutoff', async () => {
    const value = await staff();
    const expires = new Date(Date.now() - 1);
    await db.staffCredential.update({
      where: { staffId: value.staff!.id },
      data: {
        temporaryIssuedAt: new Date(+expires - 86400000),
        temporaryExpiresAt: expires,
      },
    });
    await expect(
      auth.login(value.staff!.email, value.temporaryPassword),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });
  it('checks all roles, direct IDs, CSRF and trusted Origin on backend', async () => {
    for (const role of [
      'HR_LEAD',
      'BRANCH_LEAD',
      'FINANCE_REVIEWER',
      'CONTENT_EDITOR',
    ] as const) {
      const value = await staff(role);
      const first = await auth.login(
        value.staff!.email,
        value.temporaryPassword,
      );
      const user = await auth.changePassword(
        first.token,
        first.csrfToken,
        {
          currentPassword: value.temporaryPassword,
          newPassword: password,
          confirmPassword: password,
        },
        true,
      );
      for (const path of [
        '/overview',
        '/staff',
        '/branches',
        '/audit',
        `/audit/${randomUUID()}`,
        `/staff/${owner.user.id}`,
      ])
        await request(app)
          .get(`/api/v1/admin${path}`)
          .set('Cookie', `hb_session=${user.token}`)
          .expect(403);
      await request(app)
        .post('/api/v1/admin/staff')
        .set({
          Origin: origin,
          Cookie: `hb_session=${user.token}`,
          'X-CSRF-Token': user.csrfToken,
        })
        .send(fresh())
        .expect(403);
    }
    await request(app).get('/api/v1/admin/overview').expect(401);
    await request(app)
      .post('/api/v1/admin/staff')
      .set({ ...headers(), 'X-CSRF-Token': 'invalid' })
      .send(fresh())
      .expect(403);
    await request(app)
      .post('/api/v1/admin/staff')
      .set({ ...headers(), Origin: 'https://attacker.test' })
      .send(fresh())
      .expect(403);
  }, 60000);
  it('updates staff, revokes immediately, and activation restores no old sessions', async () => {
    const value = await staff();
    const first = await auth.login(value.staff!.email, value.temporaryPassword);
    const login = await auth.changePassword(
      first.token,
      first.csrfToken,
      {
        currentPassword: value.temporaryPassword,
        newPassword: password,
        confirmPassword: password,
      },
      true,
    );
    const before = (await service.staffDetail(owner.token, value.staff!.id))
      .staff;
    const updated = await service.updateStaff(
      owner.token,
      owner.csrfToken,
      before.id,
      { ...before, status: 'INACTIVE' },
    );
    expect(updated!.status).toBe('INACTIVE');
    await expect(auth.me(login.token)).rejects.toMatchObject({
      code: 'SESSION_EXPIRED',
    });
    await expect(auth.login(before.email, password)).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
    await service.updateStaff(owner.token, owner.csrfToken, before.id, {
      ...updated!,
      status: 'ACTIVE',
    });
    await expect(auth.me(login.token)).rejects.toMatchObject({
      code: 'SESSION_EXPIRED',
    });
    await expect(
      service.updateStaff(owner.token, owner.csrfToken, before.id, {
        ...before,
        status: 'INACTIVE',
      }),
    ).rejects.toMatchObject({ code: 'STALE_VERSION' });
  });
  it('protects last admin and serializes concurrent administrators without deadlock', async () => {
    const me = (await service.staffDetail(owner.token, owner.user.id)).staff;
    await expect(
      service.updateStaff(owner.token, owner.csrfToken, me.id, {
        ...me,
        status: 'INACTIVE',
      }),
    ).rejects.toMatchObject({ code: 'LAST_ACTIVE_ADMIN' });
    const other = await staff('SUPER_ADMIN');
    const first = await auth.login(other.staff!.email, other.temporaryPassword);
    const login = await auth.changePassword(
      first.token,
      first.csrfToken,
      {
        currentPassword: other.temporaryPassword,
        newPassword: password,
        confirmPassword: password,
      },
      true,
    );
    const outcomes = await Promise.allSettled([
      service.updateStaff(owner.token, owner.csrfToken, other.staff!.id, {
        ...other.staff!,
        status: 'INACTIVE',
      }),
      service.updateStaff(login.token, login.csrfToken, me.id, {
        ...me,
        status: 'INACTIVE',
      }),
    ]);
    expect(outcomes.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
    expect(
      await db.staffUser.count({
        where: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
      }),
    ).toBe(1);
    // The first scheduled coordinator keeps the fixture owner active.
    if (
      (await db.staffUser.findUniqueOrThrow({ where: { id: me.id } }))
        .status !== 'ACTIVE'
    )
      owner = login;
  });
  it('allocates city branch codes concurrently and keeps codes permanent across edits', async () => {
    const values = await Promise.all(Array.from({ length: 4 }, () => branch()));
    expect(new Set(values.map((x) => x.code)).size).toBe(4);
    expect(values.every((x) => /^LHR-\d{3}$/.test(x.code))).toBe(true);
    const b = values[0]!;
    const city = await db.city.create({
      data: { name: 'Synthetic Faisalabad', code: 'FSD' },
    });
    const updated = await service.updateBranch(
      owner.token,
      owner.csrfToken,
      b.id,
      {
        name: 'Updated',
        address: 'Updated address',
        cityId: city.id,
        version: b.version,
      },
    );
    expect(updated!.code).toBe(b.code);
    expect(updated!.cityId).toBe(city.id);
  });
  it('enforces every allowed lifecycle, no-op and terminal closure', async () => {
    const b = await branch();
    await expect(
      service.transition(owner.token, owner.csrfToken, b.id, {
        status: 'ACTIVE',
        version: b.version,
      }),
    ).rejects.toMatchObject({ code: 'ACTIVE_LEAD_REQUIRED' });
    const lead = await staff('BRANCH_LEAD');
    let current = (await service.assign(owner.token, owner.csrfToken, b.id, {
      leadId: lead.staff!.id,
      version: b.version,
      expectedAssignmentId: null,
    }))!;
    expect(current.status).toBe('FORMING');
    for (const status of ['ACTIVE', 'PAUSED', 'ACTIVE', 'CLOSED'] as const)
      current = (await service.transition(owner.token, owner.csrfToken, b.id, {
        status,
        version: current.version,
      }))!;
    const count = await db.auditEvent.count();
    await service.transition(owner.token, owner.csrfToken, b.id, {
      status: 'CLOSED',
      version: current.version,
    });
    expect(await db.auditEvent.count()).toBe(count);
    await expect(
      service.transition(owner.token, owner.csrfToken, b.id, {
        status: 'ACTIVE',
        version: current.version,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_BRANCH_TRANSITION' });
    const forming = await branch();
    await expect(
      service.transition(owner.token, owner.csrfToken, forming.id, {
        status: 'PAUSED',
        version: 0,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_BRANCH_TRANSITION' });
    expect(
      (await service.transition(owner.token, owner.csrfToken, forming.id, {
        status: 'CLOSED',
        version: 0,
      }))!.status,
    ).toBe('CLOSED');
  });
  it('requires valid atomic replacement before deactivation or demotion; preserves history', async () => {
    const b = await branch();
    const old = await staff('BRANCH_LEAD');
    const next = await staff('BRANCH_LEAD');
    const first = await auth.login(old.staff!.email, old.temporaryPassword);
    const login = await auth.changePassword(
      first.token,
      first.csrfToken,
      {
        currentPassword: old.temporaryPassword,
        newPassword: password,
        confirmPassword: password,
      },
      true,
    );
    await service.assign(owner.token, owner.csrfToken, b.id, {
      version: 0,
      leadId: old.staff!.id,
      expectedAssignmentId: null,
    });
    const scoped = await auth.login(old.staff!.email, password);
    await auth.withAuthorization(
      scoped.token,
      'collection.record',
      b.id,
      async () => undefined,
    );
    await service.transition(owner.token, owner.csrfToken, b.id, {
      version: 1,
      status: 'ACTIVE',
    });
    const row = (await service.staffDetail(owner.token, old.staff!.id)).staff;
    await expect(
      service.updateStaff(owner.token, owner.csrfToken, row.id, {
        ...row,
        status: 'INACTIVE',
      }),
    ).rejects.toMatchObject({ code: 'REPLACEMENT_REQUIRED' });
    await expect(
      service.updateStaff(owner.token, owner.csrfToken, row.id, {
        ...row,
        role: 'HR_LEAD',
      }),
    ).rejects.toMatchObject({ code: 'REPLACEMENT_REQUIRED' });
    await service.updateStaff(owner.token, owner.csrfToken, row.id, {
      ...row,
      status: 'INACTIVE',
      replacementId: next.staff!.id,
    });
    const detail = await service.branchDetail(owner.token, b.id);
    expect(detail.assignments).toHaveLength(2);
    expect(detail.branch.currentLead!.leadId).toBe(next.staff!.id);
    expect(detail.assignments.filter((x) => x.endedAt)).toHaveLength(1);
    await expect(auth.me(login.token)).rejects.toMatchObject({
      code: 'SESSION_EXPIRED',
    });
    await expect(
      auth.withAuthorization(
        scoped.token,
        'collection.record',
        b.id,
        async () => undefined,
      ),
    ).rejects.toMatchObject({ code: 'SESSION_EXPIRED' });
    expect(detail.branch.status).toBe('ACTIVE');
  });
  it('rejects assigned/inactive/wrong-role candidates and stale replacement requests', async () => {
    const b = await branch();
    const other = await branch();
    const lead = await staff('BRANCH_LEAD');
    const hr = await staff();
    await service.assign(owner.token, owner.csrfToken, other.id, {
      leadId: lead.staff!.id,
      version: 0,
      expectedAssignmentId: null,
    });
    await expect(
      service.assign(owner.token, owner.csrfToken, b.id, {
        leadId: lead.staff!.id,
        version: 0,
        expectedAssignmentId: null,
      }),
    ).rejects.toMatchObject({ code: 'LEAD_ALREADY_ASSIGNED' });
    await expect(
      service.assign(owner.token, owner.csrfToken, b.id, {
        leadId: hr.staff!.id,
        version: 0,
        expectedAssignmentId: null,
      }),
    ).rejects.toMatchObject({ code: 'INELIGIBLE_LEAD' });
    const next = await staff('BRANCH_LEAD');
    await expect(
      service.assign(owner.token, owner.csrfToken, b.id, {
        leadId: next.staff!.id,
        version: 0,
        expectedAssignmentId: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: 'STALE_ASSIGNMENT' });
    const race = await Promise.allSettled([
      service.assign(owner.token, owner.csrfToken, b.id, {
        leadId: next.staff!.id,
        version: 0,
        expectedAssignmentId: null,
      }),
      service.assign(owner.token, owner.csrfToken, other.id, {
        leadId: next.staff!.id,
        version: 1,
        expectedAssignmentId: (
          await service.branchDetail(owner.token, other.id)
        ).branch.currentLead!.id,
      }),
    ]);
    expect(race.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
  });
  it('rolls back all mutation/credential/counter effects if audit write fails', async () => {
    const input = fresh();
    const before = await db.staffUser.count();
    const b = await branch();
    const old = await staff('BRANCH_LEAD');
    const next = await staff('BRANCH_LEAD');
    const assigned = (await service.assign(owner.token, owner.csrfToken, b.id, {
      version: 0,
      leadId: old.staff!.id,
      expectedAssignmentId: null,
    }))!;
    const countBeforeFailure = await db.staffUser.count();
    // Force a real database audit failure only in this disposable database.
    await db.$executeRawUnsafe(
      `CREATE FUNCTION test_fail_admin_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic audit outage'; END $$`,
    );
    await db.$executeRawUnsafe(
      'CREATE TRIGGER test_fail_admin_audit BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION test_fail_admin_audit()',
    );
    try {
      await expect(
        service.createStaff(owner.token, owner.csrfToken, input),
      ).rejects.toBeDefined();
      expect(await db.staffUser.count()).toBe(countBeforeFailure);
      expect(countBeforeFailure).toBe(before + 2);
      expect(
        await db.staffUser.count({ where: { emailNormalized: input.email } }),
      ).toBe(0);
      await expect(
        service.assign(owner.token, owner.csrfToken, b.id, {
          version: assigned.version,
          leadId: next.staff!.id,
          expectedAssignmentId: assigned.currentLead!.id,
        }),
      ).rejects.toBeDefined();
      const unchanged = await service.branchDetail(owner.token, b.id);
      expect(unchanged.branch.currentLead!.leadId).toBe(old.staff!.id);
      expect(unchanged.assignments).toHaveLength(1);
      expect(unchanged.assignments[0]!.endedAt).toBeNull();
    } finally {
      await db.$executeRawUnsafe(
        'DROP TRIGGER test_fail_admin_audit ON audit_events',
      );
      await db.$executeRawUnsafe('DROP FUNCTION test_fail_admin_audit()');
    }
  });
  it('returns real counts, validated filters, paginated details, and re-sanitized audit', async () => {
    const overview = await service.overview(owner.token);
    expect(overview.totalBranches).toBe(await db.branch.count());
    expect(overview.activeStaff).toBe(
      await db.staffUser.count({ where: { status: 'ACTIVE' } }),
    );
    const list = await service.staffList(
      owner.token,
      adminListSchema.parse({
        pageSize: 1,
        role: 'HR_LEAD',
        search: 'synthetic',
      }),
    );
    expect(list.items).toHaveLength(1);
    expect(list.total).toBeGreaterThan(1);
    await request(app)
      .get('/api/v1/admin/audit?page=0')
      .set(headers())
      .expect(400);
    const raw = await db.auditEvent.create({
      data: {
        actorKind: 'STAFF',
        actorId: owner.user.id,
        domain: 'users',
        action: 'SYNTHETIC_PRIVATE_EVENT',
        entityType: 'StaffUser',
        entityId: owner.user.id,
        metadata: {
          password: 'never disclose',
          email: 'private@example.test',
          status: 'ACTIVE',
        },
      },
    });
    const row = await service.auditDetail(owner.token, raw.id);
    expect(JSON.stringify(row)).not.toContain('never disclose');
    expect(JSON.stringify(row)).not.toContain('private@example.test');
    expect(row.metadata).toMatchObject({
      status: 'ACTIVE',
      password: '[REDACTED]',
    });
    expect(
      (
        await service.auditList(
          owner.token,
          adminListSchema.parse({
            action: 'SYNTHETIC_PRIVATE_EVENT',
            actorId: owner.user.id,
          }),
        )
      ).total,
    ).toBe(1);
    await request(app)
      .delete(`/api/v1/admin/audit/${raw.id}`)
      .set(headers())
      .expect(404);
    await expect(
      db.auditEvent.update({
        where: { id: raw.id },
        data: { action: 'tamper' },
      }),
    ).rejects.toBeDefined();
  });
});
