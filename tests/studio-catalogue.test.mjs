import {pixelBoreIssue} from '../studio-pixel-bore-validation.js';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import Module from 'manifold-3d';
import {waveGenerator,tileGenerator,gearGenerator,capGenerator,characterGenerator,pebbleGenerator,generators,applyBuildModules} from '../studio-catalogue.js';
import {findPixelPosition,newPixel} from '../studio-pixel-builder.js';
import {previewRecipe,disposeGroup,prepareRecipe} from '../studio-geometry.js';
import {exportMaterialBodies} from '../studio-material-export.js';
const wasm=await Module();wasm.setup();
const joystick=capGenerator.presets.find(preset=>preset.id==='joystick');
assert.equal(joystick.parameters.controlStyle,'Thumb joystick');
for(const dualMaterial of [false,true]){
 const prepared=prepareRecipe(THREE,wasm,capGenerator.recipe({...joystick.parameters,dualMaterial}));
 const exported=exportMaterialBodies(prepared,{name:'thumb-joystick-regression'});
 assert.equal(exported.stls.length,dualMaterial?2:1);
 assert(exported.threeMF.length>100);
}
const indicator=capGenerator.presets.find(preset=>preset.id==='indicator');
const lens=prepareRecipe(THREE,wasm,capGenerator.recipe({...indicator.parameters,dualMaterial:false}));
const splitLens=prepareRecipe(THREE,wasm,capGenerator.recipe({...indicator.parameters,dualMaterial:true}));
assert.deepEqual(splitLens.bodies.map(body=>body.role),['primary','secondary']);
assert(Math.abs(splitLens.bodies.reduce((volume,body)=>volume+body.volume,0)-lens.bodies[0].volume)<1e-4,
 'The indicator material split must preserve the lens volume.');
assert.equal(exportMaterialBodies(splitLens,{name:'indicator-lens-regression'}).stls.length,2);
console.log('Indicator lens regression: connected material bodies, conserved volume and STL export passed.');
const river=pebbleGenerator.presets.find(preset=>preset.id==='river');
const riverSingle=prepareRecipe(THREE,wasm,pebbleGenerator.recipe({...river.parameters,dualMaterial:false}));
const riverDual=prepareRecipe(THREE,wasm,pebbleGenerator.recipe({...river.parameters,dualMaterial:true}));
assert.equal(exportMaterialBodies(riverDual,{name:'river-pod-regression'}).stls.length,2);
assert(Math.abs(riverDual.bodies.reduce((volume,body)=>volume+body.volume,0)-riverSingle.bodies[0].volume)<1e-4);
console.log('River pod regression: connected material bodies, conserved volume and STL export passed.');
const creativeGearIds=['crown-open','turbine','petal-web','scallop-lace','solid-crown','rail-pulley'];
const gearSignatures=new Set();
for(const id of creativeGearIds){
 const preset=gearGenerator.presets.find(item=>item.id===id);
 assert(preset,'Missing creative gear '+id);
 const recipe=gearGenerator.recipe(preset.parameters);
 gearSignatures.add(JSON.stringify(recipe.positive));
}
assert.equal(gearSignatures.size,creativeGearIds.length);
const turbine=gearGenerator.presets.find(item=>item.id==='turbine').parameters;
const sweeping=gearGenerator.recipe(turbine);
assert.notDeepEqual(gearGenerator.recipe({...turbine,webStyle:'Solid'}).positive,sweeping.positive);
assert.notDeepEqual(gearGenerator.recipe({...turbine,wheelStyle:'Crown'}).positive,sweeping.positive);
assert.notDeepEqual(gearGenerator.recipe({...turbine,reliefHeight:4}).positive,sweeping.positive);
for(const diameter of [100,110]){
 const parameters={...turbine,diameter,dualMaterial:false};
 const uncut=gearGenerator.recipe(parameters);
 const hole=findPixelPosition(uncut,[]);
 assert(hole,'Openwork turbine needs a printable pixel position.');
 assert.notDeepEqual([hole.x,hole.z],[diameter*.23,0],'The original candidate was in the window.');
 if(diameter===100){
  const misplaced={...hole,x:23,z:0};
  assert.throws(()=>prepareRecipe(THREE,wasm,applyBuildModules(uncut,{pixelHoles:[misplaced]},gearGenerator.capabilities)),
   /does not cut the model/, 'The reviewed placement must still fail fabrication.');
 }
 const cut=prepareRecipe(THREE,wasm,applyBuildModules(uncut,{pixelHoles:[hole]},gearGenerator.capabilities));
 const original=prepareRecipe(THREE,wasm,uncut);
 assert(original.bodies[0].volume-cut.bodies[0].volume>1);
 assert.equal(exportMaterialBodies(cut).stls.length,1);
}
for(const id of ['turbine','crown-open']){
 const p=gearGenerator.presets.find(item=>item.id===id).parameters;
 for(const thickness of [p.thickness,11]){
  const recipe=gearGenerator.recipe({...p,thickness,dualMaterial:true});
  const preview=previewRecipe(THREE,recipe);
  const face=preview.children.find(mesh=>mesh.userData.materialRole==='secondary');
  assert.equal(face.material.clippingPlanes[0].distanceToPoint(new THREE.Vector3(0,recipe.materialSplitHeight,0)),0);
  assert(face.material.clippingPlanes[0].distanceToPoint(new THREE.Vector3(0,thickness,0))>0);
  disposeGroup(preview);
  const result=prepareRecipe(THREE,wasm,recipe);
  for(const body of result.bodies){
   const positions=body.mesh.vertProperties??body.mesh.points,stride=body.mesh.numProp??3;
   for(let i=1;i<positions.length;i+=stride){
    if(body.role==='secondary')assert(positions[i]>=recipe.materialSplitHeight-1e-5);
    else assert(positions[i]<=recipe.materialSplitHeight+1e-5);
   }
  }
  const output=exportMaterialBodies(result);
  assert.equal(output.stls.length,2);
  assert(output.threeMF.length>100);
 }
}
for(const [generator,ids] of [[waveGenerator,['river','rings','eddy','saddle','dune']],[tileGenerator,['grass','basket','pebbles','scales']]]){
 const signatures=ids.map(id=>{
  const preset=generator.presets.find(item=>item.id===id);
  assert(preset,id);
  const {points}=generator.recipe(preset.parameters).positive[0].mesh;
  return JSON.stringify(Array.from(points).filter((_,index)=>index%93===1));
 });
 assert.equal(new Set(signatures).size,ids.length);
}
const presetParameters=(family,id)=>family.presets.find(preset=>preset.id===id).parameters;
const legacyKnob=presetParameters(capGenerator,'knob');
const rotaryDish=capGenerator.recipe({...legacyKnob,rotaryTop:'Dish',rotaryMark:'Recessed pointer'});
assert.equal(rotaryDish.positive[0].kind,'mesh');
assert.deepEqual(rotaryDish.negative.at(-1),capGenerator.recipe(legacyKnob).negative.at(-1),
 'The new face retains the measured socket cutter.');
const lantern=presetParameters(pebbleGenerator,'lantern');
const unlitLantern=prepareRecipe(THREE,wasm,pebbleGenerator.recipe({...lantern,illuminated:false}));
const litLantern=prepareRecipe(THREE,wasm,pebbleGenerator.recipe(lantern));
assert(unlitLantern.bodies[0].volume-litLantern.bodies[0].volume>100,'Lantern subtracts a real internal cavity.');

for(const generator of generators){
 assert(generator.presets.length>=3,generator.displayName+' requires three meaningful presets.');
 for(const preset of generator.presets){
  for(const dualMaterial of [false,true]){
   const p={...preset.parameters,dualMaterial};
   const recipe=applyBuildModules(generator.recipe(p),{},generator.capabilities);
   const again=applyBuildModules(generator.recipe(p),{},generator.capabilities);
   assert.deepEqual(recipe,again,'Deterministic '+generator.typeId+'/'+preset.id);
   const result=prepareRecipe(THREE,wasm,recipe);
   assert(result.report.ready);assert.equal(result.bodies.length,dualMaterial?2:1);
   const output=exportMaterialBodies(result,{name:preset.name});assert(output.threeMF.length>100);assert.equal(output.stls.length,result.bodies.length);
   console.log(generator.typeId+'/'+preset.id+' '+(dualMaterial?'dual':'single')+' passed');
  }
 }
}
console.log('All six new generators: real Manifold, connected material bodies and manufacturing exports passed.');

const symbolOptions=capGenerator.parameterSchema.find(field=>field.key==='symbol').options;
for(const id of ['knob','selector']){
 const preset=capGenerator.presets.find(item=>item.id===id);
 const symbols=new Set();
 for(const symbol of symbolOptions){
  const recipe=capGenerator.recipe({...preset.parameters,symbol,dualMaterial:true});
  symbols.add(JSON.stringify(recipe.secondary));
  assert.equal(prepareRecipe(THREE,wasm,recipe).bodies.length,2,id+'/'+symbol);
 }
 assert.equal(symbols.size,symbolOptions.length,'Every '+id+' symbol has distinct geometry');
}

// Append to tests/studio-catalogue.test.mjs and import pixelBoreIssue from
// ../studio-pixel-bore-validation.js. Runs with the existing Manifold setup.
{
 const newBore={id:'fixture-pixel',x:10.7,z:9.4,profileId:'seed',diameter:5,clearance:.3};
 const tactile=tileGenerator.recipe({outline:'circle',dualMaterial:true});
 const wave=waveGenerator.recipe({flowStyle:'Saddle',dualMaterial:true});
 assert.match(pixelBoreIssue(tactile,{...newBore,x:32,z:32}),/continuous solid material/, 'Bounds corners are outside the real disc.');
 assert.match(pixelBoreIssue(tactile,newBore,[{...newBore,id:'other-pixel'}]),/another pixel/);
 assert.match(pixelBoreIssue(wave,{...newBore,x:54}),/model edge/);
 assert.match(pixelBoreIssue(gearGenerator.recipe(turbine),{...newBore,x:23,z:0}),/continuous solid material/);
 assert.match(pixelBoreIssue(pebbleGenerator.recipe({...river.parameters,illuminated:false}),{
  ...newBore,x:0,z:0
 }),/cavity/);
 const mounted=applyBuildModules(wave,{mounting:true,spacing:35,mountStyle:'Underside counterbores'},waveGenerator.capabilities);
 assert.match(pixelBoreIssue(mounted,{...newBore,x:21,z:0}),/existing cut/, 'Preserve web around the larger counterbore.');
 const thin={positive:[{kind:'box',size:[30,1,30]}],negative:[],bounds:{width:30,depth:30,height:1}};
 assert.match(pixelBoreIssue(thin,newBore),/continuous solid material/);
 for(const [recipe,capabilities] of [[tactile,tileGenerator.capabilities],[wave,waveGenerator.capabilities]]){
  assert.equal(pixelBoreIssue(recipe,newBore),null);
  const cutRecipe=applyBuildModules(recipe,{pixelHoles:[newBore]},capabilities);
  const manufactured=prepareRecipe(THREE,wasm,cutRecipe);
  const nominal=(newBore.diameter+newBore.clearance)/2;
  const original=prepareRecipe(THREE,wasm,recipe);
  assert.equal(manufactured.bodies.length,2);
  for(const [index,body] of manufactured.bodies.entries()){
   const {vertProperties,numProp}=body.mesh, ring=[];
   for(let i=0;i<vertProperties.length;i+=numProp){
    const distance=Math.hypot(vertProperties[i]-newBore.x,vertProperties[i+2]-newBore.z);
    if(Math.abs(distance-nominal)<.007)ring.push(distance);
   }
   assert(ring.length>=12,'Prepared material has a measured ring at the actual requested bore radius.');
   assert(original.bodies[index].volume-body.volume>1,'The bore removes material from both bodies.');
  }
  const files=exportMaterialBodies(manufactured,{name:'verified-pixel-bore'});
  assert.equal(files.stls.length,2);
  assert(files.threeMF.length>100);
 }
 console.log('WT-006 bore: fabricable calibrated radius, strict void/mount/web rejection and dual material exports.');
}


const checked=(id,x,z=0,rotation=0)=>({id,x,z,rotation,checked:true,diameter:5,clearance:.3,profileId:'seed'});
const serial={version:1,enabled:true,pitch:50,tail:200};
const tileRoute=tileGenerator.recipe({pattern:'terraces',width:84,depth:76,thickness:5});
const gearRoute=gearGenerator.recipe({mode:'Decorative',wheelStyle:'Rounded lobes',webStyle:'Solid',bore:0,diameter:100,teeth:12,thickness:8});
for(const [recipe,family] of [[tileRoute,tileGenerator],[gearRoute,gearGenerator]]){
 for(const count of [1,2,3]){
  const pixelHoles=Array.from({length:count},(_,i)=>checked('led-'+i,.37+(i-(count-1)/2)*25,1.23));
  const build={pixelHoles,pixelBuilderVersion:1};
  const bored=prepareRecipe(THREE,wasm,applyBuildModules(recipe,build,family.capabilities));
  const routedRecipe=applyBuildModules(recipe,{...build,serialRouting:{...serial,pitch:25}},family.capabilities);
  assert.equal(routedRecipe.nativeRouting.links.length,count+1);
  assert.match(routedRecipe.nativeRouting.links[0].label,/EDGE IN/);
  assert.match(routedRecipe.nativeRouting.links.at(-1).label,/EDGE OUT/);
  const routed=prepareRecipe(THREE,wasm,routedRecipe);
  assert(bored.bodies[0].volume-routed.bodies[0].volume>100);
  const mesh=routed.bodies[0].mesh;
  const vertices=mesh.vertProperties||mesh.points,stride=mesh.numProp||3;
  const ceilingVertices=[];
  for(let i=0;i<vertices.length;i+=stride)if(Math.abs(vertices[i+1]-1.8)<1e-4)ceilingVertices.push(vertices[i]);
  assert(Math.min(...ceilingVertices)<-30&&Math.max(...ceilingVertices)>30,'Channel ceiling reaches both external sides.');
  console.log('WT-012 routed export:',family.typeId,count);
  const output=exportMaterialBodies(routed,{name:family.typeId+'-routed'});
  assert.equal(output.stls.length,1);assert(output.threeMF.length>100);
 }
}
for(const recipe of [tileRoute,gearRoute]){
 const build={pixelHoles:[checked('left',-15),checked('right',15)],pixelBuilderVersion:1,serialRouting:serial};
 const planned=applyBuildModules(recipe,build).nativeRouting;
 assert.equal(planned.ready,true);
 assert.equal(planned.links[1].label,'P1 → P2');
 assert.deepEqual(applyBuildModules(recipe,JSON.parse(JSON.stringify(build))).nativeRouting,planned);
 const short={...build,serialRouting:{...serial,pitch:25}};
 assert.match(applyBuildModules(recipe,short,{}, {preview:true}).nativeRouting.links[1].reason,/Cable budget/);
 assert.throws(()=>applyBuildModules(recipe,short),/P1 → P2: Cable budget exceeded/);
 assert.throws(()=>applyBuildModules(recipe,{...build,mounting:true},{supportsMounting:true}),/mounting cuts/);
}
const curveBuild={pixelHoles:[checked('left',-15),checked('right',15,2)],pixelBuilderVersion:1,serialRouting:serial};
const curvePlan=applyBuildModules(tileRoute,curveBuild).nativeRouting;
assert(curvePlan.links[1].path.length>2);
const shortTail=applyBuildModules(tileRoute,{...curveBuild,serialRouting:{...serial,inTail:5,outTail:100}}, {},{preview:true}).nativeRouting;
assert.match(shortTail.links[0].reason,/Cable budget/);assert.equal(shortTail.links.at(-1).reason,'');
assert(curvePlan.links[1].measure>Math.hypot(30,2));
assert.throws(()=>applyBuildModules(tileRoute,{...curveBuild,serialRouting:{...serial,pitch:25}}),/Cable budget exceeded/);
assert.throws(()=>applyBuildModules(tileRoute,{...curveBuild,pixelHoles:[...curveBuild.pixelHoles].reverse()}),/tangent-compatible/);
assert.throws(()=>applyBuildModules(tileGenerator.recipe({thickness:2}),curveBuild),/3.8 mm/);
assert.throws(()=>applyBuildModules(gearGenerator.recipe(turbine),{serialRouting:serial}),/solid decorative/);
assert.throws(()=>applyBuildModules(pebbleGenerator.recipe(river.parameters),{serialRouting:serial}),/fitting backing/);
assert.throws(()=>applyBuildModules(gearRoute,{...curveBuild,mounting:true}),/mounting cuts/);
const curved=prepareRecipe(THREE,wasm,applyBuildModules(tileRoute,curveBuild));
assert.equal(curved.report.nativeRouting.channels.length,3);
assert(exportMaterialBodies(curved).threeMF.length>100);
for(const [family,ids,baseline] of [[tileGenerator,['terraces','quilt'],'grass'],[gearGenerator,['forked-sun','forked-rotor'],'turbine'],[pebbleGenerator,['beacon-tall','beacon-low'],'lantern']]){
 const volumes=[baseline,...ids].map(id=>{
  const preset=family.presets.find(item=>item.id===id);
  return Math.round(prepareRecipe(THREE,wasm,family.recipe(preset.parameters)).bodies[0].volume);
 });
 assert.equal(new Set(volumes).size,3);
}
console.log('WT-012 catalogue and native serial channel fabrication passed.');

// WT-017: certified, real cut geometry and STL/3MF exports for all six
// non-Crystal families. Original Crystal hardware regressions run separately.
const fittingCases=[
 [tileGenerator,{pattern:'grass',dualMaterial:false},{}],
 [gearGenerator,{mode:'Decorative',webStyle:'Solid',bore:0,spokes:0,extraHoles:0,dualMaterial:false},{}],
 [waveGenerator,{flowStyle:'Parallel',dualMaterial:false},{}],
 [capGenerator,{controlStyle:'Pushbutton',shaft:0,dualMaterial:false},{}],
 [characterGenerator,{character:'Cloud',construction:'Classic',dualMaterial:false},{}],
 [pebbleGenerator,{illuminated:false,dualMaterial:false},{pixelBacking:true}]
];
for(const [family,parameters,options] of fittingCases){
 const source=family.recipe(parameters);
 const base=applyBuildModules(source,{...options,pixelBuilderVersion:1,pixelHoles:[]},family.capabilities);
 const profile={id:'custom-wt017',bodyDiameter:4.5},pixel=findPixelPosition(base,[],profile);
 assert(pixel,family.typeId+' should offer a certifiably printable placement (explicit backing on Pod).');
 const hole={...pixel,checked:true};
 assert.equal(pixelBoreIssue(base,hole),null,family.typeId+' needs a verified solid column');
 const made=applyBuildModules(source,{...options,pixelBuilderVersion:1,pixelHoles:[hole]},family.capabilities);
 assert.equal(made.negative.filter(part=>part.pixelHole).length,1);
 const empty=prepareRecipe(THREE,wasm,base),bored=prepareRecipe(THREE,wasm,made);
 const before=empty.bodies.reduce((n,body)=>n+body.volume,0);
 const after=bored.bodies.reduce((n,body)=>n+body.volume,0);
 assert(before-after>.1,family.typeId+' fitting must subtract actual material');
 const files=exportMaterialBodies(bored,{name:'wt017-'+family.typeId});
 assert(files.stls.length>=1&&files.threeMF.length>100,family.typeId+' needs valid exported STL and 3MF');
}
assert.match(pixelBoreIssue(pebbleGenerator.recipe({illuminated:false}),newPixel({id:'seed',bodyDiameter:5})),/cavity|unavailable|solid/);
console.log('WT-017 native family actual bores and export passed; Crystal checked by original hardware fixtures.');

const extendedRouting=[
 [waveGenerator,{flowStyle:'Parallel',dualMaterial:false},false],
 [capGenerator,{controlStyle:'Pushbutton',shaft:0,dualMaterial:false},true],
 [characterGenerator,{character:'Cloud',construction:'Classic',dualMaterial:false},true],
 [pebbleGenerator,{illuminated:false,dualMaterial:false},true]
];
for(const [family,parameters,pixelBacking] of extendedRouting){
 const source=family.recipe(parameters),build={pixelBacking,pixelBuilderVersion:1,pixelHoles:[]};
 const backing=applyBuildModules(source,build,family.capabilities);
 const hole=findPixelPosition(backing,[],{id:'seed',bodyDiameter:5});
 assert(hole,family.typeId+' has a verified fitting position');
 build.pixelHoles=[{...hole,rotation:0,checked:true}];
 const before=prepareRecipe(THREE,wasm,applyBuildModules(source,build,family.capabilities));
 const recipe=applyBuildModules(source,{...build,serialRouting:serial},family.capabilities);
 const after=prepareRecipe(THREE,wasm,recipe);
 assert.equal(after.report.nativeRouting.channels.length,2);
 assert(before.bodies[0].volume-after.bodies[0].volume>10);
 const files=exportMaterialBodies(after);
 assert(files.stls.length&&files.threeMF.length>100);
}
assert.throws(()=>applyBuildModules(pebbleGenerator.recipe({illuminated:true,dualMaterial:false}),{
 pixelBacking:true,serialRouting:serial
},pebbleGenerator.capabilities),/Existing cavities/);
assert.throws(()=>applyBuildModules(capGenerator.recipe({shaft:8,dualMaterial:false}),{
 pixelBacking:true,serialRouting:serial
},capGenerator.capabilities),/Existing cavities/);
