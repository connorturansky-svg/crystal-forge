import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {studioFeatures} from '../studio-features.js';
import {RELEASE_READ_PREFIX} from '../src/ui/info-release-summary.mjs';

const browser=await chromium.launch({
 headless:true,executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage']
});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('requestfailed',request=>errors.push(request.url()+': '+request.failure()?.errorText));
 await page.goto(process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321');
 await page.waitForFunction(()=>window.__sensoryStudio);
 await page.evaluate(()=>window.__sensoryStudio.addModel('tactile-tiles',{width:80},'Catalogue navigation witness'));
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 await page.locator('.sms-palette [data-palette-key=width]').press('ArrowRight');
 const snapshot=()=>page.evaluate(()=>JSON.stringify(window.__sensoryStudio.project.models));
 const saved=await snapshot();
 const buildCount=await page.evaluate(()=>window.__sensoryStudio.metrics.previewBuilds);
 const trigger=page.locator('#helpBtn');
 const dialog=page.locator('#infoOverlay');
 const tab=name=>dialog.getByRole('tab',{name,exact:true});
 const openFeatures=async()=>{
  await trigger.click();
  await tab('Features').click();
 };
 await trigger.click();
 assert.equal(await trigger.innerText(),'Info');
 assert.equal(await page.locator('#changelogBtn').count(),0);
 assert(await tab('Help guide').getAttribute('aria-selected')==='true');
 await tab('What’s new').click();
 assert(await tab('What’s new').getAttribute('aria-selected')==='true');
 assert(await dialog.getByLabel('Unreleased changes').isVisible());
 const summary=dialog.locator('#infoReleaseSummary');
 assert(await summary.isVisible());
 assert(await trigger.getAttribute('data-info-unread')!==null);
 assert.equal(await summary.locator('#infoReleaseSummaryList>li').count(),1);
 const currentTitle=await dialog.locator('#currentRelease > strong').innerText();
 assert.match(await summary.locator('#infoReleaseSummaryList').innerText(),new RegExp(currentTitle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 // WT-021 wording belongs to its historical release, even after newer releases ship.
 const infoRelease=dialog.locator('#infoChangelog details.release').filter({
  has:page.locator(':scope > summary').filter({hasText:'v0.16.0-dev.35.50 —'})
 });
 assert.equal(await infoRelease.count(),1);
 assert.match(await infoRelease.locator(':scope > ul').textContent(),/Moved — Open Info/);
 assert.match(await infoRelease.locator(':scope > ul').textContent(),/New — Read version highlights/);
 assert(!await summary.getByText('Unreleased WT-021 draft',{exact:true}).count());
 const readKey=await page.evaluate(prefix=>prefix+document.querySelector('.version').textContent.trim().slice(1),RELEASE_READ_PREFIX);
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),readKey),null,'Opening Info does not acknowledge changes');
 await summary.getByRole('button',{name:'Mark this version as read'}).click();
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),readKey),'read');
 assert.equal(await trigger.getAttribute('data-info-unread'),null);
 assert.match(await summary.locator('h3').innerText(),/up to date/);
 assert.equal(await snapshot(),saved);
 // Simulate a peer-tab update after an earlier release has been read.
 await page.evaluate(({key,prefix})=>{
  localStorage.removeItem(key);
  const previous=document.querySelector('#infoChangelog .release-archive > details.release > summary').textContent.match(/^v([^ ]+)/)[1];
  localStorage.setItem(prefix+previous,'read');
  window.dispatchEvent(new StorageEvent('storage',{key,newValue:null,storageArea:localStorage}));
 },{key:readKey,prefix:RELEASE_READ_PREFIX});
 assert.match(await summary.locator('h3').innerText(),/since your last acknowledgement/);
 assert.equal(await summary.locator('#infoReleaseSummaryList>li').count(),1);
 await summary.getByRole('button',{name:'Mark this version as read'}).click();
 assert.equal(await trigger.getAttribute('data-info-unread'),null);
 await dialog.getByText('Earlier releases',{exact:true}).click();
 assert(await dialog.locator('.release-archive details').first().isVisible());
 await tab('What’s new').focus();
 await page.keyboard.press('ArrowLeft');
 assert(await tab('Features').getAttribute('aria-selected')==='true');
 assert(await page.evaluate(()=>document.activeElement.id==='infoTabFeatures'));
 await page.keyboard.press('ArrowLeft');
 assert(await tab('Help guide').getAttribute('aria-selected')==='true');
 await page.keyboard.press('ArrowRight');
 const search=dialog.getByRole('searchbox',{name:'Search features'});
 const category=dialog.getByLabel('Category',{exact:true});
 const cards=dialog.locator('[data-feature-id]');
 assert.equal(await cards.count(),studioFeatures.length);
 await cards.first().locator('svg path').waitFor();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.metrics.previewBuilds),buildCount);
 assert.equal(await snapshot(),saved);
 await search.fill('  CABle   routes ');
 assert.equal(await cards.count(),1);
 assert.match(await cards.first().innerText(),/Limited by geometry/);
 await category.selectOption('print');
 assert.equal(await cards.count(),0);
 assert.match(await dialog.locator('[data-feature-count]').innerText(),/No features match/);
 await search.fill('');
 await category.selectOption('inspection');
 assert.equal(await cards.count(),2);
 assert.match(await dialog.locator('[data-feature-id=physical]').innerText(),/Unavailable in app/);
 await page.locator('#closeInfo').focus();
 await page.keyboard.press('Shift+Tab');
 assert(await page.evaluate(()=>!!document.activeElement.closest('#infoOverlay')));
 await page.keyboard.press('Escape');
 assert.equal(await dialog.isVisible(),false);
 assert(await trigger.evaluate(element=>element===document.activeElement));

 for(const feature of studioFeatures.filter(item=>item.action==='family')){
  await openFeatures();
  await category.selectOption(feature.family);
  assert.equal(await cards.count(),1);
  await cards.first().getByRole('button',{name:feature.label}).click();
  const picker=page.locator('#smsPicker');
  await picker.getByRole('heading',{name:feature.title+' starting points'}).waitFor();
  assert((await picker.locator('[data-preset]').count())>0);
  await picker.getByRole('button',{name:'Close',exact:true}).click();
  assert.equal(await snapshot(),saved);
 }

 for(const [id,selector] of [
  ['shape','.sms-workspace-nav [data-tab=design][aria-current=step]'],
  ['editing','.sms-workspace-nav [data-tab=build][aria-current=step]'],
  ['fit','.sms-palette [data-pixel-profile-editor]'],
  ['routing','.sms-palette [data-native-route]'],
  ['tabs','.sms-palette [data-place-mount]'],
  ['sections','[data-feature-inspect]'],
  ['projects','#smsSearch'],
  ['fabricate','#smsPrintCurrent']
 ]){
  await openFeatures();
  await category.selectOption('');
  await dialog.locator('[data-feature-id="'+id+'"] button').click();
  await page.locator(selector).waitFor();
  assert.equal(await dialog.isVisible(),false);
  assert.equal(await snapshot(),saved);
 }
 await openFeatures();
 await dialog.locator('[data-feature-id=keys] button').click();
 assert(await tab('Help guide').getAttribute('aria-selected')==='true');
 await page.keyboard.press('Escape');
 await mkdir('qa',{recursive:true});
 await page.locator('#themeBtn').click();
 await openFeatures();
 await cards.first().locator('svg').waitFor();
 const firstBackground=await cards.first().evaluate(card=>getComputedStyle(card).backgroundColor);
 await dialog.screenshot({path:'qa/unified-wt021-features-desktop.png'});
 await page.keyboard.press('Escape');
 await page.locator('#themeBtn').click();
 await page.setViewportSize({width:390,height:780});
 await page.emulateMedia({reducedMotion:'reduce'});
 await openFeatures();
 await cards.first().locator('svg').waitFor();
 assert.notEqual(await cards.first().evaluate(card=>getComputedStyle(card).backgroundColor),firstBackground);
 const bounds=await dialog.locator('.dialog').boundingBox();
 assert(bounds.x>=0&&bounds.x+bounds.width<=390);
 assert(await search.isVisible()&&await category.isVisible());
 await dialog.screenshot({path:'qa/unified-wt021-features-mobile.png'});
 await page.keyboard.press('Escape');
 await page.reload();
 await page.waitForFunction(()=>window.__sensoryStudio);
 assert.equal(await trigger.getAttribute('data-info-unread'),null,'Acknowledgement survives reload');
 await trigger.click();
 await tab('What’s new').click();
 assert.match(await summary.locator('h3').innerText(),/up to date/);
 await page.keyboard.press('Escape');
 assert.deepEqual(errors,[]);
 console.log('UX-01 catalogue: family and workspace actions, state preservation, filters, graphics, focus and themes passed.');
}finally{
 await browser.close();
}
