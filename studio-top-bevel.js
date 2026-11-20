/* P0 #119: subtractive, top-facing safety chamfers.
 * A chamfer removes material at the top rim only. It never moves arbitrary
 * triangulation midpoints, unlike the replaced #117 edge-deformation pass.
 * Hardware negatives remain independent and are subtracted afterwards.
 */
import {normaliseEdgeFinish} from './studio-edge-finish.js';

const EPS=1e-5;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dot2=(a,b)=>a[0]*b[0]+a[1]*b[1];
const key=(a,b)=>a<b?a+':'+b:b+':'+a;
function triangleNormal(a,b,c){
 const u=a.map((v,i)=>b[i]-v),v=a.map((x,i)=>c[i]-x);
 const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
 const size=Math.hypot(...n);return size>EPS?n.map(x=>x/size):[0,0,0];
}
function hasSubprecisionTriangles(solid){
 const mesh=solid.getMesh(),v=mesh.vertProperties,t=mesh.triVerts,stride=mesh.numProp;
 for(let i=0;i<t.length;i+=3){
  const a=t[i]*stride,b=t[i+1]*stride,c=t[i+2]*stride;
  const ux=v[b]-v[a],uy=v[b+1]-v[a+1],uz=v[b+2]-v[a+2];
  const vx=v[c]-v[a],vy=v[c+1]-v[a+1],vz=v[c+2]-v[a+2];
  if(Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)<1e-12)return true;
 }
 return false;
}
function positiveRims(solid){
 const mesh=solid.getMesh(),vertices=[],triangles=[],normals=[],edges=new Map();
 const raw=mesh.vertProperties;
 for(let i=0;i<mesh.numVert;i++)vertices.push([raw[i*mesh.numProp],raw[i*mesh.numProp+1],raw[i*mesh.numProp+2]]);
 for(let i=0;i<mesh.triVerts.length;i+=3){
  const face=[mesh.triVerts[i],mesh.triVerts[i+1],mesh.triVerts[i+2]];
  const normal=triangleNormal(...face.map(id=>vertices[id]));
  triangles.push(face);normals.push(normal);
  for(let k=0;k<3;k++){
   const a=face[k],b=face[(k+1)%3],other=face[(k+2)%3],label=key(a,b);
   if(!edges.has(label))edges.set(label,[]);
   edges.get(label).push({a,b,other,face:triangles.length-1});
  }
 }
 return {vertices,normals,edges};
}
export function bevelTopSolid(wasm,solid,settings){
 const options=normaliseEdgeFinish(settings);
 if(!options.enabled)return solid;
 const box=solid.boundingBox(),height=box.max[1]-box.min[1];
 const amount=Math.min(options.amountMm,height*.24);
 if(amount<.099)throw Error('Too little vertical stock for a safe top chamfer.');
 const {vertices,normals,edges}=positiveRims(solid),wedges=[];
 try{
  for(const entries of edges.values()){
   if(entries.length!==2)continue;
   const top=entries.find(e=>normals[e.face][1]>.985);
   const wall=entries.find(e=>e!==top&&Math.abs(normals[e.face][1])<.25);
   if(!top||!wall)continue;
   const p=vertices[top.a],q=vertices[top.b],other=vertices[top.other];
   if(Math.abs(p[1]-q[1])>1e-3||p[1]<=box.min[1]+amount+.005)continue;
   const x=q[0]-p[0],z=q[2]-p[2],length=Math.hypot(x,z);
   if(length<1e-5)continue;
   const dir=[x/length,z/length],right=[dir[1],-dir[0]];
   const midpoint=[(p[0]+q[0])/2,(p[2]+q[2])/2];
   const toward=[other[0]-midpoint[0],other[2]-midpoint[1]];
   const sign=dot2(toward,right)>=0?1:-1;
   // The diagonal r = y - (top-amount) is a genuine 45 degree
   // material-removing chamfer, with no triangle-centre displacement.
   const y=p[1];
   const crossSection=new wasm.CrossSection([[
    [-sign*amount,y-2*amount],[-sign*amount,y+amount],
    [sign*2*amount,y+amount]
   ]], 'EvenOdd');
   try{
    const extension=Math.min(amount*.3,length*.22);
    const extruded=crossSection.extrude(length+2*extension);
    let rotated,wedge;
    try{
     rotated=extruded.rotate([0,Math.atan2(dir[0],dir[1])*180/Math.PI,0]);
     wedge=rotated.translate([p[0]-dir[0]*extension,0,p[2]-dir[1]*extension]);
    }finally{rotated?.delete();extruded.delete();}
    if(wedge.status()!=='NoError'||wedge.isEmpty()){wedge.delete();throw Error('Failed to build top chamfer cutter.');}
    wedges.push(wedge);
   }finally{crossSection.delete();}
   if(wedges.length>1400)throw Error('This model has too many exposed rim segments for the safe chamfer. Simplify its shape.');
  }
  if(!wedges.length)return solid; // Already curved or no exposed flat upper rim.
  const union=wasm.Manifold.union(wedges);
  try{
   if(union.status()!=='NoError'||union.isEmpty())throw Error('Top chamfer cutters could not be joined.');
   const result=solid.subtract(union);
   if(result.status()!=='NoError'||result.isEmpty()||
      !(result.volume()<solid.volume()-.0001)||
      result.boundingBox().min[1]<box.min[1]-.001){
    result.delete();
    throw Error('Top chamfer would damage this model. Reduce amount or leave finishing off.');
   }
   // Only repair source meshes whose float32 triangles are actually
   // degenerate. A simple box must NOT be rounded away by global cleanup.
   if(!hasSubprecisionTriangles(result))return result;
   const raw=result.asOriginal();
   try{
    const cleaned=raw.simplify(Math.min(.04,amount*.08));
    if(cleaned.status()!=='NoError'||cleaned.isEmpty()||
       Math.abs(cleaned.volume()-result.volume())>Math.max(.8,result.volume()*.001)){
     cleaned.delete();result.delete();
     throw Error('Top chamfer cleanup changed the real solid. Reduce the amount.');
    }
    result.delete();return cleaned;
   }finally{raw.delete();}
  }finally{union.delete();}
 }finally{for(const wedge of wedges)wedge.delete();}
}
function profile(THREE,part){
 let outline,holes=[],height,base=0;
 if(part.kind==='extrude'){
  outline=part.outline;holes=part.holes||[];height=part.height;
 }else if(part.kind==='box'){
  const [x,y,z]=part.size;height=y;base=-y/2;
  outline=[[-x/2,-z/2],[x/2,-z/2],[x/2,z/2],[-x/2,z/2]];
 }else if(part.kind==='cylinder'&&(part.topRadius??part.radius)===part.radius){
  const r=part.radius;height=part.height;base=-height/2;
  outline=Array.from({length:48},(_,i)=>[r*Math.cos(2*Math.PI*i/48),r*Math.sin(2*Math.PI*i/48)]);
 }else return null;
 if(!Number.isFinite(height)||height<=0)return null;
 const make=points=>{
  const shape=new THREE.Shape();
  points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));
  shape.closePath();return shape;
 };
 const shape=make(outline);for(const hole of holes)shape.holes.push(make(hole));
 return {shape,height,base};
}
// Top-only preview: retain the full bottom footprint, flat underside and
// vertical stock. Triangles for the top face and bevel come from a canonical
// extruded contour (including ALL spoke/shaft-hole loops), not mesh smoothing.
export function previewTopChamfer(THREE,part){
 if(!part.edgeFinish?.enabled)return null;
 const p=profile(THREE,part);if(!p)return null;
 const amount=Math.min(part.edgeFinish.amountMm,p.height*.24);
 if(!Number.isFinite(amount)||amount<.099)return null;
 const coreHeight=p.height-amount;
 const core=new THREE.ExtrudeGeometry(p.shape,{depth:coreHeight,steps:1,bevelEnabled:false,curveSegments:12});
 const bevel=new THREE.ExtrudeGeometry(p.shape,{depth:coreHeight,steps:1,bevelEnabled:true,
  bevelThickness:amount,bevelSize:amount,bevelOffset:-amount,bevelSegments:1,curveSegments:12});
 core.rotateX(-Math.PI/2);bevel.rotateX(-Math.PI/2);
 const pieces=[];
 const append=(g,accept)=>{
  const position=g.getAttribute('position').array;
  for(let i=0;i<position.length;i+=9){
   const y=[position[i+1],position[i+4],position[i+7]];
   if(accept(y))for(let j=0;j<9;j++)pieces.push(position[i+j]);
  }
 };
 append(core,y=>!y.every(value=>value>=coreHeight-EPS));
 append(bevel,y=>y.every(value=>value>=coreHeight-EPS));
 core.dispose();bevel.dispose();
 const out=new THREE.BufferGeometry();
 out.setAttribute('position',new THREE.Float32BufferAttribute(pieces,3));
 if(p.base)out.translate(0,p.base,0);
 out.computeVertexNormals();return out;
}
