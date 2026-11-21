import assert from 'node:assert/strict';
import {topEntryLeadInSpec,intendedTopEntryRadius} from './top-entry-lead-in-spec.mjs';
const input={x:12,z:-9,surfaceY:8,diameter:8,amountMm:.5};
const cutter=topEntryLeadInSpec(input);
assert.equal(cutter.kind,'cylinder');
assert.equal(cutter.radius,4);
assert(Math.abs(cutter.topRadius-4.6)<1e-8);
assert(Math.abs(cutter.height-.6)<1e-8);
assert(Math.abs(cutter.position[1]-7.8)<1e-8);
assert.deepEqual(cutter.position.slice(0,1),[12]);
assert.equal(cutter.position[2],-9);
for(const [z,r] of [[8,4.5],[7.99,4.49],[7.75,4.25],[7.5,4],[6.75,4]])
 assert(Math.abs(intendedTopEntryRadius(input,z)-r)<1e-9,'Expected 45° radial entry taper at '+z);
assert.throws(()=>topEntryLeadInSpec({...input,amountMm:5}),/0.1–4/);
assert.throws(()=>topEntryLeadInSpec({...input,diameter:NaN}),/finite/);
assert.throws(()=>topEntryLeadInSpec({...input,overshootMm:1}),/0.01–0.3/);
console.log('Lead-in reference spec PASS: exact 45-degree geometry, 0.1 mm Boolean overshoot, parameter guards');
