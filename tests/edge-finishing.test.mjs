import assert from 'node:assert/strict';
import * as THREE from 'three';
import Module from 'manifold-3d';
import {finishEdgeGeometry,normaliseEdgeFinish} from '../studio-edge-finish.js';
import {generators,applyBuildModules} from '../studio-catalogue.js';
import {recipeGeometry,prepareRecipe} from '../studio-geometry.js';
import {crystalGeometry} from '../geometry-v3.js';
import {exportMaterialBodies} from '../studio-material-export.js';
const wasm=await Module();wasm.setup();
const config={enabled:true,style:'Chamfer',scope:'All exterior',amountMm:.7,steps:1};
assert.throws(()=>normaliseEdgeFinish({...config,scope:'Unsupported'}),/edge group/i);
assert.throws(()=>normaliseEdgeFinish({...config,amountMm:100}),/between/i);
assert.equal(normaliseEdgeFinish().enabled,false);
{
 const part={kind:'box',size:[30,18,24]};
 const plain=recipeGeometry(THREE,part);
 const bevel=recipeGeometry(THREE,{...part,edgeFinish:config});
 assert(bevel.index.count>plain.index.count,'A bevel must add actual surface vertices/triangles');
 const rounded=recipeGeometry(THREE,{...part,edgeFinish:{...config,style:'Rounded',steps:2}});
 assert(rounded.index.count>bevel.index.count,'Rounded mode adds geometric subdivisions');
 for(const geometry of [plain,bevel,rounded]){
  const verts=new Float32Array(geometry.getAttribute('position').array);
  const indices=new Uint32Array(geometry.index?.array||Array.from({length:verts.length/3},(_,i)=>i));
  const mesh=new wasm.Mesh({numProp:3,vertProperties:verts,triVerts:indices});mesh.merge();
  const solid=new wasm.Manifold(mesh);
  try{assert.equal(solid.status(),'NoError','Smoothed cube remains a valid closed Manifold');
   assert(solid.volume()>1000,'Smoothed cube preserves its material body');}finally{solid.delete();}
  geometry.dispose();
 }
}
for(const generator of generators){
 const settings={...generator.defaultParameters,dualMaterial:false};
 // Stable, uncomplicated starting point for each family.
 const recipe=generator.recipe(settings);
 const plain=applyBuildModules(recipe,{},generator.capabilities);
 const decorated=applyBuildModules(recipe,{edgeFinish:config},generator.capabilities);
 assert.deepEqual(decorated.negative,plain.negative,generator.typeId+' cutters are unmodified');
 assert(decorated.positive.length>0&&decorated.positive.every(p=>p.edgeFinish?.enabled));
 const prepared=prepareRecipe(THREE,wasm,decorated);
 assert(prepared.bodies.length>0,generator.typeId+' builds a real Manifold body');
 assert(prepared.bodies.every(b=>b.volume>1&&b.mesh.triVerts.length>=12),
  generator.typeId+' finishes printable mesh rather than just shading');
 const exported=exportMaterialBodies(prepared,{name:'edge-'+generator.typeId});
 assert(exported.stls[0].bytes.length>84&&exported.threeMF.length>100,
  generator.typeId+' exports finished STL and 3MF');
 console.log(generator.typeId+' edge finish: Manifold and STL/3MF OK');
}
for(const family of ['Quartz','Shard','Blade','Cubic','Double terminated','Fantasy']){
 const crystal=crystalGeometry(THREE,{id:'tip-'+family,family,h:85,r:8},
  {bottomScale:1,topScale:.4,tipRound:5,tipLength:.24,cornerRadius:.5,shoulderRound:1,
   roundSteps:3,tipStyle:'Rounded',edgeFinishEnabled:true,edgeFinishStyle:'Rounded',
   edgeFinishScope:'Top edges',edgeFinishAmount:.4,edgeFinishSteps:2});
 const arr=new Float32Array(crystal.getAttribute('position').array);
 const tri=new Uint32Array(crystal.index?.array||Array.from({length:arr.length/3},(_,i)=>i));
 const mesh=new wasm.Mesh({numProp:3,vertProperties:arr,triVerts:tri});mesh.merge();
 const solid=new wasm.Manifold(mesh);
 try{assert.equal(solid.status(),'NoError',family+' edge-finished Crystal Manifold');
 assert(solid.volume()>0);}finally{solid.delete();crystal.dispose();}
}
const stock={positive:[{kind:'box',size:[40,15,40]}],negative:[{kind:'cylinder',radius:4,height:18,position:[0,7.5,0],pixelHole:'P1'}],
 secondary:[],bounds:{width:40,depth:40,height:15}};
const cut=prepareRecipe(THREE,wasm,applyBuildModules(stock,{edgeFinish:config}));
const uncut=prepareRecipe(THREE,wasm,applyBuildModules({...stock,negative:[]},{edgeFinish:config}));
assert(cut.bodies[0].volume<uncut.bodies[0].volume-200,
 'Hardware bore remains an actual negative cut after positive edge finishing');
console.log('Shared edge finishing: six native builders, six Crystal silhouettes, bore preservation and exports passed');
