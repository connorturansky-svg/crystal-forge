import assert from 'node:assert/strict';
import {isModelColour,parseModelHex,formatModelHex,resolveModelColour,modelDisplayColours,withModelColour,MODEL_SWATCHES} from '../src/ui/model-colour.mjs';
for(const [hex,value] of [['#000000',0],['000001',1],['#FFFFFF',0xffffff],[' #aBcDeF ',0xabcdef],['001234',0x001234]]){
 assert.equal(parseModelHex(hex),value);assert.equal(formatModelHex(value),'#'+value.toString(16).padStart(6,'0').toUpperCase());
}
for(const invalid of ['',null,0,'#abc','#12345678','0x112233','-12345','12345g','12345','1234567']){
 assert.throws(()=>parseModelHex(invalid));
}
for(const invalid of [null,undefined,-1,NaN,Infinity,1.5,0x1000000,'000000']){
 assert.equal(isModelColour(invalid),false);assert.equal(resolveModelColour(invalid,0x123456),0x123456);
 assert.throws(()=>formatModelHex(invalid));
}
assert.equal(resolveModelColour(0,0xffffff),0);
assert.deepEqual(modelDisplayColours({primary:{colour:0},secondary:{colour:0}}),[0,0]);
assert.deepEqual(modelDisplayColours({}),[0x88bbff,0xffcf70]);
const original={primary:{colour:0x123456,name:'body'},secondary:{colour:0xfedcba},other:{data:1}};
const edited=withModelColour(original,'primary',0);
assert.deepEqual(edited,{...original,primary:{name:'body',colour:0}});
assert.equal(original.primary.colour,0x123456);
assert.notEqual(edited.other,original.other);
assert.throws(()=>withModelColour(original,'wrong',0));
assert.throws(()=>withModelColour(original,'secondary',-1));
assert.equal(new Set(MODEL_SWATCHES.map(s=>s.name)).size,MODEL_SWATCHES.length);
assert.equal(new Set(MODEL_SWATCHES.map(s=>s.value)).size,MODEL_SWATCHES.length);
assert(MODEL_SWATCHES.every(s=>isModelColour(s.value)));
assert(MODEL_SWATCHES.some(s=>s.value===0));
console.log('Model colour contracts: exact HEX, black, fallbacks, roles and named swatches passed.');
