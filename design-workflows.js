/* Reusable design presets and hardware-grid positions.
 * Scope is either a selected unlocked crystal or the global shape settings.
 */
export const SHAPE_PRESETS={
 'Classic Quartz':{familyMix:'Quartz',bottomScale:1,topScale:.8,tipLength:.27,cornerRadius:.7,shoulderRound:.3,tipRound:3.5,roundSteps:3},
 'Tall Needles':{familyMix:'Shard',bottomScale:.48,topScale:.35,tipLength:.43,cornerRadius:.4,shoulderRound:.4,tipRound:2.5,roundSteps:5},
 'Broad Geode':{familyMix:'Fantasy',bottomScale:1.8,topScale:1.25,tipLength:.19,cornerRadius:1.1,shoulderRound:1.2,tipRound:5,roundSteps:6},
 'Soft Rounded':{familyMix:'Quartz',bottomScale:1.1,topScale:.88,tipLength:.25,cornerRadius:2.5,shoulderRound:2,tipRound:7,roundSteps:8},
 'Blade Shards':{familyMix:'Blade',bottomScale:1.6,topScale:.38,tipLength:.4,cornerRadius:.15,shoulderRound:.2,tipRound:2.2,roundSteps:3}
};
export function applyShapePreset(crystals,settings,selectedId,presetName){
 const preset=SHAPE_PRESETS[presetName];if(!preset)return {applied:false,reason:'Unknown preset'};
 const target=crystals.find(c=>c.id===selectedId);
 if(target?.locked)return {applied:false,reason:'Unlock this crystal first'};
 if(target){
  target.family=preset.familyMix;
  target.shape={...(target.shape||{}),...Object.fromEntries(Object.entries(preset).filter(([k])=>k!=='familyMix'))};
  return {applied:true,scope:'crystal',name:target.name};
 }
 Object.assign(settings,preset);
 return {applied:true,scope:'global'};
}
export function snapHardwareCoordinate(value,enabled=false,step=5){
 const number=Number(value);if(!Number.isFinite(number))return 0;
 const size=Math.max(.5,Math.min(20,Number(step)||5));
 return Number((enabled?Math.round(number/size)*size:number).toFixed(2));
}
export function snapHardwarePoint(point,settings={}){
 return {x:snapHardwareCoordinate(point.x,settings.hardwareSnap,settings.hardwareSnapStep),
  z:snapHardwareCoordinate(point.z,settings.hardwareSnap,settings.hardwareSnapStep)};
}
