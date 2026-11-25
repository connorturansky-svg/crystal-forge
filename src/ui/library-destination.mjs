// Build complete Library destination candidates without mutating live documents.
import {addModel,createProject,insertLibraryModel,validateModel,newId} from '../../studio-documents.js';
import {projectWorkspaceCandidate,validateArchive} from '../../studio-sync-plan.js';
import {templateProject} from '../../studio-organisation.js';

export const NEW_PROJECT_PRINTER=Object.freeze({printer:'Ultimaker 3 Extended',curaNozzle:.4,curaMaterial:'PLA',curaQuality:60,curaIntent:'balanced'});
const nameOf=(name,label)=>{
 const value=typeof name==='string'?name.trim():'';
 if(!value||Array.from(value).length>100)throw Error('Enter a '+label+' of 1 to 100 characters.');
 return value;
};
function exactSnapshot(workspace,projectId,snapshotId){
 const matches=workspace.savedProjects.filter(p=>p.snapshotId===snapshotId&&p.id===projectId);
 if(!snapshotId||matches.length!==1)throw Error('The chosen saved project version is unavailable. Reopen the Library and choose again.');
 return matches[0];
}
export function destinationChoices(workspace){
 return [{kind:'current',projectId:workspace.project.id,label:'Current project — '+workspace.project.title},
  ...workspace.savedProjects.map((p,i)=>({kind:'snapshot',projectId:p.id,snapshotId:p.snapshotId,label:p.title+' — saved version '+(i+1)+' ('+p.models.length+' models)'})),
  {kind:'new',label:'New project'}];
}
export function libraryDestinationCandidate(workspace,{source,destination,modelName,projectName,linked=false},{createBuiltIn}={}){
 validateArchive(workspace);
 if(!source||!destination)throw Error('Choose a source and destination.');
 if(!['current','snapshot','new'].includes(destination.kind))throw Error('Choose a supported destination.');
 if(destination.kind==='current'&&destination.projectId!==workspace.project.id)throw Error('The active project changed. Choose the destination again.');
 if(source.kind==='project-template'){
  if(destination.kind!=='new')throw Error('A project template must create a new independent project.');
  const target=templateProject(exactSnapshot(workspace,source.projectId,source.snapshotId));
  target.title=nameOf(projectName,'project name');
  target.updatedAt=new Date().toISOString();
  return {candidate:projectWorkspaceCandidate(workspace,target),switchProject:true,modelId:target.activeTab};
 }
 const name=nameOf(modelName,'model name');
 const target=destination.kind==='current'?structuredClone(workspace.project):destination.kind==='snapshot'
  ?structuredClone(exactSnapshot(workspace,destination.projectId,destination.snapshotId))
  :createProject({title:nameOf(projectName,'project name')});
 if(destination.kind==='new')target.printer={...NEW_PROJECT_PRINTER};
 let model;
 if(source.kind==='built-in'){
  if(linked||typeof createBuiltIn!=='function')throw Error('Choose an independent built-in model.');
  const generated=validateModel(createBuiltIn(source.typeId,name));
  if(generated.generator.typeId!==source.typeId||generated.link!==null)throw Error('The starting point is no longer available.');
  model=addModel(target,generated);
 }else if(source.kind==='library'){
  if(!Number.isSafeInteger(source.revision)||source.revision<1)throw Error('Choose an exact Library revision.');
  model=insertLibraryModel(target,workspace.library,source.sourceId,{revision:source.revision,linked,id:newId()});
 }else throw Error('The selected Library source is unsupported.');
 model.name=name;
 const switchProject=destination.kind!=='current';
 const candidate=switchProject?projectWorkspaceCandidate(workspace,target):validateArchive({...workspace,project:target});
 return {candidate,switchProject,modelId:model.id};
}
// The write callback must enforce the existing cross-tab storage guard.
// Publish only after that single write succeeds; caller owns UI/caches.
export function commitLibraryDestination(workspace,request,{createBuiltIn,writeWorkspace,publish}){
 const result=libraryDestinationCandidate(workspace,request,{createBuiltIn});
 writeWorkspace(result.candidate);
 publish(result);
 return result;
}
