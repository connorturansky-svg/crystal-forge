import assert from 'node:assert/strict';
import {createProject,createModel,addModel,findModel,openTab,closeTab,reorderTabs,
 duplicateModel,editModel,queueModel,resolveJobPrinter,movePrintJob,invalidatePrintJob,beginPreparation,finishPreparation,cancelPreparation,canExport,
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

// WT-023C drawer data contract (independent of visual implementation).
await import('./wt023-model-drawer-contract.test.mjs');
