import assert from 'node:assert/strict';
import {readCrystal3MfTriangles} from './three-mf-section-profile.mjs';
import {sliceStlAtZ,radialSectionProfile} from './print-section-profile.mjs';
const face=[[[4,0,0],[4,0,8],[0,4,8]],[[4,0,0],[0,4,8],[0,4,0]]];
const vertices=face.flat();
const xml='<model unit="millimeter"><resources><object id="2"><mesh><vertices>'+vertices.map(v=>
 `<vertex x="${v[0]}" y="${v[1]}" z="${v[2]}"/>`).join('')+'</vertices><triangles>'+
 face.map((_,i)=>`<triangle v1="${i*3}" v2="${i*3+1}" v3="${i*3+2}"/>`).join('')+
 '</triangles></mesh></object></resources><build><item objectid="2" transform="1 0 0 0 1 0 0 0 1 0 0 0"/></build></model>';
const encoder=new TextEncoder(),name=encoder.encode('3D/3dmodel.model'),body=encoder.encode(xml);
const zip=new Uint8Array(30+name.length+body.length),view=new DataView(zip.buffer);
view.setUint32(0,0x04034b50,true);view.setUint32(18,body.length,true);view.setUint16(26,name.length,true);
zip.set(name,30);zip.set(body,30+name.length);
const triangles=readCrystal3MfTriangles(zip);
assert.deepEqual(triangles,face);
const profile=radialSectionProfile(sliceStlAtZ(triangles,4),{minRadius:2,maxRadius:5});
assert.equal(profile.matchingSegments,2);
view.setUint16(8,8,true);
assert.throws(()=>readCrystal3MfTriangles(zip),/Compressed 3MF/);
view.setUint16(8,0,true);
assert.throws(()=>readCrystal3MfTriangles(zip.subarray(0,31)),/Truncated/);
console.log('Crystal Forge 3MF helper: ZIP entry, independent sections, and unsupported compression PASS');
