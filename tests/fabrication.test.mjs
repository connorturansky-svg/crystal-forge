import assert from 'node:assert/strict';
import * as THREE from 'three';
import Module from 'manifold-3d';
import {generateFormation,crystalGeometry,baseGeometry,baseAccentSpecs,baseSurfaceHeight,baseProfileHeight,baseEdgeHeight,crystalRootOffset,crystalOrientation,crystalEndRatios} from '../geometry-v3.js';
import {setThreeInstance,prepareFabrication,makeCalibrationStrip,splitPreparedMesh,saveSTL,save3MF} from '../fabrication-v1.js';
setThreeInstance(THREE);
import {planHardware} from '../hardware-layout.js';
import {PIXEL_PRESETS,normalisePixelProfile,resolvePixelProfile} from '../pixel-profiles.js';

const wasm=await Module();wasm.setup();

function geometryEdges(g){
 const p=g.attributes.position.array,edges=new Map();
 const v=i=>[...p.slice(i,i+3)].map(x=>Math.round(x*1e4)).join(',');
 for(let i=0;i<p.length;i+=9)for(let j=0;j<3;j++){
  const endpoints=[v(i+j*3),v(i+((j+1)%3)*3)].sort().join(':');
  edges.set(endpoints,(edges.get(endpoints)||0)+1);
 }
 return {open:[...edges.values()].filter(x=>x!==2).length,triangles:p.length/9};
}
// PR4: geometry stays closed through all hill/plinth modes.
for(const baseProfile of ['Flat plinth','Plinth + dome','Full dome / hill']){
 for(const sideWall of [0,50,100]){
  const config={seed:42,count:8,width:95,height:130,pattern:'Central Spire',
   familyMix:'Quartz',baseType:'integrated',baseStyle:'Fitted',baseWidth:10,
   baseProfile,sideWall,baseHeight:25,baseDome:20,baseEdgeRadius:2,domeFalloff:1.8};
  const cs=generateFormation(config),geometry=baseGeometry(THREE,cs,config);
  assert.equal(geometryEdges(geometry).open,0,'PR4 base closure '+baseProfile);
  assert(baseProfileHeight(config,0)>=baseProfileHeight(config,.8));
  assert(Math.abs(baseProfileHeight(config,1)-baseEdgeHeight(config))<.001);
  assert(cs.every(c=>Number.isFinite(baseSurfaceHeight(cs,config,c.x,c.z))));
  geometry.dispose();
 }
}
console.log('PR4 base profile mesh tests passed');

function safetyGeometryCheck(){
 // Geometry alone cannot certify a child-safe product, but it must form a
 // smooth profile with many intermediate rings, no flat polygon at the apex
 // and no open edges.
 const q={...settings,count:5,tipRound:4,tipFlat:0};
 const model=assembly(q);
 const crystal=crystalGeometry(THREE,model.crystals[0],q);
 const edges=geometryEdges(crystal);
 assert.equal(edges.open,0,'Broad rounded cap must be closed');
 const ys=crystal.getAttribute('position').array.filter((_,i)=>i%3===1);
 assert(Math.max(...ys)<q.height+1,'Rounded apex should not form a sharp overheight spike');
 assert(edges.triangles>180,'Rounded cap has enough subdivisions to form a curve');
 crystal.dispose();model.meshes.forEach(x=>x.geometry.dispose());
 const moundSettings={...q,baseDome:24};
 const cs=generateFormation(moundSettings),mound=baseGeometry(THREE,cs,moundSettings);
 const moundEdge=geometryEdges(mound);
 assert.equal(moundEdge.open,0,'Domed base must be closed');
 const topY=Math.max(...mound.getAttribute('position').array.filter((_,i)=>i%3===1));
 assert(topY>=moundSettings.baseHeight+23,'Dome must raise centre independently of base height');
 mound.dispose();
 console.log('Rounded cap and domed base mesh checks passed',edges.triangles,moundEdge.triangles);
}


function verifyClearance(label,crystals,settings){
 const plan=planHardware(crystals,settings);
 assert.equal(plan.collisions.length,0,label+' has no overlapping cut features');
 const holes=[...plan.sockets,...plan.mounts];
 for(let i=0;i<holes.length;i++)for(let j=i+1;j<holes.length;j++){
  const a=holes[i],b=holes[j],distance=Math.hypot(a.x-b.x,a.z-b.z);
  assert(distance>=a.radius+b.radius+plan.clearance-1e-5,label+' maintains edge clearance');
 }
 return plan;
}

const settings={
  seed:42,count:10,width:95,height:130,pattern:'Central Spire',familyMix:'Quartz',lightingMode:'single',
  bottomScale:1,topScale:.8,cornerRadius:.7,shoulderRound:0,tipFlat:.25,tipLength:.27,roundSteps:3,
  baseType:'integrated',baseHeight:9,wallThickness:1.2,undersideAccess:false,
  pixelCount:5,pixelDiameter:12,pixelFit:.1,cutSockets:false,hollowCrystals:false,overhang:45,
};
function assembly(s){
  const crystals=generateFormation(s),meshes=[];
  for(const c of crystals){
    const m=new THREE.Mesh(crystalGeometry(THREE,c,s));
    m.position.set(c.x,c.y+crystalRootOffset(crystals,s,c,THREE),c.z);
    m.quaternion.copy(crystalOrientation(THREE,c));
    m.scale.set(c.sx||c.scale||1,c.sy||c.scale||1,c.sz||c.scale||1);
    m.userData.crystalId=c.id; // Same object identity required by the live editor and light-tunnel solver.
    meshes.push(m);
  }
  const base=new THREE.Mesh(baseGeometry(THREE,crystals,s));base.userData.isBase=true;meshes.push(base);
  for(const accent of baseAccentSpecs(crystals,s)){
   const m=new THREE.Mesh(crystalGeometry(THREE,accent,s));
   m.position.set(accent.x,baseSurfaceHeight(crystals,s,accent.x,accent.z)-3,accent.z);
   m.rotation.y=accent.rotation;meshes.push(m);
  }
  return {meshes,crystals};
}
function validate(label,s){
  const {meshes,crystals}=assembly(s);
  const result=prepareFabrication({wasm,meshes,crystals,settings:s});
  assert(result.report.ready,label+' reports ready');
  assert(Number.isFinite(result.report.volumeMm3)&&result.report.volumeMm3>1,label+' positive volume');
  assert(result.report.triangleCount>0,label+' triangles');
  assert(result.geometry.getAttribute('position').count>0,label+' geometry');
  console.log(label,JSON.stringify({triangles:result.report.triangleCount,connected:result.report.disconnected,
    hollow:result.report.hollowed,sockets:result.report.socketsCut,warningCount:result.report.warnings.length}));
  result.geometry.dispose();
  return result.report;
}
// Check crowded designs with both kinds of hole and a minimum web between them.
for(const n of [1,5,10,16,40]){
 const q={...settings,count:n,pixelCount:20,cutSockets:true,mount:'Magnet inserts'};
 const model=assembly(q),plan=verifyClearance('cluster-'+n,model.crystals,q);
 assert(plan.skippedPixels>=0,'planner reports any skipped pixel bores');
 console.log('clearance-'+n,JSON.stringify({pixels:plan.sockets.length,mounts:plan.mounts.length,skippedPixels:plan.skippedPixels,skippedMounts:plan.skippedMounts}));
}
// Manual pixel and mounting positions use the same manufacturing plan as the UI.
{
 const cfg={...settings,count:10,pixelPlacement:'manual',lightingMode:'multi',pixelCount:2,cutSockets:true,
  manualPixelHoles:[{x:0,z:0},{x:100000,z:100000}],
  mountPlacement:'manual',mount:'Custom dual holes',manualMountHoles:[{x:0,z:0}]};
 const cs=generateFormation(cfg),plan=planHardware(cs,cfg);
 assert.equal(plan.invalidManualPixels.length,1,'Off-base manual pixel is rejected');
 assert(plan.sockets.length<=1,'Only valid manual pixels are cut');
 assert.equal(plan.invalidManualMounts.length,1,'Overlapping manually placed mounting hole is rejected');
}
// Low-poly design controls and six base profiles must produce real closed
// solids, including organic shapes and the jagged mini-crystal style.
for(const style of ['Fitted','Square','Circle','Rounded','Organic','Crystal crust']){
 const q={...settings,baseStyle:style,baseWidth:7,spacing:48,angleRandomness:35,
   tipRound:.4,pixelCount:1,lightingMode:'single',cutSockets:true};
 const report=validate('base-'+style,q);
 assert.equal(report.disconnected,1,'Base style '+style+' remains connected');
 assert(report.triangleCount>100,'Base style '+style+' contains printable geometry');
 const {crystals:cs}=assembly(q);
 const plan=verifyClearance(style,cs,q);
 assert(plan.sockets.length<=1,'Single-pixel mode never cuts multiple LED openings');
  assert(plan.collisions.length===0,'Base style '+style+' contains no hardware clashes');
}
// Global starting size and extreme taper vary thickness independently of height
// while retaining sealed surfaces and deterministic per-crystal widths.
{
 const initial={...settings,count:12,crystalSize:1,topScale:1,bottomScale:1,widthRandomness:0};
 const extreme={...initial,crystalSize:3.5,bottomScale:5,topScale:.15,widthRandomness:72};
 const cs=generateFormation(initial),small=crystalGeometry(THREE,cs[0],initial),huge=crystalGeometry(THREE,cs[0],extreme);
 assert.equal(geometryEdges(huge).open,0,'Extreme taper forms a closed shell');
 assert.equal(cs[0].h,generateFormation(extreme)[0].h,'Global size does not change crystal height');
 const a=new THREE.Box3().setFromBufferAttribute(small.getAttribute('position'));
 const b=new THREE.Box3().setFromBufferAttribute(huge.getAttribute('position'));
 assert(b.max.x-b.min.x>a.max.x-a.min.x,'Global diameter scales actual mesh width');
 assert.deepEqual(crystalEndRatios(cs[0],extreme),crystalEndRatios(cs[0],extreme),'Width variation reproducible');
 const auto=planHardware(generateFormation(extreme),{...extreme,baseType:'integrated',pixelPlacement:'auto',cutSockets:true});
 assert(auto.sockets.length>0,'Automatic LED placement works with enlarged crystal roots');
 small.dispose();huge.dispose();
}
// Per-crystal shape changes only the nominated crystal, not the global mesh.
const override={...settings,tipRound:.4,spacing:55,angleRandomness:60};
const overridden=generateFormation(override);
const crystal=overridden[0];
const meshA=crystalGeometry(THREE,crystal,override);
const meshB=crystalGeometry(THREE,{...crystal,shape:{tipRound:1.4,topScale:.55,cornerRadius:1.6}},override);
assert.notDeepEqual(Array.from(meshA.getAttribute('position').array),
 Array.from(meshB.getAttribute('position').array),'Individual shape override changes mesh');
meshA.dispose();meshB.dispose();
safetyGeometryCheck();
function testLeanAndSpacing(){
 const base={...settings,count:12,baseDome:0,spacing:100,leanAmount:90,angleRandomness:0};
 for(const mode of ['One direction','Criss-cross','Radial outward','Radial inward','Organic / natural']){
  const cs=generateFormation({...base,leanMode:mode});
  for(let i=0;i<cs.length;i++)for(let j=i+1;j<cs.length;j++){
   const a=cs[i],b=cs[j],extent=c=>c.r*Math.max(base.bottomScale,base.topScale,1)+c.h*Math.hypot(c.leanX,c.leanZ)+3.5;
   assert(Math.hypot(a.x-b.x,a.z-b.z)>=extent(a)+extent(b)+15-1e-3,'Max spacing must have no swept overlaps for '+mode);
  }
  const worldLean=c=>({x:c.leanX*Math.cos(c.rotation)+c.leanZ*Math.sin(c.rotation),
    z:-c.leanX*Math.sin(c.rotation)+c.leanZ*Math.cos(c.rotation)});
  if(mode==='One direction')assert(cs.every(c=>worldLean(c).x>.01&&Math.abs(worldLean(c).z)<1e-8),'All one-direction leans must align in world space');
  if(mode==='Criss-cross')assert(cs.some(c=>worldLean(c).x>.01)&&cs.some(c=>worldLean(c).x<-.01),'Criss-cross alternates world direction');
  if(mode==='Radial outward'||mode==='Radial inward'){
   for(const c of cs.filter(c=>Math.hypot(c.x,c.z)>1)){
    const w=worldLean(c),dot=w.x*c.x+w.z*c.z;
    assert(mode==='Radial outward'?dot>0:dot<0,'Radial pattern respects actual world position');
   }
  }
  const tight=generateFormation({...base,spacing:0,leanMode:mode});
  const span=arr=>Math.max(...arr.map(c=>Math.hypot(c.x,c.z)));
  assert(span(cs)>span(tight)*3,'Max spacing much wider');
 }
 const c=generateFormation({...base,leanMode:'One direction'})[0];
 const rounded=crystalGeometry(THREE,c,{...base,cornerRadius:2.5,shoulderRound:0});
 const sharp=crystalGeometry(THREE,c,{...base,cornerRadius:0,shoulderRound:0});
 assert(rounded.getAttribute('position').count>sharp.getAttribute('position').count,'Side round links to shoulder');
 rounded.dispose();sharp.dispose();
 console.log('Lean modes, zero overlap at 100%, joined shoulder rounding passed');
}
testLeanAndSpacing();

function verifyDomeRoots(){
 for(const style of ['Fitted','Square','Circle','Rounded','Organic','Crystal crust']){
  for(const dome of [0,8,17,35]){
   const cfg={...settings,count:16,baseDome:dome,baseStyle:style};
   const cs=generateFormation(cfg);
   const roots=cs.map(c=>baseSurfaceHeight(cs,cfg,c.x,c.z));
   assert(roots.every(v=>Number.isFinite(v)&&v>=cfg.baseHeight-.01&&v<=cfg.baseHeight+dome+.01),'Roots follow dome '+style+' '+dome);
   assert(cs.every((c,i)=>Math.abs((roots[i]-crystalRootOffset(cs,cfg,c))-2.5)<.0001),'Crystal roots embed 2.5mm');
   if(dome>0)assert(roots.some(y=>y>cfg.baseHeight+1),'Dome raises crystal roots');
  }
 }
 console.log('All six dome styles seat crystal roots at 0–35 mm');
}
verifyDomeRoots();
// Rigidly tilted crystals must be embedded around their WHOLE root perimeter,
// not just centred at the dome surface.
{
 const cfg={...settings,count:12,baseHeight:25,baseDome:30,
  leanMode:'Radial outward',leanAmount:100,angleRandomness:0,
  crystalSize:1.4,widthRandomness:35};
 const model=assembly(cfg);
 for(let i=0;i<model.crystals.length;i++){
  const m=model.meshes[i],c=model.crystals[i],attr=m.geometry.getAttribute('position');
  m.updateMatrixWorld(true);
  for(let k=0;k<attr.count;k++){
   const v=new THREE.Vector3().fromBufferAttribute(attr,k);
   if(Math.abs(v.y)>.001)continue;
   v.applyMatrix4(m.matrixWorld);
   assert(v.y<=baseSurfaceHeight(model.crystals,cfg,v.x,v.z)-2.35,
    'Tilted root perimeter protrudes above mound');
  }
 }
 model.meshes.forEach(m=>m.geometry.dispose());
}

for(const edge of [0,.75,2.5,5.5]){
 const cfg={...settings,baseDome:20,baseEdgeRadius:edge,baseWidth:8,tipRound:3.5};
 const crystals=generateFormation(cfg),geo=baseGeometry(THREE,crystals,cfg);
 assert.equal(geometryEdges(geo).open,0,'Upper-edge fillet must stay closed');
 assert(crystals.every(c=>Number.isFinite(baseSurfaceHeight(crystals,cfg,c.x,c.z))),'Crystal roots remain attached');
 geo.dispose();
}
validate('domed-union',{...settings,baseDome:20,tipRound:3.5});
// PR4 — selected pixel shapes affect clearance and the manufactured socket.
{
 const base={...settings,count:10,baseHeight:25,baseDome:0,cutSockets:true,lightingMode:'single',pixelFit:.15};
 for(const preset of PIXEL_PRESETS){
  const cfg={...base,pixelProfileId:preset.id,pixelDiameter:preset.bodyDiameter};
  const profile=resolvePixelProfile(cfg),plan=planHardware(generateFormation(cfg),cfg);
  assert.equal(profile.id,preset.id);
  assert(plan.sockets.every(p=>p.radius>=profile.maxDiameter/2-.001),'Flange included in layout');
  assert.equal(plan.collisions.length,0);
 }
 const custom=normalisePixelProfile({id:'custom-test',name:'Measured test LED',kind:'gumdrop',
   bodyDiameter:14,bodyHeight:19,flangeDiameter:16,flangeHeight:2,capHeight:3,wireWidth:4,wireDepth:2});
 const cfg={...base,pixelProfileId:custom.id,pixelDiameter:custom.bodyDiameter,pixelProfiles:[custom]};
 assert(Math.abs(resolvePixelProfile(cfg).maxDiameter-16.15)<.001);
 const report=validate('custom-profile-bore',cfg);
 assert(report.socketsCut>0,'Custom pixel profile creates a cut');
 assert(report.socketCeilings.every(c=>c.remainingWall>=2.79),'Profile socket has blind roof');
 console.log('PR4 pixel clearance and cut tests passed');
}
// Tabs must be physical fused geometry with THROUGH holes, not markers.
const cfgTabs={...settings,count:8,baseHeight:25,baseDome:4,baseWidth:10,
 mount:'Edge fixing tabs',tabCount:3,tabHolesPerTab:2,
 tabHoleDiameter:4.5,tabThickness:5,tabWall:3,cutSockets:true};
const plannedTabs=planHardware(generateFormation(cfgTabs),cfgTabs);
assert(plannedTabs.tabs.length>0,'Edge tabs are included in planned layout');
assert.equal(plannedTabs.tabHoles.length,2*plannedTabs.tabs.length,'Each placed tab carries two holes');
const builtTabs=validate('edge-tabs',cfgTabs);
assert.equal(builtTabs.edgeTabs,plannedTabs.tabs.length,'All planned tabs are fused into mesh');
assert.equal(builtTabs.mountingHolesCut,plannedTabs.tabHoles.length,'All accepted tab holes are drilled');
assert.equal(builtTabs.disconnected,1,'Tabs and body remain connected');
const vaultCheck=validate('zero-infill-vault',{...settings,count:8,baseHeight:25,baseDome:12,
 baseVault:true,vaultSupportPitch:25,cutSockets:true,pixelCount:1,hollowCrystals:false});
assert(vaultCheck.vault.applied,'Zero-infill base vault is cut in the manufacturing mesh');
assert(vaultCheck.vault.supportCount>0,'Integral support columns are generated');
assert(vaultCheck.volumeMm3<vaultCheck.initialVolume,'Cavity removes solid material');
assert.equal(vaultCheck.disconnected,1,'Roof buttresses stay part of the printed model');
assert.equal(vaultCheck.internalCavities,0,'Underside chamber remains open');
assert(vaultCheck.ventCuts>0,'LED collar has side ventilation to the chamber');
const domedBalloon=validate('domed-balloon',{...settings,baseDome:17,baseHeight:24,hollowCrystals:true,cutSockets:true,pixelCount:1});
assert.equal(domedBalloon.internalCavities,0,'Domed hollow cluster has no inaccessible sealed pockets');
assert.equal(domedBalloon.disconnected,1,'Domed balloon remains a connected printable body');
const solidMass=validate('solid',settings);
const hollow=validate('hollow',{...settings,hollowCrystals:true,cutSockets:true});
assert(hollow.volumeMm3<solidMass.volumeMm3,'Balloon cavity with an LED port reduces material volume');
assert.equal(hollow.internalCavities,0,'Sealed inaccessible pockets must be eliminated from exported geometry');
console.log('balloon-material-ratio', (hollow.volumeMm3/solidMass.volumeMm3).toFixed(3),
  'sealed-voids',hollow.internalCavities,'filled-pockets',hollow.sealedCavitiesFilled);
assert.equal(hollow.disconnected,1,'Hollowing must not fragment a connected base and cluster');
validate('sockets',{...settings,cutSockets:true});
const full=validate('hollow-and-sockets',{...settings,cutSockets:true,hollowCrystals:true});
assert(full.socketsCut>0,'At least one actual socket should be cut');
assert.equal(full.disconnected,1,'Combined hollowing and socket cutting must preserve a connected solid');
assert.equal(full.internalCavities,0,'No sealed internal voids after LED and hollowing cuts');
assert(full.hollowPorts>0,'At least one hollow spike receives a light passage');
assert(full.lightPathScreened,'One-pixel model should have no sealed enclosed cavity in representative case');
const blind=validate('rounded-blind-socket',{...settings,cutSockets:true,baseHeight:25,baseDome:12});
assert(blind.socketCeilings.length>0,'Socket roofs reported');
assert(blind.socketCeilings.every(c=>c.remainingWall>=2.79),'LED channels retain a physical roof');
assert(blind.socketCeilings.every(c=>c.capRise>.2),'Blind LED channel roofs are curved');
const domeLight=validate('domed-light-path',{...settings,baseHeight:25,baseDome:17,hollowCrystals:true,cutSockets:true});
assert(domeLight.hollowPorts>0,'Dome-shifted crystal roots have light passages');
assert(domeLight.baseFitsPixel,'Nominal 22 mm pixel fits a 25 mm base');

for(const mount of ['Wall screws','Magnet inserts','Threaded insert M3','Custom dual holes']){
 const built=validate('mount-'+mount,{...settings,mount,mountHoleDiameter:4.5,mountHoleDepth:9,mountSpacing:40});
 assert.equal(built.disconnected,1,'Mount '+mount+' must not disconnect the formation');
 assert(built.mountingHolesCut===0||built.mountingHolesCut===2,'Mount '+mount+' cannot cut an unsafe single hole');
}
const combo=validate('full-assembly',{...settings,hollowCrystals:true,cutSockets:true,mount:'Magnet inserts'});
assert.equal(combo.disconnected,1,'Combined hollow and mounted LED assembly must remain connected');
verifyClearance('full-assembly',assembly({...settings,hollowCrystals:true,cutSockets:true,mount:'Magnet inserts'}).crystals,{...settings,hollowCrystals:true,cutSockets:true,mount:'Magnet inserts'});
const cal=makeCalibrationStrip(wasm);
assert(cal.triangles>50,'Calibration strip created');
console.log('calibration',cal.diameters.join(','));
cal.geometry.dispose();
const {meshes,crystals}=assembly(settings);
const result=prepareFabrication({wasm,meshes,crystals,settings});
const halves=splitPreparedMesh(wasm,result.report.mesh,0);
assert(halves.some(Boolean),'Split produced at least one part');
halves.forEach(v=>v?.geometry.dispose());
result.geometry.dispose();

// Simulate browser download click to inspect the actual exported Blob bytes.
globalThis.document={
 createElement:()=>({click(){},remove(){},set href(v){},set download(v){}}),
 body:{appendChild(){}}
};
const {meshes:exportMeshes,crystals:exportCrystals}=assembly(settings);
const exported=prepareFabrication({wasm,meshes:exportMeshes,crystals:exportCrystals,settings});
const stl=saveSTL(exported.geometry);
const stlData=new DataView(await stl.arrayBuffer());
assert.equal(stlData.getUint32(80,true),exported.report.triangleCount,'STL triangle count');
let minZ=Infinity,maxZ=-Infinity;
for(let i=0;i<stlData.getUint32(80,true);i++){
 const o=84+50*i;
 for(const z of [o+20,o+32,o+44]){const v=stlData.getFloat32(z,true);minZ=Math.min(minZ,v);maxZ=Math.max(maxZ,v)}
}
assert(minZ>-.1,'STL base rests on Z=0 build plate (not sideways)');
assert(maxZ>50,'STL crystal points are upright along Z');
const mf=save3MF(exported.geometry);
const bytes=new Uint8Array(await mf.arrayBuffer());
assert.deepEqual(Array.from(bytes.subarray(0,4)),[0x50,0x4b,0x03,0x04],'3MF begins with ZIP local header');
assert(bytes.length>1000,'3MF archive contains geometry');
exported.geometry.dispose();
console.log('Export check',JSON.stringify({stlTriangles:stlData.getUint32(80,true),baseZ:minZ.toFixed(2),tipZ:maxZ.toFixed(2),mfBytes:bytes.length}));
console.log('Manufacturing smoke tests passed.');
