// Local preview of account/dist/ that behaves like Cloudflare Pages in
// single-page mode: files are served as-is, any other path gets index.html,
// and the headers from dist/_headers (including the CSP) are applied.
//   npm run build && npm run preview   ->  http://localhost:8789/
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT) || 8789;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json' };

const rules = [];
for (const line of readFileSync(join(dist, '_headers'), 'utf8').split('\n')) {
  if (!line.trim()) continue;
  if (!/^\s/.test(line)) rules.push({ pattern: line.trim(), set: [] });
  else { const i = line.indexOf(':'); rules.at(-1).set.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]); }
}
const headersFor = path => {
  const out = new Map();
  for (const rule of rules) {
    if (!path.startsWith(rule.pattern.replace(/\*$/, ''))) continue;
    for (const [name, value] of rule.set) out.set(name.toLowerCase(), [name, value]);
  }
  return Object.fromEntries([...out.values()]);
};

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const safe = normalize(path).replace(/^([.][.][/\\])+/, '');
  let file = join(dist, safe);
  if (!file.startsWith(dist.replace(/[/\\]$/, '') + sep) && file !== dist.replace(/[/\\]$/, '')) { res.writeHead(400).end(); return; }
  const isFile = existsSync(file) && statSync(file).isFile() && !path.split('/').some(part => part.startsWith('_'));
  if (!isFile) file = join(dist, 'index.html');
  res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', ...headersFor(path) });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`Previewing the account dashboard at http://localhost:${port}/`));
