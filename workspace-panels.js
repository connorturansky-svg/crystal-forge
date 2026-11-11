/* Accessible, persisted workspace panel resizing; never changes scene geometry.
 * Resizers are outside the Three.js canvas to avoid stealing 3D drag gestures.
 */
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function installResizablePanels(root=document.querySelector('.layout')){
 if(!root)return ()=>{};
 const left=root.querySelector('.left'),right=root.querySelector('.right');
 if(!left||!right)return ()=>{};
 const key='crystal-forge-workspace-widths-v1';
 let widths={left:315,right:300};
 try{const v=JSON.parse(localStorage.getItem(key)||'null');
  if(Number.isFinite(v?.left)&&Number.isFinite(v?.right))widths={left:v.left,right:v.right};
 }catch{}
 const mobile=()=>window.innerWidth<=850;
 const apply=()=>{
  if(mobile()){root.style.removeProperty('grid-template-columns');return}
  const available=root.getBoundingClientRect().width;
  const l=clamp(widths.left,260,Math.max(260,available-570));
  const r=clamp(widths.right,235,Math.max(235,available-l-320));
  widths={left:l,right:r};
  root.style.gridTemplateColumns=l+'px minmax(320px,1fr) '+r+'px';
 };
 const save=()=>{try{localStorage.setItem(key,JSON.stringify(widths))}catch{}};
 const handles=['left','right'].map(kind=>{
  const handle=document.createElement('div');
  handle.className='workspace-resizer workspace-resizer-'+kind;
  handle.setAttribute('role','separator');
  handle.setAttribute('aria-orientation','vertical');
  handle.setAttribute('aria-label','Resize '+kind+' settings panel');
  handle.tabIndex=0;
  root.appendChild(handle);
  const sync=()=>{
   const width=root.getBoundingClientRect().width;
   handle.hidden=mobile();
   handle.style.left=(kind==='left'?widths.left:width-widths.right)-4+'px';
   handle.setAttribute('aria-valuenow',String(Math.round(widths[kind])));
  };
  const setWidth=width=>{
   const max=Math.max(kind==='left'?260:235,
    root.getBoundingClientRect().width-(kind==='left'?widths.right:widths.left)-320);
   widths[kind]=clamp(width,kind==='left'?260:235,max);
   apply();handles.forEach(h=>h.sync());save();
  };
  let start=null;
  handle.addEventListener('pointerdown',e=>{
   if(mobile())return;
   start={x:e.clientX,width:widths[kind]};handle.setPointerCapture(e.pointerId);
   e.preventDefault();
  });
  handle.addEventListener('pointermove',e=>{
   if(!start)return;
   setWidth(start.width+(e.clientX-start.x)*(kind==='left'?1:-1));
  });
  handle.addEventListener('pointerup',()=>{start=null;save()});
  handle.addEventListener('pointercancel',()=>{start=null});
  handle.addEventListener('keydown',e=>{
   if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
    e.preventDefault();setWidth(widths[kind]+(e.key==='ArrowRight'?1:-1)*10*(kind==='left'?1:-1));
   }else if(e.key==='Home'){e.preventDefault();setWidth(kind==='left'?260:235)}
  });
  return {element:handle,sync};
 });
 const resize=()=>{apply();handles.forEach(h=>h.sync())};
 window.addEventListener('resize',resize);resize();
 return ()=>{window.removeEventListener('resize',resize);handles.forEach(h=>h.element.remove());root.style.removeProperty('grid-template-columns')};
}
