/* Conservative zero-infill roof-span indicator (NOT G-code bridge analysis).
 * A largest-inscribed-circle proxy over the XY base footprint helps reveal
 * designs with large unsupported regions before a Cura layer inspection.
 */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const near=(p,a,b)=>{
 const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);
 return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);
};
const inside=(p,polygon)=>{
 let hit=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];
  if(((a.z>p.z)!==(b.z>p.z))&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)hit=!hit;
 }
 return hit;
};
export function estimateRoofReview(polygon=[],settings={},vault={}){
 if(!polygon.length||settings.baseType==='none')
  return {estimateMm:0,method:'No base',needsCura:true};
 if(vault.applied&&Number.isFinite(vault.gapEstimate))
  return {estimateMm:Math.max(0,vault.gapEstimate),method:'Buttress-spacing proxy',needsCura:true};
 const minX=Math.min(...polygon.map(p=>p.x)),maxX=Math.max(...polygon.map(p=>p.x));
 const minZ=Math.min(...polygon.map(p=>p.z)),maxZ=Math.max(...polygon.map(p=>p.z));
 if(maxX-minX<1||maxZ-minZ<1)return {estimateMm:0,method:'Degenerate footprint',needsCura:true};
 let inradius=0;
 // Coarse conservative 2D proxy; not a print-bead, top-skin or bridge solver.
 const steps=24;
 for(let i=0;i<=steps;i++)for(let j=0;j<=steps;j++){
  const p={x:minX+(maxX-minX)*i/steps,z:minZ+(maxZ-minZ)*j/steps};
  if(!inside(p,polygon))continue;
  let nearest=Infinity;
  for(let k=0;k<polygon.length;k++)nearest=Math.min(nearest,near(p,polygon[k],polygon[(k+1)%polygon.length]));
  inradius=Math.max(inradius,nearest);
 }
 return {estimateMm:Math.round(inradius*20)/10,method:'Zero-infill 2D footprint proxy',needsCura:true};
}
