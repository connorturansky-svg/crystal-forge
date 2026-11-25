// Immutable resource revisions. Pure candidate operations; no browser storage,
// vault I/O or geometry edits. Consumers must integrate into guarded workspace writes.
import {canonical,resolveJobPrinter} from '../../studio-documents.js';
import {normalisePixelProfile} from '../../pixel-profiles.js';
import {validateCuraOptions} from '../../cura-profiles.js';
const idOk=id=>typeof id==='string'&&id.trim()===id&&id.length>0&&id.length<=100;
const revisionOk=n=>Number.isSafeInteger(n)&&n>0;
const clone=structuredClone;
const kinds=['pixel','printer'];
function validateValue(kind,value){
 if(kind==='pixel'){
  if(!value||!idOk(value.id)||!['seed','bullet','gumdrop'].includes(value.kind))throw Error('Choose a valid pixel profile.');
  // Existing normalizer intentionally accepts legacy inputs. New resource
  // versions must preserve exact dimensions, not silently clamp calibration.
  const normalized=normalisePixelProfile(value);
  for(const key of ['bodyDiameter','bodyHeight','flangeDiameter','flangeHeight','capHeight','wireWidth','wireDepth'])
   if(!Number.isFinite(value[key])||normalized[key]!==value[key])throw Error('Invalid pixel dimension: '+key);
  if(value.measuredFit&&canonical(value.measuredFit)!==canonical(normalized.measuredFit??null))throw Error('Invalid measured fit; retain the previous revision.');
  return {...normalized};
 }
 if(kind==='printer'){
  const options=validateCuraOptions({machine:value?.printer,nozzle:value?.curaNozzle,material:value?.curaMaterial,quality:value?.curaQuality,intent:value?.curaIntent});
  return {printer:options.machine,curaNozzle:options.nozzle,curaMaterial:options.material,curaQuality:options.quality,curaIntent:options.intent};
 }
 throw Error('Unsupported resource kind.');
}
export function resourceVersion(record,revision){
 if(!record||!idOk(record.id)||!kinds.includes(record.kind)||!revisionOk(revision))throw Error('Invalid resource reference.');
 const matches=record.versions.filter(v=>v.revision===revision);
 if(matches.length!==1)throw Error('Pinned resource revision is unavailable.');
 return clone(matches[0]);
}
export function appendResourceVersion(record,{id,kind,name,value,expectedRevision=0,notes='',tags=[],calibratedAt=null}){
 if(!idOk(id)||!kinds.includes(kind)||typeof name!=='string'||!name.trim()||name.trim().length>100)throw Error('Resource identity and name are required.');
 if(record&&(record.id!==id||record.kind!==kind||record.builtIn))throw Error('Cannot overwrite or change the identity of a built-in resource.');
 const versions=record?.versions||[];
 if(!Array.isArray(versions)||versions.some((v,i)=>!revisionOk(v.revision)||(i>0&&versions[i-1].revision>=v.revision)))throw Error('Invalid resource history.');
 const previous=versions.at(-1)?.revision??0;
 if(expectedRevision!==previous)throw Error('Resource changed; review the latest revision before saving.');
 if(!Array.isArray(tags)||tags.some(x=>typeof x!=='string')||typeof notes!=='string')throw Error('Invalid resource metadata.');
 if(calibratedAt!==null&&(typeof calibratedAt!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(calibratedAt)||!Number.isFinite(Date.parse(calibratedAt))))throw Error('Use an ISO calibration date.');
 const normalized=validateValue(kind,value);
 if(kind==='pixel'&&normalized.id!==id)throw Error('Pixel resource ID must match its measured profile ID.');
 return {id,kind,builtIn:false,versions:[...clone(versions),{revision:previous+1,name:name.trim(),value:normalized,notes,tags:[...new Set(tags.map(x=>x.trim()).filter(Boolean))],calibratedAt:kind==='pixel'&&normalized.measuredFit?calibratedAt:null}]};
}
export function pinResource(record,revision){
 const version=resourceVersion(record,revision);
 return {id:record.id,kind:record.kind,revision,version};
}
export function resolvePinnedResource(records,pin){
 const record=records.find(r=>r.id===pin.id&&r.kind===pin.kind);
 if(!record)throw Error('Pinned resource is missing. Restore its library before editing.');
 const version=resourceVersion(record,pin.revision);
 if(pin.version&&canonical(pin.version)!==canonical(version))throw Error('Pinned resource contents differ; restore the correct revision.');
 return version;
}
export function affectedPrintJobs(project,newDefaults){
 const candidate={...project,printer:{...newDefaults}};
 return project.printJobs.filter(job=>{
  const model=project.models.find(m=>m.id===job.modelId);
  if(!model)throw Error('Print job refers to a missing model.');
  return canonical(resolveJobPrinter(project,model,job))!==canonical(resolveJobPrinter(candidate,model,job));
 }).map(job=>job.id);
}
