# Repository structure and parity/production QA checkpoint — 25 November 2026

Audited base: `6a81f9c55a1d8037080dacc5a66f5a69f828da3b`. Owner requested issue consolidation into implementation PRs, not closure based on cosmetic completion. Track remaining software acceptance from #79 and #10 here; actual physical printing, safety sign-off and owner settings remain external.

## Structural audit (source tree and selected dependency review)
72 root-level JS files, 11 source files under src/, 80 JS/MJS files under tests/. The principal integration hotspots are sensory-studio.js (~218 KB, workspace UI and transaction/renderer coordination), studio-v3.js (~116 KB, classic Crystal engine/editor), fabrication-v1.js (~72 KB), contextual-help-copy.js (~71 KB), hardware-editor.js (~66 KB) and studio-catalogue.js (~50 KB). Sizes are observations, not measures of quality or instructions to split files blindly.

- Authoritative source: studio-documents.js, studio-organisation.js, studio-sync-plan.js, studio-vault.js. Keep identity, canonical fingerprints, prepared-job revision rules and guarded write independent from UI state. Existing resource and cloud contracts belong here through explicit tested migration (#177).
- Geometry: studio-catalogue.js / studio-geometry.js / geometry-v3.js and shared fitting/routing/mounting. The actual Manifold preparation runs in studio-model-worker.js / fabrication-worker.js; STL/3MF and Cura export are distinct from preview. No view-layer dependency may enter the worker graph.
- UI: sensory-studio.js / studio-v3.js currently combine orchestration and rendering; extract cohesive view controllers as real changes warrant, not wholesale rewrites while #158/#169/#174/#175/#176 remain active. Preserve contextual-help registry and avoid competing state ownership.
- CI: existing syntax/import checks, production hardening, native precision, real Chromium, Manifold and export sections. New architecture-boundary test traverses conservative local imports from document/worker/production entrypoints and checks seven-family prepared-job isolation, including stale completion. This is not a complete semantic source audit.

## Evidence reconciliation
The Wave FIT-02 perimeter fixture was already implemented in main; tests/studio-catalogue.test.mjs has Z=40 accepted / Z=49 missing-stock rejection, production subtraction and measured housing containment. WT021_COMPLETION_REGISTER.md records Chromium rollback/reload and independent STL/3MF sections (5.2 mm bore, 11 mm depth, 7.4 mm perimeter and 4.147 mm rear stock). Do not recreate the older task in PROJECT_STATUS.md. Re-run exact-head CI after any geometry changes; physical fit remains unverified.

The existing register still labels DIM-01, FIT-02, FIT-03, PAR-02 and PAR-04 PARTIAL. Do not silently promote. Next evidence: missing original Crystal project/export for DIM-01; additional valid/rejected arbitrary-face/profile and connected route cases; actual selected-object/direct-manipulation persistence and undo; supported Cura export plus installed slicer verification. Reconcile the separate MODEL_BUILDER_PARITY.md historical L/P table with the newer per-fixture evidence. Preserve seven-family and imported-source capability distinctions. Optional advanced multi-select/teacher onboarding/shader/creative presets/xLights/FPP from #79 need owner prioritisation rather than automatic new scope.

## Production assurance
Existing tests/benchmark.mjs already supports opt-in extended loads, so reuse it for targeted bores, vault, sockets, mounts and hollowing. Add repeat/cancel/cache and memory evidence against pinned fixtures and report actual environments; never claim a universal speed guarantee. Check production ZIP, independent STL/3MF sections, migration, failure paths, actual per-family workflows. Maintain print and hardware safety boundaries; physical Cura, retention, cable fit, mounting and optical samples require owner testing (#10).

## Merge gate
This is a QA implementation checkpoint, not a complete parity sign-off. Run new Node boundary test (also imported by production-hardening.test.mjs), full applicable exact-head checks and remaining real fixtures. Keep draft until remaining software scope is represented by passing evidence or explicitly deferred by owner; no automatic merge.
