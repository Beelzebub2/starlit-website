// Loading, empty, error, offline and reduced-motion states.
import { test, expect } from '@playwright/test';
import { signIn, go, mock } from './helpers.mjs';

test('loading shows a skeleton at final size, announced as loading', async ({ page }) => {
  await signIn(page, 'a');
  await mock(page, { latencyMs: 1500 });
  await go(page, '/library');
  const status = page.getByRole('status').filter({ hasText: 'Loading…' });
  await expect(status).toBeAttached();
  await expect(page.locator('.skeleton-item .skeleton-line').first()).toHaveCSS('height', '76px');
  await expect(page.locator('.item-row').first()).toBeVisible({ timeout: 5000 });
});

for (const [fail, title] of [['500', 'Something went wrong on the server'], ['404', 'Not available yet'], ['403', 'Not allowed'], ['offline', 'No connection']]) {
  test(`a ${fail} failure shows "${title}" and Try again recovers`, async ({ page }) => {
    await signIn(page, 'a');
    await mock(page, { failNext: fail });
    await go(page, '/collections');
    const alert = page.getByRole('alert');
    await expect(alert).toContainText(title);
    await alert.getByRole('button', { name: 'Try again' }).click();
    await expect(page.locator('.coll-row')).toHaveCount(2);
  });
}

test('a 401 on any request returns to sign-in', async ({ page }) => {
  await signIn(page, 'a');
  await mock(page, { failNext: '401' });
  await go(page, '/history');
  await expect(page).toHaveURL(/\/signin$/);
  await expect(page.getByText('You were signed out')).toBeVisible();
});

test('offline: banner, and saving is blocked without losing staged edits', async ({ page }) => {
  await signIn(page, 'a');
  await go(page, '/addons');
  await page.getByRole('switch').first().uncheck();
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.getByText('Changes cannot be saved until the connection is back.')).toBeVisible();
  await expect(page.locator('.savebar-status')).toHaveText('You are offline');
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.getByText('Changes cannot be saved until the connection is back.')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  await expect(page.getByRole('switch').first()).not.toBeChecked();
});

test('empty states explain what to do', async ({ page }) => {
  await signIn(page, 'a', { profile: 'Kids' });
  await go(page, '/progress');
  await expect(page.getByRole('heading', { name: 'Nothing to continue' })).toBeVisible();
  await go(page, '/collections');
  await expect(page.getByRole('heading', { name: 'No collections yet' })).toBeVisible();
  await go(page, '/settings');
  await expect(page.getByRole('heading', { name: 'Nothing synced here yet' })).toBeVisible();
  await go(page, '/addons');
  await expect(page.getByText('This profile uses the primary profile’s addons')).toBeVisible();
});

test('reduced motion turns off the skeleton shimmer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await signIn(page, 'a');
  await mock(page, { latencyMs: 1500 });
  await go(page, '/history');
  await expect(page.locator('.skeleton-line').first()).toHaveCSS('animation-name', 'none');
});
