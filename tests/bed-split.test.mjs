import assert from 'node:assert/strict';
import {planBedAwareSplit} from '../bed-split.js';
const report=(width,depth,height,limit=[215,215,300])=>({printerLimit:limit,mesh:{
 points:new Float32Array([-width/2,0,-depth/2,width/2,height,depth/2,width/2,0,-depth/2])}});
const no=planBedAwareSplit(report(120,110,180));assert(no.ready&&!no.needed&&no.pieceCount===1);
const grid=planBedAwareSplit(report(330,320,180));
assert(grid.ready&&grid.needed&&grid.pieceCount===4);
assert.equal(grid.cutsX.length,1);assert.equal(grid.cutsZ.length,1);
assert.deepEqual(planBedAwareSplit(report(330,320,180)),grid,'Repeatable cut-plane planning');
assert.equal(planBedAwareSplit(report(80,80,350)).ready,false,'Oversize height cannot be fixed by horizontal bed tiles');
assert.equal(planBedAwareSplit(report(900,900,180),{maxPieces:4}).ready,false,'Excessive part count refused');
assert(!planBedAwareSplit({}).ready,'Missing printer limits fail closed');
const rotated=planBedAwareSplit(report(210,325,150,[220,190,205]));
assert(rotated.ready&&rotated.pieceCount>1,'Asymmetric printer bed is supported');
console.log('Final-phase bed aware upright split planning, safety and deterministic sizing passed');
