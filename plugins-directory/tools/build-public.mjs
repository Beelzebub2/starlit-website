#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...process.env, STARLIT_PLUGINS_PUBLICATION_MODE: 'reviewed-only' };
for (const script of ['build.mjs','tools/verify-public.mjs']) {
 const result = spawnSync(process.execPath, [resolve(root,script)], { cwd:root,env,stdio:'inherit' });
 if (result.error) throw result.error;
 if (result.status !== 0) process.exit(result.status ?? 1);
}
