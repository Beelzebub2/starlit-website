// Starlit website enhancements. Every page works without this file; with it:
//
//  - Moving between pages doesn't reload the page. Same-site page links are
//    fetched and swapped in place (animated with a View Transition where the
//    browser supports one), and a page is prefetched as soon as its link is
//    hovered, focused or touched, so most navigations are instant.
//  - A link to a section of another page lands on that section, and Back and
//    Forward return to where you were.
//  - Release details stay current: /releases.json (same origin, refreshed on
//    the server from the app's GitHub releases) updates version numbers, file
//    names and changelog entries when a newer release than the one the page
//    was built with is out.
//
// Only same-origin requests are made, and text is only written with
// textContent, so nothing fetched can add markup or scripts to the page.
(() => {
  'use strict';
  if (!window.fetch || !window.DOMParser || !window.URL || !history.pushState) return;

  const doc = document;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // ------------------------------------------------------------ pages

  const PAGE_TTL = 5 * 60 * 1000; // matches the pages' Cache-Control max-age
  const pages = new Map(); // URL without hash -> { at, request }
  let rendered = location.pathname; // the page the document currently shows
  let ticket = 0; // the latest navigation; older ones are dropped

  // Site pages are directory URLs: "/", "/remote/", "/pt/ver/". Everything
  // else (the /account app, assets, feeds, files) keeps a normal navigation.
  function pageUrl(link) {
    if (!link || !link.href || link.hasAttribute('download')) return null;
    if (link.target && link.target !== '_self') return null;
    let url;
    try { url = new URL(link.href, location.href); } catch { return null; }
    if (url.origin !== location.origin || url.search || !url.pathname.endsWith('/') ||
        url.pathname.startsWith('/account/')) return null;
    return url;
  }

  function load(url) {
    const key = url.origin + url.pathname;
    const cached = pages.get(key);
    if (cached && Date.now() - cached.at < PAGE_TTL) return cached.request;
    const request = fetch(key, { credentials: 'same-origin', headers: { Accept: 'text/html' } })
      .then(async res => {
        const type = res.headers.get('content-type') || '';
        if (!res.ok || !type.includes('text/html')) return null;
        const finalUrl = new URL(res.url || key);
        if (finalUrl.origin !== location.origin) return null;
        return { url: finalUrl, html: await res.text() };
      })
      .catch(() => null);
    request.then(page => { if (!page && pages.get(key)?.request === request) pages.delete(key); });
    pages.set(key, { at: Date.now(), request });
    if (pages.size > 24) pages.delete(pages.keys().next().value);
    return request;
  }

  const attr = (root, selector, name) => root.querySelector(selector)?.getAttribute(name) ?? null;

  // A new deployment changes the stylesheet or this script's URL; such a
  // page is loaded normally so it gets its own assets. Only the site's own
  // files are compared: extensions and filters may inject scripts of theirs.
  const OWN_ASSETS = [['link[rel="stylesheet"][href^="/assets/site.css"]', 'href'],
    ['script[src^="/assets/site.js"]', 'src']];
  function parse(html) {
    const next = new DOMParser().parseFromString(html, 'text/html');
    if (!next.body || !next.querySelector('main')) return null;
    for (const [selector, name] of OWN_ASSETS) {
      const mine = attr(doc, selector, name);
      if (!mine || attr(next, selector, name) !== mine) return null;
    }
    return next;
  }

  const HEAD = 'title, meta[name="description"], meta[name="robots"], meta[property^="og:"], ' +
    'meta[name^="twitter:"], link[rel="canonical"], link[rel="alternate"]';

  function swap(next) {
    for (const el of doc.head.querySelectorAll(HEAD)) el.remove();
    for (const el of next.head.querySelectorAll(HEAD)) doc.head.append(doc.importNode(el, true));
    doc.documentElement.lang = next.documentElement.lang;
    doc.body.replaceWith(doc.adoptNode(next.body));
  }

  // ------------------------------------------------------------ scrolling and focus

  // Scroll positions per history entry, so Back and Forward return to the
  // same place. Kept for the tab's lifetime in sessionStorage.
  const STORE = 'starlit-scroll';
  let positions = {};
  try { positions = JSON.parse(sessionStorage.getItem(STORE) || '{}') || {}; } catch { positions = {}; }
  const entryKey = () => (history.state && typeof history.state.key === 'string' ? history.state.key : null);
  const newKey = () => Math.random().toString(36).slice(2, 10);
  const remember = () => { const key = entryKey(); if (key) positions[key] = Math.round(scrollY); };
  const persist = () => {
    remember();
    const keys = Object.keys(positions);
    for (const key of keys.slice(0, Math.max(0, keys.length - 50))) delete positions[key];
    try { sessionStorage.setItem(STORE, JSON.stringify(positions)); } catch { /* storage unavailable */ }
  };

  const jump = top => {
    try { scrollTo({ top, left: 0, behavior: 'instant' }); } catch { scrollTo(0, top); }
  };
  const glide = top => {
    try { scrollTo({ top, left: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' }); } catch { scrollTo(0, top); }
  };

  function target(hash) {
    if (!hash || hash.length < 2) return null;
    try { return doc.getElementById(decodeURIComponent(hash.slice(1))); } catch { return null; }
  }

  // Land at the saved position, the linked section or the top, then move
  // keyboard and screen reader focus to the new content without scrolling.
  function position(url, saved) {
    const section = target(url.hash);
    if (typeof saved === 'number') jump(saved);
    else if (section) section.scrollIntoView({ behavior: 'instant', block: 'start' });
    else jump(0);
    const focus = section || doc.getElementById('main');
    if (!focus) return;
    if (!focus.matches('a[href], button, input, select, textarea, [tabindex]')) focus.setAttribute('tabindex', '-1');
    focus.focus({ preventScroll: true });
  }

  // ------------------------------------------------------------ navigation

  function busy(on) {
    clearTimeout(busy.timer);
    if (on) busy.timer = setTimeout(() => doc.documentElement.classList.add('is-navigating'), 120);
    else doc.documentElement.classList.remove('is-navigating');
  }

  async function navigate(url, { push = true, saved = null } = {}) {
    const mine = ++ticket;
    busy(true);
    const page = await load(url);
    if (mine !== ticket) return;
    const next = page && parse(page.html);
    if (!next) { busy(false); location.assign(url.href); return; }

    const destination = new URL(page.url.href);
    destination.hash = url.hash;
    if (push) {
      remember();
      history.pushState({ key: newKey() }, '', destination.href);
    }
    const update = () => {
      swap(next);
      rendered = destination.pathname;
      position(destination, saved);
    };
    try {
      if (doc.startViewTransition && !reducedMotion.matches) {
        const transition = doc.startViewTransition(update);
        transition.ready.catch(() => {});
        transition.finished.catch(() => {});
        // A transition waits for the next frame. If the window isn't drawing
        // (occluded or minimised), skip the animation so the page still changes.
        const stalled = setTimeout(() => transition.skipTransition(), 600);
        try { await transition.updateCallbackDone; } finally { clearTimeout(stalled); }
      } else {
        update();
      }
    } catch {
      location.assign(destination.href);
      return;
    } finally {
      busy(false);
    }
    refreshReleases();
  }

  doc.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    const url = pageUrl(link);
    if (!url) return;
    if (url.pathname === rendered) {
      // A section of this page: the browser scrolls there (smoothly, via
      // site.css). The page itself: glide back to the top instead of reloading.
      if (url.hash) return;
      event.preventDefault();
      if (location.hash) history.replaceState(history.state, '', url.pathname);
      glide(0);
      return;
    }
    event.preventDefault();
    navigate(url);
  });

  // Prefetch on intent. Skipped when the visitor asked to save data.
  const saveData = navigator.connection && navigator.connection.saveData;
  const intent = event => {
    if (saveData) return;
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    const url = pageUrl(link);
    if (url && url.pathname !== rendered) load(url);
  };
  doc.addEventListener('pointerover', intent, { passive: true });
  doc.addEventListener('touchstart', intent, { passive: true });
  doc.addEventListener('focusin', intent);

  addEventListener('popstate', () => {
    const url = new URL(location.href);
    const key = entryKey();
    const saved = key && typeof positions[key] === 'number' ? positions[key] : null;
    if (url.pathname === rendered) {
      // Moving between sections of the page already on screen.
      if (saved !== null) jump(saved);
      else if (target(url.hash)) target(url.hash).scrollIntoView({ behavior: 'instant', block: 'start' });
      return;
    }
    navigate(url, { push: false, saved });
  });

  let scrollTimer = 0;
  addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(remember, 150);
  }, { passive: true });
  addEventListener('pagehide', persist);

  // This script restores scroll positions itself; give this entry a key and,
  // after a reload, return to where the visitor was.
  history.scrollRestoration = 'manual';
  if (!entryKey()) history.replaceState({ ...(history.state || {}), key: newKey() }, '');
  const navigationType = performance.getEntriesByType?.('navigation')[0]?.type;
  const restored = positions[entryKey()];
  if ((navigationType === 'reload' || navigationType === 'back_forward') && typeof restored === 'number') {
    jump(restored);
  }

  // ------------------------------------------------------------ release data

  const TAG = 'https://github.com/Beelzebub2/nuvio-native/releases/tag/v';
  const VERSION = /^\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  const FILES = {
    'windows-file': [/^Starlit-Windows-x64-\d+\.\d+\.\d+\.exe$/, r => r.files.windows],
    'android-file': [/^Starlit-Android-arm64-v8a-\d+\.\d+\.\d+\.apk$/, r => r.files.android],
  };
  const DATE_LOCALES = { en: 'en-GB', 'pt-PT': 'pt-PT' };
  const FEED_TTL = 10 * 60 * 1000;
  let feed = null;

  const newer = (a, b) => {
    const x = a.split('.').map(Number), y = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
    return false;
  };
  const isText = (value, max) => typeof value === 'string' && value.length <= max;

  // The same rules as validateFeed in tools/releases.mjs.
  function valid(data) {
    const list = data && Array.isArray(data.releases) ? data.releases : null;
    if (!list || !list.length || list.length > 5) return null;
    const ok = list.every((r, i) => r && VERSION.test(r.version) && /^\d{4}-\d{2}-\d{2}$/.test(r.date) &&
      r.url === TAG + r.version && isText(r.headline, 160) && isText(r.summary, 400) && isText(r.brief, 600) &&
      r.files && FILES['windows-file'][0].test(r.files.windows) && FILES['android-file'][0].test(r.files.android) &&
      Array.isArray(r.highlights) && r.highlights.length <= 3 &&
      r.highlights.every(h => h && isText(h.title, 220) && isText(h.text, 220)) &&
      (i === 0 || newer(list[i - 1].version, r.version)));
    return ok ? list : null;
  }

  function releases() {
    if (!feed || Date.now() - feed.at > FEED_TTL) {
      const request = fetch('/releases.json', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
        .then(res => (res.ok ? res.json() : null))
        .then(valid)
        .catch(() => null);
      feed = { at: Date.now(), request };
    }
    return feed.request;
  }

  function formatDate(iso) {
    const locale = DATE_LOCALES[doc.documentElement.lang] || 'en-GB';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(iso + 'T00:00:00Z'));
  }

  // Write one value into an element marked data-rel or data-rel-field.
  function put(el, key, item) {
    if (FILES[key]) {
      el.textContent = FILES[key][1](item);
    } else if (key === 'url') {
      if (el instanceof HTMLAnchorElement) el.href = item.url;
    } else if (key === 'date') {
      if (el instanceof HTMLTimeElement) el.dateTime = item.date;
      el.textContent = formatDate(item.date);
    } else if (typeof item[key] === 'string') {
      el.textContent = item[key];
    }
  }

  async function refreshReleases() {
    const body = doc.body;
    const built = body.dataset.release;
    if (!built || !doc.querySelector('[data-rel], [data-rel-list]')) return;
    const list = await releases();
    if (!list || doc.body !== body || !newer(list[0].version, built)) return;
    const latest = list[0];
    for (const el of body.querySelectorAll('[data-rel]')) put(el, el.dataset.rel, latest);
    for (const container of body.querySelectorAll('[data-rel-list]')) {
      const items = container.dataset.relList === 'highlights'
        ? latest.highlights : list.slice(Number(container.dataset.relStart) || 0);
      const slots = [...container.children].filter(el => el.hasAttribute('data-rel-item'));
      if (!slots.length || !items.length) continue;
      // Reuse the first entry as the template and keep the same number of
      // entries, so the layout doesn't change.
      const filled = items.slice(0, slots.length).map(item => {
        const node = slots[0].cloneNode(true);
        for (const field of node.querySelectorAll('[data-rel-field]')) put(field, field.dataset.relField, item);
        return node;
      });
      slots[0].before(...filled);
      for (const slot of slots) slot.remove();
    }
    body.dataset.release = latest.version;
  }

  refreshReleases();
})();
