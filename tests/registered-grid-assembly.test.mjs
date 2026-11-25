import assert from 'node:assert/strict';
import * as THREE from 'three';
import {registeredAssemblyPackInputs} from '../src/printing/registered-assembly-pack.js';
import {createRegisteredGridAssembly} from '../src/printing/registered-grid-assembly.js';
import {planBedAwareSplit} from '../src/printing/bed-split.js';
export function verifyRegisteredGridAssembly(wasm){
 const solids=[],hold=v=>(solids.push(v),v);
 const mesh=body=>{const m=body.getMesh();return {points:new Float32Array(m.vertProperties),triangles:new Uint32Array(m.triVerts)};};
 try{
  const cube=hold(wasm.Manifold.cube([100,20,100])),source=mesh(cube);
  const plan=planBedAwareSplit({mesh:source,printerLimit:[65,65,40]});
  assert.equal(plan.pieceCount,4);
  const out=createRegisteredGridAssembly(wasm,source,plan);
  assert.equal(out.parts.length,4);assert.equal(out.joints.length,8);assert.equal(out.pins.length,8);
  assert.equal(out.manifest.physicalFitVerified,false);
  const ids=new Set(out.parts.map(p=>p.id));assert.equal(ids.size,4);
  assert(out.joints.every(j=>j.parts.every(p=>ids.has(p))&&j.pinLength<2*j.depth));
  for(const item of [...out.parts,...out.pins]){
   const m=new wasm.Mesh({numProp:3,vertProperties:item.mesh.points,triVerts:item.mesh.triangles});m.merge();
   const result=hold(new wasm.Manifold(m));assert(!result.isEmpty());assert(result.volume()>0);
   assert(Math.abs(result.volume()-item.volume)<.1);
  }
  assert(out.parts.reduce((v,p)=>v+p.volume,0)<cube.volume(),'Actual socket material removed');
  const pack=registeredAssemblyPackInputs(THREE,out);
  assert.equal(pack.extraFiles.length,12);
  assert.equal(pack.splitManifest.parts.length,4);
  assert.equal(pack.splitManifest.dowels.length,8);
  assert.equal(pack.splitManifest.physicalFitVerified,false);
  assert(pack.splitManifest.joints.every(j=>pack.extraFiles.some(f=>f.path===j.dowelFile)));
  for(const f of pack.extraFiles){
   const dv=new DataView(f.bytes.buffer,f.bytes.byteOffset,f.bytes.byteLength);
   assert.equal(f.bytes.length,84+50*dv.getUint32(80,true));
   assert(dv.getUint32(80,true)>0);
  }
  assert.throws(()=>registeredAssemblyPackInputs(THREE,{...out,pins:out.pins.slice(1)}),/joint|dowel/i);

  const again=createRegisteredGridAssembly(wasm,source,plan);assert.deepEqual(again.joints,out.joints);
  const thin=hold(wasm.Manifold.cube([100,5,100])),thinMesh=mesh(thin);
  assert.throws(()=>createRegisteredGridAssembly(wasm,thinMesh,planBedAwareSplit({mesh:thinMesh,printerLimit:[65,65,40]})),/stock|sockets/);
  const cavity=hold(wasm.Manifold.cube([26,30,100]).translate([37,-5,0]));
  const split=hold(cube.subtract(cavity)),splitMesh=mesh(split);
  assert.throws(()=>createRegisteredGridAssembly(wasm,splitMesh,planBedAwareSplit({mesh:splitMesh,printerLimit:[65,65,40]})),/disconnected/);
  assert.throws(()=>createRegisteredGridAssembly(wasm,source,plan,{clearance:0}),/dimensions/);
  assert.throws(()=>createRegisteredGridAssembly(wasm,source,plan,{maxJointY:4}),/stock/);
  console.log('Registered grid assembly: four closed cells, eight paired bores and separate dowels, deterministic and unsafe stock refused.');
 }finally{for(const s of solids.reverse())s.delete();}
}
