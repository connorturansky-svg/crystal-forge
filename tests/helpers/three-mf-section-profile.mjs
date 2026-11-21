/* Decoder for Crystal Forge's uncompressed, millimetre, identity-transform 3MF.
 * Refuse unsupported ZIP or coordinate transforms rather than silently
 * presenting wrong dimensions as measured evidence.
 */
const bytesFrom = input => input instanceof ArrayBuffer ? new Uint8Array(input)
  : ArrayBuffer.isView(input) ? new Uint8Array(input.buffer,input.byteOffset,input.byteLength)
  : null;

export function readCrystal3MfTriangles(input) {
 const bytes=bytesFrom(input);
 if(!bytes || bytes.byteLength<30)throw Error('Expected 3MF ZIP bytes.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 let offset=0,modelXml=null;
 const decoder=new TextDecoder();
 while(offset+30<=bytes.byteLength && view.getUint32(offset,true)===0x04034b50){
  const flags=view.getUint16(offset+6,true),method=view.getUint16(offset+8,true);
  const compressedSize=view.getUint32(offset+18,true);
  const nameSize=view.getUint16(offset+26,true),extraSize=view.getUint16(offset+28,true);
  const nameStart=offset+30,dataStart=nameStart+nameSize+extraSize,dataEnd=dataStart+compressedSize;
  if(dataEnd>bytes.byteLength)throw Error('Truncated 3MF ZIP entry.');
  if(flags&8)throw Error('3MF ZIP data descriptors unsupported for deterministic measurements.');
  const name=decoder.decode(bytes.subarray(nameStart,nameStart+nameSize));
  if(name==='3D/3dmodel.model'){
   if(method!==0)throw Error('Compressed 3MF model cannot be independently sectioned by this helper.');
   modelXml=decoder.decode(bytes.subarray(dataStart,dataEnd));
  }
  offset=dataEnd;
 }
 if(!modelXml)throw Error('Missing 3D/3dmodel.model in 3MF.');
 if(!/<model\b[^>]*unit="millimeter"/.test(modelXml))throw Error('3MF must declare millimetres.');
 // Native exporter uses a component assembly and identity build placement.
 for(const [,transform] of modelXml.matchAll(/<item\b[^>]*transform="([^"]+)"/g)){
  if(transform.trim()!=='1 0 0 0 1 0 0 0 1 0 0 0')throw Error('Non-identity 3MF build transform unsupported.');
 }
 const meshes=Array.from(modelXml.matchAll(/<mesh><vertices>([\s\S]*?)<\/vertices><triangles>([\s\S]*?)<\/triangles><\/mesh>/g));
 if(!meshes.length)throw Error('No mesh objects in 3MF.');
 const triangles=[];
 for(const [,vertexBlock,triangleBlock] of meshes){
  const vertices=Array.from(vertexBlock.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g),m=>m.slice(1).map(Number));
  if(!vertices.length||vertices.some(p=>p.some(v=>!Number.isFinite(v))))throw Error('Invalid 3MF vertices.');
  let count=0;
  for(const m of triangleBlock.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"\/>/g)){
   const tri=m.slice(1).map(id=>vertices[Number(id)]);
   if(tri.some(x=>!x))throw Error('Invalid 3MF triangle index.');
   const [a,b,c]=tri,u=b.map((v,j)=>v-a[j]),v=c.map((val,j)=>val-a[j]);
   const area2=Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]);
   if(area2<1e-10)throw Error('Degenerate 3MF triangle.');
   triangles.push(tri);count++;
  }
  if(!count)throw Error('3MF mesh has no triangles.');
 }
 return triangles;
}
