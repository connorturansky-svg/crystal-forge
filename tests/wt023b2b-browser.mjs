import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {WORKSPACE_KEY} from '../studio-documents.js';
import {revealLibraryActions} from './helpers/library-actions.mjs';
import {gearGenerator} from '../studio-catalogue.js';
// Pin real WebGL to the deterministic software backend for simultaneous editors;
// hosted native ANGLE readbacks can stall when both editors render thumbnails.
const browser=await chromium.launch({headless:true,executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--disable-dev-shm-usage']});
try{
 let context=await browser.newContext({viewport:{width:1440,height:950}});
 let page=await context.newPage();const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const url=process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321';
 await context.tracing.start({screenshots:true,snapshots:true,sources:true});
 try{
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__sensoryStudio);
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 // Full-editor contention is isolated from the later preview/zoom/worker matrix.
 const peer=await page.context().newPage();await peer.setViewportSize({width:390,height:844});
 await peer.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 await peer.waitForFunction(()=>window.__sensoryStudio,null,{timeout:60000});
 await peer.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.bringToFront();
 const beforePeer=await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.project));
 await page.locator('#smsNew').click();await page.locator('#smsPicker [data-generator=gears]').click();
 const staleChooser=page.getByRole('dialog',{name:'Name new model'});
 await peer.bringToFront();
 await peer.locator('#smsProjectTitle').fill('Peer editor saved project');await peer.locator('#smsProjectTitle').press('Tab');
 await peer.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.bringToFront();
 await staleChooser.getByRole('button',{name:'Create model',exact:true}).click();
 assert.match(await staleChooser.getByRole('alert').innerText(),/Another tab saved/);
 assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.project)),beforePeer);
 console.log('WT-023B2b: a real project save from the second full editor refuses the first editor’s stale chooser without changing its project.');
 await staleChooser.getByRole('button',{name:'Cancel',exact:true}).click();await peer.close();
 }finally{await context.tracing.stop({path:'qa/wt023b2b-peer-trace.zip'});}
 await context.close();
 context=await browser.newContext({viewport:{width:1440,height:950}});page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__sensoryStudio);
 await page.evaluate(()=>window.__sensoryStudio.addModel('gears',null,'Source revision one'));
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.evaluate(async key=>{
  const moduleUrl=new URL('./studio-documents.js',location.href);
  const {saveLibraryRevision}=await import(moduleUrl.href);
  const w=JSON.parse(localStorage.getItem(key)),source=structuredClone(window.__sensoryStudio.currentModel);
  source.id='b2b-source';saveLibraryRevision(w.library,source);
  source.name='Source revision two';source.parameters.diameter=110;
  saveLibraryRevision(w.library,source,{expectedRevision:1});
  const missing=structuredClone(source);missing.id='missing-profile-source';missing.name='Missing calibration witness';missing.build.activePixelProfileId='custom-unavailable';saveLibraryRevision(w.library,missing);
  w.savedProjects=['a-old','a-new','b-old'].map((snapshotId,i)=>{
   const p=structuredClone(w.project);p.id=i===2?'project-b':'project-a';p.title='Same project name';p.snapshotId=snapshotId;
   p.models[0].name='Snapshot witness '+snapshotId;p.printer={printer:'Fixture printer',curaNozzle:.8};return p;
  });
  localStorage.setItem(key,JSON.stringify(w));
 },WORKSPACE_KEY);
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__sensoryStudio);
 await page.evaluate(()=>{const s=window.__sensoryStudio;s.send(s.currentModel.id);});
 const preparedJob=page.locator('#smsJobs article').filter({hasText:'Source revision one'}).last();
 await preparedJob.locator('[data-job-prepare]').click();
 await preparedJob.locator('[data-job-stl]:enabled').waitFor({timeout:120000}).catch(async error=>{throw Error(await preparedJob.innerText(),{cause:error});});
 const downloadPrepared=async format=>{
  const [download]=await Promise.all([page.waitForEvent('download'),preparedJob.locator('[data-job-'+format+']').click()]);
  assert.equal(await download.failure(),null);
 };
 await downloadPrepared('stl');await downloadPrepared('3mf');
 const preparedId=await preparedJob.getAttribute('data-print-job');
 assert(preparedId);
 // The worker completion enables downloads before the scheduled workspace save.
 // Baseline the destination checks on this exact job after it is durable.
 await page.waitForFunction(({key,id})=>{
  const stored=JSON.parse(localStorage.getItem(key)||'null');
  return stored?.project.printJobs.some(job=>job.id===id&&job.status==='prepared'&&job.preparedRevision===job.revision);
 },{key:WORKSPACE_KEY,id:preparedId});
 await page.evaluate(()=>{const s=window.__sensoryStudio;window.__b2bModel=s.currentModel;window.__b2bJob=s.project.printJobs.at(-1);s.switchModel(s.currentModel.id);});
 const workspace=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),WORKSPACE_KEY);
 const originalSnapshots=structuredClone((await workspace()).savedProjects);
 for(const family of ['crystals','tactile-tiles','gears','waves','control-caps','characters','light-pods']){
  for(const kind of ['current','snapshot','new']){
   const before=await workspace();
   await page.locator('#smsNew').click();await page.locator(`#smsPicker [data-generator="${family}"]`).click();
   const dialog=page.getByRole('dialog',{name:'Name new model'});
   if(kind==='snapshot'){
    const value=await dialog.locator('option').evaluateAll(options=>options.find(o=>o.textContent.includes('a-old')).value);
    await dialog.getByLabel('Destination project').selectOption(value);
   }else if(kind==='new'){
    await dialog.getByLabel('Destination project').selectOption({label:'New project'});
    await dialog.getByLabel('New project name').fill('Same project name');
   }
   const name=family+' '+kind;await dialog.getByLabel('Model name',{exact:true}).fill(name);
   await dialog.getByRole('button',{name:'Create model',exact:true}).press('Enter');await dialog.waitFor({state:'hidden'});
   const after=await workspace(),added=after.project.models.at(-1);
   assert.equal(added.name,name);assert.equal(added.generator.typeId,family);
   assert(!before.project.models.some(model=>model.id===added.id));
   if(kind==='current'){
    assert.equal(after.project.id,before.project.id);
    assert.deepEqual(after.project.models.slice(0,-1),before.project.models);
    assert.deepEqual(after.project.printer,before.project.printer);
    assert.deepEqual(after.project.printJobs,before.project.printJobs);
    if(family==='crystals'){
     assert(await page.evaluate(()=>{const s=window.__sensoryStudio;return s.project.models.includes(window.__b2bModel)&&s.project.printJobs.includes(window.__b2bJob);}));
     await page.evaluate(()=>window.__sensoryStudio.showPrint());
     await page.locator('#smsExpandPrint').click();
     for(const format of ['stl','3mf']){
      await downloadPrepared(format);
     }
     await page.evaluate(id=>window.__sensoryStudio.switchModel(id),added.id);
    }
   }else if(kind==='snapshot'){
    assert.equal(after.project.id,'project-a');assert.equal(after.project.models[0].name,'Snapshot witness a-old');
    assert.equal(after.project.printer.curaNozzle,.8);
   }else{
    assert.notEqual(after.project.id,before.project.id);assert.equal(after.project.models.length,1);
    assert.equal(after.project.printer.curaNozzle,.4);
   }
   for(const snapshot of originalSnapshots)assert.deepEqual(after.savedProjects.find(p=>p.snapshotId===snapshot.snapshotId),snapshot);
  }
 }
 await page.locator('#smsNew').click();await page.getByRole('button',{name:'Browse Cogs & Gears starting points',exact:true}).click();
 const presetButton=page.locator('#smsPicker [data-preset]').first(),presetId=await presetButton.getAttribute('data-preset');
 await presetButton.click();
 await page.getByRole('dialog',{name:'Name new model'}).getByRole('button',{name:'Create model',exact:true}).click();
 const presetModel=(await workspace()).project.models.at(-1),preset=gearGenerator.presets.find(item=>item.id===presetId);
 for(const [key,value] of Object.entries(preset.parameters))assert.deepEqual(presetModel.parameters[key],value);
 await page.locator('#smsLibrary').click();
 const card=page.locator('#smsSavedModels article').filter({has:page.getByRole('heading',{name:'Source revision two',exact:true})});
 await revealLibraryActions(card);await card.getByRole('button',{name:'Older revision',exact:true}).click();
 const chooser=page.getByRole('dialog',{name:'Choose model destination'});
 await chooser.getByLabel('Source revision').selectOption('1');
 assert.match(await chooser.locator('[data-library-source-info]').innerText(),/b2b-source.*revision 1/);
 await chooser.locator('[data-library-source-preview] img').waitFor();
 const preview=await chooser.locator('[data-library-source-preview] img').getAttribute('src');
 await chooser.getByLabel('Source revision').selectOption('2');
 await chooser.locator('[data-library-source-preview] img').waitFor();
 assert.notEqual(await chooser.locator('[data-library-source-preview] img').getAttribute('src'),preview);
 await chooser.getByLabel('Source revision').selectOption('1');
 await chooser.getByRole('button',{name:'Add model',exact:true}).click();await chooser.waitFor({state:'hidden'});
 assert.equal((await workspace()).project.models.at(-1).name,'Source revision one');
 assert.notEqual((await workspace()).project.models.at(-1).parameters.diameter,110);
 await page.locator('#smsLibrary').click();
 const unavailable=page.locator('#smsSavedModels article').filter({has:page.getByRole('heading',{name:'Missing calibration witness',exact:true})});
 await revealLibraryActions(unavailable);await unavailable.getByRole('button',{name:'Independent copy',exact:true}).click();
 const beforeRefusal=await workspace();await chooser.getByRole('button',{name:'Add model',exact:true}).click();
 assert.match(await chooser.getByRole('alert').innerText(),/Missing measured pixel profile/);
 assert.deepEqual(await workspace(),beforeRefusal);await page.keyboard.press('Escape');
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__sensoryStudio);
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.name),'Source revision one');
 assert.deepEqual(errors,[]);
 console.log('WT-023B2b Chromium: seven families × three destinations, exact same-title snapshots, unchanged settings/history and revision-faithful previews passed.');
}finally{await browser.close();}
