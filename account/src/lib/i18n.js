// English and Portuguese (Portugal), like the public website.
import { STRINGS } from './strings.js';
import { readPref, writePref } from './state.js';

let current = (() => {
  const saved = readPref('lang');
  if (saved === 'en' || saved === 'pt') return saved;
  const nav = typeof navigator === 'undefined' ? 'en' : String(navigator.language || 'en').toLowerCase();
  return nav.startsWith('pt') ? 'pt' : 'en';
})();

export const lang = () => current;

export function setLang(next) {
  if (next !== 'en' && next !== 'pt') return;
  current = next;
  writePref('lang', next);
  if (typeof document !== 'undefined') document.documentElement.lang = next === 'pt' ? 'pt-PT' : 'en';
}

/** t('key', { n: 3 }) → string. Values may be functions of the variables (plurals). */
export function t(key, vars = {}) {
  const entry = STRINGS[current]?.[key] ?? STRINGS.en[key];
  if (entry === undefined) return key;
  const text = typeof entry === 'function' ? entry(vars) : entry;
  return text.replace(/\{(\w+)\}/g, (m, name) => (vars[name] === undefined ? m : String(vars[name])));
}
