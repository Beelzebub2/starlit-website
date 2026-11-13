// Turns the app's GitHub releases into the short release data the website
// shows: version, date, a headline and a few highlights per release.
//
// Used in three places:
//  - build.mjs reads the committed snapshot in data/releases.json;
//  - `npm run releases` refreshes that snapshot from GitHub;
//  - the VPS release-feed container refreshes /releases.json, which
//    assets/site.js reads so pages stay current between deployments.
//
// Everything produced here is plain text. Pages escape it and site.js only
// ever writes it with textContent, so release notes can never inject markup.
import { readFileSync } from 'node:fs';

export const APP_REPO = 'Beelzebub2/nuvio-native';
export const RENAMED_APP_REPO = 'Beelzebub2/starlit';
export const ALLOWED_APP_REPOS = Object.freeze([APP_REPO, RENAMED_APP_REPO]);
export const API_URL = `https://api.github.com/repos/${APP_REPO}/releases?per_page=15`;
export const TAG_URL = `https://github.com/${APP_REPO}/releases/tag/`;
const apiUrlFor = repo => `https://api.github.com/repos/${repo}/releases?per_page=15`;
const tagUrlFor = repo => `https://github.com/${repo}/releases/tag/`;
export const SHOWN = 5; // the latest release plus four older ones

const VERSION = /^v?(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const FILES = {
  windows: /^Starlit-Windows-x64-\d+\.\d+\.\d+\.exe$/,
  android: /^Starlit-Android-arm64-v8a-\d+\.\d+\.\d+\.apk$/,
};
// Sections of the release notes meant for testers, not for the website.
const SKIP_SECTION = /^(validation|known issues|limitations|release process)/i;

// Markdown to a single line of plain text. Underscores are kept on purpose:
// file names such as x86_64 must survive.
export function plain(markdown) {
  return String(markdown)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/(^|[\s(])\*(\S(?:.*?\S)?)\*(?=[\s).,;:!?]|$)/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
}

// The first sentence, cut at a word boundary if it is still too long.
export function firstSentence(text, max = 200) {
  const sentence = text.split(/(?<=[.!?])\s+(?=[A-Z0-9“"(])/)[0];
  if (sentence.length <= max) return sentence;
  return sentence.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

export const compareVersions = (a, b) => {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
};

// One GitHub release object to the website's summary, or null to skip it.
export function summarize(release, repository = APP_REPO) {
  if (!ALLOWED_APP_REPOS.includes(repository)) throw new Error('Untrusted app release repository');
  const match = VERSION.exec(release?.tag_name ?? '');
  if (!match || release.draft || release.prerelease) return null;
  const version = match.slice(1).join('.');
  // Everything after the generated "What's Changed" list is a PR log.
  const notes = String(release.body ?? '')
    .split(/<!--\s*Release notes generated|^##\s+What.s Changed/im)[0];

  const sections = [];
  let current = null;
  for (const raw of notes.split(/\r?\n/)) {
    const line = raw.trim();
    const heading = /^###\s+(.+)$/.exec(line);
    if (heading) {
      current = { title: plain(heading[1]), items: [] };
      sections.push(current);
      continue;
    }
    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (!bullet || !current) continue;
    const bold = /^\*\*(.+?)\*\*:?\s*(.*)$/.exec(bullet[1]);
    const title = bold ? plain(bold[1]).replace(/[:.]\s*$/, '') : '';
    const text = firstSentence(plain(bold ? bold[2] : bullet[1]));
    if (title || text) current.items.push({ title, text });
  }
  const shown = sections.filter(s => s.title && s.items.length && !SKIP_SECTION.test(s.title));

  // One highlight from each section first, then the rest in order.
  const highlights = [];
  for (let round = 0; highlights.length < 3 && shown.some(s => s.items[round]); round++) {
    for (const s of shown) if (s.items[round] && highlights.length < 3) highlights.push(s.items[round]);
  }
  const titled = highlights.filter(h => h.title);
  const assets = (release.assets ?? []).map(a => a?.name).filter(Boolean);
  const file = kind => assets.find(name => FILES[kind].test(name) && name.includes('-' + version + '.'))
    ?? (kind === 'windows' ? `Starlit-Windows-x64-${version}.exe` : `Starlit-Android-arm64-v8a-${version}.apk`);

  return {
    version,
    date: String(release.published_at ?? '').slice(0, 10),
    url: tagUrlFor(repository) + 'v' + version,
    headline: shown[0]?.title || `Starlit ${version}`,
    summary: shown.map(s => s.title).join(' · ') || `Starlit ${version}`,
    brief: titled.length ? titled.map(h => h.title).join('. ') + '.' : (highlights[0]?.text ?? ''),
    highlights: highlights.map(h => ({ title: h.title || h.text, text: h.title ? h.text : '' })),
    files: { windows: file('windows'), android: file('android') },
  };
}

// The GitHub API list to the feed: published releases, newest first.
export function toFeed(list, repository = APP_REPO) {
  if (!ALLOWED_APP_REPOS.includes(repository)) throw new Error('Untrusted app release repository');
  if (!Array.isArray(list)) throw new Error('GitHub did not return a list of releases');
  const releases = list.map(release => summarize(release, repository)).filter(Boolean)
    .sort((a, b) => compareVersions(b.version, a.version)).slice(0, SHOWN);
  return validateFeed({ source: `https://github.com/${repository}/releases`, releases });
}

// Throws unless the feed has exactly the shape the site expects. Run on
// every read and write, so a bad file can't reach a page.
export function validateFeed(feed) {
  const fail = why => { throw new Error('Invalid release data: ' + why); };
  const text = (value, max, name, optional = false) => {
    if (typeof value !== 'string' || (!optional && !value.trim()) || value.length > max) fail(name);
  };
  if (!feed || !Array.isArray(feed.releases) || !feed.releases.length || feed.releases.length > SHOWN) fail('releases');
  if (feed.source !== undefined &&
      !ALLOWED_APP_REPOS.some(repo => feed.source === `https://github.com/${repo}/releases`)) fail('source');
  let previous = null;
  for (const r of feed.releases) {
    if (!VERSION.test(r.version) || r.version.startsWith('v')) fail('version');
    if (previous && compareVersions(previous, r.version) <= 0) fail('order');
    previous = r.version;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) fail('date of ' + r.version);
    if (!ALLOWED_APP_REPOS.some(repo => r.url === tagUrlFor(repo) + 'v' + r.version)) fail('url of ' + r.version);
    text(r.headline, 160, 'headline');
    text(r.summary, 400, 'summary');
    text(r.brief, 600, 'brief', true);
    if (!Array.isArray(r.highlights) || r.highlights.length > 3) fail('highlights');
    for (const h of r.highlights) { text(h.title, 220, 'highlight title'); text(h.text, 220, 'highlight text', true); }
    for (const kind of Object.keys(FILES)) {
      if (!FILES[kind].test(r.files?.[kind] ?? '') || !r.files[kind].includes('-' + r.version + '.')) fail(kind + ' file');
    }
  }
  return feed;
}

export function readSnapshot(path = new URL('../data/releases.json', import.meta.url)) {
  return validateFeed(JSON.parse(readFileSync(path, 'utf8')));
}

// Fetch the releases. GitHub allows 60 unauthenticated requests an hour;
// a 304 for an unchanged ETag doesn't count against that.
export async function fetchFeed({
  etag, token = process.env.GITHUB_TOKEN, timeout = 15000, fetchImpl = globalThis.fetch
} = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'starlit-website-release-feed',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers.Authorization = 'Bearer ' + token;
  if (etag) headers['If-None-Match'] = etag;
  for (const [index, repository] of ALLOWED_APP_REPOS.entries()) {
    // Do not follow a redirect supplied by an arbitrary third party. Probe
    // only the fixed replacement repository after GitHub moves the old slug.
    // Do not reuse the old repository's ETag for a different release source.
    const requestHeaders = { ...headers };
    if (index > 0) delete requestHeaders['If-None-Match'];
    const res = await fetchImpl(apiUrlFor(repository), {
      headers: requestHeaders, signal: AbortSignal.timeout(timeout), redirect: 'manual'
    });
    if (index === 0 && (res.type === 'opaqueredirect' ||
        [301, 302, 307, 308, 404].includes(res.status))) continue;
    if (res.status === 304) return { notModified: true, etag };
    if (!res.ok) throw new Error('GitHub releases request failed with HTTP ' + res.status);
    return { etag: res.headers.get('etag'), feed: toFeed(await res.json(), repository) };
  }
  throw new Error('GitHub releases unavailable under both approved repository names');
}
