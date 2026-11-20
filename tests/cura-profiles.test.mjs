import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {calculateCuraSettings,createCuraProfile,CURA_MACHINES,CURA_MATERIALS,CURA_NOZZLES,resolveCuraQualityType} from '../cura-profiles.js';

function inspectZip(bytes){
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const decoder=new TextDecoder(),entries=[];
 let offset=0;
 while(offset+4<=bytes.length&&view.getUint32(offset,true)===0x04034b50){
  const compressed=view.getUint32(offset+18,true),length=view.getUint16(offset+26,true);
  const extra=view.getUint16(offset+28,true);
  const name=decoder.decode(bytes.subarray(offset+30,offset+30+length));
  const start=offset+30+length+extra;
  const body=decoder.decode(bytes.subarray(start,start+compressed));
  entries.push({name,body});offset=start+compressed;
 }
 assert(entries.length>=2,'ZIP includes at least global and extruder overrides');
 assert(bytes.length>offset+22,'ZIP central directory and end record exist');
 const end=view.getUint32(bytes.length-22,true);
 assert.equal(end,0x06054b50,'ZIP end directory signature');
 const cdOffset=view.getUint32(bytes.length-6,true);
 assert(cdOffset>=0,'ZIP has directory offset');
 return entries;
}
for(const machine of CURA_MACHINES){
 for(const nozzle of CURA_NOZZLES){
  for(const material of CURA_MATERIALS){
   if(machine==='Ultimaker 3 Extended'&&nozzle===.6){
    assert.throws(()=>createCuraProfile({machine,nozzle,material}),/0.6.*AA/);
    continue;
   }
   const fast=calculateCuraSettings({machine,nozzle,material,quality:0,intent:'light'});
   const fine=calculateCuraSettings({machine,nozzle,material,quality:100,intent:'durable'});
   assert(fast.layerHeight>fine.layerHeight,'quality reduces layer height');
   assert(fast.speed>=fine.speed,'quality slows down extrusion');
   assert(fast.wallCount<fine.wallCount,'quality adds shell walls');
   assert.equal(fast.density,0,'light transmission plan defaults to zero sparse infill');
   assert(fine.density>=25,'durable plan increases infill');
   assert(fine.layerHeight<=nozzle*.7+1e-8,'no oversized layers');
   const profile=createCuraProfile({machine,nozzle,material,quality:90,intent:'balanced'});
   assert(profile.filename.endsWith('.curaprofile'));
   assert(profile.bytes instanceof Uint8Array,'ZIP bytes returned');
   const entries=inspectZip(profile.bytes);
   assert.equal(entries.length,machine==='Ultimaker 3 Extended'?3:2,'correct extruder profile count');
   const all=entries.map(e=>e.body).join('\n');
   for(const part of ['[general]','[metadata]','[values]','type = quality_changes',
    'quality_type = '+resolveCuraQualityType(machine,nozzle),'version = 4','setting_version = 27','layer_height = ',
    'wall_line_count = ','infill_sparse_density = '])
    assert(all.includes(part),'Cura metadata or value missing: '+part);
   assert(all.includes('material = generic_'+material.toLowerCase()),'material metadata');
   assert(all.includes('definition = '+(machine==='Ultimaker 3 Extended'?'ultimaker3':'ultimaker2_plus')),'machine definition');
   assert(all.includes('variant = '+(machine==='Ultimaker 3 Extended'?'AA '+nozzle:nozzle+' mm')),'nozzle variant');
   assert(profile.fallbackText.includes('quality type: '+profile.qualityType),'manual compatibility sheet records selected quality type');
   assert(profile.fallbackFilename.endsWith('.txt'));
   assert(!all.includes('material_print_temperature = '),'preserves selected Cura material temperature');
   assert(!all.includes('machine_nozzle_size = '),'does not silently alter physical machine nozzle');
  }
 }
}
assert.throws(()=>createCuraProfile({machine:'Custom / other'}),/Select Ultimaker/);
assert.throws(()=>createCuraProfile({quality:-1}),/Quality/);
assert.throws(()=>createCuraProfile({intent:'anything'}),/intent/);
assert.equal(resolveCuraQualityType('Ultimaker 2+',.8),'draft');
assert.equal(resolveCuraQualityType('Ultimaker 2+',.6),'fast');
assert.equal(resolveCuraQualityType('Ultimaker 3 Extended',.25),'normal');
const ownerProfile=createCuraProfile({machine:'Ultimaker 3 Extended',nozzle:.8,material:'PLA',quality:60});
for(const {body} of inspectZip(ownerProfile.bytes)){
 assert.match(body,/definition = ultimaker3/);
 assert.match(body,/quality_type = draft/);
 assert.match(body,/variant = AA 0.8/);
}
assert.match(calculateCuraSettings({machine:'Ultimaker 2+',material:'PETG'}).warnings.join(' '),/excludes Generic PETG/);
assert.equal(resolveCuraQualityType('Ultimaker 3 Extended',.4),'normal');
assert.equal(createCuraProfile({machine:'Ultimaker 2+',nozzle:.8,qualityType:'high'}).qualityType,'high');
assert.throws(()=>createCuraProfile({qualityType:'not-a-real-quality'}),/quality type/);
const curaResources=process.env.CRYSTAL_FORGE_CURA_RESOURCES;
if(curaResources){
 for(const machine of CURA_MACHINES){
  const um3=machine==='Ultimaker 3 Extended';
  const qualityFolder=join(curaResources,'quality',um3?'ultimaker3':'ultimaker2_plus');
  const shipped=readdirSync(qualityFolder).filter(name=>name.endsWith('.inst.cfg')).map(name=>{
   const metadata=readFileSync(join(qualityFolder,name),'utf8').split('[values]')[0];
   return Object.fromEntries([...metadata.matchAll(/^(\w+)[ \t]*=[ \t]*(.+)$/gm)].map(([,key,value])=>[key,value.trim()]));
  });
  for(const nozzle of CURA_NOZZLES){
   if(um3&&nozzle===.6)continue;
   for(const material of CURA_MATERIALS){
    const variant=um3?'AA '+nozzle:nozzle+' mm';
    const qualityType=resolveCuraQualityType(machine,nozzle);
    const exists=shipped.some(profile=>profile.variant===variant&&profile.material==='generic_'+material.toLowerCase()&&
     profile.quality_type===qualityType);
    assert.equal(exists,um3||material==='PLA',machine+' '+variant+' '+material+' '+qualityType+' stock Cura base');
   }
  }
 }
 console.log('Installed Cura metadata matches 10 stock bases and confirms four UM2+ PETG combinations need manual settings.');
}
console.log('Cura profile ZIP metadata verified across 14 generated combinations and three print intentions.');
