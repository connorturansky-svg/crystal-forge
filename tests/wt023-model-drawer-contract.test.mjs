import assert from 'node:assert/strict';
import {createModel,findModel,openTab,closeTab,reorderTabs,editModel,modelFingerprint,canExport,
 exportProject,importProject,saveLibraryRevision,insertLibraryModel,validateProject} from '../studio-documents.js';
import {drawerProject,documentEvidence,NOW,FAMILIES} from './helpers/wt023-model-drawer-fixture.mjs';

for(const count of [0,1,9,105]){
 const p=drawerProject(count),before=documentEvidence(p),ids=[...p.tabs];
 assert.equal(new Set(ids).size,count);
 if(count){
  assert(canExport(p,'drawer-job'));
  openTab(p,ids[0]);
  reorderTabs(p,[...ids].reverse());
  assert.equal(p.activeTab,ids[0]);
  // Close the active model and every remaining tab, without removing documents/jobs.
  closeTab(p,ids[0]);
  if(count>1)assert(p.tabs.includes(p.activeTab));
  for(const id of ids)closeTab(p,id);
  assert.deepEqual(p.tabs,[]);assert.equal(p.activeTab,null);
  assert.equal(documentEvidence(p),before);
  assert(canExport(p,'drawer-job'));
  for(const id of ids)openTab(p,id);
  assert.deepEqual(p.tabs,ids);
  const order=JSON.stringify(p);
  assert.throws(()=>reorderTabs(p,[...ids,'missing']),/exactly/);
  assert.equal(JSON.stringify(p),order);
 }
 assert.equal(documentEvidence(p),before);
 assert.deepEqual(importProject(exportProject(p)),p);
}
const a=drawerProject(9),b=drawerProject(9,'drawer-project-B');
assert.equal(a.title,b.title);
assert.equal(a.models[0].id,b.models[0].id);
assert.equal(a.models[0].name,a.models[1].name);
assert.equal(new Set(a.models.map(m=>m.generator.typeId)).size,FAMILIES.length);
assert.throws(()=>createModel({id:'blank',name:'  ',typeId:'crystals',now:NOW}),/name/);
const model=findModel(a,'drawer-0'),fingerprint=modelFingerprint(model),oldRevision=model.revision;
editModel(a,model.id,{name:'Long Unicode model — lumière ✨'},{now:NOW});
assert.equal(model.id,'drawer-0');assert.equal(model.revision,oldRevision+1);
assert.equal(modelFingerprint(model),fingerprint);
assert.equal(canExport(a,'drawer-job'),false,'Current rename policy pins jobs to old revision');
const sourceBefore=modelFingerprint(findModel(b,'drawer-0'));
editModel(b,'drawer-0',{parameters:{width:999}},{now:NOW});
assert.notEqual(modelFingerprint(findModel(b,'drawer-0')),sourceBefore);
assert.equal(modelFingerprint(model),fingerprint,'same model ID in another project must not alias');
const library=[];
saveLibraryRevision(library,findModel(a,'drawer-1'));
const linked=insertLibraryModel(a,library,'drawer-1',{linked:true,id:'linked',now:NOW});
const pinned=JSON.stringify(library);
assert.throws(()=>editModel(a,linked.id,{name:'Unsafe rename'}),/linked|independent/i);
closeTab(a,linked.id);
assert.equal(findModel(a,linked.id).link.revision,1);
assert.equal(JSON.stringify(library),pinned);
assert.doesNotThrow(()=>validateProject(a));
console.log('WT-023C document contracts: 0/1/9/105 tabs, duplicate names, cross-project isolation, safe close/reorder, pinned links and rename/job policy passed.');
