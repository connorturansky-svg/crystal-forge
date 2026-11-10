/* Build-stage placement/inspection: same authoritative plan as fabrication. */
import {planHardware} from './hardware-layout.js';

export function createHardwareEditor({THREE,scene,renderer,camera,orbit,gizmo,getBaseMesh,getSettings,getCrystals,onEdit,onStatus}){
 const $=id=>document.getElementById(id),guides=new THREE.Group();
 guides.name='Live hardware holes';scene.add(guides);
 // A true cursor in the 3D scene, always visible above the intersected base
 // and independent of hover hit-testing (the exported geometry is separate).
 const preview=new THREE.Group();preview.name='Placement cursor (preview only)';scene.add(preview);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(1,.075,10,48),
  new THREE.MeshBasicMaterial({color:0xffd84b,transparent:true,opacity:1,depthTest:false,depthWrite:false}));
 rim.rotation.x=-Math.PI/2;rim.renderOrder=200;preview.add(rim);
 const disc=new THREE.Mesh(new THREE.CircleGeometry(1,48),
  new THREE.MeshBasicMaterial({color:0xffd84b,transparent:true,opacity:.16,depthTest:false,depthWrite:false,side:THREE.DoubleSide}));
 disc.rotation.x=-Math.PI/2;disc.renderOrder=199;preview.add(disc);
 preview.visible=false;
 const ray=new THREE.Raycaster(),cursorNDC=new THREE.Vector2();
 const ground=new THREE.Plane(new THREE.Vector3(0,1,0),0);
 let placing=null,pointerStart=null,lastCursor=null;
 const numeric=v=>Number(v).toFixed(1);
 const isBuild=()=>!!document.querySelector('[data-tab="build"].active');
 const getPlan=()=>planHardware(getCrystals(),getSettings());
 function clear(){
  for(const m of [...guides.children]){guides.remove(m);m.geometry.dispose();m.material.dispose()}
 }
 function draw(plan){
  clear();
  // Preview the exact planned semicircular-tab footprint and through holes
  // before performing any expensive Manifold union.
  for(const tab of plan.tabs||[]){
   const disc=new THREE.Mesh(new THREE.CircleGeometry(tab.radius,64),
     new THREE.MeshBasicMaterial({color:0xb985ff,opacity:.18,transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide}));
   disc.rotation.x=-Math.PI/2;disc.position.set(tab.x,.12,tab.z);disc.renderOrder=78;guides.add(disc);
   const outline=new THREE.Mesh(new THREE.TorusGeometry(tab.radius,.5,8,64),
     new THREE.MeshBasicMaterial({color:0xb985ff,opacity:.9,transparent:true,depthTest:false}));
   outline.rotation.x=-Math.PI/2;outline.position.set(tab.x,.16,tab.z);outline.renderOrder=86;guides.add(outline);
  }
  for(const hole of plan.tabHoles||[]){
   const ring=new THREE.Mesh(new THREE.TorusGeometry(hole.radius,.5,8,36),
     new THREE.MeshBasicMaterial({color:0x8745fa,transparent:true,depthTest:false}));
   ring.rotation.x=-Math.PI/2;ring.position.set(hole.x,.38,hole.z);ring.renderOrder=96;guides.add(ring);
  }
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
   plan.sockets.length+' LED hole(s) · '+(plan.mounts.length+plan.tabHoles.length)+' mounting hole(s) · '+plan.tabs.length+' edge tab(s) · '+
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
 function placementValid(kind,pos){
  const s=getSettings();
  if(kind==='pixel'){
   if((s.manualPixelHoles||[]).length>=60)return false;
   const holes=[...(s.manualPixelHoles||[]),pos],next=planHardware(getCrystals(),
    {...s,cutSockets:true,lightingMode:'multi',pixelPlacement:'manual',
     manualPixelHoles:holes,pixelCount:holes.length});
   return !next.invalidManualPixels.some(p=>p.index===holes.length-1);
  }
  if((s.manualMountHoles||[]).length>=20)return false;
  const holes=[...(s.manualMountHoles||[]),pos],next=planHardware(getCrystals(),
   {...s,mountPlacement:'manual',manualMountHoles:holes,
    mount:s.mount==='None'?'Custom dual holes':s.mount});
  return !next.invalidManualMounts.some(p=>p.index===holes.length-1);
 }
 function findPoint(e){
  const rect=renderer.domElement.getBoundingClientRect();
  cursorNDC.set(2*(e.clientX-rect.left)/rect.width-1,1-2*(e.clientY-rect.top)/rect.height);
  ray.setFromCamera(cursorNDC,camera);
  const base=getBaseMesh?.();
  const hits=base?.visible?ray.intersectObject(base,false):[];
  const hit=hits[0]?.point||ray.ray.intersectPlane(ground,new THREE.Vector3());
  if(!hit)return null;
  const pos={x:Math.round(hit.x*10)/10,z:Math.round(hit.z*10)/10};
  const visibleY=hits.length?hit.y:0;
  return {pos,y:visibleY,insideBase:hits.length>0};
 }
 function updateCursor(e){
  if(!placing||!isBuild())return;
  const data=findPoint(e);
  if(!data){preview.visible=false;lastCursor=null;return}
  const kind=placing==='pixel'?'pixel':'mount';
  const valid=data.insideBase&&placementValid(kind,data.pos);
  lastCursor={...data,valid,kind};
  const s=getSettings();
  const diameter=kind==='pixel'?Number(s.pixelDiameter)+Number(s.pixelFit):
   s.mount==='Magnet inserts'?10.2:s.mount==='Threaded insert M3'?4.2:Number(s.mountHoleDiameter||4.5);
  const radius=Math.max(1,diameter/2);
  preview.scale.setScalar(radius);
  // Move the visible ring towards the viewer, so even the underside can be used.
  const side=camera.position.y<data.y?-1:1;
  preview.position.set(data.pos.x,data.y+side*.8,data.pos.z);
  const colour=valid?(kind==='pixel'?0xffd84b:0xb985ff):0xff536b;
  rim.material.color.setHex(colour);disc.material.color.setHex(colour);
  preview.visible=true;
  if($('placementHint')){
   $('placementHint').textContent=valid?
    ('Preview '+kind+' hole at X '+data.pos.x.toFixed(1)+' / Z '+data.pos.z.toFixed(1)+' mm · click to add another · Esc to finish'):
    ('Red preview: position is outside the base, too close to another hole, or too crowded. Move cursor to a valid area.');
  }
 }
 function setActive(value){
  placing=value;
  preview.visible=false;lastCursor=null;
  const active=!!placing;
  renderer.domElement.style.cursor=active?'crosshair':'';
  renderer.domElement.dataset.hardwarePlacement=active?placing:'';
  orbit.enabled=!active&&!gizmo.dragging;
  gizmo.enabled=!active;
  if(!active&&$('placementHint'))$('placementHint').textContent='Placement stopped. Orbit and selection are available again.';
 }
 function manuallyPlace(kind){
  const s=getSettings(),plan=getPlan();
  if(kind==='pixel'){
   s.cutSockets=true;
   if(s.pixelPlacement!=='manual'){
    s.manualPixelHoles=plan.sockets.map(p=>({x:+p.x.toFixed(1),z:+p.z.toFixed(1)}));
    s.pixelPlacement='manual';
   }
   // Continuous creation needs multi mode; the starting automatic LED is
   // retained as a first editable hole rather than silently discarded.
   s.lightingMode='multi';
   s.pixelCount=s.manualPixelHoles.length;
  }else{
   if(s.mount==='None')s.mount='Custom dual holes';
   if(s.mountPlacement!=='manual'){
    s.manualMountHoles=plan.mounts.map(p=>({x:+p.x.toFixed(1),z:+p.z.toFixed(1)}));
    s.mountPlacement='manual';
   }
  }
  setActive(kind);onEdit();
  $('placementHint').textContent='Move over the base: a circular hole preview follows the cursor. Click repeatedly to add '+(kind==='pixel'?'LEDs':'mounting holes')+'. Red means invalid. Escape or Stop finishes.';
  onStatus('Continuous '+kind+' placement · move cursor, click to add, Esc to finish');
 }
 function cancel(){
  setActive(null);
 }
 $('placePixelBtn').onclick=()=>manuallyPlace('pixel');
 $('placeMountBtn').onclick=()=>manuallyPlace('mount');
 $('stopHolePlacementBtn').onclick=cancel;
 const canvas=renderer.domElement;
 canvas.addEventListener('pointermove',e=>updateCursor(e),true);
 canvas.addEventListener('pointerleave',()=>{preview.visible=false;lastCursor=null},true);
 canvas.addEventListener('pointerdown',e=>{
  if(!placing||!isBuild())return;
  pointerStart={x:e.clientX,y:e.clientY};
  // Capture before OrbitControls/TransformControls see the pointer.
  e.preventDefault();e.stopImmediatePropagation();
 },true);
 canvas.addEventListener('pointerup',e=>{
  if(!placing||!isBuild())return;
  e.preventDefault();e.stopImmediatePropagation();
  if(e.button!==0||!pointerStart)return;
  const movement=Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y);
  pointerStart=null;
  updateCursor(e);
  if(movement>5||!lastCursor?.valid)return;
  const s=getSettings(),kind=placing,pos={...lastCursor.pos};
  if(kind==='pixel'){
   s.manualPixelHoles.push(pos);
   s.pixelCount=s.manualPixelHoles.length;
  }else s.manualMountHoles.push(pos);
  onEdit(); // redraw rings & keep the placement mode active for next click.
  updateCursor(e);
 },true);
 canvas.addEventListener('pointercancel',()=>{pointerStart=null},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&placing)cancel()},true);
 document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{
  if(b.dataset.tab!=='build'&&placing)cancel();
  requestAnimationFrame(refresh);
 }));
 for(const kind of ['pixel','mount']){
  const e=document.querySelector('[data-state="'+kind+'Placement"]');
  if(e)e.addEventListener('change',()=>{
   const s=getSettings(),key=kind==='pixel'?'manualPixelHoles':'manualMountHoles';
   if(e.value==='manual'&&!(s[key]||[]).length){
    const p=planHardware(getCrystals(),{...s,[kind+'Placement']:'auto'});
    s[key]=(kind==='pixel'?p.sockets:p.mounts).map(x=>({x:x.x,z:x.z}));
    onEdit();
   }
   if(placing)cancel();
  });
 }
 // Read-only test/debug telemetry, not a second representation of holes.
 window.__crystalForgePlacementMetrics=()=>({tool:placing,active:!!placing,
  cursorVisible:preview.visible,valid:!!lastCursor?.valid,
  worldPosition:lastCursor?.pos??null,orbitEnabled:orbit.enabled});

 return {refresh,cancel};
}
