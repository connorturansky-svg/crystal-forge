# AI handover — read immediately after AGENTS.md

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
