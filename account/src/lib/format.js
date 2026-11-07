// Locale-aware formatting for dates, counts and durations.
import { lang } from './i18n.js';

const locale = () => (lang() === 'pt' ? 'pt-PT' : 'en-GB');

export function formatNumber(n) {
  return new Intl.NumberFormat(locale()).format(Number(n ?? 0));
}

export function formatDate(value, { time = true } = {}) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale(), time
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export function formatRelative(value, now = Date.now()) {
  if (!value) return '';
  const d = typeof value === 'number' ? value : new Date(value).getTime();
  if (Number.isNaN(d)) return '';
  const diff = (d - now) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' });
  if (abs < 45) return rtf.format(0, 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
  if (abs < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), 'month');
  return rtf.format(Math.round(diff / (86400 * 365)), 'year');
}

/** Milliseconds → "1:02:03" / "42:10". */
export function formatClock(ms) {
  const total = Math.max(0, Math.round(Number(ms ?? 0) / 1000));
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  const pad = n => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** "1:02:03", "42:10" or "90" (seconds) → milliseconds, or null. */
export function parseClock(text) {
  const parts = String(text ?? '').trim().split(':');
  if (!parts.length || parts.length > 3 || parts.some(p => !/^\d{1,4}$/.test(p))) return null;
  const nums = parts.map(Number);
  if (nums.length > 1 && nums.slice(1).some(n => n > 59)) return null;
  const seconds = nums.reduce((acc, n) => acc * 60 + n, 0);
  return seconds * 1000;
}

export function formatSeconds(seconds) {
  const s = Math.max(0, Math.ceil(Number(seconds ?? 0)));
  const m = Math.floor(s / 60);
  return m ? `${m}:${String(s % 60).padStart(2, '0')}` : `${s}s`;
}
