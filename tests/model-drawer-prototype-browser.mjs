// Start python3 -m http.server 4321 from repository root first.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,args:['--no-sandbox']});
try{
 for(const width of [390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.goto('http://127.0.0.1:4321/tests/fixtures/model-drawer/index.html?large');
  const toggle=page.getByRole('button',{name:/Models \(120\)/});
  await toggle.waitFor();assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  assert.equal(await page.locator('.md-body').isVisible(),false);
  await toggle.press('Enter');assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  const grid=page.locator('.md-grid');assert.equal(await grid.locator('.md-card').count(),120);
  assert(await grid.evaluate(e=>e.scrollHeight>e.clientHeight));
  const host=await page.locator('#viewer').boundingBox(),drawer=await page.locator('.md-drawer').boundingBox();
  assert(drawer.x>=host.x-1&&drawer.x+drawer.width<=host.x+host.width+1);
  assert(Math.abs(drawer.height-host.height/3)<5);
  const search=page.getByRole('searchbox');await search.fill('Mini_Red');
  await page.getByRole('button',{name:'Demo project : Mini_Red',exact:true}).click();
  assert.equal(await page.locator('#active').textContent(),'Active: Mini_Red');
  await page.getByRole('button',{name:'Close Demo project : Mini_Red',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.drawerDemo.project.models.length),120);
  await search.fill('');await search.press('Escape');assert.equal(await page.locator('.md-body').isVisible(),false);
  assert.equal(await page.locator('.md-header button').first().evaluate(e=>e===document.activeElement),true);
  await page.close();
 }
 console.log('Model drawer fixture browser checks passed');
}finally{await browser.close();}
