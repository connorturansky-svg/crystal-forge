# Repository structure and parity/production QA checkpoint — 25 November 2026

Audited base: `6a81f9c55a1d8037080dacc5a66f5a69f828da3b`. Owner requested issue consolidation into implementation PRs, not closure based on cosmetic completion. Track remaining software acceptance from #79 and #10 here; actual physical printing, safety sign-off and owner settings remain external.

## Phase E delivery evidence — 28 November 2026

The owner merged #176 before this branch was reconciled. Base `890326f` includes the viewport appearance and inspection work. The software candidate is v0.16.0-dev.35.55.

| Gate | Evidence |
| --- | --- |
| Prepared downloads and pack | `tests/phase-e-production-browser.mjs` queues each builder and uses the real Manifold worker. It decodes downloaded STL and 3MF bounds, compares both against the manifest, checks the packed mesh, editable revision, parts list and instructions, and checks cache reuse when revisiting the Print Centre. |
| Wiring in the pack | The integrated routed and blocked browser witnesses check that the pack reflects prepared route metadata. The Manifold catalogue witnesses check that a prepared route produces the matching CSV rows. Only validated route data enters the pack. |
| Job lifecycle | The focused browser test cancels a worker during startup, verifies disabled exports, then prepares and exports with a real replacement worker. The document boundary fixture continues to reject an obsolete completion and preserves unrelated jobs. |
| Migration | The versioned Crystal v3 fixture preserves the original bytes, backup, measured orientation and black, and round-trips the migrated Studio document. |
| Performance | Run the extended benchmark with `CRYSTAL_FORGE_BENCH_EXTENDED=1`. The benchmark logs 10, 16, 40 and 60 crystals for solid and vaulted fixtures, targeted bores, multiple sockets/mounts, balloon hollowing and repeated preparation. RSS delta is a coarse process measurement; it is neither peak heap usage nor proof of leak absence. |

The ten-Crystal targeted-bore fixture reproduced two sealed cavities. Preparation now fills inaccessible cavities before final-mesh inspection. The regression requires zero residual sealed cavities and reports only inspected clear targeted paths as accepted after cleanup.

The [completion register](WT021_COMPLETION_REGISTER.md) records the broader per-tool evidence and remaining exceptions. DIM-01 still lacks the original owner project/export. FIT-03 and PAR-02 retain their unsupported or uncovered combinations. Real Cura installation and print checks remain in the [physical acceptance register](PHYSICAL_PRODUCTION_ACCEPTANCE.md).

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
