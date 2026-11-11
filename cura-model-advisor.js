/* Cura candidate nozzle / profile advice derived from the actual model.
 * Never changes printer hardware or filament by itself; Cura inspection and
 * physical testing remain necessary. All dimensions in mm.
 */
import {crystalEndRatios} from './geometry-v3.js';
import {calculateCuraSettings} from './cura-profiles.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function adviseCuraForModel(crystals=[],settings={}){
 const s=settings,options=s.printer==='Ultimaker 3 Extended'?[.25,.4,.8]:s.printer==='Ultimaker 2+'?[.25,.4,.6,.8]:[];
 if(!options.length)return {supported:false,reason:'Choose an Ultimaker 3 Extended or Ultimaker 2+ for a built-in Cura profile.'};
 const widths=[];
 for(const c of crystals){
  if(c.hidden)continue;
  const ratios=crystalEndRatios(c,s);
  const scale=Math.max(.1,Math.min(Number(c.sx??c.scale??1),Number(c.sz??c.scale??1)));
  const root=Math.max(.3,Number(c.r)*ratios.size*Math.min(ratios.bottom,ratios.top)*2*scale);
  widths.push(root);
 }
 if(s.wireChannels)widths.push(Math.max(.4,Number(s.wireWidth)||3));
 if(s.lightPorts)widths.push(Math.max(.4,Number(s.lightPortDiameter)||3));
 // Do not interpret the tiny retaining band thickness as an extrusion-width
 // constraint; it may instead require a physical stepped fit test.
 const smallest=Math.min(...widths.filter(Number.isFinite));
 const featureWidth=Number.isFinite(smallest)?smallest:2.5;
 // Reserve at least four nominal extrusion lines across target internal
 // and structural details, including groove widths.
 const suitable=options.filter(nozzle=>featureWidth>=nozzle*4);
 const nozzle=suitable.length?suitable.at(-1):options[0];
 const nominal=s.curaNozzle===undefined?nozzle:Number(s.curaNozzle);
 const remains=featureWidth<nozzle*4;
 const quality=clamp(Math.round(Number(s.curaQuality??60)),0,100);
 let parameters=null;
 try{parameters=calculateCuraSettings({machine:s.printer,nozzle,material:s.curaMaterial||'PLA',quality,intent:s.curaIntent||'light'})}
 catch(e){return {supported:false,reason:e.message}}
 const maxHeight=crystals.filter(c=>!c.hidden).reduce((h,c)=>Math.max(h,Number(c.h)*Number(c.sy??c.scale??1)),0)
   +Number(s.baseHeight||0)+Number(s.baseDome||0);
 const estLayers=Math.max(1,Math.ceil(maxHeight/parameters.layerHeight));
 const reasons=[
  'Smallest screened feature: '+featureWidth.toFixed(2)+' mm, compared with '+(nozzle*4).toFixed(2)+' mm for four nominal extrusion lines.',
  'Candidate nozzle '+nozzle.toFixed(2)+' mm on '+s.printer+'; physically install it and select the matching machine/core in Cura.',
  'Approximate maximum layer count '+estLayers+' (geometric height only; not a time estimate).',
  'Walls, roof, bridging, optical channels and inserted LEDs still need inspection and test prints.'
 ];
 if(remains)reasons.unshift('Even the smallest listed nozzle may be too wide for some proposed features.');
 if(s.lightPorts)reasons.push('Direct light bores are hollowing geometry, not a Cura infill setting.');
 return {supported:true,nozzle,selectedNozzle:nominal,featureWidthMm:+featureWidth.toFixed(2),
  estimatedLayers:estLayers,layerHeight:parameters.layerHeight,reasons,quality,
  warnings:remains?['No supported nozzle offers a comfortable four-line margin on all screened features.']:[]};
}
