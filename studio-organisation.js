import {newId,validateProject} from './studio-documents.js';

const id=value=>typeof value==='string'&&value.length>0&&value.length<=160;
export function organisationName(value){
 const name=typeof value==='string'?value.trim():'';
 if(!name||[...name].length>100)throw Error('Enter a name of 1 to 100 characters.');
 return name;
}
export function readOrganisation(value){
 if(value===undefined)return {version:1,collections:[],items:{},templates:[]};
 if(value?.version!==1||!Array.isArray(value.collections)||!Array.isArray(value.templates)||
  !value.items||Array.isArray(value.items)||typeof value.items!=='object'||
  value.collections.length>1000||value.templates.length>10000||Object.keys(value.items).length>20000)
  throw Error('Invalid Library organisation.');
 const collections=value.collections.map(c=>{
  if(!id(c?.id))throw Error('Invalid collection ID.');
  return {id:c.id,name:organisationName(c.name)};
 });
 const ids=new Set(collections.map(c=>c.id));
 if(ids.size!==collections.length||new Set(collections.map(c=>c.name.toLowerCase())).size!==collections.length)
  throw Error('Duplicate Library collection.');
 const items={};
 for(const [key,item] of Object.entries(value.items)){
  if(!/^(model|project):.{1,160}$/.test(key)||typeof item?.favorite!=='boolean'||
   !Array.isArray(item.collectionIds)||item.collectionIds.length>ids.size||
   new Set(item.collectionIds).size!==item.collectionIds.length||!item.collectionIds.every(cid=>ids.has(cid)))
   throw Error('Invalid Library membership.');
  items[key]={favorite:item.favorite,collectionIds:[...item.collectionIds]};
 }
 const templates=value.templates.map(t=>{
  if(!id(t?.id)||!id(t.sourceId)||!['model','project'].includes(t.kind)||
   (t.kind==='model'&&!(Number.isSafeInteger(t.revision)&&t.revision>0)))throw Error('Invalid Library template.');
  return {id:t.id,name:organisationName(t.name),kind:t.kind,sourceId:t.sourceId,...(t.kind==='model'?{revision:t.revision}:{})};
 });
 if(new Set(templates.map(t=>t.id)).size!==templates.length)throw Error('Duplicate Library template.');
 return {version:1,collections,items,templates};
}
export function ensureSnapshotIds(projects){
 const reserved=new Set(projects.map(project=>project.snapshotId).filter(id));
 const seen=new Set();
 for(const [index,project] of projects.entries()){
  if(!id(project.snapshotId)||seen.has(project.snapshotId)){
   const base='legacy-snapshot-'+(index+1);
   let next=base,suffix=1;
   while(reserved.has(next))next=base+'-'+suffix++;
   project.snapshotId=next;
   reserved.add(next);
  }
  seen.add(project.snapshotId);
 }
 return projects;
}
export function templateProject(source){
 const project=structuredClone(source);
 delete project.snapshotId;
 project.id=newId();
 for(const job of project.printJobs){
  job.status='stale';job.requestId=null;job.preparedRevision=null;
 }
 return validateProject(project);
}
export function mergeOrganisation(localValue,remoteValue,sourceIds=new Map()){
 const local=readOrganisation(localValue),remote=readOrganisation(remoteValue),collections=new Map();
 for(const c of remote.collections){
  const existing=local.collections.find(x=>x.name.toLowerCase()===c.name.toLowerCase());
  if(existing){collections.set(c.id,existing.id);continue;}
  const cid=local.collections.some(x=>x.id===c.id)?newId():c.id;
  collections.set(c.id,cid);local.collections.push({...c,id:cid});
 }
 for(const [key,item] of Object.entries(remote.items)){
  const target=sourceIds.get(key)||key,old=local.items[target];
  local.items[target]={favorite:!!(old?.favorite||item.favorite),
   collectionIds:[...new Set([...(old?.collectionIds||[]),...item.collectionIds.map(cid=>collections.get(cid))])]};
 }
 for(const t of remote.templates){
  const mapped=sourceIds.get(t.kind+':'+t.sourceId);
  const next={...t,sourceId:mapped?mapped.slice(t.kind.length+1):t.sourceId};
  if(local.templates.some(x=>x.kind===next.kind&&x.sourceId===next.sourceId&&x.revision===next.revision&&x.name===next.name))continue;
  if(local.templates.some(x=>x.id===next.id))next.id=newId();
  local.templates.push(next);
 }
 return readOrganisation(local);
}
