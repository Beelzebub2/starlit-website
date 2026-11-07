#!/usr/bin/env node
// One Starlit domain: static marketing at / and live account app at /account/.
// Does not enable account writes or emit credentials. CI uses synthetic anon JWT.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const out = resolve(process.env.STARLIT_COMBINED_OUT ?? join(root, 'combined-dist'));
const account = join(root, 'account');
if (out === root || out === account || out === join(root, 'dist') ||
    out === join(account, 'dist') || existsSync(out)) {
  throw new Error('Refusing to overwrite a source or existing output directory');
}
if (process.env.STARLIT_ACCOUNT_WRITES === '1') {
  throw new Error('Combined website requires the account dashboard to remain read-only');
}
const env = {
  ...process.env,
  STARLIT_ACCOUNT_MODE: 'live',
  STARLIT_ACCOUNT_WRITES: '0',
  STARLIT_ACCOUNT_BASE_PATH: '/account/',
  STARLIT_COMBINED_VPS_SITE: '1',
  STARLIT_API_URL: process.env.STARLIT_API_URL ?? 'https://starlit-api.rrmtools.uk',
};
// These scripts only write their own ignored dist folders; neither changes
// the public site metadata or application source.
execFileSync(process.execPath, ['build.mjs'], { cwd: root, env, stdio: 'inherit' });
execFileSync(process.execPath, ['build.mjs'], { cwd: account, env, stdio: 'inherit' });
const publicSite = join(root, 'dist');
const privateApp = join(account, 'dist');
const config = readFileSync(join(privateApp, 'config.js'), 'utf8');
if (!config.includes('"mode": "live"') || !config.includes('"basePath": "/account/"') ||
    !config.includes('"writesEnabled": false') || existsSync(join(privateApp, 'mock'))) {
  throw new Error('Refusing to combine anything other than a read-only live account build');
}
mkdirSync(out, { recursive: false });
cpSync(publicSite, out, { recursive: true });
cpSync(privateApp, join(out, 'account'), { recursive: true });
if (!readFileSync(join(out, '_headers'), 'utf8').includes("script-src 'none'") ||
    !readFileSync(join(out, 'account', '_headers'), 'utf8').includes("script-src 'self'")) {
  throw new Error('Public and account security policies were not kept separate');
}
const count = readdirSync(out, { recursive: true }).length;
console.log('Built the combined VPS website (' + count + ' files, account under /account/, read-only) at ' + out);
