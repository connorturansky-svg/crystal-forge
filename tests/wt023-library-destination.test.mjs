import assert from 'node:assert/strict';
import {createProject,createModel,addModel,saveLibraryRevision,queueModel,beginPreparation,finishPreparation,canExport} from '../studio-documents.js';
import {destinationChoices,libraryDestinationCandidate,commitLibraryDestination,NEW_PROJECT_PRINTER} from '../src/ui/library-destination.mjs';
import {packStudioVault,unpackStudioVault} from '../studio-vault.js';
import {readOrganisation} from '../studio-organisation.js';
const model=(id,name,type='waves')=>createModel({id,name,typeId:type,parameters:{width:42}});
const project=createProject({id:'active',title:'Same title'});
addModel(project,model('original','Original'));
project.printer={printer:'custom',curaNozzle:.8};
project.hardwareProfiles=[{id:'calibrated'}];
const job=queueModel(project,'original',{jobId:'job'});
finishPreparation(project,beginPreparation(project,job.id,'ticket'));
assert(canExport(project,job.id));
const saved=structuredClone(project);saved.id='other';saved.snapshotId='saved-other';
const earlier=structuredClone(saved);earlier.snapshotId='saved-earlier';earlier.models[0].name='Earlier';
const library=[];const source=model('source','Source');saveLibraryRevision(library,source);
const revised=structuredClone(source);revised.parameters.width=72;saveLibraryRevision(library,revised,{expectedRevision:1});
const workspace={schemaVersion:1,project,library,savedProjects:[saved,earlier]};
const original=JSON.stringify(workspace);
const request={source:{kind:'library',sourceId:'source',revision:1},destination:{kind:'current',projectId:'active'},modelName:'Chosen copy',linked:true};
const a=libraryDestinationCandidate(workspace,request);
assert.equal(a.switchProject,false);
assert.equal(a.candidate.project.models.length,2);
assert.deepEqual(a.candidate.project.models.at(-1).link,{sourceId:'source',revision:1});
assert.equal(a.candidate.project.models.at(-1).name,'Chosen copy');
assert.equal(a.candidate.project.models.at(-1).parameters.width,42);
assert(canExport(a.candidate.project,job.id),'Current destination retains prepared jobs');
assert.equal(a.candidate.savedProjects.length,2);
assert.equal(new Set(destinationChoices(workspace).filter(c=>c.kind==='snapshot').map(c=>c.snapshotId)).size,2);
const b=libraryDestinationCandidate(workspace,{...request,destination:{kind:'snapshot',projectId:'other',snapshotId:'saved-earlier'},linked:false});
assert.equal(b.candidate.project.id,'other');assert.equal(b.candidate.project.models[0].name,'Earlier');
assert.equal(b.candidate.project.models.at(-1).link,null);
assert.equal(b.candidate.project.printJobs[0].status,'stale');
assert.deepEqual(b.candidate.savedProjects.slice(0,2),workspace.savedProjects);
assert.equal(b.candidate.savedProjects.at(-1).id,'active');
assert.equal(b.candidate.savedProjects.at(-1).printJobs[0].status,'prepared');
const c=libraryDestinationCandidate(workspace,{...request,destination:{kind:'new'},projectName:'Fresh'});
assert.equal(c.candidate.project.title,'Fresh');assert.deepEqual(c.candidate.project.printer,NEW_PROJECT_PRINTER);
assert.deepEqual(c.candidate.project.hardwareProfiles,[]);assert.equal(c.candidate.project.models.length,1);
const t=libraryDestinationCandidate(workspace,{source:{kind:'project-template',projectId:'other',snapshotId:'saved-other'},destination:{kind:'new'},projectName:'Template copy'});
assert.notEqual(t.candidate.project.id,'other');assert.equal(t.candidate.project.title,'Template copy');
assert.deepEqual(t.candidate.project.printer,saved.printer);assert.equal(t.candidate.project.printJobs[0].status,'stale');
for(const typeId of ['crystals','tactile-tiles','gears','waves','control-caps','characters','light-pods']){
 const v=libraryDestinationCandidate(workspace,{source:{kind:'built-in',typeId},destination:{kind:'current',projectId:'active'},modelName:'Built '+typeId},
  {createBuiltIn:(type,name)=>createModel({name,typeId:type})});
 assert.equal(v.candidate.project.models.at(-1).generator.typeId,typeId);
}
for(const invalid of [
 {...request,source:{...request.source,revision:99}},
 {...request,modelName:'   '},
 {...request,destination:{kind:'snapshot',projectId:'wrong',snapshotId:'saved-other'}},
 {...request,destination:{kind:'current',projectId:'wrong'}},
 {...request,destination:{kind:'new'},projectName:' '}
])assert.throws(()=>libraryDestinationCandidate(workspace,invalid));
let writes=0,publishes=0;
for(const error of ['Quota exceeded','Another tab saved this workspace']){
 assert.throws(()=>commitLibraryDestination(workspace,request,{writeWorkspace:()=>{writes++;throw Error(error)},publish:()=>publishes++}),new RegExp(error));
}
assert.equal(writes,2);assert.equal(publishes,0);
commitLibraryDestination(workspace,request,{writeWorkspace:()=>writes++,publish:result=>{assert.equal(writes,3);assert.equal(result.candidate.project.models.length,2);publishes++;}});
assert.equal(publishes,1);assert.equal(JSON.stringify(workspace),original);
const archive=JSON.parse(JSON.stringify(b.candidate));
const missingProfile=structuredClone(workspace);missingProfile.library[0].versions[0].model.build.activePixelProfileId='custom-missing';
assert.throws(()=>libraryDestinationCandidate(missingProfile,request),/Missing measured pixel profile/);
assert.equal(JSON.stringify(workspace),original);
const packed=await packStudioVault(archive);
assert.deepEqual(await unpackStudioVault(packed.manifest,hash=>packed.assets.get(hash)),{...archive,legacyTemplates:[],organisation:readOrganisation(archive.organisation)});
console.log('WT-023B2b destination contracts: exact revisions and snapshots, seven families, current jobs, new defaults, historical preservation, single write and rollback passed.');
