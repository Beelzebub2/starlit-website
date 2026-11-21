// Which app or browser a sign-in came from, read from its user agent, so the
// sessions list can show one row per device instead of one per sign-in.
//
// User agents say nothing reliable about the physical device, so "device"
// here means the same kind of client on the same system: every Chrome-on-
// Windows sign-in is one row, every Starlit app sign-in on Android another.

// Older app builds still send their historical, fixed user agent.
const LEGACY_APP_AGENT = 'NuvioMobile/';

const OS = [
  [/Windows NT|Windows/i, 'Windows'],
  [/Android/i, 'Android'],
  [/iPhone|iPad|iPod/i, 'iOS'],
  [/CrOS/i, 'ChromeOS'],
  [/Mac OS X|Macintosh/i, 'macOS'],
  [/Linux/i, 'Linux'],
];
const BROWSERS = [
  [/Edg(?:e|A|iOS)?\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/SamsungBrowser\//, 'Samsung Internet'],
  [/Firefox\/|FxiOS\//, 'Firefox'],
  [/Chrome\/|CriOS\//, 'Chrome'],
  [/Safari\//, 'Safari'],
];

/**
 * @param {string|null|undefined} ua
 * @returns {{ key: string, kind: 'app'|'tv'|'browser'|'tool'|'unknown', browser?: string, os?: string, brand?: string }}
 */
export function describeClient(ua) {
  const s = String(ua ?? '').trim();
  if (!s) return { key: 'unknown', kind: 'unknown' };
  const os = OS.find(([re]) => re.test(s))?.[1] ?? null;
  if (/Tizen|SMART-TV.*Samsung|SamsungBrowser.*TV/i.test(s)) return { key: 'tv:samsung', kind: 'tv', brand: 'Samsung' };
  if (/Web0S|webOS|NetCast/i.test(s)) return { key: 'tv:lg', kind: 'tv', brand: 'LG' };
  if (s.startsWith(LEGACY_APP_AGENT) || /Starlit|ktor-client|okhttp|Dalvik/i.test(s)) return { key: `app:${os ?? ''}`, kind: 'app', os };
  if (/^(node|undici|axios|curl|wget|python|go-http-client|powershell)\b|PowerShell\//i.test(s)) return { key: 'tool', kind: 'tool' };
  const browser = BROWSERS.find(([re]) => re.test(s))?.[1] ?? null;
  if (browser || /Mozilla\//.test(s)) return { key: `browser:${browser ?? ''}:${os ?? ''}`, kind: 'browser', browser, os };
  return { key: 'unknown', kind: 'unknown' };
}

const time = v => { const n = new Date(v ?? 0).getTime(); return Number.isFinite(n) ? n : 0; };

/**
 * Sessions grouped by client, newest activity first; the group holding this
 * browser's session comes first.
 */
export function groupSessions(list) {
  const groups = new Map();
  for (const s of list) {
    const client = describeClient(s.user_agent);
    const g = groups.get(client.key) ?? { client, sessions: [], current: false, lastActive: 0, firstSignedIn: Infinity };
    g.sessions.push(s);
    g.current ||= Boolean(s.is_current);
    g.lastActive = Math.max(g.lastActive, time(s.last_active_at ?? s.signed_in_at));
    g.firstSignedIn = Math.min(g.firstSignedIn, time(s.signed_in_at));
    groups.set(client.key, g);
  }
  return [...groups.values()].sort((a, b) => Number(b.current) - Number(a.current) || b.lastActive - a.lastActive);
}
