import assert from 'node:assert/strict';
import {readBinaryStlTriangles,sliceStlAtZ,radialSectionProfile} from './print-section-profile.mjs';
const faces=[
 [[4,0,0],[4,0,8],[0,4,8]],
 [[4,0,0],[0,4,8],[0,4,0]]
];
const stl=new Uint8Array(84+50*faces.length),view=new DataView(stl.buffer);
view.setUint32(80,faces.length,true);
for(const [i,face] of faces.entries())for(const [j,point] of face.entries())for(let axis=0;axis<3;axis++)
 view.setFloat32(84+i*50+12+j*12+axis*4,point[axis],true);
assert.deepEqual(readBinaryStlTriangles(stl),faces);
const segments=sliceStlAtZ(readBinaryStlTriangles(stl),4);
assert.equal(segments.length,2);
const result=radialSectionProfile(segments,{center:[0,0],minRadius:2,maxRadius:5});
assert.equal(result.matchingSegments,2);
assert(Math.abs(result.minRadius-Math.sqrt(8))<1e-6);
assert(Math.abs(result.maxRadius-4)<1e-6);
assert.equal(radialSectionProfile(segments,{minRadius:6,maxRadius:7}),null);
assert.throws(()=>readBinaryStlTriangles(stl.subarray(0,-1)),/length/);
assert.throws(()=>sliceStlAtZ([],NaN),/section height/);
console.log('Print-section STL helpers: binary validation, section intersections, radial profiling PASS');
