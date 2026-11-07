// Addon and plugin URLs often carry credentials in their path or query
// (debrid keys, tokens). Never show, log or put them in error text in full.

/** Never display opaque URL path segments: even six-character values can be
 * access tokens. Only one known, static manifest filename may remain visible. */
export function redactUrl(raw) {
  let url;
  try { url = new URL(String(raw)); } catch { return { display: '(invalid address)', hidden: true }; }
  const segments = url.pathname.split('/').filter(Boolean);
  const last = segments.at(-1) ?? '';
  const knownStaticFile = last === 'manifest.json';
  const hidden = Boolean(url.username || url.password || url.search || url.hash || segments.length > (knownStaticFile ? 1 : 0));
  let display = `${url.protocol}//${url.host}`;
  if (segments.length > 1 || (segments.length === 1 && !knownStaticFile)) display += '/…';
  if (knownStaticFile) display += '/manifest.json';
  return { display, hidden };
}

/** Remove anything that looks like a URL or bearer token from free text (error messages). */
export function scrubText(text) {
  return String(text ?? '')
    .replace(/https?:\/\/[^\s"'<>)]+/gi, m => redactUrl(m).display)
    .replace(/\b(eyJ[\w-]+\.[\w-]+\.[\w-]*)\b/g, '[token]')
    .replace(/\b(bearer)\s+[\w.-]+/gi, '$1 [token]')
    .replace(/(api[ _-]?key|access[ _-]?token|refresh[ _-]?token|secret|password)[ ]*([:=])[ ]*[^ ,;]+/gi, '$1$2[redacted]')
    .slice(0, 300);
}

/** Settings keys that may hold a credential. They are hidden and never edited here. */
export function isCredentialKey(key) {
  return /(api_?key|access_?token|refresh_?token|auth_?token|_token$|^token$|secret|password|passwd|client_id|access_key|private_key)/i.test(String(key));
}
