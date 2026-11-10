import assert from 'node:assert/strict';
import * as THREE from 'three';
import Module from 'manifold-3d';
import {generateFormation,crystalGeometry,baseGeometry} from '../geometry-v3.js';
import {prepareFabrication,makeCalibrationStrip,splitPreparedMesh,saveSTL,save3MF} from '../fabrication-v1.js';

const wasm=await Module();wasm.setup();
const settings={
  seed:42,count:10,width:95,height:130,pattern:'Central Spire',familyMix:'Quartz',
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
  const base=new THREE.Mesh(baseGeometry(THREE,crystals,s));meshes.push(base);
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
validate('solid',settings);
const hollow=validate('hollow',{...settings,hollowCrystals:true});
assert.equal(hollow.disconnected,1,'Hollowing must not fragment a connected base and cluster');
validate('sockets',{...settings,cutSockets:true});
const full=validate('hollow-and-sockets',{...settings,cutSockets:true,hollowCrystals:true});
assert(full.socketsCut>0,'At least one actual socket should be cut');
assert.equal(full.disconnected,1,'Combined hollowing and socket cutting must preserve a connected solid');
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
