import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = new URL('../deploy/vps/cloudflare-tunnel/', import.meta.url);
const get = name => readFileSync(new URL(name, source), 'utf8');

test('Cloudflare Tunnel connector has no public ports or token in command/env', () => {
  const compose = get('compose.yml');
  assert.match(compose, /image: cloudflare\/cloudflared:2026\.10\.7/);
  assert.match(compose, /user: "65532:65532"/);
  assert.match(compose, /read_only: true/);
  assert.match(compose, /cap_drop: \[ALL\]/);
  assert.match(compose, /no-new-privileges:true/);
  assert.match(compose, /pids_limit: 64/);
  assert.match(compose, /mem_limit: 128m/);
  assert.match(compose, /--token-file\s*\n\s*- \/run\/secrets\/starlit-tunnel-token/);
  assert.match(compose, /create_host_path: false/);
  assert.match(compose, /\/etc\/starlit\/cloudflare\/starlit-tunnel\.token/);
  assert.doesNotMatch(compose, /^\s*ports:/m);
  assert.doesNotMatch(compose, /^\s*environment:/m);
  assert.doesNotMatch(compose, /--token\s*[\r\n]+\s*-\s+(eyJ|[A-Za-z0-9]{100,})/);
  assert.match(compose, /name: rrm-ntfy_tokview-push/);
});

test('private Cloudflare origin reuses CrowdSec Caddy log and restricts host', () => {
  const caddy = get('edge.Caddyfile');
  assert.match(caddy, /^:8088 \{/m);
  assert.match(caddy, /import crowdsec-access/);
  assert.match(caddy, /@starlit host starlit\.rrmtools\.uk starlit-tunnel-stage\.rrmtools\.uk/);
  assert.match(caddy, /handle @starlit \{/);
  assert.match(caddy, /reverse_proxy starlit-site-web:8081/);
  assert.match(caddy, /header_up X-Forwarded-Proto https/);
  assert.match(caddy, /\r?\n\s*respond 404\r?\n\}/);
  assert.doesNotMatch(caddy, /transport http \{\s*tls_insecure_skip_verify/);
  assert.doesNotMatch(caddy, /header_up \+?Authorization/);
});

test('token installer uses stdin and never overwrites an existing credential', () => {
  const script = get('provision-token.sh');
  assert.match(script, /if \[ -e "\$TOKEN_FILE" \]/);
  assert.match(script, /if \[ -t 0 \]/);
  assert.match(script, /cat > "\$tmp"/);
  assert.match(script, /chown 0:65532/);
  assert.match(script, /chmod 0640/);
  assert.match(script, /mktemp/);
  assert.doesNotMatch(script, /echo "\$token"/);
});

test('runbook requires tunnel staging, production cutover and rollback', () => {
  const text = get('README.md');
  for (const phrase of [
    'starlit-tunnel-stage.rrmtools.uk',
    'http://tokview-ntfy-https:8088',
    'Cloudflare WAF',
    'Cloudflare-proxied CNAME',
    'CrowdSec',
    'rollback',
  ]) {
    assert.ok(text.includes(phrase), phrase);
  }
  assert.match(text, /restore the original DNS record/i);
  assert.match(text, /bypass cache for/);
  assert.match(text, /account writes stay \*\*OFF\*\*/i);
  assert.match(text, /Never touch the unrelated/);
});
