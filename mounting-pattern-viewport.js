// Project the draft on its mounting plane. Dragging edits its centre only;
// the model is changed by the editor's separately validated Apply action.
export function mountPatternViewport({THREE,canvas,camera,visible=()=>true}){
 const layer=document.createElement('div');
 layer.className='hardware-marker-layer mounting-pattern-overlay';
 const centre=document.createElement('button');
 centre.type='button';centre.className='hardware-marker pattern-centre';
 centre.textContent='✥';centre.setAttribute('aria-label','Move mounting pattern centre');
 centre.title='Drag or use the arrow keys to move the pattern centre';
 layer.append(centre);canvas.parentElement.append(layer);layer.hidden=true;
 const plane=new THREE.Plane(new THREE.Vector3(0,1,0),-.9);
 const ray=new THREE.Raycaster(),cursor=new THREE.Vector2(),point=new THREE.Vector3();
 let current,updateCentre,drag,frame,markers=[];
 function hit(event){
  const rect=canvas.getBoundingClientRect();
  cursor.set((event.clientX-rect.left)*2/rect.width-1,1-(event.clientY-rect.top)*2/rect.height);
  ray.setFromCamera(cursor,camera);
  return ray.ray.intersectPlane(plane,new THREE.Vector3());
 }
 centre.onpointerdown=event=>{
  if(event.button!==0||!current)return;
  const start=hit(event);
  if(!start)return;
  event.stopPropagation();
  centre.setPointerCapture(event.pointerId);
  drag={id:event.pointerId,start,origin:current.centre};
 };
 centre.onpointermove=event=>{
  if(drag?.id!==event.pointerId)return;
  const end=hit(event);
  if(end)updateCentre(drag.origin.centerX+end.x-drag.start.x,drag.origin.centerZ+end.z-drag.start.z);
 };
 centre.onpointerup=centre.onlostpointercapture=centre.onpointercancel=()=>{drag=null;};
 centre.onkeydown=event=>{
  const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
  if(!delta||!current)return;
  event.preventDefault();event.stopPropagation();
  const step=event.shiftKey?5:1;
  updateCentre(current.centre.centerX+step*delta[0],current.centre.centerZ+step*delta[1]);
 };
 function position(){
  const rect=canvas.getBoundingClientRect();
  layer.hidden=!visible()||!rect.width||!rect.height;
  if(!layer.hidden){
   const place=(element,x,z)=>{
    point.set(x,.9,z).project(camera);
    element.hidden=Math.abs(point.x)>1||Math.abs(point.y)>1||Math.abs(point.z)>1;
    element.style.left=(point.x+1)*rect.width/2+'px';
    element.style.top=(1-point.y)*rect.height/2+'px';
   };
   place(centre,current.centre.centerX,current.centre.centerZ);
   markers.forEach((element,index)=>{
    const {x,z}=current.candidates[index];
    place(element,x,z);
   });
  }
  frame=requestAnimationFrame(position);
 }
 function clear(){
  if(frame)cancelAnimationFrame(frame);
  frame=null;current=null;drag=null;layer.hidden=true;
  markers.forEach(marker=>marker.remove());markers=[];
 }
 return {
  preview(transaction,issues,move){
   if(!transaction){clear();return;}
   current=transaction;updateCentre=move;
   if(markers.length!==transaction.candidates.length){
    markers.forEach(marker=>marker.remove());
    markers=transaction.candidates.map((_,index)=>{
     const marker=document.createElement('span');marker.className='pattern-hole';
     marker.textContent=String(index+1);layer.append(marker);return marker;
    });
   }
   markers.forEach((marker,index)=>marker.classList.toggle('invalid',Boolean(issues[index])));
   if(!frame)position();
  },
  clear
 };
}
