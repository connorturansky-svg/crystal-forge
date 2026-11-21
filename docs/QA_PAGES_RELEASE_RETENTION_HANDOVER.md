# Pages release QA after PR #121 — implementation handover

**Status:** Independent review and acceptance plan only; this branch changes no production workflow or public site. The owner controls merges and deployment.

## Existing evidence and gaps

| Workstream | State | Scope |
| --- | --- | --- |
| QA-R01 PR #111 | Merged | CI trigger coverage, not deployed-page proof |
| QA-R02 PR #112 | Merged | Stages SHA-scoped _site and runs an actual browser and asset/worker/STL smoke **before** Pages upload |
| QA-R03 PR #115 | Merged | Reproduces old-tab worker 404 and proves a standalone bounded retention helper; **helper is NOT wired to production Pages** |
| PR #90 | Still open, stale historical branch | Startup/recovery candidate with overlapping Pages and version files; do NOT merge directly |
| PR #121 | Merged | Manufacturing repair and CuraEngine evidence; not physical or published old-tab certification |

### Confirmed source-level continuity problem

The current .github/workflows/pages.yml stages only _site/releases/CURRENT_SHA for each upload. An editor tab opened on release A keeps its A-scoped module URLs. After deployment B, it may load a manufacturing worker for the first time and get HTTP 404 because the previous A directory is not in B's Pages artifact.

PR #115's tests/pages-release-continuity-browser.mjs proves this with a browser and includes tests/helpers/retain-pages-releases.mjs, but the live workflow does not invoke the helper. Source-tree or fresh B-tab checks from #112 cannot establish old A-tab safety.

## Proposed production task for the release-QA/Jordan lane

1. Fetch latest main, open PRs and current .github/workflows/pages.yml. Read docs/QA_R03_RELEASE_CONTINUITY.md, the #115 helper/test and staged Pages browser suite from #112.
2. Determine the **last successfully deployed GitHub Pages SHA**, rather than assuming every main commit was successfully deployed. The GitHub Deployments API filtered to the github-pages environment and statuses is one candidate, subject to available permissions, pagination and verification against a real published marker.
3. Before Pages upload, reconstruct immutable release folders for that last successful SHA plus a bounded historical window. Use #115's safe helper, but refuse substituting incompatible Three.js/Manifold vendor versions. Use exact historical assets, or safely decline retention and surface a recovery path.
4. Keep the current checkout and current SHA directory untouched; guard against incomplete historical asset graphs, wrong MIME, broken workers, tree-size blowouts and misidentified SHAs.
5. Add a browser test with an already-open editor A, B deployment, lazy first-time worker startup in A and normal model->Build->Print->STL in new B. Also test A -> failed intermediary X -> successful B: last successful A must still work.
6. Test multiple releases, version changes, and an A tab older than retention. Expired tabs need **save/export-first** notice, not silent reload, private-profile deletion or data overwrite.
7. Preserve #112 staged asset-graph and smoke checks; run exact-head static, fabrication, Chromium, historical-worker and packaged Pages tests. Owner reviews and merges only after all gates pass.
8. After merge, verify the public GitHub Pages deployment separately, with a clean browser and a deliberately older already-open tab. A green CI build is not evidence the public site deployed correctly.

## Old PR #90 is a special review case

PR #90 edits .github/workflows/pages.yml, index.html, package.json, startup recovery and release metadata against an old base. Some of its missing-nested-module issue is already addressed by #112's staged import-graph check. Review selectively for **still-missing diagnostics**, don't overwrite the newer staged QA or the app's later release versions. Do not merge #90 blindly.

## Deployment record provenance

GitHub's REST Deployment API distinguishes deployments from commits; Deployment Status records include success, failure and pending. Treat incomplete or unavailable API history conservatively, and record the last successfully *published* SHA in durable evidence. Historical statuses may age out; keep a verifiable release manifest rather than depending only on past API results.

- https://docs.github.com/en/rest/deployments/deployments
- https://docs.github.com/en/rest/deployments/statuses
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Ownership and non-goals

Assign this release task independently via coordination issue #105, not as an extension of Codex's top-edge geometry PR. It needs production Pages workflow changes in a **new separate draft PR**. It does not require rewriting model creators or reimplementing the already-merged #112 staging checks. Do not auto-merge, publish, or claim physical sign-off.
