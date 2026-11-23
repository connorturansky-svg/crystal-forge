import assert from 'node:assert/strict';
import * as THREE from 'three';
import Module from 'manifold-3d';
import {gearGenerator,applyBuildModules} from '../studio-catalogue.js';
import {newGearTopControl} from '../studio-gear-top-controls.js';
import {previewRecipe,disposeGroup,prepareRecipe} from '../studio-geometry.js';
import {exportMaterialBodies} from '../studio-material-export.js';

const wasm=await Module();wasm.setup();
const base={...gearGenerator.defaultParameters,webStyle:'Solid',bore:8,diameter:100,dualMaterial:false};
const source=gearGenerator.recipe(base),plain=prepareRecipe(THREE,wasm,source);
for(const [preset,x] of [['fluted-knob',0],['knurled-dial',0],['offset-spindle',31],['rectangular',0]]){
 const control=newGearTopControl('fixture-'+preset,preset,{x,z:0});
 const recipe=applyBuildModules(gearGenerator.recipe(base),{gearTopControls:[control]},gearGenerator.capabilities);
 const preview=previewRecipe(THREE,recipe);
 assert(preview.children.some(mesh=>mesh.userData.gearTopId===control.id),preset+' preview marker');
 disposeGroup(preview);
 const manufactured=prepareRecipe(THREE,wasm,recipe);
 assert(manufactured.report.ready,preset);
 assert.equal(manufactured.bodies.length,1);
 assert(manufactured.bodies[0].volume>plain.bodies[0].volume+1,preset+' added printable stock');
 const {stls,threeMF}=exportMaterialBodies(manufactured,{name:'wt026-'+preset});
 assert.equal(stls.length,1,preset);
 assert(threeMF.length>250,preset+' genuine 3MF');
 const body=new wasm.Manifold(manufactured.bodies[0].mesh);
 const height=recipe.bounds.height+4;
 // Re-test the through opening against a slightly smaller cylindrical probe
 // spanning the full print height. Touching a zero-volume surface is allowed.
 const probe=wasm.Manifold.cylinder(height,3.9,3.9,64).rotate([-90,0,0]).translate([0,-2,0]);
 assert(body.intersect(probe).volume()<1e-3,preset+' shaft bore remains open');
 probe.delete();body.delete();
}
const centred=newGearTopControl('dual-fluted','fluted-knob');
const dual=prepareRecipe(THREE,wasm,applyBuildModules(
 gearGenerator.recipe({...base,dualMaterial:true}),{gearTopControls:[centred]},gearGenerator.capabilities));
assert.equal(dual.bodies.length,2,'Dual-material gear remains two valid connected regions.');
assert.equal(exportMaterialBodies(dual).stls.length,2);
console.log('WT-026 Manifold: fused top grips, real STL/3MF exports and unobstructed shaft bores passed.');
