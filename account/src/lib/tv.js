import { ApiError, errorFromResponse, networkError } from './errors.js';

export const normalizeTvCode = value => {
  const code = String(value ?? '').trim().toUpperCase().replace(/[ -]/g, '');
  return /^[A-Z0-9]{8}$/.test(code) ? code.slice(0, 4) + '-' + code.slice(4) : null;
};

// Discovery may enable approval, but may never redirect an account bearer token.
export function validTvDiscovery(data, baseUrl) {
  if (data?.capabilities?.tv_login !== true || data.device_authorization?.version !== 1) return false;
  const origin = new URL(baseUrl || '/', 'https://mock.invalid').origin;
  return ['start', 'poll', 'request', 'approve', 'deny', 'devices', 'revoke'].every(name => {
    try {
      const url = new URL(data.device_authorization[name + '_endpoint']);
      return url.origin === origin && url.pathname === '/tv/v1/' + name && !url.search && !url.hash && !url.username && !url.password;
    } catch { return false; }
  });
}

export function createTvApi({ baseUrl, anonKey, transport, getAccessToken, onAuthError, enabled }) {
  async function call(path, body, { signal, publicRequest = false } = {}) {
    if (!enabled) throw new ApiError('missing');
    const token = publicRequest ? null : await getAccessToken();
    if (!publicRequest && !token) throw new ApiError('auth', { status: 401 });
    let response;
    try {
      response = await transport(baseUrl + path, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { apikey: anonKey, Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        body: body === undefined ? undefined : JSON.stringify(body), signal,
        credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', redirect: 'error',
      });
    } catch (cause) { throw networkError(cause); }
    if (!response.ok) {
      const error = await errorFromResponse(response);
      if (error.kind === 'auth' && token) onAuthError?.(error, token);
      throw error;
    }
    return response.json();
  }
  return {
    enabled,
    async available(opts) {
      if (!enabled) return false;
      return validTvDiscovery(await call('/.well-known/nuvio', undefined, { ...opts, publicRequest: true }), baseUrl);
    },
    request: (code, opts) => call('/tv/v1/request', { user_code: normalizeTvCode(code) }, opts),
    decide: (decision, request, opts) => {
      if (!['approve', 'deny'].includes(decision)) throw new ApiError('invalid');
      return call('/tv/v1/' + decision, { user_code: request.user_code, approval_token: request.approval_token, confirm: true }, opts);
    },
    devices: opts => call('/tv/v1/devices', undefined, opts),
    revoke: (deviceId, opts) => call('/tv/v1/revoke', { device_id: deviceId }, opts),
  };
}
