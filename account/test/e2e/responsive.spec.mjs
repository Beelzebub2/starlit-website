// 390 / 768 / 1440 px: no sideways scrolling, a usable menu on small screens,
// and (with SCREENSHOTS=1) the documentation screenshots, all synthetic data.
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { signIn, go, remoteEdit } from './helpers.mjs';

const PAGES = ['/', '/library', '/progress', '/collections', '/collections/new', '/addons', '/plugins', '/settings', '/profiles', '/security'];
const shots = process.env.SCREENSHOTS === '1';
const dir = new URL('../../docs/screenshots/', import.meta.url);
if (shots) mkdirSync(dir, { recursive: true });
const name = (project, path) => `${project}-${path === '/' ? 'overview' : path.slice(1).replace(/\//g, '-')}.jpg`;
const file = (project, path) => new URL(name(project, path), dir).pathname.replace(/^\/([A-Z]:)/, '$1');
// Documentation captures: viewport only, no test controls or toasts in the picture.
// The committed set (docs/screenshots); the other pages are still checked for overflow.
const KEEP = {
  desktop: ['/signin', '/', '/addons', '/addons-conflict', '/collections/new', '/settings', '/security'],
  tablet: ['/library', '/collections/new'],
  mobile: ['/', '/progress', '/collections/new', '/addons-conflict'],
};
async function capture(page, project, path, fullPage = false) {
  if (!KEEP[project]?.includes(path)) return;
  await page.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); document.querySelector('.mock-panel')?.setAttribute('hidden', ''); });
  await page.screenshot({ path: file(project, path), type: 'jpeg', quality: 80, fullPage });
}

test('no page scrolls sideways', async ({ page }, info) => {
  await page.goto('/');
  if (shots) await capture(page, info.project.name, '/signin');
  await signIn(page, 'a');
  for (const path of PAGES) {
    await go(page, path);
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} overflows by ${overflow}px`).toBeLessThanOrEqual(0);
    if (shots) await capture(page, info.project.name, path);
  }
});

test('small screens use a menu dialog that returns focus', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop', 'the desktop rail is always visible');
  await signIn(page, 'a');
  const menu = page.getByRole('button', { name: 'Menu' });
  await menu.click();
  const dialog = page.getByRole('dialog', { name: 'Menu' });
  await expect(dialog.getByRole('link', { name: 'Collections' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await menu.click();
  await dialog.getByRole('link', { name: 'Collections' }).click();
  await expect(page).toHaveURL(/\?tab=collections$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('conflict screenshot for the docs', async ({ page }, info) => {
  test.skip(!shots || info.project.name === 'tablet', 'screenshots only');
  await signIn(page, 'a');
  await go(page, '/addons');
  await page.getByRole('switch').nth(3).uncheck();
  await remoteEdit(page, 'addons');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.notice-warn')).toBeVisible();
  await page.locator('.notice-warn').getByText('Compare the two versions').click();
  await page.locator('.notice-warn').scrollIntoViewIfNeeded();
  await capture(page, info.project.name, '/addons-conflict');
});
