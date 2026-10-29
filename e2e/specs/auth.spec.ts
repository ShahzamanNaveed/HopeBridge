import { test, expect } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../apps/backend/src/generated/prisma/client.js';
import {
  generateTemporaryPassword,
  hashPassword,
} from '../../apps/backend/src/modules/auth/password.js';
const evidence = 'test-results/authentication';
test.beforeAll(async () => {
  await mkdir(evidence, { recursive: true });
});

test('real bootstrap → mandatory change → workspace → password change → logout and revocation', async ({
  page,
  context,
}) => {
  const password = `Browser passphrase ${randomBytes(12).toString('hex')}`;
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/staff/login');
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible();
  await page.screenshot({ path: `${evidence}/01-login-desktop.png` });
  await page.getByLabel('Email address').fill('browser-admin@example.test');
  await page
    .getByLabel('Password', { exact: true })
    .fill(process.env.AUTH_E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/staff\/first-login$/);
  await expect(
    page.getByRole('heading', { name: 'Secure your account' }),
  ).toBeVisible();
  await page.screenshot({ path: `${evidence}/08-first-login-desktop.png` });
  await page.goto('/staff/security');
  await expect(page).toHaveURL(/staff\/first-login$/);
  await page
    .getByLabel('Current temporary password')
    .fill(process.env.AUTH_E2E_PASSWORD!);
  await page.getByLabel('New password', { exact: true }).fill(password);
  await page.getByLabel('Confirm new password').fill(password);
  await page
    .getByRole('button', { name: 'Update password & continue' })
    .click();
  await expect(page.getByRole('status')).toContainText('successfully');
  await page.getByRole('link', { name: 'Update password & continue' }).click();
  await expect(page).toHaveURL(/\/staff$/);
  await expect(page.getByText('Super Admin', { exact: true })).toBeVisible();
  const oldCookies = await context.cookies();
  let releaseProtectedCheck!: () => void;
  const protectedGate = new Promise<void>((done) => {
    releaseProtectedCheck = done;
  });
  await page.route('**/api/v1/auth/me', async (route) => {
    await protectedGate;
    await route.continue();
  });
  await page.getByRole('link', { name: 'Account security' }).click();
  await expect(page.getByRole('status')).toContainText('Checking your session');
  await expect(
    page.getByLabel('Current password', { exact: true }),
  ).toHaveCount(0);
  releaseProtectedCheck();
  await expect(
    page.getByRole('heading', { name: 'Change password', exact: true }),
  ).toBeVisible();
  await page.unroute('**/api/v1/auth/me');
  const accountCard = await page.locator('.hb-account-card').boundingBox();
  expect(accountCard?.y).toBe(265);
  const currentInput = await page
    .getByLabel('Current password', { exact: true })
    .boundingBox();
  expect(currentInput?.width).toBe(650);
  await page.screenshot({ path: `${evidence}/17-change-password-initial.png` });
  await page.getByLabel('Current password', { exact: true }).fill(password);
  const changed = `${password} changed`;
  await page.getByLabel('New password', { exact: true }).fill(changed);
  await page.getByLabel('Confirm new password').fill(changed);
  await page.getByRole('button', { name: 'Save new password' }).click();
  await expect(page.getByRole('status')).toContainText('successfully');
  await page.screenshot({ path: `${evidence}/17-change-password.png` });
  await page.getByRole('button', { name: 'Switch language' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.getByRole('link', { name: 'منسوخ کریں' }).click();
  await page.getByRole('link', { name: 'سائن آؤٹ', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'سائن آؤٹ کریں؟' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'سائن آؤٹ', exact: true }).click();
  await expect(page).toHaveURL(/staff\/signed-out$/);
  expect((await context.cookies()).some((c) => c.name === 'hb_session')).toBe(
    false,
  );
  const stale = oldCookies.find((c) => c.name === 'hb_session')!;
  expect(
    (
      await page.request.get('/api/v1/auth/me', {
        headers: { Cookie: `hb_session=${stale.value}` },
      })
    ).status(),
  ).toBe(401);
  await page.goto('/staff');
  await expect(page).toHaveURL(/staff\/session-expired$/);
  await page.getByRole('button', { name: 'زبان تبدیل کریں' }).click();
  await page.goto('/staff/login');
  await page.getByLabel('Email address').fill('browser-admin@example.test');
  await page.getByLabel('Password', { exact: true }).fill(changed);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/staff$/);
  await page.goto('/staff/access-denied');
  await expect(
    page.getByRole('heading', { name: 'Access restricted' }),
  ).toBeVisible();
  await page.setViewportSize({ width: 900, height: 720 });
  await page.screenshot({ path: `${evidence}/18-access-denied.png` });
  await page.goto('/staff/logout');
  await expect(
    page.getByRole('heading', { name: 'Sign out?', exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 900, height: 620 });
  await page.screenshot({ path: `${evidence}/24-logout.png` });
});

test('mobile validation, visibility, EN/UR preservation and responsive widths', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/staff/login');
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible();
  await page.screenshot({ path: `${evidence}/02-login-mobile.png` });
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('Required field', { exact: true })).toHaveCount(
    2,
  );
  await page.getByLabel('Email address').blur();
  await page.screenshot({ path: `${evidence}/04-login-validation.png` });
  await page.getByLabel('Email address').fill('synthetic@example.test');
  await page.getByLabel('Password', { exact: true }).fill('synthetic text');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute(
    'type',
    'text',
  );
  await page.getByRole('button', { name: 'Hide password' }).click();
  await page.getByLabel('Email address').fill('invalid-email');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(
    page.getByText('Enter a valid email address', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Switch language' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ur');
  await expect(page.getByLabel('ای میل ایڈریس')).toHaveValue('invalid-email');
  await expect(
    page.getByText('درست ای میل ایڈریس درج کریں', { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('پاس ورڈ', { exact: true })).toHaveValue(
    'synthetic text',
  );
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto('/staff/login');
  await expect(page.getByRole('heading', { name: 'خوش آمدید' })).toBeVisible();
  await page.locator('input').first().blur();
  await page.screenshot({ path: `${evidence}/03-login-urdu.png` });
});

test('generic incorrect credentials, network failure and safe account/session pages', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/staff/login');
  await page.getByLabel('Email address').fill('unknown@example.test');
  await page
    .getByLabel('Password', { exact: true })
    .fill('incorrect synthetic password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Unable to sign in');
  await page.screenshot({ path: `${evidence}/05-wrong-credentials.png` });
  await page.route('**/api/v1/auth/login', (route) => route.abort());
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Network error');
  await page.screenshot({ path: `${evidence}/06-network-error.png` });
  for (const [path, title, file] of [
    ['session-expired', 'Your session has expired', '19-session-expired'],
    [
      'temporary-password-expired',
      'Temporary password expired',
      '20-temporary-expired',
    ],
    [
      'account-unavailable',
      'Account access unavailable',
      '21-account-unavailable',
    ],
    [
      'credentials-changed',
      'Your sign-in credentials have changed',
      '22-credentials-changed',
    ],
    ['signed-out', 'You have signed out', '25-signed-out'],
  ]) {
    await page.setViewportSize({
      width: 900,
      height: file === '25-signed-out' ? 650 : 720,
    });
    await page.goto(`/staff/${path}`);
    await expect(
      page.getByRole('heading', { name: title, exact: true }),
    ).toBeVisible();
    await page.screenshot({ path: `${evidence}/${file}.png` });
  }
});

test('real expired temporary credentials stay generic and cannot enter workspace', async ({
  page,
}) => {
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.AUTH_E2E_DATABASE }),
  });
  try {
    const user = await db.staffUser.findUniqueOrThrow({
      where: { emailNormalized: 'browser-admin@example.test' },
    });
    const expired = new Date(Date.now() - 1000);
    await db.staffCredential.update({
      where: { staffId: user.id },
      data: {
        passwordHash: await hashPassword(process.env.AUTH_E2E_PASSWORD!),
        mustChangePassword: true,
        temporaryIssuedAt: new Date(+expired - 86400000),
        temporaryExpiresAt: expired,
      },
    });
  } finally {
    await db.$disconnect();
  }
  await page.goto('/staff/login');
  await page.getByLabel('Email address').fill('browser-admin@example.test');
  await page
    .getByLabel('Password', { exact: true })
    .fill(process.env.AUTH_E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Unable to sign in');
  await page.goto('/staff');
  await expect(page).toHaveURL(/staff\/session-expired$/);
});

test('all first-login design variants, loading guards and expired restricted session', async ({
  page,
}) => {
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.AUTH_E2E_DATABASE }),
  });
  const temporary = generateTemporaryPassword();
  const replacement = `Design flow ${randomBytes(12).toString('hex')}`;
  const email = 'design-variants@example.test';
  let userId: string;
  try {
    const now = new Date();
    const user = await db.staffUser.create({
      data: {
        emailNormalized: email,
        displayName: 'Synthetic design test',
        role: 'HR_LEAD',
      },
    });
    userId = user.id;
    await db.staffCredential.create({
      data: {
        staffId: user.id,
        passwordHash: await hashPassword(temporary),
        mustChangePassword: true,
        temporaryIssuedAt: now,
        temporaryExpiresAt: new Date(+now + 86400000),
      },
    });
    let releaseSession!: () => void;
    const sessionGate = new Promise<void>((done) => {
      releaseSession = done;
    });
    await page.route('**/api/v1/auth/me', async (route) => {
      await sessionGate;
      await route.continue();
    });
    await page.setViewportSize({ width: 720, height: 540 });
    await page.goto('/staff/login');
    await expect(page.getByRole('status')).toContainText(
      'Checking your session',
    );
    await page.screenshot({ path: `${evidence}/23-auth-loading.png` });
    releaseSession();
    await expect(
      page.getByRole('heading', { name: 'Welcome back' }),
    ).toBeVisible();
    await page.unroute('**/api/v1/auth/me');
    await page.setViewportSize({ width: 390, height: 844 });
    let releaseLogin!: () => void;
    const loginGate = new Promise<void>((done) => {
      releaseLogin = done;
    });
    await page.route('**/api/v1/auth/login', async (route) => {
      await loginGate;
      await route.continue();
    });
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(temporary);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Signing in…' }),
    ).toBeDisabled();
    await page.screenshot({ path: `${evidence}/07-login-loading.png` });
    releaseLogin();
    await expect(
      page.getByRole('heading', { name: 'Secure your account' }),
    ).toBeVisible();
    await page.unroute('**/api/v1/auth/login');
    await page.screenshot({ path: `${evidence}/09-first-login-mobile.png` });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('button', { name: 'Switch language' }).click();
    await page.screenshot({ path: `${evidence}/10-first-login-urdu.png` });
    await page.getByRole('button', { name: 'زبان تبدیل کریں' }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel('New password', { exact: true }).fill(replacement);
    await page.getByLabel('Confirm new password').fill(replacement);
    await page
      .getByRole('button', { name: 'Update password & continue' })
      .click();
    await expect(
      page.getByText('Required field', { exact: true }),
    ).toBeVisible();
    await page.getByLabel('Current temporary password').blur();
    await page.screenshot({ path: `${evidence}/11-first-login-required.png` });
    await page.getByLabel('Current temporary password').fill(temporary);
    await page
      .getByLabel('Confirm new password')
      .fill(`${replacement} mismatch`);
    await page
      .getByRole('button', { name: 'Update password & continue' })
      .click();
    await expect(
      page.getByText('Passwords do not match', { exact: true }),
    ).toBeVisible();
    await page.getByLabel('Confirm new password').blur();
    await page.screenshot({ path: `${evidence}/12-first-login-mismatch.png` });
    await page.getByLabel('New password', { exact: true }).fill('short');
    await page.getByLabel('Confirm new password').fill('short');
    await page
      .getByRole('button', { name: 'Update password & continue' })
      .click();
    await expect(
      page.getByText('Use at least 15 characters', { exact: true }),
    ).toBeVisible();
    await page.getByLabel('New password', { exact: true }).blur();
    await page.screenshot({ path: `${evidence}/13-first-login-strength.png` });
    await page.getByLabel('New password', { exact: true }).fill(replacement);
    await page.getByLabel('Confirm new password').fill(replacement);
    let releaseChange!: () => void;
    const changeGate = new Promise<void>((done) => {
      releaseChange = done;
    });
    await page.route('**/api/v1/auth/first-login-password', async (route) => {
      await changeGate;
      await route.continue();
    });
    await page
      .getByRole('button', { name: 'Update password & continue' })
      .click();
    await expect(
      page.getByRole('button', { name: 'Updating…' }),
    ).toBeDisabled();
    await page.screenshot({ path: `${evidence}/14-first-login-loading.png` });
    releaseChange();
    await expect(page.getByRole('status')).toContainText('successfully');
    await page.unroute('**/api/v1/auth/first-login-password');
    await page.screenshot({ path: `${evidence}/15-first-login-success.png` });
    await page
      .getByRole('link', { name: 'Update password & continue' })
      .click();
    await expect(page).toHaveURL(/\/staff$/);
    // Real current-credential restriction/expiry, without a mocked session response.
    const renewedAt = new Date();
    await db.staffCredential.update({
      where: { staffId: userId },
      data: {
        mustChangePassword: true,
        temporaryIssuedAt: renewedAt,
        temporaryExpiresAt: new Date(+renewedAt + 86400000),
      },
    });
    await page.goto('/staff/login'); // Existing session is constrained by the current credential state.
    await expect(page).toHaveURL(/staff\/first-login$/);
    const expired = new Date(Date.now() - 1000);
    await db.staffCredential.update({
      where: { staffId: userId },
      data: {
        temporaryIssuedAt: new Date(+expired - 86400000),
        temporaryExpiresAt: expired,
      },
    });
    await page.setViewportSize({ width: 720, height: 700 });
    await page.reload();
    await expect(page.getByRole('alert')).toContainText(
      'temporary password has expired',
    );
    await page.screenshot({ path: `${evidence}/16-first-login-expired.png` });
  } finally {
    await db.$disconnect();
  }
});
