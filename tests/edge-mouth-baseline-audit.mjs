/* Research fixture, NOT a release gate: records the geometry of a top-entry
 * bore cut after positive-stock chamfering. A sharp lip is an observation,
 * not an assertion that the planned follow-up fix has already landed.
 * Run: node tests/edge-mouth-baseline-audit.mjs
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import Module from 'manifold-3d';
import {prepareRecipe} from '../studio-geometry.js';
import {exportMaterialBodies} from '../studio-material-export.js';
import {readBinaryStlTriangles,sliceStlAtZ,radialSectionProfile} from './helpers/print-section-profile.mjs';
import {readCrystal3MfTriangles} from './helpers/three-mf-section-profile.mjs';
const wasm=await Module();wasm.setup();
const finish={enabled:true,style:'Chamfer',scope:'Top edges',amountMm:.5,steps:1};
const cases=[];
for(const enabled of [false,true]){
  // This 8 mm tall block has a real 8 mm through-hole, cut *after*
  // finishing on the base positive stock. It is not a pixel-fit claim.
  const recipe={
    positive:[{kind:'box',size:[30,8,30],position:[0,4,0]}],
    negative:[{kind:'cylinder',radius:4,height:10,position:[0,4,0]}],
    secondary:[],edgeFinish:{...finish,enabled}
  };
  const prepared=prepareRecipe(THREE,wasm,recipe);
  assert(prepared.report.ready&&prepared.bodies[0].volume>0);
  const {stls,threeMF}=exportMaterialBodies(prepared,{name:'top-entry-bore-audit'});
  assert.equal(stls.length,1);
  assert(threeMF.length>100);
  const triangles=readBinaryStlTriangles(stls[0].bytes);
  const sample=z=>radialSectionProfile(sliceStlAtZ(triangles,z),
    {center:[0,0],minRadius:3.75,maxRadius:4.8});
  // Both planes are inside solid material, away from model's top plane
  // and bottom plane, so facets actually cross them.
  const nearTop=sample(7.75),belowLip=sample(6.75);
  const modelTriangles=readCrystal3MfTriangles(threeMF);
  assert.equal(modelTriangles.length,triangles.length,'3MF and STL triangle counts agree');
  const sample3=z=>radialSectionProfile(sliceStlAtZ(modelTriangles,z),
    {center:[0,0],minRadius:3.75,maxRadius:4.8});
  const nearTop3=sample3(7.75),belowLip3=sample3(6.75);
  assert(nearTop?.matchingSegments>=8 && belowLip?.matchingSegments>=8,
    'Must find the actual STL hole wall at both section heights');
  assert(nearTop3?.matchingSegments>=8 && belowLip3?.matchingSegments>=8,
    'Must find the actual 3MF hole wall at both section heights');
  assert(Math.abs(nearTop3.medianRadius-nearTop.medianRadius)<.01 &&
    Math.abs(belowLip3.medianRadius-belowLip.medianRadius)<.01,
    'Independently measured STL and 3MF sections must agree');
  assert(Math.abs(belowLip.medianRadius-4)<.12,'The functional through-bore must retain an 8 mm diameter');
  cases.push({edgeFinishEnabled:enabled,
    topSectionZmm:7.75,deepSectionZmm:6.75,
    topEntryRadiusMm:+nearTop.medianRadius.toFixed(4),
    deepBoreRadiusMm:+belowLip.medianRadius.toFixed(4),
    threeMfTopRadiusMm:+nearTop3.medianRadius.toFixed(4),
    threeMfDeepRadiusMm:+belowLip3.medianRadius.toFixed(4),
    entryExpansionMm:+(nearTop.medianRadius-belowLip.medianRadius).toFixed(4),
    status:nearTop.medianRadius-belowLip.medianRadius>.15?'lead-in-observed':'sharp-lip-observed',
    warnings:prepared.report.warnings||[]});
}
console.log(JSON.stringify({scope:'diagnostic only; not physical verification',cases},null,2));
