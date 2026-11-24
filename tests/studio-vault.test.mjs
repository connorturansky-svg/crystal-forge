import {archiveSummary,reconcileArchive,commitRecovery,RECOVERY_PREFIX,projectWorkspaceCandidate} from '../studio-sync-plan.js';
import {WORKSPACE_KEY} from '../studio-documents.js';
import {readOrganisation,ensureSnapshotIds,templateProject,mergeOrganisation} from '../studio-organisation.js';
import assert from 'node:assert/strict';
import {createProject,createModel,addModel} from '../studio-documents.js';
import {packStudioVault,unpackStudioVault,StudioVault,STUDIO_MANIFEST} from '../studio-vault.js';
const project=createProject({id:'test'});addModel(project,createModel({id:'model',name:'Tile',typeId:'tactile-tiles',thumbnail:'data:image/png;base64,abc'}));
const state={schemaVersion:1,project,library:[],savedProjects:[],legacyTemplates:[]};
const packed=await packStudioVault(state);assert(packed.assets.size>=3);
assert.deepEqual(await unpackStudioVault(packed.manifest,hash=>packed.assets.get(hash)),{...state,organisation:readOrganisation()});
await assert.rejects(()=>unpackStudioVault(packed.manifest,()=>({corrupt:true})),/integrity/);
const snapshot=ensureSnapshotIds([structuredClone(project)])[0];
state.savedProjects.push(snapshot);
state.organisation={
 version:1,collections:[{id:'farm',name:'Farm'}],
 items:{['project:'+snapshot.snapshotId]:{favorite:true,collectionIds:['farm']}},
 templates:[{id:'starter',name:'Starter',kind:'project',sourceId:snapshot.snapshotId}]
};
assert.deepEqual(mergeOrganisation(state.organisation,state.organisation),state.organisation);
assert.throws(()=>readOrganisation({...state.organisation,collections:[...state.organisation.collections,{id:'duplicate',name:'FARM'}]}),/Duplicate/);
const starter=templateProject(snapshot);
assert.notEqual(starter.id,snapshot.id);
assert.equal(starter.activeTab,snapshot.activeTab);
assert.deepEqual(starter.models,snapshot.models);
const files=new Map();let serial=0,failAssets=false;
const client={async request(path,options={}){path=path.replace('/contents/','');if(!options.method)return files.get(path)||null;
 const payload=JSON.parse(options.body);if(failAssets&&path!==STUDIO_MANIFEST)throw Error('offline');
 const old=files.get(path);if((old?.sha??null)!==(payload.sha??null))throw Error('SHA conflict');
 const file={sha:'sha-'+(++serial),content:payload.content};files.set(path,file);return {content:{sha:file.sha}};
}};
const vault=new StudioVault(client);await vault.push(state);assert.deepEqual(await vault.pull(),state);
const originalManifest=files.get(STUDIO_MANIFEST).content;const other=new StudioVault(client);
await assert.rejects(()=>other.push(state),/changed/);
const updated=structuredClone(state);updated.project.title='Another project';failAssets=true;
await assert.rejects(()=>vault.push(updated),/offline/);assert.equal(files.get(STUDIO_MANIFEST).content,originalManifest);
failAssets=false;await vault.push(updated);assert.deepEqual(await vault.pull(),updated);
console.log('Studio vault: separate hashed assets, complete round-trip, conflict refusal and interrupted-write recovery passed.');

const review=await vault.pull({acknowledge:false});
assert.equal(review.sha,vault.sha);
assert.deepEqual(review.state,updated);
const unreviewed=new StudioVault(client);
await unreviewed.pull({acknowledge:false});
assert.equal(unreviewed.sha,null);

const local=structuredClone(state),remote=structuredClone(state);
const old=local.project.models[0];
local.library=[{id:'source',versions:[{revision:1,model:structuredClone(old)}]}];
const newer=structuredClone(old);newer.name='Remote Tile';
remote.library=[{id:'source',versions:[{revision:1,model:newer}]}];
remote.project.models[0].link={sourceId:'source',revision:1};
remote.project.title='Remote project';
remote.organisation.collections[0].name='Remote farm';
remote.organisation.items['model:source']={favorite:true,collectionIds:['farm']};
remote.organisation.templates.push({id:'remote-starter',name:'Remote model starter',kind:'model',sourceId:'source',revision:1});
const original=JSON.stringify(local);
assert.deepEqual(archiveSummary(local,remote).models.conflicts,['Remote Tile']);
const recovered=await reconcileArchive(local,remote);
assert.equal(JSON.stringify(local),original);
assert.equal(recovered.candidate.project.id,local.project.id);
assert.equal(recovered.candidate.project.title,local.project.title);
const copy=recovered.candidate.library.find(record=>record.id!=='source');
assert(copy);
assert.equal(recovered.candidate.savedProjects.find(p=>p.title.startsWith('Remote project')).models[0].link.sourceId,copy.id);
const template=recovered.candidate.organisation.templates.find(t=>t.id==='remote-starter');
assert.equal(template.sourceId,copy.id);
assert.equal(recovered.candidate.organisation.items['model:'+copy.id].favorite,true);
const repeated=await reconcileArchive(JSON.parse(JSON.stringify(recovered.candidate)),remote);
assert.equal(repeated.importedModels,0);
assert.equal(repeated.importedProjects,0);
assert.deepEqual(repeated.candidate.organisation,recovered.candidate.organisation);
const selective=await reconcileArchive(local,remote,{selection:'model:0:1'});
assert.equal(selective.importedProjects,0);
assert.equal(selective.importedModels,1);
await assert.rejects(()=>reconcileArchive(local,remote,{selection:'model:0:99'}),/unavailable/);
await assert.rejects(()=>reconcileArchive(local,{...remote,library:[{id:'bad',versions:[]}]}),/Library source/);
const data=new Map([[WORKSPACE_KEY,original]]);
let quotaFailure=true;
const storage={getItem:key=>data.get(key)??null,setItem(key,value){
 if(key===WORKSPACE_KEY&&quotaFailure)throw Error('Quota');data.set(key,value);
},removeItem:key=>data.delete(key)};
const key=RECOVERY_PREFIX+'123-test';
assert.throws(()=>commitRecovery(storage,local,recovered.candidate,key),/could not be saved/);
assert.equal(data.get(WORKSPACE_KEY),original);
assert(!data.has(key));
quotaFailure=false;
commitRecovery(storage,local,recovered.candidate,key);
assert.equal(data.get(key),original);
assert.equal(JSON.parse(data.get(WORKSPACE_KEY)).library.length,2);
console.log('WT-016 non-destructive conflict copies, repeated recovery, selective restore and quota rollback passed.');

const later=JSON.stringify({...local,project:{...local.project,title:'Saved in another tab'}});
data.set(WORKSPACE_KEY,later);
const staleKey=RECOVERY_PREFIX+'124-stale';
assert.throws(()=>commitRecovery(storage,local,recovered.candidate,staleKey,original),/Another tab saved/);
assert.equal(data.get(WORKSPACE_KEY),later);
assert(!data.has(staleKey));

const measured={id:'custom-backup-seed',name:'Measured backup Seed',kind:'seed',
 bodyDiameter:5,bodyHeight:9,flangeDiameter:5,flangeHeight:0,capHeight:1,
 wireWidth:2,wireDepth:1.5,measuredFit:{bodyDiameter:5,printedBoreDiameter:5.5}};
const backupWithProfile={...structuredClone(state),pixelProfiles:[measured]};
const privatePack=await packStudioVault(backupWithProfile);
assert.equal(typeof privatePack.manifest.pixelProfiles,'string','Studio vault must reference an immutable profile library asset');
const privateRestored=await unpackStudioVault(privatePack.manifest,hash=>privatePack.assets.get(hash));
assert.deepEqual(privateRestored.pixelProfiles,[measured],'Private-vault round-trip must retain A–G profile and measured fit');
await vault.push(backupWithProfile);
assert.deepEqual((await vault.pull()).pixelProfiles,[measured],'Private restore must expose measured profiles');
const blank=structuredClone(state);
blank.pixelProfiles=[];
const restoredProfiles=await reconcileArchive(blank,backupWithProfile);
assert.deepEqual(restoredProfiles.candidate.pixelProfiles,[measured],'Complete JSON backup reconciliation must restore custom profiles');

const conflictingLocal=structuredClone(blank),conflictingRemote=structuredClone(backupWithProfile);
conflictingLocal.pixelProfiles=[{...measured,name:'Older independently calibrated seed',measuredFit:{bodyDiameter:5,printedBoreDiameter:5.4}}];
conflictingRemote.project.models[0].build.activePixelProfileId=measured.id;
conflictingRemote.project.models[0].build.pixelHoles=[{id:'pixel-recovery',profileId:measured.id,socketProfile:{...measured}}];
const beforeConflict=JSON.stringify(conflictingLocal);
const combined=await reconcileArchive(conflictingLocal,conflictingRemote);
assert.equal(JSON.stringify(conflictingLocal),beforeConflict,'Conflicting local measurements must never be changed');
assert.equal(combined.candidate.pixelProfiles.length,2,'Keep both conflicting calibrations');
const rescued=combined.candidate.pixelProfiles.find(profile=>profile.id!==measured.id);
assert.match(rescued.id,/^custom-recovered-/);
assert.equal(rescued.measuredFit.printedBoreDiameter,5.5);
const restoredProject=combined.candidate.savedProjects.find(p=>p.title.startsWith('Recovered Crystal Forge')||
 p.models.some(model=>model.build?.activePixelProfileId===rescued.id));
assert(restoredProject,'Recovered project must be available in the Library');
const restoredModel=restoredProject.models[0];
assert.equal(restoredModel.build.activePixelProfileId,rescued.id);
assert.equal(restoredModel.build.pixelHoles[0].profileId,rescued.id);
assert.equal(restoredModel.build.pixelHoles[0].socketProfile.id,rescued.id);
console.log('Studio measured-profile JSON/vault round-trips and conflicting-ID non-destructive recovery passed.');

const legacyProject={...structuredClone(project),id:'same-title-other-project'};
const legacySnapshots=[project,{...project,snapshotId:'kept'},{...legacyProject,snapshotId:'kept'},
 {...legacyProject,snapshotId:'legacy-snapshot-1'}].map(item=>structuredClone(item));
const beforeMigration=JSON.stringify(legacySnapshots);
const migrated=ensureSnapshotIds(structuredClone(legacySnapshots));
assert.deepEqual(ensureSnapshotIds(JSON.parse(beforeMigration)),migrated);
assert.deepEqual(ensureSnapshotIds(structuredClone(migrated)),migrated);
assert.equal(new Set(migrated.map(item=>item.snapshotId)).size,4);
assert.equal(migrated[1].snapshotId,'kept');
assert.equal(migrated[3].snapshotId,'legacy-snapshot-1');

const transactionSource={...structuredClone(backupWithProfile),savedProjects:legacySnapshots};
const target={...legacyProject,snapshotId:'target-snapshot',printJobs:[
 {id:'built',modelId:'model',revision:1,status:'prepared',preparedRevision:1,requestId:'previous-worker'},
 {id:'waiting',modelId:'model',revision:1,status:'queued',preparedRevision:null,requestId:null}
]};
const transactionBefore=JSON.stringify(transactionSource);
const transaction=projectWorkspaceCandidate(transactionSource,target);
assert.equal(JSON.stringify(transactionSource),transactionBefore);
assert.equal(target.printJobs[0].status,'prepared');
assert.equal(transaction.project.id,legacyProject.id);
assert.equal(transaction.project.snapshotId,undefined);
assert.deepEqual(transaction.project.models,target.models);
assert.deepEqual(transaction.project.tabs,target.tabs);
assert.deepEqual(transaction.project.printJobs.map(job=>[job.id,job.modelId,job.revision,job.status]),
 [['built','model',1,'stale'],['waiting','model',1,'queued']]);
assert.equal(transaction.savedProjects.at(-1).id,project.id);
assert.deepEqual(transaction.organisation,transactionSource.organisation);
assert.deepEqual(transaction.pixelProfiles,[measured]);

const remoteSnapshot={...structuredClone(legacyProject),snapshotId:project.id};
const recoveredSnapshot=await reconcileArchive(state,{...state,savedProjects:[remoteSnapshot]},{selection:'project:1'});
assert.deepEqual(recoveredSnapshot.candidate.savedProjects.at(-1),remoteSnapshot,
 'A nonconflicting snapshot keeps its ID, even when it equals the local active project ID');
const collision={...remoteSnapshot,title:'Divergent saved snapshot'};
const recoveredCollision=await reconcileArchive(recoveredSnapshot.candidate,{...state,savedProjects:[collision]});
assert.deepEqual(recoveredCollision.candidate.savedProjects.find(item=>item.snapshotId===remoteSnapshot.snapshotId),remoteSnapshot);
assert(recoveredCollision.candidate.savedProjects.some(item=>item.title==='Divergent saved snapshot (recovered copy)'));
const roundTrip=await packStudioVault(transaction);
assert.deepEqual(await unpackStudioVault(roundTrip.manifest,hash=>roundTrip.assets.get(hash)),transaction);
console.log('WT-023A project switch candidate, stable legacy IDs, distinct namespaces and vault round-trip passed.');
