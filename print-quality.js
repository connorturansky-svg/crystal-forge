/* Print assurance — engineering prompts rather than a slicer simulation.
 * Runs entirely from current design data. No unsupported Cura claims.
 */
import {calculateCuraSettings} from './cura-profiles.js';
import {planHardware} from './hardware-layout.js';
import {estimateRoofReview} from './print-advisor.js';
const finite=(v,fallback)=>Number.isFinite(Number(v))?Number(v):fallback;
const ceil=(v)=>Math.ceil(v*10)/10;
export function assessPrintQuality(crystals,settings,preparedReport=null){
 const s=settings,hardware=planHardware(crystals,s);
 const roof=preparedReport?.roofReview||estimateRoofReview(hardware.polygon,s,preparedReport?.vault||{});
 const findings=[],checks=[],add=(severity,label,detail)=>findings.push({severity,label,detail});
 let profile=null;
 try{profile=calculateCuraSettings({machine:s.printer,nozzle:s.curaNozzle,material:s.curaMaterial,quality:s.curaQuality,intent:s.curaIntent})}
 catch(error){add('warning','Cura configuration',error.message)}
 const nozzle=profile?.nozzle||Math.max(.25,finite(s.curaNozzle,.4));
 const lineWidth=nozzle;
 const visible=crystals.filter(c=>!c.hidden);
 const narrow=visible.filter(c=>{
  const shape={...s,...(c.shape||{})};
  const smallest=c.r*Math.min(finite(shape.topScale,.8),finite(shape.bottomScale,1))*
   Math.min(finite(c.sx||c.scale,1),finite(c.sz||c.scale,1));
  return smallest<lineWidth*2;
 });
 if(narrow.length)add('warning','Tiny roots/facets',narrow.length+' crystal(s) have a calculated half-width below two nozzle lines. Inspect thin tips and root rings in Cura.');
 if(s.wireChannels&&finite(s.wireWidth,3)<lineWidth*3)
  add('warning','Wire-groove resolution','Requested '+s.wireWidth+' mm channels are less than three nominal nozzle widths. Inspect the underside in Cura.');
 if(s.pixelRetentionLip>0&&finite(s.pixelRetentionLip,0)>lineWidth*.75)
  add('warning','Socket retaining ridge','The '+s.pixelRetentionLip+' mm experimental ridge may be over-tight or unsupported; test an actual pixel fit first.');
 if(s.pixelRetentionLip>0)add('info','Pixel retention','Retention ridges are optional, not verified for individual LED products. Do not force a rigid housing into a printed lip.');
 if(roof.estimateMm>20)add(roof.estimateMm>32?'warning':'review','Unsupported roof span proxy',
  'Estimated '+roof.estimateMm.toFixed(1)+' mm; this is a 2D proxy, not an actual Cura bridge. Inspect all roof layers, support and adhesion.');
 if(s.baseProfile==='Full dome / hill'&&finite(s.sideWall,100)<25)
  add('review','Shallow hill edge','Check floor contact, edge-wall thickness and adhesion for the selected full-hill profile.');
 if(preparedReport?.disconnected>1)
  add('warning','Disconnected model','The prepared model contains '+preparedReport.disconnected+' material bodies. Check the intended assembly.');
 if(preparedReport?.printerFits===false)add('warning','Printer build volume','The prepared mesh exceeds the selected printer limits.');
 if(s.lightPorts)add('review','Direct crystal passages','Real tapered cuts need Cura cross-section and lit physical samples. '+(preparedReport?.skippedDirectLightPorts||0)+' bores were skipped.');
 if(s.hollowCrystals||s.baseVault)add('review','Internal light chamber','Hollowing and 0% infill do not guarantee that every spike is optically connected; review cross sections.');
 if(!preparedReport)add('review','Manufacturing mesh not prepared','Run Prepare print mesh before exporting the final model and physical part pack.');
 if(!findings.length)add('review','Slicer check needed','No obvious heuristic conflicts found. Cura layer-by-layer and real test prints are still mandatory.');
 checks.push('Confirm the installed nozzle / AA core, printer and filament material in Cura.');
 checks.push('Inspect the first layer and skirt/brim adhesion on the chosen bed.');
 checks.push('Inspect thin crystal tips, shoulders, roots and fillets at all layer heights.');
 checks.push('Inspect horizontal base roof bridging and supports at 0% infill.');
 checks.push('Confirm LED socket mouth, retention, flange depth and underside wire exits.');
 checks.push('Confirm light can enter every intended crystal; 0% infill alone is insufficient.');
 checks.push('Fit-test the actual LED and filament with a small calibration coupon.');
 checks.push('Physically test mounting, cable strain relief and any suspended pieces.');
 const status=findings.some(f=>f.severity==='warning')?'Warnings':findings.some(f=>f.severity==='review')?'Review in Cura':'Inspection required';
 return {status,nozzle,layerHeight:profile?.layerHeight??null,roof,findings,checks,hardware,estimatedCableMm:ceil(hardware.wirePlan?.lengthMm||0)};
}
export function printChecklistText(result,settings={}){
 const lines=['CRYSTAL FORGE — PRINT CHECKLIST','NOT a Cura/G-code or structural validation','',
  'Printer: '+String(settings.printer||'Unspecified'),
  'Nozzle: '+result.nozzle+' mm','Material: '+String(settings.curaMaterial||'Unspecified'),
  'Assessment: '+result.status,'Roof span proxy: '+result.roof.estimateMm.toFixed(1)+' mm',
  'Routed wire estimate: '+result.estimatedCableMm+' mm','','REVIEW WARNINGS'];
 for(const f of result.findings)lines.push('- ['+f.severity.toUpperCase()+'] '+f.label+': '+f.detail);
 lines.push('','MANUAL CURA / PHYSICAL CHECKS');
 for(const c of result.checks)lines.push('[ ] '+c);
 lines.push('','NOTE: These heuristics cannot certify bridging, optical connectivity, safety or printability.');
 return lines.join('\n')+'\n';
}
