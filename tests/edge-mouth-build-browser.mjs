/* End-to-end exploratory proof. A real pointer places native M1; the browser
 * then saves/reloads, prepares and downloads the STL and 3MF. No runtime code
 * is changed and this is not a passing tactile-safety acceptance test.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {readBinaryStlTriangles,sliceStlAtZ,radialSectionProfile} from './helpers/print-section-profile.mjs';
import {readCrystal3MfTriangles} from './helpers/three-mf-section-profile.mjs';

const name='QA exposed M1 bore in Gear';
const browser=await chromium.launch({headless:true,
 executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1440,height:950},acceptDownloads:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.__sensoryStudio,{timeout:45000});
 await page.evaluate(name=>window.__sensoryStudio.addModel('gears',{
  mode:'Decorative',wheelStyle:'Rounded lobes',webStyle:'Solid',diameter:100,
  teeth:12,bore:0,thickness:10,reliefStyle:'None',dualMaterial:false
 },name),name);
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 await page.locator('.sms-palette [data-edge-finish=enabled]').check();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.edgeFinish?.enabled===true);
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 await page.locator('[data-view=top]').click();
 await page.waitForFunction(()=>window.__crystalForgeViewMetrics?.().settled,undefined,{timeout:30000});
 await page.locator('.sms-palette').getByRole('button',{name:'Place mounting hole in 3D'}).click();
 const point=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(12,12,'top'));
 assert(point,'A supported top Gear face should be available for native M1 placement');
 await page.mouse.click(point.x,point.y);
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.manualMountHoles?.length===1);
 await page.keyboard.press('Escape');
 const before=await page.evaluate(()=>({mount:window.__sensoryStudio.currentModel.build.manualMountHoles[0],
  edgeFinish:window.__sensoryStudio.currentModel.build.edgeFinish}));
 assert.equal(before.mount.entryFace,'top');
 assert.equal(before.mount.diameter,3.4);
 assert.equal(before.edgeFinish.enabled,true);
 await fs.mkdir('qa',{recursive:true});
 await page.screenshot({path:'qa/top-m1-browser-build.png'});
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.reload();
 await page.waitForFunction(name=>window.__sensoryStudio?.currentModel?.name===name,name);
 const persisted=await page.evaluate(()=>({mount:window.__sensoryStudio.currentModel.build.manualMountHoles[0],
  edgeFinish:window.__sensoryStudio.currentModel.build.edgeFinish}));
 assert.deepEqual(persisted,before,'M1 and edge finish settings persist after reload');
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 await page.locator('#smsSend').click();
 const job=page.locator('#smsJobs article').filter({hasText:name});
 await job.locator('[data-job-prepare]').click();
 await page.waitForFunction(()=>[...document.querySelectorAll('#smsJobs [data-job-stl]')]
  .some(el=>!el.disabled),undefined,{timeout:120000});
 const downloads={};
 for(const format of ['stl','3mf']){
  const [download]=await Promise.all([page.waitForEvent('download',{timeout:30000}),
   job.locator('[data-job-'+format+']').click()]);
  assert.equal(await download.failure(),null);
  const bytes=await fs.readFile(await download.path());
  downloads[format]=bytes;
  await download.saveAs('qa/top-m1-browser.'+format);
 }
 const check={
  STL:readBinaryStlTriangles(downloads.stl),
  MF3:readCrystal3MfTriangles(downloads['3mf'])
 };
 const results={};
 for(const [format,triangles] of Object.entries(check)){
  const at=z=>radialSectionProfile(sliceStlAtZ(triangles,z),
   {center:[before.mount.x,-before.mount.z],minRadius:1.45,maxRadius:2.2});
  const top=at(9.75),deep=at(8.75);
  assert(top?.matchingSegments>=8&&deep?.matchingSegments>=8,format+' through-hole did not section');
  results[format]={nearTopRadiusMm:+top.medianRadius.toFixed(4),
   deepRadiusMm:+deep.medianRadius.toFixed(4),
   expansionMm:+(top.medianRadius-deep.medianRadius).toFixed(4)};
 }
 assert(Math.abs(results.STL.nearTopRadiusMm-results.MF3.nearTopRadiusMm)<.01);
 assert(Math.abs(results.STL.deepRadiusMm-results.MF3.deepRadiusMm)<.01);
 await page.screenshot({path:'qa/top-m1-browser-printed.png'});
 assert.deepEqual(errors,[],'No uncaught Chromium errors');
 const report={name,realPointerPlacement:true,reloaded:true,downloaded:['STL','3MF'],
  hole:before.mount,edgeFinishEnabled:true,results,
  outcome:results.STL.expansionMm>.15?'top-entry-lead-in-observed':'top-entry-sharp-lip-observed',
  disclaimer:'Diagnostic only: not a tactile-safety or hardware-fit certificate'};
 await fs.writeFile('qa/top-m1-browser-evidence.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
