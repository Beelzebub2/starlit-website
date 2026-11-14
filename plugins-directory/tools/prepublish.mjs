// Fail-closed production guard. Mere reachability, source-code licenses and
// disclaimers do not establish rights to underlying audiovisual services.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const catalog=JSON.parse(readFileSync(resolve(root,'data/catalog.json'),'utf8'));
const errors=[];
for(const r of catalog.repositories) {
  if(r.publication?.reviewState!=='approved') errors.push(`${r.id}: not approved for publication`);
  for(const field of ['publisherVerified','softwareLicenseReviewed','contentRightsReviewed','codeSecurityReviewed']) {
    if(r.publication?.[field]!==true) errors.push(`${r.id}: ${field} not verified`);
  }
  if(r.status==='unavailable') errors.push(`${r.id}: original source manifest unavailable`);
}
if(!catalog.repositories.length)errors.push('empty catalog');
if(errors.length) {
  process.stderr.write('Production publication refused:\n'+errors.map(e=>' - '+e).join('\n')+'\n');
  process.exitCode=2;
} else {
  console.log(`Production catalog review states valid for ${catalog.repositories.length} repositories. Confirm external legal operator signoff and production QA independently.`);
}
