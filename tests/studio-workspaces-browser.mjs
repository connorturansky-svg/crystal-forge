import assert from 'node:assert/strict';
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
 assert(!await page.locator('[data-state=wireChannels]').isVisible());
 await destination('Wiring').press('Enter');
 await reveal('[data-state=wireChannels]');
 assert(!await page.locator('[data-state=mount]').isVisible());
 await destination('Pixels').press('Enter');
 await reveal('#pixelProfileSelect');
 assert(!await page.locator('[data-state=wireChannels]').isVisible());
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
 console.log('WT-022 workspaces: keyboard, retained model, actual mounting gesture and narrow navigation passed');
}finally{await browser.close();}
