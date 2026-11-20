import assert from 'node:assert/strict';
import Module from 'manifold-3d';
import {prepareTile} from '../tactile-tile-generator.js';
import {exportMaterialBodies} from '../studio-material-export.js';
function unzipStored(bytes){
 const files=new Map(), view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 let at=0;
 while(at+30<=bytes.length && view.getUint32(at,true)===0x04034b50){
  assert.equal(view.getUint16(at+8,true),0);
  const size=view.getUint32(at+18,true),nameLength=view.getUint16(at+26,true),extra=view.getUint16(at+28,true);
  const name=new TextDecoder().decode(bytes.subarray(at+30,at+30+nameLength));
  const start=at+30+nameLength+extra,data=bytes.subarray(start,start+size);
  let crc=0xffffffff;
  for(const b of data){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  assert.equal((crc^0xffffffff)>>>0,view.getUint32(at+14,true));
  assert.equal(data.length,size);files.set(name,data);at=start+size;
 }
 assert.equal(view.getUint32(at,true),0x02014b50);
 assert.equal(view.getUint32(bytes.length-22,true),0x06054b50);
 assert.equal(view.getUint16(bytes.length-12,true),files.size);
 return files;
}
const wasm=await Module();wasm.setup();
for(const pattern of ['grass','wool','river','mineral','rain','dots']){
 const result=prepareTile({pattern,dualMaterial:true},{wasm,resolution:{rings:12,segments:48}});
 const exported=exportMaterialBodies(result,{name:'Tile & relief'});
 assert.equal(exported.stls.length,2);
 for(const stl of exported.stls){
  const view=new DataView(stl.bytes.buffer);
  assert.equal(stl.bytes.length,84+view.getUint32(80,true)*50);
 }
 const files=unzipStored(exported.threeMF);
 const model=new TextDecoder().decode(files.get('3D/3dmodel.model'));
 assert.equal((model.match(/<object /g)||[]).length,3);
 assert.match(model,/<object id="4" type="model"><components><component objectid="2"\/><component objectid="3"\/><\/components><\/object>/);
 assert.match(model,/<build><item objectid="4" transform="1 0 0 0 1 0 0 0 1 0 0 0"\/><\/build>/);
 assert(model.includes('Tile &amp; relief'));
 const metadata=JSON.parse(new TextDecoder().decode(files.get('Metadata/material-roles.json')));
 assert.deepEqual(metadata.materials.map(m=>[m.role,m.requestedExtruder]),[['primary',0],['secondary',1]]);
 assert.deepEqual(metadata.materials.map(m=>m.objectId),[2,3]);
 assert.equal(metadata.curaExtruderAssignmentVerified,false);
 assert.throws(()=>exportMaterialBodies(result,{extruders:{primary:0,secondary:0}}));
 assert.equal(result.bodies.length,2);
 assert.deepEqual(result.bodies.map(b=>b.role),['primary','secondary']);
 for(const body of result.bodies){
  assert(body.volume>0);assert(body.mesh.triVerts.length>0);
  const solid=new wasm.Manifold(body.mesh);
  try {
   assert.equal(solid.status(),'NoError');
   const parts=solid.decompose();
   try {assert.equal(parts.length,1);}
   finally {for(const part of parts)part.delete();}
  }finally {solid.delete();}
 }
 const single=prepareTile({pattern},{wasm,resolution:{rings:12,segments:48}});
 assert.equal(single.bodies.length,1);
 assert.equal(exportMaterialBodies(single).stls.length,1);
 const paired=result.bodies.reduce((sum,b)=>sum+b.volume,0);
 assert(Math.abs(paired-single.bodies[0].volume)<.1);
}
console.log('Real Manifold tactile tests passed: six patterns, connected bodies and non-overlapping dual material.');
