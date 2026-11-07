// Sign in. GoTrue checks the password; this page never stores it.
import { h, icon } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { state } from '../lib/state.js';
import { button, field, input, notice } from '../lib/ui.js';

export default {
  title: () => t('signin.title'),
  render(ctx) {
    const email = input({ type: 'email', name: 'email', autocomplete: 'username', required: true, spellcheck: 'false', autocapitalize: 'none' });
    const password = input({ type: 'password', name: 'password', autocomplete: 'current-password', required: true });
    const emailField = field({ label: t('signin.email'), control: email });
    const passwordField = field({ label: t('signin.password'), control: password });
    const status = h('div', { class: 'signin-status', 'aria-live': 'assertive' });
    const submit = button(t('signin.submit'), { variant: 'accent', type: 'submit' });
    submit.classList.add('btn-block');

    const reason = state.signOutReason;
    if (reason === 'revoked' || reason === 'expired') status.append(notice({ tone: 'warn', title: t('signin.revokedTitle'), body: t('signin.revokedBody') }));
    if (reason === 'google-failed') status.append(notice({ tone: 'danger', title: t('signin.googleFailed') }));

    async function onSubmit(e) {
      e.preventDefault();
      status.replaceChildren();
      emailField.setError(email.value.trim() ? null : t('signin.emailRequired'));
      passwordField.setError(password.value ? null : t('signin.passwordRequired'));
      if (!email.value.trim() || !password.value) { (email.value.trim() ? password : email).focus(); return; }
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
      submit.querySelector('span').textContent = t('signin.working');
      try {
        await ctx.auth.signInWithPassword(email.value.trim(), password.value);
        password.value = '';
        await ctx.finishSignIn();
      } catch (error) {
        password.value = '';
        const key = error?.kind === 'auth' ? 'signin.wrong' : error?.kind === 'network' ? 'error.network.body' : 'signin.failed';
        status.append(notice({ tone: 'danger', title: t(key), live: true }));
        password.focus();
      } finally {
        submit.disabled = false;
        submit.removeAttribute('aria-busy');
        submit.querySelector('span').textContent = t('signin.submit');
      }
    }

    async function google() {
      try { location.assign(await ctx.auth.googleRedirectUrl(location.origin + ctx.accountUrl('/auth/callback'))); }
      catch { status.replaceChildren(notice({ tone: 'danger', title: t('signin.googleFailed'), live: true })); }
    }

    return h('section', { class: 'signin' },
      h('div', { class: 'signin-card' },
        h('p', { class: 'eyebrow' }, t('signin.eyebrow')),
        h('h1', { class: 'page-title', tabindex: '-1' }, t('signin.title')),
        h('p', { class: 'lede' }, t('signin.lede')),
        status,
        h('form', { class: 'stack', novalidate: true, onsubmit: onSubmit }, emailField, passwordField, submit),
        ctx.config.googleSignIn ? h('div', { class: 'stack-s signin-alt' }, h('p', { class: 'divider' }, h('span', {}, t('signin.or'))),
          button(t('signin.google'), { onClick: google })) : null,
        h('ul', { role: 'list', class: 'signin-notes' },
          h('li', {}, icon('info', { size: 16 }), h('span', {}, t('signin.noteApp'))),
          h('li', {}, icon('lock', { size: 16 }), h('span', {}, t('signin.noteMemory')))),
        h('p', { class: 'signin-foot' }, t('signin.noAccount'), ' ',
          h('a', { href: `${ctx.config.siteUrl}/download/`, class: 'text-link' }, t('signin.getApp')))));
  },
};
