import assert from 'node:assert/strict';
import {seeded,generateFormation,chooseWeightedFamily,families} from '../geometry-v3.js';
import {ensureHardwareIds,movePixelInString} from '../hardware-identity.js';
import {saveTemplate,findTemplate,readTemplates,deleteTemplate,validateProjectTemplate} from '../project-templates.js';
import {buildPixelStringMap} from '../pixel-string-export.js';

const weighted={Quartz:0,Shard:0,Blade:0,Cubic:0,'Double terminated':100,Fantasy:0};
for(const k of [0,.15,.4,.8,.999])assert.equal(chooseWeightedFamily(k,weighted),'Double terminated');
assert.equal(chooseWeightedFamily(.01,{}),'Quartz');
const a=seeded(42),b=seeded(42);
assert.deepEqual(Array.from({length:12},()=>chooseWeightedFamily(a(),{Quartz:7,Fantasy:2})),
 Array.from({length:12},()=>chooseWeightedFamily(b(),{Quartz:7,Fantasy:2})),
 'Weighted mix reproducible from seed');
assert.equal(families.length,6,'Six mixed families supported');
const settings={seed:9,count:24,height:120,width:120,spacing:40,pattern:'Central Spire',familyMix:'Mixed',familyWeights:weighted};
assert(generateFormation(settings).every(c=>c.family==='Double terminated'),
 'Setting all other weights to 0 excludes every other family');

const s={pixelPlacement:'manual',manualPixelHoles:[{x:0,z:0},{x:12,z:0}],
 manualMountHoles:[{x:15,z:25}]};
ensureHardwareIds(s);const original=s.manualPixelHoles.map(p=>p.id);
assert(original.every(id=>id)&&new Set(original).size===2);
assert(movePixelInString(s,0,1));
assert.deepEqual(s.manualPixelHoles.map(p=>p.id),original.reverse());
assert.deepEqual(s.manualPixelHoles.map(p=>p.x),[12,0]);
const hw={sockets:[{id:'pixel-2',profileId:'seed',x:10,z:20,radius:3,wireAngle:0},
 {id:'pixel-1',profileId:'gumdrop',x:30,z:20,radius:6,wireAngle:90}]};
const mapping=buildPixelStringMap(hw);
assert(mapping.includes('"P1","pixel-2"')&&mapping.includes('"P2","pixel-1"'));
assert(mapping.includes('"1","3"')&&mapping.includes('"4","6"'),'WS2811 RGB starts at 1 and advances 3 channels');
assert(mapping.includes('"EDGE OUT"')&&mapping.includes('"P2"'));
assert.equal(mapping.split('\r\n').length,4);

const memory=new Map();
const storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
const tpl=saveTemplate(storage,'Festival Crystal',{seed:42},[{id:'c-1',x:0,z:0}]);
assert(tpl.id.startsWith('template-'));
assert.equal(readTemplates(storage).length,1);
assert.equal(findTemplate(storage,tpl.id).name,'Festival Crystal');
assert.throws(()=>validateProjectTemplate({name:'bad',settings:{},crystals:[{}]}),/invalid crystal/);
assert(deleteTemplate(storage,tpl.id));assert.equal(readTemplates(storage).length,0);
console.log('PR9 family weight, ordered RGB map, stable hardware identity and reusable template checks passed');
