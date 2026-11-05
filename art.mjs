// Brand artwork drawn from the official Starlit mark (nuvio-native
// branding/starlit-mark.svg and branding/generate_brand_assets.py).
// The mark's geometry and gradient stops must not be altered here.

export const BRAND = { cyan:'#45D6EB', royal:'#3965D4', violet:'#B250EF' };

// The four-point star used in the mark: curved sides pinched towards the centre.
export function sparkle(cx, cy, rx, ry, waist = 0.12) {
  const kx = rx * waist, ky = ry * waist, f = n => Number(n.toFixed(1));
  return `M${f(cx)} ${f(cy - ry)}Q${f(cx + kx)} ${f(cy - ky)} ${f(cx + rx)} ${f(cy)}` +
    `Q${f(cx + kx)} ${f(cy + ky)} ${f(cx)} ${f(cy + ry)}` +
    `Q${f(cx - kx)} ${f(cy + ky)} ${f(cx - rx)} ${f(cy)}` +
    `Q${f(cx - kx)} ${f(cy - ky)} ${f(cx)} ${f(cy - ry)}Z`;
}

const PLAY = 'M381.5 262.2 Q250.0 190.0 250.0 340.0 L250.0 684.0 Q250.0 834.0 381.5 761.8 L704.5 584.2 Q836.0 512.0 704.5 439.8 Z';
const STAR = 'M470 334 Q488.0 490.6 620 512 Q488.0 533.4 470 690 Q452.0 533.4 320 512 Q452.0 490.6 470 334 Z';
const TWINKLE = 'M788 252 Q795.0 310.1 846 318 Q795.0 325.9 788 384 Q781.0 325.9 730 318 Q781.0 310.1 788 252 Z';

// The official mark. `uid` keeps gradient ids unique when a page shows it twice.
export function mark(uid, className = 'mark', viewBox = '214 190 632 644') {
  return `<svg class="${className}" viewBox="${viewBox}" aria-hidden="true" focusable="false">
<defs><path id="${uid}-play" d="${PLAY}"/><clipPath id="${uid}-clip"><use href="#${uid}-play"/></clipPath>
<linearGradient id="${uid}-body" x1="250" y1="190" x2="836" y2="834" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${BRAND.cyan}"/><stop offset=".52" stop-color="${BRAND.royal}"/><stop offset="1" stop-color="${BRAND.violet}"/></linearGradient>
<linearGradient id="${uid}-twinkle" x1="730" y1="252" x2="846" y2="384" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${BRAND.cyan}"/><stop offset="1" stop-color="${BRAND.violet}"/></linearGradient>
<linearGradient id="${uid}-sheen" x1="250" y1="190" x2="520" y2="640" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFF" stop-opacity=".3"/><stop offset="1" stop-color="#FFF" stop-opacity="0"/></linearGradient>
<radialGradient id="${uid}-glow" cx="470" cy="512" r="250" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFF" stop-opacity=".5"/><stop offset=".55" stop-color="#FFF" stop-opacity=".12"/><stop offset="1" stop-color="#FFF" stop-opacity="0"/></radialGradient></defs>
<g transform="translate(-36 0)"><g class="mark-body"><use href="#${uid}-play" fill="url(#${uid}-body)"/>
<g clip-path="url(#${uid}-clip)"><rect width="1024" height="1024" fill="url(#${uid}-sheen)"/><circle cx="470" cy="512" r="250" fill="url(#${uid}-glow)"/></g>
<path class="mark-star" d="${STAR}" fill="#FFF"/></g>
<path class="mark-twinkle" d="${TWINKLE}" fill="url(#${uid}-twinkle)"/></g></svg>`;
}

// Small deterministic PRNG so every build produces byte-identical skies.
function random(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// A wide field of pinpoint stars and a few sparkles, used as a CSS background.
// `tone` is the star colour for the theme (white at night, indigo at dawn).
export function skySvg(tone, opacityScale = 1) {
  const rnd = random(20261105), w = 1600, h = 900, parts = [];
  // Kept faint and small: this sits behind headlines and body text.
  for (let i = 0; i < 140; i++) {
    const x = rnd() * w, y = rnd() * h, r = 0.6 + rnd() * rnd() * 1.4;
    const o = Math.min(1, (0.12 + rnd() * 0.5) * opacityScale);
    parts.push(`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" opacity="${o.toFixed(2)}"/>`);
  }
  for (let i = 0; i < 12; i++) {
    const x = rnd() * w, y = rnd() * h, s = 3 + rnd() * rnd() * 6;
    const o = Math.min(1, (0.22 + rnd() * 0.38) * opacityScale);
    parts.push(`<path d="${sparkle(x, y, s, s * 1.17)}" opacity="${o.toFixed(2)}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"><g fill="${tone}">${parts.join('')}</g></svg>\n`;
}

// The sparkle on its own, used as a CSS mask for list markers.
export const sparkleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 117"><path d="${sparkle(50, 58.5, 50, 58.5)}"/></svg>\n`;

// A handful of foreground sparkles that twinkle slowly next to the hero mark.
// Each is positioned and sized by its `tw-N` class in site.css.
export function heroSparkles(count = 4) {
  const d = sparkle(50, 58.5, 50, 58.5);
  return Array.from({ length: count }, (_, i) =>
    `<svg class="tw tw-${i + 1}" viewBox="0 0 100 117" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`).join('');
}
