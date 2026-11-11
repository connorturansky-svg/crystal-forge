/* Actual underside open-bottom route plan. All obstacles include full fixing-tab
 * discs, not only their bolt holes. Parallel wires share a direction/exit centre
 * but have independent printable tracks and explicit lane numbers.
 */
import {baseSurfaceHeight} from './geometry-v3.js';
import {nearestEdgePosition} from './edge-tabs.js';
const limit=(n,a,b)=>Math.max(a,Math.min(b,n));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const closest=(p,a,b)=>{
 const dx=b.x-a.x,dz=b.z-a.z,t=limit(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);
 return {x:a.x+dx*t,z:a.z+dz*t};
};
const inside=(p,poly)=>{
 let ok=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if(((a.z>p.z)!==(b.z>p.z))&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)ok=!ok;
 }
 return ok;
};
const rotatedOffset=(pixel,side,pitch,heading)=>{
 const rad=Number.isFinite(Number(pixel?.wireAngle))?Number(pixel.wireAngle)*Math.PI/180:heading;
 return {x:-Math.sin(rad)*side*pitch/2,z:Math.cos(rad)*side*pitch/2};
};
export function planWireRoutes(crystals,s,hardware){
 const plan={enabled:!!s.wireChannels,routes:[],lengthMm:0,unrouted:0,exitAdded:false,messages:[],lanes:s.wireMode==='parallel'?2:1};
 if(!plan.enabled)return plan;
 const sockets=hardware.sockets||[],poly=hardware.polygon||[];
 if(!s.cutSockets||s.baseType==='none'||poly.length<3||s.baseVault||s.hollowCrystals){
  plan.messages.push('Wire grooves require a solid integrated base, accepted LED sockets, no vault/whole-shell hollowing.');return plan;
 }
 if(!sockets.length){plan.messages.push('No accepted LED socket to route from.');return plan}
 const width=limit(Number(s.wireWidth)||3,1.5,9),depth=limit(Number(s.wireDepth)||2,.8,5),
  slack=limit(Number(s.wireSlack)||0,0,30);
 const lanes=plan.lanes,pitch=Math.max(width+1.5,limit(Number(s.wirePairSpacing)||7,3,22));
 const obstacles=[...(hardware.mounts||[]),...(hardware.tabHoles||[]),...(hardware.tabs||[])];
 const clearSegment=(a,b,edge=false,source=null,dest=null)=>{
  const d=dist(a,b);if(d<.15)return false;
  for(const o of obstacles){
   const q=closest(o,a,b),radius=Number(o.radius)||0;
   // Full tab disc is reserved, including the tab material outside the edge.
   if(dist(q,o)<radius+width/2+1.2)return false;
  }
  for(const o of sockets){
   if(o===source||o===dest)continue;
   if(dist(closest(o,a,b),o)<o.radius+width/2+1.2)return false;
  }
  const steps=Math.max(3,Math.ceil(d/4));
  for(let i=0;i<=steps;i++){
   if(edge&&i>=steps-2)continue;
   const t=i/steps,p={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};
   if(!inside(p,poly))return false;
   if(baseSurfaceHeight(crystals,s,p.x,p.z)<depth+1.6)return false;
  }
  return true;
 };
 const candidate=(a,b,edge,source,dest)=>{
  if(clearSegment(a,b,edge,source,dest))return [a,b];
  const length=dist(a,b),norm={x:-(b.z-a.z)/(length||1),z:(b.x-a.x)/(length||1)};
  const mid={x:(a.x+b.x)/2,z:(a.z+b.z)/2};
  for(const deviation of [Math.max(width*2,8),Math.max(width*4,16),Math.max(width*6,24)]){
   for(const sign of [1,-1]){
    const bend={x:mid.x+sign*deviation*norm.x,z:mid.z+sign*deviation*norm.z};
    if(clearSegment(a,bend,false,source,dest)&&clearSegment(bend,b,edge,source,dest))return [a,bend,b];
   }
  }
  return null;
 };
 const route=(from,to,kind,fromIndex,toIndex,edge=false)=>{
  const heading=Math.atan2(to.z-from.z,to.x-from.x)-Math.PI/2;
  const segments=[];
  for(let lane=0;lane<lanes;lane++){
   const sign=lanes===1?0:(lane===0?-1:1);
   const first=rotatedOffset(from,sign,pitch,heading);
   const end=rotatedOffset(kind==='exit'?from:to,sign,pitch,heading);
   const a={x:from.x+first.x,z:from.z+first.z},b={x:to.x+end.x,z:to.z+end.z};
   const points=candidate(a,b,edge,from,kind==='exit'?null:to);
   if(!points)return false;
   if(slack>0&&points.length===2&&dist(a,b)>10){
    const d=dist(a,b),n={x:-(b.z-a.z)/d,z:(b.x-a.x)/d},
     offset=d*.5*Math.sqrt(Math.pow(1+slack/100,2)-1),
     mid={x:(a.x+b.x)/2+n.x*offset,z:(a.z+b.z)/2+n.z*offset};
    if(clearSegment(a,mid,false,from,to)&&clearSegment(mid,b,edge,from,to))points.splice(1,0,mid);
   }
   segments.push({lane:lane+1,points});
  }
  for(const {lane,points} of segments)for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],length=dist(a,b);
   plan.routes.push({a,b,width,depth,kind,from:fromIndex,to:toIndex,lane,lengthMm:length});
   plan.lengthMm+=length;
  }
  return true;
 };
 const connected=new Set([0]),pending=new Set(sockets.map((_,i)=>i).slice(1));
 while(pending.size){
  const options=[];
  for(const i of pending)for(const j of connected)options.push({i,j,d:dist(sockets[i],sockets[j])});
  options.sort((a,b)=>a.d-b.d||a.i-b.i||a.j-b.j);
  let success=false;
  for(const o of options){
   if(route(sockets[o.i],sockets[o.j],'link',o.i,o.j)){
    pending.delete(o.i);connected.add(o.i);success=true;break;
   }
  }
  if(!success)break;
 }
 plan.unrouted=pending.size;
 if(plan.unrouted)plan.messages.push(plan.unrouted+' LED(s) lack safe paired wiring routes; move tabs, change wire angle or reduce dimensions.');
 if(s.wireExit){
  const source=sockets[0];
  const custom=source.wireEndX!==undefined&&source.wireEndZ!==undefined&&Number.isFinite(Number(source.wireEndX))&&Number.isFinite(Number(source.wireEndZ));
  const choices=custom?[nearestEdgePosition(poly,{x:Number(source.wireEndX),z:Number(source.wireEndZ)})]:
   poly.map((a,i)=>closest(source,a,poly[(i+1)%poly.length]))
    .sort((a,b)=>dist(source,a)-dist(source,b));
  for(const point of choices){
   // Extend beyond the exterior enough that groove is genuinely open to air.
   const dx=point.x-source.x,dz=point.z-source.z,len=Math.hypot(dx,dz)||1;
   const end={x:point.x+dx/len*(width+2),z:point.z+dz/len*(width+2)};
   // Plan against the boundary, then let fabrication extend segment outward.
   const countBefore=plan.routes.length;
   if(route(source,point,'exit',0,null,true)){
    for(const piece of plan.routes.slice(countBefore))if(piece.kind==='exit'){
     // The last segment of each lane reaches beyond the edge.
     const next=plan.routes.slice(countBefore).filter(p=>p.lane===piece.lane);
     if(next.at(-1)===piece){
      piece.lengthMm+=dist(piece.b,end);plan.lengthMm+=dist(piece.b,end);
      piece.b={x:end.x+(piece.b.x-point.x),z:end.z+(piece.b.z-point.z)};
     }
    }
    plan.exitAdded=true;break;
   }
  }
  if(!plan.exitAdded)plan.messages.push('No safe two-wire exit, or requested exit crosses a tab. Rotate the LED, move the tab or choose a different edge exit.');
 }else if(sockets.length===1)plan.messages.push('One LED has no route without enabling cable exit.');
 return plan;
}
