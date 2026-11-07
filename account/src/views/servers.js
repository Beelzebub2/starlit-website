// Jellyfin and Emby: connection metadata only (type, name, address). The
// account service never contacts these addresses and stores no passwords or
// tokens; signing in to a media server from the web is not available.
import { h, replace } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { isConflict } from '../lib/errors.js';
import { formatDate, formatRelative } from '../lib/format.js';
import { announce, button, confirmDialog, emptyState, field, input, notice, openDialog, pageHeader, pill, toggle } from '../lib/ui.js';
import { loadInto, readOnlyNotice } from './common.js';

const URL_RE = /^https?:\/\/[^/@?#\s]+(\/[^?#\s]*)?$/i;

export default {
  title: () => t('nav.servers'),
  render(ctx) {
    const p = ctx.profile;
    const head = pageHeader({ eyebrow: t('common.profileEyebrow', { name: p.name }), title: t('nav.servers'), lede: t('servers.lede'),
      actions: button(t('servers.add'), { variant: 'accent', icon: 'plus', onClick: () => edit(null), disabled: !ctx.canWrite() }) });
    const host = h('div', {});
    const messages = h('div', {});
    let servers = [];

    const reload = loadInto(host, ctx, {
      rows: 2, variant: 'card',
      fetch: () => ctx.api.mediaServers(ctx.profileId, 50, { signal: ctx.signal }),
      render: list => { servers = list; return draw(); },
    });

    function draw() {
      if (!servers.length) return emptyState({ title: t('servers.emptyTitle'), body: t('servers.emptyBody'), iconName: 'servers' });
      return h('ul', { role: 'list', class: 'cards' }, servers.map(s => h('li', { class: 'card' },
        h('div', { class: 'card-main' },
          h('p', { class: 'card-title' }, s.name, pill(s.server_type === 'emby' ? 'Emby' : 'Jellyfin', 'muted'), s.enabled ? null : pill(t('servers.off'), 'muted')),
          h('p', { class: 'card-meta' }, h('code', {}, s.base_url)),
          h('p', { class: 'card-meta muted' }, t('servers.updated'), ' ', h('time', { datetime: s.updated_at, title: formatDate(s.updated_at) }, formatRelative(s.updated_at)))),
        h('div', { class: 'card-actions' },
          button(t('common.edit'), { size: 's', icon: 'edit', onClick: () => edit(s), disabled: !ctx.canWrite() }),
          button(t('common.remove'), { size: 's', icon: 'trash', onClick: () => remove(s), disabled: !ctx.canWrite() })))));
    }

    async function edit(server, { prefill, warning } = {}) {
      const v = prefill ?? server ?? { server_type: 'jellyfin', name: '', base_url: '', enabled: true };
      const name = input({ value: v.name, maxlength: '100' });
      const url = input({ type: 'url', value: v.base_url, placeholder: 'https://', spellcheck: 'false', autocapitalize: 'none' });
      let enabled = v.enabled !== false;
      const kind = h('fieldset', { class: 'choice-group choice-inline' }, h('legend', {}, t('servers.type')),
        ['jellyfin', 'emby'].map(k => h('label', { class: 'choice' }, h('input', { type: 'radio', name: 'server-type', value: k, checked: v.server_type === k }), h('span', {}, k === 'emby' ? 'Emby' : 'Jellyfin'))));
      const nameField = field({ label: t('servers.name'), control: name });
      const urlField = field({ label: t('servers.url'), hint: t('servers.urlHint'), control: url });
      const content = h('div', { class: 'stack' }, warning ?? null, kind, nameField, urlField,
        toggle({ label: t('servers.enabled'), checked: enabled, onChange: x => { enabled = x; } }),
        notice({ tone: 'info', body: t('servers.noLogin') }));
      const result = await openDialog({ title: server ? t('servers.editTitle') : t('servers.addTitle'), content, initialFocus: () => name,
        actions: [{ label: t('common.cancel'), value: null }, { label: t('common.save'), value: 'save', variant: 'accent' }] });
      if (result !== 'save') return;
      const next = { server_type: kind.querySelector('input:checked')?.value ?? 'jellyfin', name: name.value.trim(), base_url: url.value.trim(), enabled };
      const problems = [];
      if (!next.name) problems.push(t('servers.nameRequired'));
      if (next.base_url.length < 8 || !URL_RE.test(next.base_url)) problems.push(t('servers.urlInvalid'));
      if (problems.length) {
        return edit(server, { prefill: next, warning: notice({ tone: 'danger', title: problems.join(' ') }) });
      }
      if (server) next.server_id = server.server_id;
      try {
        await ctx.api.saveMediaServer(ctx.profileId, next, server?.updated_at ?? null, { signal: ctx.signal });
        announce(t('common.saved'));
        reload({ quiet: true });
      } catch (error) {
        if (isConflict(error)) {
          const latest = await ctx.api.mediaServers(ctx.profileId, 50, { signal: ctx.signal }).catch(() => null);
          if (latest) { servers = latest; replace(host, draw()); }
          const current = server ? latest?.find(s => s.server_id === server.server_id) : null;
          if (server && !current) { messages.replaceChildren(notice({ tone: 'warn', live: true, title: t('servers.goneElsewhere') })); return; }
          return edit(current, { prefill: next, warning: notice({ tone: 'warn', title: t('conflict.itemTitle'),
            body: current ? t('servers.conflictBody', { name: current.name, url: current.base_url }) : t('conflict.aheadBody') }) });
        }
        if (error.kind === 'auth' || error.kind === 'aborted') return;
        const message = error.kind === 'invalid' ? t('servers.urlInvalid') : t(`error.${error.kind}.title`);
        return edit(server, { prefill: next, warning: notice({ tone: 'danger', title: message }) });
      }
    }

    async function remove(s) {
      if (!(await confirmDialog({ title: t('servers.removeTitle', { name: s.name }), body: t('servers.removeBody'), confirmLabel: t('common.remove'), danger: true }))) return;
      try {
        await ctx.api.deleteMediaServer(ctx.profileId, s.server_id, s.updated_at, { signal: ctx.signal });
        announce(t('servers.removed', { name: s.name }));
        reload({ quiet: true });
      } catch (error) {
        if (isConflict(error)) { messages.replaceChildren(notice({ tone: 'warn', live: true, title: t('conflict.itemTitle'), body: t('servers.conflictReload') })); reload({ quiet: true }); return; }
        if (error.kind !== 'auth' && error.kind !== 'aborted') messages.replaceChildren(notice({ tone: 'danger', live: true, title: t(`error.${error.kind}.title`) }));
      }
    }

    return h('section', { class: 'page' }, head.el, readOnlyNotice(ctx), messages, host);
  },
};
