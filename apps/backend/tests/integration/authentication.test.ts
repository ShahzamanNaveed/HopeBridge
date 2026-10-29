import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client.js';
import { AuthRepository } from '../../src/modules/auth/auth.repository.js';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { bootstrapSuperAdmin } from '../../src/modules/auth/bootstrap.js';
import {
  hashPassword,
  verifyPassword,
} from '../../src/modules/auth/password.js';
import {
  hashToken,
  generateToken,
  csrfForToken,
} from '../../src/modules/auth/token.js';
import { createApp } from '../../src/app.js';

const name = `hopebridge_auth_test_${randomUUID().replaceAll('-', '')}`;
let admin: pg.Client;
let db: PrismaClient;
let repository: AuthRepository;
let service: AuthService;
let created = false;
let initial: NonNullable<Awaited<ReturnType<typeof bootstrapSuperAdmin>>>;
let owner: Awaited<ReturnType<AuthService['login']>>;
const password = 'A long synthetic test passphrase';
const origin = 'http://127.0.0.1:5173';
const app = () =>
  createApp({
    checkDatabase: async () => {},
    rateLimitMax: 1000,
    auth: { service, origins: [origin], secure: false, loginLimit: 100 },
  });
let serial = 0;
async function staff(
  role:
    | 'SUPER_ADMIN'
    | 'FINANCE_REVIEWER'
    | 'CONTENT_EDITOR'
    | 'BRANCH_LEAD'
    | 'HR_LEAD' = 'HR_LEAD',
) {
  const user = await db.staffUser.create({
    data: {
      emailNormalized: `synthetic-${++serial}@example.test`,
      displayName: 'Synthetic staff',
      role,
    },
  });
  await db.staffCredential.create({
    data: {
      staffId: user.id,
      passwordHash: await hashPassword(password),
      mustChangePassword: false,
    },
  });
  return user;
}
beforeAll(async () => {
  const url = new URL(process.env.DATABASE_URL ?? 'invalid:');
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    throw new Error('Authentication tests require local disposable PostgreSQL');
  admin = new pg.Client({ connectionString: url.toString() });
  await admin.connect();
  await admin.query(`CREATE DATABASE "${name}"`);
  created = true;
  url.pathname = `/${name}`;
  execFileSync(
    process.execPath,
    ['../../node_modules/prisma/build/index.js', 'migrate', 'deploy'],
    { env: { ...process.env, DATABASE_URL: url.toString() }, stdio: 'pipe' },
  );
  db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url.toString(), max: 8 }),
  });
  repository = new AuthRepository(db);
  service = new AuthService(repository);
  initial = (await bootstrapSuperAdmin(repository, {
    email: 'synthetic-owner@example.test',
    displayName: 'Synthetic owner',
  }))!;
}, 60000);
afterAll(async () => {
  if (db) await db.$disconnect();
  if (created) await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
  if (admin) await admin.end();
});

describe('real PostgreSQL authentication', () => {
  it('bootstraps once with hash-only 24h temporary credentials and safe audit', async () => {
    expect(
      await bootstrapSuperAdmin(repository, {
        email: 'other@example.test',
        displayName: 'Other',
      }),
    ).toBeNull();
    const credential = await db.staffCredential.findUniqueOrThrow({
      where: { staffId: initial.staffId },
    });
    expect(
      await verifyPassword(initial.temporaryPassword, credential.passwordHash),
    ).toBe(true);
    expect(credential.passwordHash).not.toContain(initial.temporaryPassword);
    expect(
      +credential.temporaryExpiresAt! - +credential.temporaryIssuedAt!,
    ).toBe(86400000);
    const audit = JSON.stringify(await db.auditEvent.findMany());
    expect(audit).not.toContain(initial.temporaryPassword);
    expect(await db.staffUser.count()).toBe(1);
  });
  it('issues restricted login, denies normal work, then rotates after first change', async () => {
    const temporary = await service.login(
      'synthetic-owner@example.test',
      initial.temporaryPassword,
    );
    expect(temporary.user.restricted).toBe(true);
    await expect(
      service.withAuthorization(
        temporary.token,
        'staff.reset',
        undefined,
        async () => true,
      ),
    ).rejects.toMatchObject({ code: 'PASSWORD_CHANGE_REQUIRED' });
    owner = await service.changePassword(
      temporary.token,
      temporary.csrfToken,
      {
        currentPassword: initial.temporaryPassword,
        newPassword: password,
        confirmPassword: password,
      },
      true,
    );
    expect(owner.user.mustChangePassword).toBe(false);
    expect(owner.token).not.toBe(temporary.token);
    await expect(service.me(temporary.token)).rejects.toMatchObject({
      status: 401,
    });
    const persisted = await db.staffSession.findUniqueOrThrow({
      where: { tokenHash: hashToken(owner.token) },
    });
    expect(JSON.stringify(persisted)).not.toContain(owner.token);
    expect(JSON.stringify(persisted)).not.toContain(owner.csrfToken);
  });
  it('returns identical login failures for unknown, wrong, inactive and expired accounts', async () => {
    const target = await staff();
    await db.staffUser.update({
      where: { id: target.id },
      data: { status: 'INACTIVE', deactivatedAt: new Date() },
    });
    const attempts = [
      ['nobody@example.test', password],
      ['synthetic-owner@example.test', 'wrong'],
      [target.emailNormalized, password],
    ];
    const expired = await staff();
    await db.staffCredential.update({
      where: { staffId: expired.id },
      data: {
        mustChangePassword: true,
        temporaryIssuedAt: new Date(Date.now() - 86401000),
        temporaryExpiresAt: new Date(Date.now() - 1000),
      },
    });
    attempts.push([expired.emailNormalized, password]);
    for (const [email, secret] of attempts)
      await expect(service.login(email!, secret!)).rejects.toMatchObject({
        status: 401,
        code: 'INVALID_CREDENTIALS',
      });
  });
  it('blocks expired temporary sessions, including password replacement', async () => {
    const target = await staff();
    const now = new Date();
    await db.staffCredential.update({
      where: { staffId: target.id },
      data: {
        mustChangePassword: true,
        temporaryIssuedAt: now,
        temporaryExpiresAt: new Date(+now + 86400000),
      },
    });
    const session = await service.login(target.emailNormalized, password);
    await db.staffCredential.update({
      where: { staffId: target.id },
      data: {
        temporaryIssuedAt: new Date(+now - 86401000),
        temporaryExpiresAt: new Date(+now - 1000),
      },
    });
    await expect(service.me(session.token)).rejects.toMatchObject({
      code: 'TEMPORARY_PASSWORD_EXPIRED',
    });
    await expect(
      service.changePassword(
        session.token,
        session.csrfToken,
        {
          currentPassword: password,
          newPassword: 'A different synthetic passphrase',
          confirmPassword: 'A different synthetic passphrase',
        },
        true,
      ),
    ).rejects.toMatchObject({ status: 401 });
  });
  it('enforces 8h idle and 24h absolute deadlines without resurrection', async () => {
    for (const kind of ['idle', 'absolute']) {
      const target = await staff();
      const token = generateToken();
      const now = Date.now();
      const issuedAt = new Date(
        now - (kind === 'absolute' ? 86400001 : 8 * 3600000 + 1),
      );
      await db.staffSession.create({
        data: {
          staffId: target.id,
          tokenHash: hashToken(token),
          csrfTokenHash: hashToken(csrfForToken(token)),
          issuedAt,
          lastActivityAt: issuedAt,
          idleExpiresAt: new Date(+issuedAt + 8 * 3600000),
          absoluteExpiresAt: new Date(+issuedAt + 86400000),
        },
      });
      await expect(service.me(token)).rejects.toMatchObject({ status: 401 });
      expect(
        (
          await db.staffSession.findUniqueOrThrow({
            where: { tokenHash: hashToken(token) },
          })
        ).idleExpiresAt.getTime(),
      ).toBeLessThan(Date.now());
    }
  });
  it('does not extend absolute expiry or refresh forbidden requests', async () => {
    const target = await staff('CONTENT_EDITOR');
    const session = await service.login(target.emailNormalized, password);
    const before = await db.staffSession.findUniqueOrThrow({
      where: { tokenHash: hashToken(session.token) },
    });
    await expect(
      service.withAuthorization(
        session.token,
        'report.approve',
        undefined,
        async () => true,
      ),
    ).rejects.toMatchObject({ status: 403 });
    const denied = await db.staffSession.findUniqueOrThrow({
      where: { id: before.id },
    });
    expect(denied.lastActivityAt).toEqual(before.lastActivityAt);
    await service.me(session.token);
    const after = await db.staffSession.findUniqueOrThrow({
      where: { id: before.id },
    });
    expect(after.absoluteExpiresAt).toEqual(before.absoluteExpiresAt);
    expect(+after.idleExpiresAt).toBeLessThanOrEqual(+after.absoluteExpiresAt);
  });
  it('checks current account status and never revives a revoked session', async () => {
    const target = await staff();
    const session = await service.login(target.emailNormalized, password);
    await db.staffUser.update({
      where: { id: target.id },
      data: { status: 'INACTIVE', deactivatedAt: new Date() },
    });
    await expect(service.me(session.token)).rejects.toMatchObject({
      status: 401,
    });
    await db.$transaction(async (tx) => {
      await tx.staffSession.updateMany({
        where: { staffId: target.id },
        data: { revokedAt: new Date() },
      });
      await tx.staffUser.update({
        where: { id: target.id },
        data: { status: 'ACTIVE', deactivatedAt: null },
      });
    });
    await expect(service.me(session.token)).rejects.toMatchObject({
      status: 401,
    });
  });
  it('validates current password, confirmation, strength and difference server-side', async () => {
    for (const input of [
      {
        currentPassword: 'wrong',
        newPassword: 'A different synthetic passphrase',
        confirmPassword: 'A different synthetic passphrase',
      },
      {
        currentPassword: password,
        newPassword: password,
        confirmPassword: password,
      },
      {
        currentPassword: password,
        newPassword: 'short',
        confirmPassword: 'short',
      },
      {
        currentPassword: password,
        newPassword: 'A different synthetic passphrase',
        confirmPassword: 'mismatch',
      },
    ])
      await expect(
        service.changePassword(owner.token, owner.csrfToken, input, false),
      ).rejects.toBeTruthy();
  });
  it('changes password and revokes all other sessions', async () => {
    const target = await staff();
    const one = await service.login(target.emailNormalized, password);
    const two = await service.login(target.emailNormalized, password);
    const changed = 'A new synthetic password with spaces';
    const rotated = await service.changePassword(
      one.token,
      one.csrfToken,
      {
        currentPassword: password,
        newPassword: changed,
        confirmPassword: changed,
      },
      false,
    );
    await expect(service.me(one.token)).rejects.toMatchObject({ status: 401 });
    await expect(service.me(two.token)).rejects.toMatchObject({ status: 401 });
    expect((await service.me(rotated.token)).user.id).toBe(target.id);
    await expect(
      service.login(target.emailNormalized, password),
    ).rejects.toMatchObject({ status: 401 });
    expect((await service.login(target.emailNormalized, changed)).user.id).toBe(
      target.id,
    );
  });
  it('resets once after commit, invalidates old password/sessions and audits no secrets', async () => {
    const target = await staff();
    const previous = await service.login(target.emailNormalized, password);
    const reset = await service.resetCredential(
      owner.token,
      owner.csrfToken,
      target.id,
    );
    expect(reset.temporaryPassword.length).toBeGreaterThanOrEqual(24);
    await expect(service.me(previous.token)).rejects.toMatchObject({
      status: 401,
    });
    await expect(
      service.login(target.emailNormalized, password),
    ).rejects.toMatchObject({ status: 401 });
    expect(
      (await service.login(target.emailNormalized, reset.temporaryPassword))
        .user.restricted,
    ).toBe(true);
    const audit = JSON.stringify(await db.auditEvent.findMany());
    expect(audit).not.toContain(reset.temporaryPassword);
    expect(audit).not.toContain(previous.token);
    expect(
      await db.credentialEvent.count({
        where: { staffId: target.id, kind: 'RESET' },
      }),
    ).toBe(1);
  });
  it('denies non-admin reset and inactive target without changing credentials', async () => {
    const target = await staff();
    const other = await staff('FINANCE_REVIEWER');
    const otherSession = await service.login(other.emailNormalized, password);
    await expect(
      service.resetCredential(
        otherSession.token,
        otherSession.csrfToken,
        target.id,
      ),
    ).rejects.toMatchObject({ status: 403 });
    await db.staffUser.update({
      where: { id: target.id },
      data: { status: 'INACTIVE', deactivatedAt: new Date() },
    });
    await expect(
      service.resetCredential(owner.token, owner.csrfToken, target.id),
    ).rejects.toMatchObject({ status: 404 });
    expect(
      await db.credentialEvent.count({
        where: { staffId: target.id, kind: 'RESET' },
      }),
    ).toBe(0);
  });
  it('rolls back credential/session effects if audit append fails', async () => {
    const target = await staff();
    const session = await service.login(target.emailNormalized, password);
    const before = await db.staffCredential.findUniqueOrThrow({
      where: { staffId: target.id },
    });
    const failing = new AuthRepository(
      db.$extends({
        query: {
          auditEvent: {
            create() {
              throw new Error('synthetic audit failure');
            },
          },
        },
      }) as unknown as PrismaClient,
    );
    await expect(
      new AuthService(failing).changePassword(
        session.token,
        session.csrfToken,
        {
          currentPassword: password,
          newPassword: 'Another long synthetic password',
          confirmPassword: 'Another long synthetic password',
        },
        false,
      ),
    ).rejects.toThrow('synthetic audit failure');
    expect(
      (
        await db.staffCredential.findUniqueOrThrow({
          where: { staffId: target.id },
        })
      ).passwordHash,
    ).toBe(before.passwordHash);
    expect((await service.me(session.token)).user.id).toBe(target.id);
  });
  it('resolves current branch scope and rejects outgoing lead after replacement', async () => {
    const lead = await staff('BRANCH_LEAD');
    const replacement = await staff('BRANCH_LEAD');
    const city = await db.city.create({
      data: { name: 'Synthetic city', code: 'TST' },
    });
    const branch = await db.branch.create({
      data: { cityId: city.id, name: 'Synthetic branch', code: 'TST-001' },
    });
    const old = await db.branchLeadAssignment.create({
      data: {
        branchId: branch.id,
        leadId: lead.id,
        assignedById: owner.user.id,
      },
    });
    const session = await service.login(lead.emailNormalized, password);
    expect(
      await service.withAuthorization(
        session.token,
        'collection.record',
        branch.id,
        async () => true,
      ),
    ).toBe(true);
    await expect(
      service.withAuthorization(
        session.token,
        'collection.record',
        randomUUID(),
        async () => true,
      ),
    ).rejects.toMatchObject({ status: 403 });
    await db.$transaction(async (tx) => {
      await tx.branchLeadAssignment.update({
        where: { id: old.id },
        data: { endedAt: new Date() },
      });
      await tx.branchLeadAssignment.create({
        data: {
          branchId: branch.id,
          leadId: replacement.id,
          assignedById: owner.user.id,
        },
      });
    });
    await expect(
      service.withAuthorization(
        session.token,
        'collection.record',
        branch.id,
        async () => true,
      ),
    ).rejects.toMatchObject({ status: 403 });
    expect((await service.me(session.token)).user.branch).toBeNull();
  });
  it('authenticates all five approved roles and denies forbidden actions', async () => {
    const cases = [
      ['SUPER_ADMIN', 'staff.reset'],
      ['FINANCE_REVIEWER', 'report.approve'],
      ['CONTENT_EDITOR', 'content.manage'],
      ['HR_LEAD', 'application.decide'],
      ['BRANCH_LEAD', 'session'],
    ] as const;
    for (const [role, action] of cases) {
      const target = await staff(role);
      const session = await service.login(target.emailNormalized, password);
      expect(
        await service.withAuthorization(
          session.token,
          action,
          undefined,
          async (_tx, user) => user.role,
        ),
      ).toBe(role);
      if (role !== 'CONTENT_EDITOR')
        await expect(
          service.withAuthorization(
            session.token,
            'content.manage',
            undefined,
            async () => true,
          ),
        ).rejects.toMatchObject({ status: 403 });
    }
  }, 15000);
  it('enforces Origin, CSRF, cookie flags, cache controls and opaque response DTOs', async () => {
    const http = app();
    expect(
      (
        await request(http)
          .post('/api/v1/auth/login')
          .send({ email: 'synthetic-owner@example.test', password })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(http)
          .post('/api/v1/auth/login')
          .set('Origin', 'https://evil.example')
          .send({ email: 'synthetic-owner@example.test', password })
      ).status,
    ).toBe(403);
    const login = await request(http)
      .post('/api/v1/auth/login')
      .set('Origin', origin)
      .send({ email: 'synthetic-owner@example.test', password });
    expect(login.status).toBe(200);
    expect(login.headers['cache-control']).toBe('no-store');
    const cookie = String(login.headers['set-cookie']?.[0]);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Path=/api/v1');
    expect(login.body.data.token).toBeUndefined();
    expect(login.body.data.user.passwordHash).toBeUndefined();
    for (const csrf of ['', 'bad'])
      expect(
        (
          await request(http)
            .post('/api/v1/auth/logout')
            .set('Origin', origin)
            .set('Cookie', cookie)
            .set('X-CSRF-Token', csrf)
        ).status,
      ).toBe(403);
    const out = await request(http)
      .post('/api/v1/auth/logout')
      .set('Origin', origin)
      .set('Cookie', cookie)
      .set('X-CSRF-Token', login.body.data.csrfToken);
    expect(out.status).toBe(200);
    expect(String(out.headers['set-cookie']?.[0])).toContain(
      'Expires=Thu, 01 Jan 1970',
    );
    expect(
      (await request(http).get('/api/v1/auth/me').set('Cookie', cookie)).status,
    ).toBe(401);
  });
  it('rate limits actual login requests', async () => {
    const http = createApp({
      checkDatabase: async () => {},
      auth: { service, origins: [origin], secure: false, loginLimit: 1 },
    });
    await request(http)
      .post('/api/v1/auth/login')
      .set('Origin', origin)
      .send({ email: 'nobody@example.test', password });
    expect(
      (
        await request(http)
          .post('/api/v1/auth/login')
          .set('Origin', origin)
          .send({ email: 'nobody@example.test', password })
      ).status,
    ).toBe(429);
  });
});
