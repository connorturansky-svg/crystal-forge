import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

import {studioFeatures,featureCategories} from '../studio-features.js';

execFileSync(process.execPath,['scripts/generate-release-metadata.mjs','--check']);
assert.equal(new Set(studioFeatures.map(feature=>feature.id)).size,studioFeatures.length);
assert.equal(studioFeatures.filter(feature=>feature.action==='family').length,7);
assert(studioFeatures.every(feature=>featureCategories[feature.category]&&feature.title&&feature.description));

const changelog=readFileSync('CHANGELOG.md','utf8').replaceAll('\r\n','\n');
const html=readFileSync('index.html','utf8');
const releases=[...changelog.matchAll(/^## v(\d+\.\d+\.\d+(?:-[\w.]+)?) — (.+)$/gm)];
assert(releases.length,'Add a versioned release heading to CHANGELOG.md.');
const [heading,version,title]=releases[0];
const notes=changelog.slice(releases[0].index+heading.length,releases[1]?.index).trim().split('\n');
assert(notes.length&&notes.every(note=>note.startsWith('- ')&&note.length>4),'Add a human-readable release entry.');
assert.equal(new Set(releases.map(release=>release[1])).size,releases.length,'Release versions must be unique.');
const escape=text=>text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
assert.equal(html.match(/<span class="version">v([^ <]+)/)?.[1],version,'The toolbar must show the latest changelog version.');
const current='<div class="release" id="currentRelease"><strong>v'+version+' — '+escape(title)+'</strong><ul>'+
 notes.map(note=>'<li>'+escape(note.slice(2))+'</li>').join('')+'</ul></div>';
assert(html.includes(current),'What’s New must match the latest changelog entry.');
const base=process.argv[2];
if(base){
 assert(/^[a-f0-9]{40}$/i.test(base),'Pass the full base commit SHA.');
 const before=execFileSync('git',['show',base+':index.html'],{encoding:'utf8'});
 const previous=before.match(/<span class="version">v([^ <]+)/)?.[1];
 const previousLog=execFileSync('git',['show',base+':CHANGELOG.md'],{encoding:'utf8'});
 assert(previous&&previous!==version&&!previousLog.includes('## v'+version+' — '),'Use a new release version for each production change.');
}
console.log('Release metadata verified for v'+version);
