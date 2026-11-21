/* Independent, non-gating reproduction on an actually supported native mounting
 * record. This calls the same build planner as the Studio and final Manifold,
 * STL and 3MF export paths; browser gesture coverage remains separate.
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import Module from 'manifold-3d';
import {applyBuildModules} from '../studio-catalogue.js';
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
 'The chamfer toggle should change positive exterior stock even when M1 top entry remains sharp');
console.log(JSON.stringify({fixture:'real native manual top-entry through-hole M1',status:'diagnostic only',
 results},null,2));
