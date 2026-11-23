import assert from 'node:assert/strict';
import {WORKSPACE_KEY} from '../studio-documents.js';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:950}});
 await page.goto(process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321');
 await page.waitForFunction(()=>window.__sensoryStudio);
 await page.evaluate(()=>window.__sensoryStudio.addModel('gears',{mode:'Decorative',webStyle:'Solid',
  wheelStyle:'Rounded lobes',bore:0,thickness:10,diameter:90},'WT-022 workspace Gear'));
 const nav=page.getByRole('navigation',{name:'Workspaces'});
 const destination=name=>nav.getByRole('button',{name,exact:true});
 const id=await page.evaluate(()=>window.__sensoryStudio.currentModel.id);
 for(const name of ['Home','Library']){
  await destination(name).press('Enter');
  assert.equal(await destination(name).getAttribute('aria-current'),'step');
  assert.equal(await nav.locator('[aria-current=step]').count(),1);
 }
 await destination('Mounting').press('Enter');
 assert.equal(await destination('Mounting').getAttribute('aria-current'),'step');
 await page.locator('[data-view=top]').click();
 await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
 await page.getByRole('button',{name:'Place mounting hole in 3D'}).click();
 const point=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(12,12,'top'));
 assert(point);
 await page.mouse.click(point.x,point.y);
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.manualMountHoles?.length===1);
 await page.keyboard.press('Escape');
 for(const name of ['Pixels','Wiring','Design','Build','Mounting']){
  await destination(name).press('Enter');
  assert.equal(await destination(name).getAttribute('aria-current'),'step');
  assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.id),id);
 }
 await destination('Build').press('Enter');
 assert(await page.locator('.sms-palette [data-pixel-backing]').isVisible());
 assert(await page.locator('.sms-palette [data-edge-finish=enabled]').isVisible());
 assert.equal(await page.locator('.sms-palette [data-place-pixel], .sms-palette [data-place-mount]').count(),0);
 await destination('Pixels').press('Enter');
 assert.equal(await page.locator('.sms-palette [data-pixel-backing]').count(),0);
 await page.setViewportSize({width:390,height:844});
 for(const name of ['Pixels','Wiring','Mounting','Print Centre'])await destination(name).press('Enter');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 await page.evaluate(()=>window.__sensoryStudio.addModel('crystals',{count:5},'WT-022 workspace Crystal'));
 await destination('Mounting').press('Enter');
 await page.waitForFunction(()=>document.body.dataset.studioBuildHome==='mounting');
 const reveal=async selector=>{
  const target=page.locator(selector);
  await target.evaluate(element=>{
   for(let ancestor=element.parentElement;ancestor;ancestor=ancestor.parentElement)
    if(ancestor.tagName==='DETAILS')ancestor.open=true;
  });
  await target.waitFor({timeout:4000});
 };
 await reveal('[data-state=mount]');
 await reveal('#placeMountBtn');
 await reveal('#manualHardwareList summary');
 assert(!await page.locator('[data-state=wireChannels]').isVisible());
 await destination('Wiring').press('Enter');
 await reveal('[data-state=wireChannels]');
 assert(!await page.locator('[data-state=mount]').isVisible());
 await destination('Pixels').press('Enter');
 await reveal('#pixelProfileSelect');
 assert(!await page.locator('[data-state=wireChannels]').isVisible());
 await destination('Build').press('Enter');
 assert(await page.locator('.sms-palette [data-palette-key=crystal-base-height]').isVisible());
 assert(!await page.locator('#pixelProfileSelect').isVisible());
 for(const family of ['tactile-tiles','waves','control-caps','characters','light-pods']){
  await page.evaluate(family=>window.__sensoryStudio.addModel(family,null,'WT-022 workspace '+family),family);
  await destination('Pixels').press('Enter');
  await page.locator('.sms-palette [data-place-pixel]').waitFor();
  assert.equal(await page.locator('.sms-palette [data-place-mount]').count(),0);
  await destination('Mounting').press('Enter');
  await page.locator('.sms-palette [data-place-mount]').waitFor();
  assert.equal(await page.locator('.sms-palette [data-place-pixel]').count(),0);
  await destination('Wiring').press('Enter');
  assert.equal(await destination('Wiring').getAttribute('aria-current'),'step');
  assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.generator.typeId),family);
 }

 // End-to-end post-merge protection: navigation may not merely keep a model
 // alive in memory. All builders and the real mounting edit must survive a
 // serialized v1 save and a full new document load on the same browser.
 await page.waitForFunction(key=>{
  const raw=localStorage.getItem(key);
  if(!raw)return false;
  try{
   const data=JSON.parse(raw),types=new Set(data.project.models.map(x=>x.generator.typeId));
   return ['gears','crystals','tactile-tiles','waves','control-caps','characters','light-pods']
    .every(type=>types.has(type)) &&
    data.project.models.some(model=>model.generator.typeId==='gears' &&
      model.build.manualMountHoles?.length===1);
  }catch{return false;}
 },WORKSPACE_KEY,{timeout:15000});
 const saved=await page.evaluate(key=>{
  const state=JSON.parse(localStorage.getItem(key)),project=state.project;
  return {id:project.id,tabs:[...project.tabs],activeTab:project.activeTab,
   models:project.models.map(m=>({id:m.id,name:m.name,type:m.generator.typeId,
    revision:m.revision,pixelHoles:m.build.pixelHoles?.length??0,
    mountingHoles:m.build.manualMountHoles?.length??0})),
   jobs:project.printJobs.map(j=>({id:j.id,revision:j.revision,status:j.status})),
   savedSnapshots:(state.savedProjects||[]).map(p=>p.snapshotId)};
 },WORKSPACE_KEY);
 await page.reload();
 await page.waitForFunction(()=>window.__sensoryStudio);
 const reloaded=await page.evaluate(key=>{
  const state=JSON.parse(localStorage.getItem(key)),project=state.project;
  return {id:project.id,tabs:[...project.tabs],activeTab:project.activeTab,
   models:project.models.map(m=>({id:m.id,name:m.name,type:m.generator.typeId,
    revision:m.revision,pixelHoles:m.build.pixelHoles?.length??0,
    mountingHoles:m.build.manualMountHoles?.length??0})),
   jobs:project.printJobs.map(j=>({id:j.id,revision:j.revision,status:j.status})),
   savedSnapshots:(state.savedProjects||[]).map(p=>p.snapshotId)};
 },WORKSPACE_KEY);
 assert.deepEqual(reloaded,saved,
  'Seven builders, real mounting placement, tab order and job revisions survive reload');
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.project.id),saved.id);
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.id),saved.activeTab);
 console.log('Post-merge Studio cross-builder saved state, model tabs and real mount placement survived reload.');
 console.log('WT-022 workspaces: keyboard, retained model, actual mounting gesture and narrow navigation passed');
}finally{await browser.close();}
