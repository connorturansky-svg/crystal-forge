import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
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

 // WT-025A: check actual rendered legibility, not merely that CSS contains token names.
 await destination('Design').press('Enter');
 const textSize=selector=>page.evaluate(selector=>{
  const element=document.querySelector(selector);
  return element?Number.parseFloat(getComputedStyle(element).fontSize):null;
 },selector);
 assert((await textSize('body'))>=16,'Default main text is at least 16px');
 assert((await textSize('.sms-tool-finder>label'))>=15,'Find-tools label is readable');
 assert((await textSize('.sms-tool-finder>p'))>=14,'Find-tools guidance is readable');
 assert((await textSize('.sms-tool-result'))>=15,'Tool search results are readable');
 await page.locator('#changelogBtn').click();
 assert(await page.locator('#infoChangelog').isVisible(),'What’s New remains available');
 assert((await textSize('.dialog-body'))>=16,'Release notes are readable at default zoom');
 await page.locator('#infoTabHelp').click();
 assert((await textSize('#infoHelp'))>=16,'Help paragraphs are readable');
 await page.locator('#closeInfo').click();
 await page.locator('#themeBtn').click();
 assert((await textSize('.sms-tool-finder>label'))>=15,'Readable labels survive theme changes');
 assert((await textSize('body'))>=16,'Readable main text survives theme changes');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),
  'Readable controls do not create mobile document overflow');
 // Browser text-size overrides must scale the new rem-based typography.
 const zoomed=await page.evaluate(()=>{
  document.documentElement.style.fontSize='200%';
  const size=selector=>Number.parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
  const result={body:size('body'),searchLabel:size('.sms-tool-finder>label')};
  document.documentElement.style.fontSize='';
  return result;
 });
 assert(zoomed.body>=32&&zoomed.searchLabel>=30,
  '200% browser text sizing scales the main UI and tool-finder labels: '+JSON.stringify(zoomed));
 await mkdir('qa',{recursive:true});
 await page.screenshot({path:'qa/unified-wt025-legibility-390.png'});
 await page.setViewportSize({width:1440,height:950});
 await page.screenshot({path:'qa/unified-wt025-legibility-1440.png'});
 console.log('WT-022 workspaces: keyboard, retained model, actual mounting gesture and narrow navigation passed');
}finally{await browser.close();}
