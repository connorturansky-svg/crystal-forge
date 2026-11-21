/* Independent export regression on a supported native mounting
 * record. This calls the same build planner as the Studio and final Manifold,
 * STL and 3MF export paths; browser gesture coverage remains separate.
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import Module from 'manifold-3d';
import {applyBuildModules,generators} from '../studio-catalogue.js';
import {prepareRecipe} from '../studio-geometry.js';
import {exportMaterialBodies} from '../studio-material-export.js';
import {readBinaryStlTriangles,sliceStlAtZ,radialSectionProfile} from './helpers/print-section-profile.mjs';
import {readCrystal3MfTriangles} from './helpers/three-mf-section-profile.mjs';

const wasm=await Module();wasm.setup();
const stock={bounds:{width:70,depth:40,height:10},
 positive:[{kind:'box',size:[70,10,40],position:[0,5,0]}],negative:[],
 serialSupport:{outline:[[-35,-20],[35,-20],[35,20],[-35,20]],thickness:10,topY:10}};
const mount={id:'audit-top-m1',x:0,z:0,diameter:8,entryFace:'top',profile:'Through-hole'};
const results=[];
for (const enabled of [false,true]){
 const recipe=applyBuildModules(stock,{manualMountHoles:[mount],
  edgeFinish:{enabled,style:'Chamfer',scope:'Top edges',amountMm:.5,steps:1}});
 const holes=recipe.negative.filter(c=>c.mountId===mount.id);
 assert.equal(holes.length,1,'Native M1 planning must create a genuine through-hole cutter');
 assert.equal(holes[0].radius,4);
 assert.equal(holes[0].mountEntryFace,'top');
 const prepared=prepareRecipe(THREE,wasm,recipe);
 assert.equal(prepared.bodies.length,1);
 const exports=exportMaterialBodies(prepared,{name:'native-m1-top-entry'});
 const formats={STL:readBinaryStlTriangles(exports.stls[0].bytes),MF3:readCrystal3MfTriangles(exports.threeMF)};
 const metrics={};
 for(const [format,triangles] of Object.entries(formats)){
  const sample=z=>radialSectionProfile(sliceStlAtZ(triangles,z),
   {center:[mount.x,-mount.z],minRadius:3.75,maxRadius:4.8});
  const near=sample(9.75),deep=sample(8.75);
  assert(near?.matchingSegments>=8&&deep?.matchingSegments>=8,
   format+': real M1 must expose a measurable cut wall at both depths');
  assert(Math.abs(deep.medianRadius-4)<.12,format+': functional 8 mm through-bore unchanged');
  for(const [height,radius] of [[9.99,enabled?4.49:4],[9.75,enabled?4.25:4],[9.5,4],[.5,4]]){
   assert(Math.abs(sample(height)?.medianRadius-radius)<.015,format+': unexpected M1 radius at '+height);
  }
  metrics[format]={nearTopRadiusMm:+near.medianRadius.toFixed(4),
   deepRadiusMm:+deep.medianRadius.toFixed(4),
   expansionMm:+(near.medianRadius-deep.medianRadius).toFixed(4)};
 }
 assert(Math.abs(metrics.STL.nearTopRadiusMm-metrics.MF3.nearTopRadiusMm)<.01);
 assert(Math.abs(metrics.STL.deepRadiusMm-metrics.MF3.deepRadiusMm)<.01);
 results.push({finishEnabled:enabled,manualMountId:mount.id,
  stockTopZmm:10,preparedVolumeMm3:prepared.bodies[0].volume,
  measured:metrics,
  outcome:metrics.STL.expansionMm>.15?'top-entry-lead-in-observed':'top-entry-sharp-lip-observed',
  warnings:prepared.report.warnings});
}
assert(results[1].preparedVolumeMm3<results[0].preparedVolumeMm3-.1,
 'The chamfer toggle should remove material');
console.log(JSON.stringify({fixture:'real native manual top-entry through-hole M1',status:'passed',
 results},null,2));

for(const protectedMount of [
 {...mount,entryFace:'underside'},
 ...['Counterbore','Countersink','Magnet pocket','Threaded insert pilot'].map(profile=>({...mount,profile}))
]){
 const recipe=applyBuildModules(stock,{manualMountHoles:[protectedMount],edgeFinish:{enabled:true}});
 assert(recipe.negative.length);
 assert(recipe.negative.every(cut=>!cut.finishTopMouth),protectedMount.profile+' retains its specified entry');
 const prepared=prepareRecipe(THREE,wasm,recipe);
 assert(exportMaterialBodies(prepared).stls[0].bytes.length>84);
}

for(const generator of generators){
 const parameters={...generator.defaultParameters,dualMaterial:false};
 if(generator.typeId==='control-caps')Object.assign(parameters,{top:'Flat',shaft:0,symbol:'None'});
 const model=generator.recipe(parameters);
 for(const enabled of [false,true]){
  const recipe=applyBuildModules(model,{pixelBacking:true,backingTabs:[{u:.13}],
   edgeFinish:{enabled,amountMm:.3}},generator.capabilities);
  const tab=recipe.negative.find(cut=>cut.tabHole);
  assert(tab?.finishTopMouth,generator.typeId+' has a plain tab through-hole');
  const [x,,z]=tab.position;
  const prepared=prepareRecipe(THREE,wasm,recipe);
  const {stls,threeMF}=exportMaterialBodies(prepared);
  for(const triangles of [readBinaryStlTriangles(stls[0].bytes),readCrystal3MfTriangles(threeMF)]){
   for(const [height,expansion] of [[3.85,enabled?.15:0],[3.5,0],[.5,0]]){
    const section=radialSectionProfile(sliceStlAtZ(triangles,height),
     {center:[x,-z],minRadius:tab.radius-.1,maxRadius:tab.radius+.35});
    assert(Math.abs(section?.medianRadius-tab.radius-expansion)<.015,
     generator.typeId+' tab bore section at '+height+' mm');
   }
  }
 }
 console.error(generator.typeId+' through-tab: STL/3MF chamfer and bore dimensions passed');
}
