/* Conservative, deterministic upright bed-aware split planning.
 * Mesh is in Three.js Y-up coordinates. Printer X/Y = model X/Z, and printer Z = model Y.
 * This plans straight grid cuts only: joint design and mechanical retention are NOT verified.
 */
const extent=(points,axis)=>{
 let lo=Infinity,hi=-Infinity;
 for(let i=axis;i<points.length;i+=3){const n=Number(points[i]);if(!Number.isFinite(n))throw Error('Nonfinite manufacturing mesh coordinate');lo=Math.min(lo,n);hi=Math.max(hi,n)}
 return {min:lo,max:hi,size:hi-lo};
};
export function planBedAwareSplit(report,{clearanceMm=8,maxPieces=16}={}){
 const points=report?.mesh?.points,limit=report?.printerLimit;
 if(!points?.length||points.length%3!==0||!Array.isArray(limit)||limit.length!==3)
  return {ready:false,reason:'Prepare a Manifold mesh for a supported printer before automatic splitting.'};
 const x=extent(points,0),y=extent(points,1),z=extent(points,2);
 const clearance=Math.max(2,Math.min(25,Number(clearanceMm)||8));
 const options=[
  {rotatedOnBed:false,usableX:limit[0]-clearance,usableZ:limit[1]-clearance},
  {rotatedOnBed:true,usableX:limit[1]-clearance,usableZ:limit[0]-clearance}
 ].filter(v=>v.usableX>10&&v.usableZ>10).map(v=>({...v,
  nx:Math.max(1,Math.ceil((x.size-.0001)/v.usableX)),
  nz:Math.max(1,Math.ceil((z.size-.0001)/v.usableZ))}));
 if(!options.length)return {ready:false,reason:'Selected printer has insufficient build area.'};
 if(y.size>Number(limit[2])-.1)
  return {ready:false,reason:'Cluster is '+y.size.toFixed(1)+' mm tall, exceeding the '+limit[2]+' mm printer height. Upright XY splitting cannot solve this; redesign or use a taller printer.'};
 options.sort((a,b)=>a.nx*a.nz-b.nx*b.nz||Number(a.rotatedOnBed)-Number(b.rotatedOnBed));
 const choice=options[0],pieceCount=choice.nx*choice.nz;
 if(pieceCount>maxPieces)return {ready:false,reason:'Automatic split needs '+pieceCount+' pieces (maximum '+maxPieces+'). Reduce the model footprint or choose a larger bed.'};
 const cutsX=Array.from({length:choice.nx-1},(_,i)=>x.min+x.size*(i+1)/choice.nx);
 const cutsZ=Array.from({length:choice.nz-1},(_,i)=>z.min+z.size*(i+1)/choice.nz);
 return {ready:true,needed:pieceCount>1,pieceCount,cutsX,cutsZ,rotatedOnBed:choice.rotatedOnBed,
  clearanceMm:clearance,usableX:choice.usableX,usableZ:choice.usableZ,
  bounds:{x,z,height:y.size},printerLimit:limit,
  warning:'Straight planar splits have no automatic mating connectors. Use suitable independently tested joining, registration and retention; inspect every part in Cura.'};
}
