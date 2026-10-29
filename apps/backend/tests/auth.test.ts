import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { AuthUser } from '@shiplens/contracts';
import {
  changePasswordSchema,
  loginRequestSchema,
  staffRoleSchema,
} from '@shiplens/contracts';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import {
  AuthRepository,
  type AuthTransaction,
} from '../src/modules/auth/auth.repository.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { authorize } from '../src/modules/auth/authorization.js';
import {
  hashPassword,
  verifyPassword,
  generateTemporaryPassword,
} from '../src/modules/auth/password.js';
import {
  generateToken,
  hashToken,
  csrfForToken,
} from '../src/modules/auth/token.js';
import { bootstrapSuperAdmin } from '../src/modules/auth/bootstrap.js';
import { createApp } from '../src/app.js';
import { requirePermission } from '../src/common/middleware/auth.js';
import { errorHandler } from '../src/common/middleware/error-handler.js';

const id = randomUUID();
const user: AuthUser = {
  id,
  email: 'synthetic@example.test',
  displayName: 'Synthetic',
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
  mustChangePassword: false,
  restricted: false,
  branch: null,
};
const password = 'A synthetic passphrase with spaces';
const changed = 'A different synthetic passphrase';
const origin = 'http://127.0.0.1:5173';

describe('authentication primitives and deny-by-default policy', () => {
  it('uses salted Argon2id and constant-size bounded verification', async () => {
    const hash = await hashPassword(password);
    expect(hash).toMatch(/^\$argon2id\$v=19\$m=65536,t=3,p=1\$/);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
    expect(await hashPassword(password)).not.toBe(hash);
    for (const malformed of [
      'plain',
      '$argon2id$v=19$m=999999999,t=3,p=1$a$b',
      '$argon2id$v=19$m=65536,t=3,p=1$a$b',
    ])
      expect(await verifyPassword(password, malformed)).toBe(false);
    expect(generateTemporaryPassword()).not.toBe(generateTemporaryPassword());
  });
  it('keeps exactly five roles, canonical email and approved password bounds', () => {
    expect(staffRoleSchema.options).toHaveLength(5);
    for (const legacy of [
      'HEAD_OFFICE_FINANCE',
      'FIELD_COLLECTOR',
      'PUBLIC_OFFICER',
    ])
      expect(staffRoleSchema.safeParse(legacy).success).toBe(false);
    expect(
      loginRequestSchema.parse({ email: ' SYNTHETIC@example.test ', password })
        .email,
    ).toBe('synthetic@example.test');
    expect(
      changePasswordSchema.safeParse({
        currentPassword: password,
        newPassword: 'short',
        confirmPassword: 'short',
      }).success,
    ).toBe(false);
    expect(
      changePasswordSchema.safeParse({
        currentPassword: password,
        newPassword: 'ایک منفرد اور محفوظ پاس ورڈ',
        confirmPassword: 'ایک منفرد اور محفوظ پاس ورڈ',
      }).success,
    ).toBe(true);
  });
  it('generates independent session/CSRF tokens and irreversible digests', () => {
    const token = generateToken();
    expect(token).toHaveLength(64);
    expect(hashToken(token)).not.toBe(token);
    expect(csrfForToken(token)).toHaveLength(64);
    expect(csrfForToken(token)).not.toBe(token);
    expect(csrfForToken(generateToken())).not.toBe(csrfForToken(token));
  });
  it('enforces current identity, action separation, unknown-action denial and branch scope', () => {
    expect(() => authorize(user, 'staff.reset')).not.toThrow();
    expect(() => authorize(user, 'content.manage')).toThrow();
    expect(() => authorize(user, '__proto__' as 'staff.reset')).toThrow();
    expect(() =>
      authorize({ ...user, status: 'INACTIVE' }, 'session'),
    ).toThrow();
    expect(() => authorize({ ...user, restricted: true }, 'session')).toThrow();
    const lead = {
      ...user,
      role: 'BRANCH_LEAD' as const,
      branch: { id, name: 'Synthetic branch', code: 'TST-001' },
    };
    expect(() => authorize(lead, 'collection.record', id)).not.toThrow();
    expect(() => authorize(lead, 'collection.record')).toThrow();
    expect(() => authorize(lead, 'collection.record', randomUUID())).toThrow();
  });
});

function fakeRepository() {
  const now = new Date();
  const token = generateToken();
  const csrf = csrfForToken(token);
  const session = {
    id: randomUUID(),
    staffId: id,
    tokenHash: hashToken(token),
    csrfTokenHash: hashToken(csrf),
    issuedAt: now,
    lastActivityAt: now,
    idleExpiresAt: new Date(+now + 8 * 3600000),
    absoluteExpiresAt: new Date(+now + 86400000),
    restricted: false,
    revokedAt: null as Date | null,
  };
  const credential = {
    staffId: id,
    passwordHash: '',
    mustChangePassword: false,
    temporaryExpiresAt: null as Date | null,
    staff: { ...user, emailNormalized: user.email },
  };
  const tx = {
    $queryRaw: vi.fn(async () => [{ now }]),
    staffUser: {
      findUniqueOrThrow: vi.fn(async () => credential.staff),
      findUnique: vi.fn(async () => credential.staff),
      count: vi.fn(async () => 0),
      create: vi.fn(async () => ({ id })),
    },
    staffCredential: {
      findUnique: vi.fn(async () => credential),
      findUniqueOrThrow: vi.fn(async () => credential),
      findFirst: vi.fn(async () => credential),
      create: vi.fn(async () => ({})),
      update: vi.fn(async () => ({})),
    },
    staffSession: {
      create: vi.fn(async () => ({})),
      findUnique: vi.fn(async () => session),
      findUniqueOrThrow: vi.fn(async () => session),
      update: vi.fn(async () => ({})),
      updateMany: vi.fn(async () => ({ count: 2 })),
    },
    branchLeadAssignment: { findFirst: vi.fn(async () => null) },
    credentialEvent: { create: vi.fn(async () => ({})) },
    auditEvent: {
      create: vi.fn(async () => ({ id: randomUUID(), createdAt: now })),
    },
  };
  const database = {
    ...tx,
    $transaction: vi.fn(
      async (work: (t: AuthTransaction) => Promise<unknown>) =>
        work(tx as unknown as AuthTransaction),
    ),
  };
  const repository = new AuthRepository(database as unknown as PrismaClient);
  return {
    now,
    token,
    csrf,
    session,
    credential,
    tx,
    repository,
    service: new AuthService(repository),
  };
}

describe('orchestration unit checks (PostgreSQL atomicity tested separately)', () => {
  it('refreshes only a valid current session and denies missing, unknown, revoked/expired tokens', async () => {
    const f = fakeRepository();
    expect((await f.service.me(f.token)).user.id).toBe(id);
    expect(f.tx.staffSession.update).toHaveBeenCalled();
    await expect(f.service.me(undefined)).rejects.toMatchObject({
      status: 401,
    });
    f.tx.staffSession.findUnique.mockResolvedValueOnce(null as never);
    await expect(f.service.me(f.token)).rejects.toMatchObject({ status: 401 });
    f.session.revokedAt = new Date();
    await expect(f.service.me(f.token)).rejects.toMatchObject({ status: 401 });
    f.session.revokedAt = null;
    f.session.idleExpiresAt = new Date(0);
    await expect(f.service.me(f.token)).rejects.toMatchObject({ status: 401 });
  });
  it('denies expired restricted credentials and malformed/different CSRF without mutation', async () => {
    const f = fakeRepository();
    f.credential.mustChangePassword = true;
    await expect(f.service.me(f.token)).rejects.toMatchObject({
      code: 'TEMPORARY_PASSWORD_EXPIRED',
    });
    f.credential.mustChangePassword = false;
    for (const csrf of [undefined, 'bad', generateToken()])
      await expect(f.service.logout(f.token, csrf)).rejects.toMatchObject({
        code: 'CSRF_REJECTED',
      });
    expect(f.tx.staffSession.update).not.toHaveBeenCalled();
    await f.service.logout(f.token, f.csrf);
    expect(f.tx.auditEvent.create).toHaveBeenCalled();
  });
  it('checks login hash/state afresh before issuing a new tracked session', async () => {
    const f = fakeRepository();
    f.credential.passwordHash = await hashPassword(password);
    expect((await f.service.login(user.email, password)).user.id).toBe(id);
    await expect(f.service.login(user.email, 'wrong')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
    f.credential.staff.status = 'INACTIVE';
    await expect(f.service.login(user.email, password)).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
  });
  it('validates password changes and rotates only after correct current password', async () => {
    const f = fakeRepository();
    f.credential.passwordHash = await hashPassword(password);
    const input = {
      currentPassword: password,
      newPassword: changed,
      confirmPassword: changed,
    };
    await expect(
      f.service.changePassword(
        f.token,
        f.csrf,
        { ...input, newPassword: 'short' },
        false,
      ),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      f.service.changePassword(f.token, f.csrf, input, true),
    ).rejects.toMatchObject({ code: 'CREDENTIALS_CHANGED' });
    await expect(
      f.service.changePassword(
        f.token,
        f.csrf,
        { ...input, currentPassword: 'wrong' },
        false,
      ),
    ).rejects.toMatchObject({ code: 'CURRENT_PASSWORD_INCORRECT' });
    const result = await f.service.changePassword(
      f.token,
      f.csrf,
      input,
      false,
    );
    expect(result.token).not.toBe(f.token);
    expect(f.tx.staffSession.updateMany).toHaveBeenCalled();
    expect(f.tx.credentialEvent.create).toHaveBeenCalled();
    f.credential.mustChangePassword = true;
    f.credential.temporaryExpiresAt = new Date(Date.now() + 100000);
    await expect(
      f.service.changePassword(f.token, f.csrf, input, false),
    ).rejects.toMatchObject({ code: 'PASSWORD_CHANGE_REQUIRED' });
    expect(
      (await f.service.changePassword(f.token, f.csrf, input, true)).user.id,
    ).toBe(id);
  });
  it('keeps reset disclosure behind current admin authorization and audit', async () => {
    const f = fakeRepository();
    f.credential.passwordHash = await hashPassword(password);
    const result = await f.service.resetCredential(f.token, f.csrf, id);
    expect(result.temporaryPassword).toHaveLength(32);
    expect(f.tx.staffSession.updateMany).toHaveBeenCalled();
    f.tx.staffUser.findUnique.mockResolvedValueOnce(null as never);
    await expect(
      f.service.resetCredential(f.token, f.csrf, id),
    ).rejects.toMatchObject({ code: 'ACCOUNT_UNAVAILABLE' });
    f.tx.staffSession.findUnique.mockResolvedValueOnce(null as never);
    await expect(
      f.service.resetCredential(f.token, f.csrf, id),
    ).rejects.toMatchObject({ status: 401 });
  });
  it('allows controlled bootstrap only when no administrator exists', async () => {
    const f = fakeRepository();
    expect(
      (
        await bootstrapSuperAdmin(f.repository, {
          email: user.email,
          displayName: 'Synthetic',
        })
      )?.temporaryPassword,
    ).toHaveLength(32);
    f.tx.staffUser.count.mockResolvedValueOnce(1);
    expect(
      await bootstrapSuperAdmin(f.repository, {
        email: user.email,
        displayName: 'Synthetic',
      }),
    ).toBeNull();
  });
  it('executes granted work within the authorization transaction and rejects CSRF', async () => {
    const f = fakeRepository();
    expect(
      await f.service.withAuthorization(
        f.token,
        'staff.manage',
        undefined,
        async (_tx, current) => current.id,
        f.csrf,
      ),
    ).toBe(id);
    await expect(
      f.service.withAuthorization(
        f.token,
        'staff.manage',
        undefined,
        async () => true,
        '',
      ),
    ).rejects.toMatchObject({ code: 'CSRF_REJECTED' });
    await expect(
      f.service.withMutationAuthorization(
        f.token,
        undefined,
        'staff.manage',
        undefined,
        async () => true,
      ),
    ).rejects.toMatchObject({ code: 'CSRF_REJECTED' });
    const http = express();
    http.get('/', requirePermission(f.service, 'staff.manage'), (_req, res) =>
      res.json({ ok: true }),
    );
    http.use(errorHandler);
    expect(
      (await request(http).get('/').set('Cookie', `hb_session=${f.token}`))
        .status,
    ).toBe(200);
  });
});

describe('HTTP authentication transport', () => {
  it('validates every mutation input, origin, cookies and safe response contracts', async () => {
    const f = fakeRepository();
    f.credential.passwordHash = await hashPassword(password);
    const app = createApp({
      checkDatabase: async () => {},
      auth: {
        service: f.service,
        origins: [origin],
        secure: true,
        loginLimit: 100,
      },
    });
    expect(
      (await request(app).post('/api/v1/auth/login').send({})).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post('/api/v1/auth/login')
          .set('Origin', origin)
          .send({})
      ).status,
    ).toBe(400);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .set('Origin', origin)
      .send({ email: user.email, password });
    expect(login.status).toBe(200);
    expect(String(login.headers['set-cookie'])).toContain('Secure');
    expect(login.body.data.token).toBeUndefined();
    expect(
      (
        await request(app)
          .get('/api/v1/auth/me')
          .set('Cookie', `hb_session=${f.token}`)
      ).status,
    ).toBe(200);
    for (const path of [
      'change-password',
      'first-login-password',
      'staff/invalid/reset-credential',
    ])
      expect(
        (
          await request(app)
            .post(`/api/v1/auth/${path}`)
            .set('Origin', origin)
            .send({})
        ).status,
      ).toBe(400);
    const changedResult = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Origin', origin)
      .set('Cookie', `hb_session=${f.token}`)
      .set('X-CSRF-Token', f.csrf)
      .send({
        currentPassword: password,
        newPassword: changed,
        confirmPassword: changed,
      });
    expect(changedResult.status).toBe(200);
    expect(
      (
        await request(app)
          .post(`/api/v1/auth/staff/${id}/reset-credential`)
          .set('Origin', origin)
          .set('Cookie', `hb_session=${f.token}`)
          .set('X-CSRF-Token', f.csrf)
      ).status,
    ).toBe(200);
    const out = await request(app)
      .post('/api/v1/auth/logout')
      .set('Origin', origin)
      .set('Cookie', `hb_session=${f.token}`)
      .set('X-CSRF-Token', f.csrf);
    expect(out.status).toBe(200);
    expect(String(out.headers['set-cookie'])).toContain('1970');
  });
});
