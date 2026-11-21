/* QA-R04 staged-real-app continuity: use the *actual* old index.html from
 * last successful Git SHA with immutable old JS, then open a new B tab.
 * No extra HTML is added to the deployed _site; the browser route is ephemeral.
 */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const site=process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4339/';
const evidence=JSON.parse(await readFile('qa/pages-retention.json','utf8'));
const latest=evidence.latestSuccess?.sha;
const old=latest&&evidence.staged?.some(s=>s.sha===latest)?latest:evidence.staged?.[0]?.sha;
const now=evidence.currentSha;
assert.match(old||'',/^[0-9a-f]{40}$/i);
assert.match(now||'',/^[0-9a-f]{40}$/i);
assert.notEqual(old,now);
const html=execFileSync('git',['show',old+':index.html'],{encoding:'utf8',maxBuffer:20*1024*1024});
assert(html.includes('<head>'),'Historical app must contain the entrypoint head');
const oldHtml=html.replace('<head>','<head><base href="./releases/'+old+'/"><meta name="studio-release" content="'+old+'">')
 .replaceAll('https://cdn.jsdelivr.net/npm/three@0.165.0/','./vendor/three/');
const browser=await chromium.launch({headless:true,
 executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage']});
const errors=[],workers={old:[],now:[]};
await mkdir('qa',{recursive:true});
try{
 const oldPage=await browser.newPage({acceptDownloads:true,viewport:{width:1280,height:900}});
 oldPage.on('pageerror',error=>errors.push('A '+error.message));
 oldPage.on('response',response=>{if(response.status()>=400)errors.push('A HTTP '+response.status()+' '+response.url());});
 oldPage.on('request',request=>{if(request.url().includes('fabrication-worker.js'))workers.old.push(request.url());});
 // The old tab must use the exact live root URL, not a synthetic /qa path:
 // applications may resolve navigation/state against location.pathname.
 await oldPage.route(site,route=>
  route.fulfill({status:200,contentType:'text/html',body:oldHtml}));
 await oldPage.goto(site,{waitUntil:'domcontentloaded'});
 await oldPage.unroute(site);
 await oldPage.waitForFunction(()=>window.__sensoryStudio,{timeout:45000});
 assert((await oldPage.evaluate(()=>document.baseURI)).includes('/releases/'+old+'/'));
 await oldPage.locator('#smsHomeNew').click();
 await oldPage.locator('#smsPicker [data-generator="tactile-tiles"]').click();
 console.log('Historical Pages QA phase: old version '+old.slice(0,8)+' loaded and Tile created');
 assert.equal(workers.old.length,0,'Old tab must defer manufacturing-worker startup until first Prepare');
 // B becomes the current published entrypoint while A stays open.
 const newPage=await browser.newPage({acceptDownloads:true,viewport:{width:1280,height:900}});
 newPage.on('pageerror',error=>errors.push('B '+error.message));
 newPage.on('response',response=>{if(response.status()>=400)errors.push('B HTTP '+response.status()+' '+response.url());});
 newPage.on('request',request=>{if(request.url().includes('fabrication-worker.js'))workers.now.push(request.url());});
 await newPage.goto(site,{waitUntil:'domcontentloaded'});
 await newPage.waitForFunction(()=>window.__sensoryStudio,{timeout:45000});
 assert((await newPage.evaluate(()=>document.baseURI)).includes('/releases/'+now+'/'));
 await newPage.locator('#smsHomeNew').click();
 await newPage.locator('#smsPicker [data-generator="tactile-tiles"]').click();
 console.log('Historical Pages QA phase: new version '+now.slice(0,8)+' loaded and Tile created');
 const run=async(page,sha,label)=>{
  console.log('Historical Pages QA phase: opening Build on '+label+' at '+page.url());
  // This QA protects worker/module loading rather than pointer actionability;
  // trigger the actual DOM click handler to avoid a Playwright navigation
  // heuristic mistaking the historical base URI for a future navigation.
  await page.locator('.sms-workspace-nav [data-tab=build]')
   .evaluate(button=>button.click(),undefined,{timeout:15000});
  console.log('Historical Pages QA phase: sending '+label+' to Print Centre');
  await page.locator('#smsSend').evaluate(button=>button.click(),undefined,{timeout:15000});
  const prepare=page.locator('#smsJobs [data-job-prepare]').first();
  console.log('Historical Pages QA phase: preparing '+label);
  await prepare.evaluate(button=>button.click(),undefined,{timeout:15000});
  await page.waitForFunction(()=>[...document.querySelectorAll('#smsJobs [data-job-stl]')]
   .some(button=>!button.disabled),undefined,{timeout:90000});
  const [download]=await Promise.all([
   page.waitForEvent('download',{timeout:30000}),
   page.locator('#smsJobs [data-job-stl]').first().click()
  ]);
  assert.equal(await download.failure(),null,label+' downloaded STL');
  assert.match(download.suggestedFilename(),/\.stl$/);
  const file=await readFile(await download.path());
  assert(file.length>84,label+' STL has triangle payload');
  await page.screenshot({path:'qa/pages-retained-'+label+'.png'});
  return {releaseSha:sha,stlBytes:file.length,filename:download.suggestedFilename()};
 };
 const a=await run(oldPage,old,'old-a');
 const b=await run(newPage,now,'new-b');
 assert(workers.old.some(url=>url.includes('/releases/'+old+'/fabrication-worker.js')),
  'Old A must spawn its original immutable SHA worker after B has loaded');
 assert(workers.now.some(url=>url.includes('/releases/'+now+'/fabrication-worker.js')),
  'New B must spawn its current SHA worker');
 assert.deepEqual(errors,[],'No missing assets or browser exceptions across A and B');
 console.log(JSON.stringify({status:'real staged historical A and current B pass manufacturing',
  previous:a,current:b,oldWorkerRequests:workers.old.length,newWorkerRequests:workers.now.length},null,2));
}finally{await browser.close();}
