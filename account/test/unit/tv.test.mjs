import test from 'node:test';
import assert from 'node:assert/strict';
import { createTvApi, validTvDiscovery, normalizeTvCode } from '../../src/lib/tv.js';
import { captureTvIntent, clearTvIntent, pendingTvIntent, rememberTvIntent } from '../../src/lib/tv-intent.js';
import { accountUrl, readAccountUrl } from '../../src/lib/routes.js';

const baseUrl = 'https://api.example.test';
const discovery = () => ({ capabilities: { tv_login: true }, device_authorization: Object.fromEntries([['version', 1], ...['start', 'poll', 'request', 'approve', 'deny', 'devices', 'revoke'].map(name => [name + '_endpoint', baseUrl + '/tv/v1/' + name])]) });
const storage = () => { const values = new Map(); return { values, getItem: k => values.get(k), setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k) }; };

test('TV discovery cannot send account credentials to another origin, path, or redirect', async () => {
  assert.equal(validTvDiscovery(discovery(), baseUrl), true);
  for (const endpoint of ['https://evil.example/tv/v1/approve', baseUrl + '/auth/v1/user', baseUrl + '/tv/v1/approve?x=1', 'https://user@api.example.test/tv/v1/approve']) {
    const data = discovery(); data.device_authorization.approve_endpoint = endpoint;
    assert.equal(validTvDiscovery(data, baseUrl), false);
  }
  const calls = [];
  const api = createTvApi({ baseUrl, enabled: true, anonKey: 'anon', getAccessToken: () => 'synthetic-access', transport: async (url, init) => { calls.push({ url, init }); return Response.json(discovery()); } });
  assert.equal(await api.available(), true);
  assert.equal(calls[0].init.headers.Authorization, undefined);
  await api.decide('approve', { user_code: 'ABCD-EFGH', approval_token: 'synthetic-approval' });
  const { url, init } = calls[1];
  assert.equal(url, baseUrl + '/tv/v1/approve');
  assert.equal(init.redirect, 'error');
  assert.equal(init.credentials, 'omit');
  assert.equal(init.referrerPolicy, 'no-referrer');
  assert.deepEqual(JSON.parse(init.body), { user_code: 'ABCD-EFGH', approval_token: 'synthetic-approval', confirm: true });
  assert.equal(init.headers.Authorization, 'Bearer synthetic-access');
});

test('rollout disabled makes no calls; revocation does not depend on new-login discovery', async () => {
  let calls = 0;
  const options = { baseUrl, anonKey: 'anon', getAccessToken: () => 'synthetic-access', transport: async () => { calls++; return Response.json({ status: 'revoked' }); } };
  const off = createTvApi({ ...options, enabled: false });
  assert.equal(await off.available(), false);
  await assert.rejects(off.revoke('id'), e => e.kind === 'missing');
  assert.equal(calls, 0);
  const on = createTvApi({ ...options, enabled: true });
  assert.deepEqual(await on.revoke('id'), { status: 'revoked' });
  assert.equal(calls, 1);
  const data = discovery(); data.capabilities.tv_login = false;
  assert.equal(validTvDiscovery(data, baseUrl), false);
});

test('TV codes survive an auth redirect without carrying secrets or accepting injected endpoints', () => {
  const store = storage(); clearTvIntent(store);
  let scrubbed;
  captureTvIntent(new URL('https://site.example/account/tv#code=abcd-efgh&endpoint=https://evil.example&access_token=secret'), { replaceState: (_a, _b, path) => { scrubbed = path; } }, store);
  assert.equal(scrubbed, '/account/tv');
  assert.deepEqual(pendingTvIntent(store), { code: 'ABCD-EFGH' });
  assert.ok(!JSON.stringify([...store.values]).match(/endpoint|secret|access_token/));
  assert.equal(accountUrl('/tv', '/account/'), '/account/tv');
  assert.equal(readAccountUrl('/account/tv?server=https://evil.example', '/account/').canonical, '/account/tv');
  clearTvIntent(store);
  rememberTvIntent('ABCD-EFGH', store, 1_000);
  assert.equal(pendingTvIntent(store, 601_001), null);
  assert.equal(store.values.size, 0);
  assert.equal(normalizeTvCode(' abcd efgh '), 'ABCD-EFGH');
  assert.equal(normalizeTvCode('<script>'), null);
});

test('expired, replay, and missing TV requests retain service error codes', async () => {
  for (const [status, code] of [[400, 'expired_token'], [409, 'invalid_state'], [404, 'not_found']]) {
    const api = createTvApi({ baseUrl, enabled: true, getAccessToken: () => 'synthetic-access', transport: async () => Response.json({ error: code }, { status }) });
    await assert.rejects(api.request('ABCD-EFGH'), e => e.code === code);
  }
});
