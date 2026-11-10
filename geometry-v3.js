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
  const spacing=Number(s.spacing??42)/100;
  const r=i===0?0:Math.sqrt((i+.15)/Math.max(1,n))*s.width*.34*(.42+spacing*1.15)*(s.pattern==='Dense Cluster'?.8:1);
  let x=Math.cos(theta)*r,z=Math.sin(theta)*r;
  if(s.pattern==='Fan'){x=(i/(Math.max(1,n-1))-.5)*s.width*.65;z=(rand()-.5)*s.width*.15}
  if(s.pattern==='Wall Growth'){x=(i/(Math.max(1,n-1))-.5)*s.width*.76;z=(rand()-.5)*s.width*.15}
  if(s.pattern==='Geode / Crescent'){const a=Math.PI*.12+(i/Math.max(1,n-1))*Math.PI*.9;x=Math.cos(a)*s.width*.32;z=Math.sin(a)*s.width*.23-s.width*.15}
  const factor=tier===0?.75+rand()*.25:tier===1?.40+rand()*.19:.19+rand()*.20;
  let family=s.familyMix==='Mixed'?families[Math.floor(rand()*families.length)]:s.familyMix;
  const randomAngle=Number(s.angleRandomness??32)/100;
  const lean=(s.pattern==='Fan'?.17:s.pattern==='Organic / Wild'?.25:.08)+randomAngle*.38;
  const randomDirection=theta+(rand()-.5)*randomAngle*Math.PI*1.55;
  out.push({id:'cr-'+i+'-'+Math.floor(rand()*1e6),name:'Crystal '+String(i+1).padStart(2,'0'),x,y:0,z,
    h:s.height*factor,r:Math.max(4,s.width/(Math.sqrt(n)*3.6))*(tier===0?1.25:tier===1?.87:.63)*(.84+rand()*.33),
    rotation:rand()*TAU,leanX:Math.cos(randomDirection)*lean*(.5+rand()*.7),leanZ:Math.sin(randomDirection)*lean*(.5+rand()*.7),
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
 // Child-friendly rounded cap: a spherical cap tangent to the pyramidal
 // flanks. The chosen radius is a REAL curvature radius in millimetres.
 // Unlike a tiny point fillet, its tangent starts BELOW the old sharp tip,
 // so there is no pointed nub and no abrupt, flat cut across the top.
 const slope=top/Math.max(1,tipH);
 const requested=Math.max(.3,Number(shape.tipRound??3));
 const maximal=Math.max(.3,tipH*slope*Math.sqrt(1+slope*slope)*.83);
 const capRadius=Math.min(requested,maximal);
 const tangentR=capRadius/Math.sqrt(1+slope*slope);
 const centreY=height-capRadius*Math.sqrt(1+slope*slope)/slope;
 const tangentY=centreY+capRadius*slope/Math.sqrt(1+slope*slope);
 // Remove the neck if a very small crystal would otherwise reverse order.
 const shoulderY=rings[rings.length-1][0][1];
 if(tangentY>shoulderY+.015){
   add(tangentY,tangentR);
   const startAngle=Math.atan2(tangentR,tangentY-centreY);
   const capSteps=Math.max(9,Math.min(20,Math.round(Number(shape.roundSteps||3)*2+7)));
   for(let k=1;k<capSteps;k++){
     const phi=startAngle*(1-k/capSteps);
     add(centreY+capRadius*Math.cos(phi),Math.max(.0005,capRadius*Math.sin(phi)));
   }
 }else{
   // Tiny crystals retain a compact rounded apex: do not add a sharp cone.
   add(Math.max(shoulderY+.1,height-.6),Math.min(top*.4,capRadius*.65));
 }
 // Final pole: triangular fans close a curved cap without making a flat
 // polygon at the very top. A tangent dome has zero radial width here.
 const apexY=centreY+capRadius;
 const n=rings[0].length;
 for(let r=0;r<rings.length-1;r++)for(let i=0;i<n;i++){const j=(i+1)%n;quad(rings[r][i],rings[r+1][i],rings[r+1][j],rings[r][j])}
 const base=rings[0],cap=rings[rings.length-1];
 const baseC=[0,0,0],tipC=[c.leanX*apexY,apexY,c.leanZ*apexY];
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

export function baseOutline(cs,s){
 const pts=[];
 for(const c of cs.filter(c=>!c.hidden)){
  const r=c.r*(c.shape?.bottomScale??s.bottomScale)*Math.max(c.sx||c.scale||1,c.sz||c.scale||1)+1;
  for(let k=0;k<6;k++){const a=c.rotation+k*TAU/6;pts.push([c.x+Math.cos(a)*r,c.z+Math.sin(a)*r])}
 }
 if(pts.length<3)return[];
 const outer=hull(pts),n=outer.length;
 const cx=outer.reduce((v,p)=>v+p[0],0)/n,cz=outer.reduce((v,p)=>v+p[1],0)/n;
 const margin=Math.max(1.25,Number(s.baseWidth??3)+1.25);
 const type=s.baseStyle||'Fitted';
 const bounds={minx:Math.min(...pts.map(p=>p[0])),maxx:Math.max(...pts.map(p=>p[0])),
               minz:Math.min(...pts.map(p=>p[1])),maxz:Math.max(...pts.map(p=>p[1]))};
 const x0=bounds.minx-margin,x1=bounds.maxx+margin,z0=bounds.minz-margin,z1=bounds.maxz+margin;
 if(type==='Square')return[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];
 if(type==='Circle'){
  const radius=Math.max(...pts.map(p=>Math.hypot(p[0]-cx,p[1]-cz)))+margin;
  return Array.from({length:40},(_,i)=>{const a=TAU*i/40;return[cx+Math.cos(a)*radius,cz+Math.sin(a)*radius]});
 }
 if(type==='Rounded'){
  const rad=Math.max(3,Math.min((x1-x0)*.28,(z1-z0)*.28,Number(s.baseWidth??3)+10));
  const out=[],corners=[[x1-rad,z0+rad,-Math.PI/2,0],[x1-rad,z1-rad,0,Math.PI/2],
    [x0+rad,z1-rad,Math.PI/2,Math.PI],[x0+rad,z0+rad,Math.PI,Math.PI*1.5]];
  for(const [x,z,start,end] of corners)for(let k=0;k<=7;k++){
    const a=start+(end-start)*k/7;out.push([x+Math.cos(a)*rad,z+Math.sin(a)*rad]);
  }
  return out;
 }
 if(type==='Organic'||type==='Crystal crust'){
  // Interpolate the convex footprint using a radial raycast from its centre.
  // All perturbations are outward, preserving room for the crystal roots.
  const result=[],count=type==='Organic'?42:48;
  for(let i=0;i<count;i++){
   const a=TAU*i/count,dx=Math.cos(a),dz=Math.sin(a);
   let distance=0;
   for(let j=0;j<outer.length;j++){
    const p=outer[j],q=outer[(j+1)%outer.length],ex=q[0]-p[0],ez=q[1]-p[1];
    const denom=dx*ez-dz*ex;
    if(Math.abs(denom)<1e-10)continue;
    const rx=p[0]-cx,rz=p[1]-cz;
    const t=(rx*ez-rz*ex)/denom;
    const u=(rx*dz-rz*dx)/denom;
    if(t>=0&&u>=-1e-7&&u<=1+1e-7)distance=Math.max(distance,t);
   }
   const wave=type==='Organic'?
      (Math.sin(a*5+s.seed*.13)+.5*Math.sin(a*11-s.seed*.17)+1.6)*margin*.20:
      (i%2===0?margin*.8:0);
   distance+=margin+wave;
   result.push([cx+dx*distance,cz+dz*distance]);
  }
  return result;
 }
 // Closely fitted faceted polygon follows the clustered footprint.
 return outer.map(p=>{const x=p[0]-cx,z=p[1]-cz,d=Math.hypot(x,z)||1;
   return[p[0]+x/d*margin,p[1]+z/d*margin]});
}

export function baseSurfaceHeight(cs,s,x,z){
 if(s.baseType==='none')return 0;
 const outline=baseOutline(cs,s),base=Math.max(3,Number(s.baseHeight)||3),dome=Math.max(0,Number(s.baseDome)||0);
 if(outline.length<3)return base;
 const edge=Math.min(Math.max(0,Number(s.baseEdgeRadius||0)),base*.55,Math.max(.1,Number(s.baseWidth||3)*.85));
 if(dome===0&&edge===0)return base;
 const n=outline.length,cx=outline.reduce((sum,p)=>sum+p[0]/n,0),cz=outline.reduce((sum,p)=>sum+p[1]/n,0);
 const vx=x-cx,vz=z-cz,dist=Math.hypot(vx,vz);if(dist<1e-8)return base+dome;
 let best=Infinity;
 // Ray/edge intersection gives the actual polyline radius in any direction.
 for(let k=0;k<n;k++){
  const p=outline[k],q=outline[(k+1)%n],ex=q[0]-p[0],ez=q[1]-p[1],det=vx*ez-vz*ex;
  if(Math.abs(det)<1e-12)continue;
  const rx=p[0]-cx,rz=p[1]-cz;
  const at=(rx*ez-rz*ex)/det,along=(rx*vz-rz*vx)/det;
  if(at>0&&along>=-1e-6&&along<=1+1e-6)best=Math.min(best,at);
 }
 if(!Number.isFinite(best))return base;
 const boundary=dist*best,topRadius=Math.max(.1,boundary-edge);
 if(edge>0&&dist>topRadius){
  const inset=Math.max(0,Math.min(edge,boundary-dist));
  return base-edge+Math.sqrt(Math.max(0,2*edge*inset-inset*inset));
 }
 const fraction=Math.min(1,Math.max(0,dist/topRadius));
 const v=fraction*6,k=Math.min(5,Math.floor(v)),f0=k/6,f1=(k+1)/6;
 return base+dome*(1-f0*f0)+(v-k)*dome*(f0*f0-f1*f1);
}
export function crystalRootOffset(cs,s,c){
 return s.baseType==='none'?0:baseSurfaceHeight(cs,s,c.x,c.z)-2.5;
}

export function baseAccentSpecs(cs,s){
 if(s.baseStyle!=='Crystal crust')return [];
 const outline=baseOutline(cs,s);if(outline.length<6)return [];
 const rng=seeded(Number(s.seed||42)+90173);
 const center=outline.reduce((v,p)=>[v[0]+p[0]/outline.length,v[1]+p[1]/outline.length],[0,0]);
 const n=Math.min(18,Math.max(8,Math.round(outline.length*.25))),out=[];
 for(let i=0;i<n;i++){
  const j=Math.floor((i+.5)*outline.length/n)%outline.length;
  const p=outline[j],k=.83+rng()*.08;
  const x=center[0]+(p[0]-center[0])*k,z=center[1]+(p[1]-center[1])*k;
  out.push({id:'base-accent-'+i,x,y:0,z,h:8+rng()*9,r:2.4+rng()*2.6,
    rotation:rng()*TAU,leanX:(rng()-.5)*.14,leanZ:(rng()-.5)*.14,
    family:'Quartz',scale:1,
    shape:{bottomScale:1,topScale:.68,cornerRadius:.15,tipLength:.29,tipFlat:.15,tipRound:.15,shoulderRound:0}
  });
 }return out;
}
export function baseGeometry(THREE,cs,s){
 const outline=baseOutline(cs,s),length=outline.length;
 if(length<3)return new THREE.BufferGeometry();
 const c=outline.reduce((sum,p)=>[sum[0]+p[0]/length,sum[1]+p[1]/length],[0,0]),a=[];
 const emit=(x,y,z)=>a.push(...x,...y,...z),quad=(p,q,r,t)=>{emit(p,q,r);emit(p,r,t)};
 const style=s.baseStyle||'Fitted',b=Math.max(3,s.baseHeight);
 // Crystal-crust top is a triangulated low-poly surface. Every second
 // perimeter vertex rises into a small rocky shard while retaining closure.
 const heights=outline.map((_,i)=>style==='Crystal crust'&&i%3===1?Math.min(3,(s.baseWidth||3)*.3+1):0);
 const top=outline.map((p,i)=>[p[0],b+heights[i],p[1]]);
 const bottom=outline.map(p=>[p[0],0,p[1]]);
 const dome=Math.max(0,Number(s.baseDome??0));
 // Real upper-edge fillet: lower wall, circular quarter-arc rings,
 // then domed top surface. No shader-only corner smoothing.
 const edge=Math.min(Math.max(0,Number(s.baseEdgeRadius||0)),b*.55,Math.max(.1,Number(s.baseWidth||3)*.85));
 let prev=outline.map((p,k)=>[p[0],b-edge+heights[k],p[1]]);
 for(let k=0;k<length;k++){
  const next=(k+1)%length;quad(bottom[k],prev[k],prev[next],bottom[next]);
 }
 if(edge>.001){
  for(let band=1;band<=6;band++){
   const angle=band*Math.PI/12, inset=edge*(1-Math.cos(angle)),y=b-edge+edge*Math.sin(angle);
   const ring=outline.map((p,k)=>{
    const dx=p[0]-c[0],dz=p[1]-c[1],d=Math.hypot(dx,dz)||1;
    return[p[0]-dx/d*inset,y+heights[k],p[1]-dz/d*inset];
   });
   for(let k=0;k<length;k++){const next=(k+1)%length;quad(prev[k],ring[k],ring[next],prev[next]);}
   prev=ring;
  }
 }
 const topOutline=prev.map(p=>[p[0],p[2]]);
 const centerTop=[c[0],b+dome,c[1]];
 for(let band=1;band<=5;band++){
  const fraction=1-band/6;
  const ring=topOutline.map(p=>[
   c[0]+(p[0]-c[0])*fraction,
   b+dome*(1-fraction*fraction),
   c[1]+(p[1]-c[1])*fraction
  ]);
  for(let k=0;k<length;k++){const next=(k+1)%length;quad(prev[k],ring[k],ring[next],prev[next]);}
  prev=ring;
 }
 for(let k=0;k<length;k++)emit(centerTop,prev[(k+1)%length],prev[k]);
 if(s.undersideAccess){
  const minR=Math.min(...outline.map(p=>Math.hypot(p[0]-c[0],p[1]-c[1])));
  const inward=Math.min(Math.max(2.5,s.wallThickness*2),minR*.40);
  const inner=outline.map(p=>{const x=p[0]-c[0],z=p[1]-c[1],d=Math.hypot(x,z)||1;return[p[0]-x/d*inward,0,p[1]-z/d*inward]});
  const roof=inner.map(p=>[p[0],Math.max(1,b-s.wallThickness*2),p[2]]);
  for(let i=0;i<length;i++){
   const j=(i+1)%length;
   quad(bottom[j],bottom[i],inner[i],inner[j]);
   quad(inner[i],roof[i],roof[j],inner[j]);
   emit([c[0],roof[i][1],c[1]],roof[i],roof[j]);
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
