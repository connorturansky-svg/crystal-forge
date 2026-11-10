/* Crystal Forge v0.3 — explicit, deliberately faceted mesh geometry.
 * All dimensions are millimetres. Components are closed, but overlapping
 * crystal/base shells are NOT a validated Boolean union (see UI warnings).
 */
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function seeded(seed){let x=(Number(seed)|0)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
export const families=['Quartz','Shard','Blade','Cubic','Double terminated','Fantasy'];
export const patterns=['Central Spire','Dense Cluster','Fan','Geode / Crescent','Wall Growth','Organic / Wild'];
export const leanModes=['Organic / natural','One direction','Criss-cross','Radial outward','Radial inward'];
export function generateFormation(s){
 const rand=seeded(s.seed),n=Math.max(1,Math.round(s.count||1)),
  large=Math.max(1,Math.round(n*.20)),medium=Math.max(1,Math.round(n*.32));
 const out=[],spacing=clamp(Number(s.spacing??42)/100,0,1),
  randomness=clamp(Number(s.angleRandomness??32)/100,0,1),
  amount=clamp(Number(s.leanAmount??35)/100,0,1),
  leanMode=s.leanMode||'Organic / natural';
 for(let i=0;i<n;i++){
  const tier=i<large?0:i<large+medium?1:2,theta=i===0?0:i*2.39996323+(rand()-.5)*.38;
  const radialSpread=.16+5.5*Math.pow(spacing,1.65);
  const r=i===0?0:Math.sqrt((i+.15)/n)*s.width*.34*radialSpread*(s.pattern==='Dense Cluster'?.8:1);
  let x=Math.cos(theta)*r,z=Math.sin(theta)*r;
  if(s.pattern==='Fan'){x=(i/Math.max(1,n-1)-.5)*s.width*.65*radialSpread;z=(rand()-.5)*s.width*.15*radialSpread}
  if(s.pattern==='Wall Growth'){x=(i/Math.max(1,n-1)-.5)*s.width*.76*radialSpread;z=(rand()-.5)*s.width*.15*radialSpread}
  if(s.pattern==='Geode / Crescent'){
   const a=Math.PI*.12+(i/Math.max(1,n-1))*Math.PI*.9;
   x=Math.cos(a)*s.width*.32*radialSpread;z=(Math.sin(a)*s.width*.23-s.width*.15)*radialSpread;
  }
  const factor=tier===0?.75+rand()*.25:tier===1?.40+rand()*.19:.19+rand()*.20;
  const family=s.familyMix==='Mixed'?families[Math.floor(rand()*families.length)]:s.familyMix;
  const centreAngle=Math.atan2(z,x)||theta;
  const heading=leanMode==='One direction'?0:
   leanMode==='Criss-cross'?(i%2===0?0:Math.PI):
   leanMode==='Radial outward'?centreAngle:
   leanMode==='Radial inward'?centreAngle+Math.PI:rand()*TAU;
  const deviation=(rand()-.5)*TAU*randomness;
  const lean=.85*amount*(1+(rand()-.5)*.18*randomness);
  out.push({id:'cr-'+i+'-'+Math.floor(rand()*1e6),name:'Crystal '+String(i+1).padStart(2,'0'),x,y:0,z,
   h:s.height*factor,r:Math.max(4,s.width/(Math.sqrt(n)*3.6))*(tier===0?1.25:tier===1?.87:.63)*(.84+rand()*.33),
   rotation:rand()*TAU,leanX:Math.cos(heading+deviation)*lean,leanZ:Math.sin(heading+deviation)*lean,
   family,locked:false,hidden:false,scale:1});
 }
 // At maximum spacing, conservatively prevent ALL projected crystal envelopes
 // overlapping, including the displacement caused by their lean.
 if(n>1&&spacing>0){
  let required=1;
  const ext=c=>c.r*Math.max(Number(s.bottomScale??1),Number(s.topScale??.8),1)+
   c.h*Math.hypot(c.leanX,c.leanZ)+Math.max(0,Number(s.tipRound??3.5));
  for(let i=0;i<n;i++)for(let j=0;j<i;j++){
   const d=Math.hypot(out[i].x-out[j].x,out[i].z-out[j].z);
   required=Math.max(required,(ext(out[i])+ext(out[j])+Math.max(15,s.width*.1))/Math.max(.00001,d));
  }
  const scale=1+(required-1)*Math.pow(spacing,5);
  for(const c of out){c.x*=scale;c.z*=scale}
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
  // A smooth C1 shoulder fillet bridges the rounded shaft into the tapered tip.
  // Vertical side rounding automatically contributes even with shoulderRound=0.
  const shoulderSize=Math.max(Number(shape.shoulderRound||0),Number(shape.cornerRadius||0)*.8);
  if(shoulderSize>.01){
    rings.pop();
    const d=clamp(shoulderSize,.02,Math.min(neck*.17,tipH*.28));
    const y0=neck-d,dr=2*d;
    const r0=b+(top-b)*(y0/Math.max(.01,neck));
    const r1=top*(1-d/Math.max(.01,tipH));
    const m0=(top-b)/Math.max(.01,neck),m1=-top/Math.max(.01,tipH);
    add(y0,r0);
    for(let k=1,stepsY=Math.max(5,steps+3);k<=stepsY;k++){
      const t=k/stepsY,t2=t*t,t3=t2*t;
      const radius=(2*t3-3*t2+1)*r0+(t3-2*t2+t)*dr*m0+
       (-2*t3+3*t2)*r1+(t3-t2)*dr*m1;
      add(y0+dr*t,Math.max(.12,radius));
    }
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
