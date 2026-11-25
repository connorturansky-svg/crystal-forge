import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import {setThreeInstance,loadManifold} from '../../fabrication-v1.js';
import {createRegisteredGridAssembly} from './registered-grid-assembly.js';
import {registeredAssemblyPackInputs} from './registered-assembly-pack.js';
setThreeInstance(THREE);
self.onmessage=async({data})=>{
 try{
  const wasm=await loadManifold();
  const result=registeredAssemblyPackInputs(THREE,createRegisteredGridAssembly(wasm,data.mesh,data.plan,data.options));
  self.postMessage({result},result.extraFiles.map(item=>item.bytes.buffer));
 }catch(error){self.postMessage({error:error.message||String(error)});}
};
