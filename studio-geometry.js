import {tileWallPosition} from './studio-native-routing.js';
import {putSocket} from './fabrication-v1.js';
import {socketShoulderRise} from './pixel-profiles.js';
import {bevelTopSolid} from './studio-top-bevel.js';
import {makePixelReplicaRecipe} from './pixel-replica.js';
/* Shared solid recipes. Preview components may overlap; only prepareRecipe
 * Boolean results may reach manufacturing exporters. Units mm; Y-up. */
function ringSolidGeometry(THREE,rings,top){
 const sides=48,vertices=[],faces=[];
 for(const [y,rx,rz] of rings){
  for(let side=0;side<sides;side++){
   const angle=side*2*Math.PI/sides;
   vertices.push(rx*Math.cos(angle),y,rz*Math.sin(angle));
  }
 }
 const bottom=vertices.length/3,tip=bottom+1,last=(rings.length-1)*sides;
 vertices.push(0,rings[0][0],0,0,top,0);
 for(let side=0;side<sides;side++){
  const next=(side+1)%sides;
  faces.push(bottom,side,next,tip,last+next,last+side);
  for(let ring=0;ring<rings.length-1;ring++){
   const a=ring*sides+side,b=ring*sides+next,c=a+sides,d=b+sides;
   faces.push(a,c,b,b,c,d);
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geometry.setIndex(faces);
 return geometry;
}
export function recipeGeometry(THREE, part) {
 let geometry;
 if(part.kind==='mesh') {
  geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(part.mesh.points),3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(part.mesh.triangles),1));
 } else if(part.kind==='ring-solid') geometry=ringSolidGeometry(THREE,part.rings,part.top);
 else if(part.kind==='sphere') geometry=new THREE.SphereGeometry(1,part.segments||32,20);
 else if(part.kind==='box') geometry=new THREE.BoxGeometry(...part.size);
 else if(part.kind==='cylinder') geometry=new THREE.CylinderGeometry(part.topRadius??part.radius,part.radius,part.height,48);
 else if(part.kind==='extrude') {
  const make=points=>{const path=new THREE.Shape();points.forEach(([x,z],i)=>i?path.lineTo(x,-z):path.moveTo(x,-z));path.closePath();return path;};
  const shape=make(part.outline);
  for(const hole of part.holes||[])shape.holes.push(make(hole));
  geometry=new THREE.ExtrudeGeometry(shape,{depth:part.height,bevelEnabled:false,steps:1,curveSegments:16});
  geometry.rotateX(-Math.PI/2);
 } else throw Error('Unsupported solid primitive: '+part.kind);
 if(part.kind==='sphere')geometry.scale(...part.radii);
 if(part.rotation)geometry.rotateX(part.rotation[0]),geometry.rotateY(part.rotation[1]),geometry.rotateZ(part.rotation[2]);
 if(part.position)geometry.translate(...part.position);
 geometry.computeVertexNormals();return geometry;
}
export function previewRecipe(THREE, recipe, colours=[0x88bbff,0xffcf70]) {
 const group=new THREE.Group();
 for(const [role,parts] of [['primary',recipe.positive],['secondary',recipe.secondary||[]]])for(const part of parts){
  const mesh=new THREE.Mesh(recipeGeometry(THREE,part),new THREE.MeshStandardMaterial({color:colours[role==='primary'?0:1],roughness:.55,flatShading:false}));
  mesh.userData.materialRole=role;mesh.userData.partId=part.partId;group.add(mesh);
  if(role==='primary'&&recipe.dualMaterial&&recipe.materialSplitRole==='top'){
   const y=recipe.materialSplitHeight;
   mesh.material.clippingPlanes=[new THREE.Plane(new THREE.Vector3(0,-1,0),y)];
   const face=new THREE.Mesh(mesh.geometry.clone(),new THREE.MeshStandardMaterial({color:colours[1],roughness:.55,
    clippingPlanes:[new THREE.Plane(new THREE.Vector3(0,1,0),-y)]}));
   face.userData.materialRole='secondary';face.userData.partId=part.partId;group.add(face);
  }
 }
 const solidSurfaces=group.children.slice();
 const surfaceRay=new THREE.Raycaster();
 group.updateMatrixWorld(true);
 for(const hole of recipe.negative||[])if(hole.pixelHole){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(hole.radius,.18,6,48),
   new THREE.MeshBasicMaterial({color:0xffbe47,depthTest:false}));
  const [x,,z]=hole.position;
  const underside=hole.pixelEntryFace==='underside';
  const outward=new THREE.Vector3(0,underside?-1:1,0);
  if(hole.surface){
   outward.fromArray(hole.surface.normal);
   ring.position.set(x,hole.surface.y,z);
  }else{
   surfaceRay.set(new THREE.Vector3(x,underside?-100:recipe.bounds.height+100,z),new THREE.Vector3(0,underside?1:-1,0));
   const surface=surfaceRay.intersectObjects(solidSurfaces,false)[0];
   ring.position.set(x,surface?.point.y??(underside?0:recipe.bounds.height),z);
  }
  ring.position.addScaledVector(outward,.3);
  ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),outward);
  ring.renderOrder=5;
  ring.userData.previewOnly=true;
  ring.userData.pixelId=hole.pixelId;
  const angle=hole.pixelRotation*Math.PI/180;
  const direction=new THREE.Vector3(Math.cos(angle),0,Math.sin(angle));
  if(hole.surface)direction.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(
   new THREE.Vector3(0,1,0),new THREE.Vector3(...hole.surface.normal).negate()));
  for(const sign of [-1,1]){
   const port=new THREE.ArrowHelper(direction.clone().multiplyScalar(sign),ring.position.clone(),hole.radius+2,sign<0?0x37bbeb:0xffe17c,1.2,.8);
   port.renderOrder=5;port.userData.previewOnly=true;port.userData.pixelPort=hole.pixelId;group.add(port);
  }
  group.add(ring);
  if(typeof document!=='undefined'){
   const canvas=document.createElement('canvas');canvas.width=96;canvas.height=48;
   const text=canvas.getContext('2d');
   text.fillStyle='#193146';text.fillRect(0,0,96,48);text.fillStyle='#fff9db';text.font='bold 32px sans-serif';text.textAlign='center';
   text.fillText('P'+hole.pixelHole.split(' ').at(-1),48,36);
   const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false}));
   tag.position.copy(ring.position).addScaledVector(outward,2);tag.scale.set(6,3,1);tag.renderOrder=6;
   tag.userData.previewOnly=true;tag.userData.pixelLabel=hole.pixelId;group.add(tag);
  }
 }
 for(const mount of recipe.negative||[])if(mount.mountHole){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(mount.radius,.2,6,48),
   new THREE.MeshBasicMaterial({color:0xb783ff,depthTest:false}));
  ring.rotation.x=-Math.PI/2;
  const [x,,z]=mount.position,under=mount.mountEntryFace==='underside';
  surfaceRay.set(new THREE.Vector3(x,under?-100:recipe.bounds.height+100,z),new THREE.Vector3(0,under?1:-1,0));
  const surface=surfaceRay.intersectObjects(solidSurfaces,false)[0];
  ring.position.set(x,(surface?.point.y??(under?0:recipe.bounds.height))+(under?-.3:.3),z);
  ring.renderOrder=5;ring.userData.previewOnly=true;ring.userData.mountId=mount.mountId;group.add(ring);
  if(typeof document!=='undefined'){
   const canvas=document.createElement('canvas');canvas.width=96;canvas.height=48;
   const context=canvas.getContext('2d');
   context.fillStyle='#33244d';context.fillRect(0,0,96,48);
   context.fillStyle='#ffffff';context.font='bold 32px sans-serif';context.textAlign='center';
   context.fillText('M'+mount.mountHole.split(' ').at(-1),48,36);
   const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false}));
   label.position.copy(ring.position);label.position.y+=under?-2:2;label.scale.set(6,3,1);label.renderOrder=6;
   label.userData.previewOnly=true;label.userData.mountLabel=mount.mountId;group.add(label);
  }
 }
 for(const link of recipe.nativeRouting?.links||[]){
  if(link.path.length<2)continue;
  const guideY=(recipe.nativeRouting.surfaceY??0)+.15;
  const front=recipe.nativeRouting.front;
  const points=[],point=p=>front?new THREE.Vector3(...tileWallPosition(front,p.x,p.z,.15)):new THREE.Vector3(p.x,p.y===undefined?guideY:p.y+.15,p.z);
  for(let i=1;i<link.path.length;i++)points.push(point(link.path[i-1]),point(link.path[i]));
  const k=Math.floor((link.path.length-1)/2),a=point(link.path[k]),b=point(link.path[k+1]);
  const d=b.clone().sub(a).normalize(),tip=a.clone().lerp(b,.63),back=tip.clone().addScaledVector(d,-2.5);
  const across=front?new THREE.Vector3(d.y,-d.x,0):new THREE.Vector3(-d.z,0,d.x);
  points.push(tip,back.clone().addScaledVector(across,1.2),tip,back.clone().addScaledVector(across,-1.2));
  const guide=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),
   new THREE.LineBasicMaterial({color:link.reason?0xff3155:0x00d5c8,depthTest:false}));
  guide.renderOrder=6;guide.visible=false;guide.userData.nativeRoute=true;guide.userData.previewOnly=true;group.add(guide);
 }
 return group;
}
export function disposeGroup(group){group.traverse(node=>{if(node.userData.pixelLabel||node.userData.mountLabel)node.material?.map?.dispose();if(!node.isSprite)node.geometry?.dispose();if(Array.isArray(node.material))node.material.forEach(m=>m.dispose());else node.material?.dispose();});group.removeFromParent();}
// The very same fitting transform is used by fabrication and Build's real
// Manifold positive/cutter overlay. The incoming local +Y axis points INTO
// the material. Rotation is the same authored pixel wire-port orientation.
export function placeNativeSocketSolid(THREE,wasm,hold,solid,seat,rotation=0){
 const [x,,z]=seat.position;
 const turned=rotation?hold(solid.rotate([0,rotation,0])):solid;
 if(!seat.surface)return hold(turned.translate([x,0,z]));
 const inward=new THREE.Vector3(...seat.surface.normal).negate();
 const frame=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),inward);
 const angles=new THREE.Euler().setFromQuaternion(frame,'ZYX').toArray().slice(0,3);
 return hold(hold(turned.rotate(angles.map(angle=>angle*180/Math.PI))).translate([x,seat.surface.y,z]));
}

// The Build preview uses the profile-shaped positive replica and the EXACT
// production socket cutter. It does not replace the prepared manufacturing mesh.
export function nativeFittingPreviews(THREE,wasm,recipe){
 if(!(recipe.negative||[]).some(part=>part.kind==='pixel-seat'))return [];
 if(recipe.dualMaterial||recipe.partitioned)throw Error('Shaped fitting preview requires single-material stock.');
 return prepareRecipe(THREE,wasm,recipe,{inspectFittings:true});
}
export function prepareRecipe(THREE,wasm,recipe,{onProgress=()=>{},inspectFittings=false}={}){
 const owned=[];const hold=solid=>(owned.push(solid),solid);
 const positionSeat=(solid,seat,rotation=0)=>placeNativeSocketSolid(THREE,wasm,hold,solid,seat,rotation);
 const socket=part=>{
  const {profile}=part;
  const roofRise=part.conical?Math.max(.8,part.radius):0;
  const bore=putSocket(wasm,hold,{x:0,z:0},part.radius,profile.bodyHeight+roofRise+socketShoulderRise(profile,part.shoulderAngle)+3,-3,profile,
    {includeLocalWireRelief:part.includeLocalWireRelief,conical:part.conical,shoulderAngle:part.shoulderAngle});
  return {...bore,solid:positionSeat(bore.solid,part,90-part.pixelRotation)};
 };
 const convert=part=>{
  if(part.kind==='pixel-seat')return socket(part).solid;
  if(part.kind==='extrude'){
   // Always use Manifold's robust polygon extrusion, including for Gears
   // with many fine teeth and functional shaft holes. THREE.ExtrudeGeometry
   // triangulations are suitable for design preview, but may not be a
   // manifold manufactured source when welded at tightly packed teeth.
   const contours=[part.outline,...(part.holes||[])].map(loop=>loop.map(([x,z])=>[x,-z]));
   const section=new wasm.CrossSection(contours,'EvenOdd');
   try{
    let solid=hold(section.extrude(part.height));
    solid=hold(solid.rotate([-90,0,0]));
    if(part.rotation)solid=hold(solid.rotate(part.rotation.map(angle=>angle*180/Math.PI)));
    if(part.position)solid=hold(solid.translate(part.position));
    return solid;
   }finally{section.delete();}
  }
  const geometry=recipeGeometry(THREE,part);
  try{
   const positions=new Float32Array(geometry.attributes.position.array);
   const indices=geometry.index?new Uint32Array(geometry.index.array):Uint32Array.from({length:positions.length/3},(_,i)=>i);
   const input=new wasm.Mesh({numProp:3,vertProperties:positions,triVerts:indices});input.merge();
   const solid=hold(new wasm.Manifold(input));
   if(solid.status()!=='NoError'||solid.isEmpty())throw Error('A source component is not a valid closed solid.');
   return solid;
  }finally{geometry.dispose();}
 };
 const union=parts=>{if(!parts.length)throw Error('No model body.');let result=convert(parts[0]);for(const part of parts.slice(1))result=hold(result.add(convert(part)));return result;};
 try{
  onProgress('Joining physical bodies');let total=union(recipe.positive);
  // An inset colour layer with the same profile contributes no exterior
  // stock. Avoid introducing extra wall vertices at its internal seam.
  const secondaryStock=(recipe.secondary||[]).filter(part=>!recipe.positive.some(base=>
   part.kind==='extrude'&&base.kind==='extrude'&&part.outline===base.outline&&part.holes===base.holes&&
   !part.rotation&&!base.rotation&&part.position&&base.position&&part.position[0]===base.position[0]&&part.position[2]===base.position[2]&&
   part.position[1]>=base.position[1]&&Math.abs(part.position[1]+part.height-base.position[1]-base.height)<1e-9));
  if(secondaryStock.length&&!recipe.partitioned)total=hold(total.add(union(secondaryStock)));
  // Chamfer the ACTUALLY EXPOSED combined body once. Per-part beveling
  // causes overlapping decoration to leave near-zero-area STL triangles.
  const warnings=[...(recipe.warnings||[])];
  const topFinish=recipe.edgeFinish??recipe.positive.find(part=>part.edgeFinish?.enabled)?.edgeFinish;
  if(topFinish?.enabled){
   const finished=bevelTopSolid(wasm,total,topFinish,message=>warnings.push(message));
   if(finished===total)warnings.push('No top rim could be chamfered safely at this amount. Original geometry kept.');
   else{
    hold(finished);
    const touchesHardware=(recipe.negative||[]).some(part=>{
     const cut=convert(part);
     return hold(total.intersect(cut)).volume()-hold(finished.intersect(cut)).volume()>1e-5;
    });
    if(touchesHardware)warnings.push('Top chamfer skipped to preserve a hardware opening.');
    else total=finished;
   }
  }
  const seats=(recipe.negative||[]).filter(part=>part.kind==='pixel-seat');
  const previews=[];
  const wireCuts=inspectFittings?(recipe.negative||[]).filter(part=>part.wireChannel).map(convert):[];
  const wireSolid=wireCuts.length?hold(wasm.Manifold.union(wireCuts)):null;
  for(const seat of seats){
   const warnings=[];
   const warn=message=>{if(!inspectFittings)throw Error(message);warnings.push(message);};
   const {profile}=seat,stockHeight=profile.bodyHeight+(seat.conical?Math.max(.8,seat.radius):0)+socketShoulderRise(profile,seat.shoulderAngle)+2.8;
   const stockRadius=Math.max(profile.maxDiameter/2+1,seat.includeLocalWireRelief?profile.boreDiameter*.675+4.8:0);
   const stock=hold(wasm.Manifold.cylinder(stockHeight,stockRadius,stockRadius,32));
   const envelope=positionSeat(hold(stock.rotate([-90,0,0])),seat);
   if(seat.surface){
    const radius=profile.boreDiameter/2;
    const approach=hold(wasm.Manifold.cylinder(2.7,radius,radius,32));
    const opening=positionSeat(hold(hold(approach.rotate([-90,0,0])).translate([0,-3,0])),seat);
    if(hold(total.intersect(opening)).volume()>.05)
     warn(seat.pixelHole+' has an obstructed insertion opening. Choose an exposed face.');
   }
   const missingStockVolume=Math.max(0,envelope.volume()-hold(total.intersect(envelope)).volume());
   if(missingStockVolume>.05)
    warn(seat.pixelHole+' needs '+(seat.surface?'continuous stock on its installation face':'continuous underside stock')+', including a 2.8 mm roof beyond the socket. Increase thickness or move the fitting.');
   if(inspectFittings){
    const bore=socket(seat),negative=bore.solid;
    const replica=prepareRecipe(THREE,wasm,makePixelReplicaRecipe(profile)).bodies[0].mesh;
    const positive=positionSeat(hold(new wasm.Manifold(replica)),seat,90-seat.pixelRotation);
    if(positive.status()!=='NoError'||negative.status()!=='NoError')throw Error('Invalid physical fitting preview.');
    const wireOverlap=wireSolid?hold(positive.intersect(wireSolid)).volume():0;
    previews.push({wireOverlap,pixelId:seat.pixelId,positive:positive.getMesh(),negative:negative.getMesh(),
     insertionDepth:bore.usableBodyDepth,nominalRoofAllowance:bore.remainingWall,missingStockVolume,
     exposedVolume:hold(positive.subtract(total)).volume(),
     collisionVolume:hold(hold(positive.intersect(total)).subtract(negative)).volume(),warnings});
   }
   for(const other of recipe.negative||[]){
    if(other===seat||other.wireChannel)continue;
    if(hold(envelope.intersect(convert(other))).volume()>.05)
     warn(seat.pixelHole+' lacks clearance from another cut. Move the fitting and check the roof.');
   }
  }
  if(inspectFittings)return previews;
  for(const recess of recipe.negative||[]){
   if(!recess.fixingRecess)continue;
   const [x,y,z]=recess.position;
   // Protect 1 mm around the recess and 1.6 mm behind its shoulder.
   const top=recess.fixingTopEntry,surfaceY=recess.fixingSurfaceY??0;
   const shoulder=y+(top?-1:1)*recess.height/2;
   const stockDepth=Math.abs(shoulder-surfaceY)+1.6,stockRadius=Math.max(recess.radius,recess.topRadius??0)+1;
   const envelope=hold(hold(wasm.Manifold.cylinder(stockDepth,stockRadius,stockRadius,48))
    .rotate([-90,0,0]).translate([x,top?surfaceY-stockDepth:surfaceY,z]));
   if(envelope.volume()-hold(total.intersect(envelope)).volume()>.05)
    throw Error(recess.fixingRecess+(top?' needs continuous planar top stock':' needs continuous underside stock')+', with 1 mm around the cut and 1.6 mm behind it.');
   if(top){
    const obstructionHeight=total.boundingBox().max[1]-surfaceY;
    if(obstructionHeight>0){
     const approach=hold(hold(wasm.Manifold.cylinder(obstructionHeight,stockRadius-1,stockRadius-1,48))
      .rotate([-90,0,0]).translate([x,surfaceY,z]));
     if(hold(total.intersect(approach)).volume()>.05)
      throw Error(recess.fixingRecess+' needs an unobstructed top opening.');
    }
   }
   for(const cut of recipe.negative){
    if(cut.fixingId===recess.fixingId)continue;
    if(hold(envelope.intersect(convert(cut))).volume()>.05)
     throw Error(recess.fixingRecess+' is too close to another cut. Increase the separation or change the fixing profile.');
   }
  }
  if(recipe.nativeRouting?.ready){
   onProgress('Cutting serial LED channels');
   // Collapse Boolean slivers below the precision of a printable channel.
   // STL still checks every exported triangle after this bounded simplification.
   const tolerance=.0001,cuts=[];
   total=hold(total.setTolerance(tolerance));
   const {roofStock,front,surfaceY}=recipe.nativeRouting;
   const routeFootprint=roofStock?convert({kind:'extrude',outline:front?.modelOutline??roofStock.outline,
    height:front?.wallHeight??surfaceY??(total.boundingBox().max[1]+1)}):null;
   for(const part of recipe.negative){
    const cut=hold(convert(part).setTolerance(tolerance));
    if(hold(total.intersect(cut)).volume()<.1)
     throw Error((part.pixelHole||part.mountHole||part.tabHole||part.wireChannel||'Cut')+' does not cut the model.');
    if(routeFootprint&&part.wireChannel&&part.junctionIds){
     const top=['top','wave'].includes(recipe.nativeRouting.face);
     const thickness=roofStock.thickness;
     const stockOffset=[0,top?-thickness:thickness,0];
     if(front){stockOffset[1]=0;stockOffset[front.axis]=-front.sign*thickness;}
     const inward=hold(cut.translate(stockOffset));
     const stockChecks=[[inward,front?'behind':top?'below':'above']];
     if(part.sideStock)stockChecks.push([convert(part.sideStock),'beside']);
     for(const [envelope,direction] of stockChecks){
      let guard=hold(hold(envelope.subtract(cut)).intersect(routeFootprint));
      for(const other of recipe.negative){
       if(part.junctionIds.includes(other.pixelId))guard=hold(guard.subtract(convert(other)));
      }
      for(const other of recipe.negative){
       if(other===part||part.junctionIds.includes(other.pixelId))continue;
       if(hold(guard.intersect(convert(other))).volume()>.05)
        throw Error(part.wireChannel+' intersects another cut '+direction+' the channel. Move the route or the conflicting feature.');
      }
      if(guard.volume()-hold(total.intersect(guard)).volume()>.05)
       throw Error(part.wireChannel+' lacks continuous material '+direction+' the channel. Increase fitting backing or move the route.');
     }
    }
    cuts.push(cut);
   }
   const originalVolume=total.volume();
   const routed=hold(total.subtract(hold(wasm.Manifold.union(cuts))));
   total=hold(hold(routed.asOriginal()).simplify(tolerance));
   const validTriangles=mesh=>{
    const p=mesh.vertProperties,t=mesh.triVerts,stride=mesh.numProp;
    for(let i=0;i<t.length;i+=3){
     const a=t[i]*stride,b=t[i+1]*stride,c=t[i+2]*stride;
     const u=[p[b]-p[a],p[b+1]-p[a+1],p[b+2]-p[a+2]];
     const v=[p[c]-p[a],p[c+1]-p[a+1],p[c+2]-p[a+2]];
     const twiceArea=Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]);
     if(!Number.isFinite(twiceArea)||twiceArea<1e-12)return false;
    }
    return true;
   };
   const mesh=total.getMesh();
   if(!validTriangles(mesh)){
    // Round-trip through the exact float precision used by STL/3MF as a solid.
    // Keep the repair only if it preserves volume and gives valid triangles.
    const rebuilt=hold(new wasm.Manifold(mesh));
    const repaired=hold(hold(rebuilt.asOriginal()).simplify(tolerance));
    if(repaired.status()!=='NoError'||repaired.isEmpty()||Math.abs(repaired.volume()-total.volume())>.01||!validTriangles(repaired.getMesh()))
     throw Error('The routed mesh cannot be exported at STL precision. Move a fitting slightly or change rotation and prepare again.');
    total=repaired;
   }
   if(originalVolume-total.volume()<.1)throw Error('Serial channels did not remove material.');
  }else for(const part of recipe.negative||[]){
   const before=total;
   total=hold(total.subtract(convert(part)));
   if((part.pixelHole||part.mountHole||part.tabHole||part.wireChannel)&&before.volume()-total.volume()<.1)
    throw Error((part.pixelHole||part.mountHole||part.tabHole||part.wireChannel)+' does not cut the model. Move it onto solid material in Build.');
  }
  if(total.status()!=='NoError'||total.isEmpty()||total.volume()<=0)throw Error('Manufacturing produced no valid material.');
  let regions=[{role:'primary',solid:total}];
  const coincidentFace=recipe.positive.length===1&&recipe.secondary?.length===1&&!secondaryStock.length&&!recipe.partitioned?recipe.secondary[0]:null;
  const splitHeight=recipe.materialSplitHeight??coincidentFace?.position[1];
  if(recipe.dualMaterial&&splitHeight!==undefined){
   // Split the existing solid once so both bodies use the same interface.
   // Subtracting its Boolean intersection with a band can leave coincident shells.
   const [above,below]=total.splitByPlane([0,1,0],splitHeight);
   const top=hold(above),bottom=hold(below),face=Boolean(coincidentFace)||recipe.materialSplitRole==='top';
   regions=[{role:'primary',solid:face?bottom:top},{role:'secondary',solid:face?top:bottom}];
  }else if(recipe.dualMaterial&&(recipe.materialBand||recipe.secondary?.length)){
   let secondary=recipe.materialBand?convert(recipe.materialBand):union(recipe.secondary);
   if(recipe.partitioned){
    for(const part of recipe.negative||[])secondary=hold(secondary.subtract(convert(part)));
   }else secondary=hold(secondary.intersect(total));
   const primary=recipe.partitioned?total:hold(total.subtract(secondary));regions=[{role:'primary',solid:primary},{role:'secondary',solid:secondary}];
  }
  const bodies=regions.map(({role,solid})=>{
   if(solid.status()!=='NoError'||solid.isEmpty()||solid.volume()<=0)throw Error(role+' material is empty or invalid.');
   const parts=solid.decompose();try{if(parts.length!==1)throw Error(role+' contains '+parts.length+' disconnected pieces. Change the design before export.');}finally{parts.forEach(p=>p.delete());}
   return {role,volume:solid.volume(),mesh:solid.getMesh()};
  });
  if(regions.length===2){const overlap=hold(regions[0].solid.intersect(regions[1].solid));if(overlap.volume()>1e-4)throw Error('Material regions overlap.');}
  return {report:{ready:true,engine:'Manifold',coordinateFrame:'Y-up',warnings,...(recipe.nativeRouting?.ready?{nativeRouting:{mode:'serial',channels:recipe.nativeRouting.links.map(({label,measure,budget})=>({label,lengthMm:measure,limitMm:budget}))}}:{})},bodies};
 }finally{owned.reverse().forEach(solid=>solid.delete());}
}
export function circle(radius,segments=64,cx=0,cz=0){return Array.from({length:segments},(_,i)=>[cx+radius*Math.cos(i/segments*Math.PI*2),cz+radius*Math.sin(i/segments*Math.PI*2)]);}
export function heightField(width,depth,surface,segments=48){
 const points=[],triangles=[];const n=segments+1;
 for(let z=0;z<n;z++)for(let x=0;x<n;x++){const px=(x/segments-.5)*width,pz=(z/segments-.5)*depth;points.push(px,surface(px,pz),pz);}
 for(let z=0;z<segments;z++)for(let x=0;x<segments;x++){const a=z*n+x,b=a+1,c=a+n,d=c+1;triangles.push(a,c,b,b,c,d);}
 const rim=[];for(let x=0;x<n;x++)rim.push(x);for(let z=1;z<n;z++)rim.push(z*n+segments);for(let x=segments-1;x>=0;x--)rim.push(segments*n+x);for(let z=segments-1;z>0;z--)rim.push(z*n);
 const base=points.length/3;for(const i of rim)points.push(points[i*3],0,points[i*3+2]);const centre=points.length/3;points.push(0,0,0);
 for(let i=0;i<rim.length;i++){const j=(i+1)%rim.length;triangles.push(rim[i],rim[j],base+j,rim[i],base+j,base+i,centre,base+i,base+j);}
 return {points:new Float32Array(points),triangles:new Uint32Array(triangles)};
}
