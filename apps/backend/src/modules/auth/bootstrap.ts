import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { AuthRepository } from './auth.repository.js';
import { generateTemporaryPassword, hashPassword } from './password.js';
import { appendAudit } from '../audit/audit.service.js';

export const bootstrapInput = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.trim().toLowerCase()),
  displayName: z.string().trim().min(1).max(100),
});
/** Local initialization only. Does not alter/recover an existing administrator. */
export async function bootstrapSuperAdmin(
  repository: AuthRepository,
  raw: z.input<typeof bootstrapInput>,
) {
  const input = bootstrapInput.parse(raw);
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const result = await repository.transaction(async (tx) => {
    await repository.lockBootstrap(tx);
    if (await repository.adminCount(tx)) return null;
    const now = await repository.now(tx);
    const expiresAt = new Date(+now + 24 * 3600000);
    const staff = await repository.createInitialAdmin(
      tx,
      input.email,
      input.displayName,
    );
    await repository.createCredential(tx, {
      staffId: staff.id,
      passwordHash,
      temporaryIssuedAt: now,
      temporaryExpiresAt: expiresAt,
      mustChangePassword: true,
    });
    await repository.recordCredentialEvent(
      tx,
      staff.id,
      undefined,
      'PROVISION',
    );
    await appendAudit(tx, {
      actor: { kind: 'SYSTEM', name: 'local-super-admin-bootstrap' },
      domain: 'auth',
      action: 'STAFF_BOOTSTRAPPED',
      entityType: 'StaffUser',
      entityId: staff.id,
    });
    return { staffId: staff.id, expiresAt: expiresAt.toISOString() };
  });
  return result ? { ...result, temporaryPassword } : null;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (
    process.env.NODE_ENV === 'production' ||
    !process.stdin.isTTY ||
    !process.stdout.isTTY
  )
    throw new Error(
      'Local bootstrap requires an interactive terminal and refuses redirected output or production',
    );
  const target = new URL(process.env.DATABASE_URL ?? 'invalid:');
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) ||
    target.pathname !== '/hopebridge_dev'
  )
    throw new Error(
      'Local bootstrap requires the explicitly configured local hopebridge_dev database',
    );
  const { db } = await import('../../infrastructure/db/client.js');
  try {
    const result = await bootstrapSuperAdmin(new AuthRepository(db), {
      email: process.argv[2] ?? '',
      displayName: process.argv[3] ?? '',
    });
    if (!result)
      process.stdout.write(
        'A Super Admin already exists. No account or credential was changed.\n',
      );
    else
      process.stdout.write(
        `One-time credential handoff. Capture privately now; it cannot be retrieved.\nTemporary password: ${result.temporaryPassword}\nExpires: ${result.expiresAt}\nFirst-login password change is required.\n`,
      );
  } catch {
    process.stderr.write(
      'Bootstrap failed. Check the email/name and intended local database. No credentials are logged.\n',
    );
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}
