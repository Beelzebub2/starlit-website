import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  summarize, toFeed, validateFeed, plain, firstSentence, readSnapshot,
  fetchFeed, TAG_URL, APP_REPO, LEGACY_APP_REPO, SHOWN
} from '../tools/releases.mjs';

const asset = name => ({ name });
const release = (version, body, extra = {}) => ({
  tag_name: 'v' + version, draft: false, prerelease: false, published_at: '2026-11-09T04:08:59Z',
  html_url: TAG_URL + 'v' + version, body,
  assets: [asset('SHA256SUMS.txt'), asset(`Starlit-Android-arm64-v8a-${version}.apk`),
    asset(`Starlit-Android-x86_64-${version}.apk`), asset(`Starlit-Windows-x64-${version}.exe`)],
  ...extra,
});

// Shaped like the app's real release notes.
const BODY = `## Starlit 1.14.1

### More reliable phone-to-PC control

- **Keep controlling the PC after leaving the remote screen:** While a phone is connected, Android keeps the session. Disconnecting ends the service.
- **Keep the PC awake:** Windows prevents [automatic sleep](https://example.com/x) only during a session.

### Bluetooth and volume corrections

- **Only show current nearby Bluetooth PCs:** Android expires stale scan results for x86_64 and \`arm64-v8a\` builds.

### Validation and limitations

- Includes merged remote-control fixes [#174](https://github.com/Beelzebub2/nuvio-native/pull/174).

<!-- Release notes generated using configuration in .github/release.yml at v1.14.1 -->

## What's Changed
### Fixes
* fix(remote): something by @Beelzebub2 in https://github.com/Beelzebub2/nuvio-native/pull/174
`;

test('A release note becomes a headline, a summary and three highlights', () => {
  const r = summarize(release('1.14.1', BODY));
  assert.equal(r.version, '1.14.1');
  assert.equal(r.date, '2026-11-09');
  assert.equal(r.url, TAG_URL + 'v1.14.1');
  assert.equal(r.headline, 'More reliable phone-to-PC control');
  assert.equal(r.summary, 'More reliable phone-to-PC control · Bluetooth and volume corrections');
  // One highlight from each section first, then the rest in order.
  assert.deepEqual(r.highlights.map(h => h.title), ['Keep controlling the PC after leaving the remote screen',
    'Only show current nearby Bluetooth PCs', 'Keep the PC awake']);
  assert.equal(r.highlights[0].text, 'While a phone is connected, Android keeps the session.');
  assert.equal(r.highlights[1].text, 'Android expires stale scan results for x86_64 and arm64-v8a builds.');
  assert.equal(r.highlights[2].text, 'Windows prevents automatic sleep only during a session.');
  assert.deepEqual(r.files, { windows: 'Starlit-Windows-x64-1.14.1.exe', android: 'Starlit-Android-arm64-v8a-1.14.1.apk' });
  // Neither the validation section nor the generated PR list is shown.
  assert.doesNotMatch(JSON.stringify(r), /Validation|#174|What.s Changed|fix\(remote\)/);
});

test('Drafts, pre-releases and odd tags are skipped; the feed is newest first', () => {
  assert.equal(summarize(release('1.0.0', BODY, { draft: true })), null);
  assert.equal(summarize(release('1.0.0', BODY, { prerelease: true })), null);
  assert.equal(summarize({ ...release('1.0.0', BODY), tag_name: 'nightly' }), null);
  const list = ['1.9.0', '1.10.0', '1.12.3', '1.12.10', '1.11.1', '1.8.0', '1.7.0'].map(v => release(v, BODY));
  const feed = toFeed(list);
  assert.deepEqual(feed.releases.map(r => r.version), ['1.12.10', '1.12.3', '1.11.1', '1.10.0', '1.9.0']);
  assert.equal(feed.releases.length, SHOWN);
});

test('Notes without bold titles or sections still produce valid data', () => {
  const r = summarize(release('2.0.0', '### Fixes\n- Fixed a crash on start. More details here.\n'));
  assert.equal(r.headline, 'Fixes');
  assert.deepEqual(r.highlights, [{ title: 'Fixed a crash on start.', text: '' }]);
  const empty = summarize(release('2.0.1', ''));
  assert.equal(empty.headline, 'Starlit 2.0.1');
  assert.deepEqual(empty.highlights, []);
  assert.doesNotThrow(() => validateFeed({ releases: [empty, r] }));
});

test('Markdown and markup become plain text', () => {
  assert.equal(plain('**Bold** and __strong__, *em*, `code` and [a link](https://x.y)'), 'Bold and strong, em, code and a link');
  assert.equal(plain('<img src=x onerror=alert(1)>Hi <b>there</b>'), 'Hi there');
  assert.equal(plain('Keeps x86_64 and snake_case'), 'Keeps x86_64 and snake_case');
  assert.equal(firstSentence('One. Two.'), 'One.');
  assert.ok(firstSentence('word '.repeat(80)).length <= 201);
});

test('Invalid feeds are refused', () => {
  const good = toFeed([release('1.14.1', BODY), release('1.14.0', BODY)]);
  const broken = mutate => { const copy = structuredClone(good); mutate(copy); return () => validateFeed(copy); };
  assert.doesNotThrow(broken(() => {}));
  assert.throws(broken(f => { f.releases = []; }));
  assert.throws(broken(f => { f.releases.reverse(); }), /order/);
  assert.throws(broken(f => { f.releases[0].url = 'https://evil.example/releases/tag/v1.14.1'; }), /url/);
  assert.throws(broken(f => { f.releases[0].url = 'javascript:alert(1)'; }), /url/);
  assert.throws(broken(f => { f.releases[0].files.windows = 'evil.exe'; }), /windows file/);
  assert.throws(broken(f => { f.releases[0].files.android = 'Starlit-Android-arm64-v8a-1.0.0.apk'; }), /android file/);
  assert.throws(broken(f => { f.releases[0].headline = 'x'.repeat(161); }), /headline/);
  assert.throws(broken(f => { f.releases[0].highlights.push({ title: 'a' }, { title: 'b' }); }), /highlights/);
  assert.throws(broken(f => { f.releases[0].version = 'v1.14.1'; }), /version/);
});

test('Both repository names validate, but arbitrary release hosts and repos do not', () => {
  const oldFeed = toFeed([release('1.14.1', BODY)], LEGACY_APP_REPO);
  const newFeed = toFeed([release('1.14.1', BODY)], APP_REPO);
  assert.equal(oldFeed.releases[0].url, 'https://github.com/Beelzebub2/nuvio-native/releases/tag/v1.14.1');
  assert.equal(newFeed.releases[0].url,
    TAG_URL + 'v1.14.1');
  assert.doesNotThrow(() => validateFeed(oldFeed));
  assert.doesNotThrow(() => validateFeed(newFeed));
  assert.throws(() => toFeed([release('1.14.1', BODY)], 'attacker/repo'), /Untrusted/);
  assert.throws(() => validateFeed({ ...newFeed, source: 'https://evil.example/releases' }), /source/);
});

test('Release feed prefers the canonical repository and falls back only to the legacy path', async () => {
  const payload = [release('1.14.1', BODY)];
  for (const newStatus of [301, 308, 404]) {
    const requests = [];
    const result = await fetchFeed({
      etag: '"before-rename"',
      fetchImpl: async (url, options) => {
        requests.push([url, options.redirect, options.headers['If-None-Match']]);
        if (url.includes('/starlit/')) return { ok: false, status: newStatus };
        return { ok: true, status: 200, headers: { get: () => '"new-etag"' }, json: async () => payload };
      }
    });
    assert.deepEqual(requests, [
      ['https://api.github.com/repos/Beelzebub2/starlit/releases?per_page=15', 'manual', '"before-rename"'],
      ['https://api.github.com/repos/Beelzebub2/nuvio-native/releases?per_page=15', 'manual', undefined]
    ]);
    assert.equal(result.etag, '"new-etag"');
    assert.equal(result.feed.source, 'https://github.com/Beelzebub2/nuvio-native/releases');
    assert.match(result.feed.releases[0].url, /\/nuvio-native\/releases\/tag\/v1\.14\.1$/);
  }
});

test('Release API permission and rate-limit failures do not trigger fallback', async () => {
  for (const status of [401, 403, 429, 500]) {
    let calls = 0;
    await assert.rejects(fetchFeed({
      fetchImpl: async () => { calls++; return { ok: false, status }; }
    }), new RegExp(`HTTP ${status}`));
    assert.equal(calls, 1);
  }
});

test('The committed snapshot is valid', () => {
  const feed = readSnapshot();
  assert.ok(feed.releases.length >= 3, 'Home shows three releases');
  for (const r of feed.releases) assert.ok(r.highlights.length >= 1, 'No highlights for ' + r.version);
});

test('site.js only writes text, only talks to this origin and validates the feed', () => {
  const js = readFileSync(new URL('../assets/site.js', import.meta.url), 'utf8');
  const code = js.replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(code, /innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function|setTimeout\(['"`]/);
  assert.doesNotMatch(code, /https?:\/\/(?!github\.com\/Beelzebub2\/(?:nuvio-native|starlit)\/releases(?:\/tag\/v)?')/, 'Only allowlisted GitHub release URLs may appear');
  assert.doesNotMatch(code, /localStorage|document\.cookie|navigator\.sendBeacon/);
  for (const [, url] of code.matchAll(/fetch\(([^,)]+)/g)) {
    assert.match(url.trim(), /^(key|'\/releases\.json')$/, 'Unexpected fetch target ' + url);
  }
  // The page URL is checked before any fetch or swap, and /account stays a normal navigation.
  assert.match(code, /url\.origin !== location\.origin/);
  assert.match(code, /!url\.pathname\.endsWith\('\/'\)/);
  assert.match(code, /url\.pathname\.startsWith\('\/account\/'\)/);
  // Feed limits match tools/releases.mjs.
  assert.match(code, /list\.length > 5/);
  assert.match(code, /isText\(r\.headline, 160\)/);
  assert.match(code, /prefers-reduced-motion: reduce/);
});
