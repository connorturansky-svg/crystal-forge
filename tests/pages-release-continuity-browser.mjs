import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {extname,join,resolve,sep} from 'node:path';
import {chromium} from 'playwright';
import {preserveRelease,previousCommits} from './helpers/retain-pages-releases.mjs';

const older='a'.repeat(40),newer='b'.repeat(40);
const workspace=await mkdtemp(join(tmpdir(),'crystal-pages-retention-'));
const oldSource=join(workspace,'source-A'),site=join(workspace,'site'),releases=join(site,'releases');
const oldRelease=join(releases,older),newRelease=join(releases,newer);
const write=async(path,value)=>{
 await mkdir(resolve(path,'..'),{recursive:true});
 await writeFile(path,value);
};
let browser,server;
try{
 await mkdir(oldSource,{recursive:true});
 await mkdir(newRelease,{recursive:true});
 const pkg={name:'crystal-forge',devDependencies:{three:'0.165.0','manifold-3d':'3.5.4'}};
 await write(join(site,'package.json'),JSON.stringify(pkg));
 await write(join(oldSource,'package.json'),JSON.stringify(pkg));
 await write(join(newRelease,'vendor/three/build/three.module.js'),'export const threeVersion="0.165.0";');
 await write(join(newRelease,'vendor/manifold/manifold.js'),'export const manifoldVersion="3.5.4";');
 await write(join(newRelease,'vendor/manifold/manifold.wasm'),'fake nonempty wasm fixture');
 await write(join(oldSource,'svg-import/index.js'),'export const imported=true;');
 await write(join(oldSource,'studio-v3.js'),
  "export const liveVersion='old'; import './svg-import/index.js';");
 await write(join(oldSource,'fabrication-worker.js'),"self.postMessage('worker-from-old-SHA');");
 for(let i=0;i<12;i++)await write(join(oldSource,'support-'+i+'.js'),
  "export const n="+i+"; import 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';");
 await write(join(oldSource,'studio-features.css'),'body{font-family:sans-serif}');
 // Initial A deployment: the user opens a page referring to immutable /releases/A.
 await write(join(oldRelease,'fabrication-worker.js'),"self.postMessage('worker-from-old-SHA');");
 await write(join(site,'index.html'),'<html><head><base href="./releases/'+older+'/"></head><body>Editor A</body></html>');
 server=createServer(async(req,res)=>{
  try{
   const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
   const path=resolve(site,'.'+pathname);
   if(path!==site&&!path.startsWith(site+sep)){res.writeHead(403);res.end();return;}
   const served=path===site?join(site,'index.html'):path;
   const content=await readFile(served);
   const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css'}[extname(served)]||'application/octet-stream';
   res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'});res.end(content);
  }catch(error){res.writeHead(404);res.end('Not Found');}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/';
 browser=await chromium.launch({headless:true,
  executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 const tab=await browser.newPage();
 await tab.goto(base);
 const baseBefore=await tab.evaluate(()=>document.baseURI);
 assert(baseBefore.endsWith('/releases/'+older+'/'));
 // Deploy B. Typical GitHub Pages upload replaces the entire _site artifact.
 await rm(oldRelease,{recursive:true,force:true});
 await write(join(site,'index.html'),'<html><head><base href="./releases/'+newer+'/"></head><body>Editor B</body></html>');
 assert.equal((await tab.request.get(base+'releases/'+older+'/fabrication-worker.js')).status(),404,
  'Control: without retention an old editor will lose an on-demand worker');
 // Restore older assets into B's new artifact before Pages upload.
 const retained=await preserveRelease({sourceRoot:oldSource,siteRoot:site,oldSha:older,currentSha:newer});
 assert(retained.files>=10);
 assert.equal((await tab.request.get(base+'releases/'+older+'/fabrication-worker.js')).status(),200);
 assert.equal((await tab.request.get(base+'releases/'+older+'/vendor/three/build/three.module.js')).status(),200);
 const message=await tab.evaluate(()=>new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('fabrication-worker.js',document.baseURI),{type:'module'});
  worker.onmessage=event=>{worker.terminate();resolve(event.data);};
  worker.onerror=event=>{worker.terminate();reject(new Error(event.message||'Old worker failed'));};
 }));
 assert.equal(message,'worker-from-old-SHA',
  'Old editor remains functional after B deploy by spawning its original on-demand module worker');
 const fresh=await browser.newPage();await fresh.goto(base);
 assert((await fresh.locator('body').innerText()).includes('Editor B'));
 await fresh.close();
 const rewritten=await readFile(join(oldRelease,'support-0.js'),'utf8');
 assert(rewritten.includes('./vendor/three/build/three.module.js'));
 assert(!rewritten.includes('cdn.jsdelivr.net'));
 // Strong safety boundaries: immutable, exact SHA and exact old vendor versions.
 await assert.rejects(()=>preserveRelease({sourceRoot:oldSource,siteRoot:site,oldSha:older,currentSha:newer}),
  /Historical release already exists/);
 await assert.rejects(()=>preserveRelease({sourceRoot:oldSource,siteRoot:site,oldSha:'../bad',currentSha:newer}),
  /exact 40-character/);
 const incompatible='c'.repeat(40);
 await write(join(oldSource,'package.json'),JSON.stringify({...pkg,
  devDependencies:{three:'0.166.0','manifold-3d':'3.5.4'}}));
 await assert.rejects(()=>preserveRelease({sourceRoot:oldSource,siteRoot:site,oldSha:incompatible,currentSha:newer}),
  /exact old vendor bundle/);
 assert.equal((await tab.request.get(base+'releases/'+incompatible+'/fabrication-worker.js')).status(),404);
 assert.throws(()=>previousCommits({currentSha:newer,keep:7}),/Keep must be/);
 console.log('QA-R03 PASS: browser tab A survives a B deployment, first-time worker requests use A, B stays live; immutable and vendor-integrity guards work.');
}finally{
 await browser?.close();
 if(server)await new Promise(resolve=>server.close(resolve));
 await rm(workspace,{recursive:true,force:true});
}
