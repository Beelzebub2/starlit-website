#!/usr/bin/env node
import { readFileSync, writeFileSync, cpSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { legalCopy } from './legal-content.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const output = resolve(root, 'dist');
const catalog = JSON.parse(readFileSync(join(root, 'data/catalog.json'), 'utf8'));
const ORIGIN = 'https://starlitplugins.rrmtools.uk';
const esc = v => String(v).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const isValidGitHub = value => /^(?:[A-Za-z\d_.-]+)\/(?:[A-Za-z\d_.-]+)$/.test(value);
const allowed = new Set(['source-visible', 'unavailable']);
if (!/^\d{4}-\d{2}-\d{2}$/.test(catalog.snapshotDate)) throw Error('Snapshot date must be ISO');
if (!Array.isArray(catalog.repositories) || !catalog.repositories.length) throw Error('Catalog is empty');
if (new Set(catalog.repositories.map(r => r.id)).size !== catalog.repositories.length) throw Error('Duplicate IDs');
for (const r of catalog.repositories) {
  if (!/^[a-z][a-z0-9-]{1,48}$/.test(r.id) || !isValidGitHub(r.repo) || !['main', 'master'].includes(r.branch) || !allowed.has(r.status)) throw Error('Invalid catalog entry: ' + r.id);
  if (!Array.isArray(r.providers) || !Array.isArray(r.languages) || !r.languages.every(x => /^[a-z]{2,3}$/.test(x))) throw Error('Invalid metadata: ' + r.id);
  if (r.status === 'unavailable' && r.providers.length) throw Error('Unverified manifest must not claim providers');
  if (!r.publication || !['candidate','approved','suspended'].includes(r.publication.reviewState)) throw Error('Missing publication review state: '+r.id);
}
const count = catalog.repositories.filter(r => r.status === 'source-visible').length;
const providers = catalog.repositories.reduce((n, r) => n + r.providers.length, 0);
const copy = {
  en: {
    lang: 'en', title: 'Starlit Plugins — Community repository directory', desc:'Find community JavaScript plugin repositories for Starlit. Browse available providers, compare languages, and copy original manifest URLs.',
    navSearch:'Repository directory', navGuide:'How to install', navSafety:'Safety & legal', site:'Starlit website',
    h1:'Find your next source.', lead:'Explore independently maintained JavaScript repositories for Starlit. Browse their providers, check the publisher, and copy a manifest when you choose.',
    snapshot:'Catalog snapshot', published:'Repository sources reachable', providers:'Provider entries indexed', total:'Community repository candidates',
    browse:'Browse repositories', browseSub:'Original publisher manifests, checked at the snapshot date. Repository availability and content rights can change.',
    searchLabel:'Search repositories and provider names', searchHint:'Search a repository, publisher or provider…', filterLabel:'Filter by language', sortLabel:'Order', sortName:'Name A–Z', sortProviders:'Most providers', sortAvailability:'Available first',
    available:'Manifest available', missing:'Manifest unavailable', manual:'Manual installation only', noticeTitle:'Independent code. Your choice.',
    notice:'These are third-party software projects, not Starlit endorsements. A reachable manifest does not mean its code is audited or its media sources licensed. Only install plugins you trust and only use sources you are authorized to access.',
    guideTitle:'One manifest. Your selection.', guideLead:'No in-app store, no sign-in to browse, and nothing installed by this website. The copy action simply gives you the original repository address.',
    guideA:'Choose a repository', guideADesc:'Check the author, the listed providers and the original source code.',
    guideB:'Copy the manifest', guideBDesc:'Use the Copy manifest action on a repository with an available source.',
    guideC:'Add it in Starlit', guideCDesc:'Open Starlit → Settings → Content & Discovery → Plugins → Add repository. Paste the URL and choose the providers you want.',
    guideNote:'Starlit plugins are downloaded JavaScript executed by the application. Some platform builds do not support plugins. Installing a repository can include multiple providers.',
    legalTitle:'Designed to inform, not to distribute media.', legalLead:'This website does not host, store or transmit films, series or live streams. All repository code and links are maintained by independent authors on their own services.',
    legalBody:'The listing of a repository is not a license to access copyrighted material, a warranty of security, or approval of its services. Use only content you have permission to access. Copyright holders, publishers or researchers may request review or removal of a listing.',
    report:'Report a listing', github:'Browse Starlit source', back:'Starlit', footer:'Starlit Plugins is an independent community-directory project for the Starlit ecosystem. Not affiliated with Nuvio or individual plugin publishers.',
    last:'Data checked', results:'repositories shown', all:'All languages', read:'Read source', copy:'Copy manifest', inspect:'View providers', hide:'Hide providers', items:'providers', unavailableLabel:'No verified manifest', unavailableDesc:'This candidate could not be verified against an accessible source manifest. Copying is disabled.',
    empty:'Nothing matches those filters.', clear:'Clear filters', copied:'Manifest URL copied', copyFailed:'Copy unavailable. Select this URL instead:', actions:'Repository actions', source:'Publisher repository', loading:'Loading repository index…', error:'Catalog unavailable. Reload the page to try again.', skip:'Skip to repository directory', about:'About this site', privacy:'Privacy', privacyText:'No account, tracking scripts or browser storage are required. Normal web-server requests may be logged for security and operations.',
    full:'Provider list', legalLink:'Full legal information', expandTitle:'Show repository providers', loadingNotice:'Not a legal or security review', version:'Manifest version', countNote:'Counts reflect a dated metadata snapshot, not working streams or unique content sources.'
  },
  pt: {
    lang: 'pt-PT', title:'Starlit Plugins — Diretório de repositórios da comunidade', desc:'Descobre repositórios de plugins JavaScript para o Starlit. Pesquisa fornecedores, compara idiomas e copia URLs dos manifestos originais.',
    navSearch:'Repositórios', navGuide:'Como instalar', navSafety:'Segurança e legal', site:'Site do Starlit',
    h1:'Encontra uma nova fonte.', lead:'Explora repositórios JavaScript mantidos pela comunidade para o Starlit. Consulta os fornecedores, verifica o autor e copia um manifesto se o quiseres utilizar.',
    snapshot:'Dados de', published:'Repositórios acessíveis', providers:'Fornecedores listados', total:'Candidatos da comunidade',
    browse:'Explorar repositórios', browseSub:'Manifestos dos autores, verificados na data indicada. A disponibilidade e os direitos de acesso podem mudar.',
    searchLabel:'Pesquisar repositórios e fornecedores', searchHint:'Pesquisa um repositório, autor ou fornecedor…', filterLabel:'Filtrar por idioma', sortLabel:'Ordenar', sortName:'Nome A–Z', sortProviders:'Mais fornecedores', sortAvailability:'Disponíveis primeiro',
    available:'Manifesto disponível', missing:'Manifesto indisponível', manual:'Instalação manual', noticeTitle:'Código independente. A tua escolha.',
    notice:'Estes projetos são software de terceiros e não têm a aprovação do Starlit. Um manifesto acessível não significa que o código tenha sido auditado ou que as fontes tenham licença. Instala apenas plugins em que confias e utiliza conteúdos aos quais tens acesso autorizado.',
    guideTitle:'Um manifesto. Tu decides.', guideLead:'Sem loja integrada, sem conta para pesquisar e sem instalações feitas por este site. O botão de copiar limita-se a fornecer o endereço original do repositório.',
    guideA:'Escolhe um repositório', guideADesc:'Verifica o autor, os fornecedores disponíveis e o código-fonte original.',
    guideB:'Copia o manifesto', guideBDesc:'Utiliza Copiar manifesto num repositório com uma fonte disponível.',
    guideC:'Adiciona-o ao Starlit', guideCDesc:'Abre Starlit → Definições → Conteúdo e descoberta → Plugins → Adicionar repositório. Cola o URL e escolhe os fornecedores.',
    guideNote:'Os plugins do Starlit são código JavaScript transferido e executado pela aplicação. Algumas versões não suportam plugins. Um repositório pode conter vários fornecedores.',
    legalTitle:'Para informar, não para distribuir conteúdos.', legalLead:'Este site não aloja, guarda ou transmite filmes, séries ou transmissões em direto. O código e os links dos repositórios são mantidos pelos respetivos autores, em serviços externos.',
    legalBody:'A presença de um repositório não constitui uma licença para aceder a material protegido por direitos de autor, uma garantia de segurança ou a aprovação dos serviços associados. Utiliza apenas conteúdos aos quais tens direito de acesso. Os titulares de direitos, autores ou investigadores podem pedir a análise ou remoção de uma entrada.',
    report:'Comunicar um repositório', github:'Código-fonte do Starlit', back:'Starlit', footer:'Starlit Plugins é um diretório independente da comunidade Starlit. Sem associação ao Nuvio nem aos autores dos plugins.',
    last:'Dados verificados', results:'repositórios apresentados', all:'Todos os idiomas', read:'Ver código-fonte', copy:'Copiar manifesto', inspect:'Ver fornecedores', hide:'Ocultar fornecedores', items:'fornecedores', unavailableLabel:'Manifesto não verificado', unavailableDesc:'Não foi possível verificar um manifesto acessível para este candidato. A cópia está desativada.',
    empty:'Não existem resultados para estes filtros.', clear:'Limpar filtros', copied:'URL do manifesto copiado', copyFailed:'Não foi possível copiar. Seleciona este endereço:', actions:'Ações do repositório', source:'Repositório do autor', loading:'A carregar repositórios…', error:'Não foi possível carregar o catálogo. Atualiza a página.', skip:'Saltar para os repositórios', about:'Sobre este site', privacy:'Privacidade', privacyText:'Não é necessária conta, análise de utilização ou armazenamento no browser. Os pedidos ao servidor podem ser registados para segurança e funcionamento.',
    full:'Lista de fornecedores', legalLink:'Informação legal completa', expandTitle:'Mostrar os fornecedores', loadingNotice:'Sem auditoria jurídica ou de segurança', version:'Versão do manifesto', countNote:'Os números representam uma cópia de metadados com data, não transmissões funcionais nem fontes de conteúdos únicas.'
  }
};
const make = (language) => {
  const t = copy[language], pt = language === 'pt';
  const url = pt ? '/pt/' : '/';
  const alt = pt ? '/' : '/pt/';
  return `<!doctype html>
<html lang="${t.lang}" data-lang="${language}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t.title)}</title><meta name="description" content="${esc(t.desc)}">
<link rel="icon" type="image/svg+xml" href="/assets/starlit-mark.svg">
<link rel="stylesheet" href="/assets/site.css"><script type="module" src="/assets/site.js"></script>
<link rel="canonical" href="${ORIGIN+url}">
<link rel="alternate" hreflang="en" href="${ORIGIN}/"><link rel="alternate" hreflang="pt-PT" href="${ORIGIN}/pt/"><link rel="alternate" hreflang="x-default" href="${ORIGIN}/">
<meta name="theme-color" content="#06070f"><meta name="color-scheme" content="dark">
</head><body>
<a class="skip" href="#catalog">${esc(t.skip)}</a>
<header class="topbar"><div class="topbar-inner">
<a class="identity" href="/" aria-label="Starlit Plugins"><img src="/assets/starlit-mark.svg" width="34" height="34" alt=""><span>Starlit <strong>Plugins</strong></span></a>
<nav class="site-nav" aria-label="${esc(t.navSearch)}"><a href="#catalog">${esc(t.navSearch)}</a><a href="#guide">${esc(t.navGuide)}</a><a href="#safety">${esc(t.navSafety)}</a></nav>
<div class="top-actions"><a class="language" href="${alt}" lang="${pt?'en':'pt-PT'}" hreflang="${pt?'en':'pt-PT'}">${pt?'English':'Português'}</a><a class="back-link" href="https://starlit.rrmtools.uk/" rel="noopener">${esc(t.site)} <span aria-hidden="true">↗</span></a></div>
</div></header>
<main id="main">
<section class="intro wrap" aria-labelledby="headline"><div class="intro-main"><h1 id="headline">${esc(t.h1)}</h1><p>${esc(t.lead)}</p></div><div class="snapshot"><span>${esc(t.snapshot)} ${esc(catalog.snapshotDate)}</span><p><strong>${count}</strong> <span>${esc(t.published)}</span></p><p><strong>${providers}</strong> <span>${esc(t.providers)}</span></p></div></section>
<section class="directory wrap" id="catalog" aria-labelledby="directory-heading">
<div class="section-head"><div><h2 id="directory-heading">${esc(t.browse)}</h2><p>${esc(t.browseSub)}</p></div><span class="counter">${catalog.repositories.length} ${esc(t.total)}</span></div>
<div class="layout"><aside class="filter-panel" aria-labelledby="filter-heading"><h3 id="filter-heading">${esc(t.filterLabel)}</h3><div id="filters" class="filter-list" role="group" aria-label="${esc(t.filterLabel)}"></div><div class="filter-note"><p>${esc(t.noticeTitle)}</p><small>${esc(t.notice)}</small></div></aside>
<div class="results"><div class="toolbar"><label class="search"><span class="visually-hidden">${esc(t.searchLabel)}</span><svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="search" type="search" autocomplete="off" placeholder="${esc(t.searchHint)}" aria-controls="repository-list"></label><label class="sort"><span>${esc(t.sortLabel)}</span><select id="sort"><option value="available">${esc(t.sortAvailability)}</option><option value="count">${esc(t.sortProviders)}</option><option value="name">${esc(t.sortName)}</option></select></label></div>
<div class="result-caption"><span id="result-count" aria-live="polite"></span><span>${esc(t.manual)}</span></div>
<div id="repository-list" class="repository-list" aria-live="off"><p class="loading">${esc(t.loading)}</p></div>
<noscript><div class="no-js"><p>${esc(t.guideLead)}</p><ul>${catalog.repositories.map(r=>`<li><a href="https://github.com/${esc(r.repo)}">${esc(r.name)}</a> · ${esc(r.publisher)} · ${r.providers.length} ${esc(t.items)}</li>`).join('')}</ul></div></noscript>
<p class="count-note">${esc(t.countNote)}</p></div></div></section>
<section class="guide wrap" id="guide" aria-labelledby="guide-title"><div class="guide-copy"><h2 id="guide-title">${esc(t.guideTitle)}</h2><p>${esc(t.guideLead)}</p></div><ol class="guide-steps"><li><strong>${esc(t.guideA)}</strong><p>${esc(t.guideADesc)}</p></li><li><strong>${esc(t.guideB)}</strong><p>${esc(t.guideBDesc)}</p></li><li><strong>${esc(t.guideC)}</strong><p>${esc(t.guideCDesc)}</p></li></ol><p class="guide-note">${esc(t.guideNote)}</p></section>
<section class="safety" id="safety" aria-labelledby="legal-title"><div class="wrap safety-inner"><div><h2 id="legal-title">${esc(t.legalTitle)}</h2><p class="safety-lead">${esc(t.legalLead)}</p><p>${esc(t.legalBody)}</p><a class="legal-detail-link" href="${pt?'/pt/legal/':'/legal/'}">${esc(t.legalLink)} <span aria-hidden="true">↗</span></a></div><div class="safety-contact"><a class="report-link" href="mailto:support.starlit@rrmtools.uk?subject=${encodeURIComponent('Plugin directory report')}">${esc(t.report)} <span aria-hidden="true">↗</span></a><p>${esc(t.privacyText)}</p></div></div></section>
</main>
<footer class="footer wrap"><div class="footer-brand"><img src="/assets/starlit-mark.svg" width="42" height="42" alt=""><span>Starlit Plugins</span></div><p>${esc(t.footer)}</p><div class="footer-links"><a href="https://starlit.rrmtools.uk/" rel="noopener">${esc(t.back)}</a><a href="https://github.com/Beelzebub2/starlit" rel="noopener">${esc(t.github)}</a><a href="${pt?'/pt/legal/':'/legal/'}">${esc(t.legalLink)}</a><a href="mailto:support.starlit@rrmtools.uk?subject=Plugin%20directory">${esc(t.report)}</a></div></footer>
<div class="toast" role="status" id="toast" aria-live="polite" hidden></div>
<script id="translations" type="application/json">${JSON.stringify(t).replaceAll('<','\\u003c')}</script>
</body></html>`;
};
function makeLegal(language) {
  const t = legalCopy[language];
  const pt = language === 'pt';
  const route = pt ? '/pt/legal/' : '/legal/';
  const other = pt ? '/legal/' : '/pt/legal/';
  const back = pt ? '/pt/' : '/';
  const sections = t.sections.map((section, i) => `<section class="legal-section" aria-labelledby="policy-${i}"><h2 id="policy-${i}">${esc(section.title)}</h2>${section.body.map(p => `<p>${esc(p)}</p>`).join('')}</section>`).join('');
  return `<!doctype html>
<html lang="${pt?'pt-PT':'en'}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(t.title)} | Starlit Plugins</title><meta name="description" content="${esc(t.subtitle)}">
<link rel="icon" type="image/svg+xml" href="/assets/starlit-mark.svg">
<link rel="stylesheet" href="/assets/site.css">
<link rel="canonical" href="${ORIGIN}${route}">
<link rel="alternate" hreflang="en" href="${ORIGIN}/legal/"><link rel="alternate" hreflang="pt-PT" href="${ORIGIN}/pt/legal/">
<meta name="theme-color" content="#06070f"><meta name="color-scheme" content="dark">
</head><body class="legal-body">
<a class="skip" href="#policy">${esc(t.kicker)}</a>
<header class="topbar"><div class="topbar-inner">
<a class="identity" href="${back}"><img src="/assets/starlit-mark.svg" alt="" width="34" height="34"><span>Starlit <strong>Plugins</strong></span></a>
<div class="top-actions"><a class="language" href="${other}" hreflang="${pt?'en':'pt-PT'}">${esc(t.other)}</a><a class="back-link" href="${back}">${esc(t.home)}</a></div>
</div></header>
<main id="policy" class="wrap legal-main"><header class="legal-intro"><a class="legal-back" href="${back}">← ${esc(t.home)}</a><h1>${esc(t.title)}</h1><p>${esc(t.subtitle)}</p></header>
<div class="legal-content">${sections}</div>
<div class="legal-contacts"><a class="report-link" href="mailto:support.starlit@rrmtools.uk?subject=Starlit%20Plugins%20rights%20or%20security%20report">${esc(t.contact)} ↗</a><a href="https://starlit.rrmtools.uk/privacy/">${esc(t.policy)}</a><a href="https://starlit.rrmtools.uk/terms/">${esc(t.terms)}</a></div>
<footer class="legal-footnote"><p>${esc(t.footer)}</p><p>${esc(t.last)}</p></footer>
</main></body></html>`;
}
mkdirSync(join(output, 'assets'), { recursive: true });
mkdirSync(join(output, 'pt'), { recursive: true });
writeFileSync(join(output,'index.html'), make('en'));
writeFileSync(join(output,'pt','index.html'), make('pt'));
mkdirSync(join(output,'legal'), { recursive: true });
mkdirSync(join(output,'pt','legal'), { recursive: true });
writeFileSync(join(output,'legal','index.html'), makeLegal('en'));
writeFileSync(join(output,'pt','legal','index.html'), makeLegal('pt'));
for (const file of ['site.css','site.js','starlit-mark.svg']) cpSync(join(root,'assets',file), join(output,'assets',file));
cpSync(join(root,'data','catalog.json'), join(output,'catalog.json'));
const possibleFonts = join(root, '..', 'assets', 'fonts');
if(existsSync(possibleFonts)) cpSync(possibleFonts, join(output,'assets','fonts'), {recursive:true});
writeFileSync(join(output,'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'/sitemap.xml\n');
writeFileSync(join(output,'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+ORIGIN+'/</loc></url><url><loc>'+ORIGIN+'/pt/</loc></url><url><loc>'+ORIGIN+'/legal/</loc></url><url><loc>'+ORIGIN+'/pt/legal/</loc></url></urlset>');
const csp = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'; upgrade-insecure-requests";
writeFileSync(join(output,'_headers'), '/*\n  Content-Security-Policy: '+csp+'\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()\n  Cache-Control: public, max-age=300\n');
console.log('Built Starlit Plugins: '+catalog.repositories.length+' publisher candidates, '+count+' checked manifests, '+providers+' indexed provider entries.');
