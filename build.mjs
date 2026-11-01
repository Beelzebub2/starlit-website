import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { en, pt, routes, CONTACT, UPDATED } from './content.mjs';

const origin = 'https://starlit.rrmtools.uk';
const dir = new URL('.', import.meta.url).pathname;
const root = decodeURIComponent(dir.startsWith('/') && /^[a-zA-Z]:/.test(dir.slice(1)) ? dir.slice(1) : dir);
const dist = join(root, 'dist');
const logo = '/assets/starlit-logo.png';

const escape = value => String(value).replace(/[&"<>]/g, c =>
  ({ '&':'&amp;', '"':'&quot;', '<':'&lt;', '>':'&gt;' }[c]));

const labels = {
  en: { home:'Home', privacy:'Privacy', terms:'Terms', cookies:'Cookies',
    delete:'Delete account', contact:'Contact', legal:'Legal' },
  pt: { home:'Início', privacy:'Privacidade', terms:'Termos', cookies:'Cookies',
    delete:'Apagar conta', contact:'Contacto', legal:'Informações legais' },
};

function render(lang, key, content) {
  const isPt = lang === 'pt';
  const here = routes[lang][key];
  const other = routes[isPt ? 'en' : 'pt'][key];
  const linkset = Object.entries(labels[lang])
    .filter(([item]) => ['home','privacy','terms','contact'].includes(item))
    .map(([item,label]) => '<a href="' + routes[lang][item] + '"' +
      (key === item ? ' aria-current="page"' : '') + '>' + label + '</a>').join('');
  const footer = Object.entries(labels[lang]).filter(([item]) => item !== 'home')
    .map(([item,label]) => '<a href="' + routes[lang][item] + '">' + label + '</a>').join('');
  const canonical = origin + here;
  const pageTitle = key === 'home' ? 'Starlit · RRMTools' : escape(content.title) + ' | Starlit · RRMTools';
  return `<!doctype html>
<html lang="${isPt ? 'pt-PT' : 'en'}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${escape(content.description)}">
<meta name="color-scheme" content="dark">
<title>${pageTitle}</title>
<link rel="icon" href="${logo}" type="image/png">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="en" href="${origin + routes.en[key]}">
<link rel="alternate" hreflang="pt-PT" href="${origin + routes.pt[key]}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escape(content.title)}">
<meta property="og:description" content="${escape(content.description)}">
<meta property="og:image" content="${origin + logo}">
<link rel="stylesheet" href="/assets/site.css">
</head><body class="${key === 'home' ? 'home' : 'legal'}">
<a href="#main" class="skip">${isPt ? 'Saltar para o conteúdo' : 'Skip to content'}</a>
<header class="site-header"><div class="wrap">
<a class="brand" href="${routes[lang].home}"><img src="${logo}" alt="" width="54" height="54">Starlit</a>
<nav aria-label="${isPt ? 'Navegação principal' : 'Main navigation'}">${linkset}
<a class="lang-switch" href="${other}" hreflang="${isPt ? 'en' : 'pt-PT'}" lang="${isPt ? 'en' : 'pt-PT'}">${isPt ? 'English' : 'Português'}</a></nav>
</div></header>
<main id="main"><div class="wrap">${key === 'home' ? content.html :
  '<article class="legal-content"><h1>' + escape(content.title) +
  '</h1><p class="lede">' + escape(content.description) +
  '</p><p class="meta">' + (isPt ? 'Última atualização: 1 de novembro de 2026' :
  'Last updated: ' + UPDATED) + '</p>' + content.html + '</article>'}
</div></main>
<footer class="site-footer"><div class="wrap">
<div><a class="brand" href="${routes[lang].home}">Starlit</a>
<p>${isPt ? 'Projeto RRMTools. Suporte, privacidade e contactos legais:' :
  'An RRMTools project. Support, privacy and legal contact:'}
<a href="mailto:${CONTACT}">${CONTACT}</a>.</p>
<p>${isPt ? 'Informações sobre tratamento de dados e direitos disponíveis na' :
  'Information on data processing and rights is in the'}
<a href="${routes[lang].privacy}">${isPt ? 'política de privacidade' : 'privacy policy'}</a>.</p></div>
<nav aria-label="${isPt ? 'Ligações legais' : 'Legal links'}" class="footer-links">${footer}</nav>
</div></footer></body></html>`;
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const [lang, content] of Object.entries({ en, pt })) {
  for (const [key, definition] of Object.entries(content)) {
    const route = routes[lang][key];
    const target = join(dist, route.replace(/^\/+|\/+$/g, ''), 'index.html');
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, render(lang, key, definition), 'utf8');
  }
}
cpSync(join(root, 'assets'), join(dist, 'assets'), { recursive:true });
writeFileSync(join(dist, 'robots.txt'),
  'User-agent: *\nAllow: /\nSitemap: ' + origin + '/sitemap.xml\n', 'utf8');
const sitemap = Object.values(routes).flatMap(r => Object.values(r))
  .map(path => '  <url><loc>' + origin + path + '</loc></url>').join('\n');
writeFileSync(join(dist, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  sitemap + '\n</urlset>\n', 'utf8');
mkdirSync(join(dist, '.well-known'), { recursive:true });
writeFileSync(join(dist, '.well-known', 'security.txt'),
  'Contact: mailto:' + CONTACT + '\nExpires: 2027-11-01T00:00:00Z\nPreferred-Languages: pt, en\n',
  'utf8');
writeFileSync(join(dist, '_headers'), `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Content-Security-Policy: default-src 'none'; style-src 'self'; img-src 'self'; font-src 'none'; connect-src 'none'; script-src 'none'; object-src 'none'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'; upgrade-insecure-requests
  Cache-Control: public, max-age=300, no-transform
/assets/*
  Cache-Control: public, max-age=3600
`, 'utf8');
console.log('Built 14 localised pages and static security assets in dist/');
