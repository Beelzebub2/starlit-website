// Pure logic: collection rules (parity with the Starlit client's import
// validation plus stricter checks), conflict merging, settings handling and
// secret redaction.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TMDB_PRESETS, fromTemplate, normalize, parseImport, parseTmdbId, parseTraktListId, stats, validate } from '../../src/lib/collections.js';
import { mergeLists, mergeObjects } from '../../src/lib/merge.js';
import { classify, sections, withValue, withoutCredentials, changedPaths } from '../../src/lib/settings.js';
import { isCredentialKey, redactUrl, scrubText } from '../../src/lib/redact.js';
import { formatClock, parseClock } from '../../src/lib/format.js';

const codes = list => validate(list).filter(i => i.level === 'error').map(i => i.code);
const good = () => [{ id: 'c1', title: 'Weekend', viewMode: 'ROWS', folders: [{ id: 'f1', title: 'Shows', sources: [{ provider: 'tmdb', tmdbSourceType: 'NETWORK', tmdbId: 213, mediaType: 'TV', sortBy: 'popularity.desc' }] }] }];

test('client import rules: ids, titles, duplicates, Trakt id, blank source fields', () => {
  assert.deepEqual(codes(good()), []);
  const c = good();
  c.push({ ...structuredClone(c[0]) });
  assert.ok(codes(c).includes('collection-duplicate'));
  assert.ok(codes([{ id: ' ', title: 'x', folders: [] }]).includes('collection-id'));
  assert.ok(codes([{ id: 'a', title: '', folders: [] }]).includes('collection-title'));
  assert.ok(codes([{ id: 'a', title: 't', folders: [{ id: 'f', title: '' }] }]).includes('folder-title'));
  assert.ok(codes([{ id: 'a', title: 't', folders: [{ id: 'f', title: 'x' }, { id: 'f', title: 'y' }] }]).includes('folder-duplicate'));
  assert.ok(codes([{ id: 'a', title: 't', folders: [{ id: 'f', title: 'x', sources: [{ provider: 'trakt', traktListId: 0 }] }] }]).includes('trakt-id'));
  assert.ok(codes([{ id: 'a', title: 't', folders: [{ id: 'f', title: 'x', sources: [{ provider: 'addon', addonId: 'a', type: '' , catalogId: 'c' }] }] }]).includes('addon-field'));
  assert.ok(codes([{ id: 'a', title: 't', folders: [{ id: 'f', title: 'x', sources: [{ provider: 'tmdb' }] }] }]).includes('tmdb-type'));
});

test('stricter checks the server cannot do: TMDB ids, types, https artwork, size', () => {
  const noId = good(); delete noId[0].folders[0].sources[0].tmdbId;
  assert.ok(codes(noId).includes('tmdb-id'));
  const discover = good(); discover[0].folders[0].sources[0] = { provider: 'tmdb', tmdbSourceType: 'DISCOVER', filters: { year: 1700 } };
  assert.deepEqual(codes(discover), ['tmdb-year']);
  const http = good(); http[0].backdropImageUrl = 'http://images.example.test/a.jpg';
  assert.ok(codes(http).includes('https'));
  const typo = good(); typo[0].folders[0].sources[0].tmdbSourceType = 'STUDIO';
  assert.ok(codes(typo).includes('tmdb-type'));
  const huge = [{ id: 'x', title: 'x'.repeat(1100000), folders: [] }];
  assert.ok(codes(huge).includes('too-large'));
  const legacy = [{ id: 'a', title: 't', folders: [{ id: 'f', title: 'x', catalogSources: [{ addonId: 'a', type: 'movie', catalogId: 'top' }] }] }];
  assert.deepEqual(codes(legacy), []);
});

test('templates and presets produce valid, editable collections', () => {
  assert.equal(TMDB_PRESETS.length, 11);
  const preset = fromTemplate({ kind: 'preset', preset: TMDB_PRESETS[0] });
  assert.deepEqual(codes([preset]), []);
  assert.equal(preset.folders[0].sources[0].tmdbId, 420);
  const blank = fromTemplate({ kind: 'blank' });
  assert.deepEqual(codes([blank]).sort(), ['collection-title', 'folder-title']);
  assert.notEqual(fromTemplate({ kind: 'blank' }).id, blank.id);
});

test('normalize keeps unknown fields and turns blanks into null', () => {
  const list = good();
  list[0].folders[0].focusGifEnabled = true;
  list[0].futureField = { x: 1 };
  list[0].folders[0].coverEmoji = '';
  list[0].folders[0].sources[0].title = '';
  const out = normalize(list);
  assert.equal(out[0].folders[0].focusGifEnabled, true);
  assert.deepEqual(out[0].futureField, { x: 1 });
  assert.equal(out[0].folders[0].coverEmoji, null);
  assert.equal(out[0].folders[0].sources[0].title, null);
  assert.deepEqual(stats(out), { collections: 1, folders: 1, sources: 1 });
});

test('id parsing and import parsing', () => {
  assert.equal(parseTmdbId('https://www.themoviedb.org/company/420-marvel'), 420);
  assert.equal(parseTmdbId(' 213 '), 213);
  assert.equal(parseTmdbId('not an id'), null);
  assert.equal(parseTraktListId('12345'), 12345);
  assert.equal(parseTraktListId('my-list-slug'), null);
  assert.throws(() => parseImport(''), /import-empty/);
  assert.throws(() => parseImport('{'), /import-json/);
  assert.throws(() => parseImport('{"a":1}'), /import-array/);
});

test('list merge re-applies your edits and keeps the other device’s', () => {
  const base = [{ url: 'a', enabled: true }, { url: 'b', enabled: true }, { url: 'c', enabled: true }];
  const mine = [{ url: 'c', enabled: true }, { url: 'a', enabled: false }, { url: 'new', enabled: true }];   // removed b, reordered, disabled a, added new
  const theirs = [{ url: 'a', enabled: true }, { url: 'b', enabled: false }, { url: 'c', enabled: true }, { url: 'x', enabled: true }];
  const { items, conflicts, summary } = mergeLists({ base, mine, theirs, key: i => i.url });
  assert.deepEqual(items.map(i => i.url), ['c', 'a', 'new', 'x']);
  assert.equal(items.find(i => i.url === 'a').enabled, false);
  assert.equal(conflicts.length, 0);
  assert.deepEqual([summary.removed, summary.added, summary.changed, summary.incoming], [1, 1, 1, 1]);
  const both = mergeLists({ base, mine: [{ url: 'a', enabled: false }], theirs: [{ url: 'a', enabled: true, name: 'renamed' }], key: i => i.url });
  assert.equal(both.conflicts.length, 1);
  assert.equal(both.items[0].name, 'renamed');   // other device kept until you choose
});

test('object merge keeps unknown keys and reports true conflicts', () => {
  const base = { v: 4, features: { a: 1, b: 2, keep: { x: true } } };
  const mine = { v: 4, features: { a: 10, b: 2, keep: { x: true } } };
  const theirs = { v: 4, features: { a: 1, b: 20, keep: { x: true }, added: 'new' } };
  assert.deepEqual(mergeObjects(base, mine, theirs), { value: { v: 4, features: { a: 10, b: 20, keep: { x: true }, added: 'new' } }, conflicts: [] });
  const clash = mergeObjects(base, { ...mine, features: { ...mine.features, b: 3 } }, theirs);
  assert.equal(clash.conflicts.length, 1);
  assert.deepEqual(clash.conflicts[0].path, ['features', 'b']);
  assert.equal(clash.value.features.b, 20);
});

test('settings: device values read-only, credentials hidden and never edited', () => {
  assert.equal(classify(['download_settings', 'download_folder'], '/x'), 'device');
  assert.equal(classify(['features', 'player_settings', 'hardware_decoding'], true), 'device');
  assert.equal(classify(['features', 'tmdb_settings', 'tmdb_api_key'], 'k'), 'credential');
  assert.equal(classify(['features', 'poster_card_style_settings_payload'], '{"a":1}'), 'opaque');
  assert.equal(classify(['version'], 4), 'meta');
  assert.equal(classify(['features', 'player_settings', 'subtitle_size'], 22), 'editable');
  assert.equal(classify(['features', 'debrid_settings', 'prefer_cached'], true), 'editable');
  assert.equal(classify(['features', 'player', 'cache_size_mb'], 64), 'device');
  const blob = { features: { player_settings: { subtitle_size: 22, introdb_api_key: 'secret' } } };
  const { hiddenCredentials, groups } = sections(blob);
  assert.equal(hiddenCredentials, 1);
  assert.ok(groups.every(g => g.items.every(i => !String(i.path.at(-1)).includes('api_key'))));
  assert.throws(() => withValue(blob, ['features', 'player_settings', 'introdb_api_key'], 'x'), /credential-path/);
  assert.deepEqual(withoutCredentials(blob), { features: { player_settings: { subtitle_size: 22 } } });
  const edited = withValue(blob, ['features', 'player_settings', 'subtitle_size'], 30);
  assert.equal(blob.features.player_settings.subtitle_size, 22, 'original untouched');
  assert.deepEqual(changedPaths(blob, edited), [['features', 'player_settings', 'subtitle_size']]);
  assert.equal(isCredentialKey('refresh_rate'), false);
  assert.equal(isCredentialKey('trakt_access_token'), true);
});

test('addon addresses and error text never show secrets', () => {
  const r = redactUrl('https://streams.example.test/conf/SYNTHETIC-not-a-real-key-3f9a7c/manifest.json');
  assert.equal(r.display, 'https://streams.example.test/…/manifest.json');
  assert.equal(r.hidden, true);
  assert.deepEqual(redactUrl('https://catalog.example.test/manifest.json'), { display: 'https://catalog.example.test/manifest.json', hidden: false });
  assert.equal(redactUrl('https://u:p@h.example.test/manifest.json?token=1').display, 'https://h.example.test/manifest.json');
  assert.equal(redactUrl('https://h.example.test/eyJhbGciOiJIUzI1NiJ9abcdefghijklmnop').display, 'https://h.example.test/…');
  const text = scrubText('Failed for https://x.example.test/key=abc/manifest.json with Bearer abc.def.ghi and eyJa.eyJb.c');
  assert.ok(!text.includes('key=abc') && !text.includes('abc.def.ghi') && !text.includes('eyJa.eyJb'));
});

test('resume point times', () => {
  assert.equal(formatClock(3723000), '1:02:03');
  assert.equal(formatClock(61000), '1:01');
  assert.equal(parseClock('1:02:03'), 3723000);
  assert.equal(parseClock('42:10'), 2530000);
  assert.equal(parseClock('90'), 90000);
  assert.equal(parseClock('1:75'), null);
  assert.equal(parseClock('abc'), null);
});
