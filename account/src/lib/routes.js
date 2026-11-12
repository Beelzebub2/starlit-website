// Canonical account navigation lives at ONE path with a ?tab= query.
// Keep historical /account/library-style bookmarks compatible, but never
// generate separate page paths. No login data or tokens are stored here.
const TABS = Object.freeze({
  overview: '/',
  library: '/library',
  progress: '/progress',
  history: '/history',
  collections: '/collections',
  addons: '/addons',
  plugins: '/plugins',
  settings: '/settings',
  servers: '/servers',
  profiles: '/profiles',
  security: '/security',
  signin: '/signin',
  'choose-profile': '/choose-profile',
  'auth-callback': '/auth/callback',
});
const PATH_TO_TAB = new Map(Object.entries(TABS).map(([tab, path]) => [path, tab]));
const ORIGIN = 'https://starlit.invalid';

export function accountUrl(path, basePath = '/') {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
    throw new Error('Expected a relative account route');
  }
  const target = new URL(path, ORIGIN);
  const pathname = target.pathname.replace(/\/+$/, '') || '/';
  // TV codes are scanned at a stable, memorable address outside tab navigation.
  if (pathname === '/tv') return (basePath === '/' ? '' : basePath.replace(/\/+$/, '')) + '/tv';
  let tab = PATH_TO_TAB.get(pathname);
  const query = new URLSearchParams();
  if (!tab && pathname === '/collections/new') {
    tab = 'collections';
    query.set('action', 'new');
  } else if (!tab && pathname.startsWith('/collections/edit/')) {
    const id = pathname.slice('/collections/edit/'.length);
    if (!id || id.includes('/')) throw new Error('Invalid collection route');
    tab = 'collections';
    query.set('action', 'edit');
    query.set('id', decodeURIComponent(id));
  }
  if (!tab) throw new Error('Unknown account route');
  const params = new URLSearchParams([['tab', tab]]);
  for (const [key, value] of query) params.append(key, value);
  // Prevent caller-provided tab/action/id from impersonating another route.
  for (const [key, value] of target.searchParams) {
    if (key !== 'tab' && (tab !== 'collections' || !['action', 'id'].includes(key))) {
      params.append(key, value);
    }
  }
  const root = basePath === '/' ? '/' : basePath.replace(/\/+$/, '');
  return root + '?' + params.toString();
}

/** Parses both /account?tab=plugins and old /account/plugins bookmarks.
 * Returns null only when the URL is outside this account app. */
export function readAccountUrl(href, basePath = '/') {
  const url = new URL(href, ORIGIN);
  const root = basePath === '/' ? '/' : basePath.replace(/\/+$/, '');
  if (url.pathname.replace(/\/+$/, '') === (root === '/' ? '' : root) + '/tv') {
    return { path: '/tv', query: new URLSearchParams(), canonical: accountUrl('/tv', basePath), legacy: false };
  }
  const isRoot = url.pathname === root || (root !== '/' && url.pathname === root + '/');
  if (isRoot) {
    const tab = url.searchParams.get('tab') || 'overview';
    const base = TABS[tab];
    // Unknown tabs are intentionally not routed to a privileged view.
    if (!base) return { path: '/__unknown_tab__', query: new URLSearchParams(), canonical: null };
    let path = base;
    const query = new URLSearchParams(url.searchParams);
    query.delete('tab');
    if (tab === 'collections') {
      const action = query.get('action');
      const id = query.get('id');
      query.delete('action');
      query.delete('id');
      if (action === 'new') path = '/collections/new';
      else if (action === 'edit' && id) path = '/collections/edit/' + encodeURIComponent(id);
      else if (action) return { path: '/__unknown_tab__', query: new URLSearchParams(), canonical: null };
    }
    const suffix = query.toString();
    return { path, query, canonical: accountUrl(path + (suffix ? '?' + suffix : ''), basePath), legacy: false };
  }
  if (url.pathname.startsWith(root === '/' ? '/' : root + '/')) {
    // A historic bookmark is converted in-place, without leaking the old path
    // to the rest of the SPA and without an extra navigation history entry.
    const path = root === '/' ? url.pathname : url.pathname.slice(root.length);
    try {
      const canonical = accountUrl(path + url.search, basePath);
      const resolved = readAccountUrl(canonical, basePath);
      return { ...resolved, canonical, legacy: true };
    } catch {
      return { path: '/__unknown_tab__', query: new URLSearchParams(), canonical: null, legacy: true };
    }
  }
  return null;
}
