/* Printed calibration specimens and reusable fit measurements.
 * Top-facing engraved numerals are 7-segment strokes. They require no fonts,
 * SVG pipeline, external resources or unsupported 3D text libraries.
 */
import {resolvePixelProfile} from './pixel-profiles.js';
const round=x=>Math.round(x*100)/100;
const offsets={plain:[-.2,-.1,0,.1,.2],stepped:[-.2,-.1,0,.1,.2],full:[-.15,0,.15]};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function calibrationSpec(s,kind='stepped'){
 const sample=kind==='full'?'full':kind==='plain'?'plain':'stepped';
 const profile=resolvePixelProfile(s),baseline=Number(s.pixelFit??.15);
 const fits=offsets[sample].map(delta=>round(clamp(baseline+delta,-.5,.8)));
 const diameters=fits.map(value=>round(profile.bodyDiameter+value));
 return {kind:sample,profileId:s.pixelProfileId,profileName:profile.name,
  baselineFit:baseline,fits,diameters,
  captions:diameters.map(d=>d.toFixed(2)), // list in printed left-to-right order
  madeAt:new Date().toISOString()};
}
export function selectedFitResult(s,index){
 const sample=s.fitCouponLast;
 if(!sample||!Array.isArray(sample.fits)||!Array.isArray(sample.diameters))
  throw Error('Download a calibration specimen before applying a fit result.');
 if(sample.profileId!==s.pixelProfileId)throw Error('Select the same LED profile used for the printed sample.');
 const i=Number(index);
 if(!Number.isInteger(i)||i<0||i>=sample.fits.length)throw Error('Select a valid printed hole position.');
 const previous=Number(s.pixelFit??.15),fitted=Number(sample.fits[i]);
 return {newFit:fitted,record:{originalFit:previous,selected:i,
  diameter:Number(sample.diameters[i]),profileId:sample.profileId,
  sampleKind:sample.kind,delta:round(fitted-previous)}};
}
export function resetFitCalibration(s){
 if(!s.fitCalibration)return null;
 const prior=Number(s.fitCalibration.originalFit);
 return Number.isFinite(prior)?clamp(prior,-.5,.8):.15;
}
const segments={
 '0':'abcfed', '1':'bc','2':'abged','3':'abgcd','4':'fgbc',
 '5':'afgcd','6':'afgecd','7':'abc','8':'abcdefg','9':'abfgcd',
 '-':'g',' ':'','.' :'h'
};
/* Returns an assembly of Manifold cubes positioned in the top X/Z plane.
 * All strokes sit inside the top face (engraved, not raised); the underside
 * remains a completely flat first layer for normal FDM printing.
 */
export function couponLegendCuts(wasm,hold,caption,cx,frontZ,topY){
 const glyphs=String(caption),step=4.5,total=glyphs.length*step-1.1;
 const xOrigin=cx-total/2,zOrigin=frontZ,stroke=1.05,depth=.65;
 const bars=[];
 const h=(x,z,length)=>hold(wasm.Manifold.cube([length,depth+.3,stroke]).translate([x,topY-depth,z]));
 const v=(x,z,length)=>hold(wasm.Manifold.cube([stroke,depth+.3,length]).translate([x,topY-depth,z]));
 for(let i=0;i<glyphs.length;i++){
  const c=glyphs[i],x=xOrigin+i*step,active=segments[c]??'';
  // A five-millimetre tall, three-millimetre wide seven-segment glyph.
  for(const segment of active){
   if(segment==='a')bars.push(h(x,zOrigin+5,3.4));
   if(segment==='g')bars.push(h(x,zOrigin+2.5,3.4));
   if(segment==='d')bars.push(h(x,zOrigin,3.4));
   if(segment==='f')bars.push(v(x,zOrigin+2.5,2.5));
   if(segment==='b')bars.push(v(x+2.5,zOrigin+2.5,2.5));
   if(segment==='e')bars.push(v(x,zOrigin,2.5));
   if(segment==='c')bars.push(v(x+2.5,zOrigin,2.5));
   if(segment==='h')bars.push(h(x+1.5,zOrigin,1.05));
  }
 }
 return bars;
}
