import assert from 'node:assert/strict';
import {test} from 'node:test';
import {releaseReadKey,unreadReleaseEntries,splitReleaseNote} from '../src/ui/info-release-summary.mjs';
const entries=['0.16.0-dev.35.43','0.16.0-dev.35.42','0.16.0-dev.35.40'].map(version=>({version,notes:['Change']}));
const storage=(...read)=>({getItem:key=>read.some(v=>releaseReadKey(v)===key)?'read':null});
test('first visit shows only this version without implicit acknowledgement',()=>{
 assert.deepEqual(unreadReleaseEntries(entries,storage()),{entries:entries.slice(0,1),available:true,previous:null});
});
test('earlier acknowledged release gives all intervening versioned entries',()=>{
 assert.deepEqual(unreadReleaseEntries(entries,storage(entries[2].version)),{entries:entries.slice(0,2),available:true,previous:entries[2].version});
});
test('current marker wins, even when earlier versions are also acknowledged',()=>{
 assert.deepEqual(unreadReleaseEntries(entries,storage(entries[2].version,entries[0].version)),{entries:[],available:true,previous:entries[0].version});
});
test('unavailable or corrupt storage does not falsely mark notes read',()=>{
 assert.equal(unreadReleaseEntries(entries,undefined).available,false);
 assert.deepEqual(unreadReleaseEntries(entries,{getItem(){throw Error('blocked')}}).entries,entries.slice(0,1));
 assert.equal(unreadReleaseEntries(entries,{getItem:()=>'{invalid'}).previous,null);
});
test('old tabs ignore future read markers without erasing them',()=>{
 assert.deepEqual(unreadReleaseEntries(entries.slice(1),storage(entries[0].version)).entries,entries.slice(1,2));
 assert.notEqual(releaseReadKey(entries[0].version),releaseReadKey(entries[1].version));
 assert.deepEqual(unreadReleaseEntries([],storage()),{entries:[],available:false,previous:null});
});


test('only explicitly authored categories are presented as categories',()=>{
 for(const category of ['New','Changed','Moved','Fixed','Important'])assert.deepEqual(splitReleaseNote(category+' — Example'),{category,text:'Example'});
 assert.deepEqual(splitReleaseNote('Find a tool in Design'),{category:null,text:'Find a tool in Design'});
});
