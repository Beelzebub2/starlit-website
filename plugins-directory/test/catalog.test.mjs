import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
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
  assert.match(read('dist/pt/legal/index.html'), /https:\/\/starlit\.rrmtools\.uk\/pt\/privacidade\//);
  assert.match(read('dist/pt/legal/index.html'), /https:\/\/starlit\.rrmtools\.uk\/pt\/termos\//);
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


test('prepublish checks metadata integrity without claiming legal review', () => {
  const result = spawnSync(process.execPath, [join(root,'tools/prepublish.mjs')], { encoding:'utf8' });
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/Source rights and code security NOT verified/);
});

test('public community build includes original source manifests and clear disclaimers', () => {
  const tmp = mkdtempSync(join(tmpdir(),'starlit-plugins-community-'));
  try {
    const run = spawnSync(process.execPath,[join(root,'tools/build-public.mjs')], {
      cwd:root, env:{...process.env,STARLIT_PLUGINS_BUILD_OUT:tmp},encoding:'utf8'
    });
    assert.equal(run.status,0,run.stderr);
    const output = path => readFileSync(join(tmp,path),'utf8');
    const published=JSON.parse(output('catalog.json'));
    const meta=JSON.parse(output('publication.json'));
    assert.equal(meta.mode,'community-directory');
    assert.equal(meta.totalRepositories,12);
    assert.equal(meta.publishedRepositories,8);
    assert.equal(meta.unavailableRepositories,4);
    assert.equal(meta.indexedProviders,204);
    assert.equal(published.repositories.length,12);
    assert.match(output('index.html'),/Informational directory only/);
    assert.match(output('pt/index.html'),/Diretório apenas informativo/);
    assert.match(output('index.html'),/github.com\/NuvioPlugin\/All-in-One-Nuvio/);
    for (const r of published.repositories) {
      assert.ok(!Object.hasOwn(r,'publication'),'Review flags leaked into public catalog');
      if (r.status==='unavailable') assert.deepEqual(r.providers,[]);
      else assert.ok(r.providers.length,'Missing source entries: '+r.id);
    }
    assert.match(output('assets/site.js'),/r\.status === 'source-visible'/);
  } finally { rmSync(tmp,{recursive:true,force:true}); }
});
