import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mock, go, TEST_ACCOUNTS } from './helpers.mjs';

async function openTv(page, code = 'ABCD-EFGH') {
  await page.goto('/tv#code=' + code + '&endpoint=https://untrusted.example');
  await expect(page).toHaveURL(/\?tab=signin$/);
  await mock(page, { latencyMs: 0 });
  await page.getByLabel('Email').fill(TEST_ACCOUNTS.a.email);
  await page.getByLabel('Password').fill(TEST_ACCOUNTS.a.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/tv$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sign in on your TV');
  await expect(page.getByLabel('TV code', { exact: true })).toHaveValue(code);
}

test('QR requires explicit account consent, then TV can be revoked even when new linking is off', async ({ page }) => {
  await openTv(page);
  await expect(page.getByRole('button', { name: 'Allow TV sign-in' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Review TV request' }).click();
  await expect(page.getByText('Living room TV', { exact: true })).toBeVisible();
  await expect(page.getByText('ABCD-EFGH', { exact: true })).toBeVisible();
  await expect(page.locator('.facts')).toContainText(TEST_ACCOUNTS.a.email);
  await expect(page.locator('body')).not.toContainText('TV sign-in approved');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: 'docs/screenshots/desktop-tv-approval.jpg', fullPage: true });
  const stored = await page.evaluate(() => JSON.stringify({ ...sessionStorage, ...localStorage }));
  expect(stored).not.toMatch(/approval_token|mock-access|mock-refresh|untrusted/);
  await page.getByRole('button', { name: 'Allow TV sign-in' }).click();
  await expect(page.getByText('TV sign-in approved', { exact: true })).toBeVisible();
  await mock(page, { tvLoginEnabled: false });
  await page.getByRole('link', { name: 'Manage signed-in TVs' }).click();
  await page.getByRole('button', { name: 'Sign out TV', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Living room TV');
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await page.getByRole('dialog').getByRole('button', { name: 'Sign out TV', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Authorized TVs', exact: true })).toContainText('TV signed out');
  await go(page, '/tv');
  await expect(page.getByText('TV sign-in is not available', { exact: true })).toBeVisible();
});

test('expired codes, denial and replay have clear recovery', async ({ page }) => {
  await openTv(page, 'EXPR-1234');
  await page.getByRole('button', { name: 'Review TV request' }).click();
  await expect(page.getByText('This code expired', { exact: true })).toBeVisible();
  await page.getByLabel('TV code', { exact: true }).fill('DENY-1234');
  await page.getByRole('button', { name: 'Review TV request' }).click();
  await page.getByRole('button', { name: 'Deny request' }).click();
  await expect(page.getByText('Request denied', { exact: true })).toBeVisible();
  await go(page, '/security');
  await go(page, '/tv');
  await page.getByLabel('TV code', { exact: true }).fill('DENY-1234');
  await page.getByRole('button', { name: 'Review TV request' }).click();
  await expect(page.getByText('This request was already completed', { exact: true })).toBeVisible();
});

test('mobile code survives reload, network failure never grants consent, Portuguese fits', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTv(page);
  await page.reload();
  await mock(page, { latencyMs: 0 });
  await page.getByLabel('Email').fill(TEST_ACCOUNTS.a.email);
  await page.getByLabel('Password').fill(TEST_ACCOUNTS.a.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByLabel('TV code', { exact: true })).toHaveValue('ABCD-EFGH');
  await mock(page, { failNext: 'offline' });
  await page.getByRole('button', { name: 'Review TV request' }).click();
  await expect(page.getByText('Cannot connect to the TV service', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Review TV request' }).click();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Português' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Rever pedido da TV' }).click();
  await expect(page.getByRole('button', { name: 'Autorizar início de sessão na TV' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: 'docs/screenshots/mobile-tv-approval-pt.jpg', fullPage: true });
});

test('Google callback restores only the TV intent and still requires a separate approval', async ({ page }) => {
  await page.route('**/config.js', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('"googleSignIn": false', '"googleSignIn": true') });
  });
  await page.route('**/transport.js', route => route.fulfill({ contentType: 'text/javascript', body: 'export const transport = (url, init) => fetch(url, init); export const mountMockPanel = null;' }));
  const user = { id: 'synthetic-account', email: 'viewer@example.test' };
  await page.route('**/auth/v1/authorize?**', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Synthetic identity provider</title>' }));
  await page.route('**/auth/v1/token?**', route => {
    const body = route.request().postDataJSON();
    expect(body.auth_code).toBe('synthetic-one-time-code');
    expect(body.code_verifier.length).toBe(64);
    return route.fulfill({ json: { access_token: 'synthetic-access', refresh_token: 'synthetic-refresh', expires_in: 900, user } });
  });
  await page.route('**/auth/v1/user', route => route.fulfill({ json: user }));
  await page.route('**/rest/v1/rpc/account_profiles', route => route.fulfill({ json: [] }));
  await page.route('**/.well-known/nuvio', route => route.fulfill({ json: {
    capabilities: { tv_login: true }, device_authorization: Object.fromEntries([['version', 1], ...['start', 'poll', 'request', 'approve', 'deny', 'devices', 'revoke'].map(name => [name + '_endpoint', 'https://mock.invalid/tv/v1/' + name])]),
  } }));
  let decisions = 0;
  await page.route('**/tv/v1/approve', route => { decisions++; return route.fulfill({ json: { status: 'approved' } }); });
  await page.goto('/tv#code=ABCD-EFGH');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page).toHaveURL(/\/auth\/v1\/authorize\?/);
  expect(page.url()).not.toMatch(/ABCD|EFGH|access_token|refresh_token/);
  await page.goto('/?tab=auth-callback&code=synthetic-one-time-code');
  await expect(page).toHaveURL(/\/tv$/);
  await expect(page.getByLabel('TV code', { exact: true })).toHaveValue('ABCD-EFGH');
  expect(decisions).toBe(0);
  expect(await page.evaluate(() => JSON.stringify({ ...sessionStorage, ...localStorage }))).not.toMatch(/synthetic-access|synthetic-refresh|synthetic-one-time-code/);
});
