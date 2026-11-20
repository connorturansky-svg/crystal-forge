// Numeric controls in the contextual Studio palette. The legacy Precision
// settings use exact-value-editors.js; this shared renderer closes the gap for
// all native Design sliders and the compatible Crystal palette controls.
const integerKeys=new Set(['seed','count','teeth','spokes','facets','gripCount','roundSteps','pixelCount','edge-finish-steps']);
export function parsePrecisionNumber(text,field){
 if(!String(text).trim())return {error:'Enter a number.'};
 const value=Number(text),min=Number(field.min),max=Number(field.max);
 if(!Number.isFinite(value))return {error:'Enter a finite number.'};
 if(value<min||value>max)return {error:'Enter a value from '+min+' to '+max+'.'};
 if(integerKeys.has(field.key)&&!Number.isInteger(value))return {error:'Enter a whole number.'};
 return {value};
}
export function renderPrecisionRange(root,field,initial,apply,disabled=false){
 const control=document.createElement('div');
 control.className='sms-visual-range';control.dataset.precisionKey=field.key;
 const caption=document.createElement('span');
 caption.textContent=field.label;caption.className='sms-visual-range-caption';
 const slider=document.createElement('input');
 slider.type='range';slider.dataset.paletteKey=field.key;
 slider.min=field.min;slider.max=field.max;slider.step=field.step??.1;
 slider.value=initial;slider.disabled=disabled;
 slider.setAttribute('aria-label',field.label);
 const button=document.createElement('button');
 button.type='button';button.className='sms-precision-value';
 button.setAttribute('aria-label','Edit exact value for '+field.label);
 button.title='Click to type an exact value. Enter applies; Escape cancels.';
 button.disabled=disabled;
 const editor=document.createElement('input');
 editor.type='number';editor.className='sms-precision-input';
 editor.dataset.precisionInput=field.key;
 editor.min=field.min;editor.max=field.max;
 editor.step=integerKeys.has(field.key)?'1':'any';
 editor.hidden=true;editor.disabled=disabled;
 editor.setAttribute('aria-label','Exact value for '+field.label);
 const error=document.createElement('small');
 error.className='sms-precision-error';error.setAttribute('role','status');
 error.hidden=true;
 const canReset=field.default!==undefined&&Number.isFinite(Number(field.default));
 const originalDefault=Number(field.default);
 const reset=document.createElement('button');
 reset.type='button';reset.className='sms-precision-reset';
 reset.dataset.resetPrecision=field.key;reset.textContent='Reset';
 reset.title='Restore '+field.label+' to its model default';
 reset.setAttribute('aria-label','Reset '+field.label+' to default'+(canReset?' ('+originalDefault+(field.unit?' '+field.unit:'')+')':''));
 reset.disabled=disabled||!canReset||Math.abs(Number(initial)-originalDefault)<1e-9;
 const update=()=>{button.textContent=slider.value+(field.unit?' '+field.unit:'');};
 const clearError=()=>{
  error.hidden=true;error.textContent='';editor.removeAttribute('aria-invalid');
 };
 const showError=message=>{
  error.hidden=false;error.textContent=message;
  editor.setAttribute('aria-invalid','true');
 };
 const close=()=>{editor.hidden=true;button.hidden=false;clearError();};
 const submit=(raw,fromEditor)=>{
  clearError();
  const checked=parsePrecisionNumber(raw,field);
  if(checked.error){
   showError(checked.error+' The previous value is unchanged.');
   return false;
  }
  const next=checked.value;
  // Keep exact entered decimals instead of snapping to the range's visual
  // step interval. Count controls always retain integer semantics.
  if(fromEditor&&!integerKeys.has(field.key))slider.step='any';
  slider.value=String(next);
  if(Number(slider.value)!==next){
   slider.value=String(initial);update();
   showError('The browser could not represent this value exactly.');
   return false;
  }
  if(next===Number(initial)){update();close();return true;}
  let result;
  try{result=apply(next);}
  catch(cause){slider.value=String(initial);update();showError(cause.message||'The model rejected this value.');return false;}
  if(result===false){
   slider.value=String(initial);update();
   showError('The model rejected this value. Your previous setting is unchanged.');
   return false;
  }
  update();close();return true;
 };
 slider.oninput=update;
 slider.onchange=()=>submit(slider.value,false);
 button.onclick=()=>{
  clearError();editor.value=String(slider.value);editor.hidden=false;
  button.hidden=true;editor.focus();editor.select();
 };
 editor.addEventListener('keydown',event=>{
  if(!['Enter','Escape'].includes(event.key))return;
  event.preventDefault();event.stopPropagation();
  if(event.key==='Escape'){close();button.focus();return;}
  if(submit(editor.value,true)){
   document.querySelector('.sms-palette [data-precision-key="'+field.key+'"] .sms-precision-value')?.focus({preventScroll:true});
  }
 });
 editor.addEventListener('input',clearError);
 editor.addEventListener('blur',()=>{if(!editor.hidden)close();});
 reset.onclick=()=>{
  if(submit(String(originalDefault),true)){
   document.querySelector('.sms-palette [data-precision-key="'+field.key+'"] .sms-precision-reset')?.focus({preventScroll:true});
  }
 };
 update();control.append(caption,button,editor,reset,slider,error);
 root.append(control);
 return control;
}
