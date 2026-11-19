export function boundsOf(loops) {
 let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
 for (const loop of loops) for (const [x,y] of loop) {
  minX = Math.min(minX,x); minY = Math.min(minY,y);
  maxX = Math.max(maxX,x); maxY = Math.max(maxY,y);
 }
 return {minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY};
}

function area(points) {
 const [ox,oy] = points[0];
 let sum = 0;
 for (let i = 1; i < points.length - 1; i++) {
  const [x,y] = points[i], [u,v] = points[i+1];
  sum += (x-ox)*(v-oy) - (y-oy)*(u-ox);
 }
 return sum / 2;
}

function cross(a,b,c) {
 return (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]);
}

function edge(a,b) {
 return { a,b,loX:Math.min(a[0],b[0]),hiX:Math.max(a[0],b[0]),
  loY:Math.min(a[1],b[1]),hiY:Math.max(a[1],b[1]),length:Math.hypot(b[0]-a[0],b[1]-a[1]) };
}

function separation(p,{a,b,length}) {
 const dx=b[0]-a[0], dy=b[1]-a[1];
 const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(length*length)));
 return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
}

export function distanceToEdge(loop, point) {
 let best = Infinity;
 for (let i=0;i<loop.length;i++) best=Math.min(best,separation(point,edge(loop[i],loop[(i+1)%loop.length])));
 return best;
}

export function contains(loop,[x,y]) {
 let inside=false;
 for (let i=0,j=loop.length-1;i<loop.length;j=i++) {
  const [a,b]=loop[i], [c,d]=loop[j];
  if ((b>y)!==(d>y) && x<(c-a)*(y-b)/(d-b)+a) inside=!inside;
 }
 return inside;
}

function segmentsConflict(e,f,tolerance,minDistance) {
 const padding=Math.max(tolerance,minDistance);
 if (e.hiX+padding<f.loX || f.hiX+padding<e.loX || e.hiY+padding<f.loY || f.hiY+padding<e.loY) return false;
 const a=cross(e.a,e.b,f.a),b=cross(e.a,e.b,f.b),c=cross(f.a,f.b,e.a),d=cross(f.a,f.b,e.b);
 if ((a<0&&b>0||a>0&&b<0) && (c<0&&d>0||c>0&&d<0)) return true;
 return Math.min(separation(f.a,e),separation(f.b,e),separation(e.a,f),separation(e.b,f)) <= padding;
}

function inspectLoops(loops,tolerance,minDistance=0) {
 const edges=loops.map((points,index)=>{
  const list=points.map((a,i)=>edge(a,points[(i+1)%points.length]));
  if (list.some(e=>e.length<=tolerance)) throw Error(`Contour ${index+1} has a repeated or degenerate edge.`);
  for (let j=0;j<list.length;j++) {
   const e=list[j], f=list[(j+1)%list.length];
   if (Math.abs(cross(e.a,e.b,f.b))<=tolerance*e.length &&
     (e.a[0]-e.b[0])*(f.b[0]-f.a[0])+(e.a[1]-e.b[1])*(f.b[1]-f.a[1])>0) {
    throw Error(`Contour ${index+1} doubles back or self-intersects.`);
   }
  }
  for (let i=0;i<list.length;i++) for (let j=i+2;j<list.length;j++) {
   if (i===0&&j===list.length-1) continue;
   if (segmentsConflict(list[i],list[j],tolerance,0)) throw Error(`Contour ${index+1} self-intersects or touches itself.`);
  }
  if (Math.abs(area(points))<=tolerance*tolerance) throw Error(`Contour ${index+1} has zero area or is degenerate.`);
  return list;
 });
 for (let i=0;i<edges.length;i++) for (let j=i+1;j<edges.length;j++) {
  for (const a of edges[i]) for (const b of edges[j]) if (segmentsConflict(a,b,tolerance,minDistance)) {
   throw Error(minDistance?'An outline and opening are touching, overlapping, or less than 0.05 mm apart.':
    'SVG contours cross or touch. Union or separate the shapes in a vector editor before importing.');
  }
 }
}

export function extrusionLoops(shapes,maxLoops) {
 const contours=shapes.flatMap((shape,owner)=>shape.loops.map(points=>({points,owner,rule:shape.fillRule})));
 if (!contours.length || contours.length>maxLoops) throw Error('SVG has no closed artwork or exceeds the contour count limit.');
 const b=boundsOf(contours.map(c=>c.points));
 const tolerance=Math.max(b.width,b.height)*1e-12;
 for (const contour of contours) {
  const points=contour.points;
  if (points.length>1 && Math.hypot(points[0][0]-points.at(-1)[0],points[0][1]-points.at(-1)[1])<=tolerance) {
   contour.points=points.slice(0,-1);
  }
  if (contour.points.length<3) throw Error('A closed contour needs three distinct points and positive area.');
 }
 inspectLoops(contours.map(c=>c.points),tolerance);
 const signs=contours.map(c=>Math.sign(area(c.points)));
 const filled = winding => winding.some((value, i) => shapes[i].fillRule==='evenodd' ? Math.abs(value)%2===1 : value!==0);
 const result=[];
 for (let i=0;i<contours.length;i++) {
  const contour=contours[i], winding=Array(shapes.length).fill(0);
  for (let j=0;j<contours.length;j++) {
   if (j!==i && contains(contours[j].points,contour.points[0])) winding[contours[j].owner]+=signs[j];
  }
  // Evaluate the fill of each element separately, then union the filled regions.
  const outside=filled(winding);
  winding[contour.owner]+=signs[i];
  const inside=filled(winding);
  if (outside!==inside) {
   const kind=inside?'outer':'hole';
   const points=(inside?signs[i]>0:signs[i]<0)?contour.points:[...contour.points].reverse();
   result.push({kind,points});
  }
 }
 if (!result.some(l=>l.kind==='outer')) throw Error('SVG contains no filled region.');
 return result;
}

export function validatePhysicalLoops(outline, holes, minFeature) {
 const loops=[outline,...holes];
 for (const points of loops) {
  const b=boundsOf([points]);
  if (Math.min(b.width,b.height)<minFeature || Math.abs(area(points))<minFeature*minFeature) {
   throw Error('A contour is too small at this scale. Enlarge the artwork or remove microscopic details (0.05 mm minimum).');
  }
 }
 inspectLoops(loops,1e-9,minFeature);
 if (holes.some((h,i)=>!contains(outline,h[0]) || holes.some((other,j)=>i!==j && contains(other,h[0])))) {
  throw Error('A saved opening is outside its outline or nested in another opening.');
 }
}
