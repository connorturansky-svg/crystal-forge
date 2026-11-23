import assert from 'node:assert/strict';
import {
 createProject,createModel,addModel,queueModel,beginPreparation,finishPreparation,canExport,
 saveLibraryRevision,insertLibraryModel,exportProject,importProject,editModel
} from '../studio-documents.js';
import {listProjectFolders} from './helpers/wt023-project-index.mjs';
import {packStudioVault,unpackStudioVault} from '../studio-vault.js';

const now='2026-11-23T00:00:00.000Z';
const families=['crystals','gears','tactile-tiles','waves','control-caps','characters','light-pods'];
const project=createProject({id:'wt023-cross-family-A',title:'Memory-Mart',now});
for(const family of families){
 const model=createModel({id:'model-'+family,name:family+' original',typeId:family,parameters:{width:90},now});
 addModel(project,model);
 const job=queueModel(project,model.id,{jobId:'job-'+family});
 const ticket=beginPreparation(project,job.id,'ticket-'+family);
 assert.equal(finishPreparation(project,ticket),true,family+' initial preparation');
 assert.equal(canExport(project,job.id),true,family+' prepared job');
}
const profile={
 id:'custom-reliable-seed',name:'Measured seed 5mm',kind:'seed',bodyDiameter:5,bodyHeight:9,
 flangeDiameter:5,flangeHeight:0,capHeight:1,wireWidth:2,wireDepth:1.5,
 measuredFit:{bodyDiameter:5,printedBoreDiameter:5.35}
};
const m=project.models.find(model=>model.id==='model-crystals');
m.build.activePixelProfileId=profile.id;
m.build.pixelHoles=[{id:'seed-location',profileId:profile.id}];
assert.deepEqual(importProject(exportProject(project)),project,'All seven builders retain project metadata in editable JSON');

const library=[];
saveLibraryRevision(library,project.models.find(model=>model.id==='model-gears'));
const linked=insertLibraryModel(project,library,'model-gears',{linked:true,id:'source-linked-gears',now});
assert.equal(linked.link.revision,1);
assert.equal(linked.link.sourceId,'model-gears');
assert.throws(()=>editModel(project,linked.id,{name:'Unsafe linked edit'}),/linked|pinned|read-only|independent/i);

const earlier=structuredClone(project);
earlier.snapshotId='snapshot-a-old';
earlier.title='Earlier Museum Project';
const current=structuredClone(project);
current.snapshotId='snapshot-a-now';
const sameTitleOtherProject=createProject({id:'wt023-cross-family-B',title:'Memory-Mart',now});
addModel(sameTitleOtherProject,createModel({id:'model-crystals',name:'Different project same model ID',typeId:'crystals',now}));
sameTitleOtherProject.snapshotId='snapshot-b-only';
const state={
 schemaVersion:1,project,library,savedProjects:[earlier,sameTitleOtherProject,current],
 legacyTemplates:[],pixelProfiles:[profile]
};
const original=JSON.stringify(state);
const folders=listProjectFolders(state);
assert.deepEqual(folders.map(folder=>folder.id),['wt023-cross-family-A','wt023-cross-family-B']);
assert.deepEqual(folders[0].snapshots.map(item=>item.snapshotId),['snapshot-a-old','snapshot-a-now']);
assert.equal(folders[0].active.models.length,8);
assert.equal(folders[0].title,'Memory-Mart');
assert.equal(folders[1].active,null);
assert.equal(folders[1].snapshots[0].models[0].id,'model-crystals');
assert.equal(JSON.stringify(state),original,'Read-only Library must not mutate any active or saved project');

const packed=await packStudioVault(state);
const restored=await unpackStudioVault(packed.manifest,hash=>packed.assets.get(hash));
assert.equal(restored.project.id,project.id);
assert.deepEqual(restored.project.models.map(x=>[x.id,x.generator.typeId,x.revision]),
 project.models.map(x=>[x.id,x.generator.typeId,x.revision]),
 'All seven builder identities and their revisions are retained through GitHub vault');
assert.deepEqual(restored.project.printJobs,project.printJobs,'Prepared print jobs and source revisions survive');
assert.deepEqual(restored.pixelProfiles,[profile],'Measured fit data survives');
assert.deepEqual(restored.library,library,'Pinned model Library revisions survive');
assert.deepEqual(restored.savedProjects,state.savedProjects,'All saved versions survive with IDs and original titles');
assert.deepEqual(listProjectFolders(restored),folders);
assert.equal(JSON.stringify(state),original,'Packing and restoring must not edit the source archive');
for(const family of families){
 assert.equal(canExport(project,'job-'+family),true,family+' untouched prepared job stays valid');
}
console.log('WT-023 cross-family regression: seven builder IDs, 8 model tabs, prepared job revisions, same-name projects, linked source, measured profile and private-vault round-trip passed.');
