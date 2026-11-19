import {readOrganisation} from './studio-organisation.js';
/* Content-addressed private-vault assets. Immutable assets are uploaded first;
 * the guarded manifest is the commit point. Interrupted uploads leave the
 * previous complete manifest usable. Credentials remain on the existing client. */
import {canonical,validateProject} from './studio-documents.js';
export const STUDIO_MANIFEST='.sensory-model-studio/manifest-v1.json';
const encode=text=>{const b=new TextEncoder().encode(text);let s='';for(let i=0;i<b.length;i+=8192)s+=String.fromCharCode(...b.subarray(i,i+8192));return btoa(s);};
const decode=text=>new TextDecoder().decode(Uint8Array.from(atob(text.replace(/\s/g,'')),c=>c.charCodeAt(0)));
export async function assetHash(value){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(value)));return [...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,'0')).join('');}
const assetPath=hash=>{if(!/^[a-f0-9]{64}$/.test(hash))throw Error('Invalid studio asset reference.');return '.sensory-model-studio/assets/'+hash+'.json';};
export async function packStudioVault(state){
 validateProject(state.project);const assets=new Map();
 async function add(value){const hash=await assetHash(value);assets.set(hash,value);return hash;}
 async function model(value){const record=structuredClone(value);if(record.thumbnail){record.thumbnailAsset=await add(record.thumbnail);record.thumbnail=null;}return add(record);}
 async function project(value){const record=structuredClone(value);record.models=await Promise.all(value.models.map(model));return add(record);}
 const manifest={schemaVersion:1,project:await project(state.project),
  library:await Promise.all(state.library.map(async record=>({id:record.id,versions:await Promise.all(record.versions.map(async version=>({revision:version.revision,model:await model(version.model)})))}))),
  savedProjects:await Promise.all((state.savedProjects||[]).map(project)),legacyTemplates:await add(state.legacyTemplates||[])};
 if(state.organisation!==undefined)manifest.organisation=await add(readOrganisation(state.organisation));
 return {manifest,assets};
}
export async function unpackStudioVault(manifest,readAsset){
 if(manifest?.schemaVersion!==1||!Array.isArray(manifest.library)||!Array.isArray(manifest.savedProjects))throw Error('Unsupported studio vault manifest.');
 const loaded=new Map();
 async function read(hash){assetPath(hash);if(!loaded.has(hash)){const value=await readAsset(hash);if(await assetHash(value)!==hash)throw Error('Studio asset failed its integrity check.');loaded.set(hash,value);}return structuredClone(loaded.get(hash));}
 async function model(hash){const value=await read(hash);if(value.thumbnailAsset){value.thumbnail=await read(value.thumbnailAsset);delete value.thumbnailAsset;}return value;}
 async function project(hash){const value=await read(hash);value.models=await Promise.all(value.models.map(model));return validateProject(value);}
 return {schemaVersion:1,organisation:readOrganisation(manifest.organisation?await read(manifest.organisation):undefined),project:await project(manifest.project),
  library:await Promise.all(manifest.library.map(async record=>({id:record.id,versions:await Promise.all(record.versions.map(async version=>({revision:version.revision,model:await model(version.model)})))}))),
  savedProjects:await Promise.all(manifest.savedProjects.map(project)),legacyTemplates:await read(manifest.legacyTemplates)};
}
export class StudioVault {
 constructor(client){this.client=client;this.sha=null;this.busy=false;}
 async remote(){const file=await this.client.request('/contents/'+STUDIO_MANIFEST);return file?{sha:file.sha,manifest:JSON.parse(decode(file.content))}:null;}
 async pull({acknowledge=true}={}){
  if(this.busy)throw Error('Studio sync is already running.');this.busy=true;
  try{const current=await this.remote();if(!current)throw Error('This private repository has no Sensory Model Studio backup yet.');
   const state=await unpackStudioVault(current.manifest,async hash=>{const file=await this.client.request('/contents/'+assetPath(hash));if(!file)throw Error('A studio asset is missing; the local workspace has not changed.');return JSON.parse(decode(file.content));});
   if(acknowledge){this.sha=current.sha;return state;}
   return {state,sha:current.sha};
  }finally{this.busy=false;}
 }
 async push(state){
  if(this.busy)throw Error('Studio sync is already running.');this.busy=true;
  try{const current=await this.remote();if((current?.sha??null)!==this.sha)throw Error('The private studio vault changed. Pull and reconcile both versions before uploading.');
   const {manifest,assets}=await packStudioVault(state);
   let uploaded=0;
   for(const [hash,value]of assets){const path=assetPath(hash),existing=await this.client.request('/contents/'+path);
    if(existing){if(await assetHash(JSON.parse(decode(existing.content)))!==hash)throw Error('An immutable remote asset has different contents.');continue;}
    try{await this.client.request('/contents/'+path,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Add immutable studio asset',content:encode(canonical(value))})});uploaded++;}
    catch(error){const concurrent=await this.client.request('/contents/'+path);if(!concurrent||await assetHash(JSON.parse(decode(concurrent.content)))!==hash)throw error;}
   }
   const latest=await this.remote();if((latest?.sha??null)!==this.sha)throw Error('The studio manifest changed while assets uploaded. Previous backups remain complete. Pull before retrying.');
   const response=await this.client.request('/contents/'+STUDIO_MANIFEST,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Commit complete Sensory Model Studio backup',content:encode(JSON.stringify(manifest)),...(this.sha?{sha:this.sha}:{})})});
   if(!response?.content?.sha)throw Error('GitHub did not confirm the manifest update.');this.sha=response.content.sha;return {sha:this.sha,assets:assets.size,uploaded};
  }finally{this.busy=false;}
 }
}
