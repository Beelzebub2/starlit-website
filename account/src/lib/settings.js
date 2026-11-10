// Settings blob editor model. The blobs are owned by the app (version 4 of
// MobileProfileSettingsBlob at the time of writing) and gain keys over time,
// so the editor only changes the leaves you touch and preserves every other
// key exactly. Credential-like keys are never shown or sent from here (they
// live in the separate provider-credential store), and device-specific values
// such as download folders or hardware decoding are read-only.
import { isCredentialKey } from './redact.js';
import { leaves, setAt, clone, isSafeRecordKey } from './merge.js';

// Matched against whole words of a key (split on _ - .), so "prefer_cached" is not "cache".
const DEVICE_WORDS = new Set(['download', 'downloads', 'path', 'paths', 'dir', 'directory', 'folder', 'cache', 'storage', 'hardware',
  'hwdec', 'decoder', 'gpu', 'vulkan', 'd3d', 'opengl', 'install', 'device']);
const isDeviceKey = key => String(key).toLowerCase().split(/[_\-.]+/).some(word => DEVICE_WORDS.has(word));

/** How a leaf may be presented: credential (hidden), device (read-only), opaque (read-only), meta (read-only) or editable. */
export function classify(path, value) {
  if (path.some(isCredentialKey)) return 'credential';
  if (path.some(isDeviceKey)) return 'device';
  const leaf = String(path.at(-1));
  if (path.length === 1 && leaf === 'version') return 'meta';
  // Serialized payload strings and patterns are opaque app formats: edit them in the app.
  if (typeof value === 'string' && (/_payload$|_pattern$|_screens$/.test(leaf) || /^[[{]/.test(value.trim()))) return 'opaque';
  if (Array.isArray(value) || (value && typeof value === 'object')) return 'opaque';
  return 'editable';
}

/** Group leaves under their first one or two path segments for display. */
export function sections(value) {
  const groups = new Map();
  let hiddenCredentials = 0;
  for (const { path, value: leafValue } of leaves(value ?? {}).values()) {
    const kind = classify(path, leafValue);
    if (kind === 'credential') { hiddenCredentials++; continue; }
    const groupPath = path[0] === 'features' && path.length > 2 ? path.slice(0, 2) : path.slice(0, Math.max(1, path.length - 1));
    const id = groupPath.join('.');
    if (!groups.has(id)) groups.set(id, { id, path: groupPath, items: [] });
    groups.get(id).items.push({ path, value: leafValue, kind, type: leafValue === null ? 'null' : typeof leafValue });
  }
  return { groups: [...groups.values()], hiddenCredentials };
}

/** Apply one edit, returning a new object. Refuses credential paths outright. */
export function withValue(blob, path, value) {
  if (path.some(isCredentialKey)) throw new Error('credential-path');
  return setAt(clone(blob ?? {}), path, value);
}

/** Drop any credential-like key before sending (the server strips known ones too). */
export function withoutCredentials(value) {
  if (Array.isArray(value)) return value.map(withoutCredentials);
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) if (isSafeRecordKey(k) && !isCredentialKey(k)) out[k] = withoutCredentials(v);
  return out;
}


export function humanize(key) {
  const text = String(key).replace(/_payload$|_settings$/, '').replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
  return text ? text[0].toUpperCase() + text.slice(1) : String(key);
}

export function changedPaths(original, edited) {
  const A = leaves(original ?? {}), B = leaves(edited ?? {});
  const out = [];
  for (const k of new Set([...A.keys(), ...B.keys()])) {
    if (JSON.stringify(A.get(k)?.value) !== JSON.stringify(B.get(k)?.value)) out.push(JSON.parse(k));
  }
  return out;
}
