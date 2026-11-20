// Lightweight, keyboard-accessible search for actions in the LEFT Studio pane.
// Results have explicit actions rather than merely filtering the right inspector.
export const TOOL_FINDER_ITEMS=Object.freeze([
 {id:'pixel-coupon',label:'Download pixel fit test (STL)',description:'Test strips and stepped LED socket clearance coupons',keywords:'pixel test fit calibration coupon led hole size wire relief',action:'coupon'},
 {id:'pixel-tools',label:'Open pixel fittings and profiles',description:'Choose measured LEDs and place physical pixel sockets',keywords:'pixel light led profile measured gumdrop seed placement',action:'pixels'},
 {id:'mount-tools',label:'Open mounting and attachments',description:'Mounting holes, screw fixings, magnet pockets and external edge tabs',keywords:'tabs mounting screw holes magnet insert attachment flange ears',action:'mounts'},
 {id:'route-tools',label:'Open cable routing controls',description:'Serial pixel wiring, IN/OUT, spacing and automatic route',keywords:'wire wiring cable route routing auto input output in out pitch',action:'routes'},
 {id:'manufacturing',label:'Open real manufacturing inspection',description:'Prepare and inspect the actual printable geometry',keywords:'render actual mesh prepare print cutaway geometry boolean',action:'manufacturing'},
 {id:'cura',label:'Open Cura profile download',description:'Printer, nozzle, material and quality settings',keywords:'cura profile download print slicer nozzle filament',action:'cura'},
 {id:'export',label:'Open STL, 3MF and production downloads',description:'Prepare and export the latest selected model',keywords:'stl 3mf zip export download production printable',action:'export'}
]);
export function createToolFinder(onPick){
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
  const words=input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  list.replaceChildren();
  if(!words.length){status.textContent='Search all seven builders or download a pixel test-fit STL.';return;}
  const matches=TOOL_FINDER_ITEMS.filter(item=>{
   const content=[item.label,item.description,item.keywords].join(' ').toLowerCase();
   return words.every(word=>content.includes(word));
  });
  status.textContent=matches.length?matches.length+' matching action'+(matches.length===1?'':'s'):'No matching tools. Try “pixel”, “mounting”, “Cura” or “render”.';
  for(const item of matches){
   const button=document.createElement('button');button.type='button';button.className='sms-tool-result';
   const title=document.createElement('strong');title.textContent=item.label;
   const details=document.createElement('small');details.textContent=item.description;
   button.append(title,details);
   button.onclick=()=>{
    onPick(item.action);
    if(document.activeElement===button&&input.getClientRects().length)input.focus();
    input.value='';render();
   };
   list.append(button);
  }
 };
 input.addEventListener('input',render);
 input.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&input.value){
   event.preventDefault();event.stopPropagation();input.value='';render();
  }
  if(event.key==='ArrowDown'){const button=list.querySelector('button');if(button){event.preventDefault();button.focus();}}
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
