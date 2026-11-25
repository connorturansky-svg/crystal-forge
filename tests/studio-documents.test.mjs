import assert from 'node:assert/strict';
import {createProject,createModel,addModel,findModel,openTab,closeTab,reorderTabs,
 duplicateModel,editModel,modelFingerprint,queueModel,resolveJobPrinter,movePrintJob,invalidatePrintJob,beginPreparation,finishPreparation,cancelPreparation,canExport,
 saveLibraryRevision,insertLibraryModel,availableLinkedUpdate,acceptLinkedUpdate,breakLink,
 exportProject,importProject,WORKSPACE_KEY,BACKUP_KEY,LEGACY_KEYS} from '../studio-documents.js';
import {migrateLegacySnapshot,migrateLegacyStorage} from '../studio-migration.js';
const now='2026-11-17T00:00:00.000Z';
const make=(id,width=80)=>createModel({id,name:id,typeId:'tactile-tiles',parameters:{width},now});
const p=createProject({id:'project',now});
addModel(p,make('a')); addModel(p,make('b',120));
closeTab(p,'a'); assert.equal(findModel(p,'a').parameters.width,80);
openTab(p,'a'); reorderTabs(p,['a','b']); assert.equal(p.activeTab,'a');
assert.throws(()=>reorderTabs(p,['a','a']));
duplicateModel(p,'a',{newModelId:'c',now});
editModel(p,'c',{parameters:{width:40}},{now});
assert.equal(findModel(p,'a').parameters.width,80);
assert.equal(findModel(p,'b').parameters.width,120);
assert.deepEqual(importProject(exportProject(p)),p);
const job=queueModel(p,'a',{jobId:'job'});
let ticket=beginPreparation(p,job.id,'request-1');
assert.equal(finishPreparation(p,{...ticket,modelId:'b'}),false);
assert.equal(finishPreparation(p,ticket),true); assert.equal(canExport(p,job.id),true);
ticket=beginPreparation(p,job.id,'request-2');
editModel(p,'a',{parameters:{width:90}},{now});
assert.equal(finishPreparation(p,ticket),false); assert.equal(canExport(p,job.id),false);
ticket=beginPreparation(p,job.id,'request-3'); cancelPreparation(p,job.id);
const next=beginPreparation(p,job.id,'request-4');
assert.equal(finishPreparation(p,ticket),false);
assert.equal(finishPreparation(p,next,{error:'engine failed'}),true);
assert.equal(canExport(p,job.id),false);
p.printer={machine:'UM3',nozzle:.4};
findModel(p,'a').printerOverrides={nozzle:.8};
job.overrides={material:'PETG'};
ticket=beginPreparation(p,job.id,'request-5');
assert.deepEqual(ticket.printer,{machine:'UM3',nozzle:.8,material:'PETG'});
assert.equal(p.printer.nozzle,.4);
assert.deepEqual(ticket.printer,resolveJobPrinter(p,findModel(p,'a'),job));
const secondJob=queueModel(p,'b',{jobId:'second-job'});
assert.equal(movePrintJob(p,job.id,-1),false);
assert.equal(movePrintJob(p,secondJob.id,-1),true);
assert.deepEqual(importProject(exportProject(p)).printJobs.map(item=>item.id),[secondJob.id,job.id]);
assert.equal(p.printJobs[1],job);
invalidatePrintJob(job);
assert.equal(finishPreparation(p,ticket),false);
assert.equal(secondJob.status,'queued');
const library=[];
saveLibraryRevision(library,findModel(p,'a'));
assert.throws(()=>saveLibraryRevision(library,findModel(p,'a')));
const linked=insertLibraryModel(p,library,'a',{linked:true,id:'linked',now});
assert.throws(()=>editModel(p,'linked',{parameters:{width:10}}));
editModel(p,'a',{parameters:{width:100}},{now});
saveLibraryRevision(library,findModel(p,'a'),{expectedRevision:1});
assert.equal(findModel(p,'linked').parameters.width,90);
assert.equal(availableLinkedUpdate(linked,library).revision,2);
acceptLinkedUpdate(p,'linked',library,2);
assert.equal(linked.parameters.width,100); assert.equal(linked.link.revision,2);
assert.equal(library[0].versions[0].model.parameters.width,90);
breakLink(p,'linked'); editModel(p,'linked',{parameters:{width:30}},{now});
assert.equal(library[0].versions[1].model.parameters.width,100);
const legacy={settings:{title:'Mine',custom:{pixelProfiles:[{id:'measured',diameter:12.3}]}},
 crystals:[{id:'cr-1',shape:{tipRound:4},x:12,z:-5}],selectedId:'cr-1'};
const snapshot=Object.fromEntries(LEGACY_KEYS.map(key=>[key,null]));
snapshot[LEGACY_KEYS[0]]=JSON.stringify(legacy);
snapshot[LEGACY_KEYS[1]]=JSON.stringify([{...legacy,id:'named',name:'Saved mine'}]);
snapshot[LEGACY_KEYS[2]]=JSON.stringify([{id:'custom-pixel',height:22}]);
snapshot[LEGACY_KEYS[3]]=JSON.stringify([{name:'template',settings:{width:99}}]);
const migrated=migrateLegacySnapshot(snapshot);
assert.deepEqual(migrateLegacySnapshot(snapshot),migrated);
assert.deepEqual(migrated.project.models[0].parameters,legacy.settings);
assert.deepEqual(migrated.project.models[0].editableState.crystals,legacy.crystals);
assert.equal(migrated.library.length,1);
assert.equal(migrated.legacyTemplates[0].settings.width,99);
class MemoryStorage {
 constructor(values,fail=null){this.data=new Map(Object.entries(values));this.fail=fail;}
 getItem(key){return this.data.get(key)??null;}
 setItem(key,value){if(key===this.fail)throw Error('Quota exceeded');this.data.set(key,value);}
 removeItem(key){this.data.delete(key);}
}
const storage=new MemoryStorage(snapshot);
assert.deepEqual(migrateLegacyStorage(storage),migrated);
assert.deepEqual(migrateLegacyStorage(storage),migrated);
for(const key of LEGACY_KEYS)assert.equal(storage.getItem(key),snapshot[key]);
assert.deepEqual(JSON.parse(storage.getItem(BACKUP_KEY)).originals,snapshot);
const full=new MemoryStorage(snapshot,BACKUP_KEY);
assert.throws(()=>migrateLegacyStorage(full)); assert.equal(full.getItem(WORKSPACE_KEY),null);
const interrupted=new MemoryStorage(snapshot,WORKSPACE_KEY);
assert.throws(()=>migrateLegacyStorage(interrupted));
assert.notEqual(interrupted.getItem(BACKUP_KEY),null);
for(const key of LEGACY_KEYS)assert.equal(interrupted.getItem(key),snapshot[key]);
const malformed=new MemoryStorage({...snapshot,[LEGACY_KEYS[1]]:'[{"id":"broken"}]'});
assert.throws(()=>migrateLegacyStorage(malformed)); assert.equal(malformed.getItem(BACKUP_KEY),null);
assert.throws(()=>importProject({...p,schemaVersion:99}));
assert.throws(()=>importProject({...p,tabs:['missing']}));
console.log('Studio documents: isolation, revision guards, links, legacy recovery and quota failures passed.');

// WT-023A non-mutating active/snapshot grouping and private-vault preservation.
await import('./wt023-project-index.test.mjs');
// Long-lived regression: seven-builder identity and saved-project state cannot disappear.
await import('./wt023-postmerge-regressions.test.mjs');


// WT-023C drawer document contracts salvaged from #165 after #164 merged.
// These are synthetic document records, not real geometry or UI acceptance.
{
 const families=['crystals','tactile-tiles','gears','waves','control-caps','characters','light-pods'];
 const makeDrawerProject=(count,id='drawer-project-A')=>{
  const project=createProject({id,title:'Drawer regression',now});
  for(let i=0;i<count;i++)addModel(project,createModel({
   id:'drawer-'+i,name:i<2?'Same model':'Model '+i,typeId:families[i%families.length],
   parameters:{width:90+i},now
  }));
  if(count){
   const prepared=queueModel(project,'drawer-0',{jobId:'drawer-job'});
   assert.equal(finishPreparation(project,beginPreparation(project,prepared.id,'drawer-ticket')),true);
  }
  return project;
 };
 const evidence=project=>JSON.stringify({id:project.id,models:project.models,printJobs:project.printJobs,
  printer:project.printer,hardwareProfiles:project.hardwareProfiles,materialProfiles:project.materialProfiles});
 for(const count of [0,1,9,105]){
  const project=makeDrawerProject(count),before=evidence(project),ids=[...project.tabs];
  assert.equal(new Set(ids).size,count);
  if(count){
   assert(canExport(project,'drawer-job'));
   openTab(project,ids[0]);
   reorderTabs(project,[...ids].reverse());
   assert.equal(project.activeTab,ids[0]);
   closeTab(project,ids[0]);
   if(count>1)assert(project.tabs.includes(project.activeTab));
   for(const id of ids)closeTab(project,id);
   assert.deepEqual(project.tabs,[]);
   assert.equal(project.activeTab,null);
   assert.equal(evidence(project),before,'Closing tabs must not delete models or prepared jobs');
   assert(canExport(project,'drawer-job'));
   for(const id of ids)openTab(project,id);
   assert.deepEqual(project.tabs,ids);
   const order=JSON.stringify(project);
   assert.throws(()=>reorderTabs(project,[...ids,'missing']),/exactly/);
   assert.equal(JSON.stringify(project),order,'Invalid reorder must be atomic');
  }
  assert.equal(evidence(project),before);
  assert.deepEqual(importProject(exportProject(project)),project);
 }
 // Merged drawer rename calls editModel: name-only changes retain geometry
 // fingerprint, advance revision and invalidate prepared output pinned to it.
 const a=makeDrawerProject(9),b=makeDrawerProject(9,'drawer-project-B');
 assert.equal(a.title,b.title);
 assert.equal(a.models[0].id,b.models[0].id);
 assert.equal(a.models[0].name,a.models[1].name);
 assert.equal(new Set(a.models.map(m=>m.generator.typeId)).size,families.length);
 assert.throws(()=>createModel({id:'blank',name:'  ',typeId:'crystals',now}),/name/i);
 const model=findModel(a,'drawer-0'),fingerprint=modelFingerprint(model),revision=model.revision;
 editModel(a,model.id,{name:'Long Unicode model — lumière ✨'},{now});
 assert.equal(model.id,'drawer-0');
 assert.equal(model.revision,revision+1);
 assert.equal(modelFingerprint(model),fingerprint);
 assert.equal(a.printJobs[0].status,'stale');
 assert.equal(canExport(a,'drawer-job'),false);
 assert.equal(canExport(b,'drawer-job'),true,'Other project with same model ID keeps its prepared job');
 const sourceBefore=modelFingerprint(findModel(b,'drawer-0'));
 editModel(b,'drawer-0',{parameters:{width:999}},{now});
 assert.notEqual(modelFingerprint(findModel(b,'drawer-0')),sourceBefore);
 assert.equal(modelFingerprint(model),fingerprint);
 // Existing linked-source tests cover edit refusal and upgrades; additionally
 // exercise close-tab preserving the actual pinned model and Library contents.
 const pinnedLibrary=[];
 saveLibraryRevision(pinnedLibrary,findModel(a,'drawer-1'));
 const copy=insertLibraryModel(a,pinnedLibrary,'drawer-1',{linked:true,id:'drawer-linked',now});
 const pinned=JSON.stringify(pinnedLibrary),pinnedModel=JSON.stringify(copy);
 closeTab(a,copy.id);
 assert.equal(JSON.stringify(findModel(a,copy.id)),pinnedModel);
 assert.equal(JSON.stringify(pinnedLibrary),pinned);
 assert.deepEqual(importProject(exportProject(a)),a);
 console.log('WT-023C drawer document contracts: bulk close/reopen, atomic reorder, rename/job revision and linked-source preservation passed.');
}
