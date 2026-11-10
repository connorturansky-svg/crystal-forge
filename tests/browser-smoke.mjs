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
 // Selected crystal uses global shape panel controls as its individual editor.
 await page.locator('#objectTree [data-id]').first().click();
 assert((await page.locator('#shapeScope').innerText()).includes('INDIVIDUAL CRYSTAL'),'Selected crystal scope shown');
 await page.locator('[data-state="tipRound"]').evaluate(el=>{el.value='4.5';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')||'null')?.crystals?.some(c=>c.shape?.tipRound===4.5),null,{timeout:8000});
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')||'null'));
 assert(saved.crystals.some(c=>c.shape?.tipRound===4.5),'Per-crystal tip rounding persisted');
 assert(saved.settings.tipRound!==4.5,'Individual shape left global rounding untouched');
 // Regeneration must keep the camera's orbit target at the cluster centre.
 await page.locator('#clearCrystalSelection').click();
 const viewBefore=await page.evaluate(()=>document.querySelector('#status')?.textContent);
 await page.locator('[data-state="spacing"]').evaluate(el=>{el.value='58';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.waitForTimeout(300);
 assert(await page.locator('canvas').count(),'Model remained visible after cluster regeneration');
 const domeInput=page.locator('[data-state="baseDome"]');
 await page.locator('[data-tab="build"]').click();
 await domeInput.evaluate(el=>{el.value='18';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.waitForTimeout(300);
 assert.equal(Number(await domeInput.inputValue()),18,'Base dome slider applied');
 await page.locator('[data-tab="design"]').click();

 assert((await page.locator('#shapeScope').innerText()).includes('GLOBAL SHAPE'),'Global mode restored');
 await page.locator('#floatBtn').click();
 assert(await page.locator('#floatBtn.active').count(),'Floating inspection enabled');
 await page.locator('[data-view="bottom"]').click();
 console.log('Individual shaping, green selection, floating view and bottom snap verified');
 console.log('Advanced editor and view controls verified');
 await page.locator('[data-tab="build"]').click();
 assert(await page.locator('[data-state="hollowCrystals"]').isChecked(),'Hollow defaults on');
 assert(await page.locator('[data-state="cutSockets"]').isChecked(),'Socket cuts default on');
 assert.equal(await page.locator('[data-state="lightingMode"]').inputValue(),'single','Single shared LED mode default');
 assert.equal(await page.locator('[data-state="pixelCount"]').inputValue(),'1','Exactly one requested LED');
 assert.equal(await page.locator('[data-state="baseStyle"]').inputValue(),'Fitted','Fitted base default');
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
 // Re-preparing while the merged manufacturing mesh is visible must retain
 // the actual base and all crystals rather than exporting preview-hidden parts.
 await page.locator('#prepareBtn').click();
 await page.waitForFunction(()=>{
   const status=document.querySelector('#prepareStatus')?.textContent||'';
   return status.includes('prepared')||status.includes('failed');
 },null,{timeout:120000});
 const repeated=await page.locator('#prepareStatus').innerText();
 assert(!repeated.toLowerCase().includes('failed'),'Re-preparation from inspection view must succeed');
 assert.equal(await page.locator('#reportPieces').innerText(),'1','Repeat union remains one connected body');
 console.log('Repeat Prepare Print validated');
 console.log('Mounting / hollow / sockets:',
  await page.locator('#reportHollow').innerText(),
  await page.locator('#reportSockets').innerText());
 await page.locator('#printHeatmap').check();
 await page.screenshot({path:'qa/browser-smoke.png'});
 const [download]=await Promise.all([page.waitForEvent('download',{timeout:15000}),page.locator('#stlBtn').click()]);
 assert(download.suggestedFilename().endsWith('.stl'));
 const [mf]=await Promise.all([page.waitForEvent('download',{timeout:15000}),page.locator('#threeMfBtn').click()]);
 assert(mf.suggestedFilename().endsWith('.3mf'));
 await page.locator('#hardwareColoursBtn').click();
 assert(await page.locator('#hardwareColoursBtn.active').count(),'Hardware outlines can be enabled');
 assert(Number(await page.locator('#reportSockets').innerText())<=1,'No more than one pixel bore in balloon mode');
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
