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
 const note=element('p','Sets the model display colour. Simulated LED light and filament appearance are separate.');
 const picker=element('input','',{type:'color','data-model-colour-picker':''});
 const hex=element('input','',{type:'text',maxlength:'7',autocomplete:'off',spellcheck:'false','data-model-colour-hex':''});
 const rgb=element('fieldset','',{class:'model-colour-rgb'});
 rgb.append(element('legend','Exact RGB colour'));
 const channels=['Red','Green','Blue'].map(name=>{
  const input=element('input','',{type:'number',min:'0',max:'255',step:'1',required:'','data-model-colour-channel':''});
  rgb.append(label(name,input));return input;
 });
 const swatches=element('div','',{class:'model-colour-swatches',role:'group','aria-label':'Quick colours'});
 const status=element('p','',{role:'alert'}),actions=element('div','',{class:'sms-actions model-colour-actions'});
 const apply=element('button','Apply colour',{type:'submit'}),cancel=element('button','Cancel',{type:'button'});
 const reset=element('button','Reset choice',{type:'button'});
 const buttons=[];
 let draft=value,source=hex;
 function renderSelection(){
  for(const [button,colour] of buttons)button.setAttribute('aria-pressed',String(colour===draft));
 }
 function syncChannels(colour){
  channels.forEach((input,index)=>{input.value=(colour>>((2-index)*8))&255;});
 }
 function exactChannels(){
  if(channels.some(input=>!input.value||!input.validity.valid))throw Error('Enter red, green and blue as integers from 0 to 255.');
  return channels.reduce((colour,input)=>colour*256+Number(input.value),0);
 }
 function setDraft(colour){
  for(const input of channels)input.removeAttribute('aria-invalid');
  source=hex;syncChannels(colour);draft=colour;hex.value=formatModelHex(draft);picker.value=hex.value.toLowerCase();
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
  source=hex;
  try{draft=parseModelHex(hex.value);syncChannels(draft);picker.value=formatModelHex(draft).toLowerCase();status.textContent='';hex.removeAttribute('aria-invalid');}
  catch{draft=null;}
  renderSelection();
 };
 for(const input of channels)input.oninput=()=>{
  source=input;
  try{draft=exactChannels();for(const channel of channels)channel.removeAttribute('aria-invalid');hex.value=formatModelHex(draft);picker.value=hex.value.toLowerCase();hex.removeAttribute('aria-invalid');status.textContent='';}
  catch{draft=null;}
  renderSelection();
 };
 reset.onclick=()=>setDraft(value);
 cancel.onclick=()=>dialog.close();
 form.onsubmit=event=>{
  event.preventDefault();
  try{
   const selected=source===hex?parseModelHex(hex.value):exactChannels();
   if(selected!==value&&commit(selected)===false)throw Error('The colour could not be saved. Your previous choice is unchanged.');
   dialog.close();
  }catch(error){source.setAttribute('aria-invalid','true');status.textContent=error.message;source.focus();}
 };
 actions.append(apply,reset,cancel);
 form.append(heading,note,label('Choose colour',picker),label('Exact HEX colour',hex),rgb,swatches,status,actions);dialog.append(form);
 dialog.addEventListener('close',()=>{dialog.remove();if(opener?.isConnected)opener.focus({preventScroll:true});},{once:true});
 setDraft(value);document.body.append(dialog);dialog.showModal();hex.focus();hex.select();
 return dialog;
}
