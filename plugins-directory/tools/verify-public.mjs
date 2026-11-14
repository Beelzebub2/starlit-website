#!/usr/bin/env node
// Verify that the published directory reflects the source snapshot without
// claiming rights, safety review or manifest availability for missing sources.
import { readFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(process.env.STARLIT_PLUGINS_BUILD_OUT ?? join(root,'dist'));
const source = JSON.parse(readFileSync(join(root,'data/catalog.json'),'utf8'));
const published = JSON.parse(readFileSync(join(dist,'catalog.json'),'utf8'));
const state = JSON.parse(readFileSync(join(dist,'publication.json'),'utf8'));
const errors = [];
if (state.mode !== 'community-directory') errors.push('Wrong publication mode');
const expected = source.repositories.map(({publication, ...r}) => r);
if (JSON.stringify(published.repositories) !== JSON.stringify(expected)) errors.push('Published metadata differs from original publisher snapshot');
if (published.repositories.some(r => Object.prototype.hasOwnProperty.call(r,'publication'))) errors.push('Internal review notes exposed');
const available = expected.filter(r => r.status === 'source-visible');
const unavailable = expected.filter(r => r.status === 'unavailable');
const indexedProviders = expected.reduce((n,r) => n + r.providers.length,0);
if (available.some(r => !r.providers.length)) errors.push('Copyable repository with no provider data');
if (unavailable.some(r => r.providers.length)) errors.push('Unavailable repository has providers');
if (state.publishedRepositories !== available.length || state.unavailableRepositories !== unavailable.length ||
    state.totalRepositories !== expected.length || state.indexedProviders !== indexedProviders) errors.push('Publication counts inaccurate');
for (const [file, notice] of [['index.html', 'Informational directory only'], ['pt/index.html','Diretório apenas informativo']]) {
  const html=readFileSync(join(dist,file),'utf8');
  if (!html.includes(notice)) errors.push('Missing public warning: ' + file);
}
const app=readFileSync(join(dist,'assets/site.js'),'utf8');
if (!app.includes("r.status === 'source-visible'") || !app.includes('copyManifest(r)')) errors.push('Missing manual manifest copy gate');
if (errors.length) { process.stderr.write('Community directory verification failed:\n - '+errors.join('\n - ')+'\n'); process.exit(2); }
console.log('Public community directory verified: '+available.length+' manifest sources, '+unavailable.length+' unavailable, '+indexedProviders+' provider entries. No legal/security certification.');
