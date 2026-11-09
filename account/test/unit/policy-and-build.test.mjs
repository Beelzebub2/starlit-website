// Source and build policies: no HTML injection sinks, no persistent token
// storage, no logging, complete EN/PT copy, no reference screenshots or other
// brands in the app, a strict CSP, and live builds that refuse service keys
// and never ship the mock API. Also guards the public website's CSP.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { STRINGS } from '../../src/lib/strings.js';
import { TEST_ACCOUNTS } from '../../src/mock/fixtures.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const src = join(root, 'src');
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
const files = walk(src).filter(f => f.endsWith('.js'));
const read = f => readFileSync(f, 'utf8');
const code = f => read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

test('no HTML string sinks, eval or console logging in the app', () => {
  for (const f of files) {
    const text = read(f);
    for (const bad of [/\.innerHTML\s*=/, /\.outerHTML\s*=/, /insertAdjacentHTML/, /document\.write/, /\beval\(/, /new Function\(/, /console\.(log|info|warn|error|debug)/]) {
      assert.ok(!bad.test(text), `${relative(root, f)} uses ${bad}`);
    }
  }
});

test('tokens never go to persistent storage', () => {
  for (const f of files) {
    const text = code(f);
    const name = relative(src, f).replace(/\\/g, '/');
    if (/localStorage/.test(text)) assert.equal(name, 'lib/state.js', `${name} touches localStorage`);
    if (/sessionStorage/.test(text)) assert.equal(name, 'lib/auth.js', `${name} touches sessionStorage`);
    assert.ok(!/document\.cookie/.test(text), `${name} touches cookies`);
  }
  const auth = read(join(src, 'lib', 'auth.js'));
  assert.match(auth, /sessionStorage\.setItem\(VERIFIER_KEY/);
  assert.ok(!/(local|session)Storage\.setItem\([^)]*(access|refresh|token)/i.test(auth));
});

test('every interface string exists in English and Portuguese', () => {
  const en = Object.keys(STRINGS.en).sort(), pt = Object.keys(STRINGS.pt).sort();
  assert.deepEqual(pt.filter(k => !en.includes(k)), [], 'keys only in pt');
  assert.deepEqual(en.filter(k => !pt.includes(k)), [], 'keys only in en');
  const used = new Set();
  for (const f of files) for (const m of read(f).matchAll(/\bt\('([a-zA-Z0-9_.-]+)'/g)) used.add(m[1]);
  used.delete('key');
  const missing = [...used].filter(k => !(k in STRINGS.en));
  assert.deepEqual(missing, []);
});

test('no reference screenshots, other brands or images beyond the Starlit mark', () => {
  const all = walk(root).filter(f => !f.includes('node_modules') && !f.includes(`${join('test-results')}`) && !f.includes('playwright-report'));
  for (const f of all) {
    const rel = relative(root, f);
    assert.ok(!/nuvio/i.test(rel), `${rel} looks like reference material`);
    if (rel.startsWith('docs')) continue;   // documentation screenshots are synthetic captures of this app
    assert.ok(!/\.(jpe?g|png|gif|webp)$/i.test(rel), `${rel}: the app ships no raster images`);
  }
  for (const f of files) assert.ok(!/nuvio/i.test(read(f).replace(/\/\/.*$/gm, '')), `${relative(root, f)} mentions another product outside comments`);
});

function build(env, outName) {
  const out = mkdtempSync(join(tmpdir(), `starlit-account-${outName}-`));
  const result = spawnSync(process.execPath, ['build.mjs'], { cwd: root, encoding: 'utf8', env: { ...process.env, STARLIT_ACCOUNT_OUT: out, ...env } });
  return { out, ...result };
}
const jwt = claims => ['e30', Buffer.from(JSON.stringify(claims)).toString('base64url'), 'sig'].join('.');

test('mock build: strict CSP, single-page routing, mock API present', () => {
  const { out, status } = build({ STARLIT_ACCOUNT_MODE: 'mock' }, 'mock');
  try {
    assert.equal(status, 0);
    const headers = readFileSync(join(out, '_headers'), 'utf8');
    const csp = headers.match(/Content-Security-Policy: (.*)/)[1];
    for (const rule of ["default-src 'none'", "script-src 'self'", "style-src 'self'", "connect-src 'self'", "frame-ancestors 'none'", "form-action 'none'", "base-uri 'none'", "object-src 'none'"]) assert.ok(csp.includes(rule), rule);
    assert.ok(!/unsafe-inline|unsafe-eval/.test(csp));
    assert.match(headers, /Referrer-Policy: no-referrer/);
    assert.match(headers, /X-Robots-Tag: noindex/);
    assert.ok(existsSync(join(out, 'mock', 'transport.js')));
    assert.ok(!existsSync(join(out, '404.html')));
    assert.match(readFileSync(join(out, 'config.js'), 'utf8'), /"mode": "mock"/);
    assert.ok(existsSync(join(out, 'fonts', 'OFL-Geist.txt')), 'font licences ship with the fonts');
    for (const f of walk(out).filter(x => x.endsWith('.html'))) assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(readFileSync(f, 'utf8')), 'no inline scripts');
  } finally { rmSync(out, { recursive: true, force: true }); }
});

test('live build: no mock code, API origin in connect-src, read-only by default', () => {
  const { out, status, stderr } = build({ STARLIT_ACCOUNT_MODE: 'live', STARLIT_ANON_KEY: jwt({ role: 'anon' }), STARLIT_API_URL: 'https://api.example.test' }, 'live');
  try {
    assert.equal(status, 0, stderr);
    assert.ok(!existsSync(join(out, 'mock')), 'mock API must not ship');
    for (const account of Object.values(TEST_ACCOUNTS)) assert.ok(!walk(out).some(f => read(f).includes(account.password)), 'test passwords must not ship');
    assert.match(readFileSync(join(out, '_headers'), 'utf8'), /connect-src 'self' https:\/\/api\.example\.test;/);
    const config = readFileSync(join(out, 'config.js'), 'utf8');
    assert.match(config, /"writesEnabled": false/);
    assert.match(config, /"googleSignIn": false/);
  } finally { rmSync(out, { recursive: true, force: true }); }
});

test('live Google and passkey sign-in options require explicit build flags and leave writes off', () => {
  const { out, status, stderr } = build({
    STARLIT_ACCOUNT_MODE: 'live',
    STARLIT_ANON_KEY: jwt({ role: 'anon' }),
    STARLIT_GOOGLE_SIGNIN: '1',
    STARLIT_PASSKEY_SIGNIN: '1',
  }, 'providers');
  try {
    assert.equal(status, 0, stderr);
    const config = readFileSync(join(out, 'config.js'), 'utf8');
    assert.match(config, /"googleSignIn": true/);
    assert.match(config, /"passkeySignIn": true/);
    assert.match(config, /"writesEnabled": false/);
    assert.ok(!existsSync(join(out, 'mock')));
    const html = readFileSync(join(out, 'index.html'), 'utf8');
    assert.doesNotMatch(html, /<script(?![^>]*src=)[^>]*>/i);
  } finally { rmSync(out, { recursive: true, force: true }); }
});

test('nested /account/ live build prefixes assets and preserves strict policies', () => {
  const { out, status, stderr } = build({
    STARLIT_ACCOUNT_MODE: 'live',
    STARLIT_ACCOUNT_BASE_PATH: '/account/',
    STARLIT_ANON_KEY: jwt({ role: 'anon' }),
  }, 'nested');
  try {
    assert.equal(status, 0, stderr);
    const cfg = readFileSync(join(out, 'config.js'), 'utf8');
    assert.match(cfg, /"basePath": "\/account\/"/);
    assert.match(cfg, /"writesEnabled": false/);
    const html = readFileSync(join(out, 'index.html'), 'utf8');
    for (const path of ['/account/app.js', '/account/styles/account.css', '/account/fonts/geist-latin.woff2', '/account/favicon.ico']) {
      assert.ok(html.includes(path), path);
    }
    assert.doesNotMatch(html, /src="\/app\.js"|href="\/styles\/|href="\/fonts\//);
    const css = readFileSync(join(out, 'styles', 'account.css'), 'utf8');
    assert.match(css, /url\(\/account\/fonts\/geist-latin\.woff2\)/);
    assert.ok(!existsSync(join(out, 'mock')));
    assert.match(readFileSync(join(out, '_headers'), 'utf8'), /script-src 'self'/);
  } finally { rmSync(out, { recursive: true, force: true }); }
});

test('invalid account base paths cannot be used', () => {
  for (const path of ['/account', '//account/', '/account/../', 'http://evil.test/']) {
    const { out, status } = build({ STARLIT_ACCOUNT_BASE_PATH: path }, 'bad-prefix');
    rmSync(out, { recursive: true, force: true });
    assert.notEqual(status, 0, path);
  }
});

test('live build refuses service keys, missing keys and plain http', () => {
  for (const [env, why] of [
    [{ STARLIT_ANON_KEY: jwt({ role: 'service_role' }) }, /anon key/],
    [{ STARLIT_ANON_KEY: '' }, /needs STARLIT_ANON_KEY/],
    [{ STARLIT_ANON_KEY: jwt({ role: 'anon' }), STARLIT_API_URL: 'http://api.example.test' }, /https origin/],
  ]) {
    const { out, status, stderr } = build({ STARLIT_ACCOUNT_MODE: 'live', ...env }, 'refuse');
    rmSync(out, { recursive: true, force: true });
    assert.notEqual(status, 0);
    assert.match(stderr, why);
  }
});

test('the public website runs only its own script and never calls the account API', () => {
  const site = readFileSync(join(root, '..', 'constants.mjs'), 'utf8');
  const csp = site.slice(site.indexOf('PUBLIC_CSP'), site.indexOf(';\n', site.indexOf('PUBLIC_CSP')));
  assert.match(csp, /script-src 'self'/);
  assert.match(csp, /connect-src 'self';/);
  assert.doesNotMatch(csp, /unsafe-|https:|starlit-api/);
  assert.ok(!/account\//.test(readFileSync(join(root, '..', 'package.json'), 'utf8')), 'website build does not include the account app');
});
