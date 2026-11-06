// Watch and download page: the desktop player, sources, offline downloads and
// storage management. Facts follow the release notes on the app's Dev branch
// (Google Cast, storage limits and diagnostics changes arrived in 1.12.0).
import { icon, eyebrow, pill, art, cells, notes, checkList, appWindow, dialog } from '../ui.mjs';

const copy = {
  en: {
    meta: {
      title: 'Watching and downloading with Starlit',
      description: 'Starlit’s Windows player is built on mpv, with intro and credits skipping, a subtitles side panel and playback diagnostics. Download whole seasons for offline, with optional storage limits and clean-up that never deletes on its own.',
    },
    kicker: 'Watch · the player', title: 'A player that gets out of the way.',
    lede: 'On Windows, Starlit plays through mpv. Subtitles open in a side panel instead of a maze of menus, openings and credits can be skipped, and the next episode is lined up before the credits finish.',
    player: { label: 'Illustration of the Starlit desktop player with the subtitles side panel open and a Skip intro button',
      panel: 'Subtitles', track: 'TRACK', tracks: ['Off', 'English · Full', 'English · Signs &amp; songs', 'Português (Portugal)'], style: 'STYLE', size: 'Size', timing: 'TIMING',
      skip: 'Skip intro', ep: 'S2 · E3 · Festival of Small Lights', info: '1080p · Signs &amp; songs track available',
      caption: 'The desktop player on Windows. Shaded parts of the timeline mark the opening and the credits. The show is made up.' },
    small: { title: 'Small things that add up over a season.', items: [
      ['skip', 'Skip intros, recaps and credits', 'Community timestamps from IntroDB put a Skip button on screen at the right moment.'],
      ['subtitles', 'Subtitles your way', 'Pick a track, restyle it and nudge its timing from one side panel. Your choice carries over to the next episode.'],
      ['copy', 'Next episode, ready', 'When the credits start, the next episode is waiting, and the episode list is one click away.'],
      ['layers', 'Swap sources mid-episode', 'The sources panel lists everything your add-ons found, so a stalled stream is a quick swap away.'],
      ['speaker', 'Audio tracks', 'Switch between Japanese and dubbed audio without leaving the episode.'],
      ['pulse', 'Playback diagnostics', 'A panel shows playback state, buffer, speed, decoder and stalls. The report you can copy leaves out titles, links and file paths.'],
      ['compare', 'RTX Video, side by side', 'On NVIDIA RTX PCs, press and hold to see the original video, then let go to see the enhanced picture again.'],
      ['chat', 'Discord Rich Presence', 'Let friends see what you’re watching on Discord, if you want them to.'],
    ] },
    cast: { title: 'Google Cast from Android', body: 'Send a public HTTPS video to a Chromecast or a TV with Google Cast, after you confirm you’re allowed to play it there. Torrents, local files and signed links can’t be cast. It hasn’t been tested on every TV yet.' },
    sources: { kicker: 'Sources', title: 'Bring your own sources.',
      body: 'Starlit doesn’t come with any content. It plays what the add-ons and services you set up can reach, and it’s meant for media you own or are otherwise allowed to watch.',
      items: [['Add-ons and plugins', 'Install add-ons from their URLs. JavaScript plugins work on Windows and in the full Android build.'],
        ['Cloud playback', 'Connect Premiumize or TorBox to play files from your cloud account.'],
        ['Torrent streaming', 'On Windows, a bundled TorrServer engine streams and downloads. On Android, turn on P2P in Settings.'],
        ['Moving devices', 'Export your add-ons to a file and import them on another device, or let account sync carry them over.']] },
    dl: { kicker: 'Download · offline', title: 'Download the season before you need it.',
      body: 'Choose the episodes, and Starlit finds a source for each one, picks the best quality it can, and saves it to a folder you choose. Then play from disk instead of waiting on a stream.',
      lib: { label: 'Illustration of Starlit Library, Downloads view: storage use with a limit, Pause all and Resume all, and episodes downloading, queued and paused',
        tabs: ['Library', 'Watch Later', 'Downloads'], pause: 'Pause all', resume: 'Resume all',
        storage: 'Offline library · 38 episodes', used: '212 GB used · 640 GB free on D:', limit: 'Limit 300 GB for this profile · on', manage: 'Storage management',
        season: 'Season', rows: [
          ['E3 · The Long Tide', '1080p · 1.4 GB · verified'], ['E4 · Lighthouse Exams', '8.4 MB/s · about 2 min left'],
          ['E5 · Saltwater Letters', '5.1 MB/s · downloading alongside E4'], ['E6 to E12', 'Queued · each finds its own source'],
          ['E1 · Rust and Petals', 'Picks up where it stopped, even after a restart']], paused: 'Paused' },
      dialog: { label: 'Illustration of the Download episodes dialog with episodes 5 to 12 of Saltwind Academy selected',
        title: 'Download episodes', sub: 'Saltwind Academy · Season 1', quality: 'Quality', best: 'Highest available', saveTo: 'Save to',
        cancel: 'Cancel', go: 'Download 8 episodes' },
      notes: [
        ['Best quality by default', 'Starlit prefers the least compressed file it can find for each episode.'],
        ['Several at once', 'Download more than one episode at a time, and set how many in Settings.'],
        ['Survives restarts', 'Unfinished downloads resume, timeouts are retried, and torrents that drop out are added back.'],
        ['Checked before it plays', 'Finished files are verified in the background. A file that changed or went missing is flagged instead of played.'],
        ['Torrents on Android too', 'With P2P turned on, Android downloads torrent sources with its own engine, so playback isn’t interrupted.'],
        ['Pause from the couch', 'A paired phone can see the PC’s queue and pause or resume it.'],
      ], remoteLink: 'About the remote' },
    clean: { kicker: 'Storage management', title: 'Free up space. Nothing goes without your OK.',
      body: 'Storage management can gather the episodes you’ve already watched, and suggest ones you haven’t opened in a while. You review the list and confirm; Starlit never deletes on its own.',
      points: ['Only finished, verified files that Starlit saved are offered', 'Active downloads and other files are left alone', 'Watch history and your library stay as they are',
        'Set a storage limit for a profile, and downloads that would go over it pause until you resume them'],
      mock: { label: 'Illustration of the Storage management dialog: three watched episodes preselected for removal, two older episodes suggested but not selected',
        title: 'Remove watched episodes', selected: '4.2 GB selected', movie: 'movie', suggested: 'NOT WATCHED IN A WHILE · SUGGESTED',
        note: 'Nothing is removed until you confirm.', cancel: 'Cancel', go: 'Remove 3 episodes' } },
  },

  pt: {
    meta: {
      title: 'Ver e transferir com o Starlit',
      description: 'O leitor do Starlit para Windows baseia-se no mpv, com saltos de introduções e créditos, um painel lateral de legendas e diagnóstico da reprodução. Transfere temporadas inteiras para ver offline, com limites de armazenamento opcionais e uma limpeza que nunca apaga nada sozinha.',
    },
    kicker: 'Ver · o leitor', title: 'Um leitor que não se mete no caminho.',
    lede: 'No Windows, o Starlit reproduz através do mpv. As legendas abrem num painel lateral em vez de um labirinto de menus, as aberturas e os créditos podem ser saltados e o episódio seguinte fica pronto antes de os créditos acabarem.',
    player: { label: 'Ilustração do leitor do Starlit para computador com o painel lateral de legendas aberto e um botão Saltar introdução',
      panel: 'Legendas', track: 'FAIXA', tracks: ['Desativado', 'Inglês · Completas', 'Inglês · Letreiros e canções', 'Português (Portugal)'], style: 'ESTILO', size: 'Tamanho', timing: 'SINCRONIZAÇÃO',
      skip: 'Saltar introdução', ep: 'T2 · E3 · Festival das Pequenas Luzes', info: '1080p · Faixa de letreiros e canções disponível',
      caption: 'O leitor para computador no Windows. As partes sombreadas da linha do tempo marcam a abertura e os créditos. A série é fictícia.' },
    small: { title: 'Pequenas coisas que fazem diferença ao longo de uma temporada.', items: [
      ['skip', 'Saltar introduções, resumos e créditos', 'As marcas temporais da comunidade IntroDB mostram um botão Saltar no momento certo.'],
      ['subtitles', 'Legendas à tua maneira', 'Escolhe uma faixa, muda-lhe o estilo e acerta a sincronização num só painel lateral. A tua escolha passa para o episódio seguinte.'],
      ['copy', 'Episódio seguinte, pronto', 'Quando os créditos começam, o episódio seguinte está à espera e a lista de episódios fica a um clique.'],
      ['layers', 'Trocar de fonte a meio', 'O painel de fontes mostra tudo o que os teus addons encontraram, por isso um stream parado troca-se num instante.'],
      ['speaker', 'Faixas de áudio', 'Alterna entre o áudio japonês e o dobrado sem sair do episódio.'],
      ['pulse', 'Diagnóstico da reprodução', 'Um painel mostra o estado da reprodução, o buffer, a velocidade, o descodificador e as paragens. O relatório que podes copiar não inclui títulos, ligações nem caminhos de ficheiros.'],
      ['compare', 'RTX Video, lado a lado', 'Em PCs com NVIDIA RTX, mantém premido para ver o vídeo original e solta para voltar à imagem melhorada.'],
      ['chat', 'Discord Rich Presence', 'Deixa os teus amigos verem o que estás a ver no Discord, se quiseres.'],
    ] },
    cast: { title: 'Google Cast a partir do Android', body: 'Envia um vídeo HTTPS público para um Chromecast ou uma TV com Google Cast, depois de confirmares que o podes reproduzir lá. Torrents, ficheiros locais e ligações assinadas não podem ser transmitidos. Ainda não foi testado em todas as TVs.' },
    sources: { kicker: 'Fontes', title: 'Traz as tuas próprias fontes.',
      body: 'O Starlit não inclui nenhum conteúdo. Reproduz o que os addons e serviços que configuras conseguem alcançar e destina-se a conteúdos que te pertencem ou que tens autorização para ver.',
      items: [['Addons e plugins', 'Instala addons a partir dos respetivos URL. Os plugins JavaScript funcionam no Windows e na versão completa para Android.'],
        ['Reprodução na cloud', 'Liga o Premiumize ou o TorBox para reproduzir ficheiros da tua conta na cloud.'],
        ['Streaming por torrent', 'No Windows, um motor TorrServer incluído faz streaming e transferências. No Android, ativa o P2P nas Definições.'],
        ['Mudar de dispositivo', 'Exporta os teus addons para um ficheiro e importa-os noutro dispositivo, ou deixa a sincronização da conta levá-los.']] },
    dl: { kicker: 'Transferir · offline', title: 'Transfere a temporada antes de precisares dela.',
      body: 'Escolhe os episódios e o Starlit encontra uma fonte para cada um, escolhe a melhor qualidade possível e guarda-o na pasta que escolheres. Depois reproduz a partir do disco em vez de esperares por um stream.',
      lib: { label: 'Ilustração da Biblioteca do Starlit, vista Transferências: espaço usado com um limite, Pausar tudo e Retomar tudo, e episódios a transferir, na fila e em pausa',
        tabs: ['Biblioteca', 'Ver mais tarde', 'Transferências'], pause: 'Pausar tudo', resume: 'Retomar tudo',
        storage: 'Biblioteca offline · 38 episódios', used: '212 GB usados · 640 GB livres em D:', limit: 'Limite de 300 GB para este perfil · ativo', manage: 'Gestão do armazenamento',
        season: 'Temporada', rows: [
          ['E3 · A Longa Maré', '1080p · 1,4 GB · verificado'], ['E4 · Exames no Farol', '8,4 MB/s · faltam cerca de 2 min'],
          ['E5 · Cartas de Água Salgada', '5,1 MB/s · a transferir ao mesmo tempo que o E4'], ['E6 a E12', 'Na fila · cada um encontra a sua fonte'],
          ['E1 · Ferrugem e Pétalas', 'Retoma onde parou, mesmo depois de reiniciar']], paused: 'Em pausa' },
      dialog: { label: 'Ilustração da janela Transferir episódios com os episódios 5 a 12 de Saltwind Academy selecionados',
        title: 'Transferir episódios', sub: 'Saltwind Academy · Temporada 1', quality: 'Qualidade', best: 'A mais alta disponível', saveTo: 'Guardar em',
        cancel: 'Cancelar', go: 'Transferir 8 episódios' },
      notes: [
        ['A melhor qualidade por predefinição', 'O Starlit prefere o ficheiro menos comprimido que encontrar para cada episódio.'],
        ['Vários ao mesmo tempo', 'Transfere mais do que um episódio de cada vez e escolhe quantos nas Definições.'],
        ['Sobrevive a reinícios', 'As transferências por terminar são retomadas, os tempos de espera esgotados são repetidos e os torrents que caem são adicionados outra vez.'],
        ['Verificado antes de reproduzir', 'Os ficheiros terminados são verificados em segundo plano. Um ficheiro que mudou ou desapareceu é assinalado em vez de reproduzido.'],
        ['Torrents também no Android', 'Com o P2P ativo, o Android transfere fontes torrent com o seu próprio motor, para a reprodução não ser interrompida.'],
        ['Pausa a partir do sofá', 'Um telemóvel emparelhado vê a fila do PC e pode pausá-la ou retomá-la.'],
      ], remoteLink: 'Sobre o comando' },
    clean: { kicker: 'Gestão do armazenamento', title: 'Liberta espaço. Nada sai sem a tua autorização.',
      body: 'A gestão do armazenamento junta os episódios que já viste e sugere os que não abres há algum tempo. Revês a lista e confirmas; o Starlit nunca apaga nada sozinho.',
      points: ['Só são propostos ficheiros terminados e verificados que o Starlit guardou', 'As transferências ativas e os outros ficheiros ficam intactos', 'O histórico e a biblioteca ficam como estão',
        'Define um limite de armazenamento para um perfil e as transferências que o ultrapassariam ficam em pausa até as retomares'],
      mock: { label: 'Ilustração da janela de gestão do armazenamento: três episódios vistos pré-selecionados para remover e dois episódios mais antigos sugeridos mas não selecionados',
        title: 'Remover episódios vistos', selected: '4,2 GB selecionados', movie: 'filme', suggested: 'NÃO VISTOS HÁ ALGUM TEMPO · SUGERIDOS',
        note: 'Nada é removido até confirmares.', cancel: 'Cancelar', go: 'Remover 3 episódios' } },
  },
};

export const meta = { en: copy.en.meta, pt: copy.pt.meta };
export const ids = { en: { downloads: 'downloads' }, pt: { downloads: 'transferencias' } };

export function render(lang, { r }) {
  const c = copy[lang], p = c.player, l = c.dl.lib, dg = c.dl.dialog, cm = c.clean.mock;
  const S = lang === 'pt' ? 'T' : 'S';

  const player = `<div class="player-mock" role="img" aria-label="${p.label}">
  <span class="player-shade"></span>
  <span class="player-top"><span>${icon('expand', 20)}</span><span>${icon('x', 20)}</span></span>
  <div class="sub-panel">
    <p class="sub-head"><b>${p.panel}</b>${icon('x', 16)}</p>
    <div><p class="sub-label">${p.track}</p>
      <ul class="sub-tracks" role="list">${p.tracks.map((t, i) => `<li${i === 1 ? ' class="on"' : ''}>${t}${i === 1 ? icon('check', 15) : ''}</li>`).join('')}</ul></div>
    <div><p class="sub-label">${p.style}</p>
      <p class="sub-size"><span>${p.size}</span><span class="sub-slider"><span class="w-55"></span></span><span class="mono">110%</span></p>
      <p class="sub-colors"><span class="on"></span><span></span><span></span><span></span></p></div>
    <div><p class="sub-label">${p.timing}</p>
      <p class="sub-timing"><span>−</span><span class="mono">+0.25 s</span><span>+</span></p></div>
  </div>
  <span class="player-skip">${p.skip}${icon('skip', 15)}</span>
  <div class="player-bottom">
    <p class="player-title">Paper Lanterns</p>
    <p class="player-ep">${p.ep}</p>
    <p class="player-info">${p.info}</p>
    <span class="player-timeline"><span class="tl-intro"></span><span class="tl-credits"></span><span class="tl-done"></span></span>
    <p class="player-controls">
      <span class="pc-play">${icon('playFill', 22)}</span>${icon('aspect', 22, 'hide-sm')}${icon('gauge', 22, 'hide-sm')}<span class="pc-round">${icon('subtitles', 22)}</span>${icon('speaker', 22, 'hide-sm')}${icon('cloud', 22, 'hide-sm')}${icon('copy', 22)}
      <span class="m-spacer"></span>${icon('volumeFill', 24, 'hide-sm')}<span class="pc-volume hide-sm"><span></span></span><span class="pc-time">01:24 / 23:52</span>
    </p>
  </div>
</div>`;

  const thumb = (cls = '') => art('c', 'lib-thumb' + (cls ? ' ' + cls : ''));
  const libWindow = appWindow({ label: l.label, max: false, cls: 'win-lib', body: `
<div class="lib">
  <div class="lib-top">
    <span class="seg seg-inline">${l.tabs.map((t, i) => `<span${i === 2 ? ' class="on"' : ''}>${t}</span>`).join('')}</span>
    <span class="m-btns"><span class="m-btn m-btn-dark m-btn-xs">${icon('pause', 12)}${l.pause}</span><span class="m-btn m-btn-dark m-btn-xs">${icon('playFill', 12)}${l.resume}</span></span>
  </div>
  <div class="lib-storage">
    <p class="lib-storage-top"><b>${l.storage}</b><span class="m-dim">${l.used}</span></p>
    <span class="lib-meter"><span class="w-25"></span><span class="lib-meter-res"></span><span class="lib-limit"></span></span>
    <p class="lib-storage-bottom"><span class="m-dim">${l.limit}</span><span class="link-app">${l.manage}</span></p>
  </div>
  <p class="lib-show">Saltwind Academy <span>· ${l.season} 1</span></p>
  <ul class="lib-list" role="list">
    <li>${thumb()}<span class="lib-text"><b>${l.rows[0][0]}</b><span>${l.rows[0][1]}</span></span><span class="lib-btn lib-btn-light">${icon('playFill', 14)}</span></li>
    <li>${thumb()}<span class="lib-text"><span class="m-dl-top"><b>${l.rows[1][0]}</b><span class="mono hot">72%</span></span><span class="m-bar"><span class="m-fill w-72"></span></span><span class="m-sub">${l.rows[1][1]}</span></span><span class="lib-btn">${icon('pause', 13)}</span></li>
    <li>${thumb()}<span class="lib-text"><span class="m-dl-top"><b>${l.rows[2][0]}</b><span class="mono hot">18%</span></span><span class="m-bar"><span class="m-fill w-18"></span></span><span class="m-sub">${l.rows[2][1]}</span></span><span class="lib-btn">${icon('pause', 13)}</span></li>
    <li>${thumb('faded')}<span class="lib-text"><b>${l.rows[3][0]}</b><span>${l.rows[3][1]}</span></span></li>
  </ul>
  <p class="lib-show">Ironbloom <span>· ${l.season} 2</span></p>
  <ul class="lib-list" role="list">
    <li>${art('d', 'lib-thumb')}<span class="lib-text"><span class="m-dl-top"><b>${l.rows[4][0]}</b><span class="mono warn">${l.paused}</span></span><span class="m-bar"><span class="m-fill m-fill-paused w-31"></span></span><span class="m-sub">${l.rows[4][1]}</span></span><span class="lib-btn lib-btn-blue">${icon('playFill', 13)}</span></li>
  </ul>
</div>` });

  const epDialog = dialog({ label: dg.label, cls: 'dlg-eps', body: `
<p class="dlg-title">${dg.title}</p>
<p class="dlg-sub">${dg.sub}</p>
<div class="ep-grid">${Array.from({ length: 12 }, (_, i) => i + 1).map(n => `<span class="${n < 4 ? 'done' : n === 4 ? '' : 'on'}">${n}${n < 4 ? ' ✓' : ''}</span>`).join('')}</div>
<dl class="m-kv m-kv-l mt-18"><div><dt>${dg.quality}</dt><dd>${dg.best}</dd></div><div><dt>${dg.saveTo}</dt><dd class="mono">D:\\Anime</dd></div></dl>
<p class="m-btns dlg-actions"><span class="m-btn m-btn-dark">${dg.cancel}</span><span class="m-btn m-btn-blue">${dg.go}</span></p>` });

  const row = (checked, title, size) => `<li><span class="box${checked ? ' on' : ''}">${checked ? icon('check', 13) : ''}</span><span class="clean-title">${title}</span><span class="mono m-dim">${size}</span></li>`;
  const cleanDialog = dialog({ label: cm.label, cls: 'dlg-clean', body: `
<p class="dlg-head"><span class="dlg-title">${cm.title}</span><span class="m-dim m-small">${cm.selected}</span></p>
<ul class="clean-list mt-14" role="list">${row(true, `Saltwind Academy · ${S}1 E1`, '1.4 GB')}${row(true, `Saltwind Academy · ${S}1 E2`, '1.4 GB')}${row(true, `Lantern Moth · ${cm.movie}`, '1.4 GB')}</ul>
<p class="sub-label mt-20">${cm.suggested}</p>
<ul class="clean-list mt-6" role="list">${row(false, `Copper Tide · ${S}1 E9`, '2.1 GB')}${row(false, `Copper Tide · ${S}1 E10`, '2.0 GB')}</ul>
<div class="dlg-foot"><span class="m-dim m-small">${cm.note}</span><span class="m-btns"><span class="m-btn m-btn-dark">${cm.cancel}</span><span class="m-btn m-btn-red">${cm.go}</span></span></div>` })
    .replace(/(\d)\.(\d) GB/g, lang === 'pt' ? '$1,$2 GB' : '$1.$2 GB');

  const dlNotes = c.dl.notes.map(([t, b], i) => [t, i === 5 ? `${b} <a class="inline-link" href="${r.remote}">${c.dl.remoteLink}</a>` : b]);

  return `
<section class="sec pt-80 pb-104" aria-labelledby="hero-title">
  <div class="wrap">
    <div class="grid cols-13-1 gap-48 items-end">
      <div>${eyebrow(c.kicker)}<h1 id="hero-title" class="t-hero mt-20">${c.title}</h1></div>
      <p class="lede">${c.lede}</p>
    </div>
    <div class="mt-56">${player}</div>
    <p class="caption">${p.caption}</p>
  </div>
</section>

<section class="sec pb-104" aria-labelledby="player-feat">
  <div class="wrap">
    <h2 id="player-feat" class="t-l">${c.small.title}</h2>
    <div class="mt-44">${cells(c.small.items, 'cells-4')}</div>
    <div class="cast-strip mt-20">${icon('cast', 28, 'i-thin')}<div><p class="cast-title">${c.cast.title} ${pill('beta', 'Beta', 'pill-inline')}</p><p>${c.cast.body}</p></div></div>
  </div>
</section>

<section class="sec pb-112" aria-labelledby="src-title">
  <div class="wrap">
    <div class="panel-xl grid cols-1-12 gap-48 items-start">
      <div>
        ${eyebrow(c.sources.kicker)}
        <h2 id="src-title" class="t-m mt-16">${c.sources.title}</h2>
        <p class="body mt-16">${c.sources.body}</p>
      </div>
      <ul class="def-list" role="list">${c.sources.items.map(([t, b]) => `<li><b>${t}</b><span>${b}</span></li>`).join('')}</ul>
    </div>
  </div>
</section>

<section class="sec band-top pt-112 pb-112" id="${ids[lang].downloads}" aria-labelledby="dl-title">
  <div class="wrap">
    <div class="grid cols-13-1 gap-48 items-end">
      <div>${eyebrow(c.dl.kicker)}<h2 id="dl-title" class="t-big mt-18">${c.dl.title}</h2></div>
      <p class="body-l">${c.dl.body}</p>
    </div>
    <div class="grid cols-155-1 gap-24 items-start mt-52">
      ${libWindow}
      ${epDialog}
    </div>
    <div class="mt-64">${notes(dlNotes, 'notes-3')}</div>
  </div>
</section>

<section class="sec pt-112 pb-128" aria-labelledby="clean-title">
  <div class="wrap grid cols-1-11 gap-64 items-center">
    <div>
      ${eyebrow(c.clean.kicker)}
      <h2 id="clean-title" class="t-l mt-16">${c.clean.title}</h2>
      <p class="body-m mt-18">${c.clean.body}</p>
      ${checkList(c.clean.points, 'mt-24')}
    </div>
    ${cleanDialog}
  </div>
</section>`;
}
