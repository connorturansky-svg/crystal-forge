import assert from 'node:assert/strict';
import {captureVault,validateVault,mergeVault,GitHubVault,CloudConflictError,VAULT_PATH} from '../github-vault.js';
const mem=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),has:k=>m.has(k),dump:()=>[...m.entries()]};};
const a=mem(),b=mem();
a.setItem('crystal-forge-v3',JSON.stringify({settings:{pixelProfileId:'custom-my-gumdrop'},crystals:[{id:'x',x:12}]}));
a.setItem('crystal-forge-pixel-library',JSON.stringify([{id:'custom-my-gumdrop',name:'Measured gumdrop',bodyHeight:24.5}]));
a.setItem('crystal-forge-project-templates-v1',JSON.stringify([{id:'t1',name:'Test design',settings:{seed:3},crystals:[]}]));
const doc=captureVault(a,'2026-11-11T00:00:00Z');
assert.equal(doc.schema,1);
assert.equal(doc.pixelProfiles[0].bodyHeight,24.5);
assert.equal(doc.templates[0].name,'Test design');
assert.throws(()=>validateVault({schema:2,pixelProfiles:[],templates:[]}),/supported/);
let remote=null,sha=null,n=0,authCalls=0;
const response=(status,data)=>({ok:status>=200&&status<300,status,statusText:'Mock',json:async()=>data,text:async()=>JSON.stringify(data)});
const fakeFetch=async(url,options={})=>{
 const header=options.headers||{};
 assert(header.Authorization?.startsWith('Bearer '),'Authorization included only in request header');
 authCalls++;
 if(url.endsWith('/repos/example/private-designs'))return response(200,{private:true,permissions:{push:true}});
 if(url.endsWith('/repos/example/private-designs/contents/'+VAULT_PATH)){
  if(options.method==='PUT'){
   const body=JSON.parse(options.body);
   if(sha&&body.sha!==sha)return response(409,{message:'SHA conflict'});
   const binary=atob(body.content);remote=JSON.parse(new TextDecoder().decode(Uint8Array.from(binary,c=>c.charCodeAt(0))));
   sha='sha-'+(++n);return response(201,{content:{sha}});
  }
  if(!remote)return response(404,{message:'Not Found'});
  const bytes=new TextEncoder().encode(JSON.stringify(remote));
  const binary=String.fromCharCode(...bytes);
  return response(200,{type:'file',sha,content:btoa(binary)});
 }
 throw Error('Unexpected GitHub request '+url);
};
const x=new GitHubVault({storage:a,fetchFn:fakeFetch});
const first=await x.connect('example/private-designs','sample-secret-token');
assert.equal(first.exists,false);
assert.equal(x.connected,true);
await x.push();
assert.equal(remote.pixelProfiles[0].bodyHeight,24.5);
assert(!JSON.stringify(remote).includes('sample-secret-token'),'Credentials never enter cloud vault');
assert(!a.dump().some(([,v])=>v.includes('sample-secret-token')),'Credentials never enter localStorage');
const y=new GitHubVault({storage:b,fetchFn:fakeFetch});
assert((await y.connect('example/private-designs','other-secret-token')).exists);
await assert.rejects(()=>y.push(),CloudConflictError,'Existing cloud content cannot be overwritten without pull');
const pulled=await y.pull();
assert(pulled.projectRestored);
assert.equal(JSON.parse(b.getItem('crystal-forge-pixel-library'))[0].bodyHeight,24.5);
assert.equal(JSON.parse(b.getItem('crystal-forge-v3')).crystals[0].id,'x');
assert(b.getItem(pulled.backupKey),'Local backup created before merge');
await x.push();
await assert.rejects(()=>y.push(),CloudConflictError,'Remote SHA change requires another pull');
y.disconnect();assert.equal(y.token,'');
const publicFetch=async()=>response(200,{private:false,permissions:{push:true}});
await assert.rejects(()=>new GitHubVault({storage:b,fetchFn:publicFetch}).connect('example/public-designs','secret'),/PRIVATE/);
assert(authCalls>5);
console.log('PR10 private GitHub cloud backup, cross-machine profile restore, remote SHA conflicts and token isolation passed');
