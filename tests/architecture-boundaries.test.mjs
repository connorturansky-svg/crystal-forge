// Guard the document / manufacturing boundary against accidental UI dependencies.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createProject,createModel,addModel,queueModel,beginPreparation,finishPreparation,canExport,editModel,modelFingerprint,canonical} from '../studio-documents.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const rel=absolute=>path.relative(root,absolute).split(path.sep).join('/');
const uiEntry=new Set(['sensory-studio.js','studio-v3.js','tooltips.js','contextual-help-copy.js']);
function imports(file){
 const content=readFileSync(path.join(root,file),'utf8');
 // The same conservative local-import convention as the existing static suite.
 const specs=[...content.matchAll(/\bfrom\s*['"](\.[^'"]+)['"]/g),...content.matchAll(/\bimport\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g),...content.matchAll(/^\s*import\s*['"](\.[^'"]+)['"]/gm)];
 return [...new Set(specs.map(([,spec])=>{
  const target=path.resolve(root,path.dirname(file),spec);
  assert(target.startsWith(root.endsWith(path.sep)?root:root+path.sep),'Import leaves repository: '+file);
  assert(existsSync(target),'Missing dependency: '+file+' -> '+spec);
  return rel(target);
 }))];
}
function closure(entry){
 const visited=new Set();
 const stack=[entry];
 while(stack.length){
  const file=stack.pop();if(visited.has(file))continue;visited.add(file);
  for(const dep of imports(file))if(!visited.has(dep))stack.push(dep);
 }
 return visited;
}
for(const entry of ['studio-documents.js','studio-organisation.js','studio-vault.js','studio-sync-plan.js','studio-model-worker.js','fabrication-worker.js','manufacturing-fingerprint.js','src/printing/production-pack.js']){
 const deps=closure(entry);
 const violations=[...deps].filter(p=>uiEntry.has(p)||p.startsWith('src/ui/'));
 assert.deepEqual(violations,[],entry+' must not depend on the editor or UI-only view state');
 console.log('Boundary '+entry+': '+deps.size+' local modules');
}
assert.deepEqual(imports('studio-documents.js'),[],'Authoritative document contracts stay dependency-free');
const families=['crystals','tactile-tiles','gears','waves','control-caps','characters','light-pods'];
const project=createProject({id:'qa-project',title:'Parity witness'});
for(const typeId of families){
 addModel(project,createModel({id:typeId,name:typeId,typeId,parameters:{width:40}}));
 queueModel(project,typeId,{jobId:'job-'+typeId});
}
const tickets=Object.fromEntries(families.map(id=>[id,beginPreparation(project,'job-'+id,'ticket-'+id)]));
for(const id of families)assert(finishPreparation(project,tickets[id]));
for(const id of families)assert(canExport(project,'job-'+id));
const untouched=Object.fromEntries(project.models.map(model=>[model.id,modelFingerprint(model)]));
editModel(project,'waves',{parameters:{width:41}});
assert(!canExport(project,'job-waves'));
assert(!finishPreparation(project,tickets.waves),'Old completion cannot resurrect an invalidated result');
for(const id of families.filter(id=>id!=='waves')){
 assert(canExport(project,'job-'+id),'Unrelated prepared job changed: '+id);
 assert.equal(modelFingerprint(project.models.find(model=>model.id===id)),untouched[id]);
}
const reload=JSON.parse(JSON.stringify(project));
assert.equal(canonical(reload),canonical(project));
assert(!canExport(reload,'job-waves'));
console.log('Architecture and seven-family document isolation gates passed (not renderer or physical geometry evidence).');
