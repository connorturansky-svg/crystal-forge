import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const url=process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const logs=[];
const page=await browser.newPage({viewport:{width:1440,height:950},acceptDownloads:true});
page.on('pageerror',e=>logs.push('PAGE ERROR '+e.message));
page.on('console',m=>{if(m.type()==='error')logs.push('CONSOLE ERROR '+m.text())});
try{
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>document.querySelector('canvas')&&document.querySelector('#status')?.textContent?.includes('Ready'),null,{timeout:40000});
 assert(await page.locator('canvas').count(),'WebGL canvas mounted');
 console.log('3D editor launched');
 await page.locator('#themeBtn').click();
 assert(await page.locator('body.theme-light').count(),'Light theme applied');
 await page.locator('#themeBtn').click();
 await page.locator('#helpBtn').click();
 assert(await page.locator('#infoOverlay:not([hidden])').count(),'Help modal opens');
 await page.locator('#closeInfo').click();
 await page.locator('#changelogBtn').click();
 assert(await page.locator('[data-info-pane="changelog"]:not([hidden])').count(),'Changelog opens');
 await page.locator('#closeInfo').click();
 console.log('Theme, Help and Changelog verified');
 await page.locator('#advancedBtn').click();
 await page.locator('[data-tool="translate"]').click();
 await page.locator('[data-view="top"]').click();
 await page.locator('[data-view="iso"]').click();
 console.log('Advanced editor and view controls verified');
 await page.locator('[data-tab="build"]').click();
 assert(await page.locator('[data-state="hollowCrystals"]').isChecked(),'Hollow defaults on');
 assert(await page.locator('[data-state="cutSockets"]').isChecked(),'Socket cuts default on');
 await page.locator('[data-tab="print"]').click();
 await page.locator('#prepareBtn').click();
 await page.waitForFunction(()=>{
  const panel=document.querySelector('#prepareReport');
  const status=document.querySelector('#prepareStatus')?.textContent||'';
  if(status.includes('failed')||status.includes('Failed'))return true;
  return panel&&!panel.hidden;
 },null,{timeout:120000});
 const status=await page.locator('#prepareStatus').innerText();
 assert(!status.includes('failed'),'Fabrication preparation succeeded: '+status);
 const pieces=await page.locator('#reportPieces').innerText();
 assert.equal(pieces,'1','Export must contain one connected solid body');
 console.log('Manufacturing prepared:',status);
 console.log('Mounting / hollow / sockets:',
  await page.locator('#reportHollow').innerText(),
  await page.locator('#reportSockets').innerText());
 await page.locator('#printHeatmap').check();
 await page.screenshot({path:'qa/browser-smoke.png'});
 const [download]=await Promise.all([page.waitForEvent('download',{timeout:15000}),page.locator('#stlBtn').click()]);
 assert(download.suggestedFilename().endsWith('.stl'));
 const [mf]=await Promise.all([page.waitForEvent('download',{timeout:15000}),page.locator('#threeMfBtn').click()]);
 assert(mf.suggestedFilename().endsWith('.3mf'));
 console.log('STL and 3MF browser downloads verified');
 if(logs.length)console.log('Nonfatal browser logs:',logs.join('\n').slice(0,1800));
 assert.equal(logs.length,0,'No JavaScript / network errors in browser');
 console.log('BROWSER SMOKE TEST PASSED');
}catch(e){
 console.log('Browser failure:',e.stack||e);
 try{await page.screenshot({path:'qa/browser-smoke.png'})}catch{}
 if(logs.length)console.log('Browser logs:',logs.join('\n').slice(0,3000));
 throw e;
}finally{await browser.close()}
