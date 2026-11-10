/* Build-stage placement/inspection: same authoritative plan as fabrication. */
import {planHardware} from './hardware-layout.js';

export function createHardwareEditor({THREE,scene,renderer,camera,getSettings,getCrystals,onEdit,onStatus}){
 const $=id=>document.getElementById(id),guides=new THREE.Group();
 guides.name='Live hardware holes';scene.add(guides);
 let placing=null,pointerStart=null;
 const numeric=v=>Number(v).toFixed(1);
 const isBuild=()=>!!document.querySelector('[data-tab="build"].active');
 const getPlan=()=>planHardware(getCrystals(),getSettings());
 function clear(){
  for(const m of [...guides.children]){guides.remove(m);m.geometry.dispose();m.material.dispose()}
 }
 function draw(plan){
  clear();
  for(const [points,color] of [[plan.sockets,0xffd84b],[plan.mounts,0xb985ff],
      [plan.invalidManualPixels||[],0xff536b],[plan.invalidManualMounts||[],0xff536b]]){
   for(const p of points){
    if(!Number.isFinite(p.x)||!Number.isFinite(p.z))continue;
    const ring=new THREE.Mesh(new THREE.TorusGeometry(p.radius+.5,.7,8,32),
      new THREE.MeshBasicMaterial({color,transparent:true,opacity:.95,depthTest:false}));
    ring.rotation.x=-Math.PI/2;ring.position.set(p.x,.6,p.z);ring.renderOrder=90;guides.add(ring);
    const height=Math.max(8,Number(getSettings().baseHeight)||10);
    const tube=new THREE.Mesh(new THREE.CylinderGeometry(p.radius,p.radius,height,24,1,true),
      new THREE.MeshBasicMaterial({color,transparent:true,opacity:.12,depthTest:false,depthWrite:false,side:THREE.DoubleSide}));
    tube.position.set(p.x,height/2,p.z);tube.renderOrder=85;guides.add(tube);
   }
  }
  guides.visible=isBuild();
 }
 function refresh(){
  const s=getSettings(),plan=getPlan();
  draw(plan);
  if($('hardwareGuideSummary'))$('hardwareGuideSummary').textContent=
   plan.sockets.length+' LED hole(s) · '+plan.mounts.length+' mounting hole(s) · '+
   (plan.invalidManualPixels.length+plan.invalidManualMounts.length)+' invalid (red)';
  const list=$('manualHardwareList');if(!list)return;
  const html=[];
  for(const [kind,enabled,items] of [['pixel',s.pixelPlacement==='manual',s.manualPixelHoles||[]],
     ['mount',s.mountPlacement==='manual',s.manualMountHoles||[]]]){
   if(!enabled)continue;
   html.push('<div class="divider"></div><p class="note"><b>'+(kind==='pixel'?'LED sockets':'Mounting holes')+' · manual</b></p>');
   for(let i=0;i<items.length;i++){
    const p=items[i],bad=(kind==='pixel'?plan.invalidManualPixels:plan.invalidManualMounts).some(x=>x.index===i);
    html.push('<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:6px;align-items:end;margin:8px 0">'+
     '<div class="control"><label>X (mm)</label><input type="number" step=".5" data-hole-kind="'+kind+'" data-hole-index="'+i+'" data-hole-axis="x" value="'+numeric(p.x)+'"></div>'+
     '<div class="control"><label>Z (mm)</label><input type="number" step=".5" data-hole-kind="'+kind+'" data-hole-index="'+i+'" data-hole-axis="z" value="'+numeric(p.z)+'"></div>'+
     '<button data-remove-hole="'+kind+'" data-hole-index="'+i+'" title="Remove hole">✕</button></div>'+
     (bad?'<p class="note warning">Invalid position. This hole will not be cut until corrected.</p>':''));
   }
  }
  list.innerHTML=html.join('')||'<p class="note">Use Place / move to make existing automatic holes editable, or add new holes by clicking the model.</p>';
  list.querySelectorAll('[data-hole-kind]').forEach(input=>input.onchange=()=>{
   const key=input.dataset.holeKind==='pixel'?'manualPixelHoles':'manualMountHoles';
   const item=s[key]?.[Number(input.dataset.holeIndex)],value=Number(input.value);
   if(!item||!Number.isFinite(value))return;
   item[input.dataset.holeAxis]=value;onEdit();
  });
  list.querySelectorAll('[data-remove-hole]').forEach(button=>button.onclick=()=>{
   const key=button.dataset.removeHole==='pixel'?'manualPixelHoles':'manualMountHoles';
   s[key].splice(Number(button.dataset.holeIndex),1);
   if(key==='manualPixelHoles'&&s.lightingMode==='multi')s.pixelCount=s[key].length;
   onEdit();
  });
 }
 function manuallyPlace(kind){
  const s=getSettings(),plan=getPlan();
  if(kind==='pixel'){
   if(s.lightingMode==='none')s.lightingMode='single';
   s.cutSockets=true;
   if(s.pixelPlacement!=='manual'){
    s.manualPixelHoles=plan.sockets.map(p=>({x:p.x,z:p.z}));
    s.pixelPlacement='manual';
   }
   placing=s.lightingMode==='single'&&s.manualPixelHoles.length?'pixel-replace':'pixel-add';
  }else{
   if(s.mount==='None')s.mount='Custom dual holes';
   if(s.mountPlacement!=='manual'){
    s.manualMountHoles=plan.mounts.map(p=>({x:p.x,z:p.z}));
    s.mountPlacement='manual';
   }
   placing='mount-add';
  }
  onEdit();
  $('placementHint').textContent=placing==='pixel-replace'?
   'Click the model to move your single LED hole. The yellow ring will update.':
   'Click the model to add a '+(kind==='pixel'?'pixel':'mounting')+' hole. Edit X/Z for precise placement.';
  onStatus('Click on the model to place hole · Esc cancels');
 }
 $('placePixelBtn').onclick=()=>manuallyPlace('pixel');
 $('placeMountBtn').onclick=()=>manuallyPlace('mount');
 function cancel(){placing=null;if($('placementHint'))$('placementHint').textContent='Hardware placement cancelled.'}
 $('stopHolePlacementBtn').onclick=cancel;
 renderer.domElement.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY}},true);
 renderer.domElement.addEventListener('pointerup',e=>{
  if(!placing||!isBuild())return;
  if(!pointerStart||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>5)return;
  const rect=renderer.domElement.getBoundingClientRect();
  const ndc=new THREE.Vector2(2*(e.clientX-rect.left)/rect.width-1,1-2*(e.clientY-rect.top)/rect.height);
  const ray=new THREE.Raycaster();ray.setFromCamera(ndc,camera);
  const hit=ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),new THREE.Vector3());
  if(!hit)return;
  const s=getSettings(),position={x:+hit.x.toFixed(1),z:+hit.z.toFixed(1)};
  if(placing==='pixel-replace')s.manualPixelHoles[0]=position;
  else if(placing==='pixel-add'){
   s.manualPixelHoles.push(position);
   if(s.lightingMode==='multi')s.pixelCount=s.manualPixelHoles.length;
  }else s.manualMountHoles.push(position);
  e.stopImmediatePropagation();e.preventDefault();
  placing=null;$('placementHint').textContent='Hole placed. Red positions must be corrected before export.';
  onEdit();
 },true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')cancel()});
 document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>requestAnimationFrame(refresh)));
 for(const kind of ['pixel','mount']){
  const e=document.querySelector('[data-state="'+kind+'Placement"]');
  if(e)e.addEventListener('change',()=>{
   const s=getSettings(),key=kind==='pixel'?'manualPixelHoles':'manualMountHoles';
   if(e.value==='manual'&&!(s[key]||[]).length){
    const p=planHardware(getCrystals(),{...s,[kind+'Placement']:'auto'});
    s[key]=(kind==='pixel'?p.sockets:p.mounts).map(x=>({x:x.x,z:x.z}));
    onEdit();
   }
  });
 }
 return {refresh,cancel};
}
