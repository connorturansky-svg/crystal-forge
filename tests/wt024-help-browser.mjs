import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {HELP_PREFERENCES_KEY} from '../tooltips.js';

const browser=await chromium.launch({headless:true,executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const url=process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321';
 await page.goto(url);
 await page.waitForFunction(()=>window.__sensoryStudio);
 const hover=page.locator('#hoverNotes'),detailed=page.locator('#detailedExplanations');
 const model=()=>page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
 const before=await model();
 for(const short of [false,true])for(const long of [false,true]){
  await hover.setChecked(short);await detailed.setChecked(long);
  assert.equal(await hover.isChecked(),short);
  assert.equal(await detailed.isChecked(),long);
  assert.equal(await model(),before);
 }
 const peer=await context.newPage();
 await peer.goto(url);
 await peer.waitForFunction(()=>window.__sensoryStudio);
 await hover.uncheck();
 await peer.waitForFunction(()=>!document.querySelector('#hoverNotes').checked);
 await detailed.uncheck();
 await peer.waitForFunction(()=>!document.querySelector('#detailedExplanations').checked);
 await peer.close();
 await hover.check();await detailed.check();
 const families=['crystals','tactile-tiles','gears','waves','control-caps','characters','light-pods'];
 const workspaces=['Home','Library','Design','Build','Pixels','Wiring','Mounting','Print Centre'];
 let settings=0;
 for(const family of families){
  await page.evaluate(f=>window.__sensoryStudio.addModel(f,null,'Help audit '+f),family);
  for(const workspace of workspaces){
   await page.getByRole('navigation',{name:'Workspaces'}).getByRole('button',{name:workspace,exact:true}).press('Enter');
   const audit=await page.evaluate(()=>{
    for(const item of document.querySelectorAll('details'))if(item.getClientRects().length)item.open=true;
    const fields=[...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(e=>
     e.getClientRects().length&&!e.closest('[hidden]')&&!e.matches('#hoverNotes,#detailedExplanations,#loadFile'));
    return {count:fields.length,missing:fields.filter(e=>!(e.getAttribute('aria-describedby')||'').split(/\s+/).some(id=>
     document.getElementById(id)?.classList.contains('contextual-help-detail'))).map(e=>e.outerHTML.slice(0,180))};
   });
   settings+=audit.count;
   assert.deepEqual(audit.missing,[],family+' / '+workspace);
  }
 }
 await page.getByRole('navigation',{name:'Workspaces'}).getByRole('button',{name:'Design',exact:true}).press('Enter');
 const drawer=page.locator('#smsModelsDrawer');
 await drawer.getByRole('button',{name:/Models \(/}).click();
 const filter=drawer.getByRole('searchbox');
 const explanation=drawer.locator('.md-search + .contextual-help .contextual-help-detail');
 assert.match(await explanation.innerText(),/without changing your project/);
 const density=drawer.getByRole('slider',{name:'Thumbnail size'});
 const densityHelp=drawer.locator('.md-zoom + .contextual-help .contextual-help-detail');
 assert.match(await densityHelp.innerText(),/does not change your model/);
 await density.press('Home');assert.equal(await density.inputValue(),'1');
 await density.press('End');assert.equal(await density.inputValue(),'5');
 assert(await drawer.locator('.md-grid').evaluate(el=>el.clientHeight>0),'Help must leave the model list reachable');
 await filter.focus();
 await page.locator('#controlTooltip').waitFor();
 await page.keyboard.press('Escape');
 assert(!(await page.locator('#controlTooltip').isVisible()));
 // The drawer's own Escape shortcut may also close it; reopen if necessary.
 if(!await filter.isVisible())await drawer.getByRole('button',{name:/Models \(/}).click();
 await page.locator('#smsNew').click();
 await page.locator('#smsPicker [data-generator=gears]').click();
 const naming=page.getByRole('dialog',{name:'Name new model'});
 assert.match(await naming.locator('.contextual-help-detail').innerText(),/meaningful name/);
 // The auto-focused name field can already have a visible tooltip when a
 // person moves to the modal action. The next action must remain clickable.
 await naming.getByRole('textbox',{name:'Model name'}).focus();
 await page.locator('#controlTooltip').waitFor();
 await naming.getByRole('button',{name:'Cancel'}).click();
 const auditModal=async(modal)=>{
  await modal.waitFor();
  const missing=await modal.evaluate(root=>[...root.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(e=>
   e.getClientRects().length&&!e.closest('[hidden]')&&!(e.getAttribute('aria-describedby')||'').split(/\s+/).some(id=>
    document.getElementById(id)?.classList.contains('contextual-help-detail'))).map(e=>e.outerHTML.slice(0,180)));
  assert.deepEqual(missing,[]);
 };
 for(const [trigger,name] of [['Import SVG','Import SVG artwork'],['Import 3D model','Import 3D model']]){
  await page.locator('#smsNew').click();
  await page.getByRole('button',{name:trigger,exact:true}).click();
  const dialog=page.getByRole('dialog',{name});
  await auditModal(dialog);
  await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
 }
 await page.evaluate(()=>window.__sensoryStudio.addModel('waves',null,'Help profile fixture'));
 await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
 await page.getByRole('button',{name:'Create / edit pixel profile'}).click();
 const profile=page.locator('#pixelProfileOverlay');
 await auditModal(profile);
 await page.keyboard.press('Escape');
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:950});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+'px layout');
 }
 await page.reload();
 await page.waitForFunction(()=>window.__sensoryStudio);
 assert(await hover.isChecked());assert(await detailed.isChecked());
 assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),HELP_PREFERENCES_KEY),{hover:true,detailed:true});
 assert.deepEqual(errors,[]);
 // Release the seven-builder renderer and preview cache before starting the
 // independent touch fixture; hosted software WebGL has a tight context budget.
 await context.close();
 const touchContext=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
 const touch=await touchContext.newPage();
 await touch.goto(url);
 await touch.waitForFunction(()=>window.__sensoryStudio&&document.querySelector('#smsModelsDrawer'),null,{timeout:60000});
 await touch.evaluate(()=>window.__sensoryStudio.addModel('gears',null,'Touch help fixture'));
 const touchDrawer=touch.locator('#smsModelsDrawer');
 await touchDrawer.getByRole('button',{name:/Models \(/}).tap();
 await touchDrawer.locator('.md-search + .contextual-help button').tap();
 await touch.locator('#controlTooltip').waitFor();
 assert.match(await touch.locator('#controlTooltip').innerText(),/Filters the open models/);
 await touchContext.close();
 console.log('WT-024 Chromium: '+settings+' visible setting instances across seven builders and eight workspaces; preferences, cross-tab, drawer, naming and import/profile editors passed.');
}finally{await browser.close();}
