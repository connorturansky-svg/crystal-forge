import assert from 'node:assert/strict';
import {generateFormation} from '../geometry-v3.js';
import {planHardware} from '../hardware-layout.js';
import {snapPixelsToWireLength} from '../pixel-spacing-snap.js';

// Manifold and Build share this actual sampled 2D underside string route.
// These test the REAL curved-route planner, not an approximate centre distance.
const base={
 seed:42,count:9,width:160,height:125,pattern:'Central Spire',familyMix:'Quartz',
 spacing:38,baseType:'integrated',baseStyle:'Circle',baseHeight:30,baseWidth:42,baseDome:0,
 lightingMode:'multi',cutSockets:true,pixelPlacement:'manual',pixelProfileId:'seed',
 pixelDiameter:5,mount:'None',wireChannels:true,wireExit:true,wireMode:'string',
 wireWidth:2,wireDepth:1.4,wireSlack:0,wireMinBendRadius:5,pixelStringSpacing:50
};
const crystals=generateFormation(base);
const points=[{id:'first',x:-46,z:0,wireAngle:0,profileId:'seed'},
 {id:'second',x:2,z:0,wireAngle:0,profileId:'seed'},
 {id:'third',x:50,z:0,wireAngle:0,profileId:'seed'}];
const s={...base,pixelCount:3,manualPixelHoles:points.map(p=>({...p}))};
const original=JSON.stringify(s);
const first=planHardware(crystals,s);
assert.equal(first.sockets.length,3);
assert.deepEqual(first.wirePlan.connections.filter(c=>c.kind==='link').map(c=>Math.round(c.lengthMm)),[48,48],
 'Start approximately 2 mm below the physical 50 mm pitch');
const snap=snapPixelsToWireLength(crystals,s,{maxMoveMm:5});
assert(snap.changed,'All nearly-spaced pixels should align in one operation: '+JSON.stringify(snap));
assert.equal(snap.total,2);
assert.equal(snap.aligned,2,JSON.stringify(snap.links));
assert.equal(snap.moved,2);
assert.equal(JSON.stringify(s),original,'Pure solver never mutates saved project settings');
assert.deepEqual(snap.settings.manualPixelHoles[0],points[0],'P1 anchored exactly');
assert.deepEqual(snap.settings.manualPixelHoles.map(p=>p.id),points.map(p=>p.id));
assert(snap.settings.manualPixelHoles.every((p,i)=>
 Math.hypot(p.x-points[i].x,p.z-points[i].z)<=5.001),'No LED moves farther than 5 mm');
assert(snap.settings.manualPixelHoles.every((p,i)=>p.profileId===points[i].profileId&&
 p.wireAngle===points[i].wireAngle),'Pixel type and IN/OUT orientation unchanged');
const after=planHardware(crystals,{...s,...snap.settings});
assert.equal(after.sockets.length,3,'Physical socket clearances must survive');
assert.deepEqual(after.wirePlan.connections.filter(c=>c.kind==='link').map(c=>c.kind),['link','link']);
assert(after.wirePlan.connections.filter(c=>c.kind==='link').every(c=>
 c.lengthMm<=50.01&&c.lengthMm>=49.82),'Both final curved routes must match 50 mm within .18 mm');
assert.deepEqual(after.wirePlan.connections.map(c=>c.kind),['input','link','link','output'],
 'External tail routes remain in sequence and are NOT forced to a 50 mm target');

// Already-perfect positions must not trigger a duplicate edit/history entry.
const repeated=snapPixelsToWireLength(crystals,{...s,...snap.settings},{maxMoveMm:5});
assert(!repeated.changed,'Idempotent snap preserves exact prior result');
assert.equal(repeated.aligned,2);

// Way outside the adjustment window: do NOT stretch 48 mm to 100 mm in one click.
const far=snapPixelsToWireLength(crystals,{...s,pixelStringSpacing:100},{maxMoveMm:5});
assert(!far.changed,'No unexpected large repositioning');
assert(far.links.every(link=>link.status==='skipped'));
assert(far.links.some(link=>/fine-adjustment window/.test(link.reason)));

// Reject unsupported configurations without touching original data.
const disabled=snapPixelsToWireLength(crystals,{...s,wireChannels:false});
assert(!disabled.changed&&/Enable Pixel string/.test(disabled.reason));
const legacy=snapPixelsToWireLength(crystals,{...s,wireMode:'parallel'});
assert(!legacy.changed);
const one=snapPixelsToWireLength(crystals,{...s,lightingMode:'single',pixelCount:1,manualPixelHoles:[points[0]]});
assert(!one.changed&&/At least two/.test(one.reason));
console.log('PR14 physical pixel pitch snapping: curved lengths, 5 mm cap, P1 anchor, external tails, idempotence and safe refusal passed');
