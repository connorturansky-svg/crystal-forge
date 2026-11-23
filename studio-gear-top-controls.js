/* WT-026: editable top-mounted tactile components for the Gear family.
 * Pure ESM; geometry is Y-up, millimetres. The source model stays parametric.
 * Preview meshes MAY overlap. Only prepareRecipe's Boolean result is printable.
 */
export const GEAR_TOP_PRESETS=Object.freeze([
 {id:'offset-spindle',name:'Offset spinning handle',kind:'spindle',profile:'Bulbous 2/3',surface:'Smooth',width:14,depth:14,height:30,join:'Round',joinMm:2.5},
 {id:'straight-spindle',name:'Straight tapered handle',kind:'spindle',profile:'Straight taper',surface:'Vertical ribs',width:14,depth:14,height:28,join:'Chamfer',joinMm:2},
 {id:'hourglass',name:'Hourglass grip',kind:'spindle',profile:'Hourglass',surface:'Smooth',width:17,depth:17,height:30,join:'Round',joinMm:2},
 {id:'mushroom',name:'Mushroom handle',kind:'spindle',profile:'Mushroom',surface:'Smooth',width:24,depth:24,height:20,join:'Round',joinMm:2},
 {id:'rounded',name:'Rounded domed handle',kind:'spindle',profile:'Rounded cap',surface:'Smooth',width:18,depth:18,height:25,join:'Round',joinMm:2},
 {id:'fluted-knob',name:'Centred fluted knob',kind:'knob',profile:'Flat',surface:'Vertical ribs',width:36,depth:36,height:15,join:'Round',joinMm:2},
 {id:'scalloped-dial',name:'Scalloped turning dial',kind:'knob',profile:'Rounded cap',surface:'Scalloped',width:42,depth:42,height:16,join:'Chamfer',joinMm:2},
 {id:'knurled-dial',name:'Knurled turning dial',kind:'knob',profile:'Flat',surface:'Diamond knurl',width:36,depth:36,height:16,join:'Round',joinMm:2},
 {id:'rectangular',name:'Rounded rectangular grip',kind:'rectangular',profile:'Flat',surface:'Smooth',width:42,depth:18,height:17,join:'Chamfer',joinMm:2},
 {id:'wing',name:'Two-wing turning grip',kind:'wing',profile:'Rounded cap',surface:'Smooth',width:48,depth:22,height:17,join:'Round',joinMm:2}
]);
export const TOP_PROFILES=Object.freeze(['Flat','Straight taper','Bulbous 2/3','Hourglass','Mushroom','Rounded cap']);
export const TOP_SURFACES=Object.freeze(['Smooth','Vertical ribs','Scalloped','Diamond knurl','Horizontal grooves']);
export const TOP_JOINS=Object.freeze(['None','Chamfer','Round']);
export const TOP_KINDS=Object.freeze(['spindle','knob','rectangular','wing']);
const finite=(value,min,max)=>Number.isFinite(value)&&value>=min&&value<=max;
export function newGearTopControl(id,preset='offset-spindle',position={}) {
 const initial=GEAR_TOP_PRESETS.find(item=>item.id===preset);
 if(!initial)throw Error('Unknown top-control starting point.');
 if(typeof id!=='string'||!id.trim())throw Error('A stable handle ID is required.');
 const {id:presetId,name,...rest}=initial;
 return {...rest,id,presetId,x:0,z:0,rotation:0,...position};
}
function distPointSegment(p,a,b){
 const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
 const t=length?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)):0;
 return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
}
function pointInside(point,loop){
 let inside=false;
 for(let i=0,j=loop.length-1;i<loop.length;j=i++){
  const [ax,ay]=loop[i],[bx,by]=loop[j];
  if(((ay>point[1])!==(by>point[1]))&&(point[0]<(bx-ax)*(point[1]-ay)/(by-ay)+ax))inside=!inside;
 }
 return inside;
}
function boundaryDistance(point,loop){
 return Math.min(...loop.map((a,i)=>distPointSegment(point,a,loop[(i+1)%loop.length])));
}
export function validateGearTopControl(c){
 if(!c||typeof c!=='object'||Array.isArray(c))throw Error('Top control must be an object.');
 if(typeof c.id!=='string'||!c.id.trim()||c.id.length>100)throw Error('Top control requires an ID.');
 if(!TOP_KINDS.includes(c.kind)||!TOP_PROFILES.includes(c.profile)||
   !TOP_SURFACES.includes(c.surface)||!TOP_JOINS.includes(c.join))throw Error('Choose a supported tactile handle shape, surface and join.');
 for(const [key,min,max] of [['x',-150,150],['z',-150,150],['width',8,100],['depth',8,100],
  ['height',6,80],['rotation',-360,360],['joinMm',0,5]]){
  if(!finite(c[key],min,max))throw Error('Handle '+key+' must be '+min+'–'+max+' mm (rotation is degrees).');
 }
 if(c.join==='None'&&c.joinMm!==0)throw Error('Set join size to zero for no shoulder.');
 return c;
}
function radii(c){
 const r=Math.PI*c.rotation/180;
 return {x:c.width/2+(.001+c.joinMm),z:c.depth/2+(.001+c.joinMm),angle:r};
}
function sample(c,factor=1){
 const {x:rx,z:rz,angle}=radii(c),co=Math.cos(angle),si=Math.sin(angle);
 return Array.from({length:32},(_,i)=>{
  const t=i*2*Math.PI/32,dx=Math.cos(t)*rx*factor,dz=Math.sin(t)*rz*factor;
  return [c.x+dx*co-dz*si,c.z+dx*si+dz*co];
 });
}
export function gearTopPlacementIssue(c,host,others=[]){
 validateGearTopControl(c);
 if(!host?.outline?.length||!Array.isArray(host.holes)||!finite(host.topY,1,100))
  return 'This gear does not expose a supported flat top face.';
 if(!pointInside([c.x,c.z],host.outline))return 'Place the handle on the actual gear top.';
 const boundary=sample(c);
 for(const point of boundary){
  if(!pointInside(point,host.outline)||boundaryDistance(point,host.outline)<1)
   return 'Move the grip inward: its strengthened base needs at least 1 mm to the gear edge.';
 }
 for(const [index,hole] of host.holes.entries()){
  // A centred turning knob intentionally spans the gear's shaft bore.
  // The manufacturing cutter reopens the full bore after all positive joins.
  const shaft=index===0&&host.shaftBore>0;
  const centred=shaft&&c.kind!=='spindle'&&Math.hypot(c.x,c.z)<.05;
  if(centred){
   if(Math.min(c.width,c.depth)/2-c.joinMm<host.shaftBore/2+2)
    return 'Widen the centred knob to leave at least 2 mm around the shaft opening.';
   continue;
  }
  if(pointInside([c.x,c.z],hole)||boundary.some(point=>pointInside(point,hole)||boundaryDistance(point,hole)<1)||
     hole.some(point=>pointInside(point,boundary)))
   return shaft?'The handle overlaps the central shaft bore. Move it or use a centred knob.':
    'The strengthened handle base overlaps a window or fixing hole.';
 }
 for(const other of others){
  if(other.id===c.id)continue;
  validateGearTopControl(other);
  const separation=Math.hypot(c.x-other.x,c.z-other.z);
  if(separation<Math.max(c.width,c.depth)/2+c.joinMm+Math.max(other.width,other.depth)/2+other.joinMm+1)
   return 'This handle overlaps another handle. Move them apart.';
 }
 for(const hardware of host.hardwareExclusions||[]){
  const clearance=Math.max(c.width,c.depth)/2+c.joinMm+hardware.radius+1;
  if(Math.hypot(c.x-hardware.x,c.z-hardware.z)<clearance)
   return 'The grip base overlaps an existing pixel, fixing or hardware cut. Move it or edit the fitting first.';
 }
 return null;
}
function topRadius(profile,t){
 switch(profile){
  case 'Straight taper':return .68+.30*t;
  case 'Bulbous 2/3':return t<=2/3?.76+.29*Math.sin(t*3/2*Math.PI/2):.76+.29*Math.cos((t-2/3)*3*Math.PI/2);
  case 'Hourglass':return 1-.27*Math.sin(Math.PI*t);
  case 'Mushroom':return t<.67?.68:.68+.36*Math.sin((t-.67)/.33*Math.PI*.85);
  case 'Rounded cap':return t>.75?Math.max(.25,Math.sqrt(Math.max(.05,1-Math.pow((t-.75)/.28,2)))):1;
  default:return 1;
 }
}
function outlinePoint(c,theta,y,scale){
 const co=Math.cos(theta),si=Math.sin(theta);
 let x=co,z=si;
 if(c.kind==='rectangular'||c.kind==='wing'){
  const power=c.kind==='wing'?.35:.55;
  x=Math.sign(co)*Math.pow(Math.abs(co),power);
  z=Math.sign(si)*Math.pow(Math.abs(si),power);
 }
 let grain=1;
 if(c.surface==='Scalloped')grain-=.12*(1-Math.cos(8*theta))/2;
 if(c.surface==='Vertical ribs')grain-=.065*(1-Math.cos(20*theta))/2;
 if(c.surface==='Diamond knurl')grain+=.035*Math.sin(20*theta+y*2.8)*Math.sin(20*theta-y*2.8);
 if(c.surface==='Horizontal grooves')grain-=.055*Math.pow(Math.max(0,Math.sin(y*2.4)),6);
 const rotation=c.rotation*Math.PI/180,dx=x*c.width/2*scale*grain,dz=z*c.depth/2*scale*grain;
 return [c.x+dx*Math.cos(rotation)-dz*Math.sin(rotation),c.z+dx*Math.sin(rotation)+dz*Math.cos(rotation)];
}
export function gearTopMesh(c,topY){
 validateGearTopControl(c);
 if(!finite(topY,1,100))throw Error('Invalid gear top height.');
 const n=96, rings=[];
 const shoulder=c.joinMm,baseTop=topY-.4;
 // Shoulder is a real lofted, positive gusset, not a cosmetic mesh bevel.
 // A chamfer is 45 degrees in radial section; Round eases the transition.
 if(shoulder>0){
  rings.push([baseTop,1+shoulder*2/Math.min(c.width,c.depth)]);
  rings.push([topY+.02,1+shoulder*2/Math.min(c.width,c.depth)]);
  if(c.join==='Round')for(let i=1;i<=4;i++){
   const t=i/4,r=1+shoulder*(1-t)*(1-t)*2/Math.min(c.width,c.depth);
   rings.push([topY+shoulder*t,r]);
  }else rings.push([topY+shoulder,1]);
 }else rings.push([baseTop,1]);
 // Ensure the first profile ring never coincides with the previous join ring.
 // Repeated zero-height rings generate degenerate triangles at the weld.
 const start=Math.max(shoulder+.15,c.height*.08),travel=c.height-start;
 const steps=Math.max(12,Math.min(48,Math.ceil(travel/.75)));
 for(let j=0;j<=steps;j++){
  const t=j/steps,y=topY+start+t*travel;
  rings.push([y,topRadius(c.profile,t)]);
 }
 const points=[],triangles=[];
 for(const [y,scale] of rings)for(let i=0;i<n;i++){
  const [x,z]=outlinePoint(c,i*2*Math.PI/n,y,scale);
  points.push(x,y,z);
 }
 const bottom=points.length/3,top=bottom+1,last=(rings.length-1)*n;
 points.push(c.x,rings[0][0],c.z,c.x,rings.at(-1)[0],c.z);
 for(let i=0;i<n;i++){
  const next=(i+1)%n;
  triangles.push(bottom,i,next,top,last+next,last+i);
  for(let r=0;r<rings.length-1;r++){
   const a=r*n+i,b=r*n+next,d=a+n,e=b+n;
   triangles.push(a,d,b,b,d,e);
  }
 }
 return {kind:'mesh',gearTopId:c.id,mesh:{points:new Float32Array(points),triangles:new Uint32Array(triangles)}};
}
export function withGearTopControls(recipe,controls=[]){
 if(!Array.isArray(controls)||controls.length>8)throw Error('Use up to eight tactile top controls per cog.');
 if(!controls.length)return recipe;
 const host=recipe.gearHost;
 if(!host)throw Error('Top controls are available only for the Cogs & Gears builder.');
 const hardwareExclusions=[];
 for(const part of recipe.negative||[]){
  if(part.gearThroughBore)continue;
  const position=part.position||[part.x,0,part.z];
  const x=position?.[0],z=position?.[2];
  if(!Number.isFinite(x)||!Number.isFinite(z)){
   throw Error('An existing hardware cut has no supported position. Remove or resolve the cut before adding a grip.');
  }
  const radius=part.kind==='box'&&part.size?Math.hypot(part.size[0],part.size[2])/2:
   Math.max(part.radius||0,part.topRadius||0,part.profile?.maxDiameter/2||0);
  if(!Number.isFinite(radius)||radius<=0)
   throw Error('An existing hardware cut lacks a measurable footprint. Resolve it before adding a grip.');
  hardwareExclusions.push({x,z,radius});
 }
 const safeHost={...host,hardwareExclusions};
 const ids=new Set();
 for(const c of controls){
  validateGearTopControl(c);
  if(ids.has(c.id))throw Error('Duplicate top-control ID.');ids.add(c.id);
  const problem=gearTopPlacementIssue(c,safeHost,controls.filter(x=>x!==c));
  if(problem)throw Error(problem);
 }
 const positive=[...recipe.positive,...controls.map(c=>gearTopMesh(c,host.topY))],negative=[...(recipe.negative||[])];
 // The intrinsic Gear extrude has its original bore; reopening AFTER union
 // prevents a knob from plugging that hole. Off-centre controls never move it.
 if(host.shaftBore>0){
  const height=host.topY+Math.max(...controls.map(c=>c.height))+4;
  negative.push({kind:'cylinder',radius:host.shaftBore/2,height,position:[0,height/2-2,0],gearThroughBore:true});
 }
 return {...recipe,gearHost:safeHost,positive,negative,bounds:{...recipe.bounds,height:Math.max(recipe.bounds.height,host.topY+Math.max(...controls.map(c=>c.height)))},
  warnings:[...(recipe.warnings||[]),'Handle and joint are Boolean-fused; verify torque, print orientation, grip texture and pinch points on a physical sample.']};
}
