/* Build-stage placement/inspection: same authoritative plan as fabrication. */
import {planHardware,mountingProfile} from './hardware-layout.js';
import {mountPatternEditor} from './mounting-pattern-editor.js';
import {resolvePixelProfile,resolveSocketProfile,allPixelProfiles} from './pixel-profiles.js';
import {snapHardwarePoint,snapHardwareCoordinate} from './design-workflows.js';
import {nearestEdgePosition} from './edge-tabs.js';
import {ensureHardwareIds,movePixelInString,hardwareName} from './hardware-identity.js';
import {snapPixelsToWireLength} from './pixel-spacing-snap.js';
import {setPixelEdgeMode,pixelEdgeMode,solvePixelMove} from './pixel-motion.js';
import {routingSummary,renderFeedback} from './routing-feedback.js';

export function createHardwareEditor({THREE,scene,renderer,camera,orbit,gizmo,getBaseMesh,getSettings,getCrystals,getManufacturingVisible=()=>false,onEdit,onStatus,validateMountPattern,onSelectionChange=()=>{},canEdit=()=>true}){
 const $=id=>document.getElementById(id),guides=new THREE.Group();
 const mountingPreview=new THREE.Group();mountingPreview.name='Mount pattern preview';scene.add(mountingPreview);
 function drawMountPreview(transaction,issues){
  for(const mesh of [...mountingPreview.children]){
   mountingPreview.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();
  }
  if(!transaction)return;
  const ring=(x,z,radius,color)=>{
   const mesh=new THREE.Mesh(new THREE.TorusGeometry(radius,.22,6,32),
    new THREE.MeshBasicMaterial({color,depthTest:false,depthWrite:false}));
   mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.9,z);mesh.renderOrder=108;
   mountingPreview.add(mesh);
  };
  transaction.candidates.forEach((hole,index)=>ring(hole.x,hole.z,hole.diameter/2,issues[index]?0xff536b:0x25e5c0));
  ring(transaction.centre.centerX,transaction.centre.centerZ,1,0xffffff);
 }
 const groupedMount=(settings,id)=>settings.mountingPatterns?.some(pattern=>pattern.members.includes(id));
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
 const edgeMarkerHeight=.8;
 const edgeMarkerPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-edgeMarkerHeight);
 let placing=null,pointerStart=null,lastCursor=null,draggingHole=null,selectedHardware=null,markerDrag=null;
 let edgeDrag=null,guideWorker=null,guideSerial=0;
 const movementGuides=new THREE.Group();movementGuides.name='Cable-constrained movement guide';scene.add(movementGuides);
 const wireKeys=['manualPixelHoles','pixelPlacement','pixelCount','wireEntryX','wireEntryZ','wireOutputX','wireOutputZ','wireChannels','wireMode','cutSockets','constrainPixelMotion','wireInputEnabled','wireOutputEnabled','wireInputTailLength','wireOutputTailLength'];
 const copy=value=>JSON.parse(JSON.stringify(value));
 function applyWireDraft(draft){const target=getSettings();for(const key of wireKeys){if(Object.hasOwn(draft,key))target[key]=copy(draft[key]);else delete target[key];}}
 function clearMovementGuide(){for(const child of [...movementGuides.children]){movementGuides.remove(child);child.geometry.dispose();child.material.dispose();}}
 function requestMovementGuide(selection){
  guideWorker?.terminate();guideWorker=null;clearMovementGuide();
  if(!getSettings().constrainPixelMotion||!window.Worker)return;
  const serial=++guideSerial;guideWorker=new Worker(new URL('./pixel-motion-worker.js',import.meta.url),{type:'module'});
  guideWorker.onmessage=({data})=>{guideWorker?.terminate();guideWorker=null;if(data.serial!==guideSerial||!data.guide)return;
   const samples=data.guide.samples;
   for(let i=1;i<samples.length;i++)if(samples[i-1].valid&&samples[i].valid){
    const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(samples[i-1].x,1.3,samples[i-1].z),new THREE.Vector3(samples[i].x,1.3,samples[i].z)]);
    const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:selection.edgeKind==='input'?0x00a6a6:selection.edgeKind==='output'?0xe86b0a:0x18be70,depthTest:false,transparent:true,opacity:.95}));line.renderOrder=210;movementGuides.add(line);
   }
  };
  guideWorker.onerror=()=>{guideWorker?.terminate();guideWorker=null;};
  guideWorker.postMessage({serial,crystals:getCrystals(),settings:copy(getSettings()),selection});
 }
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
 const isBuild=()=>!!document.querySelector('[data-tab="build"].active')&&!document.body.classList.contains('sms-generic-mode');
 const getPlan=()=>planHardware(getCrystals(),getSettings());
 function getSelectedPixel(){
  if(!isBuild()||selectedHardware?.kind!=='pixel')return null;
  const index=getSettings().manualPixelHoles?.findIndex(pixel=>String(pixel.id)===selectedHardware.id)??-1;
  if(index<0)return null;
  const pixel=getSettings().manualPixelHoles[index];
  return {...pixel,index,label:hardwareName('pixel',index)};
 }
 function updatePixel(id,changes){
  if(!isBuild()||!canEdit())return {valid:false,reason:'Open an editable model in Build to change a pixel.'};
  const state=getSettings();
  const index=state.manualPixelHoles?.findIndex(pixel=>String(pixel.id)===String(id))??-1;
  if(index<0)return {valid:false,reason:'The selected pixel no longer exists.'};
  const current=state.manualPixelHoles[index],pixel={...current};
  for(const key of ['x','z','wireAngle']){
   if(!Object.hasOwn(changes,key))continue;
   if(!Number.isFinite(changes[key])||(key==='wireAngle'&&Math.abs(changes[key])>180))
    return {valid:false,reason:key==='wireAngle'?'Enter an angle from −180° to 180°.':'Enter a finite position.'};
   pixel[key]=changes[key];
  }
  if(Object.hasOwn(changes,'profileId')){
   if(!allPixelProfiles(state).some(profile=>profile.id===changes.profileId))return {valid:false,reason:'Choose a saved pixel profile.'};
   pixel.profileId=changes.profileId;
  }
  const positionOnly=(Object.hasOwn(changes,'x')||Object.hasOwn(changes,'z'))&&!Object.hasOwn(changes,'wireAngle')&&!Object.hasOwn(changes,'profileId');
  if(positionOnly&&state.constrainPixelMotion){
   const solved=solvePixelMove(getCrystals(),state,{pixelId:id,point:pixel});
   if(!solved.valid)return solved;
   applyWireDraft(solved.settings);
  }else{
   const draft={...state,manualPixelHoles:state.manualPixelHoles.map((item,i)=>i===index?pixel:item)};
   const plan=planHardware(getCrystals(),draft);
   if(!plan.sockets.some(item=>String(item.id)===String(id)))return {valid:false,reason:'The fitting does not clear the base or nearby hardware.'};
   if(plan.wirePlan?.enabled&&!plan.wirePlan.ready&&state.constrainPixelMotion)
    return {valid:false,reason:plan.wirePlan.messages.join(' ')||'The cable route is blocked.'};
   state.manualPixelHoles[index]=pixel;
  }
  onEdit();
  requestMovementGuide({pixelId:String(id)});
  return {valid:true};
 }
 function removeSelectedPixel(){
  const pixel=getSelectedPixel();
  if(!pixel||!canEdit())return false;
  const state=getSettings();
  state.manualPixelHoles.splice(pixel.index,1);
  if(state.lightingMode==='multi')state.pixelCount=state.manualPixelHoles.length;
  selectedHardware=null;
  onEdit();
  onSelectionChange(null);
  onStatus('Removed '+pixel.label+' · Undo restores the fitting.');
  return true;
 }
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
  if(kind==='pixel'&&canEdit()&&getSettings().pixelPlacement!=='manual'){
   const state=getSettings(),plan=getPlan();state.manualPixelHoles=plan.sockets.map(p=>({id:p.id,x:p.x,z:p.z,profileId:p.profileId,wireAngle:p.wireAngle??0}));state.pixelPlacement='manual';state.pixelCount=state.manualPixelHoles.length;onEdit();
  }
  refresh();
  onSelectionChange(getSelectedPixel());
  if(scroll){
   const card=[...document.querySelectorAll('[data-hw-card-kind]')].find(el=>el.dataset.hwCardKind===kind&&el.dataset.hwCardId===id);
   for(let parent=card?.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
   card?.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  if(kind==='pixel')requestMovementGuide({pixelId:id});
  onStatus('Selected '+hardwareName(kind,index)+' · edit it in the Build panel');
 }
 function addMarker(kind,p,index,invalid=false){
  if(!Number.isFinite(p.x)||!Number.isFinite(p.z))return;
  const id=String(p.id||kind+'-'+index),label=hardwareName(kind,index);
  const button=document.createElement('button');
  button.type='button';button.className='hardware-marker'+(invalid?' invalid':'')+(selectedHardware?.kind===kind&&selectedHardware.id===id?' selected':'');
  button.textContent=label;button.title=label+' · click to edit '+kind;
  button.setAttribute('aria-pressed',String(selectedHardware?.kind===kind&&selectedHardware.id===id));
  button.dataset.hwKind=kind;button.dataset.hwId=id;button.dataset.hwIndex=String(index);
  button.setAttribute('aria-label','Select '+label+' '+kind);
  button.onclick=e=>{e.stopPropagation();if(!markerDrag?.moved)showSelection(kind,id,index)};
  button.addEventListener('pointerdown',e=>{
   if(e.button!==0||!isBuild()||placing||!canEdit())return;
   e.stopPropagation();
   if(selectedHardware?.kind!==kind||selectedHardware?.id!==id)return;
   if(kind==='tab'||invalid||markerDrag||edgeDrag)return;
   const cfg=getSettings(),isPixel=kind==='pixel',key=isPixel?'manualPixelHoles':'manualMountHoles';
   const mode=isPixel?'pixelPlacement':'mountPlacement';
   const plan=getPlan();
   const items=isPixel?plan.sockets:plan.mounts;
   const manual=cfg[mode]==='manual';
   const holes=(manual?cfg[key]||[]:items).map(t=>({...t}));
   const index=holes.findIndex(t=>String(t.id)===id);
   if(index<0)return;
   markerDrag={kind,id,key,mode,index,holes,crystals:getCrystals(),pointerId:e.pointerId,
    startX:e.clientX,startY:e.clientY,armedAt:performance.now()+(isPixel?180:0),
    moved:false,endingValid:false,lastPreview:0};
   e.preventDefault();
  });
  button.ondblclick=e=>{e.preventDefault();e.stopPropagation();showSelection(kind,id,index)};
  markerLayer.appendChild(button);markerObjects.push({button,p});
 }
 function positionMarkers(){
  const build=isBuild(),rect=renderer.domElement.getBoundingClientRect();
  markerLayer.hidden=!build||!!placing;
  guides.visible=build&&!getManufacturingVisible();
  mountingPreview.visible=build&&!placing&&!getManufacturingVisible();
  movementGuides.visible=build&&!placing&&!getManufacturingVisible();
  if(build&&!placing&&rect.width&&rect.height)for(const {button,p} of markerObjects){
   const pt=new THREE.Vector3(p.x,edgeMarkerHeight,p.z).project(camera);
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
  const focusedMarker=markerLayer.contains(document.activeElement)?document.activeElement.dataset:null;
  clear(preserveHardwareMarkers);
  if(!preserveHardwareMarkers){
   plan.sockets.forEach((p,i)=>addMarker('pixel',p,i));
   plan.mounts.forEach((p,i)=>addMarker('mount',p,i));
   plan.tabHoles.forEach((p,i)=>addMarker('tab',p,i));
   for(const p of plan.invalidManualPixels||[])addMarker('pixel',{...p,id:'invalid-pixel-'+p.index},p.index,true);
   for(const p of plan.invalidManualMounts||[])addMarker('mount',{...p,id:'invalid-mount-'+p.index},p.index,true);
   for(const [kind,point] of [['input',plan.wirePlan?.entryPoint],['output',plan.wirePlan?.exitPoint]])if(point)addEdgeMarker(kind,point);
   if(focusedMarker){
    const focused=markerObjects.find(({button:{dataset}})=>focusedMarker.hwId
     ?dataset.hwId===focusedMarker.hwId&&dataset.hwKind===focusedMarker.hwKind
     :focusedMarker.edgeWire&&dataset.edgeWire===focusedMarker.edgeWire);
    focused?.button.focus({preventScroll:true});
   }
  }else{
   for(const item of markerObjects){
    if(item.button.dataset.edgeWire){const point=item.button.dataset.edgeWire==='input'?plan.wirePlan?.entryPoint:plan.wirePlan?.exitPoint;if(point)item.p=point;continue;}
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
   const length=Math.hypot(dx,dz)+.12; // guide-only overlap; avoid fake projecting stubs
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
   // Arrow decorations are never allowed to cross an LED socket. They
   // must live on an actual open stretch of cable rather than looking like
   // a stray short unconnected groove through the yellow P ring.
   const nearSocket=plan.sockets.some(p=>Math.hypot(midX-p.x,midZ-p.z)<
    p.radius+Math.min(8,Math.max(3,route.lengthMm))+3);
   if(s.wireDirectionArrows!==false&&route.lengthMm>0&&!nearSocket){
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
 function addEdgeMarker(kind,p){
  const button=document.createElement('button');button.type='button';button.className='hardware-marker hardware-edge-marker edge-'+kind;
  button.style.touchAction='none';
  button.style.cursor='grab';
  button.textContent=kind==='input'?'IN':'OUT';button.dataset.edgeWire=kind;
  button.dataset.tooltipTitle=kind==='input'?'Input cable opening':'Output cable opening';
  button.dataset.tooltipBody='Drag this '+kind+' opening along the base edge. Only positions within the chosen curved cable length and clear of other hardware can be applied. The coloured edge line shows sampled available positions.';
  button.setAttribute('aria-label','Move '+kind+' edge wire opening');
  button.onclick=e=>{e.stopPropagation();requestMovementGuide({edgeKind:kind});};
  button.onpointerdown=e=>{
   if(e.button!==0||placing||markerDrag||edgeDrag||!isBuild()||!canEdit())return;
   e.preventDefault();e.stopPropagation();
   button.focus({preventScroll:true});
   const rect=button.getBoundingClientRect();
   edgeDrag={kind,pointerId:e.pointerId,crystals:getCrystals(),original:JSON.stringify(getSettings()),
    startX:e.clientX,startY:e.clientY,offsetX:e.clientX-rect.left-rect.width/2,
    offsetY:e.clientY-rect.top-rect.height/2,moved:false,lastPreview:-Infinity};
   button.setPointerCapture(e.pointerId);
   requestMovementGuide({edgeKind:kind});
  };
  button.onkeydown=e=>{
   if(!isBuild()||placing||edgeDrag||!canEdit())return;
   const delta={ArrowLeft:-1,ArrowUp:-1,ArrowRight:1,ArrowDown:1}[e.key];if(!delta)return;e.preventDefault();
   const poly=getPlan().polygon,near=nearestEdgePosition(poly,p),step=(e.shiftKey?5:1)/Math.max(1,poly.reduce((n,a,i)=>n+Math.hypot(a.x-poly[(i+1)%poly.length].x,a.z-poly[(i+1)%poly.length].z),0));
   const u=(near.u+delta*step+1)%1;let travelled=0;const total=poly.reduce((n,a,i)=>n+Math.hypot(a.x-poly[(i+1)%poly.length].x,a.z-poly[(i+1)%poly.length].z),0);
   let point=p;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],length=Math.hypot(a.x-b.x,a.z-b.z);if(u*total<=travelled+length){const t=(u*total-travelled)/(length||1);point={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};break;}travelled+=length;}
   const solved=solvePixelMove(getCrystals(),getSettings(),{edgeKind:kind,edgePoint:point});if(solved.valid){applyWireDraft(solved.settings);onEdit();requestMovementGuide({edgeKind:kind});}else onStatus('Edge movement blocked: '+solved.reason);
  };
  markerLayer.append(button);markerObjects.push({button,p});
 }
 function refresh(){
  drawMountPreview(null);
  const s=getSettings();
  ensureHardwareIds(s);
  const plan=getPlan();
  draw(plan);
  const routing=plan.wirePlan;
  if($('snapPixelSpacingBtn'))$('snapPixelSpacingBtn').disabled=!(s.wireMode==='string'&&s.wireChannels&&plan.sockets.length>1);
  if($('wireRouteStatus')){
   $('wireRouteStatus').textContent=!routing?.enabled?'Wiring grooves are off. Enable to plan a physical cable-bundle string.':
    routing.mode==='string'?
     (routing.ready?'✓ Pixel string IN → '+plan.sockets.map((_,i)=>'P'+(i+1)).join(' → ')+' → OUT · '+routing.lengthMm.toFixed(1)+' mm · '+routing.routes.length+' cut groove segments.':
      'String blocked: '+routing.messages.join(' ')):
      routing.routes.length?routing.routes.length+' legacy groove segment(s) · '+routing.lengthMm.toFixed(1)+' mm. Switch to Pixel string to route opposed IN/OUT tails.':
       routing.messages.join(' ')||'No safe cable groove planned.';
   $('wireRouteStatus').classList.toggle('warning',!!routing?.enabled&&!routing.ready&&routing.mode==='string');
   if(routing?.mode==='string')renderFeedback($('wireRouteStatus'),routingSummary(plan,s),{fix:routing.enabled&&!routing.ready?tryRepair:null,focus:routing.enabled&&!routing.ready?()=>{
    const index=routing.entryAdded?Math.max(0,plan.sockets.length-1):0,pixel=plan.sockets[index];if(pixel)showSelection('pixel',pixel.id,index);
   }:null});
  }
  if($('wireRouteDetails')){
   const details=routing?.connections||[];
   $('wireRouteDetails').textContent=details.map(c=>
    (c.from==null?'IN':'P'+(c.from+1))+' → '+(c.to==null?'OUT':'P'+(c.to+1))+
    ': '+c.lengthMm.toFixed(1)+' mm'+(c.allowedMm!=null?' / '+c.allowedMm.toFixed(1)+' mm'+(c.overLength?' — TOO LONG':' — OK'):'')
   ).join('  ·  ');
   $('wireRouteDetails').classList.toggle('warning',!!routing?.overLengthCount);
   if(!$('wireRouteDetails').closest('details.wire-measurements')){const details=document.createElement('details');details.className='wire-measurements';const summary=document.createElement('summary');summary.textContent='Cable measurements';$('wireRouteDetails').before(details);details.append(summary,$('wireRouteDetails'));}
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
 '<p class="note">IN and OUT always remain opposite. With constrained movement on, the pixel turns automatically to keep its cable routes within the chosen lengths.</p>'+
 (s.wireMode==='string'?'<label>Pixel edge wire<select data-pixel-edge="'+i+'" data-tooltip-title="Connect this pixel to the base edge" data-tooltip-body="Choose Input to make this pixel first in the string, or Output to make it last. Both is available for a one-pixel string. A coloured perimeter handle appears for each safe edge connection; drag it along the edge.">'+
 ['none','input','output','both'].map(mode=>'<option value="'+mode+'" '+(pixelEdgeMode(plan,s,i)===mode?'selected':'')+' '+(mode==='both'&&items.length>1?'disabled':'')+'>'+({none:'None',input:'Input edge wire — becomes P1',output:'Output edge wire — becomes last',both:'Both input and output'}[mode])+'</option>').join('')+'</select></label>'+
 (i===0?'<label>Input edge cable length (mm)<input type="number" min="5" max="1000" step=".1" data-edge-length="input" value="'+(Number(s.wireInputTailLength)||Number(s.pixelStringSpacing)||50)+'"></label>':'')+
 (i===items.length-1?'<label>Output edge cable length (mm)<input type="number" min="5" max="1000" step=".1" data-edge-length="output" value="'+(Number(s.wireOutputTailLength)||Number(s.pixelStringSpacing)||50)+'"></label>':'')+
 '<p class="note">Teal IN and orange OUT handles sit on the base edge. Select a pixel for its green sampled movement outline, or an edge handle for its coloured available edge segments. Every drag is rechecked against the actual curved route.</p>':'')+'</div>':'';
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
   const tabs=s.manualEdgeTabs;
   html.push('<div class="divider"></div><b>Edge tab positions</b>');
   if(!Array.isArray(tabs)&&plan.tabs.length){
    html.push('<p class="note">Automatic positions · '+plan.tabs.length+' tabs.</p><button type="button" data-edit-tab-positions>Make edge tabs editable</button>');
   }else if(!tabs?.length){
    html.push('<button type="button" data-edit-tab-positions>Add edge tab</button>');
   }else html.push('<p class="note">Add, Shift-drag or delete tabs along the perimeter.</p>');
   for(let i=0;i<(tabs||[]).length;i++){
    const u=Number(s.manualEdgeTabs[i].u||0),bad=!plan.tabs.some(t=>t.index===i);
    html.push('<div class="buttonrow"><label>Tab '+(i+1)+' · perimeter <input type="number" min="0" max="99.9" step=".5" data-tab-u="'+i+'" value="'+(u*100).toFixed(1)+'"> %</label><button data-remove-tab="'+i+'">✕ Delete</button></div>'+
      (bad?'<p class="note warning">Tab conflicts with another feature and will not be cut.</p>':''));
   }
  }
  list.innerHTML=html.join('')||'<p class="note">Use Place / move to make existing automatic holes editable, or add new holes by clicking the model.</p>';
  if(canEdit())renderMountPatterns(list,s,plan);
  const tabEditor=list.querySelector('[data-edit-tab-positions]');
  if(tabEditor)tabEditor.onclick=()=>manuallyPlace('tab');
  list.querySelectorAll('[data-pixel-edge]').forEach(select=>select.onchange=()=>{
   const p=s.manualPixelHoles[Number(select.dataset.pixelEdge)],result=setPixelEdgeMode(getCrystals(),s,p.id,select.value);
   if(result.valid){applyWireDraft(result.settings);onEdit();requestMovementGuide({pixelId:p.id});onStatus('Edge wire configured. Drag the teal IN or orange OUT handle around the perimeter.');}
   else{onStatus(result.reason);refresh();}
  });
  list.querySelectorAll('[data-edge-length]').forEach(input=>input.onchange=()=>{
   const value=Number(input.value);if(!Number.isFinite(value)||value<5||value>1000){onStatus('Edge cable length must be 5–1000 mm.');refresh();return;}
   const draft=copy(s);draft[input.dataset.edgeLength==='input'?'wireInputTailLength':'wireOutputTailLength']=value;draft.constrainPixelMotion=true;
   const result=solvePixelMove(getCrystals(),draft,{});
   if(result.valid){applyWireDraft(result.settings);onEdit();}else{onStatus(result.reason);refresh();}
  });
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
   const coordinate=snapHardwareCoordinate(value,s.hardwareSnap,s.hardwareSnapStep);
   if(key==='manualPixelHoles'){
    const result=updatePixel(item.id,{[input.dataset.holeAxis]:coordinate});
    if(!result.valid){input.value=item[input.dataset.holeAxis];onStatus(result.reason);}
    return;
   }
   if(groupedMount(s,item.id)){
    input.value=item[input.dataset.holeAxis];onStatus('Edit the whole mounting pattern or ungroup it first.');return;
   }
   item[input.dataset.holeAxis]=coordinate;onEdit();
  });
  list.querySelectorAll('[data-hole-profile]').forEach(select=>select.onchange=()=>{
   const item=s.manualPixelHoles?.[Number(select.dataset.holeProfile)];
   if(!item)return;
   const result=updatePixel(item.id,{profileId:select.value});
   if(!result.valid){select.value=item.profileId||'';onStatus(result.reason);}
  });
  list.querySelectorAll('[data-wire-angle]').forEach(input=>input.onchange=()=>{
   const pixel=s.manualPixelHoles?.[Number(input.dataset.wireAngle)];
   if(!pixel)return;
   const result=updatePixel(pixel.id,{wireAngle:input.valueAsNumber});
   if(!result.valid){input.value=pixel.wireAngle??0;onStatus(result.reason);}
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
   if(key==='manualMountHoles'&&groupedMount(s,s[key][Number(button.dataset.holeIndex)]?.id)){
    onStatus('Ungroup the mounting pattern before removing an individual hole.');return;
   }
   s[key].splice(Number(button.dataset.holeIndex),1);
   if(key==='manualPixelHoles'&&s.lightingMode==='multi')s.pixelCount=s[key].length;
   onEdit();
  });
 }
 function renderMountPatterns(list,state,previous){
  const section=document.createElement('details'),summary=document.createElement('summary');
  summary.textContent='Uniform Crystal mounting patterns';
  section.append(summary);list.append(section);
  section.addEventListener('toggle',()=>{
   if(!section.open){drawMountPreview(null);return;}
   if(section.children.length>1){section.querySelector('[data-pattern-select]')?.dispatchEvent(new Event('change'));return;}
   const {preset,enabled,diameter,depth}=mountingProfile(state);
   const patterns=state.mountingPatterns??[];
   if(!enabled||preset==='Detachable plate'||state.mountPlacement!=='manual'){
    const note=document.createElement('p');
    note.textContent='Choose a supported base mounting preset and switch mounting positions to Manual.';
    section.append(note);return;
   }
   const mounts=state.manualMountHoles||[],footprint=previous.polygon.map(({x,z})=>[x,z]);
   const fixing={crystalFixing:{profile:preset,diameter,depth,
    blind:['Magnet inserts','Threaded insert M3'].includes(preset)},profile:preset,diameter,depth};
   const validate=({mounts,candidates})=>{
    const next=planHardware(getCrystals(),{...state,manualMountHoles:mounts});
    const accepted=new Set(next.mounts.map(hole=>hole.id));
    const missing=next.invalidManualMounts.length;
    const tabConflict=next.tabs.length<previous.tabs.length||next.tabHoles.length<previous.tabHoles.length;
    const routeConflict=previous.wirePlan?.ready&&!next.wirePlan?.ready;
    return candidates.map(hole=>!accepted.has(hole.id)?'The hole crosses the footprint or another fitting.':
     tabConflict?'This pattern interferes with existing edge tabs.':
     routeConflict?'This pattern blocks the existing cable route.':
     missing?'Another mounting hole would be displaced.':null);
   };
   section.append(mountPatternEditor({patterns,mounts,footprint,limit:20,fixedProfile:fixing,validate,
    onPreview:drawMountPreview,
    apply:async transaction=>{
     if(validate(transaction).some(Boolean))return;
     if(!section.isConnected)return;
     const {mounts,patterns}=transaction;
     try{
      await validateMountPattern({...state,manualMountHoles:mounts,mountingPatterns:patterns});
      if(!section.isConnected||getSettings()!==state||!canEdit())return;
      state.manualMountHoles=mounts;
      state.mountingPatterns=patterns;
      onEdit();onStatus('Applied all '+transaction.candidates.length+' mounting holes.');
     }catch(error){onStatus(error.message);throw error;}
    },
    ungroup:id=>{state.mountingPatterns=patterns.filter(entry=>entry.id!==id);onEdit();}
   }));
  });
 }
 let autoRepairWorker=null,autoRepairSerial=0;
 async function tryRepair(event){
  if(autoRepairWorker){onStatus('Automatic routing is already checking this model.');return;}
  if(!window.Worker){onStatus('Automatic routing needs Web Workers; this browser cannot run the search safely.');return;}
  const settings=copy(getSettings()),crystals=copy(getCrystals());
  const before=JSON.stringify(settings),crystalBefore=JSON.stringify(crystals);
  const button=event?.currentTarget;
  if(button){button.disabled=true;button.setAttribute('aria-busy','true');}
  onStatus('Checking routes in the background… The editor remains usable.');
  const serial=++autoRepairSerial;
  let worker=null,deadline=null;
  try{
   const result=await new Promise((resolve,reject)=>{
    worker=new Worker(new URL('./pixel-route-repair-worker.js',import.meta.url),{type:'module'});
    autoRepairWorker=worker;
    // Terminate expensive searches instead of freezing the browser event loop.
    deadline=setTimeout(()=>reject(Error('Routing exceeded 8 seconds. No changes were made. Move a pixel closer to a clear edge, or choose a measured longer cable.')),8000);
    worker.onmessage=({data})=>{
     if(data?.serial!==serial)return;
     if(data.error)reject(Error(data.reason||'Automatic routing failed.'));
     else resolve(data);
    };
    worker.onerror=error=>reject(Error('Routing worker failed to load: '+(error.message||'unknown error')));
    worker.onmessageerror=()=>reject(Error('Routing returned an unreadable result.'));
    worker.postMessage({serial,crystals,settings});
   });
   if(JSON.stringify(getSettings())!==before||JSON.stringify(getCrystals())!==crystalBefore){
    onStatus('Model changed during automatic routing. No stale pixel positions were applied.');
    return;
   }
   if(result.valid&&result.settings){
    applyWireDraft(result.settings);onEdit();
    onStatus('Routing fixed. Pixel positions, fixings and measured cable lengths were kept. Prepare the print mesh again.');
   }else{
    renderFeedback($('wireRouteStatus'),{severity:'error',title:'The route needs a manual adjustment.',
     body:result.reason||'No safe route was found.',details:getPlan().wirePlan?.messages||[]});
    onStatus('No automatic route fits. The original model is unchanged. Review the red box in Build.');
   }
  }catch(error){
   onStatus('Automatic routing stopped safely. '+error.message);
   const status=$('wireRouteStatus');
   if(status)renderFeedback(status,{severity:'error',title:'Automatic routing stopped without changing your model.',
    body:error.message,details:['The search is limited to 8 seconds to keep the editor responsive.',
     'Try moving a pixel closer to the perimeter, changing its rotation or choosing a measured longer wire.']});
  }finally{
   if(deadline!==null)clearTimeout(deadline);
   worker?.terminate();
   if(autoRepairWorker===worker)autoRepairWorker=null;
   if(button?.isConnected){button.disabled=false;button.removeAttribute('aria-busy');}
  }
 }
 function placementValid(kind,pos,replaceIndex=null,s=getSettings()){
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
   else if(holes[replaceIndex])holes[replaceIndex]={...holes[replaceIndex],...pos};
   else return false;
   const next=planHardware(getCrystals(),{...s,cutSockets:true,lightingMode:'multi',pixelPlacement:'manual',manualPixelHoles:holes,pixelCount:holes.length});
   return !next.invalidManualPixels.some(p=>p.index===(replaceIndex===null?holes.length-1:replaceIndex));
  }
  const holes=(s.manualMountHoles||[]).map(p=>({...p}));
  if(replaceIndex!=null&&groupedMount(s,holes[replaceIndex]?.id))return false;
  if(replaceIndex===null){if(holes.length>=20)return false;holes.push(pos)}
  else if(holes[replaceIndex])holes[replaceIndex]=pos;
  else return false;
  const next=planHardware(getCrystals(),{...s,mountPlacement:'manual',manualMountHoles:holes,
   mount:s.mount==='None'?'Custom dual holes':s.mount});
  const previous=getPlan();
  return !next.invalidManualMounts.some(p=>p.index===(replaceIndex===null?holes.length-1:replaceIndex))&&
   next.tabs.length>=previous.tabs.length&&(!previous.wirePlan?.enabled||!previous.wirePlan.ready||next.wirePlan.ready);
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
   if(s.mount==='Edge fixing tabs')s.edgeManualMounts=true;
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
 $('snapPixelSpacingBtn').onclick=()=>{
  if(placing){onStatus('Finish hardware placement before snapping pixel spacing.');return}
  const settings=getSettings();
  const snap=snapPixelsToWireLength(getCrystals(),settings,{maxMoveMm:settings.pixelSnapMaxMove??5});
  if(snap.changed){
   // One deliberate, undoable design edit. All other settings, identities,
   // LED profiles, angles and IN/OUT tail choices are left untouched.
   Object.assign(settings,snap.settings);
   onEdit();
  }
  const summary=snap.reason||('Aligned '+snap.aligned+'/'+snap.total+' internal runs to '+
   snap.targetMm+' mm; moved '+(snap.moved||0)+' pixel(s) within '+snap.maxMoveMm+' mm.');
  const skipped=(snap.links||[]).filter(item=>item.status==='skipped').map(item=>
   item.label+' ('+(item.beforeMm==null?'no route':item.beforeMm.toFixed(1)+' mm')+'): '+item.reason);
  const status=summary+' P1 stays fixed; IN/OUT tails do not use the pixel spacing. '+
   (skipped.length?'Needs manual positioning: '+skipped.join(' | '):
    'All accessible internal runs are now within the snap tolerance.');
  const validRoute=getPlan().wirePlan?.ready;
  renderFeedback($('wireSnapStatus'),{severity:validRoute?'info':'error',title:snap.changed?'Pixel spacing adjusted.':validRoute?'No movement was needed for valid cable lengths.':'The layout still needs a routing adjustment.',
   body:snap.changed?'The permitted small adjustments have been applied.':validRoute?'Your cables already fit within the selected length. Exact-length snapping left these pixels in place.':'Try automatic routing, then move any remaining problem pixels closer together.',details:[status]},
   {fix:!validRoute?tryRepair:null});
  onStatus(snap.changed?'Pixel spacing adjusted.':validRoute?'Your cables fit. No pixels were moved.':'Routing needs attention. See the red box in Build.');
 };
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
 function solveEdgeDrag(drag,e){
  const rect=canvas.getBoundingClientRect();
  if(!isBuild()||!canEdit()||placing||drag.crystals!==getCrystals()||drag.original!==JSON.stringify(getSettings())||
    !rect.width||!rect.height||e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)return null;
  cursorNDC.set(2*(e.clientX-drag.offsetX-rect.left)/rect.width-1,1-2*(e.clientY-drag.offsetY-rect.top)/rect.height);
  ray.setFromCamera(cursorNDC,camera);
  const edgePoint=ray.ray.intersectPlane(edgeMarkerPlane,new THREE.Vector3());
  if(!edgePoint)return null;
  const draft=copy(getSettings());
  draft.constrainPixelMotion=true;
  return solvePixelMove(drag.crystals,draft,{edgeKind:drag.kind,edgePoint});
 }
 function finishEdgeDrag(e){
  const drag=edgeDrag;
  edgeDrag=null;
  if(!drag.moved)return;
  orbit.enabled=!placing&&!gizmo.dragging;
  const result=e&&solveEdgeDrag(drag,e);
  if(result?.valid){
   applyWireDraft(result.settings);onEdit();requestMovementGuide({edgeKind:drag.kind});
   onStatus('Moved '+drag.kind+' perimeter opening; pixel rotation and curved length checked.');
  }else{
   refresh();
   onStatus('Move cancelled · original '+drag.kind+' perimeter opening kept.');
  }
 }
 document.addEventListener('pointermove',e=>{
  const drag=edgeDrag;
  if(!drag||e.pointerId!==drag.pointerId||(!drag.moved&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<4))return;
  e.preventDefault();drag.moved=true;orbit.enabled=false;
  const now=performance.now();
  if(now-drag.lastPreview<70)return;
  drag.lastPreview=now;
  const result=solveEdgeDrag(drag,e);
  draw(result?.valid?result.plan:getPlan(),true);
  onStatus(result?.valid?'Edge opening is ready. Release to apply.':'Edge movement blocked. Release here to keep the original opening.');
 },true);
 document.addEventListener('pointerup',e=>{if(e.pointerId===edgeDrag?.pointerId)finishEdgeDrag(e);},true);
 for(const event of ['pointercancel','lostpointercapture'])
  document.addEventListener(event,e=>{if(e.pointerId===edgeDrag?.pointerId)finishEdgeDrag();},true);
 function updateMarkerDrag(e,final=false){
  const drag=markerDrag;
  if(!drag||e.pointerId!==drag.pointerId)return;
  if(!drag.moved){
   if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<5)return;
   if(performance.now()<drag.armedAt){markerDrag=null;return;}
   drag.moved=true;
   orbit.enabled=false;
  }
  const data=findPoint(e);
  drag.endingValid=false;
  if(!data||drag.crystals!==getCrystals()||!isBuild()||!canEdit()){preview.visible=false;return;}
  const state=getSettings(),draft={...state,[drag.key]:drag.holes,[drag.mode]:'manual'};
  if(drag.kind==='pixel')draft.pixelCount=drag.holes.length;
  const solved=drag.kind==='pixel'&&state.constrainPixelMotion&&data.insideBase
   ?solvePixelMove(getCrystals(),draft,{pixelId:drag.id,point:data.pos}):null;
  const valid=data.insideBase&&(solved?solved.valid:placementValid(drag.kind,data.pos,drag.index,draft));
  drag.endingValid=valid;
  const side=camera.position.y<data.y?-1:1;
  preview.position.set(data.pos.x,data.y+side*.8,data.pos.z);
  preview.scale.setScalar(Math.max(2,drag.kind==='pixel'?resolveSocketProfile(state,drag.holes[drag.index]).maxDiameter/2:3));
  preview.visible=true;rim.material.color.setHex(valid?0x32dbb3:0xff536b);disc.material.color.copy(rim.material.color);
  if(valid){
   drag.draft=solved?.settings??{...draft,[drag.key]:drag.holes.map((hole,i)=>i===drag.index?{...hole,...data.pos}:hole)};
   const now=performance.now();
   if(!final&&now-drag.lastPreview>90){
    drag.lastPreview=now;
    const plan=solved?.plan??planHardware(getCrystals(),drag.draft);
    draw(plan,true);
    if($('wireRouteDetails'))$('wireRouteDetails').textContent=plan.wirePlan?.messages?.join(' ')||'';
   }
  }
  e.preventDefault();
 }
 function finishMarkerDrag(commit){
  const drag=markerDrag;
  if(!drag)return;
  markerDrag=null;preview.visible=false;
  if(!drag.moved)return;
  orbit.enabled=!placing&&!gizmo.dragging;
  const accepted=commit&&drag.endingValid&&drag.draft&&drag.crystals===getCrystals()&&canEdit();
  if(accepted){
   if(drag.kind==='pixel')applyWireDraft(drag.draft);
   else{const state=getSettings();state[drag.key]=drag.draft[drag.key];state[drag.mode]='manual';}
   onEdit();
  }else refresh();
  if(drag.kind==='pixel'&&drag.crystals===getCrystals())requestMovementGuide({pixelId:drag.id});
  onStatus(accepted?'Moved '+hardwareName(drag.kind,drag.index)+' · routes recalculated':'Move cancelled · original hole kept');
 }
 document.addEventListener('pointermove',updateMarkerDrag,true);
 document.addEventListener('pointerup',e=>{
  if(e.pointerId!==markerDrag?.pointerId)return;
  if(markerDrag.moved)updateMarkerDrag(e,true);
  finishMarkerDrag(true);
 },true);
 document.addEventListener('pointercancel',e=>{
  if(e.pointerId===markerDrag?.pointerId)finishMarkerDrag(false);
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
   if(edgeDrag){finishEdgeDrag();e.preventDefault();return;}
   if(markerDrag){finishMarkerDrag(false);e.preventDefault();return;}
   if(!contextMenu.hidden)clearContext();
   if(placing)cancel();
  }
  if((e.key==='Delete'||e.key==='Backspace')&&e.target?.closest?.('[data-hw-kind="pixel"]')&&removeSelectedPixel()){
   e.preventDefault();return;
  }
  // Fine positioning: Arrow = 1 mm, Shift+Arrow = 5 mm.
  // Keep all form fields and text editing completely unaffected.
  const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
  if(!delta||!isBuild()||!canEdit()||placing||markerDrag||!selectedHardware||e.altKey||e.ctrlKey||e.metaKey||
    e.target?.closest?.('input,select,textarea,[contenteditable="true"],[data-edge-wire]'))return;
  const kind=selectedHardware.kind,id=selectedHardware.id;
  if(kind!=='pixel'&&kind!=='mount')return;
  const cfg=getSettings(),key=kind==='pixel'?'manualPixelHoles':'manualMountHoles',mode=kind+'Placement';
  if(cfg[mode]!=='manual'){
   const plan=getPlan(),items=kind==='pixel'?plan.sockets:plan.mounts;
   cfg[key]=items.map((p,i)=>({id:p.id||kind+'-'+i,x:p.x,z:p.z,
    ...(kind==='pixel'?{profileId:p.profileId,wireAngle:p.wireAngle??0}:{})}));
   cfg[mode]='manual';
  }
  const i=cfg[key]?.findIndex(p=>String(p.id)===id);
  if(i<0)return;
  e.preventDefault();
  const step=e.shiftKey?5:1,old=cfg[key][i],point={...old,
   x:Math.round((old.x+delta[0]*step)*10)/10,z:Math.round((old.z+delta[1]*step)*10)/10};
  if(kind==='pixel'&&cfg.constrainPixelMotion){const result=solvePixelMove(getCrystals(),cfg,{pixelId:id,point});if(result.valid){applyWireDraft(result.settings);onEdit();requestMovementGuide({pixelId:id});}else onStatus('Hardware nudge blocked by cable length or clearance.');return;}
  if(!placementValid(kind,point,i)){
   onStatus('Hardware nudge blocked: the hole would collide or leave the base.');
   return;
  }
  old.x=point.x;old.z=point.z;onEdit();
  onStatus('Moved '+hardwareName(kind,i)+' by '+step+' mm; rerouted pixel string.');
 },true);
 document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{
  if(b.dataset.tab!=='build'){if(placing)cancel();if(markerDrag)finishMarkerDrag(false);}
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
  worldPosition:lastCursor?.pos??null,orbitEnabled:orbit.enabled,
  routeGuidesVisible:guides.visible,manufacturingVisible:!!getManufacturingVisible()});

 return {refresh,cancel,getSelectedPixel,updatePixel,removeSelectedPixel};
}


