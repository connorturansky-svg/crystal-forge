// Native mounting profiles share placement checks and production stock guards.
import {pixelBoreIssue} from './studio-pixel-bore-validation.js';

export const MAX_NATIVE_MOUNTS=16;
export const mountProfiles=['Through-hole','Counterbore','Countersink'];
const pocketDefaults={'Magnet pocket':{diameter:6,depth:2.5},'Threaded insert pilot':{diameter:4,depth:4}};
export const manualMountProfiles=[...mountProfiles,...Object.keys(pocketDefaults)];
export function blindMountProfile(profile){return Object.hasOwn(pocketDefaults,profile);}
export function recessDimensions(mount){
 const defaults=blindMountProfile(mount.profile)?pocketDefaults[mount.profile]:{diameter:mount.diameter*1.5,depth:1.4};
 return {diameter:mount.recessDiameter??defaults.diameter,depth:mount.recessDepth??defaults.depth};
}
export function fixingRecessCut(mount,{surfaceY=0,top=false,fixingId,label}){
 const {diameter,depth}=recessDimensions(mount);
 const blind=blindMountProfile(mount.profile),minimum=blind?2:mount.diameter+.4;
 if(!Number.isFinite(diameter)||diameter<minimum||diameter>12||!Number.isFinite(depth)||depth<.5||depth>8)
  throw Error(blind?'Choose a pocket 2–12 mm wide and 0.5–8 mm deep.':
   'Choose a recess 0.5–8 mm deep and at least 0.4 mm wider than the through-hole, up to 12 mm.');
 const tapered=mount.profile==='Countersink',pilot=mount.diameter/2,opening=diameter/2;
 const outer=tapered?opening+(opening-pilot)*.2/depth:opening;
 return {kind:'cylinder',radius:top&&tapered?pilot:outer,topRadius:!top&&tapered?pilot:outer,
  height:depth+.2,position:[mount.x,surfaceY+(top?-1:1)*(depth-.2)/2,mount.z],
  fixingId,fixingRecess:label,fixingSurfaceY:surfaceY,fixingTopEntry:top};
}
export const stableMounts=holes=>(holes||[]).map((hole,index)=>({...hole,id:hole.id||'legacy-mount-'+(index+1),diameter:hole.diameter??3.4}));
export function newMount(x=0,z=0,diameter=3.4){
 return {id:globalThis.crypto?.randomUUID?.()??'mount-'+Date.now()+'-'+Math.random().toString(36).slice(2),x,z,diameter,entryFace:'top'};
}
export function mountHoleIssue(recipe,mount,otherMounts=[],pixelHoles=[]){
 if(!mount||![mount.x,mount.z,mount.diameter].every(Number.isFinite)||mount.diameter<2||mount.diameter>8)
  return 'Mounting holes need numeric X/Z and a diameter between 2 and 8 mm.';
 if(!['top','underside',undefined].includes(mount.entryFace))
  return 'Choose a supported top or underside entry for the vertical mounting hole.';
 const profile=mount.profile??mountProfiles[0];
 if(!manualMountProfiles.includes(profile))return 'Choose a supported fixing profile.';
 if(profile!==mountProfiles[0]){
  if(mount.entryFace!=='underside'&&!Number.isFinite(recipe.serialSupport?.topY))
   return 'Place the mount on an underside or supported planar top face to add a recess.';
  try{fixingRecessCut(mount,{});}catch(error){return error.message;}
 }
 const footprint=hole=>({...hole,diameter:blindMountProfile(hole.profile)?recessDimensions(hole).diameter:hole.diameter,clearance:0});
 const other=[...otherMounts.map(footprint),...pixelHoles];
 const reason=pixelBoreIssue(recipe,footprint(mount),other);
 if(!reason)return null;
 return reason.replace(/another pixel/g,'another pixel or mounting hole').replace(/^The bore/g,'The mount').replace(/^Through bores/g,'Through mounting holes');
}
export function patternMountIssues(recipe,{candidates,remaining},pixelHoles=[]){
 return candidates.map((mount,index)=>mountHoleIssue(recipe,mount,
  [...remaining,...candidates.filter((_,other)=>other!==index)],pixelHoles));
}
export function addManualMountCuts(recipe,build={}){
 const mounts=build.manualMountHoles||[];
 if(!Array.isArray(mounts)||mounts.length>MAX_NATIVE_MOUNTS)
  throw Error('Use up to 16 manually placed mounting holes.');
 const seen=new Set();
 for(let i=0;i<mounts.length;i++){
  const mount=mounts[i],id=mount?.id||'legacy-mount-'+(i+1);
  if(seen.has(id))throw Error('Mount IDs must be distinct.');
  seen.add(id);
  const issue=mountHoleIssue(recipe,mount,mounts.slice(0,i),build.pixelHoles||[]);
  if(issue)throw Error('M'+(i+1)+': '+issue);
  const fixingId='manual-fixing-'+id;
  const marker={mountHole:'Mount hole '+(i+1),mountId:id,mountEntryFace:mount.entryFace||'top'};
  const blind=blindMountProfile(mount.profile);
  if(!blind)recipe.negative.push({
   fixingId,kind:'cylinder',radius:mount.diameter/2,height:recipe.bounds.height+12,
   position:[mount.x,recipe.bounds.height/2,mount.z],...marker,
   finishTopMouth:marker.mountEntryFace==='top'&&(mount.profile??mountProfiles[0])===mountProfiles[0]
  });
  if(mount.profile&&mount.profile!==mountProfiles[0]){
   const top=mount.entryFace!=='underside',surfaceY=top?recipe.serialSupport.topY:0;
   const cut=fixingRecessCut(mount,{top,surfaceY,fixingId,label:'M'+(i+1)+' '+(blind?mount.profile.toLowerCase():'recess')});
   recipe.negative.push({...cut,manualMountRecess:true,...(blind?marker:{})});
  }
 }
 if(mounts.length)recipe.warnings.push('Inspect remaining wall and measure a printed fixing sample before installation.');
}
