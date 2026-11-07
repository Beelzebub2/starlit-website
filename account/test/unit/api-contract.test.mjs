// The real API client against the mock backend, which mirrors the SQL of
// backend migrations 20261107*. Covers scoping, 401/409 handling, keyset
// paging, PIN lockout, sign-out scopes and credential stripping.
import test from 'node:test';
import assert from 'node:assert/strict';
import { transport, backend, scenario } from '../../src/mock/transport.js';
import { createApi, deleteKeyFor } from '../../src/lib/api.js';
import { createAuth } from '../../src/lib/auth.js';
import { mergeObjects } from '../../src/lib/merge.js';
import { TEST_ACCOUNTS } from '../../src/mock/fixtures.js';

scenario.latencyMs = 0;
const bodies = [];
const spy = (url, init) => { bodies.push({ url, body: init?.body ? JSON.parse(init.body) : null, headers: init?.headers }); return transport(url, init); };

async function session(which, { onAuthError } = {}) {
  const auth = createAuth({ baseUrl: '', anonKey: 'anon', transport: spy });
  await auth.signInWithPassword(TEST_ACCOUNTS[which].email, TEST_ACCOUNTS[which].password);
  const api = createApi({ baseUrl: '', anonKey: 'anon', transport: spy, getAccessToken: () => auth.getAccessToken(), onAuthError });
  return { auth, api };
}

test('a wrong password is an auth error and gives no session', async () => {
  const auth = createAuth({ baseUrl: '', anonKey: 'anon', transport });
  await assert.rejects(auth.signInWithPassword(TEST_ACCOUNTS.a.email, 'not-the-password'), e => e.kind === 'auth');
  assert.equal(auth.getAccessToken(), null);
});

test('overview returns true per-profile counts', async () => {
  const { api } = await session('a');
  const one = await api.overview(1);
  assert.deepEqual([one.library_items, one.watch_progress, one.watched_records, one.collections, one.addons, one.plugins], [62, 27, 40, 2, 4, 1]);
  const three = await api.overview(3);
  assert.deepEqual([three.library_items, three.watch_progress, three.addons], [5, 0, 0]);
  assert.ok(one.last_data_change);
});

test('two accounts are isolated and no request names a user id', async () => {
  const a = await session('a');
  const b = await session('b');
  const bProfiles = await b.api.profiles();
  assert.deepEqual(bProfiles.map(p => p.name), ['Ben']);
  await assert.rejects(b.api.overview(2), e => e.kind === 'invalid');   // A's profile 2 does not exist for B
  const aAddons = (await a.api.extensions(1, 'addons')).items.map(x => x.url);
  const bAddons = (await b.api.extensions(1, 'addons')).items.map(x => x.url);
  assert.ok(aAddons.every(u => !bAddons.includes(u)));
  for (const { body } of bodies) {
    if (!body) continue;
    assert.ok(!('p_user_id' in body) && !('user_id' in body), 'no user id is ever sent');
  }
});

test('stale addon revision gives 409; reload and save succeeds', async () => {
  const { api } = await session('a');
  const first = await api.extensions(1, 'addons');
  backend.remoteEdit(TEST_ACCOUNTS.a.email, 'addons', 1);
  const items = first.items.map((x, i) => ({ ...x, sort_order: i }));
  await assert.rejects(api.saveExtensions(1, 'addons', items, first.revision), e => e.kind === 'conflict' && e.status === 409);
  const latest = await api.extensions(1, 'addons');
  assert.ok(latest.revision > first.revision);
  const saved = await api.saveExtensions(1, 'addons', latest.items.reverse().map((x, i) => ({ ...x, sort_order: i })), latest.revision);
  assert.ok(saved.revision > latest.revision);
  assert.equal(saved.items[0].url, latest.items[0].url);
});

test('settings 409 merges at leaf level and keeps unknown keys', async () => {
  const { api } = await session('a');
  const base = await api.blob(1, 'profile_settings_blob', 'mobile');
  const mine = structuredClone(base.value);
  mine.features.player_settings.autoplay_next_episode = false;
  backend.remoteEdit(TEST_ACCOUNTS.a.email, 'settings', 1);
  await assert.rejects(api.saveBlob(1, 'profile_settings_blob', 'mobile', mine, base.revision), e => e.kind === 'conflict');
  const latest = await api.blob(1, 'profile_settings_blob', 'mobile');
  const merged = mergeObjects(base.value, mine, latest.value);
  assert.equal(merged.conflicts.length, 0);
  assert.equal(merged.value.features.player_settings.autoplay_next_episode, false);   // mine
  assert.equal(merged.value.features.player_settings.subtitle_size, 30);             // theirs
  assert.deepEqual(merged.value.features.airing_now_experiment, { enabled: true, rollout: 'beta' });
  const saved = await api.saveBlob(1, 'profile_settings_blob', 'mobile', merged.value, latest.revision);
  assert.equal(saved.value.features.player_settings.autoplay_next_episode, false);
});

test('the server strips provider keys from profile settings', async () => {
  const { api } = await session('a');
  const current = await api.blob(1, 'profile_settings_blob', 'desktop');
  const value = structuredClone(current.value);
  value.features.tmdb_settings = { tmdb_api_key: 'synthetic-key', language: 'en' };
  const saved = await api.saveBlob(1, 'profile_settings_blob', 'desktop', value, current.revision);
  assert.deepEqual(saved.value.features.tmdb_settings, { language: 'en' });
});

test('keyset paging returns every item once, in key order', async () => {
  const { api } = await session('a');
  const keys = [];
  let after = null;
  for (let i = 0; i < 10; i++) {
    const page = await api.items(1, 'library', after, 25);
    keys.push(...page.items.map(x => x.key));
    if (page.items.length < 25) break;
    after = page.next_cursor;
  }
  assert.equal(keys.length, 62);
  assert.equal(new Set(keys).size, 62);
  assert.deepEqual([...keys].sort(), keys);
  await assert.rejects(api.items(1, 'library', null, 101), e => e.kind === 'invalid');
  await assert.rejects(api.items(1, 'provider_credentials', null, 10), e => e.kind === 'invalid');
});

test('item edits and deletes check updated_at', async () => {
  const { api } = await session('a');
  const [row] = (await api.items(1, 'watch_progress', null, 1)).items;
  backend.remoteEdit(TEST_ACCOUNTS.a.email, 'progress', 1);
  const next = { ...row.value, position: 1000, last_watched: Date.now() + 5000 };
  await assert.rejects(api.saveItem(1, 'watch_progress', next, row.updated_at), e => e.kind === 'conflict');
  const [fresh] = (await api.items(1, 'watch_progress', null, 1)).items;
  const saved = await api.saveItem(1, 'watch_progress', { ...fresh.value, position: 1000, last_watched: Date.now() + 6000 }, fresh.updated_at);
  assert.equal(saved.value.position, 1000);
  await api.deleteItem(1, 'watch_progress', deleteKeyFor('watch_progress', saved.value), saved.updated_at);
  await assert.rejects(api.deleteItem(1, 'watch_progress', deleteKeyFor('watch_progress', saved.value), saved.updated_at), e => e.kind === 'conflict');
  const [lib] = (await api.items(1, 'library', null, 1)).items;
  await api.deleteItem(1, 'library', deleteKeyFor('library', lib.value), lib.updated_at);
});

test('PIN locks for 15 minutes after five wrong tries', async () => {
  const { api } = await session('a');
  for (let i = 1; i <= 4; i++) assert.deepEqual(await api.verifyPin(2, '0000'), { unlocked: false, retryAfterSeconds: 0 });
  assert.deepEqual(await api.verifyPin(2, '0000'), { unlocked: false, retryAfterSeconds: 900 });
  const locked = await api.verifyPin(2, TEST_ACCOUNTS.a.pins[2]);
  assert.equal(locked.unlocked, false);
  assert.ok(locked.retryAfterSeconds > 0);
  const change = await api.changePin(2, '1357', '0000');
  assert.equal(change.ok, false);
  await assert.rejects(api.changePin(3, '12a4', null), e => e.kind === 'invalid');
  assert.deepEqual(await api.changePin(3, '1234', null), { ok: true, retry_after_seconds: 0 });
  assert.deepEqual(await api.removePin(3, '9999'), { ok: false, retry_after_seconds: 0 });
  assert.deepEqual(await api.removePin(3, '1234'), { ok: true, retry_after_seconds: 0 });
});

test('profiles: create, conflict on stale edit, delete secondary only', async () => {
  const { api } = await session('b');
  const created = await api.saveProfile({ profile_index: 2, name: 'Guest', avatar_color_hex: '#7FD99A' }, null);
  assert.equal(created.name, 'Guest');
  await assert.rejects(api.saveProfile({ profile_index: 2, name: 'Again' }, null), e => e.kind === 'conflict');
  const edited = await api.saveProfile({ profile_index: 2, name: 'Guest 2', avatar_color_hex: '#7FD99A' }, created.updated_at);
  await assert.rejects(api.deleteProfile(2, created.updated_at), e => e.kind === 'conflict');
  await api.deleteProfile(2, edited.updated_at);
  const ben = (await api.profiles())[0];
  await assert.rejects(api.deleteProfile(1, ben.updated_at), e => e.kind === 'invalid');
});

test('media servers keep metadata only and check timestamps', async () => {
  const { api } = await session('b');
  await assert.rejects(api.saveMediaServer(1, { server_type: 'jellyfin', name: 'x', base_url: 'https://user:pw@host.example.test' }), e => e.kind === 'invalid');
  await assert.rejects(api.saveMediaServer(1, { server_type: 'emby', name: 'x', base_url: 'https://host.example.test', token: 't' }), e => e.kind === 'invalid');
  const saved = await api.saveMediaServer(1, { server_type: 'emby', name: 'Den', base_url: 'https://den.example.test:8096' });
  assert.ok(!('user_id' in saved));
  await api.saveMediaServer(1, { ...pick(saved), name: 'Den 2' }, saved.updated_at);
  await assert.rejects(api.deleteMediaServer(1, saved.server_id, saved.updated_at), e => e.kind === 'conflict');
});
const pick = s => ({ server_id: s.server_id, server_type: s.server_type, name: s.name, base_url: s.base_url, enabled: s.enabled });

test('sign out others keeps this session; a revoked session is a 401', async () => {
  const one = await session('a');
  const before = await one.api.sessions();
  assert.ok(before.filter(s => !s.is_current).length >= 1);
  await one.auth.signOut('others');
  const after = await one.api.sessions();
  assert.equal(after.length, 1);
  assert.equal(after[0].is_current, true);
  let called = 0;
  const two = await session('a', { onAuthError: () => called++ });
  await one.auth.signOut('global');
  await assert.rejects(two.api.overview(1), e => e.kind === 'auth' && e.status === 401);
  assert.equal(called, 1);
  assert.equal(one.auth.getAccessToken(), null);
});

test('HTTP failures map to typed errors without leaking details', async () => {
  const { api } = await session('b');
  for (const [fail, kind] of [['500', 'server'], ['404', 'missing'], ['403', 'forbidden'], ['offline', 'network']]) {
    scenario.failNext = fail;
    await assert.rejects(api.overview(1), e => e.kind === kind && !/Bearer|mock-access/.test(e.message));
  }
  const ok = await api.overview(1);
  assert.equal(ok.profile_id, 1);
});

test('every request carries the anon key and a bearer token, never cookies', () => {
  const rpc = bodies.filter(b => b.url.includes('/rest/v1/rpc/'));
  assert.ok(rpc.length > 20);
  for (const { headers } of rpc) {
    assert.equal(headers.apikey, 'anon');
    assert.match(headers.Authorization, /^Bearer mock-access\./);
  }
});

test('delete keys match the server item_key rules', () => {
  assert.equal(deleteKeyFor('watch_progress', { progress_key: 'demo:x_s1e2' }), 'demo:x_s1e2');
  assert.deepEqual(deleteKeyFor('library', { content_id: 'demo:x', content_type: 'series', name: 'X' }), { content_id: 'demo:x', content_type: 'series' });
  assert.deepEqual(deleteKeyFor('watched_items', { content_id: 'demo:x', season: 1, episode: 2, title: 'X' }), { content_id: 'demo:x', season: 1, episode: 2 });
});
