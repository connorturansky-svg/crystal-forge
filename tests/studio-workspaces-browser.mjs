import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {WORKSPACE_KEY} from '../studio-documents.js';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:950}});
 await page.goto(process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321');
 await page.waitForFunction(()=>window.__sensoryStudio);
 await page.evaluate(()=>window.__sensoryStudio.addModel('gears',{mode:'Decorative',webStyle:'Solid',
  wheelStyle:'Rounded lobes',bore:0,thickness:10,diameter:90},'WT-022 workspace Gear'));
 const nav=page.getByRole('navigation',{name:'Workspaces'});
 const destination=name=>nav.getByRole('button',{name,exact:true});
 const id=await page.evaluate(()=>window.__sensoryStudio.currentModel.id);
 for(const name of ['Home','Library']){
  await destination(name).press('Enter');
  assert.equal(await destination(name).getAttribute('aria-current'),'step');
  assert.equal(await nav.locator('[aria-current=step]').count(),1);
 }
 await destination('Mounting').press('Enter');
 assert.equal(await destination('Mounting').getAttribute('aria-current'),'step');
 await page.locator('[data-view=top]').click();
 await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
 await page.getByRole('button',{name:'Place mounting hole in 3D'}).click();
 const point=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(12,12,'top'));
 assert(point);
 await page.mouse.click(point.x,point.y);
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.manualMountHoles?.length===1);
 await page.keyboard.press('Escape');
 for(const name of ['Pixels','Wiring','Design','Build','Mounting']){
  await destination(name).press('Enter');
  assert.equal(await destination(name).getAttribute('aria-current'),'step');
  assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.id),id);
 }
 await destination('Build').press('Enter');
 assert(await page.locator('.sms-palette [data-pixel-backing]').isVisible());
 assert(await page.locator('.sms-palette [data-edge-finish=enabled]').isVisible());
 assert.equal(await page.locator('.sms-palette [data-place-pixel], .sms-palette [data-place-mount]').count(),0);
 await destination('Pixels').press('Enter');
 assert.equal(await page.locator('.sms-palette [data-pixel-backing]').count(),0);
 await page.setViewportSize({width:390,height:844});
 for(const name of ['Pixels','Wiring','Mounting','Print Centre'])await destination(name).press('Enter');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 await page.evaluate(()=>window.__sensoryStudio.addModel('crystals',{count:5},'WT-022 workspace Crystal'));
 await destination('Mounting').press('Enter');
 await page.waitForFunction(()=>document.body.dataset.studioBuildHome==='mounting');
 const reveal=async selector=>{
  const target=page.locator(selector);
  await target.evaluate(element=>{
   for(let ancestor=element.parentElement;ancestor;ancestor=ancestor.parentElement)
    if(ancestor.tagName==='DETAILS')ancestor.open=true;
  });
  await target.waitFor({timeout:4000});
 };
 await reveal('[data-state=mount]');
 await reveal('#placeMountBtn');
 await reveal('#manualHardwareList summary');
 assert(!await page.locator('[data-state=wireChannels]').isVisible());
 await destination('Wiring').press('Enter');
 await reveal('[data-state=wireChannels]');
 assert(!await page.locator('[data-state=mount]').isVisible());
 await destination('Pixels').press('Enter');
 await reveal('#pixelProfileSelect');
 assert(!await page.locator('[data-state=wireChannels]').isVisible());
 await destination('Build').press('Enter');
 assert(await page.locator('.sms-palette [data-palette-key=crystal-base-height]').isVisible());
 assert(!await page.locator('#pixelProfileSelect').isVisible());
 for(const family of ['tactile-tiles','waves','control-caps','characters','light-pods']){
  await page.evaluate(family=>window.__sensoryStudio.addModel(family,null,'WT-022 workspace '+family),family);
  await destination('Pixels').press('Enter');
  await page.locator('.sms-palette [data-place-pixel]').waitFor();
  assert.equal(await page.locator('.sms-palette [data-place-mount]').count(),0);
  await destination('Mounting').press('Enter');
  await page.locator('.sms-palette [data-place-mount]').waitFor();
  assert.equal(await page.locator('.sms-palette [data-place-pixel]').count(),0);
  await destination('Wiring').press('Enter');
  assert.equal(await destination('Wiring').getAttribute('aria-current'),'step');
  assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.generator.typeId),family);
 }

 // End-to-end post-merge protection: navigation may not merely keep a model
 // alive in memory. All builders and the real mounting edit must survive a
 // serialized v1 save and a full new document load on the same browser.
 await page.waitForFunction(key=>{
  const raw=localStorage.getItem(key);
  if(!raw)return false;
  try{
   const data=JSON.parse(raw),types=new Set(data.project.models.map(x=>x.generator.typeId));
   return ['gears','crystals','tactile-tiles','waves','control-caps','characters','light-pods']
    .every(type=>types.has(type)) &&
    data.project.models.some(model=>model.generator.typeId==='gears' &&
      model.build.manualMountHoles?.length===1);
  }catch{return false;}
 },WORKSPACE_KEY,{timeout:15000});
 const saved=await page.evaluate(key=>{
  const state=JSON.parse(localStorage.getItem(key)),project=state.project;
  return {id:project.id,tabs:[...project.tabs],activeTab:project.activeTab,
   models:project.models.map(m=>({id:m.id,name:m.name,type:m.generator.typeId,
    revision:m.revision,pixelHoles:m.build.pixelHoles?.length??0,
    mountingHoles:m.build.manualMountHoles?.length??0})),
   jobs:project.printJobs.map(j=>({id:j.id,revision:j.revision,status:j.status})),
   savedSnapshots:(state.savedProjects||[]).map(p=>p.snapshotId)};
 },WORKSPACE_KEY);
 await page.reload();
 await page.waitForFunction(()=>window.__sensoryStudio);
 const reloaded=await page.evaluate(key=>{
  const state=JSON.parse(localStorage.getItem(key)),project=state.project;
  return {id:project.id,tabs:[...project.tabs],activeTab:project.activeTab,
   models:project.models.map(m=>({id:m.id,name:m.name,type:m.generator.typeId,
    revision:m.revision,pixelHoles:m.build.pixelHoles?.length??0,
    mountingHoles:m.build.manualMountHoles?.length??0})),
   jobs:project.printJobs.map(j=>({id:j.id,revision:j.revision,status:j.status})),
   savedSnapshots:(state.savedProjects||[]).map(p=>p.snapshotId)};
 },WORKSPACE_KEY);
 assert.deepEqual(reloaded,saved,
  'Seven builders, real mounting placement, tab order and job revisions survive reload');
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.project.id),saved.id);
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.id),saved.activeTab);
 console.log('Post-merge Studio cross-builder saved state, model tabs and real mount placement survived reload.');
 // WT-025A: check actual rendered legibility, not merely that CSS contains token names.
 await destination('Design').press('Enter');
 await page.locator('#smsFindTools').fill('mounting grid');
 await page.locator('.sms-tool-result').first().waitFor();
 const textSize=selector=>page.evaluate(selector=>{
  const element=document.querySelector(selector);
  return element?Number.parseFloat(getComputedStyle(element).fontSize):null;
 },selector);
 assert((await textSize('body'))>=16,'Default main text is at least 16px');
 assert((await textSize('.sms-tool-finder>label'))>=15,'Find-tools label is readable');
 assert((await textSize('.sms-tool-finder>p'))>=14,'Find-tools guidance is readable');
 assert((await textSize('.sms-tool-result'))>=15,'Tool search results are readable');
 await page.locator('#smsFindTools').fill('');
 // Check computed foreground/background contrast in the real active theme.
 const contrast=async(foreground,background)=>page.evaluate(({foreground,background})=>{
  const channels=s=>{
   const match=s.match(/rgba?\(([^)]+)\)/);
   if(!match)throw Error('Missing computed RGB colour: '+s);
   return match[1].split(',').slice(0,3).map(v=>Number.parseFloat(v.trim())/255);
  };
  const luminance=s=>channels(s).reduce((total,v,i)=>{
   const linear=v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
   return total+linear*[.2126,.7152,.0722][i];
  },0);
  const fg=luminance(getComputedStyle(document.querySelector(foreground)).color);
  const bg=luminance(getComputedStyle(document.querySelector(background)).backgroundColor);
  return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);
 },{foreground,background});
 const auditContrast=async()=>{
  const label=await contrast('.sms-tool-finder>label','.sms-tool-finder');
  const note=await contrast('.sms-tool-finder>p','.sms-tool-finder');
  assert(label>=4.5&&note>=4.5,
   'Tool finder primary/secondary text must meet 4.5:1 contrast: '+JSON.stringify({label,note}));
 };
 await mkdir('qa',{recursive:true});
 const auditLayout=async(label)=>{
  const overflow=await page.evaluate(()=>{
   const width=document.documentElement.clientWidth,scroll=document.documentElement.scrollWidth;
   if(scroll<=innerWidth+1)return null;
   return {width,scroll,offenders:[...document.querySelectorAll('body *')].filter(el=>{
    const rect=el.getBoundingClientRect();
    return rect.width&&rect.right>width+2;
   }).slice(0,24).map(el=>[el.tagName,el.id,String(el.className).slice(0,100),Math.round(el.getBoundingClientRect().right)])};
  });
  assert.equal(overflow,null,label+' must not create horizontal page overflow: '+JSON.stringify(overflow));
 };
 const savedModel=await page.evaluate(()=>window.__sensoryStudio.currentModel.id);
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===390?844:950});
  for(const workspace of ['Home','Library','Design','Build','Pixels','Wiring','Mounting','Print Centre']){
   await destination(workspace).press('Enter');
   assert.equal(await destination(workspace).getAttribute('aria-current'),'step');
   assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.id),savedModel);
   await auditLayout(width+'px '+workspace);
  }
  await destination('Design').press('Enter');
  await page.locator('#smsFindTools').fill('mounting grid');
  await page.locator('#smsFindTools').press('ArrowDown');
  const result=page.locator('.sms-tool-result').first();
  assert(await result.evaluate(el=>document.activeElement===el&&el.matches(':focus-visible')&&
   getComputedStyle(el).outlineStyle==='solid'&&parseFloat(getComputedStyle(el).outlineWidth)>=2),
   'Keyboard search results display a visible focus ring');
  await page.screenshot({path:'qa/unified-wt025-legibility-'+width+'.png'});
  await result.press('Escape');
  await auditLayout(width+'px tool finder');
 }
 for(const theme of ['initial','alternate']){
  if(theme==='alternate')await page.locator('#themeBtn').click();
  await auditContrast();
  assert((await textSize('.sms-tool-finder>label'))>=15,'Readable labels survive theme changes');
  assert((await textSize('body'))>=16,'Readable main text survives theme changes');
  await page.locator('#changelogBtn').click();
  assert(await page.locator('#infoChangelog').isVisible(),'What’s New remains available');
  assert((await textSize('.dialog-body'))>=16,'Release notes are readable at default zoom');
  assert((await contrast('#infoChangelog','.dialog'))>=4.5,'Release notes meet normal-text contrast');
  await page.locator('#infoTabHelp').click();
  assert(await page.locator('#infoHelp').isVisible());
  assert((await textSize('#infoHelp'))>=16,'Help paragraphs are readable');
  await auditLayout('390px Help '+theme);
  await page.locator('#closeInfo').click();
 }
 // A 720 CSS-pixel viewport at 2x DPR models the reflow of a 1440-pixel
 // desktop at 200% browser zoom. Check text-only enlargement separately.
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:720,height:475,deviceScaleFactor:2,mobile:false});
 await page.locator('#changelogBtn').click();
 await page.locator('#infoTabHelp').click();
 assert(await page.locator('#infoHelp').isVisible());
 await auditLayout('200% equivalent Help');
 await page.screenshot({path:'qa/unified-wt025-legibility-200-reflow.png'});
 await page.locator('#closeInfo').click();
 await auditLayout('200% equivalent Design');
 await cdp.send('Emulation.clearDeviceMetricsOverride');
 await page.setViewportSize({width:720,height:475});
 await page.evaluate(()=>{document.documentElement.style.fontSize='200%';});
 assert((await textSize('body'))>=32&&(await textSize('.sms-tool-finder>label'))>=30,
  '200% text sizing scales the main UI and tool-finder labels');
 await page.locator('#changelogBtn').click();
 assert((await textSize('.dialog-body'))>=32,'Help and release text scales with browser text sizing');
 await auditLayout('200% text-only What’s New');
 await page.locator('#closeInfo').click();
 await page.evaluate(()=>{document.documentElement.style.fontSize='';});
 // WT-024 uses the same shared renderer for existing and generated controls.
 const hoverNotes=page.getByRole('checkbox',{name:'Hover Notes',exact:true});
 const detailedExplanations=page.getByRole('checkbox',{name:'Detailed Explanations',exact:true});
 assert(await hoverNotes.isChecked());
 assert(!(await detailedExplanations.isChecked()));
 await detailedExplanations.check();
 await destination('Design').press('Enter');
 async function verifyHelp(selector,copy){
  await reveal(selector);
  const control=page.locator(selector);
  const help=control.locator('xpath=ancestor-or-self::*[self::label or contains(concat(" ",normalize-space(@class)," ")," control ") or contains(concat(" ",normalize-space(@class)," ")," sms-model-control ")][1]/following-sibling::*[1]');
  assert.match(await help.locator('.contextual-help-detail').textContent(),copy);
  assert(await help.locator('.contextual-help-detail').isVisible());
  await control.focus();
  await page.waitForFunction(()=>!document.querySelector('#controlTooltip').hidden);
  assert.match(await control.getAttribute('aria-describedby'),/controlTooltip/);
  assert.match(await control.getAttribute('aria-describedby'),/contextualHelpDetail/);
  await page.keyboard.press('Escape');
  assert(!(await page.locator('#controlTooltip').isVisible()));
  assert.match(await control.getAttribute('aria-describedby'),/contextualHelpDetail/);
  await help.getByRole('button',{name:/Show setting help for/}).click();
  assert(await page.locator('#controlTooltip').isVisible());
 }
 await page.evaluate(()=>window.__sensoryStudio.addModel('crystals',{count:5},'WT-024 Crystal'));
 await destination('Design').press('Enter');
 await verifyHelp('[data-state=count]',/few crystals/);
 assert(await page.locator('[data-palette-key=count][aria-describedby*="contextualHelpDetail"]').count(),
  'the Crystal quick control also has detailed help');
 await page.evaluate(()=>window.__sensoryStudio.addModel('gears',{},'WT-024 Gear'));
 await destination('Design').press('Enter');
 await verifyHelp('[data-model-param=teeth]',/finer spacing/);
 for(const type of ['tactile-tiles','waves','control-caps','characters','light-pods']){
  await page.evaluate(typeId=>window.__sensoryStudio.addModel(typeId),type);
  await destination('Design').press('Enter');
  const fields=page.locator('[data-model-param][data-model-family="'+type+'"]');
  assert(await fields.count()>0,type+' renders native parameters');
  assert.equal(await fields.locator('xpath=self::*[contains(@aria-describedby,"contextualHelpDetail")]').count(),
   await fields.count(),type+' native parameters have contextual detail');
 }
 for(const [workspace,selector] of [['Home','#smsHomeSearch'],['Library','#smsSearch'],['Print Centre','#smsPrinter']]){
  await destination(workspace).press('Enter');
  await page.locator(selector+'[aria-describedby*="contextualHelpDetail"]').waitFor({state:'attached',timeout:4000});
 }
 await destination('Design').press('Enter');
 await page.setViewportSize({width:390,height:844});
 await auditLayout('390px with detailed contextual help');
 await page.setViewportSize({width:720,height:475});
 await page.evaluate(()=>{document.documentElement.style.fontSize='200%'});
 await auditLayout('200% text with detailed contextual help');
 await page.evaluate(()=>{document.documentElement.style.fontSize=''});
 const revision=await page.evaluate(()=>window.__sensoryStudio.currentModel.revision);
 await hoverNotes.uncheck();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.revision),revision);
 assert(await detailedExplanations.isChecked());
 assert(!(await page.locator('#controlTooltip').isVisible()));
 await page.reload();
 await page.waitForFunction(()=>window.__sensoryStudio);
 assert(!(await hoverNotes.isChecked()));
 assert(await detailedExplanations.isChecked());
 console.log('WT-022 workspaces: keyboard, retained model, actual mounting gesture and narrow navigation passed');
}finally{await browser.close();}
