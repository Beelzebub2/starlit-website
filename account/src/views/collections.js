// Collections list: order, duplicate, remove, import and export, saved as one
// array with the revision you loaded. Editing a single collection opens the
// full-page editor (collection-editor.js).
import { h, replace } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { isConflict } from '../lib/errors.js';
import { formatRelative, formatDate } from '../lib/format.js';
import { clone, equal, mergeLists } from '../lib/merge.js';
import { normalize, parseImport, sourcesOf, stats, validate, newId } from '../lib/collections.js';
import { announce, button, confirmDialog, emptyState, errorState, field, iconButton, link, loading, notice, openDialog, pageHeader, pill, saveBar } from '../lib/ui.js';
import { readOnlyNotice, refetchOnReturn } from './common.js';
import { issueText } from './collection-editor.js';

export default {
  title: () => t('nav.collections'),
  render(ctx) {
    const p = ctx.profile;
    const head = pageHeader({ eyebrow: t('common.profileEyebrow', { name: p.name }), title: t('nav.collections'), lede: t('coll.lede'),
      actions: link(t('coll.new'), '/collections/new', { variant: 'accent', icon: 'plus' }) });
    const host = h('div', {});
    const messages = h('div', {});
    const bar = saveBar({ onSave: save, onDiscard: discard });
    let base = [], draft = [], revision = 0, updatedAt = null, loaded = false, busy = false;

    ctx.isDirty = () => loaded && !equal(base, draft);
    const sync = () => bar.set({ count: ctx.isDirty() ? 1 : 0, busy, blockedReason: ctx.canWrite() ? null : t('banner.readonlyTitle') });

    async function load() {
      host.replaceChildren(loading(3, 'card'));
      try {
        const data = await ctx.api.blob(ctx.profileId, 'collections', null, { signal: ctx.signal });
        base = Array.isArray(data.value) ? data.value : []; draft = clone(base); revision = data.revision; updatedAt = data.updated_at; loaded = true;
        draw();
      } catch (error) {
        if (ctx.signal.aborted || error.kind === 'auth' || error.kind === 'aborted') return;
        host.replaceChildren(errorState(error, { onRetry: load }));
      }
    }

    function draw(focusKey) {
      const s = stats(draft);
      const writable = ctx.canWrite() && !busy;
      const summary = h('p', { class: 'ledger-line' },
        h('span', {}, h('b', {}, String(s.collections)), ' ', t('coll.statCollections', { n: s.collections })), h('span', { 'aria-hidden': 'true' }, ' · '),
        h('span', {}, h('b', {}, String(s.folders)), ' ', t('coll.statFolders', { n: s.folders })), h('span', { 'aria-hidden': 'true' }, ' · '),
        h('span', {}, h('b', {}, String(s.sources)), ' ', t('coll.statSources', { n: s.sources })),
        updatedAt ? h('span', { class: 'muted' }, ' — ', t('coll.updated'), ' ', h('time', { datetime: updatedAt, title: formatDate(updatedAt) }, formatRelative(updatedAt))) : null);
      const tools = h('div', { class: 'row-actions' },
        button(t('coll.export'), { icon: 'download', size: 's', onClick: exportJson, disabled: !draft.length }),
        button(t('coll.import'), { icon: 'upload', size: 's', onClick: importJson, disabled: !writable }),
        button(t('common.refresh'), { icon: 'refresh', size: 's', onClick: () => (ctx.isDirty() ? announce(t('coll.saveFirst')) : load()) }));
      const issues = validate(draft).filter(i => i.level === 'error');
      const list = draft.length ? h('ol', { role: 'list', class: 'coll-list' }, draft.map((c, i) => {
        const folderCount = c.folders?.length ?? 0;
        const sourceCount = (c.folders ?? []).reduce((n, f) => n + sourcesOf(f).length, 0);
        const own = issues.filter(x => x.at.collection === i).length;
        const key = c.id;
        return h('li', { class: 'coll-row', dataset: { key } },
          h('div', { class: 'coll-main' },
            h('p', { class: 'coll-title' }, c.title || t('coll.untitled'), c.pinToTop ? pill(t('coll.pinned'), 'ok') : null, own ? pill(t('coll.issues', { n: own }), 'warn') : null),
            h('p', { class: 'coll-meta' }, [t(`coll.view.${String(c.viewMode ?? 'TABBED_GRID').toUpperCase()}`), t('coll.folderCount', { n: folderCount }), t('coll.sourceCount', { n: sourceCount })].join(' · ')),
            h('p', { class: 'coll-folders' }, (c.folders ?? []).slice(0, 6).map(f => h('span', { class: 'chip' }, f.coverEmoji ? `${f.coverEmoji} ` : '', f.title || '—')))),
          h('div', { class: 'coll-actions', role: 'group', 'aria-label': c.title || t('coll.untitled') },
            link(t('common.edit'), `/collections/edit/${encodeURIComponent(c.id)}`, { variant: 'ghost', icon: 'edit' }),
            focusable(iconButton('up', t('coll.moveUp', { name: c.title }), () => move(i, -1), { disabled: !writable || i === 0 }), `${key}|up`),
            focusable(iconButton('down', t('coll.moveDown', { name: c.title }), () => move(i, 1), { disabled: !writable || i === draft.length - 1 }), `${key}|down`),
            iconButton('copy', t('coll.duplicate', { name: c.title }), () => duplicate(i), { disabled: !writable }),
            iconButton('trash', t('coll.remove', { name: c.title }), () => remove(i), { disabled: !writable })));
      })) : emptyState({ title: t('coll.emptyTitle'), body: t('coll.emptyBody'), iconName: 'collections',
        action: link(t('coll.new'), '/collections/new', { variant: 'accent', icon: 'plus' }) });
      replace(host, h('div', { class: 'coll-head' }, summary, tools), list,
        h('p', { class: 'muted small' }, t('coll.sourcesNote')));
      sync();
      if (focusKey) host.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus();
    }
    const focusable = (el, key) => { el.dataset.focusKey = key; return el; };

    function move(i, d) {
      const j = i + d;
      if (j < 0 || j >= draft.length) return;
      [draft[i], draft[j]] = [draft[j], draft[i]];
      draw(`${draft[j].id}|${d < 0 ? 'up' : 'down'}`);
      announce(t('ext.moved', { name: draft[j].title, pos: j + 1, total: draft.length }));
    }
    function duplicate(i) {
      const copy = clone(draft[i]);
      copy.id = newId();
      copy.title = t('coll.copyOf', { name: draft[i].title });
      for (const f of copy.folders ?? []) f.id = newId();
      draft.splice(i + 1, 0, copy);
      draw();
      announce(t('coll.duplicated'));
    }
    async function remove(i) {
      const c = draft[i];
      if (!(await confirmDialog({ title: t('coll.removeTitle', { name: c.title }), body: t('coll.removeBody'), confirmLabel: t('common.remove'), danger: true }))) return;
      draft.splice(i, 1);
      draw();
      announce(t('coll.removed', { name: c.title }));
    }

    function exportJson() {
      const blob = new Blob([JSON.stringify(normalize(draft), null, 2)], { type: 'application/json' });
      const a = h('a', { href: URL.createObjectURL(blob), download: `starlit-collections-profile-${ctx.profileId}.json` });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      announce(t('coll.exported'));
    }

    async function importJson() {
      const area = h('textarea', { class: 'input textarea mono', rows: '10', spellcheck: 'false' });
      const file = h('input', { type: 'file', accept: 'application/json,.json', class: 'file' });
      file.addEventListener('change', async () => { const f = file.files?.[0]; if (f && f.size < 1.2e6) area.value = await f.text(); });
      const mode = h('fieldset', { class: 'choice-group' }, h('legend', {}, t('coll.importMode')),
        h('label', { class: 'choice' }, h('input', { type: 'radio', name: 'import-mode', value: 'append', checked: true }), h('span', {}, t('coll.importAppend'))),
        h('label', { class: 'choice' }, h('input', { type: 'radio', name: 'import-mode', value: 'replace' }), h('span', {}, t('coll.importReplace'))));
      const result = h('div', { 'aria-live': 'polite' });
      const content = h('div', { class: 'stack' }, field({ label: t('coll.importFile'), control: file, optional: true }),
        field({ label: t('coll.importPaste'), hint: t('coll.importHint'), control: area }), mode, result);
      const choice = await openDialog({ title: t('coll.importTitle'), content, wide: true,
        actions: [{ label: t('common.cancel'), value: null }, { label: t('coll.importCheck'), value: 'go', variant: 'accent' }] });
      if (choice !== 'go') return;
      let incoming;
      try { incoming = parseImport(area.value); }
      catch (e) { announce(t(`coll.${e.message}`)); return; }
      const replaceAll = mode.querySelector('input:checked')?.value === 'replace';
      const next = replaceAll ? incoming : [...draft, ...incoming.filter(c => !draft.some(d => d.id === c.id))];
      const errors = validate(next).filter(i => i.level === 'error');
      if (errors.length) {
        await openDialog({ title: t('coll.importInvalid'), content: h('ul', { class: 'issue-list' }, errors.slice(0, 12).map(i => h('li', {}, issueText(i, next)))),
          actions: [{ label: t('common.close'), value: null }] });
        return;
      }
      draft = next;
      draw();
      announce(t('coll.imported', { n: incoming.length }));
    }

    async function discard() {
      if (!(await confirmDialog({ title: t('discard.title'), body: t('discard.body'), confirmLabel: t('common.discard'), danger: true }))) return;
      draft = clone(base); messages.replaceChildren(); draw();
    }

    async function save() {
      const errors = validate(draft).filter(i => i.level === 'error');
      if (errors.length) { messages.replaceChildren(notice({ tone: 'danger', live: true, title: t('coll.cannotSave', { n: errors.length }) })); return; }
      busy = true; sync();
      try {
        const result = await ctx.api.saveBlob(ctx.profileId, 'collections', null, normalize(draft), revision, { signal: ctx.signal });
        base = Array.isArray(result.value) ? result.value : []; draft = clone(base); revision = result.revision; updatedAt = result.updated_at;
        busy = false; messages.replaceChildren(); draw();
        announce(t('common.saved'));
      } catch (error) {
        busy = false; sync();
        if (isConflict(error)) return conflict();
        if (error.kind === 'auth' || error.kind === 'aborted') return;
        messages.replaceChildren(errorState(error, { onRetry: save }));
      }
    }

    async function conflict() {
      try {
        const latest = await ctx.api.blob(ctx.profileId, 'collections', null, { signal: ctx.signal });
        const theirs = Array.isArray(latest.value) ? latest.value : [];
        const merged = mergeLists({ base, mine: draft, theirs, key: c => c.id });
        base = theirs; revision = latest.revision; updatedAt = latest.updated_at; draft = merged.items;
        draw();
        const picks = merged.conflicts.map(c => h('li', {}, h('span', {}, c.mine.title),
          button(t('conflict.useMine'), { size: 's', onClick: e => { const i = draft.findIndex(x => x.id === c.key); if (i >= 0) draft[i] = c.mine; e.currentTarget.disabled = true; draw(); } })));
        const s = merged.summary;
        messages.replaceChildren(notice({ tone: 'warn', live: true, title: t('conflict.title'),
          body: t('conflict.listBody', { changed: s.changed, added: s.added, removed: s.removed, incoming: s.incoming }),
          actions: picks.length ? [h('p', {}, t('conflict.both', { n: picks.length })), h('ul', { role: 'list', class: 'pick-list' }, picks)] : null }));
      } catch (error) {
        if (error.kind !== 'auth' && error.kind !== 'aborted') messages.replaceChildren(errorState(error, { onRetry: conflict }));
      }
    }

    refetchOnReturn(ctx, () => { if (!ctx.isDirty()) load(); });
    load();
    return h('section', { class: 'page page-editor' }, head.el, readOnlyNotice(ctx), messages, host, bar.el);
  },
};
