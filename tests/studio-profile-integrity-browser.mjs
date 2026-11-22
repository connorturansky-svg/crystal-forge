import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321/');
 await page.waitForFunction(()=>window.__sensoryStudio);
 // Use the actual physical placement and shaped Seed fitting workflow.
 await page.evaluate(()=>window.__sensoryStudio.addModel('tactile-tiles',{
  width:90,depth:90,thickness:20,outline:'square',relief:2,pattern:'terraces',dualMaterial:false
 },'Profile integrity Tile'));
 await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
 await page.locator('[data-view=bottom]').click();
 await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
 const palette=page.locator('.sms-palette');
 await palette.locator('[data-fit-profile=seed]').click();
 await palette.getByRole('button',{name:'Place shaped socket in 3D'}).click();
 const target=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(0,0,'underside'));
 assert(target,'Tile seed fit target must be visible');
 await page.mouse.click(target.x,target.y);
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===1,null,{timeout:60000});
 await page.keyboard.press('Escape');
 await palette.getByRole('button',{name:'P1',exact:true}).click();
 const model=()=>page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
 const profileKey='crystal-forge-pixel-library';
 const previous=await model();
 // Seed AFTER Studio initializes: startup merging otherwise hides profile loss.
 const initial=await page.evaluate(key=>{
  const profiles=Array.from({length:30},(_,i)=>({
   id:'custom-qa-'+i,name:'QA seed '+i,kind:'seed',bodyDiameter:5,bodyHeight:9,
   flangeDiameter:5,flangeHeight:0,capHeight:1,wireWidth:2,wireDepth:1.5,
   measuredFit:{bodyDiameter:5,printedBoreDiameter:5.3}
  }));
  const text=JSON.stringify(profiles);localStorage.setItem(key,text);return text;
 },profileKey);
 const openCalibration=async()=>{
  const form=palette.locator('[data-fit-calibration]');
  if(!(await form.isVisible()))await palette.getByText('Record measured fit',{exact:true}).click();
  await form.locator('[name=profileName]').fill('Protected measured Seed');
  await form.locator('[name=printedBoreDiameter]').fill('5.5');
  return form;
 };
 let form=await openCalibration();
 await form.getByRole('button',{name:'Save measured fit'}).click();
 await palette.locator('[data-pixel-status]').filter({hasText:/library is full/i}).waitFor({timeout:30000});
 assert.equal(await model(),previous,'31st calibration cannot mutate the fitted model');
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),profileKey),initial,'31st save cannot overwrite older profiles');
 // Now make one slot, then simulate an exact Storage write failure.
 const space=await page.evaluate(key=>{
  const profiles=JSON.parse(localStorage.getItem(key));profiles.pop();
  const value=JSON.stringify(profiles);localStorage.setItem(key,value);return value;
 },profileKey);
 await page.evaluate(()=>{
  const old=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){
   if(key==='crystal-forge-pixel-library')throw new DOMException('Storage full','QuotaExceededError');
   return old.call(this,key,value);
  };
  window.__restoreProfileWrite=()=>{Storage.prototype.setItem=old;};
 });
 form=await openCalibration();
 await form.getByRole('button',{name:'Save measured fit'}).click();
 await palette.locator('[data-pixel-status]').filter({hasText:/not saved.*storage full/i}).waitFor({timeout:30000});
 assert.equal(await model(),previous,'Quota failure cannot commit a broken custom ID');
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),profileKey),space,'Quota failure preserves exact previous library bytes');
 assert.deepEqual(errors,[],'Asynchronous storage failure must not emit an uncaught window error');
 await page.evaluate(()=>window.__restoreProfileWrite());
 // Retry succeeds and both model reference and durable profile appear.
 form=await openCalibration();
 await form.getByRole('button',{name:'Save measured fit'}).click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].profileId?.startsWith('custom-'),null,{timeout:60000});
 const accepted=await page.evaluate(key=>{
  const hole=window.__sensoryStudio.currentModel.build.pixelHoles[0];
  const profiles=JSON.parse(localStorage.getItem(key));
  return {hole,profiles};
 },profileKey);
 assert(accepted.profiles.some(p=>p.id===accepted.hole.profileId&&p.name==='Protected measured Seed'));
 assert.equal(accepted.hole.clearance,.5);
 assert.equal(accepted.profiles.length,30);
 assert(accepted.profiles.some(p=>p.id==='custom-qa-0'),'First measured profile must survive');
 // Source-model isolation: the Crystal editor and a native Tile must maintain
 // independent selected profile IDs when they share a reusable library.
 await page.evaluate(()=>{
  const control=document.querySelector('#pixelProfileSelect');
  control.value='seed';control.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.waitForFunction(()=>!!document.querySelector('#pixelProfileSelect option[value="custom-qa-0"]'),null,{timeout:45000});
 await page.evaluate(()=>{
  const control=document.querySelector('#pixelProfileSelect');
  control.value='custom-qa-0';control.dispatchEvent(new Event('input',{bubbles:true}));
 });
 assert.equal(await page.locator('#pixelProfileSelect').inputValue(),'custom-qa-0',
  'Crystal selects its own earlier measured profile A');
 await palette.locator('[data-active-pixel-profile]').selectOption(accepted.hole.profileId);
 await page.waitForFunction(id=>window.__sensoryStudio.currentModel.build.activePixelProfileId===id,
  accepted.hole.profileId,{timeout:45000});
 await palette.getByRole('button',{name:'Edit active profile'}).click();
 await page.locator('#deletePixelProfileBtn').click();
 await page.locator('#pixelSocketStatus').filter({hasText:/in use/i}).waitFor();
 const afterBlockedDelete=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'[]'),profileKey);
 assert(afterBlockedDelete.some(p=>p.id==='custom-qa-0'),'Editing B must not delete unrelated A');
 assert(afterBlockedDelete.some(p=>p.id===accepted.hole.profileId),'A profile still used by Tile must not be deleted');
 await page.locator('#savePixelProfileBtn').click();
 assert.equal(await page.locator('#pixelProfileSelect').inputValue(),'custom-qa-0',
  'Saving Tile profile B must not silently switch the selected Crystal profile A');
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.activePixelProfileId),
  accepted.hole.profileId,'Native Tile must retain selected profile B');
 await page.locator('#smsLibrary').click();
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#smsBackup').click()]);
 const data=JSON.parse(await readFile(await download.path(),'utf8'));
 assert(data.pixelProfiles?.some(p=>p.id===accepted.hole.profileId&&p.name==='Protected measured Seed'),
  'Complete Studio JSON backup must include the newly calibrated reusable profile');
 // A completely isolated second browser must recover the calibration from the
 // Studio JSON alone: no extra Crystal profile library export is permitted.
 // Close the original viewport first to reduce concurrent 3D/Chromium resource
 // pressure on GitHub-hosted runners. Keep the downloaded bytes in memory.
 await page.close();
 const second=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
 try{
  const destination=await second.newPage();
  await destination.goto(process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321/');
  await destination.waitForFunction(()=>window.__sensoryStudio?.showLibrary,null,{timeout:60000});
  await destination.evaluate(()=>window.__sensoryStudio.showLibrary());
  await destination.locator('#smsImport').waitFor({state:'attached',timeout:60000});
  await destination.locator('#smsImport').setInputFiles({
   name:'complete-studio-backup.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify(data))
  });
  const review=destination.getByRole('dialog',{name:'Review backup'});
  await review.waitFor();
  await review.getByLabel('Recovery strategy').selectOption('merge');
  destination.once('dialog',dialog=>dialog.accept());
  await review.getByRole('button',{name:'Apply choice'}).click();
  await review.waitFor({state:'hidden'});
  await destination.getByText('Recovery complete',{exact:false}).waitFor();
  const recovered=await destination.evaluate(key=>{
   const library=JSON.parse(localStorage.getItem(key)||'[]');
   const studio=JSON.parse(localStorage.getItem('sensory-model-studio-workspace-v1')||'null');
   return {library,studio};
  },profileKey);
  assert(recovered.library.some(p=>p.id===accepted.hole.profileId&&p.name==='Protected measured Seed'),
   'Second browser has exact restored A–G library profile');
  assert(recovered.studio?.savedProjects.some(project=>project.models.some(model=>
   model.build?.pixelHoles?.some(hole=>hole.profileId===accepted.hole.profileId))),
   'Recovered project refers to its intact custom profile');
 }finally{await second.close();}
 assert.deepEqual(errors,[],'No uncaught errors after measured profile retry and backup');
 console.log('Profile integrity Chromium PASS: capacity refusal, quota rollback, async worker save, successful retry and JSON backup.');
}finally{await browser.close();}
