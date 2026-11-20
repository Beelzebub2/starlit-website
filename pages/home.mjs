// Homepage: one scroll page that shows the product with real screens.
//
// Every screenshot is the real Starlit desktop app (1.32), captured in an
// empty sandbox profile against a local demo catalog: the titles, artwork and
// descriptions are made up, and no streaming source appears. See
// tools/screenshots/README.md. Feature claims follow the Starlit README and
// release notes; re-check them after each release. The version, "New" pill
// and shipping log come from the GitHub releases and site.js keeps them current.
//
// Everything that moves is CSS (assets/site.css): the public CSP forbids
// inline styles and scripts, and the page must work with no JavaScript.
import { VERSION, LATEST_RELEASE, RELEASE_DATA } from '../constants.mjs';
import { icon, pill, markImg, esc, inEnglish, rel, asset } from '../ui.mjs';

const copy = {
  en: {
    meta: {
      title: 'Starlit: anime and TV on your PC, run from your phone',
      description: 'Starlit is a free, open-source anime and TV app for Windows, Linux x86_64 and Android, with a phone remote, Airing Now schedules, offline downloads and optional account sync.',
    },
    news: 'New',
    title: 'Every show you follow, <span class="hl">in one sky.</span>',
    lede: 'A free, open-source app for anime and TV on Windows, Linux and Android. Your add-ons, a player built on mpv, offline downloads and one library that follows you everywhere.',
    ctaWin: 'Download for Windows', ctaAll: 'All platforms',
    metaLine: `v${rel('version', VERSION)} · Windows 10 &amp; 11 · Linux x86_64 · Android 7.0+ · GPL-3.0`,
    tvLink: 'Samsung and LG TVs: meet the TV Installer (in development)',
    logo: 'The Starlit logo: a play button holding a four-point star',
    demo: 'Real Starlit screens, shown with made-up demo titles.',
    shots: {
      home: 'The Starlit Home screen on Windows: a featured title with its description and a View Details button above the catalog rows',
      homeRows: 'Starlit Home with a Continue Watching card and a row of series posters',
      episodes: 'A Starlit details page: Next Up, Library, Watch Later and Watched buttons, season tabs and episode cards',
      skips: 'Starlit playback settings: Skip Intro, Automatic Skipping, Anime Skip and intro submission',
      library: 'The Starlit Library: saved series as posters, with search, sorting and a rows or grid layout',
      themes: 'Starlit appearance settings: eight colour themes, from White to Rose',
      signin: 'The Starlit sign-in screen: email and password, passkey, Google, or continue without an account',
      discover: 'Starlit Discover: a grid of posters filtered by type, catalog and genre',
      details: 'The top of a Starlit details page with the title, genres, description and actions',
    },
    features: {
      kicker: 'Inside Starlit',
      title: 'Everything a season needs, in one calm app.',
      list: [
        { id: 'home', n: '01', label: 'Home', title: 'One Home for every catalog.',
          body: 'A featured banner, Continue Watching, and the rows from the add-ons you install, in the order you choose.',
          points: ['Continue Watching picks up where you stopped', 'Airing Now brings today’s anime episodes to Home', 'Hide, rename and reorder rows in Settings'],
          shot: 'home-rows', alt: 'homeRows' },
        { id: 'details', n: '02', label: 'Details', title: 'Every episode at a glance.',
          body: 'Seasons, episode cards and your progress on one page, with Next Up ready to play.',
          points: ['Add to Library or Watch Later in one click', 'Mark episodes or whole seasons as watched', 'Download a season for offline viewing'],
          shot: 'episodes', alt: 'episodes' },
        { id: 'player', n: '03', label: 'Player', title: 'Built on mpv. Skips the bits you’ve seen.',
          body: 'Intro, recap and credits skipping, a side panel for subtitle tracks, style and timing, and the next episode lined up when the credits roll.',
          points: ['Skip segments from IntroDB, with AnimeSkip as an option', 'Preferred audio and subtitle languages', 'Auto-play the next episode, or ask first'],
          shot: 'skips', alt: 'skips', small: true },
        { id: 'library', n: '04', label: 'Library', title: 'Your library, on every device.',
          body: 'Saved titles, Watch Later and collections, kept per profile and synced between Windows and Android when you sign in.',
          points: ['Search, sort and switch between rows and grid', 'Separate libraries for every profile', 'Manage it on the web from your account page'],
          shot: 'library', alt: 'library' },
        { id: 'style', n: '05', label: 'Make it yours', title: 'Eight themes. Two layouts. Six icons.',
          body: 'Pick a colour theme, a top bar or a sidebar, pure black for OLED screens, and an app icon to match.',
          points: ['Themes from White to Rose, or your own colour', 'Top bar or sidebar navigation on desktop', 'Six app icon colourways'],
          shot: 'themes', alt: 'themes', small: true },
      ],
    },
    gallery: { kicker: 'More screens', title: 'Designed for a big screen and a couch.' },
    extras: {
      title: 'And the rest of the sky.',
      list: [
        ['phone', 'PC remote', 'Pair your Android phone by QR code and run the PC from the couch: play, seek, skip intros and switch episodes or subtitles.', 'Wi-Fi · Bluetooth beta'],
        ['calendar', 'Airing Now', 'Today’s and upcoming anime episodes from AniList, with Sub and Dub times from Tsuzuki, in your time zone.', ''],
        ['listCheck', 'Tracking', 'MyAnimeList, Trakt, Simkl and MDBList from the details page, with correct episode numbers.', ''],
        ['download', 'Offline', 'Each episode finds its own best-quality source and resumes after a restart.', ''],
      ],
    },
    account: { kicker: 'Account', title: 'Start on the PC. Finish on the phone.',
      body: 'Sign in with email, a passkey or Google, and your library, history and resume points follow you between devices. Email sign-ups ask you to verify your email first. Prefer no account? Continue without one and keep everything on the device.',
      cta: 'Open your account', shot: 'signin' },
    status: { kicker: 'Platforms', title: 'Where Starlit runs today', as: `Status as of release ${rel('version', VERSION)}`,
      available: 'Available', beta: 'Beta', notYet: 'Not yet', items: [
        ['ok', 'monitor', 'Windows 10 &amp; 11', 'Own installer, no admin rights, verified in-app updates.'],
        ['ok', 'phone', 'Android 7.0 and later', 'Signed APKs with every release on GitHub.'],
        ['ok', 'terminal', 'Linux x86_64', 'DEB, RPM, AppImage and Flatpak. X11/XWayland; device playback validation still pending.'],
        ['ok', 'tv', 'Android TV', 'A TV build made for the remote, in every release.'],
        ['beta', 'bluetooth', 'Phone remote over Bluetooth', 'Windows PC and Android phone, no shared network needed.'],
        ['no', 'tv', 'Samsung Tizen &amp; LG webOS', 'The Windows TV Installer is in development. No stable TV download yet.'],
      ] },
    log: { label: 'Recent releases', title: 'Shipping log', all: 'All notes' },
    get: { title: 'Bring every show into one sky.',
      body: 'Free, open source and yours to keep. Starlit is a client: you bring the add-ons and sources you’re allowed to use. It doesn’t host or sell any media.',
      win: ['Windows', 'Installer · 10 &amp; 11, 64-bit'], android: ['Android', 'APK · Android 7.0+'], linux: ['Linux', 'x86_64 · DEB, RPM, AppImage, Flatpak'] },
  },

  pt: {
    meta: {
      title: 'Starlit: anime e séries no PC, comandados pelo telemóvel',
      description: 'O Starlit é uma aplicação gratuita e de código aberto de anime e séries para Windows, Linux x86_64 e Android, com comando pelo telemóvel, Airing Now, transferências offline e sincronização opcional.',
    },
    news: 'Novo',
    title: 'Todas as tuas séries, <span class="hl">no mesmo céu.</span>',
    lede: 'Uma aplicação gratuita e de código aberto de anime e séries para Windows, Linux e Android. Os teus addons, um leitor baseado no mpv, transferências offline e uma biblioteca que te acompanha para todo o lado.',
    ctaWin: 'Transferir para Windows', ctaAll: 'Todas as plataformas',
    metaLine: `v${rel('version', VERSION)} · Windows 10 e 11 · Linux x86_64 · Android 7.0+ · GPL-3.0`,
    tvLink: 'TVs Samsung e LG: conhece o TV Installer (em desenvolvimento)',
    logo: 'O logótipo do Starlit: um botão de reprodução com uma estrela de quatro pontas',
    demo: 'Ecrãs reais do Starlit, com títulos de demonstração fictícios.',
    shots: {
      home: 'O ecrã Início do Starlit no Windows: um título em destaque com a descrição e o botão Ver detalhes, por cima das filas do catálogo',
      homeRows: 'O Início do Starlit com um cartão em Continuar a ver e uma fila de pósteres de séries',
      episodes: 'Uma página de detalhes do Starlit: botões Seguinte, Biblioteca, Ver mais tarde e Visto, separadores de temporada e cartões de episódios',
      skips: 'Definições de reprodução do Starlit: saltar introdução, salto automático, Anime Skip e envio de introduções',
      library: 'A biblioteca do Starlit: séries guardadas como pósteres, com pesquisa, ordenação e vista em filas ou grelha',
      themes: 'Definições de aspeto do Starlit: oito temas de cor, do Branco ao Rosa',
      signin: 'O ecrã de início de sessão do Starlit: e-mail e palavra-passe, chave de acesso, Google ou continuar sem conta',
      discover: 'Explorar no Starlit: uma grelha de pósteres filtrada por tipo, catálogo e género',
      details: 'O topo de uma página de detalhes do Starlit com o título, géneros, descrição e ações',
    },
    features: {
      kicker: 'Por dentro do Starlit',
      title: 'Tudo o que uma temporada precisa, numa aplicação tranquila.',
      list: [
        { id: 'inicio', n: '01', label: 'Início', title: 'Um Início para todos os catálogos.',
          body: 'Um destaque, Continuar a ver e as filas dos addons que instalas, pela ordem que escolheres.',
          points: ['Continuar a ver retoma onde paraste', 'O Airing Now traz para o Início os episódios de anime de hoje', 'Oculta, renomeia e reordena filas nas Definições'],
          shot: 'home-rows', alt: 'homeRows' },
        { id: 'detalhes', n: '02', label: 'Detalhes', title: 'Todos os episódios num relance.',
          body: 'Temporadas, cartões de episódios e o teu progresso numa só página, com o Seguinte pronto a reproduzir.',
          points: ['Adiciona à Biblioteca ou a Ver mais tarde num clique', 'Marca episódios ou temporadas inteiras como vistos', 'Transfere uma temporada para ver offline'],
          shot: 'episodes', alt: 'episodes' },
        { id: 'leitor', n: '03', label: 'Leitor', title: 'Baseado no mpv. Salta o que já viste.',
          body: 'Saltar introduções, resumos e créditos, um painel lateral para as faixas, o estilo e a sincronização das legendas, e o episódio seguinte pronto quando os créditos começam.',
          points: ['Segmentos a saltar do IntroDB, com o AnimeSkip como opção', 'Idiomas preferidos de áudio e legendas', 'Reproduz o episódio seguinte automaticamente, ou pergunta primeiro'],
          shot: 'skips', alt: 'skips', small: true },
        { id: 'biblioteca', n: '04', label: 'Biblioteca', title: 'A tua biblioteca, em todos os dispositivos.',
          body: 'Títulos guardados, Ver mais tarde e coleções, por perfil e sincronizados entre o Windows e o Android quando inicias sessão.',
          points: ['Pesquisa, ordena e alterna entre filas e grelha', 'Uma biblioteca para cada perfil', 'Gere-a na web a partir da página da tua conta'],
          shot: 'library', alt: 'library' },
        { id: 'aspeto', n: '05', label: 'À tua medida', title: 'Oito temas. Dois esquemas. Seis ícones.',
          body: 'Escolhe um tema de cor, barra superior ou lateral, preto puro para ecrãs OLED e um ícone a condizer.',
          points: ['Temas do Branco ao Rosa, ou a tua própria cor', 'Navegação em barra superior ou lateral no computador', 'Seis variantes de cor para o ícone'],
          shot: 'themes', alt: 'themes', small: true },
      ],
    },
    gallery: { kicker: 'Mais ecrãs', title: 'Pensado para um ecrã grande e um sofá.' },
    extras: {
      title: 'E o resto do céu.',
      list: [
        ['phone', 'Comando do PC', 'Emparelha o telemóvel Android por código QR e comanda o PC a partir do sofá: reproduz, avança, salta introduções e troca de episódio ou legendas.', 'Wi-Fi · Bluetooth beta'],
        ['calendar', 'Airing Now', 'Episódios de anime de hoje e dos próximos dias a partir do AniList, com horários do Tsuzuki, no teu fuso horário.', ''],
        ['listCheck', 'Acompanhamento', 'MyAnimeList, Trakt, Simkl e MDBList a partir da página de detalhes, com números de episódio corretos.', ''],
        ['download', 'Offline', 'Cada episódio encontra a sua própria fonte com a melhor qualidade e retoma depois de reiniciar.', ''],
      ],
    },
    account: { kicker: 'Conta', title: 'Começa no PC. Acaba no telemóvel.',
      body: 'Inicia sessão com e-mail, chave de acesso ou Google, e a biblioteca, o histórico e os pontos de retoma acompanham-te entre dispositivos. Ao criares conta por e-mail, confirma o teu e-mail antes de sincronizar. Preferes não ter conta? Continua sem conta e guarda tudo no dispositivo.',
      cta: 'Abrir a tua conta', shot: 'signin' },
    status: { kicker: 'Plataformas', title: 'Onde o Starlit funciona hoje', as: `Estado na versão ${rel('version', VERSION)}`,
      available: 'Disponível', beta: 'Beta', notYet: 'Ainda não', items: [
        ['ok', 'monitor', 'Windows 10 e 11', 'Instalador próprio, sem direitos de administrador, atualizações verificadas na aplicação.'],
        ['ok', 'phone', 'Android 7.0 ou posterior', 'APK assinados em cada versão no GitHub.'],
        ['ok', 'terminal', 'Linux x86_64', 'DEB, RPM, AppImage e Flatpak. X11/XWayland; a reprodução em equipamentos reais ainda não foi validada.'],
        ['ok', 'tv', 'Android TV', 'Uma versão para TV feita para o comando, em cada versão.'],
        ['beta', 'bluetooth', 'Comando por Bluetooth', 'PC com Windows e telemóvel Android, sem precisar de rede partilhada.'],
        ['no', 'tv', 'Samsung Tizen e LG webOS', 'O TV Installer para Windows está em desenvolvimento. Ainda não há transferência estável para TV.'],
      ] },
    log: { label: 'Versões recentes', title: 'Registo de versões', all: 'Todas as notas' },
    get: { title: 'Traz todas as tuas séries para o mesmo céu.',
      body: 'Gratuito, de código aberto e teu. O Starlit é um cliente: tu trazes os addons e as fontes que podes usar. Não aloja nem vende conteúdos multimédia.',
      win: ['Windows', 'Instalador · 10 e 11, 64 bits'], android: ['Android', 'APK · Android 7.0+'], linux: ['Linux', 'x86_64 · DEB, RPM, AppImage, Flatpak'] },
  },
};

export const meta = { en: copy.en.meta, pt: copy.pt.meta };

// Anchors other pages (and the old feature-page redirects) link to.
export const ids = {
  en: { features: 'features', platforms: 'platforms', download: 'download', remote: 'pc-remote', airing: 'airing-now',
    player: 'player', offline: 'offline', sync: 'account-sync' },
  pt: { features: 'funcionalidades', platforms: 'plataformas', download: 'transferir', remote: 'comando-do-pc', airing: 'airing-now',
    player: 'leitor', offline: 'offline', sync: 'sincronizacao' },
};

// ---------------------------------------------------------------- screenshots

// Real screens (see the header comment). Two widths each, served as WebP.
const SIZES = { full: [1584, 960], small: [920, 600] };
const DIMS = { full: [1584, 961], skips: [920, 418], themes: [920, 368] };
function shot(name, alt, { cls = '', small = false, eager = false } = {}) {
  const [big, little] = small ? SIZES.small : SIZES.full;
  const [w, h] = DIMS[name] ?? DIMS.full;
  const src = n => asset(`/assets/shots/${name}-${n}.webp`);
  return `<img class="shot-img${cls ? ' ' + cls : ''}" src="${src(big)}" srcset="${src(little)} ${little}w, ${src(big)} ${big}w" sizes="${small ? '(max-width: 860px) 92vw, 560px' : '(max-width: 1240px) 94vw, 1180px'}" width="${w}" height="${h}" alt="${alt}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
}

// The four-point star from the Starlit mark, centred on 0,0.
const sparkle = rx => {
  const ry = +(rx * 1.18).toFixed(1), k = +(rx * .12).toFixed(2), ky = +(ry * .12).toFixed(2);
  return `M0 ${-ry}Q${k} ${-ky} ${rx} 0Q${k} ${ky} 0 ${ry}Q${-k} ${ky} ${-rx} 0Q${-k} ${-ky} 0 ${-ry}Z`;
};

// The hero mark: the real Starlit logo (branding/starlit-mark.svg) assembling
// from its own constellation, then its small star keeps twinkling.
const HERO_NODES = [[250, 190, 'l'], [250, 834, 'l'], [836, 512, 'l'], [470, 334, 'm'], [620, 512, 'm'], [470, 690, 'm'], [320, 512, 'm'], [788, 318, 'l']];
const heroMark = label => `<div class="hero-mark">
<span class="hero-halo" aria-hidden="true"></span>
<svg class="hero-svg" viewBox="132 132 760 760" role="img" aria-label="${label}">
<defs>
<path id="hm-play" d="M381.5 262.2 Q250 190 250 340 L250 684 Q250 834 381.5 761.8 L704.5 584.2 Q836 512 704.5 439.8 Z"/>
<clipPath id="hm-clip"><use href="#hm-play"/></clipPath>
<linearGradient id="hm-body" x1="250" y1="190" x2="836" y2="834" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#45D6EB"/><stop offset=".52" stop-color="#3965D4"/><stop offset="1" stop-color="#B250EF"/></linearGradient>
<linearGradient id="hm-tw" x1="730" y1="252" x2="846" y2="384" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#45D6EB"/><stop offset="1" stop-color="#B250EF"/></linearGradient>
<linearGradient id="hm-sheen" x1="250" y1="190" x2="520" y2="640" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".3"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
<radialGradient id="hm-glow" cx="470" cy="512" r="250" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".5"/><stop offset=".55" stop-color="#FFFFFF" stop-opacity=".12"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
</defs>
<g transform="translate(-36 0)">
<path class="hm-line" pathLength="1" d="M250 190 L250 834 L836 512 Z"/>
<path class="hm-line hd-2" pathLength="1" d="M470 334 L620 512 L470 690 L320 512 Z"/>
<path class="hm-line hd-4" pathLength="1" d="M836 512 L788 318"/>
${HERO_NODES.map(([x, y, size], i) => `<g transform="translate(${x} ${y})"><path class="hm-node hd-${i + 1}" d="${sparkle(size === 'l' ? 16 : 12)}"/></g>`).join('\n')}
<g class="hm-mark">
<use href="#hm-play" fill="url(#hm-body)"/>
<g clip-path="url(#hm-clip)"><rect width="1024" height="1024" fill="url(#hm-sheen)"/><circle cx="470" cy="512" r="250" fill="url(#hm-glow)"/></g>
<path fill="#FFFFFF" d="M470 334 Q488 490.6 620 512 Q488 533.4 470 690 Q452 533.4 320 512 Q452 490.6 470 334 Z"/>
<path class="hm-twinkle" fill="url(#hm-tw)" d="M788 252 Q795 310.1 846 318 Q795 325.9 788 384 Q781 325.9 730 318 Q781 310.1 788 252 Z"/>
</g>
</g>
</svg>
</div>`;

const bullet = `<svg class="sp-bullet" viewBox="-7 -7 14 14" width="14" height="14" aria-hidden="true" focusable="false"><path d="${sparkle(6)}"/></svg>`;

export function render(lang, { r, pageIds, account }) {
  const c = copy[lang], id = ids[lang], s = c.shots;
  const statusLabel = { ok: c.status.available, beta: c.status.beta, no: c.status.notYet };
  const news = `${r.download}#${pageIds.download.news}`;
  // Old feature-page addresses land on these sections (LEGACY_REDIRECTS):
  // the player feature, the extras (PC remote, Airing Now, offline) and the account.
  const extraIds = [null, id.airing, null, id.offline];

  const feature = (f, i) => `
<section class="feat${i % 2 ? ' feat-flip' : ''}${f.small ? ' feat-small' : ''}" id="${f.id}" aria-labelledby="${f.id}-title">
  <div class="wrap feat-grid">
    <div class="feat-copy reveal">
      <p class="eyebrow">${f.n} — ${f.label}</p>
      <h2 id="${f.id}-title" class="t-l mt-14">${f.title}</h2>
      <p class="body-l mt-20">${f.body}</p>
      <ul class="sp-list mt-26" role="list">${f.points.map(p => `<li>${bullet}<span>${p}</span></li>`).join('')}</ul>
    </div>
    <figure class="feat-shot">
      <span class="shot-glow" aria-hidden="true"></span>
      <span class="shot-frame">${shot(f.shot, s[f.alt], { small: f.small })}</span>
    </figure>
  </div>
</section>`;

  return `
<div class="scroll-progress" aria-hidden="true"></div>
<section class="hero" aria-labelledby="hero-title">
  <div class="wrap hero-inner">
    ${heroMark(c.logo)}
    <a class="news-pill hero-rise hr-1" href="${news}"><span class="news-tag">${c.news.toUpperCase()} ${rel('version', LATEST_RELEASE.version)}</span><span${inEnglish(lang)} data-rel="headline">${esc(LATEST_RELEASE.headline)}</span>${icon('arrowRight', 14)}</a>
    <h1 id="hero-title" class="t-hero hero-rise hr-2">${c.title}</h1>
    <p class="lede hero-lede hero-rise hr-3">${c.lede}</p>
    <p class="cta-row hero-cta hero-rise hr-4"><a class="btn btn-accent btn-lg" href="${r.download}">${icon('download', 20)}${c.ctaWin}</a><a class="btn btn-ghost btn-lg" href="#${id.platforms}">${c.ctaAll}</a></p>
    <p class="meta-line hero-rise hr-5">${c.metaLine}</p>
    <p class="hero-rise hr-5"><a class="arrow-link tv-link" href="${r.download}#tv-installer">${c.tvLink}${icon('arrowRight', 16)}</a></p>
  </div>
  <div class="wrap hero-stage">
    <figure class="hero-shot">
      <span class="shot-glow shot-glow-hero" aria-hidden="true"></span>
      <span class="shot-frame">${shot('home', s.home, { eager: true })}</span>
      <figcaption class="caption">${c.demo}</figcaption>
    </figure>
  </div>
</section>

<section class="feats-intro" id="${id.features}" aria-labelledby="features-title">
  <div class="wrap">
    <p class="eyebrow reveal">${c.features.kicker}</p>
    <h2 id="features-title" class="t-xl mt-16 measure-820 reveal">${c.features.title}</h2>
  </div>
</section>
${c.features.list.map(feature).join('')}

<section class="gallery" aria-labelledby="gallery-title">
  <div class="wrap">
    <p class="eyebrow reveal">${c.gallery.kicker}</p>
    <h2 id="gallery-title" class="t-xl mt-16 reveal">${c.gallery.title}</h2>
  </div>
  <div class="gallery-view">
    <div class="gallery-track">
      ${[['discover', s.discover], ['details', s.details], ['home', s.home], ['library', s.library]].map(([n, alt]) => `<span class="shot-frame gallery-item">${shot(n, alt)}</span>`).join('')}
    </div>
  </div>
</section>

<section class="extras" id="${id.remote}" aria-labelledby="extras-title">
  <div class="wrap">
    <h2 id="extras-title" class="t-xl reveal">${c.extras.title}</h2>
    <ul class="extras-grid mt-40" role="list">${c.extras.list.map(([ic, title, body, tag], i) => `
      <li class="extra reveal"${extraIds[i] ? ` id="${extraIds[i]}"` : ''}>${icon(ic, 26, 'extra-icon')}<h3>${title}</h3><p>${body}</p>${tag ? `<p class="extra-tag">${tag.replace(/Bluetooth beta/, `Bluetooth ${pill('beta', 'Beta', 'pill-inline')}`)}</p>` : ''}</li>`).join('')}
    </ul>
  </div>
</section>

<section class="feat feat-flip" id="${id.sync}" aria-labelledby="account-title">
  <div class="wrap feat-grid">
    <div class="feat-copy reveal">
      <p class="eyebrow">${c.account.kicker}</p>
      <h2 id="account-title" class="t-l mt-14">${c.account.title}</h2>
      <p class="body-l mt-20">${c.account.body}</p>${account ? `
      <a class="btn btn-ghost mt-30" href="/account?tab=overview">${c.account.cta}${icon('arrowRight', 16)}</a>` : ''}
    </div>
    <figure class="feat-shot">
      <span class="shot-glow" aria-hidden="true"></span>
      <span class="shot-frame">${shot('signin', s.signin)}</span>
    </figure>
  </div>
</section>

<section class="platforms" id="${id.platforms}" aria-labelledby="platforms-title">
  <div class="wrap">
    <div class="platforms-head">
      <div><p class="eyebrow">${c.status.kicker}</p><h2 id="platforms-title" class="t-xl mt-16">${c.status.title}</h2></div>
      <p class="meta-line">${c.status.as}</p>
    </div>
    <div class="platforms-grid mt-40">
      <ul class="plat-list" role="list">${c.status.items.map(([kind, ic, title, body]) => `
        <li class="plat reveal">${icon(ic, 24, 'plat-icon')}<div class="plat-text"><h3>${title}</h3><p>${body}</p></div>${pill(kind, statusLabel[kind])}</li>`).join('')}
      </ul>
      <aside class="log reveal" aria-label="${c.log.label}">
        <p class="log-head"><span class="label-mono">${c.log.title}</span><a href="${news}">${c.log.all}</a></p>
        <ol class="log-list" role="list" data-rel-list="releases" data-rel-start="0">${RELEASE_DATA.releases.slice(0, 3).map(release => `
          <li data-rel-item><span class="log-v" data-rel-field="version">${esc(release.version)}</span><span${inEnglish(lang)} data-rel-field="summary">${esc(release.summary)}</span></li>`).join('')}
        </ol>
      </aside>
    </div>
  </div>
</section>

<section class="get" id="${id.download}" aria-labelledby="get-title">
  <div class="wrap">
    <div class="get-mark" aria-hidden="true"><span class="get-glow"></span><span class="get-orbit"><span class="get-moon"></span></span>${markImg('get-logo', 112)}</div>
    <h2 id="get-title" class="t-get reveal">${c.get.title}</h2>
    <p class="body-l get-body reveal">${c.get.body}</p>
    <div class="get-tiles">
      <a class="get-tile get-tile-accent" href="${r.download}">${icon('monitor', 30, 'i-thin')}<span><b>${c.get.win[0]}</b><span>${c.get.win[1]}</span></span>${icon('download', 20)}</a>
      <a class="get-tile" href="${r.download}">${icon('phone', 30, 'i-thin')}<span><b>${c.get.android[0]}</b><span>${c.get.android[1]}</span></span>${icon('download', 20)}</a>
      <a class="get-tile" href="${r.download}">${icon('terminal', 30, 'i-thin')}<span><b>${c.get.linux[0]}</b><span>${c.get.linux[1]}</span></span>${icon('download', 20)}</a>
    </div>
  </div>
</section>`;
}
