/* Crystal Forge manufacturing pipeline v0.4
 * Uses Manifold WASM for robust Boolean unions, cavity subtraction and socket cuts.
 * The interactive preview stays lightweight and separate from the manufacturing mesh.
 * Runtime: browser (loadManifold) or injected WASM module (testing).
 */
// Three.js is provided by whichever realm runs this module (UI, Worker, Node).
let THREE;
export function setThreeInstance(three){THREE=three;}
import {crystalGeometry,crystalRootOffset,baseGeometry,baseSurfaceHeight} from './geometry-v3.js';
import {planHardware} from './hardware-layout.js';
import {resolvePixelProfile} from './pixel-profiles.js';
import {estimateRoofReview} from './print-advisor.js';
import {planTargetedLightPaths} from './targeted-light-paths.js';
import {planDetachablePlate} from './detachable-plate.js';

let modulePromise=null;
export async function loadManifold(){
 if(!modulePromise){
  modulePromise=import('https://cdn.jsdelivr.net/npm/manifold-3d@3.5.4/manifold.js')
   .then(async pkg=>{const wasm=await pkg.default();wasm.setup();return wasm})
   .catch(err=>{modulePromise=null;throw new Error('Could not load the Manifold fabrication engine: '+err.message)});
 }
 return modulePromise;
}
const finite=x=>Number.isFinite(x);
function assertSolid(m,label){
 if(!m || m.isEmpty() || m.numTri()===0)throw new Error(label+' could not be converted into a valid closed solid');
 const status=m.status();
 if(status && status!=='NoError' && status!=='no-error' && status!=='Success')throw new Error(label+' mesh validation failed: '+String(status));
}
function convertMesh(wasm,obj){
 obj.updateMatrixWorld(true);
 const p=obj.geometry.getAttribute('position');
 const verts=new Float32Array(p.count*3),tmp=new THREE.Vector3();
 for(let i=0;i<p.count;i++){
  tmp.fromBufferAttribute(p,i).applyMatrix4(obj.matrixWorld);
  verts[i*3]=tmp.x;verts[i*3+1]=tmp.y;verts[i*3+2]=tmp.z;
 }
 const tris=obj.geometry.index?new Uint32Array(obj.geometry.index.array):Uint32Array.from({length:p.count},(_,i)=>i);
 const mesh=new wasm.Mesh({numProp:3,vertProperties:verts,triVerts:tris});
 mesh.merge();
 const m=new wasm.Manifold(mesh);assertSolid(m,'Crystal / base');
 return m;
}
function fromResultMesh(mesh){
 const positions=mesh.vertProperties, stride=mesh.numProp, idx=mesh.triVerts;
 const geom=new THREE.BufferGeometry();
 const p=new Float32Array(idx.length*3);
 for(let i=0;i<idx.length;i++){
  const o=idx[i]*stride;
  p[i*3]=positions[o];p[i*3+1]=positions[o+1];p[i*3+2]=positions[o+2];
 }
 geom.setAttribute('position',new THREE.BufferAttribute(p,3));
 geom.computeVertexNormals();
 return geom;
}
function compactMesh(mesh){
 const stride=mesh.numProp,vert=mesh.vertProperties,indices=mesh.triVerts;
 const points=new Float32Array((vert.length/stride)*3);
 for(let i=0;i<points.length/3;i++){
  points[3*i]=vert[i*stride];points[3*i+1]=vert[i*stride+1];points[3*i+2]=vert[i*stride+2];
 }
 return {points,triangles:new Uint32Array(indices)};
}
function triQuality(mesh,threshold=45){
 const {points,triangles}=mesh,step=3,unit=Math.PI/180;
 let unsafe=0,area=0,badArea=0,bridges=0,minY=Infinity;
 const result=new Float32Array(triangles.length);
 for(let i=0;i<points.length;i+=3)minY=Math.min(minY,points[i+1]);
 const ax=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),e1=new THREE.Vector3(),e2=new THREE.Vector3();
 const normal=new THREE.Vector3();
 for(let i=0;i<triangles.length;i+=step){
  ax.fromArray(points,3*triangles[i]);b.fromArray(points,3*triangles[i+1]);c.fromArray(points,3*triangles[i+2]);
  e1.subVectors(b,ax);e2.subVectors(c,ax);normal.crossVectors(e1,e2);
  const a=normal.length()*.5;if(a<1e-12)continue;normal.normalize();area+=a;
  const isBottom=Math.abs(ax.y-minY)<.15&&Math.abs(b.y-minY)<.15&&Math.abs(c.y-minY)<.15;
  const angle=Math.asin(Math.min(1,Math.abs(normal.y)))/unit;
  const risk=!isBottom&&normal.y<-.02&&angle>threshold;
  if(risk){unsafe++;badArea+=a;}
  result[i/3]=risk?1:0;
 }
 return {unsafeTriangles:unsafe,atRiskArea:badArea,totalArea:area,atRiskFraction:area?badArea/area:0,minY};
}

function orientationCheck(mesh,up,threshold=45){
 const pts=mesh.points,faces=mesh.triangles,norm=new THREE.Vector3(),va=new THREE.Vector3(),vb=new THREE.Vector3(),vc=new THREE.Vector3(),e=new THREE.Vector3(),f=new THREE.Vector3();
 const upv=new THREE.Vector3(...up);
 let minProj=Infinity;
 for(let i=0;i<pts.length;i+=3)minProj=Math.min(minProj,pts[i]*up[0]+pts[i+1]*up[1]+pts[i+2]*up[2]);
 let bad=0,contact=0,unsafeCount=0;
 for(let i=0;i<faces.length;i+=3){
  va.fromArray(pts,faces[i]*3);vb.fromArray(pts,faces[i+1]*3);vc.fromArray(pts,faces[i+2]*3);
  e.subVectors(vb,va);f.subVectors(vc,va);norm.crossVectors(e,f);
  const area=norm.length()*.5;if(area<1e-8)continue;norm.normalize();
  const nDot=norm.dot(upv);
  const base=[va,vb,vc].every(p=>Math.abs(p.dot(upv)-minProj)<.14);
  if(base&&nDot<-.95)contact+=area;
  const angle=Math.asin(Math.min(1,Math.abs(nDot)))*180/Math.PI;
  if(!base&&nDot<-.02&&angle>threshold){bad+=area;unsafeCount++}
 }
 return {riskArea:bad,bedContactArea:contact,unsafeCount};
}
function suggestOrientation(mesh,threshold=45){
 const candidates=[
  {name:'Base down (upright)',axis:[0,1,0]},
  {name:'Back side down',axis:[0,0,1]},
  {name:'Front side down',axis:[0,0,-1]},
  {name:'Right side down',axis:[1,0,0]},
  {name:'Left side down',axis:[-1,0,0]},
  {name:'Tips down (not recommended)',axis:[0,-1,0]}
 ];
 const scored=candidates.map((c,i)=>({...c,...orientationCheck(mesh,c.axis,threshold)}));
 const current=scored[0];
 // For crystal installations, a stable base is valuable. Only suggest a side
 // orientation if it avoids far more problematic overhang area AND has contact.
 const valid=scored.filter((c,i)=>i===0||(i<5&&c.bedContactArea>Math.max(40,current.bedContactArea*.2)));
 valid.sort((a,b)=>(a.riskArea+Math.max(0,current.bedContactArea-a.bedContactArea)*.4)-(b.riskArea+Math.max(0,current.bedContactArea-b.bedContactArea)*.4));
 const choice=valid[0]||current;
 return {name:choice.name,baseDown:current,alternatives:scored.map(({name,riskArea,bedContactArea})=>({name,riskArea,bedContactArea}))};
}
export function analyzeGeometry(geom,threshold=45){
 const p=geom.getAttribute('position').array;
 const m={points:new Float32Array(p),triangles:Uint32Array.from({length:p.length/3},(_,i)=>i)};
 return triQuality(m,threshold);
}
function positionedInnerCrystal(c,s,openingY,wall){
 // A simplified scaled-down cavity. It is intentionally NOT described as a
 // uniform normal-offset shell; geometric wall thickness still needs verification.
 const small={...c,h:Math.max(8,c.h*.79-wall*1.3),r:Math.max(1,c.r-wall/Math.max(.35,Math.min(s.bottomScale,s.topScale))),
  leanX:c.leanX*.84,leanZ:c.leanZ*.84};
 const innerSettings={...s,cornerRadius:Math.max(0,s.cornerRadius-wall*.25),
  tipFlat:Math.max(.2,s.tipFlat*.7),shoulderRound:0};
 const g=crystalGeometry(THREE,small,innerSettings);
 const mesh=new THREE.Mesh(g);mesh.position.set(c.x,openingY,c.z);
 mesh.rotation.set(c.rx||0,c.rotation||0,c.rz||0);
 mesh.scale.set(c.sx||c.scale||1,c.sy||c.scale||1,c.sz||c.scale||1);
 mesh.updateMatrixWorld(true);
 return mesh;
}
function putSocket(wasm,hold,pos,radius,roofY,start=-3,profile){
 const p=profile||resolvePixelProfile({pixelDiameter:12,pixelFit:0});
 const tipY=Math.max(start+1.4,Math.min(roofY-2.8,start+p.bodyHeight)),available=tipY-start;
 const capRise=Math.min(Math.max(.35,p.capHeight),2.5,available*.24);
 const shaftEnd=tipY-capRise,depth=Math.max(.5,shaftEnd-start);
 const bodyRadius=Math.max(.8,p.boreDiameter/2),cutters=[];
 const cylinder=(r,y,h)=>hold(wasm.Manifold.cylinder(h,r,r,32).rotate([-90,0,0]).translate([pos.x,y,pos.z]));
 const lip=Math.min(.7,Math.max(0,Number(p.retentionLip)||0));
 const lipFrom=Math.max(1.9,Number(p.flangeHeight||0)+.8),lipWidth=1.4;
 if(lip>0&&depth>lipFrom-start+lipWidth+2&&bodyRadius-lip>1.4){
  // Narrow bore section above the flange. Physical snap-fit is unverified.
  cutters.push(cylinder(bodyRadius,start,lipFrom-start));
  cutters.push(cylinder(bodyRadius-lip,lipFrom,lipWidth));
  cutters.push(cylinder(bodyRadius,lipFrom+lipWidth,depth-(lipFrom+lipWidth-start)));
 }else cutters.push(cylinder(bodyRadius,start,depth));
 if(p.kind!=='seed'&&p.flangeHeight>.1&&p.maxDiameter>p.boreDiameter+.1)
  cutters.push(cylinder(p.maxDiameter/2,-.5,Math.min(depth,p.flangeHeight+.5)));
 cutters.push(hold(wasm.Manifold.sphere(bodyRadius,32).scale([1,capRise/bodyRadius,1]).translate([pos.x,shaftEnd,pos.z])));
 if(p.wireWidth>.1&&p.wireDepth>.1){
  // Two shallow underside cable reliefs; not full wiring channels.
  const w=Math.max(.8,p.wireWidth+p.clearance),h=Math.min(3,p.wireDepth),len=bodyRadius+4;
  for(const sign of [-1,1]){
   cutters.push(hold(wasm.Manifold.cube([w,h+.5,len])
    .translate([pos.x-w/2,-.4,pos.z+(sign===1?bodyRadius*.35:-bodyRadius-4)])));
  }
 }
 return {solid:hold(wasm.Manifold.union(cutters)),roofY,tipY,shaftEnd,
  capRise,remainingWall:roofY-tipY,profileId:p.id,retentionLip:lip};
}
function cleanupAll(list){
 for(const m of list){try{m.delete()}catch(e){}}
}
// Closed tapered light tunnel aligned with an individual crystal's actual
// orientation. Geometry is part of the manufacturable Boolean cut.
function lightTunnel(wasm,start,end,rStart,rEnd){
 const direction=new THREE.Vector3().subVectors(end,start),length=direction.length();
 if(length<1)return null;
 const geom=new THREE.CylinderGeometry(rEnd,rStart,length,16,1,false);
 const tube=new THREE.Mesh(geom);
 tube.position.copy(start).add(end).multiplyScalar(.5);
 tube.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
 const solid=convertMesh(wasm,tube);
 geom.dispose();return solid;
}
// Real open underside and integral 45-degree flared buttresses, independent of
// Cura infill. This does NOT manufacture an empty space within each spike.
function vaultCylinder(wasm,hold,x,z,y,height,r0,r1=r0){
 return hold(wasm.Manifold.cylinder(height,r0,r1,16).rotate([-90,0,0]).translate([x,y,z]));
}
function vaultInside(p,outline){
 let inside=false;
 for(let i=0,j=outline.length-1;i<outline.length;j=i++){
  const a=outline[i],b=outline[j];
  if(((a.z>p.z)!==(b.z>p.z))&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)inside=!inside;
 }
 return inside;
}
function vaultEdgeDistance(p,poly){
 let best=Infinity;
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],dx=b.x-a.x,dz=b.z-a.z;
  const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));
  best=Math.min(best,Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t));
 }
 return best;
}
function createPrintVault(wasm,hold,crystals,s,hardware,warnings){
 const stats={applied:false,supportCount:0,pitch:0,gapEstimate:0};
 if(s.baseType==='none'||Number(s.baseHeight)<11||s.undersideAccess){
  warnings.push('Zero-infill vault requires an integrated base at least 11 mm tall and the separate underside-access pocket disabled.');
  return {cutter:null,stats};
 }
 const outline=hardware.polygon;
 if(outline.length<3)return {cutter:null,stats};
 const wall=2.8,offset=3;
 const settings={...s,baseHeight:Math.max(3,Number(s.baseHeight)-wall+offset),
  baseWidth:Math.max(0,Number(s.baseWidth||0)-wall*.3),
  baseEdgeRadius:Math.max(0,Number(s.baseEdgeRadius||0)-.5),undersideAccess:false};
 const geom=baseGeometry(THREE,crystals,settings);
 const box=new THREE.Box3().setFromBufferAttribute(geom.attributes.position);
 const centre=box.getCenter(new THREE.Vector3()),minDim=Math.min(box.max.x-box.min.x,box.max.z-box.min.z);
 const inset=Math.max(.67,Math.min(.98,1-2*wall/Math.max(12,minDim)));
 geom.translate(-centre.x,0,-centre.z);geom.scale(inset,1,inset);geom.translate(centre.x,-offset,centre.z);
 const cavity=hold(convertMesh(wasm,new THREE.Mesh(geom)));geom.dispose();
 const xmin=Math.min(...outline.map(p=>p.x)),xmax=Math.max(...outline.map(p=>p.x)),
   zmin=Math.min(...outline.map(p=>p.z)),zmax=Math.max(...outline.map(p=>p.z));
 const width=xmax-xmin,depth=zmax-zmin;
 const pitch=Math.max(16,Math.min(40,Number(s.vaultSupportPitch||25)),Math.sqrt(width*depth/65));
 const nx=Math.max(1,Math.ceil(width/pitch)),nz=Math.max(1,Math.ceil(depth/pitch));
 const keep=[],hardwarePositions=[...hardware.sockets,...hardware.mounts];
 let supports=0;
 function flaredPillar(x,z,radius,flare,top){
  const rise=Math.max(1.4,flare-radius),stemTop=Math.max(2,top-rise);
  const stem=vaultCylinder(wasm,hold,x,z,-.7,stemTop+.9,radius);
  const cap=vaultCylinder(wasm,hold,x,z,stemTop-.1,Math.max(1,top-stemTop+.5),radius,flare);
  keep.push(hold(stem.add(cap)));
 }
 for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){
  const p={x:xmin+(i+.5)*width/nx,z:zmin+(j+.5)*depth/nz};
  if(!vaultInside(p,outline)||vaultEdgeDistance(p,outline)<7)continue;
  if(hardwarePositions.some(h=>Math.hypot(p.x-h.x,p.z-h.z)<h.radius+8))continue;
  const roof=baseSurfaceHeight(crystals,s,p.x,p.z)-.7;
  if(roof<8)continue;
  flaredPillar(p.x,p.z,2.4,Math.max(5,Math.min(pitch*.32,roof*.4)),roof);supports++;
 }
 // Physical collars around all underside LED/mount bores remain after cavity cut.
 // Side-facing vent holes are drilled separately after the bore operation.
 for(const p of hardwarePositions){
  const roof=baseSurfaceHeight(crystals,s,p.x,p.z)-.5;
  keep.push(vaultCylinder(wasm,hold,p.x,p.z,-.7,Math.max(6,roof+1.1),p.radius+2.8));
 }
 let cutter=cavity;
 if(keep.length){
  const structure=hold(wasm.Manifold.union(keep));
  cutter=hold(cavity.subtract(structure));
 }
 stats.applied=true;stats.supportCount=supports;stats.pitch=+pitch.toFixed(1);
 stats.gapEstimate=+Math.max(0,pitch-2*Math.max(5,pitch*.32)).toFixed(1);
 if(!supports)warnings.push('No internal roof buttresses fitted. Inspect the cavity bridge spans in Cura.');
 if(stats.gapEstimate>25)warnings.push('Zero-infill vault may retain roof gaps above 25 mm. Reduce buttress spacing or add Cura supports/infill.');
 warnings.push('Integral base buttresses are supportless-first geometry, not a guarantee. Validate bridging and print orientation in Cura.');
 return {cutter,stats};
}
export function prepareFabrication({wasm,meshes,crystals,settings}){
 if(!wasm?.Manifold || !wasm?.Mesh)throw new Error('Manifold engine has not loaded');
 // Caller explicitly supplies exportable components; preview visibility may
 // be off when the joined manufacturing mesh is being inspected.
 const s=settings,live=meshes.filter(Boolean),owned=[];
 const hold=m=>{owned.push(m);return m};
 const warnings=[];
 if(live.length===0)throw new Error('There is no visible geometry to manufacture');
 if(s.baseType==='none'&&live.length>1)warnings.push('No base: the exported model may contain disconnected individual crystals.');
 let combined;
 try{
  const components=live.map(m=>hold(convertMesh(wasm,m)));
  combined=hold(wasm.Manifold.union(components));
  assertSolid(combined,'Unioned cluster');
  // When the lower rim of a rigidly tilted crystal is fully embedded in a
  // shallow mound, it can extend below the build plate. Intersect with a
  // half-space to leave a flat Y=0 bottom before drilling holes.
  if(s.baseType!=='none'){
   const bb=combined.boundingBox(),low=bb.min,high=bb.max;
   if(low[1]<-.025){
    const bed=hold(wasm.Manifold.cube([
      high[0]-low[0]+4,high[1]+4,high[2]-low[2]+4
     ]).translate([low[0]-2,0,low[2]-2]));
    const trimmed=hold(combined.intersect(bed));
    assertSolid(trimmed,'Build plate underside');
    combined=trimmed;
    warnings.push('Tilted roots below the build plate were levelled to Y=0. For deeper intact roots, increase base thickness.');
   }
  }
  const initialVolume=combined.volume();
  const hardware=planHardware(crystals,s);
  if(hardware.collisions.length)throw new Error('Hardware holes overlap.');
  warnings.push(...hardware.messages);
  // Permanent semicircular fixing ears are fused to the base before drilling.
  if(hardware.tabs.length){
   const tabs=hardware.tabs.map(tab=>hold(wasm.Manifold.cylinder(
     tab.thickness,tab.radius,tab.radius,48).rotate([-90,0,0]).translate([tab.x,0,tab.z])));
   const joined=hold(combined.add(hold(wasm.Manifold.union(tabs))));
   assertSolid(joined,'Semicircular edge fixing tabs');
   combined=joined;
  }
  let hollowed=0,hollowPorts=0,skippedHollowPorts=0;
  let vault={applied:false,supportCount:0,pitch:0,gapEstimate:0};
  if(s.baseVault&&s.hollowCrystals)warnings.push('Base vault is unavailable during experimental whole-cluster hollowing.');
  if(s.baseVault&&!s.hollowCrystals){
   const made=createPrintVault(wasm,hold,crystals,s,hardware,warnings);
   vault=made.stats;
   if(made.cutter){
    const carved=hold(combined.subtract(made.cutter));assertSolid(carved,'Open underside zero-infill vault');
    combined=carved;
   }
  }
  if(s.hollowCrystals){
   // Balloon construction: shell the UNIONED cluster, then hollow the root
   // and connect its air chamber to larger crystals with internal ports.
   // This differs from separate sealed miniature cavities per crystal.
   const thickness=Math.max(.8,Number(s.wallThickness)||1.2);
   const kernel=hold(wasm.Manifold.sphere(thickness,16));
   const eroded=hold(combined.minkowskiDifference(kernel));
   if(!eroded.isEmpty()){
    const shell=hold(combined.subtract(eroded));
    assertSolid(shell,'Eroded crystal shell');
    // A solid reinforcing band at the lower root prevents narrow joints
    // breaking off from the upper thin-walled crystal points.
    const bb=combined.boundingBox(),low=bb.min,hi=bb.max;
    const rootHeight=Math.min(hi[1]-low[1],Math.max(5,Number(s.baseHeight||0)+3));
    const rootCut=hold(wasm.Manifold.cube([hi[0]-low[0]+4,rootHeight,hi[2]-low[2]+4])
      .translate([low[0]-2,low[1],low[2]-2]));
    const root=hold(combined.intersect(rootCut));
    const reinforced=hold(shell.add(root));
    assertSolid(reinforced,'Reinforced outer shell');
    combined=reinforced;
    const channels=[];
    const base=live.find(m=>m.userData?.isBase);
    if(base){
      const baseBody=hold(convertMesh(wasm,base));
      const baseInside=hold(baseBody.minkowskiDifference(kernel));
      if(!baseInside.isEmpty())channels.push(baseInside);
    }
    let connected=0;
    for(const c of crystals){
      if(c.hidden)continue;
      const obj=live.find(m=>m.userData?.crystalId===c.id);
      if(!obj){skippedHollowPorts++;continue}
      obj.updateMatrixWorld(true);
      const shape={...s,...(c.shape||{})};
      const minScale=Math.min(c.sx||c.scale||1,c.sz||c.scale||1);
      const safeRadius=c.r*Math.min(shape.bottomScale,shape.topScale)*minScale-thickness*2.2;
      if(safeRadius<1.25){skippedHollowPorts++;continue}
      const rRoot=Math.min(4.2,Math.max(1.05,safeRadius*.43));
      const rEnd=Math.min(rRoot*.65,Math.max(.65,safeRadius*.19));
      const tipFraction=Math.min(.48,Math.max(.1,shape.tipLength||.27));
      const up=c.h*(1-tipFraction*.40);
      const root=new THREE.Vector3(0,0,0).applyMatrix4(obj.matrixWorld);
      const tip=new THREE.Vector3((c.leanX||0)*up,up,(c.leanZ||0)*up).applyMatrix4(obj.matrixWorld);
      if(tip.y-root.y<Math.max(6,thickness*3)){skippedHollowPorts++;continue}
      // Vertical base conduit joins the eroded dome; the upper conduit
      // follows the leaning / rotated crystal spine rather than cutting
      // straight through the external facets.
      const floor=new THREE.Vector3(root.x,Math.max(.65,thickness*.7),root.z);
      const rootEntry=new THREE.Vector3(root.x,Math.max(root.y+1.5,floor.y+1),root.z);
      const stem=lightTunnel(wasm,floor,rootEntry,rRoot,rRoot);
      const shaft=lightTunnel(wasm,rootEntry,tip,rRoot,rEnd);
      if(stem)channels.push(hold(stem));
      if(shaft)channels.push(hold(shaft));
      connected++;
    }
    hollowPorts=connected;
    if(skippedHollowPorts)warnings.push(skippedHollowPorts+' narrow or strongly tilted crystal(s) could not accept a safe light tunnel; these may remain partly solid.');
    if(channels.length){
      const channelUnion=hold(wasm.Manifold.union(channels));
      const opened=hold(combined.subtract(channelUnion));
      assertSolid(opened,'Opened shared chamber');
      combined=opened;
    }
    hollowed=1;
    warnings.push('Balloon shell uses a spherical inset and shared internal base chamber with crystal air passages. Exact minimum wall thickness and accessibility still require inspection in Cura.');
    if(connected===0)warnings.push('No internal crystal passages met the minimum clearance. Enlarge crystals rather than reducing walls below a safe material thickness.');
   }else{
    warnings.push('The cluster is too thin for a hollow cavity at the selected wall thickness.');
   }
  }
  // Single authoritative feature plan shared with the colour-coded viewport.
  // Pixel sockets are placed first; mount holes are searched for a safe
  // alternative location. Features that cannot fit are SKIPPED and warned.
  let socketsCut=0,mountingHolesCut=0,ventCuts=0,socketCeilings=[],wireChannelsCut=0;
  if(hardware.sockets.length){
   const cutters=[];
   for(const pos of hardware.sockets){
    const roof=baseSurfaceHeight(crystals,s,pos.x,pos.z);
    const bore=putSocket(wasm,hold,pos,pos.radius,roof,-3,resolvePixelProfile(s));
    cutters.push(bore.solid);
    socketCeilings.push({x:pos.x,z:pos.z,roofY:bore.roofY,tipY:bore.tipY,
      straightHeight:bore.shaftEnd,capRise:bore.capRise,remainingWall:bore.remainingWall,profileId:bore.profileId,retentionLip:bore.retentionLip});
    if(bore.shaftEnd<20)warnings.push('LED bore at ('+pos.x.toFixed(1)+', '+pos.z.toFixed(1)+') has only '+Math.max(0,bore.shaftEnd).toFixed(1)+' mm of full-width clearance. Confirm the actual LED housing fits.');
   }
   const holes=hold(wasm.Manifold.union(cutters));
   const cut=hold(combined.subtract(holes));assertSolid(cut,'LED socket cuts');
   combined=cut;socketsCut=hardware.sockets.length;
   if(vault.applied){
    // Cross-drill collar windows into the common base chamber. The LED inlet
    // is not allowed to terminate at an unbroken solid wall.
    const vents=[];
    for(const p of hardware.sockets){
     const roof=baseSurfaceHeight(crystals,s,p.x,p.z);
     const y=Math.max(6,Math.min(roof-6,Math.max(12,Number(s.baseHeight||0)-4)));
     const r=Math.max(1.5,Math.min(2.5,p.radius*.38)),span=2*(p.radius+5);
     vents.push(hold(wasm.Manifold.cylinder(span,r,r,16).rotate([0,90,0]).translate([p.x-span/2,y,p.z])));
     vents.push(hold(wasm.Manifold.cylinder(span,r,r,16).translate([p.x,y,p.z-span/2])));
    }
    if(vents.length){
     const joined=hold(wasm.Manifold.union(vents));
     const opened=hold(combined.subtract(joined));assertSolid(opened,'LED collar side vents');
     combined=opened;ventCuts=hardware.sockets.length;
    }
   }
  }
  // Targeted channels physically connect accepted LED socket ceilings to
  // crystal spines without expensive whole-union erosion. Default OFF.
  const targetedPlan=planTargetedLightPaths(crystals,s,hardware);
  warnings.push(...targetedPlan.warnings);
  let targetedLightCount=0;
  if(targetedPlan.paths.length){
   const channels=[];
   for(const path of targetedPlan.paths){
    const crystalMesh=live.find(m=>m.userData?.crystalId===path.id);
    if(!crystalMesh)continue;
    crystalMesh.updateMatrixWorld(true);
    for(const [a,b] of path.baseSegments){
     const cylinder=lightTunnel(wasm,new THREE.Vector3(a.x,a.y,a.z),new THREE.Vector3(b.x,b.y,b.z),path.boreRadius,path.boreRadius);
     if(cylinder)channels.push(hold(cylinder));
    }
    const bottom=new THREE.Vector3(0,0,0).applyMatrix4(crystalMesh.matrixWorld);
    const top=new THREE.Vector3(0,path.crystalHeightMm,0).applyMatrix4(crystalMesh.matrixWorld);
    const root=path.baseSegments[2][1];
    const rootPoint=new THREE.Vector3(root.x,root.y,root.z);
    const step=new THREE.Vector3(bottom.x,Math.max(root.y+2.5,bottom.y+3),bottom.z);
    const lower=lightTunnel(wasm,rootPoint,step,path.boreRadius,path.boreRadius);
    if(lower)channels.push(hold(lower));
    const shaft=lightTunnel(wasm,step,top,path.boreRadius,Math.max(.7,path.boreRadius*.65));
    if(shaft)channels.push(hold(shaft));
    targetedLightCount++;
   }
   if(channels.length){
    const opened=hold(combined.subtract(hold(wasm.Manifold.union(channels))));
    assertSolid(opened,'Targeted LED-to-crystal light passages');
    combined=opened;
   }
   warnings.push('Targeted light bores cut from LED roofs into eligible crystal roots. Inspect Cura cross-sections and physical light transmission before treating them as working optical passages.');
  }
  // Single shared plan for preview, manufacturing and wiring CSV.
  if(hardware.wirePlan?.routes.length){
   const grooves=hardware.wirePlan.routes.map(route=>{
    const dx=route.b.x-route.a.x,dz=route.b.z-route.a.z;
    const length=Math.hypot(dx,dz)+.5,angle=-Math.atan2(dz,dx)*180/Math.PI;
    const mx=(route.a.x+route.b.x)/2,mz=(route.a.z+route.b.z)/2;
    return hold(wasm.Manifold.cube([length,route.depth+.6,route.width])
     .translate([-length/2,-.5,-route.width/2])
     .rotate([0,angle,0]).translate([mx,0,mz]));
   });
   const cut=hold(combined.subtract(hold(wasm.Manifold.union(grooves))));
   assertSolid(cut,'Underside wiring grooves');combined=cut;
   wireChannelsCut=grooves.length;
   warnings.push('Shallow underside wiring grooves are not complete enclosed conduits. Check physical wire bend radius, exit and strain relief.');
  }
  if(hardware.sockets.length&&Number(s.baseHeight||0)<resolvePixelProfile(s).bodyHeight)
   warnings.push('Selected LED body exceeds base depth; verify fit and protrusion in Cura.');
  if(Number(s.pixelRetentionLip||0)>0)warnings.push('Experimental socket retaining ridge '+s.pixelRetentionLip+' mm: fit-test a real pixel before relying on this unverified compression feature.');
  if(s.cutSockets)warnings.push('Pixel fits are nominal. Test print tolerances and retention before installing any electronics.');
  if(hardware.mounts.length){
   const cutters=[];
   for(const pos of hardware.mounts){
    cutters.push(hold(wasm.Manifold.cylinder(pos.depth+.5,pos.radius,pos.radius,32)
      .rotate([-90,0,0]).translate([pos.x,-.5,pos.z])));
   }
   const holes=hold(wasm.Manifold.union(cutters));
   const cut=hold(combined.subtract(holes));assertSolid(cut,'Mounting-hole cuts');
   combined=cut;mountingHolesCut=hardware.mounts.length;
  }
  if(hardware.tabHoles.length){
   // The tab holes are open through the entire ear thickness, outside the
   // main base outline, to accept a bolt or looped cable tie.
   const tabCutters=hardware.tabHoles.map(p=>hold(wasm.Manifold.cylinder(
     p.depth+2,p.radius,p.radius,40).rotate([-90,0,0]).translate([p.x,-1,p.z])));
   const joined=hold(wasm.Manifold.union(tabCutters));
   const opened=hold(combined.subtract(joined));
   assertSolid(opened,'Edge fixing bolt and cable-tie holes');
   combined=opened;mountingHolesCut+=hardware.tabHoles.length;
  }
  if(hardware.tabs.length)warnings.push('Perimeter fixing tabs are not rated structural attachments. Physically test hole sizes, printed web strength and layer adhesion before suspending the sculpture.');
  if(s.mount==='Ceiling mount')
    warnings.push('Ceiling mounting demands properly rated fixings and secondary retention. A printed bracket alone is not a certified overhead support.');
  if(s.mount==='Magnet inserts')warnings.push('Magnet pockets are nominal 10.2 mm diameter; verify magnet dimensions and required retention.');
  if(s.mount==='Threaded insert M3')warnings.push('M3 insert holes are nominal 4.2 mm; verify insert type and installation tolerances.');
  if(s.mount==='Detachable plate'){
   const plannedPlate=planDetachablePlate(s,hardware);
   if(!plannedPlate.valid)warnings.push(...plannedPlate.reasons);
   else warnings.push('Detachable mounting plate has matching M3 insert holes and a separately downloadable plate STL. The bolts and inserts must be purchased and fit-tested.');
  }
  // A manifold STL can still contain *sealed, unlit void shells*.
  // Retain only outward-connected material shells, filling inaccessible
  // enclosed voids. Open lumens connected to the pixel inlet are part of
  // the outward shell and are kept.
  let sealedCavitiesFilled=0;
  if(s.hollowCrystals){
   const shells=combined.decompose().map(hold);
   const positive=shells.filter(p=>p.volume()>.01);
   sealedCavitiesFilled=shells.filter(p=>p.volume()<-.01).length;
   if(sealedCavitiesFilled&&positive.length){
    const repaired=hold(wasm.Manifold.union(positive));
    assertSolid(repaired,'Sealed cavity cleanup');
    combined=repaired;
    warnings.push(sealedCavitiesFilled+' sealed inaccessible void shells were filled, rather than leaving unlit air pockets inside the model.');
   }
  }
  const resultMesh=combined.getMesh();
  const geom=fromResultMesh(resultMesh),indexed=compactMesh(resultMesh);
  const bounds=combined.boundingBox();
  const quality=triQuality(indexed,s.overhang||45);
  const volume=combined.volume(),parts=combined.decompose();
  // Decomposition counts enclosed void surfaces separately: a sealed internal
  // cavity has *negative* signed volume and is not a detached solid piece.
  const shellVolumes=parts.map(x=>x.volume());
  const disconnected=shellVolumes.filter(v=>v>Math.max(0.01,volume*1e-8)).length;
  const internalCavities=shellVolumes.filter(v=>v<-.01).length;
  cleanupAll(parts);
  if(disconnected>1)warnings.push(disconnected+' separate solids detected; the assembly is not one connected piece.');
  if(internalCavities>0)warnings.push(internalCavities+' isolated enclosed cavities were detected. These may not receive light from the underside pixel and should be inspected in a slicer.');
  const baseDepth=Number(s.baseHeight||0);
  const baseFitsPixel=baseDepth>=resolvePixelProfile(s).bodyHeight+1;
  const lightPathScreened=!!s.hollowCrystals&&socketsCut>0&&hollowPorts>0&&internalCavities===0;
  if(s.hollowCrystals&&!lightPathScreened)
    warnings.push('A single shared illuminated cavity is NOT established by the topology screening. Inspect the cross-section and pixel channel in Cura.');
  if(vault.applied&&ventCuts<socketsCut)warnings.push('Some LED bores lack side access to the base chamber. Review the print mesh before exporting.');
  if(quality.unsafeTriangles>0)warnings.push('Overhang analysis found '+quality.unsafeTriangles+' potentially unsupported triangles. These are not guaranteed to need supports, but require checking in a slicer.');
  if(s.undersideAccess)warnings.push('The underside access pocket has a ceiling that may need supports. Consider switching the pocket off for supportless-first printing.');
  const mins=bounds.min,maxs=bounds.max;
  const size=mins.map((v,i)=>maxs[i]-v);
  const orientation=suggestOrientation(indexed,s.overhang||45);
  const buildVolumes={
   'Ultimaker 3 Extended':[215,215,300],
   'Ultimaker 2+':[223,223,205]
  };
  if(s.printer==='Custom / other'){
   buildVolumes['Custom / other']=[
    Math.min(1500,Math.max(30,Number(s.printerX)||220)),
    Math.min(1500,Math.max(30,Number(s.printerY)||220)),
    Math.min(1500,Math.max(30,Number(s.printerZ)||220))
   ];
   warnings.push('Custom printer dimensions entered manually; verify in your slicer.');
  }
  const volumeLimit=buildVolumes[s.printer];
  const printerFits=!volumeLimit||(
   size[1]<=volumeLimit[2]+.001&&(
    (size[0]<=volumeLimit[0]+.001&&size[2]<=volumeLimit[1]+.001)||
    (size[2]<=volumeLimit[0]+.001&&size[0]<=volumeLimit[1]+.001)
   ));
  const roofReview=estimateRoofReview(hardware.polygon,s,vault);
  if(roofReview.estimateMm>30)
   warnings.push('Worst-case 0%-infill roof span proxy: '+roofReview.estimateMm.toFixed(1)+' mm. This is a 2D indicator, NOT calculated Cura bridge geometry; check layer preview.');
  if(s.baseProfile==='Full dome / hill'&&Number(s.sideWall||0)<20)
   warnings.push('Full hill has very shallow edges: verify real edge thickness, adhesion and channel clearances.');
  if(!printerFits)warnings.push('Model exceeds the '+s.printer+' build volume ('+volumeLimit.join(' × ')+' mm) in an upright orientation. Split the model or choose another machine.');
  if(orientation.name!=='Base down (upright)')warnings.push('A different orientation may reduce unsupported area: '+orientation.name+'. Stability and support requirements still need slicer verification.');
  if(s.hollowCrystals&&!s.cutSockets&&!s.undersideAccess)warnings.push('Hollow chambers may be sealed. Enable socket openings or underside access for LED service and venting.');
  const report={ready:true,status:'Manifold mesh validated',printerFits,printerLimit:volumeLimit||null,roofReview,orientation,triangleCount:combined.numTri(),volumeMm3:volume,materialPLAgrams:volume/1000*1.24,initialVolume,disconnected,internalCavities,shellVolumes,
    bounds:size,quality,hollowed,hollowPorts,skippedHollowPorts,targetedLightCount,targetedLightSkipped:targetedPlan.skipped,baseFitsPixel,lightPathScreened,sealedCavitiesFilled,vault,ventCuts,socketCeilings,socketsCut,mountingHolesCut,edgeTabs:hardware.tabs.length,wireChannelsCut,wireLengthMm:hardware.wirePlan?.lengthMm||0,unroutedPixels:hardware.wirePlan?.unrouted||0,wireExitAdded:!!hardware.wirePlan?.exitAdded,
     plannedSockets:hardware.sockets,plannedMounts:[...hardware.mounts,...hardware.tabHoles],hardware,warnings,mesh:indexed};
  return {geometry:geom,report};
 }finally{cleanupAll(owned)}
}
// Converts Three.js Y-up preview into the Z-up coordinate convention used by slicers.
export function encodeSTL(geometry){
 const p=geometry.getAttribute('position').array,count=Math.floor(p.length/9);
 const bytes=new ArrayBuffer(84+50*count),dv=new DataView(bytes);dv.setUint32(80,count,true);
 let off=84;const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),n=new THREE.Vector3();
 for(let i=0;i<p.length;i+=9){
  a.set(p[i],-p[i+2],p[i+1]);b.set(p[i+3],-p[i+5],p[i+4]);c.set(p[i+6],-p[i+8],p[i+7]);
  n.subVectors(b,a).cross(new THREE.Vector3().subVectors(c,a)).normalize();
  for(const v of [n,a,b,c]){dv.setFloat32(off,v.x,true);dv.setFloat32(off+4,v.y,true);dv.setFloat32(off+8,v.z,true);off+=12}
  dv.setUint16(off,0,true);off+=2;
 }
 return new Uint8Array(bytes);
}
export function saveSTL(geometry,filename='crystal-forge-manifold.stl'){
 const blob=new Blob([encodeSTL(geometry)],{type:'model/stl'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;link.click();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
 return blob;
}
// Z-up 3MF and a minimal spec-compliant uncompressed ZIP archive, without dependencies.
export function save3MF(geom,filename='crystal-forge.3mf'){
 const pos=geom.getAttribute('position').array;
 const v=[],faces=[],map=new Map();
 const key=(x,y,z)=>[x,y,z].map(n=>n.toFixed(5)).join(',');
 for(let i=0;i<pos.length;i+=9){
  const ids=[];
  for(let j=0;j<3;j++){const x=pos[i+j*3],y=-pos[i+j*3+2],z=pos[i+j*3+1],k=key(x,y,z);
   if(!map.has(k)){map.set(k,v.length);v.push([x,y,z])}ids.push(map.get(k))}
  faces.push(ids);
 }
 const esc=n=>Number(n).toPrecision(9);
 const xml='<?xml version="1.0" encoding="UTF-8"?>'+
  '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">'+
  '<resources><object id="1" type="model"><mesh><vertices>'+v.map(p=>'<vertex x="'+esc(p[0])+'" y="'+esc(p[1])+'" z="'+esc(p[2])+'"/>').join('')+
  '</vertices><triangles>'+faces.map(q=>'<triangle v1="'+q[0]+'" v2="'+q[1]+'" v3="'+q[2]+'"/>').join('')+
  '</triangles></mesh></object></resources><build><item objectid="1"/></build></model>';
 const files=[
  ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>'],
  ['_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'],
  ['3D/3dmodel.model',xml]
 ];
 const enc=new TextEncoder(),chunks=[],dir=[];let offset=0;
 function crc32(buf){let crc=0xffffffff;for(const b of buf){crc^=b;for(let k=0;k<8;k++)crc=(crc>>>1)^(crc&1?0xedb88320:0)}return(crc^0xffffffff)>>>0}
 const u16=(buf,o,n)=>new DataView(buf.buffer).setUint16(o,n,true),u32=(buf,o,n)=>new DataView(buf.buffer).setUint32(o,n,true);
 for(const [name,text] of files){
  const file=enc.encode(text),filenameBytes=enc.encode(name),crc=crc32(file);
  const local=new Uint8Array(30+filenameBytes.length);u32(local,0,0x04034b50);u16(local,4,20);u16(local,8,0);u32(local,14,crc);u32(local,18,file.length);u32(local,22,file.length);u16(local,26,filenameBytes.length);local.set(filenameBytes,30);
  chunks.push(local,file);
  const central=new Uint8Array(46+filenameBytes.length);u32(central,0,0x02014b50);u16(central,4,20);u16(central,6,20);u32(central,16,crc);u32(central,20,file.length);u32(central,24,file.length);u16(central,28,filenameBytes.length);u32(central,42,offset);central.set(filenameBytes,46);dir.push(central);
  offset+=local.length+file.length;
 }
 const centralSize=dir.reduce((a,v)=>a+v.length,0);
 const end=new Uint8Array(22);u32(end,0,0x06054b50);u16(end,8,files.length);u16(end,10,files.length);u32(end,12,centralSize);u32(end,16,offset);
 const blob=new Blob([...chunks,...dir,end],{type:'model/3mf'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
 return blob;
}


export function makeCalibrationStrip(wasm,nominal=12){
 const keep=[];const hold=o=>{keep.push(o);return o};
 try{
  // X long, Y upward, Z across: flat-bottom 5mm thick FDM calibration.
  const diameter=Math.max(2,Math.min(30,Number(nominal)||12));
  const pitch=Math.max(12,diameter+9),depth=diameter+10;
  const bar=hold(wasm.Manifold.cube([pitch*5,5,depth]));
  const holes=[];
  for(let i=0;i<5;i++){
   const dia=diameter+(i-2)*.1;
   const core=hold(wasm.Manifold.cylinder(9,dia/2,dia/2,40));
   const turned=hold(core.rotate([-90,0,0]));
   const moved=hold(turned.translate([pitch*(i+.5),-2,depth/2]));
   holes.push(moved);
  }
  const allHoles=hold(wasm.Manifold.union(holes));
  const strip=hold(bar.subtract(allHoles));
  assertSolid(strip,'Socket calibration strip');
  return {geometry:fromResultMesh(strip.getMesh()),diameters:Array.from({length:5},(_,i)=>Math.round((diameter+(i-2)*.1)*100)/100),triangles:strip.numTri()};
 }finally{cleanupAll(keep)}
}
export function splitPreparedMesh(wasm,mesh,cutX=0,jointPlan=null){
 const keep=[];const hold=o=>{keep.push(o);return o};
 try{
  const m=new wasm.Mesh({numProp:3,vertProperties:new Float32Array(mesh.points),triVerts:new Uint32Array(mesh.triangles)});
  m.merge();
  const body=hold(new wasm.Manifold(m));assertSolid(body,'Prepared assembly for splitting');
  const parts=body.splitByPlane([1,0,0],Number(cutX));
  parts.forEach(hold);
  const bores=jointPlan?.points||[];
  const result=parts.map((p,i)=>{
   if(p.isEmpty())return null;
   let piece=p;
   if(bores.length){
    const cutters=bores.map(pt=>{
     const length=pt.depth+.45,r=(pt.diameter+pt.clearance)/2;
     const startX=i===0?Number(cutX)-pt.depth-.15:Number(cutX)-.30;
     return hold(wasm.Manifold.cylinder(length,r,r,40).rotate([0,90,0]).translate([startX,pt.y,pt.z]));
    });
    const opened=hold(piece.subtract(hold(wasm.Manifold.union(cutters))));
    assertSolid(opened,'Split alignment holes '+(i+1));piece=opened;
   }
   assertSolid(piece,'Split '+(i+1));
   return{geometry:fromResultMesh(piece.getMesh()),triangles:piece.numTri(),volume:piece.volume()}
  });
  result.joints=bores.length;
  return result;
 }finally{cleanupAll(keep)}
}

export function makeSplitPinCoupon(wasm,points=[]){
 if(!points.length)return null;
 const keep=[];const hold=x=>{keep.push(x);return x};
 try{
  const rods=points.map((pt,i)=>hold(wasm.Manifold.cylinder(pt.depth*2-.5,pt.diameter/2,pt.diameter/2,40)
   .rotate([-90,0,0]).translate([i*(pt.diameter+6),0,0])));
  const body=hold(wasm.Manifold.union(rods));assertSolid(body,'Alignment pin coupon');
  return {geometry:fromResultMesh(body.getMesh()),count:points.length};
 }finally{cleanupAll(keep)}
}

export function makeDetachablePlate(wasm,plan){
 if(!plan?.valid||!plan.bounds||!Array.isArray(plan.holes)||plan.holes.length!==2)
  throw new Error('Cannot generate plate without two valid registered mounting holes.');
 const keep=[],hold=x=>{keep.push(x);return x};
 try{
  const {width,depth,thickness}=plan.bounds;
  const slab=hold(wasm.Manifold.cube([width,thickness,depth]).translate([-width/2,0,-depth/2]));
  const cutters=plan.holes.map(h=>hold(wasm.Manifold.cylinder(thickness+2,2.3,2.3,48)
   .rotate([-90,0,0]).translate([h.x,-1,h.z])));
  const plate=hold(slab.subtract(hold(wasm.Manifold.union(cutters))));
  assertSolid(plate,'Detachable plate with M3 clearance holes');
  return {geometry:fromResultMesh(plate.getMesh()),holes:plan.holes,thickness};
 }finally{cleanupAll(keep)}
}

export function makeSteppedPixelCoupon(wasm,settings){
 const p=resolvePixelProfile(settings),keep=[],hold=x=>{keep.push(x);return x};
 try{
  const pitch=Math.max(22,p.maxDiameter+11),thick=Math.max(16,p.bodyHeight+6),width=Math.max(18,p.maxDiameter+8);
  const body=hold(wasm.Manifold.cube([pitch*3,thick,width]));
  const cuts=[];
  const fits=[-.15,0,.15];
  for(let i=0;i<3;i++){
   const at={x:pitch*(i+.5),z:width/2},profile={...p,clearance:Number(p.clearance)+fits[i],
    boreDiameter:p.boreDiameter+fits[i],maxDiameter:p.maxDiameter+fits[i]};
   const bore=putSocket(wasm,hold,at,profile.maxDiameter/2,thick,-3,profile);
   cuts.push(bore.solid);
  }
  const finished=hold(body.subtract(hold(wasm.Manifold.union(cuts))));
  assertSolid(finished,'3-position stepped LED socket coupon');
  return {geometry:fromResultMesh(finished.getMesh()),diameters:fits.map(x=>Number((p.boreDiameter+x).toFixed(2))),
   profileName:p.name,triangles:finished.numTri()};
 }finally{cleanupAll(keep)}
}
