import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLIC_CSP } from '../constants.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const jwt = ['e30', Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url'), 'signature'].join('.');

test('one immutable release contains the real marketing site and a nested read-only account app', () => {
  const temp = mkdtempSync(join(tmpdir(), 'starlit-combined-test-'));
  const out = join(temp, 'release');
  try {
    const build = spawnSync(process.execPath, ['deploy/vps/build-combined.mjs'], {
      cwd: root, encoding: 'utf8', env: {
        ...process.env, STARLIT_ANON_KEY: jwt, STARLIT_COMBINED_OUT: out,
        STARLIT_ACCOUNT_WRITES: '0', STARLIT_API_URL: 'https://starlit-api.rrmtools.uk',
      },
    });
    assert.equal(build.status, 0, build.stderr);
    for (const file of ['index.html', 'pt/index.html', 'remote/index.html', 'download/index.html',
      'privacy/index.html', 'assets/site.css', 'account/index.html', 'account/config.js',
      'account/app.js', 'account/styles/account.css', 'account/fonts/geist-latin.woff2']) {
      assert.ok(existsSync(join(out, file)), 'Missing combined file: ' + file);
    }
    assert.match(read(join(out, 'index.html')), /href="\/account\?tab=overview"/);
    assert.match(read(join(out, 'pt/index.html')), /A minha conta/);
    assert.match(read(join(out, 'pt/index.html')), /href="\/account\?tab=overview"/);
    assert.match(read(join(out, 'account', 'config.js')), /"basePath": "\/account\/"/);
    assert.match(read(join(out, 'account', 'config.js')), /"writesEnabled": false/);
    assert.doesNotMatch(read(join(out, 'account', 'config.js')), /service_role/);
    assert.doesNotMatch(read(join(out, 'account', 'index.html')), /src="\/app\.js"/);
    assert.match(read(join(out, 'account', 'index.html')), /src="\/account\/app\.js"/);
    assert.ok(read(join(out, '_headers')).includes('Content-Security-Policy: ' + PUBLIC_CSP));
    assert.doesNotMatch(read(join(out, '_headers')), /starlit-api|unsafe-/);
    assert.match(read(join(out, 'account', '_headers')), /script-src 'self'/);
    assert.match(read(join(out, 'account', '_headers')), /connect-src 'self' https:\/\/starlit-api\.rrmtools\.uk/);
    for (const file of ['assets/site.js', 'releases.json']) assert.ok(existsSync(join(out, file)), 'Missing ' + file);
    // The account app is a separate document: site.js never swaps it in.
    assert.doesNotMatch(read(join(out, 'account', 'index.html')), /\/assets\/site\.js/);
    assert.ok(!existsSync(join(out, 'account', 'mock')));
    assert.ok(!existsSync(join(out, 'account', '404.html')));
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test('combined deployment keeps ports closed and separate per-path CSPs', () => {
  const caddy = read(join(root, 'deploy', 'vps', 'Caddyfile'));
  const compose = read(join(root, 'deploy', 'vps', 'compose.yml'));
  const install = read(join(root, 'deploy', 'vps', 'install-release.sh'));
  assert.match(compose, /user: "10001:10001"/);
  assert.match(compose, /read_only: true/);
  assert.match(compose, /cap_drop: \[ALL\]/);
  assert.match(compose, /no-new-privileges:true/);
  assert.doesNotMatch(compose, /^\s+ports:/m);
  assert.match(caddy, /route \{\s*# [^\n]*\n\s*respond @private 404/);
  assert.match(caddy, /@account path \/account\/\*/);
  assert.match(caddy, /@accountRoot path \/account/);
  assert.match(caddy, /rewrite @accountRoot \/account\/index\.html/);
  assert.match(caddy, /script-src 'self'/);
  // Public pages: exactly the policy the build writes, from one snippet.
  assert.ok(caddy.includes(`Content-Security-Policy "${PUBLIC_CSP}"`), 'Caddy public CSP differs from constants.mjs');
  assert.equal([...caddy.matchAll(/import public_headers/g)].length, 2);
  assert.doesNotMatch(caddy, /script-src 'none'/);
  // /releases.json prefers the release-feed copy and falls back to the build's.
  assert.match(caddy, /@releaseFeed \{\s*path \/releases\.json\s*file \{\s*root \/srv\/release-feed\s*try_files \/releases\.json/);
  assert.ok(caddy.indexOf('respond @private 404') < caddy.indexOf('handle @releaseFeed'));
  // The release-feed refresher: unprivileged, read-only, no ports, not on the edge network.
  const feed = compose.slice(compose.indexOf('  release-feed:'), compose.indexOf('\nnetworks:'));
  assert.match(feed, /image: node:\d+\.\d+\.\d+-alpine\d/);
  assert.match(feed, /user: "10001:10001"/);
  assert.match(feed, /read_only: true/);
  assert.match(feed, /cap_drop: \[ALL\]/);
  assert.match(feed, /no-new-privileges:true/);
  assert.match(feed, /- \.\/release-feed-tool:\/app:ro/);
  assert.match(feed, /--watch", "900"/);
  assert.doesNotMatch(feed, /edge|ports:|environment:|cap_add/);
  assert.match(compose, /- \.\/release-feed:\/srv\/release-feed:ro/);
  assert.ok(install.includes(`public_csp="Content-Security-Policy: ${PUBLIC_CSP}"`), 'install-release.sh checks the exact public CSP');
  assert.match(install, /Marketing CSP too broad/);
  assert.match(caddy, /@accountFonts path \/account\/fonts\/\*/);
  assert.match(caddy, /try_files \{path\} \/account\/index\.html/);
  assert.match(caddy, /try_files \{path\} \{path\}\/index\.html/);
  assert.match(install, /"basePath": "\/account\/"/);
  assert.match(install, /"writesEnabled": false/);
  assert.match(install, /Mock account code detected/);
});
