// Homepage. Claims follow the Starlit release notes (docs/RELEASE-NOTES.md on
// the app repository's Dev branch); re-check them after each release.
import { VERSION } from '../constants.mjs';
import { icon, eyebrow, pill, art, chips, markImg, appWindow, phone, appTabs, segments, qrCode } from '../ui.mjs';

const copy = {
  en: {
    meta: {
      title: 'Starlit: anime and TV on your PC, run from your phone',
      description: 'Starlit is a free, open-source anime and TV app for Windows and Android, with a phone remote for your PC, Airing Now schedules, offline downloads and optional account sync.',
    },
    news: ['NEW 1.12', 'Google Cast on Android, download limits'],
    title: 'Watch on your PC.<br><span class="hl">Steer from your phone.</span>',
    lede: 'Starlit is an anime and TV app for Windows and Android. Stream from your own add-ons in a player built on mpv, follow every episode in Airing Now, download whole seasons for offline, and keep one library in sync. Then pick up your phone and run the PC from the couch.',
    ctaWin: 'Download for Windows', ctaAndroid: 'Get the Android APK',
    metaLine: `v${VERSION} · Windows 10 &amp; 11 (64-bit) · Android 7.0+ · Free and open source, GPL-3.0`,
    log: { label: 'Recent releases', title: 'Shipping log', all: 'All notes', items: [
      ['1.12.0', 'Google Cast on Android (beta), optional download storage limits, and a playback diagnostics panel.'],
      ['1.11.1', 'Native Windows APIs replace the background scripts that set off an antivirus false alarm.'],
      ['1.11.0', 'Full-screen PC controller on Android, a separate pairing window on Windows, and automatic MyAnimeList rewatches.'],
    ] },
    app: {
      label: 'Illustration of the Starlit desktop app showing the Home screen, with Continue watching and Airing Now rows',
      tabs: ['Home', 'Discover', 'Library', 'MyAnimeList'],
      kicker: 'SERIES · SCI-FI · 12 EPISODES',
      blurb: 'A salvage crew drifts past the last lit station in the system, and finds it still answering calls.',
      resume: 'Resume S1 E7', later: 'Watch later', cont: 'Continue watching', all: 'See all',
      cards: [['b', 64, 'Paper Lanterns', 'S2 E3 · 9 min left'], ['c', 22, 'Saltwind Academy', 'S1 E5 · 18 min left'],
        ['d', 81, 'Ironbloom', 'S1 E11 · 4 min left'], ['f', 40, 'Lantern Moth', 'Movie · 52 min left']],
      airing: 'Airing Now', today: 'Today', episode: 'Episode',
    },
    paired: 'Paired over Wi-Fi',
    remote: {
      label: 'Illustration of Starlit on Android: the PC controller, playing Hollow Orbit on a paired PC',
      title: 'PC controller', tabs: ['Remote', 'Downloads', 'PCs'], pc: 'Living-room PC', pcSub: 'Wi-Fi · paired',
      ep: 'S1 · E7 · The Quiet Shore', skip: 'Skip intro', buttons: ['Episodes', 'Sources', 'Subtitles'],
    },
    caption: 'Illustrations of the Starlit apps. The shows and artwork are made up.',
    status: { title: 'What runs Starlit today', as: `Status as of release ${VERSION}`, available: 'Available', beta: 'Beta', notYet: 'Not yet', items: [
      ['ok', 'Windows 10 &amp; 11', 'Own installer, no admin rights, verified in-app updates.'],
      ['ok', 'Android 7.0 and later', 'Signed APKs with every release on GitHub.'],
      ['ok', 'Phone remote over Wi-Fi', 'Android phone to Windows PC, with QR pairing.'],
      ['beta', 'Phone remote over Bluetooth', 'Windows PC and Android phone, no shared network needed.'],
      ['no', 'iPhone, Mac and Linux', 'No public builds yet. We’ll say so here when there are.'],
    ] },
    pcRemote: {
      kicker: '01 · PC remote', title: 'Your phone runs the PC.',
      body: 'Open Connect phone on the PC, scan its code from Android, and check that the six digits match on both screens. Then play, pause, seek, change the volume, skip intros and credits, and switch episodes, sources or subtitles without getting up.',
      points: ['Find your PC on Wi-Fi, from its QR code, or by typing its address', 'Send a title from your phone with Play on Starlit PC', 'Check, pause and resume the PC’s downloads'],
      bluetooth: 'Connect over Bluetooth when there’s no shared network', link: 'How the remote works',
      win: { label: 'Illustration of the Phone remote window on Windows, showing a pairing QR code, the PC’s local addresses and the six-digit confirmation code',
        title: 'Phone remote', scan: 'On your phone, open <b>Settings → PC controller</b> and scan this code.', code: 'Confirmation code', firewall: 'Windows Firewall allows phones on this network' },
    },
    features: {
      title: 'Everything a season needs, <span class="muted">from the first episode to the last download.</span>',
      airing: { kicker: '02 · Airing Now', title: 'Tonight’s episodes, in your time zone.', link: 'See the schedule',
        body: 'Today and the next six days from AniList, with Sub and Dub times from Tsuzuki. Hide what you don’t follow and it stays hidden on your other devices.',
        days: ['Today', 'Sat 7', 'Sun 8', 'Mon 9', 'Tue 10', 'Wed 11'], aired: 'aired', soon: 'in 42 min' },
      player: { kicker: '03 · Player', title: 'Built on mpv. Skips the bits you’ve seen.', link: 'Inside the player',
        body: 'Intro, recap and credits skipping from IntroDB, a side panel for subtitle tracks, style and timing, and the next episode lined up when the credits roll.',
        skip: 'Skip intro' },
      offline: { kicker: '04 · Offline downloads', title: 'Download the season, skip the buffering.', link: 'How downloads work',
        body: 'Each episode finds its own best-quality source. Downloads resume after a restart, an optional limit keeps them within the space you choose, and storage tools suggest what to clear without ever deleting on their own.',
        heading: 'Downloads', pause: 'Pause all', resume: 'Resume all', queued: 'Queued', paused: 'Paused',
        rows: ['1080p · 8.4 MB/s · 2 min left', 'Finding the best source', 'Resumes where it stopped'] },
      mal: { kicker: '05 · Library &amp; MyAnimeList', title: 'Your list, and it knows a rewatch.', link: 'MyAnimeList in Starlit',
        body: 'Browse Watching, Completed, On hold, Dropped and Plan to watch in an optional MyAnimeList tab on desktop. Start a finished anime again and Starlit marks it as rewatching, keeping your score.',
        statuses: ['Watching', 'Completed', 'On hold', 'Dropped', 'Plan to watch'], rewatching: 'Rewatching' },
    },
    sync: {
      kicker: '06 · Account sync', title: 'Start on the PC. Finish on the phone.', link: 'What syncs, and what stays put',
      body: 'Sign in to the same Starlit account and profile on Windows and Android, and your library, history and resume points follow you. Prefer no account? Guest mode works offline-first, and you can bring that data into an account later.',
      nodes: ['Windows PC', 'Your account', 'Android phone'], listLabel: 'Synced data',
      items: ['Library', 'Watch history', 'Resume points', 'Collections', 'Profiles', 'Add-ons', 'Home rows', 'Hidden Airing Now titles'],
      note: 'Downloaded episodes stay on the device that saved them.',
    },
    get: {
      title: 'Free, open source, and ready tonight.',
      body: 'Starlit is a client: you bring the add-ons and sources you’re allowed to use. It doesn’t host or sell any media.',
      win: ['Windows', 'Installer · 10 &amp; 11, 64-bit'], android: ['Android', 'APK · Android 7.0+'],
    },
  },

  pt: {
    meta: {
      title: 'Starlit: anime e séries no PC, comandados pelo telemóvel',
      description: 'O Starlit é uma aplicação gratuita e de código aberto de anime e séries para Windows e Android, com comando do PC pelo telemóvel, calendário Airing Now, transferências offline e sincronização opcional da conta.',
    },
    news: ['NOVO 1.12', 'Google Cast no Android, limites de transferências'],
    title: 'Vê no PC.<br><span class="hl">Comanda pelo telemóvel.</span>',
    lede: 'O Starlit é uma aplicação de anime e séries para Windows e Android. Faz streaming a partir dos teus próprios addons num leitor baseado no mpv, acompanha cada episódio no Airing Now, transfere temporadas inteiras para ver offline e mantém uma só biblioteca sincronizada. Depois pega no telemóvel e comanda o PC a partir do sofá.',
    ctaWin: 'Transferir para Windows', ctaAndroid: 'Obter o APK para Android',
    metaLine: `v${VERSION} · Windows 10 e 11 (64 bits) · Android 7.0+ · Gratuito e de código aberto, GPL-3.0`,
    log: { label: 'Versões recentes', title: 'Registo de versões', all: 'Todas as notas', items: [
      ['1.12.0', 'Google Cast no Android (beta), limites opcionais de armazenamento para transferências e um painel de diagnóstico da reprodução.'],
      ['1.11.1', 'APIs nativas do Windows substituem os scripts em segundo plano que provocavam um falso alarme do antivírus.'],
      ['1.11.0', 'Comando do PC em ecrã inteiro no Android, uma janela de emparelhamento à parte no Windows e revisualizações automáticas no MyAnimeList.'],
    ] },
    app: {
      label: 'Ilustração da aplicação Starlit para computador no ecrã Início, com as filas Continuar a ver e Airing Now',
      tabs: ['Início', 'Explorar', 'Biblioteca', 'MyAnimeList'],
      kicker: 'SÉRIE · FICÇÃO CIENTÍFICA · 12 EPISÓDIOS',
      blurb: 'Uma equipa de resgate passa pela última estação iluminada do sistema e descobre que ainda atende chamadas.',
      resume: 'Retomar T1 E7', later: 'Ver mais tarde', cont: 'Continuar a ver', all: 'Ver tudo',
      cards: [['b', 64, 'Paper Lanterns', 'T2 E3 · faltam 9 min'], ['c', 22, 'Saltwind Academy', 'T1 E5 · faltam 18 min'],
        ['d', 81, 'Ironbloom', 'T1 E11 · faltam 4 min'], ['f', 40, 'Lantern Moth', 'Filme · faltam 52 min']],
      airing: 'Airing Now', today: 'Hoje', episode: 'Episódio',
    },
    paired: 'Emparelhado por Wi-Fi',
    remote: {
      label: 'Ilustração do Starlit no Android: o comando do PC a reproduzir Hollow Orbit num PC emparelhado',
      title: 'Controlar PC', tabs: ['Comando', 'Transferências', 'PCs'], pc: 'PC da sala', pcSub: 'Wi-Fi · emparelhado',
      ep: 'T1 · E7 · A Margem Silenciosa', skip: 'Saltar introdução', buttons: ['Episódios', 'Fontes', 'Legendas'],
    },
    caption: 'Ilustrações das aplicações Starlit. As séries e as imagens são fictícias.',
    status: { title: 'Onde o Starlit funciona hoje', as: `Estado na versão ${VERSION}`, available: 'Disponível', beta: 'Beta', notYet: 'Ainda não', items: [
      ['ok', 'Windows 10 e 11', 'Instalador próprio, sem direitos de administrador, atualizações verificadas na aplicação.'],
      ['ok', 'Android 7.0 ou posterior', 'APK assinados em cada versão no GitHub.'],
      ['ok', 'Comando por Wi-Fi', 'Do telemóvel Android para o PC com Windows, com emparelhamento por QR.'],
      ['beta', 'Comando por Bluetooth', 'PC com Windows e telemóvel Android, sem precisar de rede partilhada.'],
      ['no', 'iPhone, Mac e Linux', 'Ainda não há versões públicas. Diremos aqui quando houver.'],
    ] },
    pcRemote: {
      kicker: '01 · Comando do PC', title: 'O telemóvel comanda o PC.',
      body: 'Abre Ligar telemóvel no PC, lê o código no Android e confirma que os seis dígitos coincidem nos dois ecrãs. Depois reproduz, pausa, avança, muda o volume, salta introduções e créditos e troca de episódio, fonte ou legendas sem te levantares.',
      points: ['Encontra o PC por Wi-Fi, pelo código QR ou escrevendo o endereço', 'Envia um título do telemóvel com Reproduzir no PC Starlit', 'Vê, pausa e retoma as transferências do PC'],
      bluetooth: 'Liga por Bluetooth quando não há rede partilhada', link: 'Como funciona o comando',
      win: { label: 'Ilustração da janela Controlo pelo telemóvel no Windows, com um código QR de emparelhamento, os endereços locais do PC e o código de confirmação de seis dígitos',
        title: 'Controlo pelo telemóvel', scan: 'No telemóvel, abre <b>Definições → Controlar PC</b> e lê este código.', code: 'Código de confirmação', firewall: 'A Firewall do Windows permite telemóveis nesta rede' },
    },
    features: {
      title: 'Tudo o que uma temporada precisa, <span class="muted">do primeiro episódio à última transferência.</span>',
      airing: { kicker: '02 · Airing Now', title: 'Os episódios de hoje, no teu fuso horário.', link: 'Ver o calendário',
        body: 'Hoje e os próximos seis dias a partir do AniList, com horários de legendas e dobragens do Tsuzuki. Oculta o que não acompanhas e continua oculto nos teus outros dispositivos.',
        days: ['Hoje', 'Sáb 7', 'Dom 8', 'Seg 9', 'Ter 10', 'Qua 11'], aired: 'já saiu', soon: 'daqui a 42 min' },
      player: { kicker: '03 · Leitor', title: 'Baseado no mpv. Salta o que já viste.', link: 'Por dentro do leitor',
        body: 'Saltar introduções, resumos e créditos com o IntroDB, um painel lateral para as faixas, o estilo e a sincronização das legendas, e o episódio seguinte pronto quando os créditos começam.',
        skip: 'Saltar introdução' },
      offline: { kicker: '04 · Transferências offline', title: 'Transfere a temporada e esquece o buffering.', link: 'Como funcionam as transferências',
        body: 'Cada episódio encontra a sua própria fonte com a melhor qualidade. As transferências são retomadas depois de reiniciar, um limite opcional mantém-nas dentro do espaço que escolheres e as ferramentas de armazenamento sugerem o que limpar sem nunca apagarem nada sozinhas.',
        heading: 'Transferências', pause: 'Pausar tudo', resume: 'Retomar tudo', queued: 'Na fila', paused: 'Em pausa',
        rows: ['1080p · 8,4 MB/s · faltam 2 min', 'A procurar a melhor fonte', 'Retoma onde parou'] },
      mal: { kicker: '05 · Biblioteca e MyAnimeList', title: 'A tua lista, e sabe quando revês.', link: 'O MyAnimeList no Starlit',
        body: 'Percorre A ver, Completos, Em pausa, Desistidos e Planeados num separador opcional do MyAnimeList no computador. Começa outra vez um anime que já terminaste e o Starlit marca-o como a rever, mantendo a tua pontuação.',
        statuses: ['A ver', 'Completos', 'Em pausa', 'Desistidos', 'Planeados'], rewatching: 'A rever' },
    },
    sync: {
      kicker: '06 · Sincronização da conta', title: 'Começa no PC. Acaba no telemóvel.', link: 'O que sincroniza e o que fica',
      body: 'Inicia sessão na mesma conta e no mesmo perfil Starlit no Windows e no Android, e a biblioteca, o histórico e os pontos de retoma acompanham-te. Preferes não ter conta? O modo convidado funciona primeiro offline e podes levar esses dados para uma conta mais tarde.',
      nodes: ['PC com Windows', 'A tua conta', 'Telemóvel Android'], listLabel: 'Dados sincronizados',
      items: ['Biblioteca', 'Histórico', 'Pontos de retoma', 'Coleções', 'Perfis', 'Addons', 'Filas do Início', 'Títulos ocultos no Airing Now'],
      note: 'Os episódios transferidos ficam no dispositivo que os guardou.',
    },
    get: {
      title: 'Gratuito, de código aberto e pronto para hoje à noite.',
      body: 'O Starlit é um cliente: tu trazes os addons e as fontes que podes usar. Não aloja nem vende conteúdos multimédia.',
      win: ['Windows', 'Instalador · 10 e 11, 64 bits'], android: ['Android', 'APK · Android 7.0+'],
    },
  },
};

export const meta = { en: copy.en.meta, pt: copy.pt.meta };

// Anchors other pages link to, localised so Portuguese URLs read naturally.
export const ids = { en: { features: 'features', download: 'download' },
  pt: { features: 'funcionalidades', download: 'transferir' } };

const progress = pct => `<span class="m-bar"><span class="m-fill w-${pct}"></span></span>`;

export function render(lang, { r, pageIds }) {
  const c = copy[lang], a = c.app, rm = c.remote, f = c.features;
  const statusLabel = { ok: c.status.available, beta: c.status.beta, no: c.status.notYet };

  const homeApp = appWindow({ label: a.label, cls: 'win-home', body: `
<div class="m-feature">
  <span class="m-shade-side"></span><span class="m-shade-bottom"></span>
  ${appTabs(a.tabs, 0, 'm-float-tabs')}
  <span class="m-top-actions"><span class="m-round">${icon('search', 15)}</span><span class="m-round m-avatar">M</span></span>
  <div class="m-feature-copy">
    <p class="m-kicker">${a.kicker}</p>
    <p class="m-feature-title">Hollow Orbit</p>
    <p class="m-feature-blurb">${a.blurb}</p>
    <p class="m-btns mt-16"><span class="m-btn m-btn-light">${icon('playFill', 14)}${a.resume}</span><span class="m-btn m-btn-glass">${a.later}</span></p>
  </div>
</div>
<div class="m-rows">
  <p class="m-row-head"><span>${a.cont}</span><span class="m-dim">${a.all}</span></p>
  <div class="m-grid4">${a.cards.map(([l, pct, title, sub]) => `
    <div><span class="m-thumb art-${l}"><span class="m-thumb-bar"><span class="w-${pct}"></span></span></span><span class="m-name">${title}</span><span class="m-sub">${sub}</span></div>`).join('')}
  </div>
  <p class="m-row-head m-row-head-2"><span>${a.airing}</span><span class="m-chip">${a.today}</span></p>
  <div class="m-grid4">${[['h', '17:00 · SUB', 'Velvet Kingdom', 6, true], ['g', '18:30 · SUB', 'Neon Ferry', 19, true],
    ['a', '20:00 · DUB', 'Hollow Orbit', 8], ['e', '22:15 · SUB', 'Quiet Static', 2]].map(([l, time, title, ep, hot]) => `
    <div class="m-airing">${art(l, 'm-poster-s')}<span class="m-airing-text"><span class="m-time${hot ? ' hot' : ''}">${time}</span><span class="m-name">${title}</span><span class="m-sub">${a.episode} ${ep}</span></span></div>`).join('')}
  </div>
</div>` });

  const remotePhone = phone({ label: rm.label, cls: 'phone-float', body: `
<p class="p-head">${icon('back', 20)}<span>${rm.title}</span></p>
${segments(rm.tabs, 0, 'p-seg')}
<div class="p-device"><span class="p-device-icon">${icon('monitor', 16)}</span><span class="p-device-text"><b>${rm.pc}</b><span>${rm.pcSub}</span></span><span class="p-tag">LAN</span></div>
<span class="p-art art-a"></span>
<div><p class="p-title">Hollow Orbit</p><p class="p-sub">${rm.ep}</p></div>
<div class="p-scrub"><span class="p-track"><span class="p-done"></span><span class="p-knob"></span></span><span class="p-times"><span>08:51</span><span>23:40</span></span></div>
<div class="p-transport"><span>${icon('back10', 26)}</span><span class="p-play">${icon('pause', 24)}</span><span>${icon('fwd10', 26)}</span></div>
<span class="p-skip">${icon('skip', 15)}${rm.skip}</span>
<div class="p-shortcuts">${[['list', rm.buttons[0]], ['layers', rm.buttons[1]], ['subtitles', rm.buttons[2]]].map(([ic, t]) => `<span>${icon(ic, 18)}${t}</span>`).join('')}</div>` });

  const w = c.pcRemote.win;
  const pairWindow = appWindow({ label: w.label, title: w.title, cls: 'win-pair', max: false, body: `
<div class="pair">
  <span class="qr-box">${qrCode(168)}</span>
  <div class="pair-info">
    <p class="pair-hint">${w.scan}</p>
    <dl class="m-kv"><div><dt>Wi-Fi</dt><dd class="mono">192.168.1.24</dd></div><div><dt>Ethernet</dt><dd class="mono m-dim">10.0.0.8</dd></div></dl>
    <div><p class="m-dim m-small">${w.code}</p><p class="pair-code">482 913</p></div>
    <p class="pair-ok">${icon('shieldCheck', 14)}${w.firewall}</p>
  </div>
</div>` });

  const card = (k, mock, href) => `
<article class="card">
  ${eyebrow(k.kicker)}
  <h3 class="t-card">${k.title}</h3>
  <p class="card-body">${k.body}</p>
  ${mock}
  <a class="card-link" href="${href}">${k.link}</a>
</article>`;

  const airingMock = `<div class="m-panel" aria-hidden="true">
  <div class="m-pills">${f.airing.days.map((d, i) => `<span${i === 0 ? ' class="on"' : ''}>${d}</span>`).join('')}</div>
  <ul class="m-sched" role="list">
    <li><span class="m-clock">17:00</span>${art('h', 'm-poster')}<span class="m-sched-text"><b>Velvet Kingdom</b><span>${a.episode} 6 · ${f.airing.aired}</span></span><span class="m-code">SUB</span></li>
    <li><span class="m-clock hot">18:30</span>${art('g', 'm-poster')}<span class="m-sched-text"><b>Neon Ferry</b><span class="hot">${a.episode} 19 · ${f.airing.soon}</span></span><span class="m-code">SUB</span></li>
    <li><span class="m-clock">20:00</span>${art('a', 'm-poster')}<span class="m-sched-text"><b>Hollow Orbit</b><span>${a.episode} 8</span></span><span class="m-code">DUB</span></li>
  </ul>
</div>`;

  const playerMock = `<div class="m-player" aria-hidden="true">
  <span class="m-player-shade"></span>
  <p class="m-player-title">Paper Lanterns <span>· ${lang === 'pt' ? 'T2' : 'S2'} E3</span></p>
  <span class="m-skip-btn">${f.player.skip}${icon('skip', 13)}</span>
  <span class="m-timeline"><span class="m-tl-intro"></span><span class="m-tl-done"></span></span>
  <p class="m-player-controls">${icon('playFill', 16)}${icon('volume', 16)}<span class="mono">01:24 / 23:52</span><span class="m-spacer"></span>${icon('subtitles', 16)}${icon('layers', 16)}${icon('list', 16)}</p>
</div>`;

  const o = f.offline;
  const offlineMock = `<div class="m-panel" aria-hidden="true">
  <p class="m-panel-head"><b>${o.heading}</b><span class="m-mini-btns"><span>${o.pause}</span><span>${o.resume}</span></span></p>
  <ul class="m-dl" role="list">
    <li>${art('c', 'm-thumb-s')}<span class="m-dl-text"><span class="m-dl-top"><b>Saltwind Academy · ${lang === 'pt' ? 'T1' : 'S1'} E4</b><span class="mono hot">72%</span></span>${progress(72)}<span class="m-sub">${o.rows[0]}</span></span></li>
    <li>${art('c', 'm-thumb-s')}<span class="m-dl-text"><span class="m-dl-top"><b>Saltwind Academy · ${lang === 'pt' ? 'T1' : 'S1'} E5</b><span class="mono m-dim">${o.queued}</span></span><span class="m-bar"></span><span class="m-sub">${o.rows[1]}</span></span></li>
    <li>${art('d', 'm-thumb-s')}<span class="m-dl-text"><span class="m-dl-top"><b>Ironbloom · ${lang === 'pt' ? 'T2' : 'S2'} E1</b><span class="mono warn">${o.paused}</span></span><span class="m-bar"><span class="m-fill m-fill-paused w-31"></span></span><span class="m-sub">${o.rows[2]}</span></span></li>
  </ul>
</div>`;

  const m = f.mal;
  const malMock = `<div class="m-panel" aria-hidden="true">
  <div class="m-pills">${m.statuses.map((s, i) => `<span${i === 1 ? ' class="on"' : ''}>${s}</span>`).join('')}</div>
  <div class="m-posters">${[['a', 'Hollow Orbit', '12/12 · ★ 9', true], ['b', 'Paper Lanterns', '24/24 · ★ 8'], ['c', 'Saltwind Academy', '13/13 · ★ 7'], ['h', 'Velvet Kingdom', '12/12 · ★ 7']].map(([l, t, s, rw]) => `
    <div><span class="m-cover art-${l}">${rw ? `<span class="m-rewatch">${icon('refresh', 10)}${m.rewatching}</span>` : ''}</span><span class="m-name">${t}</span><span class="m-sub mono">${s}</span></div>`).join('')}
  </div>
</div>`;

  return `
<section class="sec hero-home" aria-labelledby="hero-title">
  <div class="wrap">
    <div class="grid cols-hero-home">
      <div>
        <a class="news-pill" href="${r.download}#${pageIds.download.news}"><span class="news-tag">${c.news[0]}</span><span>${c.news[1]}</span>${icon('arrowRight', 14)}</a>
        <h1 id="hero-title" class="t-hero mt-28">${c.title}</h1>
        <p class="lede mt-28 measure-620">${c.lede}</p>
        <p class="cta-row mt-36"><a class="btn btn-accent btn-lg" href="${r.download}">${icon('monitor', 20)}${c.ctaWin}</a><a class="btn btn-ghost btn-lg" href="${r.download}">${icon('phone', 20)}${c.ctaAndroid}</a></p>
        <p class="meta-line mt-22">${c.metaLine}</p>
      </div>
      <aside class="log" aria-label="${c.log.label}">
        <p class="log-head"><span class="label-mono">${c.log.title}</span><a href="${r.download}#${pageIds.download.news}">${c.log.all}</a></p>
        <ol class="log-list" role="list">${c.log.items.map(([v, text], i) => `
          <li><span class="log-v${i === 0 ? ' cur' : ''}">${v}</span><span>${text}</span></li>`).join('')}
        </ol>
      </aside>
    </div>
    <div class="composite">
      ${homeApp}
      <p class="pair-chip" aria-hidden="true"><span class="live-dot"></span><span>${c.paired}</span><span class="mono">482 913</span></p>
      ${remotePhone}
    </div>
    <p class="caption composite-caption">${c.caption}</p>
  </div>
</section>

<section class="band status-band" aria-labelledby="status-title">
  <div class="wrap">
    <div class="status-head"><h2 id="status-title" class="label-mono">${c.status.title}</h2><p>${c.status.as}</p></div>
    <div class="cells cells-5 status-cells">${c.status.items.map(([kind, title, body]) => `
      <div class="cell">${pill(kind, statusLabel[kind])}<h3>${title}</h3><p>${body}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="sec pt-128 pb-64" aria-labelledby="remote-title">
  <div class="wrap grid cols-2 gap-64 items-center">
    <div>
      ${eyebrow(c.pcRemote.kicker)}
      <h2 id="remote-title" class="t-xl mt-18">${c.pcRemote.title}</h2>
      <p class="body-l mt-22 measure-520">${c.pcRemote.body}</p>
      <ul class="check-list check-list-l mt-30" role="list">${c.pcRemote.points.map(p => `<li>${icon('check', 20)}<span>${p}</span></li>`).join('')}
        <li class="beta-item">${icon('bluetooth', 20)}<span>${c.pcRemote.bluetooth} ${pill('beta', 'Beta', 'pill-inline')}</span></li>
      </ul>
      <a class="arrow-link mt-34" href="${r.remote}">${c.pcRemote.link}${icon('arrowRight', 16)}</a>
    </div>
    ${pairWindow}
  </div>
</section>

<section class="sec pt-96 pb-96" id="${ids[lang].features}" aria-labelledby="features-title">
  <div class="wrap">
    <h2 id="features-title" class="t-l measure-820">${f.title}</h2>
    <div class="grid cols-2 gap-20 mt-48">
      ${card(f.airing, airingMock, r.anime)}
      ${card(f.player, playerMock, r.watch)}
      ${card(f.offline, offlineMock, `${r.watch}#${pageIds.watch.downloads}`)}
      ${card(f.mal, malMock, `${r.anime}#${pageIds.anime.mal}`)}
    </div>
  </div>
</section>

<section class="sec pt-40 pb-120" aria-labelledby="sync-title">
  <div class="wrap">
    <div class="panel-xl grid cols-1-11 gap-48 items-center">
      <div>
        ${eyebrow(c.sync.kicker)}
        <h2 id="sync-title" class="t-l mt-16">${c.sync.title}</h2>
        <p class="body-m mt-18">${c.sync.body}</p>
        <a class="arrow-link mt-26" href="${r.sync}">${c.sync.link}${icon('arrowRight', 16)}</a>
      </div>
      <div>
        <div class="sync-flow">
          <div class="sync-node">${icon('monitor', 30, 'i-thin')}<span>${c.sync.nodes[0]}</span></div>
          <span class="sync-link" aria-hidden="true"></span>
          <div class="sync-node sync-node-hub">${markImg('sync-mark', 34)}<span>${c.sync.nodes[1]}</span></div>
          <span class="sync-link" aria-hidden="true"></span>
          <div class="sync-node">${icon('phone', 30, 'i-thin')}<span>${c.sync.nodes[2]}</span></div>
        </div>
        ${chips(c.sync.items, 'mt-24', c.sync.listLabel)}
        <p class="small-note mt-16">${c.sync.note}</p>
      </div>
    </div>
  </div>
</section>

<section class="sec pb-128" id="${ids[lang].download}" aria-labelledby="get-title">
  <div class="wrap">
    <div class="center">
      ${markImg('get-mark', 72)}
      <h2 id="get-title" class="t-get mt-20">${c.get.title}</h2>
      <p class="body-l mt-20 measure-600 center-block">${c.get.body}</p>
    </div>
    <div class="grid cols-2 gap-20 get-tiles mt-44">
      <a class="get-tile get-tile-accent" href="${r.download}">${icon('monitor', 34, 'i-thin')}<span><b>${c.get.win[0]}</b><span>${c.get.win[1]}</span></span>${icon('download', 22)}</a>
      <a class="get-tile" href="${r.download}">${icon('phone', 34, 'i-thin')}<span><b>${c.get.android[0]}</b><span>${c.get.android[1]}</span></span>${icon('download', 22)}</a>
    </div>
  </div>
</section>`;
}
