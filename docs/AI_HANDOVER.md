# AI handover — read immediately after AGENTS.md

## SVG artwork in Studio

Studio uses the SVG engine from Jordan’s draft #37 at `0dbd1c80ce255dbcefde73f5ef99d1517bc3a0f0`. Open New model → Import SVG, choose a local file, set width and depth, and review the normalized preview. Studio stores the source metadata and contours, and uses standard Manifold preparation and export. Unsupported artwork, external content and disconnected pieces are rejected by the source engine.

## Routing on verified stock

Waves certify their solid rectangular underside. Eligible Caps, Characters and non-illuminated Pods can use an explicitly enabled solid fitting slab. Cavities, mounting cuts, added bases, part offsets and dual material remain guarded. Check physical cable seating under #10.

## Tile and Gear routing verification

The native planner identifies the numbered fitting that fails the diameter or edge-clearance gate. Catalogue fixtures cover successful, short-pitch, obstructed and serialized routes on solid Tiles and decorative Gears. Physical cable seating remains part of #10.

## Production review candidate

Print Centre and production packs use the same bounding dimensions of the prepared mesh in its exported, Z-up frame. See [production review](PRODUCTION_REVIEW.md) for test scope, walkthrough and physical checks.

## WT-017 — Consistent Build pixel tools and shared measured profiles

All seven model families now show Add pixel and a shortcut to the existing A–G measured-dimensions profile editor before placement. Crystal uses the original `placePixelBtn`/Hardware Editor and retains its established automatic LEDs, P1 ordering, opposing IN/OUT ports, wire pitch and hand-edit state. Native families continue to use stable Pn IDs, click-place/hold-drag and safe automatic material search. Saving a custom measured profile broadcasts `studio-pixel-profile-saved` so the new profile is selected for the *next* native placement; an already placed fitting is never silently resized. Existing local pixel profiles and saved model IDs remain compatible.

Opt-in `build.pixelBacking` adds a real 12 mm perimeter extension and a 4 mm thick positive base to single-material native models. It is not enabled for existing projects; unsupported thin/cavity/edge and nearby mount configurations still fail `pixelBoreIssue`, and final Manifold/STL/3MF checks must pass. This backing is for printable through-bores, not verified strain relief or retained seating. Native Tile/Gear routing remains qualified/opt-in; Waves/Caps/Characters/Pods remain bore-only. Do not claim universal channel cutting or physical fit on curved/hollow shells. Actual printed bores, installed Cura, wall/roof testing and cable routing remain physical acceptance gates.


## WT-016 — Backup review and recovery

The Library reviews private vault and local JSON backups without changing the workspace. Recovery can add complete archives or selected project/model revisions. A verified local snapshot precedes the workspace write. Conflicting records use deterministic copy identities and their linked sources and organisation references transfer together. A complete reviewed recovery acknowledges the remote manifest SHA. Upload remains manual and commits immutable assets before the guarded manifest. Credentials stay on the existing in-memory client. Real private GitHub setup and second-computer testing remain manual.

## WT-015 — Library organisation

Library favourites apply to saved Library records and saved project snapshots. Collections use stable IDs and unique case-insensitive names. Saved snapshots get an additive identity separate from the project ID. Project templates keep valid project-scoped model IDs and reset print readiness. Models pin an explicit Library revision. Local JSON and the private vault retain the optional versioned organisation record. Missing template sources are displayed for recovery.

## WT-013 — Prepared light-path inspection

- Crystal fabrication samples the final solid in the worker. The audit probes 0.2 mm radius segments from the underside along each known bore, counts obstruction above 0.001 mm³, limits each segment to 300 mm and limits inspection to 160 probes. Shared hollowing is reported as unknown where a source-to-spike route cannot be traced.
- The Precision inspector reuses current Print Centre geometry and camera. Strict validation defaults off and gates current Crystal exports. Both package paths carry JSON and text reports when available.
- Approved specification `d5d00a9cf25464270fa2fd97023932a834c51c01`. See the WT-013 draft for exact-head CI. Installed Cura inspection, LED fit, optical transmission and structural verification remain manual.

## WT-014 · Pixel Model Maker workspace

The unified shell uses a compact direct-action header, left Design/Build controls, centre renderer, right precision controls and a horizontal model rail. It moves the same live editor nodes. The generic editor joins the right precision panel in unified mode so exact settings and search stay together. Classic layout retains its original editor placement.

Panel preferences persist under `wt-workspace-panels-v2`. A valid legacy settings width can seed the right panel. Obsolete rail visibility, palette visibility and viewport-height values have no effect. Narrow screens stack the panels and keep a horizontal bottom rail. See the draft PR for exact checks and captures.

## WT-012 · Creative catalogue and native routing

Tiles add contour terraces and connected padded cells. Decorative gears add paired forked through-windows. Light pods add a fluted beacon shell with the established optional cavity and access cuts. New styles preserve existing generator identities and presets.

Native routing is opt-in through `build.serialRouting` version 1 and uses the existing ordered checked pixel records. Backing outlines and minimum thickness certify eligible single-material tiles and solid decorative gears. The shared Crystal tangent and curve math is reused, while the Crystal planner stays independent. Native tails leave at distinct conservatively screened perimeter locations. UI and cutters share derived paths and preparation rejects invalid strings. Older projects remain bore-only unless enabled. Added mounts, part offsets, openwork, pulley recesses, thin backings and thin or hollow pods cannot be routed. Manifold subtraction and Cura inspection address different checks. Actual cable fit, bend strain, illumination and printed roof quality remain physical acceptance work.

## WT-010 · Rename saved projects

Library cards can rename a saved snapshot using existing local persistence. Only its title changes. Search follows the new title, and opening still uses the existing confirmation and backup flow.

## WT-009 · Print export identity

Built on merged WT-008 / PR #46. Print Centre names outer downloads with a bounded model slug, source revision and stable job ID hash. Packs retain their original internal export paths and add a manifest of effective job settings, Cura profile outcome and actual archive entries. Cura slicing and physical validation remain manual.

## WT-008 · Print Centre queue

Built on merged WT-007 / PR #44. Queue order and per-job overrides persist in the existing project document. The shared printer resolver applies project defaults, model settings and job overrides in that order. Preparation accepts only its own active worker and request, while model or effective printer changes invalidate affected results. Prepared mesh data stays in memory and must be regenerated after reopening. Custom printers require manual Cura settings. Envelope warnings are advisory and physical slicing, material assignment and printing remain manual. The draft PR records exact-head checks and screenshots.

## WT-007 · Visual saved projects

Built on merged WT-006 / PR #41. Library project cards use the first stored thumbnail or the established placeholder. Project-title search is case-insensitive and independent of the model-type filter. Open uses the existing confirmation, backup and project replacement flow. Saved snapshots and thumbnail generation retain their existing formats and paths. See the WT-007 draft PR for exact-head checks and desktop and mobile screenshots.

## WT-006 · Interactive Build

[Draft PR #41](https://github.com/connorturansky-svg/crystal-forge/pull/41) records exact-head workflow results and interaction screenshots. [Baseline WT-002 screenshots](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44346201182/artifacts/14447240625) cover the pre-WT-006 workspace.

Baseline is main `351e2c7` after #35. WT-003 / #37 retains ownership of its isolated SVG importer.

| Area | Baseline | WT-006 boundary |
| --- | --- | --- |
| Crystal fitting | Existing hardware markers, measured profiles, real cavities and fit coupons | Reuse the Crystal editor and planner |
| Generic fitting | Numeric X/Z and bore cuts, preview rings, heuristic auto placement | Stable IDs and direct editing with certified placement |
| Wiring | Existing Crystal planner owns ordered, opposed ports and curved length limits | Generic bores do not expose cable routing |
| Physical fit | Existing downloadable coupons | Software tests verify geometry. Print, fit and illumination require real inspection |

Generic fitting records retain historical X/Z, diameter and clearance. The first edit adds stable IDs, body rotation and `build.pixelBuilderVersion: 1`. New and edited fittings are marked for verified placement. Older recorded bores retain their established preparation path. The handover distinguishes diameter-only general bores from Crystal seats and channels.

Crystal reuses the existing route solver for selection and movement. Selecting an automatic Crystal fitting still converts it to manual editing. Generic wall and cavity geometries without a conservative certificate refuse new bores. Native Pod shells retain their own designed access and cavity.

Use Build to select a fitting, confirm the body and bore dimensions and download a single bore or clearance strip. In Cura, inspect the imported hole and bed contact, print flat with the intended material and nozzle, test the actual pixel and record the bore that physically fits. Generic coupons check diameter. Flange, retention, strain relief and light diffusion need separate physical tests.

## WT-002 · PR #35

- Tactile Tiles and Waves add procedurally distinct surface presets. Crystal starting points create independent models using existing formation and preview machinery. Existing editable Crystal models, LED layouts and vault records keep their established paths.
- Rotary caps add dish and stepped geometry with scalloped grip and optional fabricated recessed pointers. Broad grip alternatives cover other control families. Existing socket cutters are reused. Recessed pointer geometry appears in exported meshes and still needs a matching preview cut.
- Characters now have opt-in layered outlines, rounded corners, raised or domed relief and pose options. Light Pods now have opt-in swept stone, lantern and layered dome shells with separate textures, underside access and cable cuts. The legacy recipes remain defaults.
- The centre palette exposes offsets for a selected editable part and keeps the precision controls in sync. Pixel selection and movement from the centre palette remain follow-up work.
- Review exact-head GitHub Actions logs before approval. Fit and diffusion require printed samples.

## WT-002 · Stage C0 draft

The new non-parallel wave profiles use a planar material split instead of unioning an overlapping base box. The first catalogue fabrication run reached the Vortex preset and rejected a degenerate export triangle. The existing strict exporter and the legacy Parallel construction are retained. The catalogue regression exercises the new profiles in single and dual materials with STL and 3MF output.

The unified shell now moves existing app controls into one header and places workspace navigation below it. Panel visibility and widths use the device-local wt-workspace-panels-v1 key. Panels stay mounted during hide/show, preserving scroll, settings, renderer and project state. The classic layout remains available. Browser CI exercises the rail, panel restores, and existing model/Build routes. Verify the exact-head runs before approval. C0 and the three P1 regressions passed on checkpoint `295895f`. The catalogue draft now starts with continuous-backing basket, pebble and scale relief tiles and concentric, vortex, saddle and dune waves. Four other families, richer selected-component controls and full catalogue visuals remain outstanding.

### Independent review follow-up

- P1-1: precision controls refresh the contextual palette from accepted state and reset rejected edits in place. The turbine regression exercises the 110 mm exact value and the rejected 11-tooth Mechanical edit.
- P1-2: automatic placement on contour-extruded models checks solid outlines, internal windows, edge clearance and earlier bores. Other recipe types retain the existing fallback and strict prepared-mesh check. The turbine fixture verifies material removal at 100 and 110 mm.
- P1-3: Face means the contrasting upper region for creative gears. Clipped preview meshes and Manifold use the same split height; two gear styles and thicknesses check region position and export. Installed slicer and physical verification remain pending.

## Stage B creative editor

The unified palette contains real model parameter controls and existing Build actions. Decorative gear modes extend the recipe while old saved values retain the legacy geometry. See the roadmap for the six-family acceptance gates. The current draft must pass Chromium, static and real Manifold on its exact head.

## Current baseline and stability draft

PR #27 was merged at `15808aa18518e85a33f22124824551a3c1bd7102`. Its final head passed static and browser checks and failed fabrication during STL encoding after the fader case. The current stability branch keeps the editor and storage schemas in place. It introduces a single-shell joystick recipe, a focused export fixture and a production version gate. The joystick passed on the first draft head. Its next failure was a disconnected primary body in the dual-material indicator lens. The follow-up splits the lens on a single plane and adds a volume-conservation and export fixture. The lens cases then passed, exposing the same partition failure in the river light pod. Light pods now use the same single-plane split, with a river-specific fixture. Check all suites on the exact review head before opening the interface PR. The roadmap now schedules SVG extrusion ahead of STL/OBJ. The notes below describe historical checkpoints.

## PR16 production-readiness checkpoint

PRs #21 and #22 are merged. The v0.16.0 acceptance matrix is historical and is not release sign-off. At `f9089c1`, static checks and Pages passed, the legacy browser smoke passed, Studio exact-entry failed on blur reentrancy, and fabrication reached the first cog before rejecting its display triangulation. PR16 starts with these two failures. Full browser, Manifold and installed Cura acceptance remain open, along with shared hardware, assemblies, parameter linking, expanded catalogue and advanced print planning.

## Sensory Model Studio v0.16.0 — active draft work

The user approved the full seven-generator expansion, global Print Centre, local-first visual library, copy/linked models, private-vault evolution and actual dual-material exports. [Full brief](SENSORY_MODEL_STUDIO_V016_BRIEF.md). **Implementation is incomplete.** [Current acceptance and module map](SENSORY_MODEL_STUDIO_V016_ACCEPTANCE.md) distinguishes source modules, integration still needed and unrun tests. Keep all remaining stages in the same draft PR; do not mark this checkpoint as the finished v0.16.0 release.


## PR14 / v0.15.1 current: exact curved cable pitch snap

Build includes a new `pixel-spacing-snap.js` pure bounded solver, button `#snapPixelSpacingBtn`, `pixelSnapMaxMove` persisted as a separate UI setting (default 5 mm) and `#wireSnapStatus`. It snaps only *internal* ordered links P1→P2, P2→P3 etc to within .18 mm **below** the chosen 25/50/100/custom mm physical cable pitch using `planHardware`/Bezier route lengths. P1 remains anchored; IN/OUT edge leads are not forced to this length. It safeguards existing mounts, sockets, previously accepted links and tail connectivity; it leaves links too far away untouched and commits via one `onEdit`. See [PR14 acceptance](PR14_PIXEL_SPACING_ACCEPTANCE.md). Confirm latest-head static, browser, Manifold tests; physical cable/LED/Cura checks remain open.

---

## Current PR13/#19: final v0.15.0 software consolidation

Merge candidate combines: legacy routed orphan socket cuts removed; true Manifold preview excludes duplicate Build overlays; unsafe serial strings block export; optional planar printer-bed-aware XY split in production ZIP with watertight Manifold parts (no tested connectors); 1/5 mm hardware keyboard nudges; production-release-gates JSON; expanded tests, benchmark, release instructions. [Complete acceptance](FINAL_PHASE_ACCEPTANCE.md).

**Do not claim production safety, physical LED cable fit, printed optical passage connectivity, true slicer-aware support, structural joints or installed Cura profile validation from green CI.** PR12/#18 is merged, PR13/#19 remains draft until latest-head checks and manual acceptance. Keep user project data and measured pixel profiles intact.

---

## Current PR12: remove duplicate short LED socket wire reliefs

PR11/#17 is merged into main. User screenshot showed three underside pixels with correct main wire but a stray short straight line through each socket. The source is `fabrication-v1.js` `putSocket()`: it also cut local fixed-axis reliefs, unlike the new rotated serial route. In full serial `wireMode='string'` fabrication, disable these stand-alone cuts and use the actual shared `hardware.wirePlan.routes` geometry alone. Preserve all legacy routing modes and separate printable fitting coupon exits. [PR12 test guide](PR12_CABLE_GEOMETRY_TEST_GUIDE.md). Pass exact latest-head static, browser and Manifold CI. Physical Cura, LED retention and optical tests remain open.

---

## PR11 is current: software hardening
PR10/#16 is merged. PR11 draft adds a standalone manufacturing fingerprint, named-project preservation at capacity, validated and rollback-protected cloud imports, unique recovery backups and full root-JS CI triggers. [PR11 acceptance](PR11_HARDENING_TEST_GUIDE.md) governs testing. Do not merge until all three exact-head checks pass; do not confuse software checks with actual Cura/LED/print/optical/safety validation.

---

## PR10 active implementation (11 November 2026)

**PR:** [#16 — smooth pixel-string routing, Cura profile compatibility and private profile sync](https://github.com/connorturansky-svg/crystal-forge/pull/16); branch `feat/pr10-cable-geometry-cura-sync`. Merged PR9 is the base; do not change live `main` until green exact-head static, browser and Manifold tests. [Hands-on test guide](PR10_TEST_GUIDE.md) covers every manual acceptance case.

Key user intent: actual pixel IN and OUT must stay 180° collinear and the **physical cable channel** must leave/enter on those tangents; curves only between pixels, never rigid elbow turns. A chosen 25/50/100/custom cable length is a centre-to-centre physical limit along the curve; show length and red warning; blocked or overstretched strings must not be cut into the STL. Let user Set P1, reverse, see arrows and drag selected P/M markers without losing camera orbit.

Core changes: `pixel-string-routing.js` sampled cubic curve planner, radius/obstacle checking and previewRoutes for blocked red displays; Manifold cutters use actual `routes` segments from the same plan. `hardware-editor.js` arrows, labels, start/reverse and click-hold editing. `cura-profiles.js` no longer forces universal `normal` metadata; explicit or automatic Cura quality type and text fallback, with manufacturing-pack fallback. `github-vault.js` uses explicitly user-entered scoped token **only in memory** and a separate PRIVATE repo; SHA guarded push, backup-before-pull, migration of custom profiles/templates/active project and ALL named models from `project-library.js`, backup JSON import, in-app historical GitHub commit listing/restore. Auto-sync pauses on history restore and remote pull to avoid unexpected writes. This is NOT OAuth/PKCE, credentialless permanent sign-in, remote Cura verification or physical installation certification.

Preserve historical docs and open issues for still-unbuilt projects, advanced quality/migration and engineering proof. Never claim a previously local custom gumdrop has been migrated unless the original browser uploaded it.

---


## Active PR9 implementation — 11 November 2026

**Draft PR #15:** https://github.com/connorturansky-svg/crystal-forge/pull/15 · branch `feat/pr9-combined-roadmap-implementation`. Read [PR9 test guide](PR9_TEST_GUIDE.md) before QA. **Do not merge until all three GitHub Actions suites succeed on the exact latest head.**

Code added: `pixel-string-routing.js` models opposed physical cable IN/OUT and ordered interpixel grooves, with distinct first/last perimeter exits even for one LED. Failed routes suppress all serial cutter geometry. `hardware-identity.js` preserves stable IDs and reorder; `hardware-editor.js` adds numbered P/M/T markers, selection, manual order and a double-click add menu. `pixel-string-export.js` emits a one-based WS2811 RGB channel index (not a controller configuration). Legacy `wireMode='single'/'parallel'` still explicitly available.

New editor/fabrication capabilities: `workspace-panels.js` resizable keyboard/pointer panels; `project-templates.js` browser-local named templates; six-family weighted generation, batch selection/move/scale/lock/visibility, half-cutaway preview, per-crystal modeled conduit reporting and conservative root-wall/blocked-wire warnings. `tests/pixel-string.test.mjs`, `tests/pr9-creative.test.mjs`, updated Manifold and Playwright check behavior.

Remaining open #6–#10: actual Cura slicer imports and layer review, real LED/light/strain-relief service fit, safe mechanical mount/loads, multi-plane automatic printer-bed splits, comprehensive versioned migration fixtures, advanced material shaders and full mobile UX. Green CI does NOT certify physical strength, electrical wiring or optical performance.


## PR8 new highest-priority requirements (11 November 2026)

**Planning only in draft PR8; not yet shipped.** Start with [PR8 P0 spec](PR8_CRITICAL_WIRING_AND_HARDWARE.md) and [#7](https://github.com/connorturansky-svg/crystal-forge/issues/7)/[#9](https://github.com/connorturansky-svg/crystal-forge/issues/9). The user inspected the underside Build screenshot and rejected the existing *Two parallel wires* system: it produces adjacent twin lanes, whereas a WS2811 pixel **string** has an incoming and outgoing cable on opposite physical sides of every pixel. P0 is to route **edge IN → P1.IN / P1.OUT → P2.IN / ... / Pn.OUT → edge OUT**, including **two separately open opposite-sided cable tails for one pixel**. The outgoing final cable should *not* automatically be wired back to input electrically. String order must be controlled by list reordering rather than nearest-neighbour topology; preserve identifiers and validate actual geometry, edges, roots, mounts and thickness. Legacy `wireMode='parallel'` must not be silently reinterpreted.

Add readable numbered 3D **P1/P2** pixel and **M1/M2** mount markers (distinguish tabs), synced click selection and focused Build editing; reordering items must update routing/CSV/export but not X/Z; a **double-click empty model** context menu should allow validated Add Pixel Hole / Add Mount Hole and double-click on an existing marker should edit it. P0 browser/Manifold regressions and JSON persistence required. P1 returns to inspectable light paths, Cura/roof checks and measured clip/strain relief.

PR7/v0.12.0 is already **merged** at main commit `e60c64b000e53ce6e1805fd52bebfc0eabf9119e` and deployed. Leave production `main` alone until PR8 implementation passes exact-head static/Manifold/Playwright CI. PR8 draft currently contains *documentation only*, so do not describe these features as implemented.


## PR7 reconciliation and per-LED optical fix (11 November 2026)

- PR #12 was merged into `main` at `c6abc6809f84302fd6ba0daa8b2d42ca7bf973bd` while PR #13 remained based on PR6. PR #13 was reconciled with an ordinary two-parent merge commit `6aa9f38b07ff9281314e99ad6ba0d01b79389280`, preserving the newer PR #13 source tree rather than force-pushing or changing live `main`. GitHub subsequently reported PR #13 mergeable.
- Audited earlier PR #12's major light channels, pixel measurements, live profile diagram, detachable M3 plate, Cura advice, wiring, and tests against the newer implementation. Some features use newer alternative implementations, especially paired-wire grooves and three/five-position engraved physical coupons.
- Follow-up fix: `targeted-light-paths.js` now resolves each actual LED's body height before planning its optical bore start, avoiding an unintended solid plug where a short seed socket was incorrectly treated as the global gumdrop. `fabrication-v1.js` reports clearance of all actual socket bodies rather than only the globally selected pixel. A mixed LED profile geometry regression was added.
- Require exact-head static, fabrication/Manifold and Playwright statuses before merge; prior browser workflow failures occurred at installing the test environment, not during executed browser interactions. Physical verification of labels, Cura layers, LED light paths, fit/strain relief, plate mating and installed load strength is outstanding.

**Updated:** 11 November 2026. **Repo:** `connorturansky-svg/crystal-forge`. **Production:** v0.11.0 (PR6 merged). **Active:** draft PR #13 v0.12.0 on `feat/pr7-complete-fabrication`.

## PR7 fit calibration and access notes (11 November 2026)

- Added `fit-calibration.js`: 5-position diameter mapping, 3-position full-body mapping, exact measured clearance selection, calibration snapshot and reversible global fit adjustment.
- Both coupons use printable engraved 7-segment numerals, not just a CSV of values. Full-body coupon wire cuts now extend beyond opposite side edges; production socket cable relief is unchanged.
- Build shows `⚙ Calibrated Ø …` after applying a measured fit; selection and original fit persist in the project and can be reset.
- `LICENSE` reserves rights in original source without claiming public source is hidden. GitHub public viewing/forking remains permitted; see README.
- Fixed fabrication worker undeclared manufacturing timing variables. CI install strategy now tries preinstalled browser before downloading Chromium.
- Exact-head static + Manifold + browser CI and real printed coupons must still be checked before PR7 merge.

## PR7 handover — complete fabrication phases (11 November 2026)

- PR13: https://github.com/connorturansky-svg/crystal-forge/pull/13. Based on merged PR6/main SHA `d71f7e781b247e4caf422ac600e010b2720614be`.
- `targeted-light-paths.js` and manufacturing cutter add opt-in LED-to-crystal real narrow bores. Defaults OFF, alternative to slow balloon hollowing or vault. Conservative skip reporting; optical output NOT verified by Cura or physical print.
- `resolveSocketProfile` and manual hardware editor let individual LEDs choose measured profiles. `makeSteppedPixelCoupon` creates three actual housing/retention/relief samples.
- `detachable-plate.js` designs registered insert locations and `makeDetachablePlate` creates a separately printable M3 plate. Valid split STLs and dowels also join the production ZIP.
- `print-quality.js` adds layer/flow estimates; `fabrication-worker.js` posts finer stage progress; `CRYSTAL_FORGE_BENCH_EXTENDED=1` times 10/16/40/60.
- Full scope and merge/physical gates: `docs/PR7_COMPLETE_FABRICATION.md`. Preserve existing project JSON compatibility, no implied certified overhead load or continuous light paths.
- Review exact latest static, browser and Manifold checks before marking ready, then test actual Cura and real PLA/PETG samples.

## PR6 all-phase handover (11 November 2026)

- PR: https://github.com/connorturansky-svg/crystal-forge/pull/11. Based on main `fb0f2843e8a802a420932a65737b14f58ba715f5` (merged PR5).
- **A:** `print-quality.js` real model nozzle, roof, wire and Cura review; printable checklist.
- **B:** `optical-audit.js` per-spike candidate proximity, explicit unverified statuses, optional `pixelRetentionLip` inside Manifold cutter. Default off.
- **C:** `split-joints.js` conservative base dowel plan, matching split STL recesses, separately printed pegs.
- **D:** `design-workflows.js` shape presets, hardware X/Z grid snapping and Shift-drag repositioning of existing manual holes.
- **E:** `production-pack.js`, reusable `encodeSTL`, a binary one-download ZIP with model, project, Cura candidate and build notes.
- Full accepted/pending matrix: `docs/PR6_ALL_PHASES.md`; tracked issues #6–#10 remain open for real physical/optical/Cura and unfinished advanced work.
- Mandatory: exact-head CI/static/browsers/Manifold tests, physical LED/dowel fit, Cura import, optical/roof review before merging. Preview or model topology does not certify physical safety.

## PR5 handover (11 November 2026)

- PR: https://github.com/connorturansky-svg/crystal-forge/pull/5 · base production SHA `6d43803ff22f4f1c812a498a83196457a38f1690`. PR4 was already merged at start.
- Cura generator added: `cura-profiles.js` and Print controls export a machine-aware .curaprofile ZIP with UM3 Extended AA 0.25/0.4/0.8, UM2+ 0.25/0.4/0.6/0.8, PLA/PETG, quality and print intent. Generated archives are unit-tested but real Cura import is still a manual gate. See `docs/CURA_PROFILE_GENERATOR.md`.
- Master backlog now groups all unfinished items into **five large delivery packages A–E**; the original detailed technical phases remain below. Do not call later packages done.
- Implemented on branch: `wire-routing.js` optional underside route planner shared by hardware/build and Manifold cuts, cyan routing preview, CSV, route metrics and warnings; pixel-specific print-fit coupon; `print-advisor.js` roof-span proxy; custom machine X/Y/Z fit.
- Reduced GitHub Actions noise: browser test output is now an artifact, with no automated main-branch log commit.
- **All known pending phases:** `docs/PR5_MASTER_IMPLEMENTATION_PLAN.md` is the authoritative cross-phase queue. Only features with code and tests are implemented; all mechanical and optical guarantees remain pending real prints.
- Latest CI must be checked at exact PR SHA. New UI/Manifold tests were added. Do not claim physical fit, actual light access or safe roof bridging based on a code test.
- Next action: run/review static + fabrication + browser CI, correct regressions and inspect in Cura; leave PR5 draft until signoff.

## PR4 handover (11 November 2026)

- PR: https://github.com/connorturansky-svg/crystal-forge/pull/4. Created from main commit `83633eda52293151172d3db5986b3b275d7eecbd`.
- Implemented three continuous base profiles with dome falloff/side-wall controls; seed/bullet/gumdrop nominal socket shapes and custom pixel-profile editor; saved profile library inside browser/project JSON; contextual Descriptions panel and mounting explanations.
- Fabrication planner accounts for the widest LED flange, Manifold cutter includes blind cap and two shallow underside wire-relief slots. No physical pixel retaining clip or full wiring channel exists yet.
- Added geometry and browser regression tests. The exact-head workflows must be checked; do not claim CI/physical validation from code inspection. The repository could not be cloned in this current tool environment, so no local test was executed.
- Avoid merging until CI and slicer inspections have been reviewed. Live Pages still reflects main.

## One-minute context

Crystal Forge is a static GitHub Pages/Three.js maker for low-poly faceted crystal clusters used in a young-person-facing interactive cave installation. Desired output is physical translucent, illuminated 3D prints, not only previews. The single most important technical distinction: **responsive overlapping preview meshes are not the manufactured, Boolean-joined STL**.

Default manufacturing follows **Cura-first solid exterior** with actual LED and mounting holes. Cura handles infill. An optional open underside **zero-infill vault** adds permanent tapered roof supports, LED collars and lateral side vents. A slower **experimental whole-cluster hollow** mode remains available separately. **0% Cura infill does not guarantee an open light path** or a self-supporting dome; slice-layer and physical tests still matter.

See `docs/FEATURE_SPECIFICATIONS.md` for controls/acceptance, `docs/DESIGN_DECISIONS.md` for reasons, `docs/ROADMAP.md` for outstanding work.

## Current source & recent completed work

- The live application is HTML/CSS + ESM Three.js with Web Worker + Manifold WASM (`index.html`, `studio-v3.js`, `geometry-v3.js`, `hardware-layout.js`, `hardware-editor.js`, `fabrication-v1.js`, `fabrication-worker.js`). `app.js` is an unused older demo.
- Versions v0.6.0–v0.7.0 expanded fully separated spacing, world-aligned lean presets, shoulder continuity, camera/studio lighting, Cura-first printing, Build-stage automatic/manual hole guides, and physical vault/collar geometry.
- Earlier geometry syntax regression was caught by Actions and repaired. World-space lean bug was fixed after user showed inward/one-way orientations rotating inconsistently.
- Last audited main head was `32b7697b8bb62eadee4061513f77d9a9e3066de0` (a CI log commit after release v0.7.0). **Always refetch HEAD** before starting; do not assume this SHA stays current.
- Recent known v0.7.0 Actions: Pages, browser and Manifold fabrication all passed for release commit `e72a9d0c4c1e0b0defefb7ab6072d33ce69cec47`. Some QA logs point to earlier runs; inspect run SHA.

## Current work / status

The shared AI documentation PR #2 was merged into main. The next user-directed refinement is developed in **PR #3**, branch `feat/global-crystal-diameter`. It includes new global crystal width and extreme taper controls with repeatable randomness, real rigid lean, buried root seating, lower/adjustable studio lighting, robust automatic pixel placement, a continuous valid/invalid circular LED cursor, rounded blind LED bores, configurable perimeter fixing tabs, and hover/focus explanations.

The app is **not yet deployed from this branch**. Tests on GitHub Actions must pass for the exact latest PR commit; do not infer physical safety, continuous light paths or Cura support-free performance from a manifold topology report.

## Immediate priorities

1. Review exact-head static, browser (two-click continuous LED mode, hover help, tab UI), and Manifold fabrication tests (tab fusion/hole counts, blind bore roof, extreme taper/root seating).
2. Inspect the new appearance in a real browser and inspect prepared STL in Cura to verify no top-through LED holes, physical hole fit and tab clearance. Print-test tie/bolt tabs before mounting anything overhead.
3. Once approved, merge PR #3 into production main and record deployment SHA in this handover. No independent agent should commit directly to main during PR review.

## Unresolved risks / do not overclaim

- Vault Manifold tests confirm representative connected topology, not actual FDM bridge reliability.
- Sockets may be cut yet fail to illuminate all spikes; Cura can generate solid skins at roots.
- Physical gumdrop retention, wire routing, actual tolerance, safe touch points, overhead mount strength and secondary retention are not certified.
- Experimental full-cluster hollowing is computationally expensive, approximate in wall thickness and may leave small crystals solid.
- Existing Playwright checks operate in headless Chromium and catch logs/downloads but do not mean a human saw the live site and approved its visual output.
- Manual placement UI exists but its actual click/X/Z/export round-trip needs stronger browser regression coverage.
- GitHub Pages deploys automatically on **main** pushes. Existing main browser CI historically commits QA logs back to main; avoid concurrent main writes and check remote head.
- A ChatGPT Chat GitHub connector can commit/read and inspect CI but does not inherently give a local desktop shell or interactive web debugger; Codex local can provide that if properly configured.

## Session handoff convention

End every substantive coding session with: branch + head SHA, changed files, intended user outcome, tests actually run and their links/results, unresolved defects/manual checks, last user decision and immediate next step. Update this file without rewriting historical decisions to fit new code. If work remains uncommitted in Codex local workspace, say that explicitly; the remote GitHub branch does not contain it.
