import { h } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { state } from '../lib/state.js';
import { normalizeTvCode } from '../lib/tv.js';
import { pendingTvIntent, rememberTvIntent, clearTvIntent } from '../lib/tv-intent.js';
import { button, field, facts, loading, notice, pageHeader } from '../lib/ui.js';
import { formatDate } from '../lib/format.js';
import { addCleanup } from './common.js';

export function tvFailure(error) {
  if (error?.code === 'expired_token') return 'expired';
  if (error?.code === 'invalid_state') return 'used';
  if (error?.code === 'not_found') return 'missing';
  if (error?.code === 'rate_limited') return 'limited';
  return error?.kind === 'network' ? 'network' : 'failed';
}

export default {
  title: () => t('tv.title'),
  render(ctx) {
    const host = h('div', { class: 'tv-content stack' }, loading(3));
    const page = h('section', { class: 'page tv-page' },
      pageHeader({ title: t('tv.title'), lede: t('tv.lede') }).el, host);
    let request = null;
    let timer;
    let ready = false;
    let busy = false;
    let controls = [];
    const sync = () => { for (const control of controls) control.disabled = busy || !state.online; };
    addEventListener('online', sync);
    addEventListener('offline', sync);
    addCleanup(ctx, () => { clearTimeout(timer); request = null; removeEventListener('online', sync); removeEventListener('offline', sync); });

    function failure(error) {
      if (ctx.signal.aborted || error?.kind === 'auth' || error?.kind === 'aborted') return;
      request = null;
      clearTimeout(timer);
      const kind = tvFailure(error);
      form(notice({ tone: 'danger', title: t(`tv.${kind}`), body: t(`tv.${kind}Body`), live: true }));
    }

    function form(message) {
      const input = h('input', { class: 'input tv-code-input', value: pendingTvIntent()?.code ?? '', maxlength: 9,
        autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', required: true });
      const codeField = field({ label: t('tv.codeLabel'), hint: t('tv.codeHint'), control: input });
      const submit = button(t('tv.find'), { type: 'submit', variant: 'accent' });
      const entry = h('form', { class: 'stack', novalidate: true, onsubmit: async event => {
        event.preventDefault();
        if (busy || !ready || !state.online) return;
        const code = normalizeTvCode(input.value);
        if (!code) { codeField.setError(t('tv.invalidCode')); input.focus(); return; }
        rememberTvIntent(code);
        busy = true; sync();
        host.setAttribute('aria-busy', 'true');
        try {
          const result = await ctx.tv.request(code, { signal: ctx.signal });
          if (ctx.signal.aborted) return;
          if (result.user_code !== code || typeof result.device_name !== 'string' || !result.device_name.trim() || result.device_name.length > 200 ||
              typeof result.approval_token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(result.approval_token) ||
              !Number.isFinite(Date.parse(result.expires_at))) throw new Error('Invalid TV request');
          request = result;
          consent();
        } catch (error) { failure(error); }
        finally { busy = false; sync(); host.removeAttribute('aria-busy'); }
      } }, codeField, submit);
      controls = [input, submit]; sync();
      host.replaceChildren(...[message, entry, h('a', { href: ctx.accountUrl('/security'), 'data-link': '', class: 'text-link' }, t('tv.manage'))].filter(Boolean));
    }

    function consent() {
      const remaining = Date.parse(request.expires_at) - Date.now();
      if (remaining <= 0) return failure({ code: 'expired_token' });
      const approve = button(t('tv.approve'), { variant: 'accent', onClick: () => decide('approve') });
      const deny = button(t('tv.deny'), { onClick: () => decide('deny') });
      controls = [approve, deny];
      host.replaceChildren(h('div', { class: 'stack', role: 'region', 'aria-label': t('tv.review') },
        h('h2', { class: 'section-title', tabindex: '-1', 'data-tv-review': '' }, t('tv.review')),
        h('p', { class: 'tv-device-name' }, request.device_name),
        h('p', { class: 'tv-code', 'aria-label': t('tv.codeLabel') }, request.user_code),
        facts([[t('tv.account'), state.user.email], [t('tv.expires'), formatDate(request.expires_at)]]),
        notice({ tone: 'warn', title: t('tv.check'), body: t('tv.checkBody') }),
        h('p', { class: 'muted' }, t('tv.access')),
        h('div', { class: 'row-actions' }, approve, deny)));
      sync();
      host.querySelector('[data-tv-review]').focus();
      timer = setTimeout(() => { if (!busy) failure({ code: 'expired_token' }); }, Math.min(remaining, 600_000));
    }

    async function decide(decision) {
      if (busy || !request || !state.online || ctx.signal.aborted) return;
      if (Date.parse(request.expires_at) <= Date.now()) return failure({ code: 'expired_token' });
      busy = true; sync(); clearTimeout(timer);
      const pending = request;
      request = null; // No second submission or retained token after a decision.
      host.setAttribute('aria-busy', 'true');
      try {
        const result = await ctx.tv.decide(decision, pending, { signal: ctx.signal });
        if (ctx.signal.aborted) return;
        if (result.status !== (decision === 'approve' ? 'approved' : 'denied')) throw new Error('Invalid TV decision');
        clearTvIntent();
        host.replaceChildren(notice({ tone: decision === 'approve' ? 'ok' : 'info', title: t(`tv.${result.status}`), body: t(`tv.${result.status}Body`), live: true }),
          h('a', { href: ctx.accountUrl('/security'), 'data-link': '', class: 'text-link' }, t('tv.manage')));
      } catch (error) { failure(error); }
      finally { busy = false; sync(); host.removeAttribute('aria-busy'); }
    }

    async function init() {
      try {
        ready = await ctx.tv.available({ signal: ctx.signal });
        if (ctx.signal.aborted) return;
        if (!ready) {
          host.replaceChildren(notice({ title: t('tv.unavailable'), body: t('tv.unavailableBody') }));
          return;
        }
        form();
      } catch (error) {
        if (ctx.signal.aborted || error?.kind === 'aborted') return;
        host.replaceChildren(notice({ tone: 'danger', title: t('tv.network'), body: t('tv.networkBody'), live: true }), button(t('common.retry'), { onClick: init }));
      }
    }
    init();
    return page;
  },
};
