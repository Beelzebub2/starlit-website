// The library: one page with three shelves (Library, Continue watching and
// History), each its own address (?tab=library, ?tab=progress, ?tab=history)
// so bookmarks keep working. Titles show as posters (the artwork the app
// synced, or a Starlit-coloured stand-in) or as a list.
//
// Lists use the server's keyset cursor ("Load more"), never page numbers.
// Searching loads the rest of the shelf first, so it finds every title, not
// only the ones on screen. Each edit or removal sends the updated_at you saw;
// if the item changed elsewhere you get both versions to compare before
// anything is written again.
import { h, icon, replace } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { deleteKeyFor } from '../lib/api.js';
import { isConflict } from '../lib/errors.js';
import { readPref, writePref } from '../lib/state.js';
import { peekMeta } from '../lib/meta.js';
import { formatClock, formatDate, formatNumber, formatRelative, parseClock } from '../lib/format.js';
import { announce, button, confirmDialog, emptyState, errorState, facts, field, iconButton, input, loading, notice, openDialog, pageHeader, select } from '../lib/ui.js';
import { readOnlyNotice, refetchOnReturn } from './common.js';

const PAGE = 25;
// Search never loads more than this many titles in one go.
const SEARCH_LIMIT = 1000;
const KIND = { library: 'library', progress: 'watch_progress', history: 'watched_items' };
const COUNT_FIELD = { library: 'library_items', progress: 'watch_progress', history: 'watched_records' };
const SHELVES = [['library', '/library'], ['progress', '/progress'], ['history', '/history']];

function makeView(id) {
  return { title: () => t(`nav.${id}`), render: ctx => render(ctx, id) };
}
export const library = makeView('library');
export const progress = makeView('progress');
export const history = makeView('history');

// Progress rows sync only an id; a looked-up name (lib/meta.js) fills the gap.
export const nameOf = v => v?.name || v?.title || peekMeta(v?.content_id)?.name || v?.content_id || '—';
const episodeOf = v => (v?.season != null && v?.episode != null ? t('items.episode', { s: v.season, e: v.episode }) : null);
const typeOf = v => (v?.content_type === 'movie' ? t('items.movie') : v?.content_type === 'series' ? t('items.series') : v?.content_type ?? '');
const whenOf = (id, v) => (id === 'library' ? v.added_at : id === 'progress' ? v.last_watched : v.watched_at);
const yearOf = v => { const m = String(v?.release_info ?? '').match(/\d{4}/); return m ? Number(m[0]) : null; };
const stamp = when => { const n = new Date(when ?? 0).getTime(); return Number.isFinite(n) ? n : 0; };
const percentOf = v => (v?.duration > 0 ? Math.min(100, Math.round((v.position / v.duration) * 100)) : 0);

// ------------------------------------------------------------------ artwork

// The app syncs the poster address it showed for some library titles. The
// rest are looked up once the poster scrolls into view (lib/meta.js). Only
// https artwork is loaded (the account CSP allows https images), without a
// referrer; anything else, or a poster that fails to load, gets a stand-in in
// one of the Starlit app icon's colourways, picked from the title so it never
// changes.
const ART = 6;
const artFor = name => { let n = 0; for (const c of String(name)) n = (n * 31 + c.codePointAt(0)) >>> 0; return 'art-' + (n % ART); };
const safeImage = url => (typeof url === 'string' && /^https:\/\/[^\s"'<>]+$/i.test(url) ? url : null);

const pick = (v, found, size) => safeImage(size === 'backdrop'
  ? (v?.background || found?.background || v?.poster || found?.poster)
  : (v?.poster || found?.poster));

/** Run fn once el is near the viewport (or at once where that can't be told). */
function whenVisible(el, fn) {
  if (typeof IntersectionObserver !== 'function') { fn(); return; }
  const io = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) { io.disconnect(); fn(); }
  }, { rootMargin: '400px 0px' });
  io.observe(el);
}

/**
 * A title's artwork. With `meta` (the profile's lookup service), a title
 * without synced artwork or name is looked up when it comes into view, and
 * `onMeta` hears what was found so the caller can fill in the name.
 */
export function posterArt(v, { size = 'poster', meta = null, onMeta = null } = {}) {
  const name = nameOf(v);
  const fallbackName = h('span', { class: 'poster-fallback-name' }, name);
  const mono = h('span', { class: 'poster-mono', dataset: { letter: name.trim().slice(0, 1).toUpperCase() } });
  const fallback = h('span', { class: ['poster-fallback', artFor(name)], 'aria-hidden': 'true' },
    // The big initial is drawn by CSS from data-letter, so it never becomes part of the button's text.
    mono, fallbackName);
  const wrap = h('span', { class: ['poster-art', `poster-${size}`] }, fallback);
  const show = src => {
    if (!src || wrap.querySelector('img')) return;
    const img = h('img', { src, alt: '', loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer', class: 'poster-img' });
    img.addEventListener('load', () => wrap.classList.add('has-img'), { once: true });
    img.addEventListener('error', () => img.remove(), { once: true });
    wrap.append(img);
  };
  const known = peekMeta(v?.content_id);
  show(pick(v, known, size));
  const needsName = !v?.name && !v?.title && !known?.name;
  if (meta && v?.content_id && (needsName || !wrap.querySelector('img'))) {
    whenVisible(wrap, async () => {
      const found = await meta.resolve(v);
      if (!found) return;
      show(pick(v, found, size));
      if (found.name && needsName) {
        fallbackName.textContent = found.name;
        mono.dataset.letter = found.name.trim().slice(0, 1).toUpperCase();
        onMeta?.(found);
      }
    });
  }
  return wrap;
}

function progressBar(v, { compact = false } = {}) {
  const pct = percentOf(v);
  const fill = h('span', { class: 'bar-fill' });
  fill.style.setProperty('--pct', `${pct}%`);
  const bar = h('span', { class: 'bar', role: 'img', 'aria-label': t('items.percent', { pct }) }, fill);
  if (compact) return bar;
  return h('div', { class: 'progress' }, bar,
    h('span', { class: 'progress-text' }, t('items.positionOf', { pos: formatClock(v.position), dur: formatClock(v.duration) })));
}

// ------------------------------------------------------------------ view

function render(ctx, id) {
  const kind = KIND[id];
  const p = ctx.profile;
  const head = pageHeader({ eyebrow: t('common.profileEyebrow', { name: p.name }), title: t('nav.library'), lede: t(`items.${id}.lede`) });

  const shelves = h('nav', { class: 'shelves', 'aria-label': t('library.shelves') },
    SHELVES.map(([key, href]) => h('a', { href: ctx.accountUrl(href), 'data-link': '', class: 'shelf', 'aria-current': key === id ? 'page' : undefined },
      icon(key === 'library' ? 'library' : key, { size: 16 }), h('span', {}, t(`nav.${key}`)))));

  const listHost = h('div', { class: 'items-host' });
  const status = h('p', { class: 'list-status', 'aria-live': 'polite' });
  const more = button(t('items.loadMore'), { icon: 'down', onClick: () => page() });
  const filter = input({ type: 'search', placeholder: t('items.filterPlaceholder'), 'aria-label': t('items.filter'), autocomplete: 'off', spellcheck: 'false' });
  const clearFilter = iconButton('close', t('library.clearSearch'), () => { filter.value = ''; draw(); filter.focus(); });
  clearFilter.classList.add('search-clear');

  const sortOptions = [['recent', t(`library.sort.recent.${id}`)], ['az', t('library.sort.az')]];
  if (id === 'library') sortOptions.push(['year', t('library.sort.year')]);
  let sort = 'recent', type = 'all';
  let view = readPref('libraryView') === 'list' ? 'list' : 'grid';

  const sortSelect = select(sortOptions.map(([value, label]) => ({ value, label })), sort, { 'aria-label': t('library.sort') });
  sortSelect.addEventListener('change', () => { sort = sortSelect.value; draw(); });

  const typeChips = h('div', { class: 'type-chips', role: 'group', 'aria-label': t('library.type') },
    ['all', 'series', 'movie'].map(value => {
      const chip = h('button', { type: 'button', class: 'type-chip', 'aria-pressed': String(value === type), dataset: { type: value } }, t(`library.type.${value}`));
      chip.addEventListener('click', () => { type = value; for (const c of typeChips.children) c.setAttribute('aria-pressed', String(c.dataset.type === type)); draw(); });
      return chip;
    }));

  const viewToggle = h('div', { class: 'seg', role: 'group', 'aria-label': t('library.viewLabel') },
    ['grid', 'list'].map(value => {
      const b = h('button', { type: 'button', class: 'seg-btn', 'aria-pressed': String(value === view), 'aria-label': t(`library.view.${value}`), dataset: { view: value } },
        icon(value === 'grid' ? 'grid' : 'list', { size: 16 }));
      b.addEventListener('click', () => {
        view = value; writePref('libraryView', value);
        for (const x of viewToggle.children) x.setAttribute('aria-pressed', String(x.dataset.view === view));
        draw();
      });
      return b;
    }));

  let rows = [], cursor = null, done = false, total = null, busy = false, searching = false, filling = false;

  filter.addEventListener('input', () => { draw(); if (filter.value.trim()) loadAllForSearch(); });

  /** Fetch the next page; true when it arrived. */
  async function page({ reset = false } = {}) {
    if (busy) return true;
    let ok = false;
    busy = true; more.disabled = true;
    if (reset) { rows = []; cursor = null; done = false; listHost.replaceChildren(loading(8, 'item')); }
    try {
      const data = await ctx.api.items(ctx.profileId, kind, cursor, PAGE, { signal: ctx.signal });
      const firstNew = rows.length;
      rows.push(...data.items);
      cursor = data.next_cursor;
      done = data.items.length < PAGE || !data.next_cursor;
      draw();
      ok = true;
      // Keep keyboard users in place: focus the first newly loaded title.
      if (!reset && !searching && !filling && data.items.length) listHost.querySelectorAll('.item-row')[firstNew]?.querySelector('.item-open')?.focus();
    } catch (error) {
      if (ctx.signal.aborted || error.kind === 'auth' || error.kind === 'aborted') return;
      if (reset) listHost.replaceChildren(errorState(error, { onRetry: () => page({ reset: true }) }));
      else status.replaceChildren(errorState(error, { onRetry: () => page() }));
    } finally {
      busy = false; more.disabled = false;
    }
    return ok;
  }

  /** A search covers the whole shelf: fetch what isn't loaded yet, one page at a time. */
  async function loadAllForSearch() {
    if (searching || done) return;
    searching = true; draw();
    try {
      while (!done && rows.length < SEARCH_LIMIT && filter.value.trim() && !ctx.signal.aborted) {
        if (busy) { await new Promise(r => setTimeout(r, 50)); continue; }
        if (!(await page())) break;
      }
    } finally { searching = false; draw(); }
  }

  async function loadTotal() {
    try { total = (await ctx.api.overview(ctx.profileId, { signal: ctx.signal }))[COUNT_FIELD[id]]; draw(); } catch { /* optional */ }
  }

  function visibleRows() {
    const q = filter.value.trim().toLowerCase();
    let list = rows;
    if (type !== 'all') list = list.filter(r => r.value?.content_type === type);
    if (q) list = list.filter(r => nameOf(r.value).toLowerCase().includes(q));
    if (sort === 'az') list = [...list].sort((a, b) => nameOf(a.value).localeCompare(nameOf(b.value)));
    else if (sort === 'recent') list = [...list].sort((a, b) => stamp(whenOf(id, b.value)) - stamp(whenOf(id, a.value)));
    else if (sort === 'year') list = [...list].sort((a, b) => (yearOf(b.value) ?? -1) - (yearOf(a.value) ?? -1));
    return list;
  }

  function draw() {
    const visible = visibleRows();
    const filtered = filter.value.trim() || type !== 'all';
    clearFilter.hidden = !filter.value;
    if (!rows.length && !busy) {
      replace(listHost, emptyState({ title: t(`items.${id}.emptyTitle`), body: t(`items.${id}.emptyBody`), iconName: id }));
    } else if (!rows.length) {
      return;
    } else if (!visible.length) {
      replace(listHost, emptyState({ title: searching ? t('library.searching', { total: formatNumber(total ?? rows.length) }) : t('items.noMatch'),
        body: searching ? '' : t('items.noMatchBody'),
        action: searching ? null : button(t('library.clearFilters'), { size: 's', onClick: () => { filter.value = ''; type = 'all'; for (const c of typeChips.children) c.setAttribute('aria-pressed', String(c.dataset.type === 'all')); draw(); } }) }));
    } else {
      replace(listHost, h('ul', { role: 'list', class: ['items', view === 'grid' ? 'items-grid' : 'items-list'] }, visible.map(row)));
    }
    if (searching) status.textContent = t('library.searching', { total: formatNumber(total ?? rows.length) });
    else if (filtered) status.textContent = t('library.matches', { n: formatNumber(visible.length), loaded: formatNumber(rows.length) });
    else status.textContent = total !== null
      ? t('items.showing', { n: formatNumber(rows.length), total: formatNumber(total) })
      : t('items.showingSome', { n: formatNumber(rows.length) });
    more.hidden = done || Boolean(filter.value.trim());
  }

  function actionsFor(r, name) {
    const writable = ctx.canWrite();
    const actions = [];
    if (id === 'progress') actions.push(iconButton('edit', t('items.editPosition', { name }), () => editPosition(r), { disabled: !writable }));
    actions.push(iconButton('trash', t(`items.${id}.remove`, { name }), () => removeRow(r), { disabled: !writable }));
    return h('div', { class: 'item-actions' }, actions);
  }

  function metaLine(v) {
    const when = whenOf(id, v);
    const meta = [typeOf(v), episodeOf(v), id === 'library' ? v.release_info : null].filter(Boolean).join(' · ');
    return h('p', { class: 'item-meta' }, meta,
      when ? [meta ? ' · ' : '', h('time', { datetime: new Date(when).toISOString(), title: formatDate(when) }, formatRelative(when))] : null);
  }

  function row(r) {
    const v = r.value ?? {};
    const name = nameOf(v);
    const title = h('p', { class: 'item-name' }, name);
    let open, actions;
    // When a lookup finds the name of a title the app synced only by id, the
    // visible name and the buttons' labels follow.
    const onMeta = found => {
      title.textContent = found.name;
      open.setAttribute('aria-label', t('library.details', { name: found.name }));
      actions.replaceWith(actions = actionsFor(r, found.name));
    };
    open = h('button', { type: 'button', class: 'item-open', 'aria-label': t('library.details', { name }), onclick: () => details(r) },
      posterArt(v, { size: view === 'grid' ? 'poster' : 'thumb', meta: ctx.meta, onMeta }),
      id === 'progress' && view === 'grid' ? h('span', { class: 'poster-bar' }, progressBar(v, { compact: true })) : null);
    actions = actionsFor(r, name);
    if (view === 'grid') {
      return h('li', { class: 'item-row item-tile', dataset: { key: r.key } }, open,
        h('div', { class: 'tile-foot' },
          h('div', { class: 'tile-text' }, title, metaLine(v),
            id === 'progress' ? h('p', { class: 'progress-text' }, t('items.positionOf', { pos: formatClock(v.position), dur: formatClock(v.duration) })) : null),
          actions));
    }
    return h('li', { class: 'item-row', dataset: { key: r.key } }, open,
      h('div', { class: 'item-main' },
        title, metaLine(v),
        id === 'progress' ? progressBar(v) : null),
      actions);
  }

  /** Everything the app synced about one title, with its actions. */
  async function details(r) {
    const v = r.value ?? {};
    const name = nameOf(v);
    const when = whenOf(id, v);
    const rating = Number(v.imdb_rating);
    const content = h('div', { class: 'details' },
      h('div', { class: 'details-art' }, posterArt(v, { size: 'backdrop', meta: ctx.meta }), posterArt(v, { size: 'poster', meta: ctx.meta })),
      v.description ? h('p', { class: 'details-desc' }, String(v.description)) : null,
      id === 'progress' ? progressBar(v) : null,
      facts([
        [t('items.title'), name],
        typeOf(v) ? [t('library.typeLabel'), typeOf(v)] : null,
        episodeOf(v) ? [t('items.episodeLabel'), episodeOf(v)] : null,
        v.release_info ? [t('library.year'), String(v.release_info)] : null,
        Array.isArray(v.genres) && v.genres.length ? [t('library.genres'), v.genres.join(', ')] : null,
        Number.isFinite(rating) && rating > 0 ? [t('library.rating'), `${rating.toFixed(1)} / 10 · IMDb`] : null,
        when ? [t(`library.when.${id}`), formatDate(when)] : null,
      ]));
    const writable = ctx.canWrite();
    const actions = [{ label: t('common.close'), value: null }];
    if (id === 'progress' && writable) actions.push({ label: t('items.editTitle'), value: 'edit' });
    if (writable) actions.push({ label: t('common.remove'), value: 'remove', danger: true });
    const result = await openDialog({ title: name, description: [typeOf(v), episodeOf(v)].filter(Boolean).join(' · ') || undefined, content, wide: true, actions });
    if (result === 'edit') return editPosition(r);
    if (result === 'remove') return removeRow(r);
  }

  function focusRow(key) {
    listHost.querySelector(`[data-key="${CSS.escape(key)}"] .item-open`)?.focus();
  }

  async function editPosition(r, { conflictWith } = {}) {
    const v = r.value;
    const text = input({ value: formatClock(v.position), inputmode: 'numeric', spellcheck: 'false' });
    const range = h('input', { type: 'range', class: 'range', min: '0', max: String(Math.max(1, Math.round(v.duration / 1000))), step: '1', value: String(Math.round(v.position / 1000)), 'aria-label': t('items.slider') });
    const f = field({ label: t('items.position'), hint: t('items.positionHint', { dur: formatClock(v.duration) }), control: text });
    range.addEventListener('input', () => { text.value = formatClock(Number(range.value) * 1000); f.setError(null); });
    text.addEventListener('input', () => { const ms = parseClock(text.value); if (ms !== null) range.value = String(Math.round(ms / 1000)); });
    const quick = h('div', { class: 'row-actions' },
      button(t('items.startOver'), { size: 's', onClick: () => { text.value = formatClock(0); range.value = '0'; } }),
      button(t('items.finished'), { size: 's', onClick: () => { text.value = formatClock(v.duration); range.value = range.max; } }));
    const content = h('div', { class: 'stack' }, conflictWith ?? null, facts([[t('items.title'), nameOf(v)], episodeOf(v) ? [t('items.episodeLabel'), episodeOf(v)] : null]), f, range, quick);
    const result = await openDialog({ title: t('items.editTitle'), content, initialFocus: () => text,
      actions: [{ label: t('common.cancel'), value: null }, { label: t('common.save'), value: 'save', variant: 'accent' }] });
    if (result !== 'save') return;
    const ms = parseClock(text.value);
    if (ms === null || ms > v.duration) { announce(t('items.badPosition')); return editPosition(r, { conflictWith }); }
    const next = { ...v, position: ms, last_watched: Math.max(Date.now(), (v.last_watched ?? 0) + 1) };
    try {
      const saved = await ctx.api.saveItem(ctx.profileId, kind, next, r.updated_at, { signal: ctx.signal });
      Object.assign(r, { value: saved.value, updated_at: saved.updated_at });
      draw();
      focusRow(r.key);
      announce(t('common.saved'));
    } catch (error) {
      if (isConflict(error)) return itemConflict(r, next, 'edit');
      if (error.kind !== 'auth' && error.kind !== 'aborted') announce(t(`error.${error.kind}.title`));
    }
  }

  async function removeRow(r) {
    const name = nameOf(r.value);
    if (!(await confirmDialog({ title: t(`items.${id}.removeTitle`, { name }), body: t(`items.${id}.removeBody`), confirmLabel: t('common.remove'), danger: true }))) return;
    try {
      await ctx.api.deleteItem(ctx.profileId, kind, deleteKeyFor(kind, r.value), r.updated_at, { signal: ctx.signal });
      const before = visibleRows();
      const index = before.indexOf(r);
      rows.splice(rows.indexOf(r), 1);
      if (total !== null) total--;
      draw();
      const after = visibleRows();
      const next = after[Math.min(index, after.length - 1)];
      if (next) focusRow(next.key); else filter.focus();
      announce(t('items.removed', { name }));
    } catch (error) {
      if (isConflict(error)) return itemConflict(r, null, 'delete');
      if (error.kind !== 'auth' && error.kind !== 'aborted') announce(t(`error.${error.kind}.title`));
    }
  }

  /** Reload what is on screen, then show the other device's version next to yours. */
  async function itemConflict(r, mine, action) {
    const count = rows.length;
    try {
      const fresh = [];
      let after = null;
      while (fresh.length < count) {
        const data = await ctx.api.items(ctx.profileId, kind, after, PAGE, { signal: ctx.signal });
        fresh.push(...data.items);
        if (data.items.length < PAGE || !data.next_cursor) break;
        after = data.next_cursor;
      }
      rows = fresh; draw();
    } catch { /* fall through with what we have */ }
    const latest = rows.find(x => x.key === r.key);
    if (!latest) { announce(t('items.goneElsewhere')); return; }
    const theirs = latest.value;
    const describe = v => (id === 'progress' ? t('items.positionOf', { pos: formatClock(v.position), dur: formatClock(v.duration) }) : formatDate(v.watched_at ?? v.added_at));
    const compare = notice({ tone: 'warn', title: t('conflict.itemTitle'),
      body: action === 'edit' ? t('conflict.itemBody', { theirs: describe(theirs), mine: describe(mine) }) : t('conflict.itemDeleteBody', { theirs: describe(theirs) }) });
    if (action === 'edit') return editPosition(latest, { conflictWith: compare });
    const again = await openDialog({ title: t('conflict.itemTitle'), content: compare,
      actions: [{ label: t('conflict.keep'), value: null }, { label: t('common.remove'), value: 'remove', danger: true }] });
    if (again === 'remove') return removeRow(latest);
  }

  // Continue watching and History read newest first, and the server pages by
  // key, not by date, so those shelves load whole (up to SEARCH_LIMIT) before
  // the order means anything. The library keeps "Load more".
  async function open() {
    if (!(await page({ reset: true })) || id === 'library') return;
    filling = true;
    try {
      while (!done && rows.length < SEARCH_LIMIT && !ctx.signal.aborted) {
        if (busy) { await new Promise(r => setTimeout(r, 50)); continue; }
        if (!(await page())) break;
      }
    } finally { filling = false; }
  }

  refetchOnReturn(ctx, open);
  open();
  loadTotal();

  const toolbar = h('div', { class: 'lib-toolbar' },
    h('div', { class: 'search' }, icon('search', { size: 16 }), filter, clearFilter),
    h('label', { class: 'sort' }, h('span', { class: 'sort-label' }, t('library.sort')), sortSelect),
    viewToggle);
  return h('section', { class: 'page page-library' }, head.el, shelves, readOnlyNotice(ctx), toolbar,
    h('div', { class: 'lib-sub' }, typeChips, status), listHost, h('div', { class: 'more' }, more));
}
