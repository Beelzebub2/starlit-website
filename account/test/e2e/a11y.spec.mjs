// Automated accessibility checks (axe-core, WCAG 2.2 A/AA rules) on every
// page and on the main dialogs, at desktop, tablet and phone widths.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { signIn, go } from './helpers.mjs';

async function check(page, label) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).exclude('.mock-panel').exclude('.toast').analyze();   // the toast is an aria-hidden echo of the live region
  const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact));
  expect(serious.map(v => `${label}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target}`)).toEqual([]);
}

test('sign-in page', async ({ page }) => {
  await page.goto('/');
  await check(page, 'signin');
});

test('every signed-in page', async ({ page }) => {
  await signIn(page, 'a', { wait: false, profile: null });
  await check(page, 'choose-profile');
  await page.getByRole('button', { name: /^Ana\b/ }).click();
  for (const path of ['/', '/library', '/progress', '/history', '/collections', '/collections/new', '/addons', '/plugins', '/settings', '/servers', '/profiles', '/security']) {
    await go(page, path);
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    await check(page, path);
  }
});

test('dialogs: profile switch, PIN gate and confirmation', async ({ page }) => {
  await signIn(page, 'a');
  await page.getByRole('button', { name: /Managing\s+Ana\s+Switch profile/ }).locator('visible=true').first().click();
  await expect(page.getByRole('dialog', { name: 'Switch profile' })).toBeVisible();
  await check(page, 'switch-profile');
  await page.getByRole('dialog').getByRole('button', { name: /^Rui\b/ }).click();
  await expect(page.getByRole('dialog', { name: 'Enter the PIN for Rui' })).toBeVisible();
  await check(page, 'pin-gate');
  await page.keyboard.press('Escape');
  await go(page, '/library');
  await page.locator('.item-actions button').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await check(page, 'confirm');
});
