/* Ordered, manufacturable pixel-string cable-bundle paths. Each pixel has
 * exactly two opposite ports. Piecewise sampled cubic curves are authoritative
 * for the 3D guide, length audit, CSV and real Manifold subtractors.
 * Unsafe or over-length strings cannot produce a partly-cut STL.
 */
import {baseSurfaceHeight} from './geometry-v3.js';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const unit=(a,b)=>{const d=gap(a,b)||1;return {x:(b.x-a.x)/d,z:(b.z-a.z)/d}};
const plus=(p,v,d)=>({x:p.x+v.x*d,z:p.z+v.z*d});
const dot=(a,b)=>a.x*b.x+a.z*b.z;
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
const closest=(p,a,b)=>{const v={x:b.x-a.x,z:b.z-a.z},t=clamp(((p.x-a.x)*v.x+(p.z-a.z)*v.z)/(v.x*v.x+v.z*v.z||1),0,1);return plus(a,v,t)};
const inside=(p,poly)=>{
 let yes=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)yes=!yes;
 }
 return yes;
};
export function pixelStringAxis(pixel){
 const a=(Number(pixel.wireAngle)||0)*Math.PI/180;
 return {x:Math.cos(a),z:Math.sin(a)};
}
export function pixelStringPort(pixel,kind){
 const axis=pixelStringAxis(pixel),r=Math.max(.7,Number(pixel.radius||3)-Math.min(1.1,Number(pixel.radius||3)*.22));
 return plus(pixel,axis,(kind==='input'?-1:1)*r);
}
const axisOut=p=>pixelStringAxis(p);
const axisIn=p=>{const a=pixelStringAxis(p);return {x:-a.x,z:-a.z}};
const bezier=(a,b,c,d,t)=>{
 const u=1-t;
 return {x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,
         z:u*u*u*a.z+3*u*u*t*b.z+3*u*t*t*c.z+t*t*t*d.z};
};
// Tests and previews can inspect this identical sampled curve without Three.js.
export function sampleCableCurve(start,end,startDirection,endDirection,{minBendRadius=5,slack=0}={}){
 const length=gap(start,end);
 if(length<1)return null;
 const forward=unit(start,end),R=clamp(Number(minBendRadius)||5,1,60);
 const lead=clamp(Math.min(R*.55,length*.16),.6,Math.min(6,length*.16));
 const a=plus(start,startDirection,lead),d=plus(end,endDirection,-lead);
 const chord=gap(a,d);
 if(chord<.5)return null;
 const dir=unit(a,d);
 if(dot(startDirection,dir)>.9999&&dot(endDirection,dir)>.9999&&slack===0)
  return [start,end];
 const handle=Math.max(R*.65,chord*(.34+clamp(Number(slack)||0,0,30)/160));
 const b=plus(a,startDirection,handle),c=plus(d,endDirection,-handle);
 const count=clamp(Math.ceil(chord/2.75),7,80);
 const points=[start,a];
 for(let i=1;i<count;i++)points.push(bezier(a,b,c,d,i/count));
 points.push(d,end);
 // Discrete curvature radius follows the actual extrusion centerline and
 // also rejects a sharp kink at the straight-to-spline transition.
 for(let i=1;i<points.length-1;i++){
  const u=unit(points[i-1],points[i]),v=unit(points[i],points[i+1]);
  const angle=Math.acos(clamp(dot(u,v),-1,1));
  if(angle<.0001)continue;
  const chordHalf=Math.min(gap(points[i-1],points[i]),gap(points[i],points[i+1]))*.5;
  const radius=chordHalf/Math.sin(angle/2);
  if(radius<R-.25)return null;
 }
 return points.filter((p,i,arr)=>i===0||gap(arr[i-1],p)>.0001);
}
const boundaryChoices=(port,poly,manual)=>{
 if(manual&&Number.isFinite(manual.x)&&Number.isFinite(manual.z)){
  return poly.map((a,i)=>closest(manual,a,poly[(i+1)%poly.length]))
   .sort((a,b)=>gap(a,manual)-gap(b,manual)).slice(0,1);
 }
 return poly.map((a,i)=>closest(port,a,poly[(i+1)%poly.length]))
  .sort((a,b)=>gap(a,port)-gap(b,port))
  .filter((a,i,arr)=>arr.findIndex(b=>gap(a,b)<.5)===i);
};
export function planPixelStringRoutes(crystals,s,hardware){
 const plan={enabled:!!s.wireChannels,mode:'string',lanes:1,routes:[],previewRoutes:[],connections:[],
  lengthMm:0,unrouted:0,entryAdded:false,exitAdded:false,ready:false,
  overLengthCount:0,spacingMm:clamp(Number(s.pixelStringSpacing)||50,5,1000),messages:[]};
 if(!plan.enabled)return plan;
 const pixels=hardware.sockets||[],poly=hardware.polygon||[];
 if(!s.cutSockets||s.baseType==='none'||poly.length<3||s.baseVault||s.hollowCrystals){
  plan.messages.push('Serial channels require a solid integrated base and valid pixel bores.');return plan;
 }
 if(!pixels.length){plan.messages.push('Add a pixel to create a string.');return plan}
 if(hardware.skippedPixels>0||hardware.invalidManualPixels?.length){
  plan.messages.push('Fix invalid or rejected pixels before manufacturing the string.');return plan;
 }
 const width=clamp(Number(s.wireWidth)||3,1.5,9),depth=clamp(Number(s.wireDepth)||2,.8,5),
  bend=clamp(Number(s.wireMinBendRadius)||5,1,60),slack=clamp(Number(s.wireSlack)||0,0,30);
 const mounts=[...(hardware.mounts||[]),...(hardware.tabHoles||[]),...(hardware.tabs||[])];
 const safe=(points,source=null,dest=null,edge=false)=>{
  if(!points||points.length<2)return false;
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],n=Math.max(2,Math.ceil(gap(a,b)/1.5));
   for(const o of mounts){
    if(gap(closest(o,a,b),o)<(Number(o.radius)||0)+width/2+1.2)return false;
   }
   for(const p of pixels){
    if(p===source||p===dest)continue;
    if(gap(closest(p,a,b),p)<(Number(p.radius)||0)+width/2+1.2)return false;
   }
   for(let j=0;j<=n;j++){
    if(edge&&((i===1&&j===0)||(i===points.length-1&&j===n)))continue;
    const p=mix(a,b,j/n);
    // First/last ~1 mm within the LED bore or exterior opening are allowed.
    if(edge&&((i===1&&j<=1)||(i===points.length-1&&j>=n-1)))continue;
    if(!inside(p,poly))return false;
    if(baseSurfaceHeight(crystals,s,p.x,p.z)<depth+1.5)return false;
   }
  }
  return true;
 };
 const all=[];
 const add=(kind,from,to,points,source,dest,allowedMm=null,centerExtra=0)=>{
  if(!safe(points,source,dest,kind!=='link'))return false;
  const length=points.slice(1).reduce((sum,p,i)=>sum+gap(points[i],p),0)+centerExtra;
  const over=Number.isFinite(allowedMm)&&length>allowedMm+.01;
  const connection={kind,from,to,fromId:from==null?'EDGE IN':pixels[from].id,
   toId:to==null?'EDGE OUT':pixels[to].id,lengthMm:length,allowedMm,
   remainingMm:Number.isFinite(allowedMm)?allowedMm-length:null,overLength:over,segments:points.length-1};
  plan.connections.push(connection);
  for(let i=1;i<points.length;i++)all.push({
   a:points[i-1],b:points[i],width,depth,kind,from,to,lane:1,lengthMm:gap(points[i-1],points[i]),
   fromId:connection.fromId,toId:connection.toId,overLength:over,curve:true
  });
  if(over){plan.overLengthCount++;plan.messages.push(
   (from==null?'Edge IN':'P'+(from+1))+' → '+(to==null?'Edge OUT':'P'+(to+1))+
   ': '+length.toFixed(1)+' mm required / '+allowedMm.toFixed(1)+' mm available — '+(length-allowedMm).toFixed(1)+' mm too long.');
  }
  return true;
 };
 const curve=(a,b,startDir,endDir,source,dest,edge=false)=>{
  // Slightly longer Bezier handles often clear obstacles and improve curvature.
  for(const extra of [0,8,16,26]){
   const points=sampleCableCurve(a,b,startDir,endDir,{minBendRadius:bend+extra*.08,slack:slack+extra});
   if(safe(points,source,dest,edge))return points;
  }
  return null;
 };
 const edgeRoute=(kind,index)=>{
  const input=kind==='input',p=pixels[index],port=pixelStringPort(p,kind);
  const heading=input?axisIn(p):axisOut(p);
  const manual=input?{x:Number(s.wireEntryX),z:Number(s.wireEntryZ)}:{x:Number(s.wireOutputX),z:Number(s.wireOutputZ)};
  const explicit=input?s.wireEntryX!==undefined&&s.wireEntryZ!==undefined:s.wireOutputX!==undefined&&s.wireOutputZ!==undefined;
  for(const end of boundaryChoices(port,poly,explicit?manual:null)){
   if(!input&&plan.entryPoint&&gap(end,plan.entryPoint)<Math.max(width*2+3,10))continue;
   const direction=unit(port,end),outside=plus(end,direction,width+3);
   const points=input?curve(port,end,heading,direction,p,null,true)?.slice().reverse():
    curve(port,end,heading,direction,p,null,true);
   if(!points)continue;
   const full=input?[outside,...points.slice(1)]:[...points,outside];
   const allowed=input?Number(s.wireInputTailLength)||null:Number(s.wireOutputTailLength)||null;
   if(!add(kind,input?null:index,input?index:null,full,p,null,allowed))continue;
   if(input){plan.entryAdded=true;plan.entryPoint=end}else{plan.exitAdded=true;plan.exitPoint=end}
   return true;
  }
  return false;
 };
 if(!edgeRoute('input',0))plan.messages.push('P1 IN: no safe tangent route to the perimeter.');
 for(let i=0;i<pixels.length-1;i++){
  const a=pixels[i],b=pixels[i+1],start=pixelStringPort(a,'output'),end=pixelStringPort(b,'input');
  const points=curve(start,end,axisOut(a),axisOut(b),a,b);
  const available=plan.spacingMm;
  if(!points||!add('link',i,i+1,points,a,b,available,
   gap(a,start)+gap(b,end)))
   plan.messages.push('P'+(i+1)+' → P'+(i+2)+': cable cannot meet tangent/bend, mounting or roof clearance constraints.');
 }
 if(!edgeRoute('output',pixels.length-1))plan.messages.push('P'+pixels.length+' OUT: no safe tangent route to the perimeter.');
 plan.unrouted=(pixels.length+1)-plan.connections.length;
 plan.previewRoutes=all; // show over-length runs in RED even when export is blocked
 plan.lengthMm=all.reduce((sum,r)=>sum+r.lengthMm,0);
 if(plan.unrouted||plan.overLengthCount){
  plan.messages.push('Manufacturing blocked: '+plan.unrouted+' unrouted connection(s), '+plan.overLengthCount+
    ' over-length cable run(s). Adjust rotations/spacing or positions before Prepare Print.');
  return plan;
 }
 plan.routes=all;plan.ready=true;
 plan.messages.push('Validated physical P1→P'+pixels.length+' cable-string path; verify your measured cable and real print.');
 return plan;
}
