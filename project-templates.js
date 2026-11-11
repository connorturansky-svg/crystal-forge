/* Persistent local design templates, intentionally distinct from editable JSON exports.
 * Browser-only storage; no account sync, and never silently overwrite a template.
 */
const KEY='crystal-forge-project-templates-v1',MAX=25;
export function validateProjectTemplate(template){
 if(!template||typeof template!=='object'||!template.settings||typeof template.settings!=='object'||!Array.isArray(template.crystals))
  throw Error('Template must include editable settings and crystals.');
 if(template.crystals.length>300||template.crystals.some(c=>!c||typeof c.id!=='string'))
  throw Error('Template has too many crystals or invalid crystal IDs.');
 const name=String(template.name||'Untitled template').trim().slice(0,80);
 if(!name)throw Error('Please name the template.');
 return {version:1,id:String(template.id||'').slice(0,90),name,settings:template.settings,crystals:template.crystals};
}
export function readTemplates(storage=localStorage){
 try{
  const data=JSON.parse(storage.getItem(KEY)||'[]');
  return Array.isArray(data)?data.slice(0,MAX).map(t=>{
   try{return validateProjectTemplate(t)}catch{return null}
  }).filter(Boolean):[];
 }catch{return []}
}
export function saveTemplate(storage,name,settings,crystals){
 const template=validateProjectTemplate({name,settings,crystals});
 const existing=readTemplates(storage);
 const base=String(Date.now())+'-'+Math.random().toString(36).slice(2,8);
 template.id='template-'+base;
 const cloned=JSON.parse(JSON.stringify(template));
 const updated=[cloned,...existing].slice(0,MAX);
 storage.setItem(KEY,JSON.stringify(updated));
 return cloned;
}
export function deleteTemplate(storage,id){
 const templates=readTemplates(storage),updated=templates.filter(t=>t.id!==id);
 storage.setItem(KEY,JSON.stringify(updated));
 return updated.length!==templates.length;
}
export function findTemplate(storage,id){return readTemplates(storage).find(t=>t.id===id)||null}
