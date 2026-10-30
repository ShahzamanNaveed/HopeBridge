import { test, expect, type Page } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../apps/backend/src/generated/prisma/client.js';
import { hashPassword } from '../../apps/backend/src/modules/auth/password.js';
import ur from '../../apps/frontend/src/i18n/ur/translation.json' with { type: 'json' };
const password = `Administration test ${randomBytes(16).toString('hex')}`;
const email = `administration-${randomBytes(8).toString('hex')}@example.test`;
let leadName: string;
let replacementName: string;
test.use({ reducedMotion: 'reduce' });
test.beforeAll(async () => {
  const fixture = new URL(process.env.AUTH_E2E_DATABASE ?? 'invalid:');
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(fixture.hostname) ||
    !/^\/hopebridge_e2e_auth_[a-f0-9]{32}$/.test(fixture.pathname)
  )
    throw new Error(
      'Administration browser tests require their local disposable database',
    );
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.AUTH_E2E_DATABASE }),
  });
  try {
    const admin = await db.staffUser.create({
      data: {
        emailNormalized: email,
        displayName: 'Administration Browser Admin',
        role: 'SUPER_ADMIN',
      },
    });
    const hash = await hashPassword(password);
    await db.staffCredential.create({
      data: {
        staffId: admin.id,
        passwordHash: hash,
        mustChangePassword: false,
      },
    });
    await db.city.upsert({
      where: { code: 'ADM' },
      create: { name: 'Administration Test City', code: 'ADM' },
      update: {},
    });
    for (const label of ['Lead', 'Replacement']) {
      const displayName = `Administration ${label}`;
      const staff = await db.staffUser.upsert({
        where: { emailNormalized: `admin-${label.toLowerCase()}@example.test` },
        create: {
          emailNormalized: `admin-${label.toLowerCase()}@example.test`,
          displayName,
          role: 'BRANCH_LEAD',
        },
        update: {},
      });
      await db.staffCredential.upsert({
        where: { staffId: staff.id },
        create: {
          staffId: staff.id,
          passwordHash: hash,
          mustChangePassword: false,
        },
        update: { passwordHash: hash },
      });
      if (label === 'Lead') leadName = displayName;
      else replacementName = displayName;
    }
  } finally {
    await db.$disconnect();
  }
});
async function login(page: Page) {
  await page.goto('/staff/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL('/staff/super-admin');
  await expect(page.locator('.dashboard-metrics')).toBeVisible();
}
test('database-backed dashboard and staff creation/edit/reset/one-time credential', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  await expect(page.locator('.dashboard-card strong').first()).toHaveText(
    /\d+/,
  );
  await page.screenshot({
    path: 'test-results/administration/dashboard.png',
    fullPage: true,
  });
  await page
    .locator('.staff-sidebar')
    .getByRole('link', { name: 'Staff Accounts', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Create staff account', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(dialog.getByRole('alert').first()).toBeVisible();
  await dialog.getByLabel('Name', { exact: true }).fill('Browser created HR');
  await dialog
    .getByLabel('Email address', { exact: true })
    .fill('browser-created-hr@example.test');
  await dialog.getByLabel('Role', { exact: true }).selectOption('HR_LEAD');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(
    page.getByRole('dialog', { name: 'One-time temporary credential' }),
  ).toBeVisible();
  await expect(page.locator('.admin-secret')).toHaveText(/.{32,}/);
  await page.getByRole('button', { name: 'I have saved it securely' }).click();
  await page
    .getByLabel('Search', { exact: true })
    .fill('browser-created-hr@example.test');
  const row = page.getByRole('row').filter({ hasText: 'Browser created HR' });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'View', exact: true }).click();
  await expect(dialog.locator('.admin-secret')).toHaveCount(0);
  await dialog.getByLabel('Name', { exact: true }).fill('Browser edited HR');
  await dialog.getByLabel('I confirm this administrative change.').check();
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(
    page.getByRole('row').filter({ hasText: 'Browser edited HR' }),
  ).toBeVisible();
  await page
    .getByRole('row')
    .filter({ hasText: 'Browser edited HR' })
    .getByRole('button', { name: 'View', exact: true })
    .click();
  await dialog
    .getByLabel('Reset this account password and revoke all its sessions.')
    .check();
  await dialog
    .getByRole('button', { name: 'Reset credential', exact: true })
    .click();
  await expect(page.locator('.admin-secret')).toBeVisible();
  await page.getByRole('button', { name: 'I have saved it securely' }).click();
  expect(
    await page.evaluate(() => Object.values(localStorage).join(' ')),
  ).not.toContain('temporaryPassword');
});
test('branch create, assignment, activation, replacement and immutable closure', async ({
  page,
}) => {
  await login(page);
  await page
    .locator('.staff-sidebar')
    .getByRole('link', { name: 'Branches', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Create branch', exact: true })
    .click();
  let dialog = page.getByRole('dialog');
  await dialog
    .getByLabel('Name', { exact: true })
    .fill('Browser operational branch');
  await dialog
    .getByLabel('Address', { exact: true })
    .fill('Synthetic browser address');
  await dialog
    .getByLabel('City', { exact: true })
    .selectOption({ label: 'Administration Test City (ADM)' });
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  const row = page
    .getByRole('row')
    .filter({ hasText: 'Browser operational branch' });
  await expect(row).toContainText('ADM-001');
  await row.getByRole('button', { name: 'View', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Status', exact: true }).click();
  await dialog.getByLabel('Status', { exact: true }).selectOption('ACTIVE');
  await dialog.getByLabel('I confirm this administrative change.').check();
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(dialog.getByRole('alert')).toContainText(
    'Assign an active Branch Lead',
  );
  await dialog
    .getByRole('button', { name: 'Branch Lead', exact: true })
    .click();
  await dialog
    .getByLabel('Branch Lead', { exact: true })
    .selectOption({ label: `${leadName} (admin-lead@example.test)` });
  await dialog.getByLabel('I confirm this administrative change.').check();
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(row).toContainText(leadName);
  await row.getByRole('button', { name: 'View', exact: true }).click();
  await dialog.getByRole('button', { name: 'Status', exact: true }).click();
  await dialog.getByLabel('Status', { exact: true }).selectOption('ACTIVE');
  await dialog.getByLabel('I confirm this administrative change.').check();
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(row).toContainText('Active');
  await row.getByRole('button', { name: 'View', exact: true }).click();
  await dialog
    .getByRole('button', { name: 'Branch Lead', exact: true })
    .click();
  await dialog.getByLabel('Branch Lead', { exact: true }).selectOption({
    label: `${replacementName} (admin-replacement@example.test)`,
  });
  await dialog.getByLabel('I confirm this administrative change.').check();
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(row).toContainText(replacementName);
  await row.getByRole('button', { name: 'View', exact: true }).click();
  await dialog
    .getByRole('button', {
      name: 'Administrative history (latest 100)',
      exact: true,
    })
    .click();
  await expect(dialog).toContainText(leadName);
  await expect(dialog).toContainText(replacementName);
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await row.getByRole('button', { name: 'View', exact: true }).click();
  await dialog.getByRole('button', { name: 'Status', exact: true }).click();
  await dialog.getByLabel('Status', { exact: true }).selectOption('CLOSED');
  await dialog.getByLabel('I confirm this administrative change.').check();
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(row).toContainText('Closed');
  await page.screenshot({
    path: 'test-results/administration/branches.png',
    fullPage: true,
  });
  await row.getByRole('button', { name: 'View', exact: true }).click();
  await dialog.getByRole('button', { name: 'Status', exact: true }).click();
  await expect(dialog).toContainText('Closed branches cannot reopen.');
}, 120000);
test('audit list/detail, filters, English/Urdu values, focus and responsive shells', async ({
  page,
}) => {
  await login(page);
  await page.goto('/staff/super-admin/audit');
  await expect(
    page.getByRole('heading', { name: 'Audit Logs', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.admin-table-scroll')).toBeVisible();
  await page.screenshot({
    path: 'test-results/administration/audit.png',
    fullPage: true,
  });
  await page.getByLabel('Search', { exact: true }).fill('BOOTSTRAP');
  await page.locator('.admin-table-scroll tbody button').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Before');
  await dialog.press('Escape');
  await expect(dialog).not.toBeVisible();
  await page
    .getByLabel('Search', { exact: true })
    .fill('unmatched synthetic event');
  await expect(
    page.getByText('No matching records.', { exact: true }),
  ).toBeVisible();
  await page.goto('/staff/super-admin/staff-accounts');
  await page
    .getByRole('button', { name: 'Create staff account', exact: true })
    .click();
  await dialog.getByLabel('Name', { exact: true }).fill('Preserved draft');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await dialog.press('Escape');
  await page.getByRole('button', { name: 'Switch language' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(
    page.getByRole('heading', {
      name: ur.layout.nav['staff-accounts'],
      exact: true,
    }),
  ).toBeVisible();
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('.admin-module')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page
    .getByRole('button', { name: ur.admin.createStaff, exact: true })
    .click();
  await expect(dialog.getByLabel(ur.admin.name, { exact: true })).toBeVisible();
  await dialog.press('Escape');
  await page.screenshot({
    path: 'test-results/administration/mobile-urdu.png',
    fullPage: true,
  });
});
