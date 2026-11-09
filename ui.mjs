// Building blocks shared by the product pages: asset URLs, icons, status
// pills, the app-window and phone frames used by the mockups, and CSS-only tabs.
// Everything returns markup strings; styles live in assets/site.css.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

// Asset URLs carry a content hash so browsers and Cloudflare never keep a stale copy.
export const hash = data => createHash('sha256').update(data).digest('hex').slice(0, 10);
export const asset = path => path + '?v=' + hash(readFileSync(join(root, path)));

export const MARK = asset('/assets/starlit-mark.svg');
export const markImg = (cls, size) =>
  `<img class="${cls}" src="${MARK}" alt="" width="${size}" height="${size}">`;

// ---------------------------------------------------------------- icons

// 24x24 line icons. Names ending in "Fill" are drawn filled instead of stroked.
const SHIELD = '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/>';
const VOLUME = '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>';
const ICONS = {
  monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  bluetooth: '<path d="M7 7l10 10-5 4V3l5 4L7 17"/>',
  wifi: '<path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0"/><path d="M12 19h.01"/>',
  shield: SHIELD,
  shieldCheck: SHIELD + '<path d="M9 12l2 2 4-4"/>',
  shieldAlert: SHIELD + '<path d="M12 9v4M12 16h.01"/>',
  download: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  playFill: '<path d="M7 4.5v15l12-7.5z"/>',
  pause: '<path d="M8.5 5v14M15.5 5v14"/>',
  back10: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v4h4"/>',
  fwd10: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v4h-4"/>',
  skip: '<path d="M5 5l9 7-9 7z"/><path d="M19 5v14"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  subtitles: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 10.5a2 2 0 1 0 0 3M17 10.5a2 2 0 1 0 0 3"/>',
  volume: VOLUME,
  volumeHigh: VOLUME + '<path d="M19 6a8.5 8.5 0 0 1 0 12"/>',
  volumeFill: '<path d="M4 9v6h4l5 4V5L8 9z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  minimize: '<path d="M4 12h16"/>',
  maximize: '<rect x="5" y="5" width="14" height="14"/>',
  close: '<path d="M5 5l14 14M19 5L5 19"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c5 0 9 4.5 10 7a13 13 0 0 1-3 4.1M6.6 6.6C4.3 8 2.6 10.2 2 12c1 2.5 5 7 10 7 1.6 0 3-.4 4.3-1.1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16"/><path d="M20 21v-5h-5"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  listCheck: '<path d="M4 6h11M4 12h11M4 18h7M16 16l2.5 2.5L23 14"/>',
  power: '<path d="M12 3v9"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/>',
  playCircle: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z"/>',
  handoff: '<rect x="2" y="7" width="7" height="13" rx="1.5"/><rect x="12" y="4" width="10" height="13" rx="1.5"/><path d="M9 13h3M10.5 11.5l1.5 1.5-1.5 1.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v.01M17 21h4v-4M14 21v-3"/>',
  keyboard: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  aspect: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 12V8h4M17 12v4h-4"/>',
  gauge: '<path d="M4.5 17a8.5 8.5 0 1 1 15 0"/><path d="M12 13l4-4"/>',
  speaker: '<rect x="6" y="3" width="12" height="18" rx="2"/><circle cx="12" cy="14.5" r="2.5"/><path d="M12 7.5h.01"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 8a4 4 0 0 1 0 10z"/>',
  copy: '<rect x="3" y="8" width="13" height="13" rx="2"/><path d="M8 4h11a2 2 0 0 1 2 2v11"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  compare: '<rect x="2" y="4" width="20" height="14" rx="2"/><path d="M12 4v14"/><path d="M8 21h8"/>',
  chat: '<path d="M4 6h16v10H8l-4 4z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 5.5 4.8"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  key: '<circle cx="8" cy="10" r="4"/><path d="M11 13l9 9M17 19l2-2M15 17l2-2"/>',
  library: '<path d="M4 4h4v16H4zM10 4h4v16h-4zM16 5l3.5-.8 2.8 15.6-3.5.8z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  cast: '<path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/><path d="M2 12a9 9 0 0 1 8 8M2 16a5 5 0 0 1 4 4"/><path d="M2 20h.01"/>',
  drive: '<path d="M22 12H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/><path d="M6 16h.01M10 16h.01"/>',
};

export function icon(name, size = 20, cls = '') {
  const kind = name.endsWith('Fill') ? 'i i-fill' : 'i';
  return `<svg class="${kind}${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
}

// ---------------------------------------------------------------- small parts

export const eyebrow = (text, cls = '') => `<p class="eyebrow${cls ? ' ' + cls : ''}">${text}</p>`;

// Feature status: ok (shipped), beta, no (not yet / not supported).
export const pill = (kind, label, cls = '') =>
  `<span class="pill pill-${kind}${cls ? ' ' + cls : ''}"><span class="pill-dot" aria-hidden="true"></span>${label}</span>`;

// Invented artwork for the mockups: gradients named art-a to art-m in site.css.
export const art = (letter, cls = '') => `<span class="art art-${letter}${cls ? ' ' + cls : ''}"></span>`;

export const checkList = (items, cls = '') => `<ul class="check-list${cls ? ' ' + cls : ''}" role="list">${
  items.map(item => `<li>${icon('check', 18)}<span>${item}</span></li>`).join('')}</ul>`;

export const chips = (items, cls = '', label = '') => `<ul class="chips${cls ? ' ' + cls : ''}" role="list"${label ? ` aria-label="${label}"` : ''}>${
  items.map(item => `<li>${item}</li>`).join('')}</ul>`;

// A grid of cells separated by hairlines: [icon, title, body] per cell.
export const cells = (items, cls) => `<div class="cells ${cls}">${items.map(([ic, title, body]) => `
  <div class="cell">${icon(ic, 28, 'cell-icon')}<h3>${title}</h3><p>${body}</p></div>`).join('')}
</div>`;

// Short titled notes in a grid: [title, body].
export const notes = (items, cls) => `<div class="notes ${cls}">${items.map(([title, body]) => `
  <div><h3>${title}</h3><p>${body}</p></div>`).join('')}
</div>`;

// Numbered steps; the first number is filled in to show where to start.
export const steps = (items, cls = '') => `<ol class="steps${cls ? ' ' + cls : ''}" role="list">${
  items.map(([title, body], i) => `
  <li><span class="step-n" aria-hidden="true">${i + 1}</span><div><h3>${title}</h3><p>${body}</p></div></li>`).join('')}
</ol>`;

// ---------------------------------------------------------------- release data

// Release text comes from GitHub, so it is always escaped here.
export const esc = value => String(value).replace(/[&"<>]/g, c =>
  ({ '&':'&amp;', '"':'&quot;', '<':'&lt;', '>':'&gt;' }[c]));

// Release notes are written in English; mark them so on Portuguese pages.
export const inEnglish = lang => lang === 'pt' ? ' lang="en"' : '';

// assets/site.js uses the same locales and options when it refreshes dates.
const DATE_LOCALES = { en: 'en-GB', pt: 'pt-PT' };
// `hook` is data-rel-field inside a release item, or data-rel for the latest release.
export const releaseDate = (date, lang, hook = 'data-rel-field') => `<time ${hook}="date" datetime="${esc(date)}">${
  new Intl.DateTimeFormat(DATE_LOCALES[lang], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(date + 'T00:00:00Z'))}</time>`;

// A value site.js keeps current from /releases.json: version, headline,
// summary, windows-file or android-file of the latest release.
export const rel = (key, value, tag = 'span', cls = '') =>
  `<${tag}${cls ? ` class="${cls}"` : ''} data-rel="${key}">${esc(value)}</${tag}>`;

// ---------------------------------------------------------------- mockup frames

const winControls = (max = true) => `<span class="win-ctl" aria-hidden="true">${icon('minimize', 12)}${max ? icon('maximize', 12) : ''}${icon('close', 12)}</span>`;

// A Starlit desktop window. Mockups are pictures: `label` describes them.
export function appWindow({ label, body, cls = '', title = 'Starlit', max = true, interactive = false }) {
  const role = interactive ? `role="group" aria-label="${label}"` : `role="img" aria-label="${label}"`;
  return `<div class="win${cls ? ' ' + cls : ''}" ${role}>
<div class="win-bar"><span class="win-title">${markImg('win-mark', 14)}${title}</span>${winControls(max)}</div>
${body}
</div>`;
}

// A dialog-style window with its own title (no Starlit title bar).
export const dialog = ({ label, body, cls = '' }) =>
  `<div class="dlg${cls ? ' ' + cls : ''}" role="img" aria-label="${label}">${body}</div>`;

export function phone({ label, body, cls = '', interactive = false }) {
  const role = interactive ? `role="group" aria-label="${label}"` : `role="img" aria-label="${label}"`;
  return `<div class="phone${cls ? ' ' + cls : ''}" ${role}><div class="phone-screen">${body}</div></div>`;
}

// The pill-shaped tab bar along the top of the desktop app.
export const appTabs = (tabs, active, cls = '') => `<div class="app-tabs${cls ? ' ' + cls : ''}">${
  tabs.map((t, i) => `<span${i === active ? ' class="on"' : ''}>${t}</span>`).join('')}</div>`;

// A segmented control inside a phone or window (static).
export const segments = (items, active, cls = '') => `<div class="seg${cls ? ' ' + cls : ''}">${
  items.map((t, i) => `<span${i === active ? ' class="on"' : ''}>${t}</span>`).join('')}</div>`;

// ---------------------------------------------------------------- tabs without JavaScript

// Radio buttons drive the tabs: site.css shows the panel whose position matches
// the checked radio (up to 7). Without :has() support the first panel stays visible.
// `start` picks the tab shown first; its panel is also the one shown without :has().
export function tabset({ name, label, tabs, panels, cls = '', barCls = '', start = 0 }) {
  const bar = tabs.map((tab, i) => `<label class="tab"><input type="radio" name="${name}"${i === start ? ' checked' : ''}>${tab}</label>`).join('');
  return `<div class="tabset${cls ? ' ' + cls : ''}">
<div class="tab-bar${barCls ? ' ' + barCls : ''}" role="radiogroup" aria-label="${label}">${bar}</div>
<div class="tab-panels">${panels.map((p, i) => `<div class="tab-panel${i === start ? ' tab-start' : ''}">${p}</div>`).join('')}</div>
</div>`;
}

// A pairing QR code drawn as a 25x25 module grid. It's decorative: it encodes nothing.
const QR_FINDERS = 'M0 0h7v7h-7zM1 1v5h5v-5zM2 2h3v3h-3zM18 0h7v7h-7zM19 1v5h5v-5zM20 2h3v3h-3zM0 18h7v7h-7zM1 19v5h5v-5zM2 20h3v3h-3zM16 16h5v5h-5zM17 17v3h3v-3zM18 18h1v1h-1z';
function qrModules() {
  let seed = 482913;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const reserved = (x, y) => (x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16) || (x > 14 && x < 22 && y > 14 && y < 22);
  let d = '';
  for (let y = 0; y < 25; y++) for (let x = 0; x < 25; x++) {
    if (!reserved(x, y) && rnd() < 0.48) d += `M${x} ${y}h1v1h-1z`;
  }
  return d;
}
const QR_DATA = qrModules();
export const qrCode = (size, cls = 'qr') =>
  `<svg class="${cls}" viewBox="-1 -1 27 27" width="${size}" height="${size}" aria-hidden="true" focusable="false"><path d="${QR_FINDERS}"/><path d="${QR_DATA}"/></svg>`;
