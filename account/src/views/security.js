// Sessions and installations. Sign-out is GoTrue's logout endpoint with the
// scopes it supports (this browser, every other session, everywhere). Signing
// out individual sessions is supported for authorized TVs only. Installations
// are not sessions and are labelled so.
import { h, icon } from '../lib/dom.js';
import { t, lang } from '../lib/i18n.js';
import { formatDate, formatRelative } from '../lib/format.js';
import { announce, button, confirmDialog, emptyState, notice, pageHeader, pill } from '../lib/ui.js';
import { loadInto, section } from './common.js';
import { groupSessions } from '../lib/clients.js';
import { tvDevices } from './tv-devices.js';

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
        // Servers that report each sign-in's client get one row per device;
        // older ones only list sign-ins.
        const grouped = list.some(s => 'user_agent' in s);
        return h('div', { class: 'stack' },
          grouped
            ? h('ul', { role: 'list', class: 'items' }, groupSessions(list).map(deviceRow))
            : h('ul', { role: 'list', class: 'items' }, list.map(s => h('li', { class: 'item-row' },
              h('span', { class: 'monogram' }, icon(s.is_current ? 'device' : 'globe', { size: 16 })),
              h('div', { class: 'item-main' },
                h('p', { class: 'item-name' }, t('security.signedIn'), ' ', when(s.signed_in_at),
                  s.is_current ? pill(t('security.thisBrowser'), 'ok') : null),
                h('p', { class: 'item-meta' }, s.expires_at ? t('security.expires', { when: formatDate(s.expires_at) }) : t('security.noExpiry'),
                  ' · ', h('code', { title: t('security.sessionId') }, String(s.session_id).slice(0, 8))))))),
          h('div', { class: 'row-actions' },
            button(t('security.signOutOthers', { n: others }), { icon: 'signout', disabled: !others, onClick: () => signOut('others') }),
            button(t('security.signOutEverywhere'), { variant: 'danger', icon: 'signout', onClick: () => signOut('global') })),
          h('p', { class: 'muted small' }, t('security.noSingle')));
      },
    });

    function when(at) {
      return h('time', { datetime: at, title: formatDate(at) }, formatRelative(at));
    }

    function clientName(c) {
      if (c.kind === 'app') return c.os ? t('client.appOn', { os: c.os }) : t('client.app');
      if (c.kind === 'tv') return t('client.tv', { brand: c.brand });
      if (c.kind === 'tool') return t('client.tool');
      if (c.kind === 'browser') {
        const browser = c.browser ?? t('client.browser');
        return c.os ? t('client.browserOn', { browser, os: c.os }) : browser;
      }
      return t('client.unknown');
    }

    /** One device: its sign-ins folded into a single row you can open. */
    function deviceRow(g) {
      const c = g.client;
      const iconName = c.kind === 'app' && (c.os === 'Android' || c.os === 'iOS') ? 'phone'
        : c.kind === 'browser' ? 'globe' : 'device';
      const signIns = [...g.sessions].sort((a, b) => Number(Boolean(b.is_current)) - Number(Boolean(a.is_current))
        || new Date(b.signed_in_at) - new Date(a.signed_in_at));
      return h('li', { class: 'item-row session-device' },
        h('span', { class: 'monogram' }, icon(iconName, { size: 16 })),
        h('div', { class: 'item-main' },
          h('p', { class: 'item-name' }, clientName(c), g.current ? pill(t('security.thisBrowser'), 'ok') : null),
          h('p', { class: 'item-meta' }, t('security.signIns', { n: g.sessions.length }), ' · ', t('security.lastActive'), ' ',
            when(new Date(g.lastActive).toISOString())),
          h('details', { class: 'session-details' },
            h('summary', {}, t('security.showSignIns', { n: g.sessions.length })),
            h('ul', { role: 'list', class: 'session-list' }, signIns.map(s => h('li', {},
              t('security.signedIn'), ' ', when(s.signed_in_at),
              s.last_active_at ? [' · ', t('security.lastActive'), ' ', when(s.last_active_at)] : null,
              ' · ', h('code', { title: t('security.sessionId') }, String(s.session_id).slice(0, 8)),
              s.is_current ? [' · ', h('strong', {}, t('security.currentSignIn'))] : null))))));
    }

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
      tvDevices(ctx),
      section(t('security.devicesTitle'), devicesHost, { id: 'sec-devices', description: t('security.devicesDesc') }),
      section(t('security.signinTitle'), h('p', { class: 'muted' }, t('security.signinBody')), { id: 'sec-signin' }),
      section(t('security.naTitle'), unavailable, { id: 'sec-na', description: t('security.naDesc') }));
  },
};

function platformName(p) {
  const map = { windows: 'Windows', android: 'Android', ios: 'iOS', macos: 'macOS', linux: 'Linux' };
  return map[String(p ?? '').toLowerCase()] ?? (p || '');
}
