/* Shared, geometric edge finishing for Crystal and the six native builders.
 * Only positive material is modified; fitting/mount/wire cutters remain exact.
 * The specified amount is an upper-bound displacement, NOT a certified CAD
 * fillet radius. A Manifold/Cura review is required after every change.
 */
export const EDGE_FINISH_DEFAULTS=Object.freeze({
 enabled:false,style:'Rounded',scope:'All exterior',amountMm:0.8,steps:2
});
export const EDGE_FINISH_STYLES=['Rounded','Chamfer'];
export const EDGE_FINISH_SCOPES=['All exterior','Top edges','Side edges','Bottom edges'];
export function normaliseEdgeFinish(input={}){
 const value={...EDGE_FINISH_DEFAULTS,...(input||{})};
 if(typeof value.enabled!=='boolean')throw Error('Edge finishing must be enabled or disabled.');
 if(!EDGE_FINISH_STYLES.includes(value.style))throw Error('Choose Rounded or Chamfer edges.');
 if(!EDGE_FINISH_SCOPES.includes(value.scope))throw Error('Choose an available edge group.');
 for(const [name,min,max] of [['amountMm',.1,4],['steps',1,3]]){
  if(!Number.isFinite(value[name])||value[name]<min||value[name]>max)
   throw Error('Edge finish '+name+' must be between '+min+' and '+max+'.');
 }
 if(!Number.isInteger(value.steps))throw Error('Edge finish steps must be a whole number.');
 return value;
}
export function crystalEdgeFinish(settings){
 return normaliseEdgeFinish({enabled:settings.edgeFinishEnabled===true,
  style:settings.edgeFinishStyle??EDGE_FINISH_DEFAULTS.style,
  scope:settings.edgeFinishScope??EDGE_FINISH_DEFAULTS.scope,
  amountMm:Number(settings.edgeFinishAmount??EDGE_FINISH_DEFAULTS.amountMm),
  steps:Number(settings.edgeFinishSteps??EDGE_FINISH_DEFAULTS.steps)});
}
// Prevent finishing the edge of a hole already present in a positive
// extruded profile. These may be shaft bores or critical mechanical fits.
function nearProtectedLoop(point,loops,clearance){
 if(!Array.isArray(loops)||!loops.length)return false;
 for(const loop of loops){
  if(!Array.isArray(loop)||loop.length<3)continue;
  for(let i=0;i<loop.length;i++){
   const a=loop[i],b=loop[(i+1)%loop.length];
   const dx=b[0]-a[0],dz=b[1]-a[1],d=dx*dx+dz*dz;
   const t=d>1e-12?Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[2]-a[1])*dz)/d)):0;
   if(Math.hypot(point[0]-(a[0]+t*dx),point[2]-(a[1]+t*dz))<clearance)return true;
  }
 }
 return false;
}
const key=(a,b)=>a<b?a+':'+b:b+':'+a;
const vec=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const length=a=>Math.hypot(...a);
const unit=a=>{const d=length(a);return d>1e-9?a.map(v=>v/d):[0,0,0]};
function indexedSurface(geometry){
 const raw=geometry.getAttribute('position');
 if(!raw)throw Error('Edge finishing needs a geometric position attribute.');
 const coordinates=raw.array,indices=geometry.index?.array;
 const points=[],lookup=new Map(),remap=[];
 for(let i=0;i<raw.count;i++){
  const xyz=[coordinates[i*3],coordinates[i*3+1],coordinates[i*3+2]];
  if(!xyz.every(Number.isFinite))throw Error('Edge finishing found non-finite geometry.');
  const label=xyz.map(v=>Math.round(v*1e5)).join('/');
  let id=lookup.get(label);
  if(id===undefined){id=points.length;lookup.set(label,id);points.push(xyz);}
  remap.push(id);
 }
 const faces=[];
 for(let i=0;i<(indices?.length??raw.count);i+=3){
  const f=[0,1,2].map(j=>remap[indices?indices[i+j]:i+j]);
  if(new Set(f).size!==3)throw Error('Edge finishing requires non-degenerate mesh triangles.');
  faces.push(f);
 }
 return {points,faces};
}
function meshEdges(points,faces){
 const edges=new Map(),normals=[];
 const bounds=[Infinity,-Infinity];
 for(let f=0;f<faces.length;f++){
  const [a,b,c]=faces[f],p=points[a],q=points[b],r=points[c];
  const normal=cross(vec(q,p),vec(r,p));
  if(length(normal)<1e-9)throw Error('Edge finishing found a zero-area mesh triangle.');
  normals.push(unit(normal));
  for(const index of [a,b,c]){bounds[0]=Math.min(bounds[0],points[index][1]);bounds[1]=Math.max(bounds[1],points[index][1]);}
  for(let j=0;j<3;j++){
   const a=faces[f][j],b=faces[f][(j+1)%3],opposite=faces[f][(j+2)%3],label=key(a,b);
   if(!edges.has(label))edges.set(label,[]);
   edges.get(label).push({a,b,opposite,face:f});
  }
 }
 return {edges,normals,bounds};
}
function inScope(scope,position,edge,bounds){
 if(scope==='All exterior')return true;
 const y=position[1],height=Math.max(.0001,bounds[1]-bounds[0]),fraction=(y-bounds[0])/height;
 if(scope==='Top edges')return fraction>=.55;
 if(scope==='Bottom edges')return fraction<=.45;
 const rise=Math.abs(edge[1])/Math.max(.0001,length(edge));
 return (fraction>=.2&&fraction<=.8)||rise>=.55;
}
function firstPass(mesh,options){
 const {points,faces}=mesh,{edges,normals,bounds}=meshEdges(points,faces);
 if(faces.length>12000)throw Error('Edge finishing exceeds 12,000 source triangles. Reduce detail or disable edge finishing.');
 if([...edges.values()].some(items=>items.length!==2))
  throw Error('Edge finishing requires a closed, two-sided manifold surface. Check the original model.');
 const marked=new Map(),vertexDirs=Array.from({length:points.length},()=>[0,0,0]),vertexCaps=new Array(points.length).fill(Infinity);
 for(const [label,items] of edges){
  const [e0,e1]=items,{a,b}=e0,p=points[a],q=points[b],direction=vec(q,p),distance=length(direction);
  const n0=normals[e0.face],n1=normals[e1.face];
  const degrees=Math.acos(Math.max(-1,Math.min(1,dot(n0,n1))))*180/Math.PI;
  if(degrees<27||dot(cross(n0,n1),direction)<=1e-8*distance)continue;
  const mid=p.map((v,i)=>(v+q[i])/2);
  if(!inScope(options.scope,mid,direction,bounds))continue;
  if([mid,p,q].some(point=>nearProtectedLoop(point,options.protectLoops,Math.max(.2,options.amountMm*2))))continue;
  const offsetDirection=unit(n0.map((v,i)=>-(v+n1[i])));
  const clearance=Math.min(options.amountMm,distance*.16);
  if(clearance<=1e-5)continue;
  marked.set(label,{direction:offsetDirection,clearance});
  for(const i of [a,b]){
   for(let j=0;j<3;j++)vertexDirs[i][j]+=offsetDirection[j];
   vertexCaps[i]=Math.min(vertexCaps[i],distance*.16);
  }
 }
 if(!marked.size)return null;
 const nextPoints=points.map(p=>p.slice()),active=new Set();
 for(let i=0;i<nextPoints.length;i++)if(Number.isFinite(vertexCaps[i])){
  const dir=unit(vertexDirs[i]),distance=Math.min(options.amountMm*.42,vertexCaps[i]*.45);
  nextPoints[i]=nextPoints[i].map((v,axis)=>v+dir[axis]*distance);
  active.add(i);
 }
 const midpoints=new Map();
 for(const [label,items] of edges){
  const {a,b}=items[0],mid=points[a].map((v,i)=>(v+points[b][i])/2),mark=marked.get(label);
  if(mark){
   for(let i=0;i<3;i++)mid[i]+=mark.direction[i]*mark.clearance;
   active.add(nextPoints.length);
  }
  midpoints.set(label,nextPoints.length);nextPoints.push(mid);
 }
 const refined=[];
 for(const [a,b,c] of faces){
  const ab=midpoints.get(key(a,b)),bc=midpoints.get(key(b,c)),ca=midpoints.get(key(c,a));
  refined.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]);
 }
 return {points:nextPoints,faces:refined,active};
}
function refinePass(mesh,options){
 const {points,faces,active}=mesh,{edges}=meshEdges(points,faces);
 const refined=points.map(p=>p.slice()),newActive=new Set(active),midpoints=new Map();
 for(const [label,items] of edges){
  const {a,b}=items[0];
  const mid=points[a].map((v,i)=>(v+points[b][i])/2);
  midpoints.set(label,refined.length);
  if(active.has(a)||active.has(b))newActive.add(refined.length);
  refined.push(mid);
 }
 const triangles=[];
 for(const [a,b,c] of faces){
  const ab=midpoints.get(key(a,b)),bc=midpoints.get(key(b,c)),ca=midpoints.get(key(c,a));
  triangles.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]);
 }
 // Relax only the new bevel neighbourhood: distant facets and cutout walls
 // remain unchanged. Small displacements avoid flattening fine relief.
 const neighbours=Array.from({length:refined.length},()=>new Set());
 for(const face of triangles)for(let i=0;i<3;i++){
  neighbours[face[i]].add(face[(i+1)%3]);neighbours[face[i]].add(face[(i+2)%3]);
 }
 const softened=refined.map(p=>p.slice());
 for(const id of newActive){
  const adjacent=[...neighbours[id]];
  if(adjacent.length<3)continue;
  const average=[0,1,2].map(axis=>adjacent.reduce((v,index)=>v+refined[index][axis],0)/adjacent.length);
  const delta=vec(average,refined[id]),distance=length(delta);
  const scale=distance>0?Math.min(.16,options.amountMm*.12/distance):0;
  softened[id]=refined[id].map((v,axis)=>v+delta[axis]*scale);
 }
 return {points:softened,faces:triangles,active:newActive};
}
export function finishEdgeGeometry(THREE,geometry,settings){
 const options=normaliseEdgeFinish(settings);
 if(!options.enabled)return geometry;
 const source=indexedSurface(geometry);
 const finished=firstPass(source,options);
 if(!finished)return geometry; // Already smooth: do not fake edge geometry.
 let mesh=finished;
 if(options.style==='Rounded')for(let i=1;i<options.steps;i++){
  if(mesh.faces.length>20000)break; // Keep preview responsive.
  mesh=refinePass(mesh,options);
 }
 const output=new THREE.BufferGeometry(),flattened=new Float32Array(mesh.points.length*3);
 for(let i=0;i<mesh.points.length;i++)flattened.set(mesh.points[i],i*3);
 output.setAttribute('position',new THREE.BufferAttribute(flattened,3));
 output.setIndex(mesh.faces.flat());
 output.computeVertexNormals();
 geometry.dispose();
 return output;
}
