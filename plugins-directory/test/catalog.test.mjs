import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(join(root, path), 'utf8');
const catalog = JSON.parse(read('data/catalog.json'));
const direct = catalog.repositories.filter(r => r.status === 'source-visible');
const unavailable = catalog.repositories.filter(r => r.status === 'unavailable');
const all = direct.flatMap(r => r.providers);

test('independently indexed repository and provider counts agree with the data', () => {
  assert.equal(catalog.repositories.length, 12);
  assert.equal(direct.length, 8);
  assert.equal(unavailable.length, 4);
  assert.equal(all.length, 204);
  assert.equal(new Set(catalog.repositories.map(r => r.id)).size, 12);
});

test('available entries identify publisher manifests; unavailable ones have no copyable provider lists', () => {
  for (const r of catalog.repositories) {
    assert.match(r.repo, /^[A-Za-z\d_.-]+\/[A-Za-z\d_.-]+$/);
    assert.match(r.id, /^[a-z][a-z\d-]+$/);
    assert.ok(['main','master'].includes(r.branch));
    assert.ok(Array.isArray(r.languages) && r.languages.length);
    if (r.status === 'source-visible') {
      assert.ok(r.providers.length > 0, r.id);
      assert.ok(r.providers.every(p => typeof p === 'string' && p.trim().length >= 2), r.id);
    } else {
      assert.deepEqual(r.providers, [], r.id);
    }
  }
});

test('actual website pages, privacy/copyright policy and strict CSP are generated in both languages', () => {
  const paths = ['dist/index.html','dist/pt/index.html','dist/legal/index.html','dist/pt/legal/index.html'];
  for (const path of paths) {
    assert.ok(existsSync(join(root,path)), `Missing ${path}`);
    const doc = read(path);
    assert.equal([...doc.matchAll(/<h1\b/g)].length, 1, path);
    assert.match(doc,/rel="canonical"/);
    assert.match(doc,/hreflang="en"/);
    assert.match(doc,/hreflang="pt-PT"/);
    assert.match(doc,/starlit-mark\.svg/);
    assert.doesNotMatch(doc, /<iframe\b|onload=|onclick=|eval\(/i, path);
    assert.doesNotMatch(doc,/googletagmanager|google-analytics|adsbygoogle|hotjar/i, path);
  }
  assert.match(read('dist/index.html'), /<html lang="en"/);
  assert.match(read('dist/pt/index.html'), /<html lang="pt-PT"/);
  assert.match(read('dist/legal/index.html'), /copyrighted audiovisual works/i);
  assert.match(read('dist/pt/legal/index.html'), /direitos de autor/i);
  assert.match(read('dist/legal/index.html'), /support\.starlit@rrmtools\.uk/);
  assert.match(read('dist/pt/legal/index.html'), /support\.starlit@rrmtools\.uk/);
  const headers = read('dist/_headers');
  assert.match(headers,/default-src 'none'/);
  assert.match(headers,/script-src 'self'/);
  assert.match(headers,/connect-src 'self'/);
  assert.doesNotMatch(headers,/unsafe-|https:\s*\*|data:/);
});

test('directory explicitly avoids app-store installs and links to original publishers', () => {
  for (const lang of ['','pt/']) {
    const page = read(`dist/${lang}index.html`);
    assert.match(page, /<noscript>/);
    assert.match(page, /https:\/\/github\.com\/NuvioPlugin\/All-in-One-Nuvio/);
    assert.match(page, /https:\/\/github\.com\/yoruix\/nuvio-providers/);
    assert.match(page, /https:\/\/starlit\.rrmtools\.uk\//);
    assert.doesNotMatch(page, /starlit:\/\/install|nuvio:\/\/install|Install directly|Instalar automaticamente/i);
    assert.match(page, /legal/);
  }
  const app = read('assets/site.js');
  assert.match(app,/https:\/\/raw\.githubusercontent\.com/);
  assert.match(app,/fetch\('\/catalog\.json'/);
  assert.doesNotMatch(app,/innerHTML|eval\(|new Function|document\.write|createObjectURL/);
});

test('snapshot stays explicit and never implies rights approval', () => {
  const en = read('dist/index.html');
  assert.match(en,/2026-11-14/);
  assert.match(en,/not.*audited.*media sources licensed/i);
  assert.match(en,/204/);
  assert.match(read('dist/pt/index.html'), /204/);
  assert.match(read('dist/sitemap.xml'), /https:\/\/starlitplugins\.rrmtools\.uk\/pt\/legal\//);
});


test('public deploy gate rejects unreviewed candidate manifests by default', () => {
  const out = spawnSync(process.execPath, [join(root, 'tools/prepublish.mjs')], {encoding:'utf8'});
  assert.equal(out.status, 2);
  assert.match(out.stderr, /Production publication refused/);
  assert.match(out.stderr, /not approved for publication/);
  assert.match(out.stderr, /contentRightsReviewed not verified/);
});
