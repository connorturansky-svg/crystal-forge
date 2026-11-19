import {pixelStringAxis,pixelStringPort,sampleCableCurve} from './pixel-string-routing.js';

const radius=1.6,depth=1.8,roof=2;
const add=(p,d,t)=>({x:p.x+d.x*t,z:p.z+d.z*t});
const sub=(a,b)=>({x:a.x-b.x,z:a.z-b.z});
const cross=(a,b)=>a.x*b.z-a.z*b.x;
const dot=(a,b)=>a.x*b.x+a.z*b.z;
const length=v=>Math.hypot(v.x,v.z);
const gap=(a,b)=>length(sub(a,b));
const unit=v=>add({x:0,z:0},v,1/(length(v)||1));
const distance=(p,a,b)=>{
 const d=sub(b,a),t=Math.max(0,Math.min(1,dot(sub(p,a),d)/(dot(d,d)||1)));
 return gap(p,add(a,d,t));
};
function boundary(point,outline){
 let inside=false,clearance=Infinity;
 for(let i=0,j=outline.length-1;i<outline.length;j=i++){
  const a=outline[j],b=outline[i];
  if((a.z>point.z)!==(b.z>point.z)&&point.x<(b.x-a.x)*(point.z-a.z)/(b.z-a.z)+a.x)inside=!inside;
  clearance=Math.min(clearance,distance(point,a,b));
 }
 return inside?clearance:-clearance;
}
function exitAlong(port,direction,outline){
 let first=null;
 for(let i=0;i<outline.length;i++){
  const a=outline[i],edge=sub(outline[(i+1)%outline.length],a),den=cross(direction,edge);
  if(Math.abs(den)<1e-8)continue;
  const v=sub(a,port),t=cross(v,edge)/den,u=cross(v,direction)/den;
  if(t>0&&u>=0&&u<=1&&(!first||t<first.t))first={t,incidence:Math.abs(cross(direction,unit(edge)))};
 }
 if(!first||first.incidence<.6)return null;
 return add(port,direction,first.t);
}
function samples(points){
 const result=[points[0]];
 for(let i=1;i<points.length;i++){
  const a=points[i-1],d=sub(points[i],a),n=Math.ceil(length(d)/.5);
  for(let j=1;j<=n;j++)result.push(add(a,d,j/n));
 }
 return result;
}
function cutter(points,label){
 const side=sign=>points.map((p,i)=>{
  const a=unit(sub(p,points[i-1]||p)),b=unit(sub(points[i+1]||p,p));
  const d=unit(add(a,b,1)),q={x:-d.z,z:d.x};
  const scale=radius/Math.max(.9,dot(d,i===0?b:a));
  const v=add(p,q,sign*scale);return [v.x,v.z];
 });
 return {kind:'extrude',outline:[...side(1),...side(-1).reverse()],height:depth+.5,position:[0,-.5,0],wireChannel:label};
}

export function nativeRouteEligibility(recipe,build){
 if(!recipe.serialSupport)return recipe.serialReason||'Enable fitting backing to check this model for serial routing.';
 if(recipe.dualMaterial)return 'Use a single material for native serial routing.';
 if(recipe.serialSupport.thickness<depth+roof)return 'Routing needs at least 3.8 mm of solid backing for the groove and roof.';
 const blocksBacking=part=>part.kind!=='box'||part.rotation||!Array.isArray(part.position)||
  part.position[1]+part.size[1]/2>0;
 const obstructed=recipe.serialSupport.explicitBacking?recipe.negative.some(blocksBacking):recipe.negative.length>0;
 if(obstructed||build.mounting||build.base||Object.values(build.partOffsets||{}).some(offset=>offset?.some?.(value=>value!==0)))
  return 'Existing cavities, mounting cuts, added bases or part offsets prevent safe routing.';
 return '';
}

export function planNativePixelString(recipe,build){
 const settings=build.serialRouting;
 const plan={enabled:settings?.enabled===true,ready:false,links:[],cutters:[],reason:nativeRouteEligibility(recipe,build)};
 if(!plan.enabled)return plan;
 if(settings.version!==1){plan.reason='This serial route version is unsupported. Turn routing off to prepare bores only.';return plan;}
 if(plan.reason)return plan;
 const holes=build.pixelHoles||[],pitch=Number(settings.pitch),inTail=Number(settings.inTail??settings.tail??200),outTail=Number(settings.outTail??settings.tail??200);
 if(![pitch,inTail,outTail].every(value=>Number.isFinite(value)&&value>=5&&value<=250)){
  plan.reason='Enter a cable pitch and tail budget between 5 and 250 mm.';return plan;
 }
 if(!holes.length||holes.length>16||holes.some(p=>!p.checked||!p.id||![p.x,p.z,p.diameter,p.clearance,p.rotation??0].every(Number.isFinite))||
  new Set(holes.map(p=>p.id)).size!==holes.length){
  plan.reason='Place 1 to 16 checked pixel fittings in Build before routing.';return plan;
 }
 const pixels=holes.map(p=>({...p,radius:(p.diameter+p.clearance)/2,wireAngle:p.rotation??0}));
 const outline=recipe.serialSupport.outline.map(([x,z])=>({x,z}));
 const undersized=pixels.findIndex(p=>p.radius<2.1);
 if(undersized>=0){
  plan.reason='P'+(undersized+1)+' needs a bore diameter of at least 4.2 mm for serial routing.';return plan;
 }
 const nearEdge=pixels.findIndex(p=>boundary(p,outline)<p.radius+1.9);
 if(nearEdge>=0){
  plan.reason='P'+(nearEdge+1)+' is too close to the backing edge. Move the fitting inward to clear its cable ports.';return plan;
 }
 const addLink=(label,path,ends,budget,edge=null,centreAllowance=0)=>{
  if(!path){plan.links.push({label,path:[],reason:'No safe tangent-compatible path.'});return;}
  const measure=path.slice(1).reduce((sum,p,i)=>sum+gap(path[i],p),centreAllowance);
  const dense=samples(path);
  const invalid=dense.some(point=>{
   if(boundary(point,outline)<radius+.55&&(!edge||gap(point,edge)>4))return true;
   return pixels.some(p=>!ends.includes(p.id)&&gap(point,p)<p.radius+radius+1.25);
  });
  let reason=invalid?'Channel approaches an edge or unrelated bore.':measure>budget+1e-6?'Cable budget exceeded.':'';
  if(!reason&&plan.links.some(other=>{
   const shared=pixels.filter(p=>ends.includes(p.id)&&other.ends?.includes(p.id));
   return other.dense?.some(q=>dense.some(p=>gap(p,q)<2*radius+.5&&!shared.some(b=>gap(p,b)<b.radius&&gap(q,b)<b.radius)));
  }))
   reason='Channels cross or leave insufficient web between them.';
  plan.links.push({label,path,measure,budget,reason,dense,ends});
 };
 const start=pixels[0],end=pixels.at(-1),inPort=pixelStringPort(start,'input'),outPort=pixelStringPort(end,'output');
 const inAxis=pixelStringAxis(start),outAxis=pixelStringAxis(end);
 const outside=(edge,axis)=>edge&&[.5,1,1.5,2,2.5,3,3.5,4].every(step=>boundary(add(edge,axis,step),outline)<0)?edge:null;
 const outward={x:-inAxis.x,z:-inAxis.z};
 const entry=outside(exitAlong(inPort,outward,outline),outward),exit=outside(exitAlong(outPort,outAxis,outline),outAxis);
 addLink('EDGE IN → P1',entry?[entry,inPort]:null,[start.id],inTail,entry);
 for(let i=0;i<pixels.length-1;i++){
  const a=pixels[i],b=pixels[i+1],p=pixelStringPort(a,'output'),q=pixelStringPort(b,'input');
  const forward=unit(sub(q,p)),from=pixelStringAxis(a),to=pixelStringAxis(b);
  const curve=dot(from,forward)>.65&&dot(to,forward)>.65?sampleCableCurve(p,q,from,to):null;
  // Include the in-bore distance at each end for physical centre-to-centre pitch.
  addLink('P'+(i+1)+' → P'+(i+2),curve,[a.id,b.id],pitch,null,gap(a,p)+gap(b,q));
 }
 addLink('P'+pixels.length+' → EDGE OUT',exit?[outPort,exit]:null,[end.id],outTail,exit);
 if(entry&&exit&&gap(entry,exit)<6)plan.links.at(-1).reason='Use distinct perimeter exits at least 6 mm apart.';
 plan.reason=plan.links.filter(link=>link.reason).map(link=>link.label+': '+link.reason).join(' ');
 plan.ready=!plan.reason;
 if(plan.ready)plan.cutters=plan.links.map((link,i)=>{
  const points=link.path.slice();
  if(i===0)points.unshift(add(entry,inAxis,-4));
  if(i===plan.links.length-1)points.push(add(exit,outAxis,4));
  return cutter(points,link.label);
 });
 for(const link of plan.links){delete link.dense;delete link.ends;}
 return plan;
}
