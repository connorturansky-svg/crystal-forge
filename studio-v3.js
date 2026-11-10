import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {TransformControls} from 'three/addons/controls/TransformControls.js';
import {generateFormation,crystalGeometry,baseGeometry,exportSTL} from './geometry-v3.js';
import {loadManifold,prepareFabrication,saveSTL,save3MF,makeCalibrationStrip,splitPreparedMesh} from './fabrication-v1.js';

const $=id=>document.getElementById(id);
const defaults={
  title:'Untitled cluster',count:16,height:155,width:130,seed:42,pattern:'Central Spire',
  familyMix:'Quartz',bottomScale:1,topScale:.80,cornerRadius:.7,shoulderRound:0,
  tipFlat:.25,tipLength:.27,roundSteps:3,
  baseType:'integrated',baseHeight:8,undersideAccess:false,wallThickness:1.2,
  showPixels:false,pixelCount:12,pixelDiameter:12,pixelFit:.15,cutSockets:true,hollowCrystals:true,splitParts:false,splitX:0,mount:'None',
  printer:'Ultimaker 3 Extended',overhang:45,preserveLocked:true,snap:true,
  colour:0x8bbcff,mode:'simple'
};
let s={...defaults},crystals=[],selectedId=null,activeTool='select',cameraTween=null;
try{
  const saved=JSON.parse(localStorage.getItem('crystal-forge-v3')||'null');
  if(saved?.settings){s={...defaults,...saved.settings};crystals=safeArray(saved.crystals);selectedId=saved.selectedId||null}
}catch(e){console.warn('Project recovery unavailable',e)}
function safeArray(a){return Array.isArray(a)?a.filter(x=>x&&typeof x.id==='string').slice(0,300):[]}
if(!crystals.length)crystals=generateFormation(s);
const history=[];let historyIndex=-1;
const clone=x=>JSON.parse(JSON.stringify(x));
function snapshot(){
 const str=JSON.stringify({settings:s,crystals,selectedId});
 if(history[historyIndex]===str)return;
 history.splice(historyIndex+1);history.push(str);
 if(history.length>40)history.shift();
 historyIndex=history.length-1;persist();
}
function persist(){
 try{localStorage.setItem('crystal-forge-v3',JSON.stringify({settings:s,crystals,selectedId}))}catch(e){console.warn(e)}
}
function restore(str){
 try{const v=JSON.parse(str);s={...defaults,...v.settings};crystals=safeArray(v.crystals);selectedId=v.selectedId||null;syncForm();rebuild();persist()}catch(e){console.error(e)}
}
function undo(delta){const next=historyIndex+delta;if(next<0||next>=history.length)return;historyIndex=next;restore(history[next])}
function format(k,v){
 if(['height','width','cornerRadius','shoulderRound','tipFlat','baseHeight','wallThickness','pixelDiameter','pixelFit'].includes(k))return Number(v).toFixed(k==='pixelFit'?2:1)+' mm';
 if(['bottomScale','topScale','tipLength'].includes(k))return Math.round(v*100)+'%';
 if(k==='splitX')return v+' mm';if(k==='overhang')return v+'°';return String(v);
}
function syncForm(){
 document.body.classList.toggle('advanced',s.mode==='advanced');
 document.body.classList.toggle('simple',s.mode!=='advanced');
 $('simpleBtn').classList.toggle('active',s.mode==='simple');
 $('advancedBtn').classList.toggle('active',s.mode==='advanced');
 for(const e of document.querySelectorAll('[data-state]')){
  const k=e.dataset.state;
  if(e.type==='checkbox')e.checked=!!s[k];
  else e.value=s[k]??'';
 }
 for(const e of document.querySelectorAll('[data-out]'))e.textContent=format(e.dataset.out,s[e.dataset.out]);
 $('actualHole').textContent=(Number(s.pixelDiameter)+Number(s.pixelFit)).toFixed(2)+' mm';
 $('projectName').textContent=s.title;
 document.querySelectorAll('#colours button').forEach(b=>b.classList.toggle('active',Number(b.dataset.colour)===s.colour));
}
function saveProject(){
 const text=JSON.stringify({version:3,settings:s,crystals},null,2);
 download(new Blob([text],{type:'application/json'}),'crystal-forge-project.json');
}
function download(blob,name){
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function setStatus(t){$('status').textContent=t}

let manufacturingMesh=null,manufacturingReport=null,preparedSource=null;
const relevantManufacturingKeys=[
 'count','height','width','seed','pattern','familyMix','bottomScale','topScale',
 'cornerRadius','shoulderRound','tipFlat','tipLength','roundSteps',
 'baseType','baseHeight','undersideAccess','wallThickness','pixelCount','pixelDiameter',
 'pixelFit','cutSockets','hollowCrystals','overhang','splitX'
];
function sourceHash(){
 return JSON.stringify({settings:Object.fromEntries(relevantManufacturingKeys.map(k=>[k,s[k]])),
 crystals:crystals.map(c=>({id:c.id,x:c.x,y:c.y,z:c.z,h:c.h,r:c.r,rx:c.rx,rz:c.rz,
 rotation:c.rotation,sx:c.sx,sy:c.sy,sz:c.sz,hidden:c.hidden,leanX:c.leanX,leanZ:c.leanZ}))});
}
function disposeManufacturing(){
 if(manufacturingMesh){
  scene.remove(manufacturingMesh);
  manufacturingMesh.geometry.dispose();
  manufacturingMesh.material.dispose();
  manufacturingMesh=null;
 }
 manufacturingReport=null;preparedSource=null;
 if($('showManufacturing'))$('showManufacturing').checked=false;
 if($('prepareStatus'))$('prepareStatus').textContent='Not prepared. Click Prepare print mesh after changing your design.';
 if($('prepareReport'))$('prepareReport').hidden=true;
 for(const id of ['stlBtn','threeMfBtn','splitExportBtn'])if($(id))$(id).disabled=true;
 for(const mesh of crystalMeshes||[])mesh.visible=!crystals.find(c=>c.id===mesh.userData.crystalId)?.hidden;
 if(baseMesh)baseMesh.visible=s.baseType!=='none';
 if(pixelGroup)pixelGroup.visible=true;
}
function manufacturingView(enabled){
 if(!manufacturingMesh)enabled=false;
 if(manufacturingMesh)manufacturingMesh.visible=enabled;
 for(const m of crystalMeshes)m.visible=!enabled&&!crystals.find(c=>c.id===m.userData.crystalId)?.hidden;
 if(baseMesh)baseMesh.visible=!enabled&&s.baseType!=='none';
 pixelGroup.visible=!enabled;
 if(enabled)gizmo.detach();
 else selectCrystal(selectedId,false);
}
function renderManufactureReport(report){
 const f=(id,value)=>{$(id).textContent=String(value)};
 f('reportIntegrity',report.status);
 f('reportPieces',report.disconnected);
 f('reportTriangles',report.triangleCount.toLocaleString());
 f('reportMass',report.materialPLAgrams.toFixed(1)+' g');
 f('reportSockets',report.socketsCut);
 f('reportHollow',report.hollowed);
 f('reportOverhang',report.quality.unsafeTriangles.toLocaleString());
 f('reportOrientation',report.quality.unsafeTriangles>0?'Base-down; inspect in Cura':'Base-down (favourable)');
 const list=report.warnings;
 $('reportWarnings').innerHTML=list.length?'<div class="alert">'+list.map(x=>'<p>'+escapeHTML(x)+'</p>').join('')+'</div>':
  '<div class="success">No flagged conditions in this limited screening. Confirm in your slicer.</div>';
 $('prepareReport').hidden=false;
}
function generate(preserve=true){
 const kept=preserve&&s.preserveLocked?crystals.filter(c=>c.locked):[];
 const next=generateFormation({...s,count:Math.max(0,s.count-kept.length)});
 // Moving unlocked crystals should never silently move locked crystals.
 crystals=[...kept,...next.filter(x=>!kept.some(c=>c.id===x.id))];
 selectedId=crystals.some(c=>c.id===selectedId)?selectedId:null;
 rebuild();snapshot();
}
const scene=new THREE.Scene();scene.background=new THREE.Color(0x0e192b);
const camera=new THREE.PerspectiveCamera(46,1,.1,5000);camera.position.set(240,190,260);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
$('viewport').appendChild(renderer.domElement);
const orbit=new OrbitControls(camera,renderer.domElement);
orbit.enableDamping=true;orbit.dampingFactor=.08;orbit.minDistance=20;orbit.maxDistance=1500;
orbit.target.set(0,60,0);
scene.add(new THREE.HemisphereLight(0xd9ebff,0x222b3d,2.2));
const sun=new THREE.DirectionalLight(0xffffff,3.1);sun.position.set(110,250,135);scene.add(sun);
const fill=new THREE.DirectionalLight(0x99b7ff,1.0);fill.position.set(-120,80,-60);scene.add(fill);
const grid=new THREE.GridHelper(500,25,0x345378,0x263950);grid.position.y=-.12;scene.add(grid);
const axes=new THREE.AxesHelper(38);axes.position.set(-175,.4,-175);scene.add(axes);
const gizmo=new TransformControls(camera,renderer.domElement);
scene.add(gizmo.getHelper?.()||gizmo);
gizmo.setSize(.85);
gizmo.setTranslationSnap(s.snap?5:null);
gizmo.setRotationSnap(s.snap?THREE.MathUtils.degToRad(15):null);
gizmo.setScaleSnap(s.snap?.1:null);
gizmo.addEventListener('dragging-changed',e=>{orbit.enabled=!e.value;if(!e.value){applyGizmo();rebuildBase();snapshot();renderTree();renderSelection()}});
gizmo.addEventListener('objectChange',()=>{applyGizmo(false);renderSelection(true)});
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
let crystalMeshes=[],baseMesh=null,pixelGroup=new THREE.Group(),selectedMesh=null;
scene.add(pixelGroup);
const crystalMat=()=>new THREE.MeshStandardMaterial({color:s.colour,metalness:0,roughness:.4,flatShading:true,side:THREE.DoubleSide});
const baseMat=()=>new THREE.MeshStandardMaterial({color:s.colour,metalness:0,roughness:.56,flatShading:true,side:THREE.DoubleSide});
function disposeMesh(m){if(!m)return;m.geometry?.dispose();m.material?.dispose();scene.remove(m)}
function makeCrystal(c){
 const mesh=new THREE.Mesh(crystalGeometry(THREE,c,s),crystalMat());
 mesh.position.set(c.x,c.y+(s.baseType==='none'?0:s.baseHeight-2.5),c.z);
 mesh.rotation.set(c.rx||0,c.rotation||0,c.rz||0,'XYZ');
 mesh.scale.set(c.sx||c.scale||1,c.sy||c.scale||1,c.sz||c.scale||1);
 mesh.userData.crystalId=c.id;mesh.visible=!c.hidden;
 scene.add(mesh);return mesh;
}
function rebuild(){
 disposeManufacturing();
 gizmo.detach();crystalMeshes.forEach(disposeMesh);crystalMeshes=[];
 for(const c of crystals)crystalMeshes.push(makeCrystal(c));
 rebuildBase();updateLEDs();selectCrystal(selectedId,false);syncForm();renderTree();renderInfo();
 setStatus('Ready · click a crystal to select · G / R / S · drag to orbit');
}
function rebuildBase(){
 disposeManufacturing();
 disposeMesh(baseMesh);baseMesh=null;
 if(s.baseType==='none')return;
 const geo=baseGeometry(THREE,crystals,s);
 baseMesh=new THREE.Mesh(geo,baseMat());
 baseMesh.userData.isBase=true;
 scene.add(baseMesh);
 updateAppearance();
}
function updateLEDs(){
 while(pixelGroup.children.length){const child=pixelGroup.children[0];pixelGroup.remove(child);child.geometry?.dispose();child.material?.dispose()}
 if(!s.showPixels||!s.pixelCount)return;
 const visible=crystals.filter(c=>!c.hidden);if(!visible.length)return;
 for(let i=0;i<s.pixelCount;i++){
  const c=visible[i%visible.length],mesh=new THREE.Mesh(new THREE.SphereGeometry(2.7,10,8),new THREE.MeshBasicMaterial({color:i%3===0?0xffe79c:i%3===1?0xa6eaff:0xff88e6,transparent:true,opacity:.85}));
  mesh.position.set(c.x+c.leanX*c.h*.2,c.y+(s.baseType==='none'?0:s.baseHeight)+c.h*.2,c.z+c.leanZ*c.h*.2);
  pixelGroup.add(mesh);
 }
}
function selectCrystal(id,commit=true){
 const c=crystals.find(c=>c.id===id);selectedId=c?c.id:null;
 selectedMesh=crystalMeshes.find(m=>m.userData.crystalId===selectedId)||null;
 if(selectedMesh&&activeTool!=='select'&&!c.locked&&!manufacturingMesh?.visible)gizmo.attach(selectedMesh);
 else gizmo.detach();
 for(const m of crystalMeshes)m.material.emissive.setHex(m===selectedMesh?0x21415e:0x000000);
 renderTree();renderSelection();if(commit)persist();
}
function setTool(tool){
 activeTool=tool;
 document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===tool));
 const c=crystals.find(x=>x.id===selectedId);if(selectedMesh&&tool!=='select'&&!c?.locked&&!manufacturingMesh?.visible){gizmo.attach(selectedMesh);gizmo.setMode(tool)}else gizmo.detach();
}
function applyGizmo(persistChanges=true){
 if(!selectedMesh)return;
 const c=crystals.find(c=>c.id===selectedMesh.userData.crystalId);if(!c)return;
 c.x=+selectedMesh.position.x.toFixed(3);
 c.y=+(selectedMesh.position.y-(s.baseType==='none'?0:s.baseHeight-2.5)).toFixed(3);
 c.z=+selectedMesh.position.z.toFixed(3);
 c.rotation=+selectedMesh.rotation.y.toFixed(5);
 c.rx=+selectedMesh.rotation.x.toFixed(5);c.rz=+selectedMesh.rotation.z.toFixed(5);
 c.sx=+selectedMesh.scale.x.toFixed(3);c.sy=+selectedMesh.scale.y.toFixed(3);c.sz=+selectedMesh.scale.z.toFixed(3);
 if(persistChanges)persist();
}
function renderSelection(duringDrag=false){
 const c=crystals.find(x=>x.id===selectedId),pane=$('selectionPane');
 if(!c){pane.innerHTML='<p class="note">Click a crystal or use the object tree to select it. XYZ transform handles appear when you choose Move, Rotate or Scale.</p>';return}
 if(duringDrag){const e=$('transformReadout');if(e)e.textContent='X '+c.x.toFixed(1)+' · Y '+c.y.toFixed(1)+' · Z '+c.z.toFixed(1);return}
 pane.innerHTML='<div class="selectedname">⬡ '+escapeHTML(c.name)+'</div>'+(c.locked?'<div class="alert">This crystal is locked. Unlock it to edit its position, shape or size.</div>':'')+
 '<div class="note" id="transformReadout">X '+c.x.toFixed(1)+' · Y '+c.y.toFixed(1)+' · Z '+c.z.toFixed(1)+'</div>'+
 '<div class="grid2">'+
 num('X',c.x,'x')+num('Y',c.y,'y')+num('Z',c.z,'z')+num('Height',c.h,'h')+num('Radius',c.r,'r')+num('Angle Y',THREE.MathUtils.radToDeg(c.rotation),'angle')+'</div>'+
 '<div class="divider"></div><div class="buttonrow"><button id="focusSelected">Focus</button><button id="lockSelected">'+(c.locked?'Unlock':'Lock')+'</button><button id="hideSelected">'+(c.hidden?'Show':'Hide')+'</button></div>';
 function num(label,val,key){return '<div class="control"><label>'+label+'</label><input type="number" step=".5" data-crystal="'+key+'" value="'+Number(val).toFixed(1)+'" '+(c.locked?'disabled':'')+'></div>'}
 pane.querySelectorAll('[data-crystal]').forEach(input=>{
  input.addEventListener('change',()=>{const value=Number(input.value);if(!Number.isFinite(value))return;
   const k=input.dataset.crystal;if(k==='angle')c.rotation=THREE.MathUtils.degToRad(value);
   else c[k]=k==='h'||k==='r'?Math.max(1,value):value;
   rebuild();snapshot();
  })
 });
 $('focusSelected').onclick=()=>focus(selectedMesh);
 $('lockSelected').onclick=()=>{c.locked=!c.locked;selectCrystal(c.id);snapshot()};
 $('hideSelected').onclick=()=>{c.hidden=!c.hidden;rebuild();snapshot()};
}
function escapeHTML(str){return String(str).replace(/[&<>"]/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x]))}
function renderTree(){
 $('treeCount').textContent=crystals.length+' crystals';
 const root='<div class="treeentry base" data-base>▰ '+(s.baseType==='none'?'No integrated base':'Integrated root')+'</div>';
 $('objectTree').innerHTML='<div class="treeentry" style="font-weight:700">◇ Formation '+crystals.length+'</div>'+
 crystals.map(c=>'<div class="treeentry child '+(c.id===selectedId?'selected ':'')+(c.locked?'locked':'')+'" data-id="'+escapeHTML(c.id)+'"><span>⬡</span><span>'+escapeHTML(c.name)+'</span><span class="treeactions">'+(c.locked?'🔒 ':'')+(c.hidden?'◌':'')+'</span></div>').join('')+root+
 '<div class="treeentry base">✳ LEDs ('+s.pixelCount+' planned)</div>';
 $('objectTree').querySelectorAll('[data-id]').forEach(e=>e.onclick=()=>selectCrystal(e.dataset.id));
}
function renderInfo(){
 const meshes=[...crystalMeshes,...(baseMesh?[baseMesh]:[])];
 let total=0,box=new THREE.Box3();
 for(const m of meshes){if(!m.visible)continue;total+=m.geometry.attributes.position.count/3;m.updateMatrixWorld(true);box.expandByObject(m)}
 const dims=box.isEmpty()?new THREE.Vector3():box.getSize(new THREE.Vector3());
 $('triangleCount').textContent=Math.round(total).toLocaleString();
 $('footprint').textContent=Math.ceil(dims.x)+' × '+Math.ceil(dims.z)+' mm';
 $('modelHeight').textContent=Math.ceil(dims.y)+' mm';
 $('pixelStats').textContent=s.pixelCount;
 $('footerStats').textContent=crystals.length+' crystals · '+Math.round(total).toLocaleString()+' triangles';
}
function updateAppearance(){
 const look=document.querySelector('[data-look].active')?.dataset.look||'solid';
 for(const m of [...crystalMeshes,...(baseMesh?[baseMesh]:[])]){
  m.material.wireframe=look==='wire';
  m.material.transparent=look==='xray';
  m.material.opacity=look==='xray'?.38:1;
  m.material.depthWrite=look!=='xray';
 }
}
function focus(obj){
 if(!obj)return;
 obj.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(obj),center=box.getCenter(new THREE.Vector3());
 const size=box.getSize(new THREE.Vector3()).length();
 const dir=new THREE.Vector3().subVectors(camera.position,orbit.target).normalize();
 tweenCamera(center.clone().addScaledVector(dir,Math.max(45,size*1.9)),center);
}
function tweenCamera(to,target){
 cameraTween={from:camera.position.clone(),to,origin:orbit.target.clone(),target,start:performance.now()};
}
function snapView(key){
 const box=new THREE.Box3();for(const m of [...crystalMeshes,...(baseMesh?[baseMesh]:[])])if(m.visible)box.expandByObject(m);
 const target=box.isEmpty()?new THREE.Vector3(0,45,0):box.getCenter(new THREE.Vector3());
 const dist=Math.max(125,box.getSize(new THREE.Vector3()).length()*1.65);
 const directions={iso:[1,.75,1],front:[0,.12,1],back:[0,.12,-1],left:[-1,.12,0],right:[1,.12,0],top:[0,1,.0001]};
 tweenCamera(target.clone().add(new THREE.Vector3(...(directions[key]||directions.iso)).normalize().multiplyScalar(dist)),target);
}
let lastClickPoint={x:0,y:0};
renderer.domElement.addEventListener('pointerdown',e=>{lastClickPoint={x:e.clientX,y:e.clientY}});
renderer.domElement.addEventListener('pointerup',e=>{
 if(gizmo.dragging||Math.hypot(e.clientX-lastClickPoint.x,e.clientY-lastClickPoint.y)>5)return;
 const box=renderer.domElement.getBoundingClientRect();
 pointer.set(((e.clientX-box.left)/box.width)*2-1,-((e.clientY-box.top)/box.height)*2+1);
 raycaster.setFromCamera(pointer,camera);
 const hits=raycaster.intersectObjects(crystalMeshes.filter(m=>m.visible),true);
 if(hits.length){let o=hits[0].object;while(o&&!o.userData.crystalId)o=o.parent;
  if(o)selectCrystal(o.userData.crystalId)
 }else selectCrystal(null);
});
function animate(now){
 requestAnimationFrame(animate);
 if(cameraTween){
  const t=Math.min(1,(now-cameraTween.start)/300),e=t*t*(3-2*t);
  camera.position.lerpVectors(cameraTween.from,cameraTween.to,e);
  orbit.target.lerpVectors(cameraTween.origin,cameraTween.target,e);
  if(t===1)cameraTween=null;
 }
 orbit.update();renderer.render(scene,camera);
}
function resize(){
 const box=$('viewport');renderer.setSize(Math.max(1,box.clientWidth),Math.max(1,box.clientHeight),false);
 camera.aspect=Math.max(.01,box.clientWidth/Math.max(1,box.clientHeight));camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe($('viewport'));resize();requestAnimationFrame(animate);
let rebuildTimer;
function schedule(full=true){
 clearTimeout(rebuildTimer);rebuildTimer=setTimeout(()=>{
  if(full)rebuild();else{updateLEDs();renderInfo()}
  snapshot();
 },85);
}
const regenKeys=new Set(['count','height','width','seed','pattern','familyMix']);
const previewKeys=new Set(['showPixels','mount','printer','preserveLocked','snap']);
document.querySelectorAll('[data-state]').forEach(e=>{
 e.addEventListener('input',()=>{
  const key=e.dataset.state,value=e.type==='checkbox'?e.checked:(e.type==='number'||e.type==='range')?Number(e.value):e.value;
  s[key]=value;
  if(!previewKeys.has(key))disposeManufacturing();
  for(const o of document.querySelectorAll('[data-out="'+key+'"]'))o.textContent=format(key,value);
  if(key==='pixelDiameter'||key==='pixelFit')$('actualHole').textContent=(+s.pixelDiameter+(+s.pixelFit)).toFixed(2)+' mm';
  if(key==='snap'){gizmo.setTranslationSnap(value?5:null);gizmo.setRotationSnap(value?THREE.MathUtils.degToRad(15):null);gizmo.setScaleSnap(value?.1:null)}
  if(regenKeys.has(key))generate();
  else if(previewKeys.has(key)){updateLEDs();renderInfo();persist()}
  else schedule();
 });
 e.addEventListener('change',snapshot);
});
$('simpleBtn').onclick=()=>{s.mode='simple';syncForm();snapshot()};
$('advancedBtn').onclick=()=>{s.mode='advanced';syncForm();snapshot()};
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',b===x));
 for(const e of document.querySelectorAll('[data-workspace]'))e.classList.toggle('active',e.dataset.workspace===b.dataset.tab);
 const titles={design:['Design workspace','Shape and composition'],build:['Build workspace','Lighting and assembly'],print:['Print workspace','Check and export']};
 $('leftHeading').textContent=titles[b.dataset.tab][0];$('leftCaption').textContent=titles[b.dataset.tab][1];
});
$('randomBtn').onclick=()=>{s.seed=Math.floor(Math.random()*999999)+1;syncForm();generate()};
$('regenBtn').onclick=()=>generate();
$('duplicateBtn').onclick=()=>{
 const c=crystals.find(x=>x.id===selectedId);if(!c)return;
 const newC={...clone(c),id:'cr-copy-'+Date.now(),name:c.name+' copy',x:c.x+8,z:c.z+8,locked:false};
 crystals.push(newC);selectedId=newC.id;rebuild();snapshot();
};
$('deleteBtn').onclick=()=>{if(!selectedId)return;crystals=crystals.filter(c=>c.id!==selectedId);selectedId=null;rebuild();snapshot()};
$('lockBtn').onclick=()=>{const c=crystals.find(x=>x.id===selectedId);if(!c)return;c.locked=!c.locked;selectCrystal(c.id);snapshot()};
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>snapView(b.dataset.view));
document.querySelectorAll('[data-look]').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('[data-look]').forEach(x=>x.classList.toggle('active',x===b));updateAppearance();
});
$('gridBtn').onclick=()=>{grid.visible=!grid.visible;axes.visible=grid.visible};
$('colours').querySelectorAll('button').forEach(b=>b.onclick=()=>{s.colour=Number(b.dataset.colour);syncForm();rebuild();snapshot()});
// Persistent appearance setting. Separate from saved geometry projects.
let activeTheme='dark';
try{activeTheme=localStorage.getItem('crystal-forge-theme')==='light'?'light':'dark'}catch(e){}
function applyTheme(theme,save=true){
 activeTheme=theme==='light'?'light':'dark';
 document.body.classList.toggle('theme-light',activeTheme==='light');
 document.body.classList.toggle('theme-dark',activeTheme==='dark');
 $('themeBtn').textContent=activeTheme==='light'?'☾ Dark':'☀ Light';
 $('themeBtn').title=activeTheme==='light'?'Switch to dark theme':'Switch to light theme';
 $('themeBtn').setAttribute('aria-label',$('themeBtn').title);
 scene.background.set(activeTheme==='light'?0xe9f0f9:0x0e192b);
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.content=activeTheme==='light'?'#f0f5fc':'#111827';
 // Keep grid useful over both viewport backgrounds.
 const mats=Array.isArray(grid.material)?grid.material:[grid.material];
 for(const m of mats)if(m){m.opacity=activeTheme==='light'?.38:1;m.transparent=activeTheme==='light'}
 if(save){try{localStorage.setItem('crystal-forge-theme',activeTheme)}catch(e){}}
}
$('themeBtn').onclick=()=>applyTheme(activeTheme==='light'?'dark':'light');
applyTheme(activeTheme,false);

// Keyboard-accessible Help and Changelog, available from any workspace.
let returnFocus=null;
function showInfo(tab='help'){
 returnFocus=document.activeElement;
 $('infoOverlay').hidden=false;
 showInfoTab(tab);
 $('closeInfo').focus();
}
function showInfoTab(tab){
 const which=tab==='changelog'?'changelog':'help';
 $('infoTitle').textContent=which==='help'?'Crystal Forge — Help':'Crystal Forge — What’s new';
 document.querySelectorAll('[data-info]').forEach(button=>{
  const on=button.dataset.info===which;
  button.classList.toggle('active',on);
  button.setAttribute('aria-selected',on?'true':'false');
 });
 document.querySelectorAll('[data-info-pane]').forEach(panel=>panel.hidden=panel.dataset.infoPane!==which);
 const active=$('infoOverlay').querySelector('[data-info-pane="'+which+'"]');
 if(active)active.scrollTop=0;
}
function closeInfo(){
 if($('infoOverlay').hidden)return;
 $('infoOverlay').hidden=true;
 if(returnFocus&&typeof returnFocus.focus==='function')returnFocus.focus();
}
$('helpBtn').onclick=()=>showInfo('help');
$('changelogBtn').onclick=()=>showInfo('changelog');
$('closeInfo').onclick=closeInfo;
document.querySelectorAll('[data-info]').forEach(button=>button.onclick=()=>showInfoTab(button.dataset.info));
$('infoOverlay').addEventListener('pointerdown',e=>{if(e.target===$('infoOverlay'))closeInfo()});
document.addEventListener('keydown',e=>{
 if(!$('infoOverlay').hidden){
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeInfo()}
  return;
 }
 if(e.key==='?'&&!(e.target instanceof HTMLInputElement)){e.preventDefault();showInfo('help')}
});

$('saveBtn').onclick=saveProject;$('projectExportBtn').onclick=saveProject;
$('loadBtn').onclick=()=>$('loadFile').click();
$('loadFile').onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  const json=JSON.parse(await file.text());
  if(!json.settings||!Array.isArray(json.crystals))throw Error('Invalid project structure');
  s={...defaults,...json.settings};crystals=safeArray(json.crystals);selectedId=null;
  syncForm();rebuild();snapshot();setStatus('Project loaded: '+file.name);
 }catch(err){alert('Could not load project: '+err.message)}
 e.target.value='';
};
async function buildManufacturing(){
 const btn=$('prepareBtn');
 if(btn.disabled)return;
 btn.disabled=true;btn.textContent='◌ Preparing…';
 $('prepareStatus').textContent='Loading geometry engine and preparing a Boolean solid…';
 setStatus('Preparing print geometry…');
 // Yield so status is visible before expensive synchronous WASM operations.
 await new Promise(resolve=>setTimeout(resolve,40));
 try{
  const wasm=await loadManifold();
  const source=sourceHash();
  $('prepareStatus').textContent='Boolean union, hollow cuts and pixel sockets…';
  await new Promise(resolve=>setTimeout(resolve,30));
  const {geometry,report}=prepareFabrication({
   wasm,
   meshes:[...crystalMeshes.filter(m=>m.visible||m.userData.crystalId),...(baseMesh?[baseMesh]:[])].filter(m=>{
     if(m.userData.crystalId)return !crystals.find(c=>c.id===m.userData.crystalId)?.hidden;
     return true;
   }),
   crystals,settings:s
  });
  // If the user modified the design during processing, discard stale geometry.
  if(source!==sourceHash()){geometry.dispose();throw new Error('Design changed during preparation. Please prepare again.')}
  disposeManufacturing();
  manufacturingReport=report;preparedSource=source;
  manufacturingMesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({
   color:s.colour,metalness:0,roughness:.42,flatShading:true,side:THREE.DoubleSide
  }));
  manufacturingMesh.visible=false;
  scene.add(manufacturingMesh);
  renderManufactureReport(report);
  $('prepareStatus').textContent='✓ Combined manufacturing mesh prepared. Review the warnings below and verify in Cura.';
  $('stlBtn').disabled=false;$('threeMfBtn').disabled=false;
  $('splitExportBtn').disabled=!s.splitParts;
  $('showManufacturing').checked=true;manufacturingView(true);
  setStatus('Prepared '+report.triangleCount.toLocaleString()+' triangles · '+report.disconnected+' body/bodies');
 }catch(err){
  console.error('Print preparation failed',err);
  $('prepareStatus').textContent='Preparation failed: '+err.message;
  setStatus('Manufacturing failed · '+err.message);
 }finally{btn.disabled=false;btn.textContent='▣ Prepare print mesh (Boolean union)'}
}
function verifyPrepared(){
 if(!manufacturingMesh||!manufacturingReport||preparedSource!==sourceHash()){
  alert('Please run Prepare print mesh first. Your existing manufacturing mesh is missing or out of date.');return false;
 }
 return true;
}
$('prepareBtn').onclick=buildManufacturing;
$('showManufacturing').onchange=e=>manufacturingView(e.target.checked);
$('stlBtn').onclick=()=>{
 if(!verifyPrepared())return;
 saveSTL(manufacturingMesh.geometry,'crystal-forge-manifold.stl');
 setStatus('Downloaded joined STL · still verify supports and wall thickness in Cura');
};
$('threeMfBtn').onclick=()=>{
 if(!verifyPrepared())return;
 save3MF(manufacturingMesh.geometry,'crystal-forge-manifold.3mf');
 setStatus('Downloaded 3MF · inspect model and slicer results');
};
$('calibrationBtn').onclick=async()=>{
 const button=$('calibrationBtn');button.disabled=true;button.textContent='Generating calibration strip…';
 await new Promise(resolve=>setTimeout(resolve,20));
 try{
  const wasm=await loadManifold(),data=makeCalibrationStrip(wasm);
  saveSTL(data.geometry,'12mm-pixel-fit-calibration-11_8-to-12_2.stl');
  data.geometry.dispose();
  setStatus('Calibration strip downloaded · five holes 11.8–12.2 mm, left to right');
 }catch(err){console.error(err);alert('Calibration strip failed: '+err.message)}
 finally{button.disabled=false;button.textContent='⌖ Generate 12 mm pixel-fit test strip (STL)'}
};
$('splitExportBtn').onclick=async()=>{
 if(!verifyPrepared()||!s.splitParts)return;
 const button=$('splitExportBtn');button.disabled=true;
 try{
  const wasm=await loadManifold();
  const halves=splitPreparedMesh(wasm,manufacturingReport.mesh,s.splitX);
  for(let i=0;i<halves.length;i++){
   if(!halves[i])continue;
   saveSTL(halves[i].geometry,'crystal-forge-split-'+(i+1)+'.stl');
   halves[i].geometry.dispose();
  }
  setStatus('Split halves exported · connectors and alignment keys not yet included');
 }catch(err){console.error(err);alert('Split failed: '+err.message)}
 finally{button.disabled=false}
};
$('bomBtn').onclick=()=>{
 const rows=[['Type','Quantity','Notes'],['12V gumdrop pixels',s.pixelCount,'12 mm nominal mounting hole; adjust by '+s.pixelFit+' mm'],['Crystal bodies',crystals.length,'experimental STL; not Boolean merged'],['Integrated base',s.baseType==='none'?0:1,'mounting holes not generated'],['Planned socket diameter',(+s.pixelDiameter+(+s.pixelFit)).toFixed(2)+' mm','preview only']];
 const csv=rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
 download(new Blob([csv],{type:'text/csv'}),'crystal-forge-bom.csv');
};
document.addEventListener('keydown',e=>{
 if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLSelectElement)return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undo(e.shiftKey?1:-1);return}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();undo(1);return}
 if(e.key==='Escape'){selectCrystal(null);setTool('select')}
 const shortcuts={v:'select',g:'translate',r:'rotate',s:'scale'};
 if(shortcuts[e.key.toLowerCase()])setTool(shortcuts[e.key.toLowerCase()]);
 if(e.key.toLowerCase()==='f'&&selectedMesh)focus(selectedMesh);
 if(e.key==='Delete'&&selectedId){crystals=crystals.filter(c=>c.id!==selectedId);selectedId=null;rebuild();snapshot()}
});
syncForm();rebuild();snapshot();snapView('iso');
