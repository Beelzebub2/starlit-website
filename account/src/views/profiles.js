// Profiles 1–6: create, edit and delete secondary profiles, and manage each
// profile's PIN. Saves send the updated_at you loaded (409 if it changed).
import { h, icon, nextId } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { isConflict } from '../lib/errors.js';
import { state } from '../lib/state.js';
import { announce, avatar, button, confirmDialog, emptyState, errorState, field, input, loading, notice, openDialog, pageHeader, pill, toggle } from '../lib/ui.js';
import { pinGate, pinInput, lockoutNotice } from './pin-gate.js';
import { readOnlyNotice } from './common.js';

const COLORS = ['#45D6EB', '#7FD99A', '#F2B84B', '#F2777A', '#B794F4', '#6FA8FF', '#F59BD0', '#C9CDE0'];

export default {
  title: () => t('nav.profiles'),
  render(ctx) {
    const head = pageHeader({ eyebrow: t('profiles.eyebrow'), title: t('nav.profiles'), lede: t('profiles.lede') });
    const host = h('div', {}, loading(3, 'card'));
    const messages = h('div', {});

    async function refresh() {
      try { await ctx.refreshProfiles(); draw(); }
      catch (error) { if (error.kind !== 'auth' && error.kind !== 'aborted') host.replaceChildren(errorState(error, { onRetry: refresh })); }
    }

    function draw() {
      const list = state.profiles;
      const free = [1, 2, 3, 4, 5, 6].find(n => !list.some(p => p.profile_index === n));
      const writable = ctx.canWrite();
      host.replaceChildren(
        list.length ? h('ul', { role: 'list', class: 'cards' }, list.map(p => h('li', { class: 'card card-profile' },
          avatar(p, 'l'),
          h('div', { class: 'card-main' },
            h('p', { class: 'card-title' }, p.name, p.profile_index === state.profileId ? pill(t('shell.current'), 'ok') : null),
            h('p', { class: 'card-meta' }, p.profile_index === 1 ? t('profiles.primary') : t('profiles.number', { n: p.profile_index })),
            h('p', { class: 'card-flags' },
              p.pin_enabled ? h('span', {}, icon('lock', { size: 13 }), ' ', t('profiles.pinOn')) : h('span', { class: 'muted' }, t('profiles.pinOff')),
              p.uses_primary_addons ? h('span', {}, t('profiles.sharesAddons')) : null,
              p.uses_primary_plugins ? h('span', {}, t('profiles.sharesPlugins')) : null)),
          h('div', { class: 'card-actions' },
            p.profile_index !== state.profileId ? button(t('profiles.manage'), { size: 's', onClick: () => ctx.selectProfile(p.profile_index, { to: '/' }) }) : null,
            button(t('common.edit'), { size: 's', icon: 'edit', onClick: () => edit(p), disabled: !writable }),
            button(t('profiles.pin'), { size: 's', icon: 'lock', onClick: () => pin(p), disabled: !writable }),
            p.profile_index !== 1 ? button(t('common.delete'), { size: 's', icon: 'trash', onClick: () => remove(p), disabled: !writable }) : null))))
          : emptyState({ title: t('profiles.none') }),
        free ? button(t('profiles.add'), { icon: 'plus', onClick: () => edit(null, free), disabled: !writable })
          : h('p', { class: 'muted small' }, t('profiles.full')),
        h('p', { class: 'muted small' }, t('profiles.pinNote')));
    }

    async function unlockIfNeeded(p) {
      if (!p?.pin_enabled || state.unlocked.has(p.profile_index)) return true;
      const ok = await pinGate({ api: ctx.api, profile: p });
      if (ok) state.unlocked.add(p.profile_index);
      return ok;
    }

    async function edit(p, newIndex, { prefill, warning } = {}) {
      if (p && !(await unlockIfNeeded(p))) return;
      const v = prefill ?? p ?? { name: '', avatar_color_hex: COLORS[(newIndex - 1) % COLORS.length], uses_primary_addons: false, uses_primary_plugins: false };
      const name = input({ value: v.name, maxlength: '100' });
      let color = (v.avatar_color_hex ?? '#45D6EB').slice(0, 7).toUpperCase();
      let addons = Boolean(v.uses_primary_addons), plugins = Boolean(v.uses_primary_plugins);
      const group = nextId('color');
      const hex = input({ value: color, maxlength: '7', class: 'input input-short mono', spellcheck: 'false', 'aria-label': t('profiles.hex') });
      const swatches = h('fieldset', { class: 'swatches' }, h('legend', {}, t('profiles.color')),
        COLORS.map(c => {
          const radio = h('input', { type: 'radio', name: group, value: c, checked: c === color, 'aria-label': c, onchange: () => { color = c; hex.value = c; } });
          const sw = h('label', { class: 'swatch' }, radio, h('span', { class: 'swatch-dot', 'aria-hidden': 'true' }));
          sw.querySelector('.swatch-dot').style.setProperty('--sw', c);
          return sw;
        }), hex);
      hex.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(hex.value)) color = hex.value.toUpperCase(); });
      const nameField = field({ label: t('profiles.name'), control: name });
      const isPrimary = (p?.profile_index ?? newIndex) === 1;
      const content = h('div', { class: 'stack' }, warning ?? null, nameField, swatches,
        isPrimary ? null : toggle({ label: t('profiles.useAddons'), hint: t('profiles.useAddonsHint'), checked: addons, onChange: x => { addons = x; } }),
        isPrimary ? null : toggle({ label: t('profiles.usePlugins'), checked: plugins, onChange: x => { plugins = x; } }));
      const result = await openDialog({ title: p ? t('profiles.editTitle', { name: p.name }) : t('profiles.addTitle'), content, initialFocus: () => name,
        actions: [{ label: t('common.cancel'), value: null }, { label: t('common.save'), value: 'save', variant: 'accent' }] });
      if (result !== 'save') return;
      const typed = { name: name.value.trim(), avatar_color_hex: color, uses_primary_addons: addons, uses_primary_plugins: plugins };
      if (!typed.name) return edit(p, newIndex, { prefill: typed, warning: notice({ tone: 'danger', title: t('profiles.nameRequired') }) });
      if (!/^#[0-9A-F]{6}$/.test(typed.avatar_color_hex)) return edit(p, newIndex, { prefill: typed, warning: notice({ tone: 'danger', title: t('profiles.colorInvalid') }) });
      // Send the fields the native validator knows; keep avatar and background choices made in the app.
      const payload = {
        profile_index: p?.profile_index ?? newIndex, ...typed,
        avatar_id: p?.avatar_id ?? null, avatar_url: p?.avatar_url ?? null,
        profile_background_id: p?.profile_background_id ?? null, profile_background_url: p?.profile_background_url ?? null,
      };
      try {
        await ctx.api.saveProfile(payload, p?.updated_at ?? null, { signal: ctx.signal });
        announce(t('common.saved'));
        await refresh();
      } catch (error) {
        if (isConflict(error)) {
          await refresh();
          const latest = state.profiles.find(x => x.profile_index === payload.profile_index) ?? null;
          return edit(latest, newIndex, { prefill: typed, warning: notice({ tone: 'warn', title: t('conflict.itemTitle'),
            body: latest ? t('profiles.conflictBody', { name: latest.name }) : t('profiles.conflictNew') }) });
        }
        if (error.kind === 'auth' || error.kind === 'aborted') return;
        return edit(p, newIndex, { prefill: typed, warning: notice({ tone: 'danger', title: t(`error.${error.kind}.title`) }) });
      }
    }

    async function pin(p) {
      const has = p.pin_enabled;
      const current = has ? pinInput() : null;
      const next = pinInput();
      const again = pinInput();
      const status = h('div', { 'aria-live': 'assertive' });
      let lock = null;
      const fields = [
        has ? field({ label: t('pin.current'), control: current }) : null,
        field({ label: t('pin.new'), hint: t('pin.fourDigits'), control: next }),
        field({ label: t('pin.repeat'), control: again }),
      ];
      const content = h('div', { class: 'stack' }, h('p', { class: 'muted' }, t('pin.explain')), fields, status,
        has ? h('p', { class: 'muted small' }, t('pin.forgot')) : null);
      const actions = [{ label: t('common.cancel'), value: null }];
      if (has) actions.push({ label: t('pin.remove'), value: 'remove', danger: true });
      actions.push({ label: has ? t('pin.change') : t('pin.set'), value: 'set', variant: 'accent' });
      const choice = await openDialog({ title: t('pin.manageTitle', { name: p.name }), content, actions, initialFocus: () => current ?? next });
      lock?.stop();
      if (!choice) return;
      let result;
      try {
        if (choice === 'remove') {
          if (!/^\d{4}$/.test(current.value)) return pinError(p, t('pin.currentRequired'));
          result = await ctx.api.removePin(p.profile_index, current.value, { signal: ctx.signal });
        } else {
          if (!/^\d{4}$/.test(next.value)) return pinError(p, t('pin.fourDigits'));
          if (next.value !== again.value) return pinError(p, t('pin.mismatch'));
          if (has && !/^\d{4}$/.test(current.value)) return pinError(p, t('pin.currentRequired'));
          result = await ctx.api.changePin(p.profile_index, next.value, has ? current.value : null, { signal: ctx.signal });
        }
      } catch (error) {
        if (error.kind === 'auth' || error.kind === 'aborted') return;
        return pinError(p, t(`error.${error.kind}.title`));
      }
      if (result?.ok) {
        announce(choice === 'remove' ? t('pin.removed') : t('pin.saved'));
        if (choice !== 'remove') state.unlocked.add(p.profile_index);
        await refresh();
        return;
      }
      if (result?.retry_after_seconds > 0) {
        messages.replaceChildren(lock = lockoutNotice(result.retry_after_seconds, () => messages.replaceChildren()));
        await refresh();
        return;
      }
      return pinError(p, t('pin.currentWrong'));
    }

    function pinError(p, message) {
      messages.replaceChildren(notice({ tone: 'danger', live: true, title: message, actions: button(t('pin.tryAgain'), { size: 's', onClick: () => pin(state.profiles.find(x => x.profile_index === p.profile_index) ?? p) }) }));
    }

    async function remove(p) {
      if (!(await unlockIfNeeded(p))) return;
      const ok = await confirmDialog({ title: t('profiles.deleteTitle', { name: p.name }), body: t('profiles.deleteBody'), confirmLabel: t('profiles.deleteConfirm'), danger: true, typed: p.name });
      if (!ok) return;
      try {
        await ctx.api.deleteProfile(p.profile_index, p.updated_at, { signal: ctx.signal });
        state.unlocked.delete(p.profile_index);
        announce(t('profiles.deleted', { name: p.name }));
        await refresh();
      } catch (error) {
        if (isConflict(error)) { await refresh(); messages.replaceChildren(notice({ tone: 'warn', live: true, title: t('conflict.itemTitle'), body: t('profiles.deleteConflict') })); return; }
        if (error.kind !== 'auth' && error.kind !== 'aborted') messages.replaceChildren(notice({ tone: 'danger', live: true, title: t(`error.${error.kind}.title`) }));
      }
    }

    refresh();
    return h('section', { class: 'page' }, head.el, readOnlyNotice(ctx), messages, host);
  },
};
