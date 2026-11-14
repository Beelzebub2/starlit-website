#!/usr/bin/env node
// Validate first-party catalog structure, not third-party software or media rights.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(readFileSync(resolve(root, 'data/catalog.json'), 'utf8'));
const errors = [];
const ids = new Set();
const allowedStatuses = new Set(['source-visible', 'unavailable']);
for (const item of catalog.repositories || []) {
  if (!/^[a-z][a-z0-9-]{1,48}$/.test(item.id || '') || ids.has(item.id)) errors.push('Invalid or duplicate ID');
  ids.add(item.id);
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(item.repo || '')) errors.push('Invalid repository identifier: ' + item.id);
  if (!['main','master'].includes(item.branch)) errors.push('Unsupported branch: ' + item.id);
  if (!allowedStatuses.has(item.status)) errors.push('Invalid availability: ' + item.id);
  if (!Array.isArray(item.providers) || item.providers.some(p => typeof p !== 'string' || !p.trim())) errors.push('Invalid provider list: ' + item.id);
  if (item.status === 'source-visible' && !item.providers?.length) errors.push('Visible manifest has no providers: ' + item.id);
  if (item.status === 'unavailable' && item.providers?.length) errors.push('Unavailable manifest must not be installable: ' + item.id);
  if (!Array.isArray(item.languages) || !item.languages.length) errors.push('Missing language metadata: ' + item.id);
}
if (!catalog.repositories?.length) errors.push('Catalog is empty');
if (errors.length) { process.stderr.write('Catalog validation failed:\n - ' + errors.join('\n - ') + '\n'); process.exit(2); }
console.log('Catalog metadata validated: ' + catalog.repositories.length + ' repositories. Source rights and code security NOT verified.');
