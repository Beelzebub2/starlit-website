// Homepage: one scroll page that shows the whole product. Feature claims
// follow the Starlit README and release notes; re-check them after each
// release. The version, "New" pill and shipping log come from the GitHub
// releases (data/releases.json) and site.js keeps them current.
//
// Everything that moves is CSS (assets/site.css): the public CSP forbids
// inline styles and scripts, and the page must work with no JavaScript.
import { VERSION, LATEST_RELEASE, RELEASE_DATA } from '../constants.mjs';
import { icon, pill, markImg, esc, inEnglish, rel } from '../ui.mjs';

const copy = {
  en: {
    meta: {
      title: 'Starlit: anime and TV on your PC, run from your phone',
      description: 'Starlit is a free, open-source anime and TV app for Windows, Linux x86_64 and Android, with a phone remote, Airing Now schedules, offline downloads and optional account sync.',
    },
    news: 'New',
    title: 'Every show you follow, <span class="hl">in one sky.</span>',
    lede: 'Starlit is a free anime and TV app for Windows, Linux and Android. Stream from your own add-ons in a player built on mpv, follow every episode in Airing Now, download whole seasons, keep one library in sync, and run the PC from your phone.',
    ctaWin: 'Download for Windows', ctaAll: 'All platforms',
    metaLine: `v${rel('version', VERSION)} · Windows 10 &amp; 11 · Linux x86_64 · Android 7.0+ · Free and open source, GPL-3.0`,
    tvLink: 'Samsung and LG TVs: meet the TV Installer (in development)',
    logo: 'The Starlit logo: a play button holding a four-point star',
    app: {
      label: 'Illustration of the Starlit desktop app: the Home screen with a featured show, Continue watching and Airing Now. The shows are made up.',
      airing: 'Airing now · Episode 7', show: 'Hollow Orbit', when: 'Sub in 2 hours · Dub on Friday',
      resume: 'Resume S1 E7', cont: 'Continue watching', today: 'Airing today',
      cards: [['p1', 64, 'Paper Lanterns'], ['p2', 22, 'Saltwind Academy'], ['p3', 81, 'Ironbloom'], ['p4', 40, 'Lantern Moth'], ['p5', 0, 'Velvet Kingdom']],
      times: [['18:30', 'Neon Ferry'], ['20:00', 'Hollow Orbit'], ['22:15', 'Quiet Static']],
    },
    caption: 'Illustration of the Starlit app. The shows and artwork are made up.',
    chapters: {
      kicker: 'Five constellations',
      title: 'Everything a season needs, charted in one app.',
      remote: { n: '01', label: 'PC remote', name: 'The Handset', title: 'Your phone runs the PC.',
        body: 'Open Connect phone on the PC, scan its code from Android, and check that the six digits match on both screens. Then control everything from the couch.',
        points: ['Find your PC on Wi-Fi, from its QR code, or by its address', 'Play, pause, seek, skip intros and switch episodes, sources or subtitles', 'Check, pause and resume the PC’s downloads'],
        beta: 'Connect over Bluetooth when there’s no shared network', art: 'A constellation in the shape of a phone' },
      airing: { n: '02', label: 'Airing Now', name: 'The Almanac', title: 'Tonight’s episodes, in your time zone.',
        body: 'Today and the next six days from AniList, with Sub and Dub times from Tsuzuki.',
        points: ['Hide what you don’t follow, and it stays hidden on your other devices', 'Correct episode numbers with Fribb’s anime ID mappings', 'An optional MyAnimeList tab on desktop that knows a rewatch'],
        art: 'A constellation in the shape of a crescent moon' },
      player: { n: '03', label: 'Player', name: 'The Projector', title: 'Built on mpv. Skips the bits you’ve seen.',
        body: 'Intro, recap and credits skipping from IntroDB, a side panel for subtitle tracks, style and timing, and the next episode lined up when the credits roll.',
        points: ['Streams from your own add-ons and plugins', 'Cloud playback through Premiumize and TorBox', 'Torrent streaming through a bundled TorrServer engine'],
        art: 'A constellation in the shape of a play button' },
      offline: { n: '04', label: 'Offline', name: 'The Satchel', title: 'Download the season, skip the buffering.',
        body: 'Each episode finds its own best-quality source and saves to a folder you choose.',
        points: ['Downloads resume after a restart', 'An optional limit keeps them within the space you choose', 'Progress, speed, Pause all and Resume all in one place'],
        art: 'A constellation in the shape of a download arrow' },
      sync: { n: '05', label: 'Account sync', name: 'The Bridge', title: 'Start on the PC. Finish on the phone.',
        body: 'Sign in to the same Starlit account and profile on Windows and Android, and your library follows you. Email sign-ups ask you to verify your email first. Prefer no account? Guest mode keeps everything on the device.',
        points: ['Library, history, resume points and collections', 'Profiles, add-ons and home rows', 'Downloaded episodes stay on the device that saved them'],
        account: 'Open your account', art: 'A constellation in the shape of a bridge between two stars' },
    },
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
    lede: 'O Starlit é uma aplicação gratuita de anime e séries para Windows, Linux e Android. Faz streaming a partir dos teus addons num leitor baseado no mpv, acompanha cada episódio no Airing Now, transfere temporadas inteiras, mantém uma só biblioteca sincronizada e comanda o PC pelo telemóvel.',
    ctaWin: 'Transferir para Windows', ctaAll: 'Todas as plataformas',
    metaLine: `v${rel('version', VERSION)} · Windows 10 e 11 · Linux x86_64 · Android 7.0+ · Gratuito e de código aberto, GPL-3.0`,
    tvLink: 'TVs Samsung e LG: conhece o TV Installer (em desenvolvimento)',
    logo: 'O logótipo do Starlit: um botão de reprodução com uma estrela de quatro pontas',
    app: {
      label: 'Ilustração da aplicação Starlit para computador: o ecrã Início com uma série em destaque, Continuar a ver e Airing Now. As séries são fictícias.',
      airing: 'Em exibição · Episódio 7', show: 'Hollow Orbit', when: 'Legendado daqui a 2 horas · Dobrado na sexta',
      resume: 'Retomar T1 E7', cont: 'Continuar a ver', today: 'Hoje no Airing Now',
      cards: [['p1', 64, 'Paper Lanterns'], ['p2', 22, 'Saltwind Academy'], ['p3', 81, 'Ironbloom'], ['p4', 40, 'Lantern Moth'], ['p5', 0, 'Velvet Kingdom']],
      times: [['18:30', 'Neon Ferry'], ['20:00', 'Hollow Orbit'], ['22:15', 'Quiet Static']],
    },
    caption: 'Ilustração da aplicação Starlit. As séries e as imagens são fictícias.',
    chapters: {
      kicker: 'Cinco constelações',
      title: 'Tudo o que uma temporada precisa, numa só aplicação.',
      remote: { n: '01', label: 'Comando do PC', name: 'O Comando', title: 'O telemóvel comanda o PC.',
        body: 'Abre Ligar telemóvel no PC, lê o código no Android e confirma que os seis dígitos coincidem nos dois ecrãs. Depois controla tudo a partir do sofá.',
        points: ['Encontra o PC por Wi-Fi, pelo código QR ou pelo endereço', 'Reproduz, pausa, avança, salta introduções e troca de episódio, fonte ou legendas', 'Vê, pausa e retoma as transferências do PC'],
        beta: 'Liga por Bluetooth quando não há rede partilhada', art: 'Uma constelação com a forma de um telemóvel' },
      airing: { n: '02', label: 'Airing Now', name: 'O Almanaque', title: 'Os episódios de hoje, no teu fuso horário.',
        body: 'Hoje e os próximos seis dias a partir do AniList, com horários de legendas e dobragens do Tsuzuki.',
        points: ['Oculta o que não acompanhas e continua oculto nos teus outros dispositivos', 'Números de episódio corretos com os mapeamentos de IDs de anime do Fribb', 'Um separador opcional do MyAnimeList no computador que sabe quando revês'],
        art: 'Uma constelação com a forma de uma lua em quarto crescente' },
      player: { n: '03', label: 'Leitor', name: 'O Projetor', title: 'Baseado no mpv. Salta o que já viste.',
        body: 'Saltar introduções, resumos e créditos com o IntroDB, um painel lateral para as faixas, o estilo e a sincronização das legendas, e o episódio seguinte pronto quando os créditos começam.',
        points: ['Streaming a partir dos teus addons e plugins', 'Reprodução na nuvem com Premiumize e TorBox', 'Streaming de torrents com o motor TorrServer incluído'],
        art: 'Uma constelação com a forma de um botão de reprodução' },
      offline: { n: '04', label: 'Offline', name: 'A Mochila', title: 'Transfere a temporada e esquece o buffering.',
        body: 'Cada episódio encontra a sua própria fonte com a melhor qualidade e é guardado na pasta que escolheres.',
        points: ['As transferências são retomadas depois de reiniciar', 'Um limite opcional mantém-nas dentro do espaço que escolheres', 'Progresso, velocidade, Pausar tudo e Retomar tudo no mesmo sítio'],
        art: 'Uma constelação com a forma de uma seta de transferência' },
      sync: { n: '05', label: 'Sincronização', name: 'A Ponte', title: 'Começa no PC. Acaba no telemóvel.',
        body: 'Inicia sessão na mesma conta e no mesmo perfil Starlit no Windows e no Android, e a biblioteca acompanha-te. Ao criares conta por e-mail, confirma o teu e-mail antes de sincronizar. Preferes não ter conta? O modo convidado guarda tudo no dispositivo.',
        points: ['Biblioteca, histórico, pontos de retoma e coleções', 'Perfis, addons e filas do Início', 'Os episódios transferidos ficam no dispositivo que os guardou'],
        account: 'Abrir a tua conta', art: 'Uma constelação com a forma de uma ponte entre duas estrelas' },
    },
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

// Anchors other pages (and the old feature-page redirects) link to,
// localised so Portuguese URLs read naturally.
export const ids = {
  en: { features: 'features', platforms: 'platforms', download: 'download',
    remote: 'pc-remote', airing: 'airing-now', player: 'player', offline: 'offline', sync: 'account-sync' },
  pt: { features: 'funcionalidades', platforms: 'plataformas', download: 'transferir',
    remote: 'comando-do-pc', airing: 'airing-now', player: 'leitor', offline: 'offline', sync: 'sincronizacao' },
};

// ---------------------------------------------------------------- sky drawing

// The four-point star from the Starlit mark, centred on 0,0: `rx` wide and a
// little taller, with the same inward-curving sides.
const sparkle = rx => {
  const ry = +(rx * 1.18).toFixed(1), k = +(rx * .12).toFixed(2), ky = +(ry * .12).toFixed(2);
  return `M0 ${-ry}Q${k} ${-ky} ${rx} 0Q${k} ${ky} 0 ${ry}Q${-k} ${ky} ${-rx} 0Q${-k} ${-ky} 0 ${-ry}Z`;
};
const STAR = { s: sparkle(5), m: sparkle(8), l: sparkle(12) };

// A constellation: hairlines that draw themselves in as the panel scrolls into
// view (where the browser supports scroll-driven animation), and stars shaped
// like the logo's. [x, y, size, tone] per star; tone "hi" uses the brand gradient.
function constellation({ id, label, lines, stars }) {
  return `<svg class="cst" viewBox="0 0 520 400" role="img" aria-label="${label}">
<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#45D6EB"/><stop offset=".52" stop-color="#3965D4"/><stop offset="1" stop-color="#B250EF"/></linearGradient></defs>
${lines.map(([d, faint]) => `<path class="cst-line${faint ? ' cst-faint' : ''}" pathLength="1" d="${d}"/>`).join('\n')}
${stars.map(([x, y, size, tone]) => `<g transform="translate(${x} ${y})">${tone === 'hi' ? '<circle class="cst-halo" r="22"/>' : ''}<path class="cst-star cst-${tone}"${tone === 'hi' ? ` fill="url(#${id})"` : ''} d="${STAR[size]}"/></g>`).join('\n')}
</svg>`;
}

const SKIES = {
  remote: { lines: [['M190 50 L330 50 L330 350 L190 350 Z'], ['M235 320 L285 320', true], ['M330 140 L420 90 L470 150', true]],
    stars: [[190, 50, 'm', 'white'], [330, 50, 'm', 'white'], [330, 350, 'm', 'white'], [190, 350, 'm', 'white'], [260, 320, 'l', 'hi'], [420, 90, 's', 'cyan'], [470, 150, 's', 'cyan']] },
  airing: { lines: [['M170 90 L250 60 L340 80 L400 150 L410 240 L360 310 L270 340 L190 320'], ['M170 90 L250 150 L300 220 L270 290 L190 320', true]],
    stars: [[170, 90, 'm', 'white'], [250, 60, 's', 'cyan'], [340, 80, 'm', 'white'], [400, 150, 's', 'cyan'], [410, 240, 'l', 'hi'], [360, 310, 's', 'cyan'], [270, 340, 'm', 'white'], [190, 320, 's', 'cyan'], [300, 220, 's', 'cyan']] },
  player: { lines: [['M150 80 L150 320 L370 200 Z'], ['M370 200 L430 130 L470 250', true]],
    stars: [[150, 80, 'm', 'white'], [150, 320, 'm', 'white'], [370, 200, 'l', 'hi'], [430, 130, 's', 'cyan'], [470, 250, 's', 'cyan']] },
  offline: { lines: [['M260 50 L260 270'], ['M170 190 L260 280 L350 190'], ['M130 340 L390 340', true]],
    stars: [[260, 50, 'm', 'white'], [260, 150, 's', 'cyan'], [170, 190, 's', 'cyan'], [350, 190, 's', 'cyan'], [260, 280, 'l', 'hi'], [130, 340, 's', 'white'], [390, 340, 's', 'white']] },
  sync: { lines: [['M80 290 L160 170 L260 120 L360 170 L440 290'], ['M80 290 L440 290', true], ['M260 120 L260 50', true]],
    stars: [[80, 290, 'l', 'hi'], [160, 170, 's', 'cyan'], [260, 120, 'm', 'white'], [360, 170, 's', 'cyan'], [440, 290, 'l', 'hi'], [260, 50, 's', 'white']] },
};

// The hero: the real Starlit mark (branding/starlit-mark.svg) assembling from
// its own constellation. Lines draw, star nodes flare and fade, the mark
// settles in and its small star keeps twinkling. Pure CSS animation.
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
  const c = copy[lang], a = c.app, ch = c.chapters, id = ids[lang];
  const statusLabel = { ok: c.status.available, beta: c.status.beta, no: c.status.notYet };
  const news = `${r.download}#${pageIds.download.news}`;

  const showcase = `<div class="show-win" role="img" aria-label="${a.label}">
  <div class="show-rail" aria-hidden="true">${markImg('show-mark', 30)}<span class="show-ico on">${icon('home', 18)}</span><span class="show-ico">${icon('search', 18)}</span><span class="show-ico">${icon('calendar', 18)}</span><span class="show-ico">${icon('library', 18)}</span><span class="show-ico">${icon('download', 18)}</span></div>
  <div class="show-main" aria-hidden="true">
    <div class="show-hero">
      <span class="show-tag">${a.airing}</span>
      <span class="show-title">${a.show}</span>
      <span class="show-when">${a.when}</span>
      <span class="show-btn">${icon('playFill', 14)}${a.resume}</span>
    </div>
    <div class="show-rows">
      <div class="show-cont">
        <span class="show-head">${a.cont}</span>
        <span class="show-posters">${a.cards.map(([art, pct, title]) => `<span class="show-poster ${art}"><span class="show-ptitle">${title}</span>${pct ? `<span class="show-bar"><span class="fill-${pct}"></span></span>` : ''}</span>`).join('')}</span>
      </div>
      <div class="show-air">
        <span class="show-head">${a.today}</span>
        ${a.times.map(([time, title]) => `<span class="show-time"><b>${time}</b><span>${title}</span></span>`).join('')}
      </div>
    </div>
  </div>
</div>`;

  const chapter = (key, flip) => {
    const k = ch[key];
    const extra = key === 'remote'
      ? `<li class="beta-item">${icon('bluetooth', 18)}<span>${k.beta} ${pill('beta', 'Beta', 'pill-inline')}</span></li>` : '';
    const link = key === 'sync' && account
      ? `<a class="btn btn-ghost mt-30" href="/account?tab=overview">${k.account}${icon('arrowRight', 16)}</a>` : '';
    return `
<section class="chapter${flip ? ' chapter-flip' : ''}" id="${id[key]}" aria-labelledby="${id[key]}-title">
  <div class="wrap chapter-grid">
    <figure class="cst-card">
      ${constellation({ id: 'cg-' + key, label: k.art, ...SKIES[key] })}
      <figcaption><span>${k.n} · ${k.name}</span><span>${k.label}</span></figcaption>
    </figure>
    <div class="chapter-copy reveal">
      <p class="eyebrow">${k.n} — ${k.label}</p>
      <h2 id="${id[key]}-title" class="t-l mt-14">${k.title}</h2>
      <p class="body-l mt-20">${k.body}</p>
      <ul class="sp-list mt-26" role="list">${k.points.map(p => `<li>${bullet}<span>${p}</span></li>`).join('')}${extra}</ul>${link}
    </div>
  </div>
</section>`;
  };

  return `
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
  <div class="wrap show-stage">
    ${showcase}
    <p class="caption">${c.caption}</p>
  </div>
</section>

<section class="chapters-intro" id="${id.features}" aria-labelledby="features-title">
  <div class="wrap">
    <p class="eyebrow reveal">${ch.kicker}</p>
    <h2 id="features-title" class="t-xl mt-16 measure-820 reveal">${ch.title}</h2>
  </div>
</section>
${chapter('remote', false)}
${chapter('airing', true)}
${chapter('player', false)}
${chapter('offline', true)}
${chapter('sync', false)}

<section class="platforms" id="${id.platforms}" aria-labelledby="platforms-title">
  <div class="wrap">
    <div class="platforms-head">
      <div><p class="eyebrow">${c.status.kicker}</p><h2 id="platforms-title" class="t-xl mt-16">${c.status.title}</h2></div>
      <p class="meta-line">${c.status.as}</p>
    </div>
    <div class="platforms-grid mt-40">
      <ul class="plat-list" role="list">${c.status.items.map(([kind, ic, title, body]) => `
        <li class="plat reveal">${icon(ic, 26, 'plat-icon')}<div class="plat-text"><h3>${title}</h3><p>${body}</p></div>${pill(kind, statusLabel[kind])}</li>`).join('')}
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
    <div class="get-mark" aria-hidden="true"><span class="get-glow"></span><span class="get-orbit"><span class="get-moon"></span></span>${markImg('get-logo', 132)}</div>
    <h2 id="get-title" class="t-get reveal">${c.get.title}</h2>
    <p class="body-l get-body reveal">${c.get.body}</p>
    <div class="get-tiles">
      <a class="get-tile get-tile-accent" href="${r.download}">${icon('monitor', 32, 'i-thin')}<span><b>${c.get.win[0]}</b><span>${c.get.win[1]}</span></span>${icon('download', 22)}</a>
      <a class="get-tile" href="${r.download}">${icon('phone', 32, 'i-thin')}<span><b>${c.get.android[0]}</b><span>${c.get.android[1]}</span></span>${icon('download', 22)}</a>
      <a class="get-tile" href="${r.download}">${icon('terminal', 32, 'i-thin')}<span><b>${c.get.linux[0]}</b><span>${c.get.linux[1]}</span></span>${icon('download', 22)}</a>
    </div>
  </div>
</section>`;
}
