// Conservatively avoid expensive browser/Manifold suites for documentation-only
// PRs. All code/test/dependency/workflow changes and ambiguous diffs run tests.
import {appendFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export function isDocumentationPath(path){
 if(typeof path!=='string'||!path)return false;
 if(['README.md','AGENTS.md','CONTRIBUTING.md','CHANGELOG.md','LICENSE'].includes(path))return true;
 return /^(?:docs|prompts)\/(?:[^/]+\/)*[^/]+\.(?:md|markdown|txt|csv|png|jpg|jpeg|webp|svg)$/i.test(path);
}
export function needsExpensiveTests(paths){
 // Empty/unknown diffs must not silently bypass manufacturing or browser QA.
 return !Array.isArray(paths)||paths.length===0||paths.some(path=>!isDocumentationPath(path));
}
export function gitChangedPaths(base,head='HEAD'){
 if(!/^[a-f0-9]{40}$/i.test(base||''))throw Error('Invalid exact base SHA');
 const bytes=execFileSync('git',['diff','--no-renames','--name-only','-z',base,head],
  {encoding:'utf8',maxBuffer:4*1024*1024});
 return bytes.split('\0').filter(Boolean);
}
export function runWorkflowScope(env=process.env){
 let runHeavy=true;
 if(env.GITHUB_EVENT_NAME==='pull_request'){
  try{
   runHeavy=needsExpensiveTests(gitChangedPaths(env.CI_BASE_SHA));
  }catch(error){
   console.log('Changed-file inspection unavailable; fail closed and run full tests: '+error.message);
   runHeavy=true;
  }
 }
 console.log(runHeavy?'Full source/testing CI required.':'Documentation-only PR: expensive suites skipped; static gate remains.');
 if(env.GITHUB_OUTPUT)appendFileSync(env.GITHUB_OUTPUT,'run_heavy='+String(runHeavy)+'\n');
 return runHeavy;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 runWorkflowScope();
}
