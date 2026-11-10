import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import {setThreeInstance,loadManifold,prepareFabrication} from './fabrication-v1.js';
setThreeInstance(THREE);
let busy=false;
self.onmessage=async(event)=>{
 const data=event.data;if(data?.type!=='prepare'||busy)return;
 busy=true;
 const started=performance.now();
 try{
  self.postMessage({type:'progress',stage:'Loading background fabrication engine…'});
  const wasm=await loadManifold();
  self.postMessage({type:'progress',stage:'Merging crystals, cutting shared chamber and hardware…'});
  await new Promise(resolve=>setTimeout(resolve,10));
  const objects=data.components.map(input=>{
   const geom=new THREE.BufferGeometry();
   geom.setAttribute('position',new THREE.BufferAttribute(new Float32Array(input.positions),3));
   const mesh=new THREE.Mesh(geom);
   mesh.position.fromArray(input.position);
   mesh.quaternion.fromArray(input.quaternion);
   mesh.scale.fromArray(input.scale);
   mesh.userData=input.userData||{};
   return mesh;
  });
  const result=prepareFabrication({wasm,meshes:objects,crystals:data.crystals,settings:data.settings});
  for(const obj of objects)obj.geometry.dispose();
  const positions=new Float32Array(result.geometry.getAttribute('position').array);
  result.geometry.dispose();
  const report=result.report;
  report.preparationMs=Math.round(performance.now()-started);
  self.postMessage({type:'complete',positions,report},
   [positions.buffer,report.mesh.points.buffer,report.mesh.triangles.buffer]);
 }catch(error){
  self.postMessage({type:'error',message:error?.stack||error?.message||String(error)});
 }finally{busy=false}
};