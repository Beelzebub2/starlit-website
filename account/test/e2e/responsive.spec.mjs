// 390 / 768 / 1440 px: no sideways scrolling, a usable menu on small screens,
// and (with SCREENSHOTS=1) the documentation screenshots, all synthetic data.
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { signIn, go, remoteEdit } from './helpers.mjs';

const PAGES = ['/', '/library', '/progress', '/collections', '/collections/new', '/addons', '/plugins', '/settings', '/profiles', '/security'];
const shots = process.env.SCREENSHOTS === '1';
const dir = new URL('../../docs/screenshots/', import.meta.url);
if (shots) mkdirSync(dir, { recursive: true });
const name = (project, path) => `${project}-${path === '/' ? 'overview' : path.slice(1).replace(/\//g, '-')}.jpg`;
// fileURLToPath decodes the URL, so folders with spaces ("AI Stuff") resolve correctly.
const file = (project, path) => fileURLToPath(new URL(name(project, path), dir));
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

test('sign-in card stays centred and readable across screen sizes', async ({ page }, info) => {
  await page.goto('/?tab=signin');
  const card = page.locator('.signin-card');
  await expect(card).toBeVisible();
  await expect(page.locator('.signin-mark')).toBeVisible();
  await expect(page.locator('.signin-banners .banners')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Sign in' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  const box = await card.boundingBox();
  const width = page.viewportSize().width;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(width);
  // Centred: equal space either side, within a pixel or two.
  expect(Math.abs(box.x - (width - box.x - box.width))).toBeLessThanOrEqual(2);
  if (info.project.name === 'desktop') expect(box.width).toBeLessThanOrEqual(480);
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
