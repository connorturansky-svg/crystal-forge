import assert from 'node:assert/strict';
import {calculateCuraSettings,createCuraProfile,CURA_MACHINES,CURA_MATERIALS,CURA_NOZZLES} from '../cura-profiles.js';

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
    'quality_type = normal','version = 4','setting_version = 27','layer_height = ',
    'wall_line_count = ','infill_sparse_density = '])
    assert(all.includes(part),'Cura metadata or value missing: '+part);
   assert(all.includes('material = generic_'+material.toLowerCase()),'material metadata');
   assert(all.includes('definition = '+(machine==='Ultimaker 3 Extended'?'ultimaker3':'ultimaker2_plus')),'machine definition');
   assert(all.includes('variant = '+(machine==='Ultimaker 3 Extended'?'AA '+nozzle:nozzle+' mm')),'nozzle variant');
   assert(!all.includes('material_print_temperature = '),'preserves selected Cura material temperature');
   assert(!all.includes('machine_nozzle_size = '),'does not silently alter physical machine nozzle');
  }
 }
}
assert.throws(()=>createCuraProfile({machine:'Custom / other'}),/Select Ultimaker/);
assert.throws(()=>createCuraProfile({quality:-1}),/Quality/);
assert.throws(()=>createCuraProfile({intent:'anything'}),/intent/);
console.log('Cura profile 14 supported machine/nozzle/material combinations, three print intentions and ZIP metadata passed');
