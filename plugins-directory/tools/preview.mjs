// Local development preview. Production is intended for the VPS's existing Caddy/Cloudflare Tunnel.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const mime = { '.html':'text/html; charset=utf-8', '.json':'application/json; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.txt':'text/plain; charset=utf-8', '.xml':'application/xml', '.woff2':'font/woff2' };
const csp = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'; upgrade-insecure-requests";
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('Invalid PORT');
createServer(async (req, res) => {
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
  let filename;
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const path = decodeURIComponent(url.pathname);
    if (path.includes('\\') || path.includes('\0') || path.split('/').includes('..')) throw Error('Invalid request path');
    const leaf = path.endsWith('/') ? path + 'index.html' : path;
    filename = resolve(root, '.' + leaf);
    if (!filename.startsWith(root + sep)) throw Error('Outside public root');
    const details = await stat(filename);
    if (!details.isFile()) throw Error('Not a file');
  } catch { res.writeHead(404); res.end('Not found'); return; }
  try {
    const data = await readFile(filename);
    res.setHeader('Content-Type', mime[extname(filename)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.writeHead(200);
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Starlit Plugins preview: http://127.0.0.1:${port}/`));
