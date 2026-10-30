import {
  changePasswordSchema,
  type ChangePasswordRequest,
  type AuthUser,
} from '@shiplens/contracts';
import { timingSafeEqual } from 'node:crypto';
import { HttpError } from '../../common/errors/http-error.js';
import { appendAudit } from '../audit/audit.service.js';
import { AuthRepository, type AuthTransaction } from './auth.repository.js';
import { authorize, type Permission } from './authorization.js';
import {
  generateTemporaryPassword,
  hashPassword,
  verifyPassword,
} from './password.js';
import { csrfForToken, generateToken, hashToken } from './token.js';

const invalidLogin = () =>
  new HttpError(
    401,
    'INVALID_CREDENTIALS',
    'Unable to sign in. Check your credentials or contact your administrator.',
  );
let dummyHash: Promise<string> | undefined;
export class AuthService {
  constructor(readonly repository: AuthRepository) {}
  private async issue(
    tx: AuthTransaction,
    staffId: string,
    restricted: boolean,
    now: Date,
  ) {
    const token = generateToken();
    const csrfToken = csrfForToken(token);
    await this.repository.createSession(tx, {
      staffId,
      tokenHash: hashToken(token),
      csrfTokenHash: hashToken(csrfToken),
      restricted,
      issuedAt: now,
      lastActivityAt: now,
      idleExpiresAt: new Date(+now + 8 * 3600000),
      absoluteExpiresAt: new Date(+now + 24 * 3600000),
    });
    return {
      token,
      csrfToken,
      user: await this.repository.user(tx, staffId, restricted),
    };
  }
  async login(email: string, password: string) {
    const candidate = await this.repository.credentialByEmail(email);
    dummyHash ??= hashPassword(generateTemporaryPassword());
    const valid = await verifyPassword(
      password,
      candidate?.passwordHash ?? (await dummyHash),
    );
    if (!candidate || !valid) throw invalidLogin();
    return this.repository.transaction(async (tx) => {
      await this.repository.lockStaff(tx, [candidate.staffId]);
      const now = await this.repository.now(tx);
      const current = await this.repository.credential(tx, candidate.staffId);
      if (
        current.passwordHash !== candidate.passwordHash ||
        current.staff.status !== 'ACTIVE' ||
        (current.mustChangePassword &&
          (!current.temporaryExpiresAt || current.temporaryExpiresAt <= now))
      )
        throw invalidLogin();
      return this.issue(tx, current.staffId, current.mustChangePassword, now);
    });
  }
  private checkCsrf(expected: string, csrf: string | undefined) {
    if (
      !csrf ||
      !/^[a-f0-9]{64}$/.test(csrf) ||
      !timingSafeEqual(
        Buffer.from(hashToken(csrf), 'hex'),
        Buffer.from(expected, 'hex'),
      )
    )
      throw new HttpError(403, 'CSRF_REJECTED', 'Request rejected');
  }
  async me(token: string | undefined) {
    return this.repository.transaction(async (tx) => {
      const { session, user, now } = await this.repository.session(tx, token);
      await this.repository.touch(
        tx,
        session.id,
        now,
        session.absoluteExpiresAt,
      );
      return { user, csrfToken: csrfForToken(token!) };
    });
  }
  /** Consumer mutation coordinator: callback and audit run under the same fresh authorization transaction.
   * Domain services must lock/revalidate their record/branch state here before writes.
   * Do not use a previously serialized frontend user as mutation authorization.
   */
  async withAuthorization<T>(
    token: string | undefined,
    action: Permission | 'session',
    branchId: string | undefined,
    work: (
      tx: AuthTransaction,
      user: Awaited<ReturnType<AuthRepository['user']>>,
    ) => Promise<T>,
    csrf?: string,
  ) {
    return this.repository.transaction(async (tx) => {
      // Acquire the shared administrative lock BEFORE actor row locks. All SA
      // coordinators/reset use this order, preventing actor/target lock inversion.
      if (
        [
          'staff.manage',
          'branch.manage',
          'branch.assign',
          'audit.read',
        ].includes(action)
      )
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(72942001)::text`;
      const { session, user, now } = await this.repository.session(tx, token);
      if (csrf !== undefined) this.checkCsrf(session.csrfTokenHash, csrf);
      authorize(user, action, branchId);
      const result = await work(tx, user);
      await this.repository.touch(
        tx,
        session.id,
        now,
        session.absoluteExpiresAt,
      );
      return result;
    });
  }
  /** Unsafe domain requests must use this port plus trustedOrigin middleware. */
  async withMutationAuthorization<T>(
    token: string | undefined,
    csrf: string | undefined,
    action: Permission,
    branchId: string | undefined,
    work: (tx: AuthTransaction, user: AuthUser) => Promise<T>,
  ) {
    return this.withAuthorization(token, action, branchId, work, csrf ?? '');
  }
  async logout(token: string | undefined, csrf: string | undefined) {
    return this.repository.transaction(async (tx) => {
      const { session, user, now } = await this.repository.session(tx, token);
      this.checkCsrf(session.csrfTokenHash, csrf);
      await this.repository.revokeSession(tx, session.id, now);
      await appendAudit(tx, {
        actor: { kind: 'STAFF', id: user.id },
        domain: 'auth',
        action: 'SESSION_REVOKED',
        entityType: 'StaffUser',
        entityId: user.id,
      });
    });
  }
  async changePassword(
    token: string | undefined,
    csrf: string | undefined,
    input: ChangePasswordRequest,
    firstLogin: boolean,
  ) {
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success)
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'Check the submitted fields',
      );
    // Hash outside the transaction; password validation is enforced by the shared router schema.
    const replacement = await hashPassword(input.newPassword);
    return this.repository.transaction(async (tx) => {
      const { session, user, now } = await this.repository.session(tx, token);
      this.checkCsrf(session.csrfTokenHash, csrf);
      if (!firstLogin && (user.mustChangePassword || user.restricted))
        throw new HttpError(
          403,
          'PASSWORD_CHANGE_REQUIRED',
          'Password change required',
        );
      if (firstLogin && !user.mustChangePassword)
        throw new HttpError(409, 'CREDENTIALS_CHANGED', 'Credentials changed');
      const credential = await this.repository.credential(tx, user.id);
      if (
        !(await verifyPassword(input.currentPassword, credential.passwordHash))
      )
        throw new HttpError(
          422,
          'CURRENT_PASSWORD_INCORRECT',
          'Current password is incorrect',
        );
      if (await verifyPassword(input.newPassword, credential.passwordHash))
        throw new HttpError(
          422,
          'NEW_PASSWORD_MUST_DIFFER',
          'Choose a different password',
        );
      await this.repository.updateCredential(tx, user.id, {
        passwordHash: replacement,
        mustChangePassword: false,
        temporaryIssuedAt: null,
        temporaryExpiresAt: null,
        changedAt: now,
      });
      await this.revokeSessions(tx, user.id, now);
      await this.repository.recordCredentialEvent(
        tx,
        user.id,
        user.id,
        'CHANGE',
      );
      await appendAudit(tx, {
        actor: { kind: 'STAFF', id: user.id },
        domain: 'auth',
        action: 'PASSWORD_CHANGED',
        entityType: 'StaffUser',
        entityId: user.id,
      });
      return this.issue(tx, user.id, false, now);
    });
  }
  /** Staff lifecycle coordinators must lock target staff before this transaction port. */
  async revokeSessions(tx: AuthTransaction, staffId: string, now: Date) {
    await this.repository.revokeSessions(tx, staffId, now);
  }
  async resetCredential(
    token: string | undefined,
    csrf: string | undefined,
    targetId: string,
  ) {
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);
    const result = await this.repository.transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(72942001)::text`;
      // Lock actor/target in deterministic order to serialize reset/password/login.
      const raw = token
        ? await this.repository.sessionByToken(tx, token)
        : null;
      if (!raw) throw new HttpError(401, 'SESSION_EXPIRED', 'Sign in again');
      await this.repository.lockStaff(tx, [raw.staffId, targetId]);
      const { session, user, now } = await this.repository.session(tx, token);
      this.checkCsrf(session.csrfTokenHash, csrf);
      authorize(user, 'staff.reset');
      const target = await this.repository.staffById(tx, targetId);
      if (!target || target.status !== 'ACTIVE')
        throw new HttpError(404, 'ACCOUNT_UNAVAILABLE', 'Account unavailable');
      const expiresAt = new Date(+now + 24 * 3600000);
      await this.repository.updateCredential(tx, targetId, {
        passwordHash,
        temporaryIssuedAt: now,
        temporaryExpiresAt: expiresAt,
        mustChangePassword: true,
        changedAt: now,
      });
      await this.revokeSessions(tx, targetId, now);
      await this.repository.recordCredentialEvent(
        tx,
        targetId,
        user.id,
        'RESET',
      );
      await appendAudit(tx, {
        actor: { kind: 'STAFF', id: user.id },
        domain: 'auth',
        action: 'CREDENTIAL_RESET',
        entityType: 'StaffUser',
        entityId: targetId,
      });
      return { expiresAt: expiresAt.toISOString() };
    });
    return { temporaryPassword, ...result };
  }
}
