// GoTrue (Supabase Auth) client. GoTrue owns passwords, Google sign-in, email
// verification, passkeys and sign-out; this module only calls its public
// endpoints. Sessions live in memory only: nothing is written to localStorage,
// cookies or the URL, so closing or reloading the tab signs you out here.
import { ApiError, errorFromResponse, networkError } from './errors.js';

const VERIFIER_KEY = 'starlit.pkce';

export function createAuth({ baseUrl, anonKey, transport, now = () => Date.now(), onChange, credentials = globalThis.navigator?.credentials }) {
  let session = null;      // { accessToken, refreshToken, expiresAt, user }
  let refreshTimer = null;
  let refreshInFlight = null;
  let sessionEpoch = 0;

  const authUrl = path => `${baseUrl}/auth/v1${path}`;
  const headers = token => ({
    apikey: anonKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  async function call(path, { method = 'POST', body, token } = {}) {
    let response;
    try {
      response = await transport(authUrl(path), {
        method, headers: headers(token), body: body ? JSON.stringify(body) : undefined,
        credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
      });
    } catch (cause) { throw networkError(cause); }
    if (!response.ok) {
      const error = await errorFromResponse(response);
      // GoTrue answers a bad password with 400 invalid_grant: treat it as an auth failure.
      if (response.status === 400 && /invalid_grant|invalid_credentials/.test(error.code + error.message)) {
        throw new ApiError('auth', { status: 400, code: 'invalid_credentials', message: 'Email or password is incorrect' });
      }
      throw error;
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  function accept(tokens) {
    if (!tokens?.access_token) throw new ApiError('server', { message: 'Sign-in response had no session' });
    const expiresIn = Number(tokens.expires_in ?? 900);
    if (!Number.isFinite(expiresIn) || expiresIn <= 0) throw new ApiError('server', { message: 'Invalid session lifetime' });
    sessionEpoch++;
    session = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt: now() + expiresIn * 1000,
      user: tokens.user ?? session?.user ?? null,
    };
    schedule(expiresIn);
    onChange?.(publicView());
    return publicView();
  }

  function schedule(expiresIn) {
    clearTimeout(refreshTimer);
    if (!session?.refreshToken) return;
    // Refresh one minute before expiry (the VPS issues 900-second access tokens).
    const delay = Math.max(5, expiresIn - 60) * 1000;
    const scheduledSession = session;
    refreshTimer = setTimeout(() => {
      refresh().catch(error => {
        // A network interruption is not proof that credentials were revoked.
        // Keep the session so a later action can retry the refresh.
        if (error?.kind === 'auth' && session === scheduledSession) drop('expired');
      });
    }, delay);
    refreshTimer?.unref?.();   // Node tests only; browsers return a number
  }

  function drop(reason) {
    clearTimeout(refreshTimer);
    const had = Boolean(session);
    sessionEpoch++;
    session = null;
    if (had) onChange?.(null, reason);
  }

  async function refresh() {
    if (!session?.refreshToken) throw new ApiError('auth', { status: 401, message: 'Session expired' });
    if (refreshInFlight?.session === session) return refreshInFlight.promise;
    const previous = session;
    const epoch = sessionEpoch;
    // GoTrue rotates refresh tokens. Overlapping requests with the same token
    // may invalidate one another, so share a single refresh transaction.
    const promise = (async () => {
      const result = await call('/token?grant_type=refresh_token', { body: { refresh_token: previous.refreshToken } });
      if (sessionEpoch !== epoch || session !== previous) {
        throw new ApiError('auth', { status: 401, message: 'Session changed during refresh' });
      }
      return accept(result);
    })();
    refreshInFlight = { session: previous, promise };
    try { return await promise; }
    finally { if (refreshInFlight?.promise === promise) refreshInFlight = null; }
  }

  async function ensureAccessToken() {
    if (!session) return null;
    const previous = session;
    // Background timers are throttled in suspended tabs. Recover on demand
    // before an RPC, instead of treating an expired token as a sign-out.
    if (previous.expiresAt > now() + 30_000) return previous.accessToken;
    if (!previous.refreshToken) {
      if (previous.expiresAt <= now()) drop('expired');
      return session?.accessToken ?? null;
    }
    try {
      await refresh();
      return session?.accessToken ?? null;
    } catch (error) {
      if (error?.kind === 'auth' && session === previous) drop('expired');
      throw error;
    }
  }

  function publicView() {
    if (!session) return null;
    const user = session.user ?? {};
    return {
      email: user.email ?? '',
      providers: user.app_metadata?.providers ?? (user.app_metadata?.provider ? [user.app_metadata.provider] : []),
      createdAt: user.created_at ?? null,
      expiresAt: session.expiresAt,
    };
  }

  return {
    getAccessToken: () => (session && session.expiresAt > now() ? session.accessToken : null),
    ensureAccessToken,
    current: publicView,
    async signInWithPassword(email, password) {
      return accept(await call('/token?grant_type=password', { body: { email, password } }));
    },
    // GoTrue keeps the WebAuthn challenge, RP and credential verification on
    // the server. Do not change its existing RP ID: native app passkeys use it.
    async signInWithPasskey() {
      if (!credentials?.get || !globalThis.PublicKeyCredential) {
        throw new ApiError('unsupported', { message: 'This browser cannot use passkeys for this site' });
      }
      const request = await call('/passkeys/authentication/options', { body: {} });
      if (!request?.challenge_id || !request?.options?.challenge || !request.options.rpId) {
        throw new ApiError('server', { message: 'Invalid passkey challenge from the server' });
      }
      const publicKey = {
        ...request.options,
        challenge: fromBase64Url(request.options.challenge),
        ...(request.options.allowCredentials ? {
          allowCredentials: request.options.allowCredentials.map(item => ({
            ...item, id: fromBase64Url(item.id),
          })),
        } : {}),
      };
      let assertion;
      try { assertion = await credentials.get({ publicKey }); }
      catch (cause) {
        // A credential not chosen, incompatible authenticator or unsupported
        // related-origin browser never creates a website session.
        throw new ApiError(cause?.name === 'SecurityError' ? 'unsupported' : 'auth', {
          message: 'Passkey sign-in was cancelled or not available',
        });
      }
      if (!assertion?.id || !assertion?.response?.authenticatorData ||
          !assertion.response.clientDataJSON || !assertion.response.signature) {
        throw new ApiError('auth', { message: 'No valid passkey assertion was returned' });
      }
      const credential = {
        id: assertion.id,
        rawId: toBase64Url(assertion.rawId),
        type: 'public-key',
        response: {
          authenticatorData: toBase64Url(assertion.response.authenticatorData),
          clientDataJSON: toBase64Url(assertion.response.clientDataJSON),
          signature: toBase64Url(assertion.response.signature),
          userHandle: assertion.response.userHandle ? toBase64Url(assertion.response.userHandle) : null,
        },
        clientExtensionResults: assertion.getClientExtensionResults?.() ?? {},
      };
      return accept(await call('/passkeys/authentication/verify', {
        body: { challenge_id: request.challenge_id, credential },
      }));
    },
    async loadUser() {
      if (!session) return null;
      const previous = session;
      const epoch = sessionEpoch;
      const user = await call('/user', { method: 'GET', token: previous.accessToken });
      if (session !== previous || sessionEpoch !== epoch) {
        throw new ApiError('auth', { status: 401, message: 'Session changed during profile load' });
      }
      session.user = user;
      onChange?.(publicView());
      return publicView();
    },
    refresh,
    /** scope: 'local' (this browser), 'others' (every other session) or 'global' (everywhere). */
    async signOut(scope = 'local') {
      if (!['local', 'others', 'global'].includes(scope)) throw new ApiError('invalid', { message: 'Unknown sign-out scope' });
      const token = session?.accessToken;
      // Clear local credentials before awaiting the server: an in-flight
      // refresh must never recreate a browser session after sign-out.
      if (scope !== 'others') drop('signed-out');
      if (token) await call(`/logout?scope=${scope}`, { token });
    },
    /** Called when the API rejects the session (revoked elsewhere or expired). */
    invalidate: reason => drop(reason ?? 'revoked'),
    // A delayed 401 for the previous account must not sign out a newer login.
    invalidateIfToken: (token, reason) => {
      if (token && session?.accessToken === token) drop(reason ?? 'revoked');
    },

    // Google sign-in with PKCE. Only the one-time verifier is kept, in
    // sessionStorage, until the redirect comes back; it is useless without the code.
    async googleRedirectUrl(redirectTo) {
      const verifier = randomString(64);
      const challenge = await sha256Base64Url(verifier);
      try { sessionStorage.setItem(VERIFIER_KEY, verifier); } catch { throw new ApiError('server', { message: 'Session storage is unavailable' }); }
      const params = new URLSearchParams({ provider: 'google', redirect_to: redirectTo, code_challenge: challenge, code_challenge_method: 's256' });
      return authUrl(`/authorize?${params}`);
    },
    async completeGoogle(code) {
      let verifier = null;
      try { verifier = sessionStorage.getItem(VERIFIER_KEY); sessionStorage.removeItem(VERIFIER_KEY); } catch { /* unavailable */ }
      if (!verifier || !code) throw new ApiError('auth', { status: 400, message: 'Google sign-in could not be completed' });
      return accept(await call('/token?grant_type=pkce', { body: { auth_code: code, code_verifier: verifier } }));
    },
  };
}

export function randomString(length) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
}

export async function sha256Base64Url(text) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  let binary = '';
  for (const b of digest) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+={0,2}$/.test(value)) {
    throw new ApiError('server', { message: 'Invalid base64url value' });
  }
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const bytes = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  return Uint8Array.from(bytes, c => c.charCodeAt(0));
}

export function toBase64Url(value) {
  const bytes = new Uint8Array(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
