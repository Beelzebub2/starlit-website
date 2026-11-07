// In-memory stand-in for the account RPCs and GoTrue, used until the real
// migrations are deployed and verified. It mirrors the SQL in
// supabase/migrations/20261107*.sql of the private backend: per-account
// scoping, PT401 for revoked sessions, PT409 for stale revisions/timestamps,
// keyset paging, native item validation and the five-try PIN lockout.
import { buildFixtures } from './fixtures.js';

export class RpcFailure extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
const invalid = message => new RpcFailure(400, '22023', message);
const conflict = message => new RpcFailure(409, 'PT409', message);
const SCOPES = ['addons', 'plugins', 'collections', 'home_catalog_settings', 'profile_settings_blob'];
const ITEM_KINDS = ['library', 'watch_progress', 'watched_items'];
const PROFILE_STRINGS = ['name', 'avatar_color_hex', 'avatar_id', 'avatar_url', 'profile_background_id', 'profile_background_url'];
const ITEM_STRINGS = ['content_id', 'content_type', 'name', 'title', 'poster', 'poster_shape', 'background', 'logo', 'description', 'release_info', 'addon_base_url', 'video_id', 'progress_key'];
const ITEM_NUMBERS = ['season', 'episode', 'position', 'duration', 'last_watched', 'watched_at', 'added_at', 'imdb_rating'];
const CREDENTIAL_PATHS = [['features', 'player_settings', 'animeskip_client_id'], ['features', 'player_settings', 'introdb_api_key'],
  ['features', 'debrid_settings', 'debrid_torbox_api_key'], ['features', 'debrid_settings', 'debrid_premiumize_api_key'],
  ['features', 'debrid_settings', 'debrid_real_debrid_api_key'], ['features', 'tmdb_settings', 'tmdb_api_key'], ['features', 'mdblist_settings', 'mdblist_api_key']];

const jtype = v => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v === 'object' ? 'object' : typeof v);
const size = v => new TextEncoder().encode(JSON.stringify(v)).length;
function requireJson(value, type, maxBytes = 1048576) {
  if (value === undefined || value === null || jtype(value) !== type || size(value) > maxBytes) throw invalid(`Invalid or oversized ${type} payload`);
  if (type === 'array' && value.length > 1000) throw invalid('At most 1000 items per request');
}
function validateFields(item, strings, numbers, booleans) {
  requireJson(item, 'object');
  for (const k of strings) if (k in item && !['string', 'null'].includes(jtype(item[k]))) throw invalid(`Expected string: ${k}`);
  for (const k of numbers) if (k in item && !['number', 'null'].includes(jtype(item[k]))) throw invalid(`Expected number: ${k}`);
  for (const k of booleans) if (k in item && jtype(item[k]) !== 'boolean') throw invalid(`Expected boolean: ${k}`);
}
const stripNulls = obj => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function createBackend({ now = () => Date.now() } = {}) {
  let last = 0;
  // Unique, increasing timestamps (Postgres has microseconds; equality checks matter).
  const stamp = () => { last = Math.max(last + 1, now()); return new Date(last).toISOString(); };
  const accounts = new Map();
  const tokens = new Map();     // access token -> { userId, sessionId, expiresAt }
  const refreshes = new Map();  // refresh token -> { userId, sessionId }
  const random = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Math.random()}`.slice(2));

  for (const f of buildFixtures(now())) {
    const u = {
      id: f.id, email: f.email, password: f.password, created_at: f.created_at, providers: f.providers,
      profiles: new Map(), records: new Map(), ext: { addons: new Map(), plugins: new Map() }, revisions: new Map(),
      pins: new Map(), servers: new Map(), devices: f.devices.map(d => ({ ...d })), sessions: new Map(),
    };
    for (const p of f.profiles) {
      const ts = stamp();
      u.profiles.set(p.profile_index, {
        user_id: u.id, profile_index: p.profile_index, id: random(), name: p.name, avatar_color_hex: p.avatar_color_hex,
        avatar_id: null, avatar_url: null, profile_background_id: null, profile_background_url: null,
        uses_primary_addons: Boolean(p.uses_primary_addons), uses_primary_plugins: false,
        pin_enabled: Boolean(p.pin), pin_locked_until: null, created_at: ts, updated_at: ts,
      });
      if (p.pin) u.pins.set(p.profile_index, { pin: p.pin, failed: 0, lockedUntil: 0 });
      const d = f.data[p.profile_index] ?? {};
      for (const kind of ITEM_KINDS) for (const item of d[kind] ?? []) {
        u.records.set(`${p.profile_index}|${kind}|${itemKey(kind, item, false)}`, { payload: normalizeItem(kind, item), updated_at: stamp() });
      }
      for (const kind of ['addons', 'plugins']) u.ext[kind].set(p.profile_index, (d[kind] ?? []).map((a, i) => ({ ...a, sort_order: i })));
      if (d.collections?.length) u.records.set(`${p.profile_index}|collections|collections`, { payload: d.collections, updated_at: stamp() });
      for (const scope of ['profile_settings_blob', 'home_catalog_settings']) {
        for (const [key, value] of Object.entries(d[scope] ?? {})) u.records.set(`${p.profile_index}|${scope}|${key}`, { payload: value, updated_at: stamp() });
      }
      const servers = new Map();
      for (const s of d.servers ?? []) { const ts2 = stamp(); const id = random(); servers.set(id, { server_id: id, ...s, created_at: ts2, updated_at: ts2 }); }
      u.servers.set(p.profile_index, servers);
    }
    for (const signedIn of f.otherSessions) {
      const id = random();
      u.sessions.set(id, { id, created_at: signedIn, not_after: null });
    }
    accounts.set(u.id, u);
  }

  // ---------------------------------------------------------------- helpers
  const revKey = (pid, scope, key) => `${pid}|${scope}|${key}`;
  const revision = (u, pid, scope, key) => u.revisions.get(revKey(pid, scope, key)) ?? 0;
  const bump = (u, pid, scope, key, by = 1) => { if (u.profiles.has(pid) && by > 0) u.revisions.set(revKey(pid, scope, key), revision(u, pid, scope, key) + by); };

  function session(token) {
    const t = tokens.get(token);
    const u = t && accounts.get(t.userId);
    if (!t || !u) throw new RpcFailure(401, 'PGRST301', 'JWT expired or invalid');
    if (t.expiresAt <= now()) throw new RpcFailure(401, 'PGRST303', 'JWT expired');
    if (!u.sessions.has(t.sessionId)) throw new RpcFailure(401, 'PT401', 'Sign in again to manage this account');
    return { u, sessionId: t.sessionId };
  }
  function requireProfile(u, pid) {
    if (!Number.isInteger(pid) || pid < 1 || pid > 6 || !u.profiles.has(pid)) throw invalid('Profile does not exist for this account');
  }
  function scopeKey(scope, platform) {
    if (['addons', 'plugins'].includes(scope) && platform == null) return 'default';
    if (scope === 'collections' && platform == null) return 'collections';
    if (scope === 'profile_settings_blob' && ['mobile', 'desktop'].includes(platform)) return platform;
    if (scope === 'home_catalog_settings' && ['home_catalog_shared', 'mobile', 'desktop'].includes(platform)) return platform;
    throw invalid('Unsupported account editor scope');
  }

  function itemKey(kind, item, del) {
    let k;
    if (kind === 'watch_progress' && del) {
      if (typeof item !== 'string') throw invalid('Expected progress key string');
      k = item;
    } else {
      requireJson(item, 'object');
      if (kind === 'watch_progress') k = item.progress_key;
      else {
        if (typeof item.content_id !== 'string' || item.content_id.length < 1 || item.content_id.length > 2048) throw invalid('Missing content_id');
        if (kind === 'library') {
          if (typeof item.content_type !== 'string' || !item.content_type || item.content_type.length > 100) throw invalid('Missing content_type');
          k = JSON.stringify([item.content_id, item.content_type]);
        } else {
          const text = v => (v === null || v === undefined ? null : String(v));
          k = JSON.stringify([item.content_id, text(item.season), text(item.episode)]);
        }
      }
    }
    if (typeof k !== 'string' || k.length < 1 || k.length > 8192) throw invalid('Invalid record key');
    return k;
  }
  function normalizeItem(kind, item) {
    if (kind === 'library') return { name: '', poster_shape: 'POSTER', genres: [], added_at: 0, ...stripNulls(item) };
    if (kind === 'watch_progress') return { position: 0, duration: 0, last_watched: 0, ...stripNulls(item) };
    return { title: '', watched_at: 0, ...stripNulls(item) };
  }
  function pushItems(u, kind, pid, items, del) {
    requireProfile(u, pid);
    requireJson(items, 'array');
    const tsField = kind === 'watch_progress' ? 'last_watched' : kind === 'watched_items' ? 'watched_at' : 'added_at';
    for (const item of items) {
      const k = itemKey(kind, item, del);
      const id = `${pid}|${kind}|${k}`;
      const old = u.records.get(id);
      if (del) { u.records.delete(id); continue; }
      validateFields(item, ITEM_STRINGS, ITEM_NUMBERS, []);
      if (typeof item.content_id !== 'string' || typeof item.content_type !== 'string') throw invalid('Missing content_id/content_type');
      if (kind === 'watch_progress' && typeof item.video_id !== 'string') throw invalid('Missing video_id');
      for (const f of ['season', 'episode']) if (item[f] != null && !(Number.isInteger(item[f]) && item[f] >= 0)) throw invalid('Invalid season/episode');
      const payload = normalizeItem(kind, item);
      if (!(Number.isInteger(payload[tsField]) && payload[tsField] >= 0)) throw invalid('Invalid timestamp');
      if (kind === 'watch_progress' && !(Number.isInteger(payload.position) && payload.position >= 0 && Number.isInteger(payload.duration) && payload.duration >= 0)) throw invalid('Invalid position/duration');
      if (old && (old.payload[tsField] ?? -1) > payload[tsField]) continue;
      if (old && same(old.payload, payload)) continue;
      u.records.set(id, { payload, updated_at: stamp() });
    }
  }
  function pinCheck(u, pid, pin) {
    const s = u.pins.get(pid);
    if (!s) return { accepted: false, retry: 0 };
    const t = now();
    if (s.lockedUntil > t) return { accepted: false, retry: Math.max(1, Math.ceil((s.lockedUntil - t) / 1000)) };
    if (/^[0-9]{4}$/.test(String(pin ?? '')) && pin === s.pin) {
      s.failed = 0; s.lockedUntil = 0; u.profiles.get(pid).pin_locked_until = null;
      return { accepted: true, retry: 0 };
    }
    const attempts = s.lockedUntil ? 1 : s.failed + 1;
    if (attempts >= 5) {
      s.failed = 5; s.lockedUntil = t + 15 * 60e3; u.profiles.get(pid).pin_locked_until = new Date(s.lockedUntil).toISOString();
      return { accepted: false, retry: 900 };
    }
    s.failed = attempts; s.lockedUntil = 0; u.profiles.get(pid).pin_locked_until = null;
    return { accepted: false, retry: 0 };
  }
  const extList = (u, pid, kind) => [...(u.ext[kind].get(pid) ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order || (a.url < b.url ? -1 : 1))
    .map(({ url, name, enabled, sort_order }) => ({ url, name, enabled, sort_order }));
  const blobOf = (u, pid, scope, key) => u.records.get(`${pid}|${scope}|${key}`) ?? null;

  // ---------------------------------------------------------------- RPCs
  const rpc = {
    account_overview(token, { p_profile_id: pid }) {
      const { u } = session(token); requireProfile(u, pid);
      const recs = [...u.records.entries()].filter(([k]) => k.startsWith(`${pid}|`));
      const count = kind => recs.filter(([k]) => k.startsWith(`${pid}|${kind}|`)).length;
      const coll = blobOf(u, pid, 'collections', 'collections');
      const stamps = recs.filter(([k]) => /\|(library|watch_progress|watched_items|collections)\|/.test(k)).map(([, r]) => r.updated_at).sort();
      return {
        profile_id: pid, addons: (u.ext.addons.get(pid) ?? []).length, plugins: (u.ext.plugins.get(pid) ?? []).length,
        library_items: count('library'), watch_progress: count('watch_progress'), watched_records: count('watched_items'),
        collections: Array.isArray(coll?.payload) ? coll.payload.length : 0, last_data_change: stamps.at(-1) ?? null,
      };
    },
    account_profiles(token) {
      const { u } = session(token);
      return [...u.profiles.values()].sort((a, b) => a.profile_index - b.profile_index).map(p => ({ ...p }));
    },
    account_save_profile(token, { p_profile: p, p_expected_updated_at: expected = null }) {
      const { u } = session(token);
      requireJson(p, 'object', 65536);
      if (jtype(p.profile_index) !== 'number') throw invalid('Missing profile index');
      const n = p.profile_index;
      if (!Number.isInteger(n) || n < 1 || n > 6) throw invalid('Invalid profile index');
      const prev = u.profiles.get(n)?.updated_at ?? null;
      if ((expected === null && prev !== null) || (expected !== null && prev !== expected)) throw conflict('Profile changed. Reload before saving.');
      validateFields(p, PROFILE_STRINGS, ['profile_index'], ['uses_primary_addons', 'uses_primary_plugins']);
      if (typeof p.name !== 'string' || p.name.length < 1 || p.name.length > 100) throw invalid('Invalid profile');
      if ((p.avatar_url ?? '').length > 2048 || (p.profile_background_url ?? '').length > 2048) throw invalid('Profile image URL too long');
      const color = p.avatar_color_hex ?? '#1E88E5';
      if (!/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(color)) throw new RpcFailure(400, '23514', 'new row violates check constraint');
      const ts = stamp();
      const existing = u.profiles.get(n);
      const next = {
        user_id: u.id, profile_index: n, id: existing?.id ?? random(), name: p.name, avatar_color_hex: color,
        avatar_id: p.avatar_id ?? null, avatar_url: p.avatar_url ?? null, profile_background_id: p.profile_background_id ?? null,
        profile_background_url: p.profile_background_url ?? null, uses_primary_addons: Boolean(p.uses_primary_addons),
        uses_primary_plugins: Boolean(p.uses_primary_plugins), pin_enabled: existing?.pin_enabled ?? false,
        pin_locked_until: existing?.pin_locked_until ?? null, created_at: existing?.created_at ?? ts, updated_at: ts,
      };
      u.profiles.set(n, next);
      if (!existing) { u.ext.addons.set(n, []); u.ext.plugins.set(n, []); u.servers.set(n, new Map()); }
      return { ...next };
    },
    account_delete_profile(token, { p_profile_id: pid, p_expected_updated_at: expected }) {
      const { u } = session(token);
      if (pid === 1) throw invalid('Cannot delete primary profile');
      const stampNow = u.profiles.get(pid)?.updated_at;
      if (!stampNow || !expected || stampNow !== expected) throw conflict('Profile changed. Reload before deleting.');
      u.profiles.delete(pid);
      for (const k of [...u.records.keys()]) if (k.startsWith(`${pid}|`)) u.records.delete(k);
      for (const k of [...u.revisions.keys()]) if (k.startsWith(`${pid}|`)) u.revisions.delete(k);
      u.ext.addons.delete(pid); u.ext.plugins.delete(pid); u.pins.delete(pid); u.servers.delete(pid);
      return null;
    },
    account_extensions(token, { p_profile_id: pid, p_kind: kind }) {
      const { u } = session(token); requireProfile(u, pid);
      if (!['addons', 'plugins'].includes(kind)) throw invalid('Unsupported extension kind');
      return { kind, profile_id: pid, revision: revision(u, pid, kind, 'default'), items: extList(u, pid, kind) };
    },
    account_save_extensions(token, { p_profile_id: pid, p_kind: kind, p_items: items, p_expected_revision: expected }) {
      const { u } = session(token); requireProfile(u, pid);
      if (!['addons', 'plugins'].includes(kind)) throw invalid('Unsupported extension kind');
      requireJson(items, 'array');
      if (expected === null || expected === undefined || expected < 0) throw invalid('An expected revision is required');
      if (revision(u, pid, kind, 'default') !== expected) throw conflict('Addons or plugins changed on another device. Reload before saving.');
      const rows = new Map();
      for (const item of items) {
        validateFields(item, ['url', 'name'], ['sort_order'], ['enabled']);
        if (typeof item.url !== 'string') throw invalid('Missing extension URL');
        if (item.url.length < 1 || item.url.length > 8192) throw new RpcFailure(400, '23514', 'new row violates check constraint');
        rows.set(item.url, { url: item.url, name: item.name ?? '', enabled: item.enabled ?? true, sort_order: item.sort_order ?? 0 });
      }
      const deleted = (u.ext[kind].get(pid) ?? []).length;
      u.ext[kind].set(pid, [...rows.values()]);
      bump(u, pid, kind, 'default', deleted + items.length);   // the SQL trigger fires per row
      return rpc.account_extensions(token, { p_profile_id: pid, p_kind: kind });
    },
    account_blob(token, { p_profile_id: pid, p_scope: scope, p_platform: platform = null }) {
      const { u } = session(token); requireProfile(u, pid);
      const key = scopeKey(scope, platform);
      if (!['collections', 'home_catalog_settings', 'profile_settings_blob'].includes(scope)) throw invalid('Unsupported settings scope');
      const rec = blobOf(u, pid, scope, key);
      return { profile_id: pid, scope, platform, revision: revision(u, pid, scope, key), value: rec ? structuredClone(rec.payload) : null, updated_at: rec?.updated_at ?? null };
    },
    account_save_blob(token, { p_profile_id: pid, p_scope: scope, p_platform: platform = null, p_value: value, p_expected_revision: expected }) {
      const { u } = session(token);
      const key = scopeKey(scope, platform);
      requireProfile(u, pid);
      if (!['collections', 'home_catalog_settings', 'profile_settings_blob'].includes(scope)) throw invalid('Unsupported settings scope');
      if (expected === null || expected === undefined || expected < 0) throw invalid('An expected revision is required');
      if (revision(u, pid, scope, key) !== expected) throw conflict('Settings changed on another device. Reload before saving.');
      requireJson(value, scope === 'collections' ? 'array' : 'object');
      let payload = structuredClone(value);
      if (scope === 'profile_settings_blob') for (const path of CREDENTIAL_PATHS) {
        let cur = payload; for (const p of path.slice(0, -1)) cur = cur?.[p];
        if (cur && typeof cur === 'object') delete cur[path.at(-1)];
      }
      u.records.set(`${pid}|${scope}|${key}`, { payload, updated_at: stamp() });
      bump(u, pid, scope, key);
      return rpc.account_blob(token, { p_profile_id: pid, p_scope: scope, p_platform: platform });
    },
    account_items(token, { p_profile_id: pid, p_kind: kind, p_after_key: after = null, p_limit: limit = 50 }) {
      const { u } = session(token); requireProfile(u, pid);
      if (!ITEM_KINDS.includes(kind)) throw invalid('Unsupported item kind');
      if (!Number.isInteger(limit) || limit < 1 || limit > 100 || String(after ?? '').length > 8192) throw invalid('Invalid account pagination');
      const prefix = `${pid}|${kind}|`;
      const rows = [...u.records.entries()].filter(([k]) => k.startsWith(prefix)).map(([k, r]) => ({ key: k.slice(prefix.length), value: structuredClone(r.payload), updated_at: r.updated_at }))
        .filter(r => after === null || r.key > after).sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)).slice(0, limit);
      return { items: rows, next_cursor: rows.length ? rows.at(-1).key : null };
    },
    account_save_item(token, { p_profile_id: pid, p_kind: kind, p_item: item, p_expected_updated_at: expected = null }) {
      const { u } = session(token); requireProfile(u, pid);
      if (!ITEM_KINDS.includes(kind)) throw invalid('Unsupported item kind');
      const key = itemKey(kind, item, false);
      const id = `${pid}|${kind}|${key}`;
      const prev = u.records.get(id);
      if ((expected === null && prev) || (expected !== null && prev?.updated_at !== expected)) throw conflict('Item changed on another device. Reload before saving.');
      pushItems(u, kind, pid, [item], false);
      const cur = u.records.get(id);
      if (!cur || (prev && !same(prev.payload, item) && same(cur.payload, prev.payload))) throw conflict('A newer item timestamp already exists. Reload before saving.');
      return { key, value: structuredClone(cur.payload), updated_at: cur.updated_at };
    },
    account_delete_item(token, { p_profile_id: pid, p_kind: kind, p_key: key, p_expected_updated_at: expected }) {
      const { u } = session(token); requireProfile(u, pid);
      if (!ITEM_KINDS.includes(kind)) throw invalid('Unsupported item kind');
      const k = itemKey(kind, key, true);
      const rec = u.records.get(`${pid}|${kind}|${k}`);
      if (!rec || !expected || rec.updated_at !== expected) throw conflict('Item changed on another device. Reload before deleting.');
      pushItems(u, kind, pid, [key], true);
      return null;
    },
    account_devices(token, { p_limit: limit = 100 }) {
      const { u } = session(token);
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw invalid('Invalid device limit');
      return [...u.devices].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1)).slice(0, limit).map(d => ({ ...d }));
    },
    account_sessions(token, { p_limit: limit = 50 }) {
      const { u, sessionId } = session(token);
      if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw invalid('Invalid session limit');
      return [...u.sessions.values()].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, limit)
        .map(s => ({ session_id: s.id, signed_in_at: s.created_at, expires_at: s.not_after, is_current: s.id === sessionId }));
    },
    account_media_servers(token, { p_profile_id: pid, p_limit: limit = 50 }) {
      const { u } = session(token); requireProfile(u, pid);
      if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw invalid('Invalid media server limit');
      return [...(u.servers.get(pid)?.values() ?? [])].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1)).slice(0, limit).map(s => ({ ...s }));
    },
    account_save_media_server(token, { p_profile_id: pid, p_server: server, p_expected_updated_at: expected = null }) {
      const { u } = session(token); requireProfile(u, pid);
      requireJson(server, 'object', 4096);
      if (Object.keys(server).some(k => !['server_id', 'server_type', 'name', 'base_url', 'enabled'].includes(k))) throw invalid('Only connection metadata may be saved');
      const { server_type: kind, name, base_url: url } = server;
      if (!['jellyfin', 'emby'].includes(kind) || !name || name.length > 100 || !url || url.length < 8 || url.length > 2048 ||
        !/^https?:\/\/[^/@?#\s]+(\/[^?#\s]*)?$/i.test(url)) throw invalid('Invalid server metadata or URL');
      if ('enabled' in server && typeof server.enabled !== 'boolean') throw invalid('Invalid enabled flag');
      const servers = u.servers.get(pid);
      const id = server.server_id ?? random();
      const old = servers.get(id);
      if ((expected === null && old) || (expected !== null && old?.updated_at !== expected)) throw conflict('Server changed. Reload before saving.');
      if (!old && servers.size >= 50) throw invalid('Too many media servers');
      const ts = stamp();
      const saved = { server_id: id, server_type: kind, name, base_url: url, enabled: server.enabled ?? true, created_at: old?.created_at ?? ts, updated_at: ts };
      servers.set(id, saved);
      return { ...saved };
    },
    account_delete_media_server(token, { p_profile_id: pid, p_server_id: id, p_expected_updated_at: expected }) {
      const { u } = session(token); requireProfile(u, pid);
      const old = u.servers.get(pid).get(id);
      if (!old || !expected || old.updated_at !== expected) throw conflict('Server changed. Reload before deleting.');
      u.servers.get(pid).delete(id);
      return null;
    },
    account_change_pin(token, { p_profile_id: pid, p_new_pin: next, p_current_pin: current = null }) {
      const { u } = session(token); requireProfile(u, pid);
      if (!/^[0-9]{4}$/.test(String(next ?? ''))) throw invalid('PIN must contain exactly four digits');
      if (u.pins.has(pid)) {
        const r = pinCheck(u, pid, current);
        if (!r.accepted) return { ok: false, retry_after_seconds: r.retry };
      }
      u.pins.set(pid, { pin: next, failed: 0, lockedUntil: 0 });
      Object.assign(u.profiles.get(pid), { pin_enabled: true, pin_locked_until: null, updated_at: stamp() });
      return { ok: true, retry_after_seconds: 0 };
    },
    account_remove_pin(token, { p_profile_id: pid, p_current_pin: current }) {
      const { u } = session(token); requireProfile(u, pid);
      if (!u.pins.has(pid)) return { ok: true, retry_after_seconds: 0 };
      const r = pinCheck(u, pid, current);
      if (!r.accepted) return { ok: false, retry_after_seconds: r.retry };
      u.pins.delete(pid);
      Object.assign(u.profiles.get(pid), { pin_enabled: false, pin_locked_until: null, updated_at: stamp() });
      return { ok: true, retry_after_seconds: 0 };
    },
    verify_profile_pin(token, { p_profile_id: pid, p_pin: pin }) {
      const t = tokens.get(token); const u = t && accounts.get(t.userId);
      if (!u) throw new RpcFailure(401, 'PGRST301', 'JWT expired or invalid');
      requireProfile(u, pid);
      const r = pinCheck(u, pid, pin);
      return [{ unlocked: r.accepted, retry_after_seconds: r.retry, message: r.accepted ? 'Unlocked' : r.retry > 0 ? 'PIN temporarily locked' : 'Incorrect PIN or PIN not configured' }];
    },
  };

  // ---------------------------------------------------------------- GoTrue
  function issue(u, sessionId) {
    const access = `mock-access.${random()}`, refresh = `mock-refresh.${random()}`;
    tokens.set(access, { userId: u.id, sessionId, expiresAt: now() + 900e3 });
    refreshes.set(refresh, { userId: u.id, sessionId });
    return { access_token: access, token_type: 'bearer', expires_in: 900, refresh_token: refresh, user: userView(u) };
  }
  const userView = u => ({ id: u.id, email: u.email, created_at: u.created_at, app_metadata: { provider: u.providers[0], providers: u.providers } });
  const auth = {
    password({ email, password }) {
      const u = [...accounts.values()].find(a => a.email === String(email ?? '').trim().toLowerCase());
      if (!u || u.password !== password) throw new RpcFailure(400, 'invalid_grant', 'Invalid login credentials');
      const id = random();
      u.sessions.set(id, { id, created_at: stamp(), not_after: null });
      return issue(u, id);
    },
    refresh({ refresh_token: token }) {
      const r = refreshes.get(token); const u = r && accounts.get(r.userId);
      if (!r || !u || !u.sessions.has(r.sessionId)) throw new RpcFailure(400, 'invalid_grant', 'Invalid Refresh Token');
      refreshes.delete(token);
      return issue(u, r.sessionId);
    },
    user(token) { const t = tokens.get(token); const u = t && accounts.get(t.userId); if (!u) throw new RpcFailure(401, 'bad_jwt', 'invalid JWT'); return userView(u); },
    logout(token, scope) {
      const t = tokens.get(token); const u = t && accounts.get(t.userId);
      if (!u) throw new RpcFailure(401, 'bad_jwt', 'invalid JWT');
      for (const id of [...u.sessions.keys()]) {
        if (scope === 'global' || (scope === 'local' && id === t.sessionId) || (scope === 'others' && id !== t.sessionId)) u.sessions.delete(id);
      }
      return null;
    },
  };

  // ---------------------------------------------------------------- "another device"
  // Used by the mock panel and tests to create real conflicts.
  function remoteEdit(email, what, pid = 1) {
    const u = [...accounts.values()].find(a => a.email === email);
    if (!u || !u.profiles.has(pid)) return false;
    if (what === 'addons') {
      const list = u.ext.addons.get(pid) ?? [];
      if (list[0]) list[0].enabled = !list[0].enabled;
      list.push({ url: `https://other-device.example.test/${list.length}/manifest.json`, name: 'Added on another device', enabled: true, sort_order: list.length });
      bump(u, pid, 'addons', 'default', list.length + 1);
    } else if (what === 'collections') {
      const rec = blobOf(u, pid, 'collections', 'collections');
      const list = rec ? structuredClone(rec.payload) : [];
      if (list[0]) list[0].title = `${list[0].title} (renamed elsewhere)`;
      u.records.set(`${pid}|collections|collections`, { payload: list, updated_at: stamp() });
      bump(u, pid, 'collections', 'collections');
    } else if (what === 'settings') {
      const rec = blobOf(u, pid, 'profile_settings_blob', 'mobile');
      const value = rec ? structuredClone(rec.payload) : { version: 4, features: {} };
      value.features = value.features ?? {};
      value.features.player_settings = { ...(value.features.player_settings ?? {}), subtitle_size: 30, skip_intro: false };
      u.records.set(`${pid}|profile_settings_blob|mobile`, { payload: value, updated_at: stamp() });
      bump(u, pid, 'profile_settings_blob', 'mobile');
    } else if (what === 'profile') {
      const p = u.profiles.get(pid); p.name = `${p.name}*`; p.updated_at = stamp();
    } else if (what === 'progress') {
      const entry = [...u.records.entries()].filter(([k]) => k.startsWith(`${pid}|watch_progress|`)).sort(([a], [b]) => (a < b ? -1 : 1))[0];
      if (!entry) return false;
      entry[1].payload = { ...entry[1].payload, position: entry[1].payload.position + 60000, last_watched: now() };
      entry[1].updated_at = stamp();
    } else if (what === 'revoke') {
      u.sessions.clear();
    } else return false;
    return true;
  }

  return { rpc, auth, remoteEdit, accounts };
}
