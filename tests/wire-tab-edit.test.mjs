import assert from 'node:assert/strict';
import {generateFormation} from '../geometry-v3.js';
import {planHardware} from '../hardware-layout.js';
import {nearestEdgePosition} from '../edge-tabs.js';

const s={seed:42,count:9,width:150,height:120,pattern:'Central Spire',familyMix:'Quartz',
 baseType:'integrated',baseStyle:'Circle',baseHeight:28,baseWidth:35,baseDome:0,
 lightingMode:'single',cutSockets:true,pixelCount:1,pixelPlacement:'manual',
 manualPixelHoles:[{x:0,z:0,wireAngle:0}],pixelProfileId:'gumdrop',pixelDiameter:12,
 mount:'None',wireChannels:true,wireExit:true,wireMode:'parallel',wirePairSpacing:7,
 wireWidth:2.5,wireDepth:2,wireSlack:0};
const crystals=generateFormation(s);
const layout=planHardware(crystals,s);
assert.equal(layout.sockets.length,1);
assert.equal(layout.wirePlan.lanes,2,'Two independent parallel tracks are requested');
assert(layout.wirePlan.exitAdded,'Pair reaches accessible base edge');
assert.equal(new Set(layout.wirePlan.routes.filter(r=>r.kind==='exit').map(r=>r.lane)).size,2);
assert(layout.wirePlan.routes.every(r=>r.width===2.5),'Real channel dimensions preserved');
const rotated=planHardware(crystals,{...s,manualPixelHoles:[{x:0,z:0,wireAngle:45}]});
assert(rotated.wirePlan.exitAdded,'Rotation preserves connected paired exit');
assert.notDeepEqual(rotated.wirePlan.routes.map(r=>r.a),layout.wirePlan.routes.map(r=>r.a),
 'Rotation turns both projected wire starting points');
const poly=layout.polygon;
const projection=nearestEdgePosition(poly,{x:180,z:0});
assert(projection.u>=0&&projection.u<1,'Perimeter position is normalised');
const manual={...s,mount:'Edge fixing tabs',manualEdgeTabs:[{u:projection.u}]};
const tabbed=planHardware(crystals,manual);
assert.equal(tabbed.tabs.length,1,'Manual fixing tab survives placement');
const pinned=tabbed.tabs[0];
const blocked=planHardware(crystals,{...manual,manualPixelHoles:[{x:0,z:0,wireAngle:0,wireEndX:pinned.x,wireEndZ:pinned.z}]});
assert(!blocked.wirePlan.exitAdded,'Exit through full fixing tab must be rejected');
const moved=planHardware(crystals,{...manual,manualEdgeTabs:[{u:(projection.u+.25)%1}]});
assert(moved.tabs.length===1&&Math.hypot(moved.tabs[0].x-pinned.x,moved.tabs[0].z-pinned.z)>5,
 'Moving tab changes actual manufacturing geometry');
const deleted=planHardware(crystals,{...manual,manualEdgeTabs:[]});
assert.equal(deleted.tabs.length,0,'Removing tabs produces no fixing-tab geometry');
assert.equal(planHardware(crystals,{...s,wireMode:'single'}).wirePlan.lanes,1,'Legacy single track remains');
console.log('PR7 paired wires, rotated outlets, manual edge exits and add/move/delete tabs passed');
