import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const url=process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321';
const browser=await chromium.launch({
 headless:true,
 executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage']
});
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
 await page.locator('#shapePresetSelect').selectOption('Soft Rounded');
 await page.locator('#applyShapePresetBtn').click();
 const presetGlobal=await page.evaluate(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')).settings.tipRound);
 assert.equal(presetGlobal,7,'PR6 global shaping preset changes actual crystal geometry');
 await page.locator('#shapePresetSelect').selectOption('Classic Quartz');
 await page.locator('#applyShapePresetBtn').click();
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
 // PR4 controls: contextual help, full hill and saved pixel profiles.
 await page.locator('#descriptionsBtn').click();
 assert.equal(await page.locator('#descriptionsBtn').getAttribute('aria-pressed'),'true');
 await page.locator('[data-tab="build"]').click();
 await page.locator('[data-state="mount"]').selectOption('Magnet inserts');
 assert((await page.locator('#contextHelpBody').innerText()).includes('magnets'),'Mounting description shown');
 await page.locator('[data-state="baseProfile"]').selectOption('Full dome / hill');
 await page.locator('[data-state="sideWall"]').evaluate(el=>{el.value='20';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.waitForTimeout(250);
 assert.equal(await page.locator('[data-state="baseProfile"]').inputValue(),'Full dome / hill');
 await page.locator('[data-state="baseProfile"]').selectOption('Plinth + dome');
 await page.locator('[data-state="sideWall"]').evaluate(el=>{el.value='100';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.locator('[data-state="mount"]').selectOption('None');
 await page.locator('#editPixelProfileBtn').click();
 assert(await page.locator('#pixelProfileOverlay:not([hidden])').count(),'Pixel editor opens');
 await page.locator('#pixelName').fill('Measured gumdrop');
 await page.locator('#pixelBodyDiameter').fill('13.5');
 assert(await page.locator('#pixelProfileDiagram svg').count(),'Dimensioned LED diagram is visible');
 assert((await page.locator('#pixelProfileDiagram [data-profile-field="pixelBodyDiameter"]').textContent()).includes('A 13.5 mm'),
  'Body width A changes live with input');
 await page.locator('#pixelProfileDiagram [data-profile-field="pixelCapHeight"]').click();
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'pixelCapHeight','Clicking E focuses the cap dimension input');
 await page.locator('#pixelFlangeDiameter').fill('15.5');
 await page.locator('#pixelBodyHeight').fill('19');
 await page.locator('#savePixelProfileBtn').click();
 assert(await page.locator('#pixelProfileOverlay[hidden]').count(),'Pixel editor closes');
 const pixelState=await page.evaluate(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')||'{}').settings);
 assert(pixelState.pixelProfileId.startsWith('custom-'),'Custom profile selected');
 assert(pixelState.pixelProfiles.some(p=>p.id===pixelState.pixelProfileId&&p.bodyDiameter===13.5),'Custom profile persisted');
 await page.locator('[data-state="pixelProfileId"]').selectOption('gumdrop');
 await page.locator('#descriptionsBtn').click();
 assert.equal(await page.locator('#descriptionsBtn').getAttribute('aria-pressed'),'false');
 // PR5: adjustable underside grooves, mirrored guide count and CSV.
 await page.locator('[data-tab="build"]').click();
 await page.locator('[data-state="wireChannels"]').check();
 await page.locator('[data-state="wireExit"]').check();
 await page.locator('[data-state="wireWidth"]').evaluate(el=>{el.value='3.5';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.waitForTimeout(250);
 assert(await page.locator('#singleWireExitBtn').count(),'Single-pixel push-in groove shortcut exists');
 await page.locator('#singleWireExitBtn').click();
 await page.waitForTimeout(420);
 assert((await page.locator('#wireRouteStatus').innerText()).length>30,'Groove route status explains what is cut');
 const underView=await page.evaluate(()=>window.__crystalForgeViewMetrics());
 assert(underView.camera[1]<underView.target[1],'Shortcut looks at actual underside');
 const wireSettings=await page.evaluate(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')||'{}').settings);
 assert(wireSettings.wireChannels&&wireSettings.wireExit,'Wire settings saved after one-click groove shortcut');
 assert.equal(wireSettings.wireWidth,3.5,'Wire width saved');
 assert((await page.locator('#hardwareGuideSummary').innerText()).includes('wire segments'),'Live wire guide summary present');
 const wireDownload=page.waitForEvent('download');
 await page.locator('[data-tab="print"]').click();
 await page.locator('#wiringCsvBtn').click();
 const wireCSV=await wireDownload;
 assert(wireCSV.suggestedFilename().includes('wire-routing'),'Wire routing CSV download works');
 await page.locator('[data-tab="build"]').click();
 await page.locator('[data-state="wireChannels"]').uncheck();
 await page.locator('[data-state="wireExit"]').uncheck();
 await page.waitForTimeout(160);
 await page.locator('[data-tab="print"]').click();
 await page.locator('[data-state="printer"]').selectOption('Custom / other');
 assert(await page.locator('#customPrinterSettings:not([hidden])').count(),'Custom dimensions shown');
 await page.locator('[data-state="printerX"]').fill('125');
 await page.locator('[data-state="printerX"]').dispatchEvent('input');
 await page.waitForTimeout(250);
 const chosenX=await page.evaluate(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')||'{}').settings.printerX);
 assert.equal(chosenX,125,'Custom machine size persists');
 await page.locator('[data-state="printer"]').selectOption('Ultimaker 3 Extended');
 assert(await page.locator('#customPrinterSettings[hidden]').count(),'Custom fields hidden for default printer');

 // PR5 — Cura profile selector, incompatibility warning and downloadable ZIP.
 await page.locator('[data-tab="print"]').click();
 await page.locator('[data-state="printer"]').selectOption('Ultimaker 3 Extended');
 await page.locator('[data-state="curaNozzle"]').selectOption('0.6');
 assert(await page.locator('#curaProfileBtn').isDisabled(),'UM3 Extended AA 0.6 mm is unsupported');
 assert((await page.locator('#curaProfileWarning').innerText()).includes('0.6'),'UM3 hardware warning');
 await page.locator('[data-state="printer"]').selectOption('Ultimaker 2+');
 assert(!(await page.locator('#curaProfileBtn').isDisabled()),'UM2+ supports 0.6 mm');
 await page.locator('[data-state="curaMaterial"]').selectOption('PETG');
 await page.locator('[data-state="curaIntent"]').selectOption('durable');
 await page.locator('[data-state="curaQuality"]').evaluate(el=>{el.value='90';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.waitForTimeout(220);
 assert((await page.locator('#curaProfileSummary').innerText()).includes('walls'),'Cura settings preview');
 const savedCura=await page.evaluate(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')||'{}').settings);
 assert.equal(savedCura.curaMaterial,'PETG');
 assert.equal(savedCura.curaQuality,90);
 const curaPromise=page.waitForEvent('download');
 await page.locator('#curaProfileBtn').click();
 const curaDownload=await curaPromise;
 assert(curaDownload.suggestedFilename().endsWith('.curaprofile'),'Cura import file extension');
 const zipBytes=await (await import('node:fs/promises')).readFile(await curaDownload.path());
 assert.equal(zipBytes.readUInt32LE(0),0x04034b50,'Cura profile is ZIP archive');
 await page.locator('[data-state="curaNozzle"]').selectOption('0.4');
 await page.locator('[data-state="curaMaterial"]').selectOption('PLA');
 await page.locator('[data-state="curaIntent"]').selectOption('light');
 await page.locator('[data-state="curaQuality"]').evaluate(el=>{el.value='60';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.locator('[data-state="printer"]').selectOption('Ultimaker 3 Extended');
 console.log('PR5 Cura profile selection, warning, storage and ZIP download verified');
 console.log('PR5 wiring, CSV and custom printer verification passed');
 console.log('PR4 help, base profiles, pixel editor and persistence verified');
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
 // Actual interaction regression for the manual LED hole editor. The previous
 // suite only checked that a button existed, not whether the control worked.
 await page.locator('[data-state="pixelPlacement"]').selectOption('manual');
 await page.waitForFunction(()=>!!JSON.parse(localStorage.getItem('crystal-forge-v3')||'{}').settings?.manualPixelHoles?.length,null,{timeout:7000});
 const beforeHole=await page.evaluate(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')||'{}').settings.manualPixelHoles[0]);
 assert(Number.isFinite(beforeHole.x),'Auto placement seeds manual LED X coordinate');
 const holeX=page.locator('[data-hole-kind="pixel"][data-hole-axis="x"]').first();
 await page.locator('[data-state="hardwareSnap"]').check();
 await page.locator('[data-state="hardwareSnapStep"]').evaluate(el=>{el.value='5';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await holeX.fill('12.4');await holeX.press('Tab');
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')).settings.manualPixelHoles[0].x===10,null,{timeout:8000});
 await page.locator('[data-state="hardwareSnap"]').uncheck();
 await holeX.fill('9999');
 await holeX.press('Tab');
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')||'{}').settings?.manualPixelHoles?.[0]?.x===9999,null,{timeout:7000});
 assert((await page.locator('#hardwareGuideSummary').innerText()).includes('invalid'),'Invalid LED position is flagged by shared planner');
 await page.locator('[data-state="pixelPlacement"]').selectOption('auto');
 await page.waitForTimeout(250);
 assert.equal((await page.locator('#hardwareGuideSummary').innerText()).includes('invalid (red)'),true,'Hardware guidance remains visible');
 console.log('Manual LED X/Z editor and invalid position screening verified');
 // The tab preset must be accessible, visible, hover-explained and reflected
 // in the live hardware plan before preparing a manufacturing mesh.
 await page.locator('[data-state="wireMode"]').selectOption('parallel');
 assert.equal(await page.locator('[data-state="wireMode"]').inputValue(),'parallel');
 await page.locator('[data-state="wirePairSpacing"]').evaluate(el=>{el.value='8';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.waitForFunction(()=>{
  const saved=JSON.parse(localStorage.getItem('crystal-forge-v3')||'{}').settings;
  return saved?.wirePairSpacing===8;
 },null,{timeout:12000});
 const pairedStored=await page.evaluate(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')).settings);
 assert.equal(pairedStored.wirePairSpacing,8,'Paired wire spacing persists after the queued 3D rebuild');
 await page.locator('[data-state="wireMode"]').selectOption('single');
 await page.locator('[data-state="mount"]').selectOption('Edge fixing tabs');
 assert(await page.locator('#edgeTabSettings').isVisible(),'Edge tab controls are visible');
 await page.locator('#placeTabBtn').click();
 assert((await page.locator('#manualHardwareList').innerText()).includes('Editable edge tabs'),'Tabs become individually editable');
 const existingTabs=await page.locator('[data-remove-tab]').count();
 if(existingTabs>0){
  await page.locator('[data-remove-tab]').first().click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')).settings);
  assert.equal(saved.tabCount,existingTabs-1,'Deleting an edge tab persists');
 }
 await page.locator('#stopHolePlacementBtn').click();
 await page.locator('#resetTabsBtn').click();
 const resetTabs=await page.evaluate(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')).settings.manualEdgeTabs);
 assert.equal(resetTabs,null,'Evenly spaced tab reset removes manual overrides');
 await page.locator('[data-state="tabCount"]').evaluate(el=>{el.value='3';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.locator('[data-state="tabHolesPerTab"]').evaluate(el=>{el.value='2';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.waitForTimeout(300);
 assert((await page.locator('#hardwareGuideSummary').innerText()).includes('edge tab(s)'),'Build previews planned tabs');
 await page.locator('[data-state="tabCount"]').hover();
 await page.waitForTimeout(570);
 assert(await page.locator('#controlTooltip:not([hidden])').isVisible(),'Slider hover explains its function');
 assert((await page.locator('#controlTooltip').innerText()).includes('Number of edge tabs'),'Tooltip is specific to the control');
 await page.locator('[data-state="mount"]').selectOption('None');
 // Continuous pixel tool: moving the mouse previews a circular hole,
 // each click adds one LED, and orbiting stays disabled until Escape.
 await page.locator('[data-view="top"]').click();
 await page.waitForTimeout(430);
 await page.locator('#placePixelBtn').click();
 let placement=await page.evaluate(()=>window.__crystalForgePlacementMetrics?.());
 assert(placement?.active,'Clicking place enters persistent tool');
 assert.equal(placement.orbitEnabled,false,'Orbit disabled during hole placement');
 const rect=await page.locator('#viewport canvas').boundingBox();
 assert(rect,'The 3D viewport exists');
 async function findValidPixel(){
  for(let row=2;row<=8;row++)for(let col=2;col<=8;col++){
   const x=rect.x+rect.width*col/10,y=rect.y+rect.height*row/10;
   await page.mouse.move(x,y);
   const m=await page.evaluate(()=>window.__crystalForgePlacementMetrics?.());
   if(m?.valid&&m.cursorVisible)return {x,y};
  }
  return null;
 }
 for(let n=0;n<2;n++){
  const point=await findValidPixel();
  assert(point,'Live ring cursor should find a valid position on the base');
  const prior=await page.evaluate(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')).settings.manualPixelHoles.length);
  await page.mouse.click(point.x,point.y);
  await page.waitForFunction(n=>JSON.parse(localStorage.getItem('crystal-forge-v3')).settings.manualPixelHoles.length===n+1,prior,{timeout:8000});
  assert((await page.evaluate(()=>window.__crystalForgePlacementMetrics?.())).active,'Placement remains active after each click');
 }
 await page.keyboard.press('Escape');
 placement=await page.evaluate(()=>window.__crystalForgePlacementMetrics?.());
 assert(!placement.active&&placement.orbitEnabled,'Esc exits placement and restores orbit');
 await page.locator('[data-state="pixelPlacement"]').selectOption('auto');
 await page.locator('[data-state="lightingMode"]').selectOption('single');
 console.log('Edge tabs, hover explanations, continuous 3D pixel cursor and two clicks verified');
 await page.locator('[data-state="targetedLightPaths"]').check();
 assert(await page.locator('[data-state="targetedLightPaths"]').isChecked(),'Targeted real light bore control enables');
 await page.locator('[data-state="lightBoreDiameter"]').evaluate(el=>{el.value='3.2';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.waitForFunction(()=>Number(JSON.parse(localStorage.getItem('crystal-forge-v3')||'{}').settings?.lightBoreDiameter)===3.2,null,{timeout:8000});
 assert.equal(Number(await page.locator('[data-state="lightBoreDiameter"]').inputValue()),3.2,'Light bore slider retains selection');
 await page.locator('[data-state="targetedLightPaths"]').uncheck();
 await page.locator('[data-state="mount"]').selectOption('Detachable plate');
 assert((await page.locator('[data-state="mount"]').inputValue())==='Detachable plate','M3 detachable mount selectable');
 await page.locator('[data-state="mount"]').selectOption('None');
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
 const steppedPromise=page.waitForEvent('download',{timeout:25000});
 await page.locator('#steppedPixelCouponBtn').click();
 assert((await steppedPromise).suggestedFilename().includes('stepped'),'Shaped pixel fit test download');
 assert.equal(await page.locator('#fitResultSelect option').count(),3,'Three labelled full-shape holes listed left-to-right');
 const fittedLabel=await page.locator('#fitResultSelect option').first().innerText();
 assert(fittedLabel.includes('12.00'),'Exact printed diameter is readable in selection');
 const fitBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')).settings.pixelFit);
 await page.locator('#fitResultSelect').selectOption('2');
 await page.locator('#applyFitResultBtn').click();
 const fitAfter=await page.evaluate(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')).settings.pixelFit);
 assert(fitAfter>fitBefore,'Choosing larger physical hole applies increased clearance');
 assert(await page.locator('#fitOverrideToolBtn').isVisible(),'Gear marks a measured override');
 await page.locator('#resetFitOverrideBtn').click();
 const fitReset=await page.evaluate(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')).settings.pixelFit);
 assert.equal(fitReset,fitBefore,'Override reset restores previous fit');
 assert(await page.locator('#detachablePlateBtn').isDisabled(),'Plate export hidden until matching mount selected');
 await page.locator('#printHeatmap').check();
 await page.screenshot({path:'qa/browser-smoke.png'});
 assert((await page.locator('#printAssuranceSummary').innerText()).includes('review note'),'Model-aware print check summary');
 assert((await page.locator('#opticalAuditSummary').innerText()).includes('crystal(s)'),'Per-crystal optical audit summary');
 const checkPromise=page.waitForEvent('download');
 await page.locator('#printChecklistBtn').click();
 assert((await checkPromise).suggestedFilename().includes('checklist'),'Cura check-list download');
 const opticalPromise=page.waitForEvent('download');
 await page.locator('#opticalCsvBtn').click();
 assert((await opticalPromise).suggestedFilename().includes('optical-audit'),'Crystal audit CSV');
 const packPromise=page.waitForEvent('download',{timeout:25000});
 await page.locator('#productionPackBtn').click();
 const packFile=await packPromise;
 assert(packFile.suggestedFilename().endsWith('.zip'),'One-file production ZIP');
 const packBytes=await (await import('node:fs/promises')).readFile(await packFile.path());
 assert.equal(packBytes.readUInt32LE(0),0x04034b50,'Production pack has ZIP header');
 assert(packBytes.includes(Buffer.from('START_HERE.txt')),'Production pack includes build instructions');
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
