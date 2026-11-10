# Architecture — implementation as inspected (10 November 2026)

This document describes the current **tracked source** on the audited main branch, not an imagined future architecture. Source files are plain browser ESM; the older `app.js` is not referenced by the live page.

## File map

| File | Role |
| --- | --- |
| `index.html` | Three-workspace HTML UI, colour-coded CSS, settings inputs, Help, What's new and ES module bootstrap |
| `studio-v3.js` | Application state, persistence, Three.js scene, camera/orbit/gizmo, preview models, selections, Build/Print controls, worker lifecycle, reports and downloads |
| `geometry-v3.js` | Deterministic seeded formations, five lean modes, six shape families, custom crystal rings/tips, outline and dome/edge base geometry |
| `hardware-layout.js` | Polygon containment/clearances; automatic/manual LED and mount candidate placement; returns accepted holes, invalid placements and warnings |
| `hardware-editor.js` | Build-stage yellow/purple/red guides, manual click-to-place and numerical X/Z editing; calls planner |
| `fabrication-v1.js` | Manifold conversions and Boolean union, optional inward-eroded full hollowing or vaulted underside, real bores, open cavity checks, overhang/fit/orientation report and STL/3MF |
| `fabrication-worker.js` | Web Worker reconstruction of received component meshes, loads Manifold WASM, executes `prepareFabrication`, transfers results and report to UI |
| `app.js` | Earlier experimental standalone editor, **not loaded by `index.html`** |
| `tests/fabrication.test.mjs` | Node + Three.js + Manifold tests for topology, connectedness, modes, placement, vault, holes, orientation, STL and 3MF |
| `tests/browser-smoke.mjs` | Playwright Chromium UI/viewport/localStorage/preparation/download smoke test |
| `.github/workflows/pages.yml` | Deploys repo to GitHub Pages **on push to main** |
| `.github/workflows/fabrication-tests.yml`, `browser-tests.yml` | Existing GitHub Actions verification |
| `qa/latest-*.log` | Last published logs; check commit SHA because they may predate HEAD |

## Runtime dependency model

The page uses an import map loading **Three.js 0.165.0** and addons from jsDelivr. The worker imports browser Three.js from a CDN. The manufacturing module dynamically loads **Manifold 3D 3.5.4** WASM from jsDelivr. Node devDependencies (`package.json`): `three` 0.165.0, `manifold-3d` 3.5.4 and `playwright` 1.65.0. There is no application transpilation/bundler build step; GitHub Pages serves static files.

The browser requires WebGL for Three.js, and network access for CDN modules. A local `python3 -m http.server 4321` is sufficient for development; opening `index.html` directly with file:// is not a reliable substitute for a web server.

## Core data flow

`Saved JSON/localStorage → settings (s) + crystals[] → generateFormation()`

For each crystal, `crystalGeometry()` emits low-poly mesh triangles, `makeCrystal()` applies per-object position/rotation/scale and base offset. `baseGeometry()` constructs the shared root. These **preview objects can intersect and are not Boolean-manufactured**. Selection/transform controls update crystal records and call rebuild/invalidation.

`Build` uses the same crystal/settings data to call `planHardware()` (not separate planner logic). `hardware-editor.js` draws live guides; manual values are stored in settings and are checked against the base outline and other bores. Invalid positions are excluded and warned.

`Print → Prepare print mesh`:

1. `studio-v3.js` computes a source signature from geometry/fabrication-relevant settings and crystal transforms; unchanged prepared data may be reused.
2. It copies the currently modeled component vertex attributes, transforms and labels to a module Web Worker (transferred arrays), keeping the UI responsive. Editing relevant settings must invalidate the cached prepared mesh.
3. `fabrication-worker.js` reconstructs Three.js meshes, initializes Manifold and invokes `prepareFabrication()`.
4. `fabrication-v1.js` converts components to manifold solids and Boolean-unions them. In the default case it keeps the exterior solid; alternative modes can carve a physically open vaulted base or run the slower experimental whole-cluster hollowing.
5. It uses `planHardware()` to cut accepted LED sockets and mounting bores. For vaulted bases the implementation adds LED collar side windows. It then checks positive material components, internal negative-volume shells, overhang triangles, build bounds and report warnings. This is **topology/heuristic screening**, not optical-flow simulation or FDM slice verification.
6. The worker transfers an unindexed prepared surface and indexed report geometry to the main thread. The user may inspect the prepared manufacturing mesh separately from the lightweight editable preview.
7. `saveSTL()` / `save3MF()` produce downloadable files with slicer **Z-up** conversion. `splitPreparedMesh()` is an experimental cut-plane workflow; alignment keys are not yet generated.

## Coordinate frames and recurring pitfalls

- Three.js preview is **Y-up**; slicers expect **Z-up**. Do not change the exports without checking orientation, bed contact and triangle counts.
- Individual crystals have independent facet rotation. Their lean directions must be transformed so **one-way and radial presets agree in WORLD coordinates**. Earlier code used local lean directly and produced visibly inconsistent directions.
- Camera `OrbitControls` target must match the actual formation centre through regeneration, pan and view changes; DOM/canvas CSS dimensions must match camera aspect even at high DPR.
- Base surface height depends on outline, dome height and shoulder fillet; crystal roots are seated relative to this height. Do not assume a flat base when placing LEDs or carving channels.
- A visible pixel marker is **not** itself a manufacturing bore. A valid planned bore is not automatically a verified light path; a 0% Cura infill setting can still produce solid skins between crystals.
- Static preview material effects (glow, even studio light, floating view) are not physically calibrated photometry.

## State, compatibility and deployment

The app autosaves JSON under the browser key `crystal-forge-v3`; portable project JSON includes `settings` and `crystals`. Existing documents may contain earlier hollowing preferences; migration and defaults must preserve user edits. Appearance theme is independently remembered. Simple/Advanced only changes presented controls.

Version text and the in-app changelog live in `index.html`, while `CHANGELOG.md` tracks releases. Both are manually updated. GitHub Pages publishes **only main** via `.github/workflows/pages.yml`; keeping a feature branch unmerged keeps it off production. Browser CI may commit its log back to main after an eligible main push, so the very latest main SHA can be an automated log commit.

## Architectural hazards / planned improvements

The unbundled ESM architecture is simple but CDN availability matters. Geometry/fabrication can be computationally expensive. Tests currently cover representative configurations rather than all slider combinations or physical printing. UI status/warnings must expose what has and has not been checked. Future changes should add testability at boundaries rather than rewrite the entire app merely to introduce a test runner.
