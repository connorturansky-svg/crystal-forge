import assert from 'node:assert/strict';
import {GEAR_TOP_PRESETS,newGearTopControl,validateGearTopControl,gearTopPlacementIssue,
 gearTopMesh,withGearTopControls} from '../studio-gear-top-controls.js';
import {gearGenerator,applyBuildModules} from '../studio-catalogue.js';

const base=gearGenerator.recipe({...gearGenerator.defaultParameters,bore:8,webStyle:'Solid',diameter:100});
assert.equal(base.gearHost.shaftBore,8);
assert.equal(GEAR_TOP_PRESETS.length,10);
assert(new Set(GEAR_TOP_PRESETS.map(item=>item.id)).size===GEAR_TOP_PRESETS.length);
const knob=newGearTopControl('knob-1','fluted-knob');
assert.equal(gearTopPlacementIssue(knob,base.gearHost),null);
const spindle=newGearTopControl('handle-1','offset-spindle',{x:24,z:0});
assert.equal(gearTopPlacementIssue(spindle,base.gearHost),null);
assert.match(gearTopPlacementIssue({...spindle,x:0},base.gearHost),/shaft bore/i);
assert.match(gearTopPlacementIssue({...spindle,x:49},base.gearHost),/edge/i);
assert.match(gearTopPlacementIssue({...spindle,x:24},base.gearHost,[{...spindle,id:'overlap'}]),/another handle/i);
assert.throws(()=>validateGearTopControl({...knob,width:-5}),/width/);
assert.throws(()=>validateGearTopControl({...knob,profile:'Not a profile'}),/supported/);
assert.throws(()=>validateGearTopControl({...knob,join:'None',joinMm:2}),/zero/);
const openwork=gearGenerator.recipe({...gearGenerator.defaultParameters,webStyle:'Sector',spokes:4,bore:0,diameter:100});
let foundWindow=false;
for(let x=-35;x<=35&&!foundWindow;x++)for(let z=-35;z<=35;z++){
 const control={...spindle,x,z,width:8,depth:8,joinMm:0};
 const issue=gearTopPlacementIssue(control,openwork.gearHost);
 if(issue?.includes('window')){foundWindow=true;break;}
}
assert(foundWindow,'An openwork window must block placement.');
const joined=withGearTopControls(base,[knob]);
assert.equal(joined.positive.length,base.positive.length+1);
assert.equal(joined.negative.at(-1).gearThroughBore,true);
assert.equal(joined.negative.at(-1).radius,4);
assert.equal(joined.bounds.height,base.gearHost.topY+knob.height);
assert.deepEqual(withGearTopControls(base,[]),base,'Legacy gears must remain unchanged.');
assert.throws(()=>withGearTopControls(base,[knob,knob]),/Duplicate/);
assert.throws(()=>withGearTopControls(base,[spindle,{...spindle,id:'another'}]),/overlaps another/);
const differentWidth={...knob,width:48};
const differentDepth={...knob,depth:24};
const differentHeight={...knob,height:27};
function extent(mesh,axis){
 const a=mesh.mesh.points,values=[];
 for(let i=axis;i<a.length;i+=3)values.push(a[i]);
 return Math.max(...values)-Math.min(...values);
}
const original=gearTopMesh(knob,base.gearHost.topY);
assert(extent(gearTopMesh(differentWidth,8),0)>extent(original,0)+5);
assert(extent(gearTopMesh(differentDepth,8),2)<extent(original,2)-5);
assert(extent(gearTopMesh(differentHeight,8),1)>extent(original,1)+8);
assert.deepEqual(gearTopMesh(knob,8),original,'Repeat generation must be deterministic.');
for(const preset of GEAR_TOP_PRESETS){
 const control=newGearTopControl(preset.id,preset.id,{x:preset.kind==='spindle'?31:0});
 const mesh=gearTopMesh(control,8);
 assert(mesh.mesh.triangles.length>1000,preset.name);
 assert(mesh.mesh.points.every(Number.isFinite),preset.name+' finite coordinates');
}
const recipe=applyBuildModules(gearGenerator.recipe({...gearGenerator.defaultParameters,webStyle:'Solid',bore:8,diameter:100}),
 {gearTopControls:[knob]},gearGenerator.capabilities);
assert(recipe.negative.some(part=>part.gearThroughBore));
assert.equal(recipe.positive.at(-1).gearTopId,knob.id);
assert.equal(recipe.bounds.height,23);
assert.throws(()=>applyBuildModules(base,{gearTopControls:[{...knob,x:49}]},gearGenerator.capabilities),/edge/);
console.log('WT-026 gear top: presets, exact bounds, geometry, collision, stable IDs and bore recipe passed.');
