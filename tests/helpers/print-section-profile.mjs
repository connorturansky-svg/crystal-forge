/* Print-only diagnostic helpers: STL is millimetres and Z-up.
 * No production geometry, cutter or browser implementation is modified.
 */
export function readBinaryStlTriangles(input) {
  const bytes = input instanceof ArrayBuffer ? new Uint8Array(input)
    : ArrayBuffer.isView(input) ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
    : null;
  if (!bytes || bytes.byteLength < 84) throw Error('Expected a binary STL byte buffer.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint32(80, true);
  if (84 + count * 50 !== bytes.byteLength) throw Error('STL triangle count and byte length disagree.');
  const triangles = [];
  for (let i = 0; i < count; i++) {
    const base = 84 + i * 50 + 12;
    const tri = Array.from({length: 3}, (_, vertex) => [0, 1, 2].map(axis =>
      view.getFloat32(base + vertex * 12 + axis * 4, true)));
    if (tri.some(point => point.some(value => !Number.isFinite(value))))
      throw Error('Non-finite STL coordinate at triangle ' + i);
    const [a,b,c] = tri;
    const u = b.map((v,j) => v-a[j]), v = c.map((v,j) => v-a[j]);
    const area2 = Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]);
    if (area2 < 1e-10) throw Error('Degenerate STL triangle ' + i);
    triangles.push(tri);
  }
  return triangles;
}

export function sliceStlAtZ(triangles, height, epsilon = 1e-5) {
  if (!Number.isFinite(height) || !(epsilon > 0)) throw Error('Invalid section height or tolerance.');
  const segments = [];
  for (const tri of triangles) {
    const hits = [];
    for (let i = 0; i < 3; i++) {
      const a = tri[i], b = tri[(i+1)%3], da=a[2]-height, db=b[2]-height;
      if (Math.abs(da) <= epsilon && Math.abs(db) <= epsilon) continue;
      if (Math.abs(da) <= epsilon) hits.push(a.slice(0,2));
      else if (Math.abs(db) <= epsilon) hits.push(b.slice(0,2));
      else if ((da<0&&db>0) || (da>0&&db<0)) {
        const t = da/(da-db);
        hits.push([a[0] + t*(b[0]-a[0]),a[1] + t*(b[1]-a[1])]);
      }
    }
    const unique=[];
    for (const xy of hits) if (!unique.some(p=>Math.hypot(p[0]-xy[0],p[1]-xy[1]) <= epsilon)) unique.push(xy);
    if (unique.length===2 && Math.hypot(unique[0][0]-unique[1][0],unique[0][1]-unique[1][1])>epsilon)
      segments.push(unique);
  }
  return segments;
}

export function radialSectionProfile(segments, {center=[0,0], minRadius, maxRadius}) {
  if (!Number.isFinite(minRadius) || !Number.isFinite(maxRadius) || minRadius<0 || maxRadius<=minRadius)
    throw Error('Specify a finite radial annulus.');
  const radii=[];
  let matchingSegments=0;
  for (const [a,b] of segments) {
    const r1=Math.hypot(a[0]-center[0],a[1]-center[1]);
    const r2=Math.hypot(b[0]-center[0],b[1]-center[1]);
    if (r1<minRadius||r1>maxRadius||r2<minRadius||r2>maxRadius)continue;
    radii.push(r1,r2);
    matchingSegments++;
  }
  if (!radii.length) return null;
  const sorted=radii.sort((a,b)=>a-b);
  return {matchingSegments, minRadius:sorted[0],maxRadius:sorted.at(-1),
    medianRadius:(sorted[(sorted.length-1)>>1]+sorted[sorted.length>>1])/2};
}
