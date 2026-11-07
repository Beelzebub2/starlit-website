// Editing flows with the keyboard, saves, and HTTP 409 handling.
import { test, expect } from '@playwright/test';
import { signIn, go, remoteEdit, stored } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await signIn(page, 'a'); });

test('addons: keyboard reorder, toggle and save', async ({ page }) => {
  await go(page, '/addons');
  await expect(page.locator('.ext-name').first()).toHaveText('Demo Catalog');
  const up = page.getByRole('button', { name: 'Move Demo Streams up' });
  await up.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.ext-name').first()).toHaveText('Demo Streams');
  await expect(page.getByRole('button', { name: 'Move Demo Streams down' })).toBeVisible();
  await expect(page.locator('.savebar-status')).toHaveText('1 unsaved change');
  await page.getByRole('switch').nth(2).check();
  await expect(page.locator('.savebar-status')).toHaveText('2 unsaved changes');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.savebar')).toBeHidden();
  const saved = await stored(page, 'ext:addons:1');
  expect(saved.map(a => a.name)).toEqual(['Demo Streams', 'Demo Catalog', 'Demo Subtitles', 'Demo Anime Catalog']);
  expect(saved[2].enabled).toBe(true);
});

test('addons: a secret-bearing address is never shown in full', async ({ page }) => {
  await go(page, '/addons');
  await expect(page.locator('main')).not.toContainText('SYNTHETIC-not-a-real-key');
  await expect(page.locator('main')).toContainText('https://streams.example.test/…/manifest.json');
});

test('addons: 409 loads the latest list, re-applies my edits, then saves', async ({ page }) => {
  await go(page, '/addons');
  await page.getByRole('switch').nth(3).uncheck();          // my edit: Demo Anime Catalog off
  await remoteEdit(page, 'addons');                          // other device: toggles the first and adds one
  await page.getByRole('button', { name: 'Save changes' }).click();
  const alert = page.locator('.notice-warn');
  await expect(alert).toContainText('Changed on another device');
  await expect(alert).toBeFocused();
  await expect(page.locator('.ext-name')).toContainText(['Added on another device']);
  await expect(page.getByRole('switch').nth(3)).not.toBeChecked();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.savebar')).toBeHidden();
  const saved = await stored(page, 'ext:addons:1');
  expect(saved.find(a => a.name === 'Demo Anime Catalog').enabled).toBe(false);
  expect(saved.find(a => a.name === 'Demo Catalog').enabled).toBe(false);   // kept from the other device
});

test('library: keyset "Load more" keeps focus in place and ends', async ({ page }) => {
  await go(page, '/library');
  await expect(page.locator('.item-row')).toHaveCount(25);
  await expect(page.getByText('Showing 25 of 62')).toBeVisible();
  await page.getByRole('button', { name: 'Load more' }).click();
  await expect(page.locator('.item-row')).toHaveCount(50);
  await expect(page.locator('.item-row').nth(25)).toBeFocused();
  await page.getByRole('button', { name: 'Load more' }).click();
  await expect(page.locator('.item-row')).toHaveCount(62);
  await expect(page.getByRole('button', { name: 'Load more' })).toBeHidden();
});

test('library: removing asks first and announces the result', async ({ page }) => {
  await go(page, '/library');
  const first = await page.locator('.item-name').first().textContent();
  await page.getByRole('button', { name: `Remove ${first} from the library` }).click();
  const dialog = page.getByRole('dialog', { name: `Remove ${first} from the library?` });
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByText('Showing 24 of 61')).toBeVisible();
  await expect(page.locator('.item-name').first()).not.toHaveText(first);
});

test('progress: change a resume point, and handle a change from another device', async ({ page }) => {
  await go(page, '/progress');
  const name = await page.locator('.item-name').first().textContent();
  await page.getByRole('button', { name: `Change the resume point for ${name}` }).click();
  let dialog = page.getByRole('dialog', { name: 'Change the resume point' });
  await dialog.getByLabel('Resume at').fill('5:00');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.item-row').first()).toContainText('5:00 of');

  await remoteEdit(page, 'progress');
  await page.getByRole('button', { name: `Change the resume point for ${name}` }).click();
  dialog = page.getByRole('dialog', { name: 'Change the resume point' });
  await dialog.getByLabel('Resume at').fill('7:30');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  dialog = page.getByRole('dialog', { name: 'Change the resume point' });
  await expect(dialog.getByText('Changed on another device')).toBeVisible();
  await expect(dialog.getByText(/It now says 6:00 of .*; you wanted 7:30 of/)).toBeVisible();
  await dialog.getByLabel('Resume at').fill('7:30');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.item-row').first()).toContainText('7:30 of');
});

test('settings: only touched values change, unknown and device keys survive', async ({ page }) => {
  await go(page, '/settings');
  await expect(page.locator('.setting', { hasText: 'download_settings.download_folder' })).toContainText('This device only');
  await expect(page.locator('.setting', { hasText: 'download_settings.download_folder' }).locator('input')).toHaveCount(0);
  const size = page.getByRole('spinbutton', { name: 'Subtitle size' });
  await size.fill('26');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.savebar')).toBeHidden();
  const saved = await stored(page, '1|profile_settings_blob|mobile');
  expect(saved.features.player_settings.subtitle_size).toBe(26);
  expect(saved.features.airing_now_experiment).toEqual({ enabled: true, rollout: 'beta' });
  expect(saved.download_settings.download_folder).toBe('/storage/emulated/0/Download/Starlit');
});

test('settings: a value changed on both devices asks which one to keep', async ({ page }) => {
  await go(page, '/settings');
  await page.getByRole('spinbutton', { name: 'Subtitle size' }).fill('26');
  await remoteEdit(page, 'settings');                         // other device sets 30
  await page.getByRole('button', { name: 'Save changes' }).click();
  const notice = page.locator('.notice-warn');
  await expect(notice).toContainText('1 setting was changed on both devices');
  await expect(notice).toContainText('features.player_settings.subtitle_size');
  await notice.getByRole('button', { name: 'Use mine' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.savebar')).toBeHidden();
  const saved = await stored(page, '1|profile_settings_blob|mobile');
  expect(saved.features.player_settings.subtitle_size).toBe(26);
  expect(saved.features.player_settings.skip_intro).toBe(false);   // the other device's other change survives
});

test('collections: build one from a preset, step by step, and save', async ({ page }) => {
  await go(page, '/collections');
  await page.getByRole('link', { name: 'New collection' }).first().click();
  await page.getByRole('radio', { name: /^Netflix/ }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Basics' })).toBeFocused();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Netflix');
  await page.getByRole('radio', { name: /^Rows/ }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Trakt', exact: true }).click();
  await page.getByLabel('Trakt list id').fill('my-slug');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Enter a numeric Trakt list id')).toBeVisible();
  await page.getByRole('button', { name: 'Save collection' }).click();
  await expect(page.getByText('Fix 1 problem before saving.')).toBeVisible();
  await page.getByRole('button', { name: 'Fix' }).click();
  await expect(page.getByLabel('Trakt list id')).toBeFocused();
  await expect(page.getByLabel('Trakt list id')).toHaveValue('my-slug');
  await page.getByLabel('Trakt list id').fill('777');
  await page.locator('.steps').getByRole('button', { name: /Review/ }).click();
  await expect(page.getByText('Ready to save').first()).toBeVisible();
  await page.getByRole('button', { name: 'Save collection' }).click();
  await expect(page).toHaveURL(/\/collections$/);
  await expect(page.locator('.coll-title').last()).toContainText('Netflix');
  const saved = await stored(page, '1|collections|collections');
  const netflix = saved.at(-1);
  expect(netflix.viewMode).toBe('ROWS');
  expect(netflix.folders[0].sources.map(s => s.provider)).toEqual(['tmdb', 'trakt']);
  expect(netflix.folders[0].sources[1].traktListId).toBe(777);
  expect(saved[0].folders[1].focusGifEnabled).toBe(true);   // unknown field on another collection preserved
});

test('collections: an invalid import is explained and nothing changes', async ({ page }) => {
  await go(page, '/collections');
  await page.getByRole('button', { name: 'Import JSON' }).click();
  const dialog = page.getByRole('dialog', { name: 'Import collections' });
  await dialog.getByLabel('Or paste JSON').fill('[{"id":"x","title":"","folders":[{"id":"f","title":"F","sources":[{"provider":"tmdb"}]}]}]');
  await dialog.getByRole('button', { name: 'Check and import' }).click();
  const problems = page.getByRole('dialog', { name: 'This JSON has problems' });
  await expect(problems).toContainText('Give it a title');
  await expect(problems).toContainText('Choose what kind of TMDB source this is');
  await problems.getByRole('button', { name: 'Close' }).last().click();
  await expect(page.locator('.coll-row')).toHaveCount(2);
  await expect(page.locator('.savebar')).toBeHidden();
});

test('profiles: add a profile, then delete it with typed confirmation', async ({ page }) => {
  await go(page, '/profiles');
  await page.getByRole('button', { name: 'Add profile' }).click();
  const dialog = page.getByRole('dialog', { name: 'New profile' });
  await dialog.getByLabel('Name').fill('Guest');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  const card = page.locator('.card', { hasText: 'Guest' });
  await expect(card).toContainText('Profile 4');
  await card.getByRole('button', { name: 'Delete' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete Guest?' });
  await expect(confirm.getByRole('button', { name: 'Delete profile' })).toBeDisabled();
  await confirm.getByLabel('Type “Guest” to confirm').fill('Guest');
  await confirm.getByRole('button', { name: 'Delete profile' }).click();
  await expect(page.locator('.card', { hasText: 'Guest' })).toHaveCount(0);
});

test('media servers: metadata only, with address validation', async ({ page }) => {
  await go(page, '/servers');
  await page.getByRole('button', { name: 'Add server' }).click();
  let dialog = page.getByRole('dialog', { name: 'Add a media server' });
  await expect(dialog).toContainText('Signing in to the server from the web is not available yet.');
  await dialog.getByLabel('Name').fill('Den');
  await dialog.getByLabel('Address').fill('https://user:pass@den.example.test');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  dialog = page.getByRole('dialog', { name: 'Add a media server' });
  await expect(dialog).toContainText('without a user name, password or query');
  await dialog.getByLabel('Address').fill('https://den.example.test:8096');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.card', { hasText: 'Den' })).toContainText('https://den.example.test:8096');
});

test('sessions: sign out the others, then everywhere', async ({ page }) => {
  await go(page, '/security');
  await expect(page.getByText('This browser', { exact: true })).toBeVisible();
  await expect(page.locator('main')).not.toContainText(/Revoke|Sign out this device/);
  await page.getByRole('button', { name: /Sign out 2 other sessions/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sign out others' }).click();
  await expect(page.getByRole('button', { name: /Sign out 0 other sessions/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Sign out everywhere' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sign out everywhere' }).click();
  await expect(page).toHaveURL(/\/signin$/);
});

test('leaving with unsaved edits asks first', async ({ page }) => {
  await go(page, '/addons');
  await page.getByRole('switch').first().uncheck();
  await page.getByRole('link', { name: 'Library' }).click();
  const dialog = page.getByRole('dialog', { name: 'Leave without saving?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(page).toHaveURL(/\/addons$/);
  await expect(page.getByRole('switch').first()).not.toBeChecked();
});
