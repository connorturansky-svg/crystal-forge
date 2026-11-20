import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,
 executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1440,height:950}});
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
 assert.deepEqual(errors,[],'No uncaught Chromium errors');
 console.log('All seven Design palettes, model settings and reload passed');
}finally{await browser.close();}
