#!/usr/bin/env node
/** Read-only WT-021 status snapshot: no network access, writes or dependencies. */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = name => { try { return readFileSync(resolve(root, name), 'utf8'); } catch { return ''; } };
const git = (...args) => { try { return execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:3000}).trim(); } catch { return 'unavailable'; } };
const rows = read('docs/WT021_COMPLETION_REGISTER.md').split('\n').filter(x=>/^\| (?:DIM|FAB|FIT|CAL|PAR|E2E|UX)-[A-Z\d]+ P[01] \|/.test(x));
const items = rows.map(x=>({id:x.split('|')[1].trim().split(' ')[0], status:(x.split('|').at(-2)||'').trim().split(';')[0].trim()}));
const counts = items.reduce((a,x)=>(a[x.status]=(a[x.status]||0)+1,a),{});
const now = read('docs/WT021_NOW.md');
const next = (now.split(/^## Next executable step\s*$/m)[1]||'').split(/^## /m)[0].trim().split('\n').filter(Boolean).slice(0,7).join('\n');
const dirty = git('status','--porcelain');
const data = {branch:git('branch','--show-current'),head:git('rev-parse','HEAD'),workingTree:dirty==='unavailable'?'unknown':dirty?'dirty':'clean',changedFiles:dirty==='unavailable'?null:dirty.split('\n').filter(Boolean).length,items:items.length,statuses:counts,next:next||'See docs/WT021_NOW.md'};
if(process.argv.includes('--json'))console.log(JSON.stringify(data));
else {
 console.log('WT-021 — read-only local status');
 console.log('Branch '+data.branch+' | HEAD '+data.head+' | '+data.workingTree+' ('+data.changedFiles+' changes)');
 console.log('Acceptance '+data.items+' rows '+JSON.stringify(counts));
 console.log('NEXT:\n'+data.next);
 console.log('CI: verify the published candidate head. Working branch and PR status are in docs/WT021_NOW.md.');
 if(data.items<24)console.log('WARNING: unexpected register count; inspect source.');
}
