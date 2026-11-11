import assert from 'node:assert/strict';
import {PIXEL_DIMENSIONS,renderPixelProfileDiagram} from '../pixel-profile-diagram.js';
import {planWireRoutes} from '../wire-routing.js';
import {generateFormation} from '../geometry-v3.js';
import {planHardware} from '../hardware-layout.js';

assert.equal(PIXEL_DIMENSIONS.length,7,'Seven measurable fields A-G');
assert.deepEqual(PIXEL_DIMENSIONS.map(d=>d.letter),['A','B','C','D','E','F','G']);
assert.equal(new Set(PIXEL_DIMENSIONS.map(d=>d.field)).size,7,'All fields map to unique input IDs');
const values={
 name:'Measured Pixel',kind:'gumdrop',bodyDiameter:12.5,bodyHeight:21.4,
 flangeDiameter:14.2,flangeHeight:1.8,capHeight:3.2,wireWidth:3.1,wireDepth:1.6
};
const svg=renderPixelProfileDiagram(values);
assert(svg.startsWith('<svg'),'Pixel editor generates an actual SVG');
assert(svg.includes('marker-start="url(#pixelArrow)"')&&svg.includes('marker-end="url(#pixelArrow)"'),
 'Dimension arrows have two heads');
for(const d of PIXEL_DIMENSIONS)assert(svg.includes('data-profile-field="'+d.field+'"'),
 'Graphic letter is interactive and maps to '+d.field);
for(const v of [12.5,21.4,14.2,1.8,3.2,3.1,1.6])
 assert(svg.includes(v.toFixed(1)+' mm'),'Graphic annotates actual numeric measurement '+v);
const revised=renderPixelProfileDiagram({...values,bodyDiameter:17,bodyHeight:26});
assert(revised.includes('A 17.0 mm')&&revised.includes('B 26.0 mm'));
assert.notEqual(svg,revised,'Profile changes reshape the graphic');
assert(!renderPixelProfileDiagram({name:'<script>alert(1)</script>'}).includes('<script>'),
 'Name text cannot inject SVG markup');
const base={seed:42,count:9,width:150,height:120,pattern:'Central Spire',familyMix:'Quartz',
 baseType:'integrated',baseStyle:'Circle',baseHeight:25,baseWidth:32,baseDome:0,
 lightingMode:'single',cutSockets:true,pixelCount:1,pixelPlacement:'manual',
 manualPixelHoles:[{x:0,z:0}],pixelProfileId:'gumdrop',pixelDiameter:12,
 mount:'None',wireChannels:true,wireExit:false,wireWidth:3.5,wireDepth:2,wireSlack:0};
const crystals=generateFormation(base),without=planHardware(crystals,base);
assert.equal(without.sockets.length,1);
assert.equal(without.wirePlan.routes.length,0,'Single LED alone does not create a groove');
assert(without.wirePlan.messages.some(m=>m.includes('No physical groove')),'Missing edge exit explained');
const yes={...base,wireExit:true},withExit=planHardware(crystals,yes);
assert(withExit.wirePlan.exitAdded,'A single LED can route to the exterior');
assert(withExit.wirePlan.routes.length>0,'At least one physical groove segment planned');
const polygon=withExit.polygon;
const end=withExit.wirePlan.routes.at(-1).b;
const maxRadius=Math.max(...polygon.map(p=>Math.hypot(p.x,p.z)));
assert(Math.hypot(end.x,end.z)>maxRadius*.985,'Exit cutter reaches to or beyond outer edge');
assert(withExit.wirePlan.lengthMm>5,'Actual exit cable length measured');
const disabled=planWireRoutes(crystals,{...yes,wireChannels:false},withExit);
assert.equal(disabled.routes.length,0);
console.log('PR7 pixel profile A-G diagram and physically planned single-LED edge groove contracts passed');
