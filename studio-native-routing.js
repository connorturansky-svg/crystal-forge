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
function perimeterEnds(outline){
 const ccw=outline.reduce((sum,a,i)=>sum+cross(a,outline[(i+1)%outline.length]),0)>0;
 const segments=[];
 let perimeter=0;
 for(let i=0;i<outline.length;i++){
  const a=outline[i],d=sub(outline[(i+1)%outline.length],a),span=length(d);
  if(span<1e-6)continue;
  const tangent=unit(d),outward=ccw?{x:tangent.z,z:-tangent.x}:{x:-tangent.z,z:tangent.x};
  segments.push({a,d,span,offset:perimeter,outward});
  perimeter+=span;
 }
 return {
  pin(percent){
   if(!Number.isFinite(percent)||percent<0||percent>=100)return null;
   const at=percent*perimeter/100;
   const segment=segments.find(edge=>at<edge.offset+edge.span);
   if(!segment)return null;
   const along=at-segment.offset;
   const point=add(segment.a,segment.d,along/segment.span);
   if(segments.some((edge,i)=>gap(point,edge.a)<radius+1&&
    dot(unit(edge.d),unit(segments[(i+segments.length-1)%segments.length].d))<.9))return null;
   return {point,outward:segment.outward};
  },
  percent(point){
   let best=null;
   for(const edge of segments){
    const along=Math.max(0,Math.min(edge.span,dot(sub(point,edge.a),unit(edge.d))));
    const miss=gap(point,add(edge.a,edge.d,along/edge.span));
    if(!best||miss<best.miss)best={miss,percent:(edge.offset+along)*100/perimeter};
   }
   return best?.percent%100;
  }
 };
}
function samples(points){
 const result=[points[0]];
 for(let i=1;i<points.length;i++){
  const a=points[i-1],d=sub(points[i],a),n=Math.ceil(length(d)/.5);
  for(let j=1;j<=n;j++)result.push(add(a,d,j/n));
 }
 return result;
}
function cutter(points,label,radius,depth,vaulted,wave=null,guard=false){
 const side=sign=>points.map((p,i)=>{
  const a=unit(sub(p,points[i-1]||p)),b=unit(sub(points[i+1]||p,p));
  const d=unit(add(a,b,1)),q={x:-d.z,z:d.x};
  const scale=radius/Math.max(.9,dot(d,i===0?b:a));
  const v=add(p,q,sign*scale);return [v.x,v.z];
 });
 if(wave){
  const left=side(1),right=side(-1),vertices=[],triangles=[];
  const lip=guard?-.02:.5;
  for(let i=0;i<points.length;i++){
   const [lx,lz]=left[i],[rx,rz]=right[i],ly=waveHeight(wave,lx,lz),ry=waveHeight(wave,rx,rz);
   vertices.push(lx,ly-depth,lz,rx,ry-depth,rz,rx,ry+lip,rz,lx,ly+lip,lz);
   if(i===0)continue;
   for(let j=0;j<4;j++){
    const a=(i-1)*4+j,b=(i-1)*4+(j+1)%4;
    triangles.push(a,b,b+4,a,b+4,a+4);
   }
  }
  const end=(points.length-1)*4;
  triangles.push(0,2,1,0,3,2,end,end+1,end+2,end,end+2,end+3);
  return {kind:'mesh',mesh:{points:vertices,triangles},wireChannel:label};
 }
 if(vaulted){
  const left=side(1),right=side(-1),vertices=[],triangles=[];
  for(let i=0;i<points.length;i++){
   const [lx,lz]=left[i],[rx,rz]=right[i];
   vertices.push(lx,-.5,lz,rx,-.5,rz,rx,depth,rz,
    points[i].x,depth+radius/.9,points[i].z,lx,depth,lz);
   if(i===0)continue;
   for(let j=0;j<5;j++){
    const a=(i-1)*5+j,b=(i-1)*5+(j+1)%5;
    triangles.push(a,b,b+5,a,b+5,a+5);
   }
  }
  const end=(points.length-1)*5;
  for(let j=1;j<4;j++)triangles.push(0,j+1,j,end,end+j,end+j+1);
  return {kind:'mesh',mesh:{points:vertices,triangles},wireChannel:label};
 }
 return {kind:'extrude',outline:[...side(1),...side(-1).reverse()],height:depth+.5,position:[0,-.5,0],wireChannel:label};
}

const routeSideStock=.55;

function channelSize(build){
 // Physical wire relief F and user-requested track width are independent of
 // the socket's diametral body clearance (which changes the negative bore only).
 const shaped=(build.pixelHoles||[]).filter(hole=>hole.socketProfile);
 const requested=build.serialRouting?.channelWidthMm;
 const requestedRadius=Number.isFinite(requested)&&requested>=1.5&&requested<=12?requested/2:radius;
 return {radius:Math.max(requestedRadius,...shaped.map(hole=>hole.socketProfile.wireWidth/2)),
  depth:Math.max(depth,...shaped.map(hole=>hole.socketProfile.wireDepth))};
}

function topRouteHeight(recipe,holes){
 const y=recipe.serialSupport?.topY;
 if(Number.isFinite(y)&&holes.length&&holes.every(hole=>{
  const normal=hole.surface?.normal;
  return hole.socketProfile&&normal&&Math.abs(hole.surface.y-y)<.01&&
   Math.hypot(normal[0],normal[1]-1,normal[2])<.00001;
 }))return y;
 return null;
}

function waveHeight({width,depth,segments,heights},x,z){
 const u=Math.max(0,Math.min(segments,(x/width+.5)*segments));
 const v=Math.max(0,Math.min(segments,(z/depth+.5)*segments));
 const col=Math.min(Math.floor(u),segments-1),row=Math.min(Math.floor(v),segments-1);
 const dx=u-col,dz=v-row,count=segments+1,i=row*count+col;
 const a=heights[i],b=heights[i+1],c=heights[i+count],d=heights[i+count+1];
 // Follow the same diagonal used when triangulating the printed surface.
 return dx+dz<=1?a+(b-a)*dx+(c-a)*dz:d+(c-d)*(1-dx)+(b-d)*(1-dz);
}

function waveRouteSurface(recipe,holes){
 const wave=recipe.serialSupport?.wave;
 if(!wave||!holes.length)return null;
 return holes.every(hole=>{
  const normal=hole.surface?.normal;
  return hole.socketProfile&&normal&&Math.abs(hole.surface.y-waveHeight(wave,hole.x,hole.z))<.01&&
   // A shallow socket tilt still allows the upward-open groove to join its ports.
   normal[1]>.998;
 })?wave:null;
}

function frontRouteFace(recipe,holes){
 const front=recipe.serialSupport?.front;
 if(!front||!holes.length)return null;
 const width=front.outline[1][0]-front.outline[0][0],depth=front.thickness;
 for(const [name,axis,sign,yaw] of [['front',2,1,0],['rear',2,-1,Math.PI],['right',0,1,Math.PI/2],['left',0,-1,-Math.PI/2]]){
  const along=2-axis,distance=(axis===2?depth:width)/2,plane=sign*distance,tangentSign=axis===2?sign:-sign;
  const normalField=axis===2?'z':'x',tangentField=axis===2?'x':'z';
  if(!holes.every(hole=>{
   const normal=hole.surface?.normal;
   return hole.socketProfile&&normal&&Number.isFinite(hole.surface.y)&&Math.abs(hole[normalField]-plane)<.01&&
    Math.hypot(normal[along],normal[1],normal[axis]-sign)<.00001;
  }))continue;
  const halfSpan=(axis===2?width:depth)/2,wallHeight=front.wallHeight;
  return {...front,name,axis,along,sign,plane,tangentSign,tangentField,yaw,thickness:distance*2,
   outline:[[-halfSpan,0],[halfSpan,0],[halfSpan,wallHeight],[-halfSpan,wallHeight]]};
 }
 return null;
}

// Route X/Z is along the wall, and +Y is into stock.
export function tileWallPosition(wall,x,height,offset){
 const point=[0,height,0];
 point[wall.along]=wall.tangentSign*x;
 point[wall.axis]=wall.plane+wall.sign*offset;
 return point;
}
function frontRouteExtrude(part,front){
 const [x,y,z]=part.position??[0,0,0];
 return {...part,rotation:[-Math.PI/2,front.yaw,0],position:tileWallPosition(front,x,z,-y)};
}

export function nativeRouteEligibility(recipe,build){
 const holes=build.pixelHoles||[];
 const topY=topRouteHeight(recipe,holes),front=frontRouteFace(recipe,holes),wave=waveRouteSurface(recipe,holes);
 const waveSlopeLimit=recipe.serialSupport?.waveSlopeLimit;
 if(waveSlopeLimit&&holes.length&&holes.every(hole=>hole.socketProfile&&hole.surface?.normal[1]>.5))
  return 'Wave relief is too steep for surface cable grooves. Reduce Wave height or Wave count until the surface slope is '+Math.round(waveSlopeLimit*100)+'% or less.';
 if(holes.some(hole=>hole.socketProfile&&hole.surface)&&topY===null&&!front&&!wave)
  return 'Physical grooves require a shared flat underside or an eligible planar top, Tile wall or gentle Wave surface. Move the sockets to the same supported face.';
 if(wave&&build.serialRouting?.vaulted)
  return 'Wave surface grooves open upward. Turn off the vaulted option for a Wave route.';
 if(front&&build.serialRouting?.vaulted)
  return 'Front grooves open sideways. Turn off the vaulted option for a front route.';
 if(topY!==null&&build.serialRouting?.vaulted)
  return 'Top grooves open upward. Turn off the vaulted option for a planar top route.';
 const requested=build.serialRouting?.channelWidthMm;
 if(requested!=null&&(!Number.isFinite(requested)||requested<1.5||requested>12))
  return 'Wire-track width must be between 1.5 and 12 mm.';
 if(!recipe.serialSupport)return recipe.serialReason||'Enable fitting backing to check this model for serial routing.';
 if(recipe.dualMaterial)return 'Use a single material for native serial routing.';
 const channel=channelSize(build);
 const required=channel.depth+roof+(build.serialRouting?.vaulted?channel.radius/.9:0);
 const supportThickness=topY!==null||wave?recipe.serialSupport.topThickness??recipe.serialSupport.thickness:recipe.serialSupport.thickness;
 if((front?.thickness??supportThickness)<required)return 'Routing needs at least '+required.toFixed(1)+' mm of solid backing for the groove and roof.';
 const blocksBacking=part=>part.kind!=='box'||part.rotation||!Array.isArray(part.position)||
  part.position[1]+part.size[1]/2>0;
 const otherCuts=recipe.negative.filter(part=>!part.mountHole&&!part.manualMountRecess);
 const obstructed=recipe.serialSupport.explicitBacking?otherCuts.some(blocksBacking):otherCuts.length>0;
 if(obstructed||build.mounting||build.base||Object.values(build.partOffsets||{}).some(offset=>offset?.some?.(value=>value!==0)))
  return 'Existing cavities, mounting cuts, added bases or part offsets prevent safe routing.';
 return '';
}

export function planNativePixelString(recipe,build,{guide=false}={}){
 const {radius,depth}=channelSize(build);
 const enabled=build.serialRouting?.enabled===true;
 const settings=enabled?build.serialRouting:{version:1,pitch:50,...build.serialRouting};
 const plan={enabled,channelWidthMm:radius*2,ready:false,links:[],cutters:[],reason:nativeRouteEligibility(recipe,build)};
 if(!plan.enabled&&!guide)return plan;
 if(settings.version!==1){plan.reason='This serial route version is unsupported. Turn routing off to prepare bores only.';return plan;}
 if(plan.reason)return plan;
 const minBendRadius=settings.minBendRadius??5;
 if(!Number.isFinite(minBendRadius)||minBendRadius<1||minBendRadius>60){
  plan.reason='Enter a minimum bend radius between 1 and 60 mm.';return plan;
 }
 const bendOptions={minBendRadius};
 const holes=build.pixelHoles||[],pitch=Number(settings.pitch),inTail=Number(settings.inTail??settings.tail??200),outTail=Number(settings.outTail??settings.tail??200);
 if(![pitch,inTail,outTail].every(value=>Number.isFinite(value)&&value>=5&&value<=250)){
  plan.reason='Enter a cable pitch and tail budget between 5 and 250 mm.';return plan;
 }
 if(!holes.length||holes.length>16||holes.some(p=>!p.checked||!p.id||![p.x,p.z,p.diameter,p.clearance,p.rotation??0].every(Number.isFinite))||
  new Set(holes.map(p=>p.id)).size!==holes.length){
  plan.reason='Place 1 to 16 checked pixel fittings in Build before routing.';return plan;
 }
 const topY=topRouteHeight(recipe,holes),front=frontRouteFace(recipe,holes),wave=waveRouteSurface(recipe,holes);
 if(topY!==null){plan.face='top';plan.surfaceY=topY;}
 if(front){plan.face=front.name;plan.front=front;}
 if(wave)plan.face='wave';
 const pixels=holes.map(p=>({...p,x:front?front.tangentSign*p[front.tangentField]:p.x,z:front?p.surface.y:p.z,
  radius:(p.diameter+p.clearance)/2,wireAngle:topY===null&&!wave?(p.rotation??0):180-(p.rotation??0)}));
 const upperOutline=topY!==null||wave?recipe.serialSupport.topOutline:null;
 const supportOutline=front?.outline??upperOutline??recipe.serialSupport.outline;
 const outline=supportOutline.map(([x,z])=>({x,z}));
 const undersized=pixels.findIndex(p=>p.radius<2.1);
 if(undersized>=0){
  plan.reason='P'+(undersized+1)+' needs a bore diameter of at least 4.2 mm for serial routing.';return plan;
 }
 const nearEdge=pixels.findIndex(p=>boundary(p,outline)<p.radius+radius+.3);
 if(nearEdge>=0){
  plan.reason='P'+(nearEdge+1)+' is too close to the backing edge. Move the fitting inward to clear its cable ports.';return plan;
 }
 const mounts=recipe.negative.filter(part=>part.mountHole||part.manualMountRecess);
 const mountConflicts=(mount,path)=>{
  const [x,,z]=mount.position;
  const clearance=Math.max(mount.radius,mount.topRadius??0)+radius+routeSideStock;
  if(front){
   // A through-hole spans all vertical positions on the front routing plane.
   if(front.sign*mount.position[front.axis]+Math.max(mount.radius,mount.topRadius??0)<Math.abs(front.plane)-depth-roof)return false;
   const localX=front.tangentSign*mount.position[front.along];
   return path.slice(1).some((point,i)=>{
    const a=path[i];
    return localX>=Math.min(a.x,point.x)-clearance&&localX<=Math.max(a.x,point.x)+clearance;
   });
  }
  return path.slice(1).some((point,i)=>distance({x,z},path[i],point)<clearance);
 };
 const addLink=(label,path,ends,budget,edge=null,centreAllowance=0)=>{
  if(!path){plan.links.push({label,path:[],reason:'No safe tangent-compatible path.'});return;}
  const dense=samples(path);
  const measuredPath=wave?dense:path;
  const measure=measuredPath.slice(1).reduce((sum,p,i)=>{
   const a=measuredPath[i],rise=wave?waveHeight(wave,p.x,p.z)-waveHeight(wave,a.x,a.z):0;
   return sum+Math.hypot(gap(a,p),rise);
  },centreAllowance);
  const invalid=dense.some(point=>{
   if(boundary(point,outline)<radius+routeSideStock&&(!edge||gap(point,edge)>4))return true;
   return pixels.some(p=>!ends.includes(p.id)&&gap(point,p)<p.radius+radius+1.25);
  });
  const obstructingMount=mounts.find(mount=>mountConflicts(mount,path));
  const needsLift=front?.backingHeight&&dense.some(point=>point.z<front.backingHeight+(radius+routeSideStock)/.9);
  let reason=needsLift?'Move the route above the fitting backing so the channel and its exits stay open.'
   :obstructingMount?'Channel is too close to '+(obstructingMount.mountHole||obstructingMount.fixingRecess)+'. Move the mounting hole or the route.'
   :invalid?'Channel approaches an edge or unrelated bore.':measure>budget+1e-6?'Cable budget exceeded.':'';
  if(!reason&&plan.links.some(other=>{
   const shared=pixels.filter(p=>ends.includes(p.id)&&other.ends?.includes(p.id));
   return other.dense?.some(q=>dense.some(p=>gap(p,q)<2*radius+.5&&!shared.some(b=>gap(p,b)<b.radius&&gap(q,b)<b.radius)));
  }))
   reason='Channels cross or leave insufficient web between them.';
  plan.links.push({label,path,measure,budget,reason,dense,ends});
 };
 const start=pixels[0],end=pixels.at(-1),inPort=pixelStringPort(start,'input'),outPort=pixelStringPort(end,'output');
 const inAxis=pixelStringAxis(start),outAxis=pixelStringAxis(end);
 const outside=(edge,axis)=>edge&&[.5,1,1.5,2,2.5,3,3.5,4].every(step=>boundary(add(edge,axis,step),outline)<0);
 const perimeter=perimeterEnds(outline);
 const tail=(port,axis,percent)=>{
  if(percent==null){
   const point=exitAlong(port,axis,outline);
   return outside(point,axis)?{point,outward:axis,path:[port,point]}:null;
  }
  const chosen=perimeter.pin(percent);
  if(!chosen||!outside(chosen.point,chosen.outward))return null;
  const path=sampleCableCurve(port,chosen.point,axis,chosen.outward,bendOptions);
  return path?{...chosen,path}:null;
 };
 const entry=tail(inPort,{x:-inAxis.x,z:-inAxis.z},settings.inEdgePercent);
 const exit=tail(outPort,outAxis,settings.outEdgePercent);
 plan.edgePositions={in:entry?perimeter.percent(entry.point):null,out:exit?perimeter.percent(exit.point):null};
 addLink('EDGE IN → P1',entry?.path.slice().reverse(),[start.id],inTail,entry?.point);
 if(!entry&&settings.inEdgePercent!=null)plan.links.at(-1).reason='Chosen IN edge is too close to a corner or has no safe bend. Move the endpoint or use automatic.';

 for(let i=0;i<pixels.length-1;i++){
  const a=pixels[i],b=pixels[i+1],p=pixelStringPort(a,'output'),q=pixelStringPort(b,'input');
  const forward=unit(sub(q,p)),from=pixelStringAxis(a),to=pixelStringAxis(b);
  const curve=dot(from,forward)>.65&&dot(to,forward)>.65?sampleCableCurve(p,q,from,to,bendOptions):null;
  // Include the in-bore distance at each end for physical centre-to-centre pitch.
  addLink('P'+(i+1)+' → P'+(i+2),curve,[a.id,b.id],pitch,null,gap(a,p)+gap(b,q));
 }
 addLink('P'+pixels.length+' → EDGE OUT',exit?.path,[end.id],outTail,exit?.point);
 if(!exit&&settings.outEdgePercent!=null)plan.links.at(-1).reason='Chosen OUT edge is too close to a corner or has no safe bend. Move the endpoint or use automatic.';
 if(entry&&exit&&gap(entry.point,exit.point)<6)plan.links.at(-1).reason='Use distinct perimeter exits at least 6 mm apart.';
 plan.reason=plan.links.filter(link=>link.reason).map(link=>link.label+': '+link.reason).join(' ');
 plan.ready=!plan.reason;
 // Extend a wide cutter to the first bore chord that fits its full width.
 // Keep the cable path, edge openings and reported lengths at their planned points.
 const openJunction=(pixel,port)=>{
  const bore=pixel.radius-(pixel.socketProfile?.retentionLip??0),halfWidth=radius+.02;
  if(halfWidth>=bore)return null;
  const chord=Math.sqrt(bore*bore-halfWidth*halfWidth),current=gap(pixel,port);
  return current>chord?add(pixel,sub(port,pixel),chord/current):null;
 };
 if(plan.ready&&plan.enabled)plan.cutters=plan.links.map((link,i)=>{
  const points=link.path.slice();
  if(i===0)points.unshift(add(entry.point,entry.outward,4));
  else{
   const junction=openJunction(pixels[i-1],points[0]);
   if(junction)points.unshift(junction);
  }
  if(i===plan.links.length-1)points.push(add(exit.point,exit.outward,4));
  else{
   const junction=openJunction(pixels[i],points.at(-1));
   if(junction)points.push(junction);
  }
  const swept=wave?samples(points):points;
  const cut=cutter(swept,link.label,radius,depth,settings.vaulted===true,wave);
  const sideStock=cutter(swept,link.label,radius+routeSideStock,depth,false,wave,true);
  if(topY!==null){
   cut.position=[0,topY-depth,0];
   sideStock.position=cut.position;
  }
  return {...(front?frontRouteExtrude(cut,front):cut),junctionIds:link.ends,
   sideStock:front?frontRouteExtrude(sideStock,front):sideStock};
 });
 if(plan.ready&&plan.enabled)plan.roofStock={outline:supportOutline,thickness:roof};
 for(const link of plan.links){
  if(wave&&link.path.length)link.path=link.dense.map(p=>({...p,y:waveHeight(wave,p.x,p.z)}));
  delete link.dense;delete link.ends;
 }
 return plan;
}
