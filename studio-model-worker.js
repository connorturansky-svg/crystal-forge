import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import {studioGenerators,applyBuildModules} from './studio-catalogue.js';
import {prepareRecipe} from './studio-geometry.js';
import {loadManifold,setThreeInstance,prepareFabrication} from './fabrication-v1.js';
import {crystalGeometry,baseGeometry,baseAccentSpecs,baseSurfaceHeight,crystalRootOffset,crystalOrientation} from './geometry-v3.js';
setThreeInstance(THREE);
export function crystalComponents(model){
 const s=model.parameters,crystals=model.editableState.crystals||[],meshes=[];
 for(const c of crystals.filter(c=>!c.hidden)){
  const mesh=new THREE.Mesh(crystalGeometry(THREE,c,s));mesh.position.set(c.x,c.y+crystalRootOffset(crystals,s,c,THREE),c.z);
  mesh.quaternion.copy(crystalOrientation(THREE,c));mesh.scale.set(c.sx||c.scale||1,c.sy||c.scale||1,c.sz||c.scale||1);mesh.userData.crystalId=c.id;meshes.push(mesh);
 }
 if(s.baseType!=='none'){
  const base=new THREE.Mesh(baseGeometry(THREE,crystals,s));base.userData.isBase=true;meshes.push(base);
  for(const c of baseAccentSpecs(crystals,s)){const mesh=new THREE.Mesh(crystalGeometry(THREE,c,s));mesh.position.set(c.x,baseSurfaceHeight(crystals,s,c.x,c.z)-3,c.z);mesh.rotation.y=c.rotation;mesh.userData.isBaseAccent=true;meshes.push(mesh);}
 }
 return meshes;
}
self.onmessage=async({data})=>{
 const {ticket}=data;
 const progress=stage=>self.postMessage({type:'progress',ticket,stage});
 try{
  progress('Loading the fabrication engine');const wasm=await loadManifold();let prepared;
  if(ticket.model.generator.typeId==='crystals'){
   const meshes=crystalComponents(ticket.model);
   try{
    const settings={...ticket.model.parameters,...ticket.printer};
    const result=prepareFabrication({wasm,meshes,crystals:ticket.model.editableState.crystals,settings,onProgress:progress});
    result.report.lightPassageInspection.modelRevision=ticket.model.revision;
    const mesh=result.report.mesh;let volume=0;
    for(let i=0;i<mesh.triangles.length;i+=3){const [a,b,c]=[mesh.triangles[i],mesh.triangles[i+1],mesh.triangles[i+2]].map(n=>n*3),p=mesh.points;volume+=(p[a]*(p[b+1]*p[c+2]-p[b+2]*p[c+1])+p[a+1]*(p[b+2]*p[c]-p[b]*p[c+2])+p[a+2]*(p[b]*p[c+1]-p[b+1]*p[c]))/6;}
    prepared={report:{...result.report,engine:'Manifold',coordinateFrame:'Y-up'},bodies:[{role:'primary',volume:Math.abs(volume),mesh}]};result.geometry.dispose();
   }finally{for(const mesh of meshes){mesh.geometry.dispose();mesh.material.dispose();}}
  }else{
   const generator=studioGenerators.find(g=>g.typeId===ticket.model.generator.typeId);if(!generator)throw Error('Generator is unavailable.');
   const recipe=applyBuildModules(generator.recipe(ticket.model.parameters),ticket.model.build,generator.capabilities);
   prepared=prepareRecipe(THREE,wasm,recipe,{onProgress:progress});
  }
  self.postMessage({type:'complete',ticket,prepared});
 }catch(error){self.postMessage({type:'error',ticket,message:error.message});}
};
