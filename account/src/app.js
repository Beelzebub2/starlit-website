// Starlit account dashboard: app shell, routing and session flow.
import { config } from './config.js';
import { transport, mountMockPanel } from './transport.js';
import { createApi } from './lib/api.js';
import { createAuth } from './lib/auth.js';
import { h, icon, replace } from './lib/dom.js';
import { t, lang, setLang } from './lib/i18n.js';
import { state, update, activeProfile, readPref, writePref } from './lib/state.js';
import { announce, avatar, button, confirmDialog, notice, openDialog, setLiveRegion } from './lib/ui.js';
import { pinGate } from './views/pin-gate.js';
import signin from './views/signin.js';
import chooseProfile from './views/choose-profile.js';
import overview from './views/overview.js';
import profiles from './views/profiles.js';
import { addons, plugins } from './views/extensions.js';
import { library, progress, history as watchedHistory } from './views/items.js';
import collections from './views/collections.js';
import collectionEditor from './views/collection-editor.js';
import settings from './views/settings.js';
import servers from './views/servers.js';
import security from './views/security.js';
import notFound from './views/not-found.js';

const ROUTES = [
  { path: '/', view: overview, nav: 'overview' },
  { path: '/library', view: library, nav: 'library' },
  { path: '/progress', view: progress, nav: 'progress' },
  { path: '/history', view: watchedHistory, nav: 'history' },
  { path: '/collections', view: collections, nav: 'collections' },
  { path: '/collections/new', view: collectionEditor, nav: 'collections' },
  { path: '/collections/edit/:id', view: collectionEditor, nav: 'collections' },
  { path: '/addons', view: addons, nav: 'addons' },
  { path: '/plugins', view: plugins, nav: 'plugins' },
  { path: '/settings', view: settings, nav: 'settings' },
  { path: '/servers', view: servers, nav: 'servers' },
  { path: '/profiles', view: profiles, nav: 'profiles', account: true },
  { path: '/security', view: security, nav: 'security', account: true },
];
const NAV = {
  profile: [['overview', '/', 'home'], ['library', '/library', 'library'], ['progress', '/progress', 'progress'], ['history', '/history', 'history'],
    ['collections', '/collections', 'collections'], ['addons', '/addons', 'addons'], ['plugins', '/plugins', 'plugins'],
    ['settings', '/settings', 'settings'], ['servers', '/servers', 'servers']],
  account: [['profiles', '/profiles', 'profiles'], ['security', '/security', 'security']],
};

// ------------------------------------------------------------------ services
const auth = createAuth({
  baseUrl: config.apiUrl, anonKey: config.anonKey, transport,
  onChange: (view, reason) => {
    if (view) { update({ user: view }); return; }
    if (state.user) {
      update({ user: null, profiles: [], profileId: null, unlocked: new Set(), signOutReason: reason ?? null });
      navigate('/signin', { replace: true, force: true });
    }
  },
});
const api = createApi({
  baseUrl: config.apiUrl, anonKey: config.anonKey, transport,
  getAccessToken: () => auth.getAccessToken(),
  onAuthError: () => auth.invalidate('revoked'),
});
export const canWrite = () => config.writesEnabled && state.online;

// ------------------------------------------------------------------ shell
const root = document.getElementById('app');
const live = h('div', { class: 'vh', 'aria-live': 'polite', 'aria-atomic': 'true' });
setLiveRegion(live);
const viewHost = h('div', { class: 'view' });
const banners = h('div', { class: 'banners' });
const main = h('main', { id: 'main', class: 'main', tabindex: '-1' }, banners, viewHost);
const rail = h('aside', { class: 'rail' });
const topbar = h('header', { class: 'topbar' });
const shell = h('div', { class: 'shell' }, rail, h('div', { class: 'content' }, topbar, main));
replace(root, h('a', { class: 'skip', href: '#main' }, t('common.skip')), shell, live);
document.documentElement.lang = lang() === 'pt' ? 'pt-PT' : 'en';

let current = null;   // { route, ctx, controller }

function brand() {
  return h('a', { class: 'brand', href: '/', 'data-link': '' },
    h('img', { class: 'brand-mark', src: '/starlit-mark.svg', alt: '', width: '28', height: '28' }),
    h('span', { class: 'brand-name' }, 'Starlit'), h('span', { class: 'brand-sub' }, t('shell.account')));
}

function navList(active, { onNavigate } = {}) {
  const item = ([id, href, ic]) => h('li', {}, h('a', {
    href, 'data-link': '', class: 'nav-link', 'aria-current': id === active ? 'page' : undefined, onclick: onNavigate,
  }, icon(ic), h('span', {}, t(`nav.${id}`))));
  const p = activeProfile();
  return h('nav', { class: 'nav', 'aria-label': t('shell.navLabel') },
    h('p', { class: 'nav-group', id: 'nav-profile' }, p ? t('shell.thisProfile', { name: p.name }) : t('shell.profileData')),
    h('ul', { role: 'list', 'aria-labelledby': 'nav-profile' }, NAV.profile.map(item)),
    h('p', { class: 'nav-group', id: 'nav-account' }, t('shell.accountGroup')),
    h('ul', { role: 'list', 'aria-labelledby': 'nav-account' }, NAV.account.map(item)));
}

function scopeButton(compact = false) {
  const p = activeProfile();
  if (!p) return null;
  return h('button', { type: 'button', class: ['scope', compact && 'scope-compact'], onclick: switchProfile, 'aria-haspopup': 'dialog' },
    avatar(p, compact ? 's' : 'm'),
    h('span', { class: 'scope-text' }, h('span', { class: 'scope-label' }, t('shell.profile')), h('span', { class: 'scope-name' }, p.name)),
    p.pin_enabled ? icon('lock', { size: 14, label: t('profiles.pinOn') }) : null,
    h('span', { class: 'scope-switch' }, t('shell.switch')));
}

function langButton() {
  const next = lang() === 'pt' ? 'en' : 'pt';
  return h('button', { type: 'button', class: 'lang', lang: next === 'pt' ? 'pt-PT' : 'en', onclick: () => { setLang(next); renderShell(); rerender(); } },
    icon('globe', { size: 16 }), next === 'pt' ? 'Português' : 'English');
}

function renderShell() {
  const signedIn = Boolean(state.user);
  shell.classList.toggle('shell-signed-out', !signedIn);
  const active = current?.route?.nav;
  if (!signedIn) { replace(rail); replace(topbar, h('div', { class: 'topbar-inner' }, brand(), langButton())); renderBanners(); return; }
  replace(rail,
    h('div', { class: 'rail-top' }, brand(), scopeButton()),
    navList(active),
    h('div', { class: 'rail-foot' },
      h('p', { class: 'rail-user', title: state.user.email }, state.user.email),
      h('div', { class: 'rail-actions' }, langButton(), button(t('shell.signOut'), { variant: 'quiet', icon: 'signout', size: 's', onClick: signOutLocal }))));
  replace(topbar, h('div', { class: 'topbar-inner' }, brand(), scopeButton(true),
    h('button', { type: 'button', class: 'icon-btn icon-btn-quiet menu-btn', 'aria-label': t('shell.menu'), onclick: openMenu }, icon('menu'))));
  renderBanners();
}

function renderBanners() {
  const list = [];
  if (config.mode === 'mock') list.push(notice({ tone: 'info', title: t('banner.mockTitle'), body: t('banner.mockBody') }));
  if (config.mode === 'live' && !config.writesEnabled) list.push(notice({ tone: 'info', title: t('banner.readonlyTitle'), body: t('banner.readonlyBody') }));
  if (!state.online) list.push(notice({ tone: 'warn', title: t('banner.offlineTitle'), body: t('banner.offlineBody'), live: true }));
  replace(banners, list);
}

async function openMenu() {
  const nav = navList(current?.route?.nav);
  for (const a of nav.querySelectorAll('a[data-link]')) a.dataset.dialogValue = 'nav';
  const content = h('div', { class: 'drawer' }, nav,
    h('div', { class: 'drawer-foot' }, h('p', { class: 'rail-user' }, state.user?.email ?? ''), langButton()));
  if (await openDialog({ title: t('shell.menu'), content, actions: [{ label: t('shell.signOut'), value: 'signout' }] }) === 'signout') signOutLocal();
}

async function switchProfile() {
  const value = await openDialog({
    title: t('shell.switchTitle'), description: t('shell.switchBody'),
    content: h('ul', { role: 'list', class: 'profile-choices' }, state.profiles.map(p => h('li', {},
      h('button', { type: 'button', class: 'profile-choice', 'aria-current': p.profile_index === state.profileId ? 'true' : undefined,
        'data-dialog-value': String(p.profile_index) },
      avatar(p), h('span', { class: 'profile-choice-name' }, p.name),
      p.pin_enabled ? icon('lock', { size: 14, label: t('profiles.pinOn') }) : null,
      p.profile_index === state.profileId ? h('span', { class: 'pill pill-ok' }, t('shell.current')) : null)))),
  });
  const index = Number(value);
  if (index && index !== state.profileId) selectProfile(index);
}

export async function selectProfile(index, { to } = {}) {
  const p = state.profiles.find(x => x.profile_index === index);
  if (!p) return false;
  if (current?.ctx?.isDirty?.() && !(await confirmLeave())) return false;
  if (p.pin_enabled && !state.unlocked.has(index)) {
    const ok = await pinGate({ api, profile: p });
    if (!ok) return false;
    state.unlocked.add(index);
  }
  update({ profileId: index });
  writePref('profile', index);
  announce(t('shell.switched', { name: p.name }));
  if (to) navigate(to, { force: true }); else rerender({ force: true });
  return true;
}

async function signOutLocal() {
  if (current?.ctx?.isDirty?.() && !(await confirmLeave())) return;
  try { await auth.signOut('local'); } catch { /* signed out locally anyway */ }
  update({ user: null, profiles: [], profileId: null, unlocked: new Set(), signOutReason: 'signed-out' });
  navigate('/signin', { replace: true, force: true });
}

function confirmLeave() {
  return confirmDialog({ title: t('leave.title'), body: t('leave.body'), confirmLabel: t('leave.confirm'), danger: true });
}

// ------------------------------------------------------------------ routing
function match(pathname) {
  for (const route of ROUTES) {
    const keys = [];
    const re = new RegExp(`^${route.path.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}/?$`);
    const m = pathname.match(re);
    if (m) return { route, params: Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
  }
  return null;
}

export async function navigate(path, { replace: swap = false, force = false } = {}) {
  if (!force && current?.ctx?.isDirty?.() && !(await confirmLeave())) return false;
  history[swap ? 'replaceState' : 'pushState']({}, '', path);
  await render();
  return true;
}

function rerender({ force = false } = {}) {
  if (!force && current?.ctx?.isDirty?.()) return;
  render();
}

async function render() {
  current?.controller.abort();
  current?.ctx?.destroy?.();
  const url = new URL(location.href);
  const path = url.pathname;

  if (path === '/auth/callback') return completeGoogle(url);
  if (!state.user) {
    if (path !== '/signin') state.returnTo = path + url.search;
    if (path !== '/signin') history.replaceState({}, '', '/signin');
    return mount({ nav: null }, signin, {});
  }
  if (path === '/signin') { history.replaceState({}, '', '/'); return render(); }
  if (path === '/choose-profile' || !state.profileId) {
    if (path !== '/choose-profile') { state.returnTo = path + url.search; history.replaceState({}, '', '/choose-profile'); }
    return mount({ nav: null }, chooseProfile, {});
  }
  const found = match(path);
  if (!found) return mount({ nav: null }, notFound, {});
  return mount(found.route, found.route.view, found.params, url.searchParams);
}

function mount(route, view, params, query = new URLSearchParams()) {
  const controller = new AbortController();
  const ctx = {
    api, auth, config, params, query, navigate, selectProfile, canWrite, refreshProfiles,
    signal: controller.signal, profileId: state.profileId, profile: activeProfile(),
    isDirty: () => false, destroy: null,
    finishSignIn,
    setTitle: title => { document.title = `${title} · Starlit ${t('shell.account')}`; },
  };
  current = { route, ctx, controller };
  renderShell();
  const el = view.render(ctx);
  replace(viewHost, el);
  ctx.setTitle(view.title?.(ctx) ?? 'Starlit');
  // Move focus to the page heading so keyboard and screen-reader users land on the new page.
  requestAnimationFrame(() => (viewHost.querySelector('.page-title') ?? main).focus({ preventScroll: false }));
  window.scrollTo({ top: 0 });
}

document.addEventListener('click', e => {
  const a = e.target.closest?.('a[data-link]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (a.origin !== location.origin) return;
  e.preventDefault();
  if (a.pathname + a.search !== location.pathname + location.search) navigate(a.pathname + a.search);
});

let restoring = false;
window.addEventListener('popstate', async () => {
  if (restoring) { restoring = false; return; }
  if (current?.ctx?.isDirty?.() && !(await confirmLeave())) {
    restoring = true;
    history.forward();
    return;
  }
  render();
});

window.addEventListener('beforeunload', e => {
  if (current?.ctx?.isDirty?.()) { e.preventDefault(); e.returnValue = ''; }
});
window.addEventListener('online', () => { update({ online: true }); renderBanners(); });
window.addEventListener('offline', () => { update({ online: false }); renderBanners(); });

// ------------------------------------------------------------------ sign-in flow
/** After GoTrue accepts the credentials: load the profiles, then pick one. */
async function finishSignIn() {
  const list = await api.profiles();
  const saved = Number(readPref('profile'));
  update({ profiles: list, signOutReason: null, unlocked: new Set() });
  const back = state.returnTo && state.returnTo !== '/signin' ? state.returnTo : '/';
  state.returnTo = null;
  const pick = list.find(p => p.profile_index === saved) ?? (list.length === 1 ? list[0] : null);
  if (pick && !pick.pin_enabled) {
    update({ profileId: pick.profile_index });
    return navigate(back, { replace: true, force: true });
  }
  state.returnTo = back;
  return navigate('/choose-profile', { replace: true, force: true });
}

async function completeGoogle(url) {
  const code = url.searchParams.get('code');
  history.replaceState({}, '', '/signin');   // never keep the code in the address bar
  try {
    await auth.completeGoogle(code);
    await auth.loadUser().catch(() => null);
    await finishSignIn();
  } catch {
    update({ signOutReason: 'google-failed' });
    render();
  }
}

/** Reload the profile list (after edits) and keep the scope valid. */
export async function refreshProfiles() {
  const list = await api.profiles();
  const stillThere = list.some(p => p.profile_index === state.profileId);
  update({ profiles: list, profileId: stillThere ? state.profileId : 1 });
  renderShell();
  return list;
}

if (mountMockPanel) mountMockPanel({ onChange: () => renderBanners() });
render();
