# QA-R04 Pages historical release retention — implementation and limits

**Status:** draft PR #124; no merge/deployment approved. This follows merged QA-R02 #112 (staged browser gate) and QA-R03 #115 (old tab worker failure and proof helper).

## The actual loss scenario

- Editor A loads from a root index with `<base href="./releases/A/">`. Browser has not yet started its manufacturing Worker.
- Deployment B replaces GitHub Pages' published artifact with root index B and only `releases/B/`.
- Still-open A requests `releases/A/fabrication-worker.js` and receives a 404; source checkout smoke for B does not detect it.
- R04 prepares the new B artifact with the **last successfully deployed A** and a bounded recent history, retaining their immutable module directories.

## How this implementation works

`scripts/pages-retain-deployed.mjs` reads GitHub's `github-pages` environment deployment history via REST (deployments and statuses). Failed/pending deployments do **not** count. A previously successful deployment may later have an `inactive` status; older `success` in its status history still proves it deployed. The candidate SHA must exist locally and be an ancestor of the staged revision.

The script combines the last actual successful ancestor with up to **three recent first-parent commits**. Existing `tests/helpers/retain-pages-releases.mjs` reconstructs each previous root JS/CSS and nested `svg-import/` from that exact Git commit, copies same-version vendored Three.js and Manifold assets, and refuses incompatible vendor versions rather than substituting different code. It never overwrites a SHA directory.

When the API cannot be queried, the latest deployment SHA is unknown; a warning appears and the script uses its bounded Git window only. This is *degraded retention*, not proof the last deployed site survives. GitHub deployments read permission is scoped to the Pages build job. The test requires the merged #115 helper, not a new third implementation.

`tests/pages-retained-stage.test.mjs` verifies the staged previous SHA trees, worker file presence, vendor WASM and every literal first-party static ESM import before Pages upload. `tests/pages-retained-real-browser.mjs` (also included) takes an **actual historical index.html** from an earlier SHA, supplies its historical base URI without modifying the uploaded `_site`, leaves that A tab open while opening current B and then performs genuine Tile manufacturing and downloaded STL from both versions. Worker requests must target their own immutable A/B folders.

## Acceptance and owner review

- [x] Initial draft [Pages run #44844601114](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44844601114) identified last actual Pages success `9f792e1`, staged three old releases, checked 224 JS assets and passed the existing packaged B Chromium model-to-STL smoke. Deployment was skipped on PR as expected.
- [ ] Review the real historical A + current B staged browser job against the **latest PR head**.
- [ ] Review latest-head static, Manifold/fabrication, browser, seven-builder finishing and Pages workflows.
- [ ] Review artifact size increases. Four Manifold/vendor module trees consume more storage; consider a smaller bounded window if required, **without** assuming every commit actually deployed.
- [ ] Owner reviews and merges; independently test a **live** old tab before/after the next real Pages deployment. Staged success is not a public deployment certificate.
- [ ] Explicit save-first update UX remains outside this draft for tabs older than the retention horizon. Never clear local projects, profiles or private credentials.

### Critical stop conditions

If the old successful release cannot be reconstructed with compatible dependencies, the build currently fails *before* upload rather than deploying an artifact that falsely claims to preserve it. This may intentionally block a release after upgrading the vendor versions; create an approved migration/recovery path then, rather than quietly replacing historical libraries with incompatible ones. If deployment history is not accessible, a warning is recorded; only the bounded recent first-parent history is retained, and owner must assess the old-tab risk.

## API references

- [GitHub deployments API](https://docs.github.com/en/rest/deployments/deployments) — list deployments filtered by environment.
- [GitHub deployment statuses API](https://docs.github.com/en/rest/deployments/statuses) — success/failure and history (older statuses may eventually expire).
- [actions/deploy-pages](https://github.com/actions/deploy-pages) — separate build/upload and Pages deployment, `github-pages` environment.

Related coordination: issue #105; release operations: #33. Do not conflate startup watchdog #90, historical retention #124 and new geometry QA #122. These solve different classes of failure.
