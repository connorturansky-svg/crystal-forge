# WT-026 developer and Codex handover

**Branch:** feat/wt026-gear-top-controls — implementation draft, owner approval required before merge.
**Reconciled base:** main `cd194706997ae1bd31d1231e0a2ab1870c9064c6`, including #147 project persistence, #151 Library folders, and #157 readable controls. The browser core runs the Gear fixture first and the separate edge-finishing workflow still runs the edge browser coverage.

## Current implementation

- studio-gear-top-controls.js — ten presets, six profiles, five surface textures, bounded independent dimensions, actual lofted positive geometry, validated placement and authoritative full-depth shaft cut.
- studio-catalogue.js — exposes gearHost metadata and attaches configured controls through applyBuildModules for both preview and manufacturing.
- studio-geometry.js — scene picking via gearTopId.
- sensory-studio.js — native Gear Design editor, labels, independent number inputs, add/remove, preset selection, double-click surface placement and pointer drag/invalid rollback using the shared transactional commit and history.
- tests/gear-top-controls.test.mjs, tests/gear-top-manifold.test.mjs, tests/gear-top-browser.test.mjs — unit, real-Manifold export and Chromium paths, added to existing suite entrypoints.
- docs/WT026_GEARS_PLAN.md and WT026_GEARS_USER_GUIDE.md — detailed decisions and user guide.

## Review tasks before declaring merge-ready

1. Run `node tests/gear-top-controls.test.mjs` and `node tests/gear-top-manifold.test.mjs` for placement and connected-solid regressions. Shaft probe, STL and 3MF export run against real prepared Manifold geometry.
2. Use the [PR checks](https://github.com/connorturansky-svg/crystal-forge/pull/158/checks) for the current commit's static, fabrication, Chromium, profile, precision and edge results.
3. Check Manifold in unusual Gear outlines, openwork, dual-material and rounded/diamond profiles. Any nonmanifold, inverted/degenerate triangles or broken bore must fail, not be hidden behind a preview.
4. Check drag pointer capture/release, top-view/ISO double-click, invalid-hole feedback, cancellation rollback, keyboard-only use and 390 px/200% zoom.
5. Verify physical intersections against manual mount recesses, pixel seats, serial tracks and raised gear geometry. Current surface eligibility is deliberately limited; improve fail-closed behaviour rather than guessing safe surfaces.
6. Verify saved JSON, history, reload, duplication and print-job invalidation using stable IDs.
7. Coordinate the two WT-024 help toggles: add concise hover/focus notes and detailed What/Why/When inline descriptions for all new grip settings through shared help infrastructure **after** its PR lands. Do not introduce a competing global description switch. The grip editor already includes a persistent plain-language explanation.
8. Reconcile changelog, generated in-app What’s New/version and update feature-search metadata. Preserve PR #157 legibility work on rebase.
9. Report exact PR head SHA, successful/failed commands, CI URLs, screenshots, saved geometry exports and physical uncertainty to owner. **Never merge** without owner's approval.

## Deferred features

- General composition of a separately saved Control Cap model with the Gear; requires source and negative-feature ownership and revision-pinned copies.
- Independently spinning crank handle and bearings/fasteners.
- Any arbitrary face/height, automatic multi-object top mate, general fillet selection for imported meshes.
- Fully connected detailed hover/inline help (WT-024 concurrent dependency) and physical torque certification.

**Avoid broad refactoring:** focus on clean functional slice and preservation of seven model families. Maintain source model editability and protect the original measured through-bore.
