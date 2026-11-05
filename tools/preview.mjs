// Local preview of dist/ that behaves like Cloudflare Pages for this site:
// directory URLs serve index.html, "/privacy" redirects to "/privacy/",
// unknown paths get the nearest 404.html with a 404 status, and the headers
// from dist/_headers (including the Content-Security-Policy) are applied.
//   npm run build && npm run preview   ->  http://localhost:8788/
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT) || 8788;
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml',
  '.png':'image/png', '.ico':'image/x-icon', '.woff2':'font/woff2', '.xml':'application/xml',
  '.txt':'text/plain; charset=utf-8' };

// Parse the "/* and /assets/*" blocks of _headers ("! Name" detaches a header).
const rules = [];
for (const line of readFileSync(join(dist, '_headers'), 'utf8').split('\n')) {
  if (!line.trim()) continue;
  if (!/^\s/.test(line)) rules.push({ pattern: line.trim(), set: [], detach: [] });
  else if (line.trim().startsWith('!')) rules.at(-1).detach.push(line.trim().slice(1).trim().toLowerCase());
  else { const i = line.indexOf(':'); rules.at(-1).set.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]); }
}
const headersFor = path => {
  const out = new Map();
  for (const rule of rules) {
    const prefix = rule.pattern.replace(/\*$/, '');
    if (!path.startsWith(prefix)) continue;
    for (const name of rule.detach) out.delete(name);
    for (const [name, value] of rule.set) out.set(name.toLowerCase(), [name, value]);
  }
  return Object.fromEntries([...out.values()]);
};

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const safe = normalize(path).replace(/^(\.\.[/\\])+/, '');
  let file = join(dist, safe);
  if (!file.startsWith(dist.replace(/[/\\]$/, ''))) { res.writeHead(400).end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!path.endsWith('/')) { res.writeHead(308, { Location: path + '/' }).end(); return; }
    file = join(file, 'index.html');
  }
  let status = 200;
  if (!existsSync(file) || path.split('/').some(part => part.startsWith('_'))) {
    status = 404;
    file = join(dist, path.startsWith('/pt/') ? 'pt/404.html' : '404.html');
  }
  res.writeHead(status, { 'Content-Type': types[extname(file)] || 'application/octet-stream', ...headersFor(path) });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`Previewing dist/ at http://localhost:${port}/`));
