import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:950}});
 await page.goto(process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321');
 await page.waitForFunction(()=>window.__sensoryStudio);
 await page.evaluate(()=>window.__sensoryStudio.addModel('gears',{mode:'Decorative',wheelStyle:'Rounded lobes',
  webStyle:'Solid',diameter:110,teeth:12,bore:0,thickness:10,reliefStyle:'None',dualMaterial:false},'WT-022 Gear patterns'));
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 const open=async()=>{
  const summary=page.getByText('Uniform mounting patterns',{exact:true});
  if(!await summary.evaluate(element=>element.parentElement.open))await summary.click();
 };
 const field=key=>page.locator('[data-pattern-field="'+key+'"]');
 const apply=page.locator('[data-pattern-apply]');
 const read=()=>page.evaluate(()=>window.__sensoryStudio.currentModel.build);
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
 await open();
 await page.locator('[data-pattern-select]').selectOption(id);
 await page.getByRole('button',{name:'Ungroup',exact:true}).click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.mountingPatterns?.length===0);
 assert.deepEqual((await read()).manualMountHoles,edited.manualMountHoles);
 console.log('WT-022 Gear: validated eight pockets, atomic rejection, stable group editing and exact ungrouping passed');

 const crystalName='WT-022 Crystal magnet pattern';
 await page.evaluate(name=>window.__sensoryStudio.addModel('crystals',{
  seed:42,count:5,width:100,height:90,baseType:'integrated',baseStyle:'Square',baseWidth:42,
  baseHeight:15,baseDome:0,cutSockets:false,lightingMode:'none',mount:'Magnet inserts',
  mountPlacement:'manual',manualMountHoles:[]
 },name),crystalName);
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 const crystalSummary=page.getByText('Uniform Crystal mounting patterns',{exact:true});
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
 await page.locator('#manualHardwareList [data-pattern-apply]').click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.parameters.mountingPatterns?.length===1);
 const crystalMounts=await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.manualMountHoles);
 assert.equal(crystalMounts.length,8);
 assert(crystalMounts.every(mount=>mount.crystalFixing.diameter===10.2&&mount.crystalFixing.depth===3.2));
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.reload();
 await page.waitForFunction(name=>window.__sensoryStudio?.currentModel?.name===name,crystalName);
 assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.manualMountHoles),crystalMounts);
 console.log('WT-022 Crystal: eight worker-validated blind pockets persisted after reload');
}finally{await browser.close();}
