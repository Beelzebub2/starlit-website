// Sign-in, profile choice, two-account isolation, revoked sessions, and that
// nothing about the session survives a reload or lands in browser storage.
import { test, expect } from '@playwright/test';
import { signIn, go, mock, remoteEdit, TEST_ACCOUNTS } from './helpers.mjs';

test('a wrong password shows an error and keeps focus on the password', async ({ page }) => {
  await page.goto('/');
  await mock(page, { latencyMs: 0 });
  await page.getByLabel('Email').fill(TEST_ACCOUNTS.a.email);
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('That email and password do not match.')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeFocused();
  await expect(page.getByLabel('Password')).toHaveValue('');
});

test('a deep link survives sign-in and the profile choice', async ({ page }) => {
  await signIn(page, 'a', { path: '/addons' });
  await expect(page).toHaveURL(/\/addons$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Addons' })).toBeVisible();
});

test('two accounts never see each other’s data', async ({ page }) => {
  await signIn(page, 'a');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ana’s synced data');
  await expect(page.locator('.ledger-num').first()).toHaveText('62');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/signin$/);

  await signIn(page, 'b');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ben’s synced data');
  await expect(page.locator('.ledger-num').first()).toHaveText('12');
  await go(page, '/addons');
  await expect(page.locator('.ext-name')).toHaveText(['Ben Catalog']);
  await expect(page.getByText('Demo Catalog')).toHaveCount(0);
  await go(page, '/profiles');
  await expect(page.locator('.card-title')).toHaveCount(1);
  await expect(page.locator('body')).not.toContainText(/Ana|Rui|Kids|ana@example/);
});

test('a session revoked elsewhere returns to sign-in with an explanation', async ({ page }) => {
  await signIn(page, 'a');
  await remoteEdit(page, 'revoke');
  await go(page, '/library');
  await expect(page).toHaveURL(/\/signin$/);
  await expect(page.getByText('You were signed out')).toBeVisible();
});

test('the session lives in memory only', async ({ page }) => {
  await signIn(page, 'a');
  const storage = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie }));
  expect(JSON.stringify(storage)).not.toMatch(/mock-access|mock-refresh|token|password/i);
  expect(Object.keys(storage.local).sort()).toEqual(['starlit.account.profile']);
  await page.reload();
  await expect(page).toHaveURL(/\/signin$/);
});

test('Portuguese is available and remembered as a preference', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Português' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Inicia sessão para gerir a tua conta');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-PT');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Iniciar sessão', exact: true })).toBeVisible();
});
