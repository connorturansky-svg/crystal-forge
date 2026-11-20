import assert from 'node:assert/strict';
import * as THREE from 'three';
import Module from 'manifold-3d';
import {normaliseEdgeFinish} from '../studio-edge-finish.js';
import {generators,applyBuildModules} from '../studio-catalogue.js';
import {prepareRecipe} from '../studio-geometry.js';
import {crystalGeometry} from '../geometry-v3.js';
import {exportMaterialBodies} from '../studio-material-export.js';
const wasm=await Module();wasm.setup();
const config={enabled:true,style:'Chamfer',scope:'Top edges',amountMm:.5,steps:1};
assert.throws(()=>normaliseEdgeFinish({...config,scope:'Unsupported'}),/edge group/i);
assert.throws(()=>normaliseEdgeFinish({...config,amountMm:100}),/between/i);
assert.equal(normaliseEdgeFinish().enabled,false);
{
 const part={kind:'box',size:[30,18,24]},bevelPart={...part,edgeFinish:config};
 const baseline=prepareRecipe(THREE,wasm,{positive:[part],negative:[],secondary:[]});
 const beveled=prepareRecipe(THREE,wasm,{positive:[bevelPart],negative:[],secondary:[]});
 assert(beveled.bodies[0].volume<baseline.bodies[0].volume-1,
  'A safe top chamfer removes material rather than warping mesh vertices');
 assert(beveled.bodies[0].mesh.triVerts.length>baseline.bodies[0].mesh.triVerts.length,
  'Top chamfer must add true sloped faces rather than merely changing shading');
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
// User-reported crinkle regression: 68.5 mm openwork Gear, 12 teeth,
// five spoke windows and an 8 mm shaft bore. Check actual *removed material*
// stays in the upper 0.5 mm and includes outer, spoke AND shaft-bore rims.
{
 const gear=generators.find(g=>g.typeId==='gears');
 const params={...gear.defaultParameters,diameter:68.5,thickness:8,teeth:12,
  spokes:5,bore:8,webStyle:'Legacy',reliefStyle:'None'};
 const originalRecipe=gear.recipe(params);
 const untouched=prepareRecipe(THREE,wasm,applyBuildModules(originalRecipe,{},gear.capabilities));
 const modified=prepareRecipe(THREE,wasm,applyBuildModules(originalRecipe,{edgeFinish:config},gear.capabilities));
 // Consecutive planes expose midpoint distortion even if the result is manifold.
 const mesh=modified.bodies[0].mesh;
 const triangles=[];
 let chamferFaces=0;
 for(let i=0;i<mesh.triVerts.length;i+=3){
  const points=Array.from(mesh.triVerts.slice(i,i+3),id=>Array.from(mesh.vertProperties.slice(id*3,id*3+3)));
  const heights=points.map(p=>p[1]);
  assert(heights.every(y=>[0,7.5,8].some(level=>Math.abs(y-level)<1e-6)),'Gear surfaces occupy only the bottom, bevel shoulder and top planes');
  if(Math.min(...heights)===7.5&&Math.max(...heights)===8){
   const [a,b,c]=points.map(point=>new THREE.Vector3(...point));
   const normal=b.sub(a).cross(c.sub(a)).normalize();
   assert(Math.abs(normal.y-Math.SQRT1_2)<5e-5,'Every sloped face on the gear is a 45-degree top chamfer');
   chamferFaces++;
  }
  triangles.push(points.flatMap(([x,y,z])=>[x,-z,y]));
 }
 assert(chamferFaces>0,'The model has real sloped chamfer faces');
 const {stls:[{bytes}],threeMF}=exportMaterialBodies(modified,{name:'openwork-gear'});
 const stl=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 assert.equal(stl.getUint32(80,true),triangles.length);
 const modelXML=new TextDecoder().decode(threeMF);
 const xmlVertices=Array.from(modelXML.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g),match=>match.slice(1).map(Number));
 const xmlTriangles=Array.from(modelXML.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"\/>/g),
  match=>match.slice(1).flatMap(index=>xmlVertices[Number(index)]));
 assert.equal(xmlTriangles.length,triangles.length,'3MF retains every validated face');
 for(const [i,triangle] of triangles.entries())for(const [j,value] of triangle.entries()){
  assert(stl.getFloat32(96+50*i+4*j,true)===value,'STL matches the prepared geometry');
  assert(xmlTriangles[i][j]===value,'3MF matches the prepared geometry');
 }
 const body=entry=>{
  const mesh=entry.mesh;
  const m=new wasm.Mesh({numProp:3,vertProperties:new Float32Array(mesh.vertProperties),
   triVerts:new Uint32Array(mesh.triVerts)});m.merge();
  return new wasm.Manifold(m);
 };
 const before=body(untouched.bodies[0]),after=body(modified.bodies[0]);
 try{
  assert.equal(before.status(),'NoError');assert.equal(after.status(),'NoError');
  assert(after.volume()<before.volume()-0.5,'Gear has a real material-removing chamfer');
  const removed=before.subtract(after);
  try{
   const limit=removed.boundingBox();
   assert(limit.min[1]>=7.45,'All removed Gear stock is within the upper 0.55 mm; underside and flat stock unmodified');
   const mask=(radius)=>wasm.Manifold.cylinder(1.1,radius,radius,96).rotate([-90,0,0]).translate([0,7.2,0]);
   const nearBore=mask(5).subtract(mask(3));
   const nearWindows=mask(22).subtract(mask(12));
   const nearOutside=mask(35).subtract(mask(31));
   try{
    assert(removed.intersect(nearBore).volume()>.005,'Central bore mouth receives top bevel');
    assert(removed.intersect(nearWindows).volume()>.005,'Spoke window mouths receive top bevel');
    assert(removed.intersect(nearOutside).volume()>.005,'Outer Gear contour receives top bevel');
   }finally{nearBore.delete();nearWindows.delete();nearOutside.delete();}
  }finally{removed.delete();}
 }finally{before.delete();after.delete();}
}
{
 const gear=generators.find(g=>g.typeId==='gears');
 const settings={...gear.defaultParameters,diameter:68.5,teeth:12,spokes:5,bore:8,
  reliefStyle:'Hub collar',dualMaterial:true};
 const recipe=gear.recipe(settings);
 const baseline=prepareRecipe(THREE,wasm,applyBuildModules(recipe,{},gear.capabilities));
 const finished=prepareRecipe(THREE,wasm,applyBuildModules(recipe,{edgeFinish:config},gear.capabilities));
 assert.equal(finished.bodies.length,2);
 const topMesh=finished.bodies[1].mesh;
 const heights=Array.from(topMesh.vertProperties).filter((_,i)=>i%topMesh.numProp===1);
 assert(heights.includes(settings.thickness+settings.reliefHeight-.5),'Raised hub has its own half-millimetre chamfer shoulder');
 assert(finished.bodies[1].volume<baseline.bodies[1].volume-1);
 assert.equal(exportMaterialBodies(finished,{name:'raised-hub'}).stls.length,2);
}
{
 const part={kind:'box',size:[.8,4,12]};
 const recipe={positive:[part],negative:[],secondary:[]};
 const baseline=prepareRecipe(THREE,wasm,recipe);
 const narrow=prepareRecipe(THREE,wasm,{...recipe,edgeFinish:config});
 assert.deepEqual(narrow.bodies[0].mesh.vertProperties,baseline.bodies[0].mesh.vertProperties);
 assert.deepEqual(narrow.bodies[0].mesh.triVerts,baseline.bodies[0].mesh.triVerts);
 assert(narrow.report.warnings.some(message=>message.startsWith('No top rim')));
}
for(const family of ['Quartz','Shard','Blade','Cubic','Double terminated','Fantasy']){
 const crystal=crystalGeometry(THREE,{id:'tip-'+family,family,h:85,r:8},
  {bottomScale:1,topScale:.4,tipRound:5,tipLength:.24,cornerRadius:.5,shoulderRound:1,
   roundSteps:3,tipStyle:'Rounded',edgeFinishEnabled:true,edgeFinishStyle:'Rounded',
   edgeFinishScope:'Top edges',edgeFinishAmount:.4,edgeFinishSteps:2});
 const arr=new Float32Array(crystal.getAttribute('position').array);
 let tip=-Infinity,rim=-Infinity;
 for(let i=0;i<arr.length;i+=3){
  if(Math.hypot(arr[i],arr[i+2])<1e-5)tip=Math.max(tip,arr[i+1]);
  else rim=Math.max(rim,arr[i+1]);
 }
 assert(tip>rim+1e-4,family+' finished rounded Crystal pole must remain above its uppermost ring');
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
