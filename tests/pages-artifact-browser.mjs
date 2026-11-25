import assert from 'node:assert/strict';
import {mkdir,readFile,readdir,stat} from 'node:fs/promises';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {chromium} from 'playwright';

// Never serve raw repository files: inspect _site as staged for GitHub Pages.
const sha=process.env.CRYSTAL_FORGE_EXPECTED_RELEASE;
assert.match(sha||'',/^[0-9a-f]{40}$/i,'Expected exact Pages release SHA.');
const site=resolve(process.env.CRYSTAL_FORGE_STAGED_ROOT||'_site');
const root=resolve(site,'releases',sha);
const origin=new URL(process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4339/');
assert.equal(origin.pathname,'/');
const url=path=>new URL(path,origin).href;
const prefix='releases/'+sha+'/';
async function exists(path){
 const entry=await stat(path);
 assert(entry.isFile()&&entry.size>0,'Missing or empty published file: '+path);
}
for(const path of ['studio-v3.js','studio-help-diagnostics.js','studio-features.css',
 'studio-model-worker.js','fabrication-worker.js','svg-import/index.js',
 'vendor/three/build/three.module.js','vendor/manifold/manifold.js',
 'vendor/manifold/manifold.wasm','src/printing/production-pack.js'])await exists(join(root,path));
const index=await readFile(join(site,'index.html'),'utf8');
assert(index.includes('<base href="./'+prefix+'">'),'The staged entrypoint must use the SHA-scoped release.');
assert(index.includes('<meta name="studio-release" content="'+sha+'">'));
assert(!index.includes('https://cdn.jsdelivr.net/npm/three@'),'Production modules should be same-origin.');

// Verify all first-party literal ESM imports and URL-based workers actually exist
// in the packaged SHA directory. Third-party vendor dependencies have HTTP probes.
let scanned=0,checked=0;
const imports=[
 /\b(?:import|export)\s+(?:[^;\n]*?\s+from\s*)?['"](\.{1,2}\/[^'"]+)['"]/g,
 /\bimport\s*\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g,
 /\bnew\s+URL\s*\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*,\s*import\.meta\.url/g
];
async function scan(dir){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const filename=join(dir,entry.name);
  if(entry.isDirectory()){if(entry.name!=='vendor')await scan(filename);continue;}
  if(!entry.name.endsWith('.js'))continue;
  scanned++;
  const code=await readFile(filename,'utf8');
  for(const pattern of imports)for(const match of code.matchAll(pattern)){
   const target=resolve(dirname(filename),match[1].split(/[?#]/)[0]);
   assert(target.startsWith(root+sep),'Escaping published release: '+match[1]);
   try{await exists(target);}
   catch(error){throw Error('Unpublished dependency in '+relative(root,filename)+': '+match[1],{cause:error});}
   checked++;
  }
 }
}
await scan(root);
assert(scanned>10&&checked>10,'Release graph scan unexpectedly empty.');

const browser=await chromium.launch({headless:true,
 executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage']});
const errors=[],loaded=new Set();
try{
 const page=await browser.newPage({viewport:{width:1280,height:900},acceptDownloads:true});
 page.on('pageerror',error=>errors.push('Exception: '+error.message));
 page.on('requestfailed',request=>errors.push('Failed request: '+request.url()+' '+request.failure()?.errorText));
 page.on('response',response=>{
  const remote=new URL(response.url());
  if(remote.origin===origin.origin){
   loaded.add(remote.pathname);
   if(response.status()>=400)errors.push('HTTP '+response.status()+' '+remote.pathname);
  }
 });
 await page.goto(url('index.html'),{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>!!window.__sensoryStudio&&!!document.querySelector('#viewport canvas'),null,{timeout:45000});
 const details=await page.evaluate(()=>({
  build:document.querySelector('meta[name="studio-release"]')?.content,
  base:document.baseURI
 }));
 assert.equal(details.build,sha);
 assert.equal(details.base,url(prefix));
 for(const asset of ['vendor/three/build/three.module.js','vendor/manifold/manifold.wasm',
  'studio-model-worker.js','fabrication-worker.js','svg-import/index.js',
  'src/printing/production-pack.js']){
  const response=await page.request.get(url(prefix+asset));
  assert.equal(response.status(),200,'Missing HTTP release asset: '+asset);
  assert((await response.body()).length>0);
 }
 await mkdir('qa',{recursive:true});
 await page.screenshot({path:'qa/pages-artifact-startup.png'});
 await page.locator('#smsHomeNew').click();
 await page.locator('#smsPicker [data-generator="tactile-tiles"]').click();
  await page.getByRole('dialog',{name:'Name new model'}).getByRole('button',{name:'Create model'}).click();
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 assert(await page.locator('#viewport canvas').isVisible());
 await page.locator('#smsSend').click();
 await page.locator('#smsJobs [data-job-prepare]').first().click();
 await page.waitForFunction(()=>!!document.querySelector('#smsJobs [data-job-stl]')&&
  !document.querySelector('#smsJobs [data-job-stl]').disabled,null,{timeout:90000});
 const [download]=await Promise.all([
  page.waitForEvent('download',{timeout:30000}),
  page.locator('#smsJobs [data-job-stl]').first().click()
 ]);
 assert.match(download.suggestedFilename(),/\.stl$/);
 assert.equal(await download.failure(),null);
 await page.screenshot({path:'qa/pages-artifact-print.png'});
 assert(errors.length===0,'Staged Pages errors: '+errors.join(' | '));
 assert([...loaded].some(path=>path.includes('/'+sha+'/studio-v3.js')));
 assert([...loaded].some(path=>path.includes('/'+sha+'/studio-model-worker.js')));
 console.log('Staged Pages PASS: '+sha+', '+scanned+' JS assets, '+checked+' relative dependencies, Tile worker and printable STL.');
}finally{await browser.close();}
