// Isolated candidate UI. No project writes or renderer imports; integrate via callbacks.
export function modelRows(project) {
 const byId=new Map(project.models.map(m=>[m.id,m]));
 return project.tabs.map(id=>byId.get(id)).filter(Boolean).map(m=>({
  id:m.id, name:m.name?.trim()||'Unnamed model', label:(project.title||'Untitled project')+' : '+(m.name?.trim()||'Unnamed model'),
  revision:m.revision, linked:!!m.link, family:m.generator.typeId,
  preparing:project.printJobs?.some(j=>j.modelId===m.id&&j.status==='preparing')||false
 }));
}
export function reorderOpen(ids, from, to) {
 if(!ids.includes(from)||!ids.includes(to)||from===to)return [...ids];
 const next=ids.filter(id=>id!==from); next.splice(ids.indexOf(to),0,from); return next;
}
export function filterRows(rows, query='') {
 const q=query.trim().toLocaleLowerCase();
 return rows.filter(row=>row.name.toLocaleLowerCase().includes(q));
}
// One render at a time, bounded cache, failures retryable. Caller supplies a
// source-faithful key and renderer, and checks that the card is still current.
export function createPreviewQueue(render,{limit=64,maxBytes=4*1024*1024,yieldFrame=()=>new Promise(resolve=>setTimeout(resolve,0))}={}) {
 const cache=new Map(), pending=new Map(); let tail=Promise.resolve(),bytes=0;
 function invalidate(key){const old=cache.get(key);if(old){bytes-=2*(old.src.length+key.length);cache.delete(key);}}
 return {
  request(key,input,isCurrent=()=>true) {
   if(cache.has(key)){const value=cache.get(key);cache.delete(key);cache.set(key,value);return Promise.resolve(value);}
   if(pending.has(key))return pending.get(key);
   const task=tail.then(async()=>{
    await yieldFrame(); if(!isCurrent())return null;
    const result=await render(input);
    if(!result||typeof result.src!=='string'||!/^data:image\/(png|jpeg|webp);base64,/.test(result.src))throw Error(result?.reason||'Preview could not be rendered');
    if(!isCurrent())return null;
    cache.set(key,result);bytes+=2*(result.src.length+key.length);
    while(cache.size>limit||bytes>maxBytes)invalidate(cache.keys().next().value);
    return result;
   });
   pending.set(key,task);tail=task.catch(()=>{}).finally(()=>pending.delete(key));return task;
  },
  invalidate
 };
}
export function createModelDrawer(host, {getProject, select, close, add, rename, reorder, info, newControl, previewKey, renderPreview, previewQueue}) {
 const d=host.ownerDocument,el=(tag,cls,text)=>{const n=d.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
 const button=(label,action)=>{const b=el('button','',label);b.type='button';b.addEventListener('click',action);return b;};
 const root=el('section','md-drawer');root.setAttribute('aria-label','Open models');
 const header=el('div','md-header'),toggle=button('Models',()=>setOpen(!open)),summary=el('span','md-summary');
 const newButton=newControl||button('New model',()=>add());header.append(toggle,summary,newButton);
 const body=el('div','md-body');body.id='md-drawer-body';body.hidden=true;
 toggle.setAttribute('aria-controls',body.id);toggle.setAttribute('aria-expanded','false');
 const search=el('input','md-search');search.type='search';search.placeholder='Find an open model';search.setAttribute('aria-label','Find an open model');
 const grid=el('div','md-grid');grid.setAttribute('role','list');body.append(search,grid);root.append(header,body);host.append(root);
 let open=false,generation=0,observer=null,projectId;
 const queue=previewQueue||createPreviewQueue(renderPreview);
 const setOpen=(value,focus=true)=>{
  open=value;body.hidden=!open;root.classList.toggle('md-open',open);
  toggle.setAttribute('aria-expanded',String(open));update();if(!open&&focus)toggle.focus();
 };
 function update(){
  const project=getProject(),rows=modelRows(project),active=rows.find(r=>r.id===project.activeTab);
  if(projectId!==project.id){projectId=project.id;search.value='';grid.scrollTop=0;}
  toggle.textContent='☰ Models ('+rows.length+') '+(open?'▾':'▴');summary.textContent=(project.title||'Untitled project')+' : '+(active?.name||'No open model');
  summary.title=summary.textContent;
  const focused=d.activeElement?.closest?.('[data-model-id]'),focusId=focused?.dataset.modelId,focusAction=d.activeElement?.dataset.action;
  const scroll=grid.scrollTop;observer?.disconnect();observer=null;const epoch=++generation;grid.replaceChildren();
  if(!open)return;
  const cards=filterRows(rows,search.value);
  if(!cards.length)grid.append(el('p','md-empty',rows.length?'No matching models':'No open models. Choose New model.'));
  const loaders=new Map();
  if(typeof IntersectionObserver!=='undefined')observer=new IntersectionObserver(entries=>{
   for(const entry of entries)if(entry.isIntersecting){observer?.unobserve(entry.target);loaders.get(entry.target)?.();}
  },{root:grid});
  for(const row of cards){
   const card=el('div','md-card');card.dataset.modelId=row.id;card.setAttribute('role','listitem');
   const selected=row.id===project.activeTab;card.classList.toggle('md-active',selected);
   const thumb=el('span','md-thumb','Preview pending');
   const name=el('span','md-name',row.name),pick=button('',()=>select(row.id));pick.className='md-pick';pick.dataset.action='select';pick.setAttribute('aria-label',row.label);if(selected)pick.setAttribute('aria-current','true');
   pick.id='model-tab-'+row.id;
   pick.append(thumb,name);if(row.preparing)name.append(el('small','','Preparing'));if(selected)name.append(el('small','','Active'));
   const renameButton=button('Rename',()=>rename(row.id));renameButton.dataset.action='rename';renameButton.setAttribute('aria-label','Rename '+row.label);
   const closeButton=button('×',()=>close(row.id));closeButton.dataset.action='close';closeButton.setAttribute('aria-label','Close '+row.label);
   const retry=button('Retry preview',()=>load());retry.hidden=true;retry.dataset.action='retry';
   card.append(pick,renameButton);
   if(info){const details=button('Info',()=>info(row.id,thumb.querySelector('img')?'Ready':thumb.textContent));details.dataset.action='info';details.setAttribute('aria-label','Information about '+row.label);card.append(details);}
   card.append(closeButton,retry);
   const move=target=>{reorder(reorderOpen(rows.map(r=>r.id),row.id,target));};
   pick.draggable=true;pick.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',row.id));
   card.addEventListener('dragover',e=>e.preventDefault());card.addEventListener('drop',e=>{e.preventDefault();const from=e.dataTransfer.getData('text/plain');if(rows.some(r=>r.id===from))reorder(reorderOpen(rows.map(r=>r.id),from,row.id));});
   pick.addEventListener('keydown',e=>{
    const i=rows.findIndex(r=>r.id===row.id);
    if(e.key==='Delete'){e.preventDefault();close(row.id);}
    else if(e.altKey&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
     e.preventDefault();move(rows[Math.max(0,Math.min(rows.length-1,i+(['ArrowUp','ArrowLeft'].includes(e.key)?-1:1)))].id);
    }
    else if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
     e.preventDefault();const j=cards.indexOf(row);
     const target=cards[e.key==='Home'?0:e.key==='End'?cards.length-1:(j+(e.key==='ArrowRight'?1:-1)+cards.length)%cards.length];
     select(target.id);d.getElementById('model-tab-'+target.id)?.focus();
    }
   });
   async function load(){
    const current=()=>open&&generation===epoch&&card.isConnected;
    if(!current())return;retry.hidden=true;thumb.textContent='Loading preview';
    try{
     const key=previewKey(project,row),model=project.models.find(x=>x.id===row.id);
     const result=await queue.request(key,{projectId:project.id,modelId:row.id,revision:row.revision,model},current);
     if(!current())return;
     if(!result){thumb.textContent='Preview deferred';retry.hidden=false;return;}
     const img=el('img');img.alt='';img.src=result.src;img.decoding='async';img.onerror=()=>{if(current()){queue.invalidate(key);thumb.textContent='Preview image invalid';retry.hidden=false;}};
     thumb.replaceChildren(img);
    }catch(error){if(current()){thumb.textContent=error.message||'Preview unavailable';retry.hidden=false;}}
   }
   loaders.set(card,load);grid.append(card);if(observer)observer.observe(card);else if(cards.indexOf(row)<12)load();else retry.hidden=false;
  }
  grid.scrollTop=scroll;
  if(focusId){const candidates=[...grid.querySelectorAll('[data-model-id]')];const card=candidates.find(c=>c.dataset.modelId===focusId)||candidates.find(c=>c.querySelector('[aria-current]'))||candidates[0];(card?.querySelector('[data-action="'+(focusAction||'select')+'"]')||toggle).focus({preventScroll:true});}
 }
 search.addEventListener('input',update);
 root.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){e.preventDefault();e.stopPropagation();setOpen(false);}});
 update();
 return {root,header,grid,toggle,update,setOpen,get open(){return open;},destroy(){generation++;observer?.disconnect();root.remove();}};
}
