// Synced settings blobs. Only values you change are touched: every other key,
// including ones from newer app builds, is sent back exactly as loaded.
// Device-specific values are read-only; credential-like keys are hidden and
// never sent from the web.
import { h, replace } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { isConflict } from '../lib/errors.js';
import { formatDate, formatRelative } from '../lib/format.js';
import { clone, equal, getAt, mergeObjects } from '../lib/merge.js';
import { changedPaths, humanize, sections, withValue, withoutCredentials } from '../lib/settings.js';
import { announce, button, confirmDialog, emptyState, errorState, input, loading, notice, pageHeader, pill, saveBar, select, toggle } from '../lib/ui.js';
import { readOnlyNotice, section } from './common.js';

const TARGETS = [
  ['profile_settings_blob', 'mobile'], ['profile_settings_blob', 'desktop'],
  ['home_catalog_settings', 'home_catalog_shared'], ['home_catalog_settings', 'mobile'], ['home_catalog_settings', 'desktop'],
];

export default {
  title: () => t('nav.settings'),
  render(ctx) {
    const p = ctx.profile;
    const head = pageHeader({ eyebrow: t('common.profileEyebrow', { name: p.name }), title: t('nav.settings'), lede: t('settings.lede') });
    const requested = TARGETS.findIndex(([s, pl]) => s === ctx.query.get('scope') && pl === ctx.query.get('platform'));
    let target = TARGETS[requested >= 0 ? requested : 0];
    let base = null, draft = null, revision = 0, updatedAt = null, loaded = false, busy = false, hidden = 0;
    const host = h('div', {});
    const messages = h('div', {});
    const bar = saveBar({ onSave: save, onDiscard: discard });
    ctx.isDirty = () => loaded && !equal(base, draft);

    const picker = select(TARGETS.map(([s, pl], i) => ({ value: String(i), label: t(`settings.target.${s}.${pl}`) })), String(TARGETS.indexOf(target)), { id: 'settings-target' });
    picker.addEventListener('change', async () => {
      const next = TARGETS[Number(picker.value)];
      if (ctx.isDirty() && !(await confirmDialog({ title: t('leave.title'), body: t('leave.body'), confirmLabel: t('leave.confirm'), danger: true }))) {
        picker.value = String(TARGETS.indexOf(target)); return;
      }
      target = next;
      history.replaceState({}, '', `/settings?scope=${target[0]}&platform=${target[1]}`);
      load();
    });

    const sync = () => {
      const count = loaded ? changedPaths(base, draft).length : 0;
      const blocked = !ctx.canWrite() ? t('banner.readonlyTitle') : hidden ? t('settings.blockedCredentials') : null;
      bar.set({ count, busy, blockedReason: count ? blocked : null });
    };

    async function load() {
      loaded = false; sync();
      host.replaceChildren(loading(8, 'setting'));
      messages.replaceChildren();
      try {
        const data = await ctx.api.blob(ctx.profileId, target[0], target[1], { signal: ctx.signal });
        base = data.value; draft = clone(data.value); revision = data.revision; updatedAt = data.updated_at; loaded = true;
        draw();
      } catch (error) {
        if (ctx.signal.aborted || error.kind === 'auth' || error.kind === 'aborted') return;
        host.replaceChildren(errorState(error, { onRetry: load }));
      }
    }

    function draw() {
      if (draft === null || typeof draft !== 'object') {
        replace(host, emptyState({ title: t('settings.emptyTitle'), body: t('settings.emptyBody', { target: t(`settings.target.${target[0]}.${target[1]}`) }), iconName: 'settings' }));
        sync();
        return;
      }
      const { groups, hiddenCredentials } = sections(draft);
      hidden = hiddenCredentials;
      const writable = ctx.canWrite() && !hidden;
      const changed = new Set(changedPaths(base, draft).map(p => JSON.stringify(p)));
      replace(host,
        h('p', { class: 'muted small' }, updatedAt ? [t('settings.lastSynced'), ' ', h('time', { datetime: updatedAt, title: formatDate(updatedAt) }, formatRelative(updatedAt))] : null),
        hidden ? notice({ tone: 'warn', title: t('settings.credentialsTitle', { n: hidden }), body: t('settings.credentialsBody') }) : null,
        groups.map(g => section(groupTitle(g.path), h('ul', { role: 'list', class: 'settings' }, g.items.map(item => row(item, writable, changed.has(JSON.stringify(item.path))))),
          { id: `set-${g.id.replace(/[^a-z0-9]+/gi, '-')}` })));
      sync();
    }

    function row(item, writable, isChanged) {
      const label = humanize(item.path.at(-1));
      const path = item.path;
      const set = value => { draft = withValue(draft, path, value); sync(); host.querySelector(`[data-path="${CSS.escape(JSON.stringify(path))}"]`)?.classList.toggle('setting-changed', !equal(getAt(base, path), value)); };
      let control;
      if (item.kind !== 'editable') {
        control = h('div', { class: 'setting-readonly' },
          h('code', { class: 'setting-value' }, item.value === null ? t('settings.notSet') : typeof item.value === 'string' ? truncate(item.value) : JSON.stringify(item.value).slice(0, 80)),
          pill(t(`settings.kind.${item.kind}`), item.kind === 'device' ? 'warn' : 'muted'));
      } else if (item.type === 'boolean') {
        control = toggle({ label, checked: item.value, disabled: !writable, onChange: set });
      } else if (item.type === 'number') {
        const el = input({ type: 'number', value: String(item.value), step: 'any', class: 'input input-short', 'aria-label': label, disabled: !writable });
        el.addEventListener('input', () => { if (el.value !== '' && Number.isFinite(Number(el.value))) set(Number(el.value)); });
        control = el;
      } else {
        const el = input({ value: String(item.value), maxlength: '500', 'aria-label': label, disabled: !writable });
        el.addEventListener('input', () => set(el.value));
        control = el;
      }
      return h('li', { class: ['setting', isChanged && 'setting-changed'], dataset: { path: JSON.stringify(path) } },
        item.type === 'boolean' && item.kind === 'editable' ? null : h('span', { class: 'setting-label' }, label),
        control,
        h('code', { class: 'setting-key' }, path.join('.')));
    }
    const truncate = s => (s.length > 60 ? `${s.slice(0, 57)}…` : s);
    const groupTitle = path => {
      const parts = path[0] === 'features' ? path.slice(1) : path;
      return parts.length ? parts.map(humanize).join(' › ') : t('settings.general');
    };

    async function discard() {
      if (!(await confirmDialog({ title: t('discard.title'), body: t('discard.body'), confirmLabel: t('common.discard'), danger: true }))) return;
      draft = clone(base); messages.replaceChildren(); draw();
    }

    async function save() {
      if (hidden || !ctx.canWrite()) return;
      busy = true; sync();
      try {
        const result = await ctx.api.saveBlob(ctx.profileId, target[0], target[1], withoutCredentials(draft), revision, { signal: ctx.signal });
        base = result.value; draft = clone(result.value); revision = result.revision; updatedAt = result.updated_at;
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
        const latest = await ctx.api.blob(ctx.profileId, target[0], target[1], { signal: ctx.signal });
        const merged = mergeObjects(base, draft, latest.value);
        base = latest.value; revision = latest.revision; updatedAt = latest.updated_at; draft = merged.value;
        draw();
        const picks = merged.conflicts.map(c => h('li', { class: 'pick' },
          h('code', {}, c.path.join('.')),
          h('span', {}, t('conflict.valueTheirs', { v: JSON.stringify(c.theirs) })), h('span', {}, t('conflict.valueMine', { v: JSON.stringify(c.mine) })),
          button(t('conflict.useMine'), { size: 's', onClick: e => { draft = withValue(draft, c.path, clone(c.mine)); e.currentTarget.disabled = true; draw(); } })));
        messages.replaceChildren(notice({ tone: 'warn', live: true, title: t('conflict.title'),
          body: merged.conflicts.length ? t('conflict.settingsBoth', { n: merged.conflicts.length }) : t('conflict.settingsReapplied'),
          actions: picks.length ? h('ul', { role: 'list', class: 'pick-list' }, picks) : null }));
      } catch (error) {
        if (error.kind !== 'auth' && error.kind !== 'aborted') messages.replaceChildren(errorState(error, { onRetry: conflict }));
      }
    }

    load();
    return h('section', { class: 'page page-editor' }, head.el, readOnlyNotice(ctx),
      h('div', { class: 'toolbar' }, h('label', { class: 'field-label', for: 'settings-target' }, t('settings.which')), picker),
      notice({ tone: 'info', body: t('settings.deviceNote') }), messages, host, bar.el);
  },
};
