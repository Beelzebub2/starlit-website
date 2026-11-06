// Account and sync page. Facts follow docs/ANDROID.md, docs/DESKTOP-PASSKEYS.md
// and the release notes on the app's Dev branch.
import { icon, eyebrow, art, steps, appWindow, phone, appTabs, segments, markImg } from '../ui.mjs';

const copy = {
  en: {
    meta: {
      title: 'Starlit accounts and sync: one library on PC and phone',
      description: 'Sign in to the same Starlit account on Windows and Android to sync your library, history, resume points, profiles and add-ons. Accounts are optional and approved by hand; guest mode needs none.',
    },
    kicker: 'Account &amp; sync', title: 'One library, wherever you watch.',
    lede: 'Sign in to the same Starlit account and profile on Windows and Android. Pause an episode on the PC and the phone knows where you stopped. Add a show on the phone and it’s in the PC’s library next time it syncs.',
    lib: { label: 'Illustration of the Starlit desktop Library: Continue watching with resume progress and saved titles',
      tabs: ['Home', 'Discover', 'Library'], title: 'Library', synced: 'Synced just now', cont: 'Continue watching', saved: 'Saved', isNew: 'NEW',
      cards: [['a', 38, 'Hollow Orbit', 'S1 E7 · from your phone'], ['b', 64, 'Paper Lanterns', 'S2 E3 · 9 min left'], ['d', 81, 'Ironbloom', 'S1 E11 · 4 min left']] },
    phone: { label: 'Illustration of Starlit on Android: the Library tab with Watch Later, showing Kite Season just added',
      title: 'Library', tabs: ['Library', 'Watch Later'], added: 'Added just now' },
    caption: 'Illustrations. The shows are made up.',
    what: { title: 'What syncs, and what stays put.', rows: [
      ['shared', 'Shared everywhere', 'Same account, same profile', ['Library', 'Watched history', 'Resume points', 'Collections', 'Profiles', 'Add-ons', 'Plugins (full builds)', 'Home catalogue rows', 'Hidden Airing Now titles']],
      ['secret', 'Synced as secrets', 'Sent through a separate, dedicated channel', ['Debrid service keys', 'TMDB key', 'MDBList key', 'IntroDB key', 'AnimeSkip client ID']],
      ['split', 'Separate on PC and phone', 'So each can be set up its own way', ['Appearance and app settings']],
      ['local', 'Stays on the device', 'Never uploaded', ['Downloaded episodes', 'Folders and file paths', 'Desktop schedules', 'Download limits', 'Update status']],
    ], note: 'Changes made offline are kept and uploaded on a later sync. Your Starlit library keeps syncing even if you use an external tracking service as your main library.' },
    keeps: { title: 'A library that keeps up.', items: [
      ['playCircle', 'Continue watching', 'Everything you’ve started, with the next episode ready once you finish one.'],
      ['clock', 'Watch Later', 'On the PC, middle-click any title card to save it. Finished episodes clear themselves.'],
      ['grid', 'Collections', 'Group titles your way, for a marathon, a season or a friend’s recommendations.'],
      ['users', 'Profiles', 'Each profile has its own library and progress, so nobody’s episodes get skipped.'],
    ] },
    acct: { kicker: 'Accounts', title: 'Ask for an account. Or don’t need one.',
      body: 'Accounts on the official Starlit server are approved by hand. Request one from the app with your email and a password, or with Google, and you can sign in once an administrator approves it. Until then, or instead, guest mode works without any account.',
      steps: [['Request an account', 'In the app, choose Request account. It stays pending until it’s reviewed, and pending requests expire after seven days.'],
        ['Get approved', 'An administrator must approve each request; no one is approved automatically. You’ll get a welcome email when your account is ready.'],
        ['Bring your guest data with you', 'Import anonymous settings moves a guest profile’s library, history, resume points, collections, add-ons and downloads into the account. It merges, so nothing already there is replaced.']],
      signin: { label: 'Illustration of the Starlit sign-in screen with email, password, passkey, Google, Request account and Continue as guest',
        title: 'Sign in to Starlit', sub: 'Your library on every device', email: 'Email', emailPh: 'you@example.com', password: 'Password', passwordPh: 'Your password',
        forgot: 'Forgot password?', go: 'Sign in', passkey: 'Use a passkey', request: 'Request account', guest: 'Continue as guest' },
      table: { caption: 'Ways to sign in', head: ['Method', 'Windows', 'Android'], rows: [
        ['Email and password', 'Yes', 'Yes'],
        ['Passkey', 'Sign in with a passkey saved on your Android phone, through Windows Security', 'Create, use and remove passkeys'],
        ['Google', 'Sign in, or link Google to an approved account', 'Sign in, or link Google to an approved account']],
        forgot: ['Forgotten password', 'Reset from the sign-in screen. The link opens a secure page in your browser.'] },
      note: 'Passkeys and Google are available on the official Starlit server when it has them switched on. Full Android builds can also connect to a compatible server of your own.' },
    care: { title: 'Your account, looked after', items: [
      'Change your password or email in Account → Sign-in &amp; security. Both ask you to confirm it’s you.',
      'Emails let you know about new sign-ins and changes to your password, email, passkeys and linked sign-ins.',
      'Saved sign-ins and service keys are protected by Windows user encryption or the Android Keystore.'],
      leave: 'Want to leave? See <a class="inline-link" href="{delete}">how to delete your account</a>.' },
    diag: { title: 'Diagnostics stay off unless you switch them on',
      label: 'Illustration of Starlit’s first-run diagnostics prompt, with both switches off',
      analytics: ['Anonymous usage analytics', 'App version, platform and which screens are used'], crashes: ['Crash reports', 'Helps fix crashes faster'],
      body: 'Usage analytics never include titles, watch history, searches, account details or links. Change either choice any time in Settings → Advanced. More in the <a class="inline-link" href="{privacy}">privacy policy</a>.' },
  },

  pt: {
    meta: {
      title: 'Contas e sincronização Starlit: uma biblioteca no PC e no telemóvel',
      description: 'Inicia sessão na mesma conta Starlit no Windows e no Android para sincronizar a biblioteca, o histórico, os pontos de retoma, os perfis e os addons. As contas são opcionais e aprovadas manualmente; o modo convidado não precisa de nenhuma.',
    },
    kicker: 'Conta e sincronização', title: 'Uma biblioteca, onde quer que vejas.',
    lede: 'Inicia sessão na mesma conta e no mesmo perfil Starlit no Windows e no Android. Pausa um episódio no PC e o telemóvel sabe onde paraste. Adiciona uma série no telemóvel e ela aparece na biblioteca do PC na sincronização seguinte.',
    lib: { label: 'Ilustração da Biblioteca do Starlit para computador: Continuar a ver com o progresso e títulos guardados',
      tabs: ['Início', 'Explorar', 'Biblioteca'], title: 'Biblioteca', synced: 'Sincronizado agora mesmo', cont: 'Continuar a ver', saved: 'Guardados', isNew: 'NOVO',
      cards: [['a', 38, 'Hollow Orbit', 'T1 E7 · do teu telemóvel'], ['b', 64, 'Paper Lanterns', 'T2 E3 · faltam 9 min'], ['d', 81, 'Ironbloom', 'T1 E11 · faltam 4 min']] },
    phone: { label: 'Ilustração do Starlit no Android: o separador Biblioteca com Ver mais tarde, a mostrar Kite Season acabado de adicionar',
      title: 'Biblioteca', tabs: ['Biblioteca', 'Ver mais tarde'], added: 'Adicionado agora mesmo' },
    caption: 'Ilustrações. As séries são fictícias.',
    what: { title: 'O que sincroniza e o que fica.', rows: [
      ['shared', 'Partilhado em todo o lado', 'Mesma conta, mesmo perfil', ['Biblioteca', 'Histórico', 'Pontos de retoma', 'Coleções', 'Perfis', 'Addons', 'Plugins (versões completas)', 'Filas de catálogos do Início', 'Títulos ocultos no Airing Now']],
      ['secret', 'Sincronizado como segredo', 'Enviado por um canal à parte, dedicado', ['Chaves de serviços debrid', 'Chave do TMDB', 'Chave do MDBList', 'Chave do IntroDB', 'ID de cliente do AnimeSkip']],
      ['split', 'Separado no PC e no telemóvel', 'Para cada um ser configurado à sua maneira', ['Aspeto e definições da aplicação']],
      ['local', 'Fica no dispositivo', 'Nunca é enviado', ['Episódios transferidos', 'Pastas e caminhos de ficheiros', 'Agendamentos no computador', 'Limites de transferências', 'Estado das atualizações']],
    ], note: 'As alterações feitas offline ficam guardadas e são enviadas numa sincronização posterior. A tua biblioteca Starlit continua a sincronizar mesmo que uses um serviço de acompanhamento externo como biblioteca principal.' },
    keeps: { title: 'Uma biblioteca que acompanha o ritmo.', items: [
      ['playCircle', 'Continuar a ver', 'Tudo o que começaste, com o episódio seguinte pronto quando acabas um.'],
      ['clock', 'Ver mais tarde', 'No PC, clica com o botão do meio em qualquer título para o guardar. Os episódios terminados saem sozinhos.'],
      ['grid', 'Coleções', 'Agrupa títulos à tua maneira, para uma maratona, uma temporada ou as recomendações de um amigo.'],
      ['users', 'Perfis', 'Cada perfil tem a sua biblioteca e o seu progresso, para ninguém saltar episódios de ninguém.'],
    ] },
    acct: { kicker: 'Contas', title: 'Pede uma conta. Ou passa sem ela.',
      body: 'As contas no servidor oficial Starlit são aprovadas manualmente. Pede uma na aplicação com o teu email e uma palavra-passe, ou com o Google, e podes iniciar sessão quando um administrador a aprovar. Até lá, ou em vez disso, o modo convidado funciona sem conta.',
      steps: [['Pede uma conta', 'Na aplicação, escolhe Pedir conta. O pedido fica pendente até ser analisado, e os pedidos pendentes expiram ao fim de sete dias.'],
        ['Aguarda a aprovação', 'Um administrador tem de aprovar cada pedido; ninguém é aprovado automaticamente. Recebes um email de boas-vindas quando a conta estiver pronta.'],
        ['Traz os teus dados de convidado', 'Importar definições anónimas leva a biblioteca, o histórico, os pontos de retoma, as coleções, os addons e as transferências de um perfil de convidado para a conta. Junta os dados, por isso nada do que lá está é substituído.']],
      signin: { label: 'Ilustração do ecrã de início de sessão do Starlit com email, palavra-passe, chave de acesso, Google, Pedir conta e Continuar como convidado',
        title: 'Iniciar sessão no Starlit', sub: 'A tua biblioteca em todos os dispositivos', email: 'Email', emailPh: 'tu@exemplo.pt', password: 'Palavra-passe', passwordPh: 'A tua palavra-passe',
        forgot: 'Esqueceste-te da palavra-passe?', go: 'Iniciar sessão', passkey: 'Usar chave de acesso', request: 'Pedir conta', guest: 'Continuar como convidado' },
      table: { caption: 'Formas de iniciar sessão', head: ['Método', 'Windows', 'Android'], rows: [
        ['Email e palavra-passe', 'Sim', 'Sim'],
        ['Chave de acesso', 'Inicia sessão com uma chave de acesso guardada no telemóvel Android, através da Segurança do Windows', 'Cria, usa e remove chaves de acesso'],
        ['Google', 'Inicia sessão ou associa o Google a uma conta aprovada', 'Inicia sessão ou associa o Google a uma conta aprovada']],
        forgot: ['Palavra-passe esquecida', 'Repõe-na a partir do ecrã de início de sessão. A ligação abre uma página segura no teu navegador.'] },
      note: 'As chaves de acesso e o Google estão disponíveis no servidor oficial Starlit quando estão ativados. As versões completas para Android também podem ligar-se a um servidor compatível teu.' },
    care: { title: 'A tua conta, bem cuidada', items: [
      'Muda a palavra-passe ou o email em Conta → Início de sessão e segurança. Ambos te pedem para confirmares que és tu.',
      'Os emails avisam-te de novos inícios de sessão e de alterações à palavra-passe, ao email, às chaves de acesso e aos métodos de início de sessão associados.',
      'As sessões guardadas e as chaves de serviços são protegidas pela encriptação do utilizador do Windows ou pelo Android Keystore.'],
      leave: 'Queres sair? Vê <a class="inline-link" href="{delete}">como apagar a tua conta</a>.' },
    diag: { title: 'O diagnóstico fica desligado a não ser que o ligues',
      label: 'Ilustração do pedido de diagnóstico do Starlit na primeira utilização, com os dois interruptores desligados',
      analytics: ['Estatísticas de utilização anónimas', 'Versão da aplicação, plataforma e ecrãs usados'], crashes: ['Relatórios de falhas', 'Ajudam a corrigir falhas mais depressa'],
      body: 'As estatísticas de utilização nunca incluem títulos, histórico, pesquisas, dados da conta nem ligações. Muda qualquer uma das escolhas quando quiseres em Definições → Avançadas. Mais informação na <a class="inline-link" href="{privacy}">política de privacidade</a>.' },
  },
};

export const meta = { en: copy.en.meta, pt: copy.pt.meta };

export function render(lang, { r }) {
  const c = copy[lang], l = c.lib, p = c.phone, s = c.acct.signin, t = c.acct.table;

  const libWindow = appWindow({ label: l.label, cls: 'win-sync', body: `
<div class="win-tabs-row">${appTabs(l.tabs, 2, 'app-tabs-solid')}</div>
<div class="sync-lib">
  <p class="sync-lib-head"><span>${l.title}</span><span class="synced">${icon('check', 13)}${l.synced}</span></p>
  <p class="sync-row">${l.cont}</p>
  <div class="sync-cards">${l.cards.map(([a, pct, title, sub]) => `<div><span class="m-thumb art-${a}"><span class="m-thumb-bar"><span class="w-${pct}"></span></span></span><span class="m-name">${title}</span><span class="m-sub">${sub}</span></div>`).join('')}</div>
  <p class="sync-row">${l.saved}</p>
  <div class="sync-saved">${['c', 'h', 'g', 'j', 'k'].map(a => art(a, 'saved-cover')).join('')}<span class="saved-cover saved-new art-l"><span>${l.isNew}</span></span></div>
</div>` });

  const libPhone = phone({ label: p.label, cls: 'phone-lib', body: `
<p class="phone-lib-head"><span>${p.title}</span><span class="m-round m-avatar">M</span></p>
${segments(p.tabs, 0, 'p-seg')}
<div class="added">${art('l', 'added-art')}<span class="p-dl-text"><b>Kite Season</b><span class="hot">${p.added}</span></span></div>
<div class="phone-covers">${['a', 'c', 'h', 'g', 'j', 'k'].map(a => art(a, 'phone-cover')).join('')}</div>
<span class="m-spacer"></span>
<p class="phone-nav">${icon('home', 20, 'i-thin')}${icon('search', 20, 'i-thin')}${icon('library', 20, 'on')}${icon('user', 20, 'i-thin')}</p>` });

  const marker = { shared: '<span class="mk mk-shared"></span>', secret: icon('lock', 14, 'mk-secret'), split: '<span class="mk mk-split"></span>', local: '<span class="mk mk-local"></span>' };

  const signIn = `<div class="phone phone-signin" role="img" aria-label="${s.label}"><div class="phone-screen signin">
  ${markImg('signin-mark', 52)}
  <p class="signin-title">${s.title}</p>
  <p class="signin-sub">${s.sub}</p>
  <p class="field"><span>${s.email}</span><span class="field-box">${s.emailPh}</span></p>
  <p class="field"><span>${s.password}</span><span class="field-box">${s.passwordPh}</span></p>
  <p class="signin-forgot">${s.forgot}</p>
  <span class="signin-btn signin-primary">${s.go}</span>
  <p class="signin-alt"><span class="signin-btn signin-passkey">${icon('key', 16)}${s.passkey}</span><span class="signin-btn signin-google">G</span></p>
  <span class="signin-rule"></span>
  <span class="signin-btn signin-outline">${s.request}</span>
  <span class="signin-guest">${s.guest}</span>
</div></div>`;

  const toggle = ([title, sub], first) => `<div class="toggle-row${first ? '' : ' toggle-row-2'}"><span class="toggle-text"><b>${title}</b><span>${sub}</span></span><span class="toggle"><span></span></span></div>`;

  return `
<section class="sec pt-80 pb-112" aria-labelledby="hero-title">
  <div class="wrap">
    <div class="measure-980">
      ${eyebrow(c.kicker)}
      <h1 id="hero-title" class="t-hero mt-20">${c.title}</h1>
      <p class="lede mt-28 measure-680">${c.lede}</p>
    </div>
    <div class="grid cols-1-300 gap-40 items-center mt-64">
      ${libWindow}
      <div class="center-phone">${libPhone}</div>
    </div>
    <p class="caption">${c.caption}</p>
  </div>
</section>

<section class="sec band-top pt-104 pb-104" aria-labelledby="what-title">
  <div class="wrap">
    <h2 id="what-title" class="t-xl measure-820">${c.what.title}</h2>
    <div class="sync-table mt-44">${c.what.rows.map(([kind, title, sub, items]) => `
      <div class="sync-tr sync-${kind}">
        <div><p class="sync-th">${marker[kind]}${title}</p><p class="sync-sub">${sub}</p></div>
        <ul class="chips chips-${kind}" role="list">${items.map(i => `<li>${i}</li>`).join('')}</ul>
      </div>`).join('')}
    </div>
    <p class="small-note mt-18">${c.what.note}</p>
  </div>
</section>

<section class="sec pt-104 pb-56" aria-labelledby="lib-title">
  <div class="wrap">
    <h2 id="lib-title" class="t-l">${c.keeps.title}</h2>
    <div class="grid cols-4 gap-20 mt-40">${c.keeps.items.map(([ic, title, body]) => `
      <article class="mini-card">${icon(ic, 26, 'cell-icon')}<h3>${title}</h3><p>${body}</p></article>`).join('')}
    </div>
  </div>
</section>

<section class="sec pt-72 pb-72" aria-labelledby="acct-title">
  <div class="wrap">
    <div class="grid cols-1-340 gap-64 items-center">
      <div>
        ${eyebrow(c.acct.kicker)}
        <h2 id="acct-title" class="t-l mt-16">${c.acct.title}</h2>
        <p class="body-m mt-18">${c.acct.body}</p>
        <div class="mt-28">${steps(c.acct.steps, 'steps-s')}</div>
      </div>
      <div class="center-phone">${signIn}</div>
    </div>
    <div class="table-wrap mt-56">
      <table class="data-table data-table-caption">
        <caption>${t.caption}</caption>
        <thead><tr>${t.head.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead>
        <tbody>${t.rows.map(([m, w, a]) => `
          <tr><th scope="row">${m}</th><td>${w}</td><td>${a}</td></tr>`).join('')}
          <tr><th scope="row">${t.forgot[0]}</th><td colspan="2">${t.forgot[1]}</td></tr>
        </tbody>
      </table>
    </div>
    <p class="small-note mt-14">${c.acct.note}</p>
  </div>
</section>

<section class="sec pt-72 pb-128" aria-labelledby="priv-title">
  <div class="wrap grid cols-2 gap-20">
    <article class="feature-panel">
      <h2 class="t-card">${c.care.title}</h2>
      <ul class="check-list mt-22" role="list">${c.care.items.map(i => `<li>${icon('check', 18)}<span>${i}</span></li>`).join('')}
        <li>${icon('check', 18)}<span>${c.care.leave.replace('{delete}', r.delete)}</span></li>
      </ul>
    </article>
    <article class="feature-panel">
      <h2 id="priv-title" class="t-card">${c.diag.title}</h2>
      <div class="toggles mt-22" role="img" aria-label="${c.diag.label}">${toggle(c.diag.analytics, true)}${toggle(c.diag.crashes, false)}</div>
      <p class="body mt-18">${c.diag.body.replace('{privacy}', r.privacy)}</p>
    </article>
  </div>
</section>`;
}
