/* Semicircular perimeter fixing ears for bolts / cable ties.
 * Pure layout: exact planned positions are reused by Build guides and Manifold.
 */
const hypot=(x,z)=>Math.hypot(x,z);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function planEdgeTabs(polygon,s,existing=[],clearance=2.5){
 const manual=Array.isArray(s.manualEdgeTabs)?s.manualEdgeTabs:null;
  const requested=manual?Math.min(24,manual.length):clamp(Math.round(Number(s.tabCount)||4),1,24);
 const holesEach=clamp(Math.round(Number(s.tabHolesPerTab)||2),1,6);
 const holeDiameter=clamp(Number(s.tabHoleDiameter)||4.5,1.8,16);
 const thickness=clamp(Number(s.tabThickness)||5,2.5,15);
 const web=clamp(Number(s.tabWall)||3,2,8);
 const tabHoles=[],tabs=[],messages=[];
 if(polygon.length<3)return {tabs,tabHoles,requested,holesEach,messages:['Edge tabs require an integrated base.'],skipped:requested};
 const edges=[],signed=polygon.reduce((sum,p,i)=>{
  const q=polygon[(i+1)%polygon.length];return sum+p.x*q.z-q.x*p.z;
 },0);
 let perimeter=0;
 for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length],dx=b.x-a.x,dz=b.z-a.z,len=hypot(dx,dz);
  if(len<1e-5)continue;
  const tangent={x:dx/len,z:dz/len},normal=signed>=0?
    {x:tangent.z,z:-tangent.x}:{x:-tangent.z,z:tangent.x};
  edges.push({a,tangent,normal,len,start:perimeter});
  perimeter+=len;
 }
 if(perimeter<10)return {tabs,tabHoles,requested,holesEach,messages:['The base outline is too small for fixing tabs.'],skipped:requested};
 const rHole=holeDiameter/2,pitch=holeDiameter+web;
 const halfspan=(holesEach-1)*pitch/2,normalOffset=rHole+web+.35;
 const radius=Math.max(6,Math.hypot(halfspan,normalOffset)+rHole+web);
 const candidateHoles=(origin,edge,index)=>{
  const holes=[];
  for(let k=0;k<holesEach;k++){
   const offset=(k-(holesEach-1)/2)*pitch;
   holes.push({x:origin.x+edge.normal.x*normalOffset+edge.tangent.x*offset,
    z:origin.z+edge.normal.z*normalOffset+edge.tangent.z*offset,
    radius:rHole,diameter:holeDiameter,depth:thickness,kind:'tab-hole',
    tabIndex:index,holeIndex:k,label:'Edge tab '+(index+1)+' hole '+(k+1)});
  }
  return holes;
 };
 for(let i=0;i<requested;i++){
  const distance=perimeter*(manual?clamp(Number(manual[i]?.u)||0,0,.999999):(i+.5)/requested);
  const edge=edges.find(e=>distance<=e.start+e.len+1e-6)||edges.at(-1);
  const t=clamp((distance-edge.start)/edge.len,0,1);
  const centre={x:edge.a.x+edge.tangent.x*t*edge.len,z:edge.a.z+edge.tangent.z*t*edge.len};
  const candidates=candidateHoles(centre,edge,i);
  const intersectsTab=tabs.some(t=>hypot(t.x-centre.x,t.z-centre.z)<(t.radius+radius)*.9);
  const intersectsHoles=[...existing,...tabHoles].some(p=>candidates.some(h=>
    hypot(p.x-h.x,p.z-h.z)<p.radius+h.radius+clearance));
  if(intersectsTab||intersectsHoles)continue;
  tabs.push({...centre,radius,thickness,holeCount:holesEach,index:i});
  tabHoles.push(...candidates);
 }
 if(tabs.length<requested)messages.push('Only '+tabs.length+' of '+requested+' edge tabs fit without overlapping other tabs or holes. Move/remove conflicting tabs or reduce hole sizes.');
 return {tabs,tabHoles,requested,holesEach,skipped:requested-tabs.length,messages};
}

/** Find the closest perimeter position for draggable tabs, never placing a tab inside the base. */
export function nearestEdgePosition(polygon,point){
 let total=0,best={u:0,x:0,z:0,distance:Infinity};
 const perimeter=polygon.reduce((sum,a,i)=>sum+hypot(polygon[(i+1)%polygon.length].x-a.x,polygon[(i+1)%polygon.length].z-a.z),0);
 for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length],dx=b.x-a.x,dz=b.z-a.z,len=hypot(dx,dz);
  if(len<=1e-6)continue;
  const t=clamp(((point.x-a.x)*dx+(point.z-a.z)*dz)/(len*len),0,1);
  const x=a.x+t*dx,z=a.z+t*dz,d=hypot(point.x-x,point.z-z);
  if(d<best.distance)best={u:clamp((total+len*t)/perimeter,0,.999999),x,z,distance:d};
  total+=len;
 }
 return best;
}
