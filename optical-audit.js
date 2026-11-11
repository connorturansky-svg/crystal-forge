/* An inspection-first optical access report, NOT a light transport solver.
 * Never interpret a reachable position as a proven unblocked lumen.
 */
import {planHardware} from './hardware-layout.js';
export function assessOpticalAccess(crystals,s,report=null){
 const plan=planHardware(crystals,s),sockets=plan.sockets;
 const hasOpenInterior=!!(s.baseVault||s.hollowCrystals);
 const skipped=Number(report?.skippedHollowPorts||0);
 const results=crystals.filter(c=>!c.hidden).map(c=>{
  let nearest=null,distanceMm=Infinity;
  for(let i=0;i<sockets.length;i++){
   const socket=sockets[i],d=Math.hypot(c.x-socket.x,c.z-socket.z);
   if(d<distanceMm){nearest=i;distanceMm=d}
  }
  const profile={...s,...(c.shape||{})};
  const rootRadius=c.r*Math.min(Number(profile.bottomScale||1),Number(profile.topScale||.8));
  const narrow=rootRadius<Math.max(1.25,Number(s.wallThickness||1.2)*2.2);
  let status='Unknown: no proven optical channel',reason='';
  if(!sockets.length){status='No LED socket';reason='Add an accepted physical LED socket.'}
  else if(!hasOpenInterior){status='No modeled shared passage';reason='Solid roots can block light even if sparse infill is 0%.'}
  else if(narrow){status='Restricted root (review)';reason='Small root may not accommodate a safe light passage.'}
  else{
   status='Candidate only — inspect slice';
   reason=s.baseVault?'Base vault exists, but individual root-to-vault optical access is not proven.':
   'Experimental hollowing selected; individual lumen connection is not proven by this report.';
  }
  return {id:c.id,name:c.name,nearestPixel:nearest===null?null:nearest+1,distanceMm:Number.isFinite(distanceMm)?Math.round(distanceMm*10)/10:null,
   rootRadiusMm:Math.round(rootRadius*10)/10,status,reason};
 });
 return {status:'Unverified optical connectivity',results,acceptedPixels:sockets.length,skippedPassages:skipped,
  missingSources:results.filter(r=>r.nearestPixel===null).length,
  note:'This is a geometric proximity/feature audit, not a ray tracer or proof of LED-to-spike openness. Inspect real Cura slices and physical illumination.'};
}
export function opticalAuditCSV(audit){
 const esc=value=>'"'+String(value??'').replaceAll('"','""')+'"';
 const rows=[['Crystal','Nearest LED','Distance (mm)','Root radius estimate (mm)','Status','Reason'],
 ...audit.results.map(x=>[x.name,x.nearestPixel,x.distanceMm,x.rootRadiusMm,x.status,x.reason])];
 return rows.map(row=>row.map(esc).join(',')).join('\r\n')+'\r\n';
}
