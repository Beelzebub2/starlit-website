import { test, expect } from '@playwright/test';
import { signIn, go, stored } from './helpers.mjs';

test('plugins are organized with a count, refresh, delete-all and add controls', async ({ page }) => {
  await signIn(page, 'a');
  await go(page, '/plugins');
  await expect(page).toHaveURL(/\?tab=plugins$/);
  const count = await page.locator('.ext-row').count();
  await expect(page.locator('.ext-count-number')).toHaveText(String(count));
  await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove all' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add plugin' })).toBeVisible();

  await page.getByRole('button', { name: 'Add plugin' }).click();
  await expect(page.locator('.add-form')).toBeVisible();
  await page.locator('.add-form input[type="url"]').fill('https://plugins.example.test/shortkey');
  await page.locator('.add-form input[type="text"]').fill('Starlit test plugin');
  await page.getByRole('button', { name: 'Add to list' }).click();
  await expect(page.locator('.ext-count-number')).toHaveText(String(count + 1));
  await expect(page.locator('.ext-name').last()).toHaveText(/Starlit test plugin/);
  await expect(page.locator('.ext-url').last()).not.toContainText('shortkey');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.ext-count-number')).toHaveText(String(count + 1));
  const saved = await stored(page, 'ext:plugins:1');
  expect(saved).toHaveLength(count + 1);
});

test('remove-all is typed-confirmed and staged, not executed on first click', async ({ page }) => {
  await signIn(page, 'a');
  await go(page, '/plugins');
  const count = await page.locator('.ext-row').count();
  expect(count).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Remove all' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Remove all plugins?' });
  await expect(dialog).toBeVisible();
  const confirm = dialog.getByRole('button', { name: 'Remove all' });
  await expect(confirm).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.locator('.ext-row')).toHaveCount(count);

  await page.getByRole('button', { name: 'Remove all' }).first().click();
  await dialog.getByRole('textbox').fill('REMOVE');
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.locator('.ext-count-number')).toHaveText('0');
  await expect(page.locator('.savebar')).toBeVisible();
  expect(await stored(page, 'ext:plugins:1')).toHaveLength(count);
  await page.getByRole('button', { name: 'Save changes' }).click();
  expect(await stored(page, 'ext:plugins:1')).toHaveLength(0);
});

test('refresh warns about unsaved addon changes instead of silently losing them', async ({ page }) => {
  await signIn(page, 'a');
  await go(page, '/addons');
  const toggle = page.getByRole('switch').first();
  const wasChecked = await toggle.isChecked();
  await toggle.click();
  await page.getByRole('button', { name: 'Refresh' }).click();
  const dialog = page.getByRole('dialog', { name: 'Discard your edits and refresh?' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeChecked({ checked: !wasChecked });
  await page.getByRole('button', { name: 'Refresh' }).click();
  await dialog.getByRole('button', { name: 'Discard' }).click();
  await expect(page.getByRole('switch').first()).toBeChecked({ checked: wasChecked });
});
