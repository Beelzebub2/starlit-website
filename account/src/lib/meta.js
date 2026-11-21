// Titles and artwork the app didn't sync, looked up the way the app finds them.
//
// The app syncs only ids for watch progress and history, and posters for few
// library titles, so the account pages would otherwise show raw ids and
// stand-ins. Lookups, in order:
//   1. IMDb ids (tt…) from Cinemeta, the public Stremio catalogue.
//   2. Anime ids that end in an AniList id (nativeairing:, airingnow:,
//      airingnowp:…:<id>, anilist:) from Starlit's own metadata gateway,
//      the same source the app's Airing Now uses.
//   3. Anything else from the profile's own addons that declare a meta
//      resource for that type and id prefix (Stremio addon protocol).
// Addon manifests also give addons their real names when the app synced none.
//
// Only https sources are contacted, at most a few at a time, each with a
// timeout. Results are kept in memory and, by content id only, in
// sessionStorage; addon addresses (which can hold personal settings) are never
// stored, logged or sent anywhere except to that addon itself.

const CINEMETA = 'https://v3-cinemeta.strem.io';
const TIMEOUT_MS = 8000;
const PARALLEL = 4;
const STORE_KEY = 'starlit.meta.v1';
const STORE_MAX = 600;

const cache = new Map();   // content id -> { name, poster, background } | null
const pending = new Map(); // content id -> Promise

let stored = null;
function store() {
  if (stored) return stored;
  try { stored = JSON.parse(globalThis.sessionStorage?.getItem(STORE_KEY) ?? '{}') ?? {}; } catch { stored = {}; }
  if (typeof stored !== 'object' || Array.isArray(stored)) stored = {};
  return stored;
}
function remember(id, value) {
  cache.set(id, value);
  if (!value) return;
  const s = store();
  s[id] = value;
  const keys = Object.keys(s);
  if (keys.length > STORE_MAX) for (const k of keys.slice(0, keys.length - STORE_MAX)) delete s[k];
  try { globalThis.sessionStorage?.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* storage is optional */ }
}

const https = url => (typeof url === 'string' && /^https:\/\/[^\s"'<>]+$/i.test(url) ? url : null);
const clean = s => (typeof s === 'string' && s.trim() ? s.trim().slice(0, 300) : null);

/** What is already known about a title, without asking anyone. */
export function peekMeta(contentId) {
  if (!contentId) return null;
  if (cache.has(contentId)) return cache.get(contentId);
  const hit = store()[contentId];
  if (hit && typeof hit === 'object') { cache.set(contentId, hit); return hit; }
  return null;
}

/** The AniList id at the end of an anime content id, or null. */
export function anilistIdOf(contentId) {
  const m = /^(?:nativeairing|airingnow|airingnowp|anilist)[:_].*?(\d{1,9})$/i.exec(String(contentId ?? ''));
  return m ? Number(m[1]) : null;
}

/** Which manifests declare a meta resource for this type and id. */
export function servesMeta(manifest, type, id) {
  if (!manifest || !Array.isArray(manifest.resources)) return null;
  const types = Array.isArray(manifest.types) ? manifest.types : [];
  const prefixes = Array.isArray(manifest.idPrefixes) ? manifest.idPrefixes : null;
  for (const r of manifest.resources) {
    const name = typeof r === 'string' ? r : r?.name;
    if (name !== 'meta') continue;
    const rTypes = (typeof r === 'object' && Array.isArray(r.types)) ? r.types : types;
    const rPrefixes = (typeof r === 'object' && Array.isArray(r.idPrefixes)) ? r.idPrefixes : prefixes;
    if (rPrefixes && !rPrefixes.some(p => String(id).startsWith(p))) continue;
    // Anime addons often file series under "anime" (and the other way round).
    const candidates = [type, type === 'anime' ? 'series' : type === 'series' ? 'anime' : null].filter(Boolean);
    const match = candidates.find(c => rTypes.includes(c));
    if (match) return match;
  }
  return null;
}

/** The address an addon's other resources live under. */
export const addonBase = url => String(url).replace(/\/manifest\.json(?:[?#].*)?$/i, '');

/**
 * A lookup service for one profile.
 * @param {{ fetch?: typeof fetch, gatewayUrl?: string, addons?: () => Promise<Array<{url:string,enabled?:boolean}>> }} options
 */
export function createMeta({ fetch: fetcher = globalThis.fetch?.bind(globalThis), gatewayUrl = null, addons = async () => [] } = {}) {
  let active = 0;
  const queue = [];
  const manifests = new Map(); // addon url -> Promise<manifest|null>
  let addonList = null;

  function slot() {
    if (active < PARALLEL) { active++; return Promise.resolve(); }
    return new Promise(resolve => queue.push(resolve));
  }
  function release() {
    const next = queue.shift();
    if (next) next(); else active--;
  }
  async function getJson(url) {
    if (!https(url) || !fetcher) return null;
    await slot();
    try {
      const response = await fetcher(url, {
        headers: { Accept: 'application/json' }, credentials: 'omit', referrerPolicy: 'no-referrer',
        signal: AbortSignal.timeout?.(TIMEOUT_MS),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch { return null; } finally { release(); }
  }

  function manifest(url) {
    if (!https(url)) return Promise.resolve(null);
    if (!manifests.has(url)) {
      manifests.set(url, getJson(url).then(m => (m && typeof m === 'object' ? m : null)));
    }
    return manifests.get(url);
  }

  /** The name and logo an addon gives itself, for addons the app synced unnamed. */
  async function addonInfo(url) {
    const m = await manifest(url);
    if (!m) return null;
    return { name: clean(m.name), logo: https(m.logo), description: clean(m.description) };
  }

  async function fromCinemeta(type, id) {
    const imdb = /^tt\d{1,10}/.exec(id)?.[0];
    if (!imdb) return null;
    for (const t of type === 'movie' ? ['movie', 'series'] : ['series', 'movie']) {
      const data = await getJson(`${CINEMETA}/meta/${t}/${imdb}.json`);
      const m = data?.meta;
      if (m?.name) return { name: clean(m.name), poster: https(m.poster), background: https(m.background) };
    }
    return null;
  }

  async function fromGateway(id) {
    const anilist = anilistIdOf(id);
    if (!anilist || !gatewayUrl) return null;
    const media = (await getJson(`${gatewayUrl}/gateway/media?id=${anilist}`))?.data?.Media;
    if (!media) return null;
    return {
      name: clean(media.title?.english) ?? clean(media.title?.romaji),
      poster: https(media.coverImage?.extraLarge) ?? https(media.coverImage?.large),
      background: https(media.bannerImage),
    };
  }

  async function fromAddons(type, id) {
    addonList ??= Promise.resolve().then(addons).catch(() => []);
    for (const addon of await addonList) {
      if (addon?.enabled === false) continue;
      const m = await manifest(addon.url);
      const servedType = servesMeta(m, type, id);
      if (!servedType) continue;
      const data = await getJson(`${addonBase(addon.url)}/meta/${encodeURIComponent(servedType)}/${encodeURIComponent(id)}.json`);
      const meta = data?.meta;
      if (meta?.name || meta?.poster) return { name: clean(meta.name), poster: https(meta.poster), background: https(meta.background) };
    }
    return null;
  }

  /** Name and artwork for one synced title; null when no source knows it. */
  function resolve(item) {
    const id = item?.content_id;
    if (!id || typeof id !== 'string') return Promise.resolve(null);
    const known = peekMeta(id);
    if (known || cache.has(id)) return Promise.resolve(known);
    if (!pending.has(id)) {
      const type = String(item.content_type ?? 'series');
      const job = (async () => {
        for (const source of [() => fromCinemeta(type, id), () => fromGateway(id), () => fromAddons(type, id)]) {
          const found = await source();
          if (found && (found.name || found.poster)) return found;
        }
        return null;
      })().then(found => { remember(id, found); pending.delete(id); return found; });
      pending.set(id, job);
    }
    return pending.get(id);
  }

  return { resolve, addonInfo };
}

/** For tests: forget everything looked up so far. */
export function resetMetaCache() {
  cache.clear(); pending.clear(); stored = null;
  try { globalThis.sessionStorage?.removeItem(STORE_KEY); } catch { /* optional */ }
}
