# Source layout — find the right code without opening every root file

**Status:** staged refactor, 23 November 2026. This file describes the layout *after the first printing-source move in this PR*. Verify the GitHub branch before relying on the paths. The migration is not live until reviewed and merged. [Repository map](REPOSITORY_MAP.md) retains the full feature-to-source crosswalk.

## One-minute orientation

| I want to… | Start here |
|---|---|
| Use Crystal Forge | [Live browser app](https://connorturansky-svg.github.io/crystal-forge/) |
| Find a feature or current work | [README](../README.md), [project status](PROJECT_STATUS.md), [open PRs](https://github.com/connorturansky-svg/crystal-forge/pulls) |
| Understand code responsibilities | This document → [repository map](REPOSITORY_MAP.md) → affected files only |
| Edit the app or workspace UI | `index.html`, `studio-v3.js` (Crystal entry), `sensory-studio.js` (Studio entry), `sensory-studio.css` |
| Understand actual printable geometry | `fabrication-v1.js`, `studio-geometry.js`, `studio-material-export.js`, `fabrication-worker.js`, `studio-model-worker.js` |
| Inspect production-pack, printer-fit or optical reporting | [`src/printing/`](../src/printing/) |
| Understand library, backup or profiles | `studio-documents.js`, `studio-organisation.js`, `studio-sync-plan.js`, `studio-vault.js`, [WT-023 handover](WT023_NEXT_SLICES_ACCEPTANCE_20261123.md) |
| Add a focused regression | [`tests/`](../tests/), [testing guide](TESTING.md), [workflows](../.github/workflows/) |
| Find owner/agent instructions | [`AGENTS.md`](../AGENTS.md) → [AI handover](AI_HANDOVER.md) |

## Current / intended tree

```text
crystal-forge/
├── index.html                   GitHub Pages' entry document (stays in root)
├── studio-v3.js                 Crystal bootstrap (kept stable in wave 1)
├── sensory-studio.js            Studio shell/editor (kept stable in wave 1)
├── fabrication-worker.js        Root worker URL, keep until worker URL audit
├── studio-model-worker.js       Root worker URL, keep until worker URL audit
├── *.js                         Other legacy source, migrated in later waves
├── src/
│   └── printing/               MOVED IN WAVE 1
│       ├── bed-split.js         Conservative bed-size split planner
│       ├── split-joints.js      Conservative manual registration planner
│       ├── print-advisor.js     Roof/printability estimates
│       ├── print-quality.js     Print checklist / risk assessment
│       ├── optical-audit.js     Prepared light-passage audit
│       ├── cura-model-advisor.js Machine/nozzle advice
│       └── production-pack.js   Printable ZIP, instructions and reports
├── svg-import/                  Existing source importer package
├── tests/                       Existing test entry points and helpers
├── docs/
│   ├── history/                 Historical handovers
│   └── qa/                      QA evidence/specifications
├── scripts/                     Maintainer/release utilities
├── prompts/                     Current and archived agent prompts
└── .github/                     Workflows, templates, contributor controls
```

**Why the root is not empty yet:** this is a static, unbundled ES-module app. Moving a source file changes its relative import base and—in SHA-scoped GitHub Pages releases—the path used to package/retain historic modules. The current WT-023 project persistence/Library/cloud PRs and WT-026 Gear PR also edit central files. Do not duplicate them or perform a mass move while they are under review.

### Planned subsequent waves (not part of the first PR)

1. **Printing helpers, wave 1 (this PR):** move only seven stable helper modules. Keep `cura-profiles.js` at root because `sensory-studio.js` is in the active WT-023 integration lane. Adjust direct imports and tests, extend the SHA-scoped Pages packager and previous-release reconstruction. No logic or data schema changes.
2. **Fabrication + model geometry:** `src/geometry/` and `src/builders/` once ongoing WT-026/WT-019 geometry branches reconcile. Preserve Manifold, worker and actual prepared STL/3MF behaviour. No arbitrary reorganization of `studio-geometry.js` while its print contract is changing.
3. **Pixels, routing and mounting:** `src/hardware/pixels/`, `src/hardware/wiring/`, `src/hardware/mounting/` with all-seven interaction, face normal, measured profile and export tests.
4. **Projects and cloud:** `src/library/` only after #147/#151/#148 have been merged or safely superseded; preserve stable model/snapshot ID and vault hashes, migration and rollback.
5. **Controls and navigation:** `src/ui/` after WT-024/025 ownership is clear; preserve focus/zoom, semantic help IDs, tool registry, accessible labels and UI state.
6. **Entrypoints/workers last:** `src/app/` only when the Pages base URL, import map, `new URL(..., import.meta.url)`, worker URLs and older tab retention tests demonstrate this is safe. Keeping two small root entrypoint files is acceptable if moving them makes packaging fragile.

### Naming and scope rules

- Use **feature-first names**: `src/printing/`, not a generic `src/misc/` or dozens of one-file directories.
- Keep coherent files together; avoid renaming public exported symbols as part of a path-only PR. Don't create root re-export shims for every move: they keep the root clutter and may accidentally double-load a module.
- Use explicit relative `.js` imports; for a file at `src/printing/name.js`, importing a still-root module requires `../../root-file.js`. Standard ES module URLs resolve **relative to the importing module**, not the root HTML file.
- Keep `index.html` at root for current Pages entry. The production Pages artifact runs at `releases/<commit-sha>/`, while older browser tabs may still import from an older SHA: **both** must include all corresponding folders.
- Avoid changing stored project JSON, model-generator IDs, snapshot IDs, pixel-profile pins or job revisions for a file-layout cleanup.
- Do not alter `LICENSE`, contributor history or committed test artifacts to make the root prettier. Historical `prompts/` and `docs/history/` are preserved for traceability.

### Required migration gate for every wave

1. Fetch the **current** main SHA, open PRs and file ownership; choose non-overlapping modules.
2. Collect **all inbound imports**, tests, static scanners, HTML/bootstrap URLs, worker construction, import-map values, Pages stage/retain files, and public documentation references.
3. Move only the selected files and rewrite affected paths in one atomic commit. The diff should show **near-identical source bodies** (imports adjusted only), not a simultaneous refactor.
4. Run focused Node checks, exact-head repository static/release metadata, full Chromium, Manifold/STL/3MF, seven-builder edge and **staged GitHub Pages packaging plus old/current tab smoke**. A cancelled or skipped substantive CI job is not proof of regression-free migration.
5. Validate the staged release actually serves moved scripts over HTTP without 404s and its retained predecessor continues to load its historical JS/worker paths. Link CI artifacts in the PR before requesting owner merge.
6. Update this source map, README, relevant agent guides and release notes; preserve the old PR/code breadcrumbs in Git history, not duplicate placeholder shims.

**Stop conditions:** stop if a move alters the live app's URL identity without the matching versioned Pages release, silently drops a saved workspace, causes a 404, breaks a worker, or makes previous-SHA tab reconstruction incomplete. The owner approves merges and deployment; nobody should equate clean folder layout with proven printable output.

### What was audited before wave 1

The audited main after #157 was `b18ff81ee954a2dbb3a257e313b9d1d7354280d5`: **293 tracked files and 77 root JavaScript files**, with tests and docs already in their own folders. The seven targeted printing helper modules have no worker URL constructors; the affected root importers are `studio-v3.js` and `fabrication-v1.js`, plus the existing tests. The current Pages staging copied only root JavaScript and `svg-import`; historical reconstruction also required a nested-source copy. These are implementation risks addressed in the same first PR, not left as follow-up TODOs.
