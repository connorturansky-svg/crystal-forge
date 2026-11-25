// Three independently printable blind-bore clearance samples per seam axis.
// Same cylinder resolution, diameter, depth and stock allowance as registration.
export function makeRegisteredFitCoupons(wasm,assembly){
 const joints=assembly.joints||[],first=joints[0];
 if(!first)throw Error('Registered joints required for coupons.');
 const axes=[...new Set(joints.map(j=>j.axis))];
 if(joints.some(j=>!['x','z'].includes(j.axis)||j.diameter!==first.diameter||j.depth!==first.depth||j.diametralClearance!==first.diametralClearance||j.wall!==first.wall))throw Error('Unsupported mixed joint coupon dimensions.');
 const nominal=first.diametralClearance,values=[Math.max(.1,nominal-.1),nominal,Math.min(.6,nominal+.1)].map(v=>Math.round(v*100)/100);
 const clearances=[...new Set(values)],owned=[],hold=s=>(owned.push(s),s);
 try{
  return axes.flatMap(axis=>clearances.map(clearance=>{
   const r=(first.diameter+clearance)/2,side=2*(r+first.wall)+2,depth=first.depth+first.wall+1;
   const blank=hold(wasm.Manifold.cube(axis==='x'?[depth,side,side]:[side,side,depth]));
   const cut=hold(wasm.Manifold.cylinder(first.depth+.2,r,r,40));
   const oriented=axis==='x'?hold(cut.rotate([0,90,0])):cut;
   const cutter=hold(oriented.translate(axis==='x'?[-.2,side/2,side/2]:[side/2,side/2,-.2]));
   const body=hold(blank.subtract(cutter));
   if(body.isEmpty()||body.status()!=='NoError'||Math.abs(blank.volume()-body.volume()-cut.volume()*first.depth/(first.depth+.2))>.05)throw Error('Coupon bore could not be verified.');
   const box=body.boundingBox(),bounds=box.max.map((v,i)=>v-box.min[i]),mesh=body.getMesh(),p=mesh.vertProperties,points=new Float32Array(p.length/mesh.numProp*3);
   for(let i=0,j=0;i<p.length;i+=mesh.numProp,j+=3)points.set(p.subarray(i,i+3),j);
   return {id:'fit-'+axis+'-'+Math.round(clearance*100)+'hundredths',axis,diametralClearance:clearance,diameter:first.diameter,depth:first.depth,bounds,volume:body.volume(),mesh:{points,triangles:new Uint32Array(mesh.triVerts)}};
  }));
 }finally{for(const m of owned.reverse())m.delete();}
}
