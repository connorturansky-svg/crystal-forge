import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {WORKSPACE_KEY} from '../studio-documents.js';
import {LAYERS_KEY} from '../src/ui/viewport-layers.mjs';

const browser=await chromium.launch({headless:true,executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:950}});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 // Witness the rendered scene without adding an app API or bypassing viewport interaction.
 const studioSource=await readFile(new URL('../studio-v3.js',import.meta.url),'utf8');
 await page.route(/\/studio-v3\.js(?:\?|$)/,route=>route.fulfill({
  contentType:'text/javascript',body:studioSource+'\nwindow.__layerTestScene=scene;'
 }));
 const gridVisibility=()=>page.evaluate(()=>window.__layerTestScene.children.filter(node=>['GridHelper','AxesHelper'].includes(node.type)).map(node=>node.visible));
 await page.goto(process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321');
 await page.waitForFunction(()=>window.__sensoryStudio);
 const nav=page.getByRole('navigation',{name:'Workspaces'});
 const toggle=page.getByRole('button',{name:'Layers',exact:true});
 const panel=page.getByRole('region',{name:'Viewport layers'});
 const field=id=>panel.locator('[data-layer-id='+id+']');
 const preset=panel.locator('select');
 const saved=()=>page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY);
 for(const family of ['crystals','tactile-tiles','gears','waves','control-caps','characters','light-pods']){
  if(family!=='crystals')await page.evaluate(f=>window.__sensoryStudio.addModel(f,null,'Layers '+f),family);
  await nav.getByRole('button',{name:'Build',exact:true}).press('Enter');
  await page.evaluate(()=>window.__sensoryStudio.saveImmediately());
  const before=await saved();
  await toggle.press('Enter');
  assert.equal(await field('mountTabs').isEnabled(),family==='crystals');
  assert.equal(await field('wireLengths').isEnabled(),family==='crystals');
  await preset.selectOption('reset');
  assert.deepEqual(await gridVisibility(),[true,true]);
  const crystalMarker=page.locator('.hardware-marker[data-hw-kind=pixel]').first();
  if(family==='crystals')await crystalMarker.waitFor({state:'visible'});
  await field('gridAxes').press('Space');
  assert(!await field('gridAxes').isChecked());
  assert.deepEqual(await gridVisibility(),[false,false]);
  assert(await field('dimensions').isChecked());
  await preset.selectOption('clean');
  assert(!await page.locator('#smsModelDimensions').isVisible());
  assert(!await field('pixelTags').isChecked());
  if(family==='crystals')await crystalMarker.waitFor({state:'hidden'});
  await preset.selectOption('pixels');
  assert(await field('pixelTags').isChecked());
  if(family==='crystals')await crystalMarker.waitFor({state:'visible'});
  assert(!await field('wireRoutes').isChecked());
  await field('pixelTags').press('Escape');
  assert(await toggle.evaluate(el=>el===document.activeElement));
  assert.equal(await saved(),before,family+' layers must preserve saved project bytes');
  assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).pixelTags,LAYERS_KEY),true);
 }
 await page.setViewportSize({width:390,height:700});
 await page.locator('#themeBtn').click();
 await toggle.press('Enter');
 assert(await panel.isVisible());
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await panel.screenshot({path:'qa/wt176-after-layers-narrow.png'});
 await panel.locator('select').press('Escape');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__sensoryStudio);
 await nav.getByRole('button',{name:'Design',exact:true}).press('Enter');
 await toggle.press('Enter');
 assert(await field('pixelTags').isChecked());
 assert(!await field('wireRoutes').isChecked());
 await page.setViewportSize({width:1440,height:950});
 await page.screenshot({path:'qa/wt176-after-layers.png'});
 const touch=await browser.newContext({viewport:{width:390,height:700},isMobile:true,hasTouch:true});
 try{
  const phone=await touch.newPage();
  await phone.goto(page.url(),{waitUntil:'domcontentloaded'});
  await phone.waitForFunction(()=>window.__sensoryStudio);
  await phone.getByRole('navigation',{name:'Workspaces'}).getByRole('button',{name:'Design',exact:true}).tap();
  const touchLayers=phone.getByRole('button',{name:'Layers',exact:true});
  await touchLayers.tap();
  const touchPanel=phone.getByRole('region',{name:'Viewport layers'});
  const checkbox=touchPanel.getByRole('checkbox',{name:'Pixel tags',exact:true});
  await checkbox.locator('..').tap();
  assert(!await checkbox.isChecked());
  await touchLayers.tap();
  assert(!await touchPanel.isVisible());
 }finally{await touch.close();}
 assert.deepEqual(errors,[]);
 console.log('Viewport Layers: all seven builders, independent groups and presets, keyboard, persistence, narrow dark view and unchanged saved bytes passed.');
}finally{await browser.close();}
