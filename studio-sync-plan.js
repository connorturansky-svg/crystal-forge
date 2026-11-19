import {canonical,validateProject,validateModel,WORKSPACE_KEY} from './studio-documents.js';
import {assetHash} from './studio-vault.js';
import {readOrganisation,mergeOrganisation} from './studio-organisation.js';

const copy=structuredClone;
const keyFor=project=>project.snapshotId||project.id;
export const RECOVERY_PREFIX='sensory-model-studio-recovery-v2-';

export function validateArchive(input){
 if(input?.schemaVersion!==1||!input.project||!Array.isArray(input.library)||!Array.isArray(input.savedProjects))
  throw Error('This archive is not a supported Studio backup.');
 validateProject(input.project);
 for(const project of input.savedProjects)validateProject(project);
 const libraryIds=new Set();
 for(const record of input.library){
  if(typeof record?.id!=='string'||!record.id||libraryIds.has(record.id)||!Array.isArray(record.versions)||!record.versions.length)
   throw Error('Invalid or duplicate Library source.');
  libraryIds.add(record.id);
  let previous=0;
  for(const version of record.versions){
   if(!Number.isSafeInteger(version.revision)||version.revision<=previous)throw Error('Invalid Library revision history.');
   validateModel(version.model);previous=version.revision;
  }
 }
 readOrganisation(input.organisation);
 if(input.legacyTemplates!==undefined&&!Array.isArray(input.legacyTemplates))throw Error('Invalid legacy templates.');
 return input;
}

export function archiveSummary(local,remote){
 validateArchive(remote);
 const compare=(ours,theirs,id)=>{
  const localRecords=new Map(ours.map(item=>[id(item),item]));
  const remoteIds=new Set(theirs.map(id));
  const text=item=>item.name||item.title||item.versions?.at(-1).model.name||id(item);
  return {
   localOnly:ours.filter(item=>!remoteIds.has(id(item))).map(text),
   remoteOnly:theirs.filter(item=>!localRecords.has(id(item))).map(text),
   conflicts:theirs.filter(item=>localRecords.has(id(item))&&canonical(localRecords.get(id(item)))!==canonical(item)).map(text),
   identical:theirs.filter(item=>localRecords.has(id(item))&&canonical(localRecords.get(id(item)))===canonical(item)).length
  };
 };
 return {
  models:compare(local.library,remote.library,item=>item.id),
  projects:compare([local.project,...local.savedProjects],[remote.project,...remote.savedProjects],keyFor),
  revisions:remote.library.reduce((sum,record)=>sum+record.versions.length,0),
  collections:readOrganisation(remote.organisation).collections.length,
  templates:readOrganisation(remote.organisation).templates.length
 };
}

export function archiveChoices(remote){
 return [
  ...[remote.project,...remote.savedProjects].map((project,index)=>({key:'project:'+index,label:'Project · '+project.title})),
  ...remote.library.flatMap((record,index)=>record.versions.map(version=>({
   key:'model:'+index+':'+version.revision,label:'Model · '+version.model.name+' · revision '+version.revision
  })))
 ];
}
async function stableId(kind,value){return kind+'-'+(await assetHash(value)).slice(0,40);}

export async function reconcileArchive(local,source,{mode='merge',selection='all'}={}){
 validateArchive(local);validateArchive(source);
 if(!['merge','copies'].includes(mode))throw Error('Choose a recovery strategy.');
 const candidate=copy(local),remote=copy(source),refs=new Map();
 let importedModels=0,importedProjects=0;
 const [kind,indexValue,revisionValue]=selection.split(':'),index=Number(indexValue);
 const projectList=[remote.project,...remote.savedProjects];
 const projects=selection==='all'?projectList:kind==='project'&&projectList[index]?[projectList[index]]:[];
 const libraries=selection==='all'?remote.library:kind==='model'&&remote.library[index]
  ?[{...remote.library[index],versions:remote.library[index].versions.filter(v=>v.revision===Number(revisionValue))}]
  :remote.library.filter(record=>projects.some(project=>project.models.some(model=>model.link?.sourceId===record.id)));
 if(selection!=='all'&&!projects.length&&!libraries.some(record=>record.versions.length))throw Error('The selected recovery source is unavailable.');
 for(const record of libraries){
  if(!record.versions.length)throw Error('The selected model revision is unavailable.');
  const originalId=record.id;
  const ours=candidate.library.find(item=>item.id===originalId);
  if(mode==='copies'||(ours&&canonical(ours)!==canonical(record)))record.id=await stableId('library-copy',record);
  for(const version of record.versions)if(record.id!==originalId&&version.model.id===originalId)version.model.id=record.id;
  refs.set('model:'+originalId,'model:'+record.id);
  const existing=candidate.library.find(item=>item.id===record.id);
  if(existing&&canonical(existing)!==canonical(record))throw Error('A recovery copy was edited locally. Export your workspace before retrying with a different selection.');
  if(!existing){candidate.library.push(record);importedModels++;}
 }
 for(const project of projects){
  const originalKey=keyFor(project);
  const fingerprint=await stableId('project-copy',project);
  for(const model of project.models){
   const mapped=model.link&&refs.get('model:'+model.link.sourceId);
   if(mapped)model.link.sourceId=mapped.slice(6);
  }
  const existingOriginal=[candidate.project,...candidate.savedProjects].find(item=>keyFor(item)===originalKey);
  if(mode==='merge'&&existingOriginal&&canonical(existingOriginal)===canonical(project)){
   if(existingOriginal.snapshotId)refs.set('project:'+originalKey,'project:'+existingOriginal.snapshotId);
   continue;
  }
  project.snapshotId=fingerprint;
  refs.set('project:'+originalKey,'project:'+fingerprint);
  if(existingOriginal){project.id=fingerprint;project.title+=' (recovered copy)';}
  const existing=candidate.savedProjects.find(item=>item.snapshotId===fingerprint);
  if(!existing){candidate.savedProjects.push(project);importedProjects++;}
 }
 const metadata=readOrganisation(remote.organisation);
 if(selection!=='all'){
  metadata.items=Object.fromEntries(Object.entries(metadata.items).filter(([key])=>refs.has(key)));
  metadata.templates=metadata.templates.filter(t=>refs.has(t.kind+':'+t.sourceId)&&
   (kind!=='model'||t.kind!=='model'||t.revision===Number(revisionValue)));
  const membership=new Set(Object.values(metadata.items).flatMap(item=>item.collectionIds));
  metadata.collections=metadata.collections.filter(c=>membership.has(c.id));
 }
 // Map divergent same-ID collections to a stable copy before merging memberships.
 const localCollections=readOrganisation(candidate.organisation).collections;
 for(const collection of metadata.collections){
  if(!localCollections.some(c=>c.id===collection.id&&c.name!==collection.name))continue;
  const oldId=collection.id;
  collection.id=await stableId('collection-copy',collection);
  for(const item of Object.values(metadata.items))item.collectionIds=item.collectionIds.map(id=>id===oldId?collection.id:id);
 }
 candidate.organisation=mergeOrganisation(candidate.organisation,metadata,refs);
 if(selection==='all'){
  const legacy=new Map((candidate.legacyTemplates||[]).map(t=>[canonical(t),t]));
  for(const t of remote.legacyTemplates||[])legacy.set(canonical(t),t);
  candidate.legacyTemplates=[...legacy.values()];
 }
 validateArchive(candidate);
 return {candidate,importedModels,importedProjects};
}

export function assertWorkspaceVersion(storage,expected){
 if(storage.getItem(WORKSPACE_KEY)!==expected)
  throw Error('Another tab saved this workspace. Download a backup of your current edits, then reload to review the newer saved workspace.');
}
export function commitRecovery(storage,local,candidate,recoveryKey,expected=storage.getItem(WORKSPACE_KEY)){
 assertWorkspaceVersion(storage,expected);
 validateArchive(candidate);
 if(!recoveryKey.startsWith(RECOVERY_PREFIX)||storage.getItem(recoveryKey)!==null)throw Error('Recovery snapshot already exists.');
 const before=JSON.stringify(local),after=JSON.stringify(candidate);
 try{
  storage.setItem(recoveryKey,before);
  if(storage.getItem(recoveryKey)!==before)throw Error('Recovery snapshot could not be verified.');
  assertWorkspaceVersion(storage,expected);
  storage.setItem(WORKSPACE_KEY,after);
 }catch(error){
  storage.removeItem(recoveryKey);
  assertWorkspaceVersion(storage,expected);
  throw Error('Recovery could not be saved locally. Download your backup and free browser storage before retrying.',{cause:error});
 }
}
