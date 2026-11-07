// GoTrue (Supabase Auth) client. GoTrue owns passwords, Google sign-in, email
// verification, passkeys and sign-out; this module only calls its public
// endpoints. Sessions live in memory only: nothing is written to localStorage,
// cookies or the URL, so closing or reloading the tab signs you out here.
import { ApiError, errorFromResponse, networkError } from './errors.js';

const VERIFIER_KEY = 'starlit.pkce';

export function createAuth({ baseUrl, anonKey, transport, now = () => Date.now(), onChange }) {
  let session = null;      // { accessToken, refreshToken, expiresAt, user }
  let refreshTimer = null;

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
    refreshTimer = setTimeout(() => { refresh().catch(() => drop('expired')); }, delay);
    refreshTimer?.unref?.();   // Node tests only; browsers return a number
  }

  function drop(reason) {
    clearTimeout(refreshTimer);
    const had = Boolean(session);
    session = null;
    if (had) onChange?.(null, reason);
  }

  async function refresh() {
    if (!session?.refreshToken) throw new ApiError('auth', { status: 401, message: 'Session expired' });
    return accept(await call('/token?grant_type=refresh_token', { body: { refresh_token: session.refreshToken } }));
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
    current: publicView,
    async signInWithPassword(email, password) {
      return accept(await call('/token?grant_type=password', { body: { email, password } }));
    },
    async loadUser() {
      if (!session) return null;
      session.user = await call('/user', { method: 'GET', token: session.accessToken });
      onChange?.(publicView());
      return publicView();
    },
    refresh,
    /** scope: 'local' (this browser), 'others' (every other session) or 'global' (everywhere). */
    async signOut(scope = 'local') {
      if (!['local', 'others', 'global'].includes(scope)) throw new ApiError('invalid', { message: 'Unknown sign-out scope' });
      const token = session?.accessToken;
      try {
        if (token) await call(`/logout?scope=${scope}`, { token });
      } finally {
        if (scope !== 'others') drop('signed-out');
      }
    },
    /** Called when the API rejects the session (revoked elsewhere or expired). */
    invalidate: reason => drop(reason ?? 'revoked'),

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
