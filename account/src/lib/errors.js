// Typed errors for the account API. PostgREST maps SQLSTATE PTxyz to HTTP xyz:
// the account RPCs raise PT409 (changed elsewhere) and PT401 (session revoked),
// and validation failures (22023) arrive as 400.
import { scrubText } from './redact.js';

export class ApiError extends Error {
  constructor(kind, { status = 0, code = '', message = '', retryable = false } = {}) {
    super(scrubText(message) || kind);
    this.name = 'ApiError';
    this.kind = kind;          // conflict | auth | forbidden | invalid | missing | server | network | aborted
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

export const isConflict = e => e instanceof ApiError && e.kind === 'conflict';
export const isAuth = e => e instanceof ApiError && e.kind === 'auth';
export const isAbort = e => (e instanceof ApiError && e.kind === 'aborted') || e?.name === 'AbortError';

/** Turn a fetch Response into an ApiError. Never includes request bodies or headers. */
export async function errorFromResponse(response) {
  let body = {};
  try { body = await response.json(); } catch { /* not JSON */ }
  const code = String(body.code ?? body.error ?? '');
  const message = String(body.message ?? body.error_description ?? body.msg ?? '');
  const status = response.status;
  if (status === 409) return new ApiError('conflict', { status, code, message });
  if (status === 401) return new ApiError('auth', { status, code, message });
  if (status === 403) return new ApiError('forbidden', { status, code, message });
  // PGRST202: function not found in the schema cache (RPC not deployed yet).
  if (status === 404 || code === 'PGRST202') return new ApiError('missing', { status, code, message });
  if (status === 400 || status === 422) return new ApiError('invalid', { status, code, message });
  if (status === 429) return new ApiError('server', { status, code, message, retryable: true });
  return new ApiError('server', { status, code, message, retryable: status >= 500 });
}

export function networkError(cause) {
  if (cause?.name === 'AbortError') return new ApiError('aborted', {});
  return new ApiError('network', { message: 'Network request failed', retryable: true });
}
