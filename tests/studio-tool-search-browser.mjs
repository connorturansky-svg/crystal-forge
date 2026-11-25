import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined});
const url=process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321';
try{
 const page=await browser.newPage({viewport:{width:1440,height:950}});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(url);
 await page.waitForFunction(()=>window.__sensoryStudio);
 const add=(family,parameters)=>page.evaluate(({family,parameters})=>
  window.__sensoryStudio.addModel(family,parameters,'Search fixture '+family),{family,parameters});
 const search=page.getByRole('searchbox',{name:'Find tools and downloads'});
 const activeNav=page.locator('nav[aria-label=Workspaces] button[aria-current]');
 const choose=async(query,workspace,selector)=>{
  await search.fill(query);
  await search.press('Enter');
  try{await page.waitForFunction(selector=>document.activeElement?.matches(selector),selector,{timeout:5000});}
  catch(error){
   const focus=await page.evaluate(()=>({active:document.activeElement?.outerHTML.slice(0,160),
    panels:[...document.querySelectorAll('[data-tool-mount-pattern]')].map(el=>[el.open,el.getClientRects().length,el.innerHTML.slice(0,160)])}));
   throw Error(query+' focused '+JSON.stringify(focus)+' ('+await page.locator('.sms-tool-finder [role=status]').innerText()+')',{cause:error});
  }
  assert.equal(await activeNav.textContent(),workspace,query);
 };
 await add('crystals',{baseType:'integrated',baseHeight:20,wireChannels:true,mount:'None'});
 await choose('Support-Free Shoulders','Pixels','[data-crystal-shoulders]');
 assert.equal(await page.locator('[data-crystal-shoulders]').isChecked(),false);
 await choose('magnets in a circle','Mounting','select[data-state=mount]');
 assert.match(await page.locator('.sms-tool-finder [role=status]').innerText(),/set hole placement to Manual/);
 await add('crystals',{baseType:'integrated',baseHeight:20,wireChannels:true,mount:'Magnet inserts',mountPlacement:'manual'});
 await page.locator('#simpleBtn').click();
 await choose('magnets in a circle','Mounting','[data-pattern-field=kind]');
 assert(await page.locator('body.advanced').count());
 await choose('fixing ears','Mounting','select[data-state=mount]');
 await choose('LED sockets','Pixels','[data-state=cutSockets]');
 await choose('pixel test coupon','Pixels','[data-tool-action=calibrationBtn]');
 await choose('wire IN OUT','Wiring','#pickWireEntryBtn');
 await choose('bevel crystal','Build','[data-edge-finish=enabled]');
 await choose('Cura profile','Print Centre','#smsCura');
 await choose('STL export','Print Centre','#smsPrintCurrent [data-prepare-current]');
 assert.match(await page.locator('.sms-tool-finder [role=status]').innerText(),/Prepare the current model/);
 await page.locator('#smsPrintCurrent').getByRole('button',{name:'Prepare current model',exact:true}).click();
 await page.locator('[data-job-stl]:enabled').waitFor({timeout:120000});
 await choose('STL export','Print Centre','[data-job-stl]');
 await page.setViewportSize({width:390,height:844});
 await add('gears',{mode:'Decorative',webStyle:'Solid',wheelStyle:'Rounded lobes',diameter:90,thickness:10});
 await choose('4 mounting holes grid','Mounting','[data-pattern-field=kind]');
 await choose('smooth sharp edges','Build','[data-edge-finish=enabled]');
 await choose('LED sockets','Pixels','[data-place-shaped]');
 await choose('wire IN OUT','Wiring','[data-native-edge=in]');
 await search.fill('cable channels');
 assert.match(await page.locator('.sms-tool-result').first().innerText(),/fitting|pixel|bore/i);
 await search.press('Enter');
 await page.waitForFunction(()=>document.activeElement?.dataset.workspace==='wiring');
 assert.match(await page.locator('.sms-tool-finder [role=status]').innerText(),/fitting|pixel|bore/i);
 await add('tactile-tiles',{dualMaterial:false});
 await choose('fixing ears','Mounting','[data-add-backing-tab]');
 await choose('chmfer','Build','[data-edge-finish=enabled]');
 await search.fill('quantum laser banana');
 assert.match(await page.locator('.sms-tool-finder [role=status]').innerText(),/No matching tools/);
 await search.press('Escape');
 assert.equal(await search.inputValue(),'');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.setViewportSize({width:1440,height:950});
 await add('gears',{mode:'Decorative',wheelStyle:'Rounded lobes',webStyle:'Solid',diameter:100,
  thickness:25,bore:0,reliefStyle:'None',dualMaterial:false});
 const guidance=/select a shaped underside socket/i;
 await search.fill('Support-Free Shoulders');
 assert.match(await page.locator('.sms-tool-result').first().innerText(),guidance);
 await choose('Support-Free Shoulders','Pixels','[data-workspace=pixels]');
 assert.match(await page.locator('.sms-tool-finder [role=status]').innerText(),guidance);
 const palette=page.locator('.sms-palette');
 await palette.locator('[data-fit-profile=bullet]').click();
 await page.locator('[data-view=bottom]').click();
 await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
 await palette.locator('[data-place-shaped]').click();
 const point=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(0,0,'underside'));
 assert(point);
 await page.mouse.click(point.x,point.y);
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===1);
 await page.keyboard.press('Escape');
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 const before=await page.evaluate(()=>window.__sensoryStudio.currentModel.revision);
 await choose('taper socket shoulder','Pixels','[data-seat-shoulders]');
 assert.equal(await palette.locator('[data-seat-shoulders]').isChecked(),false);
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.revision),before);
 assert.deepEqual(errors,[]);
 console.log('WT-022 search: Crystal, Gear and Tile ranking, focus, Advanced, availability, STL readiness and narrow layout passed');
}finally{await browser.close();}
