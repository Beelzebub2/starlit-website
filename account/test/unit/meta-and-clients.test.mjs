import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anilistIdOf, addonBase, createMeta, peekMeta, resetMetaCache, servesMeta } from '../../src/lib/meta.js';
import { appName, describeClient, groupInstallations, groupSessions } from '../../src/lib/clients.js';

const json = body => ({ ok: true, json: async () => body });
const missing = { ok: false, json: async () => ({}) };

test('anime ids give their AniList id', () => {
  assert.equal(anilistIdOf('airingnow:180136'), 180136);
  assert.equal(anilistIdOf('nativeairing:21'), 21);
  assert.equal(anilistIdOf('airingnowp:c55e014554854c32b8f259f481389fbf:r3:196218'), 196218);
  assert.equal(anilistIdOf('tt10986410'), null);
  assert.equal(anilistIdOf('kitsu:12'), null);
});

test('manifests match meta by resource, type and id prefix', () => {
  const m = { types: ['anime'], resources: ['catalog', { name: 'meta', types: ['anime'], idPrefixes: ['airingnow:'] }] };
  assert.equal(servesMeta(m, 'anime', 'airingnow:1'), 'anime');
  assert.equal(servesMeta(m, 'series', 'airingnow:1'), 'anime');
  assert.equal(servesMeta(m, 'anime', 'tt1'), null);
  assert.equal(servesMeta({ types: ['movie'], idPrefixes: ['tt'], resources: ['meta'] }, 'movie', 'tt1'), 'movie');
  assert.equal(servesMeta({ resources: ['stream'] }, 'movie', 'tt1'), null);
  assert.equal(addonBase('https://a.example/conf/manifest.json'), 'https://a.example/conf');
});

test('IMDb titles come from Cinemeta, and are remembered', async () => {
  resetMetaCache();
  const calls = [];
  const meta = createMeta({ fetch: async url => { calls.push(url); return json({ meta: { name: 'Ted Lasso', poster: 'https://img.example/p.jpg', background: 'http://insecure.example/b.jpg' } }); } });
  const found = await meta.resolve({ content_id: 'tt10986410', content_type: 'series' });
  assert.deepEqual(found, { name: 'Ted Lasso', poster: 'https://img.example/p.jpg', background: null });
  assert.equal(calls[0], 'https://v3-cinemeta.strem.io/meta/series/tt10986410.json');
  await meta.resolve({ content_id: 'tt10986410', content_type: 'series' });
  assert.equal(calls.length, 1, 'second lookup is cached');
  assert.equal(peekMeta('tt10986410').name, 'Ted Lasso');
});

test('anime titles come from the Starlit gateway', async () => {
  resetMetaCache();
  const calls = [];
  const meta = createMeta({ gatewayUrl: 'https://api.example.test', fetch: async url => {
    calls.push(url);
    return json({ data: { Media: { title: { english: null, romaji: 'Tensei' }, coverImage: { large: 'https://img.example/c.jpg' }, bannerImage: null } } });
  } });
  const found = await meta.resolve({ content_id: 'airingnowp:abc:r6:178789', content_type: 'anime' });
  assert.equal(found.name, 'Tensei');
  assert.equal(found.poster, 'https://img.example/c.jpg');
  assert.deepEqual(calls, ['https://api.example.test/gateway/media?id=178789']);
});

test('other ids ask the profile addons that serve them; addon names come from manifests', async () => {
  resetMetaCache();
  const calls = [];
  const manifestUrl = 'https://addon.example/secret-config/manifest.json';
  const meta = createMeta({
    addons: async () => [{ url: 'https://off.example/manifest.json', enabled: false }, { url: manifestUrl }],
    fetch: async url => {
      calls.push(url);
      if (url === manifestUrl) return json({ name: 'Example', logo: 'https://addon.example/logo.png', types: ['series'], idPrefixes: ['ex:'], resources: ['meta'] });
      if (url === 'https://addon.example/secret-config/meta/series/ex%3A42.json') return json({ meta: { name: 'Answer', poster: 'https://addon.example/p.jpg' } });
      return missing;
    },
  });
  const found = await meta.resolve({ content_id: 'ex:42', content_type: 'series' });
  assert.equal(found.name, 'Answer');
  assert.ok(!calls.some(u => u.startsWith('https://off.example')), 'disabled addons are not asked');
  assert.deepEqual(await meta.addonInfo(manifestUrl), { name: 'Example', logo: 'https://addon.example/logo.png', description: null });
  assert.equal(calls.filter(u => u === manifestUrl).length, 1, 'manifest fetched once');
  assert.equal(await meta.addonInfo('http://plain.example/manifest.json'), null, 'never plain http');
  assert.ok(!JSON.stringify(globalThis.sessionStorage ?? {}).includes('secret-config'));
});

test('a title nobody knows resolves to null without throwing', async () => {
  resetMetaCache();
  const meta = createMeta({ fetch: async () => { throw new Error('offline'); } });
  assert.equal(await meta.resolve({ content_id: 'tt1', content_type: 'movie' }), null);
  assert.equal(await meta.resolve({}), null);
});

test('user agents name the client', () => {
  assert.deepEqual(describeClient('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36'),
    { key: 'browser:Chrome:Windows', kind: 'browser', browser: 'Chrome', os: 'Windows' });
  assert.equal(describeClient('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0').browser, 'Edge');
  assert.equal(describeClient('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:160.0) Gecko/20100101 Firefox/160.0').browser, 'Firefox');
  assert.equal(describeClient('NuvioMobile/1.6.0').kind, 'app');
  assert.equal(describeClient('NuvioMobile/0.5.6').key, describeClient('NuvioMobile/1.7.4').key, 'app updates stay one device');
  assert.equal(describeClient('ktor-client').kind, 'app');
  assert.deepEqual(describeClient('Mozilla/5.0 (SMART-TV; LINUX; Tizen 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/5.0 TV Safari/537.36'), { key: 'tv:samsung', kind: 'tv', brand: 'Samsung' });
  assert.equal(describeClient('node').kind, 'tool');
  assert.equal(describeClient('Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26300; en-US) PowerShell/7.6.5').kind, 'tool');
  assert.equal(describeClient(null).kind, 'unknown');
});

test('sessions group by client, this browser first, newest activity next', () => {
  const chrome = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36';
  const groups = groupSessions([
    { session_id: 'a', user_agent: 'NuvioMobile/1.6.0', signed_in_at: '2026-11-20T10:00:00Z', last_active_at: '2026-11-21T10:00:00Z' },
    { session_id: 'b', user_agent: chrome, signed_in_at: '2026-11-01T10:00:00Z', last_active_at: '2026-11-02T10:00:00Z' },
    { session_id: 'c', user_agent: chrome, signed_in_at: '2026-11-19T10:00:00Z', is_current: true },
    { session_id: 'd', user_agent: 'NuvioMobile/0.5.6', signed_in_at: '2026-10-01T10:00:00Z' },
    { session_id: 'e', user_agent: 'node', signed_in_at: '2026-11-10T10:00:00Z' },
  ]);
  assert.deepEqual(groups.map(g => [g.client.key, g.sessions.length, g.current]),
    [['browser:Chrome:Windows', 2, true], ['app:', 2, false], ['tool', 1, false]]);
});

test('installations group by device, newest sync shown; the old app name reads Starlit', () => {
  const rows = groupInstallations([
    { device_name: 'LISBOAKART', platform: 'Windows 11 10.0', updated_at: '2026-11-17T10:00:00Z', client_version: '0.5.5' },
    { device_name: 'phone', platform: 'Android 17', updated_at: '2026-11-20T10:00:00Z' },
    { device_name: 'lisboakart', platform: 'Windows 11 10.0', updated_at: '2026-11-20T12:00:00Z', client_version: '0.5.6' },
    { device_name: '', platform: 'Linux', updated_at: '2026-11-01T10:00:00Z', installation_id: 'x' },
    { device_name: '', platform: 'Linux', updated_at: '2026-11-02T10:00:00Z', installation_id: 'y' },
  ]);
  assert.deepEqual(rows.map(r => [r.latest.device_name, r.count, r.latest.client_version ?? null]),
    [['lisboakart', 2, '0.5.6'], ['phone', 1, null], ['', 1, null], ['', 1, null]]);
  assert.equal(appName('Nuvio Mobile'), 'Starlit');
  assert.equal(appName(null), 'Starlit');
  assert.equal(appName('Starlit Desktop'), 'Starlit Desktop');
});
