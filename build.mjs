import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { en, pt } from './content.mjs';
import { ORIGIN, CONTACT, UPDATED, UPDATED_PT, routes, KEYS, PRODUCT, DOCS, REPO, RELEASES,
  ISSUES, NUVIO, LICENSE_URL } from './constants.mjs';
import { hash, asset, markImg } from './ui.mjs';
import * as home from './pages/home.mjs';
import * as remote from './pages/remote.mjs';
import * as anime from './pages/anime.mjs';
import * as watch from './pages/watch.mjs';
import * as sync from './pages/sync.mjs';
import * as download from './pages/download.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const dist = join(root, 'dist');
const docs = { en, pt };
const product = { home, remote, anime, watch, sync, download };

const escape = value => String(value).replace(/[&"<>]/g, c =>
  ({ '&':'&amp;', '"':'&quot;', '<':'&lt;', '>':'&gt;' }[c]));
const text = html => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const slug = html => text(html).normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/^\d+\.\s*/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const ui = {
  en: {
    htmlLang:'en', ogLocale:'en_GB', other:'pt', otherLang:'pt-PT', otherShort:'PT', otherName:'Português',
    skip:'Skip to content', mainNav:'Main', home:'Starlit home',
    nav:{ remote:'PC remote', anime:'Anime', watch:'Watch &amp; download', sync:'Account &amp; sync', download:'Download' },
    labels:{ home:'Home', privacy:'Privacy policy', terms:'Terms of use', cookies:'Cookies and storage',
      delete:'Delete account', contact:'Contact and support', legal:'Legal information' },
    onThisPage:'On this page', documents:'Policies and help', updated:'Last updated:',
    readOther:'Ler em português', backToTop:'Back to top',
    ogAlt:'The Starlit logo, a play button holding a four-point star, on a night sky',
    footer:{
      about:`Anime and TV for Windows and Android. Based on <a href="${NUVIO}">Nuvio</a> by Tapframe and friends, and maintained by Beelzebub2. Not an official Nuvio release.`,
      product:'Product', project:'Project', legal:'Legal',
      projectLinks:[[RELEASES, 'Release notes'], [REPO, 'Source code'], [ISSUES, 'Report a problem'], [LICENSE_URL, 'GPL-3.0 licence']],
      legalLinks:{ privacy:'Privacy', terms:'Terms', cookies:'Cookies', delete:'Delete account', contact:'Contact', legal:'Legal information' },
      client:'Starlit is a client. It plays media from add-ons and sources you install, and it doesn’t host, store or distribute media. It isn’t affiliated with any add-on, catalogue, tracking service or content provider.',
    },
    notFound:{ title:'Page not found', heading:'This page doesn’t exist',
      body:'The link may be out of date, or the address may contain a typo. These pages can help:',
      description:'The page you asked for doesn’t exist on the Starlit website.' },
  },
  pt: {
    htmlLang:'pt-PT', ogLocale:'pt_PT', other:'en', otherLang:'en', otherShort:'EN', otherName:'English',
    skip:'Saltar para o conteúdo', mainNav:'Principal', home:'Início do Starlit',
    nav:{ remote:'Comando do PC', anime:'Anime', watch:'Ver e transferir', sync:'Conta e sincronização', download:'Transferir' },
    labels:{ home:'Início', privacy:'Política de privacidade', terms:'Termos de utilização', cookies:'Cookies e armazenamento',
      delete:'Apagar conta', contact:'Contacto e suporte', legal:'Informações legais' },
    onThisPage:'Nesta página', documents:'Políticas e ajuda', updated:'Última atualização:',
    readOther:'Read in English', backToTop:'Voltar ao início',
    ogAlt:'O logótipo do Starlit, um botão de reprodução com uma estrela de quatro pontas, num céu noturno',
    footer:{
      about:`Anime e séries para Windows e Android. Baseado no <a href="${NUVIO}">Nuvio</a>, da Tapframe e amigos, e mantido por Beelzebub2. Não é uma versão oficial do Nuvio.`,
      product:'Produto', project:'Projeto', legal:'Legal',
      projectLinks:[[RELEASES, 'Notas de versão'], [REPO, 'Código-fonte'], [ISSUES, 'Comunicar um problema'], [LICENSE_URL, 'Licença GPL-3.0']],
      legalLinks:{ privacy:'Privacidade', terms:'Termos', cookies:'Cookies', delete:'Apagar conta', contact:'Contacto', legal:'Informações legais' },
      client:'O Starlit é um cliente. Reproduz conteúdos a partir dos addons e fontes que instalas e não aloja, guarda nem distribui conteúdos multimédia. Não tem ligação a qualquer addon, catálogo, serviço de acompanhamento ou fornecedor de conteúdos.',
    },
    notFound:{ title:'Página não encontrada', heading:'Esta página não existe',
      body:'A ligação pode estar desatualizada ou o endereço pode ter um erro. Estas páginas podem ajudar:',
      description:'A página que pediste não existe no site do Starlit.' },
  },
};

// ---------------------------------------------------------------- assets

// Cloudflare doesn't compress these responses (Cache-Control: no-transform),
// so the stylesheet is shipped with comments and whitespace removed.
const minifyCss = css => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ')
  .replace(/\s*([{};,>])\s*/g, '$1').replace(/:\s+/g, ':').replace(/;}/g, '}').trim() + '\n';
const css = minifyCss(readFileSync(join(root, 'assets', 'site.css'), 'utf8'))
  .replace(/url\((\/assets\/[^)?]+)\)/g, (_, path) => `url(${asset(path)})`);
const cssHref = '/assets/site.css?v=' + hash(css);
const FONT_SANS = asset('/assets/fonts/geist-latin.woff2');
const FONT_DISPLAY = asset('/assets/fonts/bricolage-grotesque-latin.woff2');

// ---------------------------------------------------------------- layout

function head(lang, { title, description, path, alternates, noindex }) {
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
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#06070F">${links}
<link rel="icon" href="/assets/starlit-mark.svg" type="image/svg+xml">
<link rel="icon" href="/assets/starlit-logo.png" type="image/png" sizes="120x120">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="${FONT_SANS}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${FONT_DISPLAY}" as="font" type="font/woff2" crossorigin>
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

const brand = (lang, cls, size) => `<a class="brand ${cls}" href="${routes[lang].home}">${markImg('brand-mark', size)}<span>Starlit</span></a>`;

function header(lang, key, otherPath) {
  const t = ui[lang], r = routes[lang];
  const current = item => key === item ? ' aria-current="page"' : '';
  const items = ['remote', 'anime', 'watch', 'sync'].map(item =>
    `<a href="${r[item]}"${current(item)}>${t.nav[item]}</a>`).join('');
  return `
<a href="#main" class="skip">${t.skip}</a>
<header class="site-header">
  <div class="wrap header-inner">
    ${brand(lang, 'brand-header', 32)}
    <nav class="nav-main" aria-label="${t.mainNav}">${items}</nav>
    <div class="header-actions">
      <a class="lang-switch" href="${otherPath}" hreflang="${t.otherLang}" lang="${t.otherLang}"><span aria-hidden="true">${t.otherShort}</span><span class="vh">${t.otherName}</span></a>
      <a class="nav-gh" href="${REPO}">GitHub</a>
      <a class="btn btn-accent btn-sm" href="${r.download}"${current('download')}>${t.nav.download}</a>
    </div>
  </div>
</header>`;
}

function footer(lang, otherPath) {
  const t = ui[lang], f = t.footer, r = routes[lang];
  const li = (href, label) => `<li><a href="${href}">${label}</a></li>`;
  const column = (id, title, links) => `<nav class="footer-col" aria-labelledby="fn-${id}"><h2 id="fn-${id}" class="label-mono">${title}</h2><ul role="list">${links}</ul></nav>`;
  return `
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-brand">
        ${brand(lang, 'brand-footer', 28)}
        <p>${f.about}</p>
      </div>
      ${column('product', f.product, ['remote', 'anime', 'watch', 'sync', 'download'].map(k => li(r[k], t.nav[k])).join(''))}
      ${column('project', f.project, f.projectLinks.map(([href, label]) => li(href, label)).join(''))}
      ${column('legal', f.legal, DOCS.map(k => li(r[k], f.legalLinks[k])).join(''))}
    </div>
    <div class="footer-base">
      <p>${f.client}</p>
      <p class="footer-contact"><a href="mailto:${CONTACT}">${CONTACT}</a> · <a href="${otherPath}" hreflang="${t.otherLang}" lang="${t.otherLang}">${t.otherName}</a></p>
    </div>
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
      <p class="cta-row">${content.actions.links.map(([href, label], i) =>
        `<a class="btn ${i === 0 ? 'btn-accent' : 'btn-ghost'}" href="${escape(href)}">${label}</a>`).join('')}</p>
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
  const t = ui[lang], n = t.notFound, r = routes[lang];
  const links = [[r.home, t.labels.home], [r.download, t.nav.download],
    [r.privacy, t.labels.privacy], [r.contact, t.labels.contact]];
  return `
<section class="not-found" aria-labelledby="nf-title">
  <div class="wrap not-found-inner">
    ${markImg('nf-mark', 160)}
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
// Browsers ask for these two at the site root.
for (const file of ['apple-touch-icon.png', 'favicon.ico']) {
  cpSync(join(root, 'assets', 'icons', file), join(dist, file));
}

let count = 0;
for (const lang of ['en', 'pt']) {
  const other = ui[lang].other;
  // Section anchors each page exposes, so pages can link into one another.
  const pageIds = Object.fromEntries(PRODUCT.map(key => [key, product[key].ids?.[lang] ?? {}]));
  for (const key of KEYS) {
    const isProduct = PRODUCT.includes(key);
    const info = isProduct ? product[key].meta[lang] : docs[lang][key];
    const main = isProduct ? product[key].render(lang, { r: routes[lang], pageIds })
      : renderDoc(lang, key, docs[lang][key]);
    const html = page(lang, key, {
      title: key === 'home' ? info.title : info.title + (isProduct ? '' : ' | Starlit'),
      description: info.description,
      path: routes[lang][key],
      alternates: { en: routes.en[key], pt: routes.pt[key] },
      otherPath: routes[other][key],
      bodyClass: isProduct ? 'page-' + key : 'page-doc',
    }, main);
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
