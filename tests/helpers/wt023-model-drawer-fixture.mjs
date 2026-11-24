// Test-only v1 document fixtures. No geometry is claimed by these records.
import {createProject,createModel,addModel,findModel,queueModel,beginPreparation,finishPreparation} from '../../studio-documents.js';
export const FAMILIES=['crystals','tactile-tiles','gears','waves','control-caps','characters','light-pods'];
export const NOW='2026-11-24T00:00:00.000Z';
export function drawerProject(count=9,id='drawer-project-A'){
 const project=createProject({id,title:'Memory-Mart',now:NOW});
 for(let i=0;i<count;i++){
  const typeId=FAMILIES[i%FAMILIES.length];
  addModel(project,createModel({id:'drawer-'+i,name:i<2?'Same model':`Model ${i} · ${typeId}`,
   typeId,parameters:{width:90+i},editableState:typeId==='crystals'?{crystals:[{id:'cr-'+i,x:i,z:-i}],selectedId:null}:{},now:NOW}));
 }
 if(count){
  const job=queueModel(project,'drawer-0',{jobId:'drawer-job'});
  finishPreparation(project,beginPreparation(project,job.id,'drawer-ticket'));
 }
 return project;
}
// Preserve data and job identity independently of tab order/active selection.
export function documentEvidence(project){
 return JSON.stringify({id:project.id,models:project.models,printJobs:project.printJobs,
  printer:project.printer,hardwareProfiles:project.hardwareProfiles,materialProfiles:project.materialProfiles});
}
