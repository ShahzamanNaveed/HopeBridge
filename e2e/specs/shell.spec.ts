import en from '../../apps/frontend/src/i18n/en/translation.json' with { type: 'json' };
import ur from '../../apps/frontend/src/i18n/ur/translation.json' with { type: 'json' };
import { test, expect } from '@playwright/test';
test('public routes and Urdu RTL switch', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: en.layout.heroTitle.replace(/\s+/g, ' '),
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole('banner')
    .getByRole('link', { name: 'About', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'About', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: en.auth.switchLanguage }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ur');
  await expect(
    page.getByRole('heading', { level: 1, name: ur.pages.about }),
  ).toBeVisible();
  await page.getByRole('button', { name: ur.auth.switchLanguage }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});
test('portal is honestly labelled and unknown pages recover', async ({
  page,
}) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/staff\/session-expired$/);
  await page.goto('/unknown');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Page not found' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Return home' }).click();
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: en.layout.heroTitle.replace(/\s+/g, ' '),
      exact: true,
    }),
  ).toBeVisible();
});

test('all public pages render and mobile RTL fits the viewport', async ({
  page,
}) => {
  for (const [route, title] of Object.entries(en.pages)) {
    await page.goto(route === 'home' ? '/' : '/' + route);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name:
          route === 'home' ? en.layout.heroTitle.replace(/\s+/g, ' ') : title,
        exact: true,
      }),
    ).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: en.auth.switchLanguage }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/mobile-urdu.png',
    fullPage: true,
  });
});
