import { test, expect } from '@playwright/test';

test('Google and passkey methods appear in an explicitly enabled live-like sign-in screen', async ({ page }) => {
  // Mock mode never enables external sign-ins by itself. Override only the
  // generated public feature flags for this browser presentation check.
  await page.route('**/config.js', async route => {
    const response = await route.fetch();
    const source = await response.text();
    expect(source).toContain('"googleSignIn": false');
    expect(source).toContain('"passkeySignIn": false');
    await route.fulfill({
      response,
      body: source.replace('"googleSignIn": false', '"googleSignIn": true')
        .replace('"passkeySignIn": false', '"passkeySignIn": true'),
    });
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Sign in with a passkey' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sign in to manage your account' })).toBeVisible();
  // Negative passkey assertions must not produce a user session or navigate
  // to the account dashboard.
  await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
  await expect(page.getByText(/Passkey sign-in could not be completed|This browser cannot use Starlit passkeys/)).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
});
