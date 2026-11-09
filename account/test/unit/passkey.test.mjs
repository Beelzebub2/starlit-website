import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuth, fromBase64Url, toBase64Url } from '../../src/lib/auth.js';

test('passkey binary encoding round trips bytes without losing leading zeros', () => {
  const bytes = Uint8Array.from([0, 1, 127, 128, 254, 255]);
  assert.deepEqual(fromBase64Url(toBase64Url(bytes)), bytes);
  assert.throws(() => fromBase64Url('x?invalid'));
});

test('passkey sign-in requests a server challenge, verifies a WebAuthn assertion and accepts the session', async () => {
  const old = globalThis.PublicKeyCredential;
  globalThis.PublicKeyCredential = class {};
  try {
    const requests = [];
    const signed = [];
    const bytes = new Uint8Array([0, 1, 250, 254]);
    const assertion = {
      id: 'credential-one',
      rawId: bytes,
      type: 'public-key',
      response: {
        authenticatorData: bytes,
        clientDataJSON: bytes,
        signature: bytes,
        userHandle: null,
      },
      getClientExtensionResults: () => ({}),
    };
    const credentials = {
      async get(options) {
        assert.equal(options.publicKey.rpId, 'starlit-api.rrmtools.uk');
        assert.deepEqual(options.publicKey.challenge, bytes);
        assert.deepEqual(options.publicKey.allowCredentials[0].id, bytes);
        return assertion;
      },
    };
    const transport = async (url, init) => {
      requests.push({ url, init });
      if (url.endsWith('/passkeys/authentication/options')) {
        return Response.json({
          challenge_id: 'challenge-1',
          options: {
            challenge: toBase64Url(bytes),
            rpId: 'starlit-api.rrmtools.uk',
            timeout: 30000,
            allowCredentials: [{ type: 'public-key', id: toBase64Url(bytes) }],
          },
        });
      }
      if (url.endsWith('/passkeys/authentication/verify')) {
        const data = JSON.parse(init.body);
        assert.equal(data.challenge_id, 'challenge-1');
        assert.equal(data.credential.id, assertion.id);
        assert.equal(data.credential.response.signature, toBase64Url(bytes));
        assert.equal(data.credential.rawId, toBase64Url(bytes));
        return Response.json({
          access_token: 'synthetic-access-token',
          expires_in: 900,
          user: { email: 'test@example.invalid' },
        });
      }
      throw Error('Unexpected API request');
    };
    const auth = createAuth({
      baseUrl: 'https://api.example.test',
      anonKey: 'synthetic-public-anon',
      credentials, transport, onChange: view => signed.push(view),
    });
    const result = await auth.signInWithPasskey();
    assert.equal(result.email, 'test@example.invalid');
    assert.equal(auth.getAccessToken(), 'synthetic-access-token');
    assert.equal(signed.length, 1);
    assert.equal(requests.length, 2);
    for (const { init } of requests) {
      assert.equal(init.credentials, 'omit');
      assert.equal(init.cache, 'no-store');
      assert.equal(init.referrerPolicy, 'no-referrer');
      assert.equal(init.headers.apikey, 'synthetic-public-anon');
      assert.ok(!init.headers.Authorization);
    }
  } finally {
    if (old === undefined) delete globalThis.PublicKeyCredential;
    else globalThis.PublicKeyCredential = old;
  }
});

test('a cancelled passkey request creates no account session and never calls verification', async () => {
  const old = globalThis.PublicKeyCredential;
  globalThis.PublicKeyCredential = class {};
  try {
    let calls = 0;
    const auth = createAuth({
      baseUrl: 'https://api.example.test',
      anonKey: 'public',
      credentials: { get: async () => { throw Object.assign(new Error('cancelled'), { name: 'NotAllowedError' }); } },
      transport: async () => {
        calls++;
        return Response.json({ challenge_id: 'c', options: { challenge: 'AQ', rpId: 'starlit-api.rrmtools.uk' } });
      },
    });
    await assert.rejects(auth.signInWithPasskey(), e => e.kind === 'auth');
    assert.equal(auth.getAccessToken(), null);
    assert.equal(calls, 1);
  } finally {
    if (old === undefined) delete globalThis.PublicKeyCredential;
    else globalThis.PublicKeyCredential = old;
  }
});
