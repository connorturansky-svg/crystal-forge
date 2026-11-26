import {revealLibraryActions} from './helpers/library-actions.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,
 executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:1440,height:900}});
const page=await context.newPage(),errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
 const url=new URL(process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321');
 url.searchParams.set('layout','legacy');
 await page.goto(url.href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__sensoryStudio,null,{timeout:60000});
 await page.locator('#smsNew').click();
 await page.locator('#smsPicker [data-generator="gears"]').click();
 await page.locator('#smsGearTopEditor').waitFor();
 // Use the same 100 mm solid Gear stock as the manufacturing fixture.
 const setParameter=async(key,value)=>page.locator(`[data-model-param="${key}"]`).evaluate((control,next)=>{
  control.value=next;
  control.dispatchEvent(new Event('input',{bubbles:true}));
  control.dispatchEvent(new Event('change',{bubbles:true}));
 },value);
 await setParameter('diameter','100');
 await setParameter('webStyle','Solid');
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.parameters.diameter===100&&window.__sensoryStudio.currentModel.parameters.webStyle==='Solid');
 assert.match(await page.locator('#smsGearTopHelp').innerText(),/Double-click/);
 await page.locator('#smsAddGearTop').click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.gearTopControls?.length===1);
 const initial=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.gearTopControls[0]);
 assert.equal(initial.kind,'spindle');
 const width=page.locator('[data-gear-top-field="width"]');
 await width.fill('18');await width.press('Tab');
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.gearTopControls[0].width===18);
 await page.locator('[data-gear-top-field="depth"]').fill('12');
 await page.locator('[data-gear-top-field="depth"]').press('Tab');
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.gearTopControls[0].depth===12);
 await page.locator('[data-gear-top-field="height"]').fill('34');
 await page.locator('[data-gear-top-field="height"]').press('Tab');
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.gearTopControls[0].height===34);
 const oldX=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.gearTopControls[0].x);
 await page.locator('[data-gear-top-field="x"]').fill('0');
 await page.locator('[data-gear-top-field="x"]').press('Tab');
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.gearTopControls[0].x),0,
  'Invalid placement remains editable.');
 assert.match(await page.locator('#smsGearTopStatus').innerText(),/Red grip.*shaft bore/);
 await page.locator('[data-gear-top-field="x"]').fill(String(oldX));
 await page.locator('[data-gear-top-field="x"]').press('Tab');
 await page.waitForFunction(()=>!document.getElementById('smsGearTopStatus')?.textContent.includes('Red grip'));
 await page.locator('#smsRemoveGearTop').click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.gearTopControls?.length===0);
 await page.locator('[data-view=top]').click();
 await page.waitForFunction(()=>{
  const {settled,camera,target}=window.__crystalForgeViewMetrics();
  return settled&&camera[1]>target[1]&&Math.hypot(camera[0]-target[0],camera[2]-target[2])<.1;
 });
 const screenAt=async(x,z)=>{
  const point=await page.evaluate(([x,z])=>window.__sensoryStudio.fittingPointScreen(x,z,'top'),[x,z]);
  assert(point,'Expected a raycastable top at '+x+','+z);
  return point;
 };
 const placed=await screenAt(22,0);
 await page.mouse.dblclick(placed.x,placed.y);
 await page.waitForFunction(()=>Math.abs(window.__sensoryStudio.currentModel.build.gearTopControls?.[0]?.x-22)<.5);
 const grip=await screenAt(22,0),target=await screenAt(24,8);
 await page.mouse.move(grip.x,grip.y);
 await page.mouse.down();
 await page.mouse.move(target.x,target.y,{steps:6});
 await page.mouse.up();
 await page.waitForFunction(()=>Math.abs(window.__sensoryStudio.currentModel.build.gearTopControls?.[0]?.z-8)<.5);
 await page.locator('[data-gear-top-field="rotation"]').fill('37');
 await page.locator('[data-gear-top-field="rotation"]').press('Tab');
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.gearTopControls[0].rotation===37);
 await page.locator('#smsRemoveGearTop').click();
 await page.locator('#smsGearTopPreset').selectOption('fluted-knob');
 await page.locator('#smsAddGearTop').click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.gearTopControls?.[0]?.kind==='knob');
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.gearTopControls[0].x),0);
 assert.equal(await page.locator('#smsGearTopSelect option').count(),1);
 await page.locator('#smsUndo').click();
 await page.waitForFunction(()=>!window.__sensoryStudio.currentModel.build.gearTopControls?.length);
 await page.locator('#smsRedo').click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.gearTopControls?.length===1);
 const original=await page.evaluate(()=>{
  const {project,currentModel}=window.__sensoryStudio;
  return {projectId:project.id,modelId:currentModel.id,grips:currentModel.build.gearTopControls};
 });
 await page.locator('#smsDuplicate').press('Enter');
 await page.waitForFunction(id=>window.__sensoryStudio.currentModel.id!==id,original.modelId);
 assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.gearTopControls),original.grips);
 await page.locator('#smsProjectTitle').fill('WT-026 retained grips');
 await page.locator('#smsProjectTitle').press('Tab');
 await page.locator('#smsLibrary').click();
 await page.locator('#smsSaveProject').click();
 const saved=page.locator('#smsSavedProjects [data-snapshot-id]').filter({hasText:'WT-026 retained grips'}).first();
 await saved.waitFor();
 const snapshotId=await saved.getAttribute('data-snapshot-id');
 page.once('dialog',dialog=>dialog.accept('WT-026 grip template'));
 await revealLibraryActions(saved);
 await saved.getByRole('button',{name:'Save as reusable template'}).press('Enter');
 await page.locator('#smsTemplates').press('Enter');
 const template=page.locator('#smsReusableTemplates article').filter({has:page.getByRole('heading',{name:'WT-026 grip template',exact:true})});
 await revealLibraryActions(template);
 const create=template.getByRole('button',{name:'Create project from template',exact:true});
 await create.waitFor();
 page.once('dialog',dialog=>dialog.accept());
 await create.press('Enter');
 await page.waitForFunction(id=>window.__sensoryStudio.project.id!==id,original.projectId);
 const assertRetained=async()=>{
  const models=await page.evaluate(()=>window.__sensoryStudio.project.models.filter(model=>model.generator.typeId==='gears').map(model=>model.build.gearTopControls));
  assert.deepEqual(models,[original.grips,original.grips]);
 };
 await assertRetained();
 await page.reload({waitUntil:'commit'});
 await page.waitForFunction(()=>window.__sensoryStudio);
 await assertRetained();
 await page.locator('#smsLibrary').click();
 await page.locator('#smsLibraryAll').press('Enter');
 page.once('dialog',dialog=>dialog.accept());
 const reopened=page.locator(`[data-snapshot-id="${snapshotId}"]`);
 await revealLibraryActions(reopened);
 await reopened.getByRole('button',{name:'Open project WT-026 retained grips'}).press('Enter');
 await page.waitForFunction(id=>window.__sensoryStudio.project.id===id,original.projectId);
 await assertRetained();
 // Add on a new openwork cog using the old Legacy body structure.
 await page.locator('#smsNew').click();
 await page.locator('#smsPicker [data-generator="gears"]').click();
 await page.locator('#smsGearTopEditor').waitFor();
 await setParameter('diameter','118');
 await setParameter('teeth','20');
 await setParameter('spokes','8');
 await setParameter('webStyle','Legacy');
 await setParameter('wheelStyle','Rounded lobes');
 await setParameter('holeStyle','Oval');
 await setParameter('hub','25');
 await setParameter('bore','14');
 await page.locator('#smsGearTopPreset').selectOption('straight-spindle');
 await page.locator('#smsAddGearTop').click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.gearTopControls?.length===1);
 assert.match(await page.locator('#smsGearTopStatus').innerText(),/Grip added/);
 const openworkGrip=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.gearTopControls[0]);
 await page.locator('#smsRemoveGearTop').click();
 await page.locator('[data-view=top]').click();
 await page.waitForFunction(()=>{const {settled,camera,target}=window.__crystalForgeViewMetrics();return settled&&camera[1]>target[1]&&Math.hypot(camera[0]-target[0],camera[2]-target[2])<.1;});
 const location=await screenAt(openworkGrip.x,openworkGrip.z);
 await page.mouse.dblclick(location.x,location.y);
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.gearTopControls?.length===1);
 assert.match(await page.locator('#smsGearTopStatus').innerText(),/Grip added/);
 // The same grip remains selected when cycling transform modes.
 const gripScreen=await screenAt(openworkGrip.x,openworkGrip.z);
 for(const tool of ['rotate','scale','translate']){
  await page.mouse.dblclick(gripScreen.x,gripScreen.y);
  await page.waitForFunction(mode=>window.__sensoryStudio.gearTransformMode===mode,tool);
  assert.equal(await page.locator('[data-gear-transform="'+tool+'"]').getAttribute('aria-pressed'),'true');
 }
 await page.locator('#smsRemoveGearTop').click();
 const inside=await screenAt(18,0),outside=await screenAt(40,0);
 const u=(28.32-18)/22;
 await page.mouse.dblclick(inside.x+(outside.x-inside.x)*u,inside.y+(outside.y-inside.y)*u);
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.gearTopControls?.length===1);
 assert.match(await page.locator('#smsGearTopStatus').innerText(),/Red grip.*window/);
 assert.equal(errors.length,0,'No uncaught errors: '+errors.join('; '));
 console.log('WT-026 Chromium: exact sizing, rollback, undo/redo, duplication, reusable template, reload and snapshot switching passed.');
}finally{await browser.close();}
