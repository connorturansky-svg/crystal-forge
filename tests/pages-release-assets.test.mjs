// The Pages entrypoint lives at / while scripts load from /releases/SHA/.
// Resolve every relative ES import in the release snapshot before deployment,
// including nested files such as svg-import/index.js. Never accept an incomplete
// release just because a local repository-root browser smoke test passed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const release=path.resolve(process.argv[2]||root);
const inspect=(rootDir)=>{
 const visit=['studio-v3.js'],seen=new Set(),missing=[];
 while(visit.length){
  const file=visit.pop();if(seen.has(file))continue;seen.add(file);
  const absolute=path.join(rootDir,file);
  if(!fs.existsSync(absolute)){missing.push(file);continue;}
  const source=fs.readFileSync(absolute,'utf8');
  const imports=[
   ...source.matchAll(/\bfrom\s*['"](\.[^'"]+)['"]/g),
   ...source.matchAll(/\bimport\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g),
   ...source.matchAll(/\bimport\s*['"](\.[^'"]+)['"]/g)
  ];
  for(const match of imports){
   const relative=path.relative(rootDir,path.resolve(path.dirname(absolute),match[1]));
   assert(!relative.startsWith('..'),'Import escapes release root: '+file+' -> '+match[1]);
   visit.push(relative);
  }
 }
 return {seen,missing};
};
const complete=inspect(root);
assert.equal(complete.missing.length,0,'The repository itself has missing ES imports');
assert(complete.seen.has(path.join('svg-import','index.js')),'Regression fixture needs nested import');
assert(fs.existsSync(path.join(root,'sensory-studio.css')),'Missing referenced Studio stylesheet');

const actual=inspect(release);
assert.deepEqual(actual.missing,[],'Published release is missing ES modules: '+actual.missing.join(', '));
for(const required of ['studio-v3.js','sensory-studio.js','sensory-studio.css','svg-import/index.js',
 'svg-import/document.js','svg-import/path.js','svg-import/contours.js','fabrication-worker.js']){
 assert(fs.existsSync(path.join(release,required)),'Missing real deployed asset: '+required);
}
console.log('PAGES RELEASE ASSETS PASSED: '+actual.seen.size+' reachable modules; nested SVG import tree and worker are present.');
