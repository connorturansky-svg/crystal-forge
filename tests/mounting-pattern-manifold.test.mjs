import assert from 'node:assert/strict';
import * as THREE from 'three';
import Module from 'manifold-3d';
import {patternMountTransaction} from '../mounting-pattern.js';
import {applyBuildModules} from '../studio-catalogue.js';
import {MAX_NATIVE_MOUNTS,patternMountIssues} from '../studio-mount-builder.js';
import {prepareRecipe} from '../studio-geometry.js';
import {exportMaterialBodies} from '../studio-material-export.js';
import {readBinaryStlTriangles,sliceStlAtZ,radialSectionProfile} from './helpers/print-section-profile.mjs';
import {readCrystal3MfTriangles} from './helpers/three-mf-section-profile.mjs';

const outline=[[-55,-50],[55,-50],[55,50],[-55,50]];
const stock={bounds:{width:110,depth:100,height:8},
 positive:[{kind:'box',size:[110,8,100],position:[0,4,0]}],negative:[],
 serialSupport:{outline,thickness:8,topY:8}};
const input={footprint:outline,limit:MAX_NATIVE_MOUNTS,
 pattern:{id:'sensor-ring',kind:'circle',count:8,radiusMm:30,startAngleDeg:22.5,
  alignment:'custom',offsetX:7,offsetZ:-4},
 fixing:{profile:'Magnet pocket',entryFace:'underside',diameter:6,recessDiameter:6,recessDepth:3}};
const transaction=patternMountTransaction(input);
assert.deepEqual(patternMountIssues(stock,transaction),Array(8).fill(null));
const blocked=patternMountTransaction({...input,pattern:{...input.pattern,radiusMm:55}});
assert(patternMountIssues(stock,blocked).some(Boolean));
const crowded=patternMountTransaction({...input,pattern:{...input.pattern,radiusMm:4}});
assert(patternMountIssues(stock,crowded).every(Boolean));
const recipe=applyBuildModules(stock,{manualMountHoles:transaction.mounts});
assert.equal(recipe.negative.filter(cut=>cut.manualMountRecess).length,8);
const wasm=await Module();wasm.setup();
const prepared=prepareRecipe(THREE,wasm,recipe);
assert.equal(prepared.bodies.length,1);
const {stls,threeMF}=exportMaterialBodies(prepared,{name:'wt022-magnet-ring'});
for(const triangles of [readBinaryStlTriangles(stls[0].bytes),readCrystal3MfTriangles(threeMF)]){
 const bottom=sliceStlAtZ(triangles,.5),pocket=sliceStlAtZ(triangles,2.99),roof=sliceStlAtZ(triangles,3.01);
 for(const {x,z} of transaction.candidates){
  const section={center:[x,-z],minRadius:2.8,maxRadius:3.2};
  for(const slice of [bottom,pocket]){
   const measure=radialSectionProfile(slice,section);
   assert(measure?.matchingSegments>24&&Math.abs(measure.medianRadius-3)<.01);
  }
  assert(!radialSectionProfile(roof,section)?.matchingSegments,'Magnet pocket must retain its blind floor');
 }
}
console.log('WT-022 native eight-pocket ring: Manifold, STL/3MF centres and section depth passed');
