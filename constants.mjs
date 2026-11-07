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
// Keep these links until the repository is renamed (the app already follows
// GitHub's redirect to Beelzebub2/starlit).
export const REPO = 'https://github.com/Beelzebub2/nuvio-native';
export const RELEASES = REPO + '/releases';
export const LATEST = RELEASES + '/latest';
export const ISSUES = REPO + '/issues';
export const LICENSE_URL = REPO + '/blob/Dev/LICENSE';
export const NUVIO = 'https://github.com/NuvioMedia/NuvioDesktop';

// The release the pages describe. Bump it, the file names below and the
// "What's new" entries in pages/download.mjs together after each release.
export const VERSION = '1.12.2';
export const WINDOWS_FILE = `Starlit-Windows-x64-${VERSION}.exe`;
export const ANDROID_FILE = `Starlit-Android-arm64-v8a-${VERSION}.apk`;

// Product pages first, then the policy pages (whose wording is a legal draft).
export const PRODUCT = ['home', 'remote', 'anime', 'watch', 'sync', 'download'];
export const DOCS = ['privacy', 'terms', 'cookies', 'delete', 'contact', 'legal'];
export const KEYS = [...PRODUCT, ...DOCS];

export const routes = {
  en: { home:'/', remote:'/remote/', anime:'/anime/', watch:'/watch/', sync:'/sync/',
    download:'/download/', privacy:'/privacy/', terms:'/terms/', cookies:'/cookies/',
    delete:'/delete-account/', contact:'/contact/', legal:'/legal/' },
  pt: { home:'/pt/', remote:'/pt/comando/', anime:'/pt/anime/', watch:'/pt/ver/', sync:'/pt/conta/',
    download:'/pt/transferir/', privacy:'/pt/privacidade/', terms:'/pt/termos/',
    cookies:'/pt/cookies/', delete:'/pt/apagar-conta/',
    contact:'/pt/contacto/', legal:'/pt/informacoes-legais/' },
};

export const mailto = subject => 'mailto:' + CONTACT + '?subject=' + encodeURIComponent(subject);
