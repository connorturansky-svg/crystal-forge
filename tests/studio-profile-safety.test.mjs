import assert from 'node:assert/strict';
import {MAX_CUSTOM_PIXEL_PROFILES,planPixelProfileSave,planPixelProfileDelete,profileReferencedInModel} from '../studio-profile-safety.js';
const profile=index=>({
 id:'custom-cal-'+index,name:'Cal '+index,kind:'seed',
 bodyDiameter:5,bodyHeight:9,flangeDiameter:5,flangeHeight:0,
 capHeight:1,wireWidth:2,wireDepth:1.5,
 measuredFit:{bodyDiameter:5,printedBoreDiameter:5.5}
});
const original=Array.from({length:MAX_CUSTOM_PIXEL_PROFILES},(_,i)=>profile(i));
const bytes=JSON.stringify(original);
assert.throws(()=>planPixelProfileSave(original,profile(30)),/library is full/);
assert.equal(JSON.stringify(original),bytes,'The 31st addition cannot mutate the previous library');
const updated=planPixelProfileSave(original,{...profile(7),name:'New calibration'});
assert.equal(updated.length,30,'Update in place does not evict another profile');
assert.equal(updated.find(p=>p.id==='custom-cal-7').name,'New calibration');
assert(updated.some(p=>p.id==='custom-cal-0'));
const overcap=[...original,profile(30)];
assert.throws(()=>planPixelProfileSave(overcap,profile(31)),/library is full/);
assert.equal(JSON.stringify(overcap),JSON.stringify([...original,profile(30)]),'Legacy over-cap data remains unchanged');
assert.equal(planPixelProfileSave(overcap,{...profile(4),name:'Adjusted'}).length,31,'Existing profile remains editable even in over-cap legacy data');
assert.deepEqual(planPixelProfileDelete(original,'custom-cal-4').map(p=>p.id),
 original.filter(p=>p.id!=='custom-cal-4').map(p=>p.id));
assert.throws(()=>planPixelProfileDelete(original,'seed'),/Only a selected custom/);
assert.throws(()=>planPixelProfileDelete(original,'custom-missing'),/no longer exists/);
assert(profileReferencedInModel({generator:{typeId:'tactile-tiles'},build:{activePixelProfileId:'custom-cal-3'}},'custom-cal-3'));
assert(profileReferencedInModel({generator:{typeId:'tactile-tiles'},build:{pixelHoles:[{socketProfile:{id:'custom-cal-3'}}]}},'custom-cal-3'));
assert(profileReferencedInModel({generator:{typeId:'crystals'},parameters:{pixelProfileId:'custom-cal-3'}},'custom-cal-3'));
assert(!profileReferencedInModel({generator:{typeId:'tactile-tiles'},build:{pixelHoles:[]}},'custom-cal-3'));
console.log('Profile capacity, non-eviction, over-cap legacy preservation, deletion target and model-reference checks passed.');

await import('./project-resources-backup.test.mjs');
