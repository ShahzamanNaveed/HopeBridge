import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../apps/backend/src/generated/prisma/client.js';
import { hashPassword } from '../../apps/backend/src/modules/auth/password.js';
import {
  roleMenus,
  roleRoots,
} from '../../apps/frontend/src/layouts/staff/role-navigation';
import en from '../../apps/frontend/src/i18n/en/translation.json' with { type: 'json' };
const password = `Layout fixture ${randomBytes(16).toString('hex')}`;
const emails = new Map<string, string>();
const cookies = new Map<
  string,
  Awaited<ReturnType<BrowserContext['cookies']>>
>();
const evidence = 'test-results/layout-implementation';
// Stable design captures also exercise the layout's reduced-motion support.
test.use({ reducedMotion: 'reduce' });
test.beforeAll(async () => {
  await mkdir(evidence, { recursive: true });
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.AUTH_E2E_DATABASE }),
  });
  try {
    const passwordHash = await hashPassword(password);
    const actor = await db.staffUser.findUniqueOrThrow({
      where: { emailNormalized: 'browser-admin@example.test' },
    });
    for (const role of Object.keys(roleRoots) as (keyof typeof roleRoots)[]) {
      const email = `layout-${role.toLowerCase()}-${randomBytes(4).toString('hex')}@example.test`;
      emails.set(role, email);
      const user = await db.staffUser.create({
        data: { emailNormalized: email, displayName: `Layout ${role}`, role },
      });
      await db.staffCredential.create({
        data: { staffId: user.id, passwordHash, mustChangePassword: false },
      });
      if (role === 'BRANCH_LEAD') {
        const city = await db.city.create({
          data: { code: 'UIT', name: 'Synthetic UI city' },
        });
        const branch = await db.branch.create({
          data: {
            name: 'Synthetic assigned branch',
            code: 'UIT-001',
            cityId: city.id,
          },
        });
        await db.branchLeadAssignment.create({
          data: {
            branchId: branch.id,
            leadId: user.id,
            assignedById: actor.id,
          },
        });
      }
    }
  } finally {
    await db.$disconnect();
  }
});
async function login(
  page: Page,
  context: BrowserContext,
  role: keyof typeof roleRoots,
) {
  const existing = cookies.get(role);
  if (existing) {
    await context.addCookies(existing);
    await page.goto(roleRoots[role]);
  } else {
    await page.goto('/staff/login');
    await page.getByLabel('Email address').fill(emails.get(role)!);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(roleRoots[role]);
    cookies.set(role, await context.cookies());
  }
  await expect(page.locator('.staff-dashboard')).toBeVisible();
}
for (const role of Object.keys(roleRoots) as (keyof typeof roleRoots)[])
  test(`${role}: actual role navigation, dashboard, module boundary and private identity`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, context, role);
    const navigation = page.locator('.staff-sidebar .staff-role-nav');
    await expect(navigation.getByRole('link')).toHaveCount(
      roleMenus[role].length,
    );
    for (const key of roleMenus[role])
      await expect(
        navigation.getByRole('link', { name: en.layout.nav[key], exact: true }),
      ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: en.layout.dashboards[role].title,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(`Layout ${role}`, { exact: true }),
    ).toBeVisible();
    await page.screenshot({ path: `${evidence}/${role}-desktop.png` });
    const target = roleMenus[role][1];
    await navigation
      .getByRole('link', { name: en.layout.nav[target], exact: true })
      .click();
    if (role === 'SUPER_ADMIN')
      await expect(
        page.getByRole('button', { name: en.admin.createStaff, exact: true }),
      ).toBeVisible();
    else
      await expect(
        page.getByText(en.layout.moduleUnavailable, { exact: true }),
      ).toBeVisible();
    const forbidden = role === 'HR_LEAD' ? '/staff/finance' : '/staff/hr';
    await page.goto(forbidden);
    await expect(page).toHaveURL(/staff\/access-denied$/);
  });
test('fixed viewport sidebar, independent scroll, collapse offsets, profile and RTL', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, context, 'SUPER_ADMIN');
  const sidebar = page.locator('.staff-sidebar');
  const initial = await sidebar.boundingBox();
  expect(initial?.height).toBe(900);
  expect(initial?.width).toBe(260);
  await page.evaluate(() => scrollTo(0, 500));
  expect((await sidebar.boundingBox())?.y).toBe(0);
  await page.getByRole('button', { name: 'Toggle sidebar' }).click();
  await expect(sidebar).toHaveCSS('width', '84px');
  await expect(page.locator('.staff-main-offset')).toHaveCSS(
    'margin-left',
    '84px',
  );
  await page.screenshot({ path: `${evidence}/sidebar-collapsed.png` });
  await page.getByRole('button', { name: 'Toggle sidebar' }).click();
  await page.getByRole('button', { name: 'Staff profile menu' }).click();
  await expect(
    page.getByRole('link', { name: 'My Account', exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: `${evidence}/profile-dropdown.png` });
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Staff profile menu' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Switch language' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  expect((await sidebar.boundingBox())?.x).toBe(1180);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: `${evidence}/staff-rtl.png` });
  await page.setViewportSize({ width: 1440, height: 400 });
  const nav = page.locator('.staff-sidebar .staff-role-nav');
  expect(await nav.evaluate((e) => e.scrollHeight > e.clientHeight)).toBe(true);
  await nav.evaluate((e) => (e.scrollTop = e.scrollHeight));
  expect(await nav.evaluate((e) => e.scrollTop)).toBeGreaterThan(0);
});
test('staff widths, native mobile drawer focus, Escape and navigation close', async ({
  page,
  context,
}) => {
  await login(page, context, 'SUPER_ADMIN');
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${evidence}/staff-mobile.png` });
  const toggle = page.getByRole('button', { name: 'Toggle sidebar' });
  await toggle.click();
  const dialog = page.getByRole('dialog', { name: 'Staff navigation' });
  await expect(dialog).toBeVisible();
  await page.screenshot({ path: `${evidence}/staff-mobile-drawer.png` });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(toggle).toBeFocused();
  await toggle.click();
  await dialog.getByRole('link', { name: 'Branches', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Branches', exact: true }),
  ).toBeVisible();
});
test('public templates, no login/signup, seven links, footer and mobile navigation', async ({
  page,
}) => {
  for (const route of [
    '',
    'about',
    'programs',
    'branches',
    'events',
    'get-involved',
    'contact',
  ]) {
    await page.goto('/' + route);
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(
      page
        .getByRole('banner')
        .getByRole('link', { name: /sign in|login|sign up/i }),
    ).toHaveCount(0);
    await page.setViewportSize({
      width: 1440,
      height: route === '' ? 1690 : 1120,
    });
    await page.screenshot({
      path: `${evidence}/public-${route || 'home'}.png`,
      fullPage: true,
    });
  }
  await page.goto('/');
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: `${evidence}/public-home-mobile.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Open menu' }).click();
  const dialog = page.getByRole('dialog', { name: 'Main navigation' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('nav a')).toHaveCount(7);
  await page.screenshot({ path: `${evidence}/public-mobile-menu.png` });
  await dialog.getByRole('link', { name: 'About', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL(/\/about$/);
  await page.getByRole('button', { name: 'Switch language' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto('/');
  await page.setViewportSize({ width: 390, height: 1680 });
  await page.screenshot({
    path: `${evidence}/public-home-mobile-rtl.png`,
    fullPage: true,
  });
});
