import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { en, pt, routes, CONTACT } from '../content.mjs';

const buildDir = new URL('../dist/', import.meta.url);
const read = path => readFileSync(new URL(path, buildDir), 'utf8');
const fileFor = route => route.slice(1) + 'index.html';
const KEYS = ['home','privacy','terms','cookies','delete','contact','legal'];
const ORIGIN = 'https://starlit.rrmtools.uk';
const allPages = () => Object.entries(routes).flatMap(([lang, r]) =>
  KEYS.map(key => ({ lang, key, route: r[key], html: read(fileFor(r[key])) })));
const notFoundPages = () => ['404.html', 'pt/404.html'].map(file => ({ file, html: read(file) }));

test('Both localisations cover all seven mandatory public pages', () => {
  assert.deepEqual(Object.keys(en), KEYS);
  assert.deepEqual(Object.keys(pt), KEYS);
  for (const { lang, route, html } of allPages()) {
    assert.ok(existsSync(new URL(fileFor(route), buildDir)), 'Missing: ' + route);
    assert.match(html, new RegExp('<html lang="' + (lang === 'pt' ? 'pt-PT' : 'en') + '"'));
    assert.ok(html.includes(CONTACT), 'Wrong support email: ' + route);
    assert.ok(html.includes(`<link rel="canonical" href="${ORIGIN}${route}">`), 'Canonical: ' + route);
    assert.match(html, /\/assets\/starlit-logo\.png/);
    assert.doesNotMatch(html, /<script\b|google-analytics|googletagmanager|<form\b/i);
    assert.doesNotMatch(html, /cloudflaredomainrrm@gmail\.com/);
  }
});

test('Every page declares its language alternates and social metadata', () => {
  for (const { key, html } of allPages()) {
    assert.ok(html.includes(`hreflang="en" href="${ORIGIN}${routes.en[key]}"`), 'hreflang en: ' + key);
    assert.ok(html.includes(`hreflang="pt-PT" href="${ORIGIN}${routes.pt[key]}"`), 'hreflang pt: ' + key);
    assert.ok(html.includes(`hreflang="x-default" href="${ORIGIN}${routes.en[key]}"`), 'x-default: ' + key);
    assert.match(html, /<title>[^<]{10,}<\/title>/);
    assert.match(html, /<meta name="description" content="[^"]{40,}">/);
    assert.match(html, /<meta property="og:image" content="https:\/\/starlit\.rrmtools\.uk\/assets\/og-image\.png">/);
    assert.match(html, /<meta name="viewport" content="width=device-width,initial-scale=1">/);
  }
});

test('The language switch points at the equivalent page in the other language', () => {
  for (const { lang, key, html } of allPages()) {
    const other = routes[lang === 'en' ? 'pt' : 'en'][key];
    const switches = [...html.matchAll(/<a class="lang-switch" href="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(switches, [other], 'Header language switch on ' + routes[lang][key]);
  }
});

test('Public OAuth privacy pages disclose Google identity use, approval and deletion', () => {
  const enPrivacy = read('privacy/index.html');
  for (const required of ['Google sign-in', 'Google account identifier',
    'GDPR Article 6(1)(b)', 'seven days', 'legitimate interests',
    'BitTorrent', 'CNPD', 'support.starlit@rrmtools.uk',
    'Optional app usage analytics', 'Optional crash reports', 'Sentry',
    'GDPR Article 6(1)(a)', '30 days', 'Settings']) {
    assert.ok(enPrivacy.includes(required), 'Missing privacy concept: ' + required);
  }
  const ptPrivacy = read('pt/privacidade/index.html');
  assert.match(ptPrivacy, /RGPD/);
  assert.match(ptPrivacy, /BitTorrent/);
  assert.match(ptPrivacy, /Estatísticas opcionais da aplicação/);
  assert.match(ptPrivacy, /Artigo 6.º, n.º 1, alínea a\)/);
  assert.match(ptPrivacy, /30 dias/);
  assert.match(read('index.html'), /administrator must approve/i);
  assert.match(read('pt/index.html'), /administrador tem de aprovar/i);
  assert.match(read('delete-account/index.html'), /Starlit account deletion/);
  assert.match(read('pt/apagar-conta/index.html'), /Eliminação de conta Starlit/);
});

test('Deletion and support shortcuts prefill the subjects the instructions require', () => {
  const mail = subject => 'mailto:' + CONTACT + '?subject=' + encodeURIComponent(subject);
  assert.ok(read('delete-account/index.html').includes(mail('Starlit account deletion')));
  assert.ok(read('delete-account/index.html').includes(mail('Starlit data access/export')));
  assert.ok(read('pt/apagar-conta/index.html').includes(mail('Eliminação de conta Starlit')));
  assert.ok(read('pt/apagar-conta/index.html').includes(mail('Acesso/exportação de dados Starlit')));
  assert.ok(read('contact/index.html').includes('href="mailto:' + CONTACT));
});

test('Policy pages keep their full text and gain section anchors', () => {
  const strip = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  for (const [lang, pagesForLang] of Object.entries({ en, pt })) for (const key of KEYS.slice(1)) {
    const built = read(fileFor(routes[lang][key]));
    const prose = built.slice(built.indexOf('<div class="prose">'), built.indexOf('<p class="doc-end">'));
    assert.ok(strip(prose).includes(strip(pagesForLang[key].html)), 'Policy text changed: ' + routes[lang][key]);
    const headings = [...pagesForLang[key].html.matchAll(/<h2>/g)].length;
    const anchored = [...prose.matchAll(/<h2 id="[a-z0-9-]+">/g)].length;
    assert.equal(anchored, headings, 'Unanchored section on ' + routes[lang][key]);
  }
});

test('Pages have one h1, unique ids and no inline styles the CSP would block', () => {
  for (const { route, html } of [...allPages(), ...notFoundPages().map(p => ({ route: p.file, html: p.html }))]) {
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, 'h1 count on ' + route);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, 'Duplicate id on ' + route);
    assert.doesNotMatch(html, /\sstyle="/, 'Inline style on ' + route);
    assert.doesNotMatch(html, /<style\b/, 'Inline stylesheet on ' + route);
  }
});

test('Unknown addresses get a real, unindexed not-found page in each language', () => {
  const [enPage, ptPage] = notFoundPages();
  assert.match(enPage.html, /<html lang="en"/);
  assert.match(ptPage.html, /<html lang="pt-PT"/);
  for (const { html } of [enPage, ptPage]) {
    assert.match(html, /<meta name="robots" content="noindex">/);
    assert.doesNotMatch(html, /rel="canonical"/);
  }
});

test('Logo is official, size-bounded and security headers forbid active tracking', () => {
  const logo = new URL('assets/starlit-logo.png', buildDir);
  assert.ok(existsSync(logo));
  assert.ok(statSync(logo).size < 1024 * 1024);
  assert.match(read('assets/starlit-mark.svg'), /#45D6EB[\s\S]*#3965D4[\s\S]*#B250EF/);
  const headers = read('_headers');
  assert.match(headers, /script-src 'none'/);
  assert.match(headers, /connect-src 'none'/);
  assert.match(headers, /form-action 'none'/);
  assert.match(headers, /font-src 'self'/);
  assert.match(headers, /frame-ancestors 'none'/);
  assert.match(headers, /no-transform/);
  assert.match(read('.well-known/security.txt'), /support\.starlit@rrmtools\.uk/);
  assert.match(read('robots.txt'), /Sitemap: https:\/\/starlit\.rrmtools\.uk/);
  for (const asset of ['assets/fonts/mona-sans-latin-wdth.woff2', 'assets/fonts/source-serif-4-latin-wght.woff2',
    'assets/fonts/OFL-MonaSans.txt', 'assets/fonts/OFL-SourceSerif4.txt', 'assets/og-image.png',
    'assets/sky-night.svg', 'assets/sky-dawn.svg', 'assets/sparkle.svg', 'apple-touch-icon.png', 'favicon.ico']) {
    assert.ok(existsSync(new URL(asset, buildDir)), 'Missing asset ' + asset);
  }
  const css = read('assets/site.css');
  assert.doesNotMatch(css, /url\((?!\/assets\/)/, 'Stylesheet must only load same-origin assets');
  assert.doesNotMatch(css, /@import/);
});

test('Sitemap lists every localised page with its alternates', () => {
  const sitemap = read('sitemap.xml');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const expected = Object.values(routes).flatMap(r => KEYS.map(key => ORIGIN + r[key]));
  assert.deepEqual(locs.sort(), expected.sort());
  assert.equal([...sitemap.matchAll(/hreflang="x-default"/g)].length, expected.length);
  assert.doesNotMatch(sitemap, /404/);
});

test('All same-origin links, images and in-page anchors resolve', () => {
  const pagesToCheck = [...allPages().map(p => ({ route: p.route, html: p.html })),
    ...notFoundPages().map(p => ({ route: '/' + p.file, html: p.html }))];
  const byRoute = new Map(allPages().map(p => [p.route, p.html]));
  for (const { route, html } of pagesToCheck) {
    const refs = [...html.matchAll(/(?:href|src|srcset)="(\/[^"#?\s]*)/g)].map(m => m[1]);
    for (const ref of refs) {
      const output = ref.endsWith('/') ? ref.slice(1) + 'index.html' : ref.slice(1);
      assert.ok(existsSync(new URL(output, buildDir)), 'Broken site link ' + ref + ' in ' + route);
    }
    for (const [, path, id] of html.matchAll(/href="(\/[^"#]*)?#([^"]+)"/g)) {
      const target = path ? byRoute.get(path) : html;
      assert.ok(target, 'Anchor to unknown page ' + path + ' in ' + route);
      assert.ok(target.includes(`id="${id}"`), `Missing anchor #${id} on ${path || route} (from ${route})`);
    }
  }
});
