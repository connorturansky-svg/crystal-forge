import assert from 'node:assert/strict';
import {manufacturingFingerprint} from '../manufacturing-fingerprint.js';
import {PROJECT_LIMIT,listSavedProjects,saveNamedProject} from '../project-library.js';
import {mergeVault,validateVault,GitHubVault} from '../github-vault.js';
function memory(initial={}){
 const entries=new Map(Object.entries(initial));let failOnce=null;
 return {getItem:key=>entries.has(key)?entries.get(key):null,
  setItem(key,value){if(key===failOnce){failOnce=null;throw Error('Simulated quota exceeded')}entries.set(key,String(value))},
  removeItem:key=>entries.delete(key),keys:()=>[...entries.keys()],fail:key=>{failOnce=key}};
}
const settings={wireMode:'string',pixelStringSpacing:50,wireMinBendRadius:5,
 wireInputTailLength:0,wireOutputTailLength:0,wireDirectionArrows:true,wireShowLengths:true};
const crystals=[{id:'c1',x:0,y:0,z:0,r:20,h:80}];
const current=manufacturingFingerprint(settings,crystals);
for(const [name,value] of [['pixelStringSpacing',25],['wireMinBendRadius',12],
 ['wireInputTailLength',30],['wireOutputTailLength',18]])
 assert.notEqual(manufacturingFingerprint({...settings,[name]:value},crystals),current,
  name+' must invalidate an earlier prepared STL');
assert.equal(manufacturingFingerprint({...settings,wireDirectionArrows:false,wireShowLengths:false},crystals),
 current,'Cosmetic guides should not invalidate a print mesh');
assert.notEqual(manufacturingFingerprint(settings,[{...crystals[0],x:3}]),current,
 'Crystal movement must invalidate a prepared mesh');
const store=memory();
for(let i=0;i<PROJECT_LIMIT;i++)saveNamedProject(store,'Design '+i,{seed:i},[{id:'c'+i}]);
const original=listSavedProjects(store);
assert.equal(original.length,PROJECT_LIMIT);
assert.throws(()=>saveNamedProject(store,'Unsafe extra model',{seed:999},[]),/Library full/);
assert.deepEqual(listSavedProjects(store),original,'No project is ever silently evicted');
const incoming={schema:1,project:null,pixelProfiles:[],templates:[],
 projects:[{id:'extra',name:'Remote design',settings:{},crystals:[]}]};
assert.throws(()=>mergeVault(store,incoming),/exceeding the 40-project library limit/);
assert.deepEqual(listSavedProjects(store),original,'Oversized remote merges do not change local projects');
assert.throws(()=>validateVault({...incoming,projects:[{id:'broken'}]}),/Saved project/);
const legacy=memory({'crystal-forge-project-library-v1':JSON.stringify([
 null,...Array.from({length:PROJECT_LIMIT+1},(_,i)=>({id:'old'+i,name:'Old '+i,settings:{},crystals:[]}))])});
assert.equal(listSavedProjects(legacy).length,PROJECT_LIMIT+1,
 'Existing over-cap projects must remain visible and exportable');
const profiles=JSON.stringify([{id:'local',name:'Original measured gumdrop',bodyHeight:24.5}]);
const templates=JSON.stringify([{id:'t1',name:'Original template'}]);
const b=memory({'crystal-forge-pixel-library':profiles,'crystal-forge-project-templates-v1':templates,
 'crystal-forge-project-library-v1':'[]'});
const cloud={...incoming,projects:[],pixelProfiles:[{id:'remote',name:'New'}],templates:[{id:'t2',name:'New'}]};
b.fail('crystal-forge-project-templates-v1');
assert.throws(()=>mergeVault(b,cloud),/Complete pre-import backup/);
assert.equal(b.getItem('crystal-forge-pixel-library'),profiles);
assert.equal(b.getItem('crystal-forge-project-templates-v1'),templates);
assert(b.keys().some(k=>k.startsWith('crystal-forge-cloud-local-backup-')));
const first=mergeVault(b,cloud),second=mergeVault(b,cloud);
assert.notEqual(first.backupKey,second.backupKey,'Consecutive imports get unique backup keys');
assert(b.getItem(first.backupKey)&&b.getItem(second.backupKey));
const vault=new GitHubVault({storage:b,fetchFn:async()=>{throw Error('Unexpected network')}});
vault.connected=true;vault.reconciled=true;vault.auto=true;vault.token='private-token';vault.repo='example/repo';
vault.disconnect();
assert.equal(vault.token,'');assert.equal(vault.auto,false,'Disconnect pauses auto-sync');
console.log('PR11 production hardening: cache invalidation, data preservation and cloud-import rollback passed');
