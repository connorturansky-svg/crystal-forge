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
import {baseGeometry,generateFormation,crystalGeometry,crystalOrientation,crystalRootOffset} from '../geometry-v3.js';
import {hardwareFootprint,planHardware,mountingProfile} from '../hardware-layout.js';
import {encodeSTL,prepareFabrication,setThreeInstance} from '../fabrication-v1.js';

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

setThreeInstance(THREE);
const settings={seed:42,count:5,width:100,height:90,pattern:'Central Spire',familyMix:'Quartz',
 bottomScale:1,topScale:.8,cornerRadius:.7,shoulderRound:0,tipFlat:.25,tipLength:.27,roundSteps:3,
 wallThickness:1.2,pixelDiameter:12,pixelFit:.1,overhang:45,
 baseType:'integrated',baseStyle:'Square',baseWidth:42,baseHeight:15,baseDome:0,
 cutSockets:false,lightingMode:'none',mount:'Magnet inserts',mountPlacement:'manual'};
const crystals=generateFormation(settings);
const {preset,diameter,depth}=mountingProfile(settings);
const crystalTransaction=patternMountTransaction({...input,limit:20,
 footprint:hardwareFootprint(crystals,settings).map(({x,z})=>[x,z]),
 fixing:{crystalFixing:{profile:preset,diameter,depth,blind:true}}});
settings.manualMountHoles=crystalTransaction.mounts;
settings.mountingPatterns=crystalTransaction.patterns;
assert.equal(planHardware(crystals,settings).mounts.length,8);
const base=new THREE.Mesh(baseGeometry(THREE,crystals,settings));base.userData.isBase=true;
const meshes=[base,...crystals.map(c=>{
 const mesh=new THREE.Mesh(crystalGeometry(THREE,c,settings));
 mesh.position.set(c.x,c.y+crystalRootOffset(crystals,settings,c,THREE),c.z);
 mesh.quaternion.copy(crystalOrientation(THREE,c));
 mesh.scale.set(c.sx||c.scale||1,c.sy||c.scale||1,c.sz||c.scale||1);
 mesh.userData.crystalId=c.id;
 return mesh;
})];
const crystal=prepareFabrication({wasm,meshes,crystals,settings});
assert.equal(crystal.report.mountingHolesCut,8);
const {points,triangles}=crystal.report.mesh;
const files=exportMaterialBodies({report:{ready:true,engine:'Manifold',coordinateFrame:'Y-up'},
 bodies:[{role:'primary',volume:crystal.report.volumeMm3,mesh:{numProp:3,vertProperties:points,triVerts:triangles}}]});
for(const triangles of [readBinaryStlTriangles(encodeSTL(crystal.geometry)),readCrystal3MfTriangles(files.threeMF)]){
 const pocket=sliceStlAtZ(triangles,depth-.01),roof=sliceStlAtZ(triangles,depth+.01);
 for(const {x,z} of crystalTransaction.candidates){
  const section={center:[x,-z],minRadius:diameter/2-.1,maxRadius:diameter/2+.1};
  const measure=radialSectionProfile(pocket,section);
  assert(measure?.matchingSegments>=32&&Math.abs(measure.medianRadius-diameter/2)<.03);
  assert(!radialSectionProfile(roof,section)?.matchingSegments);
 }
}
crystal.geometry.dispose();
meshes.forEach(mesh=>mesh.geometry.dispose());
console.log('WT-022 Crystal eight-pocket ring: Manifold, STL/3MF centres and section depth passed');
