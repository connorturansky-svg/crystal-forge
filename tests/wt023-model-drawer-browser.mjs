// FUTURE FEATURE ACCEPTANCE: intentionally not registered until drawer integration.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {WORKSPACE_KEY} from '../studio-documents.js';
import {FAMILIES} from './helpers/wt023-model-drawer-fixture.mjs';
const browser=await chromium.launch({headless:true,executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:950}});
 await page.goto(process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321');
 await page.waitForFunction(()=>window.__sensoryStudio);
 const toggle=page.locator('#smsModelsToggle'),drawer=page.locator('#smsModelsDrawer');
 const tiles=drawer.locator('[data-model-id]');
 const storage=()=>page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY);
 const state=async()=>JSON.parse(await storage());
 const waitSaved=()=>page.waitForFunction(key=>{
  const p=window.__sensoryStudio?.project,raw=localStorage.getItem(key);
  if(!p||!raw)return false;
  const saved=JSON.parse(raw).project;
  return saved.id===p.id&&JSON.stringify(saved.tabs)===JSON.stringify(p.tabs)&&saved.activeTab===p.activeTab&&saved.models.length===p.models.length;
 },WORKSPACE_KEY,{timeout:15000});
 await toggle.waitFor({timeout:10000});
 assert.equal(await toggle.getAttribute('aria-expanded'),'false');
 assert(!await drawer.isVisible());
 // Real builder sources using existing public integration API; no fabricated preview images.
 for(const [i,family] of FAMILIES.entries()){
  await page.evaluate(({family,i})=>window.__sensoryStudio.addModel(family,null,'Drawer '+i+' '+family),{family,i});
 }
 await page.evaluate(()=>window.__sensoryStudio.addModel('crystals',{count:5},'Drawer edited crystal'));
 await waitSaved();
 // Capture a settled workspace before opening/filtering. UI-only actions must not write.
 const before=await storage();
 await toggle.press('Enter');
 assert.equal(await toggle.getAttribute('aria-expanded'),'true');
 assert(await drawer.isVisible());
 const p=(await state()).project;
 assert.equal(await tiles.count(),p.tabs.length);
 const bounds=await page.locator('.sms-centre').boundingBox(),panel=await drawer.boundingBox();
 assert(bounds&&panel);
 assert(panel.x>=bounds.x-2&&panel.x+panel.width<=bounds.x+bounds.width+2,'drawer stays in viewport column');
 assert(panel.height>=bounds.height*.22&&panel.height<=bounds.height*.5,'desktop drawer around one-third');
 const filter=drawer.locator('#smsModelFilter');
 await filter.fill('Drawer edited crystal');
 assert.equal(await tiles.filter({visible:true}).count(),1);
 await filter.fill('');
 await page.keyboard.press('Escape');
 assert(!await drawer.isVisible());
 assert(await toggle.evaluate(el=>document.activeElement===el));
 assert.equal(await storage(),before,'opening/filtering/dismissing does not mutate storage');
 await toggle.press('Space');
 const target=tiles.filter({has:page.getByRole('button',{name:/Drawer 1 tactile-tiles/})});
 const id=await target.getAttribute('data-model-id');
 await target.locator('[data-model-action=open]').click();
 await waitSaved();
 assert.equal((await state()).project.activeTab,id);
 assert(await drawer.isVisible(),'switch leaves drawer open');
 const modelCount=(await state()).project.models.length;
 await target.locator('[data-model-action=close]').click();
 await waitSaved();
 assert.equal((await state()).project.models.length,modelCount);
 assert(!(await state()).project.tabs.includes(id));
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:950});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const centre=await page.locator('.sms-centre').boundingBox(),d=await drawer.boundingBox();
  assert(centre&&d&&d.x>=centre.x-2&&d.x+d.width<=centre.x+centre.width+2);
 }
 await mkdir('qa',{recursive:true});
 await page.screenshot({path:'qa/wt023c-drawer-desktop.png'});
 // Seed 105 open entries from real saved sources without opening 105 editors.
 const seed=await state(),original=seed.project.models.find(m=>m.generator.typeId==='tactile-tiles');
 assert(original);
 while(seed.project.models.length<105){
  const m=structuredClone(original);m.id='drawer-bulk-'+seed.project.models.length;m.name='Bulk '+m.id;
  m.thumbnail=null;seed.project.models.push(m);
 }
 seed.project.tabs=seed.project.models.map(m=>m.id);
 seed.project.activeTab=original.id;
 await page.evaluate(({key,seed})=>localStorage.setItem(key,JSON.stringify(seed)),{key:WORKSPACE_KEY,seed});
 await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
 assert.equal(await toggle.getAttribute('aria-expanded'),'false');
 await toggle.click();assert.equal(await tiles.count(),105);
 await filter.fill('drawer-bulk-104');assert.equal(await tiles.filter({visible:true}).count(),1);
 await filter.fill('');
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'qa/wt023c-drawer-narrow.png'});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 console.log('WT-023C drawer integration: real sources, disclosure, width, switching, closing, filtering, reload, 105 entries passed. Complete preview/cache and keyboard matrix separately.');
}finally{await browser.close();}
