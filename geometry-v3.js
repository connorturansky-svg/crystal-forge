/* Crystal Forge v0.3 — explicit, deliberately faceted mesh geometry.
 * All dimensions are millimetres. Components are closed, but overlapping
 * crystal/base shells are NOT a validated Boolean union (see UI warnings).
 */
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function seeded(seed){let x=(Number(seed)|0)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
export const families=['Quartz','Shard','Blade','Cubic','Double terminated','Fantasy'];
export const patterns=['Central Spire','Dense Cluster','Fan','Geode / Crescent','Wall Growth','Organic / Wild'];
export function generateFormation(s){
 const rand=seeded(s.seed),n=s.count,large=Math.max(1,Math.round(n*.20)),medium=Math.max(1,Math.round(n*.32));
 const out=[];
 for(let i=0;i<n;i++){
  const tier=i<large?0:i<large+medium?1:2,theta=i===0?0:i*2.39996323+(rand()-.5)*.38;
  const r=i===0?0:Math.sqrt((i+.15)/Math.max(1,n))*s.width*.34*(s.pattern==='Dense Cluster'?.8:1);
  let x=Math.cos(theta)*r,z=Math.sin(theta)*r;
  if(s.pattern==='Fan'){x=(i/(Math.max(1,n-1))-.5)*s.width*.65;z=(rand()-.5)*s.width*.15}
  if(s.pattern==='Wall Growth'){x=(i/(Math.max(1,n-1))-.5)*s.width*.76;z=(rand()-.5)*s.width*.15}
  if(s.pattern==='Geode / Crescent'){const a=Math.PI*.12+(i/Math.max(1,n-1))*Math.PI*.9;x=Math.cos(a)*s.width*.32;z=Math.sin(a)*s.width*.23-s.width*.15}
  const factor=tier===0?.75+rand()*.25:tier===1?.40+rand()*.19:.19+rand()*.20;
  let family=s.familyMix==='Mixed'?families[Math.floor(rand()*families.length)]:s.familyMix;
  const lean=s.pattern==='Fan'?.22:s.pattern==='Organic / Wild'?.28:.10;
  out.push({id:'cr-'+i+'-'+Math.floor(rand()*1e6),name:'Crystal '+String(i+1).padStart(2,'0'),x,y:0,z,
    h:s.height*factor,r:Math.max(4,s.width/(Math.sqrt(n)*3.6))*(tier===0?1.25:tier===1?.87:.63)*(.84+rand()*.33),
    rotation:rand()*TAU,leanX:Math.cos(theta)*lean,leanZ:Math.sin(theta)*lean,
    family,locked:false,hidden:false,scale:1});
 }
 return out;
}
function meshFromTriangles(THREE,triangles){
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(triangles,3));
 g.computeVertexNormals();return g;
}
export function crystalGeometry(THREE,c,s){
 const shape={...s,...(c.shape||{})};
 const a=[],sides=c.family==='Cubic'?4:c.family==='Blade'?5:c.family==='Fantasy'?7:6;
 const height=Math.max(8,c.h),b=Math.max(1,c.r*shape.bottomScale),top=Math.max(1,c.r*shape.topScale);
 const tipH=height*(c.family==='Cubic'?.10:c.family==='Blade'?.43:c.family==='Shard'?.48:shape.tipLength);
 const neck=height-tipH,steps=Math.max(2,shape.roundSteps|0);
 const emit=(p,q,r)=>a.push(...p,...q,...r),quad=(p,q,r,t)=>{emit(p,q,r);emit(p,r,t)};
 function ring(y,radius){
  const pts=[],round=clamp(shape.cornerRadius,0,radius*.31),d=Math.max(0,y);
  for(let i=0;i<sides;i++){
    const angle=TAU*i/sides,pre=angle-TAU/sides,next=angle+TAU/sides;
    const pt=[Math.cos(angle)*radius,Math.sin(angle)*radius];
    if(round<=.001){pts.push([pt[0]+c.leanX*d,y,pt[1]+c.leanZ*d]);continue}
    const prev=[Math.cos(pre)*radius,Math.sin(pre)*radius],after=[Math.cos(next)*radius,Math.sin(next)*radius];
    function norm(v){const len=Math.hypot(...v)||1;return v.map(x=>x/len)}
    const u=norm([prev[0]-pt[0],prev[1]-pt[1]]),v=norm([after[0]-pt[0],after[1]-pt[1]]);
    const interior=Math.PI-TAU/sides,travel=round/Math.tan(interior/2),mid=norm([u[0]+v[0],u[1]+v[1]]);
    const center=[pt[0]+mid[0]*round/Math.sin(interior/2),pt[1]+mid[1]*round/Math.sin(interior/2)];
    const start=Math.atan2(pt[1]+u[1]*travel-center[1],pt[0]+u[0]*travel-center[0]);
    const end=Math.atan2(pt[1]+v[1]*travel-center[1],pt[0]+v[0]*travel-center[0]);
    const sweep=(end-start+TAU)%TAU;
    for(let k=0;k<=steps;k++){const t=start+sweep*k/steps;
      pts.push([center[0]+Math.cos(t)*round+c.leanX*d,y,center[1]+Math.sin(t)*round+c.leanZ*d])
    }
  }return pts;
 }
 const rings=[];
 function add(y,r){if(rings.length&&y<=rings[rings.length-1][0][1]+.01)return;rings.push(ring(y,r))}
 const rootRound=Math.min(shape.cornerRadius*.5,Math.max(.0,height*.02));
 add(0,Math.max(.8,b-rootRound));if(rootRound>.05)add(rootRound,b);
 add(neck,top);
 // A deliberate *small* shoulder bevel, independent of side corner radius.
 if(shape.shoulderRound>.01){
   rings.pop();
   const d=clamp(shape.shoulderRound,.02,Math.min(neck*.1,tipH*.15));
   add(neck-d,top+(b-top)*d/Math.max(.01,neck));
   add(neck,top);
   add(neck+d,top*(1-d/tipH));
 }
 const tipFlat=Math.max(.05,Math.min(shape.tipFlat*.5,top*.45)); // UI is diameter; ring expects radius
 if(tipH>.1)add(height,tipFlat);
 const n=rings[0].length;
 for(let r=0;r<rings.length-1;r++)for(let i=0;i<n;i++){const j=(i+1)%n;quad(rings[r][i],rings[r+1][i],rings[r+1][j],rings[r][j])}
 const base=rings[0],cap=rings[rings.length-1];
 const baseC=[0,0,0],tipC=[c.leanX*height,height,c.leanZ*height];
 for(let i=0;i<n;i++){const j=(i+1)%n;emit(baseC,base[i],base[j]);emit(tipC,cap[j],cap[i])}
 return meshFromTriangles(THREE,a);
}
function hull(points){
 const pts=points.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 if(pts.length<=2)return pts;
 const det=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
 const lo=[],hi=[];
 for(const p of pts){while(lo.length>1&&det(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p)}
 for(let i=pts.length-1;i>=0;i--){const p=pts[i];while(hi.length>1&&det(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p)}
 lo.pop();hi.pop();return lo.concat(hi);
}
export function baseGeometry(THREE,cs,s){
 const points=[];for(const c of cs.filter(c=>!c.hidden)){
  const r=c.r*(c.shape?.bottomScale??s.bottomScale)*Math.max(c.sx||c.scale||1,c.sz||c.scale||1)+1.8;
  for(let k=0;k<6;k++){const a=c.rotation+k*TAU/6;points.push([c.x+Math.cos(a)*r,c.z+Math.sin(a)*r])}
 }
 if(points.length<3)return new THREE.BufferGeometry();
 const outline=hull(points),length=outline.length,c=outline.reduce((sum,p)=>[sum[0]+p[0]/length,sum[1]+p[1]/length],[0,0]),a=[];
 const emit=(x,y,z)=>a.push(...x,...y,...z),quad=(p,q,r,t)=>{emit(p,q,r);emit(p,r,t)};
 function ring(y,dist){
  return outline.map(p=>{const vx=p[0]-c[0],vz=p[1]-c[1],d=Math.hypot(vx,vz)||1;return[p[0]+vx/d*dist,y,p[1]+vz/d*dist]})
 }
 const b=Math.max(3,s.baseHeight),top=ring(b,2),bottom=ring(0,2.5),centerTop=[c[0],b,c[1]];
 for(let i=0;i<length;i++){const j=(i+1)%length;emit(centerTop,top[j],top[i]);quad(bottom[i],top[i],top[j],bottom[j])}
 if(s.undersideAccess){
  const margin=Math.min(Math.max(2.4,s.wallThickness*2),Math.min(...outline.map(p=>Math.hypot(p[0]-c[0],p[1]-c[1])))*.38);
  const inner=ring(0,-margin),ceiling=ring(Math.max(1,b-s.wallThickness*2),-margin-.2);
  for(let i=0;i<length;i++){
   const j=(i+1)%length;
   quad(bottom[j],bottom[i],inner[i],inner[j]);
   quad(inner[i],ceiling[i],ceiling[j],inner[j]);
   emit([c[0],ceiling[i][1],c[1]],ceiling[i],ceiling[j]);
  }
 }else{
  const bottomCenter=[c[0],0,c[1]];
  for(let i=0;i<length;i++)emit(bottomCenter,bottom[i],bottom[(i+1)%length]);
 }
 return meshFromTriangles(THREE,a);
}
export function exportSTL(THREE,objects,filename='crystal-forge.stl'){
 const list=[],t=new THREE.Vector3();
 for(const obj of objects){
  if(!obj.visible||!obj.geometry?.attributes?.position)continue;
  obj.updateMatrixWorld(true);
  const pos=obj.geometry.attributes.position;
  for(let i=0;i<pos.count;i+=3){
   const v=[0,1,2].map(j=>t.fromBufferAttribute(pos,i+j).applyMatrix4(obj.matrixWorld).clone());
   const n=new THREE.Vector3().subVectors(v[1],v[0]).cross(new THREE.Vector3().subVectors(v[2],v[0])).normalize();
   list.push([n,...v]);
  }
 }
 const out=new ArrayBuffer(84+list.length*50),dv=new DataView(out);dv.setUint32(80,list.length,true);let off=84;
 for(const row of list){for(const v of row)for(const val of [v.x,v.y,v.z]){dv.setFloat32(off,val,true);off+=4}dv.setUint16(off,0,true);off+=2}
 const url=URL.createObjectURL(new Blob([out],{type:'model/stl'}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
 return list.length;
}
