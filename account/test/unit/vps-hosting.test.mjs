// VPS deployment policy tests. Detect accidental publication of the mock
// backend, unauthenticated hosting or changes that reopen host ports.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const deploy = join(root, 'deploy', 'vps');
const read = path => readFileSync(path, 'utf8');

test('VPS service is rootless, read-only and has no published host ports', () => {
  const compose = read(join(deploy, 'compose.yml'));
  assert.match(compose, /user: "10001:10001"/);
  assert.match(compose, /read_only: true/);
  assert.match(compose, /cap_drop: \[ALL\]/);
  assert.match(compose, /cap_add: \[NET_BIND_SERVICE\]/);
  assert.match(compose, /no-new-privileges:true/);
  assert.match(compose, /external: true/);
  assert.match(compose, /name: rrm-ntfy_tokview-push/);
  assert.doesNotMatch(compose, /^\s+ports:/m);
  assert.doesNotMatch(compose, /docker\.sock|\/etc\/starlit|\/run\/secrets|\.env/);
  assert.match(compose, /:\/srv\/releases:ro/);
});

test('VPS HTTPS edge routes the staging and production hosts internally only', () => {
  const edge = read(join(deploy, 'edge.Caddyfile'));
  assert.match(edge, /account-stage\.62-171-179-229\.sslip\.io \{/);
  assert.match(edge, /account\.starlit\.rrmtools\.uk \{/);
  assert.equal((edge.match(/reverse_proxy starlit-account-web:8080/g) || []).length, 2);
  assert.doesNotMatch(edge, /cloudflare\.com|pages\.dev|http:\/\/62\.171\.179\.229/);
});

test('VPS Caddy headers exactly preserve the live app CSP', () => {
  const output = mkdtempSync(join(tmpdir(), 'starlit-vps-headers-'));
  try {
    const jwt = ['e30', Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url'), 'signature'].join('.');
    const result = spawnSync(process.execPath, ['build.mjs'], {
      cwd: root, encoding: 'utf8', env: {
        ...process.env, STARLIT_ACCOUNT_OUT: output, STARLIT_ACCOUNT_MODE: 'live',
        STARLIT_ACCOUNT_WRITES: '0', STARLIT_ANON_KEY: jwt,
        STARLIT_API_URL: 'https://starlit-api.rrmtools.uk',
      },
    });
    assert.equal(result.status, 0, result.stderr);
    const expected = read(join(output, '_headers')).match(/Content-Security-Policy: (.*)/)[1];
    const caddy = read(join(deploy, 'Caddyfile'));
    const actual = caddy.match(/Content-Security-Policy "([^"]+)"/)?.[1];
    assert.equal(actual, expected, 'VPS CSP diverged from the frontend build');
    for (const key of [
      'Strict-Transport-Security', 'X-Content-Type-Options', 'Referrer-Policy',
      'X-Frame-Options', 'X-Robots-Tag', 'Cross-Origin-Opener-Policy',
      'Cross-Origin-Resource-Policy', 'Permissions-Policy',
    ]) assert.ok(caddy.includes(key), `Missing ${key}`);
    assert.match(caddy, /no-store/);
    assert.match(caddy, /route \{\s*respond @private 404\s*try_files \{path\} \/index\.html\s*file_server\s*\}/);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});

test('VPS release installer rejects a mock build and requires read-only mode', () => {
  const script = read(join(deploy, 'install-release.sh'));
  assert.match(script, /"mode": "live"/);
  assert.match(script, /"writesEnabled": false/);
  assert.match(script, /Mock code must never be deployed/);
  assert.match(script, /no-same-owner/);
  assert.match(script, /mv -Tf/);
  assert.ok(!/rm -rf|docker system prune|docker compose down/.test(script));
});
