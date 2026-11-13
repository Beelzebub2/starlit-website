// Collections editor model. The JSON must stay compatible with the Starlit
// client (starlit Dev: features/collection/CollectionModels.kt). The
// server stores the array as-is and does not check TMDB/Trakt semantics, so
// every rule the client enforces on import is checked here, plus a few
// stricter ones the client would only discover when the row fails to load.

export const VIEW_MODES = ['TABBED_GRID', 'ROWS', 'FOLLOW_LAYOUT'];
export const TILE_SHAPES = ['poster', 'landscape', 'square'];
export const PROVIDERS = ['tmdb', 'trakt', 'addon'];
export const TMDB_SOURCE_TYPES = ['LIST', 'COLLECTION', 'COMPANY', 'NETWORK', 'DISCOVER', 'PERSON', 'DIRECTOR'];
export const TMDB_MEDIA = ['MOVIE', 'TV'];
export const TMDB_SORTS = ['original', 'popularity.desc', 'vote_average.desc', 'vote_count.desc', 'primary_release_date.desc', 'first_air_date.desc'];
export const TRAKT_SORTS = ['rank', 'added', 'title', 'released', 'runtime', 'popularity', 'percentage', 'votes'];
export const TRAKT_HOW = ['asc', 'desc'];
export const URL_FIELDS = { collection: ['backdropImageUrl'], folder: ['coverImageUrl', 'focusGifUrl', 'heroBackdropUrl', 'heroVideoUrl', 'titleLogoUrl'] };
export const MAX_BYTES = 1048576;   // starlit_private.records payload limit
export const MAX_COLLECTIONS = 1000; // require_json array limit

// The same presets the Starlit app offers (TmdbCollectionSourceResolver.presets).
export const TMDB_PRESETS = [
  ['Marvel Studios', 'COMPANY', 420], ['Walt Disney Pictures', 'COMPANY', 2], ['Pixar', 'COMPANY', 3],
  ['Lucasfilm', 'COMPANY', 1], ['Warner Bros.', 'COMPANY', 174], ['Netflix', 'NETWORK', 213], ['HBO', 'NETWORK', 49],
  ['Disney+', 'NETWORK', 2739], ['Prime Video', 'NETWORK', 1024], ['Hulu', 'NETWORK', 453], ['Apple TV+', 'NETWORK', 2552],
].map(([title, type, id]) => ({
  title,
  source: { provider: 'tmdb', tmdbSourceType: type, title, tmdbId: id, mediaType: type === 'COMPANY' ? 'MOVIE' : 'TV', sortBy: 'popularity.desc' },
}));

export const newId = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);

export function blankSource(provider = 'tmdb') {
  if (provider === 'trakt') return { provider: 'trakt', traktListId: null, title: '', mediaType: null, sortBy: 'rank', sortHow: 'asc' };
  if (provider === 'addon') return { provider: 'addon', addonId: '', type: '', catalogId: '', genre: null };
  return { provider: 'tmdb', tmdbSourceType: 'LIST', title: '', tmdbId: null, mediaType: 'MOVIE', sortBy: 'popularity.desc' };
}

export function blankFolder(title = '') {
  return { id: newId(), title, coverImageUrl: null, coverEmoji: null, tileShape: 'poster', hideTitle: false, sources: [] };
}

export function blankCollection(title = '') {
  return { id: newId(), title, backdropImageUrl: null, pinToTop: false, viewMode: 'TABBED_GRID', showAllTab: true, folders: [blankFolder('')] };
}

/** Template id → a fresh collection. Every field stays editable before saving. */
export function fromTemplate(template) {
  if (template?.kind === 'preset') {
    const c = blankCollection(template.preset.title);
    c.folders[0].title = template.preset.title;
    c.folders[0].sources = [structuredClone(template.preset.source)];
    return c;
  }
  const c = blankCollection('');
  if (template?.kind === 'tmdb-list') c.folders[0].sources = [blankSource('tmdb')];
  if (template?.kind === 'discover') c.folders[0].sources = [{ provider: 'tmdb', tmdbSourceType: 'DISCOVER', title: '', mediaType: 'MOVIE', sortBy: 'popularity.desc', filters: { withGenres: '', year: null, withOriginalLanguage: '' } }];
  if (template?.kind === 'trakt') c.folders[0].sources = [blankSource('trakt')];
  if (template?.kind === 'addon') c.folders[0].sources = [blankSource('addon')];
  return c;
}

/** A source's sources list, including the legacy catalogSources fallback the client reads. */
export function sourcesOf(folder) {
  if (Array.isArray(folder.sources) && folder.sources.length) return folder.sources;
  return (folder.catalogSources ?? []).map(s => ({ provider: 'addon', ...s }));
}

const blank = v => v === undefined || v === null || String(v).trim() === '';
const isPositiveInt = v => Number.isInteger(v) && v > 0;
const isHttpsUrl = v => { try { const u = new URL(v); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; } };

/**
 * Validate a collections array. Returns a list of issues:
 * { level: 'error'|'warning', code, at: { collection, folder?, source? }, field? }.
 * "client" codes match the client's own import rules (validateImportModel).
 */
export function validate(collections) {
  const issues = [];
  const push = (level, code, at, field) => issues.push({ level, code, at, field });
  if (!Array.isArray(collections)) return [{ level: 'error', code: 'not-array', at: {} }];
  if (collections.length > MAX_COLLECTIONS) push('error', 'too-many', {});
  const bytes = new TextEncoder().encode(JSON.stringify(collections)).length;
  if (bytes > MAX_BYTES) push('error', 'too-large', {});

  const collectionIds = new Set();
  collections.forEach((c, ci) => {
    const at = { collection: ci };
    if (!c || typeof c !== 'object' || Array.isArray(c)) { push('error', 'not-object', at); return; }
    if (blank(c.id)) push('error', 'collection-id', at, 'id');
    else if (collectionIds.has(c.id)) push('error', 'collection-duplicate', at, 'id');
    else collectionIds.add(c.id);
    if (blank(c.title)) push('error', 'collection-title', at, 'title');
    else if (String(c.title).length > 120) push('warning', 'title-long', at, 'title');
    if (c.viewMode !== undefined && !VIEW_MODES.includes(String(c.viewMode).toUpperCase())) push('warning', 'view-mode', at, 'viewMode');
    for (const f of URL_FIELDS.collection) if (!blank(c[f]) && !isHttpsUrl(c[f])) push('error', 'https', at, f);
    const folders = Array.isArray(c.folders) ? c.folders : [];
    if (c.folders !== undefined && !Array.isArray(c.folders)) push('error', 'folders-array', at, 'folders');
    if (!folders.length) push('warning', 'no-folders', at);

    const folderIds = new Set();
    folders.forEach((f, fi) => {
      const fat = { collection: ci, folder: fi };
      if (!f || typeof f !== 'object') { push('error', 'not-object', fat); return; }
      if (blank(f.id)) push('error', 'folder-id', fat, 'id');
      else if (folderIds.has(f.id)) push('error', 'folder-duplicate', fat, 'id');
      else folderIds.add(f.id);
      if (blank(f.title)) push('error', 'folder-title', fat, 'title');
      if (f.tileShape !== undefined && !TILE_SHAPES.includes(String(f.tileShape).toLowerCase()) && f.tileShape !== 'wide') push('warning', 'tile-shape', fat, 'tileShape');
      for (const field of URL_FIELDS.folder) if (!blank(f[field]) && !isHttpsUrl(f[field])) push('error', 'https', fat, field);
      const sources = sourcesOf(f);
      if (!sources.length) push('warning', 'no-sources', fat);
      sources.forEach((s, si) => validateSource(s, { collection: ci, folder: fi, source: si }, push));
    });
  });
  return issues;
}

function validateSource(s, at, push) {
  if (!s || typeof s !== 'object') { push('error', 'not-object', at); return; }
  const provider = String(s.provider ?? 'addon').toLowerCase();
  if (!PROVIDERS.includes(provider)) { push('error', 'provider', at, 'provider'); return; }
  if (provider === 'trakt') {
    // Client rule: traktListId must be a positive number.
    if (!isPositiveInt(s.traktListId)) push('error', 'trakt-id', at, 'traktListId');
    if (!blank(s.sortBy) && !TRAKT_SORTS.includes(String(s.sortBy).toLowerCase())) push('warning', 'trakt-sort', at, 'sortBy');
    if (!blank(s.sortHow) && !TRAKT_HOW.includes(String(s.sortHow).toLowerCase())) push('warning', 'trakt-how', at, 'sortHow');
    return;
  }
  if (provider === 'addon') {
    // Client rule: addon sources need addonId, type and catalogId.
    for (const field of ['addonId', 'type', 'catalogId']) if (blank(s[field])) push('error', 'addon-field', at, field);
    return;
  }
  // TMDB. Client rule: tmdbSourceType is required. Stricter: it must be known,
  // and every type except DISCOVER needs a positive TMDB id to resolve.
  if (blank(s.tmdbSourceType)) { push('error', 'tmdb-type', at, 'tmdbSourceType'); return; }
  const type = String(s.tmdbSourceType).toUpperCase();
  if (!TMDB_SOURCE_TYPES.includes(type)) push('error', 'tmdb-type', at, 'tmdbSourceType');
  if (type !== 'DISCOVER' && !isPositiveInt(s.tmdbId)) push('error', 'tmdb-id', at, 'tmdbId');
  if (!blank(s.mediaType) && !TMDB_MEDIA.includes(String(s.mediaType).toUpperCase()) && !['tv', 'series', 'movie'].includes(String(s.mediaType).toLowerCase())) push('warning', 'tmdb-media', at, 'mediaType');
  if (!blank(s.sortBy) && !TMDB_SORTS.includes(s.sortBy)) push('warning', 'tmdb-sort', at, 'sortBy');
  const filters = s.filters;
  if (filters && typeof filters === 'object') {
    if (filters.year !== undefined && filters.year !== null && !(Number.isInteger(filters.year) && filters.year >= 1870 && filters.year <= 2100)) push('error', 'tmdb-year', at, 'filters.year');
    for (const k of ['voteAverageGte', 'voteAverageLte']) if (filters[k] !== undefined && filters[k] !== null && !(typeof filters[k] === 'number' && filters[k] >= 0 && filters[k] <= 10)) push('error', 'tmdb-vote', at, `filters.${k}`);
  }
}

/** Extract a TMDB id from a number or a TMDB link (same patterns as the client). */
export function parseTmdbId(input) {
  const text = String(input ?? '').trim();
  if (/^\d+$/.test(text)) return Number(text);
  const m = text.match(/(?:list|collection|company|network|person)\/(\d+)/) ?? text.match(/[?&]id=(\d+)/);
  return m ? Number(m[1]) : null;
}

/** Extract a numeric Trakt list id. Trakt slugs cannot be resolved here (no Trakt API call). */
export function parseTraktListId(input) {
  const text = String(input ?? '').trim();
  return /^\d+$/.test(text) && Number(text) > 0 ? Number(text) : null;
}

/** Clean editor-only blanks before saving; unknown fields are left untouched. */
export function normalize(collections) {
  return collections.map(c => {
    const out = { ...c };
    for (const f of URL_FIELDS.collection) if (blank(out[f])) out[f] = null;
    out.folders = (c.folders ?? []).map(f => {
      const folder = { ...f };
      for (const field of [...URL_FIELDS.folder, 'coverEmoji']) if (field in folder && blank(folder[field])) folder[field] = null;
      if (Array.isArray(folder.sources)) folder.sources = folder.sources.map(normalizeSource);
      return folder;
    });
    return out;
  });
}

function normalizeSource(s) {
  const out = { ...s };
  for (const [k, v] of Object.entries(out)) if (typeof v === 'string' && v.trim() === '' && k !== 'provider') out[k] = null;
  if (out.filters && typeof out.filters === 'object') {
    const filters = { ...out.filters };
    for (const [k, v] of Object.entries(filters)) if (v === '' || v === null || v === undefined) delete filters[k];
    out.filters = Object.keys(filters).length ? filters : null;
  }
  return out;
}

export function stats(collections) {
  const list = Array.isArray(collections) ? collections : [];
  const folders = list.reduce((n, c) => n + (c.folders?.length ?? 0), 0);
  const sources = list.reduce((n, c) => n + (c.folders ?? []).reduce((m, f) => m + sourcesOf(f).length, 0), 0);
  return { collections: list.length, folders, sources };
}

/** Parse JSON the user pasted or picked. Throws a message key on failure. */
export function parseImport(text) {
  if (!String(text ?? '').trim()) throw new Error('import-empty');
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('import-json'); }
  if (!Array.isArray(value)) throw new Error('import-array');
  return value;
}
