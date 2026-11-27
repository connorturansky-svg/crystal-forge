import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {readBinaryStlTriangles,sliceStlAtZ,radialSectionProfile} from './helpers/print-section-profile.mjs';
import {readCrystal3MfTriangles} from './helpers/three-mf-section-profile.mjs';

const browser=await chromium.launch({headless:true,executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:950},acceptDownloads:true});
 await mkdir('qa',{recursive:true});
 await page.goto(process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321');
 await page.waitForFunction(()=>window.__sensoryStudio);
 await page.evaluate(()=>window.__sensoryStudio.addModel('gears',{mode:'Decorative',wheelStyle:'Rounded lobes',
  webStyle:'Solid',diameter:110,teeth:12,bore:0,thickness:10,reliefStyle:'None',dualMaterial:false},'WT-022 Gear patterns'));
 await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
 const open=async()=>{
  const summary=page.getByText('Uniform mounting patterns',{exact:true});
  if(!await summary.evaluate(element=>element.parentElement.open))await summary.click();
 };
 const field=key=>page.locator('[data-pattern-field="'+key+'"]');
 const apply=page.locator('[data-pattern-apply]');
 const read=()=>page.evaluate(()=>window.__sensoryStudio.currentModel.build);
 const checkDownloads=async(name,mounts,height,radius)=>{
  await page.locator('#smsSend:visible, #smsSendCrystal:visible').click();
  const job=page.locator('#smsJobs article').filter({hasText:name});
  await job.locator('[data-job-prepare]').click();
  for(const [format,decode] of [['stl',readBinaryStlTriangles],['3mf',readCrystal3MfTriangles]]){
   const button=job.locator('[data-job-'+format+']');
   await page.waitForFunction(format=>[...document.querySelectorAll('#smsJobs [data-job-'+format+']')]
    .some(button=>!button.disabled),format,{timeout:120000});
   const [download]=await Promise.all([page.waitForEvent('download'),button.click()]);
   const section=sliceStlAtZ(decode(await readFile(await download.path())),height);
   for(const {x,z} of mounts){
    const profile=radialSectionProfile(section,{center:[x,-z],minRadius:radius-.1,maxRadius:radius+.1});
    assert(profile?.matchingSegments>=16&&Math.abs(profile.medianRadius-radius)<.04,name+' '+format+' hole section');
   }
  }
 };
 const dragDraft=async field=>{
  await page.locator('[data-view=top]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  const centre=page.getByRole('button',{name:'Move mounting pattern centre'});
  await centre.waitFor();
  const rect=await centre.boundingBox(),x=rect.x+rect.width/2,y=rect.y+rect.height/2;
  const oldX=Number(await field('offsetX').inputValue()),oldZ=Number(await field('offsetZ').inputValue());
  await page.mouse.move(x,y);await page.mouse.down();
  await page.mouse.move(x+18,y+14,{steps:6});await page.mouse.up();
  const displacement=Math.hypot(Number(await field('offsetX').inputValue())-oldX,Number(await field('offsetZ').inputValue())-oldZ);
  assert(displacement>1,'Dragging moves the entire draft in model-space millimetres');
  await field('offsetX').fill(String(oldX));await field('offsetZ').fill(String(oldZ));
 };
 await open();
 await field('kind').selectOption('circle');
 await field('count').fill('8');
 await field('radiusMm').fill('30');
 await field('startAngleDeg').fill('22.5');
 await field('alignment').selectOption('custom');
 await field('offsetX').fill('7');
 await field('offsetZ').fill('-4');
 await field('profile').selectOption('Magnet pocket');
 await field('recessDiameter').fill('6');
 await field('recessDepth').fill('3');
 await dragDraft(field);
 await page.screenshot({path:'qa/wt022-gear-pattern.png'});
 assert.equal((await read()).manualMountHoles?.length??0,0);
 await apply.click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.mountingPatterns?.length===1);
 const before=await read(),id=before.mountingPatterns[0].id;
 assert.equal(before.manualMountHoles.length,8);
 await open();
 await page.locator('[data-pattern-select]').selectOption(id);
 await field('radiusMm').fill('4');
 assert(await apply.isDisabled());
 assert.equal((await read()).mountingPatterns[0].radiusMm,30);
 await field('radiusMm').fill('32');
 await apply.click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.mountingPatterns?.[0]?.radiusMm===32);
 const edited=await read();
 assert.deepEqual(edited.manualMountHoles.map(hole=>hole.id),before.manualMountHoles.map(hole=>hole.id));
 assert.notEqual(edited.manualMountHoles[0].x,before.manualMountHoles[0].x);
 await page.locator('#smsGlobalUndo').click();
 assert.deepEqual((await read()).manualMountHoles,before.manualMountHoles);
 await page.locator('#smsGlobalRedo').click();
 assert.deepEqual((await read()).manualMountHoles,edited.manualMountHoles);
 await open();
 await page.locator('[data-pattern-select]').selectOption(id);
 await page.getByRole('button',{name:'Ungroup',exact:true}).click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.mountingPatterns?.length===0);
 assert.deepEqual((await read()).manualMountHoles,edited.manualMountHoles);
 console.log('WT-022 Gear: validated eight pockets, atomic rejection, stable group editing and exact ungrouping passed');

 for(const family of ['tactile-tiles','gears','waves','control-caps','characters','light-pods']){
  await page.evaluate(family=>window.__sensoryStudio.addModel(family,{
   dualMaterial:false,
   ...(family==='light-pods'?{shellForm:'Beacon',illuminated:false,width:80,depth:68,height:32}:{}),
   ...(family==='control-caps'?{top:'Flat',shaft:0,symbol:'None'}:{})
  },'WT-022 '+family),family);
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  const backing=page.locator('[data-pixel-backing]');
  await backing.evaluate(element=>{
   for(let node=element.parentElement;node;node=node.parentElement)
    if(node.tagName==='DETAILS')node.open=true;
  });
  await backing.check();
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelBacking);
  await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
  await open();
  await field('alignment').selectOption('custom');
  const offset=await page.evaluate(()=>{
   const {registry,currentModel:model}=window.__sensoryStudio;
   const {depth}=registry.get(model.generator.typeId).recipe(model.parameters).bounds;
   return depth/2+6;
  });
  await field('offsetZ').fill(String(offset));
  await field('pitchMm').fill('12');
  await field('diameter').fill('2');
  assert(!await apply.isDisabled(),family+' '+await page.locator('[data-pattern-preview]').innerText());
  await apply.click();
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.manualMountHoles?.length===2);
  const stored=(await read()).mountingPatterns[0];
  for(const kind of ['circle','grid']){
   await open();
   await page.locator('[data-pattern-select]').selectOption(stored.id);
   await field('kind').selectOption(kind);
   if(kind==='circle'){
    await field('count').fill('4');await field('radiusMm').fill('3.8');
   }else{
    await field('pitchXmm').fill('10');await field('pitchZmm').fill('7.6');
   }
   assert(!await apply.isDisabled(),family+' '+await page.locator('[data-pattern-preview]').innerText());
   await apply.click();
   await page.waitForFunction(kind=>window.__sensoryStudio.currentModel.build.mountingPatterns?.[0]?.kind===kind,kind);
   assert.equal((await read()).manualMountHoles.length,4);
  }
  await checkDownloads('WT-022 '+family,(await read()).manualMountHoles,1.5,1);
  console.log('WT-022 '+family+': applied three layouts and measured bundled grid holes in both downloads');
 }

 const crystalName='WT-022 Crystal magnet pattern';
 await page.evaluate(name=>window.__sensoryStudio.addModel('crystals',{
  seed:42,count:5,width:100,height:90,baseType:'integrated',baseStyle:'Square',baseWidth:42,
  baseHeight:15,baseDome:0,cutSockets:false,lightingMode:'none',mount:'Magnet inserts',
  mountPlacement:'manual',manualMountHoles:[]
 },name),crystalName);
 await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
 const crystalSummary=page.getByText('Uniform Crystal mounting patterns',{exact:true});
 await page.waitForFunction(()=>document.body.dataset.studioBuildHome==='mounting');
 await crystalSummary.evaluate(element=>{
  for(let node=element.parentElement.parentElement;node;node=node.parentElement)
   if(node.tagName==='DETAILS')node.open=true;
 });
 await crystalSummary.click();
 const crystalField=key=>page.locator('#manualHardwareList [data-pattern-field="'+key+'"]');
 await crystalField('kind').selectOption('circle');
 await crystalField('count').fill('8');
 await crystalField('radiusMm').fill('30');
 await crystalField('startAngleDeg').fill('22.5');
 await crystalField('alignment').selectOption('custom');
 await crystalField('offsetX').fill('7');
 await crystalField('offsetZ').fill('-4');
 await dragDraft(crystalField);
 await page.screenshot({path:'qa/wt022-crystal-pattern.png'});
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.manualMountHoles.length),0);
 await page.locator('#manualHardwareList [data-pattern-apply]').click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.parameters.mountingPatterns?.length===1);
 const crystalMounts=await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.manualMountHoles);
 assert.equal(crystalMounts.length,8);
 assert(crystalMounts.every(mount=>mount.crystalFixing.diameter===10.2&&mount.crystalFixing.depth===3.2));
 await page.locator('#smsGlobalUndo').click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.parameters.manualMountHoles.length===0);
 await page.locator('#smsGlobalRedo').click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.parameters.manualMountHoles.length===8);
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.reload();
 await page.waitForFunction(name=>window.__sensoryStudio?.currentModel?.name===name,crystalName);
 assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.manualMountHoles),crystalMounts);
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 await page.locator('#smsSaveCrystal').click();
 await page.locator('#smsLibrary').click();
 const saved=page.locator('#smsSavedModels article').filter({hasText:crystalName});
 await saved.locator('.sms-library-actions-toggle').click();
 await saved.getByRole('button',{name:'Independent copy'}).click();
 await page.getByRole('dialog',{name:'Choose model destination'}).getByRole('button',{name:'Add model',exact:true}).click();
 await page.getByRole('dialog',{name:'Choose model destination'}).waitFor({state:'hidden'});
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.parameters.mountingPatterns?.length===1);
 assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.manualMountHoles),crystalMounts);
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 const copiedName=await page.evaluate(()=>window.__sensoryStudio.currentModel.name);
 await checkDownloads(copiedName,crystalMounts,2.9,5.1);
 console.log('WT-022 Crystal: eight worker-validated blind pockets persisted after reload');
}finally{await browser.close();}
