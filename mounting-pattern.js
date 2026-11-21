/* Deterministic world X/Z coordinates in millimetres. */
export function footprintCentre(points){
 if(!points.length||points.some(([x,z])=>!Number.isFinite(x)||!Number.isFinite(z)))
  throw Error('This model has no usable mounting footprint.');
 const xs=points.map(point=>point[0]),zs=points.map(point=>point[1]);
 return {x:(Math.min(...xs)+Math.max(...xs))/2,z:(Math.min(...zs)+Math.max(...zs))/2};
}

export function mountingPatternPoints(pattern,limit){
 const {kind,count,rows,columns,centerX,centerZ,pitchMm,radiusMm,pitchXmm,pitchZmm}=pattern;
 const grid=kind==='grid',circle=kind==='circle';
 if(!grid&&!circle&&kind!=='line')throw Error('Choose a line, circle or grid.');
 if(grid&&![rows,columns].every(value=>Number.isInteger(value)&&value>=2))
  throw Error('A grid needs at least two rows and two columns.');
 const size=grid?rows*columns:count;
 if(!Number.isInteger(size)||size<(circle?3:2)||size>limit)
  throw Error('Choose a hole count within this model’s mounting limit of '+limit+'.');
 const distances=grid?[pitchXmm,pitchZmm]:[circle?radiusMm:pitchMm];
 if(!distances.every(value=>Number.isFinite(value)&&value>0))
  throw Error('Pitch and radius must be positive millimetre values.');
 const degrees=circle?pattern.startAngleDeg:pattern.angleDeg;
 if(![centerX,centerZ,degrees].every(Number.isFinite))throw Error('Enter a finite centre and angle.');
 const angle=degrees%360*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
 return Array.from({length:size},(_,index)=>{
  if(circle){
   const rotation=angle+2*Math.PI*index/size;
   return {x:centerX+radiusMm*Math.cos(rotation),z:centerZ+radiusMm*Math.sin(rotation)};
  }
  const dx=grid?(index%columns-(columns-1)/2)*pitchXmm:(index-(size-1)/2)*pitchMm;
  const dz=grid?(Math.floor(index/columns)-(rows-1)/2)*pitchZmm:0;
  return {x:centerX+dx*cos-dz*sin,z:centerZ+dx*sin+dz*cos};
 });
}

export function resolvePatternCentre(pattern,footprint){
 const {x,z}=footprintCentre(footprint);
 const {alignment,offsetX,offsetZ}=pattern;
 if(!['centre','x','z','custom'].includes(alignment))throw Error('Choose a centre alignment.');
 return {
  centerX:x+(['x','centre'].includes(alignment)?0:offsetX),
  centerZ:z+(['z','centre'].includes(alignment)?0:offsetZ)
 };
}

// The saved per-hole records remain the cutter source. Build a replacement
// transaction without mutating or reidentifying individual/manual records.
export function patternMountTransaction({patterns=[],mounts=[],pattern,footprint,limit,fixing}){
 const existing=patterns.find(entry=>entry.id===pattern.id);
 const previous=new Set(existing?.members??[]);
 const remaining=mounts.filter(mount=>!previous.has(mount.id));
 const centre=resolvePatternCentre(pattern,footprint);
 const points=mountingPatternPoints({...pattern,...centre},limit-remaining.length);
 const candidates=points.map((point,index)=>({...fixing,...point,id:existing?.members[index]??pattern.id+'-'+(index+1)}));
 const saved={...pattern,version:1,fixing,members:candidates.map(mount=>mount.id)};
 return {centre,candidates,remaining,mounts:[...remaining,...candidates],
  patterns:existing?patterns.map(entry=>entry.id===existing.id?saved:entry):[...patterns,saved]};
}
