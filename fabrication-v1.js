/* Crystal Forge manufacturing pipeline v0.4
 * Uses Manifold WASM for robust Boolean unions, cavity subtraction and socket cuts.
 * The interactive preview stays lightweight and separate from the manufacturing mesh.
 * Runtime: browser (loadManifold) or injected WASM module (testing).
 */
import * as THREE from 'three';
import {crystalGeometry} from './geometry-v3.js';

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
function putSocket(wasm,c,pos,radius,depth,start){
 // Manifold.cylinder is along Z. Rotate -90 degrees about X to align with +Y.
 const b=wasm.Manifold.cylinder(depth,radius,radius,32)
  .rotate([-90,0,0]).translate([pos.x,start,pos.z]);
 return b;
}
function socketPlan(cs,s){
 const count= s.cutSockets?Math.max(0,Math.round(s.pixelCount)):0;
 const hole=(s.pixelDiameter+s.pixelFit);
 const r=hole*.5;
 const chosen=[];
 const sorted=cs.filter(c=>!c.hidden).slice().sort((a,b)=>(b.r*b.h)-(a.r*a.h));
 for(const c of sorted){
  if(chosen.length>=count)break;
  const baseRad=c.r*s.bottomScale*Math.min(c.sx||c.scale||1,c.sz||c.scale||1);
  const safeRad=r+Math.max(1.5,s.wallThickness*1.25);
  if(baseRad<safeRad)continue;
  const offsets=[[0,0]];
  if(baseRad>r*3.25+3*s.wallThickness)offsets.push([r*1.23,0],[-r*1.23,0]);
  for(const [dx,dz] of offsets){
   if(chosen.length>=count)break;
   const angle=c.rotation,ca=Math.cos(angle),sa=Math.sin(angle);
   const px=c.x+dx*ca-dz*sa,pz=c.z+dx*sa+dz*ca;
   chosen.push({crystalId:c.id,x:px,z:pz});
  }
 }
 return {chosen,requested:count,skipped:Math.max(0,count-chosen.length),diameter:hole};
}
function cleanupAll(list){
 for(const m of list){try{m.delete()}catch(e){}}
}
export function prepareFabrication({wasm,meshes,crystals,settings}){
 if(!wasm?.Manifold || !wasm?.Mesh)throw new Error('Manifold engine has not loaded');
 const s=settings,live=meshes.filter(m=>m&&m.visible),owned=[];
 const hold=m=>{owned.push(m);return m};
 const warnings=[];
 if(live.length===0)throw new Error('There is no visible geometry to manufacture');
 if(s.baseType==='none'&&live.length>1)warnings.push('No base: the exported model may contain disconnected individual crystals.');
 let combined;
 try{
  const components=live.map(m=>hold(convertMesh(wasm,m)));
  combined=hold(wasm.Manifold.union(components));
  assertSolid(combined,'Unioned cluster');
  const initialVolume=combined.volume();
  let hollowed=0,socketsCut=0;
  if(s.hollowCrystals){
   // Erode the *united assembly* instead of individually subtracting
   // neighbouring crystal-shaped cavities. The earlier per-crystal cutters
   // could slice off separate fragments when crystals overlap.
   const offset=Math.max(0.8,Number(s.wallThickness));
   const kernel=hold(wasm.Manifold.sphere(offset,12));
   const eroded=hold(combined.minkowskiDifference(kernel));
   if(!eroded.isEmpty()){
    const shell=hold(combined.subtract(eroded));
    assertSolid(shell,'Hollowed union');
    // Preserve a connected solid root for fabrication: reintroduce the
    // original lower region (including any pre-existing underside pocket).
    // This helps prevent thin eroded necks separating neighbouring crystals.
    const bb=combined.boundingBox(),low=bb.min,hi=bb.max;
    const rootHeight=Math.min(hi[1]-low[1],Math.max(7,Number(s.baseHeight||0)+5));
    const rootCut=hold(wasm.Manifold.cube([hi[0]-low[0]+4,rootHeight,hi[2]-low[2]+4])
      .translate([low[0]-2,low[1],low[2]-2]));
    const root=hold(combined.intersect(rootCut));
    const supported=hold(shell.add(root));
    assertSolid(supported,'Reinforced hollowed union');
    combined=supported;
    hollowed=1; // Indicates the assembly was shelled; narrow crystals may remain solid.
    warnings.push('The shell operation uses spherical erosion and a solid root. Narrow crystals may remain solid. Verify wall thickness, cavity access and roof support needs in Cura.');
   }else{
    warnings.push('The current crystal cluster is too narrow for an internal cavity at the selected wall thickness.');
   }
  }
  const {chosen,skipped,diameter}=socketPlan(crystals,s);
  if(s.cutSockets&&chosen.length){
   const cutters=[];
   for(const pos of chosen){
    const depth=Math.max(13,s.baseHeight+9),start=-3;
    cutters.push(hold(putSocket(wasm,null,pos,diameter*.5,depth,start)));
   }
   const holeUnion=hold(wasm.Manifold.union(cutters));
   const cut=hold(combined.subtract(holeUnion));
   assertSolid(cut,'Pixel socket subtraction');
   combined=cut;
   socketsCut=chosen.length;
  }
  if(skipped)warnings.push(skipped+' of '+s.pixelCount+' requested LED sockets could not fit while maintaining basic radial clearance.');
  if(s.cutSockets)warnings.push('LED socket fit is based on nominal dimensions and has not yet been physically calibrated. No retaining lip is included.');
  // Optional mounting holes: intentionally stay within the footprint root
  // wherever possible. Custom dimensions and material fit remain user-tunable.
  let mountingHolesCut=0;
  const mountingPreset=s.mount||'None';
  if(mountingPreset!=='None'&&s.baseType!=='none'&&mountingPreset!=='Detachable plate'){
   const custom=mountingPreset==='Custom dual holes';
   const diameter=custom?Number(s.mountHoleDiameter||4.5):
    mountingPreset==='Magnet inserts'?10.2:mountingPreset==='Threaded insert M3'?4.2:4.5;
   const depth=mountingPreset==='Magnet inserts'?Math.min(3.2,s.baseHeight-1.6):
    mountingPreset==='Threaded insert M3'?Math.min(5.5,s.baseHeight-1.6):
    custom?Math.max(1.2,Number(s.mountHoleDepth||s.baseHeight+2)):s.baseHeight+4;
   const spacing=custom?Number(s.mountSpacing||s.width*.28):s.width*.28;
   const positions=[[-spacing/2,0],[spacing/2,0]];
   const mountCuts=[];
   for(const [x,z] of positions){
    const radius=Math.max(.8,diameter*.5);
    const cutter=hold(wasm.Manifold.cylinder(depth+.5,radius,radius,32)
      .rotate([-90,0,0]).translate([x,-.5,z]));
    mountCuts.push(cutter);
   }
   if(mountCuts.length){
    const holes=hold(wasm.Manifold.union(mountCuts));
    const drilled=hold(combined.subtract(holes));
    assertSolid(drilled,'Mounting feature cuts');
    combined=drilled;mountingHolesCut=positions.length;
   }
   if(mountingPreset==='Ceiling mount')
    warnings.push('Ceiling mounts require independent mechanical retention and verified load limits. Do not rely on a printed fixing alone.');
   if(custom)warnings.push('Custom mounting holes are nominal. Check position, diameter and remaining surrounding material in Cura.');
   if(mountingPreset==='Magnet inserts')warnings.push('Magnet holes are nominal 10.2 mm × 3.2 mm blind pockets. Verify magnet dimensions and print shrinkage.');
   if(mountingPreset==='Threaded insert M3')warnings.push('M3 insert holes are nominal 4.2 mm; verify your insert type and installation instructions.');
  }else if(mountingPreset==='Detachable plate'){
   warnings.push('Detachable mounting plate is not yet generated; choose a drilled mount or create a plate separately.');
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
  if(quality.unsafeTriangles>0)warnings.push('Overhang analysis found '+quality.unsafeTriangles+' potentially unsupported triangles. These are not guaranteed to need supports, but require checking in a slicer.');
  if(s.undersideAccess)warnings.push('The underside access pocket has a ceiling that may need supports. Consider switching the pocket off for supportless-first printing.');
  const mins=bounds.min,maxs=bounds.max;
  const size=mins.map((v,i)=>maxs[i]-v);
  const orientation=suggestOrientation(indexed,s.overhang||45);
  const buildVolumes={
   'Ultimaker 3 Extended':[215,215,300],
   'Ultimaker 2+':[223,223,205]
  };
  const volumeLimit=buildVolumes[s.printer];
  const printerFits=!volumeLimit||(
   size[1]<=volumeLimit[2]+.001&&(
    (size[0]<=volumeLimit[0]+.001&&size[2]<=volumeLimit[1]+.001)||
    (size[2]<=volumeLimit[0]+.001&&size[0]<=volumeLimit[1]+.001)
   ));
  if(!printerFits)warnings.push('Model exceeds the '+s.printer+' build volume ('+volumeLimit.join(' × ')+' mm) in an upright orientation. Split the model or choose another machine.');
  if(orientation.name!=='Base down (upright)')warnings.push('A different orientation may reduce unsupported area: '+orientation.name+'. Stability and support requirements still need slicer verification.');
  if(s.hollowCrystals&&!s.cutSockets&&!s.undersideAccess)warnings.push('Hollow chambers may be sealed. Enable socket openings or underside access for LED service and venting.');
  const report={ready:true,status:'Manifold mesh validated',printerFits,printerLimit:volumeLimit||null,orientation,triangleCount:combined.numTri(),volumeMm3:volume,materialPLAgrams:volume/1000*1.24,initialVolume,disconnected,internalCavities,shellVolumes,
    bounds:size,quality,hollowed,socketsCut,mountingHolesCut,plannedSockets:chosen,warnings,mesh:indexed};
  return {geometry:geom,report};
 }finally{cleanupAll(owned)}
}
// Converts Three.js Y-up preview into the Z-up coordinate convention used by slicers.
export function saveSTL(geometry,filename='crystal-forge-manifold.stl'){
 const p=geometry.getAttribute('position').array,count=Math.floor(p.length/9);
 const bytes=new ArrayBuffer(84+50*count),dv=new DataView(bytes);dv.setUint32(80,count,true);
 let off=84;const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),n=new THREE.Vector3();
 for(let i=0;i<p.length;i+=9){
  a.set(p[i],-p[i+2],p[i+1]);b.set(p[i+3],-p[i+5],p[i+4]);c.set(p[i+6],-p[i+8],p[i+7]);
  n.subVectors(b,a).cross(new THREE.Vector3().subVectors(c,a)).normalize();
  for(const v of [n,a,b,c]){dv.setFloat32(off,v.x,true);dv.setFloat32(off+4,v.y,true);dv.setFloat32(off+8,v.z,true);off+=12}
  dv.setUint16(off,0,true);off+=2;
 }
 const blob=new Blob([bytes],{type:'model/stl'});
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


export function makeCalibrationStrip(wasm){
 const keep=[];const hold=o=>{keep.push(o);return o};
 try{
  // X long, Y upward, Z across: flat-bottom 5mm thick FDM calibration.
  const bar=hold(wasm.Manifold.cube([112,5,22]));
  const holes=[];
  for(let i=0;i<5;i++){
   const dia=11.8+i*.1;
   const core=hold(wasm.Manifold.cylinder(9,dia/2,dia/2,40));
   const turned=hold(core.rotate([-90,0,0]));
   const moved=hold(turned.translate([12+i*22,-2,11]));
   holes.push(moved);
  }
  const allHoles=hold(wasm.Manifold.union(holes));
  const strip=hold(bar.subtract(allHoles));
  assertSolid(strip,'Socket calibration strip');
  return {geometry:fromResultMesh(strip.getMesh()),diameters:[11.8,11.9,12,12.1,12.2],triangles:strip.numTri()};
 }finally{cleanupAll(keep)}
}
export function splitPreparedMesh(wasm,mesh,cutX=0){
 const keep=[];const hold=o=>{keep.push(o);return o};
 try{
  const m=new wasm.Mesh({numProp:3,vertProperties:new Float32Array(mesh.points),triVerts:new Uint32Array(mesh.triangles)});
  m.merge();
  const body=hold(new wasm.Manifold(m));assertSolid(body,'Prepared assembly for splitting');
  const parts=body.splitByPlane([1,0,0],Number(cutX));
  parts.forEach(hold);
  return parts.map((p,i)=>{
   if(p.isEmpty())return null;
   assertSolid(p,'Split '+(i+1));
   return{geometry:fromResultMesh(p.getMesh()),triangles:p.numTri(),volume:p.volume()}
  });
 }finally{cleanupAll(keep)}
}
