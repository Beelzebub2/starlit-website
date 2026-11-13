// Shared facts used by every page. Keep them in step with the deployed
// Starlit releases and the account service before publishing.
import { readSnapshot, ALLOWED_APP_REPOS, APP_REPO } from './tools/releases.mjs';

export const ORIGIN = 'https://starlit.rrmtools.uk';
export const CONTACT = 'support.starlit@rrmtools.uk';
export const UPDATED = '10 November 2026';
export const UPDATED_PT = '10 de novembro de 2026';
export const CONTACT_LINK = '<a href="mailto:' + CONTACT + '">' + CONTACT + '</a>';
export const API = 'https://starlit-api.rrmtools.uk';

// Public app repository. Releases publish the Windows installer, signed
// Android APKs and SHA256SUMS.txt; link to "latest" so versions never go stale.
// Default to the canonical repository. Allow the legacy public repo only for
// an intentional rollback, never an arbitrary owner/name.
const publicRepository = process.env.STARLIT_PUBLIC_REPO || APP_REPO;
if (!ALLOWED_APP_REPOS.includes(publicRepository)) {
  throw new Error('STARLIT_PUBLIC_REPO must be an approved Starlit repository');
}
export const REPO = `https://github.com/${publicRepository}`;
export const RELEASES = REPO + '/releases';
export const LATEST = RELEASES + '/latest';
export const ISSUES = REPO + '/issues';
export const LICENSE_URL = REPO + '/blob/Dev/LICENSE';
export const NUVIO = 'https://github.com/NuvioMedia/NuvioDesktop';

// The releases the pages describe come from the app's GitHub releases:
// `npm run releases` refreshes data/releases.json, and on the VPS the
// release-feed container keeps /releases.json current between deployments.
export const RELEASE_DATA = readSnapshot();
export const LATEST_RELEASE = RELEASE_DATA.releases[0];
export const VERSION = LATEST_RELEASE.version;
export const WINDOWS_FILE = LATEST_RELEASE.files.windows;
export const ANDROID_FILE = LATEST_RELEASE.files.android;

// Content-Security-Policy of the public pages. They may run only the site's
// own script (assets/site.js) and fetch only from this origin: no inline
// code, eval or third-party requests. build.mjs writes it to _headers and
// deploy/vps/Caddyfile sends the same value; tests keep the two identical.
export const PUBLIC_CSP = "default-src 'none'; style-src 'self'; img-src 'self'; font-src 'self'; " +
  "connect-src 'self'; script-src 'self'; object-src 'none'; form-action 'none'; " +
  "frame-ancestors 'none'; base-uri 'none'; upgrade-insecure-requests";

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
