/* Conservative manual alignment of the physical P1→P2→... cable string.
 * Uses the SAME collision-checked, sampled curved-route length as fabrication.
 * Pixel 1 is the anchor; inlet/outlet cable tails are never length-matched.
 * No state is modified unless the caller explicitly accepts the result.
 */
import {planHardware} from './hardware-layout.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const round=v=>Math.round(v*1000)/1000;
const linkAt=(plan,index)=>plan?.wirePlan?.connections?.find(c=>c.kind==='link'&&c.from===index-1&&c.to===index)||null;
const matchedMounts=(previous,next)=>
 previous.mounts.length===next.mounts.length&&
 previous.mounts.every((p,i)=>next.mounts[i]?.id===p.id&&distance(p,next.mounts[i])<.01)&&
 previous.tabs.length===next.tabs.length;

export function snapPixelsToWireLength(crystals,settings,{maxMoveMm=5,accuracyMm=.18}={}){
 const target=Number(settings.pixelStringSpacing);
 const radius=clamp(Number(maxMoveMm)||5,.5,25),accuracy=clamp(Number(accuracyMm)||.18,.05,.45);
 const fail=reason=>({changed:false,aligned:0,total:0,links:[],reason,
  settings:null,targetMm:target,maxMoveMm:radius});
 if(settings.wireMode!=='string'||!settings.wireChannels||!settings.cutSockets)
  return fail('Enable Pixel string mode, cable channels and LED sockets before snapping.');
 if(!Number.isFinite(target)||target<5||target>1000)return fail('Choose a valid physical pixel spacing in millimetres.');
 const originalPlan=planHardware(crystals,settings);
 const accepted=originalPlan.sockets;
 if(accepted.length<2)return fail('At least two accepted pixels are needed. The first IN and last OUT tails are not spacing-constrained.');
 if(originalPlan.skippedPixels||originalPlan.invalidManualPixels.length||
    originalPlan.invalidManualMounts.length||originalPlan.collisions.length)
  return fail('Correct invalid or colliding hardware before snapping.');
 const pixelCount=accepted.length;
 const source=settings.pixelPlacement==='manual'
  ?settings.manualPixelHoles.map(p=>({...p}))
  :accepted.map(p=>({id:p.id,x:p.x,z:p.z,wireAngle:p.wireAngle??0,profileId:p.profileId,
     ...(p.wireEndX===undefined?{}:{wireEndX:p.wireEndX}),
     ...(p.wireEndZ===undefined?{}:{wireEndZ:p.wireEndZ})}));
 if(source.length!==pixelCount)return fail('Manual pixel count does not match the accepted string.');
 const working=source.map(p=>({...p}));
 const proposed={...settings,pixelPlacement:'manual',lightingMode:'multi',pixelCount,
  manualPixelHoles:working};
 const initialPlan=planHardware(crystals,proposed);
 if(initialPlan.sockets.length!==pixelCount||initialPlan.invalidManualPixels.length)
  return fail('Cannot preserve every socket when switching to manual positioning.');
 const desired=target-.07; // Keep a real sub-0.1 mm margin against the over-length blocker.
 const links=[];
 let aligned=0,moved=0;
 let plan=initialPlan;
 for(let i=1;i<working.length;i++){
  const start=working[i],previous=working[i-1],before=linkAt(plan,i);
  const label='P'+i+'→P'+(i+1);
  if(!before){
   links.push({label,status:'skipped',beforeMm:null,afterMm:null,moveMm:0,
    reason:'No safe curved connection at the current positions.'});
   continue;
  }
  const beforeMm=before.lengthMm;
  if(beforeMm<=target+.005&&beforeMm>=target-accuracy){
   aligned++;
   links.push({label,status:'already-aligned',beforeMm,afterMm:beforeMm,moveMm:0});
   continue;
  }
  if(Math.abs(beforeMm-target)>radius+1){
   links.push({label,status:'skipped',beforeMm,afterMm:beforeMm,moveMm:0,
    reason:'Outside the '+radius+' mm fine-adjustment window; move this pixel nearer '+target+' mm first.'});
   continue;
  }
  // Validate the entire layout and the prior accepted links on every trial.
  const evaluate=(x,z)=>{
   const p={...start,x:round(x),z:round(z)};
   const candidate=working.map((o,j)=>j===i?p:o);
   const draft={...proposed,manualPixelHoles:candidate};
   const current=planHardware(crystals,draft);
   if(current.sockets.length!==pixelCount||current.skippedPixels||current.collisions.length||
      current.invalidManualPixels.length||current.invalidManualMounts.length||
      !matchedMounts(initialPlan,current))return null;
   for(let k=1;k<i;k++){
    const old=links[k-1];
    if(old?.status==='skipped')continue;
    const prior=linkAt(current,k);
    if(!prior||prior.lengthMm>target+.01||prior.lengthMm<target-accuracy)return null;
   }
   // Preserve the inlet/outlet path itself, without forcing either tail to
   // the inter-pixel spacing (they may be shorter or longer).
   for(const kind of ['input','output']){
    if(plan.wirePlan.connections.some(c=>c.kind===kind)&&
       !current.wirePlan.connections.some(c=>c.kind===kind))return null;
   }
   const link=linkAt(current,i);
   if(!link)return null;
   return {p,plan:current,len:link.lengthMm,offset:distance(start,p),
    score:Math.abs(link.lengthMm-desired)};
  };
  const initialCandidate=evaluate(start.x,start.z);
  let best=initialCandidate;
  if(!best){
   links.push({label,status:'skipped',beforeMm,afterMm:beforeMm,moveMm:0,
    reason:'Current route cannot be validated without changing other hardware.'});
   continue;
  }
  let direction={x:start.x-previous.x,z:start.z-previous.z};
  let scale=Math.hypot(direction.x,direction.z);
  if(scale<.01){const angle=(Number(start.wireAngle)||0)*Math.PI/180;
   direction={x:Math.cos(angle),z:Math.sin(angle)};scale=1}
  direction={x:direction.x/scale,z:direction.z/scale};
  const perp={x:-direction.z,z:direction.x};
  const axes=[direction,perp,
    {x:(direction.x+perp.x)/Math.SQRT2,z:(direction.z+perp.z)/Math.SQRT2},
    {x:(direction.x-perp.x)/Math.SQRT2,z:(direction.z-perp.z)/Math.SQRT2}];
  const fits=c=>c&&c.len>=target-accuracy&&c.len<=target+.005;
  // Sample signed small displacements. A bisection on opposite sides of
  // measured length=target gives sub-mm precision while respecting collision
  // and actual Bezier/roof screening on EVERY candidate.
  outer:for(const axis of axes){
   const sample=[];
   for(let n=-5;n<=5;n++){
    const t=n*radius/5;
    const result=n===0?initialCandidate:evaluate(start.x+axis.x*t,start.z+axis.z*t);
    sample.push({t,result});
    if(result&&(result.score<best.score-1e-7||
       (Math.abs(result.score-best.score)<1e-7&&result.offset<best.offset)))best=result;
   }
   for(let j=1;j<sample.length;j++){
    let left=sample[j-1],right=sample[j];
    if(!left.result||!right.result||
       (left.result.len-desired)*(right.result.len-desired)>0)continue;
    for(let step=0;step<12;step++){
     const t=(left.t+right.t)/2;
     const result=evaluate(start.x+axis.x*t,start.z+axis.z*t);
     if(!result)break;
     if(result.score<best.score-1e-7||
        (Math.abs(result.score-best.score)<1e-7&&result.offset<best.offset))best=result;
     if((left.result.len-desired)*(result.len-desired)<=0)right={t,result};
     else left={t,result};
    }
   }
   if(fits(best))break outer;
  }
  if(!fits(best)||best.offset>radius+.001){
   links.push({label,status:'skipped',beforeMm,afterMm:beforeMm,moveMm:0,
    reason:'No collision-free position within '+radius+' mm could reach '+target+' mm (measured curved route).'});
   continue;
  }
  working[i]=best.p;
  proposed.manualPixelHoles=working;
  plan=best.plan;
  moved+=best.offset>.005?1:0;
  aligned++;
  links.push({label,status:'snapped',beforeMm,afterMm:best.len,
   moveMm:best.offset,x:best.p.x,z:best.p.z});
 }
 if(moved===0)return {changed:false,aligned,total:links.length,links,settings:null,
  targetMm:target,maxMoveMm:radius,reason:aligned===links.length?'All internal links are already within tolerance.':
    'No additional internal links could be snapped safely.'};
 // A single copy-on-commit result: the UI calls onEdit exactly once, preserving
 // undo history and invalidating prepared manufacturing exports.
 const final=planHardware(crystals,proposed);
 if(final.sockets.length!==pixelCount||final.skippedPixels||final.invalidManualPixels.length)
  return fail('Final collision validation failed. No pixel positions were changed.');
 for(let i=1;i<links.length+1;i++){
  const item=links[i-1];
  if(item.status==='skipped')continue;
  const current=linkAt(final,i);
  if(!current||current.lengthMm>target+.01||current.lengthMm<target-accuracy)
   return fail('Final curved cable validation changed. No positions were saved.');
 }
 return {changed:true,moved,aligned,total:links.length,links,
  targetMm:target,maxMoveMm:radius,
  settings:{pixelPlacement:'manual',lightingMode:'multi',pixelCount,
    manualPixelHoles:working}};
}
