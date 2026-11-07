// Shared interface pieces. Everything is keyboard reachable; dialogs use the
// native <dialog> element (focus containment, Esc to close); status changes are
// announced through one polite live region.
import { h, icon, replace, nextId } from './dom.js';
import { t } from './i18n.js';
import { state } from './state.js';
import { scrubText } from './redact.js';

export function button(label, { variant = 'ghost', icon: ic, onClick, type = 'button', disabled, size, ariaLabel, describedBy, id, busy } = {}) {
  return h('button', {
    type, id, class: ['btn', `btn-${variant}`, size && `btn-${size}`], disabled: disabled || busy,
    'aria-label': ariaLabel, 'aria-describedby': describedBy, 'aria-busy': busy ? 'true' : undefined, onclick: onClick,
  }, ic ? icon(ic) : null, h('span', {}, label));
}

export function iconButton(name, label, onClick, { disabled, variant = 'quiet', pressed } = {}) {
  return h('button', {
    type: 'button', class: ['icon-btn', `icon-btn-${variant}`], 'aria-label': label, title: label, disabled, onclick: onClick,
    'aria-pressed': pressed === undefined ? undefined : String(Boolean(pressed)),
  }, icon(name));
}

export function link(label, href, { variant, icon: ic, current } = {}) {
  return h('a', { href, class: variant ? ['btn', `btn-${variant}`] : 'text-link', 'aria-current': current ? 'page' : undefined, 'data-link': '' },
    ic ? icon(ic) : null, h('span', {}, label));
}

/** Page heading. The h1 takes focus after navigation (tabindex=-1). */
export function pageHeader({ eyebrow, title, lede, actions }) {
  const heading = h('h1', { class: 'page-title', tabindex: '-1' }, title);
  return {
    heading,
    el: h('header', { class: 'page-head' },
      h('div', { class: 'page-head-text' }, eyebrow ? h('p', { class: 'eyebrow' }, eyebrow) : null, heading, lede ? h('p', { class: 'lede' }, lede) : null),
      actions ? h('div', { class: 'page-actions' }, actions) : null),
  };
}

/** Placeholder rows at their final height, so content does not jump when it arrives. */
export function skeleton(rows = 5, variant = 'row') {
  return h('div', { class: ['skeleton', `skeleton-${variant}`], 'aria-hidden': 'true' },
    Array.from({ length: rows }, () => h('div', { class: 'skeleton-line' })));
}

export function loading(rows, variant) {
  return h('div', { class: 'loading', role: 'status' }, h('span', { class: 'vh' }, t('common.loading')), skeleton(rows, variant));
}

export function emptyState({ title, body, action, iconName = 'info' }) {
  return h('div', { class: 'state state-empty' }, h('span', { class: 'state-icon' }, icon(iconName, { size: 22 })),
    h('h2', { class: 'state-title' }, title), body ? h('p', {}, body) : null, action ? h('div', { class: 'state-actions' }, action) : null);
}

const ERROR_ICON = { network: 'offline', auth: 'lock', forbidden: 'lock', missing: 'info', invalid: 'alert', server: 'alert', conflict: 'refresh' };

/** Error panel for a failed load. Never shows request details, URLs or tokens. */
export function errorState(error, { onRetry } = {}) {
  const kind = state.online ? (error?.kind ?? 'server') : 'network';
  const detail = kind === 'invalid' && error?.message ? scrubText(error.message) : null;
  return h('div', { class: ['state', 'state-error'], role: 'alert' },
    h('span', { class: 'state-icon' }, icon(ERROR_ICON[kind] ?? 'alert', { size: 22 })),
    h('h2', { class: 'state-title' }, t(`error.${kind}.title`)),
    h('p', {}, t(`error.${kind}.body`)),
    detail ? h('p', { class: 'state-detail' }, h('code', {}, detail)) : null,
    onRetry && kind !== 'auth' ? h('div', { class: 'state-actions' }, button(t('common.retry'), { icon: 'refresh', onClick: onRetry })) : null);
}

/** Inline message. tone: info | warn | danger | ok. */
export function notice({ tone = 'info', title, body, actions, live = false }) {
  return h('div', { class: ['notice', `notice-${tone}`], role: live ? (tone === 'danger' ? 'alert' : 'status') : undefined },
    h('span', { class: 'notice-icon' }, icon(tone === 'ok' ? 'check' : tone === 'info' ? 'info' : 'alert')),
    h('div', { class: 'notice-body' }, title ? h('p', { class: 'notice-title' }, title) : null, body ? h('p', {}, body) : null,
      actions ? h('div', { class: 'notice-actions' }, actions) : null));
}

let liveRegion = null;
export function setLiveRegion(el) { liveRegion = el; }
/** Announce a short status message to screen readers and show it as a toast. */
export function announce(message) {
  if (!liveRegion) return;
  liveRegion.textContent = '';
  // A new text node after a tick makes repeated messages announce again.
  setTimeout(() => { liveRegion.textContent = message; }, 30);
  const toast = h('div', { class: 'toast', 'aria-hidden': 'true' }, icon('check'), h('span', {}, message));
  document.body.append(toast);
  setTimeout(() => toast.classList.add('toast-out'), 2600);
  setTimeout(() => toast.remove(), 3000);
}

/**
 * Modal dialog. Resolves with the value of the action pressed, or null on Esc/close.
 * content: Node; actions: [{ label, value, variant, danger, disabledUntil?: () => bool }]
 */
export function openDialog({ title, description, content, actions = [], wide = false, initialFocus }) {
  return new Promise(resolve => {
    const titleId = nextId('dlg-title');
    const descId = description ? nextId('dlg-desc') : undefined;
    const footer = h('div', { class: 'dialog-actions' });
    const dialog = h('dialog', { class: ['dialog', wide && 'dialog-wide'], 'aria-labelledby': titleId, 'aria-describedby': descId },
      h('div', { class: 'dialog-head' }, h('h2', { id: titleId, class: 'dialog-title' }, title),
        iconButton('close', t('common.close'), () => finish(null))),
      description ? h('p', { id: descId, class: 'dialog-desc' }, description) : null,
      content ? h('div', { class: 'dialog-body' }, content) : null,
      footer);
    const buttons = actions.map(a => {
      const b = button(a.label, { variant: a.variant ?? (a.danger ? 'danger' : 'ghost'), onClick: () => finish(a.value) });
      if (a.disabledUntil) {
        const sync = () => { b.disabled = !a.disabledUntil(); };
        dialog.addEventListener('input', sync);
        sync();
      }
      return b;
    });
    replace(footer, buttons);
    let done = false;
    const opener = document.activeElement;
    function finish(value) {
      if (done) return;
      done = true;
      dialog.close();
      dialog.remove();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
      resolve(value);
    }
    // Any element inside the content with data-dialog-value closes the dialog with that value.
    dialog.addEventListener('click', e => {
      const chosen = e.target.closest?.('[data-dialog-value]');
      if (chosen && dialog.contains(chosen)) finish(chosen.dataset.dialogValue);
    });
    dialog.addEventListener('cancel', e => { e.preventDefault(); finish(null); });
    dialog.addEventListener('close', () => finish(null));
    document.body.append(dialog);
    dialog.showModal();
    (initialFocus?.() ?? buttons.find(b => !b.classList.contains('btn-danger')) ?? buttons[0])?.focus();
  });
}

/** Confirmation. With `typed`, the destructive button stays disabled until the text matches. */
export async function confirmDialog({ title, body, confirmLabel, danger = false, typed }) {
  let input = null;
  const content = typed ? h('div', { class: 'stack-s' },
    h('label', { class: 'field-label', for: 'confirm-typed' }, t('common.typeToConfirm', { text: typed })),
    input = h('input', { id: 'confirm-typed', class: 'input', autocomplete: 'off', spellcheck: 'false' })) : null;
  const result = await openDialog({
    title, description: body, content,
    actions: [
      { label: t('common.cancel'), value: false },
      { label: confirmLabel, value: true, danger, variant: danger ? 'danger' : 'accent', disabledUntil: typed ? () => input.value.trim() === typed : undefined },
    ],
  });
  return result === true;
}

/** A labelled form control with optional hint and error, wired with aria-describedby. */
export function field({ label, hint, error, control, optional }) {
  const id = control.id || nextId('f');
  control.id = id;
  const hintId = hint ? `${id}-hint` : null;
  const errId = `${id}-err`;
  const err = h('p', { id: errId, class: 'field-error', hidden: !error }, error ? [icon('alert', { size: 14 }), error] : null);
  const describe = [hintId, error ? errId : null].filter(Boolean).join(' ');
  if (describe) control.setAttribute('aria-describedby', describe);
  if (error) control.setAttribute('aria-invalid', 'true');
  const wrap = h('div', { class: ['field', error && 'field-invalid'] },
    h('label', { class: 'field-label', for: id }, label, optional ? h('span', { class: 'field-optional' }, t('common.optional')) : null),
    hint ? h('p', { id: hintId, class: 'field-hint' }, hint) : null,
    control, err);
  wrap.setError = message => {
    replace(err, message ? [icon('alert', { size: 14 }), message] : []);
    err.hidden = !message;
    control.toggleAttribute('aria-invalid', Boolean(message));
    if (message) control.setAttribute('aria-invalid', 'true');
    control.setAttribute('aria-describedby', [hintId, message ? errId : null].filter(Boolean).join(' '));
    wrap.classList.toggle('field-invalid', Boolean(message));
  };
  return wrap;
}

export function input(props = {}) {
  return h('input', { class: 'input', type: 'text', autocomplete: 'off', ...props });
}

export function select(options, value, props = {}) {
  return h('select', { class: 'input select', ...props },
    options.map(o => h('option', { value: o.value, selected: String(o.value) === String(value) }, o.label)));
}

/** Switch built on a native checkbox (role=switch), so it is announced as on/off. */
export function toggle({ label, checked, onChange, disabled, hint }) {
  const id = nextId('sw');
  const box = h('input', { id, type: 'checkbox', role: 'switch', class: 'switch-input', checked, disabled,
    onchange: e => onChange?.(e.target.checked), 'aria-describedby': hint ? `${id}-hint` : undefined });
  return h('div', { class: 'switch-row' },
    h('label', { class: 'switch', for: id }, box, h('span', { class: 'switch-track', 'aria-hidden': 'true' }), h('span', { class: 'switch-label' }, label)),
    hint ? h('p', { id: `${id}-hint`, class: 'field-hint' }, hint) : null);
}

/** Profile avatar: the profile colour and initial. Colour is set through CSSOM (allowed by the CSP). */
export function avatar(profile, size = 'm') {
  const el = h('span', { class: ['avatar', `avatar-${size}`], 'aria-hidden': 'true' }, (profile?.name ?? '?').trim().slice(0, 1).toUpperCase() || '?');
  const color = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(profile?.avatar_color_hex ?? '') ? profile.avatar_color_hex.slice(0, 7) : '#45d6eb';
  el.style.setProperty('--avatar', color);
  return el;
}

/**
 * Sticky bar for staged edits. Returns { el, set({ count, busy, blockedReason }) }.
 */
export function saveBar({ onSave, onDiscard, saveLabel }) {
  const status = h('p', { class: 'savebar-status', 'aria-live': 'polite' });
  const save = button(saveLabel ?? t('common.save'), { variant: 'accent', icon: 'check', onClick: onSave });
  const discard = button(t('common.discard'), { onClick: onDiscard });
  const el = h('div', { class: 'savebar', hidden: true }, h('div', { class: 'savebar-inner' }, status, h('div', { class: 'savebar-actions' }, discard, save)));
  let last = {};
  function set(options = last) {
    last = options;
    const { count = 0, busy = false } = options;
    const blockedReason = state.online ? options.blockedReason ?? null : t('banner.offlineTitle');
    el.hidden = count === 0 && !busy;
    status.textContent = busy ? t('common.saving') : blockedReason ?? t('common.unsaved', { n: count });
    save.disabled = busy || Boolean(blockedReason) || count === 0;
    save.setAttribute('aria-busy', busy ? 'true' : 'false');
    discard.disabled = busy;
  }
  // Re-check when the connection drops or returns; staged edits are kept.
  const onConnectivity = () => { if (!el.isConnected) { removeEventListener('online', onConnectivity); removeEventListener('offline', onConnectivity); return; } setTimeout(() => set(), 0); };
  addEventListener('online', onConnectivity);
  addEventListener('offline', onConnectivity);
  return { el, set };
}

/** Read-only key/value list. */
export function facts(rows) {
  return h('dl', { class: 'facts' }, rows.filter(Boolean).map(([k, v]) => h('div', { class: 'fact' }, h('dt', {}, k), h('dd', {}, v))));
}

export function pill(text, tone = 'muted') {
  return h('span', { class: ['pill', `pill-${tone}`] }, text);
}
