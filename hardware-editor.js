/* Build-stage placement/inspection: same authoritative plan as fabrication. */
import {planHardware} from './hardware-layout.js';
import {resolvePixelProfile,allPixelProfiles} from './pixel-profiles.js';
import {snapHardwarePoint,snapHardwareCoordinate} from './design-workflows.js';
import {nearestEdgePosition} from './edge-tabs.js';
import {ensureHardwareIds,movePixelInString,hardwareName} from './hardware-identity.js';

export function createHardwareEditor({THREE,scene,renderer,camera,orbit,gizmo,getBaseMesh,getSettings,getCrystals,getManufacturingVisible=()=>false,onEdit,onStatus}){
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
 let placing=null,pointerStart=null,lastCursor=null,draggingHole=null,selectedHardware=null,markerDrag=null;
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
 function clear(preserveHardwareMarkers=false){
  for(const m of [...guides.children]){guides.remove(m);m.traverse(node=>{
   node.geometry?.dispose();
   if(Array.isArray(node.material))node.material.forEach(item=>item.dispose());
   else node.material?.dispose();
  })}
  if(preserveHardwareMarkers){
   for(let i=markerObjects.length-1;i>=0;i--){
    if(markerObjects[i].button.classList.contains('hardware-route-length')){
     markerObjects[i].button.remove();markerObjects.splice(i,1);
    }
   }
  }else{markerLayer.replaceChildren();markerObjects.length=0}
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
  button.onclick=e=>{e.stopPropagation();if(!markerDrag?.moved)showSelection(kind,id,index)};
  button.addEventListener('pointerdown',e=>{
   if(e.button!==0||!isBuild()||placing)return;
   e.stopPropagation();
   if(selectedHardware?.kind!==kind||selectedHardware?.id!==id)return;
   const cfg=getSettings(),isPixel=kind==='pixel',key=isPixel?'manualPixelHoles':'manualMountHoles';
   if(kind==='tab')return;
   if((isPixel?cfg.pixelPlacement:cfg.mountPlacement)!=='manual'){
    const plan=getPlan(),items=isPixel?plan.sockets:plan.mounts;
    cfg[key]=items.map(t=>({id:t.id,x:t.x,z:t.z,profileId:t.profileId,wireAngle:t.wireAngle??0}));
    cfg[isPixel?'pixelPlacement':'mountPlacement']='manual';
   }
   markerDrag={kind,id,key,startX:e.clientX,startY:e.clientY,moved:false,lastValid:null,lastPreview:0};
   e.preventDefault();
  });
  button.ondblclick=e=>{e.preventDefault();e.stopPropagation();showSelection(kind,id,index)};
  markerLayer.appendChild(button);markerObjects.push({button,p});
 }
 function positionMarkers(){
  const build=isBuild(),rect=renderer.domElement.getBoundingClientRect();
  markerLayer.hidden=!build||!!placing;
  if(build&&!placing&&rect.width&&rect.height)for(const {button,p} of markerObjects){
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
 function draw(plan,preserveHardwareMarkers=false){
  const s=getSettings();
  clear(preserveHardwareMarkers);
  if(!preserveHardwareMarkers){
   plan.sockets.forEach((p,i)=>addMarker('pixel',p,i));
   plan.mounts.forEach((p,i)=>addMarker('mount',p,i));
   plan.tabHoles.forEach((p,i)=>addMarker('tab',p,i));
   for(const p of plan.invalidManualPixels||[])addMarker('pixel',{...p,id:'invalid-pixel-'+p.index},p.index,true);
   for(const p of plan.invalidManualMounts||[])addMarker('mount',{...p,id:'invalid-mount-'+p.index},p.index,true);
  }else{
   for(const item of markerObjects){
    const kind=item.button.dataset.hwKind,id=item.button.dataset.hwId;
    const arr=kind==='pixel'?plan.sockets:kind==='mount'?plan.mounts:plan.tabHoles;
    const fresh=arr.find(p=>String(p.id)===id);
    if(fresh)item.p=fresh;
   }
  }
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
  let arrowDistance=0;
  const routePaths=plan.wirePlan?.previewRoutes?.length?plan.wirePlan.previewRoutes:(plan.wirePlan?.routes||[]);
  for(const route of routePaths){
   const dx=route.b.x-route.a.x,dz=route.b.z-route.a.z;
   const length=Math.hypot(dx,dz)+.5;
   const angle=-Math.atan2(dz,dx);
   const midX=(route.a.x+route.b.x)/2,midZ=(route.a.z+route.b.z)/2;
   // This translucent volume matches the Manifold subtractor's width/depth.
   // It is only a GUIDE in Build; after Prepare Print, BOT shows the REAL cut.
   const geom=new THREE.BoxGeometry(length,route.depth+.6,route.width);
   const ghost=new THREE.Mesh(geom,new THREE.MeshBasicMaterial({
    color:route.overLength?0xef334f:0x06bed2,transparent:true,opacity:route.overLength?.65:.3,depthTest:false,depthWrite:false,side:THREE.DoubleSide}));
   ghost.position.set(midX,(route.depth-.4)/2,midZ);ghost.rotation.y=angle;ghost.renderOrder=92;guides.add(ghost);
   const outline=new THREE.LineSegments(new THREE.EdgesGeometry(geom),
    new THREE.LineBasicMaterial({color:route.overLength?0xff3356:0x49faff,depthTest:false,transparent:true,opacity:.95}));
   outline.position.copy(ghost.position);outline.rotation.copy(ghost.rotation);outline.renderOrder=93;guides.add(outline);
   if(s.wireDirectionArrows!==false&&route.lengthMm>0){
    arrowDistance+=route.lengthMm;
    if(arrowDistance>=14){
     const arrow=new THREE.ArrowHelper(
      new THREE.Vector3(dx/Math.hypot(dx,dz),0,dz/Math.hypot(dx,dz)),
      new THREE.Vector3(midX,route.depth+1.8,midZ),
      Math.min(8,Math.max(3,route.lengthMm)),route.overLength?0xff3356:0xe5faff,3,2);
     arrow.renderOrder=104;
     for(const item of [arrow.line,arrow.cone]){item.material.depthTest=false;item.material.transparent=true;item.material.opacity=.9;}
     guides.add(arrow);arrowDistance=0;
    }
   }
  }
  if(s.wireShowLengths!==false){
   for(const conn of plan.wirePlan?.connections||[]){
    const candidates=routePaths.filter(t=>t.kind===conn.kind&&t.from===conn.from&&t.to===conn.to);
    if(!candidates.length)continue;
    const anchor=candidates[Math.floor(candidates.length/2)],p={x:(anchor.a.x+anchor.b.x)/2,z:(anchor.a.z+anchor.b.z)/2};
    const tag=document.createElement('span');tag.className='hardware-route-length'+(conn.overLength?' exceeded':'');
    tag.textContent=(conn.from==null?'IN':('P'+(conn.from+1)))+'→'+(conn.to==null?'OUT':'P'+(conn.to+1))+
      ' '+conn.lengthMm.toFixed(0)+' mm'+(conn.allowedMm?' / '+conn.allowedMm.toFixed(0)+' mm':'');
    markerLayer.appendChild(tag);markerObjects.push({button:tag,p});
   }
  }
  // The true prepared Manifold mesh must not be double-rendered with the
  // translucent Build routing guides; they can resemble orphan wire stubs.
  // P/M/T selection markers remain available independently.
  guides.visible=isBuild()&&!getManufacturingVisible();
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
  if($('wireRouteDetails')){
   const details=routing?.connections||[];
   $('wireRouteDetails').textContent=details.map(c=>
    (c.from==null?'IN':'P'+(c.from+1))+' → '+(c.to==null?'OUT':'P'+(c.to+1))+
    ': '+c.lengthMm.toFixed(1)+' mm'+(c.allowedMm!=null?' / '+c.allowedMm.toFixed(1)+' mm'+(c.overLength?' — TOO LONG':' — OK'):'')
   ).join('  ·  ');
   $('wireRouteDetails').classList.toggle('warning',!!routing?.overLengthCount);
  }
  if($('hardwareGuideSummary'))$('hardwareGuideSummary').textContent=
   plan.sockets.length+' LED hole(s) · '+(plan.mounts.length+plan.tabHoles.length)+' mounting hole(s) · '+plan.tabs.length+' edge tab(s) · '+
   (plan.invalidManualPixels.length+plan.invalidManualMounts.length)+' invalid (red) · '+(plan.wirePlan?.routes.length||0)+' cyan wire segments · '+(plan.wirePlan?.unrouted||0)+' unconnected';
  const list=$('manualHardwareList');if(!list)return;
  const html=[];
  const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  for(const [kind,enabled,items] of [['pixel',s.pixelPlacement==='manual',s.manualPixelHoles||[]],
     ['mount',s.mountPlacement==='manual',s.manualMountHoles||[]]]){
   if(!enabled){
    const actual=kind==='pixel'?plan.sockets:plan.mounts;
    if(actual.length){
     html.push('<div class="divider"></div><p class="note"><b>'+(kind==='pixel'?'Pixel string · automatic':'Mounting holes · automatic')+'</b></p>'+
      '<button type="button" data-convert-kind="'+kind+'">✎ Make '+kind+' positions editable</button>');
     actual.forEach((p,i)=>{
      const id=esc(p.id||kind+'-'+i),name=hardwareName(kind,i);
      html.push('<div class="hardware-edit-item'+(selectedHardware?.id===id&&selectedHardware.kind===kind?' selected':'')+
       '" data-hw-card-kind="'+kind+'" data-hw-card-id="'+id+'">'+
       '<button type="button" data-select-kind="'+kind+'" data-select-id="'+id+'" data-select-index="'+i+'">'+name+' · X '+numeric(p.x)+' / Z '+numeric(p.z)+' mm</button>'+
       '<p class="note">Automatic location · convert to manual to change position'+(kind==='pixel'?' and string order':'')+'</p></div>');
     });
    }
    continue;
   }
   html.push('<div class="divider"></div><p class="note"><b>'+(kind==='pixel'?'Pixel string order · drag or ↑↓ to reorder':'Mounting holes')+' · manual</b></p>');
   for(let i=0;i<items.length;i++){
    const p=items[i],bad=(kind==='pixel'?plan.invalidManualPixels:plan.invalidManualMounts).some(x=>x.index===i);
    const itemId=esc(p.id),itemName=hardwareName(kind,i);
    const actions=kind==='pixel'?'<button type="button" data-set-start="'+i+'" title="Make this pixel P1">Set P1</button>'+
     '<button type="button" data-pixel-up="'+i+'" aria-label="Move '+itemName+' earlier" '+(i===0?'disabled':'')+'>↑</button>'+
     '<button type="button" data-pixel-down="'+i+'" aria-label="Move '+itemName+' later" '+(i===items.length-1?'disabled':'')+'>↓</button>':'';
    const options=kind==='pixel'?'<div class="control" style="grid-column:1 / -1"><label>Individual LED profile</label><select data-hole-profile="'+i+'">'+
     allPixelProfiles(s).map(profile=>'<option value="'+esc(profile.id)+'"'+((p.profileId||s.pixelProfileId)===profile.id?' selected':'')+'>'+esc(profile.name)+'</option>').join('')+'</select>'+
 '<div class="control"><label>Pixel rotation (degrees)</label><input type="number" min="-180" max="180" step="5" data-wire-angle="'+i+'" value="'+Number(p.wireAngle??0)+'"></div>'+
 '<div class="grid2"><div class="control"><label>Exit centre X (mm)</label><input data-wire-end-x="'+i+'" type="number" step=".5" value="'+(p.wireEndX??'')+'" placeholder="Automatic"></div>'+
 '<div class="control"><label>Exit centre Z (mm)</label><input data-wire-end-z="'+i+'" type="number" step=".5" value="'+(p.wireEndZ??'')+'" placeholder="Automatic"></div></div>'+
 '<p class="note">This angle rotates the opposed cable IN/OUT ports. For string mode, perimeter entry/exit is controlled above; legacy paired mode uses old per-pixel exit fields.</p></div>':'';
    html.push('<div class="hardware-edit-item'+(selectedHardware?.id===p.id&&selectedHardware.kind===kind?' selected':'')+'" data-hw-card-kind="'+kind+'" data-hw-card-id="'+itemId+'" '+(kind==='pixel'?'draggable="true"':'')+'>'+
     '<div class="hardware-edit-heading"><button type="button" data-select-kind="'+kind+'" data-select-id="'+itemId+'" data-select-index="'+i+'">'+itemName+(bad?' · INVALID':'')+'</button>'+actions+'</div>'+
     '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:6px;align-items:end;margin:8px 0">'+
     '<div class="control"><label>X (mm)</label><input type="number" step=".5" data-hole-kind="'+kind+'" data-hole-index="'+i+'" data-hole-axis="x" value="'+numeric(p.x)+'"></div>'+
     '<div class="control"><label>Z (mm)</label><input type="number" step=".5" data-hole-kind="'+kind+'" data-hole-index="'+i+'" data-hole-axis="z" value="'+numeric(p.z)+'"></div>'+
     '<button data-remove-hole="'+kind+'" data-hole-index="'+i+'" title="Remove hole">✕</button>'+options+'</div>'+
     (bad?'<p class="note warning">Invalid position. This hole will not be cut until corrected.</p>':'')+'</div>');
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
  list.querySelectorAll('[data-select-kind]').forEach(btn=>btn.onclick=()=>showSelection(btn.dataset.selectKind,btn.dataset.selectId,Number(btn.dataset.selectIndex),false));
  const reorder=(from,to)=>{if(movePixelInString(s,from,to)){onEdit();onStatus('Changed string order · the cable route now follows the updated P1 → P2 order')}};
  list.querySelectorAll('[data-set-start]').forEach(btn=>btn.onclick=()=>{
   const index=Number(btn.dataset.setStart);
   if(s.pixelPlacement!=='manual')return;
   s.manualPixelHoles=[...s.manualPixelHoles.slice(index),...s.manualPixelHoles.slice(0,index)];
   onEdit();onStatus('Selected starting pixel is now P1');
  });
  list.querySelectorAll('[data-pixel-up]').forEach(btn=>btn.onclick=()=>reorder(Number(btn.dataset.pixelUp),Number(btn.dataset.pixelUp)-1));
  list.querySelectorAll('[data-pixel-down]').forEach(btn=>btn.onclick=()=>reorder(Number(btn.dataset.pixelDown),Number(btn.dataset.pixelDown)+1));
  list.querySelectorAll('[data-hw-card-kind="pixel"][draggable]').forEach(card=>{
   card.addEventListener('dragstart',e=>e.dataTransfer.setData('text/x-pixel-id',card.dataset.hwCardId));
   card.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='move'});
   card.addEventListener('drop',e=>{
    e.preventDefault();const id=e.dataTransfer.getData('text/x-pixel-id');
    const from=s.manualPixelHoles.findIndex(p=>p.id===id),to=s.manualPixelHoles.findIndex(p=>p.id===card.dataset.hwCardId);
    reorder(from,to);
   });
  });
  list.querySelectorAll('[data-convert-kind]').forEach(btn=>btn.onclick=()=>{
   const kind=btn.dataset.convertKind,current=getPlan(),s=getSettings();
   if(kind==='pixel'){
    s.manualPixelHoles=current.sockets.map((p,i)=>({id:p.id||'pixel-'+i,x:p.x,z:p.z,profileId:p.profileId,wireAngle:p.wireAngle??0}));
    s.pixelPlacement='manual';s.pixelCount=s.manualPixelHoles.length;
   }else{
    s.manualMountHoles=current.mounts.map((p,i)=>({id:p.id||'mount-'+i,x:p.x,z:p.z}));
    s.mountPlacement='manual';
   }
   ensureHardwareIds(s);onEdit();onStatus('Automatic '+kind+' locations converted to editable items');
  });
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
  if(kind==='exit'||kind==='entry')return getPlan().sockets.length>0;
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
  const valid=(data.insideBase||kind==='tab'||kind==='exit'||kind==='entry')&&placementValid(kind,data.pos,draggingHole?.index??null);
  lastCursor={...data,valid,kind};
  const s=getSettings();
  const diameter=(kind==='tab'||kind==='exit'||kind==='entry')?10:kind==='pixel'?resolvePixelProfile(s).maxDiameter:
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
  clearContext();
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
  }else if(kind==='exit'||kind==='entry'){
   s.cutSockets=true;s.wireChannels=true;s.wireExit=true;
   if(s.wireMode!=='string'&&s.pixelPlacement!=='manual'){
    s.manualPixelHoles=plan.sockets.map(p=>({id:p.id,x:p.x,z:p.z,wireAngle:0,profileId:p.profileId}));
    s.pixelPlacement='manual';
   }
  }else if(kind==='pixel'){
   s.cutSockets=true;
   if(s.pixelPlacement!=='manual'){
    s.manualPixelHoles=plan.sockets.map(p=>({id:p.id,x:+p.x.toFixed(1),z:+p.z.toFixed(1),profileId:p.profileId,wireAngle:p.wireAngle??0}));
    s.pixelPlacement='manual';
   }
   // Continuous creation needs multi mode; the starting automatic LED is
   // retained as a first editable hole rather than silently discarded.
   s.lightingMode='multi';
   s.pixelCount=s.manualPixelHoles.length;
  }else if(kind==='mount'){
   if(s.mount==='None')s.mount='Custom dual holes';
   if(s.mountPlacement!=='manual'){
    s.manualMountHoles=plan.mounts.map(p=>({id:p.id,x:+p.x.toFixed(1),z:+p.z.toFixed(1)}));
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
 $('pickWireEntryBtn').onclick=()=>manuallyPlace('entry');
 $('reversePixelStringBtn').onclick=()=>{
  const cfg=getSettings(),plan=getPlan();
  if(cfg.pixelPlacement!=='manual'){
   cfg.manualPixelHoles=plan.sockets.map(p=>({id:p.id,x:p.x,z:p.z,profileId:p.profileId,wireAngle:p.wireAngle??0}));
   cfg.pixelPlacement='manual';cfg.lightingMode=cfg.manualPixelHoles.length>1?'multi':'single';
  }
  cfg.manualPixelHoles.reverse();
  for(const p of cfg.manualPixelHoles)p.wireAngle=((Number(p.wireAngle)||0)+180)%360;
  onEdit();onStatus('Reversed P1→Pn direction and flipped each opposed cable axis');
 };
 $('stopHolePlacementBtn').onclick=cancel;
 const canvas=renderer.domElement;
 // A second click-and-hold on a selected marker moves the actual socket.
 // Preserve orbit on empty canvas and commit only once the pointer is released.
 document.addEventListener('pointermove',e=>{
  if(!markerDrag)return;
  if(Math.hypot(e.clientX-markerDrag.startX,e.clientY-markerDrag.startY)<5&&!markerDrag.moved)return;
  const data=findPoint(e);
  if(!data)return;
  const state=getSettings(),key=markerDrag.key;
  const i=state[key]?.findIndex(p=>p.id===markerDrag.id);
  if(i<0)return;
  const old=state[key][i];
  if(!markerDrag.moved){
   markerDrag.original={x:old.x,z:old.z};
   markerDrag.moved=true;orbit.enabled=false;
  }
  const valid=data.insideBase&&placementValid(markerDrag.kind,data.pos,i);
  markerDrag.endingValid=valid;
  const side=camera.position.y<data.y?-1:1;
  preview.position.set(data.pos.x,data.y+side*.8,data.pos.z);
  preview.scale.setScalar(Math.max(2,markerDrag.kind==='pixel'?resolvePixelProfile(state).maxDiameter/2:3));
  preview.visible=true;rim.material.color.setHex(valid?0x32dbb3:0xff536b);disc.material.color.copy(rim.material.color);
  if(valid){
   old.x=data.pos.x;old.z=data.pos.z;markerDrag.lastValid={...data.pos};
   const now=performance.now();
   if(now-markerDrag.lastPreview>90){
    markerDrag.lastPreview=now;
    const plan=getPlan();
    draw(plan,true); // keep marker DOM node alive and under the dragged pointer
    $('wireRouteDetails').textContent=plan.wirePlan?.messages?.join(' ')||'';
   }
  }
  e.preventDefault();
 },true);
 document.addEventListener('pointerup',e=>{
  if(!markerDrag)return;
  const drag=markerDrag;markerDrag=null;preview.visible=false;
  if(!drag.moved)return;
  orbit.enabled=!placing&&!gizmo.dragging;
  const state=getSettings(),index=state[drag.key]?.findIndex(p=>p.id===drag.id);
  if(index>=0){
   const p=state[drag.key][index];
   if(!drag.endingValid||!drag.lastValid){
    p.x=drag.original.x;p.z=drag.original.z;
   }
   onEdit();
   onStatus(drag.endingValid&&drag.lastValid?'Moved '+hardwareName(drag.kind,index)+' · routes recalculated':'Invalid release: original hole restored');
  }
 },true);
 document.addEventListener('pointercancel',()=>{
  if(!markerDrag)return;
  const drag=markerDrag;markerDrag=null;preview.visible=false;orbit.enabled=!placing&&!gizmo.dragging;
  const state=getSettings(),p=state[drag.key]?.find(x=>x.id===drag.id);
  if(p&&drag.original){p.x=drag.original.x;p.z=drag.original.z;onEdit()}
 },true);
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
  }else if(kind==='exit'||kind==='entry'){
   const edge=nearestEdgePosition(getPlan().polygon,pos);
   if(s.wireMode==='string'){
    const prefix=kind==='entry'?'wireEntry':'wireOutput';
    s[prefix+'X']=edge.x;s[prefix+'Z']=edge.z;
   }else{
    const pixel=s.manualPixelHoles?.[0];
    if(pixel){pixel.wireEndX=edge.x;pixel.wireEndZ=edge.z}
   }
  }else if(kind==='pixel'){
   s.manualPixelHoles.push({...pos,id:'pixel-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6)});
   s.pixelCount=s.manualPixelHoles.length;
  }else if(kind==='mount')s.manualMountHoles.push({...pos,id:'mount-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6)});
  onEdit(); // redraw rings & keep the placement mode active for next click.
  updateCursor(e);
 },true);
 canvas.addEventListener('pointercancel',()=>{pointerStart=null;draggingHole=null},true);
 canvas.addEventListener('dblclick',e=>{
  if(!isBuild()||placing||e.button!==0)return;
  const data=findPoint(e);if(!data?.insideBase)return;
  contextPoint={...data.pos};
  const rect=renderer.domElement.getBoundingClientRect();
  contextMenu.style.left=Math.min(Math.max(8,e.clientX-rect.left),Math.max(8,rect.width-220))+'px';
  contextMenu.style.top=Math.min(Math.max(8,e.clientY-rect.top),Math.max(8,rect.height-145))+'px';
  contextMenu.hidden=false;
  e.preventDefault();e.stopImmediatePropagation();
 },true);
 contextMenu.querySelector('[data-context-cancel]').onclick=clearContext;
 contextMenu.querySelectorAll('[data-context-add]').forEach(button=>button.onclick=()=>{
  if(!contextPoint)return;
  const kind=button.dataset.contextAdd,point={...contextPoint};
  clearContext();
  manuallyPlace(kind);
  if(!placementValid(kind,point)){cancel();onStatus('Invalid '+kind+' location: outside the safe base or too close to another hole');return}
  const state=getSettings(),key=kind==='pixel'?'manualPixelHoles':'manualMountHoles';
  state[key].push({...point,id:kind+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)});
  if(kind==='pixel'){state.lightingMode=state[key].length>1?'multi':'single';state.pixelCount=state[key].length}
  cancel();onEdit();onStatus('Added '+kind+' hole at X '+point.x+' / Z '+point.z+' mm');
 });
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
   if(!contextMenu.hidden)clearContext();
   if(placing)cancel();
  }
 },true);
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
