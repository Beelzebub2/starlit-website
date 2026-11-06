import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { en, pt } from './content.mjs';
import { ORIGIN, CONTACT, UPDATED, UPDATED_PT, routes, anchors, REPO, RELEASES,
  ISSUES, NUVIO, LICENSE_URL } from './constants.mjs';
import { skySvg, sparkleSvg, mark } from './art.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const dist = join(root, 'dist');
const pages = { en, pt };
const KEYS = ['home', 'privacy', 'terms', 'cookies', 'delete', 'contact', 'legal'];
const DOCS = ['privacy', 'terms', 'cookies', 'delete', 'contact', 'legal'];

const escape = value => String(value).replace(/[&"<>]/g, c =>
  ({ '&':'&amp;', '"':'&quot;', '<':'&lt;', '>':'&gt;' }[c]));
const text = html => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const slug = html => text(html).normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/^\d+\.\s*/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const ui = {
  en: {
    htmlLang:'en', ogLocale:'en_GB', other:'pt', otherLang:'pt-PT', otherShort:'PT', otherName:'Português',
    skip:'Skip to content', mainNav:'Main', menu:'Menu',
    labels:{ home:'Home', privacy:'Privacy policy', terms:'Terms of use', cookies:'Cookies and storage',
      delete:'Delete account', contact:'Contact and support', legal:'Legal information' },
    short:{ privacy:'Privacy', contact:'Contact' },
    nav:{ features:'Features', download:'Download', faq:'FAQ' },
    onThisPage:'On this page', documents:'Policies and help', updated:'Last updated:',
    readOther:'Ler em português', backToTop:'Back to top',
    ogAlt:'The Starlit logo, a play button holding a four-point star, on a night sky',
    footer:{ project:'An RRMTools project. Support, privacy and legal contact:',
      rights:'Information on data processing and rights is in the', rightsLink:'privacy policy',
      product:'Starlit', help:'Help', legalNav:'Legal links', legal:'Legal', source:'Source code', releases:'Releases',
      bug:'Report a bug', languages:'Language',
      credit:`Starlit is based on <a href="${NUVIO}">Nuvio Desktop</a> by Tapframe and friends and is licensed under <a href="${LICENSE_URL}">GPL-3.0</a>.` },
    notFound:{ title:'Page not found', heading:'This page doesn’t exist',
      body:'The link may be out of date, or the address may contain a typo. These pages can help:',
      description:'The page you asked for doesn’t exist on the Starlit website.' },
  },
  pt: {
    htmlLang:'pt-PT', ogLocale:'pt_PT', other:'en', otherLang:'en', otherShort:'EN', otherName:'English',
    skip:'Saltar para o conteúdo', mainNav:'Principal', menu:'Menu',
    labels:{ home:'Início', privacy:'Política de privacidade', terms:'Termos de utilização', cookies:'Cookies e armazenamento',
      delete:'Apagar conta', contact:'Contacto e suporte', legal:'Informações legais' },
    short:{ privacy:'Privacidade', contact:'Contacto' },
    nav:{ features:'Funcionalidades', download:'Transferir', faq:'Perguntas' },
    onThisPage:'Nesta página', documents:'Políticas e ajuda', updated:'Última atualização:',
    readOther:'Read in English', backToTop:'Voltar ao início',
    ogAlt:'O logótipo do Starlit, um botão de reprodução com uma estrela de quatro pontas, num céu noturno',
    footer:{ project:'Projeto RRMTools. Suporte, privacidade e contactos legais:',
      rights:'Informações sobre tratamento de dados e direitos disponíveis na', rightsLink:'política de privacidade',
      product:'Starlit', help:'Ajuda', legalNav:'Ligações legais', legal:'Legal', source:'Código-fonte', releases:'Versões',
      bug:'Comunicar um erro', languages:'Idioma',
      credit:`O Starlit baseia-se no <a href="${NUVIO}">Nuvio Desktop</a>, da Tapframe e amigos, e está licenciado sob a <a href="${LICENSE_URL}">GPL-3.0</a>.` },
    notFound:{ title:'Página não encontrada', heading:'Esta página não existe',
      body:'A ligação pode estar desatualizada ou o endereço pode ter um erro. Estas páginas podem ajudar:',
      description:'A página que pediste não existe no site do Starlit.' },
  },
};

// ---------------------------------------------------------------- assets

// Files written by this script rather than copied from assets/.
const generated = {
  '/assets/sky-night.svg': skySvg('#ffffff'),
  '/assets/sky-dawn.svg': skySvg('#2b3a8f', 0.55),
  '/assets/sparkle.svg': sparkleSvg,
};
// Asset URLs carry a content hash so browsers and Cloudflare never keep a stale copy.
const hash = data => createHash('sha256').update(data).digest('hex').slice(0, 10);
const asset = path => path + '?v=' + hash(generated[path] ?? readFileSync(join(root, path)));

// Cloudflare doesn't compress these responses (Cache-Control: no-transform),
// so the stylesheet is shipped with comments and whitespace removed.
const minifyCss = css => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ')
  .replace(/\s*([{};,])\s*/g, '$1').replace(/;}/g, '}').trim() + '\n';
const css = minifyCss(readFileSync(join(root, 'assets', 'site.css'), 'utf8'))
  .replace(/url\((\/assets\/[^)?]+)\)/g, (_, path) => `url(${asset(path)})`);
const cssHref = '/assets/site.css?v=' + hash(css);
const FONT_SANS = asset('/assets/fonts/mona-sans-latin-wdth.woff2');
const FONT_SERIF = asset('/assets/fonts/source-serif-4-latin-wght.woff2');
const WORDMARK_DARK = asset('/assets/starlit-wordmark-dark.png');
const WORDMARK_LIGHT = asset('/assets/starlit-wordmark-light.png');

const wordmark = lang => `<a class="brand" href="${routes[lang].home}">` +
  `<picture><source srcset="${WORDMARK_LIGHT}" media="(prefers-color-scheme: light)">` +
  `<img src="${WORDMARK_DARK}" alt="Starlit" width="139" height="32"></picture></a>`;

// ---------------------------------------------------------------- layout

function head(lang, { title, description, path, alternates, serif, noindex }) {
  const t = ui[lang];
  const links = alternates ? `
<link rel="canonical" href="${ORIGIN + path}">
<link rel="alternate" hreflang="en" href="${ORIGIN + alternates.en}">
<link rel="alternate" hreflang="pt-PT" href="${ORIGIN + alternates.pt}">
<link rel="alternate" hreflang="x-default" href="${ORIGIN + alternates.en}">` : '';
  return `<!doctype html>
<html lang="${t.htmlLang}" dir="ltr"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">${noindex ? '\n<meta name="robots" content="noindex">' : ''}
<meta name="color-scheme" content="dark light">
<meta name="theme-color" content="#0a0e27" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#f2f4fc" media="(prefers-color-scheme: light)">${links}
<link rel="icon" href="/assets/starlit-mark.svg" type="image/svg+xml">
<link rel="icon" href="/assets/starlit-logo.png" type="image/png" sizes="120x120">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="${FONT_SANS}" as="font" type="font/woff2" crossorigin>${serif ? `
<link rel="preload" href="${FONT_SERIF}" as="font" type="font/woff2" crossorigin>` : ''}
<link rel="stylesheet" href="${cssHref}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Starlit">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(description)}">${alternates ? `
<meta property="og:url" content="${ORIGIN + path}">` : ''}
<meta property="og:locale" content="${t.ogLocale}">
<meta property="og:locale:alternate" content="${ui[t.other].ogLocale}">
<meta property="og:image" content="${ORIGIN}/assets/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escape(t.ogAlt)}">
<meta name="twitter:card" content="summary_large_image">
</head>`;
}

function header(lang, key, otherPath) {
  const t = ui[lang], r = routes[lang], a = anchors[lang];
  const current = item => key === item ? ' aria-current="page"' : '';
  const items = [
    `<a href="${r.home}#${a.features}">${t.nav.features}</a>`,
    `<a href="${r.home}#${a.download}">${t.nav.download}</a>`,
    `<a href="${r.home}#${a.faq}">${t.nav.faq}</a>`,
    `<a href="${r.privacy}"${current('privacy')}>${t.short.privacy}</a>`,
    `<a href="${r.contact}"${current('contact')}>${t.short.contact}</a>`,
  ].join('');
  return `
<a href="#main" class="skip">${t.skip}</a>
<header class="site-header">
  <div class="wrap header-inner">
    ${wordmark(lang)}
    <nav class="nav-inline" aria-label="${t.mainNav}">${items}</nav>
    <a class="lang-switch" href="${otherPath}" hreflang="${t.otherLang}" lang="${t.otherLang}"><span class="lang-short">${t.otherShort}</span> <span class="lang-long">${t.otherName}</span></a>
    <details class="menu">
      <summary><span class="menu-icon" aria-hidden="true"></span>${t.menu}</summary>
      <nav class="menu-panel" aria-label="${t.mainNav}">${items}</nav>
    </details>
  </div>
</header>`;
}

function footer(lang, otherPath) {
  const t = ui[lang], f = t.footer, r = routes[lang], a = anchors[lang];
  const li = (href, label) => `<li><a href="${href}">${label}</a></li>`;
  const languages = lang === 'en'
    ? `<span aria-current="true">English</span><a href="${otherPath}" hreflang="pt-PT" lang="pt-PT">Português</a>`
    : `<a href="${otherPath}" hreflang="en" lang="en">English</a><span aria-current="true">Português</span>`;
  return `
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-brand">
      ${wordmark(lang)}
      <p>${f.project} <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>
      <p>${f.rights} <a href="${r.privacy}">${f.rightsLink}</a>.</p>
    </div>
    <div class="footer-cols">
      <nav aria-labelledby="fn-product"><h2 id="fn-product">${f.product}</h2><ul role="list">
        ${li(r.home + '#' + a.features, t.nav.features)}${li(r.home + '#' + a.download, t.nav.download)}${li(r.home + '#' + a.faq, t.nav.faq)}${li(REPO, f.source)}${li(RELEASES, f.releases)}</ul></nav>
      <nav aria-labelledby="fn-help"><h2 id="fn-help">${f.help}</h2><ul role="list">
        ${li(r.contact, t.labels.contact)}${li(r.delete, t.labels.delete)}${li(ISSUES, f.bug)}</ul></nav>
      <nav aria-label="${f.legalNav}"><h2 aria-hidden="true">${f.legal}</h2><ul role="list" class="footer-links">
        ${li(r.privacy, t.labels.privacy)}${li(r.terms, t.labels.terms)}${li(r.cookies, t.labels.cookies)}${li(r.legal, t.labels.legal)}</ul></nav>
    </div>
  </div>
  <div class="wrap footer-base">
    <p>${f.credit}</p>
    <p class="footer-lang"><span class="vh">${f.languages}: </span>${languages}</p>
  </div>
</footer>`;
}

function page(lang, key, opts, main) {
  return head(lang, opts) + `
<body class="${opts.bodyClass}">` + header(lang, key, opts.otherPath) + `
<main id="main" tabindex="-1">${main}
</main>` + footer(lang, opts.otherPath) + `
</body></html>
`;
}

// ---------------------------------------------------------------- documents

function renderDoc(lang, key, content) {
  const t = ui[lang], r = routes[lang];
  const used = new Set(), toc = [];
  // Give every section heading a stable anchor; the policy text is unchanged.
  const body = content.html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, inner) => {
    const base = slug(inner) || 'section';
    let id = base, n = 2;
    while (used.has(id)) id = base + '-' + n++;
    used.add(id);
    toc.push([id, text(inner)]);
    return `<h2 id="${id}">${inner}</h2>`;
  });
  const tocList = toc.map(([id, label]) => `<li><a href="#${id}">${escape(label)}</a></li>`).join('');
  const docList = DOCS.map(item =>
    `<li><a href="${r[item]}"${item === key ? ' aria-current="page"' : ''}>${t.labels[item]}</a></li>`).join('');
  const actions = content.actions ? `
    <div class="callout">
      <p>${escape(content.actions.note)}</p>
      <p class="actions">${content.actions.links.map(([href, label], i) =>
        `<a class="btn ${i === 0 ? 'btn-primary' : 'btn-quiet'}" href="${escape(href)}">${label}</a>`).join('')}</p>
    </div>` : '';
  const otherPath = routes[t.other][key];
  return `
<div class="doc-head">
  <div class="wrap">
    <h1>${escape(content.title)}</h1>
    <p class="doc-lede">${escape(content.description)}</p>
    <p class="doc-meta"><span>${t.updated} ${lang === 'pt' ? UPDATED_PT : UPDATED}</span>
      <a href="${otherPath}" hreflang="${t.otherLang}" lang="${t.otherLang}">${t.readOther}</a></p>
  </div>
</div>
<div class="wrap doc-layout">
  <aside class="doc-aside">
    <nav class="toc toc-wide" aria-labelledby="toc-title"><h2 id="toc-title">${t.onThisPage}</h2><ol role="list">${tocList}</ol></nav>
    <nav class="toc docs-nav" aria-labelledby="docs-title"><h2 id="docs-title">${t.documents}</h2><ul role="list">${docList}</ul></nav>
  </aside>
  <details class="toc toc-narrow"><summary>${t.onThisPage}</summary><nav aria-label="${t.onThisPage}"><ol role="list">${tocList}</ol></nav></details>
  <div class="doc-body">${actions}
    <div class="prose">${body}
    </div>
    <p class="doc-end"><a href="#main">${t.backToTop}</a></p>
  </div>
</div>`;
}

function renderNotFound(lang) {
  const t = ui[lang], n = t.notFound, r = routes[lang], a = anchors[lang];
  const links = [[r.home, t.labels.home], [r.home + '#' + a.download, t.nav.download],
    [r.privacy, t.labels.privacy], [r.contact, t.labels.contact]];
  return `
<section class="not-found" aria-labelledby="nf-title">
  <div class="wrap not-found-inner">
    ${mark('nf', 'mark nf-mark')}
    <div>
      <h1 id="nf-title">${n.heading}</h1>
      <p>${n.body}</p>
      <ul class="link-list" role="list">${links.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('')}</ul>
    </div>
  </div>
</section>`;
}

// ---------------------------------------------------------------- write

const write = (path, data) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
};

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(root, 'assets'), join(dist, 'assets'), { recursive: true,
  filter: source => !source.includes(join('assets', 'icons')) });
write(join(dist, 'assets', 'site.css'), css);
for (const [path, data] of Object.entries(generated)) write(join(dist, path), data);
// Browsers ask for these two at the site root.
for (const file of ['apple-touch-icon.png', 'favicon.ico']) {
  cpSync(join(root, 'assets', 'icons', file), join(dist, file));
}

let count = 0;
for (const lang of ['en', 'pt']) {
  const other = ui[lang].other;
  for (const key of KEYS) {
    const content = pages[lang][key];
    const isHome = key === 'home';
    const html = page(lang, key, {
      title: isHome ? content.title : content.title + ' | Starlit',
      description: content.description,
      path: routes[lang][key],
      alternates: { en: routes.en[key], pt: routes.pt[key] },
      otherPath: routes[other][key],
      bodyClass: isHome ? 'page-home' : 'page-doc',
      serif: !isHome,
    }, isHome ? content.html : renderDoc(lang, key, content));
    write(join(dist, routes[lang][key].replace(/^\/+|\/+$/g, ''), 'index.html'), html);
    count++;
  }
  // Cloudflare Pages serves the nearest 404.html with a real 404 status, so
  // unknown /pt/ addresses get the Portuguese page.
  const n = ui[lang].notFound;
  write(join(dist, lang === 'pt' ? 'pt' : '', '404.html'), page(lang, '404', {
    title: n.title + ' | Starlit', description: n.description,
    otherPath: routes[other].home, bodyClass: 'page-404', noindex: true,
  }, renderNotFound(lang)));
}

write(join(dist, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: ' + ORIGIN + '/sitemap.xml\n');
const sitemap = ['en', 'pt'].flatMap(lang => KEYS.map(key => `  <url>
    <loc>${ORIGIN + routes[lang][key]}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${ORIGIN + routes.en[key]}"/>
    <xhtml:link rel="alternate" hreflang="pt-PT" href="${ORIGIN + routes.pt[key]}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN + routes.en[key]}"/>
  </url>`)).join('\n');
write(join(dist, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
  sitemap + '\n</urlset>\n');
write(join(dist, '.well-known', 'security.txt'),
  'Contact: mailto:' + CONTACT + '\nExpires: 2027-11-01T00:00:00Z\nPreferred-Languages: pt, en\n' +
  'Canonical: ' + ORIGIN + '/.well-known/security.txt\n');
write(join(dist, '_redirects'), '/en / 301\n/en/* /:splat 301\n');
write(join(dist, '_headers'), `/*
  Strict-Transport-Security: max-age=31536000
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Content-Security-Policy: default-src 'none'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; script-src 'none'; object-src 'none'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'; upgrade-insecure-requests
  Cache-Control: public, max-age=300, no-transform
/assets/*
  ! Cache-Control
  Cache-Control: public, max-age=86400, no-transform
`);
console.log(`Built ${count} localised pages, 2 not-found pages and static security assets in dist/`);
