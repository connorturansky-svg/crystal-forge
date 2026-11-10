// Representative timing smoke: figures are environment-specific, NOT proof
// that the app remains responsive in a browser or prints without support.
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import * as THREE from 'three';
import Module from 'manifold-3d';
import {generateFormation,crystalGeometry,crystalOrientation,baseGeometry,crystalRootOffset} from '../geometry-v3.js';
import {setThreeInstance,prepareFabrication} from '../fabrication-v1.js';
setThreeInstance(THREE);
const settings={
 seed:42,count:12,width:105,height:145,pattern:'Central Spire',
 spacing:42,leanMode:'Radial outward',leanAmount:35,angleRandomness:20,
 familyMix:'Quartz',bottomScale:1,topScale:.8,cornerRadius:.7,
 shoulderRound:0,tipRound:3.5,tipLength:.27,roundSteps:3,
 baseType:'integrated',baseStyle:'Fitted',baseHeight:25,baseDome:10,
 baseWidth:6,baseEdgeRadius:2,undersideAccess:false,
 pixelCount:1,lightingMode:'single',pixelDiameter:12,pixelFit:.15,
 cutSockets:true,hollowCrystals:false,wallThickness:1.2,baseVault:false,
 vaultSupportPitch:25,mount:'None',overhang:45,printer:'Ultimaker 3 Extended'
};
const loadStart=performance.now();
const wasm=await Module();wasm.setup();
const initMs=performance.now()-loadStart;
function assembly(cfg){
 const crystals=generateFormation(cfg),meshes=[];
 for(const c of crystals){
  const mesh=new THREE.Mesh(crystalGeometry(THREE,c,cfg));
  mesh.position.set(c.x,c.y+crystalRootOffset(crystals,cfg,c,THREE),c.z);
  mesh.quaternion.copy(crystalOrientation(THREE,c));
  mesh.scale.set(c.sx||1,c.sy||1,c.sz||1);
  mesh.userData.crystalId=c.id;
  meshes.push(mesh);
 }
 const base=new THREE.Mesh(baseGeometry(THREE,crystals,cfg));
 base.userData.isBase=true;meshes.push(base);
 return {meshes,crystals};
}
function measure(label,overrides={}){
 const cfg={...settings,...overrides},generationStart=performance.now();
 const {meshes,crystals}=assembly(cfg);
 const generationMs=performance.now()-generationStart;
 const prepStart=performance.now();
 const result=prepareFabrication({wasm,meshes,crystals,settings:cfg});
 const preparationMs=performance.now()-prepStart;
 try{
  assert(result.report.ready,'Manifold preparation returned ready');
  assert.equal(result.report.disconnected,1,'Manufacturing produced one connected body');
  assert.equal(result.report.internalCavities,0,'No sealed internal voids in benchmark case');
  if(cfg.baseVault)assert(result.report.vault.applied,'Requested vault must be cut');
  const row={case:label,crystals:cfg.count,geometryMs:Math.round(generationMs),
   preparationMs:Math.round(preparationMs),triangles:result.report.triangleCount,
   vaultColumns:result.report.vault?.supportCount||0};
  const budget=Number(process.env.CRYSTAL_FORGE_MAX_PREP_MS||0);
  if(budget>0)assert(preparationMs<=budget,label+' exceeded '+budget+'ms performance budget');
  console.log(JSON.stringify(row));
  return row;
 }finally{
  result.geometry.dispose();
  for(const m of meshes)m.geometry.dispose();
 }
}
const normal=measure('cura-first-solid');
const vaulted=measure('zero-infill-vault',{baseVault:true});
console.log(JSON.stringify({result:'BENCHMARK COMPLETED',wasmInitMs:Math.round(initMs),
 ratio:vaulted.preparationMs/Math.max(1,normal.preparationMs),
 maxPrepMs:process.env.CRYSTAL_FORGE_MAX_PREP_MS||'not enforced',
 note:'For relative comparisons only; repeat on same machine. Not a slicer/physical print test.'}));
