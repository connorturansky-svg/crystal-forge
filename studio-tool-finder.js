import {rankToolFinderItems} from './studio-tool-registry.js';

export function createToolFinder(onPick,unavailable){
 if(typeof onPick!=='function')throw Error('Tool finder requires a navigation action.');
 const root=document.createElement('div');root.className='sms-tool-finder';
 const label=document.createElement('label');label.htmlFor='smsFindTools';label.textContent='Find tools & downloads';
 const input=document.createElement('input');input.id='smsFindTools';input.type='search';
 input.placeholder='e.g. pixel test fit, magnet, Cura';input.setAttribute('aria-controls','smsFindToolsResults');
 input.setAttribute('aria-label','Find tools and downloads');input.setAttribute('autocomplete','off');
 const list=document.createElement('div');list.id='smsFindToolsResults';list.className='sms-tool-finder-results';
 list.setAttribute('role','group');list.setAttribute('aria-label','Matching tool shortcuts');
 const status=document.createElement('p');status.className='sms-descriptor';status.setAttribute('role','status');
 const render=()=>{
  const query=input.value.trim();
  list.replaceChildren();
  if(!query){status.textContent='Try “LED sockets”, “mounting grid” or “STL export”.';return;}
  const matches=rankToolFinderItems(query);
  status.textContent=matches.length?matches.length+' matching action'+(matches.length===1?'':'s'):'No matching tools. Try “pixel”, “mounting”, “Cura” or “render”.';
  for(const item of matches){
   const button=document.createElement('button');button.type='button';button.className='sms-tool-result';
   const title=document.createElement('strong');title.textContent=item.label;
   const details=document.createElement('small');
   const reason=unavailable(item);
   details.textContent=item.workspace+' · '+(reason||item.description);
   button.append(title,details);
   button.onclick=async()=>{
    const message=await onPick(item);
    if(document.activeElement===button&&input.getClientRects().length)input.focus();
    input.value='';render();
    if(message)status.textContent=message;
   };
   list.append(button);
  }
 };
 input.addEventListener('input',render);
 input.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&input.value){
   event.preventDefault();event.stopPropagation();input.value='';render();
  }
  if(event.key==='ArrowDown'||event.key==='Enter'){
   const button=list.querySelector('button');
   if(button){event.preventDefault();if(event.key==='Enter')button.click();else button.focus();}
  }
 });
 list.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
   event.preventDefault();event.stopPropagation();input.focus();input.value='';render();
  }else if(event.key==='ArrowUp'||event.key==='ArrowDown'){
   const next=event.key==='ArrowUp'?event.target.previousElementSibling||input:event.target.nextElementSibling;
   event.preventDefault();next?.focus();
  }
 });
 root.append(label,input,status,list);render();
 return root;
}
