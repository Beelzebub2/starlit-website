// Conflict helpers for HTTP 409. The server never accepts a stale snapshot, so
// after a conflict we load the latest version and re-apply *your* edits on top
// of it for review. Where both sides changed the same thing differently, the
// other device's value is kept until you explicitly choose yours.

export function equal(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((v, i) => equal(v, b[i]));
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every(k => Object.prototype.hasOwnProperty.call(b, k) && equal(a[k], b[k]));
}

export const clone = value => (value === undefined ? undefined : structuredClone(value));

/**
 * Three-way merge of keyed lists (addons by url, collections by id).
 * Returns { items, conflicts: [{ key, mine, theirs }], summary }.
 * Order follows your list; items that only exist on the other device go last.
 */
export function mergeLists({ base, mine, theirs, key, compare = equal }) {
  const index = list => new Map(list.map(item => [key(item), item]));
  const B = index(base), M = index(mine), T = index(theirs);
  const summary = { removed: 0, added: 0, changed: 0, incoming: 0, vanished: 0, kept: 0 };
  const conflicts = [];
  const result = new Map();

  for (const [k, t] of T) {
    const b = B.get(k), m = M.get(k);
    if (b && !m) { summary.removed++; continue; }                 // you removed it
    if (!b && !m) { result.set(k, clone(t)); summary.incoming++; continue; }  // new on the other device
    if (!b && m) {                                                  // both added the same key
      if (!compare(m, t)) conflicts.push({ key: k, mine: clone(m), theirs: clone(t) });
      result.set(k, clone(t));
      continue;
    }
    const youChanged = !compare(b, m), theyChanged = !compare(b, t);
    if (youChanged && theyChanged && !compare(m, t)) { conflicts.push({ key: k, mine: clone(m), theirs: clone(t) }); result.set(k, clone(t)); summary.kept++; }
    else if (youChanged) { result.set(k, clone(m)); summary.changed++; }
    else result.set(k, clone(t));
  }
  for (const [k, m] of M) {
    if (T.has(k)) continue;
    if (B.has(k)) { summary.vanished++; continue; }                // the other device removed something you kept
    result.set(k, clone(m)); summary.added++;                       // you added it
  }

  const ordered = [];
  for (const m of mine) if (result.has(key(m))) { ordered.push(result.get(key(m))); result.delete(key(m)); }
  for (const t of theirs) if (result.has(key(t))) { ordered.push(result.get(key(t))); result.delete(key(t)); }
  return { items: ordered, conflicts, summary };
}

/** Leaf paths of a JSON value; arrays are treated as single values. */
export function leaves(value, prefix = [], out = new Map()) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const keys = Object.keys(value);
    if (!keys.length && prefix.length) out.set(JSON.stringify(prefix), { path: prefix, value: {} });
    for (const k of keys) leaves(value[k], [...prefix, k], out);
  } else if (prefix.length) {
    out.set(JSON.stringify(prefix), { path: prefix, value });
  }
  return out;
}

export function getAt(obj, path) {
  let cur = obj;
  for (const p of path) { if (cur === null || typeof cur !== 'object') return undefined; cur = cur[p]; }
  return cur;
}

export function setAt(obj, path, value) {
  const root = obj && typeof obj === 'object' ? obj : {};
  let cur = root;
  path.slice(0, -1).forEach(p => {
    if (!cur[p] || typeof cur[p] !== 'object' || Array.isArray(cur[p])) cur[p] = {};
    cur = cur[p];
  });
  if (value === undefined) delete cur[path.at(-1)];
  else cur[path.at(-1)] = value;
  return root;
}

/**
 * Three-way merge of settings objects at leaf level. Unknown keys from the
 * latest server version are always preserved. Returns { value, conflicts }.
 */
export function mergeObjects(base, mine, theirs) {
  const B = leaves(base ?? {}), M = leaves(mine ?? {}), T = leaves(theirs ?? {});
  const value = clone(theirs ?? {});
  const conflicts = [];
  const keys = new Set([...B.keys(), ...M.keys(), ...T.keys()]);
  for (const k of keys) {
    const path = JSON.parse(k);
    const b = B.get(k)?.value, m = M.get(k)?.value, t = T.get(k)?.value;
    if (equal(m, b) || equal(m, t)) continue;          // you did not change it, or both agree
    if (equal(t, b)) { setAt(value, path, clone(m)); continue; }  // only you changed it
    conflicts.push({ path, base: clone(b), mine: clone(m), theirs: clone(t) });
  }
  return { value, conflicts };
}
