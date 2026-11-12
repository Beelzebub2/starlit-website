// fetch()-compatible transport over the in-memory backend. It answers with the
// same HTTP statuses and JSON error bodies PostgREST and GoTrue use, so the
// real API client and its error handling are exercised unchanged.
import { createBackend, RpcFailure } from './backend.js';
import { createMockTv } from './tv.js';

export const backend = createBackend();

// Scenario switches for manual and E2E testing (see panel.js).
export const scenario = { latencyMs: 250, failNext: null, offline: false, tvLoginEnabled: true };

const json = (status, body) => new Response(body === null ? null : JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
});
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const tv = createMockTv({ backend, json, scenario });

export async function transport(url, init = {}) {
  if (init.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  if (scenario.latencyMs) await wait(scenario.latencyMs);
  if (init.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  if (scenario.offline) throw new TypeError('Failed to fetch');

  const { pathname, searchParams } = new URL(url, 'https://mock.invalid');
  const isRpc = pathname.startsWith('/rest/v1/rpc/');
  const isTv = pathname.startsWith('/tv/v1/');
  const fail = scenario.failNext;
  if (fail && (isRpc || isTv)) {
    scenario.failNext = null;
    if (fail === 'offline') throw new TypeError('Failed to fetch');
    if (fail === '401') return json(401, { code: 'PT401', message: 'Sign in again to manage this account', details: null, hint: null });
    if (fail === '403') return json(403, { code: '42501', message: 'permission denied for function', details: null, hint: null });
    if (fail === '404') return json(404, { code: 'PGRST202', message: 'Could not find the function in the schema cache', details: null, hint: null });
    if (fail === '500') return json(500, { code: 'XX000', message: 'Internal server error', details: null, hint: null });
  }

  const token = String(new Headers(init.headers).get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  let body = {};
  try { body = init.body ? JSON.parse(init.body) : {}; } catch { return json(400, { code: 'PGRST102', message: 'Invalid JSON body' }); }

  try {
    if (isTv || pathname === '/.well-known/nuvio') return tv(pathname, token, body);
    if (isRpc) {
      const name = pathname.slice('/rest/v1/rpc/'.length);
      const handler = backend.rpc[name];
      if (!handler) return json(404, { code: 'PGRST202', message: 'Could not find the function in the schema cache' });
      const result = handler(token, body);
      return result === null ? new Response(null, { status: 204 }) : json(200, result);
    }
    if (pathname === '/auth/v1/token') {
      const grant = searchParams.get('grant_type');
      if (grant === 'password') return json(200, backend.auth.password(body));
      if (grant === 'refresh_token') return json(200, backend.auth.refresh(body));
      return json(400, { error: 'unsupported_grant_type', error_description: 'Not available in the mock API' });
    }
    if (pathname === '/auth/v1/user') return json(200, backend.auth.user(token));
    if (pathname === '/auth/v1/logout') { backend.auth.logout(token, searchParams.get('scope') ?? 'global'); return new Response(null, { status: 204 }); }
    return json(404, { message: 'Not found' });
  } catch (error) {
    if (error instanceof RpcFailure) {
      return error.code === 'invalid_grant'
        ? json(400, { error: 'invalid_grant', error_description: error.message })
        : json(error.status, { code: error.code, message: error.message, details: null, hint: null });
    }
    return json(500, { code: 'XX000', message: 'Mock backend error' });
  }
}
