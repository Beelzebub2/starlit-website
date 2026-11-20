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
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  // Negative passkey assertions must not produce a user session or navigate
  // to the account dashboard.
  await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
  await expect(page.getByText(/Passkey sign-in could not be completed|This browser cannot use Starlit passkeys/)).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
});

test('create an account: password rules, then a verification email', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Create your account' })).toBeVisible();
  await expect(page.getByText('At least 12 characters.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Forgot password?' })).toBeHidden();
  await page.getByLabel('Email', { exact: true }).fill('new-person@example.test');
  await page.getByLabel('Password', { exact: true }).fill('short');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByText('Use at least 12 characters.')).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toBeFocused();
  await page.getByLabel('Password', { exact: true }).fill('a-long-enough-passphrase');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  // No session until the email is verified: back on Sign in, email kept.
  await expect(page.getByText('Check your email')).toBeVisible();
  await expect(page.getByText(/We sent a link to new-person@example\.test/)).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Sign in' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('new-person@example.test');
  await expect(page).toHaveURL(/\?tab=signin$/);
});

test('forgot password sends a reset link without revealing whether the account exists', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Email', { exact: true }).fill('someone@example.test');
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Password reset' })).toBeVisible();
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('someone@example.test');
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByText(/If an account exists for someone@example\.test/)).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeVisible();
});

test('the password can be shown and hidden', async ({ page }) => {
  await page.goto('/');
  const password = page.getByLabel('Password', { exact: true });
  await password.fill('secret-value');
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Hide password' }).click();
  await expect(password).toHaveAttribute('type', 'password');
});
