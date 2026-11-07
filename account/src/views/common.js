// Loading pattern shared by the pages: a skeleton at final size, then the
// content or an error panel with Retry. Requests are cancelled when you leave.
import { isAbort, isAuth } from '../lib/errors.js';
import { t } from '../lib/i18n.js';
import { errorState, loading, notice } from '../lib/ui.js';
import { h } from '../lib/dom.js';

export function addCleanup(ctx, fn) {
  const previous = ctx.destroy;
  ctx.destroy = () => { previous?.(); fn(); };
}

/** Load data into `host`. Returns a reload function. */
export function loadInto(host, ctx, { fetch, render, rows = 5, variant = 'row' }) {
  let generation = 0;
  async function run({ quiet = false } = {}) {
    const mine = ++generation;
    if (!quiet) host.replaceChildren(loading(rows, variant));
    host.setAttribute('aria-busy', 'true');
    try {
      const data = await fetch();
      if (ctx.signal.aborted || mine !== generation) return;
      host.replaceChildren(render(data, run));
    } catch (error) {
      if (ctx.signal.aborted || isAbort(error) || mine !== generation) return;
      if (isAuth(error)) return;   // the app returns to sign-in
      host.replaceChildren(errorState(error, { onRetry: () => run() }));
    } finally {
      if (mine === generation) host.removeAttribute('aria-busy');
    }
  }
  run();
  refetchOnReturn(ctx, () => run({ quiet: true }));
  return run;
}

/** Refresh when the tab becomes visible again, unless there are unsaved edits. */
export function refetchOnReturn(ctx, fn, minMs = 30000) {
  let last = Date.now();
  const handler = () => {
    if (document.visibilityState !== 'visible' || ctx.isDirty() || Date.now() - last < minMs) return;
    last = Date.now();
    fn();
  };
  document.addEventListener('visibilitychange', handler);
  addCleanup(ctx, () => document.removeEventListener('visibilitychange', handler));
}

export function readOnlyNotice(ctx) {
  if (ctx.config.writesEnabled) return null;
  return notice({ tone: 'info', title: t('banner.readonlyTitle'), body: t('banner.readonlyBody') });
}

export function section(title, body, { id, actions, description } = {}) {
  const headingId = id ?? `s-${Math.random().toString(36).slice(2, 8)}`;
  return h('section', { class: 'section', 'aria-labelledby': headingId },
    h('div', { class: 'section-head' }, h('div', {}, h('h2', { class: 'section-title', id: headingId }, title),
      description ? h('p', { class: 'section-desc' }, description) : null), actions ? h('div', { class: 'section-actions' }, actions) : null),
    body);
}
