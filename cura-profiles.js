/* Crystal Forge Cura overrides — first-pass custom-quality profiles.
 * These are user-adjustable DIFFERENCES layered over an existing Cura
 * machine, nozzle/print core, and material preset. No G-code is produced.
 * ZIP structure and instance container metadata follow Cura's documented
 * CuraProfileWriter/CuraProfileReader conventions (version 4).
 *
 * IMPORTANT: Import into Cura 5.x after choosing the exact machine,
 * extruder/nozzle, PLA or PETG material. No machine firmware changes.
 */
export const CURA_NOZZLES=[0.25,0.4,0.6,0.8];
export const CURA_MACHINES=['Ultimaker 3 Extended','Ultimaker 2+'];
export const CURA_MATERIALS=['PLA','PETG'];
export const CURA_INTENTS=[
 {value:'light',name:'Light transmission (0% infill)'},
 {value:'balanced',name:'Balanced strength (10–15% infill)'},
 {value:'durable',name:'Durable structure (25–30% infill)'}
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const snap=(n,decimals=3)=>Number(n.toFixed(decimals));
const safe=s=>String(s).replace(/[\r\n[\]=]/g,' ').trim().slice(0,90);

export function validateCuraOptions(options={}){
 const machine=options.machine||'Ultimaker 3 Extended';
 const nozzle=Number(options.nozzle??.4);
 const material=options.material||'PLA';
 const quality=Number(options.quality??60);
 const intent=options.intent||'light';
 if(!CURA_MACHINES.includes(machine))throw Error('Select Ultimaker 3 Extended or Ultimaker 2+.');
 if(!CURA_NOZZLES.includes(nozzle))throw Error('Nozzle must be 0.25, 0.4, 0.6 or 0.8 mm.');
 if(machine==='Ultimaker 3 Extended'&&nozzle===.6)
  throw Error('Ultimaker 3 Extended has no standard AA 0.6 mm print core. Choose AA 0.25, 0.4 or 0.8, or select an Ultimaker 2+.');
 if(!CURA_MATERIALS.includes(material))throw Error('Material must be PLA or PETG.');
 if(!Number.isFinite(quality)||quality<0||quality>100)throw Error('Quality must be between 0 and 100.');
 if(!CURA_INTENTS.some(item=>item.value===intent))throw Error('Unknown print intent.');
 return {machine,nozzle,material,quality:Math.round(quality),intent};
}
export function calculateCuraSettings(options={}){
 const o=validateCuraOptions(options);
 const fine=o.quality/100; // 0 = faster/larger layers, 100 = finer/slower
 // Keep height below 75% of the physical nozzle; preserve a practical
 // lower bound for the supported extruder sizes. Nozzle = print core on UM3.
 const layerHeight=snap(clamp(o.nozzle*(.58-.37*fine),.06,o.nozzle*.70),3);
 const initialHeight=snap(clamp(o.nozzle*.45,.12,Math.min(.32,o.nozzle*.65)),3);
 const wallCount=fine>=.72?4:fine>=.3?3:2;
 const topLayers=fine>=.72?6:fine>=.3?5:4;
 const bottomLayers=fine>=.72?6:fine>=.3?5:4;
 // A conservative speed cap for older machines and large/small nozzles.
 // These are suggested overrides, NOT manufacturer/filament certificates.
 const speedBase=o.nozzle===.25?28:o.nozzle===.4?45:o.nozzle===.6?48:38;
 const materialFactor=o.material==='PETG'?.76:1;
 const speed=Math.max(18,Math.round(speedBase*(1-.33*fine)*materialFactor));
 const outer=Math.max(14,Math.round(speed*.65));
 const top=Math.max(14,Math.round(speed*.7));
 const first=Math.min(22,Math.max(12,Math.round(speed*.5)));
 const density=o.intent==='light'?0:o.intent==='balanced'?(fine>=.55?15:10):(fine>=.55?30:25);
 const fan=o.material==='PETG'?40:100;
 const adhesion=o.material==='PETG'?'brim':'skirt';
 const supports=false; // never assume this model is support-free
 const global={
  layer_height:layerHeight,
  layer_height_0:initialHeight,
  infill_sparse_density:density,
  support_enable:supports,
  adhesion_type:adhesion
 };
 const extruder={
  line_width:o.nozzle,
  wall_line_count:wallCount,
  top_layers:topLayers,
  bottom_layers:bottomLayers,
  speed_print:speed,
  speed_wall_0:outer,
  speed_topbottom:top,
  speed_layer_0:first,
  cool_fan_enabled:true,
  cool_fan_speed:fan
 };
 const warnings=[
  'This file changes print settings only. Confirm the physical nozzle or AA print core and correct material in Cura before importing.',
  '0% infill does not guarantee connected optical cavities: Cura may still print solid skins between the LED and crystal spikes.',
  'Support-free printing and bridge spans are not guaranteed. Always inspect Cura layer preview, especially over open bases and LED channels.',
  'These values are conservative starting points, not measured or machine-tested optimisations. Test a small calibration piece.'
 ];
 if(o.nozzle===.25)warnings.push('A 0.25 mm nozzle may clog more readily and takes longer; test fine facets and filament flow.');
 if(o.nozzle===.8)warnings.push('A 0.8 mm nozzle may swallow fine crystal tips and narrow wire slots; check that feature width exceeds your line width.');
 if(o.material==='PETG')warnings.push('PETG often needs different temperature, drying and first-layer adhesion; Cura material presets remain authoritative for temperatures.');
 return {...o,layerHeight,initialHeight,wallCount,topLayers,bottomLayers,speed,outer,top,first,fan,density,adhesion,global,extruder,warnings};
}
const fileValue=value=>typeof value==='boolean'?(value?'True':'False'):String(value);
const section=values=>Object.entries(values).map(([k,v])=>k+' = '+fileValue(v)).join('\n');
function makeContainer(name,definition,qualityType,material,variant,values,position){
 const metadata={
  type:'quality_changes',quality_type:qualityType,setting_version:27,
  intent_category:'default',material,variant
 };
 if(position!=null)metadata.position=String(position);
 return '[general]\nversion = 4\nname = '+safe(name)+'\ndefinition = '+definition+
  '\n\n[metadata]\n'+section(metadata)+'\n\n[values]\n'+section(values)+'\n';
}
// Pure-ESM ZIP writer, store method: compatible with Cura profile reader
// and modern browsers without using third-party scripts or dependencies.
function crc32(bytes){
 let crc=0xffffffff;
 for(const byte of bytes){
  crc^=byte;
  for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
 }
 return (crc^0xffffffff)>>>0;
}
function write16(v,n,p){v.setUint16(p,n,true)}
function write32(v,n,p){v.setUint32(p,n,true)}
function concatenate(parts){
 const size=parts.reduce((n,b)=>n+b.length,0),out=new Uint8Array(size);
 let at=0;for(const p of parts){out.set(p,at);at+=p.length}
 return out;
}
export function zipProfileEntries(entries){
 const encoder=new TextEncoder(),parts=[],central=[];
 let offset=0;
 for(const [name,body] of entries){
  const filename=encoder.encode(name),bytes=encoder.encode(body),crc=crc32(bytes);
  const local=new Uint8Array(30+filename.length),v=new DataView(local.buffer);
  write32(v,0x04034b50,0);write16(v,20,4);write16(v,0,6);write16(v,0,8);
  write32(v,crc,14);write32(v,bytes.length,18);write32(v,bytes.length,22);
  write16(v,filename.length,26);local.set(filename,30);
  parts.push(local,bytes);
  const cd=new Uint8Array(46+filename.length),c=new DataView(cd.buffer);
  write32(c,0x02014b50,0);write16(c,20,4);write16(c,20,6);
  write32(c,crc,16);write32(c,bytes.length,20);write32(c,bytes.length,24);
  write16(c,filename.length,28);write32(c,offset,42);cd.set(filename,46);
  central.push(cd);offset+=local.length+bytes.length;
 }
 const directory=concatenate(central),ending=new Uint8Array(22),e=new DataView(ending.buffer);
 write32(e,0x06054b50,0);write16(e,entries.length,8);write16(e,entries.length,10);
 write32(e,directory.length,12);write32(e,offset,16);
 return concatenate([...parts,directory,ending]);
}
export function createCuraProfile(options={}){
 const p=calculateCuraSettings(options);
 const definition=p.machine==='Ultimaker 3 Extended'?'ultimaker3':'ultimaker2_plus';
 const variant=p.machine==='Ultimaker 3 Extended'?'AA '+p.nozzle:p.nozzle+' mm';
 const material=p.material==='PLA'?'generic_pla':'generic_petg';
 // A 'normal' quality base exists for the stock supported configurations.
 // This file overlays the installed Cura machine/material/variant profile;
 // it does not install/change a hardware definition or nozzle itself.
 const qualityType='normal';
 const title='Crystal Forge '+p.machine+' '+p.nozzle+'mm '+p.material+' Q'+p.quality;
 const global=makeContainer(title,definition,qualityType,material,variant,p.global);
 const extruder=makeContainer(title,definition,qualityType,material,variant,p.extruder,0);
 const other=makeContainer(title,definition,qualityType,material,variant,{},1);
 const entries=[
  ['crystal_forge_global',global],
  ['crystal_forge_extruder_0',extruder]
 ];
 if(p.machine==='Ultimaker 3 Extended')entries.push(['crystal_forge_extruder_1',other]);
 const bytes=zipProfileEntries(entries);
 const base='Crystal-Forge_'+(p.machine==='Ultimaker 3 Extended'?'UM3-Extended':'UM2-Plus')+
  '_'+String(p.nozzle).replace('.','p')+'mm_'+p.material+'_Q'+p.quality;
 return {...p,bytes,files:entries.map(x=>x[0]),filename:base+'.curaprofile',title};
}
