// The sign-in page's night sky: what a Starlit account keeps in sync, drawn
// as a constellation around the Starlit star. It is decorative (the page's
// heading and lede say the same in words), so it's hidden from screen readers.
// Built as SVG elements, never parsed from strings.
import { h } from '../lib/dom.js';
import { t } from '../lib/i18n.js';

const svg = (tag, props, ...children) => h(tag, { svg: true, ...props }, ...children);

// Coordinates in a 640 × 600 box. The hub is the account; each star is a
// section of it, labelled with the same words as the account's navigation.
// Labels sit beside their star, so keep stars far enough from the edges for
// the longest Portuguese label ("Definições sincronizadas").
const HUB = [300, 300];
const STARS = [
  ['nav.profiles', 132, 146, 3.4],
  ['nav.library', 324, 86, 4],
  ['nav.progress', 514, 170, 3],
  ['nav.history', 546, 352, 3.6],
  ['nav.collections', 432, 506, 3.1],
  ['nav.addons', 186, 492, 3.8],
  ['nav.settings', 128, 330, 2.8],
];
// A few links between neighbours, so it reads as a constellation, not a wheel.
const LINKS = [[0, 1], [1, 2], [4, 5]];

// The background stars come from a fixed seed: every visit shows the same sky.
function starField() {
  let seed = 20261109;
  const next = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  return svg('svg', { class: 'sky-field', viewBox: '0 0 800 800', preserveAspectRatio: 'xMidYMid slice', focusable: 'false' },
    Array.from({ length: 120 }, () => svg('circle', {
      cx: (next() * 800).toFixed(1), cy: (next() * 800).toFixed(1),
      r: (0.35 + next() * 1.15).toFixed(2), 'fill-opacity': (0.15 + next() * 0.6).toFixed(2),
    })));
}

// A line from a to b that stops short of both stars.
function link([ax, ay], [bx, by], fromGap, toGap, cls) {
  const length = Math.hypot(bx - ax, by - ay);
  const ux = (bx - ax) / length, uy = (by - ay) / length;
  const d = `M${(ax + ux * fromGap).toFixed(1)} ${(ay + uy * fromGap).toFixed(1)}L${(bx - ux * toGap).toFixed(1)} ${(by - uy * toGap).toFixed(1)}`;
  return svg('path', { class: cls, d, pathLength: '1' });
}

// The four-point star from the Starlit mark, centred on 0,0.
const SPARKLE = 'M0 -1Q.15 -.15 1 0Q.15 .15 0 1Q-.15 .15 -1 0Q-.15 -.15 0 -1Z';

function constellation() {
  const [hx, hy] = HUB;
  const defs = svg('defs', {},
    svg('linearGradient', { id: 'sky-hub-fill', x1: '0', y1: '0', x2: '1', y2: '1' },
      svg('stop', { offset: '0', 'stop-color': '#45D6EB' }),
      svg('stop', { offset: '.52', 'stop-color': '#3965D4' }),
      svg('stop', { offset: '1', 'stop-color': '#B250EF' })),
    svg('radialGradient', { id: 'sky-hub-glow' },
      svg('stop', { offset: '0', 'stop-color': '#7fe3f2', 'stop-opacity': '.32' }),
      svg('stop', { offset: '.45', 'stop-color': '#3965D4', 'stop-opacity': '.12' }),
      svg('stop', { offset: '1', 'stop-color': '#3965D4', 'stop-opacity': '0' })));

  const spokes = STARS.map(([, x, y, r], i) => link(HUB, [x, y], 46, r + 7, `sky-line sky-d${i + 1}`));
  const chords = LINKS.map(([a, b]) => link(STARS[a].slice(1, 3), STARS[b].slice(1, 3), STARS[a][3] + 7, STARS[b][3] + 7,
    'sky-line sky-chord'));

  const stars = STARS.map(([key, x, y, r], i) => {
    const left = x < hx;
    return svg('g', { class: `sky-star sky-e${i + 1}` },
      svg('circle', { class: 'sky-halo', cx: x, cy: y, r: (r * 3.4).toFixed(1) }),
      svg('circle', { class: 'sky-core', cx: x, cy: y, r }),
      svg('text', { class: 'sky-label', x: left ? x - 16 : x + 16, y: y + 5, 'text-anchor': left ? 'end' : 'start' }, t(key)));
  });

  const hub = svg('g', { transform: `translate(${hx} ${hy})` },
    svg('circle', { class: 'sky-glow', r: '120', fill: 'url(#sky-hub-glow)' }),
    svg('g', { class: 'sky-hub' },
      svg('path', { d: SPARKLE, transform: 'scale(38)', fill: 'url(#sky-hub-fill)' }),
      svg('path', { d: SPARKLE, transform: 'scale(15)', fill: '#ffffff' })),
    svg('text', { class: 'sky-label sky-label-hub', y: '78', 'text-anchor': 'middle' }, t('signin.skyHub')));

  // The view box leaves room either side for the labels.
  return svg('svg', { class: 'sky-map', viewBox: '-90 30 790 540', focusable: 'false' },
    defs, svg('g', {}, ...spokes, ...chords), ...stars, hub);
}

export function sky() {
  return h('div', { class: 'signin-sky', 'aria-hidden': 'true' }, starField(), constellation());
}
