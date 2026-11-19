import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
async function exact(key,value){await page.locator('output[data-value-for="'+key+'"]').click();await page.locator('[data-exact-input="'+key+'"]').fill(String(value));await page.locator('[data-exact-input="'+key+'"]').press('Enter');}
async function add(type){await page.locator('#smsNew').click();await page.locator('#smsPicker [data-generator="'+type+'"]').click();}
try{
 const url=new URL(process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321');url.searchParams.set('layout','legacy');
 await page.goto(url.href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__sensoryStudio,null,{timeout:60000});
 assert.equal(await page.locator('.collapsible-section[open]').count(),0,'Sections start closed.');
 assert((await page.locator('.section-descriptor').first().innerText()).length>10);
 await page.locator('.left details.collapsible-section').first().locator('summary').first().click();
 await page.locator('output[data-out="count"]').click();await page.locator('[data-exact-input="count"]').fill('19');await page.locator('[data-exact-input="count"]').press('Enter');
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.parameters.count===19);
 await page.locator('output[data-out="count"]').click();await page.locator('[data-exact-input="count"]').fill('30');await page.locator('[data-exact-input="count"]').press('Escape');
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.count),19,'Escape leaves the original value intact.');
 await page.locator('output[data-out="crystalSize"]').click();await page.locator('[data-exact-input="crystalSize"]').fill('235');await page.locator('[data-exact-input="crystalSize"]').press('Enter');
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.parameters.crystalSize===2.35);
 await page.locator('#themeBtn').click();assert.equal(await page.locator('body.theme-light').count(),1);
 const colours=await page.locator('.cloud-sync-panel').evaluate(el=>({bg:getComputedStyle(el).backgroundColor,fg:getComputedStyle(el.querySelector('.note')).color}));
 const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{const v=n/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
 const luminance=s=>rgb(s).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);
 const lum=[luminance(colours.bg),luminance(colours.fg)].sort((a,b)=>a-b);assert((lum[1]+.05)/(lum[0]+.05)>=4.5,'Private sync explanatory text meets 4.5:1 contrast.');
 await page.locator('#smsNew').click();
 const picker=page.locator('#smsPicker');
 assert.equal(await picker.locator('[data-generator] img').count(),7,'Each model family has a preview.');
 const originalCrystal=await page.evaluate(()=>window.__sensoryStudio.currentModel.id);
 await picker.getByRole('button',{name:'Browse Crystal Clusters starting points'}).click();
 const crystalPictures=await picker.locator('[data-preset] img').evaluateAll(images=>images.map(image=>image.src));
 assert.equal(crystalPictures.length,6,'Each crystal starting point renders actual geometry.');
 assert.equal(new Set(crystalPictures).size,6,'Crystal geometry produces six distinct thumbnails.');
 await fs.mkdir('qa',{recursive:true});
 await page.screenshot({path:'qa/unified-family-crystals.png'});
 await picker.locator('[data-preset="radial-bloom"]').click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.parameters.leanMode==='Radial outward');
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.editableState.crystals.length),11);
 await page.locator('#model-tab-'+originalCrystal).click();
 await page.locator('#smsNew').click();
 await picker.getByRole('button',{name:'Browse Cogs & Gears starting points'}).click();
 assert(await picker.locator('[data-preset] img').count()>2,'Gear starting points have distinct preview cards.');
 await picker.getByRole('button',{name:'All model types'}).click();
 await picker.getByRole('button',{name:'Browse Cogs & Gears starting points'}).click();
 await picker.locator('[data-preset="pulley"]').click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.parameters.wheelStyle==='Pulley');
 assert.equal(await picker.isVisible(),false,'Selecting a preset closes the picker.');
 await add('tactile-tiles');const first=await page.evaluate(()=>window.__sensoryStudio.currentModel.id);
 await page.locator('#smsPreset').selectOption('basket');
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.parameters.pattern==='basket');
 await page.screenshot({path:'qa/unified-family-tactile-tiles.png'});
 await page.locator('.sms-panel-details > summary').filter({hasText:'Size and proportions'}).click();await exact('width',92.5);
 await add('tactile-tiles');const second=await page.evaluate(()=>window.__sensoryStudio.currentModel.id);
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.width),80);
 await page.locator('#model-tab-'+first).click();assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.width),92.5);
 const builds=await page.evaluate(()=>window.__sensoryStudio.metrics.previewBuilds);
 await page.locator('#model-tab-'+second).click();await page.locator('#model-tab-'+first).click();assert.equal(await page.evaluate(()=>window.__sensoryStudio.metrics.previewBuilds),builds,'Unchanged tabs reuse their preview resources.');
 await page.locator('#smsSaveModel').click();await page.locator('#smsLibrary').click();await page.locator('#smsSavedModels button').filter({hasText:'Linked copy'}).first().click();
 assert(await page.evaluate(()=>!!window.__sensoryStudio.currentModel.link));await page.locator('#smsBreak').click();assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.link),null);
 await add('gears');
 for(const [type,preset,key,value] of [
  ['waves','eddy','flowStyle','Vortex'],
  ['control-caps','dish-dial','rotaryTop','Dish'],
  ['characters','goat-alert','construction','Layered'],
  ['light-pods','lantern','shellForm','Lantern']
 ]){
  await add(type);
  await page.locator('#smsPreset').selectOption(preset);
  await page.waitForFunction(([key,value])=>window.__sensoryStudio.currentModel.parameters[key]===value,[key,value]);
  await fs.mkdir('qa',{recursive:true});
  await page.screenshot({path:`qa/unified-family-${type}.png`});
 }
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.registry.list().filter(generator=>generator.category!=='Imports').length),7);
 await page.locator('#model-tab-'+first+' .close-tab').click();assert(await page.evaluate(id=>window.__sensoryStudio.project.models.some(m=>m.id===id),first));
 await page.locator('#smsLibrary').click();await page.locator('#smsProjectModels .sms-tile').filter({hasText:'Tactile Texture Tiles'}).first().getByRole('button',{name:'Open',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.id),first);
 await page.locator('#smsBuild').click();
 await page.locator('.sms-panel-details > summary').filter({hasText:'Pixel holes'}).click();
 await page.locator('#smsPixelAdd').click();
 assert.equal(await page.locator('[data-pixel-field="diameter"]').count(),1);
 const fitDownload=page.waitForEvent('download');
 await page.locator('#smsPixelCoupon').click();
 assert.match((await fitDownload).suggestedFilename(),/^pixel-fit-.*\.stl$/);
 await page.locator('#smsSend').click();await page.locator('[data-job-prepare]').first().click();
 await page.waitForFunction(()=>window.__sensoryStudio.project.printJobs[0]?.status==='prepared',null,{timeout:150000});
 const downloadPromise=page.waitForEvent('download');await page.locator('[data-job-3mf]').first().click();const download=await downloadPromise;
 await fs.mkdir('qa',{recursive:true});await download.saveAs('qa/studio-tactile.3mf');const bytes=await fs.readFile('qa/studio-tactile.3mf');assert.equal(bytes.readUInt32LE(0),0x04034b50);
 await page.locator('#model-tab-'+first).click();await page.locator('#smsDesign').click();await page.locator('.sms-panel-details > summary').filter({hasText:'Size and proportions'}).click();await exact('width',98);
 await page.locator('#smsPrint').click();assert.equal(await page.locator('[data-job-3mf]').first().isDisabled(),true,'Editing invalidates the old job export.');
 const before=await page.evaluate(()=>window.__sensoryStudio.project.models.map(m=>[m.id,m.parameters]));
 await Promise.all([page.waitForURL(url=>url.searchParams.has('reload')),page.getByRole('button',{name:'Reload Studio'}).click()]);await page.waitForFunction(()=>window.__sensoryStudio);assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.project.models.map(m=>[m.id,m.parameters])),before);
 await page.screenshot({path:'qa/studio-workspace.png',fullPage:true});assert.deepEqual(errors,[]);
 console.log('Studio browser: exact entry, collapsed sections, light contrast, seven generators, independent tabs, pinned copies, preview reuse, real worker/3MF, stale-job gating and reload passed.');
}catch(error){console.error('Studio page errors:',errors);await fs.mkdir('qa',{recursive:true});await page.screenshot({path:'qa/studio-failure.png',fullPage:true});throw error;}
finally{await browser.close();}
