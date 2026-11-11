import { normalizeTvCode } from './tv.js';

const KEY = 'starlit.tv-intent';
let memory = null;

// Only the human-visible code and its short lifetime survive an OAuth redirect.
// Device secrets, approval tokens and account credentials never enter storage.
export function rememberTvIntent(code = '', storage = globalThis.sessionStorage, now = Date.now()) {
  memory = { code: normalizeTvCode(code) ?? '', expiresAt: now + 600_000 };
  try { storage?.setItem(KEY, JSON.stringify(memory)); } catch { /* memory still works */ }
}

export function pendingTvIntent(storage = globalThis.sessionStorage, now = Date.now()) {
  try { memory ??= JSON.parse(storage?.getItem(KEY) ?? 'null'); } catch { /* unavailable */ }
  if (!memory || typeof memory.code !== 'string' || (memory.code && normalizeTvCode(memory.code) !== memory.code) ||
      !Number.isFinite(memory.expiresAt) || memory.expiresAt <= now || memory.expiresAt > now + 600_000) {
    clearTvIntent(storage);
    return null;
  }
  return { code: memory.code };
}

export function clearTvIntent(storage = globalThis.sessionStorage) {
  memory = null;
  try { storage?.removeItem(KEY); } catch { /* unavailable */ }
}

export function captureTvIntent(url, history, storage = globalThis.sessionStorage) {
  const code = normalizeTvCode(new URLSearchParams(url.hash.slice(1)).get('code'));
  // Scrub the whole fragment, including unknown fields, before auth navigation.
  if (url.hash) history.replaceState({}, '', url.pathname + url.search);
  if (code || !pendingTvIntent(storage)) rememberTvIntent(code ?? '', storage);
}
