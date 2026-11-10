import assert from 'node:assert/strict';
import * as THREE from 'three';
import Module from 'manifold-3d';
import {generateFormation,crystalGeometry,baseGeometry,baseAccentSpecs} from '../geometry-v3.js';
import {prepareFabrication,makeCalibrationStrip,splitPreparedMesh,saveSTL,save3MF} from '../fabrication-v1.js';
import {planHardware} from '../hardware-layout.js';

const wasm=await Module();wasm.setup();

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
    m.position.set(c.x,c.y+s.baseHeight-2.5,c.z);
    m.rotation.set(c.rx||0,c.rotation||0,c.rz||0,'XYZ');
    m.scale.set(c.sx||c.scale||1,c.sy||c.scale||1,c.sz||c.scale||1);
    meshes.push(m);
  }
  const base=new THREE.Mesh(baseGeometry(THREE,crystals,s));base.userData.isBase=true;meshes.push(base);
  for(const accent of baseAccentSpecs(crystals,s)){
   const m=new THREE.Mesh(crystalGeometry(THREE,accent,s));
   m.position.set(accent.x,s.baseHeight-3,accent.z);
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
// Per-crystal shape changes only the nominated crystal, not the global mesh.
const override={...settings,tipRound:.4,spacing:55,angleRandomness:60};
const overridden=generateFormation(override);
const crystal=overridden[0];
const meshA=crystalGeometry(THREE,crystal,override);
const meshB=crystalGeometry(THREE,{...crystal,shape:{tipRound:1.4,topScale:.55,cornerRadius:1.6}},override);
assert.notDeepEqual(Array.from(meshA.getAttribute('position').array),
 Array.from(meshB.getAttribute('position').array),'Individual shape override changes mesh');
meshA.dispose();meshB.dispose();
const solidMass=validate('solid',settings);
const hollow=validate('hollow',{...settings,hollowCrystals:true});
assert(hollow.volumeMm3<solidMass.volumeMm3,'Hollowing must reduce physical material volume');
console.log('balloon-material-ratio', (hollow.volumeMm3/solidMass.volumeMm3).toFixed(3), 'sealed-voids',hollow.internalCavities);
assert.equal(hollow.disconnected,1,'Hollowing must not fragment a connected base and cluster');
validate('sockets',{...settings,cutSockets:true});
const full=validate('hollow-and-sockets',{...settings,cutSockets:true,hollowCrystals:true});
assert(full.socketsCut>0,'At least one actual socket should be cut');
assert.equal(full.disconnected,1,'Combined hollowing and socket cutting must preserve a connected solid');
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
