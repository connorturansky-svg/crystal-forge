import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const browser=await chromium.launch({executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined});
const url=process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321';
try{
 const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.locator('#smsHomeNew').click();
 await page.locator('#smsPicker [data-generator="waves"]').click();
 const help=page.locator('#helpBtn');
 await help.press('Enter');
 const dialog=page.getByRole('dialog',{name:/Crystal Forge.*Help/});
 assert(await dialog.getByRole('heading',{name:'From a new model to a print file'}).isVisible());
 assert(await dialog.getByRole('heading',{name:'Getting started with Crystal Clusters'}).isVisible());
 await mkdir('qa',{recursive:true});
 await page.screenshot({path:'qa/ux02-help-onboarding-390.png'});
 const run=dialog.getByRole('button',{name:'Run browser checks'});
 const report=dialog.getByRole('link',{name:/Download browser report/});
 await run.press('Enter');
 assert.match(await dialog.locator('#studioDiagnosticResults').innerText(),/Studio initialized/);
 await page.context().setOffline(true);
 await run.press('Space');
 const results=dialog.locator('#studioDiagnosticResults');
 assert.match(await results.innerText(),/Browser reports it is offline/);
 assert.match(await results.innerText(),/Saving and backup integrity were not tested/);
 await page.screenshot({path:'qa/ux02-help-diagnostics-390.png'});
 const [download]=await Promise.all([page.waitForEvent('download'),report.press('Enter')]);
 assert.equal(download.suggestedFilename(),'crystal-forge-diagnostics.json');
 const data=JSON.parse(await readFile(await download.path(),'utf8'));
 assert.deepEqual(Object.keys(data),['version','checks']);
 assert.match(data.version,/^v\d+\.\d+\.\d+/);
 assert.deepEqual(data.checks,{
  studioInitialized:true,previewCanvasPresent:true,browserReportsOnline:false,
  webAssemblyExposed:true,workerApiExposed:true,localStorageReadable:true
 });
 await page.keyboard.press('Escape');
 assert.equal(await dialog.isVisible(),false);
 assert(await help.evaluate(el=>el===document.activeElement));
 const checkContrast=async()=>{
  for(const link of [report,dialog.getByRole('link',{name:'the backup and recovery guide'})]){
   const ratio=await link.evaluate(el=>{
    const luminance=color=>{
     const [r,g,b]=color.match(/\d+/g).slice(0,3).map(v=>{
      const channel=Number(v)/255;
      return channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4;
     });
     return .2126*r+.7152*g+.0722*b;
    };
    const colors=[getComputedStyle(el).color,getComputedStyle(el.closest('.dialog')).backgroundColor].map(luminance);
    return (Math.max(...colors)+.05)/(Math.min(...colors)+.05);
   });
   assert(ratio>=4.5,`Help link needs 4.5:1 contrast, measured ${ratio.toFixed(2)}:1`);
  }
 };
 await help.press('Enter');
 await checkContrast();
 await page.keyboard.press('Escape');
 await page.locator('#themeBtn').press('Enter');
 await help.press('Enter');
 await checkContrast();
 const checkPrint=dialog.getByRole('button',{name:/Check current model/});
 const printStatus=dialog.locator('[data-print-check]');
 const openPrint=dialog.getByRole('button',{name:'Open Print Centre'});
 await checkPrint.press('Enter');
 assert.match(await printStatus.innerText(),/no print jobs/);
 assert.equal(await openPrint.isVisible(),false);
 await page.keyboard.press('Escape');
 await page.context().setOffline(false);
 await page.locator('.sms-workspace-nav [data-tab=build]').press('Enter');
 await page.locator('#smsSend').press('Enter');
 const prepare=page.locator('#smsJobs [data-job-prepare]');
 const stl=page.getByRole('button',{name:'Download STL',exact:true});
 await help.press('Enter');
 await checkPrint.press('Enter');
 assert.match(await printStatus.innerText(),/Prepare the current revision/);
 await openPrint.press('Enter');
 await page.context().route('**/studio-model-worker.js',route=>route.abort());
 await prepare.press('Enter');
 await page.getByRole('button',{name:'Retry',exact:true}).waitFor();
 assert(await stl.isDisabled());
 for(const width of [1440,768,390]){
  await page.setViewportSize({width,height:844});
  for(let theme=0;theme<2;theme++){
   await help.press('Enter');
   await checkPrint.press('Enter');
   assert.match(await printStatus.innerText(),/failed or was cancelled.*Retry/);
   await openPrint.scrollIntoViewIfNeeded();
   const box=await openPrint.boundingBox();
   assert(box&&box.width>=24&&box.height>=24&&box.x>=0&&box.x+box.width<=width,
    `Print recovery action must fit at ${width}px`);
   if(width!==768&&theme===0)await page.screenshot({path:`qa/ux02-print-retry-${width}.png`});
   if(width===390&&theme===1)break;
   await page.keyboard.press('Escape');
   assert(await help.evaluate(el=>el===document.activeElement));
   await page.locator('#themeBtn').press('Enter');
  }
 }
 await openPrint.press('Enter');
 assert.equal(await dialog.isVisible(),false);
 assert(await prepare.evaluate(el=>el===document.activeElement));
 await page.context().unroute('**/studio-model-worker.js');
 await prepare.press('Enter');
 await page.waitForFunction(()=>!document.querySelector('#smsJobs [data-job-stl]')?.disabled&&!!document.querySelector('#smsJobs [data-job-stl]'),null,{timeout:60000});
 await help.press('Enter');
 await checkPrint.press('Enter');
 assert.match(await printStatus.innerText(),/marked prepared.*downloads list and permissions/);
 await openPrint.press('Enter');
 const [mesh]=await Promise.all([page.waitForEvent('download'),stl.press('Enter')]);
 assert.match(mesh.suggestedFilename(),/\.stl$/);
 assert.equal(await mesh.failure(),null);
 console.log('Print diagnostics leads from a real worker failure to Retry and a successful STL download.');
 console.log('Help diagnostics reflects offline state, downloads only allowlisted checks and restores focus.');
}finally{
 await browser.close();
}
