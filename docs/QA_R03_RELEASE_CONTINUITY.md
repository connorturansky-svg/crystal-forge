# QA-R03 — Long-lived editor tabs across Pages deployments

Status: **isolated proof and retention helper only**. This is NOT deployed and is
NOT yet invoked by `.github/workflows/pages.yml`. The owner must review the
bounded retention strategy and merge/reconcile QA-R02 (#112) before production
integration. Do not claim that public Pages currently retains old releases.

## Verified source problem

The GitHub Pages staging job currently creates only
`_site/releases/${GITHUB_SHA}/`. A tab loaded before a new deployment keeps
the old `<base href="./releases/<old-SHA>/">` and lazy-loads workers later using
`new URL('./fabrication-worker.js', import.meta.url)`. Replacing the Pages
artifact removes the old SHA subtree; an old tab may then request a missing
worker or module. Fresh-version smoke tests (#112) do not detect this condition.

## Proposed bounded retention implementation

`tests/helpers/retain-pages-releases.mjs` contains a deliberately separate
candidate build helper. It reconstructs assets for up to five earlier *first-
parent* Git commits, using the same top-level JavaScript/CSS, `svg-import/`
and vendored dependencies as the existing Pages packaging. Copies are
SHA-scoped, non-overwriting and atomic per historical directory. It refuses
to substitute a different Three.js or Manifold version for an old release,
rather than silently create an invalid snapshot.

The standalone CLI form (on a fully staged `_site`) is:

```sh
node tests/helpers/retain-pages-releases.mjs _site "$GITHUB_SHA" --keep=3
```

This requires `git`, `tar`, complete local first-parent history (the existing
Pages checkout uses `fetch-depth: 0`), and a staged current release/vendor tree.
It makes no remote calls and does not execute code from old commits.

**Limits:** A bounded number of previous commits does not guarantee continuity
for indefinitely old tabs. A follow-up should retain the last successfully
published SHA specifically, even when several intermediate main commits
failed to deploy; add an explicit expiry/update notice for tabs older than
the retention horizon. Assess Pages artifact growth and version-dependency
changes before choosing the final retention count. No automatic refresh
should discard unsaved work.

## Automated evidence

`tests/pages-release-continuity-browser.mjs` simulates:

1. An editor tab opened on release A with an on-demand worker not loaded yet.
2. Deployment of release B replacing the original A assets.
3. A 404 when the still-open A tab requests that worker without retention.
4. Reconstruction of A's immutable SHA directory alongside B.
5. The **same still-open Chromium tab** loading its original A worker, while
   a newly opened tab loads release B.
6. Missing-version/vendor mismatch and refusal to overwrite a retained SHA.

The independent `QA release continuity (old editor tabs)` workflow runs this
test on changes to the QA helper, test or workflow. It is not the production
Pages release gate. It must pass exact-head CI before this preparation PR
is considered reviewable.

## Required production integration (follow-up after #112)

- Hook bounded historical retention into the actual `_site` creation step
  **before** the staged Pages smoke and upload.
- Capture the actual last-successfully-published SHA, not only recent Git
  history; verify the immutable old asset graph including Worker imports and
  versioned vendor dependencies.
- Add an A-open/B-deploy real-Studio Chromium journey with a saved disposable
  model and a late manufacturing worker, including a safely handled out-of-
  retention version that offers a save-first update.
- Test Pages artifact size, worker MIME types, fresh B startup and Ctrl+R
  restoration; no change to real users' saved projects or hardware profiles.
- Complete exact-head static, Chromium, fabrication and Pages checks. Owner
  controls final merge, deployment and branch-protection settings.

Coordination: #105. Other release QA: #112. Core P0 profile persistence: #113.
