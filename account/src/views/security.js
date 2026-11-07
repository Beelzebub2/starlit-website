// Sessions and installations. Sign-out is GoTrue's logout endpoint with the
// scopes it supports (this browser, every other session, everywhere). Signing
// out one particular device is not supported by the backend, so there is no
// per-session button. Installations are not sessions and are labelled so.
import { h, icon } from '../lib/dom.js';
import { t, lang } from '../lib/i18n.js';
import { formatDate, formatRelative } from '../lib/format.js';
import { announce, button, confirmDialog, emptyState, notice, pageHeader, pill } from '../lib/ui.js';
import { loadInto, section } from './common.js';

export default {
  title: () => t('nav.security'),
  render(ctx) {
    const head = pageHeader({ eyebrow: t('security.eyebrow'), title: t('nav.security'), lede: t('security.lede') });
    const sessionsHost = h('div', {});
    const devicesHost = h('div', {});
    const messages = h('div', {});

    const reloadSessions = loadInto(sessionsHost, ctx, {
      rows: 3, variant: 'item',
      fetch: () => ctx.api.sessions(50, { signal: ctx.signal }),
      render: list => {
        const others = list.filter(s => !s.is_current).length;
        return h('div', { class: 'stack' },
          h('ul', { role: 'list', class: 'items' }, list.map(s => h('li', { class: 'item-row' },
            h('span', { class: 'monogram' }, icon(s.is_current ? 'device' : 'globe', { size: 16 })),
            h('div', { class: 'item-main' },
              h('p', { class: 'item-name' }, t('security.signedIn'), ' ', h('time', { datetime: s.signed_in_at, title: formatDate(s.signed_in_at) }, formatRelative(s.signed_in_at)),
                s.is_current ? pill(t('security.thisBrowser'), 'ok') : null),
              h('p', { class: 'item-meta' }, s.expires_at ? t('security.expires', { when: formatDate(s.expires_at) }) : t('security.noExpiry'),
                ' · ', h('code', { title: t('security.sessionId') }, String(s.session_id).slice(0, 8))))))),
          h('div', { class: 'row-actions' },
            button(t('security.signOutOthers', { n: others }), { icon: 'signout', disabled: !others, onClick: () => signOut('others') }),
            button(t('security.signOutEverywhere'), { variant: 'danger', icon: 'signout', onClick: () => signOut('global') })),
          h('p', { class: 'muted small' }, t('security.noSingle')));
      },
    });

    loadInto(devicesHost, ctx, {
      rows: 3, variant: 'item',
      fetch: () => ctx.api.devices(100, { signal: ctx.signal }),
      render: list => (list.length ? h('ul', { role: 'list', class: 'items' }, list.map(d => h('li', { class: 'item-row' },
        h('span', { class: 'monogram' }, icon(d.platform === 'android' || d.platform === 'ios' ? 'phone' : 'device', { size: 16 })),
        h('div', { class: 'item-main' },
          h('p', { class: 'item-name' }, d.device_name || t('security.unnamedDevice')),
          h('p', { class: 'item-meta' }, [platformName(d.platform), d.client_version ? `${d.client_name ?? 'Starlit'} ${d.client_version}` : null].filter(Boolean).join(' · '),
            ' · ', t('security.lastSync'), ' ', h('time', { datetime: d.updated_at, title: formatDate(d.updated_at) }, formatRelative(d.updated_at)))))))
        : emptyState({ title: t('security.noDevices') })),
    });

    async function signOut(scope) {
      const everywhere = scope === 'global';
      const ok = await confirmDialog({
        title: everywhere ? t('security.everywhereTitle') : t('security.othersTitle'),
        body: everywhere ? t('security.everywhereBody') : t('security.othersBody'),
        confirmLabel: everywhere ? t('security.signOutEverywhere') : t('security.signOutOthersShort'), danger: true,
      });
      if (!ok) return;
      try {
        await ctx.auth.signOut(scope);
        if (!everywhere) { announce(t('security.othersDone')); reloadSessions({ quiet: true }); }
      } catch (error) {
        if (error.kind !== 'auth') messages.replaceChildren(notice({ tone: 'danger', live: true, title: t(`error.${error.kind ?? 'server'}.title`) }));
      }
    }

    const site = ctx.config.siteUrl;
    const del = `${site}${lang() === 'pt' ? '/pt/apagar-conta/' : '/delete-account/'}`;
    const unavailable = h('ul', { role: 'list', class: 'unavailable' },
      ['single', 'delete', 'mediaLogin', 'membership', 'tv'].map(k => h('li', {}, h('span', { class: 'unavailable-title' }, t(`security.na.${k}`)),
        h('span', { class: 'muted' }, t(`security.naWhy.${k}`)),
        k === 'delete' ? h('a', { href: del, class: 'text-link' }, t('security.deleteHow')) : null)));

    return h('section', { class: 'page' }, head.el, messages,
      section(t('security.sessionsTitle'), sessionsHost, { id: 'sec-sessions', description: t('security.sessionsDesc') }),
      section(t('security.devicesTitle'), devicesHost, { id: 'sec-devices', description: t('security.devicesDesc') }),
      section(t('security.signinTitle'), h('p', { class: 'muted' }, t('security.signinBody')), { id: 'sec-signin' }),
      section(t('security.naTitle'), unavailable, { id: 'sec-na', description: t('security.naDesc') }));
  },
};

function platformName(p) {
  const map = { windows: 'Windows', android: 'Android', ios: 'iOS', macos: 'macOS', linux: 'Linux' };
  return map[String(p ?? '').toLowerCase()] ?? (p || '');
}
