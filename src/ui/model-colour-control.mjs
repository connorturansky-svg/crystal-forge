import {MODEL_SWATCHES,formatModelHex,parseModelHex,isModelColour} from './model-colour.mjs';

function element(tag,text,attrs={}){
 const el=document.createElement(tag);
 if(text)el.textContent=text;
 for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);
 return el;
}
function label(text,control){
 const el=element('label',text+' ');el.append(control);return el;
}
// A reusable dialog for classic and native model material roles. Preview-only
// input remains local; the owner callback receives one exact committed RGB.
export function openModelColourControl({value,roleLabel='Primary model colour',commit,opener=document.activeElement}){
 if(!isModelColour(value)||typeof commit!=='function')throw Error('Colour control requires an exact RGB value and commit callback.');
 const dialog=element('dialog','',{'aria-label':roleLabel,'data-model-colour-dialog':''});
 const form=element('form'),heading=element('h2',roleLabel);
 const note=element('p','Changes model display colour, not the simulated LED or a verified filament colour.');
 const picker=element('input','',{type:'color','data-model-colour-picker':''});
 const hex=element('input','',{type:'text',maxlength:'7',autocomplete:'off',spellcheck:'false','data-model-colour-hex':''});
 const swatches=element('div','',{class:'model-colour-swatches',role:'group','aria-label':'Quick colours'});
 const status=element('p','',{role:'alert'}),actions=element('div','',{class:'sms-actions'});
 const apply=element('button','Apply colour',{type:'submit'}),cancel=element('button','Cancel',{type:'button'});
 const reset=element('button','Reset choice',{type:'button'});
 const buttons=[];
 let draft=value;
 function renderSelection(){
  for(const [button,colour] of buttons)button.setAttribute('aria-pressed',String(colour===draft));
 }
 function setDraft(colour){
  draft=colour;hex.value=formatModelHex(draft);picker.value=hex.value.toLowerCase();
  hex.removeAttribute('aria-invalid');status.textContent='';renderSelection();
 }
 for(const {name,value:colour} of MODEL_SWATCHES){
  const button=element('button','',{type:'button','aria-label':name+' '+formatModelHex(colour)});
  const sample=element('span','',{'aria-hidden':'true',class:'model-colour-sample'});
  sample.style.backgroundColor=formatModelHex(colour);
  button.append(sample,element('span',name));button.onclick=()=>setDraft(colour);
  buttons.push([button,colour]);swatches.append(button);
 }
 picker.oninput=()=>setDraft(parseModelHex(picker.value));
 hex.oninput=()=>{
  try{draft=parseModelHex(hex.value);picker.value=formatModelHex(draft).toLowerCase();status.textContent='';hex.removeAttribute('aria-invalid');}
  catch{draft=null;}
  renderSelection();
 };
 reset.onclick=()=>setDraft(value);
 cancel.onclick=()=>dialog.close();
 form.onsubmit=event=>{
  event.preventDefault();
  try{
   const selected=parseModelHex(hex.value);
   if(selected!==value&&commit(selected)===false)throw Error('The colour could not be saved. Your previous choice is unchanged.');
   dialog.close();
  }catch(error){hex.setAttribute('aria-invalid','true');status.textContent=error.message;hex.focus();}
 };
 actions.append(apply,reset,cancel);
 form.append(heading,note,label('Choose colour',picker),label('Exact HEX colour',hex),swatches,status,actions);dialog.append(form);
 dialog.addEventListener('close',()=>{dialog.remove();if(opener?.isConnected)opener.focus({preventScroll:true});},{once:true});
 setDraft(value);document.body.append(dialog);dialog.showModal();hex.focus();hex.select();
 return dialog;
}
