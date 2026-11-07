// Anime page: Airing Now, the MyAnimeList tab and rewatch detection (Windows),
// and tracking services. Facts follow the release notes on the app's Dev branch.
import { icon, eyebrow, art, cells, notes, appWindow, appTabs, tabset } from '../ui.mjs';

// Invented schedule and list for the demos: [time, title, episode, kind, art, note].
const schedule = lang => {
  const ep = lang === 'pt' ? 'Episódio' : 'Episode', season = lang === 'pt' ? 'Temporada' : 'Season';
  const fin = lang === 'pt' ? 'final' : 'finale', prem = lang === 'pt' ? 'estreia' : 'premiere';
  const t = lang === 'pt'
    ? { aired: 'Já saiu', soon: 'Daqui a 42 min', h2: 'Daqui a 2 h 12 min', h4: 'Daqui a 4 h 27 min' }
    : { aired: 'Aired', soon: 'In 42 min', h2: 'In 2 h 12 min', h4: 'In 4 h 27 min' };
  return [
    [['14:30', 'Glass Harbor', `${ep} 10`, 'SUB', 'j', t.aired], ['17:00', 'Velvet Kingdom', `${ep} 6`, 'SUB', 'h', t.aired],
      ['18:30', 'Neon Ferry', `${ep} 19`, 'SUB', 'g', t.soon, true], ['20:00', 'Hollow Orbit', `${ep} 8`, 'DUB', 'a', t.h2],
      ['22:15', 'Quiet Static', `${ep} 2`, 'SUB', 'e', t.h4]],
    [['13:00', 'Paper Lanterns', `${season} 2 · ${ep} 4`, 'SUB', 'b'], ['16:30', 'Moonlit Relay', `${ep} 11`, 'SUB', 'i'], ['19:00', 'Saltwind Academy', `${ep} 6`, 'DUB', 'c']],
    [['10:00', 'Ironbloom', `${ep} 12 · ${fin}`, 'SUB', 'd'], ['15:00', 'Moonlit Relay', `${ep} 7`, 'DUB', 'i'], ['21:30', 'Kite Season', `${ep} 3`, 'SUB', 'l']],
    [['17:30', 'Copper Tide', `${ep} 9`, 'SUB', 'k'], ['23:00', 'Velvet Kingdom', `${ep} 4`, 'DUB', 'h']],
    [['16:00', 'Saltwind Academy', `${ep} 7`, 'SUB', 'c'], ['18:00', 'Northbound Choir', `${ep} 1 · ${prem}`, 'SUB', 'm'], ['20:45', 'Neon Ferry', `${ep} 15`, 'DUB', 'g']],
    [['15:30', 'Glass Harbor', `${ep} 8`, 'DUB', 'j'], ['22:00', 'Copper Tide', `${ep} 10`, 'SUB', 'k']],
    [['14:00', 'Kite Season', `${ep} 4`, 'SUB', 'l'], ['19:30', 'Quiet Static', `${ep} 3`, 'SUB', 'e'], ['21:00', 'Paper Lanterns', `${season} 2 · ${ep} 5`, 'SUB', 'b']],
  ];
};

// [title, art, progress, percent, score, rewatching] per status.
const lists = [
  [['Paper Lanterns', 'b', '15/24', 62, '★ 8'], ['Saltwind Academy', 'c', '4/13', 31, '–'], ['Velvet Kingdom', 'h', '6/12', 50, '★ 7'],
    ['Neon Ferry', 'g', '19/26', 73, '★ 8'], ['Quiet Static', 'e', '2/12', 17, '–']],
  [['Hollow Orbit', 'a', '12/12', 100, '★ 9', true], ['Ironbloom', 'd', '24/24', 100, '★ 9'], ['Glass Harbor', 'j', '12/12', 100, '★ 8'],
    ['Lantern Moth', 'f', '1/1', 100, '★ 10'], ['Moonlit Relay', 'i', '13/13', 100, '★ 7']],
  [['Copper Tide', 'k', '8/24', 33, '★ 7'], ['Kite Season', 'l', '3/12', 25, '–']],
  [['Northbound Choir', 'm', '2/12', 17, '★ 4']],
  [['Glass Harbor 2', 'j', '0/12', 0, '–'], ['Ironbloom: Ashes', 'd', '0/1', 0, '–']],
];

const copy = {
  en: {
    meta: {
      title: 'Starlit for anime: Airing Now, MyAnimeList and rewatches',
      description: 'See today’s and the next six days’ anime episodes in your time zone with Sub and Dub times, browse your MyAnimeList list in the Windows app, and let Starlit mark rewatches for you.',
    },
    kicker: 'Anime · Airing Now', title: 'Never miss tonight’s episode.',
    lede: 'Airing Now is built in. See what’s out today and over the next six days, in your own time zone, with separate Sub and Dub times. Hide the shows you don’t follow and they stay hidden on your PC and phone.',
    airing: { label: 'Interactive preview of Airing Now in the Starlit desktop app', title: 'Airing Now', zone: 'Times in Europe/Lisbon', recent: 'Recently aired',
      daysLabel: 'Day', days: [['Today', 'Fri 6'], ['Sat', '7'], ['Sun', '8'], ['Mon', '9'], ['Tue', '10'], ['Wed', '11'], ['Thu', '12']], hide: 'Hide',
      caption: 'Pick a day. Schedule from AniList; Sub and Dub times from Tsuzuki. The shows are made up.' },
    pointsTitle: 'Airing Now features',
    points: [
      ['calendar', 'A week at a glance', 'Today and the next six days, plus a quick way back to what aired recently.'],
      ['subtitles', 'Sub and Dub, separately', 'Dubs often land on a different day. Starlit shows both schedules from Tsuzuki.'],
      ['clock', 'Your time zone', 'Air times are converted for wherever you are, so 18:30 means 18:30 for you.'],
      ['eyeOff', 'Hidden on every device', 'Shows you hide sync across Windows and Android for the same account profile.'],
      ['shield', 'Adult titles filtered', 'Turn on the adult-titles filter to keep them out of the schedule.'],
      ['home', 'On Home, if you want it', 'The Windows app asks once whether to show Airing Now on Home. Change your mind in Settings.'],
    ],
    mal: { kicker: 'MyAnimeList', tag: 'Windows app · optional tab, off by default', title: 'Your MyAnimeList, right next to Home.',
      body: 'Turn on the MyAnimeList tab in Settings and your list joins Home, Discover and Library: watching, completed, on hold, dropped and planned anime, with posters, progress and your scores.',
      label: 'Interactive preview of the MyAnimeList tab in the Starlit desktop app', tabs: ['Home', 'Discover', 'Library', 'MyAnimeList'],
      heading: 'My anime list', page: 'Page 1 of 3', refresh: 'Refresh', statusLabel: 'Status',
      statuses: ['Watching', 'Completed', 'On hold', 'Dropped', 'Plan to watch'], rewatching: 'Rewatching',
      caption: 'Filter by status. A completed anime you’re watching again stays under Completed, marked Rewatching.' },
    rw: { kicker: 'New in 1.11 · Rewatches', title: 'Watching it again? Starlit noticed.',
      body: ['Start a completed anime from your connected MyAnimeList account and Starlit marks it as rewatching. Your completed status, score and watched-episode count stay exactly as they were.',
        'Prefer to decide yourself? Every anime’s details page has a Rewatching switch, next to its MyAnimeList status and your rating.'],
      box: 'Connecting uses a MyAnimeList API client ID that you create in MyAnimeList’s API settings. It takes a few minutes, your MyAnimeList password stays with MyAnimeList, and Starlit protects the sign-in with your Windows account. Rewatch detection and the MyAnimeList tab are in the Windows app.',
      mock: { label: 'Illustration of a Starlit details page with MyAnimeList controls: status Completed, rating 9 out of 10, and Rewatching switched on',
        kicker: 'SERIES · 12 EPISODES · 2026', resume: 'Resume S1 E7', status: 'MAL · Completed', rating: 'Rating · 9/10', rewatch: 'Rewatching · On',
        change: 'Change MAL entry', updated: 'MyAnimeList updated', kept: '12/12 watched · score kept' } },
    track: { title: 'Track where you already do.', body: 'Connect a tracking service and update it from the details page of any title.',
      notes: [['Episode numbers that line up', 'Fribb’s anime ID mappings stop seasons from other databases scrambling the numbering.'],
        ['Openings, handled', 'Community timestamps from IntroDB let the player skip intros, recaps and credits.']],
      disclaimer: 'Starlit isn’t affiliated with or endorsed by AniList, Tsuzuki, MyAnimeList, Trakt, Simkl, MDBList or IntroDB.' },
  },

  pt: {
    meta: {
      title: 'Starlit para anime: Airing Now, MyAnimeList e revisualizações',
      description: 'Vê os episódios de anime de hoje e dos próximos seis dias no teu fuso horário, com horários de legendas e dobragens, percorre a tua lista do MyAnimeList na aplicação para Windows e deixa o Starlit marcar as revisualizações por ti.',
    },
    kicker: 'Anime · Airing Now', title: 'Nunca percas o episódio de hoje.',
    lede: 'O Airing Now vem incluído. Vê o que sai hoje e nos próximos seis dias, no teu fuso horário, com horários separados para legendas e dobragens. Oculta as séries que não acompanhas e continuam ocultas no PC e no telemóvel.',
    airing: { label: 'Pré-visualização interativa do Airing Now na aplicação Starlit para computador', title: 'Airing Now', zone: 'Horas em Europe/Lisbon', recent: 'Saíram há pouco',
      daysLabel: 'Dia', days: [['Hoje', 'Sex 6'], ['Sáb', '7'], ['Dom', '8'], ['Seg', '9'], ['Ter', '10'], ['Qua', '11'], ['Qui', '12']], hide: 'Ocultar',
      caption: 'Escolhe um dia. Calendário do AniList; horários de legendas e dobragens do Tsuzuki. As séries são fictícias.' },
    pointsTitle: 'Funcionalidades do Airing Now',
    points: [
      ['calendar', 'A semana num relance', 'Hoje e os próximos seis dias, e uma forma rápida de voltar ao que saiu há pouco.'],
      ['subtitles', 'Legendas e dobragens, em separado', 'As dobragens saem muitas vezes noutro dia. O Starlit mostra os dois calendários do Tsuzuki.'],
      ['clock', 'O teu fuso horário', 'As horas são convertidas para onde estiveres, por isso 18:30 quer dizer 18:30 para ti.'],
      ['eyeOff', 'Ocultas em todos os dispositivos', 'As séries que ocultas sincronizam entre o Windows e o Android no mesmo perfil da conta.'],
      ['shield', 'Títulos para adultos filtrados', 'Ativa o filtro de títulos para adultos para os manter fora do calendário.'],
      ['home', 'No Início, se quiseres', 'A aplicação para Windows pergunta uma vez se queres o Airing Now no Início. Podes mudar de ideias nas Definições.'],
    ],
    mal: { kicker: 'MyAnimeList', tag: 'Aplicação para Windows · separador opcional, desativado por predefinição', title: 'O teu MyAnimeList, mesmo ao lado do Início.',
      body: 'Ativa o separador MyAnimeList nas Definições e a tua lista junta-se ao Início, Explorar e Biblioteca: anime a ver, completos, em pausa, desistidos e planeados, com capas, progresso e as tuas pontuações.',
      label: 'Pré-visualização interativa do separador MyAnimeList na aplicação Starlit para computador', tabs: ['Início', 'Explorar', 'Biblioteca', 'MyAnimeList'],
      heading: 'A minha lista de anime', page: 'Página 1 de 3', refresh: 'Atualizar', statusLabel: 'Estado',
      statuses: ['A ver', 'Completos', 'Em pausa', 'Desistidos', 'Planeados'], rewatching: 'A rever',
      caption: 'Filtra por estado. Um anime completo que estás a ver outra vez continua em Completos, marcado como A rever.' },
    rw: { kicker: 'Novo na 1.11 · Revisualizações', title: 'A ver outra vez? O Starlit reparou.',
      body: ['Começa um anime completo da tua conta MyAnimeList ligada e o Starlit marca-o como a rever. O estado completo, a pontuação e o número de episódios vistos ficam exatamente como estavam.',
        'Preferes decidir tu? A página de detalhes de cada anime tem um interruptor A rever, ao lado do estado no MyAnimeList e da tua classificação.'],
      box: 'Para ligar, usas um ID de cliente da API do MyAnimeList que crias nas definições da API do MyAnimeList. Demora uns minutos, a tua palavra-passe do MyAnimeList fica no MyAnimeList e o Starlit protege a sessão com a tua conta do Windows. A deteção de revisualizações e o separador MyAnimeList estão na aplicação para Windows.',
      mock: { label: 'Ilustração de uma página de detalhes do Starlit com os controlos do MyAnimeList: estado Completo, classificação 9 em 10 e A rever ativado',
        kicker: 'SÉRIE · 12 EPISÓDIOS · 2026', resume: 'Retomar T1 E7', status: 'MAL · Completo', rating: 'Classificação · 9/10', rewatch: 'A rever · Ativado',
        change: 'Alterar entrada no MAL', updated: 'MyAnimeList atualizado', kept: '12/12 vistos · pontuação mantida' } },
    track: { title: 'Acompanha onde já acompanhas.', body: 'Liga um serviço de acompanhamento e atualiza-o a partir da página de detalhes de qualquer título.',
      notes: [['Números de episódio que batem certo', 'Os mapeamentos de identificadores de anime do Fribb evitam que temporadas de outras bases de dados baralhem a numeração.'],
        ['Aberturas tratadas', 'As marcas temporais da comunidade IntroDB permitem ao leitor saltar introduções, resumos e créditos.']],
      disclaimer: 'O Starlit não tem ligação nem é apoiado pelo AniList, Tsuzuki, MyAnimeList, Trakt, Simkl, MDBList ou IntroDB.' },
  },
};

export const meta = { en: copy.en.meta, pt: copy.pt.meta };
export const ids = { en: { mal: 'myanimelist' }, pt: { mal: 'myanimelist' } };

export function render(lang) {
  const c = copy[lang], a = c.airing, m = c.mal, rw = c.rw.mock;

  const dayPanels = schedule(lang).map(rows => `<ul class="sched" role="list">${rows.map(([time, title, ep, kind, l, note, hot]) => `
    <li><span class="sched-time mono">${time}</span>${art(l, 'sched-art')}<span class="sched-text"><b>${title}</b><span>${ep}</span></span><span class="m-code">${kind}</span><span class="sched-note${hot ? ' hot' : ''}">${note || ''}</span><span class="sched-hide" aria-hidden="true">${icon('eyeOff', 18)}</span></li>`).join('')}
  </ul>`);
  const airingWindow = appWindow({ label: a.label, interactive: true, cls: 'win-airing', body: `
<div class="win-body">
  <div class="win-toolbar">
    <p class="win-h">${icon('back', 22)}<span>${a.title}</span></p>
    <p class="win-tools"><span class="m-dim tool-zone">${icon('clock', 14)}${a.zone}</span><span class="m-btn m-btn-dark m-btn-s">${a.recent}</span></p>
  </div>
  ${tabset({ name: 'day', label: a.daysLabel, tabs: a.days.map(([d, s]) => `<span>${d}</span><small>${s}</small>`), panels: dayPanels, cls: 'day-tabs', barCls: 'day-bar' })}
</div>` });

  const posterPanels = lists.map(items => `<div class="covers">${items.map(([title, l, prog, pct, score, rewatch]) => `
    <div><span class="cover art-${l}">${rewatch ? `<span class="m-rewatch">${icon('refresh', 11)}${m.rewatching}</span>` : ''}<span class="cover-bar">${pct ? `<span class="w-${pct}"></span>` : ''}</span></span>
    <span class="m-name">${title}</span><span class="cover-meta mono"><span>${prog}</span><span>${score}</span></span></div>`).join('')}
  </div>`);
  const malWindow = appWindow({ label: m.label, interactive: true, cls: 'win-mal', body: `
<div class="win-tabs-row">${appTabs(m.tabs, 3, 'app-tabs-solid')}</div>
<div class="win-body win-body-mal">
  <div class="win-toolbar">
    <p class="win-h"><span>${m.heading}</span></p>
    <p class="win-tools m-dim">${m.page}<span class="m-btn m-btn-dark m-btn-s">${icon('refresh', 14)}${m.refresh}</span></p>
  </div>
  ${tabset({ name: 'mal-status', label: m.statusLabel, tabs: m.statuses.map((s, i) => `${s}<small class="mono">${lists[i].length}</small>`), panels: posterPanels, cls: 'status-tabs', barCls: 'status-bar', start: 1 })}
</div>` });

  const details = `<div class="win details-mock" role="img" aria-label="${rw.label}">
  <div class="details-hero art-a"><span class="details-shade"></span><div class="details-copy"><p class="m-kicker">${rw.kicker}</p><p class="details-title">Hollow Orbit</p></div></div>
  <div class="details-body">
    <p class="m-btns">
      <span class="m-btn m-btn-light">${icon('playFill', 13)}${rw.resume}</span>
      <span class="m-btn m-btn-chip">${icon('listCheck', 14)}${rw.status}</span>
      <span class="m-btn m-btn-chip">${icon('star', 14)}${rw.rating}</span>
      <span class="m-btn m-btn-on">${icon('refresh', 14)}${rw.rewatch}</span>
      <span class="m-btn m-btn-chip m-btn-soft">${rw.change}</span>
    </p>
    <p class="details-toast">${icon('check', 16)}<span>${rw.updated}</span><span class="mono m-dim">${rw.kept}</span></p>
  </div>
</div>`;

  return `
<section class="sec pt-80 pb-104" aria-labelledby="hero-title">
  <div class="wrap">
    <div class="grid cols-13-1 gap-48 items-end">
      <div>${eyebrow(c.kicker)}<h1 id="hero-title" class="t-hero mt-20">${c.title}</h1></div>
      <p class="lede">${c.lede}</p>
    </div>
    <div class="mt-56">${airingWindow}</div>
    <p class="caption">${a.caption}</p>
  </div>
</section>

<section class="sec pb-104" aria-labelledby="airing-points">
  <div class="wrap">
    <h2 id="airing-points" class="vh">${c.pointsTitle}</h2>
    ${cells(c.points, 'cells-3 cells-tight')}
  </div>
</section>

<section class="sec band-top pt-112 pb-112" id="${ids[lang].mal}" aria-labelledby="mal-title">
  <div class="wrap">
    <div class="grid cols-13-1 gap-48 items-end">
      <div>
        <div class="eyebrow-row">${eyebrow(m.kicker)}<span class="tag-outline">${m.tag}</span></div>
        <h2 id="mal-title" class="t-big mt-18">${m.title}</h2>
      </div>
      <p class="body-l">${m.body}</p>
    </div>
    <div class="mt-52">${malWindow}</div>
    <p class="caption">${m.caption}</p>
  </div>
</section>

<section class="sec pt-112 pb-96" aria-labelledby="rw-title">
  <div class="wrap grid cols-11-1 gap-64 items-center">
    ${details}
    <div>
      ${eyebrow(c.rw.kicker)}
      <h2 id="rw-title" class="t-l mt-16">${c.rw.title}</h2>
      ${c.rw.body.map((p, i) => `<p class="body-m ${i ? 'mt-14' : 'mt-20'}">${p}</p>`).join('')}
      <p class="info-box mt-26">${c.rw.box}</p>
    </div>
  </div>
</section>

<section class="sec pt-40 pb-128" aria-labelledby="track-title">
  <div class="wrap">
    <div class="panel-xl">
      <h2 id="track-title" class="t-m measure-760">${c.track.title}</h2>
      <p class="body-m mt-16 measure-640">${c.track.body}</p>
      <ul class="service-list mt-32" role="list">${['MyAnimeList', 'Trakt', 'Simkl', 'MDBList'].map(s => `<li>${s}</li>`).join('')}</ul>
      <div class="split-top mt-40">${notes(c.track.notes, 'notes-2')}</div>
      <p class="caption mt-32">${c.track.disclaimer}</p>
    </div>
  </div>
</section>`;
}
