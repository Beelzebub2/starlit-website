// Overview: true per-profile counts from account_overview, read like a ledger.
import { h, icon } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { formatDate, formatNumber, formatRelative } from '../lib/format.js';
import { state } from '../lib/state.js';
import { facts, pageHeader } from '../lib/ui.js';
import { loadInto, section } from './common.js';

const ROWS = [
  ['library_items', 'library', '/library', 'library'],
  ['watch_progress', 'progress', '/progress', 'progress'],
  ['watched_records', 'history', '/history', 'history'],
  ['collections', 'collections', '/collections', 'collections'],
  ['addons', 'addons', '/addons', 'addons'],
  ['plugins', 'plugins', '/plugins', 'plugins'],
];

export default {
  title: () => t('nav.overview'),
  render(ctx) {
    const p = ctx.profile;
    const head = pageHeader({ eyebrow: t('overview.eyebrow'), title: t('overview.title', { name: p.name }), lede: t('overview.lede') });
    const ledgerHost = h('div', { class: 'ledger-host' });
    loadInto(ledgerHost, ctx, {
      rows: 6, variant: 'ledger',
      fetch: () => ctx.api.overview(ctx.profileId, { signal: ctx.signal }),
      render: data => h('div', {},
        h('ul', { role: 'list', class: 'ledger' }, ROWS.map(([field, key, href, ic]) => h('li', {},
          h('a', { href: ctx.accountUrl(href), 'data-link': '', class: 'ledger-row' },
            h('span', { class: 'ledger-icon' }, icon(ic)),
            h('span', { class: 'ledger-text' }, h('span', { class: 'ledger-label' }, t(`nav.${key}`)), h('span', { class: 'ledger-desc' }, t(`overview.desc.${key}`))),
            h('span', { class: 'ledger-num', 'aria-label': t('overview.count', { n: data[field] ?? 0 }) }, formatNumber(data[field] ?? 0)),
            icon('chevron', { size: 16 }))))),
        h('p', { class: 'ledger-foot' }, data.last_data_change
          ? [t('overview.lastChange'), ' ', h('time', { datetime: data.last_data_change, title: formatDate(data.last_data_change) }, formatRelative(data.last_data_change))]
          : t('overview.noChanges'))),
    });

    const u = state.user ?? {};
    const providers = (u.providers ?? []).map(x => { const label = t(`provider.${x}`); return label.startsWith('provider.') ? x : label; }).join(', ') || '—';
    const account = facts([
      [t('overview.email'), u.email || '—'],
      [t('overview.signInWith'), providers],
      [t('overview.profiles'), t('overview.profilesValue', { n: state.profiles.length })],
      u.createdAt ? [t('overview.since'), formatDate(u.createdAt, { time: false })] : null,
    ]);

    return h('section', { class: 'page' }, head.el,
      section(t('overview.dataTitle'), ledgerHost, { id: 'ov-data', description: t('overview.dataDesc', { name: p.name }) }),
      section(t('overview.accountTitle'), h('div', { class: 'stack' }, account,
        h('p', { class: 'muted' }, t('overview.manageInApp'), ' ', h('a', { href: ctx.accountUrl('/security'), 'data-link': '', class: 'text-link' }, t('overview.securityLink')))),
      { id: 'ov-account' }));
  },
};
