import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const browser=await chromium.launch({executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined});
const url=process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321';
const cases=[
 ['crystals',390,false,'count'],['tactile-tiles',768,true,'width'],['gears',1440,false,'diameter'],
 ['waves',390,true,'amplitude'],['control-caps',768,false,'diameter'],['characters',1440,true,'width'],['light-pods',390,false,'width']
];
try{
 await mkdir('qa',{recursive:true});
 for(const [family,width,dark,key] of cases){
  const page=await browser.newPage({viewport:{width,height:900},hasTouch:width===390});
  try{
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.locator('#smsHomeNew').click();
   await page.locator(`#smsPicker [data-generator="${family}"]`).click();
   if(dark)await page.locator('#themeBtn').click();
   const search=page.getByRole('searchbox',{name:'Find tools and downloads'});
   const results=page.getByRole('group',{name:'Matching tool shortcuts'}).getByRole('button');
   await search.fill('open');
   await page.keyboard.press('ArrowDown');
   const focused=locator=>locator.evaluate(el=>el===document.activeElement);
   assert(await focused(results.first()),`${family}: Down enters results`);
   await page.keyboard.press('ArrowDown');
   assert(await focused(results.nth(1)),`${family}: Down advances`);
   await page.keyboard.press('ArrowUp');
   await page.keyboard.press('ArrowUp');
   assert(await focused(search),`${family}: Up from first result returns to search`);
   await page.keyboard.press('ArrowDown');
   await page.keyboard.press('Escape');
   assert(await focused(search),`${family}: Escape returns focus to search`);
   assert.equal(await search.inputValue(),'');
   assert.equal(await results.count(),0);
   await search.fill('no matching tool 123');
   assert.match(await page.locator('.sms-tool-finder [role=status]').innerText(),/No matching tools/);
   await search.fill('Cura');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${family}: no page-level horizontal overflow`);
   if(family==='waves'||family==='gears')await page.screenshot({path:`qa/ux02-finder-${family}-${width}.png`});
   if(width===390)await results.first().tap();
   else{
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
   }
   await page.waitForFunction(()=>document.activeElement?.id==='smsCura');
   const nav=page.locator('.sms-workspace-nav');
   for(const [view,selector] of [['home','#smsHome'],['library','#smsLibrary'],
    ['print','[data-tab=print]'],['build','[data-tab=build]'],['design','[data-tab=design]']]){
    const control=nav.locator(selector);
    await control.press('Enter');
    assert(await focused(control),`${family}: keyboard focus is retained on ${view}`);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${family}: ${view} fits without page-level horizontal overflow`);
   }
   const slider=page.locator(family==='crystals'?`input[type="range"][data-state="${key}"]`:`#smsEditor input[type="range"][data-model-param="${key}"]`);
   const exact=page.locator(family==='crystals'?`output[data-out="${key}"]`:`#smsEditor output[data-value-for="${key}"]`);
   const closed=exact.locator('xpath=ancestor::details[not(@open)][1]/summary');
   if(await closed.count())await closed.click();
   const original=Number(await slider.inputValue());
   const max=Number(await slider.getAttribute('max'));
   const updated=original+1<=max?original+1:original-1;
   await exact.waitFor({state:'visible',timeout:5000});
   await exact.press('Enter');
   const editor=page.locator(`[data-exact-input="${key}"]`);
   await editor.fill(String(max+1));
   await editor.press('Enter');
   assert.match(await page.getByRole('alert').filter({hasText:'The previous value is unchanged'}).innerText(),/Enter a value from/);
   assert.equal(Number(await slider.inputValue()),original);
   await editor.fill(String(updated));
   await editor.press('Enter');
   assert.equal(Number(await slider.inputValue()),updated);
   const title=page.getByRole('textbox',{name:'Project name'});
   const projectName=`UX-02 fixture: ${family}`;
   await title.fill(projectName);
   await title.press('Tab');
   await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
   await page.reload();
   await page.locator('.sms-workspace-nav [data-tab=design]').click();
   assert.equal(await title.inputValue(),projectName,`${family}: project name survived reload`);
   assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.generator.typeId),family);
   assert.equal(Number(await slider.inputValue()),updated,`${family}: accepted value survived reload`);
   console.log(`Tool finder: ${family}, ${width}px, ${dark?'dark':'light'}`);
  }finally{
   await page.close();
  }
 }
}finally{
 await browser.close();
}
