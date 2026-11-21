/* Verify every staged historical release, not just current index.html.
 * The old tab already holds its own base URI and can lazy-load workers.
 */
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {dirname,join,relative,resolve,sep} from 'node:path';
const root=resolve(process.env.CRYSTAL_FORGE_STAGED_ROOT||'_site','releases');
const current=process.env.GITHUB_SHA||process.env.CRYSTAL_FORGE_EXPECTED_RELEASE;
assert.match(current||'',/^[0-9a-f]{40}$/i);
const directories=(await readdir(root,{withFileTypes:true})).filter(x=>x.isDirectory()&&/^[0-9a-f]{40}$/i.test(x.name)).map(x=>x.name);
assert(directories.includes(current));
const previous=directories.filter(x=>x!==current);
assert(previous.length>0,'No earlier version retained for long-lived browser tabs');
const importPatterns=[
 /\b(?:import|export)\s+(?:[^;\n]*?\s+from\s*)?['"](\.{1,2}\/[^'"]+)['"]/g,
 /\bimport\s*\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g,
 /\bnew\s+URL\s*\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*,\s*import\.meta\.url/g
];
let total=0;
for(const sha of previous){
 const dir=join(root,sha);
 for(const required of ['studio-v3.js','fabrication-worker.js','studio-model-worker.js',
  'svg-import/index.js','vendor/three/build/three.module.js',
  'vendor/manifold/manifold.js','vendor/manifold/manifold.wasm']){
  const file=join(dir,required),entry=await stat(file);
  assert(entry.isFile()&&entry.size>0,'Incomplete old release '+sha+': '+required);
 }
 let count=0;
 async function visit(folder){
  for(const entry of await readdir(folder,{withFileTypes:true})){
   const file=join(folder,entry.name);
   if(entry.isDirectory()){if(entry.name!=='vendor')await visit(file);continue;}
   if(!file.endsWith('.js'))continue;
   count++;
   const code=await readFile(file,'utf8');
   for(const pattern of importPatterns)for(const match of code.matchAll(pattern)){
    const target=resolve(dirname(file),match[1].split(/[?#]/)[0]);
    assert(target.startsWith(dir+sep),'Old import escapes release: '+match[1]);
    const resolved=await stat(target).catch(()=>null);
    assert(resolved?.isFile()&&resolved.size>0,
     'Missing old import '+sha+': '+relative(dir,file)+' -> '+match[1]);
   }
  }
 }
 await visit(dir);
 assert(count>10,'Old release module count suspiciously small: '+sha);
 total+=count;
}
console.log('Verified '+previous.length+' retained immutable SHA asset trees, '+total+' JS modules, current '+current.slice(0,12));
