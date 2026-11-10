import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const $=id=>document.getElementById(id);
const keys=['count','height','width','soft','base','wall','seed','pattern','resolution','hollow'];
let state={count:9,height:130,width:95,soft:1.5,base:9,wall:1.2,seed:42,pattern:'spire',resolution:85,hollow:false};
try{Object.assign(state,JSON.parse(localStorage.getItem('crystal-forge-m1')||'{}'))}catch{}
// Geometry revision 0.1.1: keep solids as default until hollowing is validated.
if(localStorage.getItem('crystal-forge-geometry-revision')!=='3'){state.hollow=false;localStorage.setItem('crystal-forge-geometry-revision','3')}
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
 const vertices=[],cs=crystals(),W=state.width,B=state.base,bevel=state.soft;
 function triangle(a,b,c){
  const ab=new THREE.Vector3().subVectors(new THREE.Vector3(...b),new THREE.Vector3(...a));
  const ac=new THREE.Vector3().subVectors(new THREE.Vector3(...c),new THREE.Vector3(...a));
  if(ab.cross(ac).lengthSq()<1e-9)return;
  vertices.push(...a,...b,...c);
 }
 function quad(a,b,c,d){triangle(a,b,c);triangle(a,c,d)}
 function polygonRing(c,y,radius){
  const points=[];
  for(let k=0;k<c.sides;k++){
   const theta=c.rotation+2*Math.PI*k/c.sides;
   const offset=Math.max(0,y-B);
   points.push([c.x+Math.cos(theta)*radius+c.tx*offset,y,c.z+Math.sin(theta)*radius+c.tz*offset]);
  }
  return points;
 }
 function prism(c){
  const n=c.sides;
  const y0=B-1.5,y1=B+c.h*(1-c.tip),y2=B+c.h;
  const rad=Math.max(2,c.radius),rTop=rad*(.88+Math.sin(c.rotation)*.06);
  const base=polygonRing(c,y0,rad),shoulder=polygonRing(c,y1,rTop);
  const tip=polygonRing(c,y2,Math.max(.18,bevel*.23));
  for(let i=0;i<n;i++){
   const j=(i+1)%n;
   quad(base[i],base[j],shoulder[j],shoulder[i]);
   quad(shoulder[i],shoulder[j],tip[j],tip[i]);
  }
  const center=[c.x,y0,c.z];
  for(let i=0;i<n;i++)triangle(center,base[(i+1)%n],base[i]);
  const topCenter=[c.x+c.tx*(y2-B),y2,c.z+c.tz*(y2-B)];
  for(let i=0;i<n;i++)triangle(topCenter,tip[i],tip[(i+1)%n]);
 }
 // Low-profile faceted root instead of a wide circular display plinth.
 const n=12,ring=(y,r)=>Array.from({length:n},(_,i)=>{
  const a=2*Math.PI*i/n;
  return [Math.cos(a)*r,y,Math.sin(a)*r];
 });
 const low=ring(0,W*.38),high=ring(B,W*.34);
 for(let i=0;i<n;i++){const j=(i+1)%n;quad(low[i],low[j],high[j],high[i])}
 // Underside is intentionally open for later LED access.
 const insideLow=ring(0,W*.38-Math.max(2,state.wall));
 const insideHigh=ring(B-Math.max(2,state.wall),W*.34-Math.max(2,state.wall));
 for(let i=0;i<n;i++){
  const j=(i+1)%n;
  quad(insideLow[j],insideLow[i],insideHigh[i],insideHigh[j]);
  quad(low[j],low[i],insideLow[i],insideLow[j]);
  quad(insideHigh[i],insideHigh[j],high[j],high[i]);
 }
 cs.forEach(prism);
 return new Float32Array(vertices);
}
let mesh,positions,scheduled;
function schedule(){clearTimeout(scheduled);scheduled=setTimeout(build,300);localStorage.setItem('crystal-forge-m1',JSON.stringify(state))}
function build(){$('status').textContent='Generating mesh…';setTimeout(()=>{try{positions=buildGeometry();if(mesh){scene.remove(mesh);mesh.geometry.dispose();mesh.material.dispose()}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.computeVertexNormals();mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x87b9e8,roughness:.4,metalness:0,flatShading:true,side:THREE.DoubleSide}));scene.add(mesh);const size=new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3());$('tri').textContent=(positions.length/9).toLocaleString();$('bounds').textContent=[size.x,size.z,size.y].map(x=>x.toFixed(0)).join(' × ')+' mm';$('isHollow').textContent='Not yet (faceted preview)';let warnings=0;const threshold=Math.cos(Number($('angle').value)*Math.PI/180);for(let i=0;i<positions.length;i+=9){const a=new THREE.Vector3(...positions.slice(i,i+3)),b=new THREE.Vector3(...positions.slice(i+3,i+6)),c=new THREE.Vector3(...positions.slice(i+6,i+9)),n=b.sub(a).cross(c.sub(a)).normalize();if(n.y<-.01&&n.y> -threshold)warnings++}$('overhang').textContent=warnings.toLocaleString();$('warning').textContent='Stylised polygonal geometry. This prototype exports intersecting component shells, not a boolean-unioned watertight solid. Do not print without checking and repairing in Cura or mesh software.';$('status').textContent='Ready · drag to orbit · scroll to zoom';}catch(e){$('status').textContent='Error: '+e.message;console.error(e)}},20)}
$('angle').onchange=schedule;
function exportSTL(){if(!positions?.length)return alert('Generate a model first');const count=positions.length/9,buffer=new ArrayBuffer(84+count*50),view=new DataView(buffer);view.setUint32(80,count,true);let p=84;for(let i=0;i<positions.length;i+=9){const a=new THREE.Vector3(...positions.slice(i,i+3)),b=new THREE.Vector3(...positions.slice(i+3,i+6)),c=new THREE.Vector3(...positions.slice(i+6,i+9)),n=b.clone().sub(a).cross(c.clone().sub(a)).normalize();for(const v of [n,a,b,c])for(const x of [v.x,v.y,v.z]){view.setFloat32(p,x,true);p+=4}view.setUint16(p,0,true);p+=2}const url=URL.createObjectURL(new Blob([buffer],{type:'model/stl'})),a=document.createElement('a');a.href=url;a.download='crystal-forge-'+state.seed+'.stl';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('export').onclick=exportSTL;$('export2').onclick=exportSTL;build();