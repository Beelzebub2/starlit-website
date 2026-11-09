// Download page. The version, file names and "What's new" entries come from
// the app's GitHub releases (data/releases.json); site.js keeps them current.
import { VERSION, WINDOWS_FILE, ANDROID_FILE, LATEST, RELEASES, ISSUES, CONTACT, RELEASE_DATA } from '../constants.mjs';
import { icon, eyebrow, pill, checkList, esc, inEnglish, releaseDate, rel } from '../ui.mjs';

const winFile = rel('windows-file', WINDOWS_FILE, 'code', 'code-hl');

const copy = {
  en: {
    meta: {
      title: 'Download Starlit for Windows and Android',
      description: `Get Starlit ${VERSION} for Windows 10 and 11 or Android 7.0 and later from its public GitHub releases, with SHA-256 checksums to check your download. Free and open source under GPL-3.0.`,
    },
    kicker: `Latest release · ${rel('version', VERSION)}`, title: 'Get Starlit.',
    lede: 'Free and open source under GPL-3.0. Both apps come from the same release on GitHub, with a checksum file to prove what you downloaded.',
    available: 'Available', notYet: 'Not yet', opens: 'Opens the latest release on GitHub',
    win: { name: 'Windows', req: 'Windows 10 and 11, 64-bit', cta: 'Download for Windows',
      points: ['Starlit’s own installer. No administrator rights needed.', 'Updates in the app, each checked against its SHA-256 checksum.', 'Your settings, profiles and library are kept when you update.'] },
    android: { name: 'Android', req: 'Android 7.0 or later', cta: 'Download the APK',
      points: ['A signed APK you install yourself. Most phones need <code>arm64-v8a</code>.', 'The app checks for updates and picks the right file for your phone.', 'Doubles as the remote for Starlit on your PC.'] },
    others: [['iPhone and iPad', 'The code exists, but no build has been released or tested.'], ['Mac', 'No Mac app is available.'], ['Linux', 'No Linux build is available.']],
    install: { title: 'Installing takes a minute.', win: 'On Windows', android: 'On Android',
      winSteps: [`Download ${winFile} from the latest release.`, 'Run it. Starlit installs for your Windows user and lets you choose the folder and shortcuts.', 'Open Starlit, add your sources, and you’re set. It checks for updates at startup, every six hours, and from Settings → About.'],
      androidSteps: ['On your phone, download the APK for its processor. If you’re not sure, it’s <code class="code-hl">arm64-v8a</code>. Older 32-bit phones use <code class="code-hl">armeabi-v7a</code>.', 'Open it and allow your browser or file manager to install apps when Android asks.', 'Sign in or continue as a guest. To use it as a remote, open Settings → PC controller.'] },
    // The entries themselves come from the GitHub release notes (data/releases.json).
    news: { title: 'What’s new', all: 'Every release note on GitHub', latest: 'Latest', notes: 'Release notes', note: '' },
    verify: { title: 'Check what you downloaded.',
      body: 'Each release includes <code class="code-hl">SHA256SUMS.txt</code>. Compare your file’s hash with the one listed there. The Windows updater does this for you automatically.',
      label: 'PowerShell', other: 'On other systems:' },
    faq: { title: 'Questions', more: `Something else? <a class="inline-link" href="${ISSUES}">Open an issue</a> or write to <a class="inline-link" href="mailto:${CONTACT}">${CONTACT}</a>.`, items: [
      ['Does Starlit cost anything?', 'No. Starlit is free and open source under the GPL-3.0 licence, and its code is on GitHub.'],
      ['Does it come with shows and films?', 'No. Starlit is a client. It shows metadata and plays media from the add-ons, plugins and sources you install, and it’s meant for content you own or are otherwise allowed to access. It doesn’t host, store or distribute media.'],
      ['Do I need an account?', 'No. Guest mode keeps everything on the device. Create a free account to sync between your PC and phone, or to use account-connected phone remote features; email registrations must be verified. You can bring guest data into an account later.'],
      ['Is there an iPhone or Mac version?', 'Not yet. The project contains iOS code, but there’s no released or tested build for iPhone, iPad or Mac. This page will say so when there is.'],
      ['Windows or my antivirus warned me about the installer. Is it safe?', `The installer isn’t signed with a publisher certificate yet, so Windows SmartScreen may warn that it doesn’t recognise it. Download it only from the <a class="inline-link" href="${RELEASES}">GitHub releases</a> and compare its hash with <code>SHA256SUMS.txt</code> from the same release. Microsoft Defender flagged 1.11.0 because of the background scripts it ran; 1.11.1 removed them. If your antivirus flags a newer version, please tell us.`],
      ['Windows Firewall asked about Starlit. What should I pick?', 'Allow private networks if you want to use your phone as a remote. If you cancelled the prompt, the Connect phone window can add Starlit’s rules for you after one administrator approval; if Windows created a rule that blocks Starlit, remove it in Windows Defender Firewall’s settings. Public networks stay blocked either way.'],
      ['Is Starlit the same as Nuvio?', 'Starlit is based on Nuvio Desktop by Tapframe and friends and shares code with Nuvio Mobile, but it’s a separate build maintained by Beelzebub2. Please report Starlit problems here, not to the Nuvio team. Nuvio accounts don’t carry over.'],
      ['I used Nuvio Native. Do I start over?', 'No. Starlit was called Nuvio Native up to version 1.0.14, and updating keeps your settings, profiles and library.'],
    ] },
  },

  pt: {
    meta: {
      title: 'Transferir o Starlit para Windows e Android',
      description: `Obtém o Starlit ${VERSION} para Windows 10 e 11 ou Android 7.0 e posterior a partir das versões públicas no GitHub, com somas SHA-256 para verificares a transferência. Gratuito e de código aberto sob a GPL-3.0.`,
    },
    kicker: `Versão mais recente · ${rel('version', VERSION)}`, title: 'Obtém o Starlit.',
    lede: 'Gratuito e de código aberto sob a GPL-3.0. As duas aplicações vêm da mesma versão no GitHub, com um ficheiro de somas de verificação para confirmares o que transferiste.',
    available: 'Disponível', notYet: 'Ainda não', opens: 'Abre a versão mais recente no GitHub',
    win: { name: 'Windows', req: 'Windows 10 e 11, 64 bits', cta: 'Transferir para Windows',
      points: ['Instalador próprio do Starlit. Não precisa de direitos de administrador.', 'Atualizações na aplicação, cada uma verificada com a respetiva soma SHA-256.', 'As definições, os perfis e a biblioteca mantêm-se quando atualizas.'] },
    android: { name: 'Android', req: 'Android 7.0 ou posterior', cta: 'Transferir o APK',
      points: ['Um APK assinado que instalas tu. A maioria dos telemóveis precisa do <code>arm64-v8a</code>.', 'A aplicação procura atualizações e escolhe o ficheiro certo para o teu telemóvel.', 'Serve também de comando para o Starlit no PC.'] },
    others: [['iPhone e iPad', 'O código existe, mas nenhuma versão foi publicada nem testada.'], ['Mac', 'Não existe uma aplicação para Mac.'], ['Linux', 'Não existe uma versão para Linux.']],
    install: { title: 'Instalar demora um minuto.', win: 'No Windows', android: 'No Android',
      winSteps: [`Transfere ${winFile} da versão mais recente.`, 'Executa-o. O Starlit instala-se para o teu utilizador do Windows e deixa-te escolher a pasta e os atalhos.', 'Abre o Starlit, adiciona as tuas fontes e está feito. Procura atualizações ao iniciar, a cada seis horas e em Definições → Acerca.'],
      androidSteps: ['No telemóvel, transfere o APK para o respetivo processador. Se não tiveres a certeza, é o <code class="code-hl">arm64-v8a</code>. Os telemóveis mais antigos de 32 bits usam o <code class="code-hl">armeabi-v7a</code>.', 'Abre-o e autoriza o navegador ou o gestor de ficheiros a instalar aplicações quando o Android pedir.', 'Inicia sessão ou continua como convidado. Para o usares como comando, abre Definições → Controlar PC.'] },
    news: { title: 'Novidades', all: 'Todas as notas de versão no GitHub', latest: 'Mais recente', notes: 'Notas de versão',
      note: 'As notas de versão são publicadas em inglês, tal como no GitHub.' },
    verify: { title: 'Verifica o que transferiste.',
      body: 'Cada versão inclui o ficheiro <code class="code-hl">SHA256SUMS.txt</code>. Compara a soma do teu ficheiro com a que lá aparece. O atualizador do Windows faz isto por ti automaticamente.',
      label: 'PowerShell', other: 'Noutros sistemas:' },
    faq: { title: 'Perguntas', more: `Outra coisa? <a class="inline-link" href="${ISSUES}">Abre um issue</a> ou escreve para <a class="inline-link" href="mailto:${CONTACT}">${CONTACT}</a>.`, items: [
      ['O Starlit custa alguma coisa?', 'Não. O Starlit é gratuito e de código aberto sob a licença GPL-3.0, e o código está no GitHub.'],
      ['Inclui séries e filmes?', 'Não. O Starlit é um cliente. Mostra metadados e reproduz conteúdos a partir dos addons, plugins e fontes que instalas, e destina-se a conteúdos que te pertencem ou a que tens autorização para aceder. Não aloja, guarda nem distribui conteúdos multimédia.'],
      ['Preciso de uma conta?', 'Não. O modo convidado guarda tudo no dispositivo. Cria uma conta gratuita para sincronizar entre o PC e o telemóvel ou usar as funções do comando associadas à conta; os registos por e-mail exigem confirmação. Podes levar os dados de convidado para a conta mais tarde.'],
      ['Há uma versão para iPhone ou Mac?', 'Ainda não. O projeto tem código para iOS, mas não existe nenhuma versão publicada nem testada para iPhone, iPad ou Mac. Esta página dirá quando houver.'],
      ['O Windows ou o antivírus avisou-me sobre o instalador. É seguro?', `O instalador ainda não está assinado com um certificado de editor, por isso o SmartScreen do Windows pode avisar que não o reconhece. Transfere-o só das <a class="inline-link" href="${RELEASES}">versões no GitHub</a> e compara a soma com o <code>SHA256SUMS.txt</code> da mesma versão. O Microsoft Defender assinalou a 1.11.0 por causa dos scripts que corria em segundo plano; a 1.11.1 retirou-os. Se o teu antivírus assinalar uma versão mais recente, avisa-nos.`],
      ['A Firewall do Windows perguntou sobre o Starlit. O que escolho?', 'Permite as redes privadas se quiseres usar o telemóvel como comando. Se cancelaste o aviso, a janela Ligar telemóvel pode adicionar as regras do Starlit por ti depois de uma aprovação de administrador; se o Windows criou uma regra que bloqueia o Starlit, remove-a nas definições da Firewall do Windows Defender. As redes públicas ficam bloqueadas em qualquer caso.'],
      ['O Starlit é o mesmo que o Nuvio?', 'O Starlit baseia-se no Nuvio Desktop, da Tapframe e amigos, e partilha código com o Nuvio Mobile, mas é uma versão à parte mantida por Beelzebub2. Comunica-nos os problemas do Starlit a nós e não à equipa do Nuvio. As contas Nuvio não passam para o Starlit.'],
      ['Usava o Nuvio Native. Tenho de começar do zero?', 'Não. O Starlit chamava-se Nuvio Native até à versão 1.0.14, e atualizar mantém as definições, os perfis e a biblioteca.'],
    ] },
  },
};

export const meta = { en: copy.en.meta, pt: copy.pt.meta };
export const ids = { en: { news: 'whats-new' }, pt: { news: 'novidades' } };

export function render(lang) {
  const c = copy[lang];
  const platform = (p, ic, fileKey, file, cls, btnCls) => `
<article class="platform ${cls}">
  <div class="platform-top">${icon(ic, 44, 'i-thin')}${pill('ok', c.available)}</div>
  <h2 class="t-plat">${p.name}</h2>
  <p class="platform-req">${p.req}</p>
  ${checkList(p.points, 'mt-24')}
  <span class="m-spacer"></span>
  <a class="btn btn-lg btn-block ${btnCls}" href="${LATEST}">${icon('download', 20)}${p.cta}</a>
  <p class="platform-file">${rel(fileKey, file, 'span', 'mono')}<span class="vh"> · </span><span class="platform-opens">${c.opens}</span></p>
</article>`;

  const stepsList = (title, items) => `<div>
  <h3 class="eyebrow eyebrow-l">${title}</h3>
  <ol class="num-list mt-16" role="list">${items.map((s, i) => `<li><span class="num" aria-hidden="true">0${i + 1}</span><span>${s}</span></li>`).join('')}</ol>
</div>`;

  // Each [data-rel-item] is also the template site.js fills when a newer
  // release is published between deployments, so keep the markup here only.
  const n = c.news, en = inEnglish(lang);
  const [latest, ...older] = RELEASE_DATA.releases;
  const notesLink = r => `<a class="release-link" data-rel-field="url" href="${esc(r.url)}">${n.notes}${icon('arrowRight', 14)}</a>`;
  const news = `
    <article class="release release-latest mt-44" aria-labelledby="rel-latest">
      <div class="release-side">
        <p id="rel-latest" class="release-v">${rel('version', latest.version)}</p>
        <p class="release-tag">${n.latest} · ${releaseDate(latest.date, lang, 'data-rel')}</p>
        <a class="release-link" data-rel="url" href="${esc(latest.url)}">${n.notes}${icon('arrowRight', 14)}</a>
      </div>
      <div class="notes notes-3"${en} data-rel-list="highlights">${latest.highlights.map(h => `
        <div data-rel-item><h3 data-rel-field="title">${esc(h.title)}</h3><p data-rel-field="text">${esc(h.text)}</p></div>`).join('')}
      </div>
    </article>
    <div class="grid cols-2 gap-20 mt-20" data-rel-list="releases" data-rel-start="1">${older.map(r => `
      <article class="release" data-rel-item><p class="release-v release-v-s" data-rel-field="version">${esc(r.version)}</p><div>
        <h3${en} data-rel-field="headline">${esc(r.headline)}</h3><p${en} data-rel-field="brief">${esc(r.brief)}</p>
        <p class="release-meta">${releaseDate(r.date, lang)}${notesLink(r)}</p>
      </div></article>`).join('')}
    </div>`;

  return `
<section class="sec pt-80 pb-96" aria-labelledby="hero-title">
  <div class="wrap">
    <div class="grid cols-12-1 gap-48 items-end">
      <div>${eyebrow(c.kicker)}<h1 id="hero-title" class="t-dl mt-20">${c.title}</h1></div>
      <p class="lede">${c.lede}</p>
    </div>
    <div class="grid cols-2 gap-20 mt-56">
      ${platform(c.win, 'monitor', 'windows-file', WINDOWS_FILE, 'platform-win', 'btn-accent')}
      ${platform(c.android, 'phone', 'android-file', ANDROID_FILE, 'platform-android', 'btn-ghost')}
    </div>
    <div class="cells cells-3 others mt-20">${c.others.map(([t, b]) => `
      <div class="cell other"><span class="other-text"><b>${t}</b><span>${b}</span></span>${pill('no', c.notYet, 'pill-plain')}</div>`).join('')}
    </div>
  </div>
</section>

<section class="sec pt-40 pb-96" aria-labelledby="install-title">
  <div class="wrap">
    <h2 id="install-title" class="t-l">${c.install.title}</h2>
    <div class="grid cols-2 gap-48 mt-40">
      ${stepsList(c.install.win, c.install.winSteps)}
      ${stepsList(c.install.android, c.install.androidSteps)}
    </div>
  </div>
</section>

<section class="sec band-top pt-104 pb-104" id="${ids[lang].news}" aria-labelledby="new-title">
  <div class="wrap">
    <div class="news-head">
      <h2 id="new-title" class="t-xl">${n.title}</h2>
      <a class="arrow-link" href="${RELEASES}">${n.all}${icon('arrowRight', 16)}</a>
    </div>${n.note ? `
    <p class="news-note mt-16">${n.note}</p>` : ''}${news}
  </div>
</section>

<section class="sec pt-104 pb-72" aria-labelledby="verify-title">
  <div class="wrap grid cols-1-12 gap-48 items-center">
    <div>
      <h2 id="verify-title" class="t-m">${c.verify.title}</h2>
      <p class="body-m mt-16">${c.verify.body}</p>
    </div>
    <div class="code-card">
      <p class="code-card-head"><span>${c.verify.label}</span><span class="mono">Windows</span></p>
      <pre><code>Get-FileHash .\\${rel('windows-file', WINDOWS_FILE)} -Algorithm SHA256</code></pre>
      <p class="code-card-foot">${c.verify.other} <code class="code-hl">sha256sum ${rel('android-file', ANDROID_FILE)}</code></p>
    </div>
  </div>
</section>

<section class="sec pt-72 pb-128" aria-labelledby="faq-title">
  <div class="wrap grid cols-1-18 gap-48 items-start">
    <div>
      <h2 id="faq-title" class="t-l">${c.faq.title}</h2>
      <p class="body mt-16">${c.faq.more}</p>
    </div>
    <div class="faq">${c.faq.items.map(([q, a], i) => `
      <details${i === 0 ? ' open' : ''}><summary>${q}${icon('plus', 20)}</summary><div class="faq-answer"><p>${a}</p></div></details>`).join('')}
    </div>
  </div>
</section>`;
}
