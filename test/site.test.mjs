import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { en, pt, routes, CONTACT } from '../content.mjs';
import { KEYS, PRODUCT, DOCS, VERSION, WINDOWS_FILE, ANDROID_FILE, LATEST } from '../constants.mjs';

const buildDir = new URL('../dist/', import.meta.url);
const read = path => readFileSync(new URL(path, buildDir), 'utf8');
const fileFor = route => route.slice(1) + 'index.html';
const ORIGIN = 'https://starlit.rrmtools.uk';
const allPages = () => Object.entries(routes).flatMap(([lang, r]) =>
  KEYS.map(key => ({ lang, key, route: r[key], html: read(fileFor(r[key])) })));
const productPages = () => allPages().filter(p => PRODUCT.includes(p.key));
const notFoundPages = () => ['404.html', 'pt/404.html'].map(file => ({ file, html: read(file) }));
const strip = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

test('Both localisations cover the six product pages and the six policy pages', () => {
  assert.deepEqual(Object.keys(en), DOCS);
  assert.deepEqual(Object.keys(pt), DOCS);
  assert.deepEqual(Object.keys(routes.en), KEYS);
  assert.deepEqual(Object.keys(routes.pt), KEYS);
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
  const titles = allPages().map(p => p.html.match(/<title>([^<]+)<\/title>/)[1]);
  assert.equal(new Set(titles).size, titles.length, 'Page titles must be unique');
});

test('The language switch points at the equivalent page in the other language', () => {
  for (const { lang, key, html } of allPages()) {
    const other = routes[lang === 'en' ? 'pt' : 'en'][key];
    const switches = [...html.matchAll(/<a class="lang-switch" href="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(switches, [other], 'Header language switch on ' + routes[lang][key]);
  }
});

test('The header links to every product page and marks the current one', () => {
  for (const { lang, key, route, html } of allPages()) {
    const nav = html.slice(html.indexOf('<nav class="nav-main"'), html.indexOf('</nav>', html.indexOf('<nav class="nav-main"')));
    for (const item of ['remote', 'anime', 'watch', 'sync']) {
      assert.ok(nav.includes(`href="${routes[lang][item]}"`), `Header misses ${item} on ${route}`);
    }
    const current = [...html.matchAll(/href="([^"]+)"[^>]*aria-current="page"/g)].map(m => m[1]);
    if (['remote', 'anime', 'watch', 'sync', 'download'].includes(key)) assert.ok(current.includes(route), 'No current link on ' + route);
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
  assert.match(read('sync/index.html'), /administrator must approve each request/i);
  assert.match(read('sync/index.html'), /expire after seven days/);
  assert.match(read('pt/conta/index.html'), /administrador tem de aprovar cada pedido/i);
  assert.match(read('pt/conta/index.html'), /expiram ao fim de sete dias/);
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
  for (const [lang, pagesForLang] of Object.entries({ en, pt })) for (const key of DOCS) {
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
    assert.doesNotMatch(html, /\son[a-z]+="/i, 'Inline event handler on ' + route);
  }
});

test('Demos work without JavaScript: no buttons, and every input is a tab radio', () => {
  for (const { route, html } of productPages()) {
    assert.doesNotMatch(html, /<button\b|<select\b|<textarea\b/, 'Dead control on ' + route);
    const inputs = [...html.matchAll(/<input\b[^>]*>/g)].map(m => m[0]);
    for (const input of inputs) assert.match(input, /^<input type="radio" name="[a-z-]+"( checked)?>$/, `Unexpected input on ${route}: ${input}`);
    // Each radio group starts with exactly one tab selected and has one panel per tab.
    for (const set of html.split('<div class="tabset').slice(1)) {
      const group = set.slice(0, set.indexOf('<div class="tab-panels">'));
      const tabs = [...group.matchAll(/<label class="tab">/g)].length;
      assert.equal([...group.matchAll(/ checked>/g)].length, 1, 'Tab group without one selection on ' + route);
      assert.ok(tabs >= 2 && tabs <= 7, 'Tab count outside what site.css supports on ' + route);
      const panels = [...set.matchAll(/<div class="tab-panel( tab-start)?">/g)].length;
      assert.equal(panels, tabs, 'Panels and tabs differ on ' + route);
    }
  }
});

test('Feature status labels match the release notes', () => {
  for (const { route, html } of productPages()) {
    // Anything that presents Bluetooth or Google Cast as a status is labelled Beta.
    for (const block of html.match(/<tr>[\s\S]*?<\/tr>|<div class="cell">[\s\S]*?<\/div>\s*(?=<div class="cell">|<\/div>)|<article class="way[\s\S]*?<\/article>/g) ?? []) {
      if (/Bluetooth|Google Cast|Chromecast/.test(block) && /pill-/.test(block)) {
        assert.match(block, /pill-beta/, 'Bluetooth or Cast without a Beta label on ' + route + ': ' + strip(block).slice(0, 80));
      }
    }
    assert.doesNotMatch(strip(html), /every new session asks again|Every new session asks again/, 'Outdated pairing claim on ' + route);
  }
  const enHome = strip(read('index.html'));
  assert.ok(enHome.includes('iPhone, Mac and Linux') && enHome.includes('Not yet'), 'Home must say iPhone, Mac and Linux are not available');
  assert.match(strip(read('anime/index.html')), /Windows app · optional tab, off by default/);
});

test('Download buttons open the latest release and versions come from constants', () => {
  for (const lang of ['en', 'pt']) {
    const html = read(fileFor(routes[lang].download));
    assert.ok(html.includes(WINDOWS_FILE) && html.includes(ANDROID_FILE), 'File names on ' + lang);
    assert.equal([...html.matchAll(new RegExp(`class="btn btn-lg btn-block[^"]*" href="${LATEST}"`, 'g'))].length, 2, 'Download buttons on ' + lang);
    assert.ok(html.includes(VERSION), 'Version on ' + lang);
    assert.ok(html.includes('id="' + (lang === 'pt' ? 'novidades' : 'whats-new') + '"'));
  }
  for (const { route, html } of allPages()) {
    for (const [, href] of html.matchAll(/href="(https:\/\/github\.com\/[^"]+)"/g)) {
      assert.match(href, /^https:\/\/github\.com\/(Beelzebub2\/nuvio-native|NuvioMedia\/NuvioDesktop)(\/|$)/, 'Unexpected GitHub link on ' + route);
      assert.doesNotMatch(href, /\/releases\/(download|tag)\//, 'Pinned release link on ' + route);
    }
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
  for (const asset of ['assets/fonts/bricolage-grotesque-latin.woff2', 'assets/fonts/geist-latin.woff2',
    'assets/fonts/geist-mono-latin.woff2', 'assets/fonts/OFL-BricolageGrotesque.txt', 'assets/fonts/OFL-Geist.txt',
    'assets/fonts/OFL-GeistMono.txt', 'assets/og-image.png', 'apple-touch-icon.png', 'favicon.ico']) {
    assert.ok(existsSync(new URL(asset, buildDir)), 'Missing asset ' + asset);
  }
  const css = read('assets/site.css');
  assert.doesNotMatch(css, /url\((?!\/assets\/)/, 'Stylesheet must only load same-origin assets');
  assert.doesNotMatch(css, /@import/);
  for (const [, file] of css.matchAll(/url\(\/assets\/([^)?]+)/g)) {
    assert.ok(existsSync(new URL('assets/' + file, buildDir)), 'Stylesheet points at a missing file: ' + file);
  }
});

test('Every class the pages use for widths and artwork is defined in the stylesheet', () => {
  const css = read('assets/site.css');
  const used = new Set(allPages().flatMap(({ html }) => [...html.matchAll(/class="([^"]+)"/g)]
    .flatMap(m => m[1].split(' ')).filter(c => /^(w-\d+|art-[a-z])$/.test(c))));
  for (const cls of used) assert.ok(css.includes('.' + cls + '{'), 'Undefined class ' + cls);
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
