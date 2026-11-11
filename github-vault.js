/* Optional private-repository GitHub storage for Crystal Forge.
 * No token ever enters the project JSON, localStorage, a URL or the public repo.
 * The user creates a PRIVATE repo and supplies a narrowly scoped token in memory.
 * GitHub commit history supplies remote history; SHA guards prevent blind writes.
 */
export const VAULT_PATH='.crystal-forge/vault-v1.json';
const PROJECT='crystal-forge-v3',PROFILES='crystal-forge-pixel-library',TEMPLATES='crystal-forge-project-templates-v1',PROJECTS='crystal-forge-project-library-v1';
const PREFIX='crystal-forge-cloud-local-backup-';
const deep=x=>JSON.parse(JSON.stringify(x));
const parse=(value,fallback)=>{try{return JSON.parse(value||'null')??fallback}catch{return fallback}};
const idMatch=/^[a-zA-Z0-9_.-]{1,100}\/[a-zA-Z0-9_.-]{1,100}$/;
const safeId=String;
export function captureVault(storage,updatedAt=new Date().toISOString()){
 const project=parse(storage.getItem(PROJECT),null);
 const profiles=parse(storage.getItem(PROFILES),[]);
 const templates=parse(storage.getItem(TEMPLATES),[]);
 const projects=parse(storage.getItem(PROJECTS),[]);
 return {schema:1,updatedAt,project,
  pixelProfiles:Array.isArray(profiles)?profiles:[],
  templates:Array.isArray(templates)?templates:[],
  projects:Array.isArray(projects)?projects:[]};
}
export function validateVault(data){
 if(!data||data.schema!==1||!Array.isArray(data.pixelProfiles)||!Array.isArray(data.templates)||
    (data.projects!==undefined&&!Array.isArray(data.projects)))
  throw Error('Cloud document is not a supported Crystal Forge vault.');
 if(data.project!=null&&(!data.project.settings||!Array.isArray(data.project.crystals)))
  throw Error('Cloud project is not an editable Crystal Forge project.');
 const serialized=JSON.stringify(data);
 if(new TextEncoder().encode(serialized).length>900_000)throw Error('Vault exceeds the GitHub Contents inline-file limit. Export an archive and reduce stored items.');
 return deep(data);
}
export function mergeVault(storage,data,{restoreProject=true}={}){
 const remote=validateVault(data),local=captureVault(storage);
 // Preserve local data before any replacement, including a first import.
 const backupKey=PREFIX+Date.now();
 storage.setItem(backupKey,JSON.stringify(local));
 const merge=(ours,theirs)=>{const byId=new Map();
  for(const [source,items] of [['local',ours],['cloud',theirs]]){
   for(const item of items){
    if(!item||typeof item!=='object')continue;
    let id=String(item.id||item.name||'unknown');
    if(!byId.has(id)){byId.set(id,item);continue}
    if(JSON.stringify(byId.get(id))===JSON.stringify(item))continue;
    // Preserve BOTH conflicting user-defined items, never silently replace.
    const base=id+'-'+source;let n=1,copyId=base;
    while(byId.has(copyId))copyId=base+'-'+(++n);
    byId.set(copyId,{...item,id:copyId,name:String(item.name||id)+' ('+source+' import)'});
   }
  }
  return [...byId.values()];
 };
 storage.setItem(PROFILES,JSON.stringify(merge(local.pixelProfiles,remote.pixelProfiles)));
 storage.setItem(TEMPLATES,JSON.stringify(merge(local.templates,remote.templates)));
 storage.setItem(PROJECTS,JSON.stringify(merge(local.projects,remote.projects||[])));
 if(restoreProject&&remote.project)storage.setItem(PROJECT,JSON.stringify(remote.project));
 return {backupKey,projectRestored:!!(restoreProject&&remote.project),
  profiles:merge(local.pixelProfiles,remote.pixelProfiles).length,
  templates:merge(local.templates,remote.templates).length,
  projects:merge(local.projects,remote.projects||[]).length};
}
const decode=b64=>{
 const binary=atob(b64.replace(/\s/g,'')),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
 return new TextDecoder().decode(bytes);
};
const encode=text=>{
 const bytes=new TextEncoder().encode(text);
 let binary='';for(let i=0;i<bytes.length;i+=8192)
  binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(binary);
};
export class CloudConflictError extends Error{
 constructor(message='Cloud changed on another computer. Pull and reconcile before uploading.') {super(message);this.name='CloudConflictError'}
}
export class GitHubVault{
 constructor({storage,fetchFn=fetch,onStatus=()=>{}}={}){
  if(!storage)throw Error('Browser storage required');
  this.storage=storage;this.fetchFn=fetchFn;this.onStatus=onStatus;
  this.token='';this.repo='';this.sha=null;this.connected=false;this.reconciled=false;this.timer=null;this.busy=false;this.auto=false;
 }
 disconnect(){if(this.timer)clearTimeout(this.timer);this.timer=null;this.token='';this.repo='';this.sha=null;this.connected=false;this.reconciled=false;this.onStatus('Disconnected: token cleared from memory')}
 async request(path,options={}){
  if(!this.token||!this.repo)throw Error('Connect to a private repository first.');
  const res=await this.fetchFn('https://api.github.com/repos/'+this.repo+path,{
   ...options,headers:{Accept:'application/vnd.github+json',
    Authorization:'Bearer '+this.token,'X-GitHub-Api-Version':'2022-11-28',
    ...options.headers}
  });
  if(res.status===404)return null;
  if(!res.ok){
   const message=await res.text().catch(()=>res.statusText);
   throw Error('GitHub returned '+res.status+': '+message.slice(0,250));
  }
  return res.json();
 }
 async connect(repo,token){
  if(!idMatch.test(String(repo||'')))throw Error('Enter a GitHub owner/repository name.');
  if(!String(token||'').trim())throw Error('Enter a fine-grained token with Contents read/write access.');
  this.disconnect();this.repo=String(repo).trim();this.token=String(token).trim();
  try{
   const info=await this.request('');
   if(!info||info.private!==true)throw Error('Cloud sync requires a PRIVATE repository. Public repos are refused.');
   if(info.permissions?.push===false)throw Error('Token cannot write to this private repository.');
   const remote=await this.fetchRemote();
   this.sha=remote?.sha??null;
   this.connected=true;this.reconciled=!remote;
   this.onStatus(remote?'Private vault found. Pull + merge before enabling auto-sync.':'Private vault empty. Sync Now creates your first backup.');
   return {exists:!!remote,repo:this.repo,private:true};
  }catch(err){this.disconnect();throw err}
 }
 async fetchRemote(ref=null){
  if(ref!==null&&!/^[a-f0-9]{40}$/.test(ref))throw Error('Invalid GitHub history commit SHA.');
  const raw=await this.request('/contents/'+VAULT_PATH+(ref?'?ref='+ref:''));
  if(!raw)return null;
  if(raw.type!=='file'||typeof raw.content!=='string')throw Error('Cloud path is not a readable JSON file.');
  return {sha:raw.sha,data:validateVault(JSON.parse(decode(raw.content)))};
 }
 async listHistory(limit=20){
  if(!this.connected)throw Error('Connect first');
  if(this.busy)throw Error('Sync in progress');
  const count=Math.max(1,Math.min(30,Math.floor(Number(limit)||20)));
  const rows=await this.request('/commits?path='+encodeURIComponent(VAULT_PATH)+'&per_page='+count);
  if(!Array.isArray(rows))return [];
  return rows.filter(row=>/^[a-f0-9]{40}$/.test(row.sha||'')).map(row=>({
   sha:row.sha,
   date:String(row.commit?.committer?.date||row.commit?.author?.date||''),
   message:String(row.commit?.message||'Cloud sync').split('\n')[0].slice(0,140)
  }));
 }
 async restoreVersion(ref){
  if(!this.connected||!this.reconciled)throw Error('Connect and reconcile the latest vault before restoring history.');
  if(this.busy)throw Error('Sync in progress');
  if(!/^[a-f0-9]{40}$/.test(ref))throw Error('Choose a valid past commit.');
  this.busy=true;
  try{
   const current=await this.fetchRemote();
   if((current?.sha??null)!==(this.sha??null))throw new CloudConflictError();
   const previous=await this.fetchRemote(ref);
   if(!previous)throw Error('No Crystal Forge backup exists at this commit.');
   const merged=mergeVault(this.storage,previous.data,{restoreProject:true});
   this.onStatus('Restored an older version locally with a pre-restore backup. Sync Now creates a new GitHub revision; history remains intact.');
   return {...merged,revision:ref};
  }finally{this.busy=false}
 }
 async pull({restoreProject=true}={}){
  if(!this.connected)throw Error('Connect first');
  if(this.busy)throw Error('Sync in progress');
  this.busy=true;
  try{
   const remote=await this.fetchRemote();
   if(!remote)throw Error('No cloud backup exists yet. Use Sync Now to upload.');
   const merged=mergeVault(this.storage,remote.data,{restoreProject});
   this.sha=remote.sha;this.reconciled=true;
   this.onStatus('Downloaded private vault, backed up local data and merged custom profiles/templates.');
   return merged;
  }finally{this.busy=false}
 }
 async push(){
  if(!this.connected)throw Error('Connect first');
  if(!this.reconciled)throw new CloudConflictError('Pull and merge the existing private cloud vault before uploading.');
  if(this.busy)throw Error('Sync in progress');
  this.busy=true;
  try{
   const current=await this.fetchRemote();
   if((current?.sha??null)!==(this.sha??null))
    throw new CloudConflictError();
   const data=validateVault(captureVault(this.storage));
   const body={message:'Crystal Forge private vault sync '+data.updatedAt,
    content:encode(JSON.stringify(data))};
   if(current?.sha)body.sha=current.sha;
   const saved=await this.request('/contents/'+VAULT_PATH,{method:'PUT',
    headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   if(!saved?.content?.sha)throw Error('GitHub did not confirm an updated vault SHA.');
   this.sha=saved.content.sha;this.onStatus('Saved private GitHub vault. Commit history keeps older versions.');
   return {sha:this.sha};
  }finally{this.busy=false}
 }
 schedule(){
  if(!this.auto||!this.connected||!this.reconciled)return;
  if(this.timer)clearTimeout(this.timer);
  this.timer=setTimeout(()=>{this.timer=null;this.push().catch(err=>{this.auto=false;this.onStatus('Cloud auto-sync paused: '+err.message)})},3500);
 }
 setAuto(enabled){
  this.auto=!!enabled&&this.connected&&this.reconciled;
  if(!this.auto&&this.timer){clearTimeout(this.timer);this.timer=null}
  return this.auto;
 }
}
