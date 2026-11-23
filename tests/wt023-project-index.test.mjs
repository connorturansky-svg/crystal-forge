import assert from 'node:assert/strict';
import {createProject,createModel,addModel,queueModel,beginPreparation,finishPreparation,canExport} from '../studio-documents.js';
import {listProjectFolders,projectModelTabLabel} from '../studio-project-index.js';
import {packStudioVault,unpackStudioVault} from '../studio-vault.js';

const when='2026-11-22T00:00:00.000Z';
const model=(id,name,profileId='custom-measured-5mm')=>createModel({
 id,name,typeId:'tactile-tiles',now:when,
 parameters:{width:90},
 build:{activePixelProfileId:profileId,pixelHoles:[{id:'hole-'+id,profileId}]}
});
const active=createProject({id:'project-a',title:'Memory-Mart',now:when});
addModel(active,model('model-1','Entrance scanner'));
const job=queueModel(active,'model-1',{jobId:'job-1'});
const ticket=beginPreparation(active,job.id,'request-1');
assert.equal(finishPreparation(active,ticket),true);
assert.equal(canExport(active,job.id),true);

const oldVersion=structuredClone(active);
oldVersion.snapshotId='snap-project-a-1';
oldVersion.title='Before the rename';
oldVersion.models[0].name='Earlier scanner';
const newerVersion=structuredClone(active);
newerVersion.snapshotId='snap-project-a-2';

const other=createProject({id:'project-b',title:'Memory-Mart',now:when});
addModel(other,model('model-1','Distinct independent model'));
other.snapshotId='snap-project-b-1';
const state={schemaVersion:1,project:active,library:[],savedProjects:[oldVersion,other,newerVersion],legacyTemplates:[]};
const original=JSON.stringify(state);
const groups=listProjectFolders(state);
assert.equal(groups.length,2,'Same title does not collapse different project identities');
assert.deepEqual(groups.map(group=>group.id),['project-a','project-b']);
assert.equal(groups[0].current,true);
assert.equal(groups[0].title,'Memory-Mart','Active title remains authoritative over prior snapshots');
assert.deepEqual(groups[0].snapshots.map(v=>v.snapshotId),['snap-project-a-1','snap-project-a-2']);
assert.equal(groups[0].active.models[0].id,'model-1');
assert.equal(groups[0].snapshots[0].models[0].name,'Earlier scanner');
assert.equal(groups[1].current,false);
assert.equal(groups[1].title,'Memory-Mart');
assert.equal(groups[1].snapshots[0].models[0].name,'Distinct independent model');
assert.equal(groups[1].snapshots[0].models[0].id,'model-1','Model IDs are scoped to projects, not Library-wide unique');
assert.equal(groups[0].active.models[0].family,'tactile-tiles');
assert.equal(groups[0].active.models[0].revision,1);
assert.equal(JSON.stringify(state),original,'Folder listing must never edit authoritative model/project documents');
assert.equal(canExport(active,job.id),true,'Read-only organisation cannot stale an already prepared print job');
assert.equal(projectModelTabLabel(active,active.models[0]),'Memory-Mart : Entrance scanner');
assert.throws(()=>projectModelTabLabel(active,{name:''}),/need names/);

const renamedSnapshot=structuredClone(newerVersion);
renamedSnapshot.snapshotId=oldVersion.snapshotId;
assert.throws(()=>listProjectFolders({...state,savedProjects:[oldVersion,renamedSnapshot]}),/Duplicate saved-project snapshot ID/);
assert.equal(JSON.stringify(state),original,'A rejected invalid view must not mutate existing state');
const missingSnapshot=structuredClone(oldVersion);
delete missingSnapshot.snapshotId;
assert.throws(()=>listProjectFolders({...state,savedProjects:[missingSnapshot]}),/needs a stable snapshot ID/);
assert.equal(missingSnapshot.snapshotId,undefined,'Missing IDs must not be silently invented by a read-only selector');

const linked=structuredClone(other);
linked.snapshotId='snap-link';
linked.models[0].link={sourceId:'library-source-1',revision:3};
const linkGroup=listProjectFolders({...state,savedProjects:[linked]})[1];
assert.deepEqual(linkGroup.snapshots[0].models[0],{
 id:'model-1',name:'Distinct independent model',family:'tactile-tiles',revision:1,
 linkedSourceId:'library-source-1',linkedRevision:3
});
assert.equal(linked.models[0].build.activePixelProfileId,'custom-measured-5mm');

const profile={id:'custom-measured-5mm',name:'My measured seed',kind:'seed',
 bodyDiameter:5,bodyHeight:9,flangeDiameter:5,flangeHeight:0,capHeight:1,
 wireWidth:2,wireDepth:1.5,measuredFit:{bodyDiameter:5,printedBoreDiameter:5.45}};
const withProfile={...structuredClone(state),pixelProfiles:[profile]};
const packed=await packStudioVault(withProfile);
const unpacked=await unpackStudioVault(packed.manifest,hash=>packed.assets.get(hash));
assert.deepEqual(listProjectFolders(unpacked),listProjectFolders(withProfile));
assert.deepEqual(unpacked.pixelProfiles,[profile],'Project-folder metadata must not discard calibrated pixel settings');
assert.equal(unpacked.project.printJobs[0].preparedRevision,1);
assert.equal(unpacked.savedProjects[0].snapshotId,'snap-project-a-1');
assert.equal(JSON.stringify(withProfile),JSON.stringify({...state,pixelProfiles:[profile]}));
console.log('WT-023A read-only project folder index: stable IDs, snapshots, linked models, prepared jobs and private-vault round-trip passed.');
