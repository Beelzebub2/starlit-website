// Sign in, create an account, or reset a password. The layout follows the
// Starlit app's own sign-in screen: a Sign in / Create account switch, email
// and password with icons, a show-password toggle, "Forgot password?", and
// passkey and Google side by side. GoTrue checks every credential; this page
// never stores a password. The shell's notices (read-only mode, offline) are
// moved into [data-banners] below the card by app.js.
import { h, icon } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { state } from '../lib/state.js';
import { PASSWORD_MIN } from '../lib/auth.js';
import { button, field, input, notice } from '../lib/ui.js';

// Google's "G", as its sign-in branding asks for next to "Continue with Google".
function googleMark() {
  const path = (fill, d) => h('path', { svg: true, fill, d });
  return h('svg', { class: 'g-mark', viewBox: '0 0 48 48', width: '18', height: '18', 'aria-hidden': 'true', focusable: 'false' },
    path('#EA4335', 'M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'),
    path('#4285F4', 'M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'),
    path('#FBBC05', 'M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'),
    path('#34A853', 'M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z'));
}

// Put an icon inside a text field (the control keeps its label and id).
function withIcon(wrap, control, name, trailing = null) {
  const box = h('span', { class: 'input-icon' }, icon(name, { size: 18 }));
  control.replaceWith(box);
  box.append(control);
  if (trailing) box.append(trailing);
  return wrap;
}

const isEmail = value => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

export default {
  title: () => t('signin.title'),
  render(ctx) {
    let mode = 'signin';   // signin | signup | reset

    // ---- fields
    const email = input({ type: 'email', name: 'email', autocomplete: 'username', required: true, spellcheck: 'false', autocapitalize: 'none', placeholder: 'you@example.com' });
    const password = input({ type: 'password', name: 'password', autocomplete: 'current-password', required: true });
    const emailField = withIcon(field({ label: t('signin.email'), control: email }), email, 'mail');
    const reveal = h('button', { type: 'button', class: 'input-reveal', 'aria-label': t('signin.showPassword'), 'aria-pressed': 'false' }, icon('eye', { size: 18 }));
    reveal.addEventListener('click', () => {
      const shown = password.type === 'text';
      password.type = shown ? 'password' : 'text';
      reveal.setAttribute('aria-pressed', String(!shown));
      reveal.setAttribute('aria-label', t(shown ? 'signin.showPassword' : 'signin.hidePassword'));
      reveal.replaceChildren(icon(shown ? 'eye' : 'eyeOff', { size: 18 }));
      password.focus();
    });
    const passwordField = withIcon(field({ label: t('signin.password'), control: password }), password, 'lock', reveal);
    const forgot = h('button', { type: 'button', class: 'link-btn signin-forgot' }, t('signin.forgot'));
    passwordField.querySelector('.field-label').after(forgot);
    const hint = h('p', { class: 'field-hint signup-hint', hidden: true }, t('signup.passwordHint', { n: PASSWORD_MIN }));
    passwordField.append(hint);

    const status = h('div', { class: 'signin-status', 'aria-live': 'assertive' });
    const submit = button(t('signin.submit'), { variant: 'light', type: 'submit' });
    submit.classList.add('btn-block');
    const form = h('form', { class: 'signin-form', id: 'signin-pane', role: 'tabpanel', 'aria-labelledby': 'signin-tab', novalidate: true, onsubmit: onSubmit }, emailField, passwordField, submit);

    // ---- other ways in (each only where the server supports it)
    const googleButton = ctx.config.googleSignIn ? button(t('signin.googleShort'), { onClick: google, ariaLabel: t('signin.google') }) : null;
    googleButton?.prepend(googleMark());
    const passkeyButton = ctx.config.passkeySignIn ? button(t('signin.passkeyShort'), { icon: 'key', onClick: passkey, ariaLabel: t('signin.passkey') }) : null;
    const alt = googleButton || passkeyButton
      ? h('div', { class: 'signin-alt' }, h('p', { class: 'divider' }, h('span', {}, t('signin.or'))),
        h('div', { class: ['signin-alt-row', googleButton && passkeyButton && 'signin-alt-two'] }, passkeyButton, googleButton))
      : null;

    // ---- the Sign in / Create account switch
    const tabSignIn = h('button', { type: 'button', class: 'seg-btn', role: 'tab', id: 'signin-tab', 'aria-selected': 'true', 'aria-controls': 'signin-pane', onclick: () => setMode('signin') }, t('signin.tabSignIn'));
    const tabCreate = h('button', { type: 'button', class: 'seg-btn', role: 'tab', id: 'signup-tab', 'aria-selected': 'false', 'aria-controls': 'signin-pane', tabindex: '-1', onclick: () => setMode('signup') }, t('signin.tabCreate'));
    const tabs = h('div', { class: 'seg signin-tabs', role: 'tablist', 'aria-label': t('signin.modeLabel') }, tabSignIn, tabCreate);
    // Arrow keys move between the two tabs, as a tab list should.
    tabs.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const next = mode === 'signup' ? 'signin' : 'signup';
      setMode(next);
      (next === 'signup' ? tabCreate : tabSignIn).focus();
    });

    // ---- password reset panel
    const resetEmail = input({ type: 'email', name: 'reset-email', autocomplete: 'username', spellcheck: 'false', autocapitalize: 'none', placeholder: 'you@example.com' });
    const resetField = withIcon(field({ label: t('signin.email'), control: resetEmail }), resetEmail, 'mail');
    const resetSubmit = button(t('reset.submit'), { variant: 'light', type: 'submit' });
    resetSubmit.classList.add('btn-block');
    const back = h('button', { type: 'button', class: 'link-btn signin-back', onclick: () => setMode('signin') }, icon('back', { size: 16 }), t('reset.back'));
    const resetForm = h('form', { class: 'signin-form', novalidate: true, onsubmit: onReset }, resetField, resetSubmit, back);

    const heading = h('h1', { class: 'page-title signin-title', tabindex: '-1' });
    const lede = h('p', { class: 'lede signin-lede' });
    const card = h('div', { class: 'signin-card' });

    const reason = state.signOutReason;
    if (reason === 'revoked' || reason === 'expired') status.append(notice({ tone: 'warn', title: t('signin.revokedTitle'), body: t('signin.revokedBody') }));
    if (reason === 'google-failed') status.append(notice({ tone: 'danger', title: t('signin.googleFailed') }));

    forgot.addEventListener('click', () => { resetEmail.value = email.value.trim(); setMode('reset'); });

    function setMode(next, { keepStatus = false } = {}) {
      mode = next;
      if (!keepStatus) status.replaceChildren();
      emailField.setError(null); passwordField.setError(null); resetField.setError(null);
      for (const [tab, on] of [[tabSignIn, mode !== 'signup'], [tabCreate, mode === 'signup']]) {
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
      }
      const signup = mode === 'signup';
      heading.textContent = t(mode === 'reset' ? 'reset.title' : signup ? 'signup.title' : 'signin.welcome');
      lede.textContent = t(mode === 'reset' ? 'reset.lede' : signup ? 'signup.lede' : 'signin.welcomeLede');
      password.autocomplete = signup ? 'new-password' : 'current-password';
      submit.querySelector('span').textContent = t(signup ? 'signup.submit' : 'signin.submit');
      forgot.hidden = signup;
      hint.hidden = !signup;
      if (passkeyButton) passkeyButton.hidden = signup;
      alt?.querySelector('.signin-alt-row')?.classList.toggle('signin-alt-two', Boolean(googleButton && passkeyButton && !signup));
      form.setAttribute('aria-labelledby', signup ? 'signup-tab' : 'signin-tab');
      card.replaceChildren(...(mode === 'reset' ? [status, resetForm] : [tabs, status, form, alt].filter(Boolean)));
      ctx.setTitle(heading.textContent);
    }

    function busy(btn, on, label) {
      btn.disabled = on;
      btn.toggleAttribute('aria-busy', on);
      btn.querySelector('span').textContent = label;
    }

    async function onSubmit(e) {
      e.preventDefault();
      status.replaceChildren();
      const address = email.value.trim();
      const signup = mode === 'signup';
      emailField.setError(!address ? t('signin.emailRequired') : signup && !isEmail(address) ? t('signup.emailInvalid') : null);
      passwordField.setError(!password.value ? t('signin.passwordRequired')
        : signup && password.value.length < PASSWORD_MIN ? t('signup.tooShort', { n: PASSWORD_MIN }) : null);
      if (form.querySelector('[aria-invalid="true"]')) { form.querySelector('[aria-invalid="true"]').focus(); return; }
      busy(submit, true, t(signup ? 'signup.working' : 'signin.working'));
      try {
        if (signup) {
          const result = await ctx.auth.signUp(address, password.value);
          password.value = '';
          if (!result.pending) { await ctx.finishSignIn(); return; }
          setMode('signin');
          email.value = address;
          status.append(notice({ tone: 'info', title: t('signup.checkTitle'), body: t('signup.checkBody', { email: address }), live: true }));
          password.focus();
          return;
        }
        await ctx.auth.signInWithPassword(address, password.value);
        password.value = '';
        await ctx.finishSignIn();
      } catch (error) {
        password.value = '';
        const key = signup
          ? (error?.code === 'weak_password' ? 'signup.weak' : error?.kind === 'network' ? 'error.network.body' : 'signup.failed')
          : (error?.kind === 'auth' ? 'signin.wrong' : error?.kind === 'network' ? 'error.network.body' : 'signin.failed');
        status.append(notice({ tone: 'danger', title: t(key), live: true }));
        password.focus();
      } finally {
        busy(submit, false, t(mode === 'signup' ? 'signup.submit' : 'signin.submit'));
      }
    }

    async function onReset(e) {
      e.preventDefault();
      status.replaceChildren();
      const address = resetEmail.value.trim();
      resetField.setError(isEmail(address) ? null : t('signup.emailInvalid'));
      if (!isEmail(address)) { resetEmail.focus(); return; }
      busy(resetSubmit, true, t('reset.working'));
      try {
        await ctx.auth.requestPasswordReset(address);
        email.value = address;
        setMode('signin');
        status.append(notice({ tone: 'info', title: t('reset.sentTitle'), body: t('reset.sentBody', { email: address }), live: true }));
      } catch {
        status.append(notice({ tone: 'danger', title: t('reset.failed'), live: true }));
      } finally {
        busy(resetSubmit, false, t('reset.submit'));
      }
    }

    async function google() {
      try { location.assign(await ctx.auth.googleRedirectUrl(location.origin + ctx.accountUrl('/auth/callback'))); }
      catch { status.replaceChildren(notice({ tone: 'danger', title: t('signin.googleFailed'), live: true })); }
    }

    async function passkey() {
      status.replaceChildren();
      busy(passkeyButton, true, t('signin.passkeyWorking'));
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
        busy(passkeyButton, false, t('signin.passkeyShort'));
      }
    }

    setMode('signin', { keepStatus: true });

    return h('section', { class: 'signin' },
      h('div', { class: 'signin-column' },
        h('img', { class: 'signin-mark', src: (ctx.config.basePath === '/' ? '' : ctx.config.basePath.slice(0, -1)) + '/starlit-mark.svg', alt: '', width: '64', height: '64' }),
        heading, lede, card,
        h('div', { class: 'signin-about' },
          h('div', { class: 'signin-banners', 'data-banners': '' }),
          h('ul', { role: 'list', class: 'signin-notes' },
            h('li', {}, icon('phone', { size: 16 }), h('span', {}, t('signin.noteApp'), ' ',
              h('a', { href: `${ctx.config.siteUrl}/download/`, class: 'text-link' }, t('signin.getApp')))),
            h('li', {}, icon('lock', { size: 16 }), h('span', {}, t('signin.noteMemory')))))));
  },
};
