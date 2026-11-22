import assert from 'node:assert/strict';
import {createModel,createProject,addModel} from '../studio-documents.js';
import {packStudioVault,StudioVault,STUDIO_MANIFEST} from '../studio-vault.js';

const project=createProject({id:'large-project',title:'Big model source',now:'2026-11-22T00:00:00.000Z'});
// A realistic imported-source-size stressor, with the important condition being
// actual UTF-8 JSON bytes > the Contents API's 1 MB inline response limit.
addModel(project,createModel({id:'mesh-asset',name:'Large imported geometry',typeId:'imported-mesh',
 parameters:{meshSource:'α'.repeat(600_000)},now:'2026-11-22T00:00:00.000Z'}));
const workspace={schemaVersion:1,project,library:[],savedProjects:[],legacyTemplates:[]};
const packed=await packStudioVault(workspace);
const manifest={...packed.manifest,optionalFutureMetadata:'q'.repeat(1_050_000)};
const objects=new Map([[STUDIO_MANIFEST,manifest]]);
for(const [hash,value] of packed.assets)objects.set('.sensory-model-studio/assets/'+hash+'.json',value);
const files=new Map(),blobs=new Map();
let sequence=0;
for(const [path,value] of objects){
 const bytes=Buffer.from(JSON.stringify(value),'utf8');
 const sha=(++sequence).toString(16).padStart(40,'0');
 const content=bytes.toString('base64');
 files.set(path,{type:'file',sha,size:bytes.length,encoding:bytes.length>1_000_000?'none':'base64',
  content:bytes.length>1_000_000?'':content});
 blobs.set(sha,{sha,encoding:'base64',content});
}
assert(files.get(STUDIO_MANIFEST).size>1_000_000,'Test must exercise a large manifest');
assert([...files.entries()].some(([key,file])=>key.includes('/assets/')&&file.size>1_000_000),
 'Test must exercise a large content-addressed model asset');

const calls=[],uploads=[];
const client={async request(path,options={}){
 calls.push({path,accept:options.headers?.Accept??null,method:options.method??'GET'});
 if(options.method==='PUT'){
  uploads.push({path,body:JSON.parse(options.body)});
  return {content:{sha:'f'.repeat(40)}};
 }
 if(path.startsWith('/contents/')){
  assert.equal(options.headers?.Accept,'application/vnd.github.object+json',
   'GitHub Contents requests must select the object representation for large files');
  return files.get(path.slice('/contents/'.length))??null;
 }
 if(path.startsWith('/git/blobs/'))return blobs.get(path.slice('/git/blobs/'.length))??null;
 throw Error('Unexpected GitHub API route: '+path);
}};
const vault=new StudioVault(client);
const restored=await vault.pull();
assert.deepEqual(restored.project,workspace.project,'Large model parameters survived private-vault restore');
assert.equal(vault.sha,files.get(STUDIO_MANIFEST).sha);
assert(calls.some(call=>call.path==='/git/blobs/'+files.get(STUDIO_MANIFEST).sha),
 'Large manifest must use the authenticated Git Blob fallback');
assert(calls.some(call=>call.path.startsWith('/git/blobs/')&&call.path!=='/git/blobs/'+files.get(STUDIO_MANIFEST).sha),
 'Large model asset must use the Git Blob fallback');
await vault.push(workspace);
assert.equal(uploads.length,1,'Existing immutable assets must be checked, not re-uploaded');
assert.equal(uploads[0].path,'/contents/'+STUDIO_MANIFEST);
assert.equal(vault.sha,'f'.repeat(40),'A confirmed manifest write is the only successful upload marker');

const brokenClient={async request(path,opts){
 if(path.startsWith('/git/blobs/'))return {...blobs.get(path.slice('/git/blobs/'.length)),sha:'0'.repeat(40)};
 return client.request(path,opts);
}};
const bad=new StudioVault(brokenClient);
await assert.rejects(()=>bad.pull(),/unreadable via the Git blob API/);
assert.equal(bad.sha,null,'Failed large-asset recovery must not acknowledge a remote revision');
assert.deepEqual(workspace.project,project,'Failed cloud read must not mutate the original workspace');

console.log('Large private GitHub Studio assets and manifest: authenticated Git blob fallback, hash checks, non-destructive errors and upload passed.');
