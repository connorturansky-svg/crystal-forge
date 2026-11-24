/* Mechanical split-key placement, experimental and conservative.
 * Plan detachable dowels across the split plane only inside a thick solid
 * integrated plinth with a validated clear footprint.
 */
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const inside=(p,poly)=>{
 let hit=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if(((a.z>p.z)!==(b.z>p.z))&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)hit=!hit;
 }
 return hit;
};
export function planSplitJoints(settings={},hardware={},cutX=0){
 const s=settings,requested=!!s.splitAlignment,points=[],messages=[];
 if(!requested)return {enabled:false,points,messages};
 if(s.baseType==='none'||s.baseVault||s.hollowCrystals||Number(s.baseHeight)<14){
  messages.push('Alignment pins require a solid integrated base at least 14 mm high, without a vault or whole-cluster hollowing.');
  return {enabled:true,points,messages};
 }
 const polygon=hardware.polygon||[],spanZ=polygon.length?Math.max(...polygon.map(p=>p.z))-Math.min(...polygon.map(p=>p.z)):0;
 if(spanZ<28){messages.push('Base too narrow for two safely spaced alignment holes.');return {enabled:true,points,messages}}
 const minZ=Math.min(...polygon.map(p=>p.z)),maxZ=Math.max(...polygon.map(p=>p.z));
 const diameter=Math.max(3,Math.min(8,Number(s.splitPinDiameter)||5));
 const depth=Math.max(3,Math.min(12,Number(s.splitPinDepth)||7));
 const clearance=Math.max(.1,Math.min(.6,Number(s.splitPinClearance)||.25));
 const radius=(diameter+clearance)/2,midZ=(minZ+maxZ)/2;
 const positions=[midZ-spanZ*.25,midZ+spanZ*.25];
 for(const z of positions){
  const centre={x:Number(cutX)||0,z},probe={x:centre.x+radius+2,z};
  if(!inside(centre,polygon)||!inside(probe,polygon)||!inside({x:centre.x-radius-2,z},polygon)){
   messages.push('Skipped one dowel: cut plane too close to perimeter.');continue;
  }
  if([...(hardware.sockets||[]),...(hardware.mounts||[])].some(h=>dist(h,centre)<Number(h.radius||0)+radius+2)){
   messages.push('Skipped one dowel: intersects LED or mounting hole.');continue;
  }
  points.push({x:centre.x,z,y:Math.min(Number(s.baseHeight)*.48,10),diameter,depth,clearance});
 }
 if(!points.length)messages.push('No safe dowel positions. Split parts will export without connector holes.');
 return {enabled:true,points,messages,diameter,depth,clearance};
}
