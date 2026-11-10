import {baseOutline} from './geometry-v3.js';
import {planEdgeTabs} from './edge-tabs.js';
/* Hardware placement planner shared by printable geometry and viewport annotations.
 * All positions are x/z on the underside of the cluster, distances in mm.
 * Conservative XY separation even where drilling depths do not overlap.
 */
const TAU = Math.PI * 2;
const min = (a,b) => Math.min(a,b);
const max = (a,b) => Math.max(a,b);
const dist = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
function hull(list) {
  const pts = list.slice().sort((a,b)=>a.x-b.x||a.z-b.z);
  if (pts.length <= 2) return pts;
  const cross=(o,a,b)=>(a.x-o.x)*(b.z-o.z)-(a.z-o.z)*(b.x-o.x);
  const lo=[], hi=[];
  for(const p of pts) { while(lo.length>1&&cross(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p); }
  for(let i=pts.length-1;i>=0;i--) {const p=pts[i];while(hi.length>1&&cross(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p);}
  lo.pop();hi.pop(); return lo.concat(hi);
}
function edgeDistance(p,a,b){
  const x=b.x-a.x,z=b.z-a.z;
  const t=Math.max(0,Math.min(1,((p.x-a.x)*x+(p.z-a.z)*z)/(x*x+z*z||1)));
  return Math.hypot(p.x-a.x-t*x,p.z-a.z-t*z);
}
function insidePolygon(p, polygon, clearance){
 if(polygon.length<3)return false;
 let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
   const a=polygon[i],b=polygon[j];
   if(edgeDistance(p,a,b)<clearance)return false;
   if(((a.z>p.z)!==(b.z>p.z)) && p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)inside=!inside;
 }
 return inside;
}
export function hardwareFootprint(crystals,s){
 return baseOutline(crystals,s).map(([x,z])=>({x,z}));
}
export function mountingProfile(s){
  const preset=s.mount || 'None';
  const custom=preset==='Custom dual holes';
  const diameter=custom? Number(s.mountHoleDiameter||4.5) :
    preset==='Magnet inserts'?10.2 : preset==='Threaded insert M3'?4.2 : 4.5;
  const depth=preset==='Magnet inserts'?Math.min(3.2,s.baseHeight-1.6):
    preset==='Threaded insert M3'?Math.min(5.5,s.baseHeight-1.6):
    custom?Math.max(1.2,Number(s.mountHoleDepth||s.baseHeight+2)):s.baseHeight+4;
  const enabled=!['None','Detachable plate','Edge fixing tabs'].includes(preset)&&s.baseType!=='none';
  return {preset,enabled,diameter,depth,requested:enabled?2:0};
}
export function planHardware(crystals,s){
  const all=crystals.filter(c=>!c.hidden);
  const polygon=hardwareFootprint(all,s);
  const cx=polygon.reduce((v,p)=>v+p.x,0)/(polygon.length||1),cz=polygon.reduce((v,p)=>v+p.z,0)/(polygon.length||1);
  const clearance=max(1.5,Number(s.hardwareClearance ?? 2.5));
  const sockets=[],mounts=[],messages=[];
  const socketDiameter=Number(s.pixelDiameter)+Number(s.pixelFit);
  const socketRadius=socketDiameter/2;
  const validHole=(p,radius,others)=>insidePolygon(p,polygon,radius+1.2)&&others.every(q=>dist(p,q)>=radius+q.radius+clearance-1e-5);
  const pixelManual=s.pixelPlacement==='manual',mountManual=s.mountPlacement==='manual';
  const manualPixels=Array.isArray(s.manualPixelHoles)?s.manualPixelHoles:[];
  const manualMounts=Array.isArray(s.manualMountHoles)?s.manualMountHoles:[];
  const invalidManualPixels=[],invalidManualMounts=[];
  const pixelRequested=(!s.cutSockets||s.lightingMode==='none')?0:
   pixelManual?min(s.lightingMode==='single'?1:60,manualPixels.length):
   s.lightingMode==='single'?1:max(0,Math.round(s.pixelCount));
  if(s.cutSockets&&(!Number.isFinite(socketDiameter)||socketDiameter<=0))throw new Error('Pixel socket diameter must be positive.');
  if(pixelManual&&pixelRequested)manualPixels.slice(0,pixelRequested).forEach((entry,i)=>{
    const p={x:Number(entry.x),z:Number(entry.z)},radius=socketRadius;
    if(Number.isFinite(p.x)&&Number.isFinite(p.z)&&validHole(p,radius,sockets))
      sockets.push({...p,radius,diameter:socketDiameter,kind:'LED',manual:true,index:i});
    else invalidManualPixels.push({...p,radius,kind:'LED',index:i});
  });
  const ranked=pixelManual?[]:all.slice().sort((a,b)=>b.r*b.h-a.r*a.h);
  for(const c of ranked){
    if(sockets.length>=pixelRequested)break;
    const r=c.r*(c.shape?.bottomScale??s.bottomScale)*min(c.sx||c.scale||1,c.sz||c.scale||1);
    if(r<socketRadius+clearance+1.2)continue;
    // Try the crystal axis, then a few locations away from it in larger crystals.
    const offsets=[{x:0,z:0}];
    const off=socketRadius*2+clearance+1;
    if(r>off+socketRadius+clearance+1)for(const a of [0,Math.PI/2,Math.PI,3*Math.PI/2]){
      offsets.push({x:Math.cos(a)*off,z:Math.sin(a)*off});
    }
    for(const o of offsets){
      if(sockets.length>=pixelRequested)break;
      const a=c.rotation,p={x:c.x+o.x*Math.cos(a)-o.z*Math.sin(a),z:c.z+o.x*Math.sin(a)+o.z*Math.cos(a)};
      if(Math.hypot(o.x,o.z)+socketRadius+clearance > r-1.0)continue;
      if(!validHole(p,socketRadius,sockets))continue;
      sockets.push({...p,radius:socketRadius,diameter:socketDiameter,crystalId:c.id,kind:'LED'});
    }
  }
  // A usable LED need not be entirely within a single crystal root.
  // In Cura-first mode it can sit anywhere in the integrated base, so try
  // deterministic positions throughout the base if root-centred placement fails.
  if(!pixelManual&&sockets.length<pixelRequested&&polygon.length>=3&&s.baseType!=='none'){
    const minX=Math.min(...polygon.map(p=>p.x)),maxX=Math.max(...polygon.map(p=>p.x));
    const minZ=Math.min(...polygon.map(p=>p.z)),maxZ=Math.max(...polygon.map(p=>p.z));
    const centroid={x:(minX+maxX)/2,z:(minZ+maxZ)/2};
    const candidates=[centroid,{x:cx,z:cz}];
    const extent=Math.hypot(maxX-minX,maxZ-minZ)/2;
    const stride=Math.max(socketDiameter+clearance+2,6);
    for(let radius=stride*.35;radius<extent+stride;radius+=stride*.6){
      const count=Math.max(18,Math.ceil(2*Math.PI*radius/(stride*.65)));
      for(let k=0;k<count;k++){
        const angle=TAU*(k/count)+.17;
        candidates.push({x:centroid.x+Math.cos(angle)*radius,z:centroid.z+Math.sin(angle)*radius});
      }
    }
    for(const p of candidates){
      if(sockets.length>=pixelRequested)break;
      if(!validHole(p,socketRadius,sockets))continue;
      sockets.push({...p,radius:socketRadius,diameter:socketDiameter,crystalId:null,kind:'LED',autoFallback:true});
    }
  }
  const mp=mountingProfile(s);
  if(mp.enabled&&mountManual)manualMounts.slice(0,20).forEach((entry,i)=>{
    const p={x:Number(entry.x),z:Number(entry.z)},radius=mp.diameter/2;
    if(Number.isFinite(p.x)&&Number.isFinite(p.z)&&validHole(p,radius,[...sockets,...mounts]))
      mounts.push({...p,radius,kind:'mount',diameter:mp.diameter,depth:mp.depth,label:mp.preset+' '+(i+1),manual:true,index:i});
    else invalidManualMounts.push({...p,radius,kind:'mount',index:i});
  });
  if(mp.enabled&&!mountManual){
    // Generate paired mount candidates. Search across footprint and rotate
    // away from LED holes; NEVER silently drill overlapping holes.
    const halfRequested=max(5,Number(s.mountSpacing||s.width*.28)/2);
    const scales=[1,.85,.7,.55,.45];
    let pair=null;
    for(const factor of scales){
      if(pair)break;
      for(let angleStep=0;angleStep<24;angleStep++){
        const angle=TAU*angleStep/24,step=halfRequested*factor;
        const candidate=[{x:cx+Math.cos(angle)*step,z:cz+Math.sin(angle)*step},
                         {x:cx-Math.cos(angle)*step,z:cz-Math.sin(angle)*step}];
        if(candidate.every(p=>validHole(p,mp.diameter/2,sockets))&&
           dist(candidate[0],candidate[1])>=mp.diameter+clearance){
           pair=candidate;break;
        }
      }
    }
    if(pair)pair.forEach((p,i)=>mounts.push({...p,kind:'mount',radius:mp.diameter/2,diameter:mp.diameter,depth:mp.depth,label:mp.preset+' '+(i+1)}));
    else messages.push('Two '+mp.preset+' mounting holes could not be placed without intersecting LED sockets or the base edge. No mounting holes were cut. Reduce LED quantity, clearance, or mounting-hole size and prepare again.');
  }
  if(invalidManualPixels.length)messages.push(invalidManualPixels.length+' manual pixel hole(s) are outside the base or collide with another hole. These are NOT exported.');
  if(invalidManualMounts.length)messages.push(invalidManualMounts.length+' manual mounting hole(s) are outside the base or collide with another hole. These are NOT exported.');
  const skippedPixels=max(0,pixelRequested-sockets.length);
  if(skippedPixels)messages.push(skippedPixels+' of '+pixelRequested+' pixel sockets could not fit without crossing another hole or the root perimeter.');
  const collisions=[];
  const allHoles=[...sockets,...mounts];
  for(let i=0;i<allHoles.length;i++)for(let j=i+1;j<allHoles.length;j++){
    if(dist(allHoles[i],allHoles[j])<allHoles[i].radius+allHoles[j].radius+clearance-1e-5)
      collisions.push([i,j]);
  }
  const edgePlan=mp.preset==='Edge fixing tabs'?
   planEdgeTabs(polygon,s,[...sockets,...mounts],clearance):
   {tabs:[],tabHoles:[],requested:0,holesEach:0,skipped:0,messages:[]};
  messages.push(...edgePlan.messages);
  const requestedMounts=mp.preset==='Edge fixing tabs'?
   edgePlan.requested*edgePlan.holesEach:
   mp.enabled&&mountManual?min(20,manualMounts.length):mp.requested;
  return {sockets,mounts,polygon,collisions,messages,clearance,
    invalidManualPixels,invalidManualMounts,
    tabs:edgePlan.tabs,tabHoles:edgePlan.tabHoles,skippedTabs:edgePlan.skipped,
    requestedTabs:edgePlan.requested,
    requestedPixels:pixelRequested,skippedPixels,requestedMounts,
    skippedMounts:requestedMounts-mounts.length-edgePlan.tabHoles.length,mounting:mp};
}
