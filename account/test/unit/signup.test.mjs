import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuth, PASSWORD_MIN, PASSWORD_RECOVERY_URL } from '../../src/lib/auth.js';

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function client(reply) {
  const requests = [];
  const auth = createAuth({
    baseUrl: 'https://api.example.test', anonKey: 'anon-key',
    transport: async (url, init) => { requests.push({ url, body: init.body ? JSON.parse(init.body) : null }); return reply(url); },
  });
  return { auth, requests };
}

test('sign-up enforces the official minimum before calling the server', async () => {
  const { auth, requests } = client(() => json(200, {}));
  await assert.rejects(auth.signUp('a@example.test', 'x'.repeat(PASSWORD_MIN - 1)), e => e.code === 'weak_password');
  assert.equal(requests.length, 0);
});

test('sign-up without a session waits for email verification and keeps nobody signed in', async () => {
  const { auth, requests } = client(() => json(200, { id: 'u1', email: 'a@example.test', confirmation_sent_at: '2026-11-20T00:00:00Z' }));
  const result = await auth.signUp('a@example.test', 'a-long-enough-passphrase');
  assert.deepEqual(result, { pending: true });
  assert.equal(auth.current(), null);
  assert.equal(requests[0].url, 'https://api.example.test/auth/v1/signup');
  assert.deepEqual(requests[0].body, { email: 'a@example.test', password: 'a-long-enough-passphrase' });
});

test('sign-up that returns a session signs in straight away', async () => {
  const { auth } = client(() => json(200, { access_token: 't', refresh_token: 'r', expires_in: 900, user: { email: 'a@example.test' } }));
  const result = await auth.signUp('a@example.test', 'a-long-enough-passphrase');
  assert.equal(result.pending, false);
  assert.equal(auth.current().email, 'a@example.test');
});

test('password reset uses the API recovery page and no PKCE, like the app', async () => {
  const { auth, requests } = client(() => json(200, {}));
  assert.equal(await auth.requestPasswordReset('a@example.test'), true);
  const url = new URL(requests[0].url);
  assert.equal(url.pathname, '/auth/v1/recover');
  assert.equal(url.searchParams.get('redirect_to'), PASSWORD_RECOVERY_URL);
  assert.equal(url.searchParams.get('code_challenge'), null);
  assert.deepEqual(requests[0].body, { email: 'a@example.test' });
});
