// Sign in. GoTrue checks the password; this page never stores it.
// Layout: the night sky (signin-sky.js) on the left on wide screens, as a
// band on top on phones; the form beside it. The shell's notices (read-only
// mode, offline) are moved into [data-banners] below the form by app.js.
import { h, icon } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { state } from '../lib/state.js';
import { button, field, input, notice } from '../lib/ui.js';
import { sky } from './signin-sky.js';

// Google's "G", as its sign-in branding asks for next to "Continue with Google".
function googleMark() {
  const path = (fill, d) => h('path', { svg: true, fill, d });
  return h('svg', { class: 'g-mark', viewBox: '0 0 48 48', width: '18', height: '18', 'aria-hidden': 'true', focusable: 'false' },
    path('#EA4335', 'M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'),
    path('#4285F4', 'M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'),
    path('#FBBC05', 'M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'),
    path('#34A853', 'M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z'));
}

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
    const googleButton = ctx.config.googleSignIn ? button(t('signin.google'), { onClick: google }) : null;
    googleButton?.prepend(googleMark());
    const passkeyButton = ctx.config.passkeySignIn ? button(t('signin.passkey'), { icon: 'key', onClick: passkey }) : null;

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

    async function passkey() {
      status.replaceChildren();
      passkeyButton.disabled = true;
      passkeyButton.setAttribute('aria-busy', 'true');
      passkeyButton.querySelector('span').textContent = t('signin.passkeyWorking');
      try {
        await ctx.auth.signInWithPasskey();
        await ctx.finishSignIn();
      } catch (error) {
        status.replaceChildren(notice({
          tone: 'danger',
          title: t(error?.kind === 'unsupported' ? 'signin.passkeyUnsupported' : 'signin.passkeyFailed'),
          live: true,
        }));
      } finally {
        passkeyButton.disabled = false;
        passkeyButton.removeAttribute('aria-busy');
        passkeyButton.querySelector('span').textContent = t('signin.passkey');
      }
    }

    return h('section', { class: 'signin' },
      sky(),
      h('div', { class: 'signin-panel' },
        h('div', { class: 'signin-card' },
          h('h1', { class: 'page-title signin-title', tabindex: '-1' }, t('signin.title')),
          h('p', { class: 'lede signin-lede' }, t('signin.lede')),
          status,
          h('form', { class: 'signin-form', novalidate: true, onsubmit: onSubmit }, emailField, passwordField, submit),
          googleButton || passkeyButton ? h('div', { class: 'signin-alt' },
            h('p', { class: 'divider' }, h('span', {}, t('signin.or'))),
            passkeyButton, googleButton) : null,
          h('div', { class: 'signin-about' },
            h('div', { class: 'signin-banners', 'data-banners': '' }),
            h('ul', { role: 'list', class: 'signin-notes' },
              h('li', {}, icon('phone', { size: 16 }), h('span', {}, t('signin.noteApp'), ' ',
                h('a', { href: `${ctx.config.siteUrl}/download/`, class: 'text-link' }, t('signin.getApp')))),
              h('li', {}, icon('lock', { size: 16 }), h('span', {}, t('signin.noteMemory'))))))));
  },
};
