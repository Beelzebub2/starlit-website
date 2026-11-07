// Choose which profile to manage. Nothing profile-specific is loaded before this.
import { h, icon } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { state } from '../lib/state.js';
import { avatar } from '../lib/ui.js';

export default {
  title: () => t('choose.title'),
  render(ctx) {
    const back = state.returnTo && state.returnTo !== '/choose-profile' ? state.returnTo : '/';
    return h('section', { class: 'choose' },
      h('p', { class: 'eyebrow' }, t('choose.eyebrow')),
      h('h1', { class: 'page-title', tabindex: '-1' }, t('choose.title')),
      h('p', { class: 'lede' }, t('choose.lede')),
      h('ul', { role: 'list', class: 'choose-grid' }, state.profiles.map(p => h('li', {},
        h('button', { type: 'button', class: 'choose-card', onclick: async () => { if (await ctx.selectProfile(p.profile_index, { to: back })) state.returnTo = null; } },
          avatar(p, 'l'),
          h('span', { class: 'choose-name' }, p.name),
          h('span', { class: 'choose-meta' }, p.profile_index === 1 ? t('profiles.primary') : t('profiles.number', { n: p.profile_index }),
            p.pin_enabled ? [' · ', icon('lock', { size: 13 }), ' ', t('profiles.pinOn')] : null))))));
  },
};
