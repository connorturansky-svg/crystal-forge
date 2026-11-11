/* Geometry-aware candidate path planner for a direct roof-to-spike light bore.
 * A planned bore becomes real only when Manifold cuts it into an open base
 * vault. Nothing here certifies optical access, material wall strength or
 * continuous connectivity: verify the final STL in Cura and a lit sample.
 */
import {crystalEndRatios} from './geometry-v3.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function planCrystalLightPorts(crystals=[],settings={}){
 const report={requested:!!settings.lightPorts,enabled:false,ports:[],skipped:[],reason:''};
 if(!report.requested)return report;
 if(settings.baseType==='none'||!settings.baseVault||settings.hollowCrystals){
  report.reason='Direct roof-to-spike light ports require the open underside vault (not experimental whole-cluster hollowing).';
  return report;
 }
 const wall=clamp(Number(settings.wallThickness)||1.2,1,5);
 const bore=clamp(Number(settings.lightPortDiameter)||3.2,1.5,8);
 const penetration=clamp(Number(settings.lightPortReach)||55,25,72)/100;
 const clearance=wall*2.4;
 report.enabled=true;
 for(const c of crystals){
  if(c.hidden)continue;
  const shape={...settings,...(c.shape||{})},ratios=crystalEndRatios(c,settings);
  const scale=Math.min(Number(c.sx??c.scale??1),Number(c.sz??c.scale??1));
  const radius=Number(c.r)*ratios.size*Math.min(ratios.bottom,ratios.top)*scale;
  const maxBore=Math.max(0,(radius-clearance)*2);
  const diameter=Math.min(bore,maxBore);
  const height=Number(c.h)*Number(c.sy??c.scale??1);
  if(!Number.isFinite(diameter)||diameter<1.5||height<12){
   report.skipped.push({id:c.id,name:c.name,reason:'Insufficient crystal radius/height for the chosen wall and bore diameter'});
   continue;
  }
  report.ports.push({id:c.id,name:c.name,diameter:Math.round(diameter*100)/100,
   radius:diameter/2,reach:Math.round(height*penetration*10)/10,
   roofPenetration:Math.max(5,wall+3),estimatedRootRadius:radius});
 }
 if(report.skipped.length)report.reason=report.skipped.length+' narrow crystal(s) skipped to preserve estimated minimum walls.';
 return report;
}
