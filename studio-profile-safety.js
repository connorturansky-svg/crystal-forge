import {normalisePixelProfile} from './pixel-profiles.js';

export const MAX_CUSTOM_PIXEL_PROFILES=30;

/**
 * Return the complete proposed durable library, or refuse without changing the
 * input. Old libraries over capacity remain readable; updating an existing ID
 * never evicts another person's measured calibration.
 */
export function planPixelProfileSave(existing,raw){
 if(!Array.isArray(existing))throw Error('Pixel profile library is unreadable. Export a backup before editing.');
 const profile=normalisePixelProfile(raw);
 if(!profile.id.startsWith('custom-'))throw Error('Only custom pixel profiles can be saved.');
 const all=existing.map(normalisePixelProfile);
 if(all.some(p=>!p.id.startsWith('custom-')))throw Error('Library contains an invalid profile; preserve a backup before editing.');
 const previous=all.find(item=>item.id===profile.id);
 if(!previous&&all.length>=MAX_CUSTOM_PIXEL_PROFILES)
  throw Error('The profile library is full ('+all.length+' custom profiles). Export a backup before removing a profile; no calibration was overwritten.');
 return [...all.filter(item=>item.id!==profile.id),profile];
}

export function planPixelProfileDelete(existing,id){
 if(!Array.isArray(existing)||typeof id!=='string'||!id.startsWith('custom-'))
  throw Error('Only a selected custom pixel profile can be deleted.');
 const found=existing.find(item=>item.id===id);
 if(!found)throw Error('Selected pixel profile no longer exists. Nothing was deleted.');
 return existing.filter(item=>item.id!==id);
}

export function profileReferencedInModel(model,id){
 if(!model||typeof model!=='object')return false;
 if(model.build?.activePixelProfileId===id)return true;
 if((model.build?.pixelHoles||[]).some(hole=>hole.profileId===id||hole.socketProfile?.id===id))return true;
 if(model.generator?.typeId==='crystals'){
  if(model.parameters?.pixelProfileId===id)return true;
  if((model.parameters?.manualPixelHoles||[]).some(hole=>hole.profileId===id))return true;
 }
 return false;
}
