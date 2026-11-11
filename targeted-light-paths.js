/* PR7 — explicit, opt-in light-path planning for solid printed clusters.
 * All lengths in mm. Candidate paths are MANUFACTURING CUT REQUESTS, not
 * claims of watertight lumens or certified minimum wall thickness.
 */
import {baseSurfaceHeight} from './geometry-v3.js';
import {resolvePixelProfile} from './pixel-profiles.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const nearest=(p,items)=>{
 let best=null,min=Infinity;
 for(let i=0;i<items.length;i++){
  const d=distance(p,items[i]);
  if(d<min){min=d;best={item:items[i],index:i,d}}
 }
 return best;
};
const interval=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
export function planTargetedLightPaths(crystals,s,hardware){
 const result={enabled:!!s.targetedLightPaths,paths:[],skipped:[],warnings:[]};
 if(!result.enabled)return result;
 if(!s.cutSockets||s.baseType==='none'||s.hollowCrystals||s.baseVault){
  result.warnings.push('Targeted light passages need a solid integrated base with LED socket holes and cannot be combined with balloon hollowing or the base vault.');
  return result;
 }
 const sockets=hardware.sockets||[];
 if(!sockets.length){result.warnings.push('Add at least one accepted LED socket before requesting light passages.');return result;}
 const wall=clamp(Number(s.wallThickness)||1.2,1,4);
 const maxLength=clamp(Number(s.lightReach)||85,15,180);
 const diameter=clamp(Number(s.lightBoreDiameter)||4,1.6,8);
 const boreRadius=diameter/2;
 const profile=resolvePixelProfile(s);
 const mountHoles=[...(hardware.mounts||[]),...(hardware.tabHoles||[])];
 for(const c of crystals){
  if(c.hidden)continue;
  const shape={...s,...(c.shape||{})};
  const scale=Math.min(Number(c.sx||c.scale||1),Number(c.sz||c.scale||1));
  const rootWidth=c.r*Math.min(Number(shape.bottomScale)||1,Number(shape.topScale)||.8)*scale;
  const tipFraction=clamp(Number(shape.tipLength)||.27,.1,.55);
  const reachHeight=Number(c.h||0)*clamp(1-tipFraction*.9,.35,.77);
  const source=nearest(c,sockets);
  const reason=(message)=>result.skipped.push({id:c.id,name:c.name,reason:message});
  if(!source){reason('No LED socket');continue}
  if(source.d>maxLength){reason('LED too far ('+source.d.toFixed(1)+' mm)');continue}
  if(rootWidth<boreRadius+wall*2.5){reason('Root too narrow for requested passage and wall margin');continue}
  const sourceRoof=baseSurfaceHeight(crystals,s,source.item.x,source.item.z);
  const sourceTop=Math.min(sourceRoof-2.8,-3+Number(profile.bodyHeight||22));
  let lowestRoof=Infinity;
  let blocked=false;
  const steps=Math.max(4,Math.ceil(source.d/6));
  for(let i=0;i<=steps;i++){
   const q=interval(source.item,c,i/steps);
   lowestRoof=Math.min(lowestRoof,baseSurfaceHeight(crystals,s,q.x,q.z));
   if(mountHoles.some(h=>distance(q,h)<boreRadius+Number(h.radius||0)+wall+1))blocked=true;
  }
  if(blocked){reason('Conduit would approach a mounting hole');continue}
  const baseY=Math.min(sourceTop-.65,lowestRoof-boreRadius-wall);
  if(baseY<boreRadius+wall+1){reason('Not enough base roof thickness for the conduit');continue}
  const tipY=baseSurfaceHeight(crystals,s,c.x,c.z)+reachHeight*.7;
  if(tipY<=baseY+5){reason('Crystal too short for a useful light channel');continue}
  const start={x:source.item.x,y:sourceTop-.6,z:source.item.z};
  const elbow={x:source.item.x,y:baseY,z:source.item.z};
  const entry={x:c.x,y:baseY,z:c.z};
  const root={x:c.x,y:baseSurfaceHeight(crystals,s,c.x,c.z)+Math.min(2.5,reachHeight*.15),z:c.z};
  // The final tip is transformed by the actual crystal mesh in manufacturing.
  result.paths.push({id:c.id,name:c.name,sourceIndex:source.index,
   sourceDistanceMm:Number(source.d.toFixed(1)),boreRadius,baseSegments:[[start,elbow],[elbow,entry],[entry,root]],
   crystalHeightMm:reachHeight,wallMarginMm:wall});
 }
 if(result.skipped.length)result.warnings.push(result.skipped.length+' crystal light passage(s) were rejected due to clearance/geometry limits.');
 return result;
}
