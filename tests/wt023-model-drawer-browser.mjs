import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {WORKSPACE_KEY} from '../studio-documents.js';

const browser=await chromium.launch({headless:true,executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:950}});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321');
 await page.waitForFunction(()=>window.__sensoryStudio);
 const drawer=page.locator('#smsModelsDrawer'),body=drawer.locator('.md-body');
 const toggle=drawer.getByRole('button',{name:/Models \(/}),filter=body.getByRole('searchbox');
 const models=()=>page.evaluate(()=>window.__sensoryStudio.project.models);
 const storage=()=>page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY);
 const families=['crystals','tactile-tiles','gears','waves','control-caps','characters','light-pods'];
 const tile=name=>body.locator('[data-model-id]').filter({has:page.getByRole('button',{name:new RegExp(' : '+name+'$')})});
 for(const family of families){
  await page.locator('#smsNew').click();
  await page.locator('#smsPicker [data-generator="'+family+'"]').click();
  const naming=page.getByRole('dialog',{name:'Name new model'});
  if(family==='crystals'){
   const before=await models();
   await naming.getByRole('button',{name:'Cancel'}).click();
   assert.deepEqual(await models(),before);
   await page.locator('#smsNew').click();
   await page.locator('#smsPicker [data-generator="crystals"]').click();
  }
  await naming.getByRole('textbox',{name:'Model name'}).fill('WT023 '+family);
  await naming.getByRole('button',{name:'Create model'}).click();
 }
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 const before=await storage();
 assert.equal(await toggle.getAttribute('aria-expanded'),'false');
 await toggle.press('Enter');
 const images=new Set();
 for(const family of families){
  await filter.fill('WT023 '+family);
  const image=tile('WT023 '+family).locator('img');
  await image.waitFor({timeout:10000}).catch(async error=>{
   throw Error('Could not render '+family+': '+(await body.innerText()),{cause:error});
  });
  images.add(await image.getAttribute('src'));
 }
 assert.equal(images.size,7,'Each saved builder has its own rendered geometry');
 await filter.press('Escape');
 assert(!await body.isVisible());
 assert.equal(await storage(),before);
 await toggle.click();
 await filter.fill('WT023 crystals');
 const original=tile('WT023 crystals');
 await original.locator('[data-action=select]').click();
 assert(await body.isVisible());
 await original.locator('[data-action=info]').click();
 await page.getByRole('dialog',{name:'Model information'}).getByText('Crystal Clusters').waitFor();
 await page.keyboard.press('Escape');
 await original.locator('[data-action=rename]').click();
 const rename=page.getByRole('dialog',{name:'Rename model'});
 await rename.getByRole('textbox',{name:'Model name'}).fill('Crystal renamed');
 await rename.getByRole('button',{name:'Save name'}).click();
 await filter.fill('Crystal renamed');
 const updated=tile('Crystal renamed');
 const open=updated.locator('[data-action=select]');
 const id=await updated.getAttribute('data-model-id');
 await open.press('Alt+ArrowRight');
 assert((await page.evaluate(()=>window.__sensoryStudio.project.tabs)).indexOf(id)>0);
 const count=(await models()).length;
 await updated.locator('[data-action=close]').click();
 assert.equal((await models()).length,count);
 assert(!(await page.evaluate(()=>window.__sensoryStudio.project.tabs)).includes(id));
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await mkdir('qa',{recursive:true});
 const zoom=body.getByRole('slider',{name:'Thumbnail size'});
 const zoomKey='crystal-forge.models-drawer.zoom.v1';
 const beforeZoom=await storage();
 await zoom.press('Home');assert.equal(await zoom.inputValue(),'1');
 const small=await drawer.evaluate(el=>getComputedStyle(el).getPropertyValue('--md-thumb-size'));
 await zoom.press('End');assert.equal(await zoom.inputValue(),'5');
 const big=await drawer.evaluate(el=>getComputedStyle(el).getPropertyValue('--md-thumb-size'));
 assert(parseFloat(big)>parseFloat(small));
 assert.equal(await storage(),beforeZoom,'Thumbnail size must not modify project storage');
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),zoomKey),'5');
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:950});
  await filter.fill('');
  const host=await page.locator('.viewarea').boundingBox(),d=await drawer.boundingBox();
  assert(host&&d&&d.x>=host.x-1&&d.x+d.width<=host.x+host.width+1);
  assert(Math.abs(d.height-host.height/3)<=8||d.height===144);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  for(const size of ['Home','End']){
   await zoom.press(size);
   const geometry=await body.locator('.md-card').evaluateAll(cards=>cards.map(card=>{
    const name=card.querySelector('.md-name-title'),pick=card.querySelector('.md-pick'),actions=card.querySelector('.md-actions');
    const n=name.getBoundingClientRect(),p=pick.getBoundingClientRect(),a=actions.getBoundingClientRect(),c=card.getBoundingClientRect();
    return {nameWidth:n.width,nameHeight:n.height,lineHeight:parseFloat(getComputedStyle(name).lineHeight),pickBottom:p.bottom,actionsTop:a.top,cardLeft:c.left,cardRight:c.right,actionsLeft:a.left,actionsRight:a.right};
   }));
   for(const g of geometry){
    assert(g.nameWidth>=48,'Readable model name needs horizontal space');
    assert(g.nameHeight<=g.lineHeight+2,'Model name must not wrap letter by letter');
    assert(g.actionsTop>=g.pickBottom-1,'Actions must not overlap name/thumbnail');
    assert(g.actionsLeft>=g.cardLeft-1&&g.actionsRight<=g.cardRight+1,'Actions must fit card');
   }
   await page.screenshot({path:'qa/wt023c-drawer-'+width+'-'+size+'.png'});
  }
 }
 await page.reload({waitUntil:'commit'});
 await page.waitForFunction(()=>window.__sensoryStudio);
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 assert.equal(await toggle.getAttribute('aria-expanded'),'false');
 assert((await models()).some(model=>model.id===id&&model.name==='Crystal renamed'));
 await toggle.click();assert.equal(await zoom.inputValue(),'5','Density survives reload');await filter.press('Escape');
 // Some historical Crystal records lack the editable source, even with an old image attached.
 const snapshot=JSON.parse(await storage());
 const missing=snapshot.project.models.find(model=>model.id===id);
 missing.editableState={};
 snapshot.project.tabs.push(id);
 await page.evaluate(({key,snapshot})=>localStorage.setItem(key,JSON.stringify(snapshot)),{key:WORKSPACE_KEY,snapshot});
 await page.reload({waitUntil:'commit'});
 await page.waitForFunction(()=>window.__sensoryStudio);
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 await toggle.click();
 await filter.fill('Crystal renamed');
 await tile('Crystal renamed').getByText('Saved Crystal geometry is missing.').waitFor();
 await tile('Crystal renamed').getByRole('button',{name:'Retry preview'}).click();
 await tile('Crystal renamed').getByText('Saved Crystal geometry is missing.').waitFor();
 await filter.press('Escape');
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 const large=JSON.parse(await storage()),seed=large.project.models.find(model=>model.generator.typeId==='tactile-tiles');
 while(large.project.models.length<105){
  const n=large.project.models.length,model=structuredClone(seed);
  model.id='wt023-drawer-bulk-'+n;model.name='Bulk model '+n;model.thumbnail=null;
  large.project.models.push(model);
 }
 large.project.tabs=large.project.models.map(model=>model.id);
 large.project.activeTab=seed.id;
 await page.evaluate(({key,large})=>localStorage.setItem(key,JSON.stringify(large)),{key:WORKSPACE_KEY,large});
 await page.reload({waitUntil:'commit'});
 await page.waitForFunction(()=>window.__sensoryStudio?.project.tabs.length===105);
 await toggle.press('Space');
 assert.equal(await body.locator('[data-model-id]').count(),105);
 assert(await drawer.locator('.md-grid').evaluate(el=>el.scrollHeight>el.clientHeight));
 await filter.fill('Bulk model 104');
 await tile('Bulk model 104').locator('img').waitFor();
 assert.equal(await body.locator('[data-model-id]').count(),1);
 await page.locator('#themeBtn').click();
 await page.evaluate(()=>{document.body.style.zoom='200%';});
 assert(await filter.isVisible());
 await filter.press('Escape');
 assert(await toggle.evaluate(el=>document.activeElement===el));
 assert.deepEqual(errors,[]);
 console.log('WT-023C Chromium: seven real saved previews, create/cancel, info, rename, reorder, close, reload, retry and 105 open records passed.');
}finally{await browser.close();}
