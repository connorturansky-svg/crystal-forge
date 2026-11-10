import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const $=id=>document.getElementById(id);
const keys=['count','height','width','soft','base','wall','seed','pattern','resolution','hollow'];
let state={count:9,height:130,width:95,soft:1.5,base:9,wall:1.2,seed:42,pattern:'spire',resolution:85,hollow:false};
try{Object.assign(state,JSON.parse(localStorage.getItem('crystal-forge-m1')||'{}'))}catch{}
// Geometry revision 0.1.1: keep solids as default until hollowing is validated.
if(localStorage.getItem('crystal-forge-geometry-revision')!=='4'){state.hollow=false;localStorage.setItem('crystal-forge-geometry-revision','4')}
const suffix={count:'',height:' mm',width:' mm',soft:' mm',base:' mm',wall:' mm'};
function labels(){for(const [k,v] of Object.entries(suffix))$(k+'V').textContent=state[k]+v}
for(const k of keys){const el=$(k);el.value=state[k];if(el.type==='checkbox')el.checked=!!state[k];el.addEventListener('input',()=>{state[k]=el.type==='checkbox'?el.checked:el.type==='number'||el.type==='range'?Number(el.value):el.value;labels();schedule()})}labels();
function mode(v){$('advanced').classList.toggle('active',v);$('simple').classList.toggle('active',!v);document.querySelectorAll('.advancedOnly').forEach(e=>e.hidden=!v)}
$('simple').onclick=()=>mode(false);$('advanced').onclick=()=>mode(true);
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(e=>e.classList.toggle('active',e===b));for(const id of ['design','build','print'])$(id).hidden=id!==b.dataset.tab});
$('random').onclick=()=>{state.seed=Math.floor(Math.random()*1000000);$('seed').value=state.seed;schedule()};
$('regen').onclick=()=>schedule();
const scene=new THREE.Scene();scene.background=new THREE.Color(0x101722);
const camera=new THREE.PerspectiveCamera(48,1,.1,2000);camera.position.set(185,150,205);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));$('viewport').appendChild(renderer.domElement);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.target.set(0,45,0);
scene.add(new THREE.HemisphereLight(0xddeeff,0x263346,2.4));const sun=new THREE.DirectionalLight(0xffffff,3);sun.position.set(100,200,150);scene.add(sun);scene.add(new THREE.GridHelper(300,20,0x405066,0x283548));
new ResizeObserver(()=>{const e=$('viewport');renderer.setSize(e.clientWidth,e.clientHeight,false);camera.aspect=e.clientWidth/e.clientHeight;camera.updateProjectionMatrix()}).observe($('viewport'));
function frame(){requestAnimationFrame(frame);orbit.update();renderer.render(scene,camera)}frame();
function rng(seed){let x=(seed|0)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}

function crystals(){
 const r=rng(state.seed),n=state.count,W=state.width,H=state.height;
 const result=[];
 const big=Math.max(1,Math.round(n*.2)),mid=Math.max(1,Math.round(n*.32));
 for(let i=0;i<n;i++){
  const tier=i<big?0:i<big+mid?1:2;
  const t=i===0?0:(i*2.399963229728653+r()*.5);
  const rr=i===0?0:Math.sqrt((i+.15)/n)*W*.35*(state.pattern==='dense'?.75:1);
  const x=Math.cos(t)*rr,z=Math.sin(t)*rr;
  const factor=tier===0?.73+r()*.27:tier===1?.38+r()*.22:.16+r()*.18;
  const h=H*factor;
  const radius=Math.max(3.5,W/(Math.sqrt(n)*3.5))*(tier===0?1.25:tier===1?.88:.58)*(.8+r()*.4);
  const lean=state.pattern==='fan'?.38:state.pattern==='wild'?.32:.14;
  result.push({x,z,h,radius,tip:.22+r()*.17,tx:Math.cos(t)*lean,tz:Math.sin(t)*lean,rotation:r()*Math.PI*2,sides:6});
 }
 return result;
}
function buildGeometry(){
  const vertices=[],cs=crystals(),B=state.base,bevel=Math.max(0,state.soft);

  function triangle(a,b,c){
    const ax=b[0]-a[0],ay=b[1]-a[1],az=b[2]-a[2];
    const bx=c[0]-a[0],by=c[1]-a[1],bz=c[2]-a[2];
    const x=ay*bz-az*by,y=az*bx-ax*bz,z=ax*by-ay*bx;
    if(x*x+y*y+z*z<1e-12)return;
    vertices.push(...a,...b,...c);
  }
  function quad(a,b,c,d){triangle(a,b,c);triangle(a,c,d)}
  function section(c,y,radius){
    const n=c.sides,points=[],dy=Math.max(0,y-B);
    const cr=Math.min(bevel,radius*.48),arcSteps=bevel>0?6:0;
    for(let i=0;i<n;i++){
      const a=c.rotation+2*Math.PI*i/n;
      const p=[Math.cos(a)*radius,Math.sin(a)*radius];
      if(!arcSteps){
        points.push([c.x+p[0]+c.tx*dy,y,c.z+p[1]+c.tz*dy]);
        continue;
      }
      const prev=[Math.cos(a-2*Math.PI/n)*radius,Math.sin(a-2*Math.PI/n)*radius];
      const next=[Math.cos(a+2*Math.PI/n)*radius,Math.sin(a+2*Math.PI/n)*radius];
      function unit(v){const d=Math.hypot(...v)||1;return[v[0]/d,v[1]/d]}
      const u=unit([prev[0]-p[0],prev[1]-p[1]]);
      const v=unit([next[0]-p[0],next[1]-p[1]]);
      const theta=Math.PI-2*Math.PI/n,t=cr/Math.tan(theta/2);
      const bis=unit([u[0]+v[0],u[1]+v[1]]);
      const center=[p[0]+bis[0]*cr/Math.sin(theta/2),p[1]+bis[1]*cr/Math.sin(theta/2)];
      const A=[p[0]+u[0]*t,p[1]+u[1]*t],D=[p[0]+v[0]*t,p[1]+v[1]*t];
      const start=Math.atan2(A[1]-center[1],A[0]-center[0]);
      const finish=Math.atan2(D[1]-center[1],D[0]-center[0]);
      const sweep=(finish-start+2*Math.PI)%(2*Math.PI);
      for(let j=0;j<=arcSteps;j++){
        const angle=start+sweep*j/arcSteps;
        points.push([c.x+center[0]+Math.cos(angle)*cr+c.tx*dy,y,
          c.z+center[1]+Math.sin(angle)*cr+c.tz*dy]);
      }
    }
    return points;
  }
  function crystal(c){
    const y0=B-2.5,yShoulder=B+c.h*(1-c.tip),yTop=B+c.h;
    const r0=c.radius,rShoulder=r0*(.92+.04*Math.sin(c.rotation));
    const rings=[];
    function add(y,r){rings.push(section(c,y,Math.max(.18,r)))}
    const shaftRadius=y=>r0+(rShoulder-r0)*Math.max(0,(y-y0)/(yShoulder-y0));
    const tipRadius=y=>rShoulder*Math.max(0,(yTop-y)/(yTop-yShoulder));
    const lowerBevel=Math.min(bevel,1.6,(yShoulder-y0)*.10);
    add(y0,Math.max(.5,r0-lowerBevel*.65));
    if(lowerBevel>.05)add(y0+lowerBevel,r0);
    const blend=Math.min(bevel*1.5,(yShoulder-y0)*.19,(yTop-yShoulder)*.29);
    if(blend>.05){
      const lo=yShoulder-blend,hi=yShoulder+blend;
      const p0=[lo,shaftRadius(lo)],p1=[yShoulder,rShoulder],p2=[hi,tipRadius(hi)];
      add(lo,p0[1]);
      for(let k=1;k<=5;k++){
        const t=k/5,q=1-t;
        add(q*q*p0[0]+2*q*t*p1[0]+t*t*p2[0],
          q*q*p0[1]+2*q*t*p1[1]+t*t*p2[1]);
      }
    }else add(yShoulder,rShoulder);
    const capHeight=Math.min(Math.max(.2,bevel*.75),(yTop-yShoulder)*.28);
    const preY=yTop-capHeight;
    if(preY>rings[rings.length-1][0][1]+.01)add(preY,tipRadius(preY));
    add(yTop,bevel>0?Math.min(r0*.11,Math.max(.12,bevel*.30)):.15);
    for(let k=0;k<rings.length-1;k++){
      const lower=rings[k],upper=rings[k+1],count=lower.length;
      for(let i=0;i<count;i++){
        const j=(i+1)%count;
        quad(lower[i],upper[i],upper[j],lower[j]);
      }
    }
    const bottom=rings[0],top=rings[rings.length-1],n=bottom.length;
    const bottomCenter=[c.x+c.tx*Math.max(0,y0-B),y0,c.z+c.tz*Math.max(0,y0-B)];
    const topCenter=[c.x+c.tx*(yTop-B),yTop,c.z+c.tz*(yTop-B)];
    for(let i=0;i<n;i++){
      const j=(i+1)%n;
      triangle(bottomCenter,bottom[i],bottom[j]); // underside
      triangle(topCenter,top[j],top[i]); // tip cap
    }
  }
  function hull(points){
    const sorted=points.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
    const lower=[],upper=[];
    for(const p of sorted){
      while(lower.length>=2&&cross(lower[lower.length-2],lower[lower.length-1],p)<=1e-8)lower.pop();
      lower.push(p);
    }
    for(let i=sorted.length-1;i>=0;i--){
      const p=sorted[i];
      while(upper.length>=2&&cross(upper[upper.length-2],upper[upper.length-1],p)<=1e-8)upper.pop();
      upper.push(p);
    }
    lower.pop();upper.pop();return lower.concat(upper);
  }
  function integratedRoot(){
    // Convex outline follows the actual crystal footprints, not a detached doughnut.
    const footprints=[];
    for(const c of cs)for(let k=0;k<c.sides;k++){
      const a=c.rotation+k*Math.PI*2/c.sides;
      footprints.push([c.x+Math.cos(a)*c.radius,c.z+Math.sin(a)*c.radius]);
    }
    const outline=hull(footprints);
    if(outline.length<3)return;
    const center=outline.reduce((a,p)=>[a[0]+p[0]/outline.length,a[1]+p[1]/outline.length],[0,0]);
    function contour(y,margin){
      return outline.map(p=>{
        const dx=p[0]-center[0],dz=p[1]-center[1],len=Math.hypot(dx,dz)||1;
        return[p[0]+dx/len*margin,y,p[1]+dz/len*margin];
      });
    }
    const outerTop=contour(B,2.4),outerBottom=contour(0,3.3);
    // Underside-accessible pocket with a solid top/ceiling. It is not crystal hollowing.
    const rim=Math.max(2.8,state.wall+1.8);
    const innerBottom=contour(0,-rim),innerRoof=contour(Math.max(.8,B-Math.max(2.4,state.wall*1.8)),-rim-.4);
    const topCenter=[center[0],B,center[1]];
    const roofCenter=[center[0],innerRoof[0][1],center[1]];
    for(let i=0;i<outline.length;i++){
      const j=(i+1)%outline.length;
      triangle(topCenter,outerTop[j],outerTop[i]);
      quad(outerBottom[i],outerTop[i],outerTop[j],outerBottom[j]);
      quad(outerBottom[i],outerBottom[j],innerBottom[j],innerBottom[i]);
      quad(innerBottom[j],innerRoof[j],innerRoof[i],innerBottom[i]);
      triangle(roofCenter,innerRoof[i],innerRoof[j]);
    }
  }
  integratedRoot();
  cs.forEach(crystal);
  return new Float32Array(vertices);
}
let mesh,positions,scheduled;
function schedule(){clearTimeout(scheduled);scheduled=setTimeout(build,300);localStorage.setItem('crystal-forge-m1',JSON.stringify(state))}
function build(){$('status').textContent='Generating mesh…';setTimeout(()=>{try{positions=buildGeometry();if(mesh){scene.remove(mesh);mesh.geometry.dispose();mesh.material.dispose()}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.computeVertexNormals();mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x87b9e8,roughness:.4,metalness:0,flatShading:true,side:THREE.DoubleSide}));scene.add(mesh);const size=new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3());$('tri').textContent=(positions.length/9).toLocaleString();$('bounds').textContent=[size.x,size.z,size.y].map(x=>x.toFixed(0)).join(' × ')+' mm';$('isHollow').textContent='Not yet (faceted preview)';let warnings=0;const threshold=Math.cos(Number($('angle').value)*Math.PI/180);for(let i=0;i<positions.length;i+=9){const a=new THREE.Vector3(...positions.slice(i,i+3)),b=new THREE.Vector3(...positions.slice(i+3,i+6)),c=new THREE.Vector3(...positions.slice(i+6,i+9)),n=b.sub(a).cross(c.sub(a)).normalize();if(n.y<-.01&&n.y> -threshold)warnings++}$('overhang').textContent=warnings.toLocaleString();$('warning').textContent='Low-poly rounded corner geometry with an underside-accessible, solid-topped base. The crystals are still separate overlapping shells, not one watertight union. Do not print without checking and repairing in Cura or mesh software.';$('status').textContent='Ready · drag to orbit · scroll to zoom';}catch(e){$('status').textContent='Error: '+e.message;console.error(e)}},20)}
$('angle').onchange=schedule;
function exportSTL(){if(!positions?.length)return alert('Generate a model first');const count=positions.length/9,buffer=new ArrayBuffer(84+count*50),view=new DataView(buffer);view.setUint32(80,count,true);let p=84;for(let i=0;i<positions.length;i+=9){const a=new THREE.Vector3(...positions.slice(i,i+3)),b=new THREE.Vector3(...positions.slice(i+3,i+6)),c=new THREE.Vector3(...positions.slice(i+6,i+9)),n=b.clone().sub(a).cross(c.clone().sub(a)).normalize();for(const v of [n,a,b,c])for(const x of [v.x,v.y,v.z]){view.setFloat32(p,x,true);p+=4}view.setUint16(p,0,true);p+=2}const url=URL.createObjectURL(new Blob([buffer],{type:'model/stl'})),a=document.createElement('a');a.href=url;a.download='crystal-forge-'+state.seed+'.stl';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('export').onclick=exportSTL;$('export2').onclick=exportSTL;build();