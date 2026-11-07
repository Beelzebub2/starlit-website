// Shared app state. Only two small preferences use browser storage (the
// language and the last profile number); credentials and account data stay in
// memory and disappear with the tab.

const listeners = new Set();

export const state = {
  user: null,               // { email, providers, createdAt } from GoTrue
  profiles: [],             // account_profiles()
  profileId: null,          // the profile every per-profile page is scoped to
  unlocked: new Set(),      // PIN-gated profiles opened in this tab (a UX gate, not security)
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  signOutReason: null,
};

export function update(patch) {
  Object.assign(state, patch);
  for (const fn of listeners) fn(state);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const activeProfile = () => state.profiles.find(p => p.profile_index === state.profileId) ?? null;

export function readPref(key) {
  try { return localStorage.getItem(`starlit.account.${key}`); } catch { return null; }
}
export function writePref(key, value) {
  try { localStorage.setItem(`starlit.account.${key}`, String(value)); } catch { /* storage blocked: fine */ }
}
