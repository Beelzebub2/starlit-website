// PC remote page. Facts follow docs/DESKTOP_REMOTE.md and the release notes on
// the app repository's Dev branch (Bluetooth trust keys arrived in 1.12.0).
import { icon, eyebrow, pill, art, cells, notes, steps, appWindow, phone, tabset, qrCode } from '../ui.mjs';

const copy = {
  en: {
    meta: {
      title: 'Starlit PC remote: control your PC from your phone',
      description: 'Pair Starlit on Android with Starlit on your Windows PC, then play, pause, seek, skip intros and manage the PC’s downloads from your phone, over Wi-Fi or Bluetooth (beta).',
    },
    kicker: 'PC remote · Android to Windows',
    title: 'Your phone is the remote.',
    lede: 'Starlit on Android pairs with Starlit on your Windows PC. Play, pause and seek, change the volume, skip intros and credits, pick another episode, source or subtitle track, and keep an eye on the PC’s downloads, all from the couch.',
    badges: [['wifi', 'Wi-Fi and wired networks'], ['bluetooth', 'Bluetooth <span class="warn">beta</span>'], ['shieldCheck', 'Encrypted, same account only']],
    note: 'Both devices must be signed in to the same Starlit account on the same server. The full-screen controller page arrived in 1.11.',
    demo: {
      label: 'Interactive preview of the Android PC controller', tabsLabel: 'Controller sections',
      title: 'PC controller', tabs: ['Remote', 'Downloads', 'PCs'], try: 'Try the tabs: Remote, Downloads and PCs. The shows are made up.',
      pc: 'Living-room PC', connected: 'Connected over Wi-Fi', ep: 'S1 · E7 · The Quiet Shore', skip: 'Skip intro',
      buttons: ['Episodes', 'Sources', 'Subtitles'],
      dlHead: 'Downloads on Living-room PC · profile Mia',
      dl: [['c', 'Saltwind Academy', 'S1 E4 · 8.4 MB/s', 72, 'pause'], ['c', 'Saltwind Academy', 'S1 E5 · queued', 0, 'pause'], ['d', 'Ironbloom', 'S2 E1 · paused', 31, 'play']],
      dlNote: 'Pause and resume from here. New downloads and deleting files stay on the PC.',
      saved: 'Previously paired PCs', study: 'Study PC', studySub: 'Last seen yesterday', wake: 'Wake PC', connectedShort: 'connected',
      add: 'Ways to connect', ways: ['Scan desktop QR code', 'Search local network', 'Enter address', 'Find Bluetooth PCs'],
    },
    pairing: {
      kicker: 'Pairing', title: 'Pair once. Keep watching while you do.',
      body: 'Connect phone opens in its own window on the PC, so whatever’s playing keeps playing while you set up.',
      win: { label: 'Illustration of the Phone remote window: a pairing QR code, the PC’s addresses, setup steps and the confirmation code',
        title: 'Phone remote', qrNote: 'The code holds a local address only', addresses: 'This PC’s addresses',
        steps: ['Sign in to the same account on your phone.', 'Open Settings → PC controller and scan.', 'Check that both screens show the same code.'],
        code: 'Confirmation code' },
      steps: [
        ['Open Connect phone on the PC', 'It’s in Settings → Account → Devices. The Phone remote window shows a QR code and your PC’s local addresses, and the six-digit code once your phone asks to pair. Pick the right network if the PC has more than one.'],
        ['Find the PC from your phone', 'In Settings → PC controller, scan the code, search the local network, or type the PC’s private IP address. Phones without a scanner can still use the other two.'],
        ['Match the six digits', 'Approve on both devices only when the codes are identical. Local-network connections ask again every time; a Bluetooth PC you’ve approved reconnects without a new code.'],
        ['Sit down', 'Your phone remembers the PC for next time, as an address rather than a password. Bluetooth approval is kept as an encrypted key on both devices. Forget a PC whenever you like.'],
      ],
    },
    can: { title: 'What your phone can do.', items: [
      ['playCircle', 'Run playback', 'Play and pause, seek, change the volume or mute, and skip intros and credits whenever the PC offers it.'],
      ['list', 'Switch what’s on', 'Jump to another episode, try a different source, or change the subtitle track from the sofa.'],
      ['handoff', 'Play on Starlit PC', 'Pick a title or episode on your phone. The PC asks for approval and opens its usual source picker. No stream links, tokens or files are sent.'],
      ['download', 'Watch the download queue', 'See progress for the PC’s current profile and pause or resume jobs. Your phone can’t start downloads, delete files or change folders.'],
      ['power', 'Wake a sleeping PC', 'Optional Wake-on-LAN for saved PCs. It depends on the PC, its BIOS and your network, so it won’t work everywhere.'],
      ['monitor', 'Remember your PCs', 'Previously paired PCs are listed with when each was last seen, so you can reconnect to one or forget it.'],
    ] },
    ways: { title: 'Two ways to connect.', available: 'Available', beta: 'Beta',
      lan: { title: 'Local network', body: 'For a phone and PC on the same Wi-Fi or wired network. Starlit announces itself on the network and also answers direct checks, so Search local network can find the PC even when broadcasts get blocked, and it tries saved PCs and nearby private addresses first.',
        rows: [['Discovery', 'UDP 47788', true], ['Control', 'TCP 47789', true], ['Networks', 'Private IPv4 only. Nothing faces the internet.']] },
      bt: { title: 'Bluetooth', body: 'No shared network? Pair your Android phone with a Windows PC in Bluetooth settings, then connect from PC controller. It uses the same encrypted, account-checked pairing and the same command limits as Wi-Fi, and an approved PC reconnects without asking for the code again.',
        rows: [['Devices', 'Windows PC with Android phone'], ['Needs', 'Bluetooth Classic, system pairing and Bluetooth permissions'], ['Status', 'Still being tested on real phones and PCs. Expect rough edges.', false, true]] },
    },
    fw: {
      kicker: 'Windows Firewall', title: 'If the firewall’s in the way, Starlit tells you why.',
      body: 'The remote window checks Windows Firewall without asking for administrator rights. If phones can’t reach the PC, one explicit approval adds two Starlit-only rules for private and domain networks, limited to your local subnet. Rules you already have, including block rules, are left as they are, and public networks stay closed.',
      mock: { label: 'Illustration of Starlit’s firewall check: inbound connections blocked on a private network, with a button to allow them',
        alert: 'Phones can’t reach this PC', alertBody: 'Windows Firewall is blocking inbound connections on this private network.',
        rows: [['Starlit control', 'TCP 47789 · inbound'], ['Starlit discovery', 'UDP 47788 · inbound'], ['Scope', 'Private, Domain · local subnet']],
        allow: 'Allow through firewall', again: 'Check again', note: 'Windows will ask for administrator approval once.' },
    },
    sec: { title: 'Locked to your account, your network and your say-so.', items: [
      ['Same account, same server', 'The phone and PC must be signed in to the same Starlit account on the same account server, and the account is checked again at least once a minute.'],
      ['Codes on both screens', 'A local-network session starts only after the matching six-digit code is approved on both screens. Bluetooth asks once, then proves the pairing with an encrypted key.'],
      ['Encrypted, and local', 'Commands travel over an encrypted channel on private networks or Bluetooth. There’s no internet-facing receiver.'],
      ['The QR code is just an address', 'It never contains tokens, private keys or media links.'],
      ['A short list of commands', 'The phone can’t start downloads, delete files, inject links or reach other profiles on the PC.'],
      ['The PC decides', 'Titles sent with Play on Starlit PC wait for approval on the PC before anything opens.'],
    ] },
    compat: { title: 'What works with what', head: ['Setup', 'Status', 'Notes'], rows: [
      ['Android phone → Windows PC, local network', 'ok', 'Available', 'Controls Starlit’s built-in desktop player'],
      ['Android phone → Windows PC, Bluetooth', 'beta', 'Beta', 'Needs Bluetooth pairing in both operating systems'],
      ['iPhone as the remote', 'no', 'Not yet', 'There’s no public iPhone app yet'],
      ['External players such as VLC', 'no', 'Not supported', 'The remote drives Starlit’s own player'],
      ['Android → Chromecast or a TV with Google Cast', 'beta', 'Beta', 'Separate from the remote. Android can cast public HTTPS videos after you confirm you’re allowed to play them; torrents, local files and signed links can’t be cast.'],
    ], cta: 'Get Starlit for Windows and Android', accounts: 'About Starlit accounts' },
  },

  pt: {
    meta: {
      title: 'Comando do PC no Starlit: controla o PC a partir do telemóvel',
      description: 'Emparelha o Starlit no Android com o Starlit no PC com Windows e depois reproduz, pausa, avança, salta introduções e gere as transferências do PC a partir do telemóvel, por Wi-Fi ou Bluetooth (beta).',
    },
    kicker: 'Comando do PC · Android para Windows',
    title: 'O telemóvel é o comando.',
    lede: 'O Starlit no Android emparelha com o Starlit no PC com Windows. Reproduz, pausa e avança, muda o volume, salta introduções e créditos, escolhe outro episódio, fonte ou faixa de legendas e acompanha as transferências do PC, tudo a partir do sofá.',
    badges: [['wifi', 'Redes Wi-Fi e por cabo'], ['bluetooth', 'Bluetooth <span class="warn">beta</span>'], ['shieldCheck', 'Encriptado, só com a mesma conta']],
    note: 'Os dois dispositivos têm de ter sessão iniciada na mesma conta Starlit e no mesmo servidor. A página do comando em ecrã inteiro chegou na versão 1.11.',
    demo: {
      label: 'Pré-visualização interativa do comando do PC no Android', tabsLabel: 'Secções do comando',
      title: 'Controlar PC', tabs: ['Comando', 'Transferências', 'PCs'], try: 'Experimenta os separadores: Comando, Transferências e PCs. As séries são fictícias.',
      pc: 'PC da sala', connected: 'Ligado por Wi-Fi', ep: 'T1 · E7 · A Margem Silenciosa', skip: 'Saltar introdução',
      buttons: ['Episódios', 'Fontes', 'Legendas'],
      dlHead: 'Transferências no PC da sala · perfil Mia',
      dl: [['c', 'Saltwind Academy', 'T1 E4 · 8,4 MB/s', 72, 'pause'], ['c', 'Saltwind Academy', 'T1 E5 · na fila', 0, 'pause'], ['d', 'Ironbloom', 'T2 E1 · em pausa', 31, 'play']],
      dlNote: 'Pausa e retoma a partir daqui. Novas transferências e apagar ficheiros ficam no PC.',
      saved: 'PCs anteriormente emparelhados', study: 'PC do escritório', studySub: 'Visto pela última vez ontem', wake: 'Ligar PC', connectedShort: 'ligado',
      add: 'Formas de ligar', ways: ['Ler código QR do computador', 'Procurar na rede local', 'Introduzir endereço', 'Procurar PCs por Bluetooth'],
    },
    pairing: {
      kicker: 'Emparelhamento', title: 'Emparelha uma vez. Continua a ver enquanto o fazes.',
      body: 'Ligar telemóvel abre numa janela à parte no PC, por isso o que está a dar continua a dar enquanto configuras.',
      win: { label: 'Ilustração da janela Controlo pelo telemóvel: um código QR de emparelhamento, os endereços do PC, os passos e o código de confirmação',
        title: 'Controlo pelo telemóvel', qrNote: 'O código contém apenas um endereço local', addresses: 'Endereços deste PC',
        steps: ['Inicia sessão na mesma conta no telemóvel.', 'Abre Definições → Controlar PC e lê o código.', 'Confirma que os dois ecrãs mostram o mesmo código.'],
        code: 'Código de confirmação' },
      steps: [
        ['Abre Ligar telemóvel no PC', 'Está em Definições → Conta → Dispositivos. A janela Controlo pelo telemóvel mostra um código QR e os endereços locais do PC, e o código de seis dígitos quando o telemóvel pede para emparelhar. Escolhe a rede certa se o PC tiver mais do que uma.'],
        ['Encontra o PC a partir do telemóvel', 'Em Definições → Controlar PC, lê o código, procura na rede local ou escreve o endereço IP privado do PC. Os telemóveis sem leitor de códigos podem usar as outras duas opções.'],
        ['Compara os seis dígitos', 'Aprova nos dois dispositivos só quando os códigos forem iguais. As ligações pela rede local pedem o código sempre; um PC aprovado por Bluetooth volta a ligar sem pedir um código novo.'],
        ['Senta-te', 'O telemóvel lembra-se do PC para a próxima vez, como um endereço e não como uma palavra-passe. A aprovação por Bluetooth fica guardada como uma chave encriptada nos dois dispositivos. Esquece um PC quando quiseres.'],
      ],
    },
    can: { title: 'O que o telemóvel pode fazer.', items: [
      ['playCircle', 'Controlar a reprodução', 'Reproduz e pausa, avança, muda o volume ou silencia e salta introduções e créditos sempre que o PC o permitir.'],
      ['list', 'Mudar o que está a dar', 'Salta para outro episódio, experimenta outra fonte ou muda a faixa de legendas a partir do sofá.'],
      ['handoff', 'Reproduzir no PC Starlit', 'Escolhe um título ou episódio no telemóvel. O PC pede aprovação e abre o seletor de fontes habitual. Não são enviadas ligações de streaming, tokens nem ficheiros.'],
      ['download', 'Acompanhar as transferências', 'Vê o progresso do perfil atual do PC e pausa ou retoma tarefas. O telemóvel não pode iniciar transferências, apagar ficheiros nem mudar pastas.'],
      ['power', 'Acordar um PC em suspensão', 'Wake-on-LAN opcional para PCs guardados. Depende do PC, da BIOS e da rede, por isso não funciona em todo o lado.'],
      ['monitor', 'Lembrar os teus PCs', 'Os PCs emparelhados aparecem com a última vez que foram vistos, para voltares a ligar a um deles ou o esqueceres.'],
    ] },
    ways: { title: 'Duas formas de ligar.', available: 'Disponível', beta: 'Beta',
      lan: { title: 'Rede local', body: 'Para um telemóvel e um PC na mesma rede Wi-Fi ou por cabo. O Starlit anuncia-se na rede e também responde a pedidos diretos, por isso Procurar na rede local encontra o PC mesmo quando as difusões são bloqueadas, e experimenta primeiro os PCs guardados e os endereços privados próximos.',
        rows: [['Descoberta', 'UDP 47788', true], ['Controlo', 'TCP 47789', true], ['Redes', 'Apenas IPv4 privado. Nada fica exposto à internet.']] },
      bt: { title: 'Bluetooth', body: 'Sem rede partilhada? Emparelha o telemóvel Android com um PC com Windows nas definições de Bluetooth e depois liga a partir de Controlar PC. Usa o mesmo emparelhamento encriptado e verificado pela conta e os mesmos limites de comandos que o Wi-Fi, e um PC aprovado volta a ligar sem pedir o código outra vez.',
        rows: [['Dispositivos', 'PC com Windows e telemóvel Android'], ['Requisitos', 'Bluetooth Classic, emparelhamento no sistema e permissões de Bluetooth'], ['Estado', 'Ainda em testes com telemóveis e PCs reais. Podem existir arestas por limar.', false, true]] },
    },
    fw: {
      kicker: 'Firewall do Windows', title: 'Se a firewall estiver no caminho, o Starlit diz-te porquê.',
      body: 'A janela do comando verifica a Firewall do Windows sem pedir direitos de administrador. Se os telemóveis não chegarem ao PC, uma única aprovação explícita adiciona duas regras só do Starlit para redes privadas e de domínio, limitadas à tua sub-rede local. As regras que já tens, incluindo regras de bloqueio, ficam como estão, e as redes públicas continuam fechadas.',
      mock: { label: 'Ilustração da verificação da firewall do Starlit: ligações de entrada bloqueadas numa rede privada, com um botão para as permitir',
        alert: 'Os telemóveis não chegam a este PC', alertBody: 'A Firewall do Windows está a bloquear ligações de entrada nesta rede privada.',
        rows: [['Controlo do Starlit', 'TCP 47789 · entrada'], ['Descoberta do Starlit', 'UDP 47788 · entrada'], ['Âmbito', 'Privada, Domínio · sub-rede local']],
        allow: 'Permitir na firewall', again: 'Verificar outra vez', note: 'O Windows vai pedir aprovação de administrador uma vez.' },
    },
    sec: { title: 'Preso à tua conta, à tua rede e à tua decisão.', items: [
      ['Mesma conta, mesmo servidor', 'O telemóvel e o PC têm de ter sessão iniciada na mesma conta Starlit e no mesmo servidor de contas, e a conta é verificada outra vez pelo menos uma vez por minuto.'],
      ['Códigos nos dois ecrãs', 'Uma sessão pela rede local só começa depois de o código de seis dígitos ser aprovado nos dois ecrãs. O Bluetooth pede-o uma vez e depois prova o emparelhamento com uma chave encriptada.'],
      ['Encriptado e local', 'Os comandos viajam por um canal encriptado em redes privadas ou por Bluetooth. Não há nenhum recetor exposto à internet.'],
      ['O código QR é só um endereço', 'Nunca contém tokens, chaves privadas nem ligações para conteúdos.'],
      ['Uma lista curta de comandos', 'O telemóvel não pode iniciar transferências, apagar ficheiros, injetar ligações nem aceder a outros perfis do PC.'],
      ['Quem decide é o PC', 'Os títulos enviados com Reproduzir no PC Starlit esperam aprovação no PC antes de abrir alguma coisa.'],
    ] },
    compat: { title: 'O que funciona com quê', head: ['Configuração', 'Estado', 'Notas'], rows: [
      ['Telemóvel Android → PC com Windows, rede local', 'ok', 'Disponível', 'Controla o leitor integrado do Starlit para computador'],
      ['Telemóvel Android → PC com Windows, Bluetooth', 'beta', 'Beta', 'Requer emparelhamento Bluetooth nos dois sistemas operativos'],
      ['iPhone como comando', 'no', 'Ainda não', 'Ainda não existe uma aplicação pública para iPhone'],
      ['Leitores externos, como o VLC', 'no', 'Não suportado', 'O comando controla o leitor do próprio Starlit'],
      ['Android → Chromecast ou TV com Google Cast', 'beta', 'Beta', 'À parte do comando. O Android pode transmitir vídeos HTTPS públicos depois de confirmares que os podes reproduzir; torrents, ficheiros locais e ligações assinadas não podem ser transmitidos.'],
    ], cta: 'Obter o Starlit para Windows e Android', accounts: 'Sobre as contas Starlit' },
  },
};

export const meta = { en: copy.en.meta, pt: copy.pt.meta };

export function render(lang, { r }) {
  const c = copy[lang], d = c.demo, w = c.pairing.win;

  const remotePanel = `
<div class="p-device"><span class="p-device-icon">${icon('monitor', 17)}</span><span class="p-device-text"><b>${d.pc}</b><span>${d.connected}</span></span><span class="live-dot"></span></div>
<div class="p-stack mt-14">
  <span class="p-art art-a"></span>
  <div><p class="p-title">Hollow Orbit</p><p class="p-sub">${d.ep}</p></div>
  <div><span class="p-track"><span class="p-done"></span><span class="p-knob"></span></span><span class="p-times"><span>08:51</span><span>23:40</span></span></div>
  <div class="p-transport"><span>${icon('back10', 28)}</span><span class="p-play">${icon('pause', 26)}</span><span>${icon('fwd10', 28)}</span></div>
  <span class="p-skip">${icon('skip', 16)}${d.skip}</span>
  <div class="p-volume"><span class="p-vol-btn">${icon('volumeHigh', 18)}</span><span class="p-vol-track"><span class="w-62"></span></span><span class="mono">62</span></div>
  <div class="p-shortcuts">${[['list', d.buttons[0]], ['layers', d.buttons[1]], ['subtitles', d.buttons[2]]].map(([ic, t]) => `<span>${icon(ic, 19)}${t}</span>`).join('')}</div>
</div>`;

  const downloadsPanel = `
<div class="p-stack p-stack-tight">
  <p class="p-label">${d.dlHead}</p>
  ${d.dl.map(([l, title, sub, pct, action]) => `<div class="p-dl">
    <div class="p-dl-row">${art(l, 'p-dl-art')}<span class="p-dl-text"><b>${title}</b><span${action === 'play' ? ' class="warn"' : ''}>${sub}</span></span><span class="p-icon-btn${action === 'play' ? ' p-icon-btn-accent' : ''}">${icon(action === 'play' ? 'playFill' : 'pause', 14)}</span></div>
    <span class="p-dl-bar">${pct ? `<span class="w-${pct}${action === 'play' ? ' paused' : ''}"></span>` : ''}</span>
  </div>`).join('')}
  <p class="p-note">${icon('info', 14)}<span>${d.dlNote}</span></p>
</div>`;

  const pcsPanel = `
<div class="p-stack p-stack-tight">
  <p class="p-label">${d.saved}</p>
  <div class="p-pc"><span class="live-dot"></span><span class="p-dl-text"><b>${d.pc}</b><span class="mono">192.168.1.24 · ${d.connectedShort}</span></span></div>
  <div class="p-pc"><span class="off-dot"></span><span class="p-dl-text"><b>${d.study}</b><span>${d.studySub}</span></span><span class="p-wake">${icon('power', 13)}${d.wake}</span></div>
  <p class="p-label mt-6">${d.add}</p>
  <span class="p-way p-way-accent">${icon('qr', 18)}<span>${d.ways[0]}</span></span>
  <span class="p-way">${icon('wifi', 18)}<span>${d.ways[1]}</span></span>
  <span class="p-way">${icon('keyboard', 18)}<span>${d.ways[2]}</span></span>
  <span class="p-way">${icon('bluetooth', 18, 'warn')}<span>${d.ways[3]}</span>${pill('beta', 'Beta', 'pill-plain pill-tiny')}</span>
</div>`;

  const demo = phone({ label: d.label, cls: 'phone-demo', interactive: true, body: `
<p class="p-head">${icon('back', 22)}<span>${d.title}</span></p>
${tabset({ name: 'controller', label: d.tabsLabel, tabs: d.tabs, panels: [remotePanel, downloadsPanel, pcsPanel], cls: 'p-tabs', barCls: 'seg seg-tabs' })}` });

  const pairWindow = appWindow({ label: w.label, title: w.title, cls: 'win-pair', max: false, body: `
<div class="pair pair-l">
  <div class="qr-col"><span class="qr-box">${qrCode(190)}</span><span class="m-dim m-small">${w.qrNote}</span></div>
  <div class="pair-info pair-info-l">
    <div><p class="m-dim m-small">${w.addresses}</p>
      <dl class="m-kv m-kv-l mt-6"><div><dt><span class="radio on"></span>Wi-Fi</dt><dd class="mono">192.168.1.24</dd></div><div class="m-dim"><dt><span class="radio"></span>Ethernet</dt><dd class="mono">10.0.0.8</dd></div></dl></div>
    <ol class="pair-steps">${w.steps.map(s => `<li>${s}</li>`).join('')}</ol>
    <div class="code-box"><p>${w.code}</p><p class="pair-code">482 913</p></div>
  </div>
</div>` });

  const wayCard = (k, kind, label, ic) => `
<article class="way way-${kind}">
  <div class="way-top">${icon(ic, 36, 'i-thin')}${pill(kind, label)}</div>
  <h3 class="t-card mt-24">${k.title}</h3>
  <p class="body mt-12">${k.body}</p>
  <dl class="way-dl">${k.rows.map(([dt, dd, mono, warn]) => `<dt>${dt}</dt><dd${mono ? ' class="mono"' : warn ? ' class="warn"' : ''}>${dd}</dd>`).join('')}</dl>
</article>`;

  const m = c.fw.mock;
  const fwMock = `<div class="fw-mock" role="img" aria-label="${m.label}">
  <div class="fw-alert">${icon('shieldAlert', 22)}<div><p class="fw-alert-title">${m.alert}</p><p>${m.alertBody}</p></div></div>
  <dl class="m-kv m-kv-l mt-16">${m.rows.map(([dt, dd], i) => `<div><dt>${dt}</dt><dd${i < 2 ? ' class="mono"' : ''}>${dd}</dd></div>`).join('')}</dl>
  <p class="m-btns mt-18"><span class="m-btn m-btn-light">${icon('shield', 15)}${m.allow}</span><span class="m-btn m-btn-dark">${m.again}</span></p>
  <p class="m-dim m-small mt-12">${m.note}</p>
</div>`;

  return `
<section class="sec pt-80 pb-96" aria-labelledby="hero-title">
  <div class="wrap grid cols-125-1 gap-56 items-center">
    <div>
      ${eyebrow(c.kicker)}
      <h1 id="hero-title" class="t-hero mt-20">${c.title}</h1>
      <p class="lede mt-28 measure-560">${c.lede}</p>
      <ul class="badge-list mt-32" role="list">${c.badges.map(([ic, t]) => `<li>${icon(ic, 16, ic === 'bluetooth' ? 'warn' : 'hot')}<span>${t}</span></li>`).join('')}</ul>
      <p class="small-note mt-28">${c.note}</p>
    </div>
    <div class="demo-col">
      ${demo}
      <p class="caption">${d.try}</p>
    </div>
  </div>
</section>

<section class="sec band-top pt-104 pb-104" aria-labelledby="pair-title">
  <div class="wrap">
    ${eyebrow(c.pairing.kicker)}
    <h2 id="pair-title" class="t-xl mt-16 measure-760">${c.pairing.title}</h2>
    <p class="body-l mt-18 measure-640">${c.pairing.body}</p>
    <div class="grid cols-12-1 gap-48 items-start mt-52">
      ${pairWindow}
      ${steps(c.pairing.steps)}
    </div>
  </div>
</section>

<section class="sec pt-112 pb-56" aria-labelledby="can-title">
  <div class="wrap">
    <h2 id="can-title" class="t-xl measure-820">${c.can.title}</h2>
    <div class="mt-48">${cells(c.can.items, 'cells-3')}</div>
  </div>
</section>

<section class="sec pt-72 pb-72" aria-labelledby="ways-title">
  <div class="wrap">
    <h2 id="ways-title" class="t-xl">${c.ways.title}</h2>
    <div class="grid cols-2 gap-20 mt-44">
      ${wayCard(c.ways.lan, 'ok', c.ways.available, 'wifi')}
      ${wayCard(c.ways.bt, 'beta', c.ways.beta, 'bluetooth')}
    </div>
  </div>
</section>

<section class="sec pt-72 pb-72" aria-labelledby="fw-title">
  <div class="wrap grid cols-2 gap-56 items-center">
    <div>
      ${eyebrow(c.fw.kicker)}
      <h2 id="fw-title" class="t-l mt-16">${c.fw.title}</h2>
      <p class="body-m mt-18">${c.fw.body}</p>
    </div>
    ${fwMock}
  </div>
</section>

<section class="sec pt-72 pb-72" aria-labelledby="sec-title">
  <div class="wrap">
    <div class="panel-xl">
      <h2 id="sec-title" class="t-l measure-760">${c.sec.title}</h2>
      <div class="mt-40">${notes(c.sec.items, 'notes-3')}</div>
    </div>
  </div>
</section>

<section class="sec pt-72 pb-128" aria-labelledby="compat-title">
  <div class="wrap">
    <h2 id="compat-title" class="t-s">${c.compat.title}</h2>
    <div class="table-wrap mt-28">
      <table class="data-table">
        <thead><tr>${c.compat.head.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead>
        <tbody>${c.compat.rows.map(([setup, kind, label, note]) => `
          <tr><td>${setup}</td><td>${pill(kind, label, 'pill-plain')}</td><td class="note">${note}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p class="cta-row mt-40"><a class="btn btn-accent btn-lg" href="${r.download}">${c.compat.cta}</a><a class="btn btn-ghost btn-lg" href="${r.sync}">${c.compat.accounts}</a></p>
  </div>
</section>`;
}
