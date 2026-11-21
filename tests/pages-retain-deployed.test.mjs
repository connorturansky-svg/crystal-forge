import assert from 'node:assert/strict';
import {findLastSuccessfulPagesDeployment,selectReleaseShas}
 from '../scripts/pages-retain-deployed.mjs';

const A='a'.repeat(40),B='b'.repeat(40),C='c'.repeat(40),D='d'.repeat(40);
const selected=selectReleaseShas({currentSha:D,recent:[C,B],lastSuccessful:A,
 isAncestor:sha=>sha!==B});
assert.deepEqual(selected.selected,[A,C],'Retain actual last successful SHA even beyond recent history');
assert.deepEqual(selected.ignored,[{sha:B,reason:'not an ancestor of this staged revision'}]);
assert.deepEqual(selectReleaseShas({currentSha:D,recent:[D,C,C,A],lastSuccessful:C}).selected,[C,A]);
assert.throws(()=>selectReleaseShas({currentSha:'bad'}),/40-character/);
const calls=[];
const mock=async(url,options)=>{
 calls.push({url,auth:options.headers.Authorization});
 let json;
 if(url.includes('/deployments?'))json=[
  {id:103,sha:D},  // current pending deploy is not historical evidence
  {id:102,sha:B},  // failed deployment must NOT be retained as last success
  {id:101,sha:A}   // completed deployment now marked inactive
 ];
 else if(url.includes('/102/statuses?'))json=[{state:'failure'}];
 else if(url.includes('/101/statuses?'))json=[{state:'inactive'},{state:'success'}];
 else throw Error('Unexpected API URL '+url);
 return {ok:true,json:async()=>json};
};
const success=await findLastSuccessfulPagesDeployment({
 repo:'connorturansky-svg/crystal-forge',token:'test-token',fetchFn:mock,currentSha:D
});
assert.deepEqual(success,{sha:A,deploymentId:101,wasSuccessful:true,latestState:'inactive'});
assert.equal(calls.length,3);
assert(calls.every(c=>c.auth==='Bearer test-token'));
const none=await findLastSuccessfulPagesDeployment({repo:'example/repo',currentSha:D,
 fetchFn:async()=>({ok:true,json:async()=>[]})});
assert.equal(none,null);
await assert.rejects(()=>findLastSuccessfulPagesDeployment({repo:'bad',fetchFn:mock}),/owner\/repository/);
await assert.rejects(()=>findLastSuccessfulPagesDeployment({repo:'valid/repo',fetchFn:async()=>({ok:false,status:403})}),/HTTP 403/);
console.log('Pages QA: successful deployment selection, failed/pending skip, inactive history and SHA guards PASS');
