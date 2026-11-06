// Homepage copy. Every claim here must match the current public Starlit
// releases: nuvio-native README, docs/ANDROID.md and docs/RELEASE-NOTES.md.
// Review after releases that add, remove or limit a feature.
import { routes, anchors, REPO, LATEST, RELEASES, ISSUES, CONTACT } from './constants.mjs';
import { mark, heroSparkles } from './art.mjs';

const copy = {
  en: {
    meta: {
      title: 'Starlit: anime and TV player for Windows and Android',
      description: 'Starlit is a free, open-source media library and player for Windows and Android, with Airing Now schedules, offline downloads and optional account sync.',
    },
    hero: {
      title: 'Anime and TV in one app: streams, schedules and offline downloads.',
      lede: 'Starlit is a free, open-source media library and player for Windows and Android. It plays from the add-ons and sources you choose, keeps up with today’s and upcoming anime episodes, and keeps your progress in step across devices when you sign in.',
      primary: 'Get Starlit', secondary: 'View source on GitHub',
      meta: 'For Windows 10 and 11 (64-bit) and Android 7.0 or later. Licensed under GPL-3.0.',
    },
    features: {
      title: 'What Starlit does',
      intro: 'Some features depend on add-ons, plugins or accounts that you set up yourself.',
      groups: [
        { id: 'watch', title: 'Watch', items: [
          ['Your add-ons and plugins', 'Stream from the add-ons and plugins you install, play from your own Premiumize or TorBox cloud, or use peer-to-peer playback through the bundled TorrServer engine.'],
          ['A player built on mpv', 'Subtitle tracks, style and timing sit in a side panel, and IntroDB’s community timestamps let you skip intros, recaps and credits.', 'Windows'],
          ['Continue Watching, Watch Later and collections', 'Pick up where you left off, save titles for later and keep a separate library for each profile.'],
        ] },
        { id: 'anime', title: 'Anime', items: [
          ['Airing Now', 'Today’s and upcoming episodes from AniList, with sub and dub schedules from Tsuzuki, shown in your own time zone.'],
          ['Tracking', 'Update MyAnimeList, Trakt, Simkl and MDBList from a title’s details page.'],
          ['Correct episode numbering', 'Fribb’s anime ID mappings keep seasons from different databases in the right order.'],
        ] },
        { id: 'offline', title: 'Offline', items: [
          ['Download whole seasons', 'Each episode finds its own source, at the highest quality available by default, and saves to a folder you choose.'],
          ['Downloads that recover', 'Unfinished downloads resume after a restart, and temporary failures are retried.'],
          ['Storage you control', 'See progress, speed and status in Library > Downloads, and remove watched episodes when you need space. Nothing is deleted until you confirm.'],
        ] },
        { id: 'devices', title: 'Across your devices', items: [
          ['Optional account sync', 'Sign in on Windows and Android to sync profiles, library, watch history and playback position.'],
          ['Your phone as a remote', 'Pair your Android phone with Starlit on your PC using a QR code, then browse, send titles to play on the PC and manage its downloads. Both need the same Starlit account and local network.', 'Android and Windows'],
          ['Account security', 'Passkeys, Google sign-in, password reset, and email alerts for sign-ins and account changes.'],
          ['Personal touches', 'Six app icon colourways, Discord Rich Presence and a searchable Settings sidebar.', 'Windows'],
        ] },
      ],
    },
    download: {
      title: 'Get Starlit',
      intro: 'Starlit is free to download from its public GitHub releases. Every release includes the Windows installer, signed Android APKs and a SHA256SUMS.txt file for checking your download.',
      opens: 'Opens the latest release on GitHub.',
      platforms: [
        { name: 'Windows', req: 'Windows 10 or 11, 64-bit', cta: 'Get it for Windows', points: [
          'Download <code>Starlit-Windows-x64-&lt;version&gt;.exe</code> from the latest release and run it.',
          'Setup installs for your user account without administrator rights. You choose the folder and shortcuts.',
          'Starlit checks for updates itself and verifies each installer against its SHA-256 checksum. Your settings, profiles and library are kept.',
        ] },
        { name: 'Android', req: 'Android 7.0 or later', cta: 'Get it for Android', points: [
          'Download the APK for your phone from the latest release. Most phones need <code>arm64-v8a</code>; older 32-bit phones use <code>armeabi-v7a</code>, and <code>x86</code> or <code>x86_64</code> suit emulators.',
          'Android may ask you to allow installs from your browser or file manager.',
          'The app checks GitHub for new releases and picks the right file for your phone.',
        ] },
      ],
      foot: 'There are no Starlit releases for macOS, Linux or iPhone. Release notes and earlier versions are on GitHub:',
      footLink: 'all releases',
    },
    accounts: {
      title: 'Accounts are optional',
      intro: 'Without an account, Starlit runs in guest mode and your library, profiles and progress stay on that device. An account lets you sync them between Windows and Android.',
      steps: [
        ['Create an account', 'From the sign-in screen, register with an email address and password or continue with Google.'],
        ['Verify your email', 'If you registered with email and password, open the confirmation link in your inbox. Google verifies your identity during sign-in.'],
        ['Sign in on each device', 'Use the same account and profile on Windows and Android to keep your library, watch history and progress in sync.'],
      ],
      aside: 'You can ask us to delete your account or send you a copy of your data at any time.',
      asideLink: 'Account deletion and data requests',
    },
    sources: {
      title: 'You choose what Starlit plays',
      body: [
        'Starlit is a client. It browses metadata and plays media from add-ons, plugins and sources that you install or provide. It doesn’t host, store or distribute media, and it isn’t affiliated with any add-on, catalogue or content provider.',
        'Use it for content you own or are otherwise allowed to access. Third-party sources have their own terms, and with peer-to-peer playback other peers can see your IP address.',
      ],
      links: [['terms', 'Terms of use'], ['privacy', 'Privacy policy']],
    },
    faq: {
      title: 'Frequently asked questions',
      items: [
        ['Is Starlit free?', `Yes. Starlit is free, open-source software licensed under GPL-3.0, and its <a href="${REPO}">source code is public on GitHub</a>. This website has no paid plans or checkout.`],
        ['Does Starlit come with films or series?', 'No. Starlit is a library and player. What you can watch depends on the add-ons, plugins and services you set up.'],
        ['Do I need an account?', 'No. Guest mode works without one. Create a free account to sync between devices.'],
        ['Which devices can I use?', 'Windows 10 and 11 (64-bit) and Android 7.0 or later. There are no releases for macOS, Linux or iPhone.'],
        ['Which Android file should I download?', 'Most phones need the <code>arm64-v8a</code> APK. Choose <code>armeabi-v7a</code> for older 32-bit phones, and <code>x86</code> or <code>x86_64</code> for emulators and Intel-based devices.'],
        ['How do updates work?', 'On Windows, Starlit checks for updates at startup, every six hours and from Settings > About, and verifies the installer’s SHA-256 checksum before installing it. On Android, the app checks GitHub releases and downloads the APK that matches your phone.'],
        ['How is Starlit related to Nuvio?', 'Starlit is based on Nuvio Desktop by Tapframe and friends, and keeps its GPL-3.0 licence. It’s maintained separately, so please report Starlit problems to us rather than to the Nuvio team.'],
        ['How do I delete my account or get a copy of my data?', `Email us from your account’s address. The <a href="${routes.en.delete}">account deletion page</a> explains what to include and what happens next.`],
      ],
    },
    support: {
      title: 'Need help?',
      body: 'Write to us about accounts, bugs, accessibility, data requests or anything else. Please don’t include passwords or access tokens.',
      links: [[ISSUES, 'Report a bug on GitHub'], [routes.en.contact, 'Contact and support'], [routes.en.delete, 'Delete your account']],
    },
  },

  pt: {
    meta: {
      title: 'Starlit: leitor de anime e séries para Windows e Android',
      description: 'O Starlit é uma biblioteca e um leitor multimédia gratuito e de código aberto para Windows e Android, com o calendário Airing Now, transferências offline e sincronização opcional da conta.',
    },
    hero: {
      title: 'Anime e séries numa só aplicação: streaming, calendários e transferências offline.',
      lede: 'O Starlit é uma biblioteca e um leitor multimédia gratuito e de código aberto para Windows e Android. Reproduz a partir dos addons e fontes que escolheres, acompanha os episódios de anime de hoje e dos próximos dias e, se iniciares sessão, mantém o teu progresso sincronizado entre dispositivos.',
      primary: 'Obter o Starlit', secondary: 'Ver o código no GitHub',
      meta: 'Para Windows 10 e 11 (64 bits) e Android 7.0 ou posterior. Licenciado sob a GPL-3.0.',
    },
    features: {
      title: 'O que o Starlit faz',
      intro: 'Algumas funcionalidades dependem de addons, plugins ou contas que configuras tu.',
      groups: [
        { id: 'ver', title: 'Ver', items: [
          ['Os teus addons e plugins', 'Faz streaming a partir dos addons e plugins que instalares, reproduz a partir da tua cloud Premiumize ou TorBox, ou usa a reprodução peer-to-peer através do motor TorrServer incluído.'],
          ['Um leitor baseado no mpv', 'As faixas, o estilo e a sincronização das legendas ficam num painel lateral, e as marcas temporais da comunidade IntroDB permitem saltar introduções, resumos e créditos.', 'Windows'],
          ['Continuar a ver, Ver mais tarde e coleções', 'Retoma onde ficaste, guarda títulos para mais tarde e mantém uma biblioteca separada para cada perfil.'],
        ] },
        { id: 'anime', title: 'Anime', items: [
          ['Airing Now', 'Os episódios de hoje e dos próximos dias a partir do AniList, com calendários de legendas e dobragens do Tsuzuki, apresentados no teu fuso horário.'],
          ['Acompanhamento', 'Atualiza o MyAnimeList, o Trakt, o Simkl e o MDBList a partir da página de detalhes de cada título.'],
          ['Numeração de episódios correta', 'Os mapeamentos de identificadores de anime do Fribb mantêm na ordem certa as temporadas vindas de bases de dados diferentes.'],
        ] },
        { id: 'offline', title: 'Offline', items: [
          ['Transfere temporadas inteiras', 'Cada episódio encontra a sua própria fonte, com a melhor qualidade disponível por predefinição, e é guardado na pasta que escolheres.'],
          ['Transferências que recuperam', 'As transferências por terminar são retomadas depois de reiniciares e as falhas temporárias são repetidas.'],
          ['Armazenamento sob controlo', 'Vê o progresso, a velocidade e o estado em Biblioteca > Transferências e remove episódios já vistos quando precisares de espaço. Nada é apagado sem a tua confirmação.'],
        ] },
        { id: 'dispositivos', title: 'Entre dispositivos', items: [
          ['Sincronização opcional', 'Inicia sessão no Windows e no Android para sincronizar perfis, biblioteca, histórico e posição de reprodução.'],
          ['O telemóvel como comando', 'Emparelha o telemóvel Android com o Starlit no PC através de um código QR para procurar, enviar títulos para o PC e gerir as transferências do PC. Os dois dispositivos precisam da mesma conta Starlit e da mesma rede local.', 'Android e Windows'],
          ['Segurança da conta', 'Chaves de acesso, início de sessão com Google, recuperação da palavra-passe e alertas por email de inícios de sessão e alterações à conta.'],
          ['Toques pessoais', 'Seis variantes de cor para o ícone da aplicação, Discord Rich Presence e uma barra lateral de definições com pesquisa.', 'Windows'],
        ] },
      ],
    },
    download: {
      title: 'Obter o Starlit',
      intro: 'O Starlit é gratuito e está disponível nas versões públicas do GitHub. Cada versão inclui o instalador para Windows, APK assinados para Android e um ficheiro SHA256SUMS.txt para verificares a transferência.',
      opens: 'Abre a versão mais recente no GitHub.',
      platforms: [
        { name: 'Windows', req: 'Windows 10 ou 11, 64 bits', cta: 'Obter para Windows', points: [
          'Transfere o ficheiro <code>Starlit-Windows-x64-&lt;versão&gt;.exe</code> da versão mais recente e executa-o.',
          'A instalação é feita para a tua conta de utilizador, sem direitos de administrador. Escolhes a pasta e os atalhos.',
          'O Starlit procura atualizações sozinho e verifica cada instalador com a respetiva soma SHA-256. As definições, os perfis e a biblioteca são mantidos.',
        ] },
        { name: 'Android', req: 'Android 7.0 ou posterior', cta: 'Obter para Android', points: [
          'Transfere o APK adequado ao teu telemóvel a partir da versão mais recente. A maioria dos telemóveis precisa do <code>arm64-v8a</code>; os telemóveis mais antigos de 32 bits usam <code>armeabi-v7a</code>, e as versões <code>x86</code> ou <code>x86_64</code> servem para emuladores.',
          'O Android pode pedir-te autorização para instalar a partir do navegador ou do gestor de ficheiros.',
          'A aplicação procura novas versões no GitHub e escolhe o ficheiro certo para o teu telemóvel.',
        ] },
      ],
      foot: 'Não existem versões do Starlit para macOS, Linux ou iPhone. As notas de versão e as versões anteriores estão no GitHub:',
      footLink: 'todas as versões',
    },
    accounts: {
      title: 'As contas são opcionais',
      intro: 'Sem conta, o Starlit funciona em modo convidado e a biblioteca, os perfis e o progresso ficam nesse dispositivo. Com uma conta, podes sincronizá-los entre o Windows e o Android.',
      steps: [
        ['Cria uma conta', 'No ecrã de início de sessão, regista-te com e-mail e palavra-passe ou continua com Google.'],
        ['Confirma o teu e-mail', 'Se te registaste com e-mail e palavra-passe, abre a ligação de confirmação na caixa de entrada. O Google verifica a identidade durante o início de sessão.'],
        ['Inicia sessão em cada dispositivo', 'Usa a mesma conta e o mesmo perfil no Windows e no Android para manteres a biblioteca, o histórico e o progresso sincronizados.'],
      ],
      aside: 'Podes pedir-nos a qualquer momento que apaguemos a tua conta ou te enviemos uma cópia dos teus dados.',
      asideLink: 'Apagar conta e pedir dados',
    },
    sources: {
      title: 'Tu escolhes o que o Starlit reproduz',
      body: [
        'O Starlit é um cliente. Consulta metadados e reproduz conteúdos a partir de addons, plugins e fontes que instalas ou forneces. Não aloja, guarda nem distribui conteúdos multimédia, e não tem ligação a qualquer addon, catálogo ou fornecedor de conteúdos.',
        'Usa-o para conteúdos que te pertencem ou a que tens autorização para aceder. As fontes de terceiros têm os seus próprios termos e, na reprodução peer-to-peer, outros participantes podem ver o teu endereço IP.',
      ],
      links: [['terms', 'Termos de utilização'], ['privacy', 'Política de privacidade']],
    },
    faq: {
      title: 'Perguntas frequentes',
      items: [
        ['O Starlit é gratuito?', `Sim. O Starlit é software gratuito e de código aberto, licenciado sob a GPL-3.0, e o <a href="${REPO}">código-fonte é público no GitHub</a>. Este site não tem planos pagos nem pagamentos.`],
        ['O Starlit inclui filmes ou séries?', 'Não. O Starlit é uma biblioteca e um leitor. O que podes ver depende dos addons, plugins e serviços que configurares.'],
        ['Preciso de uma conta?', 'Não. O modo convidado funciona sem conta. Cria uma conta gratuita para sincronizar entre dispositivos.'],
        ['Em que dispositivos posso usar o Starlit?', 'Windows 10 e 11 (64 bits) e Android 7.0 ou posterior. Não existem versões para macOS, Linux ou iPhone.'],
        ['Que ficheiro devo transferir para Android?', 'A maioria dos telemóveis precisa do APK <code>arm64-v8a</code>. Escolhe <code>armeabi-v7a</code> para telemóveis mais antigos de 32 bits, e <code>x86</code> ou <code>x86_64</code> para emuladores e dispositivos com processador Intel.'],
        ['Como funcionam as atualizações?', 'No Windows, o Starlit procura atualizações ao iniciar, a cada seis horas e em Definições > Acerca, e verifica a soma SHA-256 do instalador antes de o instalar. No Android, a aplicação consulta as versões do GitHub e transfere o APK adequado ao teu telemóvel.'],
        ['Qual é a relação entre o Starlit e o Nuvio?', 'O Starlit baseia-se no Nuvio Desktop, da Tapframe e amigos, e mantém a licença GPL-3.0. É mantido de forma independente, por isso comunica-nos os problemas do Starlit em vez de os enviares à equipa do Nuvio.'],
        ['Como apago a conta ou peço uma cópia dos meus dados?', `Envia-nos um email a partir do endereço da tua conta. A <a href="${routes.pt.delete}">página de eliminação de conta</a> explica o que incluir e o que acontece a seguir.`],
      ],
    },
    support: {
      title: 'Precisas de ajuda?',
      body: 'Escreve-nos sobre contas, erros, acessibilidade, pedidos de dados ou qualquer outro assunto. Não incluas palavras-passe nem tokens de acesso.',
      links: [[ISSUES, 'Comunicar um erro no GitHub'], [routes.pt.contact, 'Contacto e suporte'], [routes.pt.delete, 'Apagar a conta']],
    },
  },
};

export const homeMeta = { en: copy.en.meta, pt: copy.pt.meta };

export function renderHome(lang) {
  const c = copy[lang], a = anchors[lang], r = routes[lang];
  const tag = text => text ? ` <span class="tag">${text}</span>` : '';

  const groups = c.features.groups.map(g => `
    <section class="feature-group" aria-labelledby="fg-${g.id}">
      <h3 id="fg-${g.id}">${g.title}</h3>
      <ul class="feature-list" role="list">${g.items.map(([title, body, platform]) => `
        <li><h4>${title}${tag(platform)}</h4><p>${body}</p></li>`).join('')}
      </ul>
    </section>`).join('');

  const platforms = c.download.platforms.map(p => `
    <div class="platform platform-${p.name.toLowerCase()}">
      <h3>${p.name}</h3>
      <p class="platform-req">${p.req}</p>
      <ul class="sparkle-list" role="list">${p.points.map(point => `<li>${point}</li>`).join('')}</ul>
      <p class="platform-cta"><a class="btn btn-primary" href="${LATEST}">${p.cta}</a>
      <span class="platform-note">${c.download.opens}</span></p>
    </div>`).join('');

  const steps = c.accounts.steps.map(([title, body]) => `
      <li><h3>${title}</h3><p>${body}</p></li>`).join('');

  const faq = c.faq.items.map(([q, answer]) => `
      <details><summary>${q}</summary><div class="faq-answer"><p>${answer}</p></div></details>`).join('');

  return `
<section class="hero" aria-labelledby="hero-title">
  <div class="wrap hero-inner">
    <div class="hero-copy">
      <h1 id="hero-title">${c.hero.title}</h1>
      <p class="hero-lede">${c.hero.lede}</p>
      <p class="actions"><a class="btn btn-primary" href="#${a.download}">${c.hero.primary}</a>
      <a class="btn btn-quiet" href="${REPO}">${c.hero.secondary}</a></p>
      <p class="hero-meta">${c.hero.meta}</p>
    </div>
    <div class="hero-art">${mark('hero', 'mark hero-mark')}${heroSparkles()}</div>
  </div>
</section>

<section class="section features" id="${a.features}" aria-labelledby="features-title">
  <div class="wrap">
    <header class="section-head"><h2 id="features-title">${c.features.title}</h2><p>${c.features.intro}</p></header>
    <div class="feature-groups">${groups}
    </div>
  </div>
</section>

<section class="section download" id="${a.download}" aria-labelledby="download-title">
  <div class="wrap">
    <header class="section-head"><h2 id="download-title">${c.download.title}</h2><p>${c.download.intro}</p></header>
    <div class="platforms">${platforms}
    </div>
    <p class="fine">${c.download.foot} <a href="${RELEASES}">${c.download.footLink}</a>.</p>
  </div>
</section>

<section class="section accounts" id="${a.accounts}" aria-labelledby="accounts-title">
  <div class="wrap accounts-inner">
    <header class="section-head"><h2 id="accounts-title">${c.accounts.title}</h2><p>${c.accounts.intro}</p></header>
    <ol class="steps" role="list">${steps}
    </ol>
    <p class="accounts-aside">${c.accounts.aside} <a href="${r.delete}">${c.accounts.asideLink}</a></p>
  </div>
</section>

<section class="section sources" id="${a.sources}" aria-labelledby="sources-title">
  <div class="wrap sources-inner">
    <h2 id="sources-title">${c.sources.title}</h2>
    <div class="sources-body">${c.sources.body.map(p => `<p>${p}</p>`).join('')}
      <p class="link-row">${c.sources.links.map(([key, label]) => `<a href="${r[key]}">${label}</a>`).join('')}</p>
    </div>
  </div>
</section>

<section class="section faq" id="${a.faq}" aria-labelledby="faq-title">
  <div class="wrap faq-inner">
    <h2 id="faq-title">${c.faq.title}</h2>
    <div class="faq-list">${faq}
    </div>
  </div>
</section>

<section class="section support" id="${a.support}" aria-labelledby="support-title">
  <div class="wrap support-inner">
    <h2 id="support-title">${c.support.title}</h2>
    <p class="support-body">${c.support.body}</p>
    <p class="support-mail"><a href="mailto:${CONTACT}">${CONTACT.replace('@', '<wbr>@')}</a></p>
    <p class="link-row">${c.support.links.map(([href, label]) => `<a href="${href}">${label}</a>`).join('')}</p>
  </div>
</section>`;
}
