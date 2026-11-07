// Public-facing content must match deployed Starlit behavior. Review after
// backend / addon / account lifecycle changes and before public launch.
// Legal page text below is a drafted transparency notice: change wording only
// with the operator's authorization, never as part of a visual redesign.
import { CONTACT, CONTACT_LINK, mailto } from './constants.mjs';

export { CONTACT, CONTACT_LINK, UPDATED, UPDATED_PT, API, routes } from './constants.mjs';

export const en = {
  privacy: {
    title:'Privacy policy', description:'What Starlit collects, why, with whom it is shared, and your GDPR rights.',
    html:`
      <h2>1. Who operates Starlit?</h2>
      <p>Starlit is a project operated under the <strong>RRMTools</strong> name. For personal-data
      questions, contact ${CONTACT_LINK}. RRMTools is used here as a project/brand name,
      not a claim of registered company status. The operator's formal legal identity and
      postal address still require confirmation for full public-service disclosures;
      see our <a href="/legal/">legal information</a>.</p>
      <h2>2. Information we process</h2>
      <ul><li><strong>Google sign-in:</strong> Google verifies your identity and may supply a
      unique Google account identifier, verified email address, name, and profile image.
      We do not receive your Google password or request access to Gmail, Drive, or contacts.</li>
      <li><strong>Account registration:</strong> email address, protected password hash
      when used, verified Google identity when selected, linked sign-in methods,
      account ID, sessions and security records. Email/password accounts must
      verify their email address before signing in.</li>
      <li><strong>Operational account statistics:</strong> the server counts current
      accounts, verified accounts and new registrations within the past 24 hours.
      Only these aggregate counts and a snapshot timestamp go to our private
      analytics service. No email address, account ID or other individual
      information is included.</li>
      <li><strong>Optional synchronization:</strong> profiles, library, saved collections,
      watch history, playback position, settings, addon/plugin configuration, and where a
      sync feature explicitly supports them, connected-provider credentials or tokens.
      Device metadata can include a client identifier, platform, app version or device name.</li>
      <li><strong>Optional app usage analytics:</strong> only after you opt in, Starlit
      sends fixed app-open, screen-visit, playback-status and download-status events,
      the app version, platform and a random installation identifier to our gateway.
      The identifier is pseudonymized with a keyed hash before storage. Analytics
      records do not include media titles, watched items, searches, streaming URLs,
      account identifiers or email addresses.</li>
      <li><strong>Optional crash reports:</strong> a separate opt-in allows sanitized
      error reports and technical stack traces to be sent to Sentry. This choice is
      independent of usage analytics and neither category is required to use Starlit.</li>
      <li><strong>Technical/security records:</strong> connection and request metadata, such
      as IP addresses, can be processed by infrastructure and security providers. The
      signup requests remain subject to per-IP rate limits.</li>
      <li><strong>Local-only items:</strong> downloaded media, caches and certain settings are
      stored on your device. Removing the cloud account does not automatically remove
      files from other devices.</li></ul>
      <h2>3. Purposes and legal grounds</h2>
      <ul><li><strong>GDPR Article 6(1)(b):</strong> processing necessary to create
      and verify accounts, authenticate users and provide requested synchronization.</li>
      <li><strong>GDPR Article 6(1)(f):</strong> proportionate anti-abuse measures,
      account protection, security investigations and aggregate operational
      account statistics, balanced against your rights.</li>
      <li><strong>GDPR Article 6(1)(c):</strong> any processing needed to meet an applicable
      legal obligation.</li>
      <li><strong>GDPR Article 6(1)(a):</strong> your voluntary consent to optional
      usage analytics and, separately, crash reporting. You can withdraw either
      choice at any time without losing access to Starlit.</li></ul>
      <p>Google sign-in is optional if an alternative is offered. Account
      verification and session data are necessary for cloud accounts.
      Aggregate operational counts are separate from optional app usage analytics.</p>
      <h2>4. Who receives data and international transfers?</h2>
      <p>Google handles Google authentication; Cloudflare and hosting providers
      help secure the service; email infrastructure delivers verification, recovery
      and security messages; and our private analytics host processes anonymous
      aggregate account totals. We do not sell personal data or use Google
      identity information for advertising.</p>
      <p>External addons, metadata services, media sources and linked providers
      are independent. They may receive media queries, service identifiers and
      connection information under their own policies. If you use peer-to-peer
      transfers (including BitTorrent), other peers may see your IP address.
      Some providers may process information outside the EEA; specific safeguards
      depend on provider contracts and destinations. Request details through
      our contact email.</p>
      <h2>5. How long do we retain information?</h2>
      <p>Email confirmation and recovery links expire after their configured
      security period. New email/password accounts remain unverified until
      the owner follows the confirmation link. Rate-limit records are
      periodically cleared.</p>
      <p>Active account and sync data remain as long as required to provide
      the account service or until a valid deletion request is implemented,
      subject to mandatory legal/security retention. Backup and operational-log
      retention schedules must be verified against deployed infrastructure
      before being described as fixed periods; these may temporarily retain
      copies after an account deletion.</p>
      <p>Optional usage analytics are retained as pseudonymous, daily records for
      approximately <strong>30 days</strong>, using the analytics service's
      configured retention period.
      Turning usage analytics off deletes the local installation identifier and stops
      further reporting; previously received records are not immediately erased.
      Crash reports are processed separately by Sentry when enabled.
      Anonymous aggregate account snapshots are also retained for around
      30 days in the restricted analytics stream.</p>
      <h2>6. Your rights</h2>
      <p>You may decline both optional diagnostics categories in the app, or enable
      or disable them independently under <strong>Settings → Advanced</strong> at any
      time. Neither account creation nor cloud synchronization is required to make
      that choice. Our gateway necessarily receives a connection address to service
      a request, but does not save it as part of usage analytics records.</p>
      <p>Subject to applicable law, you may request access, rectification,
      erasure, restriction, data portability or object to processing based on
      legitimate interests. Contact ${CONTACT_LINK} and include the email
      associated with your Starlit account, but not a password or token.
      We may require proportionate identity verification. We aim to respond
      within one month, subject to legally permitted extensions.</p>
      <p>You may complain to the Portuguese data protection authority
      <a href="https://www.cnpd.pt/" rel="noopener noreferrer">CNPD</a>
      or another competent supervisory authority. See
      <a href="/delete-account/">account deletion</a>.</p>
      <h2>7. Security, changes, and minors</h2>
      <p>Starlit uses transport encryption, administrative access controls,
      application-level authorization and anti-abuse measures. No system
      can guarantee absolute security. We may update this policy when
      practices change; the effective date is shown above. Starlit is
      not intentionally marketed to children; if you are a parent or guardian
      concerned about a child's data, please contact us.</p>
    `,
  },
  terms: {
    title:'Terms of use', description:'How Starlit accounts, third-party media sources, and acceptable use work.',
    html:`
      <h2>1. The service</h2>
      <p>Starlit is a media library and player from the RRMTools project. It helps
      users organize content and use media sources they select. Availability and
      features can change as the application evolves.</p>
      <h2>2. Accounts</h2>
      <p>Anyone may create an account with email and password or sign in with
      Google. Email/password registrations must verify their email address
      before signing in. Accounts may be restricted for security, abuse,
      legal compliance or other legitimate operational reasons.</p>
      <h2>3. Copyright, media, and independent sources</h2>
      <p>Starlit does not supply licences to stream or distribute copyrighted works.
      Addons, metadata sources, video services and peer-to-peer connections are
      independently provided and may have their own terms. You are responsible
      for obtaining any permissions and respecting intellectual-property laws
      that apply to your chosen sources. Starlit does not represent that all
      external content is authorized by the relevant rights holder.</p>
      <h2>4. Acceptable use and security</h2>
      <p>Do not access other people's data,
      upload malicious software, compromise the platform, misuse credentials
      or use the service unlawfully. You are responsible for keeping your
      Google account and devices secure.</p>
      <h2>5. Availability and statutory rights</h2>
      <p>The service is under active development and may have interruptions.
      These terms do not exclude or restrict consumer rights that cannot legally
      be waived. If paid services become available, applicable price, trader,
      withdrawal and refund information must be provided before purchase.</p>
      <h2>6. Contact and complaints</h2>
      <p>Use ${CONTACT_LINK} for account questions, IP complaints,
      security disclosures, legal concerns or abuse reports. Include the URL
      or details needed to locate the issue; do not include passwords or
      access tokens. See our <a href="/privacy/">privacy policy</a> and
      <a href="/legal/">legal notices</a>.</p>
    `,
  },
  cookies: {
    title:'Cookies and storage', description:'Cookies and browser storage used by Starlit services.',
    html:`
      <h2>Public website</h2>
      <p>This official website does not deliberately install advertising,
      behavioral-analytics or preference-tracking cookies. It uses no external
      font scripts, analytics tags or consent pop-ups. Cloudflare may process
      technical requests or use necessary security cookies to protect the site.</p>
      <h2>Google and third-party services</h2>
      <p>Google may use its own authentication cookies on Google's domains.
      Addons, media sources and linked services you choose are independent and
      may use their own cookies. Starlit's installed app also uses local
      storage for settings and media metadata.</p>
      <h2>Your controls</h2>
      <p>You can clear your browser's cookies and app storage, although
      essential authentication may stop working. If optional analytics or
      marketing cookies are introduced in the future, we will ask for prior
      consent when required by law.</p>
    `,
  },
  delete: {
    title:'Account deletion and data requests', description:'Request deletion, access or export of your Starlit data.',
    actions:{ note:'Send your request from the email address on your Starlit account.',
      links:[[mailto('Starlit account deletion'), 'Email a deletion request'],
        [mailto('Starlit data access/export'), 'Ask for a copy of your data']] },
    html:`
      <h2>Delete a Starlit account</h2>
      <p>Send an email to ${CONTACT_LINK} from your account's email address
      with the subject <strong>Starlit account deletion</strong>.
      Tell us whether you want the entire account deleted or only specific
      synchronized profiles or records. Do not send passwords, OAuth codes,
      session tokens or other secrets.</p>
      <h2>What happens next?</h2>
      <p>We may need to verify your identity by a proportionate method.
      We will assess legal obligations and implement eligible deletion
      requests without undue delay, normally responding within one month.
      We will explain if a request needs a lawful extension or an exemption.
      Stored backups and fraud/security records may have different legally
      justified lifetimes.</p>
      <h2>Local data and linked providers</h2>
      <p>Deleting server-side data does not automatically remove local
      downloaded media, app caches and backups from every device.
      Remove these separately using device controls. You can disconnect
      external providers and revoke access to Starlit from your Google
      account's connected-app settings.</p>
      <h2>Access, correction or export</h2>
      <p>For a copy of your data, use the subject <strong>Starlit data
      access/export</strong> at the same support email. You may also request
      correction or restriction of processing. See the
      <a href="/privacy/">privacy notice</a> for details.</p>
    `,
  },
  contact: {
    title:'Contact and support', description:'Get help with Starlit accounts, privacy, copyright and security.',
    actions:{ note:'Starlit support is handled by email at ' + CONTACT + '.',
      links:[[mailto('Starlit support'), 'Email support']] },
    html:`
      <h2>Official Starlit support</h2>
      <p>Contact <strong>${CONTACT_LINK}</strong> for account help,
      bugs, accessibility issues, data requests, or general support.
      We do not collect form submissions on this website.</p>
      <h2>Privacy and deletion</h2>
      <p>For GDPR requests, account correction, or deletion, use the
      same email address. Start with our <a href="/delete-account/">
      deletion guide</a> and do not attach passwords or secret tokens.</p>
      <h2>Copyright and security reports</h2>
      <p>For a suspected infringement or vulnerability, provide relevant
      URLs, steps to reproduce or a clear description. Please do not
      include another person's personal data or live credentials.</p>
    `,
  },
  legal: {
    title:'Legal information', description:'Operator identification, legal notices, intellectual property and contact details.',
    html:`
      <h2>Operator and service</h2>
      <p><strong>Starlit</strong> is an independent media-library and
      player application operated as a project under the name
      <strong>RRMTools</strong>. Official contact: ${CONTACT_LINK}.</p>
      <p class="notice"><strong>Operator disclosure requiring completion:</strong>
      RRMTools is a project/brand designation; the legal name and physical
      address of the individual or entity operating the service, and any
      applicable registration and tax numbers, have not yet been provided
      for publication. This page must be completed before broad public
      commercial operation. Contact us to request the legal operator details.</p>
      <h2>Media and intellectual property</h2>
      <p>The Starlit application name and logo identify this project.
      Film artwork, metadata, third-party addon icons and other media
      remain subject to their respective owners' rights. Providing a
      media-library interface does not grant rights in third-party content.</p>
      <h2>Notice and contact</h2>
      <p>If you are a rights holder or report abuse, send the details of
      the content, relevant URLs and contact information to ${CONTACT_LINK}.
      We will review notices relating to resources operated by Starlit.
      Independent third-party sources must also be contacted through their
      own channels.</p>
      <h2>Pricing and consumer rights</h2>
      <p>This site does not offer a paid contract or payment checkout.
      If that changes, required business identity, service, price,
      cancellation and withdrawal information will be disclosed before
      the user agrees to pay.</p>
    `,
  },
};

export const pt = {
  privacy: {
    title:'Política de privacidade', description:'Os dados tratados pelo Starlit, as finalidades, os destinatários e os teus direitos ao abrigo do RGPD.',
    html:`
      <h2>1. Quem é responsável pelo Starlit?</h2>
      <p>O Starlit é um projeto operado sob a designação <strong>RRMTools</strong>.
      Para assuntos relacionados com dados pessoais, escreve para ${CONTACT_LINK}.
      RRMTools é aqui apresentada como designação de projeto/marca, e não como
      alegação de registo de sociedade comercial. A identidade jurídica completa
      e a morada do responsável ainda precisam de confirmação para as divulgações
      públicas legalmente exigidas; consulta as
      <a href="/pt/informacoes-legais/">informações legais</a>.</p>
      <h2>2. Que dados tratamos?</h2><ul>
      <li><strong>Início de sessão Google:</strong> identificador único da conta Google,
      endereço de correio eletrónico verificado e, se fornecidos, nome e fotografia.
      Não recebemos a palavra-passe Google nem pedimos acesso ao Gmail, Drive ou contactos.</li>
      <li><strong>Registo de contas:</strong> endereço de e-mail, palavra-passe
      protegida por hash quando utilizada, identidade Google verificada
      quando escolhida, métodos de autenticação associados, identificador
      da conta, sessões e registos de segurança. O registo com e-mail exige
      confirmação do endereço antes de iniciar sessão.</li>
      <li><strong>Estatísticas operacionais agregadas:</strong> o servidor
      contabiliza o total de contas, contas verificadas e novos registos
      nas últimas 24 horas. Apenas estes totais e a hora do registo
      são enviados ao serviço privado de estatísticas, sem e-mails,
      identificadores de conta nem dados individuais.</li>
      <li><strong>Sincronização opcional:</strong> perfis, biblioteca, coleções,
      histórico de visualizações, posição de reprodução, definições, configuração
      de addons/plugins e, quando a funcionalidade o suportar, credenciais ou
      tokens de serviços associados. Podem ser incluídos nome e identificador
      do dispositivo, plataforma e versão da aplicação.</li>
      <li><strong>Estatísticas opcionais da aplicação:</strong> só após o teu
      consentimento, o Starlit envia eventos fixos de abertura da aplicação,
      visitas a ecrãs, estado de reprodução e transferências, versão,
      plataforma e um identificador de instalação aleatório para o nosso servidor.
      O identificador é pseudonimizado com uma função criptográfica com chave
      antes de ser guardado. Estes registos não incluem títulos, histórico de
      conteúdos vistos, pesquisas, endereços de transmissão, identificadores
      de conta ou emails.</li>
      <li><strong>Relatórios de erros opcionais:</strong> uma autorização
      separada permite enviar ao Sentry relatórios técnicos de erros e
      rastos de execução sujeitos a filtragem de dados. Estas opções são
      independentes e nenhuma é obrigatória para utilizar o Starlit.</li>
      <li><strong>Dados técnicos e de segurança:</strong> informações sobre
      ligações e pedidos, incluindo endereços IP, podem ser processadas
      por serviços de infraestrutura e segurança. O limitador de pedidos
      de registo aplica limites de pedidos por endereço IP.</li>
      <li><strong>Dados locais:</strong> ficheiros multimédia descarregados,
      caches e algumas definições permanecem no dispositivo. Apagar a conta
      na nuvem não elimina automaticamente ficheiros em todos os dispositivos.</li></ul>
      <h2>3. Finalidades e fundamentos jurídicos</h2><ul>
      <li><strong>Artigo 6.º, n.º 1, alínea b), do RGPD:</strong> criar e
      verificar contas, autenticar utilizadores e prestar serviços de
      sincronização solicitados.</li>
      <li><strong>Artigo 6.º, n.º 1, alínea f), do RGPD:</strong> prevenção
      proporcional de abuso, proteção das contas, investigação de incidentes
      e estatísticas operacionais agregadas, respeitando os direitos dos titulares.</li>
      <li><strong>Artigo 6.º, n.º 1, alínea c), do RGPD:</strong> cumprimento
      de obrigações legais aplicáveis.</li>
      <li><strong>Artigo 6.º, n.º 1, alínea a), do RGPD:</strong>
      consentimento livre para as estatísticas opcionais e, de forma
      independente, os relatórios de erros. Podes retirar cada autorização
      a qualquer momento sem perder o acesso ao Starlit.</li></ul>
      <p>O início de sessão Google é opcional quando existir outro método.
      A verificação de contas e os dados de sessão são necessários ao serviço.
      Os totais operacionais agregados são independentes das estatísticas
      opcionais da aplicação e não identificam utilizadores.</p>
      <h2>4. Destinatários e transferências internacionais</h2>
      <p>A Google trata a autenticação Google; a Cloudflare e os prestadores
      de alojamento apoiam a segurança do serviço; os serviços de e-mail
      enviam mensagens de confirmação, recuperação e segurança; o serviço
      privado de estatísticas recebe apenas totais anónimos de contas.
      Não vendemos dados pessoais nem utilizamos identidades Google
      para publicidade.</p>
      <p>Addons, serviços de metadados, fontes de vídeo e fornecedores
      associados são independentes e podem receber pesquisas, identificadores
      ou dados de ligação segundo as próprias políticas. Em transferências
      peer-to-peer, incluindo BitTorrent, outros participantes podem ver
      o teu endereço IP. Alguns prestadores podem tratar dados fora do
      Espaço Económico Europeu; as salvaguardas concretas dependem dos
      destinos e contratos. Pede informações através do contacto indicado.</p>
      <h2>5. Conservação</h2>
      <p>As ligações de confirmação do e-mail e de recuperação expiram
      após o prazo de segurança configurado. Contas novas criadas por
      e-mail só permitem iniciar sessão após confirmar o endereço.
      Os registos de limitação de pedidos são eliminados periodicamente.</p>
      <p>Dados de contas ativas e sincronização são conservados enquanto
      forem necessários ao serviço ou até à execução de um pedido válido
      de eliminação, sem prejuízo de obrigações legais ou de segurança.
      Os períodos reais de retenção de cópias de segurança e logs precisam
      de ser verificados na infraestrutura antes de serem anunciados
      como prazos fixos; as cópias podem persistir temporariamente após
      a eliminação da conta.</p>
      <p>As estatísticas opcionais são conservadas em registos diários
      pseudonimizados durante cerca de <strong>30 dias</strong>, de acordo com
      a política de retenção do serviço privado de estatísticas. Desativar
      as estatísticas apaga o identificador
      local e impede novos envios, mas não elimina imediatamente os registos
      já recebidos. Os relatórios de erros, quando autorizados, são tratados
      separadamente pelo Sentry. Os totais agregados de contas são
      guardados durante cerca de 30 dias no serviço privado,
      sem identificadores pessoais.</p>
      <h2>6. Os teus direitos</h2>
      <p>Podes recusar ambas as categorias opcionais ou ativá-las e desativá-las
      independentemente em <strong>Definições → Avançadas</strong>, a qualquer
      momento, sem criar conta. O servidor recebe necessariamente o endereço
      de ligação para responder aos pedidos, mas não o guarda nos registos
      de estatísticas da aplicação.</p>
      <p>Nos termos aplicáveis, podes pedir acesso, retificação, apagamento,
      limitação, portabilidade ou opor-te ao tratamento baseado em interesses
      legítimos. Contacta ${CONTACT_LINK} a partir do email da conta,
      sem enviares palavras-passe ou tokens. Podemos solicitar uma verificação
      proporcional de identidade. Procuramos responder no prazo de um mês,
      sem prejuízo das extensões previstas na lei.</p>
      <p>Podes apresentar reclamação à
      <a href="https://www.cnpd.pt/" rel="noopener noreferrer">CNPD</a>
      ou a outra autoridade de controlo competente. Consulta
      <a href="/pt/apagar-conta/">como apagar a conta</a>.</p>
      <h2>7. Segurança, alterações e menores</h2>
      <p>O Starlit usa comunicações cifradas, controlos de acesso administrativo,
      autorização ao nível da aplicação e medidas contra abuso, sem garantia
      de segurança absoluta. Esta política pode ser atualizada quando
      mudarem as práticas, com indicação da data em cima. O Starlit
      não é dirigido intencionalmente a crianças; os encarregados de educação
      podem contactar-nos sobre dados de menores.</p>`,
  },
  terms: {
    title:'Termos de utilização', description:'Condições de acesso, utilização da aplicação e respeito pelos direitos de terceiros.',
    html:`
      <h2>1. O serviço</h2><p>O Starlit é uma biblioteca e reprodutor
      multimédia do projeto RRMTools. Permite organizar conteúdos e usar
      fontes escolhidas pelo utilizador. As funcionalidades e a
      disponibilidade podem mudar durante o desenvolvimento.</p>
      <h2>2. Contas</h2><p>Qualquer pessoa pode criar uma conta com
      e-mail e palavra-passe ou iniciar sessão com Google. Registos
      com e-mail exigem a confirmação do endereço antes do primeiro
      início de sessão. Podemos limitar contas por motivos de segurança,
      abuso, obrigações legais ou necessidades operacionais legítimas.</p>
      <h2>3. Direitos de autor e fontes independentes</h2>
      <p>O Starlit não concede licenças para reproduzir ou distribuir obras
      protegidas por direitos de autor. Addons, metadados, vídeos e ligações
      peer-to-peer são fornecidos por terceiros e podem ter termos próprios.
      Cada utilizador é responsável por obter as autorizações necessárias
      e respeitar a legislação aplicável. Não afirmamos que todos os
      conteúdos externos estão autorizados pelos respetivos titulares.</p>
      <h2>4. Utilização aceitável</h2><p>É proibido aceder a dados alheios,
      distribuir software malicioso, comprometer
      a plataforma, utilizar indevidamente credenciais ou agir ilegalmente.
      Deves proteger a conta Google e os teus dispositivos.</p>
      <h2>5. Disponibilidade e direitos legais</h2>
      <p>O serviço encontra-se em desenvolvimento e pode sofrer interrupções.
      Estes termos não afastam direitos dos consumidores que sejam
      imperativos. A eventual oferta de serviços pagos terá de apresentar
      previamente informações sobre comerciante, preço, desistência
      e reembolso aplicáveis.</p>
      <h2>6. Contactos e reclamações</h2><p>Envia questões sobre contas,
      direitos de autor, incidentes de segurança ou questões legais
      para ${CONTACT_LINK}. Inclui URLs e detalhes relevantes sem
      divulgares palavras-passe ou tokens. Consulta a
      <a href="/pt/privacidade/">política de privacidade</a>
      e as <a href="/pt/informacoes-legais/">informações legais</a>.</p>`,
  },
  cookies: {
    title:'Cookies e armazenamento', description:'Os cookies e tecnologias de armazenamento usados pelos serviços Starlit.',
    html:`
      <h2>Site oficial</h2><p>Este site não instala intencionalmente
      cookies publicitários, de análise comportamental ou de seguimento
      de preferências. Não inclui scripts de análise, fontes externas
      ou pop-ups de consentimento. A Cloudflare pode processar pedidos
      técnicos ou utilizar cookies necessários à segurança do site.</p>
      <h2>Google e serviços externos</h2><p>A Google pode usar
      cookies de autenticação nos seus domínios. Addons, fontes de
      vídeo e serviços associados podem usar cookies próprios.
      A aplicação instalada guarda localmente definições e metadados.</p>
      <h2>Controlo</h2><p>Podes apagar cookies e dados locais nas
      definições do navegador, o que poderá terminar sessões.
      Se forem introduzidos cookies facultativos de marketing ou análise,
      será pedido consentimento prévio quando exigido por lei.</p>`,
  },
  delete: {
    title:'Apagar conta e pedir dados', description:'Como pedir a eliminação, acesso, retificação ou exportação dos teus dados Starlit.',
    actions:{ note:'Envia o pedido a partir do endereço de email associado à tua conta Starlit.',
      links:[[mailto('Eliminação de conta Starlit'), 'Pedir a eliminação por email'],
        [mailto('Acesso/exportação de dados Starlit'), 'Pedir uma cópia dos dados']] },
    html:`
      <h2>Apagar a conta Starlit</h2><p>Envia um email para
      ${CONTACT_LINK} a partir do endereço associado à conta,
      com o assunto <strong>Eliminação de conta Starlit</strong>.
      Esclarece se pretendes apagar toda a conta ou perfis/registos
      específicos. Não envies palavras-passe, códigos OAuth ou tokens.</p>
      <h2>O que acontece depois?</h2><p>Podemos precisar de confirmar
      a tua identidade de forma proporcional. Avaliaremos obrigações legais
      e executaremos pedidos elegíveis sem demora injustificada, respondendo
      normalmente no prazo de um mês. Comunicaremos eventuais extensões
      ou exceções legais. Cópias de segurança e registos justificados
      de segurança podem ter períodos diferentes.</p>
      <h2>Dados locais e serviços associados</h2><p>Apagar dados
      no servidor não remove automaticamente ficheiros descarregados,
      caches e cópias em todos os dispositivos. Apaga-os separadamente.
      Podes desligar fornecedores externos e revogar o acesso do Starlit
      nas definições da tua Conta Google.</p>
      <h2>Acesso, retificação ou exportação</h2><p>Para obteres
      uma cópia dos dados, envia o assunto <strong>Acesso/exportação
      de dados Starlit</strong> para o mesmo endereço. Também podes
      pedir retificação ou limitação do tratamento. Consulta a
      <a href="/pt/privacidade/">política de privacidade</a>.</p>`,
  },
  contact: {
    title:'Contacto e suporte', description:'Apoio a contas, privacidade, acessibilidade, direitos de autor e segurança.',
    actions:{ note:'O suporte do Starlit é feito por email, através de ' + CONTACT + '.',
      links:[[mailto('Suporte Starlit'), 'Enviar email ao suporte']] },
    html:`
      <h2>Suporte oficial Starlit</h2><p>Contacta
      <strong>${CONTACT_LINK}</strong> para ajuda com contas,
      erros, acessibilidade, pedidos de dados e apoio geral.
      Este site não recolhe dados através de formulários.</p>
      <h2>Privacidade e eliminação</h2><p>Usa o mesmo email
      para exercícios de direitos RGPD, correções ou eliminação.
      Consulta as <a href="/pt/apagar-conta/">instruções</a> e
      não anexes palavras-passe nem tokens.</p>
      <h2>Direitos de autor e segurança</h2><p>Para comunicar
      infrações ou vulnerabilidades, descreve o problema
      e inclui ligações relevantes, sem divulgar dados pessoais
      de terceiros nem credenciais válidas.</p>`,
  },
  legal: {
    title:'Informações legais', description:'Identificação do operador, contactos, propriedade intelectual e avisos legais.',
    html:`
      <h2>Identificação do operador</h2><p><strong>Starlit</strong>
      é uma aplicação independente de biblioteca e reprodução
      multimédia operada sob a designação de projeto <strong>RRMTools</strong>.
      Contacto oficial: ${CONTACT_LINK}.</p>
      <p class="notice"><strong>Identificação legal por completar:</strong>
      RRMTools é uma designação de projeto/marca. Ainda não foi
      fornecida para publicação a identificação jurídica completa
      e morada física do responsável, nem eventuais números de
      registo ou identificação fiscal aplicáveis. Esta página
      precisa de ser completada antes de uma exploração comercial
      pública alargada. Os dados do operador podem ser solicitados
      pelo contacto acima.</p>
      <h2>Direitos de autor e conteúdos externos</h2><p>O nome
      e logótipo Starlit identificam este projeto. Ilustrações,
      metadados, ícones de addons e obras multimédia de terceiros
      estão sujeitos aos direitos dos respetivos titulares.
      O uso de uma biblioteca multimédia não concede direitos
      sobre conteúdos externos.</p>
      <h2>Comunicações legais</h2><p>Os titulares de direitos
      podem comunicar eventuais infrações para ${CONTACT_LINK},
      identificando conteúdos, URLs e detalhes relevantes.
      Analisaremos comunicações relativas a recursos sob
      controlo do Starlit; fontes externas independentes
      devem também ser contactadas diretamente.</p>
      <h2>Preços e direitos do consumidor</h2><p>Este site
      não disponibiliza checkout nem celebra contratos pagos.
      Caso isso mude, serão prestadas previamente as informações
      obrigatórias sobre prestador, preço, desistência
      e cancelamento.</p>`,
  },
};
