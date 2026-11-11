import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {TransformControls} from 'three/addons/controls/TransformControls.js';
import {generateFormation,crystalGeometry,crystalOrientation,baseGeometry,baseAccentSpecs,baseSurfaceHeight,crystalRootOffset,exportSTL} from './geometry-v3.js';
import {loadManifold,setThreeInstance,saveSTL,save3MF,makeCalibrationStrip,splitPreparedMesh} from './fabrication-v1.js';
setThreeInstance(THREE);
import {planHardware} from './hardware-layout.js';
import {createHardwareEditor} from './hardware-editor.js';
import {installTooltips,describeControl} from './tooltips.js';
import {PIXEL_PRESETS,allPixelProfiles,normalisePixelProfile,resolvePixelProfile} from './pixel-profiles.js';

const $=id=>document.getElementById(id);
const defaults={
  title:'Untitled cluster',count:16,height:155,width:130,crystalSize:1,widthRandomness:0,studioBrightness:.85,seed:42,pattern:'Central Spire',spacing:42,leanMode:'Organic / natural',leanAmount:35,angleRandomness:32,
  familyMix:'Quartz',bottomScale:1,topScale:.80,cornerRadius:.7,shoulderRound:0,tipRound:3.5,
  tipFlat:.25,tipLength:.27,roundSteps:3,
  baseType:'integrated',baseHeight:25,baseDome:0,baseEdgeRadius:0,baseProfile:'Plinth + dome',domeFalloff:1.8,sideWall:100,baseWidth:3,baseStyle:'Fitted',undersideAccess:false,baseVault:false,vaultSupportPitch:25,wallThickness:1.2,
  showPixels:false,pixelCount:1,pixelProfileId:'gumdrop',pixelProfiles:[],lightingMode:'single',glowPreview:false,glowColour:'0x77c4ff',pixelDiameter:12,pixelFit:.15,cutSockets:true,hollowCrystals:false,pixelPlacement:'auto',manualPixelHoles:[],mountPlacement:'auto',manualMountHoles:[],splitParts:false,splitX:0,mount:'None',mountHoleDiameter:4.5,mountHoleDepth:9,mountSpacing:40,tabCount:4,tabHolesPerTab:2,tabHoleDiameter:4.5,tabThickness:5,tabWall:3,
  printer:'Ultimaker 3 Extended',overhang:45,preserveLocked:true,snap:true,
  colour:0x8bbcff,mode:'simple',floatView:false,hardwareColourMode:false,evenLighting:true
};
let s={...defaults},crystals=[],selectedId=null,activeTool='select',cameraTween=null;
let hardwareUI=null;
try{
  const saved=JSON.parse(localStorage.getItem('crystal-forge-v3')||'null');
  if(saved?.settings){s={...defaults,...saved.settings};crystals=safeArray(saved.crystals);selectedId=saved.selectedId||null}
}catch(e){console.warn('Project recovery unavailable',e)}
function safeArray(a){return Array.isArray(a)?a.filter(x=>x&&typeof x.id==='string').slice(0,300):[]}
// The former 0–2 mm tip control produced sharp truncated points. Migrate
// existing tiny radii to a safer, broad-radius cap without losing projects.
try{
 if(localStorage.getItem('crystal-forge-tip-cap-version')!=='2'){
  if(Number(s.tipRound)<1.5)s.tipRound=3.5;
  for(const c of crystals)if(c.shape&&Number(c.shape.tipRound)<1.5)c.shape.tipRound=3.5;
  localStorage.setItem('crystal-forge-tip-cap-version','2');
 }
}catch(e){}
// Migrate older multi-pixel drafts to the new single-source default.
if(s.lightingMode==='single')s.pixelCount=1;
if(s.lightingMode==='none')s.pixelCount=0;
const pixelLibraryKey='crystal-forge-pixel-library';
function mergePixelLibrary(){
 try{
  const saved=JSON.parse(localStorage.getItem(pixelLibraryKey)||'[]');
  const map=new Map();
  for(const p of [...(Array.isArray(saved)?saved:[]),...(Array.isArray(s.pixelProfiles)?s.pixelProfiles:[])]){
   const value=normalisePixelProfile(p);
   if(value.id.startsWith('custom-'))map.set(value.id,value);
  }
  s.pixelProfiles=[...map.values()].slice(0,30);
 }catch(e){s.pixelProfiles=Array.isArray(s.pixelProfiles)?s.pixelProfiles:[]}
}
mergePixelLibrary();
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
 try{const v=JSON.parse(str);s={...defaults,...v.settings};mergePixelLibrary();crystals=safeArray(v.crystals);selectedId=v.selectedId||null;syncForm();rebuild();persist()}catch(e){console.error(e)}
}
function undo(delta){const next=historyIndex+delta;if(next<0||next>=history.length)return;historyIndex=next;restore(history[next])}
function format(k,v){
 if(['height','width','cornerRadius','shoulderRound','tipFlat','tipRound','baseHeight','baseDome','baseEdgeRadius','baseWidth','wallThickness','pixelDiameter','pixelFit'].includes(k))return Number(v).toFixed(k==='pixelFit'?2:1)+' mm';
 if(k==='crystalSize'||k==='studioBrightness')return Math.round(Number(v)*100)+'%';
  if(['bottomScale','topScale'].includes(k)){const d=Math.round((Number(v)-1)*100);return (d>0?'+':'')+d+'%'}
  if(k==='tipLength')return Math.round(v*100)+'%';
 if(['mountHoleDiameter','mountHoleDepth','mountSpacing','tabHoleDiameter','tabThickness','tabWall'].includes(k))return Number(v).toFixed(1)+' mm';
 if(k==='sideWall')return v+'%';if(k==='domeFalloff')return Number(v).toFixed(1);if(k==='vaultSupportPitch')return v+' mm';if(k==='splitX')return v+' mm';if(['spacing','angleRandomness','leanAmount','widthRandomness'].includes(k))return v+'%';if(k==='overhang')return v+'°';return String(v);
}
const shapeKeys=new Set(['familyMix','bottomScale','topScale','cornerRadius','tipLength','tipFlat','tipRound','shoulderRound','roundSteps']);
function selectedCrystal(){return crystals.find(c=>c.id===selectedId)||null}
function shapeValue(c,k){
 if(!c)return s[k];
 if(k==='familyMix')return c.family;
 return c.shape?.[k]??s[k];
}
function syncShapeControls(){
 const c=selectedCrystal();
 $('shapeScopeTitle').textContent=c?'Shaping: '+c.name:'All crystal shapes';
 $('shapeScope').textContent=c?('INDIVIDUAL CRYSTAL · '+c.name+' · other crystals unchanged'):'GLOBAL SHAPE · Select any crystal to edit it independently';
 $('shapeScope').classList.toggle('shape-selected',!!c);
 $('clearCrystalSelection').hidden=!c;
 $('resetCrystalShape').hidden=!c;
 for(const e of document.querySelectorAll('[data-state]')){
  const k=e.dataset.state;if(!shapeKeys.has(k))continue;
  const v=shapeValue(c,k);
  if(e.type==='checkbox')e.checked=!!v;else e.value=v??'';
  e.disabled=!!c?.locked;
  for(const o of document.querySelectorAll('[data-out="'+k+'"]'))o.textContent=format(k,v);
 }
 const multi=s.lightingMode==='multi';
 $('multiplePixelsRow').classList.toggle('show',multi);
 for(const e of document.querySelectorAll('[data-state="pixelCount"]'))e.disabled=!multi;
}
function refreshPixelProfileOptions(){
 const select=$('pixelProfileSelect');if(!select)return;
 const profiles=allPixelProfiles(s);
 select.replaceChildren(...profiles.map(p=>{
  const option=document.createElement('option');option.value=p.id;option.textContent=p.name;return option;
 }));
 if(!profiles.some(p=>p.id===s.pixelProfileId))s.pixelProfileId='gumdrop';
 select.value=s.pixelProfileId;
 const p=resolvePixelProfile(s);
 $('pixelProfileDetails').textContent=p.kind+' · '+p.bodyDiameter+' mm diameter × '+p.bodyHeight+
  ' mm body · '+p.flangeDiameter+' mm flange · '+p.wireWidth+' mm wire relief. Verify actual LED dimensions.';
}
function syncForm(){
 refreshPixelProfileOptions();
 if(s.lightingMode==='single')s.pixelCount=1;
 if(s.lightingMode==='none')s.pixelCount=0;
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
 $('actualHole').textContent=resolvePixelProfile(s).boreDiameter.toFixed(2)+' mm';
 $('pixelBaseDepthHint').textContent=s.baseHeight>=resolvePixelProfile(s).bodyHeight+1?'Base accommodates selected nominal LED depth.':'Base is shallower than selected LED housing. Check fit.';
 $('projectName').textContent=s.title;
 syncShapeControls();
 $('edgeTabSettings').hidden=s.mount!=='Edge fixing tabs';
 $('floatBtn').classList.toggle('active',!!s.floatView);
 $('hardwareColoursBtn').classList.toggle('active',!!s.hardwareColourMode);
 refreshStudioLighting();
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
 'count','height','width','crystalSize','widthRandomness','seed','pattern','spacing','leanMode','leanAmount','angleRandomness','familyMix','bottomScale','topScale',
 'cornerRadius','shoulderRound','tipFlat','tipRound','tipLength','roundSteps',
 'baseType','baseHeight','baseDome','baseEdgeRadius','baseProfile','domeFalloff','sideWall','baseWidth','baseStyle','undersideAccess','baseVault','vaultSupportPitch','wallThickness','lightingMode','pixelCount','pixelDiameter',
 'pixelFit','pixelProfileId','pixelProfiles','cutSockets','hollowCrystals','pixelPlacement','manualPixelHoles','mountPlacement','manualMountHoles','overhang','printer','mount','mountHoleDiameter','mountHoleDepth','mountSpacing','tabCount','tabHolesPerTab','tabHoleDiameter','tabThickness','tabWall'
];
function sourceHash(){
 return JSON.stringify({settings:Object.fromEntries(relevantManufacturingKeys.map(k=>[k,s[k]])),
 crystals:crystals.map(c=>({id:c.id,shape:c.shape||{},family:c.family,x:c.x,y:c.y,z:c.z,h:c.h,r:c.r,rx:c.rx,rz:c.rz,
 rotation:c.rotation,sx:c.sx,sy:c.sy,sz:c.sz,hidden:c.hidden,leanX:c.leanX,leanZ:c.leanZ}))});
}
function clearHardwareAnnotations(){
 for(const m of [...hardwareAnnotations.children]){
  hardwareAnnotations.remove(m);
  m.geometry?.dispose();m.material?.dispose();
 }
}
function createHardwareAnnotations(){
 clearHardwareAnnotations();
 if(!manufacturingReport)return;
 const plan=manufacturingReport.hardware;
 if(!plan)return;
 const markers=[
  ...plan.sockets.map(p=>({...p,color:0xffdc25})),
  ...plan.mounts.map(p=>({...p,color:0xb57cff}))
 ];
 for(const p of markers){
  // A ring at the underside identifies each cut precisely without becoming
  // part of the exported mesh. The translucent tube also shows bore depth.
  const ring=new THREE.Mesh(new THREE.TorusGeometry(p.radius+.36,.47,8,40),
   new THREE.MeshBasicMaterial({color:p.color,depthTest:false,transparent:true,opacity:.97}));
  ring.rotation.x=-Math.PI/2;
  ring.position.set(p.x,-.32,p.z);ring.renderOrder=90;hardwareAnnotations.add(ring);
  const depth=p.kind==='LED'?Math.max(13,s.baseHeight+9):p.depth;
  const tube=new THREE.Mesh(new THREE.CylinderGeometry(p.radius,p.radius,depth,32,1,true),
   new THREE.MeshBasicMaterial({color:p.color,transparent:true,opacity:.22,depthWrite:false,
    depthTest:false,side:THREE.DoubleSide}));
  tube.position.set(p.x,depth/2-.25,p.z);tube.renderOrder=88;hardwareAnnotations.add(tube);
 }
 updateHardwareAnnotationVisibility();
}
function updateHardwareAnnotationVisibility(){
 hardwareAnnotations.visible=!!manufacturingMesh?.visible &&
   (!!s.hardwareColourMode || !!$('featureOverlay')?.checked);
 $('hardwareColoursBtn').classList.toggle('active',!!s.hardwareColourMode);
}
function setFloating(enabled){
 s.floatView=!!enabled;
 grid.visible=!s.floatView;
 axes.visible=!s.floatView;
 $('floatBtn').classList.toggle('active',s.floatView);
 if(s.floatView){
  // Orbit around the actual object centre, not the world origin/build plate.
  snapView('iso');
  setStatus('Floating inspect · drag to spin · right-drag to pan · BOT for underside');
 }else snapView('iso');
 persist();
}
function disposeManufacturing(){
 cancelActivePreparation('Preparation cancelled because model changed');
 clearHardwareAnnotations(); if(manufacturingMesh){
  scene.remove(manufacturingMesh);
  manufacturingMesh.geometry.dispose();
  manufacturingMesh.material.dispose();
  manufacturingMesh=null;
 }
 manufacturingReport=null;preparedSource=null;
 if($('showManufacturing'))$('showManufacturing').checked=false;
 if($('printHeatmap'))$('printHeatmap').checked=false;
 if($('prepareStatus'))$('prepareStatus').textContent='Not prepared. Click Prepare print mesh after changing your design.';
 if($('prepareReport'))$('prepareReport').hidden=true;
 for(const id of ['stlBtn','threeMfBtn','splitExportBtn'])if($(id))$(id).disabled=true;
 for(const mesh of crystalMeshes||[])mesh.visible=!crystals.find(c=>c.id===mesh.userData.crystalId)?.hidden;
 if(baseMesh)baseMesh.visible=s.baseType!=='none';
 for(const m of baseAccents)m.visible=s.baseType!=='none';
 if(pixelGroup)pixelGroup.visible=true;
}
function manufacturingView(enabled){
 if(!manufacturingMesh)enabled=false;
 if(manufacturingMesh)manufacturingMesh.visible=enabled;
 for(const m of crystalMeshes)m.visible=!enabled&&!crystals.find(c=>c.id===m.userData.crystalId)?.hidden;
 if(baseMesh)baseMesh.visible=!enabled&&s.baseType!=='none';
 for(const m of baseAccents)m.visible=!enabled&&s.baseType!=='none';
 pixelGroup.visible=!enabled;
 if(enabled)gizmo.detach();
 else selectCrystal(selectedId,false);
 updateHardwareAnnotationVisibility();
}
function applyPrintHeatmap(){
 if(!manufacturingMesh)return;
 const material=manufacturingMesh.material;
 const enable=!!$('printHeatmap').checked;
 if(enable){
  const geom=manufacturingMesh.geometry;
  const pos=geom.getAttribute('position').array;
  const colors=new Float32Array(pos.length),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  const cross=new THREE.Vector3(),edge=new THREE.Vector3(),other=new THREE.Vector3();
  let minY=Infinity;for(let i=1;i<pos.length;i+=3)minY=Math.min(minY,pos[i]);
  const safe=[.20,.74,.53],caution=[1.0,.69,.22],unsafe=[.97,.28,.32];
  const threshold=Number(s.overhang||45);
  for(let i=0;i<pos.length;i+=9){
   a.fromArray(pos,i);b.fromArray(pos,i+3);c.fromArray(pos,i+6);
   cross.crossVectors(edge.subVectors(b,a),other.subVectors(c,a)).normalize();
   const flatBed=[a,b,c].every(v=>Math.abs(v.y-minY)<.15);
   const slope=Math.asin(Math.min(1,Math.abs(cross.y)))*180/Math.PI;
   const colour=!flatBed&&cross.y<-.02&&slope>threshold?unsafe:
    !flatBed&&cross.y<-.02&&slope>threshold-12?caution:safe;
   for(let j=0;j<3;j++)colors.set(colour,i+j*3);
  }
  geom.setAttribute('color',new THREE.BufferAttribute(colors,3));
  material.color.setHex(0xffffff);
  material.vertexColors=true;
 }else{
  material.vertexColors=false;
  material.color.setHex(s.colour);
 }
 material.needsUpdate=true;
}
function renderManufactureReport(report){
 const f=(id,value)=>{$(id).textContent=String(value)};
 f('reportIntegrity',report.status);
 f('reportPieces',report.disconnected);
 f('reportCavities',report.internalCavities||0);
 f('reportPrinterFit',report.printerFits?'Yes':'Exceeds bed');
 f('reportTriangles',report.triangleCount.toLocaleString());
 f('reportMass',report.materialPLAgrams.toFixed(1)+' g');
 f('reportSockets',report.socketsCut);
 f('reportMounting',report.mountingHolesCut||0);
 f('reportTabs',report.edgeTabs||0);
 f('reportHollow',report.hollowed?'Yes':'No');
 f('reportVault',report.vault?.applied?'Enabled · '+report.vault.supportCount+' integral buttresses':'Off');
 f('reportVaultGap',report.vault?.applied?report.vault.gapEstimate+' mm (estimate)':'—');
 f('reportLEDVents',report.ventCuts||0);
 f('reportLightPath',report.vault?.applied?'LED side vents · inspect in Cura':report.lightPathScreened?'Screened clear':'Review needed');
 f('reportPorts',report.hollowPorts||0);
 f('reportBaseDepth',report.baseFitsPixel?'Fits nominal pixel':'Too shallow');
 f('reportOverhang',report.quality.unsafeTriangles.toLocaleString());
 f('reportOrientation',report.orientation?.name||'Base down');
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
// WebGL drawing-buffer pixels are DPR-scaled. CSS pixels MUST NOT be:
 // without explicit CSS sizing, a 2x-DPR display gives a canvas twice the
 // viewport size and its camera centre appears at the bottom-right.
renderer.domElement.style.width='100%';
renderer.domElement.style.height='100%';
renderer.domElement.style.display='block';
$('viewport').appendChild(renderer.domElement);
const orbit=new OrbitControls(camera,renderer.domElement);
orbit.enableDamping=true;orbit.dampingFactor=.08;orbit.minDistance=20;orbit.maxDistance=1500;
orbit.target.set(0,60,0);
orbit.addEventListener('start',()=>{cameraTween=null});
const hemisphere=new THREE.HemisphereLight(0xf4faff,0xc3dcfa,1.75);scene.add(hemisphere);
const sun=new THREE.DirectionalLight(0xffffff,1.35);sun.position.set(110,250,135);scene.add(sun);
const fill=new THREE.DirectionalLight(0xd3e6ff,.9);fill.position.set(-120,80,-60);scene.add(fill);
const underside=new THREE.DirectionalLight(0xd8edff,1.55);underside.position.set(0,-180,90);scene.add(underside);
const rimLight=new THREE.DirectionalLight(0xf6f9ff,.85);rimLight.position.set(70,-60,-200);scene.add(rimLight);
const ambience=new THREE.AmbientLight(0xffffff,.65);scene.add(ambience);
function refreshStudioLighting(){
 const even=!!s.evenLighting;
 hemisphere.color.set(even?0xf4faff:0xd9ebff);
 hemisphere.groundColor.set(even?0xc3dcfa:0x222b3d);
 // Preview-only lighting: gentler directional contrast and no blown-out pastels.
  const level=Math.max(.3,Math.min(1.4,Number(s.studioBrightness)||.85));
  hemisphere.intensity=(even?.9:.85)*level;
 sun.intensity=(even?.75:1.55)*level;
 fill.intensity=(even?.48:.35)*level;
 underside.intensity=(even?.76:0)*level;
 rimLight.intensity=(even?.32:0)*level;
 ambience.intensity=(even?.28:.22)*level;
 $('studioLightBtn').classList.toggle('active',even);
 $('studioLightBtn').textContent=even?'☼ Even light: On':'☼ Even light: Off';
}

const grid=new THREE.GridHelper(500,25,0x345378,0x263950);grid.position.y=-.12;scene.add(grid);
const axes=new THREE.AxesHelper(38);axes.position.set(-175,.4,-175);scene.add(axes);
const hardwareAnnotations=new THREE.Group();hardwareAnnotations.name='Hardware-identification overlays';scene.add(hardwareAnnotations);

const gizmo=new TransformControls(camera,renderer.domElement);
scene.add(gizmo.getHelper?.()||gizmo);
gizmo.setSize(.85);
gizmo.setTranslationSnap(s.snap?5:null);
gizmo.setRotationSnap(s.snap?THREE.MathUtils.degToRad(15):null);
gizmo.setScaleSnap(s.snap?.1:null);
gizmo.addEventListener('dragging-changed',e=>{orbit.enabled=!e.value;if(!e.value){applyGizmo();rebuildBase();snapshot();renderTree();renderSelection()}});
gizmo.addEventListener('objectChange',()=>{applyGizmo(false);renderSelection(true)});
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
let crystalMeshes=[],baseMesh=null,baseAccents=[],pixelGroup=new THREE.Group(),selectedMesh=null;
scene.add(pixelGroup);
const crystalMat=()=>new THREE.MeshStandardMaterial({color:s.colour,metalness:0,roughness:.4,flatShading:true,side:THREE.DoubleSide});
const baseMat=()=>new THREE.MeshStandardMaterial({color:s.colour,metalness:0,roughness:.56,flatShading:true,side:THREE.DoubleSide});
function disposeMesh(m){if(!m)return;m.geometry?.dispose();m.material?.dispose();scene.remove(m)}
function makeCrystal(c){
 const mesh=new THREE.Mesh(crystalGeometry(THREE,c,s),crystalMat());
 mesh.position.set(c.x,c.y+crystalRootOffset(crystals,s,c,THREE),c.z);
 mesh.quaternion.copy(crystalOrientation(THREE,c));
 mesh.scale.set(c.sx||c.scale||1,c.sy||c.scale||1,c.sz||c.scale||1);
 mesh.userData.crystalId=c.id;mesh.visible=!c.hidden;
 scene.add(mesh);return mesh;
}
function rebuild(){
 disposeManufacturing();
 gizmo.detach();crystalMeshes.forEach(disposeMesh);crystalMeshes=[];
 for(const c of crystals)crystalMeshes.push(makeCrystal(c));
 rebuildBase();updateLEDs();selectCrystal(selectedId,false);syncForm();renderTree();renderInfo();hardwareUI?.refresh();
 centreOrbitOnModel();
 setStatus('Ready · click a crystal to select · G / R / S · drag to orbit');
}
function rebuildBase(){
 disposeManufacturing();
 disposeMesh(baseMesh);baseMesh=null;
 baseAccents.forEach(disposeMesh);baseAccents=[];
 if(s.baseType==='none')return;
 const geo=baseGeometry(THREE,crystals,s);
 baseMesh=new THREE.Mesh(geo,baseMat());
 baseMesh.userData.isBase=true;
 scene.add(baseMesh);
 for(const c of baseAccentSpecs(crystals,s)){
  const mesh=new THREE.Mesh(crystalGeometry(THREE,c,s),baseMat());
  mesh.position.set(c.x,baseSurfaceHeight(crystals,s,c.x,c.z)-3,c.z);mesh.rotation.y=c.rotation;
  mesh.userData.isBaseAccent=true;scene.add(mesh);baseAccents.push(mesh);
 }
 updateAppearance();
}
function updateLEDs(){
 while(pixelGroup.children.length){const m=pixelGroup.children[0];pixelGroup.remove(m);m.geometry?.dispose();m.material?.dispose()}
 if(!s.showPixels)return;
 for(const p of planHardware(crystals,s).sockets){
  const m=new THREE.Mesh(new THREE.SphereGeometry(3,10,8),new THREE.MeshBasicMaterial({color:0xffdc58,depthTest:false}));
  m.position.set(p.x,1,p.z);m.renderOrder=95;pixelGroup.add(m);
 }
}

function selectCrystal(id,commit=true){
 const c=crystals.find(c=>c.id===id);selectedId=c?c.id:null;
 selectedMesh=crystalMeshes.find(m=>m.userData.crystalId===selectedId)||null;
 if(selectedMesh&&activeTool!=='select'&&!c.locked&&!manufacturingMesh?.visible)gizmo.attach(selectedMesh);
 else gizmo.detach();
 for(const m of crystalMeshes){
  m.material.emissive.setHex(m===selectedMesh?(c?.locked?0x7c1627:0x0b8752):0);
  m.material.emissiveIntensity=m===selectedMesh?.9:0;
  const old=m.getObjectByName('crystal-selection-outline');
  if(old){m.remove(old);old.geometry.dispose();old.material.dispose()}
 }
 if(selectedMesh){
  const outline=new THREE.LineSegments(new THREE.EdgesGeometry(selectedMesh.geometry,38),
    new THREE.LineBasicMaterial({color:c.locked?0xff566a:0x2bffa0,depthTest:false,transparent:true,opacity:.94}));
  outline.name='crystal-selection-outline';outline.renderOrder=60;selectedMesh.add(outline);
 }
 syncShapeControls();
 updateAppearance();
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
 c.y=+(selectedMesh.position.y-crystalRootOffset(crystals,s,c)).toFixed(3);
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
 '<div class="divider"></div><div class="note" style="color:#64e7af">Crystal shaping controls on the left now edit only this crystal.</div><div class="buttonrow"><button id="focusSelected">Focus</button><button id="lockSelected">'+(c.locked?'Unlock':'Lock')+'</button><button id="hideSelected">'+(c.hidden?'Show':'Hide')+'</button></div>';
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
 const meshes=[...crystalMeshes,...(baseMesh?[baseMesh]:[]),...baseAccents];
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
 for(const m of [...crystalMeshes,...(baseMesh?[baseMesh]:[]),...baseAccents,...(manufacturingMesh?[manufacturingMesh]:[])]){
  m.material.wireframe=look==='wire';
  m.material.transparent=look==='xray';
  m.material.opacity=look==='xray'?.38:1;
  m.material.depthWrite=look!=='xray';
  const selected=m===selectedMesh,c=selected?selectedCrystal():null;
  const glow=!!s.glowPreview&&s.lightingMode!=='none'&&!(m===manufacturingMesh&&$('printHeatmap')?.checked);
  m.material.emissive.setHex(selected?(c?.locked?0x8b1b2c:0x0b8752):glow?Number(s.glowColour):0);
  m.material.emissiveIntensity=selected?.88:glow?.58:0;
 }
}
function modelBounds(){
 const box=new THREE.Box3();
 const meshes=manufacturingMesh?.visible?[manufacturingMesh]:[...crystalMeshes,...(baseMesh?[baseMesh]:[]),...baseAccents];
 for(const mesh of meshes)if(mesh.visible)box.expandByObject(mesh);
 return box;
}
function minFramingDistance(box){
 const size=box.getSize(new THREE.Vector3()),radius=Math.max(1,size.length()*.5);
 const fovy=THREE.MathUtils.degToRad(camera.fov);
 const fovx=2*Math.atan(Math.tan(fovy*.5)*Math.max(.1,camera.aspect));
 return radius/Math.max(.05,Math.sin(Math.min(fovy,fovx)*.5))*1.18;
}
function centreOrbitOnModel(){
 const box=modelBounds();if(box.isEmpty())return;
 const center=box.getCenter(new THREE.Vector3());
 const direction=new THREE.Vector3().subVectors(camera.position,orbit.target);
 let distance=direction.length();
 if(distance<1e-5)direction.set(1,.7,1).normalize();
 else direction.multiplyScalar(1/distance);
 distance=Math.max(distance,minFramingDistance(box));
 cameraTween=null;
 camera.position.copy(center).addScaledVector(direction,distance);
 orbit.target.copy(center);camera.lookAt(center);orbit.update();
}
window.__crystalForgeViewMetrics=()=>{
 const box=modelBounds(),center=box.getCenter(new THREE.Vector3());
 const p=center.clone().project(camera);
 return {screen:[p.x,p.y,p.z],center:center.toArray(),
  target:orbit.target.toArray(),camera:camera.position.toArray(),modelSize:box.getSize(new THREE.Vector3()).toArray(),
  distance:camera.position.distanceTo(orbit.target)};
};
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
 const box=new THREE.Box3();for(const m of [...crystalMeshes,...(baseMesh?[baseMesh]:[]),...baseAccents])if(m.visible)box.expandByObject(m);
 if(manufacturingMesh?.visible)box.expandByObject(manufacturingMesh);
 const target=box.isEmpty()?new THREE.Vector3(0,45,0):box.getCenter(new THREE.Vector3());
 const dist=Math.max(125,minFramingDistance(box));
 const directions={iso:[1,.75,1],front:[0,.12,1],back:[0,.12,-1],left:[-1,.12,0],right:[1,.12,0],top:[0,1,.0001],bottom:[0,-1,.0001]};
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
let firstCanvasLayout=true;
function resize(){
 const box=$('viewport'),width=Math.max(1,box.clientWidth),height=Math.max(1,box.clientHeight);
 renderer.setSize(width,height,false);
 camera.aspect=Math.max(.01,width/height);
 camera.updateProjectionMatrix();
 // In particular, start framing only AFTER the responsive viewport has a
 // usable aspect ratio. Headless tests use DPR 2 to catch CSS pixel mismatches.
 if(firstCanvasLayout&&box.clientWidth>0&&box.clientHeight>0&&crystalMeshes.length){
  firstCanvasLayout=false;
  centreOrbitOnModel();
 }
}
new ResizeObserver(resize).observe($('viewport'));resize();requestAnimationFrame(animate);
let rebuildTimer;
function schedule(full=true){
 clearTimeout(rebuildTimer);rebuildTimer=setTimeout(()=>{
  if(full)rebuild();else{updateLEDs();renderInfo()}
  snapshot();
 },85);
}
const regenKeys=new Set(['count','height','width','seed','pattern','spacing','leanMode','leanAmount','angleRandomness','familyMix']);
const previewKeys=new Set(['showPixels','glowPreview','glowColour','studioBrightness','preserveLocked','snap','splitParts','splitX']);
document.querySelectorAll('[data-state]').forEach(e=>{
 e.addEventListener('input',()=>{
  const key=e.dataset.state,value=e.type==='checkbox'?e.checked:(e.type==='number'||e.type==='range')?Number(e.value):e.value;
  const target=selectedCrystal();
  if(shapeKeys.has(key)&&target){
    if(target.locked){syncShapeControls();return}
    if(key==='familyMix')target.family=value;
    else target.shape={...(target.shape||{}),[key]:value};
    rebuild();snapshot();return;
  }
  s[key]=value;
   if(key==='pixelProfileId'){
    const profile=allPixelProfiles(s).find(p=>p.id===value);
    if(profile)s.pixelDiameter=profile.bodyDiameter;
    syncForm();
   }
  if(key==='mount')$('edgeTabSettings').hidden=value!=='Edge fixing tabs';
  if(key==='lightingMode'&&value==='single')s.pixelCount=1;
  if(key==='lightingMode'&&value==='none')s.pixelCount=0;
  if(key==='lightingMode'&&value==='multi'&&s.pixelCount<1)s.pixelCount=2;
   // One explicit manufacturing strategy at a time; avoid silently ignoring a vault.
   if(key==='baseVault'&&value)s.hollowCrystals=false;
   if(key==='hollowCrystals'&&value)s.baseVault=false;
  if(!previewKeys.has(key))disposeManufacturing();
  for(const o of document.querySelectorAll('[data-out="'+key+'"]'))o.textContent=format(key,value);
  if(key==='pixelDiameter'||key==='pixelFit'||key==='pixelProfileId')$('actualHole').textContent=resolvePixelProfile(s).boreDiameter.toFixed(2)+' mm';
  if(key==='splitParts')$('splitExportBtn').disabled=!manufacturingMesh||!value;
  if(key==='glowColour'||key==='glowPreview')updateAppearance();
   if(key==='studioBrightness')refreshStudioLighting();
  if(key==='snap'){gizmo.setTranslationSnap(value?5:null);gizmo.setRotationSnap(value?THREE.MathUtils.degToRad(15):null);gizmo.setScaleSnap(value?.1:null)}
  if(regenKeys.has(key))generate();
  else if(previewKeys.has(key)){updateLEDs();renderInfo();persist()}
  else schedule();
 });
 e.addEventListener('change',snapshot);
});
$('clearCrystalSelection').onclick=()=>selectCrystal(null);
$('resetCrystalShape').onclick=()=>{
 const c=selectedCrystal();if(!c||c.locked)return;
 c.shape={};c.family=s.familyMix==='Mixed'?'Quartz':s.familyMix;
 rebuild();snapshot();
};
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
$('gridBtn').onclick=()=>{grid.visible=!grid.visible;axes.visible=grid.visible; if(s.floatView&&grid.visible){s.floatView=false;$('floatBtn').classList.remove('active');persist()}};
$('floatBtn').onclick=()=>setFloating(!s.floatView);
$('fitPixelBaseBtn').onclick=()=>{s.baseHeight=25;syncForm();rebuild();snapshot()};
$('studioLightBtn').onclick=()=>{s.evenLighting=!s.evenLighting;refreshStudioLighting();persist()};
$('centreViewBtn').onclick=()=>{
 centreOrbitOnModel();
 setStatus('View centred on crystal cluster · drag to rotate · right-drag to pan');
};
$('hardwareColoursBtn').onclick=()=>{s.hardwareColourMode=!s.hardwareColourMode;updateHardwareAnnotationVisibility();persist()};
$('featureOverlay').onchange=()=>updateHardwareAnnotationVisibility();

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

// Reusable pixel profiles are stored in both browser library and editable projects.
const pixelFields={name:'pixelName',kind:'pixelKind',bodyDiameter:'pixelBodyDiameter',
 bodyHeight:'pixelBodyHeight',flangeDiameter:'pixelFlangeDiameter',flangeHeight:'pixelFlangeHeight',
 capHeight:'pixelCapHeight',wireWidth:'pixelWireWidth',wireDepth:'pixelWireDepth'};
function closePixelEditor(){$('pixelProfileOverlay').hidden=true;$('editPixelProfileBtn').focus()}
$('editPixelProfileBtn').onclick=()=>{
 const p=resolvePixelProfile(s);
 for(const [k,id] of Object.entries(pixelFields))$(id).value=p[k];
 $('pixelProfileOverlay').hidden=false;$('pixelName').focus();
};
$('closePixelProfileBtn').onclick=closePixelEditor;
$('pixelProfileOverlay').addEventListener('pointerdown',e=>{
 if(e.target===$('pixelProfileOverlay'))closePixelEditor()
});
$('savePixelProfileBtn').onclick=()=>{
 const data={};
 for(const [k,id] of Object.entries(pixelFields))
  data[k]=['name','kind'].includes(k)?$(id).value:Number($(id).value);
 if(!String(data.name||'').trim()){alert('Enter a profile name.');return}
 data.id=s.pixelProfileId.startsWith('custom-')?s.pixelProfileId:'custom-'+Date.now().toString(36);
 const p=normalisePixelProfile(data);
 s.pixelProfiles=[...(s.pixelProfiles||[]).filter(x=>x.id!==p.id),p].slice(-30);
 s.pixelProfileId=p.id;s.pixelDiameter=p.bodyDiameter;
 try{localStorage.setItem(pixelLibraryKey,JSON.stringify(s.pixelProfiles))}
 catch(e){console.warn('Pixel library not writable',e)}
 closePixelEditor();syncForm();rebuild();snapshot();
 setStatus('Custom pixel profile saved: '+p.name+'. Prepare print mesh again.');
};
$('deletePixelProfileBtn').onclick=()=>{
 const id=s.pixelProfileId;
 if(!id.startsWith('custom-')){alert('Built-in presets cannot be deleted.');return}
 s.pixelProfiles=(s.pixelProfiles||[]).filter(p=>p.id!==id);
 s.pixelProfileId='gumdrop';s.pixelDiameter=PIXEL_PRESETS[0].bodyDiameter;
 try{localStorage.setItem(pixelLibraryKey,JSON.stringify(s.pixelProfiles))}catch(e){}
 closePixelEditor();syncForm();rebuild();snapshot();
};
document.addEventListener('keydown',e=>{
 if(!$('pixelProfileOverlay').hidden&&e.key==='Escape'){
  e.preventDefault();e.stopImmediatePropagation();closePixelEditor();
 }
},true);
$('saveBtn').onclick=saveProject;$('projectExportBtn').onclick=saveProject;
$('loadBtn').onclick=()=>$('loadFile').click();
$('loadFile').onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  const json=JSON.parse(await file.text());
  if(!json.settings||!Array.isArray(json.crystals))throw Error('Invalid project structure');
  s={...defaults,...json.settings};mergePixelLibrary();if(s.lightingMode==='single')s.pixelCount=1;crystals=safeArray(json.crystals);selectedId=null;
  syncForm();rebuild();snapshot();setStatus('Project loaded: '+file.name);
 }catch(err){alert('Could not load project: '+err.message)}
 e.target.value='';
};
let activePreparationWorker=null,persistentFabricationWorker=null,activePreparationReject=null,preparationSerial=0;
window.__crystalForgeWorkerStarts=0;
function cancelActivePreparation(reason='Preparation cancelled'){
 if(!activePreparationWorker)return;
 const worker=activePreparationWorker;activePreparationWorker=null;
 worker.terminate();if(persistentFabricationWorker===worker)persistentFabricationWorker=null;
 const reject=activePreparationReject;activePreparationReject=null;
 if(reject)reject(new Error(reason));
}
async function buildManufacturing(){
 if($('prepareBtn').disabled)return;
 const btn=$('prepareBtn'),cancelBtn=$('cancelPrepareBtn'),source=sourceHash();
 // Reuse the cached manifold result unless the editable model changed.
 if(manufacturingMesh&&manufacturingReport&&preparedSource===source){
  $('showManufacturing').checked=true;manufacturingView(true);applyPrintHeatmap();
  $('prepareStatus').textContent='✓ Reused prepared print mesh — no geometry changes.';
  setStatus('Manufacturing mesh already current · no repeat processing');
  return;
 }
 btn.disabled=true;btn.textContent='◌ Preparing in background…';cancelBtn.hidden=false;
 $('prepareStatus').textContent='Starting dedicated manufacturing Web Worker…';
 setStatus('Preparing in background · you can still use the editor');
 try{
  if(!window.Worker)throw new Error('This browser does not support Web Workers.');
  const components=[...crystalMeshes,...(baseMesh?[baseMesh]:[]),...baseAccents].filter(m=>{
   if(m.userData.crystalId)return !crystals.find(c=>c.id===m.userData.crystalId)?.hidden;
   return true;
  }).map(mesh=>({
   positions:new Float32Array(mesh.geometry.getAttribute('position').array),
   position:mesh.position.toArray(),quaternion:mesh.quaternion.toArray(),
   scale:mesh.scale.toArray(),
   userData:{crystalId:mesh.userData.crystalId||null,isBase:!!mesh.userData.isBase,
    isBaseAccent:!!mesh.userData.isBaseAccent}
  }));
  const id=++preparationSerial;
  const result=await new Promise((resolve,reject)=>{
   let worker;
   try{worker=persistentFabricationWorker||new Worker(new URL('./fabrication-worker.js',import.meta.url),{type:'module'});
    persistentFabricationWorker=worker;}
   catch(error){reject(error);return}
   activePreparationWorker=worker;activePreparationReject=reject;
   window.__crystalForgeWorkerStarts++;
   worker.onmessage=event=>{
    const data=event.data;if(id!==preparationSerial)return;
    if(data.type==='progress')$('prepareStatus').textContent=data.stage;
    else if(data.type==='complete'){
     activePreparationWorker=null;activePreparationReject=null;resolve(data);
    }else if(data.type==='error'){
     activePreparationWorker=null;activePreparationReject=null;worker.terminate();persistentFabricationWorker=null;
     reject(new Error(data.message||'Unspecified worker error'));
    }
   };
   worker.onerror=event=>{
    activePreparationWorker=null;activePreparationReject=null;worker.terminate();persistentFabricationWorker=null;
    reject(new Error('Print worker failed: '+(event.message||'unknown error')));
   };
   try{worker.postMessage({
     type:'prepare',components,crystals:structuredClone(crystals),settings:structuredClone(s)
    },components.map(input=>input.positions.buffer))}
   catch(error){activePreparationWorker=null;activePreparationReject=null;worker.terminate();persistentFabricationWorker=null;reject(error)}
  });
  if(source!==sourceHash())throw new Error('Model changed during preparation. Please retry.');
  disposeManufacturing();
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(result.positions,3));
  geometry.computeVertexNormals();
  manufacturingReport=result.report;preparedSource=source;
  manufacturingMesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({
   color:s.colour,metalness:0,roughness:.42,flatShading:true,side:THREE.DoubleSide
  }));
  manufacturingMesh.visible=false;scene.add(manufacturingMesh);
  updateAppearance();renderManufactureReport(result.report);createHardwareAnnotations();
  $('prepareStatus').textContent='✓ Mesh prepared off-thread in '+(result.report.preparationMs/1000).toFixed(1)+' s. Review warnings.';
  $('stlBtn').disabled=false;$('threeMfBtn').disabled=false;
  $('splitExportBtn').disabled=!s.splitParts;
  $('showManufacturing').checked=true;manufacturingView(true);applyPrintHeatmap();
  setStatus('Prepared '+result.report.triangleCount.toLocaleString()+' triangles · editor remained responsive');
 }catch(error){
  console.error('Preparation',error);
  $('prepareStatus').textContent=error.message;setStatus(error.message);
 }finally{
  if(activePreparationWorker)cancelActivePreparation('Preparation finished');
  btn.disabled=false;btn.textContent='▣ Prepare print mesh (Boolean union)';cancelBtn.hidden=true;
 }
}
$('cancelPrepareBtn').onclick=()=>cancelActivePreparation('Preparation cancelled. You can edit and retry.');
function verifyPrepared(){
 if(!manufacturingMesh||!manufacturingReport||preparedSource!==sourceHash()){
  alert('Please run Prepare print mesh first. Your existing manufacturing mesh is missing or out of date.');return false;
 }
 return true;
}
$('prepareBtn').onclick=buildManufacturing;
$('showManufacturing').onchange=e=>manufacturingView(e.target.checked);
$('printHeatmap').onchange=applyPrintHeatmap;
if(s.floatView){grid.visible=false;axes.visible=false}
hardwareUI=createHardwareEditor({THREE,scene,renderer,camera,orbit,gizmo,getBaseMesh:()=>baseMesh,
 getSettings:()=>s,getCrystals:()=>crystals,onStatus:setStatus,
 onEdit:()=>{disposeManufacturing();syncForm();updateLEDs();hardwareUI.refresh();renderInfo();snapshot()}
});

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
 const rows=[['Type','Quantity','Notes'],['12V gumdrop pixels',s.pixelCount,'12 mm nominal mounting hole; adjust by '+s.pixelFit+' mm'],['Crystal bodies',crystals.length,'experimental STL; not Boolean merged'],['Integrated base',s.baseType==='none'?0:1,'mounted by '+s.mount],['Mounting holes',planHardware(crystals,s).mounts.length+planHardware(crystals,s).tabHoles.length,s.mount+'; check fit dimensions'],['Edge tabs',planHardware(crystals,s).tabs.length,'Print-fit and strength require verification'],['Planned socket diameter',(+s.pixelDiameter+(+s.pixelFit)).toFixed(2)+' mm','preview only']];
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
syncForm();rebuild();snapshot();
installTooltips();
const descriptionsKey='crystal-forge-descriptions';
let descriptionsEnabled=false;
try{descriptionsEnabled=localStorage.getItem(descriptionsKey)==='on'}catch(e){}
function showDescription(el){
 if(!descriptionsEnabled)return;
 const info=describeControl(el);if(!info)return;
 $('contextHelpTitle').textContent=info[0];
 $('contextHelpBody').textContent=info[1];
}
function toggleDescriptionsUI(){
 $('contextHelp').hidden=!descriptionsEnabled;
 document.body.classList.toggle('descriptions-active',descriptionsEnabled);
 $('descriptionsBtn').setAttribute('aria-pressed',String(descriptionsEnabled));
 $('descriptionsBtn').textContent=descriptionsEnabled?'ⓘ Descriptions: On':'ⓘ Descriptions';
 if(descriptionsEnabled)showDescription(document.querySelector('[data-state="mount"]'));
 try{localStorage.setItem(descriptionsKey,descriptionsEnabled?'on':'off')}catch(e){}
}
$('descriptionsBtn').onclick=()=>{descriptionsEnabled=!descriptionsEnabled;toggleDescriptionsUI()};
for(const kind of ['pointerover','focusin','change'])
 document.addEventListener(kind,e=>{
  const el=e.target.closest?.('button,input,select');if(el)showDescription(el);
 });
toggleDescriptionsUI();

