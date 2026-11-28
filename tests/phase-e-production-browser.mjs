import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

function readStoredZip(bytes){
 const files=new Map();
 for(let offset=0;offset+30<=bytes.length&&bytes.readUInt32LE(offset)===0x04034b50;){
  assert.equal(bytes.readUInt16LE(offset+8),0);
  const size=bytes.readUInt32LE(offset+18),nameSize=bytes.readUInt16LE(offset+26);
  const start=offset+30+nameSize+bytes.readUInt16LE(offset+28);
  const name=bytes.toString('utf8',offset+30,offset+30+nameSize);
  assert(start+size<=bytes.length&&!files.has(name),name);
  files.set(name,bytes.subarray(start,start+size));
  offset=start+size;
 }
 assert(files.size>0,'ZIP contains readable entries');
 return files;
}
function extents(vertices){
 assert(vertices.length&&vertices.every(vertex=>vertex.length===3&&vertex.every(Number.isFinite)));
 return [0,1,2].map(axis=>{
  let min=Infinity,max=-Infinity;
  for(const vertex of vertices){min=Math.min(min,vertex[axis]);max=Math.max(max,vertex[axis]);}
  return [min,max];
 });
}
function stlBounds(stl){
 const count=stl.readUInt32LE(80),vertices=[];
 assert(count>0&&84+count*50===stl.length);
 for(let i=0;i<count;i++)for(let vertex=0;vertex<3;vertex++){
  const offset=96+i*50+vertex*12;
  vertices.push([0,4,8].map(delta=>stl.readFloatLE(offset+delta)));
 }
 return extents(vertices);
}
function threeMFBounds(archive){
 const xml=readStoredZip(archive).get('3D/3dmodel.model').toString();
 assert.match(xml,/<model unit="millimeter"/);
 assert.match(xml,/<triangle v1="/);
 return extents([...xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].map(match=>match.slice(1).map(Number)));
}

const browser=await chromium.launch({headless:true,executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:950}});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__sensoryStudio);
 const download=async control=>{
  const [file]=await Promise.all([page.waitForEvent('download'),control.click()]);
  return readFile(await file.path());
 };
 for(const family of ['crystals','tactile-tiles','gears','waves','control-caps','characters','light-pods']){
  const id=await page.evaluate(family=>{
   const app=window.__sensoryStudio;
   if(family!=='crystals')app.addModel(family,null,'Phase E '+family);
   const id=app.currentModel.id;
   app.send(id);
   return app.project.printJobs.find(job=>job.modelId===id).id;
  },family);
  const job=page.locator('[data-print-job="'+id+'"]');
  const prepare=job.locator('[data-job-prepare]'),stlButton=job.locator('[data-job-stl]'),packButton=job.locator('[data-job-export]');
  assert(await stlButton.isDisabled());
  if(family==='crystals'){
   const workerUrl=/\/studio-model-worker\.js(?:\?|$)/;
   let releaseWorker;
   const delay=new Promise(resolve=>{releaseWorker=resolve;});
   let requestSeen;
   const requested=new Promise(resolve=>{requestSeen=resolve;});
   const hold=async route=>{
    requestSeen();
    await delay;
    await route.abort().catch(()=>{});
   };
   await page.route(workerUrl,hold,{times:1});
   try{
    await prepare.click();
    await Promise.race([requested,page.waitForTimeout(15000).then(()=>{throw Error('Worker startup was not observed');})]);
    const ticket=await page.evaluate(id=>window.__sensoryStudio.project.printJobs.find(job=>job.id===id).requestId,id);
    assert(ticket);
    await job.locator('[data-job-cancel]').click();
    assert(await stlButton.isDisabled());
    assert.equal(await page.evaluate(id=>window.__sensoryStudio.project.printJobs.find(job=>job.id===id).status,id),'cancelled');
   }finally{releaseWorker();await page.unroute(workerUrl,hold);}
  }
  await prepare.click();
  await job.locator('[data-job-stl]:enabled').waitFor({timeout:120000}).catch(error=>{throw new Error(family+' did not prepare',{cause:error});});
  const stl=await download(stlButton),mf=await download(job.locator('[data-job-3mf]'));
  const files=readStoredZip(await download(packButton));
  const manifest=JSON.parse(files.get('print-job-manifest.json'));
  assert.equal(manifest.jobId,id);assert.equal(manifest.generatorType,family);
  assert.equal(manifest.modelRevision,manifest.preparedRevision);
  assert.deepEqual([...files.keys()].sort(),manifest.files.sort());
  assert.equal(manifest.coordinateFrame,'Z-up');
  const editable=JSON.parse(files.get('editable-model.json'));
  assert.equal(editable.id,manifest.modelId);assert.equal(editable.revision,manifest.preparedRevision);
  const stlEntry=[...files.keys()].find(name=>name.endsWith('.stl'));
  const mfEntry=[...files.keys()].find(name=>name.endsWith('.3mf'));
  assert.deepEqual(files.get(stlEntry),stl);
  const box=stlBounds(stl),packedBox=threeMFBounds(files.get(mfEntry)),directBox=threeMFBounds(mf);
  for(let axis=0;axis<3;axis++){
   for(let side=0;side<2;side++){
    assert(Math.abs(box[axis][side]-directBox[axis][side])<.001,family+' STL and 3MF must share print space');
    assert(Math.abs(directBox[axis][side]-packedBox[axis][side])<.001);
   }
   assert(Math.abs(box[axis][1]-box[axis][0]-manifest.dimensionsMm[axis])<.002);
  }
  assert.match(files.get('parts-list.csv').toString(),/"Component","Quantity","Notes"/);
  assert(files.get('parts-list.csv').toString().includes(stlEntry));
  assert.match(files.get('READ-ME.txt').toString(),/Confirm physical fit/);
  assert([ ...files.keys()].some(name=>name.includes('manual-settings')));
  // Revisiting the Print Centre keeps the current prepared result available.
  await page.evaluate(id=>{
   const app=window.__sensoryStudio,model=app.project.printJobs.find(job=>job.id===id).modelId;
   app.switchModel(model);app.showPrint();
  },id);
  assert(await stlButton.isEnabled());
  assert.deepEqual(await download(stlButton),stl);
  console.log(family+' actual STL, 3MF, production ZIP and cache reuse passed.');
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
