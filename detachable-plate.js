/* Simple detachable mounting plate geometry plan.
 * A pair of blind M3 insert pockets in the main base lines up with
 * clearance holes in a separate printable plate. Bolts/inserts are NOT
 * printed and actual strength must be tested.
 */
const inside=(p,poly)=>{
 let yes=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)yes=!yes;
 }
 return yes;
};
export function planDetachablePlate(s,hardware){
 const plan={enabled:s.mount==='Detachable plate',valid:false,reasons:[],holes:[],bounds:null};
 if(!plan.enabled)return plan;
 if(s.baseType==='none'||s.baseVault||s.hollowCrystals){
  plan.reasons.push('Detachable plate requires a solid integrated base without vault/hollow mode.');
  return plan;
 }
 const holes=hardware.mounts||[],polygon=hardware.polygon||[];
 if(holes.length!==2){plan.reasons.push('Exactly two valid base insert pockets are required.');return plan}
 const x0=Math.min(...holes.map(h=>h.x))-10,x1=Math.max(...holes.map(h=>h.x))+10;
 const z0=Math.min(...holes.map(h=>h.z))-10,z1=Math.max(...holes.map(h=>h.z))+10;
 const midX=(x0+x1)/2,midZ=(z0+z1)/2;
 const minSize=26;
 const width=Math.max(minSize,x1-x0),depth=Math.max(minSize,z1-z0);
 const rectangle=[
  {x:midX-width/2,z:midZ-depth/2},{x:midX+width/2,z:midZ-depth/2},
  {x:midX+width/2,z:midZ+depth/2},{x:midX-width/2,z:midZ+depth/2}
 ];
 if(!rectangle.every(p=>inside(p,polygon))){
  plan.reasons.push('A plate large enough for the paired fixing pockets would extend outside the base outline; reduce hole spacing or enlarge the base.');
  return plan;
 }
 if(holes.some(h=>h.radius<1.6||h.radius>3.5)){
  plan.reasons.push('Mating holes must be sized for the designated M3 insert and bolt clearance.');return plan;
 }
 return {...plan,valid:true,holes:holes.map(h=>({x:h.x-midX,z:h.z-midZ})),
  bounds:{width,depth,thickness:Math.max(3,Math.min(8,Number(s.plateThickness)||4)),centreX:midX,centreZ:midZ},
  note:'Separate plate has matching M3 clearance bores. The base has nominal blind insert pockets; install real M3 inserts and bolts.'};
}
