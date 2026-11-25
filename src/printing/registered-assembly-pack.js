// Prepared registered assembly -> existing production-pack inputs.
// All meshes remain source-coordinate Y-up; encodeSTL handles Z-up.
import {encodeSTL} from '../../fabrication-v1.js';
const safeId=/^[a-zA-Z0-9-]+$/;
export function registeredAssemblyPackInputs(THREE,assembly,coupons=[]){
 if(!assembly?.parts?.length||!assembly?.pins?.length||!assembly?.joints?.length||assembly.manifest?.physicalFitVerified!==false)throw Error('Verified registered assembly required.');
 const all=[...assembly.parts,...assembly.pins,...coupons],ids=new Set();
 const file=item=>'05_Assembly/'+item.id+'.stl';
 for(const item of all){
  if(!safeId.test(item.id)||ids.has(item.id))throw Error('Invalid or duplicate assembly part ID.');
  ids.add(item.id);
 }
 const partIds=new Set(assembly.parts.map(p=>p.id)),pinIds=new Set(assembly.pins.map(p=>p.id)),jointIds=new Set();
 for(const joint of assembly.joints){
  if(!safeId.test(joint.id)||jointIds.has(joint.id)||joint.parts?.length!==2||joint.parts[0]===joint.parts[1]||!joint.parts.every(p=>partIds.has(p))||!pinIds.has(joint.id+'-dowel'))throw Error('Invalid joint-to-part registration.');
  jointIds.add(joint.id);
 }
 if(jointIds.size!==pinIds.size)throw Error('Every separate dowel must belong to one joint.');
 const extraFiles=all.map(item=>{
  const {points,triangles}=item.mesh||{};
  if(!points?.length||points.length%3||!triangles?.length||triangles.length%3)throw Error('Invalid assembly mesh.');
  const positions=new Float32Array(triangles.length*3);
  for(let i=0;i<triangles.length;i++){
   const index=triangles[i]*3;
   if(!Number.isInteger(index)||index<0||index+2>=points.length)throw Error('Invalid assembly mesh index.');
   for(let j=0;j<3;j++){
    const value=points[index+j];if(!Number.isFinite(value))throw Error('Nonfinite assembly vertex.');
    positions[i*3+j]=value;
   }
  }
  const geometry=new THREE.BufferGeometry();
  try{
   geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
   return {path:file(item),bytes:encodeSTL(geometry)};
  }finally{geometry.dispose();}
 });
 const splitManifest={...assembly.manifest,
  parts:assembly.parts.map(item=>({id:item.id,file:file(item),dimensionsXHeightZmm:item.bounds,volumeMm3:item.volume})),
  dowels:assembly.pins.map(item=>({id:item.id,file:file(item),volumeMm3:item.volume})),
  fitCoupons:coupons.map(item=>({id:item.id,file:file(item),axis:item.axis,diameter:item.diameter,depth:item.depth,diametralClearance:item.diametralClearance,dimensionsXHeightZmm:item.bounds})),
  joints:assembly.joints.map(j=>({...j,dowelFile:file({id:j.id+'-dowel'})})),
  exportCoordinates:'STL Z-up: model (X,Y,Z) -> (X,-Z,Y). Original part positions retained.',
  instructions:'Match each named joint to its two parts and separate dowel. Inspect each mesh and socket in Cura, orient dowels for your printer, print fit coupons, and test assembly and retention. No printed fit or load rating is implied.'};
 return {extraFiles,splitManifest,assemblyWarnings:[
  'REGISTERED GRID: '+assembly.parts.length+' parts, '+assembly.joints.length+' matched joints and '+assembly.pins.length+' separate dowels.',
  'Actual stock and bore subtraction checked in software; physical clearance, print orientation, fit, strength and retention remain unverified.',
  'Read 05_Assembly/assembly-guide.txt and assembly-map.svg before printing. The joined STL is a reference only when the selected printer is too small.']};
}
