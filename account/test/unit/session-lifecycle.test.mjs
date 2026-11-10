import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuth } from '../../src/lib/auth.js';
import { createApi } from '../../src/lib/api.js';

const response = (access, refresh = 'refresh-one') => Response.json({
  access_token: access, refresh_token: refresh, expires_in: 900,
  user: { email: 'synthetic@example.invalid' },
});

const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

test('a delayed refresh cannot restore a session after sign-out', async () => {
  const gate = deferred();
  const transport = (url) => {
    if (url.includes('grant_type=password')) return response('access-one');
    if (url.includes('grant_type=refresh_token')) return gate.promise;
    if (url.includes('/logout')) return Response.json({});
    throw Error('Unexpected auth route');
  };
  const auth = createAuth({ baseUrl: 'https://api.example.invalid', anonKey: 'public', transport });
  await auth.signInWithPassword('synthetic@example.invalid', 'synthetic');
  const pending = auth.refresh();
  await auth.signOut('local');
  gate.resolve(response('access-should-not-return', 'refresh-two'));
  await assert.rejects(pending, error => error.kind === 'auth');
  assert.equal(auth.current(), null);
  assert.equal(auth.getAccessToken(), null);
});

test('parallel refresh callers make only one rotating-token request', async () => {
  const gate = deferred();
  let requests = 0;
  const transport = url => {
    if (url.includes('grant_type=password')) return response('access-one');
    if (url.includes('grant_type=refresh_token')) { requests++; return gate.promise; }
    throw Error('Unexpected auth route');
  };
  const auth = createAuth({ baseUrl: 'https://api.example.invalid', anonKey: 'public', transport });
  await auth.signInWithPassword('synthetic@example.invalid', 'synthetic');
  const first = auth.refresh();
  const second = auth.refresh();
  assert.equal(requests, 1);
  gate.resolve(response('access-two', 'refresh-two'));
  await Promise.all([first, second]);
  assert.equal(auth.getAccessToken(), 'access-two');
});

test('an expired token refreshes once before any account RPC', async () => {
  let time = 0;
  let refreshes = 0;
  const seenTokens = [];
  const transport = (url, init) => {
    if (url.includes('grant_type=password')) return Response.json({
      access_token: 'old-token', refresh_token: 'refresh-one', expires_in: 1,
      user: { email: 'synthetic@example.invalid' },
    });
    if (url.includes('grant_type=refresh_token')) { refreshes++; return response('new-token'); }
    if (url.includes('/rest/v1/rpc/')) {
      seenTokens.push(init.headers.Authorization);
      return Response.json([{ profile_index: 1 }]);
    }
    throw Error('Unexpected route');
  };
  const auth = createAuth({ baseUrl: 'https://api.example.invalid', anonKey: 'public', transport, now: () => time });
  await auth.signInWithPassword('synthetic@example.invalid', 'synthetic');
  time = 2_000;
  const api = createApi({
    baseUrl: 'https://api.example.invalid', anonKey: 'public', transport,
    getAccessToken: () => auth.ensureAccessToken(),
  });
  const profiles = await Promise.all([api.profiles(), api.profiles()]);
  assert.equal(profiles.length, 2);
  assert.deepEqual(seenTokens, ['Bearer new-token', 'Bearer new-token']);
  assert.equal(refreshes, 1);
});

test('a 401 from a prior account cannot revoke a newly signed-in session', async () => {
  const gate = deferred();
  const transport = (url, init) => {
    if (url.includes('grant_type=password')) {
      const email = JSON.parse(init.body).email;
      return response(email === 'first@example.invalid' ? 'first-token' : 'second-token');
    }
    if (url.includes('/rest/v1/rpc/')) return gate.promise;
    throw Error('Unexpected route');
  };
  const auth = createAuth({ baseUrl: 'https://api.example.invalid', anonKey: 'public', transport });
  await auth.signInWithPassword('first@example.invalid', 'synthetic');
  const api = createApi({
    baseUrl: 'https://api.example.invalid', anonKey: 'public', transport,
    getAccessToken: () => auth.getAccessToken(),
    onAuthError: (_error, failedToken) => auth.invalidateIfToken(failedToken, 'revoked'),
  });
  const old = api.profiles();
  await auth.signInWithPassword('second@example.invalid', 'synthetic');
  gate.resolve(Response.json({ code: 'PGRST301', message: 'expired' }, { status: 401 }));
  await assert.rejects(old, error => error.kind === 'auth');
  assert.equal(auth.getAccessToken(), 'second-token');
});
