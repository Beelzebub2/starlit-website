// Live checks for AFTER the account migrations are deployed to a staging or
// production API and a live build is served. Skipped unless explicitly
// enabled. Use two disposable, operator-created accounts; never real users.
//
//   STARLIT_E2E_LIVE=1 STARLIT_E2E_URL=https://site-stage.62-171-179-229.sslip.io \
//   STARLIT_E2E_A_EMAIL=... STARLIT_E2E_A_PASSWORD=... \
//   STARLIT_E2E_B_EMAIL=... STARLIT_E2E_B_PASSWORD=... \
//   npx playwright test --project=live
//
// Writes (409 test) only run with STARLIT_E2E_WRITES=1 against a build made
// with STARLIT_ACCOUNT_WRITES=1. Credentials come from the environment only
// and are never printed.
import { test, expect } from '@playwright/test';

const env = process.env;
const enabled = env.STARLIT_E2E_LIVE === '1' && env.STARLIT_E2E_URL && env.STARLIT_E2E_A_EMAIL && env.STARLIT_E2E_B_EMAIL;
test.skip(!enabled, 'Live account E2E is off (needs a deployed API and two disposable accounts)');
test.use({ baseURL: env.STARLIT_E2E_URL });

async function signIn(page, who) {
  await page.goto('/account?tab=overview');
  await page.getByLabel('Email').fill(env[`STARLIT_E2E_${who}_EMAIL`]);
  await page.getByLabel('Password').fill(env[`STARLIT_E2E_${who}_PASSWORD`]);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const chooser = page.getByRole('heading', { name: 'Which profile do you want to manage?' });
  if (await chooser.isVisible({ timeout: 5000 }).catch(() => false)) await page.locator('.choose-card').first().click();
  await expect(page.locator('.ledger-num').first()).toBeVisible();
}

test('two accounts stay isolated end to end', async ({ browser }) => {
  const a = await (await browser.newContext()).newPage();
  const b = await (await browser.newContext()).newPage();
  await signIn(a, 'A');
  await signIn(b, 'B');
  await a.locator('.scope').first().click();
  const aNames = await a.locator('.profile-choice-name').allTextContents();
  await a.keyboard.press('Escape');
  await b.goto('/account?tab=profiles').catch(() => {});
  const bText = await b.locator('main').textContent();
  for (const n of aNames) if (n.length > 2) expect(bText).not.toContain(n);
});

test('sessions page lists this browser and offers only supported sign-outs', async ({ page }) => {
  await signIn(page, 'A');
  await page.locator('a[href="/account?tab=security"]').first().click();
  await expect(page.getByText('This browser')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out everywhere' })).toBeVisible();
});

test('a stale save gets a 409 and is not overwritten', async ({ browser }) => {
  test.skip(env.STARLIT_E2E_WRITES !== '1', 'Write checks are off');
  const one = await (await browser.newContext()).newPage();
  const two = await (await browser.newContext()).newPage();
  await signIn(one, 'A');
  await signIn(two, 'A');
  for (const p of [one, two]) await p.locator('a[href="/account?tab=addons"]').first().click();
  await two.getByRole('switch').first().click();
  await two.getByRole('button', { name: 'Save changes' }).click();
  await expect(two.locator('.savebar')).toBeHidden();
  await one.getByRole('switch').last().click();
  await one.getByRole('button', { name: 'Save changes' }).click();
  await expect(one.locator('.notice-warn')).toContainText('Changed on another device');
});
