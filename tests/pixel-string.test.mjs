import assert from 'node:assert/strict';
import {generateFormation} from '../geometry-v3.js';
import {planHardware} from '../hardware-layout.js';
import {pixelStringPort} from '../pixel-string-routing.js';
import {ensureHardwareIds,movePixelInString,hardwareName} from '../hardware-identity.js';

const base={
 seed:42,count:9,width:160,height:125,pattern:'Central Spire',familyMix:'Quartz',
 spacing:38,baseType:'integrated',baseStyle:'Circle',baseHeight:30,baseWidth:42,baseDome:0,
 lightingMode:'single',cutSockets:true,pixelCount:1,pixelPlacement:'manual',
 manualPixelHoles:[{x:0,z:0,wireAngle:0}],pixelProfileId:'seed',pixelDiameter:5,
 mount:'None',wireChannels:true,wireExit:true,wireMode:'string',wireWidth:2,wireDepth:1.4,wireSlack:0
};
const crystals=generateFormation(base);
const first=planHardware(crystals,base);
assert.equal(first.sockets.length,1,'Single real LED accepted');
assert.equal(first.wirePlan.mode,'string');
assert(first.wirePlan.ready,'One pixel has a complete IN and OUT cable path: '+first.wirePlan.messages.join(' '));
assert.deepEqual(first.wirePlan.connections.map(c=>c.kind),['input','output']);
assert.equal(first.wirePlan.lanes,1,'One cable bundle channel, not adjacent parallel lanes');
assert(first.wirePlan.entryAdded&&first.wirePlan.exitAdded);
assert.equal(first.wirePlan.unrouted,0);
const input=first.wirePlan.routes.filter(r=>r.kind==='input');
const output=first.wirePlan.routes.filter(r=>r.kind==='output');
assert(input.length&&output.length&&input[0].a.x<0&&output.at(-1).b.x>0,
 'Single pixel has two physically opposed perimeter cable exits');
assert(pixelStringPort(first.sockets[0],'input').x<pixelStringPort(first.sockets[0],'output').x);
assert(first.wirePlan.lengthMm>10);
assert.deepEqual(planHardware(crystals,base).wirePlan,first.wirePlan,'Same settings give deterministic string routes');

const chain={...base,lightingMode:'multi',pixelCount:3,manualPixelHoles:[
 {id:'first',x:-24,z:0,wireAngle:0},{id:'second',x:0,z:0,wireAngle:0},{id:'third',x:24,z:0,wireAngle:0}
]};
ensureHardwareIds(chain);
const many=planHardware(crystals,chain);
assert.equal(many.sockets.length,3,'All three serial sockets accepted');
assert(many.wirePlan.ready,'Three-pixel string has all IN, links and OUT: '+many.wirePlan.messages.join(' '));
assert.deepEqual(many.wirePlan.connections.map(c=>c.kind),['input','link','link','output']);
assert.deepEqual(many.wirePlan.connections.filter(c=>c.kind==='link').map(c=>[c.fromId,c.toId]),
 [['first','second'],['second','third']],'String follows saved order, not nearest-neighbour spanning tree');

const reordered={...chain,manualPixelHoles:chain.manualPixelHoles.map(x=>({...x}))};
const originalIds=reordered.manualPixelHoles.map(p=>p.id);
assert(movePixelInString(reordered,0,1),'Keyboard/drag reorder moves a pixel');
assert.deepEqual(reordered.manualPixelHoles.map(p=>p.id),['second','first','third']);
assert.deepEqual(reordered.manualPixelHoles.map(p=>p.x),[0,-24,24],'Reorder never moves XY physical positions');
assert.equal(reordered.manualPixelHoles[1].id,originalIds[0],'Stable IDs survive list order changes');
assert(!movePixelInString(reordered,-1,5),'Invalid list edits refused');
assert.equal(hardwareName('pixel',0),'P1');
assert.equal(hardwareName('mount',1),'M2');

const blocked=planHardware(crystals,{...base,manualPixelHoles:[{id:'solo',x:0,z:0,wireAngle:0}],
 wireEntryX:999,wireEntryZ:999,wireOutputX:999,wireOutputZ:999});
assert(!blocked.wirePlan.ready,'Coincident user-picked input/output exits are not silently accepted');
assert.equal(blocked.wirePlan.routes.length,0,'No partial disconnected geometry is sent to Manifold');
const disabled=planHardware(crystals,{...base,wireChannels:false});
assert.equal(disabled.wirePlan.routes.length,0,'Groove toggle remains authoritative');
console.log('PR9 pixel-string topology, opposed perimeter tails, serial order and identities passed');
