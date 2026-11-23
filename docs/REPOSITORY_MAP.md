# Repository map — start here before opening 100 files

**Latest orientation (22 Nov 2026):** main `dddb172a26b5d9e2b70df607951f938069b62ab3` includes merged #135 Wave and #136 Support-Free Shoulders search. Current owner-approved software milestone is [WT-023 Library/cloud #137](https://github.com/connorturansky-svg/crystal-forge/issues/137), starting with [WT-023A data identities #138](https://github.com/connorturansky-svg/crystal-forge/issues/138). [Minimal Codex entrypoint](WT023_CODEX_FAST_START.md), [architecture planning draft #144](https://github.com/connorturansky-svg/crystal-forge/pull/144) and [test-only prework draft #146](https://github.com/connorturansky-svg/crystal-forge/pull/146) are the relevant starting points. Old WT-021 and early WT-022 paragraphs are historical. Recheck GitHub current main and active PRs before coding.

## For a human opening the repository

| Want to… | Start here |
| --- | --- |
| Run the current Studio | [GitHub Pages app](https://connorturansky-svg.github.io/crystal-forge/) |
| See what's being developed | [Current work](PROJECT_STATUS.md), [WT-023 #137](https://github.com/connorturansky-svg/crystal-forge/issues/137), [open PRs](https://github.com/connorturansky-svg/crystal-forge/pulls) |
| Understand the seven model families | [Project vision](PROJECT_VISION.md), [features](FEATURE_SPECIFICATIONS.md), [parity matrix](MODEL_BUILDER_PARITY.md) |
| Find the correct editor control | In the app, use the workspace currently deployed; Pixels/Wiring/Mounting navigation is live on `main` from merged #132; global phrase search is now on `main` via merged #134 |
| Prepare an STL/3MF print | [Testing & physical QA](TESTING.md), [Cura guidance](CURA_PROFILE_GENERATOR.md), [physical #10](https://github.com/connorturansky-svg/crystal-forge/issues/10) |
| Contribute safely | [AGENTS.md](../AGENTS.md), [CONTRIBUTING.md](../CONTRIBUTING.md), [CI checks](https://github.com/connorturansky-svg/crystal-forge/actions) |
| Read older milestones | [History index](history/README.md), [Prompt archive](../prompts/archive/README.md), [Changelog](../CHANGELOG.md) |

## For Codex / developers: source ownership

| Concern | Primary code and contract |
| --- | --- |
| App entry and layout | `index.html`, `studio-v3.js`, `sensory-studio.js`, `sensory-studio.css` |
| Seven family definitions/recipes | `studio-generator-registry.js`, `studio-catalogue.js`, `studio-geometry.js`, `tactile-tile-generator.js`, `geometry-v3.js` |
| Crystal preview, transforms and hardware | `geometry-v3.js`, `hardware-layout.js`, `hardware-editor.js` |
| Native fittings, mounts and physical validation | `studio-pixel-builder.js`, `studio-mount-builder.js`, `studio-pixel-bore-validation.js`, `studio-profile-safety.js` |
| WT-022 grouped line/radial/grid mounts | `mounting-pattern.js`, `mounting-pattern-editor.js`, `mounting-pattern-viewport.js`, `tests/mounting-pattern*.mjs` |
| Cabling and print fit | `wire-routing.js`, `pixel-string-routing.js`, `studio-native-routing.js`, `pixel-spacing-snap.js`, `studio-pixel-fit.js` |
| Real manufacturing, not just preview | `fabrication-v1.js`, `fabrication-worker.js`, `studio-model-worker.js`, `studio-material-export.js`, `studio-edge-finish.js` |
| Library, saved state and recovery | `studio-documents.js`, `studio-organisation.js`, `studio-sync-plan.js`, `studio-vault.js`, `studio-migration.js`, `github-vault.js` (legacy Crystal), [backup guidance](BACKUP_RECOVERY.md), [WT-023 fast start](WT023_CODEX_FAST_START.md) |
| Find-a-tool search | `studio-tool-finder.js`, `sensory-studio.js`; full tool registry/matcher in `studio-tool-registry.js` and `studio-tool-search-core.js` from #133, now in `main` via merged #134 |
| Print export settings/Cura | `cura-profiles.js`, `production-pack.js`, `studio-material-export.js`, `tests/cura-profiles.test.mjs` |

**Important invariant:** the interactive preview meshes are not automatically the connected Manifold-produced printable part. Validate actual exported STL/3MF sections and physical print separately. Existing browser actions and state can change between workspaces; do not create new model build stages just to display new tabs.

## How to test without duplicating work

| Scope | Existing entrypoint |
| --- | --- |
| Static and release metadata | `npm run test:static`, `tests/release-metadata.mjs`, `.github/workflows/static-checks.yml` |
| Real fabrication & STL/3MF | `npm test`, `tests/mounting-pattern-manifold.test.mjs`, `.github/workflows/fabrication-tests.yml` |
| Main browser integration | `npm run test:browser`, `tests/browser-smoke.mjs`, `tests/unified-studio-browser.test.mjs`, `.github/workflows/browser-tests.yml` |
| WT-022 mounting geometries and UI | `tests/mounting-pattern.test.mjs`, `tests/mounting-pattern-browser.mjs`, `tests/mounting-pattern-manifold.test.mjs` |
| B navigation regression | `tests/studio-workspaces-browser.mjs`, deployed from #132; check latest exact-head CI |
| C search acceptance | [Merged #134](https://github.com/connorturansky-svg/crystal-forge/pull/134): `tests/studio-tool-search-core.test.mjs` and `tests/studio-tool-search-browser.mjs` passed; #129 is closed. Keep the narrower Support-Free Shoulders alias under #127 |
| Pages deployment/retention | `.github/workflows/pages.yml`, `tests/pages-*.mjs`, `docs/QA_R04_IMPLEMENTATION.md` |

Only call a check **passed** when it actually executed on the exact branch/PR SHA. Avoid repetitive full long tests for every draft checkpoint; use targeted tests for local iteration, then full gates on a reviewable final head. Check workflows' existing concurrency/cancellation and release metadata policy before editing CI.

## Documentation: what's current versus historic

- Current owner-approved Library/cloud milestone: [WT-023 #137](https://github.com/connorturansky-svg/crystal-forge/issues/137), first task [#138](https://github.com/connorturansky-svg/crystal-forge/issues/138); WT-022 #127 is prior navigation/search scope.
- Engineering constraints: [AGENTS.md](../AGENTS.md), [architecture](ARCHITECTURE.md), [testing](TESTING.md).
- Former WT-021 specifics: `docs/WT021_*.md`, `prompts/START_HERE.md` and `prompts/active/WT021_*.md`: retain for provenance, but treat dated instructions as historical.
- Long chronology: [AI handover](AI_HANDOVER.md), [roadmap](ROADMAP.md), [development history](DEVELOPMENT_HISTORY.md); do not restart superseded branches on the basis of these records.
- Old independent PRs #37, #42, #90 and #101 remain review/owner-decision items, not something a new agent should merge to 'clean up' without comparison and explicit approval.
