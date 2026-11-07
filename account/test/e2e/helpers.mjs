import { expect } from '@playwright/test';
import { TEST_ACCOUNTS } from '../../src/mock/fixtures.js';

export { TEST_ACCOUNTS };

/** Set mock API switches in the page (latency, failures, offline). */
export async function mock(page, patch) {
  await page.evaluate(async p => { const m = await import('/mock/transport.js'); Object.assign(m.scenario, p); }, patch);
}

/** Make "another device" change something for the signed-in account. */
export async function remoteEdit(page, what, profileId = 1) {
  return page.evaluate(async ([w, pid]) => {
    const m = await import('/mock/transport.js');
    const { state } = await import('/lib/state.js');
    return m.backend.remoteEdit(state.user.email, w, pid);
  }, [what, profileId]);
}

/** What the mock server has stored for the signed-in account (record key → payload). */
export async function stored(page, key) {
  return page.evaluate(async k => {
    const m = await import('/mock/transport.js');
    const { state } = await import('/lib/state.js');
    const account = [...m.backend.accounts.values()].find(a => a.email === state.user.email);
    if (k.startsWith('ext:')) { const [, kind, pid] = k.split(':'); return account.ext[kind].get(Number(pid)); }
    return account.records.get(k)?.payload ?? null;
  }, key);
}

export async function signIn(page, which = 'a', { path = '/', profile = which === 'a' ? 'Ana' : null, latency = 0, wait = true } = {}) {
  await page.goto(path);
  await mock(page, { latencyMs: latency });
  await page.getByLabel('Email').fill(TEST_ACCOUNTS[which].email);
  await page.getByLabel('Password').fill(TEST_ACCOUNTS[which].password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  if (profile) {
    await expect(page.getByRole('heading', { level: 1, name: 'Which profile do you want to manage?' })).toBeVisible();
    await page.getByRole('button', { name: new RegExp(`^${profile}\\b`) }).click();
  }
  if (wait) await expect(page.locator('h1.page-title')).not.toHaveText(/Sign in|Which profile/);
}

/** Navigate inside the app without a reload (a reload signs you out by design). */
export async function go(page, path) {
  await page.evaluate(p => { const a = Object.assign(document.createElement('a'), { href: p }); a.dataset.link = ''; document.body.append(a); a.click(); a.remove(); }, path);
  // A revoked session redirects to sign-in instead.
  await page.waitForURL(u => u.pathname === path.split('?')[0] || u.pathname === '/signin');
}
