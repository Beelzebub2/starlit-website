// Library, resume points and watched history. Lists use the server's keyset
// cursor ("Load more"), never page numbers. Each edit or removal sends the
// updated_at you saw; if the item changed elsewhere you get both versions to
// compare before anything is written again.
import { h, icon, replace } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { deleteKeyFor } from '../lib/api.js';
import { isConflict } from '../lib/errors.js';
import { formatClock, formatDate, formatNumber, formatRelative, parseClock } from '../lib/format.js';
import { announce, button, confirmDialog, emptyState, errorState, facts, field, iconButton, input, loading, notice, openDialog, pageHeader } from '../lib/ui.js';
import { readOnlyNotice, refetchOnReturn } from './common.js';

const PAGE = 25;
const KIND = { library: 'library', progress: 'watch_progress', history: 'watched_items' };
const COUNT_FIELD = { library: 'library_items', progress: 'watch_progress', history: 'watched_records' };

function makeView(id) {
  return { title: () => t(`nav.${id}`), render: ctx => render(ctx, id) };
}
export const library = makeView('library');
export const progress = makeView('progress');
export const history = makeView('history');

const nameOf = v => v?.name || v?.title || v?.content_id || '—';
const episodeOf = v => (v?.season != null && v?.episode != null ? t('items.episode', { s: v.season, e: v.episode }) : null);
const typeOf = v => (v?.content_type === 'movie' ? t('items.movie') : v?.content_type === 'series' ? t('items.series') : v?.content_type ?? '');

function render(ctx, id) {
  const kind = KIND[id];
  const p = ctx.profile;
  const head = pageHeader({ eyebrow: t('common.profileEyebrow', { name: p.name }), title: t(`nav.${id}`), lede: t(`items.${id}.lede`) });
  const listHost = h('div', {});
  const status = h('p', { class: 'list-status', 'aria-live': 'polite' });
  const more = button(t('items.loadMore'), { icon: 'down', onClick: () => page() });
  const filter = input({ type: 'search', placeholder: t('items.filterPlaceholder'), 'aria-label': t('items.filter') });
  let rows = [], cursor = null, done = false, total = null, busy = false;

  filter.addEventListener('input', draw);

  async function page({ reset = false } = {}) {
    if (busy) return;
    busy = true; more.disabled = true;
    if (reset) { rows = []; cursor = null; done = false; listHost.replaceChildren(loading(8, 'item')); }
    try {
      const data = await ctx.api.items(ctx.profileId, kind, cursor, PAGE, { signal: ctx.signal });
      const firstNew = rows.length;
      rows.push(...data.items);
      cursor = data.next_cursor;
      done = data.items.length < PAGE || !data.next_cursor;
      draw();
      // Keep keyboard users in place: focus the first newly loaded row.
      if (!reset && data.items.length) listHost.querySelectorAll('.item-row')[firstNew]?.focus();
    } catch (error) {
      if (ctx.signal.aborted || error.kind === 'auth' || error.kind === 'aborted') return;
      if (reset) listHost.replaceChildren(errorState(error, { onRetry: () => page({ reset: true }) }));
      else status.replaceChildren(errorState(error, { onRetry: () => page() }));
    } finally {
      busy = false; more.disabled = false;
    }
  }

  async function loadTotal() {
    try { total = (await ctx.api.overview(ctx.profileId, { signal: ctx.signal }))[COUNT_FIELD[id]]; draw(); } catch { /* optional */ }
  }

  function draw() {
    const q = filter.value.trim().toLowerCase();
    const visible = q ? rows.filter(r => nameOf(r.value).toLowerCase().includes(q)) : rows;
    if (!rows.length) {
      replace(listHost, emptyState({ title: t(`items.${id}.emptyTitle`), body: t(`items.${id}.emptyBody`), iconName: id }));
    } else if (!visible.length) {
      replace(listHost, emptyState({ title: t('items.noMatch'), body: t('items.noMatchBody') }));
    } else {
      replace(listHost, h('ul', { role: 'list', class: 'items' }, visible.map(row)));
    }
    status.textContent = total !== null
      ? t('items.showing', { n: formatNumber(rows.length), total: formatNumber(total) })
      : t('items.showingSome', { n: formatNumber(rows.length) });
    more.hidden = done;
  }

  function row(r) {
    const v = r.value ?? {};
    const name = nameOf(v);
    const meta = [typeOf(v), episodeOf(v), id === 'library' ? v.release_info : null].filter(Boolean).join(' · ');
    const when = id === 'library' ? v.added_at : id === 'progress' ? v.last_watched : v.watched_at;
    const writable = ctx.canWrite();
    const actions = [];
    if (id === 'progress') actions.push(iconButton('edit', t('items.editPosition', { name }), () => editPosition(r), { disabled: !writable }));
    actions.push(iconButton('trash', t(`items.${id}.remove`, { name }), () => removeRow(r), { disabled: !writable }));
    return h('li', { class: 'item-row', tabindex: '-1', dataset: { key: r.key } },
      h('span', { class: 'monogram', 'aria-hidden': 'true' }, name.trim().slice(0, 1).toUpperCase()),
      h('div', { class: 'item-main' },
        h('p', { class: 'item-name' }, name),
        h('p', { class: 'item-meta' }, meta, when ? [meta ? ' · ' : '', h('time', { datetime: new Date(when).toISOString(), title: formatDate(when) }, formatRelative(when))] : null),
        id === 'progress' ? progressBar(v) : null),
      h('div', { class: 'item-actions' }, actions));
  }

  function progressBar(v) {
    const pct = v.duration > 0 ? Math.min(100, Math.round((v.position / v.duration) * 100)) : 0;
    const bar = h('span', { class: 'bar-fill' });
    bar.style.setProperty('--pct', `${pct}%`);
    return h('div', { class: 'progress' },
      h('span', { class: 'bar', role: 'img', 'aria-label': t('items.percent', { pct }) }, bar),
      h('span', { class: 'progress-text' }, t('items.positionOf', { pos: formatClock(v.position), dur: formatClock(v.duration) })));
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
    let ms = null;
    const result = await openDialog({ title: t('items.editTitle'), content, initialFocus: () => text,
      actions: [{ label: t('common.cancel'), value: null }, { label: t('common.save'), value: 'save', variant: 'accent' }] });
    if (result !== 'save') return;
    ms = parseClock(text.value);
    if (ms === null || ms > v.duration) { announce(t('items.badPosition')); return editPosition(r, { conflictWith }); }
    const next = { ...v, position: ms, last_watched: Math.max(Date.now(), (v.last_watched ?? 0) + 1) };
    try {
      const saved = await ctx.api.saveItem(ctx.profileId, kind, next, r.updated_at, { signal: ctx.signal });
      Object.assign(r, { value: saved.value, updated_at: saved.updated_at });
      draw();
      listHost.querySelector(`[data-key="${CSS.escape(r.key)}"]`)?.focus();
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
      const index = rows.indexOf(r);
      rows.splice(index, 1);
      if (total !== null) total--;
      draw();
      (listHost.querySelectorAll('.item-row')[Math.min(index, rows.length - 1)] ?? filter).focus();
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

  refetchOnReturn(ctx, () => page({ reset: true }));
  page({ reset: true });
  loadTotal();

  const toolbar = h('div', { class: 'toolbar' }, h('div', { class: 'toolbar-filter' }, icon('search', { size: 16 }), filter), status);
  return h('section', { class: 'page' }, head.el, readOnlyNotice(ctx), toolbar, listHost, h('div', { class: 'more' }, more));
}
