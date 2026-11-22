import assert from 'node:assert/strict';
import {mountingPatternPoints,resolvePatternCentre,patternMountTransaction} from '../mounting-pattern.js';

const fixtures={
  "line2": {
    "input": {"kind":"line","count":2,"pitchMm":30,"angleDeg":0,"centerX":0,"centerZ":0},
    "expected": [[-15,0],[15,0]]
  },
  "line3Vertical": {
    "input": {"kind":"line","count":3,"pitchMm":12,"angleDeg":90,"centerX":0,"centerZ":0},
    "expected": [[0,-12],[0,0],[0,12]]
  },
  "circle4Offset": {
    "input": {"kind":"circle","count":4,"radiusMm":20,"startAngleDeg":0,"centerX":5,"centerZ":-3},
    "expected": [[25,-3],[5,17],[-15,-3],[5,-23]]
  },
  "grid2x2": {
    "input": {"kind":"grid","rows":2,"columns":2,"pitchXmm":20,"pitchZmm":20,"angleDeg":0,"centerX":0,"centerZ":0},
    "expected": [[-10,-10],[10,-10],[-10,10],[10,10]]
  },
  "grid2x3Rotated": {
    "input": {"kind":"grid","rows":2,"columns":3,"pitchXmm":10,"pitchZmm":20,"angleDeg":90,"centerX":2,"centerZ":4},
    "expected": [[12,-6],[12,4],[12,14],[-8,-6],[-8,4],[-8,14]]
  },
  "magnet8OffAxis": {
    "input": {"kind":"circle","count":8,"radiusMm":30,"startAngleDeg":22.5,"centerX":7,"centerZ":-4},
    "expectedRounded6dp": [[34.716386,7.480503],[18.480503,23.716386],[-4.480503,23.716386],[-20.716386,7.480503],[-20.716386,-15.480503],[-4.480503,-31.716386],[18.480503,-31.716386],[34.716386,-15.480503]]
  }
};
for(const [name,{input,expected,expectedRounded6dp}] of Object.entries(fixtures)){
 const actual=mountingPatternPoints(input,16);
 const reference=expected??expectedRounded6dp,tolerance=expected?1e-8:1e-6;
 assert.equal(actual.length,reference.length,name);
 actual.forEach(({x,z},index)=>{
  assert(Math.abs(x-reference[index][0])<tolerance,name+' X');
  assert(Math.abs(z-reference[index][1])<tolerance,name+' Z');
 });
}
const footprint=[[-10,-20],[30,-20],[30,40]];
assert.deepEqual(resolvePatternCentre({alignment:'x',offsetX:3,offsetZ:-6},footprint),{centerX:10,centerZ:4});
const pattern={id:'ring',kind:'circle',count:8,radiusMm:30,startAngleDeg:22.5,alignment:'custom',offsetX:7,offsetZ:-4};
const input={pattern,footprint,limit:16,fixing:{diameter:8,profile:'Magnet pocket'}};
const transaction=patternMountTransaction(input);
const edited=patternMountTransaction({...input,pattern:{...pattern,radiusMm:32},
 patterns:transaction.patterns,mounts:[{id:'manual',x:0,z:0},...transaction.mounts]});
assert.deepEqual(edited.patterns[0].members,transaction.patterns[0].members);
assert.deepEqual(edited.remaining,[{id:'manual',x:0,z:0}]);
assert.notEqual(edited.candidates[0].x,transaction.candidates[0].x);
for(const invalid of [{count:2},{count:17},{count:NaN},{radiusMm:0},{radiusMm:-1}]){
 assert.throws(()=>patternMountTransaction({...input,pattern:{...pattern,...invalid}}));
}
assert.equal(mountingPatternPoints({kind:'grid',rows:4,columns:4,pitchXmm:10,pitchZmm:15,
 angleDeg:0,centerX:0,centerZ:0},16).length,16);
console.log('Mounting patterns: issue reference coordinates, alignment, stable member IDs and limits passed');
