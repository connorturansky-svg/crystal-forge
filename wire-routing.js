/* Underside wiring (PR5): deterministic open-bottom channels, never a
 * promise of LED fitting, protected wiring or light-path connectivity.
 */
import {baseSurfaceHeight} from './geometry-v3.js';
const limit=(n,a,b)=>Math.max(a,Math.min(b,n));
const dist=(p,q)=>Math.hypot(p.x-q.x,p.z-q.z);
const nearest=(p,a,b)=>{
 const dx=b.x-a.x,dz=b.z-a.z,t=limit(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);
 return {x:a.x+dx*t,z:a.z+dz*t};
};
const inside=(p,poly)=>{
 let result=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if(((a.z>p.z)!==(b.z>p.z))&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)result=!result;
 }
 return result;
};
export function planWireRoutes(crystals,s,hardware){
 const plan={enabled:!!s.wireChannels,routes:[],lengthMm:0,unrouted:0,exitAdded:false,messages:[]};
 if(!plan.enabled)return plan;
 const sockets=hardware.sockets||[],poly=hardware.polygon||[];
 if(!s.cutSockets||s.baseType==='none'||poly.length<3||s.baseVault||s.hollowCrystals){
  plan.messages.push('Wiring grooves require an integrated solid base and cut LED sockets; disable vault and experimental full hollowing for this route mode.');return plan;
 }
 if(!sockets.length){plan.messages.push('No accepted sockets for wiring.');return plan}
 const width=limit(Number(s.wireWidth)||3,1.5,9),depth=limit(Number(s.wireDepth)||2,.8,5),
  slack=limit(Number(s.wireSlack)||0,0,30);
 const obstacles=[...(hardware.mounts||[]),...(hardware.tabHoles||[])];
 const valid=(a,b,toEdge=false)=>{
  const length=dist(a,b);if(length<.1)return false;
  for(const h of obstacles){
   const q=nearest(h,a,b);
   if(dist(h,q)<(h.radius||0)+width/2+1.5)return false;
  }
  const steps=Math.max(2,Math.ceil(length/6));
  for(let i=0;i<=steps;i++){
   if(toEdge&&i===steps)continue;
   const t=i/steps,p={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};
   if(!inside(p,poly))return false;
   // Guard 1.6 mm upper roof over the full depth of the underside groove.
   if(baseSurfaceHeight(crystals,s,p.x,p.z)<depth+1.6)return false;
  }
  return true;
 };
 const path=(a,b)=>{
  const length=dist(a,b);
  if(slack>0&&length>8){
   const off=length*.5*Math.sqrt(Math.pow(1+slack/100,2)-1);
   const dx=-(b.z-a.z)/length,dz=(b.x-a.x)/length;
   for(const sign of [1,-1]){
    const mid={x:(a.x+b.x)/2+dx*off*sign,z:(a.z+b.z)/2+dz*off*sign};
    if(valid(a,mid)&&valid(mid,b))return [a,mid,b];
   }
  }
  return valid(a,b)?[a,b]:null;
 };
 const add=(points,kind,from,to)=>{
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],length=dist(a,b);
   plan.routes.push({a:{x:a.x,z:a.z},b:{x:b.x,z:b.z},width,depth,kind,from,to,lengthMm:length});
   plan.lengthMm+=length;
  }
 };
 const joined=new Set([0]),pending=new Set(sockets.map((_,i)=>i).slice(1));
 while(pending.size){
  const options=[];
  for(const i of pending)for(const j of joined)options.push({i,j,d:dist(sockets[i],sockets[j])});
  options.sort((a,b)=>a.d-b.d||a.i-b.i||a.j-b.j);
  let match=null;
  for(const option of options){
   const points=path(sockets[option.i],sockets[option.j]);
   if(points){match={...option,points};break}
  }
  if(!match)break;
  add(match.points,'link',match.i,match.j);pending.delete(match.i);joined.add(match.i);
 }
 plan.unrouted=pending.size;
 if(plan.unrouted)plan.messages.push(plan.unrouted+' LED socket(s) could not connect without crossing mounting hardware, thin walls or the edge.');
 if(s.wireExit){
  const p=sockets[0],choices=poly.map((a,i)=>nearest(p,a,poly[(i+1)%poly.length]))
   .sort((a,b)=>dist(p,a)-dist(p,b));
  for(const edge of choices)if(valid(p,edge,true)){add([p,edge],'exit',0,null);plan.exitAdded=true;break}
  if(!plan.exitAdded)plan.messages.push('No safe perimeter exit; allow a separate cable exit in the physical assembly.');
 }
 return plan;
}
