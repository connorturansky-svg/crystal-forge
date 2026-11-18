# 006 — Interactive 3D Pixel Builder and printable hardware-fit workflow

> **Status:** OWNER-APPROVED next owner-Codex implementation.
> **Task:** [WT-006 / Issue #40](https://github.com/connorturansky-svg/crystal-forge/issues/40).
> **Approval authority:** immutable, complete planning commit SHA pinned in Issue #40. This document alone does **not** authorise a different AI/branch to start.
> **Code baseline checked before briefing:** merged WT-002 / PR #35, `main` at `351e2c7cd6bb521f27b238354d8a5bc5c9ac3f35`. Re-evaluate real current main and open work before implementation.
> **Implementation owner:** owner's Codex, one dedicated new branch on latest `main`, one substantial **draft PR**. No merges/deployments without user authorisation.
> **External parallel owner:** J-Turansky's [WT-003 / PR #37](https://github.com/connorturansky-svg/crystal-forge/pull/37) owns independent `svg-import/**` source/demo/tests/handovers. No overlap or native UI integration in WT-006.
> **Prerequisite:** WP/WT-001 P1 fixes were integrated by WT-002; preserve those exact behaviours.

## 1. Product goal — a Build workspace that genuinely builds the physical object

Wonder Trunks Studio is primarily for approachable, visual creation of tactile 3D printed installation components. The Crystal Cluster is the original engineering benchmark: a printable base, real seating/cavities, measured gumdrop/seed fittings, smooth physically feasible pixel-string routes and usable print/test workflow. All applicable native generators must share a **single coherent Build experience** so users can select, drag, rotate, inspect and manufacture LEDs without relying on a long numeric sidebar or believing cosmetic previews.

The merged WT-002 improved family variety and a selected-part contextual palette. The [current pixel builder](https://github.com/connorturansky-svg/crystal-forge/blob/main/studio-pixel-builder.js) supports generic vertical bores, numeric X/Z/diameter/clearance, amber placement rings, an automatic candidate, and a pixel fit-test STL. The legacy Crystal editor already contains much richer placement/route/profile and coupon infrastructure. The current handover explicitly notes that **pixel selection and movement from the centre palette remain follow-up work**. This task closes that gap, reusing these existing systems instead of rebuilding unrelated code.

**Primary definition of done:** The user can create a Gear/Light Pod/Control Cap/Crystal/Tactile Tile/Wave/Character (where physically compatible), enter Build, choose a real pixel fitting, click a solid region to place it, click once to select it, then deliberately click-hold to drag, rotate, change profile and bore size, adjust a real wire route where feasible, inspect the actual manufacturing mesh, and download a matching test-fit coupon plus print files. Unsafe or impossible operations must fail honestly.

## 2. Non-overlap and source audit

Before coding:
1. Read `AGENTS.md`, `CONTRIBUTING.md`, current `docs/AI_HANDOVER.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/TESTING.md`, `docs/PROJECT_VISION.md`, `docs/SENSORY_MODEL_STUDIO_V016_ACCEPTANCE.md`, and current `main` code. Read the planning branch's `prompts/000-contributor-onboarding.md`, `prompts/HANDOVER_PROTOCOL.md` and `prompts/ORCHESTRATION.md`.
2. Re-evaluate all **open Issues, PRs and task claims**. Main should contain WT-002 PR #35. WT-003's PR #37 remains an isolated import engine until reviewed; do not assume it merged. WT-004/005 are agent dispatch experiments, **not** source features to duplicate.
3. Audit and demonstrate the real existing Crystal Build editor (`hardware-editor.js`, `hardware-layout.js`, `pixel-profiles.js`, `pixel-profile-diagram.js`, `pixel-string-routing.js`, `pixel-spacing-snap.js`, `fabrication-v1.js`, `makePixelSeatCoupon`/`makeSteppedPixelCoupon`), generic builder (`studio-pixel-builder.js`), contextual palette (`sensory-studio.js`), model store (`studio-documents.js`), recipe/manufacturing (`studio-catalogue.js`, `studio-geometry.js`, `studio-material-export.js`, `studio-model-worker.js`), and actual browser/Manifold tests.
4. Create a short **real feature/state gap matrix** in the handover before changing architecture; clearly distinguish already present, partial, unsupported, and manual-only.
5. Claim Issue #40 as `CLAIM WT-006 — @connorturansky-svg Codex — feat/WT-006-interactive-build — shared Build and hardware interaction` before opening a PR. Branch freshly from current `main`.
6. **Do not edit or import unmerged `svg-import/**`, SVG demo, SVG fixtures/tests, `docs/SVG_IMPORT_*.md` or external WT-003's new workflow.** If a later SVG integration needs pixel API support, expose clean documented interfaces but do not merge/rebase the external fork's engine or claim SVG upload works in Studio.

## 3. Functional editing interactions — click, hold, drag, rotate

### 3A. Select and manipulate physically real pixel fittings

- In Build, a click on an existing **P1 / P2 / ...** marker selects that specific stable pixel ID and opens a **dedicated selected-pixel section in the centre-lower palette**; the right-hand precision panel shows matching accepted state.
- A distinct **click-and-hold followed by drag** moves the selected pixel on the supported model's usable fitting surface, keeping it constrained to the real coordinate frame/footprint. Simply orbiting the camera does not grab pixels; dragging an unselected empty canvas or a crystal is not ambiguous.
- Provide clear visual feedback on hover/selection/drag: active marker, validated target location, preview while dragging, red for invalid/colliding placement, and non-destructive rollback on rejection.
- Keyboard: arrow nudge with a documented fine/coarse increment (existing 1/5 mm convention where compatible), Delete/Remove with undo, Escape to cancel move, keyboard-accessible Add/Select/Edit list, and functioning exact X/Z/rotation fields. Respect screen readers and focus retention.
- Rotation of the physical pixel body/ports changes the route tangent orientation; incoming/outgoing ports remain **exactly opposite (180°)** for supported string hardware. Never rotate the two ports independently.
- Do not change placement when toggling layout, model tabs, Simple/Advanced mode, theme, focus view or expanded/collapsed settings. Keep pan/orbit target and selected object stable.

### 3B. Add, edit and remove

- A visible Build action offers **Add LED fitting** with selectable **existing measured preset profile**: seed, gumdrop and other real saved profiles, plus custom. Reuse library `PIXEL_PRESETS`/saved custom measured profiles and calibration; do not hardcode arbitrary manufacturer dimensions as physical truth.
- On a real clicked solid surface, place a candidate fitting only after checking actual supported material and footprint clearance. The reviewed WT-001 defect **Add pixel hole on Swept turbine within an open window** must remain fixed.
- Repeated placements get stable IDs, selected markers and an explicit order; add/remove/reorder/duplicate and undo/redo preserve IDs and project state. A successful edit invalidates only affected preview/prepare caches, not unrelated models.
- Preserve existing project JSON, custom profile IDs, linked/copied library items, multi-model tabs, historical bore fields, legacy Crystal's manual/auto layout. Use a documented additive versioned migration, not destructive replacement.
- Users should see useful model-specific reasons if an operation is unavailable (e.g. insufficient material, thin shell, protected aperture, incompatible base, other pixel too close).

### 3C. Visual component library

- Show a **small illustrated library of actual hardware fitting types** (not fake static labels): seed, gumdrop, custom profile and compatible mounting styles. Use original self-generated schematic/3D previews and physical dimensions, with simple mode exposing the essentials and Advanced exposing full bore/clearance/retention details.
- Clicking a profile updates the real selected pixel geometry and generated test coupon; show the selected profile identity, nominal vs calibrated size and clearances.
- Reuse compatible existing profile/diagram code. Do not assert that a manufacturer cable, flange or clip is captured unless the saved profile describes it.

## 4. Real geometry and wiring authority

### 4A. Hole/fitting accuracy

- Reuse or enhance canonical generator recipe/manufacturing APIs; **one authoritative hole position and dimension set** must drive pixel selection UI, preview, preparation, material validation and exported STL/3MF.
- Candidate acceptance checks full bore footprint against **real material and every interior void**, neighbouring pixel/mount cuts, walls/bridges, base/roof thickness and clearance—not just bounding box. For non-planar solids and any recipe not handled by a safe analytic footprint test, use a bounded real Manifold intersection / material check or **explicitly fail** rather than assume valid.
- Geometry must represent a **physical through bore / accessible recessed seat** as advertised, with real subtractive operations and printable surrounding walls. Generic vertical through holes are not magically proper snap-in retention fittings.
- If a gumdrop profile requires a large body or flange, the fitting must account for its measured projection and required access; a 12 mm lens cannot be claimed to fit merely from a nominal 12 mm body diameter.
- Ensure valid state is checked *before commit* as practicable and final preparation rejects zero-volume/non-cutting cuts or unexpected disconnected bodies. Never weaken the existing final Manifold guard or export validation. Show affected 3D cut location in prepared preview and realistic warnings.
- Distinguish **supported** and **unsupported** fitting recipes by generator. Don't force an unsafe pixel into a character limb or thin tactile relief. Keep optical cavity and cable access distinct from a mere surface aperture.

### 4B. Serial WS2811 cable routing (where supported)

- Reuse legacy Crystal's `pixel-string-routing.js` and authoritative hardware planner for serial topology: **model edge IN → P1.IN; P1.OUT → P2.IN; ...; Pn.OUT → model edge OUT**. One pixel still has two genuinely separate/opposed leads. The final output does not electrically reconnect to first input.
- An LED's IN/OUT exit tangents are precisely **180° opposed** on the physical fitting. Routes start/end tangent to the ports, and use smooth physical splines/fillets, not right-angle jogs through a pixel. Previewed routes and actual cutters must share geometry and agreed sampling.
- Show chosen **25, 50, 100 or custom mm** centre-to-centre physical cable pitch. Measure the *true curved route*, not straight-line displacement; show numbered links, selected route lengths, red overlength/unsafe warnings, arrows and selectable start pixel, reverse/order where available.
- One-click snap (bounded by adjustable max displacement) should reuse existing physical spacing solver when valid. If the solver cannot support a given generated solid/void topology, do not show a fictitious working button. Either support it with tested geometry/clearance or explicitly state the restriction.
- Keep distinct IN and OUT tail lengths. Validate bend radius, exit geometry, collisions with holes, minimal walls and cuts. Block manufacturing of invalid strings and explain why.
- **Not every generator must support full integrated serial routing in this PR if its geometry makes it unsafe.** For unsupported shapes clearly label "Bores supported; routed cable tracks not yet supported" and do not claim full print-ready cable serviceability. The shared interface must never imply support that is absent.

### 4C. Crystal benchmark / light pathway integrity

- Preserve the actual crystal formation editor and selected-crystal controls, true root seating, base dome/vault, established gumdrop library, optional light ports, correct underside access and all existing `planHardware` / `prepareFabrication` constraints.
- Demonstrate real **continuous potential light routes** from actual LED opening/base cavity into the appropriate crystal roots only where the setting claims light passages. A marker or semi-transparent preview is not proof. Tests must inspect prepared mesh/cavities and roof skin; distinguish Cura infill recommendations from geometric cavities.
- Preserve user-settable extreme cluster spacing (100% no crystal-crystal overlap), angular presets and randomness, and previous saved profile/placement recipes.

## 5. Test print / fitting coupon workflow — real and convenient

The application already contains pixel test-print downloads. **Do not rebuild them as empty placeholders.** Integrate one obvious action in Build:

- `Print a pixel fit test` (or similarly clear label) for the **currently selected actual profile**, calibrated bore and clearance; allow choice of a practical single-size or multi-clearance coupon. Where available reuse `makePixelSeatCoupon`, `makeSteppedPixelCoupon` and current `fit-calibration.js`.
- The coupon should show its measured body/bore dimensions, clearance and profile identity in UI, with genuine printable hole(s), visible labels or clear manifest, flat bed contact and real validated Manifold STL/3MF output.
- Show unambiguous download names, material/printer/nozzle advice and a short physical acceptance procedure: print, test actual pixel, measure, record fit and save calibrated dimension. Do not store user measurements from an unperformed print.
- Allow updating the custom profile from **actual user-entered measurements**, then reuse that profile in existing projects and new designs without resetting the model.
- If a profile doesn't have enough information to create a secure retention/strain relief coupon, offer a truthful **diameter-only test** with warning, not a claim that clips and wires are tested.
- Verify runtime UI actions, actual exported mesh dimensions and that model save/reload preserves the calibration link. No physical print test is assumed.

## 6. User experience — one coherent Build workflow

- The centre-lower pane should offer useful illustrated sections: **Hardware library → Place and select → Exact fit → Pixel string → Test print → Manufacturing checks**. Make each section contextual to the selected model/profile, with actual underlying actions.
- Right-hand settings remain the precise numerical companion (not a different source of truth). Changes from either side synchronise immediately; invalid edits revert visibly and preserve focus.
- No obsolete duplicate Add/Save/Print controls, unreachable hidden panels, fake tabs or actions which only jump to a long right sidebar. Preserve WT-002's compact closable panels, icon-only rail and global header.
- Make camera/model selection and 3D hardware interaction unambiguous: 3D pan, orbit, Focus, select model, select part, select pixel, drag pixel, and Build/Design state transitions all have usable visual cues and keyboard/touch alternatives.
- Keep library/project/linked model protection; don't accidentally mutate an immutable linked library source from Build. Preserve update/break-link semantics.

## 7. Work packages inside ONE owned draft PR

**Build-A — Audit and baseline:** Verify current actual code, previously implemented features, migration schema and existing exact-head CI. Capture baseline screenshots of original Crystal and at least one openwork Gear + Light Pod. Document what is already working, including the existing coupon download.

**Build-B — Authoritative hardware state and placement:** Stable pixel IDs, profiles, exact body/clearance, real candidate validation and unchanged Boolean cuts. Cover negative fixtures (open holes, thin walls, bounds, existing mount cuts), and backward compatibility.

**Build-C — Direct interaction / contextual UI:** Real 3D selection, click-hold dragging, rotation/nudges, contextual centre panel and precision synchronisation, tested with orbit and collapsed layouts. Add visual hardware previews and meaningful warnings.

**Build-D — Supported routing and test coupons:** Reuse Crystal cable planner and physical fit-test generators; expand to applicable solids only when geometry checks are real. Show pitch and route direction; provide actual physical test-print downloads and measured-calibration feedback.

**Build-E — Manufacture/regression/handover:** Strict Manifold STL/3MF, material split, saved project migration, failures and performance, docs, screenshots, release notes and limitation matrix.

If major geometry constraints make one family or specific wiring mode unsafe in this PR, record that limitation and protect its UI; do not turn acceptance tests green by claiming functionality not built.

## 8. Automated acceptance gates (explicitly test click paths)

**HW-01** User clicks Add at an actual placeable surface and gets a real fitted cut on at least three different representative non-Crystal geometries plus the Crystal baseline; avoid existing voids/windows. Unsafe regions reject without saving invalid hardware.

**HW-02** Click select vs click-hold drag are separate and reliable; dragging pixel does not orbit camera; orbiting does not move pixel; undo/redo reverses exact gesture. Selection persists across panel/hide/workspace changes.

**HW-03** Selected pixel controls in centre visual palette and right numeric panel read the same accepted model state immediately; rejected edits visibly revert in both surfaces, preserve keyboard focus and include clear error.

**HW-04** Preset seed/gumdrop/custom measured profiles and diameter/calibration values survive duplicate model, save/reload, Library and related model state operations.

**HW-05** Actual fixture bores have correct width/depth and physical clearance after Manifold; strict nonzero material intersection, surrounding wall, collision and connectedness checks. An openwork Gear window case remains blocked as in WT-001.

**HW-06** Each supported serial route has opposed physical port tangents, correct edge IN/P1…Pn/edge OUT order, smooth bounded radii, accurate curved length, visual directional arrows, and red error states. Unsafe/over-pitch route cannot silently reach STL/3MF.

**HW-07** Existing legacy Crystal fitting, routing and snap solver tests still pass, including single LED's distinct IN/OUT, 25/50/100 mm and separate tail behaviour, vault and light-path claims.

**HW-08** A newly chosen real fitting profile leads to real downloadable fit coupon(s), not a mock file. Manifold verifies coupon hole diameters, clearance variants and flat Z-up orientation. User-provided print calibration updates the corresponding profile without claiming automatic physical verification.

**HW-09** Representative dual-material STL/3MF, preview/real material region alignment and unchanged fabrication exporter guardrails remain correct after hardware cuts.

**HW-10** Numbered pixel identities, selection, deletion/reordering, model-tab switching, linked/copy editing protections, advanced/simple mode, panels, keyboard and responsive layouts remain stable and accessible.

**HW-11** Buttons/menus (Add, Select, Delete, Rotate, Reverse, Snap, Reorder, Test Print, Prepare, Save/Open, undo/redo) are exercised by real browser automation; disabled/unsupported actions have meaningful explanations and cannot mutate state.

**HW-12** Exact latest-head `npm run test:static`, `npm run test:browser`, `npm test` with representative Manifold benchmarks, and workflow contract succeed. Record exact SHA and CI URLs, not old successes. Include before/after UI captures plus prepared mesh vs source geometry comparisons.

**HW-13** Correct new app version, matching `CHANGELOG.md` and in-app What's New, updated `docs/AI_HANDOVER.md`, `docs/ROADMAP.md`, user help and reproducible manual print/Cura acceptance guide.

**HW-14** No source changes to WT-003 external SVG importer and no duplicate new PRs against existing WT-002 or WT-001. Document later SVG model Build integration as follow-up; this task validates the native generator pipeline.

## 9. Deliverable / PR contract

Draft PR title: `[WT-006] Interactive 3D Pixel Builder and physical-fit workflow`.

Add exact metadata lines near the top, matching the contributor contract:
```
Task issue: #40
Approved spec: prompts/006-interactive-pixel-builder.md @ <FULL_40_CHARACTER_APPROVED_SHA_FROM_ISSUE_40>
Scope: Shared Build pixel direct interaction, verified bores/routing and printable fit coupons for native model families.
Related PRs/duplicates: WT-002 #35 merged; WT-003 #37 external SVG engine isolated, NOT integrated here; Issues #7/#9 historical.
Test evidence: <latest exact commit head + links for static/Chromium/Manifold and any manual steps>
Handover: docs/AI_HANDOVER.md <details of new contracts/migrations and actual limits>
Risks: <remaining unsupported model hardware features, slicer/printed-fit/optical/manual checks>
```

The PR is **draft** until its full acceptance matrix, latest-head CI and working interaction screenshots are supplied. Update `docs/AI_HANDOVER.md` with intent, architecture, changed interfaces, backward compatibility, exact test results, outstanding risks, and a detailed next-agent path. Revise source tests in the same branch; do **not** change the immutable planning prompt or main directly. Do not auto-merge or deploy.

The next separate integration after WT-006 and validated WT-003 is likely SVG models → unified Design/Build/Library/Print, followed by validated STL/OBJ mesh import. Do not start either under WT-006.
