import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,
 executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:1440,height:900}});
const page=await context.newPage(),errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
 const url=new URL(process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321');
 url.searchParams.set('layout','legacy');
 await page.goto(url.href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__sensoryStudio,null,{timeout:60000});
 await page.locator('#smsNew').click();
 await page.locator('#smsPicker [data-generator="gears"]').click();
 await page.locator('#smsGearTopEditor').waitFor();
 assert.match(await page.locator('#smsGearTopHelp').innerText(),/Double-click/);
 await page.locator('#smsAddGearTop').click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.gearTopControls?.length===1);
 const initial=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.gearTopControls[0]);
 assert.equal(initial.kind,'spindle');
 const width=page.locator('[data-gear-top-field="width"]');
 await width.fill('18');await width.press('Tab');
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.gearTopControls[0].width===18);
 await page.locator('[data-gear-top-field="depth"]').fill('12');
 await page.locator('[data-gear-top-field="depth"]').press('Tab');
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.gearTopControls[0].depth===12);
 await page.locator('[data-gear-top-field="height"]').fill('34');
 await page.locator('[data-gear-top-field="height"]').press('Tab');
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.gearTopControls[0].height===34);
 const oldX=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.gearTopControls[0].x);
 await page.locator('[data-gear-top-field="x"]').fill('0');
 await page.locator('[data-gear-top-field="x"]').press('Tab');
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.gearTopControls[0].x),oldX,
  'An offset grip must not close the centre bore.');
 assert.match(await page.locator('#smsModelError').innerText(),/shaft bore/);
 await page.locator('#smsRemoveGearTop').click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.gearTopControls?.length===0);
 await page.locator('#smsGearTopPreset').selectOption('fluted-knob');
 await page.locator('#smsAddGearTop').click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.gearTopControls?.[0]?.kind==='knob');
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.gearTopControls[0].x),0);
 assert.equal(await page.locator('#smsGearTopSelect option').count(),1);
 await page.locator('#smsUndo').click();
 await page.waitForFunction(()=>!window.__sensoryStudio.currentModel.build.gearTopControls?.length);
 await page.locator('#smsRedo').click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.gearTopControls?.length===1);
 assert.equal(errors.length,0,'No uncaught errors: '+errors.join('; '));
 console.log('WT-026 Chromium: add, exact XYZ sizing, shaft collision rollback and undo/redo passed.');
}finally{await browser.close();}
