import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,
 executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1440,height:950}});
const raisedFixture={diameter:68.5,teeth:12,spokes:5,bore:8,reliefStyle:'Hub and rim'};
const name='Raised Gear manufacturing fixture';
async function openRaisedGear(target){
 await target.waitForFunction(()=>window.__sensoryStudio);
 await target.evaluate(({input,name})=>window.__sensoryStudio.addModel('gears',input,name),{input:raisedFixture,name});
 await target.locator('.sms-workspace-nav [data-tab=design]').click();
}
async function prepareRaisedGear(target){
 await target.locator('.sms-workspace-nav [data-tab=build]').click();
 await target.locator('#smsSend').click();
 const job=target.locator('#smsJobs article').filter({hasText:name});
 await job.locator('[data-job-prepare]').click();
 await target.waitForFunction(()=>[...document.querySelectorAll('#smsJobs [data-job-stl]')].some(button=>!button.disabled));
 return job;
}
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__sensoryStudio,{timeout:45000});
 const families=['crystals','tactile-tiles','gears','waves','control-caps','characters','light-pods'];
 for(const [index,family] of families.entries()){
  if(index===0)await page.locator('#smsHomeNew').click();
  else await page.locator('#smsNew').click();
  await page.locator('#smsPicker [data-generator="'+family+'"]').click();
  await page.locator('.sms-workspace-nav [data-tab=design]').click();
  const toggle=page.locator('.sms-palette [data-edge-finish=enabled]');
  await toggle.waitFor({state:'visible'});
  await toggle.check();
  assert.equal(await page.locator('.sms-palette [data-edge-finish=style]').count(),0,
   'Only the tested top-facing chamfer should be offered, not the former crinkling mode');
  assert.equal(await page.locator('.sms-palette [data-edge-finish=scope]').count(),0,
   'Unverified all-surface selection must not be advertised');
  const amount=page.locator('.sms-palette [data-palette-key=edge-finish-amount]');
  await amount.evaluate(element=>{element.value='0.6';element.dispatchEvent(new Event('change',{bubbles:true}));});
  if(family==='crystals'){
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')||'{}').settings?.edgeFinishAmount===.6);
   const current=await page.evaluate(()=>window.__sensoryStudio.currentModel);
   assert.equal(current.generator.typeId,'crystals');
  }else{
   await page.waitForFunction(()=>window.__sensoryStudio.currentModel?.build?.edgeFinish?.amountMm===.6);
   const saved=await page.evaluate(()=>({
    type:window.__sensoryStudio.currentModel.generator.typeId,
    finish:window.__sensoryStudio.currentModel.build.edgeFinish
   }));
   assert.equal(saved.type,family);
   assert.deepEqual(saved.finish,{enabled:true,style:'Chamfer',scope:'Top edges',amountMm:.6,steps:1});
  }
  assert(await page.locator('canvas').count()>0,family+' 3D viewport remains active');
  console.log(family+' live edge controls and persisted model passed');
 }
 await page.reload();
 await page.waitForFunction(()=>window.__sensoryStudio);
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.edgeFinish?.amountMm),.6,
  'Edge finishing persists on reload');
 await page.evaluate(()=>window.__sensoryStudio.addModel('gears',{
  diameter:68.5,teeth:12,spokes:5,bore:8,webStyle:'Legacy',reliefStyle:'None'
 },'Openwork Gear chamfer'));
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 await page.locator('.sms-palette [data-edge-finish=enabled]').check();
 await page.getByText('Showing prepared chamfer geometry.',{exact:true}).waitFor();
 await fs.mkdir('qa',{recursive:true});
 await page.screenshot({path:'qa/openwork-gear-chamfer.png'});
 if(process.env.CRYSTAL_FORGE_BASELINE_URL){
  const baseline=await browser.newPage({viewport:{width:1440,height:950}});
  try{
   await baseline.goto(process.env.CRYSTAL_FORGE_BASELINE_URL);
   if((await baseline.locator('.version').innerText()).trim()==='v0.16.0-dev.35.25'){
    await openRaisedGear(baseline);
    const badJob=await prepareRaisedGear(baseline);
    await badJob.locator('[data-job-stl]').click();
    await baseline.locator('#smsPrintStatus').filter({hasText:'Degenerate material triangle'}).waitFor();
    await baseline.screenshot({path:'qa/unified-raised-gear-before.png'});
   }
  }finally{await baseline.close();}
 }
 await openRaisedGear(page);
 await page.locator('.sms-palette [data-edge-finish=enabled]').check();
 await page.getByText(/Some top rims kept their original shape/).waitFor();
 await page.screenshot({path:'qa/unified-raised-gear-after.png'});
 await page.getByText('Saved locally',{exact:true}).waitFor({state:'attached'});
 await page.reload();
 await page.waitForFunction(name=>window.__sensoryStudio?.currentModel?.name===name,name);
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.reliefStyle),'Hub and rim');
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.edgeFinish.enabled),true);
 const raisedJob=await prepareRaisedGear(page);
 for(const format of ['stl','3mf']){
  const [download]=await Promise.all([page.waitForEvent('download'),raisedJob.locator('[data-job-'+format+']').click()]);
  assert(download.suggestedFilename().endsWith('.'+format));
  const size=(await fs.stat(await download.path())).size;
  assert(size>100,format+' contains the exported Gear mesh');
  await download.saveAs('qa/unified-raised-gear.'+format);
 }
 assert.deepEqual(errors,[],'No uncaught Chromium errors');
 console.log('All seven Design palettes, model settings and reload passed');
}finally{await browser.close();}
