/* Named editable project library. Saved copies persist across opened models
 * and become part of the private GitHub vault and downloadable full backup.
 * The auto-saved active model is separate from this library.
 */
export const PROJECT_LIBRARY_KEY='crystal-forge-project-library-v1';
export const PROJECT_LIMIT=40;
const parse=raw=>{try{return JSON.parse(raw??'null')}catch{return null}};
const clone=x=>JSON.parse(JSON.stringify(x));
export function validateSavedProject(project){
 if(!project||typeof project!=='object'||typeof project.id!=='string'||!project.id||
   typeof project.name!=='string'||!project.name.trim()||
   !project.settings||typeof project.settings!=='object'||
   !Array.isArray(project.crystals)||project.crystals.length>300)
  throw Error('Saved project must have an ID, name, editable settings and at most 300 crystals.');
 if(project.crystals.some(c=>!c||typeof c.id!=='string'))
  throw Error('Saved project contains an invalid crystal.');
 const id=project.id.slice(0,100),name=project.name.trim().slice(0,90);
 return {id,name,updatedAt:String(project.updatedAt||'').slice(0,40),
  settings:clone(project.settings),crystals:clone(project.crystals)};
}
export function listSavedProjects(storage){
 const entries=parse(storage.getItem(PROJECT_LIBRARY_KEY));
 if(!Array.isArray(entries))return [];
 return entries.slice(0,PROJECT_LIMIT).flatMap(item=>{
  try{return [validateSavedProject(item)]}catch{return []}
 });
}
export function saveNamedProject(storage,name,settings,crystals){
 name=String(name||'').trim();
 if(!name)throw Error('Please name the saved project.');
 const saved=validateSavedProject({id:'project-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9),
  name,settings,crystals,updatedAt:new Date().toISOString()});
 storage.setItem(PROJECT_LIBRARY_KEY,JSON.stringify([saved,...listSavedProjects(storage)].slice(0,PROJECT_LIMIT)));
 return saved;
}
export function loadNamedProject(storage,id){
 return listSavedProjects(storage).find(p=>p.id===id)||null;
}
export function deleteNamedProject(storage,id){
 const items=listSavedProjects(storage),remaining=items.filter(p=>p.id!==id);
 storage.setItem(PROJECT_LIBRARY_KEY,JSON.stringify(remaining));
 return remaining.length!==items.length;
}
