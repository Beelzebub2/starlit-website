// Addons and plugins: a staged list editor. Nothing is written until you press
// Save; the save sends the whole list with the revision you loaded, and a 409
// (changed on another device) loads the latest list and re-applies your edits
// for review instead of overwriting.
import { h, icon, replace } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { isConflict } from '../lib/errors.js';
import { equal, mergeLists, clone } from '../lib/merge.js';
import { redactUrl } from '../lib/redact.js';
import { announce, button, confirmDialog, emptyState, errorState, field, iconButton, input, loading, notice, openDialog, pageHeader, saveBar, toggle } from '../lib/ui.js';
import { readOnlyNotice, refetchOnReturn, section } from './common.js';

function makeView(kind) {
  return {
    title: () => t(`nav.${kind}`),
    render: ctx => render(ctx, kind),
  };
}
export const addons = makeView('addons');
export const plugins = makeView('plugins');

function render(ctx, kind) {
  const p = ctx.profile;
  const head = pageHeader({ eyebrow: t('common.profileEyebrow', { name: p.name }), title: t(`nav.${kind}`), lede: t(`ext.${kind}.lede`) });
  const host = h('div', {});
  const conflictHost = h('div', {});
  const bar = saveBar({ onSave: save, onDiscard: discard });
  let base = [], draft = [], removed = [], revision = 0, busy = false, loaded = false, addOpen = false;

  ctx.isDirty = () => changeCount() > 0;

  const shared = kind === 'addons' ? p.uses_primary_addons : p.uses_primary_plugins;
  const sharedNotice = shared && p.profile_index !== 1
    ? notice({ tone: 'info', title: t(`ext.${kind}.sharedTitle`), body: t(`ext.${kind}.sharedBody`),
      actions: button(t('ext.openPrimary'), { onClick: () => ctx.selectProfile(1, { to: `/${kind}` }) }) })
    : null;

  function changeCount() {
    if (!loaded) return 0;
    const b = new Map(base.map(x => [x.url, x]));
    let n = removed.length;
    for (const item of draft) {
      const was = b.get(item.url);
      if (!was) n++;
      else if (was.enabled !== item.enabled || (was.name ?? '') !== (item.name ?? '')) n++;
    }
    const order = list => list.map(x => x.url).filter(u => draft.some(d => d.url === u) && base.some(x => x.url === u));
    if (!equal(order(base), order(draft))) n++;
    return n;
  }

  function sync() {
    bar.set({ count: changeCount(), busy, blockedReason: ctx.canWrite() ? null : ctx.config.writesEnabled ? t('banner.offlineTitle') : t('banner.readonlyTitle') });
  }

  async function load() {
    host.replaceChildren(loading(4, 'card'));
    try {
      const data = await ctx.api.extensions(ctx.profileId, kind, { signal: ctx.signal });
      base = data.items; draft = clone(data.items); removed = []; revision = data.revision; loaded = true; addOpen = false;
      conflictHost.replaceChildren();
      draw();
    } catch (error) {
      if (ctx.signal.aborted || error.kind === 'auth' || error.kind === 'aborted') return;
      host.replaceChildren(errorState(error, { onRetry: load }));
    }
  }

  function move(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= draft.length) return;
    [draft[index], draft[target]] = [draft[target], draft[index]];
    draw(`${draft[target].url}|${delta < 0 ? 'up' : 'down'}`);
    announce(t('ext.moved', { name: draft[target].name || redactUrl(draft[target].url).display, pos: target + 1, total: draft.length }));
  }

  function draw(focusKey) {
    const writable = ctx.canWrite() && !busy;
    const toolbar = h('div', { class: 'ext-toolbar' },
      h('p', { class: 'ext-count', 'aria-live': 'polite' },
        h('span', { class: 'ext-count-number' }, String(draft.length)),
        h('span', { class: 'ext-count-label' }, t(`ext.${kind}.configured`, { n: draft.length }))),
      h('div', { class: 'ext-toolbar-actions' },
        button(t('ext.refresh'), { icon: 'refresh', size: 's', onClick: refresh, disabled: busy }),
        button(t('ext.deleteAll'), { variant: 'danger', icon: 'trash', size: 's', disabled: !writable || draft.length === 0, onClick: deleteAll }),
        button(t(`ext.${kind}.addAction`), { variant: 'accent', icon: 'plus', size: 's', disabled: !writable, onClick: openAdd })));
    const rows = draft.map((item, i) => {
      const was = base.find(b => b.url === item.url);
      const { display, hidden } = redactUrl(item.url);
      const nameId = `ext-name-${i}`;
      return h('li', { class: ['ext-row', !was && 'ext-new', item.enabled === false && 'ext-off'], dataset: { key: item.url } },
        h('span', { class: 'ext-pos', 'aria-hidden': 'true' }, String(i + 1).padStart(2, '0')),
        h('div', { class: 'ext-main' },
          h('p', { class: 'ext-name', id: nameId }, item.name || t('ext.unnamed'), !was ? h('span', { class: 'pill pill-ok' }, t('ext.new')) : null),
          h('p', { class: 'ext-url' }, hidden ? icon('lock', { size: 13, label: t('ext.hiddenParts') }) : null, h('code', {}, display))),
        h('div', { class: 'ext-controls' },
          toggle({ label: t('ext.enabled'), checked: item.enabled !== false, disabled: !writable, onChange: v => { item.enabled = v; sync(); } }),
          h('div', { class: 'ext-buttons', role: 'group', 'aria-labelledby': nameId },
            withKey(iconButton('up', t('ext.moveUp', { name: item.name || display }), () => move(i, -1), { disabled: !writable || i === 0 }), `${item.url}|up`),
            withKey(iconButton('down', t('ext.moveDown', { name: item.name || display }), () => move(i, 1), { disabled: !writable || i === draft.length - 1 }), `${item.url}|down`),
            iconButton('edit', t('ext.rename', { name: item.name || display }), () => rename(item), { disabled: !writable }),
            iconButton('copy', t('ext.copy', { name: item.name || display }), () => copy(item.url)),
            withKey(iconButton('trash', t('ext.remove', { name: item.name || display }), () => remove(i), { disabled: !writable }), `${item.url}|remove`))));
    });

    const list = draft.length
      ? h('ol', { class: 'ext-list', role: 'list', 'aria-label': t(`nav.${kind}`) }, rows)
      : emptyState({ title: t(`ext.${kind}.emptyTitle`), body: t(`ext.${kind}.emptyBody`), iconName: kind,
        action: writable ? button(t(`ext.${kind}.addFirst`), { icon: 'plus', variant: 'accent', onClick: openAdd }) : null });
    const removedList = removed.length ? h('div', { class: 'removed' }, h('h3', { class: 'sub-title' }, t('ext.removedTitle', { n: removed.length })),
      h('ul', { role: 'list', class: 'removed-list' }, removed.map((item, i) => h('li', {}, h('span', {}, item.name || redactUrl(item.url).display),
        button(t('common.undo'), { size: 's', onClick: () => { draft.push(removed.splice(i, 1)[0]); draw(); } }))))) : null;

    replace(host, toolbar, list, removedList, addOpen ? addForm(writable) : null);
    sync();
    if (focusKey) host.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus();
  }

  function withKey(el, key) { el.dataset.focusKey = key; return el; }

  function openAdd() {
    if (!ctx.canWrite() || busy) return;
    addOpen = true;
    draw();
    const el = host.querySelector('.add-form input[type="url"]');
    el?.scrollIntoView({ block: 'center' });
    el?.focus({ preventScroll: true });
  }

  async function refresh() {
    if (busy) return;
    const formHasText = addOpen && [...host.querySelectorAll('.add-form input')].some(el => el.value.trim());
    if ((changeCount() || formHasText) && !(await confirmDialog({
      title: t('ext.refreshTitle'), body: t('ext.refreshBody'), confirmLabel: t('common.discard'), danger: true,
    }))) return;
    await load();
  }

  async function deleteAll() {
    if (!ctx.canWrite() || busy || !draft.length) return;
    if (!(await confirmDialog({
      title: t('ext.deleteAllTitle', { type: t(`ext.${kind}.type`) }),
      body: t('ext.deleteAllBody'), confirmLabel: t('ext.deleteAll'),
      danger: true, typed: t('ext.deletePhrase'),
    }))) return;
    draft = [];
    // Remove only saved rows on commit; new unsaved rows simply disappear.
    removed = clone(base);
    addOpen = false;
    draw();
    announce(t('ext.deleteAllStaged'));
  }

  function addForm(writable) {
    const url = input({ type: 'url', inputmode: 'url', placeholder: 'https://', spellcheck: 'false', autocapitalize: 'none' });
    const name = input({ maxlength: '512' });
    const urlField = field({ label: t('ext.addUrl'), hint: t('ext.addUrlHint'), control: url });
    const nameField = field({ label: t('ext.addName'), hint: t('ext.addNameHint'), control: name, optional: true });
    const form = h('form', { class: 'add-form', novalidate: true, onsubmit: e => {
      e.preventDefault();
      const value = url.value.trim();
      let problem = null;
      try {
        const parsed = new URL(value);
        if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname))) problem = t('ext.httpsOnly');
      } catch { problem = t('ext.badUrl'); }
      if (!problem && value.length > 8192) problem = t('ext.tooLong');
      if (!problem && [...draft, ...removed].some(x => x.url === value)) problem = t('ext.duplicate');
      urlField.setError(problem);
      if (problem) { url.focus(); return; }
      draft.push({ url: value, name: name.value.trim(), enabled: true, sort_order: draft.length });
      url.value = ''; name.value = '';
      addOpen = false;
      draw();
      announce(t('ext.added'));
      host.querySelector('.ext-toolbar-actions .btn-accent')?.focus();
    } }, h('div', { class: 'add-grid' }, urlField, nameField), button(t('ext.add'), { icon: 'plus', type: 'submit', disabled: !writable }));
    return section(t(`ext.${kind}.addTitle`), form, { id: `add-${kind}` });
  }

  async function rename(item) {
    const control = input({ value: item.name ?? '', maxlength: '512' });
    const value = await openDialog({
      title: t('ext.renameTitle'), content: field({ label: t('ext.addName'), control }), initialFocus: () => control,
      actions: [{ label: t('common.cancel'), value: null }, { label: t('common.apply'), value: 'ok', variant: 'accent' }],
    });
    if (value === 'ok') { item.name = control.value.trim(); draw(); }
  }

  async function copy(url) {
    try { await navigator.clipboard.writeText(url); announce(t('ext.copied')); }
    catch { announce(t('ext.copyFailed')); }
  }

  function remove(index) {
    const [item] = draft.splice(index, 1);
    if (base.some(b => b.url === item.url)) removed.push(item);
    draw();
    announce(t('ext.removedOne', { name: item.name || redactUrl(item.url).display }));
    (host.querySelectorAll('.ext-row')[Math.min(index, draft.length - 1)]?.querySelector('[data-focus-key$="|remove"]') ?? host.querySelector('input'))?.focus();
  }

  async function discard() {
    if (!(await confirmDialog({ title: t('discard.title'), body: t('discard.body'), confirmLabel: t('common.discard'), danger: true }))) return;
    draft = clone(base); removed = []; conflictHost.replaceChildren(); draw();
  }

  async function save() {
    if (!ctx.canWrite() || busy) return;
    busy = true; sync();
    const items = draft.map((x, i) => ({ url: x.url, name: x.name ?? '', enabled: x.enabled !== false, sort_order: i }));
    try {
      const result = await ctx.api.saveExtensions(ctx.profileId, kind, items, revision, { signal: ctx.signal });
      base = result.items; draft = clone(result.items); removed = []; revision = result.revision;
      conflictHost.replaceChildren();
      busy = false; draw();
      announce(t('common.saved'));
    } catch (error) {
      busy = false;
      if (isConflict(error)) return resolveConflict();
      if (error.kind === 'auth' || error.kind === 'aborted') return;
      conflictHost.replaceChildren(errorState(error, { onRetry: save }));
      draw();
    }
  }

  async function resolveConflict() {
    conflictHost.replaceChildren(loading(1));
    try {
      const latest = await ctx.api.extensions(ctx.profileId, kind, { signal: ctx.signal });
      const merged = mergeLists({ base, mine: draft, theirs: latest.items, key: x => x.url,
        compare: (a, b) => a.enabled === b.enabled && (a.name ?? '') === (b.name ?? '') });
      const theirsSnapshot = latest.items;
      base = latest.items; revision = latest.revision;
      draft = merged.items.map(x => ({ ...x })); removed = removed.filter(r => base.some(b => b.url === r.url));
      draw();
      const s = merged.summary;
      const compare = h('details', { class: 'compare' }, h('summary', {}, t('conflict.compare')),
        h('div', { class: 'compare-grid' },
          h('div', {}, h('h4', {}, t('conflict.theirs')), h('ol', {}, theirsSnapshot.map(x => h('li', { class: x.enabled === false ? 'muted' : '' }, x.name || redactUrl(x.url).display)))),
          h('div', {}, h('h4', {}, t('conflict.yours')), h('ol', {}, draft.map(x => h('li', { class: x.enabled === false ? 'muted' : '' }, x.name || redactUrl(x.url).display))))));
      const picks = merged.conflicts.map(c => h('li', {}, h('span', {}, c.mine.name || redactUrl(c.key).display),
        button(t('conflict.useMine'), { size: 's', onClick: e => {
          const i = draft.findIndex(x => x.url === c.key);
          if (i >= 0) draft[i] = { ...c.mine };
          e.currentTarget.disabled = true; draw();
        } })));
      conflictHost.replaceChildren(notice({ tone: 'warn', live: true, title: t('conflict.title'),
        body: t('conflict.listBody', { changed: s.changed, added: s.added, removed: s.removed, incoming: s.incoming }),
        actions: [compare, picks.length ? h('div', {}, h('p', {}, t('conflict.both', { n: picks.length })), h('ul', { role: 'list', class: 'pick-list' }, picks)) : null] }));
      conflictHost.querySelector('.notice')?.setAttribute('tabindex', '-1');
      conflictHost.querySelector('.notice')?.focus();
    } catch (error) {
      if (error.kind === 'auth' || error.kind === 'aborted') return;
      conflictHost.replaceChildren(errorState(error, { onRetry: resolveConflict }));
    }
  }

  // Warn (without touching your edits) when the list changed on another device.
  refetchOnReturn(ctx, async () => {
    if (!loaded) return;
    try {
      const latest = await ctx.api.extensions(ctx.profileId, kind, { signal: ctx.signal });
      if (latest.revision === revision) return;
      if (changeCount() === 0) { base = latest.items; draft = clone(latest.items); revision = latest.revision; draw(); return; }
      conflictHost.replaceChildren(notice({ tone: 'info', title: t('conflict.aheadTitle'), body: t('conflict.aheadBody') }));
    } catch { /* the next save reports problems */ }
  }, 0);
  load();
  return h('section', { class: 'page page-editor' }, head.el, readOnlyNotice(ctx), sharedNotice, conflictHost, host, bar.el);
}
