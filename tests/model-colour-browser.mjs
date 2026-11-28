import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {WORKSPACE_KEY} from '../studio-documents.js';
import {chromium} from 'playwright';
function geometry3MF(bytes){
 for(let offset=0;offset+30<=bytes.length&&bytes.readUInt32LE(offset)===0x04034b50;){
  const size=bytes.readUInt32LE(offset+18),nameSize=bytes.readUInt16LE(offset+26);
  const start=offset+30+nameSize+bytes.readUInt16LE(offset+28);
  if(bytes.toString('utf8',offset+30,offset+30+nameSize)==='3D/3dmodel.model'){
   assert.equal(bytes.readUInt16LE(offset+8),0,'Expected uncompressed model XML');
   const xml=bytes.toString('utf8',start,start+size);
   const geometry=xml.match(/<(?:vertex|triangle) [^>]+>/g);
   assert(geometry?.length>1);
   return geometry;
  }
  offset=start+size;
 }
 throw Error('3MF is missing its model entry.');
}
const browser=await chromium.launch({headless:true,executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
const url=process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321';
try{
 const context=await browser.newContext({viewport:{width:1440,height:950}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(url);await page.waitForFunction(()=>window.__sensoryStudio);
 const drawer=page.locator('#smsModelsDrawer');
 const disclosure=drawer.getByRole('button',{name:/Models \(/});
 const modelImage=async id=>{
  await disclosure.click();
  const image=drawer.locator('[data-model-id="'+id+'"] img');
  await image.waitFor({timeout:15000});
  const src=await image.getAttribute('src');
  await disclosure.click();
  return src;
 };
 const current=()=>page.evaluate(()=>JSON.parse(JSON.stringify(window.__sensoryStudio.currentModel)));
 const restored=[];
 for(const family of ['tactile-tiles','gears','waves','control-caps','characters','light-pods']){
  await page.evaluate(f=>window.__sensoryStudio.addModel(f,null,'Colour '+f),family);
  await page.getByRole('navigation',{name:'Workspaces'}).getByRole('button',{name:'Design',exact:true}).press('Enter');
  const opener=page.locator('[data-model-colour-role=primary]');
  const before=await current();
  const originalImage=await modelImage(before.id);
  await opener.click();
  const dialog=page.getByRole('dialog',{name:'Primary model colour'});
  await dialog.locator('[data-model-colour-hex]').fill('#000000');
  await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
  assert.equal((await current()).revision,before.revision);
  await opener.click();
  await dialog.locator('[data-model-colour-hex]').fill('#000000');
  await dialog.getByRole('button',{name:'Apply colour',exact:true}).click();
  await dialog.waitFor({state:'hidden'});
  assert.equal((await current()).materials.primary.colour,0,family);
  assert.match(await opener.innerText(),/#000000/);
  assert.notEqual(await modelImage(before.id),originalImage,family+' black must render a different saved preview');
  await page.locator('#smsGlobalUndo').click();
  assert.deepEqual((await current()).materials,before.materials);
  await page.locator('#smsGlobalRedo').click();
  assert.equal((await current()).materials.primary.colour,0);
  await opener.click();
  for(const [name,value] of [['Red','18'],['Green','58'],['Blue','188']])await dialog.getByRole('spinbutton',{name,exact:true}).fill(value);
  assert.equal(await dialog.locator('[data-model-colour-hex]').inputValue(),'#123ABC');
  await dialog.getByRole('button',{name:'Apply colour',exact:true}).click();
  assert.equal((await current()).materials.primary.colour,0x123abc);
  restored.push(before.id);
 }
 await page.setViewportSize({width:390,height:850});
 await page.locator('[data-model-colour-role=primary]').click();
 const dialog=page.getByRole('dialog',{name:'Primary model colour'});
 assert((await dialog.boundingBox()).width<=390);
 await dialog.screenshot({path:'qa/wt176-after-colour.png'});
 await page.keyboard.press('Escape');
 await dialog.waitFor({state:'hidden'});
 await page.evaluate(()=>window.__sensoryStudio.saveImmediately());
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__sensoryStudio);
 assert(await page.evaluate(ids=>ids.every(id=>window.__sensoryStudio.project.models.find(m=>m.id===id)?.materials.primary.colour===0x123abc),restored));
 await page.setViewportSize({width:1440,height:950});
 for(const family of ['crystals','gears']){
  const id=await page.evaluate(f=>window.__sensoryStudio.project.models.find(m=>m.generator.typeId===f).id,family);
  async function prepareAndDownload(){
   const jobId=await page.evaluate(id=>{const app=window.__sensoryStudio;app.send(id);return app.project.printJobs.find(j=>j.modelId===id).id;},id);
   const job=page.locator('[data-print-job="'+jobId+'"]');
   await job.locator('[data-job-prepare]').click();
   await job.locator('[data-job-stl]:enabled').waitFor({timeout:120000});
   const downloads=[];
   for(const format of ['stl','3mf']){
    const [download]=await Promise.all([page.waitForEvent('download'),job.locator('[data-job-'+format+']').click()]);
    downloads.push(await readFile(await download.path()));
   }
   assert(downloads[0].length>84);
   return [downloads[0].subarray(80),geometry3MF(downloads[1])];
  }
  await page.evaluate(id=>window.__sensoryStudio.switchModel(id),id);
  const before=await modelImage(id);
  const expected=await prepareAndDownload();
  await page.evaluate(id=>window.__sensoryStudio.switchModel(id),id);
  await page.getByRole('navigation',{name:'Workspaces'}).getByRole('button',{name:'Design',exact:true}).press('Enter');
  const control=family==='crystals'?page.locator('#customModelColour'):page.locator('[data-model-colour-role=primary]');
  await control.evaluate(el=>{for(let node=el.parentElement;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;});
  await control.click();
  const dialog=page.getByRole('dialog',{name:'Primary model colour'});
  await dialog.getByRole('button',{name:/Black #000000/}).click();
  await dialog.getByRole('button',{name:'Apply colour',exact:true}).click();
  assert.notEqual(await modelImage(id),before);
  assert.equal(await page.evaluate(id=>window.__sensoryStudio.project.printJobs.find(j=>j.modelId===id).status,id),'stale');
  assert.deepEqual(await prepareAndDownload(),expected,family+' colour must not change STL or 3MF geometry');
 }
 const dual=page.locator('[data-model-param=dualMaterial]');
 await page.getByRole('navigation',{name:'Workspaces'}).getByRole('button',{name:'Design',exact:true}).press('Enter');
 await dual.evaluate(el=>{for(let node=el.parentElement;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;});
 await dual.check();
 const secondary=page.locator('[data-model-colour-role=secondary]');
 await secondary.click();
 const secondaryDialog=page.getByRole('dialog',{name:'Secondary model colour'});
 const system=secondaryDialog.locator('[data-model-colour-picker]');
 await system.fill('#00010a');
 assert.equal(await secondaryDialog.locator('[data-model-colour-hex]').inputValue(),'#00010A');
 await secondaryDialog.getByRole('button',{name:'Apply colour',exact:true}).click();
 assert.equal((await current()).materials.primary.colour,0);
 assert.equal((await current()).materials.secondary.colour,0x00010a);
 await dual.evaluate(el=>{for(let node=el.parentElement;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;});
 await dual.uncheck();
 await secondary.waitFor({state:'hidden'});
 assert.equal((await current()).materials.secondary.colour,0x00010a);
 const gearId=(await current()).id;
 const blackPreview=await modelImage(gearId);
 await page.locator('#smsLibrary').click();
 await page.locator('#smsSaveProject').click();
 const snapshot=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).savedProjects.at(-1).snapshotId,WORKSPACE_KEY);
 await page.evaluate(id=>window.__sensoryStudio.switchModel(id),gearId);
 await page.getByRole('navigation',{name:'Workspaces'}).getByRole('button',{name:'Design',exact:true}).press('Enter');
 await page.locator('[data-model-colour-role=primary]').click();
 const primary=page.getByRole('dialog',{name:'Primary model colour'});
 await primary.locator('[data-model-colour-hex]').fill('#12AB34');
 await primary.getByRole('button',{name:'Apply colour',exact:true}).click();
 assert.notEqual(await modelImage(gearId),blackPreview);
 await page.locator('#smsLibrary').click();
 const savedCard=page.locator('[data-snapshot-id="'+snapshot+'"]').first();
 await savedCard.getByRole('button',{name:/Actions/}).click();
 page.once('dialog',dialog=>dialog.accept());
 await savedCard.getByRole('button',{name:/Open project/}).click();
 assert.equal(await page.evaluate(id=>window.__sensoryStudio.project.models.find(m=>m.id===id).materials.primary.colour,gearId),0);
 assert.equal(await modelImage(gearId),blackPreview,'A saved project restores the exact revision preview');
 assert.deepEqual(errors,[]);
 await context.close();
 const legacy=await browser.newPage({viewport:{width:1440,height:950}});
 await legacy.goto(url+(url.includes('?')?'&':'?')+'legacy=1');
 await legacy.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('Ready'));
 await legacy.locator('[data-tab="design"]').click();
 const classicColour=legacy.locator('#customModelColour');
 await classicColour.evaluate(el=>{for(let parent=el.parentElement;parent;parent=parent.parentElement){if(parent.tagName==='DETAILS')parent.open=true;}});
 await classicColour.click();
 const classic=legacy.getByRole('dialog',{name:'Primary model colour'});
 await classic.locator('[data-model-colour-hex]').fill('#000000');
 await classic.getByRole('button',{name:'Apply colour',exact:true}).click();
 assert.equal(await legacy.evaluate(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')).settings.colour),0);
 await legacy.close();
 console.log('Model appearance browser: seven builders, exact HEX/RGB, native picker, black, history, saved thumbnails, reload, dual material and Crystal/Gear export geometry passed.');
}finally{await browser.close();}
