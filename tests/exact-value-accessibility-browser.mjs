import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined});
try{
 const page=await browser.newPage();
 const url=process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321';
 await page.goto(new URL('/exact-value-editors.js',url).href);
 await page.setContent(`
  <label>Crystals <output data-out="count">12</output></label>
  <input type="range" data-state="count" min="1" max="60" value="12">
  <label>Base width <output data-value-for="baseWidth">92 mm</output></label>
  <input type="range" data-model-param="baseWidth" min="20" max="150" value="92">
 `);
 await page.evaluate(async()=>{(await import('/exact-value-editors.js')).installExactValueEditors();});
 for(const [label,key,oldValue,newValue,activation] of [['Crystals','count','12','15','Enter'],['Base width','baseWidth','92','92.5','Space']]){
  const button=page.getByRole('button',{name:`Edit exact value for ${label}`,exact:true});
  await button.press(activation,{timeout:5000});
  const editor=page.getByRole('textbox',{name:`Exact value for ${label}`,exact:true});
  assert.equal(await editor.inputValue(),oldValue);
  await editor.fill(newValue);
  await editor.press('Escape');
  assert.equal(await button.evaluate(el=>el===document.activeElement),true);
  const slider=page.locator(`[data-state="${key}"],[data-model-param="${key}"]`);
  assert.equal(await slider.inputValue(),oldValue);
  await button.press(activation);
  await editor.fill('9999');
  await editor.press('Enter');
  assert.equal(await slider.inputValue(),oldValue);
  assert.equal(await editor.getAttribute('aria-invalid'),'true');
  const alert=page.getByRole('alert');
  assert.match(await alert.innerText(),/Enter a value from .* The previous value is unchanged\./);
  assert.equal(await editor.getAttribute('aria-describedby'),await alert.getAttribute('id'));
  assert(await editor.evaluate(el=>el===document.activeElement));
  await editor.fill(newValue);
  assert.equal(await editor.getAttribute('aria-invalid'),null);
  assert.equal(await alert.innerText(),'');
  await editor.press('Enter');
  assert.equal(await slider.inputValue(),newValue);
  assert.equal(await button.evaluate(el=>el===document.activeElement),true);
  assert.equal(await alert.count(),0);
 }
 console.log('Exact value buttons and editors have accessible names and preserve keyboard focus.');
}finally{
 await browser.close();
}
