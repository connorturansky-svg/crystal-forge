import {makeRoutedSocketSpecimen} from '../studio-catalogue.js';
import {PIXEL_PRESETS} from '../pixel-profiles.js';
import {makePixelReplicaRecipe} from '../pixel-replica.js';
import {pixelBoreIssue} from '../studio-pixel-bore-validation.js';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import Module from 'manifold-3d';
import {waveGenerator,tileGenerator,gearGenerator,capGenerator,characterGenerator,pebbleGenerator,generators,applyBuildModules} from '../studio-catalogue.js';
import {findPixelPosition,newPixel} from '../studio-pixel-builder.js';
import {planNativePixelString} from '../studio-native-routing.js';
import {previewRecipe,disposeGroup,prepareRecipe,nativeFittingPreviews} from '../studio-geometry.js';
import {exportMaterialBodies,preparedDimensionsMm} from '../studio-material-export.js';
const wasm=await Module();wasm.setup();
// Independently read both exports of an asymmetric, translated solid.
{
 const fixture=prepareRecipe(THREE,wasm,{positive:[{kind:'box',size:[37,11,23],position:[8,9,-5]}],negative:[],secondary:[]});
 const {stls,threeMF}=exportMaterialBodies(fixture);
 const expected=[37,23,11],bounds=points=>[0,1,2].map(axis=>{
  const coords=points.map(p=>p[axis]);return Math.max(...coords)-Math.min(...coords);
 });
 assert.deepEqual(preparedDimensionsMm(fixture),expected);
 const stl=Buffer.from(stls[0].bytes),vertices=[];
 for(let face=0;face<stl.readUInt32LE(80);face++)for(let i=0;i<3;i++){
  const offset=96+face*50+i*12;
  vertices.push([0,4,8].map(axis=>stl.readFloatLE(offset+axis)));
 }
 assert.deepEqual(bounds(vertices),expected);
 const zip=Buffer.from(threeMF);
 let model;
 for(let i=0;zip.readUInt32LE(i)===0x04034b50;){
  const nameLength=zip.readUInt16LE(i+26),start=i+30+nameLength+zip.readUInt16LE(i+28),size=zip.readUInt32LE(i+18);
  if(zip.toString('utf8',i+30,i+30+nameLength)==='3D/3dmodel.model'){
   assert.equal(zip.readUInt16LE(i+8),0);
   model=zip.toString('utf8',start,start+size);break;
  }
  i=start+size;
 }
 assert.match(model,/<model unit="millimeter"/);
 assert.match(model,/<item objectid="2" transform="1 0 0 0 1 0 0 0 1 0 0 0"/);
 assert.deepEqual(bounds([...model.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g)].map(m=>m.slice(1).map(Number))),expected);
 console.log('Prepared, STL and 3MF fixture bounds agree: 37 x 23 x 11 mm');
}
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
const lensStls=exportMaterialBodies(splitLens,{name:'indicator-lens-regression'}).stls;
assert.equal(lensStls.length,2);
for(const {role,bytes} of lensStls){
 const geometry=new STLLoader().parse(bytes.buffer);
 geometry.computeBoundingBox();
 const measured=geometry.boundingBox.getSize(new THREE.Vector3()).toArray();
 const reported=preparedDimensionsMm(splitLens,role);
 assert(reported.every((dimension,axis)=>Math.abs(dimension-measured[axis])<.001),role+' STL dimensions');
 geometry.dispose();
}
assert.notDeepEqual(preparedDimensionsMm(splitLens,'primary'),preparedDimensionsMm(splitLens,'secondary'));
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


let perpendicularCompactSeat;
// FIT-02: Six native families share the production Manifold cutter,
// its physical positive profile and the same placement transform as Print.
{
 const gumdrop=PIXEL_PRESETS.find(item=>item.id==='gumdrop');
 const compact={...gumdrop,bodyDiameter:5,bodyHeight:6,capHeight:1.2,flangeDiameter:6,
  flangeHeight:1,wireWidth:2,wireDepth:1,retentionLip:0};
 const configs=[
  {type:'Gear top',family:gearGenerator,params:{diameter:80,bore:0,thickness:25,
   wheelStyle:'Cam',dualMaterial:false},
   profile:{...gumdrop,retentionLip:0},face:{y:25,normal:[0,1,0]}},
  {type:'Tile underside',family:tileGenerator,params:{pattern:'terraces',width:90,
   depth:90,thickness:20,relief:2,dualMaterial:false},
   // A smaller REAL profile fits this thinner tile. A 22 mm gumdrop
   // must be rejected without additional material and is not pretended to fit.
   profile:{...gumdrop,bodyHeight:14,capHeight:2,flangeHeight:2,retentionLip:0},face:null},
  {type:'Tile vertical face',family:tileGenerator,params:{pattern:'terraces',outline:'square',
   width:90,depth:90,thickness:20,relief:2,dualMaterial:false},
   profile:compact,z:45,face:{y:10,normal:[0,0,1]},cutPosition:[0,10,41]},
  {type:'Tile perpendicular face, extended profile',family:tileGenerator,
   params:{pattern:'terraces',outline:'square',width:90,depth:90,
   thickness:20,relief:2,dualMaterial:false},
   profile:{...compact,bodyHeight:18},measureExport:true,x:45,face:{y:10,normal:[1,0,0]},
   cutPosition:[41,10,0]},
  {type:'Tile perpendicular face, full gumdrop',family:tileGenerator,
   params:{pattern:'terraces',outline:'square',width:90,depth:90,
   thickness:20,relief:2,dualMaterial:false},
   profile:{...gumdrop,retentionLip:0},x:45,face:{y:10,normal:[1,0,0]},
   rejectStock:true},
  ...[
   [waveGenerator,{flowStyle:'Parallel'}],
   [capGenerator,{controlStyle:'Pushbutton',shaft:0}],
   [characterGenerator,{character:'Cloud',construction:'Classic'}],
   [pebbleGenerator,{shellForm:'Beacon',illuminated:false}]
  ].map(([family,params])=>({type:family.typeId+' backed underside',family,
   params:{...params,dualMaterial:false},profile:compact,face:null,pixelBacking:true}))
 ];
 for(const fixture of configs){
  const source=fixture.family.recipe(fixture.params);
  assert.equal(source.negative?.length||0,0,fixture.type+' test needs isolated stock');
  const hole={id:'physical-preview',x:fixture.x??0,z:fixture.z??0,diameter:fixture.profile.bodyDiameter,clearance:.15,
   checked:true,rotation:17,entryFace:fixture.face?'top':'underside',profileId:'gumdrop',
   socketProfile:fixture.profile,...(fixture.face?{surface:fixture.face}:{})};
  const recipe=applyBuildModules(source,{pixelBuilderVersion:1,pixelHoles:[hole],
   pixelBacking:fixture.pixelBacking,pixelBackingThickness:10},fixture.family.capabilities);
  if(fixture.measureExport)perpendicularCompactSeat=recipe;
  const previews=nativeFittingPreviews(THREE,wasm,recipe);
  assert.equal(previews.length,1,fixture.type+' displays one real profile fitting');
  const preview=previews[0];
  assert.equal(preview.pixelId,'physical-preview');
  assert.equal(preview.insertionDepth,fixture.profile.bodyHeight);
  if(fixture.rejectStock){
   assert(preview.missingStockVolume>1,fixture.type+' measures missing surrounding stock');
   assert(preview.warnings.some(warning=>warning.includes('continuous stock on its installation face')));
   assert.throws(()=>prepareRecipe(THREE,wasm,recipe),/continuous stock on its installation face/);
   continue;
  }
  assert.deepEqual(preview.warnings,[]);
  assert.equal(preview.wireOverlap,0);
  assert(preview.missingStockVolume<=.05,fixture.type+' has the required surrounding stock');
  if(!fixture.face){
   const thin={...recipe,positive:[{kind:'box',size:[40,2,40],position:[0,1,0]}],secondary:[]};
   const [thinPreview]=nativeFittingPreviews(THREE,wasm,thin);
   assert(thinPreview.missingStockVolume>1,fixture.type+' measures missing stock on a thin body');
   assert.throws(()=>prepareRecipe(THREE,wasm,thin),/continuous underside stock/);
  }
  const cutPosition=fixture.cutPosition??[0,fixture.face?fixture.face.y-4:4,0];
  const routed={...recipe,negative:[...recipe.negative,{kind:'box',size:[4,4,4],position:cutPosition,wireChannel:'test channel'}]};
  assert(nativeFittingPreviews(THREE,wasm,routed)[0].wireOverlap>1);
  const conflicted={...recipe,negative:[...recipe.negative,{kind:'box',size:[4,4,4],position:cutPosition,mountHole:'test adjacent cut'}]};
  assert(nativeFittingPreviews(THREE,wasm,conflicted)[0].warnings.some(warning=>warning.includes('clearance from another cut')));
  assert.throws(()=>prepareRecipe(THREE,wasm,conflicted),/clearance from another cut/);
  assert(preview.positive.triVerts.length>0&&preview.negative.triVerts.length>0);
  assert([preview.exposedVolume,preview.collisionVolume,preview.nominalRoofAllowance].every(Number.isFinite));
  const stock=prepareRecipe(THREE,wasm,{...recipe,negative:[],nativeRouting:null});
  const finished=prepareRecipe(THREE,wasm,recipe);
  const blankSolid=new wasm.Manifold(stock.bodies[0].mesh);
  const negativeSolid=new wasm.Manifold(preview.negative);
  const positiveSolid=new wasm.Manifold(preview.positive);
  const expected=blankSolid.subtract(negativeSolid);
  const missingEnvelope=positiveSolid.subtract(negativeSolid);
  try{
   const expectedVolume=expected.volume(),manufacturedVolume=finished.bodies[0].volume;
   assert(Math.abs(expectedVolume-manufacturedVolume)<.02,
    fixture.type+' preview negative must be same Boolean cutter and pose as manufactured model');
   assert(missingEnvelope.volume()<.02,
    fixture.type+' actual production socket must enclose the full positive pixel; mismatch volume '+missingEnvelope.volume().toFixed(5)+' mm³, positive '+positiveSolid.volume().toFixed(5)+' mm³, cutter '+negativeSolid.volume().toFixed(5)+' mm³');
  }finally{missingEnvelope.delete();expected.delete();positiveSolid.delete();negativeSolid.delete();blankSolid.delete();}
 }
 console.log('FIT-02 native preview fixtures: real positive envelope and negative cutter match manufactured geometry');
}
const checked=(id,x,z=0,rotation=0)=>({id,x,z,rotation,checked:true,diameter:5,clearance:.3,profileId:'seed'});
const serial={version:1,enabled:true,pitch:50,tail:200};

/* WT-021 AUD-02: socket fit tolerance is *not* an independent wire-width knob.
 * A changed body-bore clearance must never alter the channel's usable width.
 * The physical relief F or explicit channelWidthMm governs that dimension. */
{
 const recipe=gearGenerator.recipe({mode:'Decorative',wheelStyle:'Rounded lobes',
  webStyle:'Solid',bore:0,diameter:100,teeth:12,thickness:8});
 const build=(boreClearance,physicalWireWidth=5.5,requestedWireWidth=2.5)=>({
  pixelHoles:[checked('wire-a',-15),checked('wire-b',15)].map(hole=>({
   ...hole,clearance:boreClearance,entryFace:'underside',
   socketProfile:{wireWidth:physicalWireWidth,wireDepth:1.8}
  })),
  serialRouting:{...serial,channelWidthMm:requestedWireWidth}
 });
 const tight=planNativePixelString(recipe,build(.1));
 const loose=planNativePixelString(recipe,build(.5));
 assert.equal(tight.channelWidthMm,5.5);
 assert.equal(loose.channelWidthMm,tight.channelWidthMm,
  'Changing socket diametral fit clearance must not change the actual routed wire width');
 assert.equal(planNativePixelString(recipe,build(.1,6)).channelWidthMm,6,
  'Changing measured physical wire relief F must change the minimum route width');
 assert.equal(planNativePixelString(recipe,build(.1,5.5,7)).channelWidthMm,7,
  'An independently requested wider wire channel must be respected');
 console.log('WT-021 native route width stays independent from body-bore clearance');
}
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
// The selected opening changes the viewport marker, while both openings
// are machined by the same through-bore and route cutters.
{
 const pixelHoles=[checked('left',-15),checked('right',15)];
 const prepare=entryFace=>applyBuildModules(gearRoute,{
  pixelBuilderVersion:1,serialRouting:serial,pixelHoles:pixelHoles.map(hole=>({...hole,entryFace}))
 },gearGenerator.capabilities);
 const top=prepare('top'),underside=prepare('underside');
 assert.equal(underside.negative.find(part=>part.pixelHole).pixelEntryFace,'underside');
 assert.deepEqual(top.nativeRouting,underside.nativeRouting);
 const topBody=prepareRecipe(THREE,wasm,top);
 const undersideBody=prepareRecipe(THREE,wasm,underside);
 assert.equal(topBody.bodies[0].volume,undersideBody.bodies[0].volume);
 const output=exportMaterialBodies(undersideBody,{name:'gear-underside'});
 assert.equal(output.stls.length,1);
 assert(output.threeMF.length>100);
}
const routedMountBuild={pixelBuilderVersion:1,serialRouting:serial,pixelHoles:[checked('left',-15),checked('right',15)]};
const separateMount={id:'route-mount',x:0,z:12,diameter:3.4,entryFace:'top'};
const safelyMountedRoute=applyBuildModules(gearRoute,{...routedMountBuild,manualMountHoles:[separateMount]},gearGenerator.capabilities);
assert.equal(safelyMountedRoute.nativeRouting.cutters.length,3);
assert(safelyMountedRoute.negative.some(part=>part.mountId==='route-mount'));
assert.equal(prepareRecipe(THREE,wasm,safelyMountedRoute).bodies.length,1);
assert.throws(()=>applyBuildModules(gearRoute,{...routedMountBuild,manualMountHoles:[{...separateMount,z:0}]},gearGenerator.capabilities),
 /too close to Mount hole 1/);
const curveBuild={pixelHoles:[checked('left',-15),checked('right',15,2)],pixelBuilderVersion:1,serialRouting:serial};
const curvePlan=applyBuildModules(tileRoute,curveBuild).nativeRouting;
const flatStock={bounds:{width:70,depth:40,height:10},
 positive:[{kind:'box',size:[70,10,40],position:[0,5,0]}],negative:[],
 serialSupport:{outline:[[-35,-20],[35,-20],[35,20],[-35,20]],thickness:10}};
// Route from the actual top seats, using their installed IN/OUT orientation.
const topRouteBuild={pixelBuilderVersion:1,serialRouting:serial,pixelHoles:[-15,15].map((x,i)=>({
 ...checked('top-'+i,x,0,180),entryFace:'top',surface:{y:10,normal:[0,1,0]},
 socketProfile:{bodyHeight:4,capHeight:1,flangeDiameter:5,flangeHeight:.5,wireWidth:3.2,wireDepth:1.8,retentionLip:0}
}))};
const topRouteStock={...flatStock,serialSupport:{...flatStock.serialSupport,topY:10}};
const topRouted=applyBuildModules(topRouteStock,topRouteBuild);
assert.equal(topRouted.nativeRouting.face,'top');
assert.equal(topRouted.nativeRouting.links[1].label,'P1 → P2');
const gearTopStock=gearGenerator.recipe({mode:'Decorative',wheelStyle:'Rounded lobes',webStyle:'Solid',bore:0,diameter:100,teeth:12,thickness:10,reliefStyle:'None'});
const gearTopRouted=applyBuildModules(gearTopStock,topRouteBuild,gearGenerator.capabilities);
assert.equal(prepareRecipe(THREE,wasm,gearTopRouted).bodies.length,1);
const backedGearTop=applyBuildModules(gearTopStock,{...topRouteBuild,pixelBacking:true,backingTabs:[{u:.125},{u:.625}]},gearGenerator.capabilities);
assert.equal(backedGearTop.nativeRouting.face,'top');
assert.equal(backedGearTop.negative.filter(part=>part.tabHole).length,2);
assert.equal(prepareRecipe(THREE,wasm,backedGearTop).bodies.length,1);
assert.throws(()=>applyBuildModules(flatStock,topRouteBuild),/planar top/);
const tiltedSeat={...topRouteBuild.pixelHoles[1],surface:{y:10,normal:[.6,.8,0]}};
assert.throws(()=>applyBuildModules(topRouteStock,{...topRouteBuild,pixelHoles:[topRouteBuild.pixelHoles[0],tiltedSeat]}),/shared flat underside or an eligible planar top/);
assert.throws(()=>applyBuildModules(topRouteStock,{...topRouteBuild,serialRouting:{...serial,vaulted:true}}),/Turn off the vaulted option/);
const sideRouteStock=tileGenerator.recipe({width:80,depth:50,thickness:20,outline:'square',pattern:'terraces',relief:2});
const sideRouteBuild={...topRouteBuild,pixelHoles:topRouteBuild.pixelHoles.map(hole=>({
 ...hole,z:25,rotation:0,surface:{y:10,normal:[0,0,1]}
}))};
const sideRouted=applyBuildModules(sideRouteStock,sideRouteBuild,tileGenerator.capabilities);
assert.equal(sideRouted.nativeRouting.face,'front');
assert.equal(sideRouted.nativeRouting.links.length,3);
const rearHoles=sideRouteBuild.pixelHoles.map(hole=>({...hole,x:-hole.x,z:-hole.z,
 surface:{...hole.surface,normal:[0,0,-1]}}));
const rearRouted=applyBuildModules(sideRouteStock,{...sideRouteBuild,pixelHoles:rearHoles},tileGenerator.capabilities);
assert.equal(rearRouted.nativeRouting.face,'rear');
assert.equal(rearRouted.nativeRouting.links.length,3);
const perpendicularRoutes=[-1,1].map(sign=>{
 const pixelHoles=sideRouteBuild.pixelHoles.map(hole=>({...hole,x:sign*40,z:-sign*hole.x,
  surface:{...hole.surface,normal:[sign,0,0]}}));
 const routed=applyBuildModules(sideRouteStock,{...sideRouteBuild,pixelHoles},tileGenerator.capabilities);
 assert.equal(routed.nativeRouting.face,sign>0?'right':'left');
 assert.equal(routed.nativeRouting.links.length,3);
 const interfering={...routed,negative:[...routed.negative,{kind:'box',size:[1,.3,2],position:[sign*39.2,11.8,0]}]};
 assert.throws(()=>prepareRecipe(THREE,wasm,interfering),/intersects another cut beside the channel/);
 return routed;
});
assert.throws(()=>applyBuildModules(sideRouteStock,{...sideRouteBuild,pixelHoles:[rearHoles[0],sideRouteBuild.pixelHoles[1]]},
 tileGenerator.capabilities),/same supported face/);
const obstructedRear={...rearRouted,negative:[...rearRouted.negative,{kind:'box',size:[2,.3,1],position:[0,11.8,-24.2]}]};
assert.throws(()=>prepareRecipe(THREE,wasm,obstructedRear),/intersects another cut beside the channel/);
const backedTileSide=applyBuildModules(sideRouteStock,{...sideRouteBuild,pixelBacking:true,backingTabs:[{u:.125},{u:.75}]},tileGenerator.capabilities);
assert.equal(backedTileSide.nativeRouting.face,'front');
assert.equal(backedTileSide.negative.filter(part=>part.tabHole).length,2);
assert.equal(prepareRecipe(THREE,wasm,backedTileSide).bodies.length,1);
const seatsNearBacking=sideRouteBuild.pixelHoles.map(hole=>({...hole,surface:{...hole.surface,y:5}}));
assert.throws(()=>applyBuildModules(sideRouteStock,{...sideRouteBuild,pixelBacking:true,pixelHoles:seatsNearBacking},tileGenerator.capabilities),
 /above the fitting backing/);
assert.equal(prepareRecipe(THREE,wasm,sideRouted).bodies.length,1);
const sideRouteConflict={...sideRouted,negative:[...sideRouted.negative,{kind:'box',size:[2,.3,1],position:[0,11.8,24.2]}]};
assert.throws(()=>prepareRecipe(THREE,wasm,sideRouteConflict),/intersects another cut beside the channel/);
assert.throws(()=>applyBuildModules(sideRouteStock,{...sideRouteBuild,serialRouting:{...serial,vaulted:true}}),/Turn off the vaulted option for a front route/);
const gentleWave=waveGenerator.recipe({width:160,depth:100,thickness:15,amplitude:1,frequency:.5,variation:0,direction:0});
const waveSurfaceMesh=previewRecipe(THREE,gentleWave);
const shortProfile=PIXEL_PRESETS.find(profile=>profile.id==='seed');
function gentleWaveSeat(x,z=0){
 const hit=new THREE.Raycaster(new THREE.Vector3(x,30,z),new THREE.Vector3(0,-1,0)).intersectObject(waveSurfaceMesh.children[0])[0];
 const {point,face}=hit;
 return {...checked('wave-seat-'+x,point.x,point.z,180),entryFace:'top',
  surface:{y:point.y,normal:face.normal.toArray()},socketProfile:{...shortProfile,retentionLip:0}};
}
const gentleSeat=gentleWaveSeat(-40);
const secondWaveSeat=gentleWaveSeat(-20);
const convexSeat=gentleWaveSeat(40);
const perimeterSeats=[40,49].map(z=>gentleWaveSeat(-40,z));
disposeGroup(waveSurfaceMesh);
assert(Math.abs(gentleSeat.surface.normal[0])>.005,'The seat follows the actual sloped face');
const waveSeatRecipe=hole=>applyBuildModules(gentleWave,{pixelBuilderVersion:1,pixelHoles:[hole]},waveGenerator.capabilities);
const curvedSeatOnly=waveSeatRecipe(gentleSeat);
const calibratedWaveSeat={...gentleSeat,clearance:.2,
 socketProfile:{...gentleSeat.socketProfile,bodyHeight:11}};
const calibratedWaveRecipe=waveSeatRecipe(calibratedWaveSeat);
const [perimeterWaveRecipe,breakthroughWaveRecipe]=perimeterSeats.map(seat=>
 waveSeatRecipe({...calibratedWaveSeat,x:seat.x,z:seat.z,surface:seat.surface}));
// Preserve the real Chromium raycast coordinate that produced a collapsed
// triangle after the numeric move to Z=40.
const browserPerimeterWaveRecipe=waveSeatRecipe({...calibratedWaveSeat,
 x:-39.99999939188582,z:40,rotation:0,surface:perimeterSeats[0].surface});
const convexSeatRecipe=waveSeatRecipe(convexSeat);
assert.throws(()=>prepareRecipe(THREE,wasm,convexSeatRecipe),/needs continuous stock on its installation face/);
{
 const [preview]=nativeFittingPreviews(THREE,wasm,curvedSeatOnly);
 const [calibrated]=nativeFittingPreviews(THREE,wasm,calibratedWaveRecipe);
 const [perimeter]=nativeFittingPreviews(THREE,wasm,perimeterWaveRecipe);
 const [breakthrough]=nativeFittingPreviews(THREE,wasm,breakthroughWaveRecipe);
 assert.equal(perimeter.insertionDepth,11);
 assert(perimeter.missingStockVolume<=.05&&perimeter.warnings.length===0);
 assert(perimeter.collisionVolume<=.02);
 assert(breakthrough.missingStockVolume>.05);
 assert.throws(()=>prepareRecipe(THREE,wasm,breakthroughWaveRecipe),/continuous stock on its installation face/);
 console.log('FIT-02 rejected Wave perimeter missing stock (mm³):',breakthrough.missingStockVolume);
 const browserPerimeter=prepareRecipe(THREE,wasm,browserPerimeterWaveRecipe);
 const {stls,threeMF}=exportMaterialBodies(browserPerimeter);
 assert(stls[0].bytes.byteLength>84&&threeMF.byteLength>0);
 assert.equal(calibrated.insertionDepth,11);
 assert(calibrated.missingStockVolume<=.05&&calibrated.warnings.length===0);
 const [rejected]=nativeFittingPreviews(THREE,wasm,convexSeatRecipe);
 assert(preview.missingStockVolume<=.05&&preview.warnings.length===0);
 assert(rejected.missingStockVolume>.05);
 assert(rejected.warnings.some(message=>message.includes('continuous stock on its installation face')));
 const owned=[];
 const hold=solid=>{owned.push(solid);return solid;};
 try{
  const {Manifold}=wasm;
  const blank=hold(new Manifold(prepareRecipe(THREE,wasm,gentleWave).bodies[0].mesh));
  for(const [recipe,inspection] of [[curvedSeatOnly,preview],[calibratedWaveRecipe,calibrated],[perimeterWaveRecipe,perimeter]]){
   const printed=hold(new Manifold(prepareRecipe(THREE,wasm,recipe).bodies[0].mesh));
   const cutter=hold(new Manifold(inspection.negative));
   const housing=hold(new Manifold(inspection.positive));
   const expected=hold(blank.subtract(cutter));
   assert(hold(expected.subtract(printed)).volume()+hold(printed.subtract(expected)).volume()<.02,
    'Sloped Wave preview uses the same cutter pose as the prepared mesh');
   assert(hold(housing.subtract(cutter)).volume()<.02,'The sloped cutter encloses the measured housing');
  }
 }finally{
  for(const solid of owned.reverse())solid.delete();
 }
}
const waveRouteBuild={pixelBuilderVersion:1,pixelHoles:[gentleSeat,secondWaveSeat],serialRouting:serial};
const curvedWaveRoute=applyBuildModules(gentleWave,waveRouteBuild,waveGenerator.capabilities);
assert.equal(curvedWaveRoute.nativeRouting.face,'wave');
assert.equal(prepareRecipe(THREE,wasm,curvedWaveRoute).bodies.length,1);
const measuredWaveRoute=applyBuildModules(gentleWave,{
 ...waveRouteBuild,
 pixelHoles:waveRouteBuild.pixelHoles.map(hole=>({...hole,diameter:8,
  socketProfile:{...hole.socketProfile,bodyDiameter:8,flangeDiameter:8,wireWidth:5.8,wireDepth:1.95}}))
},waveGenerator.capabilities);
assert.equal(measuredWaveRoute.nativeRouting.face,'wave');
assert.equal(measuredWaveRoute.nativeRouting.channelWidthMm,5.8);
const waveConflict={...curvedWaveRoute,negative:[...curvedWaveRoute.negative,{kind:'box',size:[2,1,.3],position:[0,15,1.8]}]};
assert.throws(()=>prepareRecipe(THREE,wasm,waveConflict),/intersects another cut beside the channel/);
assert.throws(()=>applyBuildModules(gentleWave,{...waveRouteBuild,serialRouting:{...serial,vaulted:true}}),/Turn off the vaulted option for a Wave route/);
const biaxialStock=waveGenerator.recipe({width:160,depth:100,thickness:15,amplitude:1,frequency:.5,variation:.1,direction:12});
const biaxialMesh=previewRecipe(THREE,biaxialStock);
const waveAt=(x,z)=>new THREE.Raycaster(new THREE.Vector3(x,30,z),new THREE.Vector3(0,-1,0)).intersectObject(biaxialMesh.children[0])[0];
const biaxialHoles=[-40,-20].map(x=>{
 const {point,face}=waveAt(x,-18);
 return {...checked('biaxial-'+x,x,-18,180),entryFace:'top',surface:{y:point.y,normal:face.normal.toArray()},
  socketProfile:{...shortProfile,retentionLip:0}};
});
assert(biaxialHoles.every(hole=>Math.abs(hole.surface.normal[0])>.001&&Math.abs(hole.surface.normal[2])>.001));
const biaxialRoute=applyBuildModules(biaxialStock,{...waveRouteBuild,pixelHoles:biaxialHoles},waveGenerator.capabilities);
assert.equal(biaxialRoute.nativeRouting.face,'wave');
const biaxialPins={...serial,minBendRadius:5,inEdgePercent:biaxialRoute.nativeRouting.edgePositions.in+2,
 outEdgePercent:biaxialRoute.nativeRouting.edgePositions.out-1};
const biaxialPinned=applyBuildModules(biaxialStock,{...waveRouteBuild,pixelHoles:biaxialHoles,serialRouting:biaxialPins},waveGenerator.capabilities);
assert.throws(()=>applyBuildModules(biaxialStock,{...waveRouteBuild,pixelHoles:biaxialHoles,
 serialRouting:{...biaxialPins,minBendRadius:60}},waveGenerator.capabilities),/Chosen IN edge/);
const biaxialSections=[-60,-30,0,60].map(x=>[x,waveAt(x,-18).point.y]);
disposeGroup(biaxialMesh);
const raisedWaveStock=waveGenerator.recipe({
 width:160,depth:100,thickness:15,amplitude:6,frequency:.5,variation:0,direction:0
});
const raisedWaveMesh=previewRecipe(THREE,raisedWaveStock);
const raisedWaveHoles=[-40,-20].map((x,index)=>{
 const {point,face}=new THREE.Raycaster(new THREE.Vector3(x,30,0),new THREE.Vector3(0,-1,0))
  .intersectObject(raisedWaveMesh.children[0])[0];
 return {...waveRouteBuild.pixelHoles[index],surface:{y:point.y,normal:face.normal.toArray()}};
});
disposeGroup(raisedWaveMesh);
assert(raisedWaveHoles.some(hole=>hole.surface.normal[1]<.999));
const raisedWaveRoute=applyBuildModules(raisedWaveStock,{
 ...waveRouteBuild,pixelHoles:raisedWaveHoles
},waveGenerator.capabilities);
assert.equal(raisedWaveRoute.nativeRouting.face,'wave');
assert.equal(prepareRecipe(THREE,wasm,raisedWaveRoute).bodies.length,1);
const steepWave=waveGenerator.recipe({width:160,depth:100,thickness:15,amplitude:12,frequency:2,variation:.1,direction:12});
assert.throws(()=>applyBuildModules(steepWave,{...waveRouteBuild,pixelHoles:biaxialHoles},waveGenerator.capabilities),/Wave relief is too steep.*6% or less/);
const flatBuild={...curveBuild,pixelHoles:[checked('left',-15),checked('right',15)],serialRouting:serial};
const automatic=applyBuildModules(flatStock,flatBuild).nativeRouting;
const pinnedBuild={...flatBuild,serialRouting:{...serial,inEdgePercent:automatic.edgePositions.in-2,outEdgePercent:automatic.edgePositions.out+2}};
const pinned=applyBuildModules(flatStock,pinnedBuild);
assert.equal(pinned.nativeRouting.cutters.length,3,'Pinned openings retain both exterior cutters');
assert(pinned.nativeRouting.links[0].path.length>2,'Offset IN is a smooth curved path');
assert(prepareRecipe(THREE,wasm,pinned).bodies[0].volume>0);
const vaultedStock=applyBuildModules(flatStock,{...flatBuild,serialRouting:{...serial,vaulted:true}});
assert.throws(()=>applyBuildModules(flatStock,{...pinnedBuild,serialRouting:{...pinnedBuild.serialRouting,minBendRadius:61}}),/minimum bend radius/);
assert.throws(()=>applyBuildModules(flatStock,{...pinnedBuild,serialRouting:{...pinnedBuild.serialRouting,minBendRadius:60}}),/Chosen IN edge|Chosen OUT edge/);
const pinnedVault=applyBuildModules(flatStock,{...pinnedBuild,serialRouting:{...pinnedBuild.serialRouting,vaulted:true}});
const measuredProfile={kind:'gumdrop',bodyDiameter:8,bodyHeight:9,capHeight:1.2,flangeDiameter:9,flangeHeight:1.2,wireWidth:2.4,wireDepth:1.6,retentionLip:0};
const calibrationStock={...flatStock,bounds:{...flatStock.bounds,height:15},
 positive:[{kind:'box',size:[70,15,40],position:[0,7.5,0]}],serialSupport:{...flatStock.serialSupport,thickness:15}};
const calibratedCut=({clearance=.3,retentionLip=0,channelWidthMm=3.2,bodyHeight=9,vaulted=false}={})=>applyBuildModules(calibrationStock,{
 ...flatBuild,serialRouting:{...serial,channelWidthMm,vaulted},pixelHoles:flatBuild.pixelHoles.map(hole=>({...hole,
  profileId:'measured-sample',entryFace:'underside',diameter:8,clearance,socketProfile:{...measuredProfile,retentionLip,bodyHeight}}))
});
assert.throws(()=>prepareRecipe(THREE,wasm,calibratedCut({bodyHeight:4,retentionLip:.4})),/Cannot cut the selected retention lip/);
const conicalStud={...flatBuild.pixelHoles[0],profileId:'measured-sample',entryFace:'underside',
 diameter:8,clearance:.3,conical:true,socketProfile:{...measuredProfile,retentionLip:.4}};
const conicalStock={...calibrationStock,bounds:{...calibrationStock.bounds,height:18},
 positive:[{kind:'box',size:[70,18,40],position:[0,9,0]}]};
const conicalRecipe=applyBuildModules(conicalStock,{pixelHoles:[conicalStud]});
assert.throws(()=>applyBuildModules(calibrationStock,{pixelHoles:[conicalStud]}),/needs 15.9 mm of stock/);
assert.throws(()=>applyBuildModules(conicalStock,{pixelHoles:[{...conicalStud,entryFace:'top',
 surface:{y:18,normal:[0,1,0]}}]}),/level underside installation face/);
const surfacedConical=applyBuildModules(calibrationStock,{pixelHoles:[{...conicalStud,surface:{y:0,normal:[0,-1,0]}}]});
assert.throws(()=>prepareRecipe(THREE,wasm,surfacedConical),/continuous stock on its installation face/);
const shortConeProfile={...measuredProfile,bodyDiameter:5,bodyHeight:4,capHeight:1,flangeDiameter:6,flangeHeight:.5};
const conicalCoupon=makeRoutedSocketSpecimen(measuredProfile,{clearance:.3,retentionLip:.4,conical:true});
assert.equal(conicalCoupon.nativeRouting.links.length,3);
const familyConeFixtures=new Map();
const familyShoulderFixtures=new Map();
const familyRetainedConeFixtures=new Map();
const familyWireFitFixtures=new Map();
const familyWideRouteFixtures=new Map();
const familyBentRouteFixtures=new Map();
const familyTabFixtures=new Map();
const familyPocketFixtures=new Map();
for(const [family,parameters] of [
 [gearGenerator,{mode:'Decorative',wheelStyle:'Rounded lobes',webStyle:'Solid',diameter:80,bore:0,reliefStyle:'None'}],
 [tileGenerator,{pattern:'terraces',width:80,depth:80,thickness:14}],
 [waveGenerator,{flowStyle:'Parallel'}],
 [capGenerator,{controlStyle:'Pushbutton',shaft:0}],
 [characterGenerator,{character:'Cloud',construction:'Classic'}],
 [pebbleGenerator,{shellForm:'Beacon',illuminated:false}]
]){
 const source=family.recipe({...parameters,dualMaterial:false});
 const fixture=applyBuildModules(source,{pixelBacking:true,pixelBackingThickness:10,pixelHoles:[{
  ...conicalStud,diameter:5,clearance:.3,x:0,z:0,socketProfile:shortConeProfile
 }]},family.capabilities);
 const [preview]=nativeFittingPreviews(THREE,wasm,fixture);
 assert.deepEqual(preview.warnings,[],family.typeId+' conical roof has enough actual stock');
 const positive=new wasm.Manifold(preview.positive),negative=new wasm.Manifold(preview.negative);
 const exposed=positive.subtract(negative);
 try{
  assert(exposed.volume()<.02,family.typeId+' conical cutter encloses the full measured housing');
 }finally{exposed.delete();negative.delete();positive.delete();}
 familyConeFixtures.set(fixture,family.typeId);
 const tapered=applyBuildModules(source,{pixelBacking:true,pixelBackingThickness:10,pixelHoles:[{
  ...conicalStud,diameter:5,clearance:.3,x:0,z:0,supportFreeShoulders:true,socketProfile:shortConeProfile
 }]},family.capabilities);
 const [taperedPreview]=nativeFittingPreviews(THREE,wasm,tapered);
 assert.deepEqual(taperedPreview.warnings,[],family.typeId+' tapered shoulder has enough actual stock');
 assert.equal(taperedPreview.insertionDepth,4.5);
 const taperedCutter=new wasm.Manifold(taperedPreview.negative);
 const taperedPixel=new wasm.Manifold(taperedPreview.positive);
 const exposedPixel=taperedPixel.subtract(taperedCutter);
 try{
  assert(exposedPixel.volume()<.02,family.typeId+' tapered fitting preserves measured housing clearance');
 }finally{exposedPixel.delete();taperedPixel.delete();taperedCutter.delete();}
 familyShoulderFixtures.set(tapered,family.typeId);
 const wideProfile={...measuredProfile,bodyHeight:7};
 for(const vaulted of [false,true]){
  const build={pixelBuilderVersion:1,pixelBacking:true,pixelBackingThickness:10,
   pixelHoles:[-15,15].map((x,i)=>({...checked('wide-route-'+i,x),diameter:8,entryFace:'underside',socketProfile:wideProfile})),
   serialRouting:{...serial,channelWidthMm:6,vaulted}};
  const wide=applyBuildModules(source,build,family.capabilities);
  if(vaulted)assert.throws(()=>applyBuildModules(source,{...build,pixelBackingThickness:4},family.capabilities),
   /solid backing for the groove and roof/);
  familyWideRouteFixtures.set(wide,{name:family.typeId,vaulted});
 }
 for(const width of [3.2,4]){
  const profile={...shortConeProfile,bodyHeight:7,retentionLip:.15};
  const recipe=applyBuildModules(source,{pixelBuilderVersion:1,pixelBacking:true,pixelBackingThickness:10,
   pixelHoles:[-15,15].map((x,i)=>({...checked('wire-fixture-'+i,x),entryFace:'underside',socketProfile:profile})),
   serialRouting:{...serial,channelWidthMm:width}},family.capabilities);
  if(width===3.2){
   const {edgePositions}=recipe.nativeRouting;
   const build={pixelBuilderVersion:1,pixelBacking:true,pixelBackingThickness:10,
    pixelHoles:[-15,15].map((x,i)=>({...checked('bent-route-'+i,x),entryFace:'underside',socketProfile:profile})),
    serialRouting:{...serial,inEdgePercent:edgePositions.in-1,outEdgePercent:edgePositions.out+1}};
   const bent=applyBuildModules(source,build,family.capabilities);
   familyBentRouteFixtures.set(bent,family.typeId);
  }
  familyWireFitFixtures.set(recipe,{name:family.typeId,width});
 }
 const variants=[
  {label:'baseline',clearance:.2,flange:4,retentionLip:.15,sections:[4.2,3.2,3.5,2.3],apex:7.15},
  {label:'clearance edit',clearance:.3,flange:4,retentionLip:.15,sections:[4.3,3.3,3.6,2.4],apex:7.2},
  {label:'retention edit',clearance:.2,flange:4,retentionLip:.25,sections:[4.2,3,3.5,2.3],apex:7.15},
  {label:'flange edit',clearance:.2,flange:4.3,retentionLip:.15,sections:[4.5,3.2,3.5,2.3],apex:7.15},
  {label:'body depth edit',clearance:.2,flange:4,retentionLip:.15,bodyHeight:5.45,sections:[4.2,3.2,3.5,2.4],apex:7.2}
 ];
 for(const {label,clearance,flange,retentionLip,bodyHeight=5.4,sections,apex} of variants){
  const retainedProfile={...shortConeProfile,bodyDiameter:3.3,bodyHeight,flangeDiameter:flange,retentionLip};
  const retained=applyBuildModules(source,{pixelBacking:true,pixelBackingThickness:10,pixelHoles:[{
   ...conicalStud,diameter:3.3,clearance,x:0,z:0,socketProfile:retainedProfile
  }]},family.capabilities);
  familyRetainedConeFixtures.set(retained,{name:family.typeId+' '+label,sections,apex});
 }
 for(const [profile,diameter,depth] of [['Magnet pocket',6.2,3],['Threaded insert pilot',4.1,5]]){
  const pocket=applyBuildModules(source,{pixelBacking:true,pixelBackingThickness:10,
   manualMountHoles:[{id:'blind',x:0,z:0,diameter:3.4,entryFace:'underside',profile,recessDiameter:diameter,recessDepth:depth}]
  },family.capabilities);
  assert.equal(pocket.negative.filter(cut=>cut.mountId==='blind').length,1);
  familyPocketFixtures.set(pocket,{name:family.typeId+' '+profile,diameter,depth});
 }
 for(const profile of ['Counterbore','Countersink']){
  const tabFixture=applyBuildModules(source,{pixelBacking:true,pixelBackingThickness:8,
   backingTabs:[{u:.125,profile,recessDepth:3}]},family.capabilities);
  familyTabFixtures.set(tabFixture,{family:family.typeId,profile});
 }
}
const wideVault=calibratedCut({channelWidthMm:6,vaulted:true});
const measuredReplica=makePixelReplicaRecipe(measuredProfile);
const dimensionFixtures=new Map([
 [calibratedCut(),{name:'baseline',bore:8.3,flange:9.3,throat:8.3,width:3.2}],
 [calibratedCut({clearance:.6}),{name:'bore only',bore:8.6,flange:9.6,throat:8.6,width:3.2}],
 [calibratedCut({retentionLip:.4}),{name:'retention only',bore:8.3,flange:9.3,throat:7.5,width:3.2}],
 [calibratedCut({channelWidthMm:6}),{name:'wire width only',bore:8.3,flange:9.3,throat:8.3,width:6}]
]);
for(const holeDiameter of [0,9,NaN])
 assert.throws(()=>applyBuildModules(flatStock,{mounting:true,holeDiameter},{supportsMounting:true}),/spacing or diameter is unsafe/);
assert.throws(()=>applyBuildModules(flatStock,{mounting:true,holeDiameter:4,spacing:NaN},{supportsMounting:true}),/spacing or diameter is unsafe/);
const fixingFixtures=new Map(['Underside counterbores','Underside countersinks'].map(style=>[
 applyBuildModules(flatStock,{mounting:true,mountStyle:style,spacing:30,holeDiameter:4},{supportsMounting:true}),style
]));
const manualRecess={id:'manual-recess',x:-15,z:0,entryFace:'underside',diameter:4,profile:'Countersink',recessDiameter:7,recessDepth:3};
const manualRecipe=applyBuildModules(flatStock,{manualMountHoles:[manualRecess]});
assert.equal(manualRecipe.negative.find(cut=>cut.manualMountRecess).topRadius,2);
assert.equal(prepareRecipe(THREE,wasm,manualRecipe).bodies.length,1);
assert.throws(()=>applyBuildModules(flatStock,{manualMountHoles:[{...manualRecess,entryFace:'top'}]}),/supported planar top face/);
assert.throws(()=>applyBuildModules(flatStock,{manualMountHoles:[{...manualRecess,recessDiameter:4}]}),/wider than the through-hole/);
assert.throws(()=>prepareRecipe(THREE,wasm,{...manualRecipe,positive:[{kind:'box',size:[70,4,40],position:[0,2,0]}]}),/needs continuous underside stock/);
const topRecessRecipe=applyBuildModules(topRouteStock,{manualMountHoles:[{...manualRecess,entryFace:'top'}]});
assert.throws(()=>prepareRecipe(THREE,wasm,{...topRecessRecipe,
 positive:[{kind:'box',size:[70,4,40],position:[0,8,0]}]}),/needs continuous planar top stock/);
assert.throws(()=>prepareRecipe(THREE,wasm,{...topRecessRecipe,
 positive:[{kind:'box',size:[70,12,40],position:[0,6,0]}]}),/needs an unobstructed top opening/);
const tabRecessBuild={pixelBacking:true,pixelBackingThickness:8,backingTabs:[{u:.125,profile:'Counterbore',recessDepth:3}]};
const tabRecessRecipe=applyBuildModules(gearTopStock,tabRecessBuild,gearGenerator.capabilities);
const [tabX,,tabZ]=tabRecessRecipe.negative.find(cut=>cut.fixingRecess).position;
assert.throws(()=>prepareRecipe(THREE,wasm,applyBuildModules(gearTopStock,
 {...tabRecessBuild,pixelBackingThickness:4},gearGenerator.capabilities)),/Tab 1 recess needs continuous underside stock/);
assert.throws(()=>prepareRecipe(THREE,wasm,applyBuildModules(gearTopStock,
 {...tabRecessBuild,backingTabs:[{...tabRecessBuild.backingTabs[0],recessDiameter:8}]},
 gearGenerator.capabilities)),/Tab 1 recess needs continuous underside stock/);
for(const [fixture] of fixingFixtures){
 const thin={...fixture,positive:[{kind:'box',size:[70,2.8,40],position:[0,1.4,0]}]};
 assert.throws(()=>prepareRecipe(THREE,wasm,thin),/needs continuous underside stock/);
 const interrupted={...fixture,negative:[...fixture.negative,{kind:'box',size:[1,2,2],position:[18.5,1,0]}]};
 assert.throws(()=>prepareRecipe(THREE,wasm,interrupted),/too close to another cut/);
}
for(const fixture of [...fixingFixtures.keys(),...familyConeFixtures.keys(),...familyShoulderFixtures.keys(),...familyRetainedConeFixtures.keys(),...familyWireFitFixtures.keys(),...familyWideRouteFixtures.keys(),...familyBentRouteFixtures.keys(),conicalRecipe,conicalCoupon,...familyTabFixtures.keys(),...familyPocketFixtures.keys(),tabRecessRecipe,topRecessRecipe,wideVault,vaultedStock,pinnedVault,topRouted,sideRouted,rearRouted,...perpendicularRoutes,perpendicularCompactSeat,curvedSeatOnly,calibratedWaveRecipe,curvedWaveRoute,measuredWaveRoute,raisedWaveRoute,biaxialRoute,biaxialPinned,safelyMountedRoute,measuredReplica,...dimensionFixtures.keys()]){
 const vaultedNativeFiles=exportMaterialBodies(prepareRecipe(THREE,wasm,fixture));
 const stl=Uint8Array.from(vaultedNativeFiles.stls[0].bytes);
 const stlGeometry=new STLLoader().parse(stl.buffer);
 const zip=Buffer.from(vaultedNativeFiles.threeMF);
 let xml='';
 for(let i=0;zip.readUInt32LE(i)===0x04034b50;){
  const nameLength=zip.readUInt16LE(i+26),start=i+30+nameLength+zip.readUInt16LE(i+28),size=zip.readUInt32LE(i+18);
  if(zip.toString('utf8',i+30,i+30+nameLength)==='3D/3dmodel.model'){
   assert.equal(zip.readUInt16LE(i+8),0);
   xml=zip.toString('utf8',start,start+size);break;
  }
  i=start+size;
 }
 assert.match(xml,/<model unit="millimeter"/);
 const vertices=[...xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g)].flatMap(m=>m.slice(1).map(Number));
 const indices=[...xml.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"/g)].flatMap(m=>m.slice(1).map(Number));
 const threeMFGeometry=new THREE.BufferGeometry();
 threeMFGeometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 threeMFGeometry.setIndex(indices);
 for(const [format,geometry] of [['STL',stlGeometry],['3MF',threeMFGeometry]]){
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geometry,material);
  const intersections=(origin,direction)=>new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction)).intersectObject(mesh);
  const hit=(origin,direction)=>intersections(origin,direction)[0]?.point;
  const assertOpenRun=(a,b,lateral,label,heights=[.35,1.5])=>{
   const start=new THREE.Vector3(a.x,-a.z,0),end=new THREE.Vector3(b.x,-b.z,0);
   const direction=end.clone().sub(start),length=direction.length();
   direction.normalize();
   const normal=new THREE.Vector3(-direction.y,direction.x,0);
   for(const height of heights)for(const width of [-lateral,0,lateral]){
    const origin=start.clone().addScaledVector(normal,width);
    origin.z=height;
    const ray=new THREE.Raycaster(origin,direction,0,length+.0001);
    assert.equal(ray.intersectObject(mesh).length,0,format+' unobstructed '+label+' at '+width+' mm, height '+height+' mm');
   }
   return length;
  };
  const assertSideStock=(origin,normal,label)=>{
   for(const sign of [-1,1]){
    const hits=intersections(origin,[sign*normal.x,sign*normal.y,0]);
    const inner=hits[0];
    const outer=inner&&hits.find(candidate=>candidate.distance-inner.distance>1e-4);
    assert(outer&&outer.distance-inner.distance>=.55,format+' retains at least 0.55 mm of continuous side stock at '+label);
   }
  };
  const dimensions=dimensionFixtures.get(fixture);
  const fixingStyle=fixingFixtures.get(fixture);
  if(fixingStyle){
   const span=(x,height)=>{
    const left=hit([x,0,height],[0,-1,0]),right=hit([x,0,height],[0,1,0]);
    assert(left&&right,format+' fixing walls at '+x);
    return right.y-left.y;
   };
   for(const x of [-15,15]){
    assert.equal(hit([x,0,-1],[0,0,1]),undefined,format+' fastener bore passes through the body');
    assert(Math.abs(span(x,2)-4)<.005,format+' 4 mm through-bore');
    if(fixingStyle==='Underside counterbores'){
     assert(Math.abs(span(x,.4)-6)<.005,format+' 6 mm parallel recess');
     const shoulder=hit([x,2.5,-1],[0,0,1]);
     assert(shoulder&&Math.abs(shoulder.z-1.4)<.005,format+' actual 1.4 mm recess depth');
     const top=hit([x,2.5,11],[0,0,-1]);
     assert(top&&Math.abs(top.z-shoulder.z-8.6)<.005,format+' actual 8.6 mm stock behind recess');
    }else{
     assert(Math.abs(span(x,.2)-5.5)<.005,format+' countersink tapers from the open face');
     assert(Math.abs(span(x,1)-4.5)<.005,format+' countersink narrows towards the through-bore');
    }
   }
  }else if(dimensions){
   if(dimensions.name==='baseline')assertOpenRun({x:-35.1,z:0},{x:35.1,z:0},1.45,'straight route including both shaped-socket junctions');
   const span=(centre)=>{
    const left=hit(centre,[0,-1,0]),right=hit(centre,[0,1,0]);
    assert(left&&right,format+' cavity side walls exist');
    return Math.abs(right.y-left.y);
   };
   for(const [height,expected] of [[.7,dimensions.flange],[2.8,dimensions.throat],[4.5,dimensions.bore]])
    assert(Math.abs(span([-15,0,height])-expected)<.02,format+' '+dimensions.name+' section at '+height+' mm');
   assert(Math.abs(span([0,0,.8])-dimensions.width)<.02,format+' '+dimensions.name+' route width');
   const apex=hit([-15,0,-1],[0,0,1]);
   assert(apex&&Math.abs(apex.z-9)<.01,format+' shaped socket roof stays at the measured 9 mm body length');
  }else if(familyConeFixtures.has(fixture)){
   const name=familyConeFixtures.get(fixture);
   const apex=hit([0,0,-1],[0,0,1]);
   const left=hit([0,0,5],[0,-1,0]),right=hit([0,0,5],[0,1,0]);
   assert(apex&&Math.abs(apex.z-6.65)<.01,format+' '+name+' conical apex');
   assert(left&&right&&Math.abs(left.distanceTo(right)-3.3)<.01,format+' '+name+' conical slope');
  }else if(familyWideRouteFixtures.has(fixture)){
   const {name,vaulted}=familyWideRouteFixtures.get(fixture);
   geometry.computeBoundingBox();
   const bounds=geometry.boundingBox;
   const inX=bounds.min.x,outX=bounds.max.x;
   const links=fixture.nativeRouting.links;
   assert.equal(links.length,3);
   assert(Math.abs(links[0].path[0].x-inX)<.01&&Math.abs(links[2].path.at(-1).x-outX)<.01,
    format+' '+name+' IN and OUT reach the exported perimeter');
   assertOpenRun({x:inX-.1,z:0},{x:outX+.1,z:0},2.85,name+' 6 mm route through both sockets and exterior walls');
   if(vaulted)assertOpenRun({x:inX-.1,z:0},{x:outX+.1,z:0},.85,name+' upper vault',[2.4,3.5]);
   for(const x of [inX+.2,0,outX-.2]){
    const left=hit([x,0,1],[0,-1,0]),right=hit([x,0,1],[0,1,0]);
    const roof=hit([x,0,-1],[0,0,1]);
    assert(left&&right&&Math.abs(left.distanceTo(right)-6)<.01,format+' '+name+' 6 mm route width');
    const expectedRoof=vaulted?1.8+3/.9:1.8;
    assert(roof&&Math.abs(roof.z-expectedRoof)<.01,format+' '+name+' route depth');
    if(vaulted){
     const u=hit([x,0,3.8],[0,-1,0]),v=hit([x,0,3.8],[0,1,0]);
     assert(u&&v&&Math.abs(u.distanceTo(v)-2.4)<.01,format+' '+name+' roof taper');
     const exterior=hit([x,0,bounds.max.z+1],[0,0,-1]);
     assert(exterior&&exterior.z-roof.z>2,format+' '+name+' leaves stock above the apex');
    }
   }
   const portAllowance=Math.abs(links[0].path.at(-1).x+15)+Math.abs(links[2].path[0].x-15);
   assert(Math.abs(links.reduce((sum,link)=>sum+link.measure,0)+portAllowance-(outX-inX))<.01,
    format+' '+name+' published length and port allowances match the open span');
  }else if(familyBentRouteFixtures.has(fixture)){
   const name=familyBentRouteFixtures.get(fixture),links=fixture.nativeRouting.links;
   assert.equal(links.length,3);
   assert(Math.abs(links[0].path[0].z)>.5&&Math.abs(links[2].path.at(-1).z)>.5);
   const seats=[{x:-15,z:0},{x:15,z:0}];
   for(const [i,link] of links.entries()){
    const points=[...link.path];
    if(i>0)points.unshift(seats[i-1]);
    if(i<seats.length)points.push(seats[i]);
    for(let j=1;j<points.length;j++)
     assertOpenRun(points[j-1],points[j],.55,name+' '+link.label+' segment '+j);
   }
   for(const [edge,direction] of [[links[0].path[0],-1],[links[2].path.at(-1),1]])
    assertOpenRun({x:edge.x+direction*.2,z:edge.z},{x:edge.x-direction*.2,z:edge.z},.55,name+' exterior opening');
  }else if(familyWireFitFixtures.has(fixture)){
   const {name,width}=familyWireFitFixtures.get(fixture);
   const span=(x,height)=>{
    const left=hit([x,0,height],[0,-1,0]),right=hit([x,0,height],[0,1,0]);
    assert(left&&right,format+' '+name+' paired section');
    return left.distanceTo(right);
   };
   assert(Math.abs(span(0,.9)-width)<.015,format+' '+name+' independent channel width');
   for(const [height,expected] of [[.4,6.3],[2.8,5],[4.5,5.3]])
    assert(Math.abs(span(-15,height)-expected)<.015,format+' '+name+' unchanged bore section at '+height);
   const apex=hit([-15,0,-1],[0,0,1]);
   assert(apex&&Math.abs(apex.z-7)<.01,format+' '+name+' unchanged insertion depth');
  }else if(familyShoulderFixtures.has(fixture)){
   const label=format+' '+familyShoulderFixtures.get(fixture);
   const apex=hit([0,0,-1],[0,0,1]);
   assert(apex&&Math.abs(apex.z-7.15)<.01,label+' raised pointed roof');
   // Wire reliefs run along X, leaving the Y section of the shoulder visible.
   for(const [height,diameter] of [[.3,6.3],[.75,5.8],[1.2,5.3],[2.5,5.3]]){
    const left=hit([0,0,height],[0,-1,0]),right=hit([0,0,height],[0,1,0]);
    assert(left&&right&&Math.abs(left.distanceTo(right)-diameter)<.015,label+' taper section at '+height);
   }
  }else if(familyRetainedConeFixtures.has(fixture)){
   const {name,sections,apex:expectedApex}=familyRetainedConeFixtures.get(fixture);
   const apex=hit([0,0,-1],[0,0,1]);
   assert(apex&&Math.abs(apex.z-expectedApex)<.01,format+' '+name+' apex retains the full insertion length');
   for(const [height,diameter] of [.4,2.8,4.5,6].map((height,i)=>[height,sections[i]])){
    const left=hit([0,0,height],[0,-1,0]),right=hit([0,0,height],[0,1,0]);
    assert(left&&right&&Math.abs(left.distanceTo(right)-diameter)<.015,format+' '+name+' retained cone diameter at '+height);
   }
  }else if(fixture===conicalRecipe||fixture===conicalCoupon){
   const apex=hit([-15,0,-1],[0,0,1]);
   assert(apex&&Math.abs(apex.z-13.15)<.01,format+' conical ceiling adds 4.15 mm above the measured 9 mm body');
   for(const [height,diameter] of [[.6,9.3],[2.8,7.5],[5,8.3],[10,6.3],[12,2.3]]){
    const left=hit([-15,0,height],[0,-1,0]),right=hit([-15,0,height],[0,1,0]);
    assert(left&&right&&Math.abs(left.distanceTo(right)-diameter)<.015,format+' conical seat at '+height+' mm');
   }
  }else if(familyPocketFixtures.has(fixture)){
   const {name,diameter,depth}=familyPocketFixtures.get(fixture);
   const left=hit([0,0,1],[-1,0,0]),right=hit([0,0,1],[1,0,0]);
   const floor=hit([0,0,-1],[0,0,1]);
   assert(left&&right&&Math.abs(left.distanceTo(right)-diameter)<.01,format+' '+name+' diameter');
   assert(floor&&Math.abs(floor.z-depth)<.01,format+' '+name+' stops at the specified floor');
  }else if(familyTabFixtures.has(fixture)){
   const {family,profile}=familyTabFixtures.get(fixture);
   const [x,,z]=fixture.negative.find(cut=>cut.fixingRecess).position;
   const span=height=>{
    const left=hit([x,-z,height],[-1,0,0]),right=hit([x,-z,height],[1,0,0]);
    assert(left&&right,format+' '+family+' '+profile+' wall exists');
    return left.distanceTo(right);
   };
   const taper=profile==='Countersink';
   for(const [height,width] of [[.6,taper?4.76:5.1],[2.4,taper?3.74:5.1],[4,3.4]])
    assert(Math.abs(span(height)-width)<.02,format+' '+family+' '+profile+' diameter at '+height);
   const probeX=x+2;
   const floor=hit([probeX,-z,-1],[0,0,1]),top=hit([probeX,-z,9],[0,0,-1]);
   const expectedDepth=taper?3*(2.55-2)/.85:3;
   assert(floor&&top&&Math.abs(floor.z-expectedDepth)<.02&&Math.abs(top.z-8)<.01,
    format+' '+family+' '+profile+' depth and residual material');
  }else if(fixture===tabRecessRecipe){
   for(const [height,diameter] of [[1,5.1],[4,3.4]]){
    const left=hit([tabX,-tabZ,height],[-1,0,0]),right=hit([tabX,-tabZ,height],[1,0,0]);
    assert(left&&right&&Math.abs(left.distanceTo(right)-diameter)<.01,format+' recessed tab diameter at '+height+' mm');
   }
   const shoulder=hit([tabX+2,-tabZ,-1],[0,0,1]),top=hit([tabX+2,-tabZ,9],[0,0,-1]);
   assert(shoulder&&top&&Math.abs(shoulder.z-3)<.01&&Math.abs(top.z-shoulder.z-5)<.01,format+' recessed tab depth and remaining stock');
  }else if(fixture===topRecessRecipe){
   for(const [height,diameter] of [[9.9,6.9],[8,5],[6,4]]){
    const left=hit([-15,0,height],[0,-1,0]),right=hit([-15,0,height],[0,1,0]);
    assert(left&&right&&Math.abs(left.distanceTo(right)-diameter)<.01,format+' top countersink section at '+height+' mm');
   }
   const taper=hit([-15,2.5,5],[0,0,1]);
   assert(taper&&Math.abs(taper.z-8)<.01,format+' measured taper depth and residual stock');
  }else if(fixture===measuredReplica){
   const apex=hit([0,0,12],[0,0,-1]);
   const flange=hit([0,8,.7],[0,-1,0]),shaft=hit([0,8,4.5],[0,-1,0]);
   assert(apex&&Math.abs(apex.z-9)<.01,format+' positive measured length');
   assert(flange&&Math.abs(flange.y-4.5)<.01,format+' positive 9 mm flange');
   assert(shaft&&Math.abs(shaft.y-4)<.01,format+' positive 8 mm body');
  }else if(fixture===safelyMountedRoute){
   assert.equal(hit([0,-12,-1],[0,0,1]),undefined,format+' mount remains a through-hole');
   const left=hit([0,-12,4],[-1,0,0]),right=hit([0,-12,4],[1,0,0]);
   assert(left&&right&&Math.abs(left.distanceTo(right)-3.4)<.005,format+' calibrated mounting-hole diameter');
   const mountWall=hit([0,-12,1],[0,1,0]),routeWall=hit([0,0,1],[0,-1,0]);
   assert(mountWall&&routeWall&&Math.abs(routeWall.y-mountWall.y-8.7)<.01,format+' continuous material between mounting hole and route');
  }else if(fixture===perpendicularCompactSeat){
   const apex=hit([46,0,10],[-1,0,0]);
   assert(apex&&Math.abs(apex.x-27)<.01,format+' perpendicular socket is open and 18 mm deep');
   const left=hit([36,0,10],[0,-1,0]),right=hit([36,0,10],[0,1,0]);
   assert(left&&right&&Math.abs(left.distanceTo(right)-5.15)<.02,
    format+' perpendicular socket preserves the calibrated bore');
   const rear=hit([-46,0,10],[1,0,0]);
   assert(rear&&apex.x-rear.x>2.8,format+' continuous stock behind the perpendicular seat');
  }else if(fixture===curvedSeatOnly||fixture===calibratedWaveRecipe){
   const seat=fixture===curvedSeatOnly?gentleSeat:calibratedWaveSeat;
   const point=new THREE.Vector3(seat.x,-seat.z,seat.surface.y);
   const [nx,ny,nz]=seat.surface.normal;
   const axis=new THREE.Vector3(nx,-nz,ny);
   const opening=point.clone().addScaledVector(axis,1);
   const apex=hit(opening.toArray(),axis.clone().negate().toArray());
   assert(apex&&Math.abs(point.distanceTo(apex)-seat.socketProfile.bodyHeight)<.01,format+' curved face socket depth follows the installed axis');
   const centre=point.clone().addScaledVector(axis,-4).toArray();
   const left=hit(centre,[0,-1,0]),right=hit(centre,[0,1,0]);
   assert(left&&right&&Math.abs(left.distanceTo(right)-seat.diameter-seat.clearance)<.02,format+' curved seat diametral clearance');
   const rear=hit([apex.x,apex.y,-1],[0,0,1]);
   assert(rear&&apex.z-rear.z>2.8,format+' leaves more than 2.8 mm of actual material behind the seat');
  }else if(fixture===biaxialPinned){
   const [link]=fixture.nativeRouting.links;
   const expected=[],measured=[];
   for(let i=0;i<link.path.length-1;i++){
    const a=link.path[i],b=link.path[i+1],x=(a.x+b.x)/2,y=-(a.z+b.z)/2,height=(a.y+b.y)/2;
    if(x< -77||x> -47)continue;
    const across=new THREE.Vector2(b.z-a.z,b.x-a.x).normalize();
    const left=hit([x,y,height-1],[-across.x,-across.y,0]);
    const right=hit([x,y,height-1],[across.x,across.y,0]);
    assert(left&&right&&Math.abs(left.distanceTo(right)-3.2)<.025,format+' curved Wave walls');
    const centre=left.clone().lerp(right,.5);
    const floor=hit([centre.x,centre.y,height+1],[0,0,-1]);
    assert(floor,format+' curved Wave floor is present');
    expected.push(new THREE.Vector3(x,y,height));
    measured.push(new THREE.Vector3(centre.x,centre.y,floor.z+1.8));
   }
   const length=points=>points.slice(1).reduce((sum,point,i)=>sum+point.distanceTo(points[i]),0);
   assert(measured.length>=8&&Math.abs(length(measured)-length(expected))<.05,format+' actual 3D span matches the plan');
   let bends=0;
   for(let i=2;i<measured.length-2;i+=2){
    const a=measured[i].clone().sub(measured[i-2]),b=measured[i+2].clone().sub(measured[i]);
    const cross=a.clone().cross(b).length();
    if(cross<.02)continue;
    const radius=a.length()*b.length()*a.clone().add(b).length()/(2*cross);
    assert(radius>=4.8,format+' actual 3D bend radius '+radius);
    bends++;
   }
   assert(bends>0,format+' samples include an actual bend');
  }else if(fixture===biaxialRoute){
   for(const [x,height] of biaxialSections){
    const origin=[x,18,height-1];
    const left=hit(origin,[0,-1,0]),right=hit(origin,[0,1,0]);
    assert(left&&right&&Math.abs(left.distanceTo(right)-3.2)<.02,format+' biaxial route width');
    const floor=hit([x,18,height+1],[0,0,-1]);
    assert(floor&&Math.abs(floor.z-(height-1.8))<.02,format+' biaxial route follows actual mesh height');
   }
   assert.equal(hit([-81,18,14.5],[1,0,0]),undefined,format+' biaxial route has two clear exterior apertures');
  }else if(fixture===raisedWaveRoute){
   for(const x of [-79.99,-60,-30,0,30,60,79.99]){
    const shoulder=hit([x,3,30],[0,0,-1]),floor=hit([x,0,30],[0,0,-1]);
    assert(shoulder&&floor&&Math.abs(shoulder.z-floor.z-1.8)<.025,
     format+' raised Wave channel follows the surface at '+x);
    const origin=[x,0,floor.z+.85];
    const left=hit(origin,[0,-1,0]),right=hit(origin,[0,1,0]);
    assert(left&&right&&Math.abs(right.y-left.y-3.2)<.025,format+' raised Wave channel width at '+x);
   }
   for(const sign of [-1,1]){
    const floor=hit([sign*79.99,0,30],[0,0,-1]);
    const edge=hit([sign*81,0,floor.z+.85],[-sign,0,0]);
    assert(!edge||Math.abs(edge.x-sign*80)>.1,format+' raised Wave exterior aperture is open');
   }
  }else if(fixture===curvedWaveRoute||fixture===measuredWaveRoute){
   const [width,depth]=fixture===measuredWaveRoute?[5.8,1.95]:[3.2,1.8];
   for(const x of [-79,-60,-30,0,30,60,79]){
    const origin=[x,0,14.8];
    const left=hit(origin,[0,-1,0]),right=hit(origin,[0,1,0]);
    assert(left&&right&&Math.abs(right.y-left.y-width)<.01,format+' Wave route cross-section width at '+x);
    const surface=hit([x,4,30],[0,0,-1]),floor=hit([x,0,30],[0,0,-1]);
    assert(surface&&floor&&Math.abs(surface.z-floor.z-depth)<.015,format+' Wave route follows actual surface height at '+x);
    assert(floor.z>2,format+' Wave route leaves material behind the groove');
   }
   assert.equal(hit([-81,0,14.8],[1,0,0]),undefined,format+' continuous Wave route through both exterior apertures');
   assert.equal(hit([81,0,14.8],[-1,0,0]),undefined,format+' open Wave route outlet');
  }else if(perpendicularRoutes.includes(fixture)){
   const sign=fixture.nativeRouting.face==='right'?1:-1;
   for(const y of [-23,-9,0,9,23]){
    const origin=[sign*39.2,y,10];
    const lower=hit(origin,[0,0,-1]),upper=hit(origin,[0,0,1]);
    assert(lower&&upper&&Math.abs(upper.z-lower.z-3.2)<.005,format+' perpendicular route width at '+y);
    const floor=hit([sign*41,y,10],[-sign,0,0]);
    assert(floor&&Math.abs(floor.x-sign*38.2)<.005,format+' perpendicular route depth at '+y);
   }
   assert.equal(hit([sign*39.2,-26,10],[0,1,0]),undefined,format+' continuous perpendicular route through inlet and outlet');
   assert.equal(hit([sign*39.2,26,10],[0,-1,0]),undefined,format+' open perpendicular outlet');
  }else if(fixture===sideRouted||fixture===rearRouted){
   const sign=fixture===sideRouted?1:-1;
   for(const x of [-38,-25,0,25,38]){
    const origin=[x,-sign*24.2,10];
    const lower=hit(origin,[0,0,-1]),upper=hit(origin,[0,0,1]);
    assert(lower&&upper&&Math.abs(upper.z-lower.z-3.2)<.005,format+' side-route width at '+x);
    const back=hit([x,-sign*26,10],[0,sign,0]);
    assert(back&&Math.abs(back.y+sign*23.2)<.005,format+' side-route depth at '+x);
   }
   assert.equal(hit([-41,-sign*24.2,10],[1,0,0]),undefined,format+' continuous side route through inlet and outlet');
   assert.equal(hit([41,-sign*24.2,10],[-1,0,0]),undefined,format+' open side outlet');
  }else if(fixture===topRouted){
   for(const x of [-34.99,-25,0,25,34.99]){
    const origin=[x,0,9];
    const left=hit(origin,[0,-1,0]),right=hit(origin,[0,1,0]);
    assert(left&&right&&Math.abs(right.y-left.y-3.2)<.005,format+' top-route width at '+x);
    assertSideStock(origin,{x:0,y:1},'top section '+x);
    const floor=hit([x,0,11],[0,0,-1]);
    assert(floor&&Math.abs(floor.z-8.2)<.005,format+' top-route depth at '+x);
   }
   assert.equal(hit([-36,0,9],[1,0,0]),undefined,format+' open top-route inlet');
   assert.equal(hit([36,0,9],[-1,0,0]),undefined,format+' open top-route outlet');
  }else if(fixture===wideVault){
   assertOpenRun({x:-35.1,z:0},{x:35.1,z:0},2.85,'6 mm usable route');
   assertOpenRun({x:-35.1,z:0},{x:35.1,z:0},.85,'6 mm upper vault',[2.4,3.5]);
   for(const x of [-34.9,0,34.9]){
    for(const [height,diameter] of [[1,6],[2.8,4.2],[3.8,2.4]]){
     const left=hit([x,0,height],[0,-1,0]),right=hit([x,0,height],[0,1,0]);
     assert(left&&right&&Math.abs(left.distanceTo(right)-diameter)<.01,format+' 6 mm vaulted section at '+x+', '+height);
    }
    const apex=hit([x,0,-1],[0,0,1]);
    assert(apex&&Math.abs(apex.z-(1.8+3/.9))<.01,format+' 6 mm vault apex at '+x);
   }
  }else if(fixture===vaultedStock){
   for(const x of [-34.99,-25,0,25,34.99]){
    const left=hit([x,0,1],[0,-1,0]);
    const right=hit([x,0,1],[0,1,0]);
    assert(left&&right,format+' has two side-wall intersections near '+x);
    assert(Math.abs(right.y-left.y-3.2)<.005,format+' full wire width near '+x);
    assertSideStock([x,0,1],{x:0,y:1},'straight section '+x);
    const ceiling=hit([x,.2,-1],[0,0,1]);
    assert(ceiling&&Math.abs(ceiling.z-(1.8+1.4/.9))<.005,format+' vaulted roof near '+x);
   }
   for(const x of [-35.2,35.2]){
    const direction=x<0?1:-1;
    assert.equal(hit([x,0,1],[direction,0,0]),undefined,format+' cable aperture stays open through both outer faces');
    const wall=hit([x,2,1],[direction,0,0]);
    assert(wall&&Math.abs(Math.abs(wall.x)-35)<.005,format+' stock remains beside the cable opening');
   }
  }else{
   const links=fixture.nativeRouting.links;
   const input=links[0].path[0],output=links.at(-1).path.at(-1);
   const socketCentres=flatBuild.pixelHoles;
   let verifiedLength=0;
   for(const [i,link] of links.entries()){
    const path=[...link.path];
    if(i>0)path.unshift(socketCentres[i-1]);
    if(i<socketCentres.length)path.push(socketCentres[i]);
    const length=path.slice(1).reduce((total,point,j)=>{
     const label=link.label+' segment '+j;
     assertOpenRun(path[j],point,.55,label+' upper vault',[2.35,2.7]);
     return total+assertOpenRun(path[j],point,1.45,label);
    },0);
    // Tail budgets begin at the socket port. Internal budgets are already centre-to-centre.
    const tailPort=i===0?link.path.at(-1):i===links.length-1?link.path[0]:null;
    const tailSeat=i===0?socketCentres[0]:socketCentres.at(-1);
    const allowance=tailPort?Math.hypot(tailPort.x-tailSeat.x,tailPort.z-tailSeat.z):0;
    const expected=link.measure+allowance;
    assert(Math.abs(length-expected)<.001,format+' open span agrees with cable length and socket allowances');
    verifiedLength+=length;
   }
   assert(verifiedLength>70,format+' verifies the full bent route across the 70 mm stock');
   console.log(format+' verified clear route through both sockets: '+verifiedLength.toFixed(3)+' mm');
   for(const [aperture,sign] of [[input,-1],[output,1]]){
    const y=-aperture.z;
    assertOpenRun({x:aperture.x+sign*.1,z:aperture.z},{x:aperture.x-sign*.1,z:aperture.z},1.45,'exterior opening');
    assertOpenRun({x:aperture.x+sign*.1,z:aperture.z},{x:aperture.x-sign*.1,z:aperture.z},.55,'upper exterior opening',[2.35,2.7]);
    const left=hit([aperture.x-sign*.01,y,1],[0,-1,0]),right=hit([aperture.x-sign*.01,y,1],[0,1,0]);
    assert(left&&right&&Math.abs(right.y-left.y-3.2)<.025,format+' full 3.2 mm aperture at exterior face');
    const shoulder=hit([aperture.x+sign*.1,y+2,1],[-sign,0,0]);
    assert(shoulder&&Math.abs(shoulder.x-aperture.x)<.005,format+' exterior stock remains next to the opening');
   }
   const curvedLinks=[fixture.nativeRouting.links[0],fixture.nativeRouting.links.at(-1)];
   for(const link of curvedLinks){
    let sections=0;
    const measured=[],planned=[];
    for(let i=0;i<link.path.length-1;i++){
     const a=link.path[i],b=link.path[i+1];
     const x=(a.x+b.x)/2,y=-(a.z+b.z)/2;
     // At the designed opening and socket junction the channel wall is
     // intentionally interrupted. Probe the continuous curved span.
     if(Math.abs(x)>32||Math.abs(x)<20)continue;
     const normal=new THREE.Vector2(b.z-a.z,b.x-a.x).normalize();
     const origin=[x,y,1];
     const left=hit(origin,[-normal.x,-normal.y,0]);
     const right=hit(origin,[normal.x,normal.y,0]);
     assert(left&&right,format+' curved wire walls at '+link.label+' section '+i);
     assert(Math.abs(left.distanceTo(right)-3.2)<.06,format+' curved width at '+link.label+' section '+i);
     assertSideStock(origin,normal,link.label+' section '+i);
     for(const height of [2.2,2.8]){
      const upperOrigin=[x,y,height];
      const upperLeft=hit(upperOrigin,[-normal.x,-normal.y,0]),upperRight=hit(upperOrigin,[normal.x,normal.y,0]);
      const expectedWidth=3.2-2*.9*(height-1.8);
      assert(upperLeft&&upperRight&&Math.abs(upperLeft.distanceTo(upperRight)-expectedWidth)<.08,
       format+' bent vault slopes preserve the tapered cross-section');
     }
     measured.push(left.clone().lerp(right,.5));
     planned.push(new THREE.Vector3(x,y,1));
     const upper=hit([x,y,11],[0,0,-1]);
     const ceiling=hit([x,y,-1],[0,0,1]);
     assert(ceiling&&upper&&upper.z-ceiling.z>6,format+' continuous roof stock at '+link.label+' section '+i);
     sections++;
    }
    assert(sections>=3,format+' sampled multiple curved cross-sections at '+link.label);
    const length=points=>points.slice(1).reduce((sum,p,i)=>sum+p.distanceTo(points[i]),0);
    assert(Math.abs(length(measured)-length(planned))<.06,format+' sampled centreline length matches the planned span');
    let bentSections=0;
    for(let i=1;i<measured.length-1;i++){
     const a=measured[i].clone().sub(measured[i-1]),b=measured[i+1].clone().sub(measured[i]);
     const area2=a.clone().cross(b).length();
     if(area2<.005)continue;
     const radius=a.length()*b.length()*a.clone().add(b).length()/(2*area2);
     assert(radius>=4.75,format+' sampled channel centreline bend radius: '+radius);
     bentSections++;
    }
    assert(bentSections>0,format+' centreline measurements include a bend');
   }
  }
  geometry.dispose();
  material.dispose();
 }
 if(fixture===measuredReplica||dimensionFixtures.has(fixture)||fixingFixtures.has(fixture))continue;
 if(fixture===perpendicularCompactSeat){
  console.log('WT-021 perpendicular Tile socket STL/3MF: 18 mm depth, 5.15 mm bore');
  continue;
 }
 if(fixture===raisedWaveRoute){
  console.log('WT-021 raised Wave STL/3MF: open 3.2 mm wide by 1.8 mm deep surface channel');
  continue;
 }
 if(fixture===measuredWaveRoute){
  console.log('WT-021 measured curved Wave cable passage STL/3MF: 5.8 mm width, 1.95 mm depth and open edges');
  continue;
 }
 if(fixture===calibratedWaveRecipe){
  console.log('WT-021 calibrated Wave socket STL/3MF: 11 mm depth, 5.2 mm bore');
  continue;
 }
 if(fixture===curvedSeatOnly){
  console.log('WT-021 curved Wave seat STL/3MF: 9 mm depth, 5.3 mm diameter, measured stock behind the seat');
  continue;
 }
 if(fixture===safelyMountedRoute){
  console.log('WT-021 routed Gear STL/3MF: 3.4 mm mounting through-hole and 8.7 mm web to the route');
  continue;
 }
 if(familyConeFixtures.has(fixture))console.log('WT-021 conical socket STL/3MF: '+familyConeFixtures.get(fixture)+' apex, slope and positive envelope passed.');
 if([vaultedStock,pinnedVault,topRouted,sideRouted,curvedWaveRoute].includes(fixture))console.log('WT-021 native STL/3MF sections: 3.2 mm width, surrounding stock and open apertures ('+(fixture===curvedWaveRoute?'curved Wave':fixture===sideRouted?'front':fixture===topRouted?'top':fixture===pinnedVault?'curved underside':'straight underside')+')');
}
const shallowActualStock={...vaultedStock,positive:[{kind:'box',size:[70,4,40],position:[0,2,0]}]};
assert.throws(()=>prepareRecipe(THREE,wasm,shallowActualStock),/lacks continuous material above the channel/);
const narrowActualStock={...vaultedStock,positive:[{kind:'box',size:[70,10,40],position:[0,5,-18.2]}]};
assert.throws(()=>prepareRecipe(THREE,wasm,narrowActualStock),/lacks continuous material beside the channel/);
const sideObstruction={...vaultedStock,negative:[...vaultedStock.negative,
 {kind:'box',size:[3,1.5,2],position:[0,.75,2.8]}]};
assert.throws(()=>prepareRecipe(THREE,wasm,sideObstruction),/intersects another cut beside the channel/);
const roofObstruction={...vaultedStock,negative:[...vaultedStock.negative,
 {kind:'box',size:[3,2,3],position:[0,5,0]}]};
assert.throws(()=>prepareRecipe(THREE,wasm,roofObstruction),/intersects another cut above the channel/);
assert.throws(()=>applyBuildModules(flatStock,{...pinnedBuild,serialRouting:{...serial,inEdgePercent:100}}),/Chosen IN edge/);
const guideBuild={...curveBuild,serialRouting:{...serial,enabled:false}};
const guideRecipe=applyBuildModules(tileRoute,guideBuild,{},{preview:true});
const boreOnly=applyBuildModules(tileRoute,guideBuild);
assert.equal(guideRecipe.nativeRouting.enabled,false);
assert.deepEqual(guideRecipe.nativeRouting.links,curvePlan.links);
assert.deepEqual(guideRecipe.nativeRouting.cutters,[]);
assert.deepEqual(guideRecipe.negative,boreOnly.negative);
assert.equal(boreOnly.nativeRouting.links.length,0);
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
// WT-020: every native family makes an actual, validated M1 through-hole
// using the same verified solid-column source as pixel bores. No mock preview.
for(const [family,parameters,options] of fittingCases){
 const source=family.recipe(parameters),build={...options,pixelBuilderVersion:1,pixelHoles:[]};
 const uncut=applyBuildModules(source,build,family.capabilities);
 const target=findPixelPosition(uncut,[],{id:'seed',bodyDiameter:5});
 assert(target,family.typeId+' must expose solid stock for a certified mount');
 const mount={id:'m-'+family.typeId,x:target.x,z:target.z,diameter:3.4,entryFace:'top'};
 const cut=applyBuildModules(source,{...build,manualMountHoles:[mount]},family.capabilities);
 assert.equal(cut.negative.filter(part=>part.mountHole).length,1,family.typeId+' has actual cutter');
 const visible=previewRecipe(THREE,cut);
 assert.equal(visible.children.filter(part=>part.userData.mountId).length,1,'Mount marker must match saved M1');
 disposeGroup(visible);
 const before=prepareRecipe(THREE,wasm,uncut).bodies.reduce((total,body)=>total+body.volume,0);
 const printed=prepareRecipe(THREE,wasm,cut);
 const after=printed.bodies.reduce((total,body)=>total+body.volume,0);
 assert(before-after>.1,family.typeId+' mount must subtract actual printable material');
 const files=exportMaterialBodies(printed,{name:'wt020-mount-'+family.typeId});
 assert(files.stls.length&&files.threeMF.length>100,'Mount persists in real STL/3MF export');
 assert.throws(()=>applyBuildModules(source,{...build,manualMountHoles:[mount],
  pixelHoles:[{...target,checked:true}]},family.capabilities),/another pixel|mount|close/i,
  family.typeId+' must reject overlapping LED and mount');
}
console.log('WT-020 native family mounting through-holes: actual Manifold volume, markers, STL/3MF and collision guards passed.');

console.log('WT-017 native family actual bores and export passed; Crystal checked by original hardware fixtures.');

// WT-021: real external fixing tabs on an explicitly enabled stationary backing.
for(const [family,parameters] of fittingCases){
 const source=family.recipe(parameters),build={pixelBacking:true};
 const backing=applyBuildModules(source,build,family.capabilities);
 const backingTabs=[{u:.125},{u:.625}];
 const recipe=applyBuildModules(source,{...build,backingTabs},family.capabilities);
 assert.equal(recipe.positive.length,backing.positive.length+2);
 assert.equal(recipe.negative.filter(cut=>cut.tabHole).length,2);
 assert(recipe.bounds.width>backing.bounds.width||recipe.bounds.depth>backing.bounds.depth);
 const before=prepareRecipe(THREE,wasm,backing);
 const after=prepareRecipe(THREE,wasm,recipe);
 assert.equal(after.bodies.length,1);
 assert(after.bodies[0].volume>before.bodies[0].volume+1);
 const files=exportMaterialBodies(after);
 assert(files.stls.length===1&&files.threeMF.length>100);
 assert.throws(()=>applyBuildModules(source,{...build,backingTabs:[{u:.125},{u:.125}]},family.capabilities),/overlapping/);
 assert.throws(()=>applyBuildModules(source,{backingTabs},family.capabilities),/stationary fitting backing/);
}
// Single-material Tiles have separate fitting-backing capability from legacy base.
assert.equal(tileGenerator.capabilities.supportsBase,false);
assert.equal(tileGenerator.capabilities.supportsStationaryFittingBacking,true);
const knobSettings={controlStyle:'Rotary knob',shaft:0,diameter:70,height:19,dualMaterial:false};
const knobBacking={pixelBacking:true,pixelBackingThickness:10,backingTabs:[{u:.125},{u:.625}]};
assert.throws(()=>applyBuildModules(capGenerator.recipe(knobSettings),knobBacking,capGenerator.capabilities),/Stationary display/);
const stationaryKnob=applyBuildModules(capGenerator.recipe({...knobSettings,knobInstallation:'Stationary display'}),knobBacking,capGenerator.capabilities);
assert.equal(stationaryKnob.negative.filter(part=>part.tabHole).length,2);
assert.equal(prepareRecipe(THREE,wasm,stationaryKnob).bodies.length,1);
assert.throws(()=>applyBuildModules(tileGenerator.recipe({pattern:'grass',dualMaterial:true}),
 {pixelBacking:true,backingTabs:[{u:.125}]},tileGenerator.capabilities),
 /stationary single-material|dual-material/);
assert.throws(()=>applyBuildModules(tileGenerator.recipe({pattern:'grass',dualMaterial:false}),
 {backingTabs:[{u:.125}]},tileGenerator.capabilities),
 /stationary fitting backing/);
console.log('WT-021 attached backing tabs: six native families, volume, union, fixing cuts and STL/3MF.');

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

const vaultedSpecimen=makeRoutedSocketSpecimen(PIXEL_PRESETS[0],{vaulted:true,channelWidthMm:6});
assert.equal(vaultedSpecimen.nativeRouting.cutters.length,3);
assert.equal(vaultedSpecimen.nativeRouting.channelWidthMm,6);
for(const {mesh} of vaultedSpecimen.nativeRouting.cutters){
 assert(mesh.points[10]>mesh.points[7],'Roof rises above the original usable channel depth');
 assert(mesh.points[7]>0,'Rectangular usable section is preserved');
 assert(Math.abs(Math.hypot(mesh.points[3]-mesh.points[0],mesh.points[5]-mesh.points[2])-6)<1e-6,'Actual cutter entry width is 6 mm');
}
assert(prepareRecipe(THREE,wasm,vaultedSpecimen).bodies.length>0,'Vaulted routed specimen prepares with Manifold');
const routeSpecimen=makeRoutedSocketSpecimen(PIXEL_PRESETS[0],{clearance:.15,retentionLip:.2});
assert.equal(routeSpecimen.negative.filter(part=>part.kind==='pixel-seat').length,2);
assert.equal(routeSpecimen.negative.filter(part=>part.wireChannel).length,3);
const routedSocketMesh=prepareRecipe(THREE,wasm,routeSpecimen);
assert.equal(routedSocketMesh.bodies.length,1);
assert(routedSocketMesh.bodies[0].volume<70*40*26-1000);
const routedSocketFiles=exportMaterialBodies(routedSocketMesh);
assert(routedSocketFiles.stls[0].bytes.length>84&&routedSocketFiles.threeMF.length>100);
const thinSocket={...routeSpecimen,positive:[{kind:'box',size:[70,10,40],position:[0,5,0]}]};
assert.throws(()=>prepareRecipe(THREE,wasm,thinSocket),/continuous underside stock/);

const specimenSolid=routedSocketMesh.bodies[0].mesh;
const specimenGeometry=new THREE.BufferGeometry();
const specimenPositions=[];
for(let i=0;i<specimenSolid.vertProperties.length;i+=specimenSolid.numProp)
 specimenPositions.push(...specimenSolid.vertProperties.subarray(i,i+3));
specimenGeometry.setAttribute('position',new THREE.Float32BufferAttribute(specimenPositions,3));
specimenGeometry.setIndex(Array.from(specimenSolid.triVerts));
const specimenMaterial=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
const specimenMesh=new THREE.Mesh(specimenGeometry,specimenMaterial);
const pathRay=new THREE.Raycaster(new THREE.Vector3(-36,.8,0),new THREE.Vector3(1,0,0),0,72);
assert.equal(pathRay.intersectObject(specimenMesh).length,0,'The printed route is open across IN, both seats and OUT');
const undersideRoof=new THREE.Raycaster(new THREE.Vector3(0,-1,0),new THREE.Vector3(0,1,0));
assert(Math.abs(undersideRoof.intersectObject(specimenMesh)[0].point.y-2)<.01,'The groove is recessed 2 mm and has a roof');
specimenGeometry.dispose();specimenMaterial.dispose();

const sourceSeat=routeSpecimen.negative.find(part=>part.kind==='pixel-seat');
const faceBlock={...routeSpecimen,nativeRouting:null,positive:[{kind:'box',size:[70,30,40],position:[0,15,0]}]};
const topSeat={...sourceSeat,position:[0,0,0],surface:{y:30,normal:[0,1,0]}};
const sideSeat={...sourceSeat,position:[35,0,0],surface:{y:15,normal:[1,0,0]}};
const solidBlock=prepareRecipe(THREE,wasm,{...faceBlock,negative:[]}).bodies[0];
for(const seat of [topSeat,sideSeat]){
 const preview=previewRecipe(THREE,{...faceBlock,negative:[seat]});
 try{
  const marker=preview.children.find(child=>child.userData.pixelId===seat.pixelId);
  const outward=new THREE.Vector3(...seat.surface.normal);
  const position=new THREE.Vector3(seat.position[0],seat.surface.y,seat.position[2]).addScaledVector(outward,.3);
  assert(marker.position.distanceTo(position)<1e-6,'The selectable marker must sit on the actual socket opening');
  assert(new THREE.Vector3(0,0,1).applyQuaternion(marker.quaternion).distanceTo(outward)<1e-6,
   'The selectable marker must face the saved installation normal');
 }finally{disposeGroup(preview);}
 const prepared=prepareRecipe(THREE,wasm,{...faceBlock,negative:[seat]});
 assert.equal(prepared.bodies.length,1);
 assert(solidBlock.volume-prepared.bodies[0].volume>1000);
 const mesh=prepared.bodies[0].mesh,p=mesh.vertProperties,n=mesh.numProp;
 const [x,,z]=seat.position,{y,normal}=seat.surface;
 const points=Array.from({length:p.length/n},(_,i)=>new THREE.Vector3(...p.subarray(i*n,i*n+3)));
 assert(points.some(point=>{
  const delta=point.clone().sub(new THREE.Vector3(x,y,z));
  const depth=-delta.dot(new THREE.Vector3(...normal));
  return depth>20&&depth<23&&delta.length()<24;
 }),'The dome is cut inward from the installation face');
 assert(exportMaterialBodies(prepared).threeMF.length>100);
}
assert.throws(()=>prepareRecipe(THREE,wasm,{...faceBlock,negative:[{...topSeat,surface:{y:10,normal:[0,1,0]}}]}),
 /obstructed insertion opening/);
