/* Aligned STL fallback and multi-object 3MF from prepared material bodies.
 * Cura extruder assignment remains an explicit manual acceptance step.
 */
import {zipProfileEntries} from './cura-profiles.js';
const escapeXML = value => String(value).replace(/[&<>"']/g, c => ({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'
}[c]));
function exportPoint(input,i){
 // Right-handed rotation (X,Y,Z) -> (X,-Z,Y), in millimetres.
 const point=[input[i],-input[i+2],input[i+1]];
 if(!point.every(Number.isFinite))throw Error('Non-finite material vertex.');
 return point;
}
export function preparedDimensionsMm(prepared,role){
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(const body of prepared.bodies){
  if(role!==undefined&&body.role!==role)continue;
  const {mesh}=body;
  const stride=mesh.numProp??3,input=mesh.vertProperties??mesh.points;
  if(!input?.length||stride<3||input.length%stride)throw Error('Invalid material vertices.');
  for(let i=0;i<input.length;i+=stride){
   const point=exportPoint(input,i);
   for(let axis=0;axis<3;axis++){
    min[axis]=Math.min(min[axis],point[axis]);max[axis]=Math.max(max[axis],point[axis]);
   }
  }
 }
 if(!min.every(Number.isFinite))throw Error('No prepared material vertices.');
 return max.map((value,axis)=>value-min[axis]);
}
function meshData(mesh) {
 const stride=mesh.numProp ?? 3, input=mesh.vertProperties ?? mesh.points, triangles=mesh.triVerts ?? mesh.triangles;
 if (!input || !triangles || stride<3 || input.length%stride || triangles.length%3)
  throw Error('Invalid material mesh.');
 const points=[];
 for(let i=0;i<input.length;i+=stride) {
  points.push(...exportPoint(input,i));
 }
 if([...triangles].some(index=>!Number.isSafeInteger(index)||index<0||index>=points.length/3))
  throw Error('Invalid material triangle index.');
 return {points,triangles};
}
function binarySTL(mesh) {
 const {points:p,triangles:t}=mesh;
 const bytes=new Uint8Array(84+t.length/3*50),view=new DataView(bytes.buffer);
 bytes.set(new TextEncoder().encode('Sensory Model Studio | prepared material body | millimetres | Z-up'));
 view.setUint32(80,t.length/3,true);
 for(let i=0;i<t.length;i+=3){
  const offset=84+i/3*50,a=t[i]*3,b=t[i+1]*3,c=t[i+2]*3;
  const ux=p[b]-p[a],uy=p[b+1]-p[a+1],uz=p[b+2]-p[a+2],
   vx=p[c]-p[a],vy=p[c+1]-p[a+1],vz=p[c+2]-p[a+2];
  const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,length=Math.hypot(nx,ny,nz);
  if(length<1e-12)throw Error('Degenerate material triangle.');
  [nx/length,ny/length,nz/length,...p.slice(a,a+3),...p.slice(b,b+3),...p.slice(c,c+3)]
   .forEach((value,j)=>view.setFloat32(offset+j*4,value,true));
 }
 return bytes;
}
export function exportMaterialBodies(prepared, {name='sensory-model', colours=['#88BBFFFF','#FFD070FF'],
 extruders={primary:0,secondary:1}}={}) {
 if(!prepared?.report?.ready||prepared.report.engine!=='Manifold'||prepared.report.coordinateFrame!=='Y-up')
  throw Error('Prepare and validate material bodies with Manifold first.');
 if(!Array.isArray(prepared.bodies)||prepared.bodies.length<1||prepared.bodies.length>2||
  prepared.bodies[0].role!=='primary'||(prepared.bodies.length===2&&prepared.bodies[1].role!=='secondary')||
  prepared.bodies.some(body=>!(body.volume>0)))throw Error('Invalid prepared material roles.');
 if(!colours.every(c=>/^#[0-9a-f]{8}$/i.test(c))||colours.length!==2)throw Error('Colours require #RRGGBBAA.');
 if(![0,1].includes(extruders.primary)||![0,1].includes(extruders.secondary)||
  (prepared.bodies.length===2&&extruders.primary===extruders.secondary))throw Error('Assign distinct UM3 extruders for two material roles.');
 const prefix=String(name).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,80)||'sensory-model';
 const bodies=prepared.bodies.map(body=>({...body,mesh:meshData(body.mesh)}));
 const stls=bodies.map(body=>({name:prefix+'-'+body.role+'.stl',role:body.role,bytes:binarySTL(body.mesh)}));
 const resources=bodies.map((body,i)=>{
  const p=body.mesh.points,t=body.mesh.triangles;
  const vertices=Array.from({length:p.length/3},(_,j)=>'<vertex x="'+p[j*3]+'" y="'+p[j*3+1]+'" z="'+p[j*3+2]+'"/>').join('');
  const triangles=Array.from({length:t.length/3},(_,j)=>'<triangle v1="'+t[j*3]+'" v2="'+t[j*3+1]+'" v3="'+t[j*3+2]+'"/>').join('');
  return '<object id="'+(i+2)+'" name="'+escapeXML(body.role)+'" type="model" pid="1" pindex="'+i+'"><mesh><vertices>'+vertices+'</vertices><triangles>'+triangles+'</triangles></mesh></object>';
 }).join('');
 const assembly=bodies.length===2?'<object id="4" type="model"><components><component objectid="2"/><component objectid="3"/></components></object>':'';
 const model='<?xml version="1.0" encoding="UTF-8"?>'+
  '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">'+
  '<metadata name="Title">'+escapeXML(name)+'</metadata><metadata name="Description">Prepared material bodies. Confirm extruder assignment in Cura.</metadata>'+
  '<resources><basematerials id="1">'+bodies.map((b,i)=>'<base name="'+b.role+'" displaycolor="'+colours[i]+'"/>').join('')+
  '</basematerials>'+resources+assembly+'</resources><build><item objectid="'+(assembly?4:2)+'" transform="1 0 0 0 1 0 0 0 1 0 0 0"/></build></model>';
 const assignments={schemaVersion:1,coordinateFrame:'Z-up',unit:'mm',
  materials:bodies.map((b,i)=>({objectId:i+2,role:b.role,colour:colours[i],requestedExtruder:extruders[b.role]})),
  curaExtruderAssignmentVerified:false};
 const threeMF=zipProfileEntries([
  ['[Content_Types].xml','<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/><Default Extension="json" ContentType="application/json"/></Types>'],
  ['_rels/.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'],
  ['3D/3dmodel.model',model],['Metadata/material-roles.json',JSON.stringify(assignments,null,2)]
 ]);
 return {stls,threeMF,filename:prefix+'.3mf',assignments,
  warnings:['Cura must confirm extruder assignments, layer support, prime tower and material compatibility. No physical slicing or printing has been verified.']};
}
