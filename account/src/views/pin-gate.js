// Profile PIN gate. The PIN is a household convenience in the Starlit app, not
// account security: the account itself is protected by your sign-in. The web
// still respects it, so a PIN-protected profile's data is not loaded here
// until its PIN is entered.
import { h } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { formatSeconds } from '../lib/format.js';
import { button, field, input, notice, openDialog } from '../lib/ui.js';

export function pinInput(props = {}) {
  return input({ type: 'password', inputmode: 'numeric', pattern: '[0-9]{4}', maxlength: '4', autocomplete: 'off', class: 'input input-pin', ...props });
}

/** Countdown text for a lockout, updated every second until it ends. */
export function lockoutNotice(seconds, onEnd) {
  const body = h('p', {});
  const el = notice({ tone: 'warn', title: t('pin.lockedTitle'), body: '' });
  el.querySelector('.notice-body').append(body);
  let left = seconds;
  const tick = () => {
    body.textContent = t('pin.lockedBody', { time: formatSeconds(left) });
    if (left-- <= 0) { clearInterval(timer); onEnd?.(); }
  };
  const timer = setInterval(tick, 1000);
  tick();
  el.stop = () => clearInterval(timer);
  return el;
}

/** Resolves true once the PIN is accepted, false if the person cancels. */
export async function pinGate({ api, profile }) {
  const pin = pinInput({ 'aria-label': t('pin.label') });
  const pinField = field({ label: t('pin.label'), hint: t('pin.hint'), control: pin });
  const status = h('div', { 'aria-live': 'assertive' });
  const unlock = button(t('pin.unlock'), { variant: 'accent', type: 'submit' });
  let unlocked = false;
  let lock = null;

  const form = h('form', { class: 'stack', novalidate: true, onsubmit: async e => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin.value)) { pinField.setError(t('pin.fourDigits')); pin.focus(); return; }
    pinField.setError(null);
    unlock.disabled = true;
    try {
      const result = await api.verifyPin(profile.profile_index, pin.value);
      pin.value = '';
      if (result.unlocked) { unlocked = true; form.closest('dialog')?.close(); return; }
      status.replaceChildren();
      if (result.retryAfterSeconds > 0) {
        pin.disabled = true;
        lock = lockoutNotice(result.retryAfterSeconds, () => { pin.disabled = false; unlock.disabled = false; status.replaceChildren(); });
        status.append(lock);
        return;
      }
      status.append(notice({ tone: 'danger', title: t('pin.wrong'), live: true }));
      pin.focus();
    } catch (error) {
      status.replaceChildren(notice({ tone: 'danger', title: t(`error.${error?.kind ?? 'server'}.title`), live: true }));
    } finally {
      if (!pin.disabled) unlock.disabled = false;
    }
  } }, pinField, status, unlock);

  await openDialog({
    title: t('pin.title', { name: profile.name }),
    description: t('pin.body'),
    content: form,
    initialFocus: () => pin,
  });
  lock?.stop();
  return unlocked;
}
