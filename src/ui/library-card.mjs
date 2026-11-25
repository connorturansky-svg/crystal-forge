let nextActionsId=0;
const controllers=new WeakMap();

// One disclosure controller per Library container. Presentation never calls
// a model action or changes a project; it only exposes the existing buttons.
export function libraryCard(root,card,preview,actions,title){
 const doc=card.ownerDocument;
 let controller=controllers.get(root);
 if(!controller){
  controller={current:null};
  controllers.set(root,controller);
  doc.addEventListener('pointerdown',event=>{
   const current=controller.current;
   if(current&&!current.card.contains(event.target)){
    current.close(current.actions.contains(doc.activeElement));
   }
  },true);
 }
 const artwork=doc.createElement('div'),footer=doc.createElement('div'),toggle=doc.createElement('button');
 artwork.className='sms-library-artwork';footer.className='sms-library-caption';
 toggle.type='button';toggle.className='sms-library-actions-toggle';toggle.textContent='Actions';
 toggle.setAttribute('aria-label','Actions for '+title.textContent);
 actions.id='smsLibraryActions'+(++nextActionsId);
 actions.classList.add('sms-library-actions');
 actions.setAttribute('role','group');actions.setAttribute('aria-label','Actions for '+title.textContent);
 toggle.setAttribute('aria-controls',actions.id);toggle.setAttribute('aria-expanded','false');
 actions.hidden=true;
 artwork.append(preview,actions);footer.append(title,toggle);
 card.prepend(footer,artwork);card.classList.add('sms-library-card');
 let pinned=false,suppressed=false;
 const entry={card,actions,close};
 const touch=doc.defaultView.matchMedia('(hover: none)');
 function show(passive=false){
  if(suppressed)return;
  if(passive&&controller.current!==entry&&controller.current?.card.contains(doc.activeElement))return;
  if(controller.current!==entry)controller.current?.close(false);
  controller.current=entry;
  actions.hidden=false;toggle.setAttribute('aria-expanded','true');
 }
 function close(restore=false){
  pinned=false;actions.hidden=true;toggle.setAttribute('aria-expanded','false');
  if(controller.current===entry)controller.current=null;
  if(restore){suppressed=true;toggle.focus({preventScroll:true});}
 }
 card.addEventListener('pointerenter',event=>{
  if(event.pointerType==='mouse'){suppressed=false;show(true);}
 });
 card.addEventListener('pointerleave',event=>{
  if(event.pointerType!=='mouse')return;
  suppressed=false;
  if(!pinned&&!card.contains(doc.activeElement))close();
 });
 card.addEventListener('focusin',()=>{if(!suppressed&&!touch.matches)show()});
 card.addEventListener('focusout',event=>{
  if(!card.contains(event.relatedTarget)){suppressed=false;if(!pinned)close();}
 });
 toggle.addEventListener('click',()=>{
  if(pinned){close(true);return;}
  suppressed=false;pinned=true;show();
 });
 card.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!actions.hidden){event.preventDefault();event.stopPropagation();close(true);}
 });
 return card;
}
