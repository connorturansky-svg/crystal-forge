import assert from 'node:assert/strict';
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
console.log('CI scope: documentation-only passes and code/workflow/test changes fail closed.');
