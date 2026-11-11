/* Build-stage placement/inspection: same authoritative plan as fabrication. */
import {planHardware} from './hardware-layout.js';
import {resolvePixelProfile,allPixelProfiles} from './pixel-profiles.js';
import {snapHardwarePoint,snapHardwareCoordinate} from './design-workflows.js';
import {nearestEdgePosition} from './edge-tabs.js';
import {ensureHardwareIds,movePixelInString,hardwareName} from './hardware-identity.js';

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
 let placing=null,pointerStart=null,lastCursor=null,draggingHole=null,selectedHardware=null;
 const markerLayer=document.createElement('div');
 markerLayer.className='hardware-marker-layer';
 renderer.domElement.parentElement.appendChild(markerLayer);
 const markerObjects=[];
 const contextMenu=document.createElement('div');
 contextMenu.className='hardware-context-menu';
 contextMenu.hidden=true;
 contextMenu.innerHTML='<strong>Add to this position</strong><button type="button" data-context-add="pixel">＋ Pixel hole</button><button type="button" data-context-add="mount">＋ Mounting hole</button><button type="button" data-context-cancel="1">Cancel</button>';
 renderer.domElement.parentElement.appendChild(contextMenu);
 let contextPoint=null;
 const clearContext=()=>{contextMenu.hidden=true;contextPoint=null};
 const numeric=v=>Number(v).toFixed(1);
 const isBuild=()=>!!document.querySelector('[data-tab="build"].active');
 const getPlan=()=>planHardware(getCrystals(),getSettings());
 function clear(){
  for(const m of [...guides.children]){guides.remove(m);m.geometry.dispose();m.material.dispose()}
  markerLayer.replaceChildren();markerObjects.length=0;
 }
 function showSelection(kind,id,index,scroll=true){
  selectedHardware={kind,id,index};
  refresh();
  if(scroll){
   const card=[...document.querySelectorAll('[data-hw-card-kind]')].find(el=>el.dataset.hwCardKind===kind&&el.dataset.hwCardId===id);
   card?.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  onStatus('Selected '+hardwareName(kind,index)+' · edit it in the Build panel');
 }
 function addMarker(kind,p,index,invalid=false){
  if(!Number.isFinite(p.x)||!Number.isFinite(p.z))return;
  const id=String(p.id||kind+'-'+index),label=hardwareName(kind,index);
  const button=document.createElement('button');
  button.type='button';button.className='hardware-marker'+(invalid?' invalid':'')+(selectedHardware?.kind===kind&&selectedHardware.id===id?' selected':'');
  button.textContent=label;button.title=label+' · click to edit '+kind;
  button.dataset.hwKind=kind;button.dataset.hwId=id;button.dataset.hwIndex=String(index);
  button.setAttribute('aria-label','Select '+label+' '+kind);
  button.onclick=e=>{e.stopPropagation();showSelection(kind,id,index)};
  button.ondblclick=e=>{e.preventDefault();e.stopPropagation();showSelection(kind,id,index)};
  markerLayer.appendChild(button);markerObjects.push({button,p});
 }
 function positionMarkers(){
  const build=isBuild(),rect=renderer.domElement.getBoundingClientRect();
  markerLayer.hidden=!build;
  if(build&&rect.width&&rect.height)for(const {button,p} of markerObjects){
   const pt=new THREE.Vector3(p.x,.8,p.z).project(camera);
   const visible=pt.z>-1&&pt.z<1&&Math.abs(pt.x)<1.2&&Math.abs(pt.y)<1.2;
   button.hidden=!visible;
   if(visible){
    button.style.left=((pt.x+1)*.5*rect.width)+'px';
    button.style.top=((1-pt.y)*.5*rect.height)+'px';
   }
  }
  requestAnimationFrame(positionMarkers);
 }
 requestAnimationFrame(positionMarkers);
 function draw(plan){
  clear();
  plan.sockets.forEach((p,i)=>addMarker('pixel',p,i));
  plan.mounts.forEach((p,i)=>addMarker('mount',p,i));
  plan.tabHoles.forEach((p,i)=>addMarker('tab',p,i));
  for(const p of plan.invalidManualPixels||[])addMarker('pixel',{...p,id:'invalid-pixel-'+p.index},p.index,true);
  for(const p of plan.invalidManualMounts||[])addMarker('mount',{...p,id:'invalid-mount-'+p.index},p.index,true);
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
  for(const route of plan.wirePlan?.routes||[]){
   const dx=route.b.x-route.a.x,dz=route.b.z-route.a.z;
   const length=Math.hypot(dx,dz)+.5;
   const angle=-Math.atan2(dz,dx);
   const midX=(route.a.x+route.b.x)/2,midZ=(route.a.z+route.b.z)/2;
   // This translucent volume matches the Manifold subtractor's width/depth.
   // It is only a GUIDE in Build; after Prepare Print, BOT shows the REAL cut.
   const geom=new THREE.BoxGeometry(length,route.depth+.6,route.width);
   const ghost=new THREE.Mesh(geom,new THREE.MeshBasicMaterial({
    color:0x06bed2,transparent:true,opacity:.3,depthTest:false,depthWrite:false,side:THREE.DoubleSide}));
   ghost.position.set(midX,(route.depth-.4)/2,midZ);ghost.rotation.y=angle;ghost.renderOrder=92;guides.add(ghost);
   const outline=new THREE.LineSegments(new THREE.EdgesGeometry(geom),
    new THREE.LineBasicMaterial({color:0x49faff,depthTest:false,transparent:true,opacity:.95}));
   outline.position.copy(ghost.position);outline.rotation.copy(ghost.rotation);outline.renderOrder=93;guides.add(outline);
  }
  guides.visible=isBuild();
 }
 function refresh(){
  const s=getSettings();
  ensureHardwareIds(s);
  const plan=getPlan();
  draw(plan);
  const routing=plan.wirePlan;
  if($('wireRouteStatus')){
   $('wireRouteStatus').textContent=!routing?.enabled?'Wiring grooves are off. Enable to plan a physical cable-bundle string.':
    routing.mode==='string'?
     (routing.ready?'✓ Pixel string IN → '+plan.sockets.map((_,i)=>'P'+(i+1)).join(' → ')+' → OUT · '+routing.lengthMm.toFixed(1)+' mm · '+routing.routes.length+' cut groove segments.':
      'String blocked: '+routing.messages.join(' ')):
      routing.routes.length?routing.routes.length+' legacy groove segment(s) · '+routing.lengthMm.toFixed(1)+' mm. Switch to Pixel string to route opposed IN/OUT tails.':
       routing.messages.join(' ')||'No safe cable groove planned.';
   $('wireRouteStatus').classList.toggle('warning',!!routing?.enabled&&!routing.ready&&routing.mode==='string');
  }
  if($('hardwareGuideSummary'))$('hardwareGuideSummary').textContent=
   plan.sockets.length+' LED hole(s) · '+(plan.mounts.length+plan.tabHoles.length)+' mounting hole(s) · '+plan.tabs.length+' edge tab(s) · '+
   (plan.invalidManualPixels.length+plan.invalidManualMounts.length)+' invalid (red) · '+(plan.wirePlan?.routes.length||0)+' cyan wire segments · '+(plan.wirePlan?.unrouted||0)+' unconnected';
  const list=$('manualHardwareList');if(!list)return;
  const html=[];
  const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  for(const [kind,enabled,items] of [['pixel',s.pixelPlacement==='manual',s.manualPixelHoles||[]],
     ['mount',s.mountPlacement==='manual',s.manualMountHoles||[]]]){
   if(!enabled)continue;
   html.push('<div class="divider"></div><p class="note"><b>'+(kind==='pixel'?'LED sockets':'Mounting holes')+' · manual</b></p>');
   for(let i=0;i<items.length;i++){
    const p=items[i],bad=(kind==='pixel'?plan.invalidManualPixels:plan.invalidManualMounts).some(x=>x.index===i);
    const options=kind==='pixel'?'<div class="control" style="grid-column:1 / -1"><label>Individual LED profile</label><select data-hole-profile="'+i+'">'+
     allPixelProfiles(s).map(profile=>'<option value="'+esc(profile.id)+'"'+((p.profileId||s.pixelProfileId)===profile.id?' selected':'')+'>'+esc(profile.name)+'</option>').join('')+'</select>'+
 '<div class="control"><label>Pixel rotation (degrees)</label><input type="number" min="-180" max="180" step="5" data-wire-angle="'+i+'" value="'+Number(p.wireAngle??0)+'"></div>'+
 '<div class="grid2"><div class="control"><label>Exit centre X (mm)</label><input data-wire-end-x="'+i+'" type="number" step=".5" value="'+(p.wireEndX??'')+'" placeholder="Automatic"></div>'+
 '<div class="control"><label>Exit centre Z (mm)</label><input data-wire-end-z="'+i+'" type="number" step=".5" value="'+(p.wireEndZ??'')+'" placeholder="Automatic"></div></div>'+
 '<p class="note">Rotation turns both wire lanes together. Both end points stay aligned around this shared exit centre.</p></div>':'';
    html.push('<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:6px;align-items:end;margin:8px 0">'+
     '<div class="control"><label>X (mm)</label><input type="number" step=".5" data-hole-kind="'+kind+'" data-hole-index="'+i+'" data-hole-axis="x" value="'+numeric(p.x)+'"></div>'+
     '<div class="control"><label>Z (mm)</label><input type="number" step=".5" data-hole-kind="'+kind+'" data-hole-index="'+i+'" data-hole-axis="z" value="'+numeric(p.z)+'"></div>'+
     '<button data-remove-hole="'+kind+'" data-hole-index="'+i+'" title="Remove hole">✕</button>'+options+'</div>'+
     (bad?'<p class="note warning">Invalid position. This hole will not be cut until corrected.</p>':''));
   }
  }
  if(s.mount==='Edge fixing tabs'){
   html.push('<div class="divider"></div><b>Editable edge tabs</b><p class="note">Add, Shift-drag or delete tabs along the perimeter.</p>');
   for(let i=0;i<(s.manualEdgeTabs||[]).length;i++){
    const u=Number(s.manualEdgeTabs[i].u||0),bad=!plan.tabs.some(t=>t.index===i);
    html.push('<div class="buttonrow"><label>Tab '+(i+1)+' · perimeter <input type="number" min="0" max="99.9" step=".5" data-tab-u="'+i+'" value="'+(u*100).toFixed(1)+'"> %</label><button data-remove-tab="'+i+'">✕ Delete</button></div>'+
      (bad?'<p class="note warning">Tab conflicts with another feature and will not be cut.</p>':''));
   }
  }
  list.innerHTML=html.join('')||'<p class="note">Use Place / move to make existing automatic holes editable, or add new holes by clicking the model.</p>';
  list.querySelectorAll('[data-hole-kind]').forEach(input=>input.onchange=()=>{
   const key=input.dataset.holeKind==='pixel'?'manualPixelHoles':'manualMountHoles';
   const item=s[key]?.[Number(input.dataset.holeIndex)],value=Number(input.value);
   if(!item||!Number.isFinite(value))return;
   item[input.dataset.holeAxis]=snapHardwareCoordinate(value,s.hardwareSnap,s.hardwareSnapStep);onEdit();
  });
  list.querySelectorAll('[data-hole-profile]').forEach(select=>select.onchange=()=>{
   const item=s.manualPixelHoles?.[Number(select.dataset.holeProfile)];
   if(!item)return;
   item.profileId=select.value;onEdit();
  });
  list.querySelectorAll('[data-wire-angle]').forEach(input=>input.onchange=()=>{
   const p=s.manualPixelHoles?.[Number(input.dataset.wireAngle)];if(!p)return;
   p.wireAngle=Math.max(-180,Math.min(180,Number(input.value)||0));onEdit();
  });
  for(const axis of ['x','z'])list.querySelectorAll('[data-wire-end-'+axis+']').forEach(input=>input.onchange=()=>{
   const p=s.manualPixelHoles?.[Number(axis==='x'?input.dataset.wireEndX:input.dataset.wireEndZ)];if(!p)return;
   const key=axis==='x'?'wireEndX':'wireEndZ';
   if(input.value.trim()==='')delete p[key];
   else if(Number.isFinite(Number(input.value)))p[key]=Number(input.value);
   onEdit();
  });
  list.querySelectorAll('[data-tab-u]').forEach(input=>input.onchange=()=>{
   const p=s.manualEdgeTabs?.[Number(input.dataset.tabU)];if(!p)return;
   p.u=Math.max(0,Math.min(.999,Number(input.value)/100||0));onEdit();
  });
  list.querySelectorAll('[data-remove-tab]').forEach(button=>button.onclick=()=>{
   s.manualEdgeTabs?.splice(Number(button.dataset.removeTab),1);
   s.tabCount=s.manualEdgeTabs.length;onEdit();
  });
  list.querySelectorAll('[data-remove-hole]').forEach(button=>button.onclick=()=>{
   const key=button.dataset.removeHole==='pixel'?'manualPixelHoles':'manualMountHoles';
   s[key].splice(Number(button.dataset.holeIndex),1);
   if(key==='manualPixelHoles'&&s.lightingMode==='multi')s.pixelCount=s[key].length;
   onEdit();
  });
 }
 function placementValid(kind,pos,replaceIndex=null){
  const s=getSettings();
  if(kind==='tab'){
   const edge=nearestEdgePosition(getPlan().polygon,pos);
   const tabs=[...(s.manualEdgeTabs||[])];
   if(replaceIndex===null)tabs.push({u:edge.u});
   else if(tabs[replaceIndex])tabs[replaceIndex]={u:edge.u};
   else return false;
   const next=planHardware(getCrystals(),{...s,mount:'Edge fixing tabs',manualEdgeTabs:tabs});
   return next.tabs.some(t=>t.index===(replaceIndex===null?tabs.length-1:replaceIndex));
  }
  if(kind==='exit')return getPlan().sockets.length>0;
  if(kind==='pixel'){
   const holes=(s.manualPixelHoles||[]).map(p=>({...p}));
   if(replaceIndex===null){if(holes.length>=60)return false;holes.push(pos)}
   else if(holes[replaceIndex])holes[replaceIndex]=pos;
   else return false;
   const next=planHardware(getCrystals(),{...s,cutSockets:true,lightingMode:'multi',pixelPlacement:'manual',manualPixelHoles:holes,pixelCount:holes.length});
   return !next.invalidManualPixels.some(p=>p.index===(replaceIndex===null?holes.length-1:replaceIndex));
  }
  const holes=(s.manualMountHoles||[]).map(p=>({...p}));
  if(replaceIndex===null){if(holes.length>=20)return false;holes.push(pos)}
  else if(holes[replaceIndex])holes[replaceIndex]=pos;
  else return false;
  const next=planHardware(getCrystals(),{...s,mountPlacement:'manual',manualMountHoles:holes,
   mount:s.mount==='None'?'Custom dual holes':s.mount});
  return !next.invalidManualMounts.some(p=>p.index===(replaceIndex===null?holes.length-1:replaceIndex));
 }
 function findPoint(e){
  const rect=renderer.domElement.getBoundingClientRect();
  cursorNDC.set(2*(e.clientX-rect.left)/rect.width-1,1-2*(e.clientY-rect.top)/rect.height);
  ray.setFromCamera(cursorNDC,camera);
  const base=getBaseMesh?.();
  const hits=base?.visible?ray.intersectObject(base,false):[];
  const hit=hits[0]?.point||ray.ray.intersectPlane(ground,new THREE.Vector3());
  if(!hit)return null;
  const pos=snapHardwarePoint({x:Math.round(hit.x*10)/10,z:Math.round(hit.z*10)/10},getSettings());
  const visibleY=hits.length?hit.y:0;
  return {pos,y:visibleY,insideBase:hits.length>0};
 }
 function updateCursor(e){
  if(!placing||!isBuild())return;
  const data=findPoint(e);
  if(!data){preview.visible=false;lastCursor=null;return}
  const kind=placing;
  const valid=(data.insideBase||kind==='tab'||kind==='exit')&&placementValid(kind,data.pos,draggingHole?.index??null);
  lastCursor={...data,valid,kind};
  const s=getSettings();
  const diameter=(kind==='tab'||kind==='exit')?10:kind==='pixel'?resolvePixelProfile(s).maxDiameter:
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
  preview.visible=false;lastCursor=null;draggingHole=null;
  const active=!!placing;
  renderer.domElement.style.cursor=active?'crosshair':'';
  renderer.domElement.dataset.hardwarePlacement=active?placing:'';
  orbit.enabled=!active&&!gizmo.dragging;
  gizmo.enabled=!active;
  if(!active&&$('placementHint'))$('placementHint').textContent='Placement stopped. Orbit and selection are available again.';
 }
 function manuallyPlace(kind){
  const s=getSettings(),plan=getPlan();
  if(kind==='tab'){
   s.mount='Edge fixing tabs';
   if(!Array.isArray(s.manualEdgeTabs))s.manualEdgeTabs=plan.tabs.map(t=>({u:t.u}));
  }else if(kind==='exit'){
   s.cutSockets=true;s.wireChannels=true;s.wireExit=true;
   if(s.pixelPlacement!=='manual'){
    s.manualPixelHoles=plan.sockets.map(p=>({x:p.x,z:p.z,wireAngle:0,profileId:p.profileId}));
    s.pixelPlacement='manual';
   }
  }else if(kind==='pixel'){
   s.cutSockets=true;
   if(s.pixelPlacement!=='manual'){
    s.manualPixelHoles=plan.sockets.map(p=>({x:+p.x.toFixed(1),z:+p.z.toFixed(1)}));
    s.pixelPlacement='manual';
   }
   // Continuous creation needs multi mode; the starting automatic LED is
   // retained as a first editable hole rather than silently discarded.
   s.lightingMode='multi';
   s.pixelCount=s.manualPixelHoles.length;
  }else if(kind==='mount'){
   if(s.mount==='None')s.mount='Custom dual holes';
   if(s.mountPlacement!=='manual'){
    s.manualMountHoles=plan.mounts.map(p=>({x:+p.x.toFixed(1),z:+p.z.toFixed(1)}));
    s.mountPlacement='manual';
   }
  }
  setActive(kind);onEdit();
  $('placementHint').textContent='Move over the base: a circular hole preview follows the cursor. Click to add or Shift-drag existing holes, repeatedly '+(kind==='pixel'?'LEDs':'mounting holes')+'. Red means invalid. Escape or Stop finishes.';
  onStatus('Continuous '+kind+' placement · move cursor, click to add, Esc to finish');
 }
 function cancel(){
  setActive(null);
 }
 $('placePixelBtn').onclick=()=>manuallyPlace('pixel');
 $('placeMountBtn').onclick=()=>manuallyPlace('mount');
 $('placeTabBtn').onclick=()=>manuallyPlace('tab');
 $('pickWireExitBtn').onclick=()=>manuallyPlace('exit');
 $('stopHolePlacementBtn').onclick=cancel;
 const canvas=renderer.domElement;
 canvas.addEventListener('pointermove',e=>updateCursor(e),true);
 canvas.addEventListener('pointerleave',()=>{preview.visible=false;lastCursor=null},true);
 canvas.addEventListener('pointerdown',e=>{
  if(!placing||!isBuild())return;
  pointerStart={x:e.clientX,y:e.clientY};
  // Shift-drag nearest existing MANUAL hole rather than creating a duplicate.
  if(e.shiftKey){
   const data=findPoint(e);
   if(data){
    const key=placing==='pixel'?'manualPixelHoles':placing==='tab'?'manualEdgeTabs':'manualMountHoles';
    const list=placing==='tab'?getPlan().tabs:(getSettings()[key]||[]);
    const nearest=list.map((p,index)=>({index:placing==='tab'?p.index:index,d:Math.hypot(p.x-data.pos.x,p.z-data.pos.z)}))
     .sort((a,b)=>a.d-b.d)[0];
    if(nearest&&nearest.d<=Math.max(8,Number(getSettings().pixelDiameter||5)+3))
     draggingHole={kind:placing,index:nearest.index};
   }
  }
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
  if(draggingHole){
   const active=draggingHole;draggingHole=null;
   const data=findPoint(e);
   if((data?.insideBase||active.kind==='tab')&&placementValid(active.kind,data.pos,active.index)){
    const key=active.kind==='pixel'?'manualPixelHoles':active.kind==='tab'?'manualEdgeTabs':'manualMountHoles';
    const old=getSettings()[key]?.[active.index];
    if(old){
     if(active.kind==='tab')old.u=nearestEdgePosition(getPlan().polygon,data.pos).u;
     else {old.x=data.pos.x;old.z=data.pos.z}
     onEdit();onStatus('Moved '+active.kind+' after collision review');
    }
   }
   updateCursor(e);return;
  }
  if(movement>5||!lastCursor?.valid)return;
  const s=getSettings(),kind=placing,pos={...lastCursor.pos};
  if(kind==='tab'){
   if(!Array.isArray(s.manualEdgeTabs))s.manualEdgeTabs=[];
   s.manualEdgeTabs.push({u:nearestEdgePosition(getPlan().polygon,pos).u});
   s.tabCount=s.manualEdgeTabs.length;
  }else if(kind==='exit'){
   const pixel=s.manualPixelHoles?.[0];
   if(pixel){
    const edge=nearestEdgePosition(getPlan().polygon,pos);
    pixel.wireEndX=edge.x;pixel.wireEndZ=edge.z;
   }
  }else if(kind==='pixel'){
   s.manualPixelHoles.push(pos);
   s.pixelCount=s.manualPixelHoles.length;
  }else if(kind==='mount')s.manualMountHoles.push(pos);
  onEdit(); // redraw rings & keep the placement mode active for next click.
  updateCursor(e);
 },true);
 canvas.addEventListener('pointercancel',()=>{pointerStart=null;draggingHole=null},true);
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
