/* One archive for practical fabrication handoff.
 * Zip uses the same store-only ZIP encoder as Cura profiles, with binary STL.
 */
import {zipProfileEntries,createCuraProfile} from './cura-profiles.js';
import {assessPrintQuality,printChecklistText} from './print-quality.js';
import {assessOpticalAccess,opticalAuditCSV} from './optical-audit.js';
import {planHardware} from './hardware-layout.js';
import {resolvePixelProfile} from './pixel-profiles.js';
const csv=rows=>rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n')+'\r\n';
export function buildProductionPack({settings,crystals,report,stlBytes,extraFiles=[],assemblyWarnings=[]}){
 if(!report?.ready||!(stlBytes instanceof Uint8Array)||stlBytes.length<84)
  throw Error('Prepare and validate a manufacturing STL before exporting a production pack.');
 const s=settings,hardware=planHardware(crystals,s);
 const assurance=assessPrintQuality(crystals,s,report),optical=assessOpticalAccess(crystals,s,report);
 const assets=[
  ['01_Model/crystal-forge-manifold.stl',stlBytes],
  ['02_Editable/crystal-forge-project.json',JSON.stringify({version:3,settings:s,crystals},null,2)],
  ['03_Reports/print-checklist.txt',printChecklistText(assurance,s)],
  ['03_Reports/optical-audit.csv',opticalAuditCSV(optical)],
  ['03_Reports/wiring-plan.csv',csv([
   ['Segment','From pixel','To pixel','X1','Z1','X2','Z2','Width mm','Depth mm','Length mm'],
   ...(hardware.wirePlan?.routes||[]).map((r,i)=>[i+1,r.from+1,r.to==null?'Edge':r.to+1,r.a.x,r.a.z,r.b.x,r.b.z,r.width,r.depth,r.lengthMm.toFixed(1)])
  ])],
  ['03_Reports/parts-list.csv',csv([
   ['Component','Count','Notes'],
   ['Crystal spike',crystals.filter(c=>!c.hidden).length,'Visible fused cluster bodies'],
   [resolvePixelProfile(s).name,hardware.sockets.length,'Nominal pixels; measure real hardware'],
   ['Mounting holes',hardware.mounts.length+hardware.tabHoles.length,'Physical fit and strength unverified'],
   ['Fixing tabs',hardware.tabs.length,'No overhead certification'],
   ['Cable route mm',(hardware.wirePlan?.lengthMm||0).toFixed(1),'Additional wire slack may be required'],
   ['Alignment pins',s.splitParts&&s.splitAlignment?'Optional separate download':0,'Only after split export; not contained in joined STL']
  ])]
 ];
 for(const item of extraFiles){
  if(!item||typeof item.path!=='string'||!(item.bytes instanceof Uint8Array)||item.bytes.length<84)
   throw Error('Invalid physical assembly file in production pack');
  if(!/^05_Assembly\/[a-zA-Z0-9_.-]+\.stl$/.test(item.path))
   throw Error('Unsafe assembly export path');
  assets.push([item.path,item.bytes]);
 }
 const condensed={status:report.status,bounds:report.bounds,printerFits:report.printerFits,
  triangleCount:report.triangleCount,volumeMm3:report.volumeMm3,
  estimatedPLAgrams:report.materialPLAgrams,socketsCut:report.socketsCut,
  mountingHolesCut:report.mountingHolesCut,wireChannelsCut:report.wireChannelsCut,
  hollowPorts:report.hollowPorts,roofReview:report.roofReview,warnings:report.warnings};
 assets.push(['03_Reports/manufacturing-report.json',JSON.stringify(condensed,null,2)]);
 let curaIncluded=false,curaWarning='';
 try{
  const profile=createCuraProfile({machine:s.printer,nozzle:s.curaNozzle,material:s.curaMaterial,quality:s.curaQuality,intent:s.curaIntent});
  assets.push(['04_Cura/'+profile.filename,profile.bytes]);curaIncluded=true;
 }catch(err){curaWarning=err.message}
 const instructions=[
  'CRYSTAL FORGE — PRODUCTION PACK',
  'Generated from the validated prepared mesh. No Cura/G-code/physical safety certification.',
  '', '01_Model — prepared STL (Z-up)',
  '02_Editable — original editable Crystal Forge project JSON',
  '03_Reports — model assumptions, wiring, pixel audit, print checklist and BOM',
  '04_Cura — optional quality override profile (not firmware or machine definition)',
  '', 'STEPS:',
  '1. Open the matching printer and physically installed nozzle/core in Cura.',
  '2. Select actual PLA/PETG filament and temperature from your proven material.',
  '3. Import the optional Cura .curaprofile (if included), then load the STL.',
  '4. Slice and inspect every roof, channel, joint and tip at layer resolution.',
  '5. Test-print a socket and check the actual LED/retention and wire exit.',
  '6. Test actual light transmission and mechanical installation before use.',
  '7. If you need separate split parts, export them using Split in the editor.',
  '05_Assembly — optional split pieces, dowels and M3 mounting plate',
  '',...assemblyWarnings,
  '',curaIncluded?'Cura profile included: review all settings after import.':
   'Cura profile omitted: '+curaWarning,
  '', 'This pack is not a guarantee of printable, support-free, safe or illuminated geometry.'
 ];
 assets.push(['START_HERE.txt',instructions.join('\n')+'\n']);
 const bytes=zipProfileEntries(assets);
 return {bytes,filename:'crystal-forge-production-pack.zip',files:assets.map(([name])=>name),
  curaIncluded,curaWarning};
}
