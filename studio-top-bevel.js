import {normaliseEdgeFinish} from './studio-edge-finish.js';

const EPS = 1e-5;
const edgeKey = (a,b) => a < b ? a+':'+b : b+':'+a;
const normal = (a,b,c) => {
 const u=b.map((x,i)=>x-a[i]), v=c.map((x,i)=>x-a[i]);
 return [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
};

function rimLoops(boundary){
 const outgoing=new Map(boundary.map(edge=>[edge.a,edge]));
 if(outgoing.size!==boundary.length)return [];
 const loops=[];
 while(outgoing.size){
  const first=outgoing.values().next().value, loop=[];
  let edge=first;
  do{
   loop.push(edge);
   outgoing.delete(edge.a);
   if(edge.b===first.a)break;
   edge=outgoing.get(edge.b);
   if(!edge)return [];
  }while(true);
  loops.push(loop);
 }
 return loops;
}

// Points are in the (X,-Z) plane, where upward faces put material on the left.
function insetCorner(previous,point,next,amount){
 const left=(a,b)=>{
  const x=b[0]-a[0], y=b[1]-a[1], length=Math.hypot(x,y);
  return [-y/length,x/length];
 };
 const a=left(previous,point),b=left(point,next);
 const scale=amount/(1+a[0]*b[0]+a[1]*b[1]);
 return [point[0]+scale*(a[0]+b[0]),point[1]+scale*(a[1]+b[1])];
}

function area(loops){
 return loops.reduce((sum,loop)=>sum+loop.reduce((value,[x,y],i)=>{
  const [nx,ny]=loop[(i+1)%loop.length];
  return value+(x*ny-y*nx)/2;
 },0),0);
}

function validInset(wasm,before,after){
 if(after.flat().some(point=>!point.every(Number.isFinite)))return false;
 for(let j=0;j<before.length;j++){
  if(area([before[j]])*area([after[j]])<=0)return false;
  for(let i=0;i<before[j].length;i++){
   const k=(i+1)%before[j].length;
   const edge=before[j][k].map((value,a)=>value-before[j][i][a]);
   const inset=after[j][k].map((value,a)=>value-after[j][i][a]);
   if(edge[0]*inset[0]+edge[1]*inset[1]<=0)return false;
  }
 }
 const base=new wasm.CrossSection(before,'NonZero');
 const top=new wasm.CrossSection(after,'NonZero');
 const outside=top.subtract(base);
 try{
  return !top.isEmpty() && Math.abs(top.area()-area(after))<EPS &&
   top.toPolygons().length===after.length && outside.area()<EPS;
 }finally{outside.delete();top.delete();base.delete();}
}

function chamferMesh(wasm,mesh,amount,onWarning){
 const {triVerts,vertProperties,numProp}=mesh;
 const vertices=Array.from({length:mesh.numVert},(_,i)=>Array.from(vertProperties.slice(i*numProp,i*numProp+3)));
 const aliases=new Map(Array.from(mesh.mergeFromVert,(id,i)=>[id,mesh.mergeToVert[i]]));
 const faces=[], edges=new Map(), planar=new Set();
 for(let i=0;i<triVerts.length;i+=3){
  const face=[0,1,2].map(j=>aliases.get(triVerts[i+j])??triVerts[i+j]);
  const points=face.map(id=>vertices[id]), n=normal(...points);
  const id=faces.length;
  faces.push({face,n});
  if(n[1]>0 && points.every(p=>Math.abs(p[1]-points[0][1])<EPS))planar.add(id);
  for(let j=0;j<3;j++){
   const a=face[j],b=face[(j+1)%3],other=face[(j+2)%3];
   const key=edgeKey(a,b);
   if(!edges.has(key))edges.set(key,[]);
   edges.get(key).push({a,b,other,id});
  }
 }
 const lowered=new Map(), replacement=[], replaced=new Set();
 let skipped=false;
 const xy=id=>[vertices[id][0],-vertices[id][2]];
 while(planar.size){
  const seed=planar.values().next().value, patch=[seed], boundary=[];
  planar.delete(seed);
  for(const id of patch){
   const {face}=faces[id];
   for(let j=0;j<3;j++){
    const neighbours=edges.get(edgeKey(face[j],face[(j+1)%3]));
    const edge=neighbours.find(e=>e.id===id), wall=neighbours.find(e=>e.id!==id);
    if(!wall)return null;
    const n=faces[wall.id].n;
    if(n[1]>0 && Math.abs(n[0])+Math.abs(n[2])<n[1]*EPS){
     if(planar.delete(wall.id))patch.push(wall.id);
    }else boundary.push({...edge,eligible:Math.abs(n[1])<Math.hypot(n[0],n[2])*EPS &&
     vertices[wall.other][1]<vertices[edge.a][1]-EPS});
   }
  }
  const loops=rimLoops(boundary);
  const moving=loops.map(loop=>loop.every(edge=>edge.eligible));
  if(!moving.some(Boolean))continue;
  const before=loops.map(loop=>loop.map(edge=>xy(edge.a)));
  const after=before.map((loop,j)=>moving[j]?loop.map((point,i)=>
   insetCorner(loop[(i+loop.length-1)%loop.length],point,loop[(i+1)%loop.length],amount)):loop);
  if(!validInset(wasm,before,after)){skipped=true;continue;}
  const y=vertices[boundary[0].a][1], cap=[];
  for(let j=0;j<loops.length;j++){
   const loop=loops[j], ring=[];
   for(let i=0;i<loop.length;i++){
    const {a}=loop[i];
    if(!moving[j]){ring.push(a);continue;}
    if(lowered.has(a))return null;
    const [x,z]=after[j][i];
    ring.push(vertices.push([x,y,-z])-1);
    const [oldX,oldY,oldZ]=vertices[a];
    lowered.set(a,vertices.push([oldX,oldY-amount,oldZ])-1);
   }
   cap.push(...ring);
   if(moving[j])for(let i=0;i<loop.length;i++){
    const k=(i+1)%loop.length;
    const a=lowered.get(loop[i].a), b=lowered.get(loop[k].a);
    replacement.push(a,b,ring[k],a,ring[k],ring[i]);
   }
  }
  for(const tri of wasm.triangulate(after,undefined,false))replacement.push(...tri.map(i=>cap[i]));
  for(const id of patch)replaced.add(id);
 }
 if(!replaced.size)return null;
 for(let id=0;id<faces.length;id++){
  if(replaced.has(id))continue;
  const {face,n}=faces[id];
  const mapped=face.map(i=>lowered.get(i)??i);
  if(face.some(i=>lowered.has(i))){
   const newNormal=normal(...mapped.map(i=>vertices[i]));
   if(newNormal.reduce((dot,value,i)=>dot+value*n[i],0)<=0)return null;
  }
  replacement.push(...mapped);
 }
 const positions=new Float32Array(vertices.flat());
 for(let i=0;i<replacement.length;i+=3){
  const points=replacement.slice(i,i+3).map(id=>Array.from(positions.subarray(id*3,id*3+3)));
  if(Math.hypot(...normal(...points))<1e-12)return null;
 }
 if(skipped)onWarning('Some top rims kept their original shape because the chamfer would cross a contour.');
 return new wasm.Mesh({numProp:3,vertProperties:positions,triVerts:new Uint32Array(replacement)});
}

export function bevelTopSolid(wasm,solid,settings,onWarning=()=>{}){
 const options=normaliseEdgeFinish(settings);
 if(!options.enabled)return solid;
 const mesh=chamferMesh(wasm,solid.getMesh(),options.amountMm,onWarning);
 if(!mesh)return solid;
 const result=new wasm.Manifold(mesh);
 if(result.status()==='NoError'&&!result.isEmpty()&&result.volume()<solid.volume()-EPS)return result;
 result.delete();
 return solid;
}
