import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const browser=await chromium.launch({executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined});
const url=process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321';
try{
 const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.locator('#smsHomeNew').click();
 await page.locator('#smsPicker [data-generator="light-pods"]').click();
 const snapshot=()=>page.evaluate(()=>JSON.stringify(window.__sensoryStudio.project));
 const accepted=await snapshot();
 await page.locator('#smsLibrary').press('Enter');
 const downloadButton=page.getByRole('button',{name:'Download complete backup'});
 const [backup]=await Promise.all([page.waitForEvent('download'),downloadButton.press('Enter')]);
 const bytes=await readFile(await backup.path());
 const restore=page.getByLabel('Restore backup or old Crystal JSON');
 const review=page.getByRole('dialog',{name:'Review backup'});
 await restore.focus();
 assert(await restore.evaluate(el=>el===document.activeElement));
 const [chooser]=await Promise.all([page.waitForEvent('filechooser'),restore.press('Enter')]);
 await chooser.setFiles({name:'backup.json',mimeType:'application/json',buffer:bytes});
 await review.waitFor();
 assert(await review.evaluate(el=>el.contains(document.activeElement)));
 await page.keyboard.press('Escape');
 await review.waitFor({state:'hidden'});
 await page.waitForFunction(()=>document.activeElement?.id==='smsImport',null,{timeout:2000});
 assert.equal(await snapshot(),accepted);
 await restore.setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{incomplete')});
 await page.getByRole('status').filter({hasText:'Could not read backup'}).waitFor();
 assert.equal(await snapshot(),accepted);
 console.log('Backup review opens with focus, Escape returns to the file field, and a corrupt backup leaves the project unchanged.');
 await page.locator('#smsHome').press('Enter');
 for(const [trigger,name,label] of [
  ['Import SVG','Import SVG artwork','Local SVG file'],
  ['Import 3D model','Import 3D model','Local mesh file']
 ]){
  await page.locator('#smsHomeNew').press('Enter');
  await page.getByRole('button',{name:trigger,exact:true}).press('Enter');
  const dialog=page.getByRole('dialog',{name,exact:true});
  const file=dialog.getByLabel(label,{exact:true});
  await file.waitFor({state:'visible'});
  const [importChooser]=await Promise.all([page.waitForEvent('filechooser'),file.press('Enter')]);
  assert.equal(await importChooser.element().getAttribute('type'),'file');
  await dialog.getByRole('button',{name:'Cancel',exact:true}).press('Enter');
  await dialog.waitFor({state:'hidden'});
  assert.equal(await snapshot(),accepted);
 }
 console.log('SVG and STL/OBJ model import dialogs expose native file choosers to keyboard users.');
}finally{
 await browser.close();
}
