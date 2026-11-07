import { h } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { link, pageHeader } from '../lib/ui.js';

export default {
  title: () => t('notFound.title'),
  render() {
    const head = pageHeader({ eyebrow: '404', title: t('notFound.title'), lede: t('notFound.body') });
    return h('section', { class: 'page' }, head.el, link(t('nav.overview'), '/', { variant: 'ghost', icon: 'home' }));
  },
};
