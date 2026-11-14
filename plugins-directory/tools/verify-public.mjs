#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(process.env.STARLIT_PLUGINS_BUILD_OUT ?? join(root,'dist'));
const source = JSON.parse(readFileSync(join(root,'data/catalog.json'),'utf8'));
const published = JSON.parse(readFileSync(join(dist,'catalog.json'),'utf8'));
const state = JSON.parse(readFileSync(join(dist,'publication.json'),'utf8'));
const errors = [];
if (state.mode !== 'reviewed-only') errors.push('Not a reviewed-only output');
if (!Array.isArray(published.repositories)) errors.push('No output repository array');
const approved = r => r.status==='source-visible' && r.publication?.reviewState==='approved' &&
  ['publisherVerified','softwareLicenseReviewed','contentRightsReviewed','codeSecurityReviewed'].every(k=>r.publication?.[k]===true);
if (!errors.length) {
 for (const r of published.repositories) {
   const original=source.repositories.find(x=>x.id===r.id);
   if (!original || !approved(original)) errors.push('Unapproved output entry: '+r.id);
 }
 if (published.repositories.length!==state.publishedRepositories) errors.push('Output count mismatch');
 const output=['index.html','pt/index.html','catalog.json'].map(p=>readFileSync(join(dist,p),'utf8'));
 for (const r of source.repositories.filter(r=>!approved(r))) {
  if(output.some(p=>p.includes(r.repo))) errors.push('Unapproved publisher URL leaked: '+r.id);
 }
}
if(errors.length){process.stderr.write('Safe publication refused:\n'+errors.join('\n')+'\n');process.exit(2);}
console.log('Reviewed-only build verified: '+published.repositories.length+' approved repositories; candidates withheld.');
