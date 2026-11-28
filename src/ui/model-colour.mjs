// Exact 24-bit sRGB display colours. Never treat numeric black as missing.
export const PRIMARY_COLOUR=0x88bbff;
export const SECONDARY_COLOUR=0xffcf70;
export const isModelColour=value=>Number.isInteger(value)&&value>=0&&value<=0xffffff;
export function resolveModelColour(value,fallback=PRIMARY_COLOUR){
 if(!isModelColour(fallback))throw Error('Invalid fallback display colour.');
 return isModelColour(value)?value:fallback;
}
export function parseModelHex(text){
 if(typeof text!=='string'||!/^#?[0-9a-f]{6}$/i.test(text.trim()))throw Error('Enter six hexadecimal digits, for example #3A82F6.');
 return Number.parseInt(text.trim().replace(/^#/,''),16);
}
export function formatModelHex(value){
 if(!isModelColour(value))throw Error('Invalid model display colour.');
 return '#'+value.toString(16).padStart(6,'0').toUpperCase();
}
export function modelDisplayColours(materials){
 return [resolveModelColour(materials?.primary?.colour,PRIMARY_COLOUR),resolveModelColour(materials?.secondary?.colour,SECONDARY_COLOUR)];
}
export function withModelColour(materials,role,value){
 if(!['primary','secondary'].includes(role)||!isModelColour(value))throw Error('Invalid material role or colour.');
 const result=structuredClone(materials||{});
 result[role]={...result[role],colour:value};
 return result;
}
export const MODEL_SWATCHES=Object.freeze([
 ['White',0xffffff],['Light grey',0xcbd5e1],['Slate',0x64748b],['Black',0x000000],
 ['Ruby',0xff787d],['Red',0xdb2626],['Orange',0xf97316],['Amber',0xffcf70],
 ['Yellow',0xfacc15],['Lime',0x84cc16],['Emerald',0x58e6a2],['Forest',0x15803d],
 ['Teal',0x0d9488],['Cyan',0x22d3ee],['Ice blue',0x8bbcff],['Blue',0x2563eb],
 ['Indigo',0x4338ca],['Amethyst',0xb985ff],['Magenta',0xd946ef],['Rose',0xf0c8e8],
 ['Pink',0xec4899],['Brown',0x92400e]
].map(([name,value])=>Object.freeze({name,value})));
