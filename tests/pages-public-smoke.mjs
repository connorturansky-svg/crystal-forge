// Checks the *published* SHA-scoped GitHub Pages tree, not only the checkout.
// A successful deployment action does not guarantee that module imports work.
import assert from 'node:assert/strict';
const sha=process.argv[2];
assert(/^[a-f0-9]{40}$/i.test(sha||''),'Provide the exact deployed SHA');
const supplied=process.env.PAGE_URL||'https://connorturansky-svg.github.io/crystal-forge/';
const site=new URL(supplied.endsWith('/')?supplied:supplied+'/');
const resources=[
 'index.html',
 'studio-v3.js','studio-startup-recovery.js','sensory-studio.js','sensory-studio.css',
 'svg-import/index.js','svg-import/document.js','svg-import/path.js','svg-import/contours.js'
];
async function verify(){
 const page=new URL('./',site);page.searchParams.set('release-check',sha);
 const doc=await fetch(page,{cache:'no-store'});
 assert(doc.ok,'Public GitHub Pages index returned HTTP '+doc.status);
 const html=await doc.text();
 assert(html.includes('name="studio-release" content="'+sha+'"'),
  'Public index still points at a different release SHA');
 assert(html.includes('<base href="./releases/'+sha+'/">'),
  'Public index must resolve modules to the exact deployment directory');
 for(const name of resources.slice(1)){
  const url=new URL('releases/'+sha+'/'+name,site);url.searchParams.set('verify',sha);
  const response=await fetch(url,{cache:'no-store'});
  assert(response.ok,'Published '+name+' is missing (HTTP '+response.status+')');
  const body=await response.text();
  assert(body.length>20,'Published '+name+' is unexpectedly empty');
  if(name.endsWith('.js'))assert(!body.trimStart().startsWith('<!doctype html'),
   'JS request returned an HTML fallback: '+name);
 }
}
let last=null;
for(let attempt=1;attempt<=12;attempt++){
 try{
  await verify();console.log('Live Pages release '+sha+' reachable: '+resources.length+' essential resources, including all nested SVG modules.');
  process.exit(0);
 }catch(error){
  last=error;
  console.warn('Live Pages not ready ('+attempt+'/12): '+error.message);
  if(attempt<12)await new Promise(resolve=>setTimeout(resolve,5000));
 }
}
throw last;
