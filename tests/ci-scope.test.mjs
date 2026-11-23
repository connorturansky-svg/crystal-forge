import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {isDocumentationPath,needsExpensiveTests,gitChangedPaths,runWorkflowScope} from './helpers/ci-scope.mjs';
const docs=[
 'README.md','CONTRIBUTING.md','AGENTS.md','CHANGELOG.md','LICENSE',
 'docs/README.md','docs/PROJECT_STATUS.md','docs/history/README.md',
 'docs/qa/PRINT_TRIAL_RESULTS_TEMPLATE.csv','prompts/START_HERE.md',
 'docs/figures/illustration.svg'
];
for(const p of docs)assert.equal(isDocumentationPath(p),true,p);
const runtime=[
 'index.html','sensory-studio.js','package.json','package-lock.json',
 'tests/browser-smoke.mjs','tests/helpers/ci-scope.mjs',
 '.github/workflows/browser-tests.yml','.github/workflows/pages.yml',
 'docs/live-example.js','prompts/runner.sh',
 'svg-import/index.js','assets/model.obj',
 '.github/CODEOWNERS','LICENSE.exe'
];
for(const p of runtime)assert.equal(isDocumentationPath(p),false,p);
assert.equal(needsExpensiveTests(docs),false);
assert.equal(needsExpensiveTests([...docs,'tests/studio-workspaces-browser.mjs']),true);
assert.equal(needsExpensiveTests([]),true,'Fail closed on empty diffs');
assert.equal(needsExpensiveTests(null),true,'Fail closed on missing diffs');
assert.throws(()=>gitChangedPaths('not-an-exact-commit'));
assert.equal(runWorkflowScope({GITHUB_EVENT_NAME:'workflow_dispatch'}),true);
assert.equal(runWorkflowScope({GITHUB_EVENT_NAME:'push'}),true);
assert.equal(runWorkflowScope({GITHUB_EVENT_NAME:'pull_request',CI_BASE_SHA:'invalid'}),true);
// Exercise the actual Git diff, not just the allowlist: Git can detect a
// rename from an executable source path into docs/ as only its new path.
// Treat BOTH the source deletion and documentation addition as changed.
const directory=mkdtempSync(join(tmpdir(),'cf-ci-scope-'));
const originalCwd=process.cwd();
try{
 process.chdir(directory);
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 git('init','-q');
 git('config','user.name','CI Scope Fixture');
 git('config','user.email','ci-scope@example.invalid');
 writeFileSync('studio-executable.js','export const active=true;\\n');
 git('add','studio-executable.js');
 git('commit','-qm','Baseline runtime script');
 const base=git('rev-parse','HEAD');
 mkdirSync('docs');
 git('mv','studio-executable.js','docs/notes.md');
 git('commit','-qam','Rename executable source to docs');
 const paths=gitChangedPaths(base);
 assert(paths.includes('studio-executable.js'),'Old executable rename path must be visible');
 assert(paths.includes('docs/notes.md'),'New documentation rename path must be visible');
 assert.equal(needsExpensiveTests(paths),true,'Executable-to-doc rename may not skip suites');
}finally{
 process.chdir(originalCwd);
 rmSync(directory,{recursive:true,force:true});
}
console.log('CI scope: documentation-only passes and code/workflow/test changes fail closed.');
