// Profile PIN gate, lockout feedback and PIN management.
import { test, expect } from '@playwright/test';
import { signIn, go, TEST_ACCOUNTS } from './helpers.mjs';

test('a PIN-protected profile opens only with its PIN', async ({ page }) => {
  await signIn(page, 'a', { profile: 'Rui', wait: false });
  const dialog = page.getByRole('dialog', { name: 'Enter the PIN for Rui' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Four-digit PIN')).toBeFocused();
  await dialog.getByLabel('Four-digit PIN').fill(TEST_ACCOUNTS.a.pins[2]);
  await dialog.getByRole('button', { name: 'Open profile' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rui’s synced data');
});

test('five wrong PINs lock the profile with a countdown', async ({ page }) => {
  await signIn(page, 'a', { profile: 'Rui', wait: false });
  const dialog = page.getByRole('dialog');
  const pin = dialog.getByLabel('Four-digit PIN');
  for (let i = 0; i < 4; i++) {
    await pin.fill('0000');
    await dialog.getByRole('button', { name: 'Open profile' }).click();
    await expect(dialog.getByText('That PIN is not right.')).toBeVisible();
  }
  await pin.fill('0000');
  await dialog.getByRole('button', { name: 'Open profile' }).click();
  await expect(dialog.getByText('Too many tries')).toBeVisible();
  await expect(dialog.getByText(/locked for 1[45]:\d\d/)).toBeVisible();
  await expect(pin).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Which profile do you want to manage?');
});

test('setting and removing a PIN reports success and failure honestly', async ({ page }) => {
  await signIn(page, 'a');
  await go(page, '/profiles');
  const kids = page.locator('.card', { hasText: 'Kids' });
  await kids.getByRole('button', { name: 'PIN' }).click();
  let dialog = page.getByRole('dialog', { name: 'PIN for Kids' });
  await dialog.getByLabel('New PIN', { exact: true }).fill('2580');
  await dialog.getByLabel('Repeat the new PIN').fill('2580');
  await dialog.getByRole('button', { name: 'Set PIN' }).click();
  await expect(kids.getByText('PIN on')).toBeVisible();

  await kids.getByRole('button', { name: 'PIN' }).click();
  dialog = page.getByRole('dialog', { name: 'PIN for Kids' });
  await dialog.getByLabel('Current PIN').fill('1111');
  await dialog.getByRole('button', { name: 'Remove PIN' }).click();
  await expect(page.getByText('The current PIN is not right.')).toBeVisible();
  await expect(kids.getByText('PIN on')).toBeVisible();
});
