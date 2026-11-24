import {WORKSPACE_KEY} from '../studio-documents.js';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import * as THREE from 'three';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
const browser=await chromium.launch({headless:true,executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
let page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
try{
 const url=process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321';
 if(process.env.CRYSTAL_FORGE_BASELINE_URL){
  const baseline=await browser.newPage({viewport:{width:1440,height:1000}});
  await baseline.goto(process.env.CRYSTAL_FORGE_BASELINE_URL);
  await baseline.waitForFunction(()=>window.__sensoryStudio);
  await baseline.locator('#smsHomeNew').click();
  await baseline.locator('#smsPicker [data-generator=gears]').click();
  await fs.mkdir('qa',{recursive:true});
  await baseline.screenshot({path:'qa/unified-palette-before.png'});
  await baseline.setViewportSize({width:390,height:844});
  await baseline.screenshot({path:'qa/unified-wt014-before-narrow.png'});
  await baseline.close();
 }
 {
 const inspectionPage=page;
 await inspectionPage.bringToFront();
 await fs.mkdir('qa',{recursive:true});
 await inspectionPage.goto(url);
 await inspectionPage.waitForFunction(()=>window.__sensoryStudio);
 await inspectionPage.evaluate(()=>window.__sensoryStudio.addModel('crystals',{
  count:5,cutSockets:true,baseVault:false,hollowCrystals:false,targetedLightPaths:true,lightReach:15,wireChannels:false,lightingMode:'single'
 },'Inspection fixture'));
 const inspector=inspectionPage.locator('#smsLightInspector');
 assert.equal(await inspector.count(),1,JSON.stringify(await inspectionPage.evaluate(()=>({mode:window.__sensoryStudio.mode,model:window.__sensoryStudio.currentModel?.name,precision:document.getElementById('smsPrecisionContent')?.innerText.slice(0,350),error:document.querySelector('#smsEditor .sms-error')?.textContent}))));
 await inspector.waitFor();
 await inspector.locator('summary').press('Enter');
 await inspector.getByText('Preview only').waitFor();
 await inspector.getByRole('button',{name:'Prepare inspection'}).click();
 await inspector.getByText('Prepared manufacturing mesh').waitFor({timeout:120000});
 const inspectedRevision=await inspectionPage.evaluate(()=>window.__sensoryStudio.currentModel.revision);
 await inspectionPage.screenshot({path:'qa/unified-wt013-crystal-x.png'});
 await inspector.getByLabel('Section axis').selectOption('Z');
 const section=inspector.getByRole('slider');
 const before=await section.inputValue();
 await section.press('ArrowRight');
 assert.notEqual(await section.inputValue(),before);
 await inspectionPage.screenshot({path:'qa/unified-wt013-crystal-z.png'});
 const crystalResult=inspector.getByRole('button',{name:/^Inspect /}).first();
 await crystalResult.click();
 assert.equal(await crystalResult.getAttribute('aria-pressed'),'true');
 await inspectionPage.screenshot({path:'qa/unified-wt013-crystal-selected.png'});
 const issue=inspector.getByRole('listitem').filter({hasText:/skipped|blocked|unknown/}).first();
 await issue.getByRole('button').click();
 await inspectionPage.screenshot({path:'qa/unified-wt013-crystal-obstruction.png'});
 await inspector.getByLabel('Show light paths').uncheck();
 await inspector.getByRole('button',{name:'Reset section'}).click();
 assert.equal(await inspector.getByLabel('Section axis').inputValue(),'X');
 await inspector.getByRole('button',{name:'Close inspection'}).click();
 assert.equal(await inspector.evaluate(node=>node.open),false);
 assert.equal(await inspectionPage.evaluate(()=>window.__sensoryStudio.currentModel.revision),inspectedRevision,'Inspection is view-only');
 await inspectionPage.locator('.sms-workspace-nav [data-tab=build]').click();
 const strict=inspectionPage.getByLabel('Require accessible passages');
 const strictSection=strict.locator('xpath=ancestor::details[1]');
 if(!await strictSection.evaluate(node=>node.open))await strictSection.locator(':scope > summary').click();
 await strict.check();
 await inspectionPage.locator('#smsGlobalUndo').click();
 assert.equal(await strict.isChecked(),false,'Undo restores optional passage enforcement');
 await inspectionPage.locator('#smsGlobalRedo').click();
 assert.equal(await strict.isChecked(),true,'Redo restores strict passage enforcement');
 await inspector.locator('summary').press('Enter');
 await inspector.getByText('Preview only').waitFor();
 await inspector.getByRole('button',{name:'Prepare inspection'}).click();
 await inspector.getByText('Prepared manufacturing mesh').waitFor({timeout:120000});
 await inspectionPage.locator('.sms-workspace-nav [data-tab=print]').click();
 await inspectionPage.getByText(/Export blocked:.*crystal passage/).waitFor();
 assert(await inspectionPage.locator('[data-job-3mf]').isDisabled());
 await inspectionPage.reload();
 await inspectionPage.waitForFunction(()=>window.__sensoryStudio?.currentModel?.parameters.requireAccessiblePassages===true);
 await inspectionPage.evaluate(()=>window.__sensoryStudio.addModel('light-pods',{illuminated:true},'Light Pod inspection'));
 await inspector.locator('summary').press('Enter');
 await inspector.getByRole('button',{name:'Prepare inspection'}).click();
 await inspector.getByText('Prepared Light Pod').waitFor({timeout:120000});
 await inspector.getByLabel('Section axis').selectOption('Z');
 await inspectionPage.screenshot({path:'qa/unified-wt013-pod-section.png'});
 await inspectionPage.setViewportSize({width:390,height:844});
 await inspectionPage.screenshot({path:'qa/unified-wt013-inspector-narrow.png'});
 assert.deepEqual(errors,[]);
 console.log('WT-013 prepared sections, strict rejection, Pod and view-only controls verified.');
 await inspectionPage.close();
 page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
 page.on('pageerror',error=>errors.push(error.message));
 }
 await page.addInitScript(()=>{
  if(!localStorage.getItem('wt-workspace-panels-v1')){
   localStorage.setItem('wt-workspace-panels-v1',JSON.stringify({settingsWidth:335,rail:'hidden',settings:false,palette:false}));
   localStorage.setItem('wt-viewport-height','99');
  }
 });
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__sensoryStudio);
 await fs.mkdir('qa',{recursive:true});
 const shot=name=>page.screenshot({path:'qa/unified-'+name+'.png'});
 assert(await page.locator('body.theme-light').count(),'First visit uses light mode.');
 await page.locator('#smsHomeSearch').fill('no-such-project');
 assert.match(await page.locator('#smsHomeModels').innerText(),/No matching/);
 await page.locator('#smsHomeSearch').clear();
 await shot('home');
 await page.locator('#smsHomeNew').click();
 await page.locator('#smsPicker [data-generator="control-caps"]').click();
 const id=await page.evaluate(()=>window.__sensoryStudio.currentModel.id);
 const viewer=page.locator('#viewport');
 assert(await viewer.locator('canvas').isVisible());
 const before=await viewer.boundingBox();
 const palette=page.locator('.sms-palette');
 await palette.evaluate(node=>{node.scrollTop=node.scrollHeight;});
 assert.deepEqual(await viewer.boundingBox(),before);
 assert.equal(await page.locator('.sms-split,.sms-more').count(),0);
 assert.equal(await page.locator('.brand').innerText(),'Pixel Model Maker');
 assert((await page.locator('.version').boundingBox()).y>(await page.locator('.brand').boundingBox()).y);
 for(const id of ['simpleBtn','advancedBtn','themeBtn','helpBtn','hoverNotes','detailedExplanations','changelogBtn','saveBtn','loadBtn','smsReload','smsGlobalUndo','smsGlobalRedo','smsLibrary','smsHome','smsNew'])
  assert(await page.locator('#'+id).isVisible(),id+' is directly available');
 const leftPanel=page.locator('#smsTools'),rightPanel=page.locator('#smsPrecision'),bottom=page.locator('#smsModelRail');
 assert.equal(Math.round((await rightPanel.boundingBox()).width),335);
 assert((await leftPanel.boundingBox()).x<(await viewer.boundingBox()).x);
 assert((await rightPanel.boundingBox()).x>(await viewer.boundingBox()).x);
 assert((await bottom.boundingBox()).y>=(await viewer.boundingBox()).y+(await viewer.boundingBox()).height-1);
 assert.equal(await viewer.locator('.sms-palette').count(),0);
 const leftEdge=page.getByRole('separator',{name:'Resize design and build'});
 const rightEdge=page.getByRole('separator',{name:'Resize precision settings'});
 async function dragEdge(edge,dx){
  const box=await edge.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y,{steps:5});await page.mouse.up();
 }
 const leftWidth=(await leftPanel.boundingBox()).width,rightWidth=(await rightPanel.boundingBox()).width;
 await dragEdge(leftEdge,35);await dragEdge(rightEdge,-30);
 assert((await leftPanel.boundingBox()).width>leftWidth);
 assert((await rightPanel.boundingBox()).width>rightWidth);
 const resized=(await leftPanel.boundingBox()).width;
 await leftEdge.press('ArrowLeft');
 assert((await leftPanel.boundingBox()).width<resized);
 assert((await viewer.boundingBox()).width>=420);
 await shot('wt014-resized');
 const leftToggle=leftPanel.locator('header button'),rightToggle=rightPanel.locator('header button');
 await leftToggle.click();await rightToggle.press('Enter');
 assert.equal(await leftToggle.getAttribute('aria-expanded'),'false');
 assert.equal(await rightToggle.getAttribute('aria-expanded'),'false');
 assert.equal(await palette.isVisible(),false);
 assert(await viewer.locator('canvas').isVisible());
 await shot('wt014-collapsed');
 const savedPanels=await page.evaluate(()=>localStorage.getItem('wt-workspace-panels-v2'));
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 assert.equal(await page.evaluate(()=>localStorage.getItem('wt-workspace-panels-v2')),savedPanels);
 assert.equal(await leftToggle.getAttribute('aria-expanded'),'false');
 assert.equal(await rightToggle.getAttribute('aria-expanded'),'false');
 await leftToggle.click();await rightToggle.click();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.id),id);
 await page.locator('#advancedBtn').click();
 await page.locator('#simpleBtn').click();
 for(const id of ['helpBtn','changelogBtn']){
  await page.locator('#'+id).click();
  assert(await page.locator('#infoOverlay').isVisible());
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#infoOverlay').isVisible(),false);
 }
 const hoverNotes=page.getByRole('checkbox',{name:'Hover Notes',exact:true});
 const explanations=page.getByRole('checkbox',{name:'Detailed Explanations',exact:true});
 const hoverEnabled=await hoverNotes.isChecked(),detailEnabled=await explanations.isChecked();
 await explanations.setChecked(!detailEnabled);
 assert.equal(await explanations.isChecked(),!detailEnabled);
 assert.equal(await hoverNotes.isChecked(),hoverEnabled);
 await hoverNotes.setChecked(!hoverEnabled);
 assert.equal(await hoverNotes.isChecked(),!hoverEnabled);
 assert.equal(await explanations.isChecked(),!detailEnabled);
 await hoverNotes.setChecked(hoverEnabled);
 await explanations.setChecked(detailEnabled);
 const [savedBackup]=await Promise.all([page.waitForEvent('download'),page.locator('#saveBtn').click()]);
 assert.match(savedBackup.suggestedFilename(),/\.json$/);
 await Promise.all([page.waitForEvent('filechooser'),page.locator('#loadBtn').click()]);
 await page.locator('#smsFocus').click();
 assert(await page.locator('body.sms-focused').count());await page.keyboard.press('Escape');
 assert.equal(await page.locator('body.sms-focused').count(),0);
 await page.getByRole('searchbox',{name:'Search settings'}).fill('not a real setting');
 assert(await page.locator('.sms-settings [data-filtered]').count());
 await page.getByRole('searchbox',{name:'Search settings'}).clear();
 // WT-021 discoverability: left-hand finder indexes downloads and physical
 // tools independently of the right-hand precision settings filter.
 const findTools=page.getByRole('searchbox',{name:'Find tools and downloads'});
 await findTools.fill('pixel fit test');
 assert(await page.getByRole('button',{name:/Pixel test coupon/}).isVisible(),
  'Find tools locates the actual printable pixel test coupon');
 await findTools.fill('magnet');
 assert(await page.getByRole('button',{name:/Place mounting hole/}).isVisible());
 await findTools.fill('Cura');
 assert(await page.getByRole('button',{name:/Cura profile/}).isVisible());
 await findTools.fill('fictional missing tool');
 assert(await page.getByText(/No matching tools/).isVisible());
 await findTools.fill('pixel');await findTools.press('Escape');
 assert.equal(await findTools.inputValue(),'');
 await shot('wt014-desktop');
 await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
 await page.locator('.sms-palette').getByRole('button',{name:'Add pixel automatically',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles.length),1);
 await page.locator('#smsGlobalUndo').click();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length||0),0);
 await page.locator('#smsGlobalRedo').click();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles.length),1);
 await shot('build');
 await page.locator('#smsLibrary').click();await shot('library');
 await page.locator('.sms-workspace-nav [data-tab=print]').click();
 assert.match(await page.locator('#smsPrintCurrent').innerText(),/Buttons/);
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.project.printJobs.length),0);
 await shot('quick-print');
 await page.locator('#smsExpandPrint').click();assert(await page.locator('#smsPrintModels button').count());
 await page.locator('#smsExpandPrint').click();
 await page.locator('#smsNew').click();
 await page.getByRole('button',{name:'Browse Cogs & Gears starting points'}).click();
 const gearIds=['crown-open','turbine','petal-web','scallop-lace','solid-crown','rail-pulley'];
 const images=new Set();
 for(const gear of gearIds){
  const img=page.locator('#smsPicker [data-preset="'+gear+'"] img');
  assert.equal(await img.count(),1,gear+' has a rendered preview');
  images.add(await img.getAttribute('src'));
 }
 assert.equal(images.size,6,'Six distinct rendered gear previews');
 await shot('gear-gallery');
 await page.locator('#smsPicker [data-preset="turbine"]').click();
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 const range=page.locator('.sms-palette [data-palette-key=diameter]');
 const beforeDiameter=await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.diameter);
 await range.press('ArrowRight');
 assert(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.diameter)>beforeDiameter);
 const precision=page.locator('[data-model-param=diameter]');
 await precision.evaluate(input=>{input.closest('details').open=true;});
 assert.equal(await precision.inputValue(),await range.inputValue());
 await page.locator('output[data-value-for=diameter]').click();
 await page.locator('[data-exact-input=diameter]').fill('110');
 await page.locator('[data-exact-input=diameter]').press('Enter');
 assert.equal(await range.inputValue(),'110');
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.diameter),110);
 const purpose=page.locator('[data-model-param=mode]');
 await purpose.evaluate(input=>{input.closest('details').open=true;});
 await purpose.focus();
 await purpose.selectOption('Mechanical');
 assert.equal(await purpose.inputValue(),'Decorative');
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.mode),'Decorative');
 assert(await purpose.evaluate(input=>document.activeElement===input));
 await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
 await page.locator('.sms-palette').getByRole('button',{name:'Add pixel automatically',exact:true}).click();
 const pixel=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0]);
 assert(pixel);
 assert.notDeepEqual([pixel.x,pixel.z],[25.3,0]);
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 await page.locator('.sms-palette').getByRole('button',{name:'Sector',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.webStyle),'Sector');
 await shot('palette-after');
 await page.locator('#smsPartEditor > summary').click();
 const partSelector=page.locator('#smsPartSelect');
 await partSelector.selectOption({index:1});
 const partId=await partSelector.inputValue();
 const partSlider=page.locator('[data-palette-key="part-offset-0"]');
 await partSlider.focus();await partSlider.press('ArrowRight');
 await page.waitForFunction(id=>window.__sensoryStudio.currentModel.build.partOffsets?.[id]?.[0]===.1,partId);
 assert.equal(await page.locator('[data-part-axis="0"]').inputValue(),'0.1');
 await page.locator('#smsPartReset').click();
 assert.equal(await partSlider.inputValue(),'0');
 await page.locator('#smsNew').click();
 await page.locator('#smsPicker [data-generator=crystals]').click();
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 await page.getByText('Crystal starting points — creates a new model',{exact:true}).click();
 await page.getByRole('button',{name:'Crescent geode',exact:true}).click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.parameters.pattern==='Geode / Crescent');
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.editableState.crystals.length),13);
 await shot('crystal-palette');
 await page.locator('#smsNew').click();
 await page.locator('#smsPicker [data-generator="tactile-tiles"]').click();
 await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
 const pixelPalette=page.locator('.sms-palette');
 await pixelPalette.getByRole('button',{name:'Add pixel automatically',exact:true}).click();
 const getHoles=()=>page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles);
 const [initialHole]=await getHoles();
 await page.locator('[data-view=top]').click();
 await page.waitForTimeout(450);
 const marker=await page.evaluate(id=>window.__sensoryStudio.pixelMarkerScreen(id),initialHole.id);
 const viewportRect=await viewer.locator('canvas').boundingBox();
 const towardCentre=(marker.x+viewportRect.x+viewportRect.width/2)/2;
 await page.mouse.click(marker.x,marker.y);
 assert.equal(await pixelPalette.locator('[data-select-pixel]').first().getAttribute('aria-pressed'),'true');
 await page.mouse.move(marker.x,marker.y);
 await page.mouse.down();
 await page.waitForTimeout(260);
 await page.mouse.move(towardCentre,marker.y,{steps:4});
 assert.deepEqual((await getHoles())[0],initialHole,'Drag preview must not change the saved model.');
 await page.mouse.up();
 const [movedHole]=await getHoles();
 assert.equal(movedHole.id,initialHole.id);
 assert.notDeepEqual([movedHole.x,movedHole.z],[initialHole.x,initialHole.z]);
 await page.keyboard.press('Control+z');
 assert.deepEqual((await getHoles())[0],initialHole);
 await page.keyboard.press('Control+Shift+z');
 assert.deepEqual((await getHoles())[0],movedHole);
 const rotation=pixelPalette.locator('[data-pixel-field=rotation]');
 await rotation.fill('45');await rotation.press('Tab');
 assert.equal((await getHoles())[0].rotation,45);
 assert.equal(await rotation.inputValue(),'45');
 assert.equal(await page.locator('[data-pixel-field=rotation]:visible').count(),1);
 const position=pixelPalette.locator('[data-pixel-field=x]');
 await position.fill('9999');await position.press('Tab');
 assert.equal(Number(await position.inputValue()),movedHole.x);
 assert.match(await pixelPalette.locator('[data-pixel-status]').innerText(),/material|solid/);
 await pixelPalette.locator('[data-fit-kind]').selectOption('single');
 await pixelPalette.locator('[data-fit-format]').selectOption('3mf');
 const download=page.waitForEvent('download');
 await pixelPalette.locator('[data-fit-print]').click();
 assert.match((await download).suggestedFilename(),/single\.3mf$/);
 await shot('wt006-pixel-fit');
 const calibrated=pixelPalette.locator('[data-fit-calibration]');
 await pixelPalette.getByText('Record measured fit',{exact:true}).click();
 await calibrated.locator('[name=bodyDiameter]').fill('5');
 await calibrated.locator('[name=printedBoreDiameter]').fill('5.3');
 await calibrated.locator('[name=profileName]').fill('Measured test seed');
 await calibrated.getByRole('button',{name:'Save measured fit'}).click();
 assert.match((await getHoles())[0].profileId,/^custom-/);
 const sameId=(await getHoles())[0].id;
 assert.equal(sameId,initialHole.id);
 await pixelPalette.getByRole('button',{name:'Remove P1'}).click();
 assert.equal((await getHoles()).length,0);
 await page.locator('[data-view=top]').click();
 await page.waitForTimeout(380);
 const surface=await page.locator('canvas').first().boundingBox();
 await page.mouse.dblclick(surface.x+surface.width/2,surface.y+surface.height/2);
 const fittingActions=page.getByRole('dialog',{name:'Hardware at this point'});
 await fittingActions.waitFor();
 assert.match(await fittingActions.innerText(),/bore opens on both faces/);
 await shot('wt018-tile-hardware-context');
 await page.keyboard.press('Escape');
 await fittingActions.waitFor({state:'hidden'});
 assert.equal((await getHoles()).length,0);
 await page.mouse.dblclick(surface.x+surface.width/2,surface.y+surface.height/2);
 await fittingActions.getByRole('button',{name:'Add pixel',exact:true}).click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles.length===1);
 const [placed]=await getHoles();
 assert.notEqual(placed.id,sameId);
 assert.equal(placed.checked,true);
 await shot('wt006-pixel-placement');
 await pixelPalette.getByRole('button',{name:'Place LED fitting in 3D'}).click();
 const nativeCanvas=viewer.locator('canvas');
 await pixelPalette.getByRole('button',{name:'Done placing pixels'}).waitFor();
 const y=surface.y+surface.height/2;
 for(const fraction of [.58,.42,.64,.36,.70,.30]){
  const x=surface.x+surface.width*fraction;
  await page.mouse.move(x,y);
  if(await nativeCanvas.getAttribute('data-native-placement')==='valid'){
   await page.mouse.click(x,y);
   break;
  }
 }
 assert.equal((await getHoles()).length,2,'Manual placement adds another fitting and remains active.');
 await pixelPalette.getByRole('button',{name:'Done placing pixels'}).waitFor();
 await shot('wt019-native-placement');
 await page.keyboard.press('Escape');
 await pixelPalette.getByRole('button',{name:'Done placing pixels'}).waitFor({state:'hidden'});
 assert.equal((await getHoles()).length,2,'Exiting placement keeps accepted fittings.');
 const nameProject=async name=>{
  await page.locator('#smsProjectTitle').fill(name);
  await page.locator('#smsProjectTitle').press('Tab');
 };
 const snapshot=()=>page.evaluate(()=>window.__sensoryStudio.project.models.map(({id,parameters,materials,build,link})=>({id,parameters,materials,build,link})));
 await nameProject('River workshop');
 await page.locator('#smsLibrary').click();
 const savedModels=await snapshot();
 assert(savedModels.length>=2);
 const thumbnail=await page.evaluate(()=>window.__sensoryStudio.project.models.find(model=>model.thumbnail?.startsWith('data:image/'))?.thumbnail);
 assert(thumbnail);
 await page.locator('#smsSaveProject').click();
 const projects=page.locator('#smsSavedProjects');
 const river=projects.locator('[data-snapshot-id]').filter({has:page.getByRole('heading',{name:'River workshop',exact:true})});
 assert.match(await river.innerText(),new RegExp(savedModels.length+' models'));
 assert.equal(await river.locator('img').getAttribute('src'),thumbnail);
 await nameProject('No preview workshop');
 await page.evaluate(()=>window.__sensoryStudio.project.models.forEach(model=>{model.thumbnail=null;}));
 await page.locator('#smsSaveProject').click();
 assert.match(await projects.locator('[data-snapshot-id]').filter({hasText:'No preview workshop'}).innerText(),/Preview unavailable/);
 await nameProject('Current unsaved title');
 const currentModels=await snapshot();
 const savedCount=await projects.locator('[data-snapshot-id]').count();
 const search=page.locator('#smsSearch');
 await search.fill('rIvEr WoRk');
 assert.equal(await projects.locator('[data-snapshot-id]').count(),1);
 await page.locator('#smsFilter').selectOption('crystals');
 assert.equal(await projects.locator('[data-snapshot-id]').count(),await page.evaluate(()=>window.__sensoryStudio.project.models.some(model=>model.generator.typeId==='crystals'))?1:0,'Saved project filtering considers its model families.');
 await page.locator('#smsFilter').selectOption('all');
 await search.fill('');
 assert.equal(await projects.locator('[data-snapshot-id]').count(),savedCount);
 await projects.scrollIntoViewIfNeeded();
 await shot('wt007-project-gallery-desktop');
 page.once('dialog',dialog=>dialog.accept('Thawmor'));
 await page.locator('#smsCollectionNew').press('Enter');
 await page.locator('#smsLibraryAll').press('Enter');
 await river.getByText('Collections',{exact:true}).press('Enter');
 await river.getByRole('checkbox',{name:'Thawmor'}).check();
 await river.getByRole('button',{name:'☆ Favourite'}).click();
 await page.locator('#smsFavourites').press('Enter');
 assert.equal(await projects.locator('[data-snapshot-id]').count(),1);
 await shot('wt015-favourites');
 await page.locator('#smsCollections').selectOption({label:'Thawmor'});
 assert.equal(await river.count(),1);
 await shot('wt015-collection');
 page.once('dialog',dialog=>dialog.accept('River starter'));
 await river.getByRole('button',{name:'Save as reusable template'}).press('Enter');
 await page.locator('#smsTemplates').press('Enter');
 const starter=page.getByRole('button',{name:'Create project from template'});
 await starter.waitFor();
 page.once('dialog',dialog=>dialog.dismiss());
 await starter.press('Enter');
 assert.equal(await page.locator('#smsProjectTitle').inputValue(),'Current unsaved title');
 await shot('wt015-templates');
 await page.locator('#smsLibraryAll').press('Enter');
 await page.setViewportSize({width:740,height:880});
 assert(await river.getByRole('button',{name:'Open project River workshop'}).isVisible());
 await river.scrollIntoViewIfNeeded();
 await shot('wt007-project-gallery-mobile');
 await page.setViewportSize({width:1440,height:1000});
 const rename=river.getByRole('button',{name:'Rename saved project River workshop'});
 for(const input of [null,'   ','✨'.repeat(101),'River workshop']){
  const dialogResult=new Promise((resolve,reject)=>page.once('dialog',async dialog=>{
   try{
    const initial=dialog.defaultValue();
    if(input===null)await dialog.dismiss();else await dialog.accept(input);
    resolve(initial);
   }catch(error){reject(error);}
  }));
  await rename.press('Enter');
  assert.equal(await dialogResult,'River workshop');
  assert.equal(await river.count(),1);
  assert.equal(await projects.locator('[data-snapshot-id]').count(),savedCount);
  assert.equal(await page.locator('#smsProjectTitle').inputValue(),'Current unsaved title');
  if(input!==null&&input!=='River workshop')assert.match(await river.getByRole('status').innerText(),/1 to 100/);
 }
 assert.deepEqual(await snapshot(),currentModels);
 await search.fill('river workshop');
 const renamedTitle='Tide & <Light> 🌊';
 page.once('dialog',dialog=>dialog.accept('  '+renamedTitle+'  '));
 await rename.click();
 assert.equal(await projects.locator('[data-snapshot-id]').count(),0);
 await search.fill('tIDE');
 const renamed=projects.locator('[data-snapshot-id]').filter({has:page.getByRole('heading',{name:renamedTitle,exact:true})});
 assert.equal(await renamed.count(),1);
 assert.match(await renamed.innerText(),new RegExp(savedModels.length+' models'));
 assert.equal(await renamed.locator('img').getAttribute('src'),thumbnail);
 assert.equal(await page.locator('#smsProjectTitle').inputValue(),'Current unsaved title');
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
 await page.locator('#smsLibrary').click();
 assert.equal(await projects.locator('[data-snapshot-id]').count(),savedCount);
 assert.equal(await renamed.locator('img').getAttribute('src'),thumbnail);
 const open=renamed.getByRole('button',{name:'Open project '+renamedTitle});
 page.once('dialog',dialog=>dialog.dismiss());
 await open.click();
 assert.equal(await page.locator('#smsProjectTitle').inputValue(),'Current unsaved title');
 assert.equal(await projects.locator('[data-snapshot-id]').count(),savedCount);
 assert.deepEqual(await snapshot(),currentModels);
 const preSwitch=await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY);
 const competingSwitch=await page.evaluate(key=>{
  const newer=JSON.parse(localStorage.getItem(key));
  newer.project.title='Other tab before project switch';
  localStorage.setItem(key,JSON.stringify(newer));
  return JSON.stringify(newer);
 },WORKSPACE_KEY);
 page.once('dialog',dialog=>dialog.accept());
 await open.click();
 await page.locator('#smsSaveState').filter({hasText:'Project not saved'}).waitFor();
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY),competingSwitch);
 assert.deepEqual(await snapshot(),currentModels);
 await page.evaluate(({key,bytes})=>localStorage.setItem(key,bytes),{key:WORKSPACE_KEY,bytes:preSwitch});
 await page.evaluate(key=>{
  const set=Storage.prototype.setItem;
  window.__wt023RestoreStorage=()=>{Storage.prototype.setItem=set;delete window.__wt023RestoreStorage;};
  Storage.prototype.setItem=function(name,value){
   if(name===key)throw new DOMException('Test quota failure','QuotaExceededError');
   return set.call(this,name,value);
  };
 },WORKSPACE_KEY);
 try{
  page.once('dialog',dialog=>dialog.accept());
  await open.click();
  await page.locator('#smsSaveState').filter({hasText:'Project not saved'}).waitFor();
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY),preSwitch);
  assert.equal(await page.locator('#smsProjectTitle').inputValue(),'Current unsaved title');
  assert.equal(await projects.locator('[data-snapshot-id]').count(),savedCount);
  assert.deepEqual(await snapshot(),currentModels);
 }finally{
  await page.evaluate(()=>window.__wt023RestoreStorage());
 }
 const liveCrystal=await page.evaluate(()=>window.__sensoryStudio.addModel('crystals',
  {count:3},'Live Crystal before project switch').id);
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 const crystalHeight=page.locator('.sms-palette [data-palette-key=crystal-base-height]');
 const previousCrystalHeight=await crystalHeight.inputValue();
 await crystalHeight.press('ArrowRight');
 const latestCrystalHeight=Number(await crystalHeight.inputValue());
 assert.notEqual(latestCrystalHeight,Number(previousCrystalHeight));
 await page.locator('#smsLibrary').click();
 page.once('dialog',dialog=>dialog.accept());
 await open.click();
 assert.equal(await page.locator('#smsProjectTitle').inputValue(),renamedTitle);
 const committedSwitch=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),WORKSPACE_KEY);
 assert.equal(committedSwitch.project.title,renamedTitle);
 assert.equal(committedSwitch.savedProjects.at(-1).title,'Current unsaved title');
 const outgoingCrystal=committedSwitch.savedProjects.at(-1).models.find(model=>model.id===liveCrystal);
 assert.equal(Number(outgoingCrystal.parameters.baseHeight),latestCrystalHeight,
  'The switch captures the latest live Crystal edit in the outgoing snapshot');
 assert.deepEqual(await snapshot(),savedModels);
 await page.locator('#smsLibrary').click();
 assert.equal(await projects.locator('[data-snapshot-id]').count(),savedCount+1);
 assert(await projects.getByRole('button',{name:'Open project Current unsaved title'}).isVisible());
 const sourceCard=page.locator('#smsProjectModels article').first();
 const sourceName=await sourceCard.locator('h3').textContent();
 await sourceCard.getByRole('button',{name:'Save to library',exact:true}).click();
 const sourceSaved=page.locator('#smsSavedModels article').filter({has:page.getByRole('heading',{name:sourceName,exact:true})});
 await sourceSaved.getByRole('button',{name:'☆ Favourite'}).click();
 page.once('dialog',dialog=>dialog.accept('Pinned model starter'));
 await sourceSaved.getByRole('button',{name:'Save as reusable template'}).press('Enter');
 await page.locator('#smsTemplates').press('Enter');
 const pinned=page.locator('article').filter({has:page.getByRole('heading',{name:'Pinned model starter',exact:true})});
 await pinned.getByRole('button',{name:'Linked copy',exact:true}).click();
 const link=await page.evaluate(()=>window.__sensoryStudio.currentModel.link);
 assert.equal(link.revision,1);
 await page.locator('#smsLibrary').click();
 await pinned.getByRole('button',{name:'Independent copy',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.link),null);
 const previousProject=await page.evaluate(()=>window.__sensoryStudio.project.id);
 await page.locator('#smsLibrary').click();
 page.once('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'Create project from template'}).press('Enter');
 assert.notEqual(await page.evaluate(()=>window.__sensoryStudio.project.id),previousProject);
 assert.deepEqual(await snapshot(),savedModels);
 await shot('wt015-restored-project');
 await page.locator('#smsLibrary').click();
 const backupWorkspace=await page.evaluate(()=>{
  const project=structuredClone(window.__sensoryStudio.project);
  project.id='remote-fixture';project.title='Recovered River fixture';
  return {schemaVersion:1,project,library:[],savedProjects:[]};
 });
 const localProjectId=await page.evaluate(()=>window.__sensoryStudio.project.id);
 const restoreFile=page.locator('#smsImport');
 const backupFile={name:'workspace.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backupWorkspace))};
 await restoreFile.setInputFiles(backupFile);
 const recovery=page.getByRole('dialog',{name:'Review backup'});
 await recovery.waitFor();
 assert.match(await recovery.innerText(),/Backup only \(1\).*Recovered River fixture/);
 await shot('wt016-preview');
 // Verify recovery remains fully usable on a narrow phone-sized viewport.
 await page.setViewportSize({width:390,height:844});
 await recovery.getByLabel('Recovery strategy').selectOption('copies');
 const narrowDialog=await recovery.boundingBox();
 assert(narrowDialog&&narrowDialog.x>=-1&&narrowDialog.x+narrowDialog.width<=391,
  'Recovery dialog must fit within a 390px viewport');
 assert(await recovery.getByRole('button',{name:'Cancel'}).isVisible());
 await shot('wt016-recovery-dialog-390px');
 await recovery.getByRole('button',{name:'Cancel'}).click();
 await page.setViewportSize({width:1440,height:1000});
 assert.equal(await page.getByRole('heading',{name:'Recovered River fixture',exact:true}).count(),0);
 await restoreFile.setInputFiles(backupFile);
 await recovery.getByLabel('Recovery strategy').selectOption('merge');
 page.once('dialog',dialog=>dialog.accept());
 await recovery.getByRole('button',{name:'Apply choice'}).click();
 await recovery.waitFor({state:'hidden'});
 await page.getByText('Recovery complete', {exact:false}).waitFor();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.project.id),localProjectId);
 await page.locator('#smsLibraryAll').press('Enter');
 assert.equal(await page.getByRole('heading',{name:'Recovered River fixture',exact:true}).count(),1);
 await shot('wt016-restored-copy');
 await restoreFile.setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{corrupt')});
 await page.getByText('Could not read backup', {exact:false}).waitFor();
 await page.locator('#model-tab-'+id).click();
 await page.locator('#themeBtn').click();await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
 assert(await page.locator('body.theme-dark').count());
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.id),id);
 await page.setViewportSize({width:740,height:880});
 assert(await page.locator('#smsHomeNew').isVisible());
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true);
 await page.setViewportSize({width:1440,height:1000});
 const queueTileName='Café / Weather: '+ 'Printer '.repeat(12).trim();
 const fixture=await page.evaluate(tileName=>{
  const studio=window.__sensoryStudio;
  const crystal=studio.project.models.find(model=>model.generator.typeId==='crystals');
  const tile=studio.addModel('tactile-tiles',{width:70,dualMaterial:false},tileName);
  studio.switchModel(crystal.id);
  return {crystal:{id:crystal.id,name:crystal.name},tile:tile.id};
 },queueTileName);
 const openPrint=()=>page.locator('.sms-workspace-nav [data-tab=print]').click();
 const jobs=page.locator('#smsJobs article');
 const queue=()=>page.evaluate(()=>window.__sensoryStudio.project.printJobs);
 await openPrint();
 assert((await page.locator('#smsPrintCurrent').innerText()).includes(fixture.crystal.name));
 assert(await page.locator('#smsPrintCurrent img').isVisible());
 await page.locator('#smsExpandPrint').press('Enter');
 const addCrystal=page.locator('#smsPrintModels').getByRole('button',{name:'Add '+fixture.crystal.name,exact:true});
 await addCrystal.evaluate(button=>{button.click();button.click();});
 await page.locator('#smsPrintModels').getByRole('button',{name:'Add '+queueTileName,exact:true}).click();
 const [crystalJob,tileJob]=await queue();
 assert.equal((await queue()).length,2);
 assert.equal(crystalJob.modelId,fixture.crystal.id);
 assert.equal(tileJob.modelId,fixture.tile);
 const card=job=>jobs.filter({has:page.getByRole('heading',{name:job===tileJob?queueTileName:fixture.crystal.name,exact:true})});
 const tile=card(tileJob),crystal=card(crystalJob);
 assert.equal(await crystal.locator('img,.sms-picture-empty').count(),1);
 assert.match(await tile.innerText(),/source revision/);
 assert(await crystal.locator('[data-job-up]').isDisabled());
 assert(await tile.locator('[data-job-down]').isDisabled());
 const tabOrder=await page.evaluate(()=>window.__sensoryStudio.project.tabs);
 await tile.locator('[data-job-up]').click();
 assert.deepEqual(await jobs.evaluateAll(items=>items.map(item=>item.dataset.printJob)),[tileJob.id,crystalJob.id]);
 await tile.locator('[data-job-down]').click();
 await tile.locator('[data-job-up]').click();
 const setting=key=>tile.locator('[data-job-setting="'+key+'"]');
 await setting('printer').selectOption('Ultimaker 2+');
 await setting('curaNozzle').selectOption('0.8');
 await setting('curaMaterial').selectOption('PETG');
 await setting('curaQuality').fill('35');await setting('curaQuality').press('Tab');
 assert.equal(await crystal.locator('[data-job-setting=curaMaterial]').inputValue(),'PLA');
 await page.getByText('Saved locally',{exact:true}).waitFor();
 await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
 await openPrint();await page.locator('#smsExpandPrint').click();
 assert.deepEqual((await queue()).map(job=>job.id),[tileJob.id,crystalJob.id]);
 assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.project.tabs),tabOrder);
 assert.equal(await setting('curaQuality').inputValue(),'35');
 assert.equal(await setting('printer').inputValue(),'Ultimaker 2+');
 assert.equal(await setting('curaNozzle').inputValue(),'0.8');
 assert.equal(await setting('curaMaterial').inputValue(),'PETG');
 assert.equal(await page.locator('#smsMaterial').inputValue(),'PLA');
 assert(await tile.locator('[data-job-3mf]').isDisabled());
 await page.locator('#smsPrepareAll').click();
 const pending=(await queue()).find(job=>job.id===crystalJob.id);
 assert(pending.requestId);
 assert(await crystal.locator('[data-job-prepare]').isDisabled());
 await crystal.locator('[data-job-cancel]').click();
 assert.equal((await queue()).find(job=>job.id===crystalJob.id).status,'cancelled');
 await page.waitForFunction(id=>window.__sensoryStudio.project.printJobs.find(job=>job.id===id)?.status==='prepared',tileJob.id,{timeout:120000});
 assert.equal((await queue()).find(job=>job.id===crystalJob.id).status,'cancelled');
 await crystal.getByRole('button',{name:'Retry',exact:true}).click();
 assert.notEqual((await queue()).find(job=>job.id===crystalJob.id).requestId,pending.requestId);
 await page.waitForFunction(id=>window.__sensoryStudio.project.printJobs.find(job=>job.id===id)?.status==='prepared',crystalJob.id,{timeout:120000});
 async function useDownload(button){
  try{
   const [download]=await Promise.all([page.waitForEvent('download'),button.click()]);
   return {name:download.suggestedFilename(),bytes:await fs.readFile(await download.path())};
  }catch(error){
   // A click may return successfully when exportJob catches a failure.
   // Keep the exact Print Centre report and state as regression evidence.
   const card=await button.evaluate(node=>({
    disabled:node.disabled,jobText:node.closest('[data-print-job]')?.innerText?.slice(0,1000)
   })).catch(()=>({jobText:'Job card no longer available'}));
   const status=await page.locator('#smsPrintStatus').textContent().catch(()=>null);
   throw new Error('Print Centre download did not produce a file: '+error.message+
    '\\nJob: '+JSON.stringify(card)+'\\nStatus: '+status);
  }
 }
 function zipEntries(bytes){
  const entries=new Map();
  for(let offset=0;offset+30<=bytes.length&&bytes.readUInt32LE(offset)===0x04034b50;){
   const size=bytes.readUInt32LE(offset+18),nameSize=bytes.readUInt16LE(offset+26),extra=bytes.readUInt16LE(offset+28);
   const start=offset+30+nameSize+extra;
   entries.set(bytes.toString('utf8',offset+30,offset+30+nameSize),bytes.subarray(start,start+size));offset=start+size;
  }
  return entries;
 }
 function read3MFGeometry(xml){
  assert.match(xml,/<model unit="millimeter"/);
  const vertices=[...xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g)].flatMap(match=>match.slice(1).map(Number));
  const indices=[...xml.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"/g)].flatMap(match=>match.slice(1).map(Number));
  assert(vertices.length>0&&indices.length>0);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices);
  return geometry;
 }
 async function sectionRanges(inspector){
  await inspector.getByLabel('Cut section').check();
  const axis=inspector.getByLabel('Section axis'),slider=inspector.getByRole('slider');
  const ranges={};
  for(const direction of ['X','Z']){
   await axis.selectOption(direction);
   ranges[direction]=await slider.evaluate(input=>[Number(input.min),Number(input.max)]);
  }
  return ranges;
 }
 function assertSectionBounds(geometry,{X,Z},label){
  geometry.computeBoundingBox();
  const {min,max}=geometry.boundingBox;
  assert(Math.abs(X[0]-min.x)<.01&&Math.abs(X[1]-max.x)<.01,label+' section X matches the export');
  assert(Math.abs(Z[0]+max.y)<.01&&Math.abs(Z[1]+min.y)<.01,label+' section Z matches the export');
 }
 async function renderedXSection(inspector,x){
  const position=inspector.getByRole('slider');
  await inspector.getByLabel('Section axis').selectOption('X');
  const sectionX=await position.evaluate((slider,x)=>{
   slider.value=x;
   slider.dispatchEvent(new Event('input',{bubbles:true}));
   return Number(slider.value);
  },x);
  const section=await page.evaluate(async x=>{
   const {Mesh}=await import('three');
   const previous=Mesh.prototype.onBeforeRender;
   return new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{
     Mesh.prototype.onBeforeRender=previous;
     reject(new Error('The prepared cutaway was not rendered at X='+x));
    },5000);
    Mesh.prototype.onBeforeRender=function(renderer,scene,camera,geometry,material,...rest){
     previous.call(this,renderer,scene,camera,geometry,material,...rest);
     const plane=material.clippingPlanes?.[0];
     if(plane?.normal.x!==1||Math.abs(plane.constant+x)>.0001)return;
     clearTimeout(timeout);
     Mesh.prototype.onBeforeRender=previous;
     resolve({positions:Array.from(geometry.attributes.position.array),indices:Array.from(geometry.index.array)});
    };
   });
  },sectionX);
  const viewportMesh=new THREE.BufferGeometry();
  const printPositions=[];
  for(let i=0;i<section.positions.length;i+=3)
   printPositions.push(section.positions[i],-section.positions[i+2],section.positions[i+1]);
  viewportMesh.setAttribute('position',new THREE.Float32BufferAttribute(printPositions,3));
  viewportMesh.setIndex(section.indices);
  return {sectionX,viewportMesh};
 }
 async function verifyTabRemovalBounds(name,palette,{jobId,tab=2}={}){
  const boundsJob=jobId?page.locator('[data-print-job="'+jobId+'"]'):page.locator('#smsJobs article').filter({hasText:name});
  const boundsDisplay=page.locator('#smsModelDimensions');
  const readBounds=async locator=>{
   const match=(await locator.textContent()).match(/X × Y × Z: ([\d.]+) × ([\d.]+) × ([\d.]+) mm/);
   assert(match,name+' displays bounds in export orientation');
   return match.slice(1).map(Number);
  };
  const previousBounds=await readBounds(boundsDisplay);
  await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
  await palette.getByRole('button',{name:'Remove T'+tab,exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#smsModelDimensions').textContent.startsWith('Design preview'));
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  await boundsJob.getByText('Stale',{exact:true}).waitFor();
  for(const type of ['stl','3mf','export'])assert(await boundsJob.locator('[data-job-'+type+']').isDisabled());
  await boundsJob.locator('[data-job-prepare]').click();
  await boundsJob.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const updatedBounds=await readBounds(boundsDisplay);
  assert(updatedBounds[1]<previousBounds[1]-1,name+' loses the removed tab protrusion');
  const revisedSTL=await useDownload(boundsJob.locator('[data-job-stl]'));
  const revisedMF=await useDownload(boundsJob.locator('[data-job-3mf]'));
  const revisedPack=zipEntries((await useDownload(boundsJob.locator('[data-job-export]'))).bytes);
  const dimensions=JSON.parse(revisedPack.get('print-job-manifest.json')).dimensionsMm;
  const xml=zipEntries(revisedMF.bytes).get('3D/3dmodel.model').toString();
  assert.match(xml,/<item objectid="[0-9]+" transform="1 0 0 0 1 0 0 0 1 0 0 0"/);
  const stlGeometry=new STLLoader().parse(Uint8Array.from(revisedSTL.bytes).buffer);
  const mfGeometry=read3MFGeometry(xml);
  stlGeometry.computeBoundingBox();mfGeometry.computeBoundingBox();
  for(const side of ['min','max'])
   assert(stlGeometry.boundingBox[side].distanceTo(mfGeometry.boundingBox[side])<.001,name+' edited '+side+' agrees across files');
  for(const geometry of [stlGeometry,mfGeometry]){
   const actual=geometry.boundingBox.getSize(new THREE.Vector3()).toArray();
   assert(actual.every((value,i)=>Math.abs(value-dimensions[i])<.001),name+' edited manifest matches export bounds');
   assert.deepEqual(actual.map(value=>Number(value.toFixed(1))),updatedBounds);
   geometry.dispose();
  }
  assert.deepEqual(await readBounds(boundsJob.getByText(/^Prepared X/)),updatedBounds);
 }
 async function finishNativeJourney(name,{inspectCurvedRoute=false,inspectSideRoute=false,undersideProbeHeight}={}){

  const {parameters,build}=await page.evaluate(()=>window.__sensoryStudio.currentModel);
  const title='WT-021 '+name+' manufacturing journey';
  await page.locator('#smsProjectTitle').fill(title);
  await page.locator('#smsProjectTitle').press('Tab');
  await page.locator('#smsLibrary').click();
  await page.locator('#smsSaveProject').click();
  await page.locator('#smsSavedProjects').getByRole('heading',{name:title,exact:true}).waitFor();
  const backup=JSON.parse((await useDownload(page.locator('#smsBackup'))).bytes.toString());
  assert.deepEqual(backup.project.models.find(model=>model.name===name).build,build);
  await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
  await page.reload();
  await page.waitForFunction(name=>window.__sensoryStudio?.currentModel?.name===name,name);
  assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build),build);
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  await page.getByRole('button',{name:'Render actual model',exact:true}).click();
  const inspection=page.locator('#smsLightInspector');
  await inspection.getByText(/Prepared (?:manufacturing mesh|Light Pod)/).waitFor({timeout:120000});
  const ranges=await sectionRanges(inspection);
  let routeSection;
  if(inspectCurvedRoute||inspectSideRoute||undersideProbeHeight!==undefined){
   const [a,b]=build.pixelHoles;
   const {sectionX,viewportMesh}=await renderedXSection(inspection,(a.x+b.x)/2);
   const height=undersideProbeHeight??((a.surface.y+b.surface.y)/2-1);
   routeSection={viewportMesh,point:inspectSideRoute?
    new THREE.Vector3(sectionX,-a.z+.8,(a.surface.y+b.surface.y)/2):
    new THREE.Vector3(sectionX,-(a.z+b.z)/2,height)};
  }
  await inspection.getByRole('button',{name:'Close inspection'}).click();
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  const job=page.locator('#smsJobs article').filter({hasText:name});
  await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const production=zipEntries((await useDownload(job.locator('[data-job-export]'))).bytes);
  const stl=await useDownload(job.locator('[data-job-stl]'));
  const cura=await useDownload(job.locator('[data-job-cura]'));
  assert(stl.name.endsWith('.stl'));
  assert(cura.name.endsWith('.curaprofile'));
  assert.deepEqual(stl.bytes,[...production.entries()].find(([name])=>name.endsWith('.stl'))[1]);
  assert.deepEqual(cura.bytes,[...production.entries()].find(([name])=>name.endsWith('.curaprofile'))[1]);
  const threeMF=zipEntries((await useDownload(job.locator('[data-job-3mf]'))).bytes);
  const manifest=JSON.parse(production.get('print-job-manifest.json'));
  assert.equal(manifest.routing.channels.length,3);
  assert.equal(manifest.coordinateFrame,'Z-up');
  assert.equal(manifest.units,'mm');
  const xml=threeMF.get('3D/3dmodel.model').toString();
  assert.match(xml,/<item objectid="[0-9]+" transform="1 0 0 0 1 0 0 0 1 0 0 0"/);
  const stlGeometry=new STLLoader().parse(Uint8Array.from(stl.bytes).buffer);
  const mfGeometry=read3MFGeometry(xml);
  assertSectionBounds(stlGeometry,ranges,name+' STL');
  assertSectionBounds(mfGeometry,ranges,name+' 3MF');
  if(routeSection){
   const {viewportMesh,point}=routeSection;
   const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
   const walls=geometry=>{
    const mesh=new THREE.Mesh(geometry,material);
    return [-1,1].map(sign=>{
     const direction=inspectSideRoute?new THREE.Vector3(0,0,sign):new THREE.Vector3(0,sign,0);
     return new THREE.Raycaster(point,direction).intersectObject(mesh)[0]?.distance;
    });
   };
   const expected=walls(viewportMesh);
   assert(expected.every(Number.isFinite));
   assert(Math.abs(expected[0]+expected[1]-3.2)<.03,name+' rendered cutaway shows the calibrated route width');
   for(const geometry of [stlGeometry,mfGeometry])
    assert(walls(geometry).every((distance,i)=>Math.abs(distance-expected[i])<.01),name+' route walls match the rendered plane');
   viewportMesh.dispose();material.dispose();
  }
  for(const key of ['min','max'])
   assert(stlGeometry.boundingBox[key].distanceTo(mfGeometry.boundingBox[key])<.001,name+' matching print-space '+key);
  const measured=stlGeometry.boundingBox.getSize(new THREE.Vector3()).toArray();
  assert.equal(manifest.dimensionsMm.length,3);
  assert(measured.every((size,axis)=>Math.abs(size-manifest.dimensionsMm[axis])<.001),name+' production dimensions match the downloaded mesh');
  return {parameters,build,geometries:[
   ['STL',stlGeometry],['3MF',mfGeometry]
  ]};
 }
 const modelFile=await useDownload(tile.locator('[data-job-3mf]'));
 const printPack=await useDownload(tile.locator('[data-job-export]'));
 const threeMF=zipEntries(modelFile.bytes),pack=zipEntries(printPack.bytes);
 assert(threeMF.has('3D/3dmodel.model'));
 const directSTL=await useDownload(tile.locator('[data-job-stl]'));
 assert.match(directSTL.name,/\.stl$/);
 const packedSTL=[...pack.keys()].find(name=>name.endsWith('.stl'));
 assert.deepEqual(directSTL.bytes,pack.get(packedSTL));
 const directCura=await useDownload(tile.locator('[data-job-cura]'));
 assert.match(directCura.name,/cura-manual-settings\.txt$/);
 assert.deepEqual(directCura.bytes,pack.get('cura-manual-settings.txt'));
 assert.match(directCura.bytes.toString(),/infill_sparse_density/);
 await tile.getByText(/Stock Cura has no Generic PETG profile/).waitFor();
 const manifest=JSON.parse(pack.get('print-job-manifest.json'));
 const preparedTile=(await queue()).find(job=>job.id===tileJob.id);
 const meshXML=threeMF.get('3D/3dmodel.model').toString();
 assert.match(meshXML,/<model unit="millimeter"/);
 const vertices=[...meshXML.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].map(vertex=>vertex.slice(1).map(Number));
 assert(vertices.length>0);
 for(let axis=0;axis<3;axis++){
  const values=vertices.map(vertex=>vertex[axis]);
  const exportedSize=values.reduce((a,b)=>Math.max(a,b),-Infinity)-values.reduce((a,b)=>Math.min(a,b),Infinity);
  assert(Math.abs(manifest.dimensionsMm[axis]-exportedSize)<.001,'Manifest dimensions must match the actual Z-up export');
 }
 await shot('production-print-handoff');
 assert.deepEqual(manifest,{
  schemaVersion:1,modelId:fixture.tile,modelName:queueTileName,generatorType:'tactile-tiles',
  modelRevision:preparedTile.revision,jobId:tileJob.id,preparedRevision:preparedTile.preparedRevision,
  printer:'Ultimaker 2+',nozzleMm:.8,material:'PETG',quality:35,units:'mm',coordinateFrame:'Z-up',
  dimensionsMm:manifest.dimensionsMm,curaProfile:'manual-review',files:[...pack.keys()]
 });
 assert.match(printPack.name,/^cafe-weather-[a-z0-9-]+-rev[0-9]+-[0-9a-f]{16}\.zip$/);
 assert(printPack.name.length<85);
 assert(printPack.name.includes('-rev'+manifest.modelRevision+'-'));
 assert.equal(modelFile.name,printPack.name.replace(/\.zip$/,'.3mf'));
 const crystalFile=await useDownload(crystal.locator('[data-job-3mf]'));
 assert.notEqual(crystalFile.name.match(/[0-9a-f]{16}(?=\.3mf$)/)?.[0],modelFile.name.match(/[0-9a-f]{16}(?=\.3mf$)/)?.[0]);
 assert(zipEntries(crystalFile.bytes).has('3D/3dmodel.model'));
 const crystalPack=zipEntries((await useDownload(crystal.locator('[data-job-export]'))).bytes);
 const opticalReport=JSON.parse(crystalPack.get('03_Reports/light-passage-inspection.json'));
 assert.equal(opticalReport.softwareSamplingOnly,true);
 assert.equal(opticalReport.physicalOpticalVerification,false);
 assert.equal(opticalReport.modelRevision,JSON.parse(crystalPack.get('print-job-manifest.json')).modelRevision);
 assert(crystalPack.has('03_Reports/light-passage-inspection.txt'));
 for(const name of ['editable-model.json','material-roles.json','print-report.json','cura-manual-settings.txt'])assert(pack.has(name),name);
 assert([...pack.keys()].some(name=>name.endsWith('.stl')));
 const inner3MF=[...pack.keys()].find(name=>name.endsWith('.3mf'));
 assert.deepEqual(pack.get(inner3MF),modelFile.bytes);
 const profile=[...pack.keys()].find(name=>name.endsWith('.curaprofile'));
 assert.equal(profile,undefined);
 const readme=pack.get('READ-ME.txt').toString();
 for(const line of ['Model: '+queueTileName,'Revision: '+manifest.modelRevision,'Job ID: '+tileJob.id,
  'Printer: Ultimaker 2+','Nozzle: 0.8 mm','Material: PETG','Quality: 35 / 100','The STL files share one origin.','installed Cura'])
  assert(readme.includes(line),line);
 assert(zipEntries((await useDownload(page.locator('#smsCura'))).bytes).size>0);
 await shot('wt008-print-queue');
 await page.setViewportSize({width:740,height:880});
 await tile.scrollIntoViewIfNeeded();
 assert(await tile.locator('[data-job-export]').isVisible());
 await shot('wt008-print-queue-narrow');
 await page.setViewportSize({width:1440,height:1000});
 await setting('curaNozzle').selectOption('0.6');
 assert(await tile.locator('[data-job-3mf]').isDisabled());
 assert(await tile.locator('[data-job-export]').isDisabled());
 assert(await crystal.locator('[data-job-3mf]').isEnabled());
 await setting('printer').selectOption('Custom / other');
 await tile.locator('[data-job-prepare]').click();
 await page.waitForFunction(id=>window.__sensoryStudio.project.printJobs.find(job=>job.id===id)?.status==='prepared',tileJob.id,{timeout:120000});
 const manualPack=zipEntries((await useDownload(tile.locator('[data-job-export]'))).bytes);
 const manual=JSON.parse(manualPack.get('print-job-manifest.json'));
 assert.equal(manual.curaProfile,'manual-review');
 assert.equal(manual.printer,'Custom / other');
 assert.equal(manual.nozzleMm,.6);
 assert.equal(manual.material,'PETG');
 assert.equal(manual.quality,35);
 assert.deepEqual(manual.files,[...manualPack.keys()]);
 assert(manualPack.has('cura-manual-review.txt'));
 assert(![...manualPack.keys()].some(name=>name.endsWith('.curaprofile')));
 await tile.locator('[data-job-reset]').click();
 assert.deepEqual((await queue()).find(job=>job.id===tileJob.id).overrides,{});
 assert.equal(await setting('curaNozzle').inputValue(),'0.4');
 await tile.locator('[data-job-remove]').click();
 assert.equal(await tile.count(),0);
 assert(await page.evaluate(id=>window.__sensoryStudio.project.models.some(model=>model.id===id),fixture.tile));
 await page.getByText('Saved locally',{exact:true}).waitFor();
 await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
 await openPrint();await page.locator('#smsExpandPrint').click();
 assert(await crystal.locator('[data-job-3mf]').isDisabled());
 const dualId=await page.evaluate(()=>window.__sensoryStudio.addModel('tactile-tiles',{dualMaterial:true},'Dual material queue test').id);
 await openPrint();await page.locator('#smsExpandPrint').click();
 await page.locator('#smsPrintModels').getByRole('button',{name:'Add Dual material queue test',exact:true}).click();
 const dual=jobs.filter({has:page.getByRole('heading',{name:'Dual material queue test',exact:true})});
 await dual.locator('[data-job-setting=printer]').selectOption('Ultimaker 2+');
 await dual.locator('[data-job-prepare]').click();
 await page.waitForFunction(id=>window.__sensoryStudio.project.printJobs.find(job=>job.modelId===id)?.status==='prepared',dualId,{timeout:120000});
 assert(await dual.locator('[data-job-3mf]').isDisabled());
 assert(await dual.locator('[data-job-export]').isDisabled());
 assert.match(await dual.innerText(),/Choose Ultimaker 3 Extended for two materials/);
 for(const role of ['primary','secondary'])
  await dual.getByText(new RegExp('^Prepared '+role+' STL X × Y × Z: \\d+\\.\\d{2} × \\d+\\.\\d{2} × \\d+\\.\\d{2} mm$')).waitFor();
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 await page.locator('.sms-palette [data-palette-key=width]').press('ArrowRight');
 await openPrint();
 assert.match(await dual.innerText(),/Stale/);
 assert.equal(await dual.getByText(/^Prepared (primary|secondary) STL/).count(),0);
 assert(await dual.locator('[data-job-export]').isDisabled());
 {
  await page.locator('#smsNew').click();
  await page.getByRole('button',{name:/Browse Tactile Texture Tiles starting points/}).click();
  const preset=page.locator('#smsPicker [data-preset=terraces]');
  const quilt=page.locator('#smsPicker [data-preset=quilt]');
  assert.notEqual(await preset.locator('img').getAttribute('src'),await quilt.locator('img').getAttribute('src'));
  await preset.click();
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  const palette=page.locator('.sms-palette');
  const serial=palette.getByRole('group',{name:'Serial LED string'});
  await palette.getByRole('button',{name:'Add pixel automatically',exact:true}).click();
  const position=palette.locator('[data-pixel-field=x]');
  await position.fill('-15');await position.press('Tab');
  await palette.getByRole('button',{name:'Add pixel automatically',exact:true}).click();
  await position.fill('15');await position.press('Tab');
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  await serial.locator('[data-native-route]').click();
  assert(await serial.locator('[data-native-route]').isChecked());
  assert.match(await serial.innerText(),/Channels ready/);
  assert.match(await serial.innerText(),/P1 → P2/);
  await serial.locator('[data-native-pitch]').selectOption('25');
  assert.match(await serial.innerText(),/Cable budget exceeded/);
  await serial.locator('[data-native-pitch]').selectOption('custom');
  const custom=serial.locator('[data-native-custom]');
  await custom.fill('40');await custom.press('Tab');
  await serial.locator('[data-native-preview]').uncheck();
  await serial.locator('[data-native-preview]').check();
  await serial.locator('[data-native-in-tail]').fill('120');await serial.locator('[data-native-in-tail]').press('Tab');
  await serial.locator('[data-native-out-tail]').fill('110');await serial.locator('[data-native-out-tail]').press('Tab');
  await serial.locator('[data-native-pin=in]').click();
  assert.notEqual(await serial.locator('[data-native-edge=in]').inputValue(),'');
  await serial.locator('[data-native-pin=out]').click();
  assert.notEqual(await serial.locator('[data-native-edge=out]').inputValue(),'');
  assert.match(await serial.innerText(),/Channels ready/);
  await serial.scrollIntoViewIfNeeded();
  await shot('wt012-tile-routing');
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  await page.getByRole('button',{name:'Prepare current model',exact:true}).click();
  const routedJob=page.locator('#smsJobs article');
  await routedJob.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const archive=zipEntries((await useDownload(routedJob.locator('[data-job-export]'))).bytes);
  assert.equal(JSON.parse(archive.get('print-job-manifest.json')).routing.channels.length,3);
  await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
  await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  assert.equal(await serial.locator('[data-native-custom]').inputValue(),'40');
  assert.equal(await serial.locator('[data-native-out-tail]').inputValue(),'110');
  assert.notEqual(await serial.locator('[data-native-edge=in]').inputValue(),'');
  assert.notEqual(await serial.locator('[data-native-edge=out]').inputValue(),'');
  await page.locator('#smsNew').click();
  await page.getByRole('button',{name:/Browse Cogs & Gears starting points/}).click();
  const fork=page.locator('#smsPicker [data-preset=forked-sun]');
  const rotor=page.locator('#smsPicker [data-preset=forked-rotor]');
  assert.notEqual(await fork.locator('img').getAttribute('src'),await rotor.locator('img').getAttribute('src'));
  await fork.click();
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  assert(await serial.locator('[data-native-route]').isDisabled());
  assert.match(await serial.innerText(),/solid decorative gear/);
  const automatic=palette.getByRole('button',{name:'Add pixel automatically',exact:true});
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  for(let count=1;count<=4;count++){
   await automatic.click();
   assert.equal((await getHoles()).length,count,'Openwork Gear accepts fitting P'+count);
  }
  const openworkFittings=await getHoles();
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  assert(await serial.locator('[data-native-preview]').isDisabled());
  assert.match(await serial.locator('[data-native-guide-blocked]').innerText(),/openwork/);
  assert(await serial.locator('[data-native-route]').isDisabled());
  await shot('wt020-openwork-gear-four-pixels');
  await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
  await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  assert.deepEqual(await getHoles(),openworkFittings);
  assert.match(await serial.locator('[data-native-guide-blocked]').innerText(),/openwork/);
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  await page.getByRole('button',{name:'Prepare current model',exact:true}).click();
  await routedJob.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const openworkPack=zipEntries((await useDownload(routedJob.locator('[data-job-export]'))).bytes);
  assert([...openworkPack.keys()].some(name=>name.endsWith('.stl')));
  assert(zipEntries((await useDownload(routedJob.locator('[data-job-3mf]'))).bytes).has('3D/3dmodel.model'));
  assert.equal(JSON.parse(openworkPack.get('print-job-manifest.json')).routing?.channels?.length??0,0);
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  for(let count=4;count>=1;count--){
   await palette.getByRole('button',{name:'P'+count,exact:true}).click();
   await palette.getByRole('button',{name:'Remove P'+count,exact:true}).click();
  }
  await page.locator('.sms-workspace-nav [data-tab=design]').click();
  await palette.getByRole('button',{name:'Solid',exact:true}).click();
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  await palette.getByRole('button',{name:'Add pixel automatically',exact:true}).click();
  await position.fill('-15');await position.press('Tab');
  await palette.getByRole('button',{name:'Add pixel automatically',exact:true}).click();
  await position.fill('15');await position.press('Tab');
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  assert(await serial.locator('[data-native-preview]').isChecked(),'Gear route guide defaults on when a path exists');
  assert(!(await serial.locator('[data-native-route]').isChecked()),'Viewing Gear wiring does not enable machining');
  await page.locator('[data-view=bottom]').click();
  await page.waitForTimeout(500);
  const second=(await getHoles())[1];
  assert.equal(second.x,15,'Gear P2 accepts its exact X coordinate before placement');
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  await palette.getByRole('button',{name:'Remove P2',exact:true}).click();
  const underside=await page.evaluate(({x,z})=>window.__sensoryStudio.fittingPointScreen(x,z,'underside'),second);
  assert(underside,'Gear P2 has a solid underside at the intended position');
  await page.mouse.dblclick(underside.x,underside.y);
  await fittingActions.getByRole('button',{name:'Add pixel',exact:true}).click();
  const replaced=(await getHoles())[1];
  assert.equal(replaced.entryFace,'underside');
  assert(Math.hypot(replaced.x-second.x,replaced.z-second.z)<1,
   'Gear placement preserves the clicked underside location: '+JSON.stringify({second,replaced}));
  await shot('wt019-gear-underside');
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  await serial.locator('[data-native-route]').click();
  assert(await serial.locator('[data-native-route]').isChecked());
  assert.match(await serial.innerText(),/Channels ready/);
  await shot('wt012-gear-routing');
  const accepted=await page.evaluate(()=>window.__sensoryStudio.currentModel);
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  await palette.locator('[data-pixel-previous]').click();
  await page.locator('#smsModelError').getByText(/No safe tangent-compatible path/).waitFor();
  assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel),accepted);
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  await routedJob.getByText('Stale',{exact:true}).waitFor();
  assert(await routedJob.locator('[data-job-export]').isDisabled());
  await routedJob.locator('[data-job-prepare]').click();
  await routedJob.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  assert(!(await routedJob.locator('[data-job-export]').isDisabled()));
  assert(!(await routedJob.locator('[data-job-3mf]').isDisabled()));
  await page.locator('#smsNew').click();
  await page.getByRole('button',{name:/Browse Glowing Pebbles & Light Pods starting points/}).click();
  const tall=page.locator('#smsPicker [data-preset=beacon-tall]');
  const low=page.locator('#smsPicker [data-preset=beacon-low]');
  assert.notEqual(await tall.locator('img').getAttribute('src'),await low.locator('img').getAttribute('src'));
  await tall.click();
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  assert(await serial.locator('[data-native-route]').isDisabled());
 }

 // WT-019: use actual model-camera input at a known solid location on
 // each native fixture. Restore the auto seed on an unsupported face.
 const checkNativeDoubleClick=async (type,palette,hole)=>{
  for(const [view,direction] of [['iso',[1,.75,1]],['front',[0,.12,1]],['back',[0,.12,-1]],['bottom',[0,-1,.0001]],['top',[0,1,.0001]]]){
   await page.locator('[data-view='+view+']').click();
   await page.waitForFunction(direction=>{
    const {settled,modelSize,center,target,camera,screen}=window.__crystalForgeViewMetrics();
    const offset=camera.map((value,i)=>value-target[i]);
    const dot=offset.reduce((sum,value,i)=>sum+value*direction[i],0);
    const aligned=dot/(Math.hypot(...offset)*Math.hypot(...direction))>.999;
    return settled&&aligned&&modelSize.every(size=>size>0)&&Math.abs(screen[0])<.02&&Math.abs(screen[1])<.02&&
     Math.hypot(...center.map((value,i)=>value-target[i]))<.1;
   },direction);
  }
  await palette.getByRole('button',{name:'Remove P1',exact:true}).click();
  const screen=await page.evaluate(({x,z})=>window.__sensoryStudio.fittingPointScreen(x,z,'top'),hole);
  assert(screen,type+' projects the solid face at the fitted point');
  await page.mouse.dblclick(screen.x,screen.y);
  await fittingActions.waitFor();
  const add=fittingActions.getByRole('button',{name:'Add pixel',exact:true});
  if(await add.isDisabled()){
   assert.match(await fittingActions.innerText(),/vertical through-bore/,type+' explains unsupported surface');
   await page.keyboard.press('Escape');
   assert.equal((await getHoles()).length,0);
   await palette.getByRole('button',{name:'Add pixel automatically',exact:true}).click();
  }else{
   await add.click();
   const [placed]=await getHoles();
   assert.equal(placed.entryFace,'top',type+' retains the clicked face');
   assert.equal(placed.diameter,hole.diameter,type+' retains the chosen profile');
   assert(Math.hypot(placed.x-hole.x,placed.z-hole.z)<1,type+' follows the raycast point');
  }
  await shot('wt019-native-'+type);
 };
 // WT-017: measured profiles are available before placement and reused on
 // multiple families. The existing A-G dimensional editor remains canonical.
 await page.evaluate(()=>window.__sensoryStudio.addModel('waves',{flowStyle:'Parallel',dualMaterial:false},'Pixel profile source'));
 await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
 const wavePalette=page.locator('.sms-palette');
 await wavePalette.getByRole('button',{name:'Create / edit pixel profile'}).click();
 assert(await page.locator('#pixelProfileOverlay').isVisible());
 await page.locator('#pixelName').fill('Reusable 4.5 mm seed');
 await page.locator('#pixelBodyDiameter').fill('4.5');
 await page.locator('#pixelBodyHeight').fill('9');
 await page.locator('#pixelFlangeDiameter').fill('5');
 await page.locator('#pixelFlangeHeight').fill('0.8');
 await page.locator('#pixelCapHeight').fill('1.5');
 await page.locator('#pixelWireWidth').fill('1.4');
 await page.locator('#pixelWireDepth').fill('1.2');
 const replica=await useDownload(page.locator('#pixelReplicaSTL'));
 assert.match(replica.name,/^pixel-replica-.*-1to1\.stl$/);
 const count=replica.bytes.readUInt32LE(80),bounds=[[Infinity,-Infinity],[Infinity,-Infinity],[Infinity,-Infinity]];
 for(let triangle=0;triangle<count;triangle++)for(let vertex=0;vertex<3;vertex++)for(let axis=0;axis<3;axis++){
  const value=replica.bytes.readFloatLE(96+triangle*50+vertex*12+axis*4);
  bounds[axis][0]=Math.min(bounds[axis][0],value);bounds[axis][1]=Math.max(bounds[axis][1],value);
 }
 assert.equal(replica.bytes.length,84+count*50);
 assert(Math.abs(bounds[2][1]-bounds[2][0]-9)<.01,'B is total length including the curved cap');
 const replica3mf=zipEntries((await useDownload(page.locator('#pixelReplica3MF'))).bytes);
 assert(replica3mf.has('3D/3dmodel.model'));
 await page.locator('#pixelSocketClearance').fill('0.25');
 const socket=await useDownload(page.locator('#pixelSocketSTL'));
 assert.equal(socket.name,'pixel-test-socket.stl');
 const socketCount=socket.bytes.readUInt32LE(80);
 assert.equal(socket.bytes.length,84+socketCount*50);
 let signedVolume=0;
 for(let i=0;i<socketCount;i++){
  const coordinates=Array.from({length:9},(_,axis)=>socket.bytes.readFloatLE(96+i*50+axis*4));
  const [ax,ay,az,bx,by,bz,cx,cy,cz]=coordinates;
  signedVolume+=(ax*(by*cz-bz*cy)+ay*(bz*cx-bx*cz)+az*(bx*cy-by*cx))/6;
 }
 assert(Math.abs(signedVolume)>1000&&Math.abs(signedVolume)<32*32*15,'The exported block retains stock and loses cavity volume');
 assert(zipEntries((await useDownload(page.locator('#pixelSocket3MF'))).bytes).has('3D/3dmodel.model'));
 const routedSpecimen=await useDownload(page.locator('#routeSpecimenSTL'));
 assert.equal(routedSpecimen.name,'two-pixel-route-test.stl');
 assert.equal(routedSpecimen.bytes.length,84+50*routedSpecimen.bytes.readUInt32LE(80));
 assert(zipEntries((await useDownload(page.locator('#routeSpecimen3MF'))).bytes).has('3D/3dmodel.model'));
 await page.locator('#applyPixelSocketFit').click();
 await wavePalette.getByRole('button',{name:/Reusable 4.5 mm seed/}).waitFor();
 await wavePalette.getByRole('button',{name:'Add pixel automatically',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].diameter),4.5);
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].clearance),.25);
 await wavePalette.getByRole('button',{name:'Create / edit pixel profile'}).click();
 assert.equal(Number(await page.locator('#pixelSocketClearance').inputValue()),.25);
 await page.locator('#pixelSocketClearance').fill('0.35');
 const recalibratedReplica=await useDownload(page.locator('#pixelReplicaSTL'));
 assert.deepEqual(recalibratedReplica.bytes,replica.bytes,'Profile clearance never changes the positive replica');
 await page.locator('#applyPixelSocketFit').click();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].clearance),.35);
 await wavePalette.getByRole('button',{name:'Create / edit pixel profile'}).click();
 await page.locator('#resetPixelSocketClearance').click();
 assert.equal(Number(await page.locator('#pixelSocketClearance').inputValue()),.15);
 await page.keyboard.press('Escape');
 const libraryFile=await useDownload(wavePalette.getByRole('button',{name:'Export pixel profiles'}));
 const library=JSON.parse(libraryFile.bytes.toString('utf8'));
 const exportedProfile=library.pixelProfiles.find(profile=>profile.name==='Reusable 4.5 mm seed');
 assert(exportedProfile,'The transferred library includes the current measured profile');
 const libraryInput=wavePalette.getByLabel('Import pixel profiles');
 const existingId=(await getHoles())[0].profileId;
 await libraryInput.setInputFiles({name:'pixel-profile-library.json',mimeType:'application/json',buffer:libraryFile.bytes});
 await page.getByRole('option',{name:'Reusable 4.5 mm seed',exact:true}).first().waitFor({state:'attached'});
 const collision={...library,pixelProfiles:[{...exportedProfile,wireWidth:exportedProfile.wireWidth+.2}]};
 await libraryInput.setInputFiles({name:'pixel-profile-library.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(collision))});
 const selector=wavePalette.locator('[data-active-pixel-profile]');
 const importedProfileOption=selector.locator('option').filter({hasText:'(imported copy)'});
 await importedProfileOption.waitFor({state:'attached'});
 const importedId=await importedProfileOption.getAttribute('value');
 assert.notEqual(importedId,existingId,'A conflicting profile is imported with an independent ID');
 assert.equal((await getHoles())[0].profileId,existingId,'Import leaves the installed fitting linked to its original profile');
 assert.equal((await getHoles())[0].clearance,.35);
 await shot('wt017-pixel-profile-build');
 // CAL-02: independently measure linked and locally captured fits before and after a library edit.
 const linkedModel=await page.evaluate(()=>window.__sensoryStudio.currentModel);
 await page.evaluate(()=>window.__sensoryStudio.addModel('waves',{flowStyle:'Parallel',dualMaterial:false},'Local clearance witness'));
 await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
 await selector.selectOption({label:'Reusable 4.5 mm seed'});
 await wavePalette.getByRole('button',{name:'Add pixel automatically',exact:true}).click();
 await wavePalette.getByRole('button',{name:'P1',exact:true}).click();
 await wavePalette.getByText('Record measured fit',{exact:true}).click();
 const localFit=wavePalette.locator('[data-fit-calibration]');
 await localFit.locator('[name=printedBoreDiameter]').fill('4.85');
 await localFit.getByRole('button',{name:'Save measured fit'}).click();
 const localModel=await page.evaluate(()=>window.__sensoryStudio.currentModel);
 assert.equal(localModel.build.pixelHoles[0].followProfileClearance,false);
 const switchFitModel=async id=>{
  await page.locator('[id="model-tab-'+id+'"]').click();
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
 };
 const checkFitDownloads=async(model,diameter)=>{
  await switchFitModel(model.id);
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  const job=page.locator('#smsJobs article').filter({hasText:model.name});
  if(!await job.count())await page.getByRole('button',{name:'Prepare current model',exact:true}).click();
  else if(await job.getByText('Stale',{exact:true}).count())await job.locator('[data-job-prepare]').click();
  await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const stl=await useDownload(job.locator('[data-job-stl]'));
  const mf=await useDownload(job.locator('[data-job-3mf]'));
  const {x,z}=model.build.pixelHoles[0];
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  for(const geometry of [new STLLoader().parse(Uint8Array.from(stl.bytes).buffer),
   read3MFGeometry(zipEntries(mf.bytes).get('3D/3dmodel.model').toString())]){
   const mesh=new THREE.Mesh(geometry,material);
   const width=[-1,1].reduce((sum,sign)=>sum+new THREE.Raycaster(
    new THREE.Vector3(x,-z,1),new THREE.Vector3(sign,0,0)).intersectObject(mesh)[0].distance,0);
   assert(Math.abs(width-diameter)<.02,model.name+' exported '+width+' mm');
   geometry.dispose();
  }
  material.dispose();
 };
 const saveFitProject=async title=>{
  await page.locator('#smsProjectTitle').fill(title);
  await page.locator('#smsProjectTitle').press('Tab');
  await page.locator('#smsLibrary').click();
  await page.locator('#smsSaveProject').click();
  await page.locator('#smsSavedProjects').getByRole('heading',{name:title,exact:true}).waitFor();
 };
 const openFitProject=async title=>{
  await page.locator('#smsLibrary').click();
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Open project '+title,exact:true}).first().click();
  assert.equal(await page.locator('#smsProjectTitle').inputValue(),title);
 };
 await checkFitDownloads(linkedModel,4.85);
 await checkFitDownloads(localModel,4.85);
 await saveFitProject('Original shared calibration snapshot');
 await switchFitModel(linkedModel.id);
 await selector.selectOption({label:'Reusable 4.5 mm seed'});
 await wavePalette.getByRole('button',{name:'Create / edit pixel profile'}).click();
 await page.locator('#pixelSocketClearance').fill('.6');
 await page.locator('#applyPixelSocketFit').click();
 const savedFitModels=()=>page.evaluate(()=>window.__sensoryStudio.project.models);
 const fits=await savedFitModels();
 assert.equal(fits.find(model=>model.id===linkedModel.id).build.pixelHoles[0].clearance,.6);
 assert.deepEqual(fits.find(model=>model.id===localModel.id).build,localModel.build);
 await page.locator('.sms-workspace-nav [data-tab=print]').click();
 const staleFitJob=page.locator('#smsJobs article').filter({hasText:linkedModel.name});
 await staleFitJob.getByText('Stale',{exact:true}).waitFor();
 assert(await staleFitJob.locator('[data-job-stl]').isDisabled());
 assert(await staleFitJob.locator('[data-job-3mf]').isDisabled());
 await checkFitDownloads(linkedModel,5.1);
 await checkFitDownloads(localModel,4.85);
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.reload();
 await page.waitForFunction(()=>window.__sensoryStudio);
 const reloadedFits=await savedFitModels();
 assert.equal(reloadedFits.find(model=>model.id===linkedModel.id).build.pixelHoles[0].clearance,.6);
 assert.deepEqual(reloadedFits.find(model=>model.id===localModel.id).build,localModel.build);
 await saveFitProject('Revised shared calibration snapshot');
 await switchFitModel(linkedModel.id);
 await wavePalette.getByRole('button',{name:'P1',exact:true}).click();
 const unsavedClearance=wavePalette.getByLabel('Diameter clearance (mm)');
 await unsavedClearance.fill('.55');await unsavedClearance.press('Tab');
 assert.equal((await getHoles())[0].clearance,.55);
 assert(await page.locator('#smsGlobalUndo').isEnabled());
 await openFitProject('Original shared calibration snapshot');
 await switchFitModel(linkedModel.id);
 assert(await page.locator('#smsGlobalUndo').isDisabled(),'A reopened snapshot has no undo history from a different revision');
 await checkFitDownloads(linkedModel,4.85);
 await checkFitDownloads(localModel,4.85);
 await openFitProject('Revised shared calibration snapshot');
 await checkFitDownloads(linkedModel,5.1);
 await checkFitDownloads(localModel,4.85);
 await switchFitModel(linkedModel.id);
 await wavePalette.getByRole('button',{name:'P1',exact:true}).click();
 await checkNativeDoubleClick('waves',wavePalette,(await getHoles())[0]);
 const nativeFamilies=[
  ['tactile-tiles',{dualMaterial:false},false],
  ['gears',{mode:'Decorative',wheelStyle:'Rounded lobes',webStyle:'Solid',bore:0,spokes:0,dualMaterial:false},false],
  ['control-caps',{shaft:0,controlStyle:'Pushbutton',dualMaterial:false},false],
  ['characters',{character:'Cloud',construction:'Classic',dualMaterial:false},false],
  ['light-pods',{illuminated:false,dualMaterial:false},true]
 ];
 for(const [type,parameters,backing] of nativeFamilies){
  await page.evaluate(({type,parameters})=>window.__sensoryStudio.addModel(type,parameters,'WT017 '+type),{type,parameters});
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  const pal=page.locator('.sms-palette');
  assert(await pal.getByRole('button',{name:'Add pixel automatically',exact:true}).isVisible(),type+' has Add pixel');
  assert(await pal.getByRole('button',{name:'Create / edit pixel profile'}).isVisible());
  const activeProfile=pal.getByLabel('Active Pixel Profile');
  await activeProfile.selectOption({label:'Reusable 4.5 mm seed'});
  const activeProfileId=await activeProfile.inputValue();
  if(type==='tactile-tiles'){
   await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
   await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
   await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
   assert.equal(await activeProfile.inputValue(),activeProfileId);
  }
  if(backing){
   await page.locator('.sms-workspace-nav [data-tab=build]').click();
   await pal.locator('[data-pixel-backing]').check();
   await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  }
  await pal.getByRole('button',{name:'Add pixel automatically',exact:true}).click();
  const saved=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles);
  assert.equal(saved.length,1,type+' accepted a measured fitting');
  assert.equal(saved[0].diameter,4.5,type+' reused named profile');
  await checkNativeDoubleClick(type,pal,saved[0]);
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  assert(await pal.locator('[data-native-route]').count(),type+' shows routing availability');
 }
 // WT-020: true double-click mount placement, edit and persisted source.
 await page.evaluate(()=>window.__sensoryStudio.addModel('tactile-tiles',{pattern:'grass',dualMaterial:false},'WT020 native mounting'));
 await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
 const mountPalette=page.locator('.sms-palette');
 assert(await mountPalette.getByRole('button',{name:'Place mounting hole in 3D'}).isVisible());
 await page.locator('[data-view=top]').click();await page.waitForTimeout(400);
 const mountPoint=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(10,8,'top'));
 assert(mountPoint,'Tile should provide a visible mountable solid surface');
 await page.mouse.dblclick(mountPoint.x,mountPoint.y);
 const addMount=fittingActions.getByRole('button',{name:'Add mounting feature',exact:true});
 await addMount.waitFor();
 assert(!(await addMount.isDisabled()),'Selected tile solid surface must support mounting');
 await addMount.click();
 const mounted=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles);
 assert.equal(mounted.length,1,'Context click commits exactly one M1');
 assert.equal(mounted[0].diameter,3.4);
 assert.equal(mounted[0].entryFace,'top');
 const mountX=mountPalette.locator('[data-mount-field=x]');
 assert(await mountPalette.getByRole('button',{name:'M1',exact:true}).isVisible());
 await mountX.fill(String(mounted[0].x+1));await mountX.press('Tab');
 const changed=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles);
 assert.equal(changed[0].x,mounted[0].x+1,'M1 supports precise position editing');
 const dragPoints=await page.evaluate(({x,z})=>{
  const studio=window.__sensoryStudio;
  return [studio.fittingPointScreen(x,z,'top'),studio.fittingPointScreen(x+4,z,'top')];
 },changed[0]);
 assert(dragPoints.every(Boolean),'Both drag positions lie on the Tile’s top surface');
 await page.mouse.move(dragPoints[0].x,dragPoints[0].y);
 await page.mouse.down();
 await page.waitForTimeout(225);
 await page.mouse.move(dragPoints[1].x,dragPoints[1].y,{steps:6});
 await page.mouse.up();
 const dragged=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles[0]);
 assert(dragged.x>changed[0].x+2,'Hold drag moves M1 along the solid face');
 assert.equal(dragged.entryFace,'top');
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 await mountPalette.locator('[data-pixel-backing]').check();
 const backingThickness=mountPalette.getByLabel('Fitting backing thickness (mm)');
 assert.equal(await backingThickness.inputValue(),'4');
 await backingThickness.fill('11');await backingThickness.press('Tab');
 assert.equal(await backingThickness.inputValue(),'4','Rejects backing beyond the printable setting range');
 await backingThickness.fill('8');await backingThickness.press('Tab');
 assert.equal(await backingThickness.inputValue(),'8');
 await mountPalette.getByRole('button',{name:'Reset backing thickness'}).click();
 assert.equal(await backingThickness.inputValue(),'4');
 await backingThickness.fill('8');await backingThickness.press('Tab');
 await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
 const addTab=mountPalette.getByRole('button',{name:'Add external tab',exact:true});
 await addTab.click();await addTab.click();
 const tabPosition=mountPalette.locator('[data-backing-tab="0"]');
 await tabPosition.fill('13');await tabPosition.press('Tab');
 const savedTabs=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.backingTabs);
 assert.equal(savedTabs.length,2);
 assert.equal(savedTabs[0].u,.13);
 await shot('wt021-native-backing-tabs');
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
 assert.equal((await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles))[0].x,dragged.x,
  'Native mounting state must survive workspace reload');
 await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
 assert(await page.locator('.sms-palette').getByRole('button',{name:'M1',exact:true}).isVisible());
 assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.backingTabs),savedTabs);
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 assert.equal(await backingThickness.inputValue(),'8','Fitting backing thickness survives save and reload');
 const dimensions=page.locator('#smsModelDimensions');
 await dimensions.filter({hasText:'Design preview'}).waitFor();
 await page.getByRole('button',{name:'Render actual model',exact:true}).click();
 const tabInspection=page.locator('#smsLightInspector');
 await tabInspection.getByText('Prepared manufacturing mesh').waitFor({timeout:120000});
 assert.equal(await tabInspection.getByLabel('Cut section').isChecked(),false);
 await dimensions.filter({hasText:'Prepared'}).waitFor();
 const displayedDimensions=(await dimensions.textContent()).match(/\d+\.\d+/g).map(Number);
 assert.equal(displayedDimensions.length,3);
 await tabInspection.getByRole('button',{name:'Close inspection'}).click();
 await page.locator('.sms-workspace-nav [data-tab=print]').click();
 const tabJob=page.locator('#smsJobs article');
 await tabJob.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
 const tabSTL=await useDownload(tabJob.locator('[data-job-stl]'));
 assert.match(tabSTL.name,/\.stl$/);
 const facetCount=tabSTL.bytes.readUInt32LE(80);
 assert(facetCount>0);
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let facet=0;facet<facetCount;facet++)for(let vertex=0;vertex<3;vertex++)for(let axis=0;axis<3;axis++){
  const value=tabSTL.bytes.readFloatLE(84+facet*50+12+vertex*12+axis*4);
  min[axis]=Math.min(min[axis],value);max[axis]=Math.max(max[axis],value);
 }
 assert.deepEqual(displayedDimensions,max.map((value,i)=>Number((value-min[i]).toFixed(1))));
 const tileHalfWidth=await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.width/2);
 const backingTop=(x,z)=>Math.abs(x)>tileHalfWidth+5&&Math.abs(z-8)<.001;
 let stlBackingTop=false;
 for(let facet=0;facet<facetCount;facet++)for(let vertex=0;vertex<3;vertex++){
  const offset=96+facet*50+vertex*12;
  if(backingTop(tabSTL.bytes.readFloatLE(offset),tabSTL.bytes.readFloatLE(offset+8)))stlBackingTop=true;
 }
 assert(stlBackingTop,'STL contains the edited 8 mm backing top outside the Tile footprint');
 const modelXml=zipEntries((await useDownload(tabJob.locator('[data-job-3mf]'))).bytes).get('3D/3dmodel.model');
 assert(modelXml);
 assert([...modelXml.toString().matchAll(/<vertex x="([^"]+)" y="[^"]+" z="([^"]+)"\/>/g)]
  .some(([,x,z])=>backingTop(Number(x),Number(z))),
  '3MF contains the same edited 8 mm backing top outside the Tile footprint');


 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
 assert.equal((await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles))[0].x,dragged.x,
  'Native mounting state must survive workspace reload');
 await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
 assert(await page.locator('.sms-palette').getByRole('button',{name:'M1',exact:true}).isVisible());

 await page.evaluate(()=>window.__sensoryStudio.addModel('crystals',null,'WT017 Crystals'));
 await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
 assert(await page.locator('.sms-palette').getByRole('button',{name:'Add pixel',exact:true}).isVisible());
 assert(await page.locator('.sms-palette').getByRole('button',{name:'Create / edit pixel profile'}).isVisible());
 await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
 const crystalPitch=page.locator('.sms-palette [data-build-wire-pitch]');
 assert(await crystalPitch.isVisible(),'Crystal cable pitch is accessible in Wiring');
 await crystalPitch.selectOption('25');
 assert.equal(await page.locator('[data-state="pixelStringSpacing"]').inputValue(),'25');
 await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
 await page.locator('.sms-palette').getByRole('button',{name:'Add pixel',exact:true}).click();
 assert.equal(await page.locator('#viewport canvas').getAttribute('data-hardware-placement'),'pixel');
 await page.keyboard.press('Escape');
 await shot('wt017-seven-families-build');
 await page.setViewportSize({width:390,height:844});
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 assert(await page.locator('#smsModelRail #smsNew').isVisible());
 assert(await page.locator('#smsTools header button').isVisible());
 assert(await page.locator('#smsPrecision header button').isVisible());
 const bottomTabs=page.locator('#smsModelRail #smsTabs');
 assert(await bottomTabs.evaluate(node=>node.scrollWidth>node.clientWidth));
 const last=bottomTabs.getByRole('tab').last(),lastId=await last.getAttribute('id');
 await last.press('Alt+ArrowLeft');
 assert.equal(await bottomTabs.getByRole('tab').nth(-2).getAttribute('id'),lastId);
 await bottomTabs.locator('#'+lastId).press('Alt+ArrowRight');
 await bottomTabs.evaluate(node=>{node.scrollLeft=node.scrollWidth;});
 assert(await bottomTabs.evaluate(node=>node.scrollLeft>0));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
 await shot('wt014-narrow');
 for(const width of [1440,1280,768,390]){
  await page.setViewportSize({width,height:900});
  for(const capture of ['current','alternate']){
   if(capture==='alternate')await page.locator('#themeBtn').click();
   for(const [name,selector] of [
    ['design','.sms-workspace-nav [data-tab=design]'],
    ['build','.sms-workspace-nav [data-tab=build]'],
    ['library','#smsLibrary'],
    ['print','.sms-workspace-nav [data-tab=print]']
   ]){
    await page.locator(selector).click();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' at '+width+' must not overflow');
    assert(await page.locator('#themeBtn').isVisible(),name+' keeps global actions visible');
    if(capture==='alternate'&&(width===390||width===1440))await shot('rc-'+name+'-'+width);
   }
   if(capture==='alternate')await page.locator('#themeBtn').click();
  }
 }
 const otherTab=await page.evaluate(key=>{
  const before=localStorage.getItem(key),saved=JSON.parse(before);
  saved.project.title='Newer saved workspace from another tab';
  const newer=JSON.stringify(saved);localStorage.setItem(key,newer);
  return {before,newer};
 },WORKSPACE_KEY);
 await nameProject('Unsaved edits in this tab');
 await page.locator('#smsSaveState').filter({hasText:'Save failed'}).waitFor();
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY),otherTab.newer);
 await page.evaluate(({key,before})=>localStorage.setItem(key,before),{key:WORKSPACE_KEY,before:otherTab.before});
 await page.setViewportSize({width:1440,height:1000});
 await page.locator('#smsNew').click();
 await page.getByRole('button',{name:'Import SVG',exact:true}).click();
 const importer=page.getByRole('dialog',{name:'Import SVG artwork'});
 const beforeImport=await page.evaluate(()=>window.__sensoryStudio.project.models.length);
 await importer.locator('input[type=file]').setInputFiles({
  name:'bad.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg><path')
 });
 await importer.getByRole('status').filter({hasNotText:'Reading local artwork'}).waitFor();
 assert(await importer.getByRole('button',{name:'Create artwork model'}).isDisabled());
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.project.models.length),beforeImport);
 await importer.locator('input[type=file]').setInputFiles('tests/fixtures/svg-import/clockwork.svg');
 await importer.getByRole('img',{name:'Filled artwork preview'}).waitFor();
 await importer.getByLabel('Width (mm)').fill('72');
 await importer.getByLabel('Extrusion depth (mm)').fill('6');
 await shot('studio-svg-import');
 await importer.getByRole('button',{name:'Create artwork model'}).click();
 await importer.waitFor({state:'hidden'});
 const svgModel=await page.evaluate(()=>window.__sensoryStudio.currentModel);
 assert.equal(svgModel.generator.typeId,'svg-artwork');
 assert.equal(svgModel.parameters.artwork.dimensions.widthMm,72);
 assert.equal(svgModel.parameters.artwork.loops.filter(loop=>loop.kind==='hole').length,5);
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
 assert.equal(await page.evaluate(id=>window.__sensoryStudio.project.models.find(model=>model.id===id)?.parameters.artwork.dimensions.depthMm,svgModel.id),6);
 await page.locator('#smsNew').click();
 await page.getByRole('button',{name:'Import 3D model',exact:true}).click();
 const meshDialog=page.getByRole('dialog',{name:'Import 3D model'});
 const meshInput=meshDialog.locator('input[type=file]');
 const rawMesh="v 0 0 0\nv 40 0 0\nv 0 40 0\nv 0 0 24\nf 1 3 2\nf 1 2 4\nf 2 3 4\nf 3 1 4\n";
 const meshFile={name:'tetrahedron.obj',mimeType:'text/plain',buffer:Buffer.from(rawMesh)};
 await meshInput.setInputFiles(meshFile);
 await meshDialog.getByText('Confirm the units used by this mesh.').waitFor();
 await meshDialog.getByLabel('Source units').selectOption('mm');
 await meshDialog.getByRole('img',{name:'Top view of mesh on the print bed'}).waitFor();
 await meshDialog.getByLabel('Scale',{exact:true}).fill('1.2');
 await meshDialog.getByLabel('Bed X (mm)').fill('4');
 await shot('studio-mesh-import');
 const beforeMesh=await page.evaluate(()=>window.__sensoryStudio.project.models.length);
 await meshDialog.getByRole('button',{name:'Cancel',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.project.models.length),beforeMesh);
 await page.locator('#smsNew').click();
 await page.getByRole('button',{name:'Import 3D model',exact:true}).click();
 await meshInput.setInputFiles(meshFile);
 await meshDialog.getByText('Confirm the units used by this mesh.').waitFor();
 await meshDialog.getByLabel('Source units').selectOption('mm');
 await meshDialog.getByLabel('Scale',{exact:true}).fill('1.2');
 await meshDialog.getByLabel('Bed X (mm)').fill('4');
 await meshDialog.getByRole('button',{name:'Add model',exact:true}).click();
 const imported=await page.evaluate(()=>window.__sensoryStudio.currentModel);
 assert.equal(imported.generator.typeId,'imported-mesh');
 assert.equal(imported.parameters.scale,1.2);
 assert.equal(imported.parameters.x,4);
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
 assert.equal(await page.evaluate(id=>window.__sensoryStudio.project.models.find(model=>model.id===id)?.parameters.x,imported.id),4);
 // Direct placement validates with the same worker as Print Centre before saving.
 for(const thickness of [25,3]){
  await page.evaluate(thickness=>window.__sensoryStudio.addModel('gears',{
   diameter:120,bore:0,thickness,wheelStyle:'Cam',webStyle:'Solid',dualMaterial:false
  },'Direct socket '+thickness),thickness);
  if(thickness===25){
   await page.locator('.sms-workspace-nav [data-tab=design]').click();
   await page.locator('.sms-palette [data-palette-key=diameter]').press('ArrowLeft');
   assert(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.diameter)<120);
  }
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  await page.locator('[data-view=top]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  await page.locator('[data-fit-profile="gumdrop"]').click();
  await page.getByRole('button',{name:'Place shaped socket in 3D'}).click();
  const target=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(0,0,'top'));
  assert(target);
  await page.mouse.click(target.x,target.y);
  if(thickness===25){
   await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===1);
   const [socket]=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles);
   assert(socket.socketProfile.bodyHeight>0);
   assert(socket.surface.normal[1]>.999);
   assert.equal(socket.entryFace,'top');
   // FIT-02: enabling a diagnostic overlay must never change saved model data.
   const gearStateBefore=await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
   const nativeToggle=page.getByRole('checkbox',{name:'Show physical pixels and socket cutters'});
   await nativeToggle.check();
   const nativePreview=page.locator('[data-native-fit-preview-status]');
   await page.waitForFunction(()=>/insertion|unavailable/.test(
    document.querySelector('[data-native-fit-preview-status]')?.textContent||''),null,{timeout:60000});
   assert.match(await nativePreview.innerText(),/insertion 22\.00 mm/,
    'Gear preview: '+await nativePreview.innerText());
   assert.match(await nativePreview.innerText(),/nominal cutter roof allowance .*mm/);
   assert.match(await nativePreview.innerText(),/stock interference; 0\.00 mm³ overlap with wire cuts/);
   await nativeToggle.uncheck();
   assert.equal(await nativePreview.innerText(),'');
   assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),gearStateBefore,
    'Toggling Gear physical overlays must not mutate fittings, dimensions or saved model revision');
   await page.keyboard.press('Escape');
   await page.getByRole('button',{name:'Place shaped socket in 3D'}).click();
   const conflict=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(4,0,'top'));
   assert(conflict);
   await page.mouse.click(conflict.x,conflict.y);
   await page.locator('[data-pixel-status]').filter({hasText:/lacks clearance from another cut/}).waitFor();
   assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),gearStateBefore,
    'Rejected adjacent shaped socket must preserve the original fitting and model revision');
   await page.reload();
   await page.waitForFunction(()=>window.__sensoryStudio?.currentModel?.build.pixelHoles?.length===1);
   assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles),[socket],
    'The original fitting and installation normal must survive reload after a rejected placement');
   await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
   await page.locator('[data-view=top]').click();
   await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
   await page.getByRole('button',{name:'Place shaped socket in 3D'}).click();
   const safePoint=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(33,0,'top'));
   assert(safePoint);
   await page.mouse.click(safePoint.x,safePoint.y);
   await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===2);
   await page.keyboard.press('Escape');
   const originalSecond=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles[1]);
   const acceptedDrag=await page.evaluate(id=>[
    window.__sensoryStudio.pixelMarkerScreen(id),window.__sensoryStudio.fittingPointScreen(37,0,'top')
   ],originalSecond.id);
   assert(acceptedDrag.every(Boolean));
   await page.mouse.move(acceptedDrag[0].x,acceptedDrag[0].y);
   await page.mouse.down();
   await page.waitForTimeout(225);
   await page.mouse.move(acceptedDrag[1].x,acceptedDrag[1].y,{steps:6});
   await page.mouse.up();
   await page.waitForFunction(x=>window.__sensoryStudio.currentModel.build.pixelHoles[1].x>x+2,originalSecond.x);
   const prior=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles);
   const second=prior[1];
   const [start,end]=await page.evaluate(id=>[
    window.__sensoryStudio.pixelMarkerScreen(id),
    window.__sensoryStudio.fittingPointScreen(5,0,'top')
   ],second.id);
   assert(start&&end);
   await page.mouse.click(start.x,start.y);
   await page.mouse.move(start.x,start.y);
   await page.mouse.down();
   await page.waitForTimeout(225);
   await page.mouse.move(end.x,end.y,{steps:6});
   await page.mouse.up();
   await page.locator('[data-pixel-status]').filter({hasText:/lacks clearance from another cut/}).waitFor();
   assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles),prior);
   await page.reload();
   await page.waitForFunction(()=>window.__sensoryStudio?.currentModel?.build.pixelHoles?.length===2);
   assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles),prior,
    'Rejected drag preserves both fitted poses, orientations and installation normals after reload');
   await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
   const gearPalette=page.locator('.sms-palette');
   for(const number of [1,2]){
    await gearPalette.getByRole('button',{name:'P'+number,exact:true}).click();
    const angle=gearPalette.locator('[data-pixel-field=rotation]');
    await angle.fill('180');
    await angle.press('Tab');
   }
   await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
   const gearSerial=gearPalette.getByRole('group',{name:'Serial LED string'});
   const cutSerial=gearSerial.locator('[data-native-route]');
   assert(!(await cutSerial.isDisabled()),await gearSerial.innerText());
   await cutSerial.check();
   await gearSerial.getByText('Channels ready for preparation.').waitFor();
   await page.locator('[data-view=top]').click();
   await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
   await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
   await gearPalette.getByRole('button',{name:'Place mounting hole in 3D'}).click();
   const mountPoint=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(16,15,'top'));
   assert(mountPoint);
   await page.mouse.click(mountPoint.x,mountPoint.y);
   await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.manualMountHoles?.length===1);
   await page.keyboard.press('Escape');
   const beforeConflict=await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
   await gearPalette.getByRole('button',{name:'M1',exact:true}).click();
   const mountZ=gearPalette.locator('[data-mount-field=z]');
   await mountZ.fill('0');
   await mountZ.press('Tab');
   await gearPalette.locator('[data-pixel-status]').filter({hasText:/too close to Mount hole 1/}).waitFor();
   assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),beforeConflict,
    'Rejecting a mount that meets the channel preserves the route, mount and revision');
   await gearPalette.getByRole('button',{name:'Place mounting hole in 3D'}).click();
   const otherMountPoint=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(16,-15,'top'));
   assert(otherMountPoint);
   await page.mouse.click(otherMountPoint.x,otherMountPoint.y);
   await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.manualMountHoles?.length===2);
   await page.keyboard.press('Escape');
   await gearPalette.getByRole('button',{name:'M2',exact:true}).click();
   const secondMountZ=gearPalette.locator('[data-mount-field=z]');
   await secondMountZ.fill('-16');
   await secondMountZ.press('Tab');
   assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles[1].z),-16);
   await page.locator('.sms-workspace-nav [data-tab=build]').click();
   await gearPalette.locator('[data-pixel-backing]').check();
   await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
   const addExternalTab=gearPalette.getByRole('button',{name:'Add external tab',exact:true});
   await addExternalTab.click();
   await addExternalTab.click();
   for(const [index,position] of [13,63].entries()){
    const perimeter=gearPalette.locator('[data-backing-tab="'+index+'"]');
    await perimeter.fill(String(position));
    await perimeter.press('Tab');
   }
   assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.backingTabs),[{u:.13},{u:.63}]);
   await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
   await gearSerial.getByText('Channels ready for preparation.').waitFor();
   await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
   await gearPalette.getByRole('button',{name:'P1',exact:true}).click();
   await gearPalette.getByText('Record measured fit',{exact:true}).click();
   const calibration=gearPalette.locator('[data-fit-calibration]');
   await calibration.locator('[name=printedBoreDiameter]').fill('12.5');
   await calibration.getByRole('button',{name:'Save measured fit'}).click();
   await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].clearance===.5);
   const retention=gearPalette.getByLabel('Retention lip (mm)');
   await retention.fill('.2');await retention.press('Tab');
   await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].socketProfile.retentionLip===.2);
   await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
   const bendRadius=gearPalette.getByLabel('Minimum bend radius (mm)');
   await bendRadius.fill('5.5');await bendRadius.press('Tab');
   await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.serialRouting.minBendRadius===5.5);
   const wireWidth=gearPalette.getByLabel('Requested wire-track width (mm)');
   await wireWidth.fill('6');await wireWidth.press('Tab');
   const calibratedBuild=await page.evaluate(()=>window.__sensoryStudio.currentModel.build);
   assert.equal(calibratedBuild.serialRouting.channelWidthMm,6);
   assert.equal(calibratedBuild.serialRouting.minBendRadius,5.5);
   assert.equal(calibratedBuild.pixelHoles[0].clearance,.5);
   await page.locator('#smsProjectTitle').fill('WT-021 Gear manufacturing journey');
   await page.locator('#smsProjectTitle').press('Tab');
   await page.locator('#smsLibrary').click();
   await page.locator('#smsSaveProject').click();
   await page.locator('#smsSavedProjects').getByRole('heading',{name:'WT-021 Gear manufacturing journey',exact:true}).waitFor();
   const gearBackup=JSON.parse((await useDownload(page.locator('#smsBackup'))).bytes.toString());
   assert.deepEqual(gearBackup.project.models.find(model=>model.name==='Direct socket 25').build,calibratedBuild);
   await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
   await page.reload();
   await page.waitForFunction(()=>window.__sensoryStudio?.currentModel?.build.serialRouting?.enabled);
   assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build),calibratedBuild);
   await page.locator('.sms-workspace-nav [data-tab=build]').click();
   await page.getByRole('button',{name:'Render actual model',exact:true}).click();
   const gearInspection=page.locator('#smsLightInspector');
   await gearInspection.getByText('Prepared manufacturing mesh').waitFor({timeout:120000});
   await gearInspection.getByLabel('Cut section').check();
   await gearInspection.getByRole('button',{name:'Close inspection'}).click();
   await page.locator('.sms-workspace-nav [data-tab=print]').click();
   const gearJob=page.locator('#smsJobs article').filter({hasText:'Direct socket 25'});
   await gearJob.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
   const gearPack=zipEntries((await useDownload(gearJob.locator('[data-job-export]'))).bytes);
   assert([...gearPack.keys()].some(name=>name.endsWith('.stl')));
   assert.equal(JSON.parse(gearPack.get('print-job-manifest.json')).routing.channels.length,3);
   const gear3mf=zipEntries((await useDownload(gearJob.locator('[data-job-3mf]'))).bytes);
   assert(gear3mf.has('3D/3dmodel.model'));
   const gearSTL=[...gearPack.entries()].find(([name])=>name.endsWith('.stl'))[1];
   const standaloneSTL=await useDownload(gearJob.locator('[data-job-stl]'));
   assert.deepEqual(standaloneSTL.bytes,gearSTL);
   const standaloneCura=await useDownload(gearJob.locator('[data-job-cura]'));
   assert(standaloneCura.name.endsWith('.curaprofile'));
   assert.deepEqual(standaloneCura.bytes,[...gearPack.entries()].find(([name])=>name.endsWith('.curaprofile'))[1]);
   const [fitting]=calibratedBuild.pixelHoles;
   const mounts=calibratedBuild.manualMountHoles;
   const gearDiameter=gearBackup.project.models.find(model=>model.name==='Direct socket 25').parameters.diameter;
   const halfBacking=(gearDiameter+24)/2;
   const stlGeometry=new STLLoader().parse(Uint8Array.from(gearSTL).buffer);
   const threeMFGeometry=read3MFGeometry(gear3mf.get('3D/3dmodel.model').toString());
   for(const [format,geometry] of [['STL',stlGeometry],['3MF',threeMFGeometry]]){
    const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
    const mesh=new THREE.Mesh(geometry,material);
    const hit=(origin,direction)=>new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction)).intersectObject(mesh)[0]?.point;
    const centre=[fitting.x,-fitting.z,fitting.surface.y-5];
    const left=hit(centre,[-1,0,0]),right=hit(centre,[1,0,0]);
    assert(left&&right&&Math.abs(left.distanceTo(right)-12.5)<.02,format+' calibrated bore exported from Print Centre');
    const other=calibratedBuild.pixelHoles[1];
    const groove=[(fitting.x+other.x)/2,-(fitting.z+other.z)/2,fitting.surface.y-1];
    const grooveA=hit(groove,[0,-1,0]),grooveB=hit(groove,[0,1,0]);
    assert(grooveA&&grooveB&&Math.abs(grooveA.distanceTo(grooveB)-6)<.04,format+' actual routed wire width is independent of fit calibration');
    for(const mount of mounts){
     assert.equal(hit([mount.x,-mount.z,-1],[0,0,1]),undefined,format+' routed project retains the mounting through-hole');
    }
    for(const sign of [-1,1]){
     const tabHoleX=sign*.04*halfBacking,tabHoleY=sign*(halfBacking+5.05);
     assert.equal(hit([tabHoleX,tabHoleY,-1],[0,0,1]),undefined,format+' external tab has a through-hole');
     const tabTop=hit([tabHoleX+2.5,tabHoleY,10],[0,0,-1]);
     assert(tabTop&&Math.abs(tabTop.z-4)<.01,format+' fixing walls are joined to the printed backing at 4 mm thickness');
    }
    material.dispose();geometry.dispose();
   }
  }else{
   await page.locator('[data-pixel-status]').filter({hasText:/continuous stock/}).waitFor();
   assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length??0),0);
  }
  await page.keyboard.press('Escape');
 }
 // FIT-01: place and drag a shaped fitting on a real vertical Tile face.
 {
  await page.evaluate(()=>window.__sensoryStudio.addModel('tactile-tiles',{
   width:100,depth:80,thickness:20,outline:'square',relief:2,pattern:'terraces',dualMaterial:false
  },'FIT-01 Tile side'));
  await page.locator('.sms-workspace-nav [data-tab=design]').click();
  await page.locator('.sms-palette [data-palette-key=width]').press('ArrowRight');
  assert(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.width)>100);
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  await page.locator('[data-view=front]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  await page.locator('[data-fit-profile=seed]').click();
  await page.getByRole('button',{name:'Place shaped socket in 3D'}).click();
  const canvas=await page.locator('#viewport canvas').boundingBox();
  await page.mouse.click(canvas.x+canvas.width/2,canvas.y+canvas.height/2+28);
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===1);
  await page.keyboard.press('Escape');
  const getSeat=()=>page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0]);
  const seat=await getSeat();
  assert.deepEqual(seat.surface.normal,[0,0,1]);
  const marker=await page.evaluate(id=>window.__sensoryStudio.pixelMarkerScreen(id),seat.id);
  assert(marker);
  await page.mouse.move(marker.x,marker.y);
  await page.mouse.down();
  await page.waitForTimeout(225);
  await page.mouse.move(marker.x+25,marker.y,{steps:6});
  assert.deepEqual(await getSeat(),seat,'A side drag previews without changing the saved seat');
  await page.mouse.up();
  await page.waitForFunction(x=>window.__sensoryStudio.currentModel.build.pixelHoles[0].x>x+1,seat.x);
  const moved=await getSeat();
  assert.equal(moved.id,seat.id);
  assert(Math.abs(moved.z-seat.z)<1e-6);
  assert.deepEqual(moved.surface.normal,seat.surface.normal);
  const sidePosition=page.locator('.sms-palette');
  const positionX=sidePosition.getByLabel('X (mm)',{exact:true}),positionZ=sidePosition.getByLabel('Z (mm)',{exact:true});
  const exactX=Math.round((moved.x+1)*100)/100;
  await positionX.fill(String(exactX));await positionX.press('Tab');
  await page.waitForFunction(x=>window.__sensoryStudio.currentModel.build.pixelHoles[0].x===x,exactX);
  const exactSide=await getSeat();
  assert.deepEqual(exactSide.surface,moved.surface);
  await positionZ.fill(String(moved.z+1));await positionZ.press('Tab');
  await page.locator('#smsModelError').getByText(/Move along the current installation face/).waitFor();
  assert.deepEqual(await getSeat(),exactSide);
  assert.equal(Number(await positionZ.inputValue()),moved.z);
  await page.locator('#smsGlobalUndo').click();
  assert.deepEqual(await getSeat(),moved);
  await page.locator('#smsGlobalRedo').click();
  assert.deepEqual(await getSeat(),exactSide,'Redo restores the exact position and normal on the vertical face');
  await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
  await page.reload();
  await page.waitForFunction(()=>window.__sensoryStudio?.currentModel?.build.pixelHoles?.length===1);
  assert.deepEqual(await getSeat(),exactSide);
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  await page.locator('[data-view=front]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  await page.getByRole('button',{name:'Place shaped socket in 3D'}).click();
  const sideMarker=await page.evaluate(id=>window.__sensoryStudio.pixelMarkerScreen(id),exactSide.id);
  await page.mouse.click(sideMarker.x+125,sideMarker.y);
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===2);
  await page.keyboard.press('Escape');
  const sideSerial=page.locator('.sms-palette').getByRole('group',{name:'Serial LED string'});
  await assertNativeFittingPreview('Tile vertical face',2);
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  const enable=sideSerial.locator('[data-native-route]');
  assert(!(await enable.isDisabled()),await sideSerial.innerText());
  await enable.check();
  await sideSerial.getByText('Channels ready for preparation.').waitFor();
  const sidePalette=page.locator('.sms-palette');
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  await sidePalette.locator('[data-pixel-backing]').check();
  await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
  const addTab=sidePalette.getByRole('button',{name:'Add external tab',exact:true});
  await addTab.click();
  await addTab.click();
  for(const [index,position] of [12,75].entries()){
   const perimeter=sidePalette.locator('[data-backing-tab="'+index+'"]');
   await perimeter.fill(String(position));
   await perimeter.press('Tab');
  }
  assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.backingTabs),[{u:.12},{u:.75}]);
  const beforeBacking=await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  const thickness=sidePalette.getByLabel('Fitting backing thickness (mm)');
  await thickness.fill('10');
  await thickness.press('Tab');
  await sidePalette.locator('[data-pixel-status]').filter({hasText:/above the fitting backing/}).waitFor();
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),beforeBacking);
  await page.locator('[data-view=top]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
  await sidePalette.getByRole('button',{name:'Place mounting hole in 3D'}).click();
  for(const [index,x] of [-20,20].entries()){
   const target=await page.evaluate(x=>window.__sensoryStudio.fittingPointScreen(x,-10,'top'),x);
   assert(target);
   await page.mouse.click(target.x,target.y);
   await page.waitForFunction(n=>window.__sensoryStudio.currentModel.build.manualMountHoles?.length===n,index+1);
  }
  await page.keyboard.press('Escape');
  const mountZ=sidePalette.locator('[data-mount-field=z]');
  await mountZ.fill('-12');
  await mountZ.press('Tab');
  assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles[1].z),-12);
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  await sidePalette.getByRole('button',{name:'P1',exact:true}).click();
  await sidePalette.getByText('Record measured fit',{exact:true}).click();
  const calibration=sidePalette.locator('[data-fit-calibration]');
  await calibration.locator('[name=printedBoreDiameter]').fill('5.5');
  await calibration.getByRole('button',{name:'Save measured fit'}).click();
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].clearance===.5);
  const {parameters,build,geometries}=await finishNativeJourney('FIT-01 Tile side',{inspectSideRoute:true});
  const [a,b]=build.pixelHoles;
  const width=parameters.width+24,depth=parameters.depth+24;
  const tabHoles=[[-width/2+.12*2*(width+depth),depth/2+5.05],[-depth/2,-depth/2-5.05]];
  for(const [format,geometry] of geometries){
   const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
   const mesh=new THREE.Mesh(geometry,material);
   const hit=(origin,direction)=>new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction)).intersectObject(mesh)[0]?.point;
   const bore=[a.x,-a.z+4,a.surface.y];
   const left=hit(bore,[-1,0,0]),right=hit(bore,[1,0,0]);
   assert(left&&right&&Math.abs(left.distanceTo(right)-5.5)<.02,format+' calibrated seed socket in the vertical wall');
   const route=[(a.x+b.x)/2,-a.z+.8,(a.surface.y+b.surface.y)/2];
   const lower=hit(route,[0,0,-1]),upper=hit(route,[0,0,1]);
   assert(lower&&upper&&Math.abs(lower.distanceTo(upper)-3.2)<.03,format+' routing survives calibrated fit and backing edits');
   for(const hole of build.manualMountHoles)assert.equal(hit([hole.x,-hole.z,-1],[0,0,1]),undefined);
   for(const [x,y] of tabHoles){
    assert.equal(hit([x,y,-1],[0,0,1]),undefined,format+' external tab fixing hole cuts through');
    assert(Math.abs((hit([x+2.5,y,10],[0,0,-1])?.z??0)-4)<.01,format+' external backing tab is 4 mm thick');
   }
   material.dispose();geometry.dispose();
  }
  await verifyTabRemovalBounds('FIT-01 Tile side',sidePalette);
 }
 async function assertNativeFittingPreview(name,count){
  const palette=page.locator('.sms-palette');
  const toggle=palette.getByRole('checkbox',{name:'Show physical pixels and socket cutters'});
  const output=palette.locator('[data-native-fit-preview-status]');
  const snapshot=()=>page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
  const before=await snapshot();
  await toggle.check();
  await output.filter({hasText:'P'+count+' · insertion'}).waitFor({timeout:60000});
  const message=await output.innerText();
  const measurements=[...message.matchAll(/P(\d+) · insertion ([\d.]+) mm · nominal cutter roof allowance (-?[\d.]+) mm · ([\d.]+) mm³ outside stock · ([\d.]+) mm³ stock interference; ([\d.]+) mm³ overlap with wire cuts · ([\d.]+) mm³ missing from required surrounding stock/g)];
  assert.equal(measurements.length,count,name+' reports physical fit for every installed socket');
  for(const [index,measurement] of measurements.entries()){
   assert.equal(Number(measurement[1]),index+1);
   assert(Number(measurement[2])>0,name+' reports a positive insertion depth');
   assert.equal(Number(measurement[6]),0,name+' has no wire cuts before routing');
   assert(Number(measurement[7])<=.05,name+' has the required surrounding stock');
  }
  await toggle.uncheck();
  await page.waitForFunction(()=>document.querySelector('[data-native-fit-preview-status]')?.textContent==='');
  assert.equal(await snapshot(),before,name+' preview is read-only');
 }
 // FIT-02: Real placement checks the stock for two profiles on the same perpendicular wall.
 {
  await page.evaluate(()=>{
   const key='crystal-forge-pixel-library';
   const profiles=JSON.parse(localStorage.getItem(key)||'[]');
   localStorage.setItem(key,JSON.stringify([...profiles,{
    id:'custom-tile-wall',name:'Compact 18 mm wall fixture',kind:'gumdrop',
    bodyDiameter:5,bodyHeight:18,capHeight:1.2,flangeDiameter:6,flangeHeight:1,
    wireWidth:2,wireDepth:1,retentionLip:0,measuredFit:{bodyDiameter:5,printedBoreDiameter:5.15}
   }]));
   window.__sensoryStudio.addModel('tactile-tiles',{
    width:90,depth:90,thickness:20,outline:'square',relief:2,pattern:'terraces',dualMaterial:false
   },'FIT-02 Tile perpendicular wall');
  });
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  await page.locator('[data-view=right]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  const palette=page.locator('.sms-palette');
  const place=palette.getByRole('button',{name:'Place shaped socket in 3D'});
  const canvas=await page.locator('#viewport canvas').boundingBox();
  const snapshot=()=>page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
  await palette.locator('[data-fit-profile=gumdrop]').click();
  const beforeRejected=await snapshot();
  await place.click();
  const x=canvas.x+canvas.width/2,y=canvas.y+canvas.height/2+41;
  await page.mouse.click(x,y);
  await palette.locator('[data-pixel-status]').filter({hasText:/continuous stock on its installation face/}).waitFor({timeout:60000});
  assert.equal(await snapshot(),beforeRejected,'Rejected wall fitting leaves the model unchanged');
  await page.keyboard.press('Escape');
  await palette.locator('[data-fit-profile=custom-tile-wall]').click();
  await place.click();
  await page.mouse.click(x,y);
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===1);
  await page.keyboard.press('Escape');
  const socket=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0]);
  assert.deepEqual(socket.surface.normal,[1,0,0]);
  assert.equal(socket.socketProfile.bodyHeight,18);
  assert.equal(socket.clearance,.15);
  assert(socket.surface.y>5&&socket.surface.y<15,'The seat is inside the 20 mm wall height');
  await assertNativeFittingPreview('Perpendicular Tile compact socket',1);
 }
 // FIT-02: Place the calibrated profile on the real sloped Wave surface.
 {
  await page.evaluate(()=>{
   const key='crystal-forge-pixel-library';
   const profiles=JSON.parse(localStorage.getItem(key)||'[]');
   localStorage.setItem(key,JSON.stringify([...profiles,{
    id:'custom-wave-wall',name:'Calibrated 11 mm Wave fixture',kind:'seed',
    bodyDiameter:5,bodyHeight:11,capHeight:1,flangeDiameter:5,flangeHeight:0,
    wireWidth:2,wireDepth:1.5,measuredFit:{bodyDiameter:5,printedBoreDiameter:5.2}
   }]));
   window.__sensoryStudio.addModel('waves',{
    width:160,depth:100,thickness:15,amplitude:1,frequency:.5,variation:0,direction:0,dualMaterial:false
   },'FIT-02 calibrated Wave');
  });
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  await page.locator('[data-view=top]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  const palette=page.locator('.sms-palette');
  await palette.locator('[data-fit-profile=custom-wave-wall]').click();
  await palette.getByRole('button',{name:'Place shaped socket in 3D'}).click();
  const target=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(-40,0,'top'));
  assert(target);
  await page.mouse.click(target.x,target.y);
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===1);
  await page.keyboard.press('Escape');
  const socket=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0]);
  assert.equal(socket.socketProfile.bodyHeight,11);
  assert.equal(socket.clearance,.2);
  assert(Math.abs(socket.surface.normal[0])>.005);
  assert(socket.surface.normal[1]>.95);
  await assertNativeFittingPreview('Calibrated Wave socket',1);
  const snapshot=()=>page.evaluate(()=>window.__sensoryStudio.currentModel);
  const status=palette.locator('[data-pixel-status]');
  const rejected=/continuous stock|too close|outside|perimeter|does not fit/i;
  const central=await snapshot();
  await palette.getByRole('button',{name:'Place shaped socket in 3D'}).click();
  const edge=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(-40,49,'top'));
  assert(edge);
  await page.mouse.click(edge.x,edge.y);
  await status.filter({hasText:rejected}).waitFor();
  assert.deepEqual(await snapshot(),central,'Near-edge raycast must preserve the central socket and revision');
  await page.keyboard.press('Escape');
  await palette.getByRole('button',{name:'P1',exact:true}).click();
  const z=palette.locator('[data-pixel-field=z]');
  await z.fill('40');
  await z.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].z===40);
  const accepted=await snapshot();
  assert(accepted.revision>central.revision);
  await assertNativeFittingPreview('Perimeter Wave socket',1);
  await z.fill('49');
  await z.press('Tab');
  await status.filter({hasText:rejected}).waitFor();
  assert.deepEqual(await snapshot(),accepted,'Invalid numeric edit must preserve the last valid revision');
  assert.equal(Number(await z.inputValue()),40);
  await page.locator('#smsGlobalUndo').click();
  assert.deepEqual((await snapshot()).build.pixelHoles,central.build.pixelHoles);
  await page.locator('#smsGlobalRedo').click();
  assert.deepEqual((await snapshot()).build.pixelHoles,accepted.build.pixelHoles);
  const saved=await snapshot();
  await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
  await page.reload();
  await page.waitForFunction(()=>window.__sensoryStudio?.currentModel?.name==='FIT-02 calibrated Wave');
  assert.deepEqual(await snapshot(),saved);
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  await page.locator('#smsPrintCurrent').getByRole('button',{name:'Prepare current model'}).click();
  const job=page.locator('#smsJobs article').filter({hasText:saved.name});
  await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const stl=await useDownload(job.locator('[data-job-stl]'));
  const mf=await useDownload(job.locator('[data-job-3mf]'));
  const near=saved.build.pixelHoles[0];
  const origin=new THREE.Vector3(near.x,-near.z,near.surface.y);
  const [nx,ny,nz]=near.surface.normal;
  const axis=new THREE.Vector3(nx,-nz,ny);
  const across=new THREE.Vector3(0,-1,0).addScaledVector(axis,-axis.dot(new THREE.Vector3(0,-1,0))).normalize();
  for(const [format,geometry] of [
   ['STL',new STLLoader().parse(Uint8Array.from(stl.bytes).buffer)],
   ['3MF',read3MFGeometry(zipEntries(mf.bytes).get('3D/3dmodel.model').toString())]
  ]){
   const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
   const mesh=new THREE.Mesh(geometry,material);
   const hit=(point,direction)=>new THREE.Raycaster(point,direction).intersectObject(mesh)[0]?.point;
   const inward=axis.clone().negate();
   const floor=hit(origin.clone().addScaledVector(axis,1),inward);
   assert(floor&&Math.abs(origin.distanceTo(floor)-11)<.02,format+' axial entry and seating depth');
   const centre=origin.clone().addScaledVector(axis,-4);
   const outer=hit(centre,across),inner=hit(centre,across.clone().negate());
   assert(outer&&inner&&Math.abs(outer.distanceTo(inner)-5.2)<.03,format+' calibrated bore');
   const perimeter=hit(centre.clone().addScaledVector(across,10),across.clone().negate());
   const underside=hit(floor.clone().setZ(-1),new THREE.Vector3(0,0,1));
   assert(perimeter&&perimeter.distanceTo(outer)>7.3,format+' continuous perimeter stock');
   assert(underside&&floor.z-underside.z>2.8,format+' stock behind the seat');
   console.log('FIT-02 perimeter Wave',format,{bore:outer.distanceTo(inner),depth:origin.distanceTo(floor),
    perimeterStock:perimeter.distanceTo(outer),rearStock:floor.z-underside.z});
   material.dispose();
   geometry.dispose();
  }
 }
 // FIT-03: Measured wire relief drives both prepared Wave exports.
 for(const {name,amplitude,width,depth} of [
  {name:'FIT-03 measured Wave route',amplitude:1,width:5.8,depth:1.95},
  {name:'FIT-03 raised Wave route',amplitude:6,width:3.2,depth:1.8}
 ]){
  await page.evaluate(({name,amplitude,width,depth})=>{
   const key='crystal-forge-pixel-library';
   const bodyDiameter=amplitude===6?5:8;
   const profiles=JSON.parse(localStorage.getItem(key)||'[]');
   localStorage.setItem(key,JSON.stringify([...profiles,{
    id:'custom-wave-wire-'+amplitude,name:'Wave cable fixture '+amplitude,kind:'seed',
    bodyDiameter,bodyHeight:9,capHeight:1,flangeDiameter:bodyDiameter,flangeHeight:0,
    wireWidth:amplitude===6?2:width,wireDepth:amplitude===6?1.5:depth
   }]));
   window.__sensoryStudio.addModel('waves',{
    width:160,depth:100,thickness:15,amplitude,frequency:.5,variation:0,direction:0,dualMaterial:false
   },name);
  },{name,amplitude,width,depth});
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  await page.locator('[data-view=top]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  const palette=page.locator('.sms-palette');
  await palette.locator('[data-fit-profile=custom-wave-wire-'+amplitude+']').click();
  await palette.getByRole('button',{name:'Place shaped socket in 3D'}).click();
  for(const [index,x] of [-40,-20].entries()){
   const point=await page.evaluate(x=>window.__sensoryStudio.fittingPointScreen(x,0,'top'),x);
   assert(point);
   await page.mouse.click(point.x,point.y);
   await page.waitForFunction(count=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===count,index+1);
  }
  await page.keyboard.press('Escape');
  for(const number of [1,2]){
   await palette.getByRole('button',{name:'P'+number,exact:true}).click();
   const angle=palette.locator('[data-pixel-field=rotation]');
   await angle.fill('180');
   await angle.press('Tab');
  }
  const serial=palette.getByRole('group',{name:'Serial LED string'});
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  await serial.locator('[data-native-route]').check();
  await serial.getByText('Channels ready for preparation.').waitFor();
  const {geometries}=await finishNativeJourney(name);
  for(const [format,geometry] of geometries){
   const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
   const mesh=new THREE.Mesh(geometry,material);
   const hit=(origin,direction)=>new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction)).intersectObject(mesh)[0]?.point;
   for(const x of [-79,-60,-30,0,30,60,79]){
    const top=hit([x,4,30],[0,0,-1]),floor=hit([x,0,30],[0,0,-1]);
    assert(top&&floor&&Math.abs(top.z-floor.z-depth)<.025,format+' calibrated Wave channel depth at '+x);
    const origin=[x,0,floor.z+.85];
    const left=hit(origin,[0,-1,0]),right=hit(origin,[0,1,0]);
    assert(left&&right&&Math.abs(right.y-left.y-width)<.025,format+' calibrated Wave channel width at '+x);
   }
   for(const sign of [-1,1]){
    const floor=hit([sign*79.99,0,30],[0,0,-1]);
    assert(floor);
    const edge=hit([sign*81,0,floor.z+.85],[-sign,0,0]);
    assert(!edge||Math.abs(edge.x-sign*80)>.1,format+' clear exterior opening');
   }
   geometry.dispose();material.dispose();
  }
  if(amplitude===6){
   const design=page.locator('.sms-workspace-nav [data-tab=design]');
   const print=page.locator('.sms-workspace-nav [data-tab=print]');
   const job=page.locator('#smsJobs article').filter({hasText:name});
   const sockets=()=>page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles);
   const acceptedSockets=await sockets();
   await design.click();
   await page.locator('.sms-palette [data-palette-key=amplitude]').press('ArrowRight');
   await page.waitForFunction(()=>window.__sensoryStudio.currentModel.parameters.amplitude>6);
   assert.deepEqual(await sockets(),acceptedSockets,'Editing relief preserves the saved fitting records');
   await print.click();
   await job.getByText('Stale',{exact:true}).waitFor();
   assert(await job.locator('[data-job-stl]').isDisabled());
   assert(await job.locator('[data-job-3mf]').isDisabled());
   await job.locator('[data-job-prepare]').click();
   await job.getByText(/Wave relief is too steep.*Reduce Wave height or Wave count.*6% or less/).waitFor({timeout:120000});
   assert(await job.locator('[data-job-stl]').isDisabled());
   assert(await job.locator('[data-job-3mf]').isDisabled());
   await design.click();
   await page.locator('#smsGlobalUndo').click();
   await page.waitForFunction(()=>window.__sensoryStudio.currentModel.parameters.amplitude===6);
   assert.deepEqual(await sockets(),acceptedSockets);
   await print.click();
   await job.locator('[data-job-prepare]').click();
   await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
   assert(!(await job.locator('[data-job-stl]').isDisabled()));
   assert(!(await job.locator('[data-job-3mf]').isDisabled()));
  }
 }
 // FIT-01/FIT-03: confirmed curved Wave seats and a surface-following wired export.
 {
  await page.evaluate(()=>window.__sensoryStudio.addModel('waves',{
   width:160,depth:100,thickness:15,amplitude:1,frequency:.5,variation:0,direction:0,dualMaterial:false
  },'FIT-03 gentle Wave'));
  await page.locator('.sms-workspace-nav [data-tab=design]').click();
  await page.locator('.sms-palette [data-palette-key=width]').press('ArrowRight');
  assert(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.width)>160);
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  await page.locator('[data-view=top]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  await page.locator('[data-fit-profile=seed]').click();
  await page.getByRole('button',{name:'Place shaped socket in 3D'}).click();
  const getSeats=()=>page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles);
  for(const [index,x] of [-40,-20].entries()){
   const target=await page.evaluate(x=>window.__sensoryStudio.fittingPointScreen(x,0,'top'),x);
   assert(target);
   await page.mouse.click(target.x,target.y);
   await page.waitForFunction(count=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===count,index+1);
  }
  await page.keyboard.press('Escape');
  const seats=await getSeats();
  await assertNativeFittingPreview('Curved Wave',seats.length);
  await page.locator('.sms-palette').getByRole('button',{name:'P1',exact:true}).click();
  const dragPoints=await page.evaluate(id=>[
   window.__sensoryStudio.pixelMarkerScreen(id),window.__sensoryStudio.fittingPointScreen(-44,0,'top')
  ],seats[0].id);
  assert(dragPoints.every(Boolean));
  await page.mouse.move(dragPoints[0].x,dragPoints[0].y);
  await page.mouse.down();
  await page.waitForTimeout(225);
  await page.mouse.move(dragPoints[1].x,dragPoints[1].y,{steps:6});
  await page.mouse.up();
  await page.waitForFunction(x=>window.__sensoryStudio.currentModel.build.pixelHoles[0].x<x-2,seats[0].x);
  const beforeConvexFit=await getSeats();
  assert.notDeepEqual(beforeConvexFit[0].surface,seats[0].surface,'The drag records its new physical installation pose');
  await page.locator('#smsGlobalUndo').click();
  assert.deepEqual(await getSeats(),seats,'Undo restores both sockets with their exact saved surface normals');
  await page.locator('#smsGlobalRedo').click();
  assert.deepEqual(await getSeats(),beforeConvexFit,'Redo restores the dragged socket with its surface normal');
  await page.locator('.sms-palette').getByRole('button',{name:'P1',exact:true}).click();
  await page.locator('#viewport canvas').press('ArrowLeft');
  await page.waitForFunction(x=>window.__sensoryStudio.currentModel.build.pixelHoles[0].x===x,beforeConvexFit[0].x-1);
  assert.notDeepEqual((await getSeats())[0].surface,beforeConvexFit[0].surface);
  const typedX=Number((beforeConvexFit[0].x-2).toFixed(1));
  const xField=page.locator('.sms-palette').getByLabel('X (mm)',{exact:true});
  await xField.fill(String(typedX));await xField.press('Tab');
  await page.waitForFunction(x=>window.__sensoryStudio.currentModel.build.pixelHoles[0].x===x,typedX);
  const moved=await getSeats();
  assert.notDeepEqual(moved[0].surface,beforeConvexFit[0].surface);
  await xField.fill('199');await xField.press('Tab');
  await page.locator('#smsModelError').getByText(/Move along the current installation face/).waitFor();
  assert.equal(Number(await xField.inputValue()),typedX);
  assert.deepEqual(await getSeats(),moved);
  await page.locator('#smsGlobalUndo').click();
  await page.locator('#smsGlobalUndo').click();
  assert.deepEqual(await getSeats(),beforeConvexFit);
  await page.getByRole('button',{name:'Place shaped socket in 3D'}).click();
  const curvedFailure=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(40,0,'top'));
  assert(curvedFailure);
  await page.mouse.click(curvedFailure.x,curvedFailure.y);
  await page.locator('.sms-palette [data-pixel-status]').filter({hasText:/continuous stock/}).waitFor();
  await page.keyboard.press('Escape');
  assert.deepEqual(await getSeats(),beforeConvexFit);
  assert(seats.every(hole=>Math.abs(hole.surface.normal[0])>.005));
  assert.notDeepEqual(seats[0].surface.normal,seats[1].surface.normal);
  const wavePalette=page.locator('.sms-palette');
  for(const number of [1,2]){
   await wavePalette.getByRole('button',{name:'P'+number,exact:true}).click();
   const angle=wavePalette.locator('[data-pixel-field=rotation]');
   await angle.fill('180');
   await angle.press('Tab');
  }
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  const waveSerial=wavePalette.getByRole('group',{name:'Serial LED string'});
  const machine=waveSerial.locator('[data-native-route]');
  assert(!(await machine.isDisabled()),await waveSerial.innerText());
  await machine.check();
  await waveSerial.getByText('Channels ready for preparation.').waitFor();
  const acceptedRoute=await page.evaluate(()=>window.__sensoryStudio.currentModel);
  const vault=waveSerial.getByLabel('Vault wire-track roofs for underside-down printing');
  await vault.click();
  await page.locator('#smsModelError').getByText(/Turn off the vaulted option for a Wave route/).waitFor();
  assert.equal(await vault.isChecked(),false);
  assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel),acceptedRoute);
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  await wavePalette.locator('[data-pixel-backing]').check();
  await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
  const addTab=wavePalette.getByRole('button',{name:'Add external tab',exact:true});
  await addTab.click();
  await addTab.click();
  for(const [index,position] of [13,63].entries()){
   const perimeter=wavePalette.locator('[data-backing-tab="'+index+'"]');
   await perimeter.fill(String(position));
   await perimeter.press('Tab');
  }
  assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.backingTabs),[{u:.13},{u:.63}]);
  await wavePalette.getByRole('button',{name:'Place mounting hole in 3D'}).click();
  for(const [index,x] of [-20,20].entries()){
   const target=await page.evaluate(x=>window.__sensoryStudio.fittingPointScreen(x,-20,'top'),x);
   assert(target);
   await page.mouse.click(target.x,target.y);
   await page.waitForFunction(n=>window.__sensoryStudio.currentModel.build.manualMountHoles?.length===n,index+1);
  }
  await page.keyboard.press('Escape');
  await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
  const mountZ=wavePalette.locator('[data-mount-field=z]');
  await mountZ.fill('-22');
  await mountZ.press('Tab');
  assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles[1].z),-22);
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  await wavePalette.getByRole('button',{name:'P1',exact:true}).click();
  await wavePalette.getByText('Record measured fit',{exact:true}).click();
  const calibration=wavePalette.locator('[data-fit-calibration]');
  await calibration.locator('[name=printedBoreDiameter]').fill('5.4');
  await calibration.getByRole('button',{name:'Save measured fit'}).click();
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].clearance===.4);
  const {parameters,build,geometries}=await finishNativeJourney('FIT-03 gentle Wave',{inspectCurvedRoute:true});
  const [a,b]=build.pixelHoles;
  const width=parameters.width+24,depth=parameters.depth+24;
  const tabX=-width/2+.13*2*(width+depth);
  const tabY=depth/2+5.05;
  for(const [format,geometry] of geometries){
   const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
   const mesh=new THREE.Mesh(geometry,material);
   const hit=(origin,direction)=>new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction)).intersectObject(mesh)[0]?.point;
   const [nx,ny,nz]=a.surface.normal;
   const bore=[a.x-4*nx,-a.z+4*nz,a.surface.y-4*ny];
   const left=hit(bore,[0,-1,0]),right=hit(bore,[0,1,0]);
   assert(left&&right&&Math.abs(left.distanceTo(right)-5.4)<.02,format+' calibrated seat follows the curved face normal');
   const route=[(a.x+b.x)/2,-(a.z+b.z)/2,(a.surface.y+b.surface.y)/2-1];
   const first=hit(route,[0,-1,0]),last=hit(route,[0,1,0]);
   assert(first&&last&&Math.abs(first.distanceTo(last)-3.2)<.03,format+' Wave routing retains its width');
   for(const hole of build.manualMountHoles)assert.equal(hit([hole.x,-hole.z,-1],[0,0,1]),undefined);
   for(const sign of [-1,1]){
    const x=sign*tabX,y=sign*tabY;
    assert.equal(hit([x,y,-1],[0,0,1]),undefined,format+' Wave tab fixing hole cuts through');
    assert(Math.abs((hit([x+2.5,y,10],[0,0,-1])?.z??0)-4)<.01,format+' Wave backing tab retains 4 mm of stock');
   }
   material.dispose();geometry.dispose();
  }
  const job=page.locator('#smsJobs article').filter({hasText:'FIT-03 gentle Wave'});
  const rotationBuild=page.locator('.sms-workspace-nav [data-workspace=pixels]');
  const rotationPrint=page.locator('.sms-workspace-nav [data-tab=print]');
  await rotationBuild.click();
  await wavePalette.getByRole('button',{name:'P1',exact:true}).click();
  const rotationControl=wavePalette.getByLabel('Body rotation (°)');
  const savedRotation=await page.evaluate(()=>window.__sensoryStudio.currentModel);
  await rotationControl.fill('90');await rotationControl.press('Tab');
  await page.locator('#smsModelError').getByText(/No safe tangent|Chosen IN edge|approaches an edge/i).waitFor();
  assert.equal(Number(await rotationControl.inputValue()),180);
  assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel),savedRotation);
  await rotationPrint.click();
  await job.getByText('Prepared',{exact:true}).waitFor();
  assert(!(await job.locator('[data-job-stl]').isDisabled()));
  await rotationBuild.click();
  await rotationControl.fill('179');await rotationControl.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].rotation===179);
  await rotationPrint.click();
  await job.getByText('Stale',{exact:true}).waitFor();
  assert(await job.locator('[data-job-stl]').isDisabled());
  assert(await job.locator('[data-job-3mf]').isDisabled());
  await job.locator('[data-job-prepare]').click();
  await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const rotatedSTL=await useDownload(job.locator('[data-job-stl]'));
  const rotatedMF=await useDownload(job.locator('[data-job-3mf]'));
  const routePoint=new THREE.Vector3((a.x+b.x)/2,-(a.z+b.z)/2,(a.surface.y+b.surface.y)/2-1);
  for(const geometry of [new STLLoader().parse(Uint8Array.from(rotatedSTL.bytes).buffer),
   read3MFGeometry(zipEntries(rotatedMF.bytes).get('3D/3dmodel.model').toString())]){
   const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),mesh=new THREE.Mesh(geometry,material);
   const width=[-1,1].reduce((sum,sign)=>sum+new THREE.Raycaster(routePoint,new THREE.Vector3(0,sign,0))
    .intersectObject(mesh)[0].distance,0);
   assert(Math.abs(width-3.2)<.08);
   geometry.dispose();material.dispose();
  }
  await rotationBuild.click();
  await wavePalette.getByRole('button',{name:'P2',exact:true}).click();
  const sequence=await page.evaluate(()=>window.__sensoryStudio.currentModel);
  await wavePalette.getByRole('button',{name:'Move earlier',exact:true}).click();
  await page.locator('#smsModelError').getByText(/No safe tangent|Chosen IN edge|approaches an edge/i).waitFor();
  assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel),sequence);
  await rotationPrint.click();
  await job.getByText('Prepared',{exact:true}).waitFor();
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  await waveSerial.getByRole('button',{name:'Reverse pixel order and wiring'}).click();
  await page.waitForFunction(id=>window.__sensoryStudio.currentModel.build.pixelHoles[0].id===id,b.id);
  const reversed=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles);
  assert.deepEqual(reversed.map(({id,rotation})=>({id,rotation})),[{id:b.id,rotation:0},{id:a.id,rotation:359}]);
  await rotationPrint.click();
  await job.getByText('Stale',{exact:true}).waitFor();
  assert(await job.locator('[data-job-stl]').isDisabled());
  assert(await job.locator('[data-job-3mf]').isDisabled());
  await job.locator('[data-job-prepare]').click();
  await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const reversedSTL=await useDownload(job.locator('[data-job-stl]'));
  const reversedMF=await useDownload(job.locator('[data-job-3mf]'));
  for(const geometry of [new STLLoader().parse(Uint8Array.from(reversedSTL.bytes).buffer),
   read3MFGeometry(zipEntries(reversedMF.bytes).get('3D/3dmodel.model').toString())]){
   const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),mesh=new THREE.Mesh(geometry,material);
   const width=[-1,1].reduce((sum,sign)=>sum+new THREE.Raycaster(routePoint,new THREE.Vector3(0,sign,0))
    .intersectObject(mesh)[0].distance,0);
   assert(Math.abs(width-3.2)<.08);
   geometry.dispose();material.dispose();
  }
  await verifyTabRemovalBounds('FIT-03 gentle Wave',wavePalette);
 }
 // Independent stationary backed journeys. Each uses its own model, placement, calibration and actual files.
 const backedFamilies=[
  {type:'characters',name:'Layered Character',key:'width',source:{character:'Cloud',construction:'Layered',width:90,depth:8,dualMaterial:false}},
  {type:'light-pods',name:'Solid Beacon Pod',key:'width',source:{shellForm:'Beacon',illuminated:false,width:80,depth:68,height:32,dualMaterial:false}},
  {type:'control-caps',name:'Stationary Rotary Cap',key:'diameter',source:{controlStyle:'Rotary knob',shaft:0,diameter:70,height:19,dualMaterial:false}}
 ];
 const compactProfile='Measured compact backing pixel';
 for(const {type,name,key,source} of backedFamilies){
  await page.evaluate(({type,source,name})=>window.__sensoryStudio.addModel(type,source,name),{type,source,name});
  await page.locator('.sms-workspace-nav [data-tab=design]').click();
  await page.locator('.sms-palette [data-palette-key="'+key+'"]').press('ArrowRight');
  const shape=await page.evaluate(key=>window.__sensoryStudio.currentModel.parameters[key],key);
  assert(shape>source[key],name+' accepts a Design size edit');
  const {width:designX,depth:designY}=await page.evaluate(type=>{
   const {registry,currentModel}=window.__sensoryStudio;
   return registry.get(type).recipe(currentModel.parameters).bounds;
  },type);
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  const palette=page.locator('.sms-palette');
  await palette.locator('[data-pixel-backing]').check();
  const thickness=palette.getByLabel('Fitting backing thickness (mm)');
  await thickness.fill('10');
  await thickness.press('Tab');
  assert.equal(await thickness.inputValue(),'10');
  if(type==='control-caps'){
   await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
   const moving=await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
   await palette.getByRole('button',{name:'Add external tab',exact:true}).click();
   await palette.locator('[data-pixel-status]').filter({hasText:/Stationary display/}).waitFor();
   assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),moving);
   await page.locator('.sms-workspace-nav [data-tab=design]').click();
   await palette.getByRole('button',{name:'Stationary display',exact:true}).click();
   assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.knobInstallation),'Stationary display');
  }
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  if(type==='characters'){
   await palette.locator('[data-fit-profile=seed]').click();
   await palette.getByRole('button',{name:'Create / edit pixel profile'}).click();
   for(const [id,value] of Object.entries({pixelName:compactProfile,pixelBodyDiameter:'5',pixelBodyHeight:'6',
    pixelFlangeDiameter:'6',pixelFlangeHeight:'.5',pixelCapHeight:'1.2',pixelWireWidth:'2',pixelWireDepth:'1.5',pixelSocketClearance:'.25'}))
    await page.locator('#'+id).fill(value);
   await page.locator('#applyPixelSocketFit').click();
  }
  await palette.getByRole('button',{name:/Measured compact backing pixel/}).click();
  await page.locator('[data-view=bottom]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  const fitting=palette.getByRole('button',{name:'Place shaped socket in 3D'});
  await fitting.click();
  for(const [index,x] of [-15,15].entries()){
   const screen=await page.evaluate(x=>window.__sensoryStudio.fittingPointScreen(x,0,'underside'),x);
   assert(screen);
   await page.mouse.click(screen.x,screen.y);
   await page.waitForFunction(n=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===n,index+1);
  }
  await page.keyboard.press('Escape');
  const seats=()=>page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles);
  const [,second]=await seats();
  await assertNativeFittingPreview(name,2);
  assert.equal(second.entryFace,'underside');
  assert.equal(second.socketProfile.bodyHeight,6);
  const beforeRetention=await seats();
  const retention=palette.getByLabel('Retention lip (mm)');
  await retention.fill('.4');await retention.press('Tab');
  await palette.locator('[data-pixel-status]').filter({hasText:/Cannot cut the selected retention lip/}).waitFor();
  assert.deepEqual(await seats(),beforeRetention);
  const drag=await page.evaluate(id=>[window.__sensoryStudio.pixelMarkerScreen(id),
   window.__sensoryStudio.fittingPointScreen(20,0,'underside')],second.id);
  assert(drag.every(Boolean));
  await page.mouse.move(drag[0].x,drag[0].y);
  await page.mouse.down();
  await page.waitForTimeout(225);
  await page.mouse.move(drag[1].x,drag[1].y,{steps:6});
  await page.mouse.up();
  await page.waitForFunction(x=>window.__sensoryStudio.currentModel.build.pixelHoles[1].x>x+2,second.x);
  const placed=await page.evaluate(()=>window.__sensoryStudio.currentModel);
  const [firstSeat,draggedSeat]=placed.build.pixelHoles;
  const rejected=await page.evaluate(({firstSeat,draggedSeat})=>[
   window.__sensoryStudio.pixelMarkerScreen(draggedSeat.id),
   window.__sensoryStudio.fittingPointScreen(firstSeat.x+1,firstSeat.z,'underside')
  ],{firstSeat,draggedSeat});
  assert(rejected.every(Boolean),name+' can test overlap on real stock');
  await page.mouse.move(rejected[0].x,rejected[0].y);
  await page.mouse.down();
  await page.waitForTimeout(225);
  await page.mouse.move(rejected[1].x,rejected[1].y,{steps:6});
  await page.mouse.up();
  await palette.locator('[data-pixel-status]').getByText(/overlap|clearance|continuous .*stock/i).waitFor();
  assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel),placed,
   name+' refuses the overlapping drag without changing either saved cutter pose');
  await page.locator('#smsGlobalUndo').click();
  assert.deepEqual(await seats(),beforeRetention,name+' undo restores both previous socket poses');
  await page.locator('#smsGlobalRedo').click();
  assert.deepEqual(await seats(),placed.build.pixelHoles,name+' redo restores both exact socket poses');
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  const serial=palette.getByRole('group',{name:'Serial LED string'});
  const route=serial.locator('[data-native-route]');
  assert(!(await route.isDisabled()),await serial.innerText());
  await route.check();
  await serial.getByText('Channels ready for preparation.').waitFor();
  await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
  const addTab=palette.getByRole('button',{name:'Add external tab',exact:true});
  await addTab.click();
  await addTab.click();
  for(const [index,position] of [13,63].entries()){
   const perimeter=palette.locator('[data-backing-tab="'+index+'"]');
   await perimeter.fill(String(position));
   await perimeter.press('Tab');
  }
  assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.backingTabs),[{u:.13},{u:.63}]);
  await palette.getByRole('button',{name:'Place mounting hole in 3D'}).click();
  for(const [index,x] of [-8,8].entries()){
   const point=await page.evaluate(x=>window.__sensoryStudio.fittingPointScreen(x,-14,'underside'),x);
   assert(point);
   await page.mouse.click(point.x,point.y);
   await page.waitForFunction(n=>window.__sensoryStudio.currentModel.build.manualMountHoles?.length===n,index+1);
  }
  await page.keyboard.press('Escape');
  const mountZ=palette.locator('[data-mount-field=z]');
  const mounted=await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
  await mountZ.fill('0');
  await mountZ.press('Tab');
  await palette.locator('[data-pixel-status]').filter({hasText:/too close to Mount hole/}).waitFor();
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),mounted);
  await mountZ.fill('-16');
  await mountZ.press('Tab');
  assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles[1].z),-16);
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  await palette.getByRole('button',{name:'P1',exact:true}).click();
  await palette.getByText('Record measured fit',{exact:true}).click();
  const calibration=palette.locator('[data-fit-calibration]');
  await calibration.locator('[name=printedBoreDiameter]').fill('5.45');
  await calibration.getByRole('button',{name:'Save measured fit'}).click();
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].clearance===.45);
  const {build,geometries}=await finishNativeJourney(name,{undersideProbeHeight:.8});
  const [a,b]=build.pixelHoles;
  const width=designX+24,depth=designY+24;
  const tabX=-width/2+.13*2*(width+depth),tabY=depth/2+5.05;
  for(const [format,geometry] of geometries){
   const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
   const mesh=new THREE.Mesh(geometry,material);
   const hit=(origin,direction)=>new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction)).intersectObject(mesh)[0]?.point;
   const bore=[a.x,-a.z,3];
   const left=hit(bore,[0,-1,0]),right=hit(bore,[0,1,0]);
   assert(left&&right&&Math.abs(left.distanceTo(right)-5.45)<.02,name+' '+format+' calibrated 5.45 mm bore');
   const wiring=[(a.x+b.x)/2,-(a.z+b.z)/2,.8];
   const first=hit(wiring,[0,-1,0]),last=hit(wiring,[0,1,0]);
   assert(first&&last&&Math.abs(first.distanceTo(last)-3.2)<.03,name+' '+format+' independently retains 3.2 mm wire width');
   for(const hole of build.manualMountHoles)assert.equal(hit([hole.x,-hole.z,-1],[0,0,1]),undefined,name+' '+format+' manual through-hole');
   for(const sign of [-1,1]){
    const x=sign*tabX,y=sign*tabY;
    assert.equal(hit([x,y,-1],[0,0,1]),undefined,name+' '+format+' external tab through-hole');
    assert(Math.abs((hit([x+2.5,y,15],[0,0,-1])?.z??0)-10)<.01,name+' '+format+' connected outward tab is 10 mm thick');
   }
   material.dispose();geometry.dispose();
  }
  {
   const buildTab=page.locator('.sms-workspace-nav [data-workspace=pixels]');
   const printTab=page.locator('.sms-workspace-nav [data-tab=print]');
   const job=page.locator('#smsJobs article').filter({hasText:name});
   const assertStale=async()=>{
    await printTab.click();
    await job.getByText('Stale',{exact:true}).waitFor();
    assert(await job.locator('[data-job-stl]').isDisabled());
    assert(await job.locator('[data-job-3mf]').isDisabled());
    await job.locator('[data-job-prepare]').click();
    await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
   };
   await buildTab.click();
   await palette.getByRole('button',{name:'P1',exact:true}).click();
   await palette.getByText('Record measured fit',{exact:true}).click();
   const fit=palette.locator('[data-fit-calibration]');
   await fit.locator('[name=printedBoreDiameter]').fill('5.6');
   await fit.getByRole('button',{name:'Save measured fit'}).click();
   await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].clearance===.6);
   const edited=await seats();
   await assertStale();
   await buildTab.click();
   await page.locator('#smsGlobalUndo').click();
   assert.deepEqual(await seats(),build.pixelHoles);
   await assertStale();
   await buildTab.click();
   await page.locator('#smsGlobalRedo').click();
   assert.deepEqual(await seats(),edited);
   await assertStale();
   const stl=await useDownload(job.locator('[data-job-stl]'));
   const mf=await useDownload(job.locator('[data-job-3mf]'));
   for(const geometry of [new STLLoader().parse(Uint8Array.from(stl.bytes).buffer),
    read3MFGeometry(zipEntries(mf.bytes).get('3D/3dmodel.model').toString())]){
    const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
    const mesh=new THREE.Mesh(geometry,material),origin=new THREE.Vector3(a.x,-a.z,3);
    const width=[-1,1].reduce((sum,sign)=>sum+new THREE.Raycaster(origin,new THREE.Vector3(0,sign,0))
     .intersectObject(mesh)[0].distance,0);
    assert(Math.abs(width-5.6)<.02,name+' redo prepares the edited 5.6 mm socket');
    geometry.dispose();material.dispose();
   }
  }
  await verifyTabRemovalBounds(name,palette);
  const tabJob=page.locator('#smsJobs article').filter({hasText:name});
  const tabProfile=type==='light-pods'?'Countersink':'Counterbore';
  await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
  await palette.locator('[data-tab-profile="0"]').selectOption(tabProfile);
  await page.waitForFunction(profile=>window.__sensoryStudio.currentModel.build.backingTabs[0].profile===profile,tabProfile);
  const recess=palette.locator('[data-tab-recess=recessDepth]');
  await recess.fill('3');await recess.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.backingTabs[0].recessDepth===3);
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  await tabJob.getByText('Stale',{exact:true}).waitFor();
  assert(await tabJob.locator('[data-job-stl]').isDisabled());
  assert(await tabJob.locator('[data-job-3mf]').isDisabled());
  await tabJob.locator('[data-job-prepare]').click();
  await tabJob.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const tabSTL=await useDownload(tabJob.locator('[data-job-stl]'));
  const tabMF=await useDownload(tabJob.locator('[data-job-3mf]'));
  for(const geometry of [new STLLoader().parse(Uint8Array.from(tabSTL.bytes).buffer),
   read3MFGeometry(zipEntries(tabMF.bytes).get('3D/3dmodel.model').toString())]){
   const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),mesh=new THREE.Mesh(geometry,material);
   const hit=(origin,direction)=>new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction)).intersectObject(mesh)[0]?.point;
   const span=height=>hit([tabX,tabY,height],[-1,0,0]).distanceTo(hit([tabX,tabY,height],[1,0,0]));
   assert(Math.abs(span(.6)-(tabProfile==='Countersink'?4.76:5.1))<.02);
   assert(Math.abs(span(4)-3.4)<.02);
   const floor=hit([tabX+2,tabY,-1],[0,0,1]),top=hit([tabX+2,tabY,11],[0,0,-1]);
   assert(floor&&Math.abs(floor.z-(tabProfile==='Countersink'?3*(2.55-2)/.85:3))<.02);
   assert(top&&Math.abs(top.z-10)<.01,name+' keeps the measured stock behind the recess');
   geometry.dispose();material.dispose();
  }
  console.log(name+' manufacturing journey verified');
 }
 // FIT-02: actual Gear and Tile profile/cutter overlay UI parity.
 await page.evaluate(()=>window.__sensoryStudio.addModel('tactile-tiles',{
  pattern:'terraces',width:90,depth:90,thickness:20,relief:2,dualMaterial:false
 },'FIT-02 Tile underside'));
 await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
 await page.locator('[data-view=bottom]').click();
 await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
 await page.getByRole('button',{name:'Place shaped socket in 3D'}).click();
 const tilePoint=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(0,0,'underside'));
 assert(tilePoint,'Tile fitting needs a physical underside');
 await page.mouse.click(tilePoint.x,tilePoint.y);
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===1,{timeout:120000});
 const tileStateBefore=await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
 const tileToggle=page.getByRole('checkbox',{name:'Show physical pixels and socket cutters'});
 await tileToggle.check();
 const tilePreview=page.locator('[data-native-fit-preview-status]');
 await page.waitForFunction(()=>/insertion|unavailable/.test(
  document.querySelector('[data-native-fit-preview-status]')?.textContent||''),null,{timeout:60000});
 assert.match(await tilePreview.innerText(),/insertion 9\.00 mm/,
  'Tile preview: '+await tilePreview.innerText());
 assert.match(await tilePreview.innerText(),/stock interference; 0\.00 mm³ overlap with wire cuts/);
 await tileToggle.uncheck();
 assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),tileStateBefore,
  'Toggling Tile physical overlays must not mutate fittings, dimensions or saved model revision');
 await page.keyboard.press('Escape');
 // Edit a real recessed fixing, download both revisions and check that stale exports are blocked.
 {
  const witness='Recessed fixing witness';
  await page.evaluate(name=>window.__sensoryStudio.addModel('gears',{mode:'Decorative',wheelStyle:'Rounded lobes',
   webStyle:'Solid',diameter:100,thickness:10,bore:0,reliefStyle:'None',dualMaterial:false},name),witness);
  const buildTab=page.locator('.sms-workspace-nav [data-workspace=mounting]');
  const printTab=page.locator('.sms-workspace-nav [data-tab=print]');
  await buildTab.click();
  const enabled=page.locator('[data-build=mounting]');
  await enabled.evaluate(node=>{for(let p=node.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
  await enabled.check();
  await page.locator('[data-build=mountStyle]').selectOption('Underside counterbores');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.mountStyle==='Underside counterbores');
  const diameter=page.locator('[data-build=holeDiameter]');
  await diameter.fill('4');await diameter.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.holeDiameter===4);
  const job=page.locator('#smsJobs article').filter({hasText:witness});
  const measureFixing=async expected=>{
   await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
   const stl=await useDownload(job.locator('[data-job-stl]'));
   const mf=await useDownload(job.locator('[data-job-3mf]'));
   const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
   for(const geometry of [new STLLoader().parse(Uint8Array.from(stl.bytes).buffer),
    read3MFGeometry(zipEntries(mf.bytes).get('3D/3dmodel.model').toString())]){
    const mesh=new THREE.Mesh(geometry,material);
    const hit=(x,y,z,dx,dy,dz)=>new THREE.Raycaster(new THREE.Vector3(x,y,z),new THREE.Vector3(dx,dy,dz)).intersectObject(mesh)[0];
    for(const x of [-27.5,27.5]){
     const span=z=>[-1,1].reduce((sum,sign)=>sum+hit(x,0,z,0,sign,0).distance,0);
     assert(Math.abs(span(2)-expected)<.005);
     assert(Math.abs(span(.4)-expected*1.5)<.005);
     const shoulder=hit(x,expected*.625,-1,0,0,1).point.z;
     const top=hit(x,expected*.625,11,0,0,-1).point.z;
     assert(Math.abs(shoulder-1.4)<.005&&Math.abs(top-shoulder-8.6)<.005);
    }
    geometry.dispose();
   }
   material.dispose();
  };
  await printTab.click();
  await page.getByRole('button',{name:'Prepare current model',exact:true}).click();
  await measureFixing(4);
  await buildTab.click();
  await diameter.evaluate(node=>{for(let p=node.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
  const prior=await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
  await diameter.fill('9');await diameter.press('Tab');
  assert.equal(Number(await diameter.inputValue()),4);
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),prior);
  await diameter.fill('5.05');await diameter.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.holeDiameter===5.05);
  await printTab.click();
  await job.getByText('Stale',{exact:true}).waitFor();
  assert(await job.locator('[data-job-stl]').isDisabled());
  assert(await job.locator('[data-job-3mf]').isDisabled());
  await job.locator('[data-job-prepare]').click();
  await measureFixing(5.05);
  await buildTab.click();
  await enabled.evaluate(node=>{for(let p=node.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
  await enabled.uncheck();
  await page.locator('[data-view=bottom]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  const palette=page.locator('.sms-palette');
  await palette.getByRole('button',{name:'Place mounting hole in 3D'}).click();
  const point=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(-20,0,'underside'));
  assert(point);await page.mouse.click(point.x,point.y);
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.manualMountHoles?.length===1);
  await page.keyboard.press('Escape');
  await palette.locator('[data-mount-profile]').selectOption('Counterbore');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.manualMountHoles[0].profile==='Counterbore');
  const depth=palette.locator('[data-mount-recess=recessDepth]');
  await depth.fill('3');await depth.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.manualMountHoles[0].recessDepth===3);
  const manualAccepted=await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
  await depth.fill('8.5');await depth.press('Tab');
  assert.equal(Number(await depth.inputValue()),3);
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),manualAccepted);
  const {x,z}=JSON.parse(manualAccepted).build.manualMountHoles[0];
  await printTab.click();
  await job.getByText('Stale',{exact:true}).waitFor();
  await job.locator('[data-job-prepare]').click();
  await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const manualSTL=await useDownload(job.locator('[data-job-stl]'));
  const manualMF=await useDownload(job.locator('[data-job-3mf]'));
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  for(const geometry of [new STLLoader().parse(Uint8Array.from(manualSTL.bytes).buffer),
   read3MFGeometry(zipEntries(manualMF.bytes).get('3D/3dmodel.model').toString())]){
   const mesh=new THREE.Mesh(geometry,material);
   const hit=(y,height,dy,dz)=>new THREE.Raycaster(new THREE.Vector3(x,y,height),new THREE.Vector3(0,dy,dz)).intersectObject(mesh)[0];
   assert(Math.abs(hit(-z,1,1,0).distance+hit(-z,1,-1,0).distance-5.1)<.01);
   assert(Math.abs(hit(-z,4,1,0).distance+hit(-z,4,-1,0).distance-3.4)<.01);
   assert(Math.abs(hit(-z+2,-1,0,1).point.z-3)<.01);
   geometry.dispose();
  }
  await buildTab.click();
  await page.locator('[data-view=top]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  await palette.getByRole('button',{name:'Place mounting hole in 3D'}).click();
  const upper=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(20,0,'top'));
  assert(upper);await page.mouse.click(upper.x,upper.y);
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.manualMountHoles?.length===2);
  await page.keyboard.press('Escape');
  await palette.locator('[data-mount-profile]').selectOption('Countersink');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.manualMountHoles[1].profile==='Countersink');
  const topMount=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles[1]);
  assert.equal(topMount.entryFace,'top');
  await printTab.click();
  await job.getByText('Stale',{exact:true}).waitFor();
  await job.locator('[data-job-prepare]').click();
  await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const topSTL=await useDownload(job.locator('[data-job-stl]'));
  const topMF=await useDownload(job.locator('[data-job-3mf]'));
  for(const geometry of [new STLLoader().parse(Uint8Array.from(topSTL.bytes).buffer),
   read3MFGeometry(zipEntries(topMF.bytes).get('3D/3dmodel.model').toString())]){
   const mesh=new THREE.Mesh(geometry,material);
   const width=height=>[-1,1].reduce((sum,side)=>sum+new THREE.Raycaster(
    new THREE.Vector3(topMount.x,-topMount.z,height),new THREE.Vector3(0,side,0)).intersectObject(mesh)[0].distance,0);
   assert(Math.abs(width(9.3)-4.25)<.01);
   assert(Math.abs(width(8)-3.4)<.01);
   geometry.dispose();
  }
  material.dispose();
  await buildTab.click();
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  await palette.locator('[data-pixel-backing]').check();
  await buildTab.click();
  await palette.getByRole('button',{name:'Add external tab'}).click();
  const tabProfile=palette.locator('[data-tab-profile="0"]');
  await tabProfile.selectOption('Counterbore');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.backingTabs?.[0]?.profile==='Counterbore');
  const tabDepth=palette.locator('[data-tab-recess=recessDepth]');
  const savedTab=await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
  await tabDepth.fill('3');await tabDepth.press('Tab');
  await page.locator('#smsModelError').getByText(/Tab 1 recess needs continuous underside stock/).waitFor();
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),savedTab);
  assert.equal(Number(await tabDepth.inputValue()),1.4);
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  const thickness=palette.getByLabel('Fitting backing thickness (mm)');
  await thickness.fill('8');await thickness.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelBackingThickness===8);
  await buildTab.click();
  await tabDepth.fill('3');await tabDepth.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.backingTabs[0].recessDepth===3);
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  await thickness.fill('4');await thickness.press('Tab');
  await page.locator('#smsModelError').getByText(/Tab 1 recess needs continuous underside stock/).waitFor();
  assert.equal(Number(await thickness.inputValue()),8);
  assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelBackingThickness),8);
  await printTab.click();
  await job.getByText('Stale',{exact:true}).waitFor();
  await job.locator('[data-job-prepare]').click();
  await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  assert((await useDownload(job.locator('[data-job-stl]'))).bytes.length>84);
  assert(zipEntries((await useDownload(job.locator('[data-job-3mf]'))).bytes).has('3D/3dmodel.model'));
  const original=await page.evaluate(()=>window.__sensoryStudio.currentModel);
  const modelState=()=>page.evaluate(()=>window.__sensoryStudio.currentModel);
  await page.locator('#smsLibrary').click();
  await page.locator('#smsLibraryAll').click();
  const projectCard=page.locator('#smsProjectModels article').filter({has:page.getByRole('heading',{name:witness,exact:true})}).first();
  await projectCard.getByRole('button',{name:'Save to library',exact:true}).click();
  const libraryCard=page.locator('#smsSavedModels article').filter({has:page.getByRole('heading',{name:witness,exact:true})});
  await libraryCard.getByRole('button',{name:'Linked copy',exact:true}).click();
  const linked=await modelState();
  assert.equal(linked.link.revision,1);
  assert.deepEqual(linked.build,original.build);
  await buildTab.click();
  assert(await tabProfile.isDisabled());
  await page.locator('#smsLibrary').click();
  await libraryCard.getByRole('button',{name:'Independent copy',exact:true}).click();
  const independent=await modelState();
  assert.equal(independent.link,null);
  assert.deepEqual(independent.build,original.build);
  await buildTab.click();
  await tabDepth.fill('2.75');await tabDepth.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.backingTabs[0].recessDepth===2.75);
  await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
  const copies=await page.evaluate(ids=>Object.fromEntries(window.__sensoryStudio.project.models
   .filter(model=>ids.includes(model.id)).map(model=>[model.id,model.build.backingTabs[0].recessDepth])),
   [original.id,linked.id,independent.id]);
  assert.deepEqual(copies,{[original.id]:3,[linked.id]:3,[independent.id]:2.75});
  await page.locator('#model-tab-'+original.id).click();
  await buildTab.click();
  await page.getByRole('button',{name:'Render actual model',exact:true}).click();
  const originalInspector=page.locator('#smsLightInspector');
  await originalInspector.getByText(/Prepared manufacturing mesh/).waitFor({timeout:120000});
  await originalInspector.getByLabel('Cut section').check();
  await tabDepth.fill('3.25');await tabDepth.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.backingTabs[0].recessDepth===3.25);
  await originalInspector.getByText(/Preview only/).waitFor();
  assert(await originalInspector.getByRole('slider').isHidden());
  await page.locator('#smsGlobalUndo').click();
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.backingTabs[0].recessDepth===3);
  assert.equal(Number(await tabDepth.inputValue()),3);
  await page.locator('#smsGlobalRedo').click();
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.backingTabs[0].recessDepth===3.25);
  assert.equal(Number(await tabDepth.inputValue()),3.25);
  await printTab.click();
  await job.getByText('Stale',{exact:true}).waitFor();
  assert(await job.locator('[data-job-stl]').isDisabled());
  assert(await job.locator('[data-job-3mf]').isDisabled());
  await page.locator('#smsLibrary').click();
  await projectCard.getByRole('button',{name:'Save to library',exact:true}).click();
  await page.locator('#model-tab-'+linked.id).click();
  assert.equal((await modelState()).build.backingTabs[0].recessDepth,3);
  await page.getByRole('button',{name:'Accept library revision 2'}).click();
  assert.equal((await modelState()).link.revision,2);
  assert.equal((await modelState()).build.backingTabs[0].recessDepth,3.25);
  assert.equal(await page.evaluate(id=>window.__sensoryStudio.project.models.find(model=>model.id===id)
   .build.backingTabs[0].recessDepth,independent.id),2.75);
  await printTab.click();
  await page.getByRole('button',{name:'Prepare current model',exact:true}).click();
  const linkedJobId=await page.evaluate(id=>window.__sensoryStudio.project.printJobs.find(item=>item.modelId===id).id,linked.id);
  const linkedJob=page.locator('[data-print-job="'+linkedJobId+'"]');
  await linkedJob.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const linkedSTL=await useDownload(linkedJob.locator('[data-job-stl]'));
  const linkedMF=await useDownload(linkedJob.locator('[data-job-3mf]'));
  await buildTab.click();
  await page.getByRole('button',{name:'Render actual model',exact:true}).click();
  const inspector=page.locator('#smsLightInspector');
  await inspector.getByText('Prepared manufacturing mesh', {exact:false}).waitFor();
  const ranges=await sectionRanges(inspector);
  const position=inspector.getByRole('slider');
  const {sectionX,viewportMesh}=await renderedXSection(inspector,topMount.x);
  const sectionMaterial=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  const profileAt=geometry=>{
   const mesh=new THREE.Mesh(geometry,sectionMaterial);
   return [8,9.3,9.9].map(height=>[-1,1].map(sign=>new THREE.Raycaster(
    new THREE.Vector3(sectionX,-topMount.z,height),new THREE.Vector3(0,sign,0)).intersectObject(mesh)[0]?.distance));
  };
  const expectedProfile=profileAt(viewportMesh).flat();
  assert(expectedProfile.every(Number.isFinite),'The visible cutaway contains the top pilot and taper walls');
  viewportMesh.dispose();
  for(const geometry of [new STLLoader().parse(Uint8Array.from(linkedSTL.bytes).buffer),
   read3MFGeometry(zipEntries(linkedMF.bytes).get('3D/3dmodel.model').toString())]){
   assertSectionBounds(geometry,ranges,'Linked Gear');
   const profile=profileAt(geometry).flat();
   assert(profile.every((value,index)=>Math.abs(value-expectedProfile[index])<.01),
    'The exported pilot and taper walls match the visible cutaway at the same X plane');
   geometry.dispose();
  }
  sectionMaterial.dispose();
  const inspected=await modelState();
  await position.press('ArrowRight');
  assert.deepEqual(await modelState(),inspected);
  await inspector.getByRole('button',{name:'Close inspection'}).click();
  await page.locator('#model-tab-'+original.id).click();
  await printTab.click();
  const originalJobId=await page.evaluate(id=>window.__sensoryStudio.project.printJobs.find(item=>item.modelId===id).id,original.id);
  const originalJob=page.locator('[data-print-job="'+originalJobId+'"]');
  await originalJob.locator('[data-job-prepare]').click();
  await originalJob.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  await verifyTabRemovalBounds(witness,palette,{jobId:originalJobId,tab:1});
 }
 {
  await page.evaluate(()=>window.__sensoryStudio.addModel('waves',{width:100,depth:70,thickness:2,amplitude:1,variation:0},'Thin fixing witness'));
  await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
  const mounting=page.locator('[data-build=mounting]');
  await mounting.evaluate(node=>{for(let p=node.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
  await mounting.check();
  const beforeFixing=await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
  const profile=page.locator('[data-build=mountStyle]');
  await profile.selectOption('Underside countersinks');
  await page.locator('#smsModelError').getByText(/needs continuous underside stock/).waitFor();
  assert.equal(await profile.inputValue(),'Through holes');
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),beforeFixing);
 }
 // FAB-02: conical native underside roofs preserve the measured bore and reject insufficient stock.
 for(const thickness of [13,18]){
  const name='Conical Gear '+thickness;
  await page.evaluate(({name,thickness})=>window.__sensoryStudio.addModel('gears',{mode:'Decorative',
   wheelStyle:'Rounded lobes',webStyle:'Solid',diameter:100,thickness,bore:0,reliefStyle:'None',dualMaterial:false},name),{name,thickness});
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  const palette=page.locator('.sms-palette');
  await palette.locator('[data-fit-profile=seed]').click();
  await page.locator('[data-view=bottom]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  await palette.getByRole('button',{name:'Place shaped socket in 3D'}).click();
  const target=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(0,0,'underside'));
  assert(target);await page.mouse.click(target.x,target.y);
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===1);
  await page.keyboard.press('Escape');
  const control=palette.getByLabel('Conical socket roof');
  const before=await page.evaluate(()=>window.__sensoryStudio.currentModel);
  await control.click();
  if(thickness===13){
   await page.locator('#smsModelError').getByText(/needs .* mm of stock for its socket and roof/).waitFor();
   assert.equal(await control.isChecked(),false);
   assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel),before);
   continue;
  }
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].conical===true);
  const acceptedCone=await page.evaluate(()=>window.__sensoryStudio.currentModel);
  const measuredDiameter=palette.getByLabel('Measured body diameter (mm)');
  await measuredDiameter.fill('20');await measuredDiameter.press('Tab');
  await page.locator('#smsModelError').getByText(/needs .* mm of stock for its socket and roof/).waitFor();
  assert.equal(Number(await measuredDiameter.inputValue()),before.build.pixelHoles[0].diameter);
  assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel),acceptedCone);
  await palette.getByRole('button',{name:'Create / edit pixel profile'}).click();
  assert(await page.locator('#routeSpecimenConical').isChecked());
  assert.equal(Number(await page.locator('#pixelSocketClearance').inputValue()),before.build.pixelHoles[0].clearance);
  const couponSTL=await useDownload(page.locator('#routeSpecimenSTL'));
  const couponMF=await useDownload(page.locator('#routeSpecimen3MF'));
  await page.locator('#closePixelProfileBtn').click();
  for(const geometry of [new STLLoader().parse(Uint8Array.from(couponSTL.bytes).buffer),
   read3MFGeometry(zipEntries(couponMF.bytes).get('3D/3dmodel.model').toString())]){
   const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),mesh=new THREE.Mesh(geometry,material);
   const apex=new THREE.Raycaster(new THREE.Vector3(-15,0,-1),new THREE.Vector3(0,0,1)).intersectObject(mesh)[0]?.point.z;
   const installed=before.build.pixelHoles[0];
   assert(Math.abs(apex-installed.socketProfile.bodyHeight-(installed.diameter+installed.clearance)/2)<.01);
   geometry.dispose();material.dispose();
  }
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  await page.getByRole('button',{name:'Prepare current model',exact:true}).click();
  const job=page.locator('#smsJobs article').filter({hasText:name});
  await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const stl=await useDownload(job.locator('[data-job-stl]'));
  const mf=await useDownload(job.locator('[data-job-3mf]'));
  const {x,z,diameter,clearance,socketProfile}=before.build.pixelHoles[0];
  const radius=(diameter+clearance)/2,material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  for(const geometry of [new STLLoader().parse(Uint8Array.from(stl.bytes).buffer),
   read3MFGeometry(zipEntries(mf.bytes).get('3D/3dmodel.model').toString())]){
   const mesh=new THREE.Mesh(geometry,material);
   const ray=(height,dy,dz)=>new THREE.Raycaster(new THREE.Vector3(x,-z,height),
    new THREE.Vector3(0,dy,dz)).intersectObject(mesh)[0];
   const apex=ray(-1,0,1).point.z;
   assert(Math.abs(apex-socketProfile.bodyHeight-radius)<.01);
   assert(Math.abs(ray(6,1,0).distance+ray(6,-1,0).distance-2*radius)<.01);
   assert(Math.abs(ray(10,1,0).distance+ray(10,-1,0).distance-2*(radius-1))<.01);
   geometry.dispose();
  }
  material.dispose();
 }
 // The underside shoulder control updates the physical overlay and both print files.
 {
  const name='Tapered Gear socket';
  await page.evaluate(name=>window.__sensoryStudio.addModel('gears',{mode:'Decorative',
   wheelStyle:'Rounded lobes',webStyle:'Solid',diameter:100,thickness:25,bore:0,reliefStyle:'None',dualMaterial:false},name),name);
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  const palette=page.locator('.sms-palette');
  await palette.locator('[data-fit-profile=bullet]').click();
  await page.locator('[data-view=bottom]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  await palette.getByRole('button',{name:'Place shaped socket in 3D'}).click();
  const target=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(0,0,'underside'));
  assert(target);await page.mouse.click(target.x,target.y);
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===1);
  await page.keyboard.press('Escape');
  const checkbox=palette.getByRole('checkbox',{name:'Support-Free Shoulders'});
  assert.equal(await checkbox.isChecked(),false);
  const preview=palette.locator('[data-native-fit-preview-status]');
  await palette.getByRole('checkbox',{name:'Show physical pixels and socket cutters'}).check();
  await preview.getByText(/insertion 18\.00 mm/).waitFor();
  await checkbox.click();
  const angle=palette.getByLabel('Shoulder angle from horizontal (°)');
  await angle.waitFor();
  assert.equal(await angle.inputValue(),'45');
  await preview.getByText(/insertion 18\.50 mm/).waitFor();
  await angle.fill('61');await angle.press('Tab');
  assert.equal(await angle.inputValue(),'45');
  await angle.fill('60');await angle.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].shoulderAngle===60);
  await preview.getByText(/insertion 18\.87 mm/).waitFor();
  const hole=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0]);
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  await page.getByRole('button',{name:'Prepare current model',exact:true}).click();
  const job=page.locator('#smsJobs article').filter({hasText:name});
  await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const stl=await useDownload(job.locator('[data-job-stl]'));
  const mf=await useDownload(job.locator('[data-job-3mf]'));
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  for(const geometry of [new STLLoader().parse(Uint8Array.from(stl.bytes).buffer),
   read3MFGeometry(zipEntries(mf.bytes).get('3D/3dmodel.model').toString())]){
   const mesh=new THREE.Mesh(geometry,material),rise=Math.sqrt(3)/2;
   const hit=(height,y,z)=>new THREE.Raycaster(new THREE.Vector3(hole.x,-hole.z,height),
    new THREE.Vector3(0,y,z)).intersectObject(mesh)[0];
   assert(Math.abs(hit(-1,0,1).point.z-18-rise)<.01);
   for(const [height,diameter] of [[.5,13],[1.5+rise/2,12.5],[3,12]]){
    const width=hit(height,1,0).distance+hit(height,-1,0).distance;
    assert(Math.abs(width-diameter-hole.clearance)<.015,'Exported taper section at '+height+' mm');
   }
   geometry.dispose();
  }
  material.dispose();
 }
 // FAB-01: validate a bent underside vault before saving and measure the print files.
 {
  const name='Vaulted underside Tile';
  await page.evaluate(name=>window.__sensoryStudio.addModel('tactile-tiles',{
   width:100,depth:80,thickness:12,outline:'square',relief:2,pattern:'terraces',dualMaterial:false
  },name),name);
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  const palette=page.locator('.sms-palette');
  await palette.locator('[data-fit-profile=seed]').click();
  await page.locator('[data-view=bottom]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  await palette.getByRole('button',{name:'Place LED fitting in 3D'}).click();
  for(const [i,x] of [-15,15].entries()){
   const target=await page.evaluate(x=>window.__sensoryStudio.fittingPointScreen(x,0,'underside'),x);
   assert(target);await page.mouse.click(target.x,target.y);
   await page.waitForFunction(count=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===count,i+1);
  }
  await page.keyboard.press('Escape');
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  const serial=palette.getByRole('group',{name:'Serial LED string'});
  await serial.getByRole('button',{name:'Pin automatic IN opening'}).click();
  const edge=serial.getByLabel('IN perimeter position (%)');
  const automatic=Number(await edge.inputValue()),offset=(automatic+98)%100;
  await edge.fill(String(offset));await edge.press('Tab');
  await serial.getByLabel('Cut serial channels').check();
  await serial.getByText('Channels ready for preparation.').waitFor();
  await serial.getByLabel('Vault wire-track roofs for underside-down printing').click();
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.serialRouting.vaulted===true);
  assert.equal(await serial.getByLabel('Vault wire-track roofs for underside-down printing').isChecked(),true);
  const accepted=await page.evaluate(()=>window.__sensoryStudio.currentModel);
  await edge.fill(String((offset+50)%100));await edge.press('Tab');
  await page.locator('#smsModelError').getByText(/Chosen IN edge|Chosen OUT edge|Cable budget exceeded|No safe tangent|channel approaches/i).waitFor();
  assert.equal(Number(await edge.inputValue()),offset);
  assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel),accepted);
  const width=serial.getByLabel('Requested wire-track width (mm)');
  await width.fill('5');await width.press('Tab');
  await page.locator('#smsModelError').getByText(/Channels cross or leave insufficient web/).waitFor();
  assert.equal(Number(await width.inputValue()),3.2);
  assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel),accepted);
  await width.fill('4');await width.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.serialRouting.channelWidthMm===4);
  const validEdge=offset+.3;
  await edge.fill(String(validEdge));await edge.press('Tab');
  await page.waitForFunction(value=>window.__sensoryStudio.currentModel.build.serialRouting.inEdgePercent===value,validEdge);
  const tail=serial.getByLabel('IN tail limit (mm)');
  await tail.fill('150');await tail.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.serialRouting.inTail===150);
  const reverse=serial.getByRole('button',{name:'Reverse pixel order and wiring'});
  await reverse.click();
  await page.waitForFunction(value=>window.__sensoryStudio.currentModel.build.serialRouting.outEdgePercent===value,validEdge);
  const reversedRoute=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.serialRouting);
  assert.equal(reversedRoute.inEdgePercent,null);
  assert.equal(reversedRoute.inTail,200);
  assert.equal(reversedRoute.outTail,150);
  await reverse.click();
  await page.waitForFunction(value=>window.__sensoryStudio.currentModel.build.serialRouting.inEdgePercent===value,validEdge);
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  await page.getByRole('button',{name:'Prepare current model',exact:true}).click();
  const job=page.locator('#smsJobs article').filter({hasText:name});
  await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const stl=await useDownload(job.locator('[data-job-stl]'));
  const mf=await useDownload(job.locator('[data-job-3mf]'));
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  for(const geometry of [new STLLoader().parse(Uint8Array.from(stl.bytes).buffer),
   read3MFGeometry(zipEntries(mf.bytes).get('3D/3dmodel.model').toString())]){
   const mesh=new THREE.Mesh(geometry,material);
   const section=height=>[-1,1].reduce((sum,sign)=>sum+new THREE.Raycaster(
    new THREE.Vector3(0,0,height),new THREE.Vector3(0,sign,0)).intersectObject(mesh)[0].distance,0);
   assert(Math.abs(section(1)-4)<.02);
   assert(Math.abs(section(2.8)-2.2)<.02);
   geometry.dispose();
  }
  material.dispose();
  const buildTab=page.locator('.sms-workspace-nav [data-workspace=wiring]');
  const printTab=page.locator('.sms-workspace-nav [data-tab=print]');
  await buildTab.click();
  await edge.fill('');await edge.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.serialRouting.inEdgePercent===null);
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  for(const [i,label] of ['P1','P2'].entries()){
   await palette.getByRole('button',{name:label,exact:true}).click();
   const diameter=palette.getByLabel('Measured body diameter (mm)');
   await diameter.fill('8');await diameter.press('Tab');
   await page.waitForFunction(i=>window.__sensoryStudio.currentModel.build.pixelHoles[i].diameter===8,i);
  }
  await buildTab.click();
  await width.fill('6');await width.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.serialRouting.channelWidthMm===6);
  await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
  await page.reload();
  await page.waitForFunction(()=>window.__sensoryStudio?.currentModel?.build.serialRouting.channelWidthMm===6);
  await printTab.click();
  await job.getByText('Stale',{exact:true}).waitFor();
  assert(await job.locator('[data-job-stl]').isDisabled());
  assert(await job.locator('[data-job-3mf]').isDisabled());
  await job.locator('[data-job-prepare]').click();
  await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const wideSTL=await useDownload(job.locator('[data-job-stl]'));
  const wideMF=await useDownload(job.locator('[data-job-3mf]'));
  const wideMaterial=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  for(const geometry of [new STLLoader().parse(Uint8Array.from(wideSTL.bytes).buffer),
   read3MFGeometry(zipEntries(wideMF.bytes).get('3D/3dmodel.model').toString())]){
   const mesh=new THREE.Mesh(geometry,wideMaterial);
   for(const y of [-2.85,0,2.85]){
    const opening=new THREE.Raycaster(new THREE.Vector3(-51,y,1.5),new THREE.Vector3(1,0,0),0,102);
    assert.equal(opening.intersectObject(mesh).length,0,'The wide lower track clears both bores and exterior apertures');
   }
   for(const x of [-49.9,0,49.9]){
    const width=[-1,1].reduce((sum,sign)=>sum+new THREE.Raycaster(
     new THREE.Vector3(x,0,1.5),new THREE.Vector3(0,sign,0)).intersectObject(mesh)[0].distance,0);
    assert(Math.abs(width-6)<.02);
   }
   geometry.dispose();
  }
  wideMaterial.dispose();
 }
 // DIM-03/CAL-01: change the fitted bore and retention independently on a measured flanged Gear socket.
 {
  const name='Gear independent socket calibration',profileName='Measured flanged calibration profile';
  await page.evaluate(name=>window.__sensoryStudio.addModel('gears',{mode:'Decorative',wheelStyle:'Rounded lobes',
   webStyle:'Solid',diameter:100,thickness:18,bore:0,reliefStyle:'None',dualMaterial:false},name),name);
  const buildTab=page.locator('.sms-workspace-nav [data-workspace=pixels]');
  const printTab=page.locator('.sms-workspace-nav [data-tab=print]');
  await buildTab.click();
  const palette=page.locator('.sms-palette');
  await palette.locator('[data-fit-profile=seed]').click();
  await palette.getByRole('button',{name:'Create / edit pixel profile'}).click();
  await page.locator('#pixelKind').selectOption('gumdrop');
  for(const [id,value] of Object.entries({pixelName:profileName,pixelBodyDiameter:'8',pixelBodyHeight:'9',
   pixelFlangeDiameter:'9',pixelFlangeHeight:'1.2',pixelCapHeight:'1.2',pixelWireWidth:'2.4',pixelWireDepth:'1.6',pixelSocketClearance:'.3'}))
   await page.locator('#'+id).fill(value);
  await page.locator('#applyPixelSocketFit').click();
  await palette.getByRole('button',{name:new RegExp(profileName)}).click();
  await page.locator('[data-view=bottom]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  await palette.getByRole('button',{name:'Place shaped socket in 3D'}).click();
  const target=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(0,0,'underside'));
  assert(target);await page.mouse.click(target.x,target.y);
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===1);
  await page.keyboard.press('Escape');
  const hole=()=>page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0]);
  const original=await hole();
  const job=page.locator('#smsJobs article').filter({hasText:name});
  const measure=async expected=>{
   await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
   const stl=await useDownload(job.locator('[data-job-stl]'));
   const mf=await useDownload(job.locator('[data-job-3mf]'));
   for(const geometry of [new STLLoader().parse(Uint8Array.from(stl.bytes).buffer),
    read3MFGeometry(zipEntries(mf.bytes).get('3D/3dmodel.model').toString())]){
    const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),mesh=new THREE.Mesh(geometry,material);
    const rays=(z,dy,dz)=>new THREE.Raycaster(new THREE.Vector3(original.x,-original.z,z),
     new THREE.Vector3(0,dy,dz)).intersectObject(mesh)[0];
    const boreAt=z=>rays(z,1,0).distance+rays(z,-1,0).distance;
    for(const [index,height] of [.7,2.8,5].entries())assert(Math.abs(boreAt(height)-expected[index])<.02);
    assert(Math.abs(rays(-1,0,1).point.z-9)<.01);
    geometry.dispose();material.dispose();
   }
  };
  await printTab.click();
  await page.getByRole('button',{name:'Prepare current model',exact:true}).click();
  await measure([9.3,8.3,8.3]);
  await buildTab.click();
  const clearance=palette.getByLabel('Diameter clearance (mm)');
  await clearance.fill('.6');await clearance.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].clearance===.6);
  await printTab.click();
  await job.getByText('Stale',{exact:true}).waitFor();
  assert(await job.locator('[data-job-stl]').isDisabled());
  await job.locator('[data-job-prepare]').click();
  await measure([9.6,8.6,8.6]);
  await buildTab.click();
  const retention=palette.getByLabel('Retention lip (mm)');
  await retention.fill('.4');await retention.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].socketProfile.retentionLip===.4);
  assert.deepEqual((await hole()).socketProfile,{...original.socketProfile,retentionLip:.4});
  await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
  await page.reload();
  await page.waitForFunction(()=>window.__sensoryStudio?.currentModel?.build.pixelHoles?.[0]?.socketProfile.retentionLip===.4);
  await printTab.click();
  await job.getByText('Stale',{exact:true}).waitFor();
  assert(await job.locator('[data-job-3mf]').isDisabled());
  await job.locator('[data-job-prepare]').click();
  await measure([9.6,7.8,8.6]);
 }
 // FIT-01/FIT-03: place and route directly on planar Tile walls.
 for(const [view,axis,sign,distance,halfSpan] of [['back',1,1,40,50],['left',0,-1,50,40],['right',0,1,50,40]]){
  const name='Routed Tile '+view;
  await page.evaluate(name=>window.__sensoryStudio.addModel('tactile-tiles',{width:100,depth:80,thickness:20,
   outline:'square',relief:2,pattern:'terraces',dualMaterial:false},name),name);
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  await page.locator('[data-view='+view+']').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  const palette=page.locator('.sms-palette');
  await palette.locator('[data-fit-profile=seed]').click();
  await palette.getByRole('button',{name:'Place shaped socket in 3D'}).click();
  const canvas=await page.locator('#viewport canvas').boundingBox();
  const {camera,target}=await page.evaluate(()=>window.__crystalForgeViewMetrics());
  const projection=new THREE.PerspectiveCamera(46,canvas.width/canvas.height,.1,5000);
  projection.position.fromArray(camera);projection.lookAt(new THREE.Vector3(...target));projection.updateMatrixWorld();
  for(const [i,along] of [-15,15].entries()){
   const point=new THREE.Vector3(...(axis===1?[-along,10,-distance]:[sign*distance,10,-sign*along])).project(projection);
   await page.mouse.click(canvas.x+(point.x+1)*canvas.width/2,canvas.y+(1-point.y)*canvas.height/2);
   await page.waitForFunction(count=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===count,i+1);
  }
  await page.keyboard.press('Escape');
  const holes=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles);
  const modelAxis=axis===1?'z':'x',modelSign=axis===1?-1:sign,normalIndex=axis===1?2:0;
  assert(holes.every(hole=>Math.abs(hole[modelAxis]-modelSign*distance)<.01&&
   Math.abs(hole.surface.normal[normalIndex]-modelSign)<.00001),JSON.stringify(holes));
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  const serial=palette.getByRole('group',{name:'Serial LED string'});
  await serial.getByLabel('Cut serial channels').check();
  await serial.getByText('Channels ready for preparation.').waitFor();
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  await page.getByRole('button',{name:'Prepare current model',exact:true}).click();
  const job=page.locator('#smsJobs article').filter({hasText:name});
  await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const stl=await useDownload(job.locator('[data-job-stl]'));
  const mf=await useDownload(job.locator('[data-job-3mf]'));
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),height=holes[0].surface.y;
  for(const geometry of [new STLLoader().parse(Uint8Array.from(stl.bytes).buffer),
   read3MFGeometry(zipEntries(mf.bytes).get('3D/3dmodel.model').toString())]){
   const mesh=new THREE.Mesh(geometry,material);
   const hit=(origin,direction,far=Infinity)=>new THREE.Raycaster(
    new THREE.Vector3(...origin),new THREE.Vector3(...direction),0,far).intersectObject(mesh)[0]?.point;
   const point=(along,outward)=>axis===0?[sign*(distance+outward),along,height]:[along,sign*(distance+outward),height];
   const inward=axis===0?[-sign,0,0]:[0,-sign,0];
   for(const along of [5-halfSpan,0,halfSpan-5]){
    const middle=point(along,-1);
    const bottom=hit(middle,[0,0,-1]),top=hit(middle,[0,0,1]);
    assert(bottom&&top&&Math.abs(top.z-bottom.z-3.2)<.02,JSON.stringify({view,along,bottom,top,height}));
    const floor=hit(point(along,1),inward);
    assert(floor&&Math.abs(floor.getComponent(axis)-sign*(distance-1.8))<.02);
   }
   assert.equal(hit(point(-halfSpan-1,-1),axis===0?[0,1,0]:[1,0,0],2*halfSpan+2),undefined);
   geometry.dispose();
  }
  material.dispose();
 }
 // FIT-03: place two shaped sockets on a measured Wave that varies in both horizontal directions.
 {
  const name='Two-axis routed Wave';
  await page.evaluate(name=>window.__sensoryStudio.addModel('waves',{width:160,depth:100,thickness:15,
   amplitude:1,frequency:.5,variation:.1,direction:12,dualMaterial:false},name),name);
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  await page.locator('[data-view=top]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  const palette=page.locator('.sms-palette');
  await palette.locator('[data-fit-profile=seed]').click();
  await palette.getByRole('button',{name:'Place shaped socket in 3D'}).click();
  for(const [i,x] of [-40,-20].entries()){
   const target=await page.evaluate(x=>window.__sensoryStudio.fittingPointScreen(x,-18,'top'),x);
   assert(target);await page.mouse.click(target.x,target.y);
   await page.waitForFunction(count=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===count,i+1);
  }
  await page.keyboard.press('Escape');
  const holes=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles);
  assert(holes.every(hole=>Math.abs(hole.surface.normal[0])>.001&&Math.abs(hole.surface.normal[2])>.001));
  for(const label of ['P1','P2']){
   await palette.getByRole('button',{name:label,exact:true}).click();
   const rotation=palette.getByLabel('Body rotation (°)');
   await rotation.fill('180');await rotation.press('Tab');
  }
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  const serial=palette.getByRole('group',{name:'Serial LED string'});
  await serial.getByRole('button',{name:'Pin automatic IN opening'}).click();
  const edge=serial.getByLabel('IN perimeter position (%)');
  const originalEdge=Number(await edge.inputValue());
  await edge.fill(String(originalEdge+2));await edge.press('Tab');
  await serial.getByLabel('Cut serial channels').check();
  await serial.getByText('Channels ready for preparation.').waitFor();
  const accepted=await page.evaluate(()=>window.__sensoryStudio.currentModel);
  const minBend=serial.getByLabel('Minimum bend radius (mm)');
  await minBend.fill('60');await minBend.press('Tab');
  await page.locator('#smsModelError').getByText(/Chosen IN edge/).waitFor();
  assert.equal(Number(await minBend.inputValue()),5);
  assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel),accepted);
  await minBend.fill('6');await minBend.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.serialRouting.minBendRadius===6);
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  await page.getByRole('button',{name:'Prepare current model',exact:true}).click();
  const job=page.locator('#smsJobs article').filter({hasText:name});
  await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const stl=await useDownload(job.locator('[data-job-stl]'));
  const mf=await useDownload(job.locator('[data-job-3mf]'));
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  for(const geometry of [new STLLoader().parse(Uint8Array.from(stl.bytes).buffer),
   read3MFGeometry(zipEntries(mf.bytes).get('3D/3dmodel.model').toString())]){
   const mesh=new THREE.Mesh(geometry,material);
   const span=[-1,1].reduce((sum,sign)=>sum+new THREE.Raycaster(new THREE.Vector3(0,18,14.5),
    new THREE.Vector3(0,sign,0)).intersectObject(mesh)[0].distance,0);
   assert(Math.abs(span-3.2)<.03);
   const lead=new THREE.Raycaster(new THREE.Vector3(-39,18,14.5),new THREE.Vector3(1,0,0),0,120);
   assert.equal(lead.intersectObject(mesh).length,0);
   geometry.dispose();
  }
  material.dispose();
 }
 // DIM-05: blind hardware pockets retain the stock behind each cut.
 for(const [type,parameters,backing] of [
  ['tactile-tiles',{width:100,depth:80,thickness:6,outline:'square',relief:1,pattern:'terraces',dualMaterial:false}],
  ['gears',{mode:'Decorative',wheelStyle:'Rounded lobes',webStyle:'Solid',diameter:100,thickness:6,bore:0,
   reliefStyle:'None',dualMaterial:false}],
  ['waves',{width:100,depth:80,thickness:8,amplitude:1,dualMaterial:false},true],
  ['characters',{character:'Cloud',construction:'Layered',width:90,depth:8,dualMaterial:false},true],
  ['light-pods',{shellForm:'Beacon',illuminated:false,width:80,depth:68,height:32,dualMaterial:false},true],
  ['control-caps',{controlStyle:'Rotary knob',knobInstallation:'Stationary display',shaft:0,diameter:70,height:19,dualMaterial:false},true]
 ]){
  const name='Blind hardware '+type;
  await page.evaluate(({type,parameters,name})=>window.__sensoryStudio.addModel(type,parameters,name),{type,parameters,name});
  await page.getByRole('searchbox',{name:'Find tools and downloads'}).fill('magnet');
  await page.getByRole('button',{name:/Place mounting hole/}).click();
  await page.waitForFunction(()=>document.activeElement?.matches('[data-place-mount]'));
  await page.locator('[data-view=bottom]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  const palette=page.locator('.sms-palette');
  if(backing){
   await page.locator('.sms-workspace-nav [data-tab=build]').click();
   await palette.locator('[data-pixel-backing]').check();
   const thickness=palette.getByLabel('Fitting backing thickness (mm)');
   await thickness.fill('8');await thickness.press('Tab');
   assert.equal(await thickness.inputValue(),'8');
   await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
  }
  const placementProfile=palette.getByLabel('New mounting profile');
  const place=palette.getByRole('button',{name:'Place mounting hole in 3D'});
  for(const [i,x,kind] of [[0,-20,'Magnet pocket'],[1,20,'Threaded insert pilot']]){
   await placementProfile.selectOption(kind);
   await place.click();
   const point=await page.evaluate(x=>window.__sensoryStudio.fittingPointScreen(x,0,'underside'),x);
   assert(point);await page.mouse.click(point.x,point.y);
   await page.waitForFunction(({i,kind})=>window.__sensoryStudio.currentModel.build.manualMountHoles?.[i]?.profile===kind,{i,kind});
   await page.keyboard.press('Escape');
  }
  await place.click();
  const conflict=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(-15,0,'underside'));
  assert(conflict);await page.mouse.click(conflict.x,conflict.y);
  await page.locator('#smsModelError').getByText(/overlaps|clearance from another/).waitFor();
  assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles.length),2);
  await page.keyboard.press('Escape');
  if(backing){
   await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
   await palette.locator('[data-fit-profile=seed]').click();
   await palette.getByRole('button',{name:'Place LED fitting in 3D'}).click();
   const led=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(0,0,'underside'));
   assert(led);await page.mouse.click(led.x,led.y);
   await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===1);
   await page.keyboard.press('Escape');
   await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
   await placementProfile.selectOption('Magnet pocket');
   await place.click();
   const blocked=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(6,0,'underside'));
   assert(blocked);await page.mouse.click(blocked.x,blocked.y);
   await page.locator('#smsModelError').getByText(/another pixel/).waitFor();
   assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles.length),2);
   await page.keyboard.press('Escape');
  }
  const diameter=palette.getByLabel('Pocket diameter (mm)');
  const depth=palette.getByLabel('Pocket depth (mm)');
  const model=()=>page.evaluate(()=>window.__sensoryStudio.currentModel);
  for(const [index,kind,width,targetDepth] of [[0,'Magnet pocket',6.2,3],[1,'Threaded insert pilot',4.1,4]]){
   await palette.getByRole('button',{name:'M'+(index+1),exact:true}).click();
   assert.equal((await model()).build.manualMountHoles[index].profile,kind);
   const movedX=(await model()).build.manualMountHoles[index].x+1;
   await page.locator('#viewport canvas').press('ArrowRight');
   await page.waitForFunction(({index,movedX})=>window.__sensoryStudio.currentModel.build.manualMountHoles[index].x===movedX,{index,movedX});
   await diameter.fill(String(width));await diameter.press('Tab');
   await page.waitForFunction(({index,width})=>window.__sensoryStudio.currentModel.build.manualMountHoles[index].recessDiameter===width,{index,width});
   if(index===0){
    await depth.fill('3');await depth.press('Tab');
    await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.manualMountHoles[0].recessDepth===3);
    if(!backing){
     const accepted=await model();
     await depth.fill('5.9');await depth.press('Tab');
     await page.locator('#smsModelError').getByText(/M1 magnet pocket needs continuous underside stock/).waitFor();
     assert.equal(Number(await depth.inputValue()),targetDepth);
     assert.deepEqual(await model(),accepted);
    }
   }
  }
  const {build}=await model();
  await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
  await page.reload();
  await page.waitForFunction(name=>window.__sensoryStudio?.currentModel?.name===name,name);
  assert.deepEqual((await model()).build.manualMountHoles,build.manualMountHoles);
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  await page.getByRole('button',{name:'Prepare current model',exact:true}).click();
  const job=page.locator('#smsJobs article').filter({hasText:name});
  await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const stl=await useDownload(job.locator('[data-job-stl]'));
  const mf=await useDownload(job.locator('[data-job-3mf]'));
  for(const geometry of [new STLLoader().parse(Uint8Array.from(stl.bytes).buffer),
   read3MFGeometry(zipEntries(mf.bytes).get('3D/3dmodel.model').toString())]){
   const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),mesh=new THREE.Mesh(geometry,material);
   for(const [index,{x,z,recessDiameter}] of build.manualMountHoles.entries()){
    const ray=(height,dx,dz)=>new THREE.Raycaster(new THREE.Vector3(x,-z,height),new THREE.Vector3(dx,0,dz)).intersectObject(mesh)[0];
    const span=ray(1,-1,0).distance+ray(1,1,0).distance;
    assert(Math.abs(span-recessDiameter)<.01);
    assert(Math.abs(ray(-1,0,1).point.z-[3,4][index])<.01);
   }
   geometry.dispose();material.dispose();
  }
 }
 // WT-023B: isolated legacy v1 workspace, duplicate titles and keyboard folder state.
 {
  const {createProject,createModel,addModel}=await import('../studio-documents.js');
  const activeProject=createProject({id:'active-project',title:'Same name'});
  const savedProject=createProject({id:'other-project',title:'Same name'});
  addModel(activeProject,createModel({id:'shared-model',name:'Active tile',typeId:'tactile-tiles'}));
  addModel(savedProject,createModel({id:'shared-model',name:'Saved tile',typeId:'tactile-tiles'}));
  const first={...savedProject,snapshotId:'version-1'};
  const second={...savedProject,snapshotId:'version-2'};
  const workspace={schemaVersion:1,project:activeProject,savedProjects:[first,second],library:[],legacyTemplates:[]};
  const targetPage=await browser.newPage({viewport:{width:390,height:844}});
  try{
   await targetPage.addInitScript(({key,workspace})=>{
    if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(workspace));
   },{key:WORKSPACE_KEY,workspace});
   await targetPage.goto(url,{waitUntil:'commit'});
   await targetPage.waitForFunction(()=>window.__sensoryStudio,undefined,{timeout:60000});
   const storage=()=>targetPage.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY);
   const modelIds=()=>targetPage.evaluate(()=>window.__sensoryStudio.project.models.map(model=>model.id));
   const openLibrary=()=>targetPage.locator('#smsLibrary').click();
   await openLibrary();
   const folders=targetPage.locator('[data-project-id]');
   assert.equal(await folders.count(),2);
   assert.match(await folders.locator('summary').first().innerText(),/Same name.*Active project/);
   assert.equal(await folders.filter({has:targetPage.locator('[data-snapshot-id="version-1"]')}).locator('[data-snapshot-id]').count(),2);
   assert.equal(await targetPage.locator('#smsBuiltInTemplates button').count(),7);
   assert(await targetPage.locator('#smsTemplateSection').evaluate(section=>section.nextElementSibling.id==='smsProjectsSection'));
   const folder=folders.filter({has:targetPage.locator('[data-snapshot-id="version-1"]')});
   const summary=folder.locator(':scope > summary');
   await summary.press('Enter');
   assert.equal(await folder.evaluate(element=>element.open),false);
   await targetPage.reload({waitUntil:'commit'});
   await targetPage.waitForFunction(()=>window.__sensoryStudio);
   await openLibrary();
   assert.equal(await folder.evaluate(element=>element.open),false);
   await summary.press('Enter');
   await targetPage.screenshot({path:'qa/unified-wt023b-library-narrow.png'});
   targetPage.once('dialog',dialog=>dialog.accept());
   await folder.locator('[data-snapshot-id="version-2"] button').first().press('Enter');
   const switched=JSON.parse(await storage());
   assert.equal(switched.project.id,'other-project');
   assert.deepEqual({...switched.project.models[0],thumbnail:null},second.models[0],
    'Rendering may regenerate the active thumbnail; the saved model and source revision must match.');
   assert.deepEqual(switched.savedProjects.filter(item=>item.snapshotId.startsWith('version-')),[first,second]);
   assert.deepEqual(await modelIds(),['shared-model']);
   await targetPage.reload({waitUntil:'commit'});
   await targetPage.waitForFunction(()=>window.__sensoryStudio?.project.id==='other-project');
  }finally{await targetPage.close();}
 }
 assert.deepEqual(errors,[]);
 console.log('Unified Home, Design, Build, Library and Quick Print screenshots captured.');
}catch(error){
 console.error('Unified browser failure:',error);
 console.error('Unified browser page errors:',errors);
 try{
  await fs.mkdir('qa',{recursive:true});
  await page.screenshot({path:'qa/unified-wt006-failure.png',timeout:3000});
 }catch(screenshotError){
  console.warn('Could not capture unified browser failure screenshot:',screenshotError);
 }
 throw error;
}finally{await browser.close();}
