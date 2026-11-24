# WT-019 · Seven-builder evidence gates and next implementation slices

**Type:** source-grounded research and acceptance plan; **not** a feature release or a claim of current passing behaviour.  
**Audit baseline:** `main` at `0e38435904970f952deeab8abacfd9725d385184`, 23 November 2026. Re-fetch current `main` and PR statuses before beginning implementation.  
**Owner:** [WT-019 issue #79](https://github.com/connorturansky-svg/crystal-forge/issues/79). Physical-fit results and sign-off: [#10](https://github.com/connorturansky-svg/crystal-forge/issues/10).  
**Earlier register:** [MODEL_BUILDER_PARITY.md](MODEL_BUILDER_PARITY.md). Preserve its historical evidence rather than replacing it with an untested "all complete" table.

## Purpose and evidence discipline

The user-observed **openwork Gear with P1–P4** remains a concrete interaction/route usability regression to reproduce. Existing engineering has already introduced placement, mounting, orientation, routing, prepared-mesh inspection and browser checks; independently passing subtests do **not** mean every family has an end-to-end journey. Start with a reproducible measurement matrix and fix only failures that still exist on the exact current head.

**Status labels:** `P` = real browser action **and** saved/reloaded project **and**, where manufacturing is relevant, prepared Manifold geometry plus independently checked downloaded STL/3MF; `L` = implemented in part or lacks a combined proof; `M` = reproducibly absent; `B` = intentionally refused on demonstrably unsupported geometry, with a meaningful reason and workaround; `N/A` = not meaningful. A test name or PR title alone is not proof.

An evidence row records: `family | operation | accepted/rejected fixture | browser gesture | resulting project/model/job IDs and revisions | preview result | Manifold positive/negative geometry | STL/3MF measured result | exact-head workflow URL | limitations | physical trial ID`. `P` is **software evidence**, not a measured fit, thermal or structural certification. A `B` can be correct behaviour, not a parity defect.

## What the existing source establishes — *not* a new runtime test

- `sensory-studio.js` is the unified interaction entry point and owns `renderTabs`, `add`, model switching, pixels/mounts and `renderLibraryCards`; it operates alongside the Crystal adapter. It is already heavily edited by active WT-023 and WT-026 branches: do not broad-refactor it for a generic parity sweep.
- `studio-geometry.js::previewRecipe` draws physical positive parts, visual pixel rings/ports and native route guide elements. These are **preview objects**; prepared geometry comes through the Manifold pipeline (`studio-model-worker.js`, `studio-geometry.js::prepareRecipe`, `fabrication-v1.js`, `studio-material-export.js`). A visible line must not be misreported as a cut route.
- `studio-pixel-builder.js::checkedPixelBore` and `studio-native-routing.js` are reusable native validators and planners. Some profiles/sockets have geometry-specific exclusions; never bypass those just for uniform controls.
- `studio-documents.js` pins the model revision to each print job, has `modelFingerprint`, keeps project-local model/tab/job IDs and stales jobs when edited. Old project archives and the #147 transactional-switch work must not be damaged by a geometry fix.
- `tests/studio-workspaces-browser.mjs` exercises all seven built-in families through eight workspace navigation states and a **real Gear mounting edit that survives full reload**. It does not prove every family has real pixel/mount/route exports. #150 adds cross-builder data-preservation regressions; review rather than duplicate those.
- The long [MODEL_BUILDER_PARITY.md](MODEL_BUILDER_PARITY.md) describes many `L` entries and dated WT-018/WT-020 candidate history. Treat them as a preflight list, not current delivered-feature certification. #135/#136 have since merged; reassess outdated "draft" descriptions.

### Baseline matrix: verification *required*, not claimed as passed

| Built-in family | Actual physical-face pixel placement | Direct M1..Mn mounting | Wiring guide vs cut | Save/reopen + Print STL/3MF | Special negative case |
|---|---|---|---|---|---|
| Crystal Clusters | Recheck Crystal adapter independently | Recheck existing hardware editor | Distinguish Crystal planner and cutters | Recheck combined path | Thin/outward tip, hollow/vaulted |
| Tactile Tiles | Existing representative browser evidence, full journey still to prove | Existing positive tab fixture | Eligible solid backing vs refused void | Recheck combined path | Dual-material backing incompatibility |
| Cogs & Gears | **Owner's P1–P4 regression**, highest priority | Verify top/bottom raycast and matching bore | Solid route guide + openwork refusal | Verify real M1 bore and serial paths | Openwork and rotating shaft |
| Waves | Known sloped Wave and near-edge repair evidence | Verify independent mount | Curved line vs real cutter | Check near-perimeter positive/negative exports | Surface/perimeter breakthrough |
| Control Caps | Source supports family-specific controls | Stationary stock only | Shaft cavity must not be cut | Recheck combined path | Moving shaft / hollow cap |
| Characters | Source supports native recipe | Eligible backed region only | Verify path/material availability | Recheck combined path | Thin limbs and nonplanar faces |
| Pebbles / Light Pods | Source supports native recipe | Solid regions only | Avoid illuminated cavities | Recheck combined path | Hollow or optical chamber |

Do **not** mark an entire family `P` on the basis of this table. The first task is to fill evidence cells from the *actual current* CI and fresh browser/Manifold runs, recording failures rather than hiding them. Imported SVG/STL/OBJ are separate compatibility fixtures, not an eighth built-in procedural family.

## Highest-value reusable acceptance fixtures

These are **proposed deterministic test identifiers**, not assertions that the tests already exist.

| Fixture | Setup and action | Required observation / rejection |
|---|---|---|
| `W19-G-OPEN-P4` | Openwork blue Gear, four pixels P1–P4. Real top/bottom camera gestures; double-click solid, void and P marker; automatic vs manual Add. | Manual Place sticks to selected *supported* surface/entry side; click on void does nothing; P marker selects rather than duplicates; guide shows P1→Pn with IN/OUT/arrows even when Cut off; unsupported channel gives explicit lack-of-stock reason; saved rejected operation leaves original revision intact. |
| `W19-G-SOLID` | Solid decorative Gear with valid manual P and M on top and underside, short routed links. | Real positive stock, negative bores and route cutters agree with markers and direction; completed STL and 3MF section dimensions; no shaft/collar intrusion. |
| `W19-T-SOLID` | Flat Tile with one pixel, one M1 and an eligible routed channel; toggle Show wiring and Cut separately. | Guide toggle does not add manufacturing negatives; cut toggle changes actual prepared geometry only when allowed; reload retains face/IDs/ordering. |
| `W19-W-SLOPE` | Measured 11 mm sloped Wave socket near perimeter; compare supported location to invalid breakthrough. | Supported 5.2 mm bore and recorded stock/entry dimensions remain consistent in STL/3MF; invalid location refuses without persisting or replacing a prepared job. Reuse #135 test evidence and exact profile, do not recreate variant numbers. |
| `W19-K-SHAFT` | Control Cap with stationary backing then shaft collision. | Supported stock can take fitting; moving shaft cavity refuses clearly, no false machineable route. |
| `W19-H-THIN` | Character model with supported torso and intentionally thin appendage. | Valid stock can accept appropriate hole; thin feature refuses, preserving all existing hardware. |
| `W19-P-HOLLOW` | Pod with solid backing vs illuminated cavity. | Valid backing permits physically validated cutter; cavity/optical interference refuses without corrupting material partition. |
| `W19-C-CRYSTAL` | Crystal sample with real adapter pixel/mount, relevant depth and routing; save and prepare. | State, preview and real cut match; camera rotation and inspector cannot mask invalid exit or roof. |
| `W19-IMPORT` | Controlled SVG and STL/OBJ source; attempt only supported operations. | Preserve original imported source/transforms and give explicit unavailable reason for unsupported triangulated mesh edits. |

## Exact interaction and geometry checks

1. **Viewport gesture:** pointer single-click selects; double-click blank *solid* offers Add pixel / Add mount / Cancel; existing marker double-click edits/selects; not on void or unsupported face. Include sustained drag, ghost, confirmation, Escape and failure rollback.
2. **Orientation:** record hit object, world/local location, normal, installation side and eventual cutter orientation. Inspect top, bottom, ISO and camera orbit *after* placement. Reject unsupported normals; never flip entry side silently.
3. **Consistency:** stable Pn/Mn IDs, ordered P1→Pn including reversed order, EDGE IN/OUT, arrowheads, bend/length budget, overlength warning and explainable routing refusal. Separate "Show wiring" from "Cut cable channels".
4. **State:** compare models, tabs, IDs, project IDs, source Library revisions, calibrated profiles, snapshots and print-job source revisions before/after edit, undo, reload, duplicate/linked copy, open and failed attempt. Check a rejected edit doesn't write project JSON or stale the previous job.
5. **Fabrication:** inspect *actual downloaded* STL and 3MF on the same prepared model revision; compare connected solids, minimum webs, bore entry, bend radius, collision clearance and section dimensions. A preview mesh alone is insufficient.
6. **Accessibility:** mouse, Tab/Enter/Space/Escape and touch-accessible fallback; 390px and 200% zoom; both themes; plain-language explanations, including why a blocked operation is blocked.
7. **QA records:** capture exact Git SHA, workflow run URL and screenshot/export artifacts. Separate actual executed checks from queued, cancelled or skipped workflows.

## Use existing tests first

- `tests/unified-studio-browser.test.mjs` and `tests/browser-smoke.mjs` for real user paths.
- `tests/studio-workspaces-browser.mjs` for workspace navigation, real Gear mounting and durable reload.
- `tests/mounting-pattern-browser.mjs`, `tests/mounting-pattern-manifold.test.mjs` and `tests/mounting-pattern.test.mjs` for line/ring/grid and direct mount geometry.
- `tests/edge-mouth-build-browser.mjs` and existing seven-builder edge finishing for top-entry lead-in geometry.
- `tests/studio-documents.test.mjs`, `tests/studio-vault.test.mjs` and post-#150 fixtures for identity/revision/preserved archive.
- `studio-pixel-bore-validation.js` and `studio-native-routing.js` for functional refusal reasons.
- Full `npm run test:static`, `npm run test:browser`, `npm test` / Manifold fabrication, edge checks and exact-head release metadata **after** focused failures have been addressed.

A "passed" workflow can be cited only when its real jobs ran against that candidate head; skip/cancel is never silently counted as passing.

## PR strategy for Codex — *not started by this planning document*

**WT019-QA (first):** evidence-only updates to the existing parity matrix and narrowly missing browser/Manifold assertions. No functional changes, duplicate fixtures or new versioned UI. Make this a test-only draft PR only where real gaps are confirmed.

**WT019-FIX (only if the fixture fails):** fix the *smallest* shared raycast, face or route-visibility inconsistency, with a negative void/cavity counterpart and all-seven regression checks. Do not broaden into new grip geometry or arbitrary CAD editing. Release version/changelog/What's New if runtime changes.

**WT019-PRINT (only if export mismatch is measured):** repair a specific supported negative/positive geometry mismatch; compare independent STL/3MF sections, record invalid-rollback and prepared-job freshness. **No** refactor of unrelated generators.

**Owner #10:** take exact identified model revisions and actual printed coupons to Ultimaker 2+ / UM3 Extended with documented nozzle/material. This remains a separate physical evidence gate.

## Coordination and stop conditions

- WT-023 persistence/Library (#147/#148/#151) is owned by its existing agents. WT-025 accessibility (#157) and WT-026 Gear grips (#158) are independent. Do not edit or rebase their branches from a WT-019 QA lane.
- Do not create new generic parity tickets, declare seven-builder parity based on isolated tests, invent measurements, or merge/deploy without owner approval.
- Stop an implementation attempt if the candidate geometry lacks continuous verified material, if a state rollback changes unrelated IDs or snapshots, or if the requested operation cannot be faithfully represented as a supported Manifold cutter.

**Codex fast start:** after fetching latest `main`, read [#79](https://github.com/connorturansky-svg/crystal-forge/issues/79) and this document, inspect only the existing tests named above, run `W19-G-OPEN-P4` and one positive control, log evidence, then decide if the next deliverable is **QA-only** or a specifically reproduced fix.
