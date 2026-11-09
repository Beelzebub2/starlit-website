#!/usr/bin/env node
// Refresh the website's release data from the app's GitHub releases.
//
//   npm run releases                      update data/releases.json (commit it)
//   node tools/sync-releases.mjs --out FILE --watch 900
//                                         keep FILE current every 15 minutes
//                                         (the VPS release-feed container)
//
// A failed request never replaces the last good file.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchFeed, validateFeed } from './releases.mjs';

const args = process.argv.slice(2);
const option = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const snapshot = fileURLToPath(new URL('../data/releases.json', import.meta.url));
const out = resolve(option('--out') ?? snapshot);
const watch = Number(option('--watch') ?? 0);
if (option('--watch') !== undefined && !(watch >= 300)) {
  console.error('--watch needs an interval of at least 300 seconds');
  process.exit(2);
}
const pretty = out === snapshot;

const current = () => { try { return readFileSync(out, 'utf8'); } catch { return null; } };

function write(feed) {
  const data = JSON.stringify(validateFeed(feed), null, pretty ? 2 : 0) + '\n';
  if (data === current()) return false;
  mkdirSync(dirname(out), { recursive: true });
  const temp = `${out}.${process.pid}.tmp`;
  writeFileSync(temp, data, { mode: 0o644 });
  renameSync(temp, out);
  return true;
}

let etag;
async function refresh() {
  const result = await fetchFeed({ etag });
  if (result.notModified) return 'unchanged (304)';
  etag = result.etag ?? undefined;
  const latest = result.feed.releases[0].version;
  return (write(result.feed) ? 'updated' : 'unchanged') + `, latest ${latest}`;
}

const stamp = () => new Date().toISOString();
if (!watch) {
  try {
    console.log(`Release data ${await refresh()} -> ${out}`);
  } catch (error) {
    console.error('Could not refresh release data: ' + error.message);
    process.exit(1);
  }
} else {
  // Exit promptly when the container stops.
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => process.exit(0));
  for (;;) {
    try { console.log(`${stamp()} release feed ${await refresh()}`); }
    catch (error) { console.error(`${stamp()} release feed kept the last good file: ${error.message}`); }
    await new Promise(done => setTimeout(done, watch * 1000));
  }
}
