/* QA reference geometry for a 45-degree lead-in, NOT a product feature.
 * Produces an STL/3MF pair with sharp bore and one with a deliberately
 * modeled local conical 0.5 mm lead-in. Uploaded by the isolated QA workflow.
 * This script must not imply the production Build UI already implements it.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import * as THREE from 'three';
import Module from 'manifold-3d';
import {prepareRecipe} from '../studio-geometry.js';
import {exportMaterialBodies} from '../studio-material-export.js';
import {readBinaryStlTriangles,sliceStlAtZ,radialSectionProfile} from './helpers/print-section-profile.mjs';
import {readCrystal3MfTriangles} from './helpers/three-mf-section-profile.mjs';

const wasm=await Module();wasm.setup();
const folder='qa/coupons';
await mkdir(folder,{recursive:true});
const finish={enabled:true,style:'Chamfer',scope:'Top edges',amountMm:.5,steps:1};
const stock={kind:'box',size:[32,8,32],position:[0,4,0]};
const bore={kind:'cylinder',radius:4,height:10,position:[0,4,0]};
const leadIn={kind:'cylinder',radius:4,topRadius:4.6,height:.6,position:[0,7.8,0]};
const results=[];
for(const [label,extra] of [['sharp-reference',[]],['45deg-entry-reference',[leadIn]]]){
 const prep=prepareRecipe(THREE,wasm,{positive:[stock],negative:[bore,...extra],secondary:[],edgeFinish:finish});
 assert(prep.report.ready);
 const output=exportMaterialBodies(prep,{name:'qa-'+label});
 const stl=output.stls[0].bytes,model=output.threeMF;
 const samples={};
 for(const [format,triangles] of Object.entries({
  STL:readBinaryStlTriangles(stl),MF3:readCrystal3MfTriangles(model)})){
  samples[format]={};
  for(const z of [7.99,7.75,7.50,6.75]){
   const profile=radialSectionProfile(sliceStlAtZ(triangles,z),{
    center:[0,0],minRadius:3.75,maxRadius:4.9});
   assert(profile?.matchingSegments>=8,format+' '+label+' no actual wall at z='+z);
   samples[format][z]=+profile.medianRadius.toFixed(4);
  }
  assert(Math.abs(samples[format][6.75]-4)<.06,'8 mm shaft must remain unchanged below lead-in');
 }
 for(const z of [7.99,7.75,7.5,6.75])
  assert(Math.abs(samples.STL[z]-samples.MF3[z])<.01,
   'Both export formats must agree at z='+z);
 if(extra.length){
  for(const [z,expected] of [[7.99,4.49],[7.75,4.25],[7.5,4],[6.75,4]])
   assert(Math.abs(samples.STL[z]-expected)<.07,
    '45-degree lead-in profile must match calculated expected radius at z='+z);
 }else assert(Math.abs(samples.STL[7.75]-samples.STL[6.75])<.02,
   'Sharp reference must preserve plain through-bore');
 await writeFile(folder+'/'+label+'.stl',stl);
 await writeFile(folder+'/'+label+'.3mf',model);
 results.push({label,volumeMm3:prep.bodies[0].volume,measurements:samples,
  filenames:[label+'.stl',label+'.3mf']});
}
assert(results[1].volumeMm3 < results[0].volumeMm3-.1,
 'Lead-in reference must remove additional stock at the entry');
const note=[
 'CRYSTAL FORGE QA REFERENCE — NOT A RELEASED PRODUCT FEATURE',
 'Two small 32 x 32 x 8 mm demonstration pieces with identical outside top chamfers.',
 'Each has an 8 mm vertical bore. The second additionally has a local 0.5 mm',
 '45-degree top-entry lead-in, physically enlarging only the mouth to about 9 mm.',
 'Both STL and 3MF are Z-up and millimetres. Print with settings chosen for your',
 'actual installed printer; check geometry, layers and safety before use.',
 'These coupons do NOT certify audience safety, fastening load or LED retention.',
 'See reference-section-measurements.json for independently decoded export sections.',
 ].join('\n')+'\n';
await writeFile(folder+'/README.txt',note);
await writeFile(folder+'/reference-section-measurements.json',JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify({status:'generated QA printable reference pair; not product functionality',results},null,2));
