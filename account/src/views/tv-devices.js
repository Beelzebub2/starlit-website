import { h, icon } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { state } from '../lib/state.js';
import { formatDate } from '../lib/format.js';
import { announce, button, confirmDialog, emptyState, notice, pill } from '../lib/ui.js';
import { addCleanup, loadInto, section } from './common.js';

export function tvDevices(ctx) {
  if (!ctx.tv.enabled) return null;
  const host = h('div');
  const messages = h('div');
  let busy = false;
  const sync = () => { for (const control of host.querySelectorAll('button[data-tv-revoke]')) control.disabled = busy || !state.online; };
  addEventListener('online', sync); addEventListener('offline', sync);
  addCleanup(ctx, () => { removeEventListener('online', sync); removeEventListener('offline', sync); });
  const reload = loadInto(host, ctx, {
    rows: 2, variant: 'item',
    fetch: () => ctx.tv.devices({ signal: ctx.signal }),
    render: ({ devices }) => {
      if (!Array.isArray(devices)) throw new Error('Invalid TV devices');
      return devices.length ? h('ul', { role: 'list', class: 'items' }, devices.map(device => {
        const revoke = button(t('tv.revoke'), { variant: 'danger', disabled: !state.online, onClick: () => revokeDevice(device) });
        revoke.dataset.tvRevoke = '';
        return h('li', { class: 'item-row' }, h('span', { class: 'monogram' }, icon('device')),
          h('div', { class: 'item-main' }, h('p', { class: 'item-name' }, device.device_name || t('security.unnamedDevice')),
            h('p', { class: 'item-meta' }, t('tv.authorized', { when: formatDate(device.authorized_at) }))),
          device.revoked_at ? pill(t('tv.revoked')) : revoke);
      })) : emptyState({ title: t('tv.noDevices'), body: t('tv.noDevicesBody'), iconName: 'device' });
    },
  });

  async function revokeDevice(device) {
    if (busy || !state.online || ctx.signal.aborted) return;
    const ok = await confirmDialog({ title: t('tv.revokeTitle', { name: device.device_name || t('security.unnamedDevice') }),
      body: t('tv.revokeBody'), confirmLabel: t('tv.revoke'), danger: true });
    if (!ok || ctx.signal.aborted || !state.online || busy) return;
    busy = true; sync();
    try {
      const result = await ctx.tv.revoke(device.device_id, { signal: ctx.signal });
      if (ctx.signal.aborted) return;
      if (result.status !== 'revoked') throw new Error('Invalid revocation');
      messages.replaceChildren();
      announce(t('tv.revoked'));
      await reload({ quiet: true });
    } catch (error) {
      if (!ctx.signal.aborted && error?.kind !== 'auth') messages.replaceChildren(notice({ tone: 'danger', title: t('tv.revokeFailed'), body: t('tv.revokeFailedBody'), live: true }));
    } finally { busy = false; sync(); }
  }
  return section(t('tv.devicesTitle'), h('div', { class: 'stack' }, messages, host,
    h('a', { href: ctx.accountUrl('/tv'), 'data-link': '', class: 'text-link' }, t('tv.title'))),
  { id: 'sec-tvs', description: t('tv.devicesDesc') });
}
