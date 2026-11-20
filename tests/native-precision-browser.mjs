import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,
 executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1360,height:1000}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const current=()=>page.evaluate(()=>structuredClone(window.__sensoryStudio.currentModel.parameters));
const item=key=>page.locator('.sms-palette [data-precision-key="'+key+'"]');
const setExact=async(key,value)=>{
 await item(key).getByRole('button',{name:'Edit exact value for ',exact:false}).click();
 await item(key).locator('[data-precision-input="'+key+'"]').fill(String(value));
 await item(key).locator('[data-precision-input="'+key+'"]').press('Enter');
};
try{
 await fs.mkdir('qa',{recursive:true});
 await page.goto(process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321');
 await page.waitForFunction(()=>window.__sensoryStudio?.addModel,null,{timeout:45000});
 await page.evaluate(()=>window.__sensoryStudio.addModel('gears',{
  mode:'Decorative',wheelStyle:'Rounded lobes',webStyle:'Solid',bore:0
 },'Typed Gear test'));
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 const baseline=await current();
 assert.equal(baseline.diameter,80);
 assert.equal(await item('diameter').locator('button.sms-precision-value').innerText(),'80 mm');
 await setExact('diameter',68.5);
 assert.equal((await current()).diameter,68.5,'Typing 68.5 saves exact diameter');
 assert.equal(await item('diameter').locator('input[type=range]').inputValue(),'68.5');
 await page.screenshot({path:'qa/precision-gear-typed.png'});
 // Out-of-range text must never damage the last accepted revision.
 await item('diameter').locator('.sms-precision-value').click();
 await item('diameter').locator('[data-precision-input=diameter]').fill('400');
 await item('diameter').locator('[data-precision-input=diameter]').press('Enter');
 assert.match(await item('diameter').locator('.sms-precision-error').innerText(),/25 to 180/);
 assert.equal((await current()).diameter,68.5);
 await item('diameter').locator('[data-precision-input=diameter]').press('Escape');
 assert.equal(await item('diameter').locator('.sms-precision-value').innerText(),'68.5 mm');
 // A second property must survive Reset to default of the first.
 await setExact('thickness',10.5);
 assert.equal((await current()).thickness,10.5);
 await item('diameter').getByRole('button',{name:/Reset Decorative outer diameter to default/}).click();
 const reset=await current();
 assert.equal(reset.diameter,80);
 assert.equal(reset.thickness,10.5,'Reset touched diameter only');
 assert.equal(await item('diameter').locator('.sms-precision-reset').isDisabled(),true);
 await page.locator('#smsGlobalUndo').click();
 assert.equal((await current()).diameter,68.5,'Undo restores entered exact value');
 await page.locator('#smsGlobalRedo').click();
 assert.equal((await current()).diameter,80,'Redo restores default');
 await setExact('teeth',12);
 assert.equal((await current()).teeth,12);
 await item('teeth').locator('.sms-precision-value').click();
 await item('teeth').locator('[data-precision-input=teeth]').fill('12.5');
 await item('teeth').locator('[data-precision-input=teeth]').press('Enter');
 assert.match(await item('teeth').locator('.sms-precision-error').innerText(),/whole number/);
 assert.equal((await current()).teeth,12);
 await item('teeth').locator('[data-precision-input=teeth]').press('Escape');
 await item('teeth').locator('.sms-precision-reset').click();
 assert.equal((await current()).teeth,20);
 await page.reload();
 await page.waitForFunction(()=>window.__sensoryStudio?.currentModel?.name==='Typed Gear test',null,{timeout:45000});
 assert.equal((await current()).diameter,80,'Reset persists across reload');
 assert.equal((await current()).thickness,10.5,'Unrelated thickness survives reload');
 // Every other native generator uses the same contextual renderer.
 for(const [type,key] of [
  ['tactile-tiles','width'],['waves','width'],['control-caps','diameter'],
  ['characters','width'],['light-pods','width']]){
  await page.evaluate(type=>window.__sensoryStudio.addModel(type,{},'Precision '+type),type);
  await page.locator('.sms-workspace-nav [data-tab=design]').click();
  const original=await current(),before=Number(original[key]);
  const control=item(key);await control.waitFor();
  const target=before+1.25;
  await setExact(key,target);
  assert.equal((await current())[key],target,type+' exact size accepted');
  await item(key).locator('.sms-precision-reset').click();
  assert.equal((await current())[key],before,type+' original default restored');
  assert.deepEqual(await current(),original,type+' reset did not disturb other parameters');
 }
 // Crystal's additional contextual controls are reset separately from its
 // older Precision-settings exact number editor.
 await page.evaluate(()=>window.__sensoryStudio.addModel('crystals',{count:5},'Crystal precision test'));
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 assert(await item('count').count(),'Crystal count participates in shared typed controls');
 const crystalBefore=await current();
 const crystalCount=Number(await item('count').locator('input[type=range]').inputValue());
 await setExact('count',crystalCount+1);
 assert.equal(Number(await item('count').locator('input[type=range]').inputValue()),crystalCount+1);
 await item('count').locator('.sms-precision-reset').click();
 assert.equal(Number(await item('count').locator('input[type=range]').inputValue()),
  Number(await item('count').locator('.sms-precision-reset').getAttribute('aria-label').then(s=>s.match(/\((\d+)/)?.[1])),
  'Crystal count reset to authoritative default');
 await page.screenshot({path:'qa/precision-crystal-reset.png'});
 assert.equal(errors.length,0,'No browser runtime exceptions: '+errors.join('; '));
 console.log('Native + Crystal typed values, invalid inputs, reset, undo/redo, reload and six-family controls PASS');
}catch(error){
 console.error(error);await page.screenshot({path:'qa/precision-error.png'}).catch(()=>{});
 process.exitCode=1;
}finally{await browser.close();}
