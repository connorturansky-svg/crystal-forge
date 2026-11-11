import assert from 'node:assert/strict';
import {generateFormation} from '../geometry-v3.js';
import {SHAPE_PRESETS,applyShapePreset,snapHardwarePoint,snapHardwareCoordinate} from '../design-workflows.js';
import {planSplitJoints} from '../split-joints.js';
import {assessOpticalAccess,opticalAuditCSV} from '../optical-audit.js';
import {assessPrintQuality,printChecklistText} from '../print-quality.js';
import {buildProductionPack} from '../production-pack.js';
import {resolvePixelProfile} from '../pixel-profiles.js';

const settings={
 count:6,height:120,width:120,seed:42,pattern:'Central Spire',spacing:40,
 leanMode:'Organic / natural',leanAmount:35,angleRandomness:30,
 familyMix:'Quartz',bottomScale:1,topScale:.8,tipRound:3.5,
 baseType:'integrated',baseStyle:'Circle',baseWidth:30,baseHeight:25,baseDome:0,
 pixelPlacement:'auto',cutSockets:true,lightingMode:'single',pixelCount:1,
 pixelProfileId:'gumdrop',pixelDiameter:12,pixelFit:.15,pixelRetentionLip:0,
 mount:'None',wireChannels:false,printer:'Ultimaker 2+',curaNozzle:.4,
 curaMaterial:'PLA',curaQuality:60,curaIntent:'light'
};
const crystals=generateFormation(settings);
assert.equal(crystals.length,6);
const target=crystals[0],s={...settings};
assert(SHAPE_PRESETS['Tall Needles']);
assert(applyShapePreset(crystals,s,target.id,'Tall Needles').applied,'selected shape preset applied');
assert.equal(target.shape.tipLength,.43);
assert.equal(s.tipLength,undefined,'global settings not changed by selected preset');
target.locked=true;
assert.equal(applyShapePreset(crystals,s,target.id,'Broad Geode').applied,false,'locked object protected');
target.locked=false;
assert(applyShapePreset(crystals,s,null,'Soft Rounded').applied,'global shape preset applied');
assert.equal(s.tipRound,7);
assert.deepEqual(snapHardwarePoint({x:12.4,z:-12.6},{hardwareSnap:true,hardwareSnapStep:5}),{x:10,z:-15});
assert.equal(snapHardwareCoordinate(12.4,false),12.4);
const poly=[{x:-50,z:-50},{x:50,z:-50},{x:50,z:50},{x:-50,z:50}];
const plan=planSplitJoints({splitAlignment:true,baseType:'integrated',baseHeight:25,splitPinDiameter:5,splitPinDepth:7,splitPinClearance:.25},
 {polygon:poly,sockets:[],mounts:[]},0);
assert.equal(plan.points.length,2,'Two safe dowels planned in solid plinth');
assert(plan.points.every(p=>p.diameter===5&&p.depth===7));
assert.equal(planSplitJoints({splitAlignment:false},{polygon:poly},0).points.length,0);
assert.equal(planSplitJoints({splitAlignment:true,baseType:'integrated',baseHeight:25,baseVault:true},{polygon:poly},0).points.length,0);
const audit=assessOpticalAccess(crystals,s);
assert.equal(audit.results.length,6);
assert(audit.results.every(p=>p.status&&!p.status.toLowerCase().includes('verified')),'Optical status never claims proven connection');
assert(opticalAuditCSV(audit).includes('Nearest LED'));
const review=assessPrintQuality(crystals,s);
assert(review.checks.length>=6);
assert(review.findings.some(f=>f.label==='Manufacturing mesh not prepared'));
assert(printChecklistText(review,s).includes('MANUAL CURA / PHYSICAL CHECKS'));
assert.equal(resolvePixelProfile({...s,pixelRetentionLip:.35}).retentionLip,.35);

const report={ready:true,status:'Manifold mesh validated',printerFits:true,triangleCount:12,
 bounds:[120,120,25],volumeMm3:10000,materialPLAgrams:12.4,socketsCut:1,
 mountingHolesCut:0,wireChannelsCut:0,hollowPorts:0,roofReview:{estimateMm:10,method:'2D',needsCura:true},warnings:[]};
const binary=new Uint8Array(84+50);
binary[0]=66;binary[1]=73;binary[2]=78;binary[3]=65;
const pack=buildProductionPack({settings:s,crystals,report,stlBytes:binary});
assert(pack.bytes.length>binary.length);
assert(pack.curaIncluded);
assert(pack.files.includes('03_Reports/production-release-gates.json'),
 'Pack contains explicit never-auto-certified physical release gates');
for(const path of ['01_Model/crystal-forge-manifold.stl','02_Editable/crystal-forge-project.json',
 '03_Reports/wiring-plan.csv','03_Reports/optical-audit.csv','03_Reports/print-checklist.txt',
 '03_Reports/parts-list.csv','03_Reports/manufacturing-report.json',
 '03_Reports/production-release-gates.json','START_HERE.txt'])
 assert(pack.files.includes(path),'Missing pack file '+path);
assert(pack.files.some(p=>p.endsWith('.curaprofile')),'Cura archive included');
const archive=pack.bytes,view=new DataView(archive.buffer,archive.byteOffset,archive.length),decoder=new TextDecoder();
let offset=0,foundModel=false,n=0;
while(offset+4<=archive.length&&view.getUint32(offset,true)===0x04034b50){
 const length=view.getUint16(offset+26,true),extra=view.getUint16(offset+28,true);
 const name=decoder.decode(archive.subarray(offset+30,offset+30+length));
 const size=view.getUint32(offset+18,true),start=offset+30+length+extra;
 if(name==='01_Model/crystal-forge-manifold.stl'){
  assert.deepEqual(archive.subarray(start,start+binary.length),binary,'Binary STL preserved bit-for-bit');foundModel=true;
 }
 offset=start+size;n++;
}
assert(foundModel&&n===pack.files.length,'All pack files ZIP encoded');
assert.throws(()=>buildProductionPack({settings:s,crystals,report:null,stlBytes:binary}),/Prepare and validate/);
const other=buildProductionPack({settings:{...s,printer:'Custom / other'},crystals,report,stlBytes:binary});
assert.equal(other.curaIncluded,false,'Custom machine has no invented Cura profile');
console.log('PR6 all-phase contracts passed: print, light, joins, presets, snap, production ZIP ('+n+' entries)');
