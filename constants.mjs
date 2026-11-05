// Shared facts used by every page. Keep them in step with the deployed
// Starlit releases and the account service before publishing.
export const ORIGIN = 'https://starlit.rrmtools.uk';
export const CONTACT = 'support.starlit@rrmtools.uk';
export const UPDATED = '5 November 2026';
export const UPDATED_PT = '5 de novembro de 2026';
export const CONTACT_LINK = '<a href="mailto:' + CONTACT + '">' + CONTACT + '</a>';
export const API = 'https://starlit-api.rrmtools.uk';

// Public app repository. Releases publish the Windows installer, signed
// Android APKs and SHA256SUMS.txt; link to "latest" so versions never go stale.
export const REPO = 'https://github.com/Beelzebub2/nuvio-native';
export const RELEASES = REPO + '/releases';
export const LATEST = RELEASES + '/latest';
export const ISSUES = REPO + '/issues';
export const LICENSE_URL = REPO + '/blob/Dev/LICENSE';
export const NUVIO = 'https://github.com/NuvioMedia/NuvioDesktop';

export const routes = {
  en: { home:'/', privacy:'/privacy/', terms:'/terms/', cookies:'/cookies/',
    delete:'/delete-account/', contact:'/contact/', legal:'/legal/' },
  pt: { home:'/pt/', privacy:'/pt/privacidade/', terms:'/pt/termos/',
    cookies:'/pt/cookies/', delete:'/pt/apagar-conta/',
    contact:'/pt/contacto/', legal:'/pt/informacoes-legais/' },
};

// Section anchors on each homepage, localised so Portuguese URLs read naturally.
export const anchors = {
  en: { features:'features', download:'download', accounts:'accounts',
    sources:'sources', faq:'faq', support:'support' },
  pt: { features:'funcionalidades', download:'transferir', accounts:'contas',
    sources:'fontes', faq:'perguntas', support:'suporte' },
};

export const mailto = subject => 'mailto:' + CONTACT + '?subject=' + encodeURIComponent(subject);
