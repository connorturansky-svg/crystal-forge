export const MAX_MESH_BYTES=4*1024*1024;
const LIMIT=30000;
const xyz=text=>{
 const fields=text.trim().split(/\s+/).map(Number);
 if(fields.length!==3||!fields.every(n=>Number.isFinite(n)&&Math.abs(n)<=1e7))throw Error('Invalid or out-of-range mesh coordinate.');
 return fields;
};

function readStl(buffer){
 const view=new DataView(buffer);
 const count=buffer.byteLength>=84?view.getUint32(80,true):0;
 if(count&&84+count*50===buffer.byteLength){
  if(count>LIMIT)throw Error('Mesh exceeds the 30,000 triangle limit.');
  return Array.from({length:count},(_,face)=>Array.from({length:3},(_,vertex)=>
   Array.from({length:3},(_,axis)=>view.getFloat32(96+face*50+vertex*12+axis*4,true))));
 }
 const lines=new TextDecoder().decode(buffer).trim().split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
 if(!/^solid(?:\s|$)/i.test(lines[0]||'')||!/^endsolid(?:\s|$)/i.test(lines.at(-1)||''))
  throw Error('Invalid binary or ASCII STL.');
 if((lines.length-2)%7!==0||lines.length>LIMIT*7+2)throw Error('Invalid ASCII STL facets or triangle limit exceeded.');
 const facets=[];
 for(let i=1;i<lines.length-1;i+=7){
  if(!/^facet normal\s/i.test(lines[i])||!/^outer loop$/i.test(lines[i+1])||
   !/^endloop$/i.test(lines[i+5])||!/^endfacet$/i.test(lines[i+6]))throw Error('Malformed ASCII STL facet.');
  const vertices=lines.slice(i+2,i+5);
  if(!vertices.every(line=>/^vertex\s/i.test(line)))throw Error('Malformed ASCII STL vertex.');
  facets.push(vertices.map(line=>xyz(line.replace(/^vertex\s+/i,''))));
 }
 return facets;
}

function readObj(buffer){
 const vertices=[],facets=[];
 for(const raw of new TextDecoder().decode(buffer).split(/\r?\n/)){
  const line=raw.split('#',1)[0].trim();if(!line)continue;
  const [type,...values]=line.split(/\s+/);
  if(type==='v'){
   vertices.push(xyz(values.join(' ')));if(vertices.length>LIMIT*3)throw Error('OBJ vertex limit exceeded.');
  }else if(type==='f'){
   if(values.length!==3)throw Error('Triangulate OBJ faces before importing.');
   facets.push(values.map(value=>{
    if(!/^-?\d+(?:\/-?\d*\/?-?\d*)?$/.test(value))throw Error('Malformed OBJ face index.');
    const index=Number(value.split('/')[0]);
    const vertex=vertices[index>0?index-1:vertices.length+index];
    if(index===0||!vertex)throw Error('OBJ face references a missing vertex.');
    return vertex;
   }));
   if(facets.length>LIMIT)throw Error('Mesh exceeds the 30,000 triangle limit.');
  }else if(!['vt','vn','o','g','s','usemtl','mtllib'].includes(type))throw Error('Unsupported OBJ statement: '+type);
 }
 return facets;
}

export function readMeshFile(name,buffer){
 if(!buffer.byteLength||buffer.byteLength>MAX_MESH_BYTES)throw Error('Choose a mesh smaller than 4 MiB.');
 const format=name.split('.').at(-1).toLowerCase();
 const faces=format==='stl'?readStl(buffer):format==='obj'?readObj(buffer):null;
 if(!faces?.length)throw Error('Choose a non-empty STL or OBJ model.');
 const points=[],triangles=[],vertices=new Map();
 for(const face of faces)for(const vertex of face){
  if(!vertex.every(n=>Number.isFinite(n)&&Math.abs(n)<=1e7))throw Error('Invalid mesh coordinate.');
  const key=vertex.join(',');
  if(!vertices.has(key)){vertices.set(key,points.length/3);points.push(...vertex);}
  triangles.push(vertices.get(key));
 }
 return {version:1,name,format,points,triangles};
}

function validateSolid(points,triangles){
 const edgeUses=new Map(),neighbours=Array.from({length:triangles.length/3},()=>[]);let volume=0;
 for(let i=0;i<triangles.length;i+=3){
  const face=triangles.slice(i,i+3);
  const [a,b,c]=face.map(id=>points.slice(id*3,id*3+3));
  const u=b.map((v,j)=>v-a[j]),v=c.map((n,j)=>n-a[j]);
  const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  if(Math.hypot(...normal)<1e-10)throw Error('Mesh contains a degenerate triangle.');
  volume+=a.reduce((sum,n,j)=>sum+n*normal[j],0);
  for(let j=0;j<3;j++){
   const from=face[j],to=face[(j+1)%3],key=from<to?from+':'+to:to+':'+from;
   const edge=edgeUses.get(key)||[0,0,i/3];
   if(edge[0]===1){neighbours[i/3].push(edge[2]);neighbours[edge[2]].push(i/3);}
   edge[0]++;edge[1]+=from<to?1:-1;edgeUses.set(key,edge);
  }
 }
 if([...edgeUses.values()].some(([count,direction])=>count!==2||direction!==0))
  throw Error('Mesh is open, non-manifold or has inconsistent face winding.');
 const visited=new Set([0]),queue=[0];
 for(let i=0;i<queue.length;i++)for(const next of neighbours[queue[i]])if(!visited.has(next)){visited.add(next);queue.push(next);}
 if(visited.size!==neighbours.length)throw Error('Mesh contains separate shells. Import one connected solid at a time.');
 if(Math.abs(volume)<1e-8)throw Error('Mesh has no closed volume.');
 return volume<0;
}

export function importedMeshRecipe(source,{unit='mm',up='Z',scale=1,rotation=0,x=0,z=0,previewOnly=false}={}){
 if(source?.version!==1||!Array.isArray(source.points)||source.points.length%3||
  !Array.isArray(source.triangles)||!source.triangles.length||source.triangles.length%3||source.triangles.length>LIMIT*3||
  source.points.length>LIMIT*9||!source.points.every(n=>Number.isFinite(n)&&Math.abs(n)<=1e7)||
  !source.triangles.every(i=>Number.isSafeInteger(i)&&i>=0&&i*3<source.points.length))
  throw Error('Invalid saved mesh data.');
 if(!['mm','cm','in'].includes(unit)||!['Y','Z'].includes(up)||![scale,rotation,x,z].every(Number.isFinite)||scale<=0)throw Error('Choose valid units, scale and placement.');
 const factor={mm:1,cm:10,in:25.4}[unit]*scale,angle=rotation*Math.PI/180;
 const cos=Math.cos(angle),sin=Math.sin(angle);
 const points=[],min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<source.points.length;i+=3){
  const a=source.points[i]*factor,b=source.points[i+1]*factor,c=source.points[i+2]*factor;
  const y=up==='Y'?b:c,d=up==='Y'?c:-b;
  const p=[a*cos-d*sin,y,a*sin+d*cos];
  for(let j=0;j<3;j++){min[j]=Math.min(min[j],p[j]);max[j]=Math.max(max[j],p[j]);points.push(p[j]);}
 }
 const bounds={width:max[0]-min[0],height:max[1]-min[1],depth:max[2]-min[2]};
 if(Object.values(bounds).some(n=>!Number.isFinite(n)||n>500)||Math.max(Math.abs(x),Math.abs(z))>250)
  throw Error('Mesh dimensions or placement exceed the 500 mm workspace limits.');
 for(let i=0;i<points.length;i+=3){
  points[i]+=(x-(min[0]+max[0])/2);points[i+1]-=min[1];points[i+2]+=(z-(min[2]+max[2])/2);
 }
 const triangles=[...source.triangles];let issue='';
 try{
  if(validateSolid(points,triangles))for(let i=0;i<triangles.length;i+=3)[triangles[i+1],triangles[i+2]]=[triangles[i+2],triangles[i+1]];
 }catch(error){if(!previewOnly)throw error;issue=error.message;}
 return {positive:[{kind:'mesh',mesh:{points,triangles}}],negative:[],secondary:[],bounds,warnings:issue?[issue]:[],meshIssue:issue};
}
