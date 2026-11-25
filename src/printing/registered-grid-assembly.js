// Conservative automatic registered grid assembly. Y-up source coordinates.
// No source mutation, no partial result, no physical fit or loading claim.
const finite=Number.isFinite;
const axisIndex={x:0,z:2};
const fail=message=>{throw Error(message);};
function solid(part,label){
 if(part.isEmpty()||!part.numTri()||!['NoError','no-error','Success',0].includes(part.status()))fail(label+' is not a valid closed solid.');
}
function limits(plan){
 if(!plan?.ready||!plan.needed||!Array.isArray(plan.cutsX)||!Array.isArray(plan.cutsZ)||!Array.isArray(plan.printerLimit)||plan.printerLimit.length!==3||!plan.printerLimit.every(v=>finite(v)&&v>0)||![plan.usableX,plan.usableZ].every(v=>finite(v)&&v>0))fail('A valid bed split plan is required.');
 for(const cuts of [plan.cutsX,plan.cutsZ])if(cuts.some((v,i)=>!finite(v)||(i&&v<=cuts[i-1])))fail('Cut planes must be finite, unique and ordered.');
 const count=(plan.cutsX.length+1)*(plan.cutsZ.length+1);
 if(count!==plan.pieceCount||count<2||count>16)fail('Expected two to sixteen grid cells.');
}
function raw(part){
 const mesh=part.getMesh(),p=mesh.vertProperties,points=new Float32Array(p.length/mesh.numProp*3);
 for(let i=0,j=0;i<p.length;i+=mesh.numProp,j+=3)points.set(p.subarray(i,i+3),j);
 return {points,triangles:new Uint32Array(mesh.triVerts)};
}
const size=box=>box.max.map((v,i)=>v-box.min[i]);
const cell=(point,cuts)=>cuts.filter(v=>point>v).length;
const id=(x,z)=>'part-X'+(x+1)+'-Z'+(z+1);
export function createRegisteredGridAssembly(wasm,mesh,plan,{diameter=5,depth=7,clearance=.25,wall=2,maxJointY=Infinity}={}){
 limits(plan);
 if(!mesh?.points?.length||!mesh?.triangles?.length||mesh.points.length%3||mesh.triangles.length%3||!Array.from(mesh.points).every(finite))fail('Prepared mesh required.');
 if(![diameter,depth,clearance,wall].every(finite)||diameter<3||diameter>8||depth<3||depth>12||clearance<.1||clearance>.6||wall<2||wall>5)fail('Choose supported registration dimensions.');
 if(maxJointY!==Infinity&&(!finite(maxJointY)||maxJointY<=0))fail('Invalid registration height limit.');
 const owned=[],hold=v=>(owned.push(v),v);
 const single=(body,label)=>{solid(body,label);const bodies=body.decompose().map(hold);if(bodies.length!==1)fail(label+' has disconnected stock.');};
 const radius=(diameter+clearance)/2,guard=radius+wall;
 const cylinder=(axis,cut,y,across,r,half)=>hold(wasm.Manifold.cylinder(half*2,r,r,40).rotate(axis==='x'?[0,90,0]:[0,0,0]).translate(axis==='x'?[cut-half,y,across]:[across,y,cut-half]));
 const close=(actual,wanted)=>Math.abs(actual-wanted)<=Math.max(.02,wanted*.0005);
 try{
  const input=new wasm.Mesh({numProp:3,vertProperties:new Float32Array(mesh.points),triVerts:new Uint32Array(mesh.triangles)});input.merge();
  const source=hold(new wasm.Manifold(input));single(source,'Source');
  let bodies=[source];
  for(const [axis,cuts] of [['x',plan.cutsX],['z',plan.cutsZ]])for(const cut of cuts){
   const i=axisIndex[axis],next=[];
   for(const part of bodies){
    const b=part.boundingBox();
    if(cut<=b.min[i]+.001||cut>=b.max[i]-.001){next.push(part);continue;}
    next.push(...part.splitByPlane(axis==='x'?[1,0,0]:[0,0,1],cut).map(hold).filter(p=>!p.isEmpty()));
   }
   bodies=next;
  }
  if(bodies.length!==plan.pieceCount||!close(bodies.reduce((v,b)=>v+b.volume(),0),source.volume()))fail('Grid has empty cells or changed source volume; redesign or use unregistered splitting.');
  const parts=new Map();
  for(const body of bodies){
   single(body,'Grid part');
   const box=body.boundingBox(),mid=box.min.map((v,i)=>(v+box.max[i])/2),x=cell(mid[0],plan.cutsX),z=cell(mid[2],plan.cutsZ),key=id(x,z);
   const [w,h,d]=size(box);
   if(parts.has(key)||w>plan.usableX+.01||d>plan.usableZ+.01||h>plan.printerLimit[2]+.01)fail('Invalid or oversize grid cell '+key);
   parts.set(key,{body,box,x,z,key});
  }
  const joints=[],pins=[];
  // Each occupied neighbouring cell pair gets exactly two matching sockets.
  // Whole stock envelopes are checked against both current parts, including
  // previously accepted bores, so later joints cannot intersect them.
  for(const left of [...parts.values()].sort((a,b)=>a.x-b.x||a.z-b.z)){
   for(const axis of ['x','z']){
    const right=parts.get(id(left.x+(axis==='x'?1:0),left.z+(axis==='z'?1:0)));
    if(!right)continue;
    const cut=axis==='x'?plan.cutsX[left.x]:plan.cutsZ[left.z],i=axisIndex[axis],j=i===0?2:0;
    const lo=Math.max(left.box.min[j],right.box.min[j])+guard,hi=Math.min(left.box.max[j],right.box.max[j])-guard;
    const ylo=Math.max(left.box.min[1],right.box.min[1])+guard,yhi=Math.min(left.box.max[1],right.box.max[1],maxJointY)-guard;
    if(hi<lo||yhi<ylo||left.box.min[i]>cut-depth-wall||right.box.max[i]<cut+depth+wall)fail('Insufficient joint stock at '+left.key+' / '+right.key);
    const samples=(a,b,n)=>Array.from({length:n},(_,k)=>a+(b-a)*(k+.5)/n);
    const positions=[];
    for(const y of samples(ylo,yhi,3))for(const across of samples(lo,hi,11)){
     if(positions.length===2)break;
     if(positions.some(p=>Math.hypot(p.y-y,p.across-across)<2*guard))continue;
     const envelope=cylinder(axis,cut,y,across,guard,depth+wall);
     const l=hold(left.body.intersect(envelope)),rr=hold(right.body.intersect(envelope));
     if(!close(l.volume(),envelope.volume()/2)||!close(rr.volume(),envelope.volume()/2))continue;
     const cutter=cylinder(axis,cut,y,across,radius,depth);
     const a=hold(left.body.subtract(cutter)),b=hold(right.body.subtract(cutter));
     single(a,'Registered left part');single(b,'Registered right part');
     if(!close(left.body.volume()-a.volume(),cutter.volume()/2)||!close(right.body.volume()-b.volume(),cutter.volume()/2))fail('Socket subtraction did not match the verified bore.');
     left.body=a;right.body=b;
     const name='joint-'+String(joints.length+1).padStart(2,'0');
     const pin=hold(wasm.Manifold.cylinder(2*depth-.5,diameter/2,diameter/2,40));single(pin,'Separate dowel');
     joints.push({id:name,parts:[left.key,right.key],axis,cut,y,across,diameter,depth,diametralClearance:clearance,pinLength:2*depth-.5,wall});
     pins.push({id:name+'-dowel',mesh:raw(pin),volume:pin.volume()});positions.push({y,across});
    }
    if(positions.length!==2)fail('Could not verify two independent mating sockets at '+left.key+' / '+right.key+'. No registered assembly exported.');
   }
  }
  return {parts:[...parts.values()].map(p=>({id:p.key,mesh:raw(p.body),bounds:size(p.body.boundingBox()),volume:p.body.volume()})),pins,joints,
   manifest:{schema:1,coordinateSystem:'model Y-up',registration:'software-verified stock and bore subtraction; physical fit unverified',physicalFitVerified:false,printerLimit:plan.printerLimit.slice(),rotatedOnBed:!!plan.rotatedOnBed,parts:[...parts.keys()],joints}};
 }finally{for(const part of owned.reverse())try{part.delete();}catch{}}
}
