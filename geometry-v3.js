/* Crystal Forge v0.3 — explicit, deliberately faceted mesh geometry.
 * All dimensions are millimetres. Components are closed, but overlapping
 * crystal/base shells are NOT a validated Boolean union (see UI warnings).
 */
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function seeded(seed){let x=(Number(seed)|0)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
export const families=['Quartz','Shard','Blade','Cubic','Double terminated','Fantasy'];
export const patterns=['Central Spire','Dense Cluster','Fan','Geode / Crescent','Wall Growth','Organic / Wild'];
export const leanModes=['Organic / natural','One direction','Criss-cross','Radial outward','Radial inward'];
// Stable per-object variation: changing sliders does not re-roll crystal IDs,
 // move objects, or change a previously selected crystal.
function signedHash(value,salt){
 let h=2166136261;
 for(const ch of String(value||'crystal')+salt){h=Math.imul(h^ch.charCodeAt(0),16777619)}
 return ((h>>>0)/2147483647.5)-1;
}
export function crystalEndRatios(c,s){
 const shape={...s,...(c.shape||{})};
 const variability=clamp(Number(s.widthRandomness||0)/100,0,1);
 const bottom=Math.max(.08,Number(shape.bottomScale??1)*(1+variability*.88*signedHash(c.id,'bottom')));
 const top=Math.max(.08,Number(shape.topScale??.8)*(1+variability*.88*signedHash(c.id,'top')));
 return {bottom,top,size:Math.max(.35,Number(s.crystalSize)||1)};
}
// Yaw/manual rotations remain intact. The lean is a RIGID local rotation,
// rather than a shear of every vertex as the crystal grows.
export function crystalOrientation(THREE,c){
 const manual=new THREE.Quaternion().setFromEuler(new THREE.Euler(c.rx||0,c.rotation||0,c.rz||0,'XYZ'));
 const axis=new THREE.Vector3(c.leanX||0,1,c.leanZ||0).normalize();
 const tilt=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis);
 return manual.multiply(tilt);
}

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
  const rotation=rand()*TAU;
  // Compensate for local facet rotation, so presets point in world space.
  const localHeading=heading+deviation+rotation;
  out.push({id:'cr-'+i+'-'+Math.floor(rand()*1e6),name:'Crystal '+String(i+1).padStart(2,'0'),x,y:0,z,
   h:s.height*factor,r:Math.max(4,s.width/(Math.sqrt(n)*3.6))*(tier===0?1.25:tier===1?.87:.63)*(.84+rand()*.33),
   rotation,leanX:Math.cos(localHeading)*lean,leanZ:Math.sin(localHeading)*lean,
   family,locked:false,hidden:false,scale:1});
 }
 // At maximum spacing, conservatively prevent ALL projected crystal envelopes
 // overlapping, including the displacement caused by their lean.
 if(n>1&&spacing>0){
  let required=1;
  const ext=c=>{const ratios=crystalEndRatios(c,s);return c.r*ratios.size*Math.max(ratios.bottom,ratios.top,1)+
   c.h*Math.hypot(c.leanX,c.leanZ)+Math.max(0,Number(s.tipRound??3.5));};
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
 const ratios=crystalEndRatios(c,s);
 const size=String(c.id||'').startsWith('base-accent-')?1:ratios.size;
 const height=Math.max(8,c.h),b=Math.max(.35,c.r*size*ratios.bottom),top=Math.max(.35,c.r*size*ratios.top);
 const tipH=height*(c.family==='Cubic'?.10:c.family==='Blade'?.43:c.family==='Shard'?.48:shape.tipLength);
 const neck=height-tipH,steps=Math.max(2,shape.roundSteps|0);
 const emit=(p,q,r)=>a.push(...p,...q,...r),quad=(p,q,r,t)=>{emit(p,q,r);emit(p,r,t)};
 function ring(y,radius){
  const pts=[],round=clamp(shape.cornerRadius,0,radius*.31);
  for(let i=0;i<sides;i++){
    const angle=TAU*i/sides,pre=angle-TAU/sides,next=angle+TAU/sides;
    const pt=[Math.cos(angle)*radius,Math.sin(angle)*radius];
    if(round<=.001){pts.push([pt[0],y,pt[1]]);continue}
    const prev=[Math.cos(pre)*radius,Math.sin(pre)*radius],after=[Math.cos(next)*radius,Math.sin(next)*radius];
    function norm(v){const len=Math.hypot(...v)||1;return v.map(x=>x/len)}
    const u=norm([prev[0]-pt[0],prev[1]-pt[1]]),v=norm([after[0]-pt[0],after[1]-pt[1]]);
    const interior=Math.PI-TAU/sides,travel=round/Math.tan(interior/2),mid=norm([u[0]+v[0],u[1]+v[1]]);
    const center=[pt[0]+mid[0]*round/Math.sin(interior/2),pt[1]+mid[1]*round/Math.sin(interior/2)];
    const start=Math.atan2(pt[1]+u[1]*travel-center[1],pt[0]+u[0]*travel-center[0]);
    const end=Math.atan2(pt[1]+v[1]*travel-center[1],pt[0]+v[0]*travel-center[0]);
    const sweep=(end-start+TAU)%TAU;
    for(let k=0;k<=steps;k++){const t=start+sweep*k/steps;
      pts.push([center[0]+Math.cos(t)*round,y,center[1]+Math.sin(t)*round])
    }
  }return pts;
 }
 const rings=[];
 function add(y,r){if(rings.length&&y<=rings[rings.length-1][0][1]+.01)return;rings.push(ring(y,r))}
 const rootRound=Math.min(shape.cornerRadius*.5,Math.max(.0,height*.02));
 add(0,Math.max(.8,b-rootRound));if(rootRound>.05)add(rootRound,b);
 add(neck,top);
 // Side rounding carries through a C1-continuous shoulder into the tip.
 const shoulderSize=Math.max(Number(shape.shoulderRound||0),Number(shape.cornerRadius||0)*.8);
 if(shoulderSize>.01){
   rings.pop();
   const d=clamp(shoulderSize,.02,Math.min(neck*.17,tipH*.28));
   const y0=neck-d,dr=2*d;
   const r0=b+(top-b)*y0/Math.max(.01,neck);
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
 const baseC=[0,0,0],tipC=[0,apexY,0];
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
  const end=crystalEndRatios(c,s);
  const r=c.r*end.size*end.bottom*Math.max(c.sx||c.scale||1,c.sz||c.scale||1)+1;
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

// One radial, tangent-continuous profile drives the visible mesh and root seats.
export function baseEdgeHeight(s){
 const h=Math.max(3,Number(s.baseHeight)||3);
 return (s.baseProfile||'Plinth + dome')==='Full dome / hill'?
  Math.max(.8,h*Math.max(0,Math.min(1,Number(s.sideWall??100)/100))):h;
}
export function baseProfileHeight(s,fraction){
 const mode=s.baseProfile||'Plinth + dome',edge=baseEdgeHeight(s);
 const h=Math.max(3,Number(s.baseHeight)||3),dome=Math.max(0,Number(s.baseDome)||0);
 const rise=mode==='Flat plinth'?0:(h-edge+dome);
 const t=Math.max(0,Math.min(1,fraction));
 const power=Math.max(1.2,Math.min(3.5,Number(s.domeFalloff??1.8)));
 return edge+rise*Math.pow(1-Math.pow(t,power),2);
}
export function baseSurfaceHeight(cs,s,x,z){
 if(s.baseType==='none')return 0;
 const outline=baseOutline(cs,s),base=baseEdgeHeight(s);
 if(outline.length<3)return baseProfileHeight(s,0);
 const edge=Math.min(Math.max(0,Number(s.baseEdgeRadius||0)),base*.55,Math.max(.1,Number(s.baseWidth||3)*.85));
 if(Math.abs(baseProfileHeight(s,0)-base)<1e-8&&edge===0)return base;
 const n=outline.length,cx=outline.reduce((sum,p)=>sum+p[0]/n,0),cz=outline.reduce((sum,p)=>sum+p[1]/n,0);
 const vx=x-cx,vz=z-cz,dist=Math.hypot(vx,vz);if(dist<1e-8)return baseProfileHeight(s,0);
 let best=Infinity;
 // Ray/edge intersection gives the actual polyline radius in any direction.
 for(let k=0;k<n;k++){
  const p=outline[k],q=outline[(k+1)%n],ex=q[0]-p[0],ez=q[1]-p[1],det=vx*ez-vz*ex;
  if(Math.abs(det)<1e-12)continue;
  const rx=p[0]-cx,rz=p[1]-cz;
  const at=(rx*ez-rz*ex)/det,along=(rx*vz-rz*vx)/det;
  if(at>0&&along>=-1e-6&&along<=1+1e-6)best=Math.min(best,at);
 }
 if(!Number.isFinite(best))return baseProfileHeight(s,0);
 const boundary=dist*best,topRadius=Math.max(.1,boundary-edge);
 if(edge>0&&dist>topRadius){
  const inset=Math.max(0,Math.min(edge,boundary-dist));
  return base-edge+Math.sqrt(Math.max(0,2*edge*inset-inset*inset));
 }
 return baseProfileHeight(s,Math.min(1,Math.max(0,dist/topRadius)));
}
export function crystalRootOffset(cs,s,c,THREE){
 if(s.baseType==='none')return 0;
 const centre=baseSurfaceHeight(cs,s,c.x,c.z);
 if(!THREE)return centre-2.5;
 const ratios=crystalEndRatios(c,s);
 const radius=Math.max(.35,c.r*ratios.size*ratios.bottom);
 const sx=c.sx??c.scale??1,sz=c.sz??c.scale??1;
 const q=crystalOrientation(THREE,c),v=new THREE.Vector3();
 let safe=centre;
 // The ENTIRE tipped, rotated base ring must remain under the actual mound
 // surface. Checking the centre alone left several roots protruding visibly.
 for(let k=0;k<24;k++){
   const angle=k*TAU/24;
   v.set(Math.cos(angle)*radius*sx,0,Math.sin(angle)*radius*sz).applyQuaternion(q);
   const surface=baseSurfaceHeight(cs,s,c.x+v.x,c.z+v.z);
   safe=Math.min(safe,surface-v.y);
 }
 // Keep a real overlapping root band for Manifold union, not a tangent touch.
 // Positive per-object Y edits cannot expose a root above the mound.
 return safe-3-Math.max(0,c.y||0);
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
 const style=s.baseStyle||'Fitted',b=baseEdgeHeight(s);
 // Crystal-crust top is a triangulated low-poly surface. Every second
 // perimeter vertex rises into a small rocky shard while retaining closure.
 const heights=outline.map((_,i)=>style==='Crystal crust'&&i%3===1?Math.min(3,(s.baseWidth||3)*.3+1):0);
 const top=outline.map((p,i)=>[p[0],b+heights[i],p[1]]);
 const bottom=outline.map(p=>[p[0],0,p[1]]);
 // The outer fillet merges tangentially into the mound profile.
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
 const centerTop=[c[0],baseProfileHeight(s,0),c[1]];
 for(let band=1;band<=5;band++){
  const fraction=1-band/6;
  const ring=topOutline.map((p,k)=>[
   c[0]+(p[0]-c[0])*fraction,
   baseProfileHeight(s,fraction)+heights[k]*fraction,
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
