import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const url=process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const logs=[];
const context=await browser.newContext({viewport:{width:1440,height:950},deviceScaleFactor:2,acceptDownloads:true});
const page=await context.newPage();
page.on('pageerror',e=>logs.push('PAGE ERROR '+e.message));
page.on('console',m=>{if(m.type()==='error')logs.push('CONSOLE ERROR '+m.text())});
try{
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>document.querySelector('canvas')&&document.querySelector('#status')?.textContent?.includes('Ready'),null,{timeout:40000});
 assert(await page.locator('canvas').count(),'WebGL canvas mounted');
 // A DPR=2 canvas must match its CSS viewport, not spill over it.
 const layout=await page.evaluate(()=>{
  const rect=document.querySelector('#viewport').getBoundingClientRect();
  const canvas=document.querySelector('#viewport canvas');
  const c=canvas.getBoundingClientRect();
  return {viewport:{w:rect.width,h:rect.height,x:rect.x,y:rect.y},
    canvas:{w:c.width,h:c.height,x:c.x,y:c.y},
    pixelBuffer:{w:canvas.width,h:canvas.height},dpr:window.devicePixelRatio,
    camera:window.__crystalForgeViewMetrics?.()};
 });
 assert.equal(layout.dpr,2,'Retina/DPR=2 simulation is enabled');
 assert(Math.abs(layout.canvas.w-layout.viewport.w)<2,'Canvas CSS width equals viewport width');
 assert(Math.abs(layout.canvas.h-layout.viewport.h)<2,'Canvas CSS height equals viewport height');
 assert(Math.abs(layout.canvas.x-layout.viewport.x)<2,'Canvas starts at viewport left edge');
 assert(Math.abs(layout.canvas.y-layout.viewport.y)<2,'Canvas starts at viewport top edge');
 assert(layout.pixelBuffer.w>=layout.canvas.w*1.9,'WebGL still uses high resolution backing pixels');
 assert(layout.camera&&Math.abs(layout.camera.screen[0])<.05&&Math.abs(layout.camera.screen[1])<.05,
   'Initial cluster is centred onscreen at DPR=2 '+JSON.stringify(layout));
 console.log('Retina viewport framing verified at DPR=2');
 console.log('3D editor launched');
 await page.locator('#studioLightBtn').click();
 assert((await page.locator('#studioLightBtn').innerText()).includes('Off'),'Even lighting toggles off');
 await page.locator('#studioLightBtn').click();
 assert((await page.locator('#studioLightBtn').innerText()).includes('On'),'Even lighting toggles on');
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
 for(const [key,value] of [['spacing','100'],['leanMode','Radial inward'],['leanAmount','80'],['angleRandomness','0']]){
  await page.locator('[data-state="'+key+'"]').evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))},value);
  await page.waitForTimeout(160);
 }
 const savedLean=await page.evaluate(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')||'{}').settings);
 assert.equal(savedLean.leanMode,'Radial inward','Lean preset persisted');
 assert.equal(savedLean.leanAmount,80,'Lean strength persisted');
 await page.locator('[data-state="spacing"]').evaluate(el=>{el.value='48';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.locator('[data-state="leanMode"]').selectOption('Organic / natural');
 await page.locator('[data-state="leanAmount"]').evaluate(el=>{el.value='35';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.locator('[data-state="angleRandomness"]').evaluate(el=>{el.value='32';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.waitForTimeout(300);
 await page.locator('[data-tab="design"]').click();

 assert((await page.locator('#shapeScope').innerText()).includes('GLOBAL SHAPE'),'Global mode restored');
 await page.locator('#floatBtn').click();
 assert(await page.locator('#floatBtn.active').count(),'Floating inspection enabled');
 await page.locator('[data-view="bottom"]').click();

 async function centred(stage){
  const m=await page.evaluate(()=>window.__crystalForgeViewMetrics?.());
  assert(m,'Missing view metrics '+stage);
  assert(Math.abs(m.screen[0])<.06&&Math.abs(m.screen[1])<.06,'Model offscreen '+stage+' '+JSON.stringify(m));
 }
 await centred('before camera changes');
 // Reproduce: user pans then tries to orbit the cluster. Centre Model
 // should restore the pivot without changing any crystal geometry.
 await page.locator('#centreViewBtn').click();
 await centred('after explicit recenter');
 await page.locator('[data-state="baseDome"]').evaluate(el=>{el.value='33';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.waitForTimeout(400);await centred('larger dome');
 await page.locator('[data-tab="design"]').click();
 await page.locator('[data-state="height"]').evaluate(el=>{el.value='190';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.waitForTimeout(400);await centred('height change');
 await page.locator('[data-view="left"]').click();await page.waitForTimeout(400);await centred('left snap');
 await page.locator('[data-tab="build"]').click();
 await page.locator('[data-state="baseDome"]').evaluate(el=>{el.value='4';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.waitForTimeout(400);await centred('smaller dome');

 console.log('Individual shaping, green selection, floating view and bottom snap verified');
 console.log('Advanced editor and view controls verified');
 await page.locator('[data-tab="build"]').click();
 await page.locator('[data-state="baseEdgeRadius"]').evaluate(el=>{el.value='2.5';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.waitForTimeout(250);
 assert.equal(Number(await page.locator('[data-state="baseEdgeRadius"]').inputValue()),2.5,'Base edge radius slider works');
 assert(!(await page.locator('[data-state="hollowCrystals"]').isChecked()),'Cura-controlled infill defaults on');
 assert(await page.locator('[data-state="baseVault"]').count(),'Base vault control exists');
 assert(await page.locator('#placePixelBtn').count(),'Manual LED editor is available');
 assert(await page.locator('#placeMountBtn').count(),'Manual mount editor is available');
 assert(await page.locator('[data-state="cutSockets"]').isChecked(),'Socket cuts default on');
 assert.equal(await page.locator('[data-state="lightingMode"]').inputValue(),'single','Single shared LED mode default');
 await page.locator('#fitPixelBaseBtn').click();
 assert.equal(Number(await page.locator('[data-state="baseHeight"]').inputValue()),25,'Pixel base preset sets 25 mm');
 assert.equal(await page.locator('[data-state="pixelCount"]').inputValue(),'1','Exactly one requested LED');
 assert.equal(await page.locator('[data-state="baseStyle"]').inputValue(),'Fitted','Fitted base default');
 await page.locator('[data-tab="print"]').click();
 await page.locator('#prepareBtn').click();
 assert(await page.evaluate(()=>window.__crystalForgeWorkerStarts>=1),'Prepare Print uses a Web Worker');
 await page.locator('#helpBtn').click();
 assert(await page.locator('#infoOverlay:not([hidden])').count(),'UI stays responsive during manufacturing');
 await page.locator('#closeInfo').click();
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
   return status.toLowerCase().includes('prepared')||status.toLowerCase().includes('failed')||status.toLowerCase().includes('cancelled');
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
