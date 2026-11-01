import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { en, pt, routes, CONTACT } from '../content.mjs';

const root = new URL('../', import.meta.url);
const buildDir = new URL('../dist/', import.meta.url);
const read = path => readFileSync(new URL(path, buildDir), 'utf8');

test('Both localisations cover all seven mandatory public pages', () => {
  const keys = ['home','privacy','terms','cookies','delete','contact','legal'];
  assert.deepEqual(Object.keys(en), keys);
  assert.deepEqual(Object.keys(pt), keys);
  for (const lang of ['en', 'pt']) for (const key of keys) {
    const url = routes[lang][key];
    const file = url.slice(1) + 'index.html';
    assert.ok(existsSync(new URL(file, buildDir)), 'Missing: ' + file);
    const html = read(file);
    assert.match(html, new RegExp('<html lang="' + (lang === 'pt' ? 'pt-PT' : 'en') + '"'));
    assert.ok(html.includes(CONTACT), 'Wrong support email: ' + file);
    assert.match(html, /<link rel="canonical" href="https:\/\/starlit\.rrmtools\.uk\//);
    assert.match(html, /\/assets\/starlit-logo\.png/);
    assert.doesNotMatch(html, /<script\b|google-analytics|googletagmanager|<form\b/i);
    assert.doesNotMatch(html, /cloudflaredomainrrm@gmail\.com/);
  }
});

test('Public OAuth privacy pages disclose Google identity use, approval and deletion', () => {
  const enPrivacy = read('privacy/index.html');
  for (const required of ['Google sign-in', 'Google account identifier',
    'GDPR Article 6(1)(b)', 'seven days', 'legitimate interests',
    'BitTorrent', 'CNPD', 'support.starlit@rrmtools.uk']) {
    assert.ok(enPrivacy.includes(required), 'Missing privacy concept: ' + required);
  }
  const ptPrivacy = read('pt/privacidade/index.html');
  assert.match(ptPrivacy, /RGPD/);
  assert.match(ptPrivacy, /BitTorrent/);
  assert.match(read('index.html'), /administrator must approve/i);
  assert.match(read('pt/index.html'), /administrador tem de aprovar/i);
  assert.match(read('delete-account/index.html'), /Starlit account deletion/);
  assert.match(read('pt/apagar-conta/index.html'), /Eliminação de conta Starlit/);
});

test('Logo is official, size-bounded and security headers forbid active tracking', () => {
  const logo = new URL('assets/starlit-logo.png', buildDir);
  assert.ok(existsSync(logo));
  assert.ok(statSync(logo).size < 1024 * 1024);
  assert.match(read('_headers'), /script-src 'none'/);
  assert.match(read('_headers'), /connect-src 'none'/);
  assert.match(read('_headers'), /form-action 'none'/);
  assert.match(read('_headers'), /no-transform/);
  assert.match(read('.well-known/security.txt'), /support\.starlit@rrmtools\.uk/);
  assert.match(read('robots.txt'), /Sitemap: https:\/\/starlit\.rrmtools\.uk/);
  assert.ok(existsSync(new URL('assets/site.css', buildDir)));
});

test('All same-origin static navigation links resolve to built pages', () => {
  for (const routesForLang of Object.values(routes)) for (const route of Object.values(routesForLang)) {
    const html = read(route.slice(1) + 'index.html');
    const links = [...html.matchAll(/href="(\/[^"#?]*)"/g)].map(match => match[1]);
    for (const link of links) {
      const output = link.endsWith('/') ? link.slice(1) + 'index.html' : link.slice(1);
      assert.ok(existsSync(new URL(output, buildDir)), 'Broken site link ' + link + ' in ' + route);
    }
  }
});
