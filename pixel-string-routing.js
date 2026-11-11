/* PR9: an LED pixel string uses one physical cable bundle at each opposed
 * IN/OUT port, NOT two parallel electrical conductors or two adjacent lanes.
 * Order is the authoritative hardware.sockets array; incomplete geometry is
 * never presented as a printable, connected string.
 */
import {baseSurfaceHeight} from './geometry-v3.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const gap=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z);
const cross=(a,b)=>a.x*b.z-a.z*b.x;
const sub=(a,b)=>({x:a.x-b.x,z:a.z-b.z});
const nearest=(p,a,b)=>{
 const v=sub(b,a),t=clamp(((p.x-a.x)*v.x+(p.z-a.z)*v.z)/(v.x*v.x+v.z*v.z||1),0,1);
 return {x:a.x+t*v.x,z:a.z+t*v.z};
};
const inside=(p,poly)=>{
 let result=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)result=!result;
 }
 return result;
};
export function pixelStringPort(pixel,kind){
 const angle=(Number(pixel.wireAngle)||0)*Math.PI/180;
 const axis={x:Math.cos(angle),z:Math.sin(angle)};
 // Origin stays inside the cutter's socket volume to avoid a solid lip
 // between the open-bottom cable groove and the fitted LED cavity.
 const r=Math.max(.7,Number(pixel.radius||3)-Math.min(1.1,Number(pixel.radius||3)*.22));
 const sign=kind==='input'?-1:1;
 return {x:pixel.x+sign*axis.x*r,z:pixel.z+sign*axis.z*r};
}
const dir=(p,kind)=>{
 const a=(Number(p.wireAngle)||0)*Math.PI/180,sign=kind==='input'?-1:1;
 return {x:Math.cos(a)*sign,z:Math.sin(a)*sign};
};
function edgeOptions(port,direction,poly,manual){
 if(manual&&Number.isFinite(manual.x)&&Number.isFinite(manual.z)){
  const projected=poly.map((a,i)=>nearest(manual,a,poly[(i+1)%poly.length]))
   .sort((a,b)=>gap(manual,a)-gap(manual,b));
  return projected.slice(0,1);
 }
 const hits=[];
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],edge=sub(b,a),ap=sub(a,port),den=cross(direction,edge);
  if(Math.abs(den)<1e-9)continue;
  const t=cross(ap,edge)/den,u=cross(ap,direction)/den;
  if(t>0&&u>=0&&u<=1)hits.push({point:{x:port.x+t*direction.x,z:port.z+t*direction.z},score:-1000+t});
 }
 const base=poly.map((a,i)=>nearest(port,a,poly[(i+1)%poly.length])).map(p=>{
  const v=sub(p,port);
  return {point:p,score:gap(port,p)-35*((v.x*direction.x+v.z*direction.z)/(gap(port,p)||1))};
 });
 return [...hits,...base].sort((a,b)=>a.score-b.score)
  .map(v=>v.point).filter((p,i,all)=>all.findIndex(q=>gap(p,q)<.3)===i);
}
export function planPixelStringRoutes(crystals,s,hardware){
 const plan={enabled:!!s.wireChannels,mode:'string',lanes:1,routes:[],connections:[],
  lengthMm:0,unrouted:0,entryAdded:false,exitAdded:false,ready:false,messages:[]};
 if(!plan.enabled)return plan;
 const pixels=hardware.sockets||[],poly=hardware.polygon||[];
 if(!s.cutSockets||s.baseType==='none'||poly.length<3||s.baseVault||s.hollowCrystals){
  plan.messages.push('Serial cable channels require a solid integrated base with accepted pixel holes; vault and balloon modes cannot be combined.');return plan;
 }
 if(!pixels.length){plan.messages.push('No accepted pixel sockets; add a pixel before routing.');return plan}
 if(hardware.skippedPixels>0||hardware.invalidManualPixels?.length){
  plan.messages.push('At least one requested pixel is invalid: fix its location before trusting the serial wire order.');return plan;
 }
 const width=clamp(Number(s.wireWidth)||3,1.5,9),depth=clamp(Number(s.wireDepth)||2,.8,5),
  slack=clamp(Number(s.wireSlack)||0,0,30);
 const mounts=[...(hardware.mounts||[]),...(hardware.tabHoles||[]),...(hardware.tabs||[])];
 const clear=(a,b,edge=false,source=null,dest=null)=>{
  const length=gap(a,b);
  if(length<.18)return false;
  for(const obstacle of mounts)
   if(gap(nearest(obstacle,a,b),obstacle)<(Number(obstacle.radius)||0)+width/2+1.2)return false;
  for(const pixel of pixels){
   if(pixel===source||pixel===dest)continue;
   if(gap(nearest(pixel,a,b),pixel)<(Number(pixel.radius)||0)+width/2+1.2)return false;
  }
  const steps=Math.max(8,Math.ceil(length/3));
  for(let i=0;i<=steps;i++){
   if(edge&&i>=steps-1)continue;
   const t=i/steps,p={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};
   if(!inside(p,poly))return false;
   if(baseSurfaceHeight(crystals,s,p.x,p.z)<depth+1.5)return false;
  }
  return true;
 };
 const connect=(a,b,edge=false,source=null,dest=null)=>{
  if(clear(a,b,edge,source,dest))return [a,b];
  const length=gap(a,b),normal={x:-(b.z-a.z)/(length||1),z:(b.x-a.x)/(length||1)};
  const center={x:(a.x+b.x)/2,z:(a.z+b.z)/2};
  for(const offset of [Math.max(width*2,7),Math.max(width*4,15),Math.max(width*6,24)]){
   for(const sign of [-1,1]){
    const elbow={x:center.x+sign*offset*normal.x,z:center.z+sign*offset*normal.z};
    if(clear(a,elbow,false,source,dest)&&clear(elbow,b,edge,source,dest))return [a,elbow,b];
   }
  }
  return null;
 };
 const staged=[];
 const stage=(kind,indexA,indexB,points,source=null,dest=null)=>{
  if(!points)return false;
  if(slack&&points.length===2&&gap(points[0],points[1])>15){
   const [a,b]=points,length=gap(a,b),normal={x:-(b.z-a.z)/length,z:(b.x-a.x)/length};
   const bump=length*.5*Math.sqrt((1+slack/100)**2-1);
   const mid={x:(a.x+b.x)/2+normal.x*bump,z:(a.z+b.z)/2+normal.z*bump};
   if(clear(a,mid,false,source,dest)&&clear(mid,b,kind!=='link',source,dest))points=[a,mid,b];
  }
  const segments=[];
  for(let i=1;i<points.length;i++)segments.push({a:points[i-1],b:points[i],width,depth,kind,
   lane:1,from:indexA,to:indexB,fromId:indexA==null?'EDGE_IN':pixels[indexA].id,
   toId:indexB==null?'EDGE_OUT':pixels[indexB].id,lengthMm:gap(points[i-1],points[i])});
  staged.push(...segments);
  plan.connections.push({kind,from:indexA,to:indexB,
   fromId:indexA==null?'EDGE_IN':pixels[indexA].id,
   toId:indexB==null?'EDGE_OUT':pixels[indexB].id,segments:segments.length});
  return true;
 };
 const edgeRoute=(kind,pixel,index)=>{
  const input=kind==='input',port=pixelStringPort(pixel,kind),direction=dir(pixel,kind);
  const raw=input?{x:Number(s.wireEntryX),z:Number(s.wireEntryZ)}:
   {x:Number(s.wireOutputX),z:Number(s.wireOutputZ)};
  const hasManual=input?
   s.wireEntryX!==undefined&&s.wireEntryZ!==undefined:
   s.wireOutputX!==undefined&&s.wireOutputZ!==undefined;
  const choices=edgeOptions(port,direction,poly,hasManual?raw:null);
  for(const point of choices){
   if(!input&&plan.entryAdded&&gap(point,plan.entryPoint)<Math.max(width*2+3,10))continue;
   const length=gap(port,point),dx=(point.x-port.x)/(length||1),dz=(point.z-port.z)/(length||1);
   const beyond={x:point.x+dx*(width+3),z:point.z+dz*(width+3)};
   const path=input?connect(port,point,true,pixel,null):connect(port,point,true,pixel,null);
   if(!path)continue;
   if(mounts.some(o=>gap(nearest(o,point,beyond),o)<(Number(o.radius)||0)+width/2+1.2))continue;
   // Routes must overlap the bored socket and extend beyond the actual rim.
   const full=input?[beyond,...path.slice().reverse()]:[...path,beyond];
   if(!stage(kind,input?null:index,input?index:null,full,pixel,null))continue;
   if(input){plan.entryAdded=true;plan.entryPoint=point}
   else{plan.exitAdded=true;plan.exitPoint=point}
   return true;
  }
  return false;
 };
 if(!edgeRoute('input',pixels[0],0))
  plan.messages.push('P1 IN: no safe cable entry to the base edge; adjust the pixel angle, edge position, mount or base clearance.');
 for(let i=0;i<pixels.length-1;i++){
  const a=pixels[i],b=pixels[i+1];
  if(!stage('link',i,i+1,connect(pixelStringPort(a,'output'),pixelStringPort(b,'input'),false,a,b),a,b))
   plan.messages.push('P'+(i+1)+' OUT → P'+(i+2)+' IN has no safe groove (mounts, roof or base boundary obstruct the route).');
 }
 if(!edgeRoute('output',pixels.at(-1),pixels.length-1))
  plan.messages.push('P'+pixels.length+' OUT: no safe cable exit to the base edge; the final pixel needs its own outgoing cable tail.');
 plan.unrouted=(pixels.length+1)-plan.connections.length;
 if(plan.unrouted){
  // Do not cut a misleading disconnected subset into the manufactured object.
  plan.messages.push('String incomplete: no wiring grooves will be cut until all '+(pixels.length+1)+' logical cable connections are valid.');
  plan.connections=[];plan.entryAdded=false;plan.exitAdded=false;
  return plan;
 }
 plan.routes=staged;
 plan.lengthMm=staged.reduce((sum,r)=>sum+r.lengthMm,0);
 plan.ready=true;
 plan.messages.push('Connected ordered physical cable path: edge IN → P1 … P'+pixels.length+' → edge OUT. Do not connect ends electrically without a designed circuit.');
 return plan;
}
