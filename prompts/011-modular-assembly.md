# 011 — Modular Fabrication and Assembly Studio

> **State:** OWNER-APPROVED **next full-size milestone**; prepared in advance, **not** dispatched to Codex.
> **Task:** [WT-011 / Issue #51](https://github.com/connorturansky-svg/crystal-forge/issues/51).
> **Implementation start gate:** **WAIT** for owner Codex to finish and owner to merge [WT-010 / Issue #49](https://github.com/connorturansky-svg/crystal-forge/issues/49), and for user to confirm their Codex credits have refreshed and explicitly paste the handoff. Creating this planning brief authorises the future milestone but does not start a coding session.
> **Planning branch:** `planning/prompts` — use the immutable **40-character commit SHA pinned in Issue #51**, NOT the moving planning tip.
> **Verified main at drafting:** `549765b85ddf9a12a1a7aa4a74753a82373f3c8e` after WT-009 PR #48. Verify real baseline after WT-010 merge.
> **Owner:** Connor's Codex, one feature branch from the then-current `main`, one large **draft PR**. No auto-merge/Pages deployment.
> **Parallel conflict constraint:** Jordan's [WT-003 / PR #37](https://github.com/connorturansky-svg/crystal-forge/pull/37) remains a separate draft SVG-to-3D importer. Do not modify `svg-import/**`, its tests/demo/handover or build native SVG UI under this task. WT-004 Copilot automation similarly excluded.
> **Scale:** One substantial feature milestone approximately the class of WT-006, **not** a tiny 2% UI pass. Avoid a monolithic attempt to finish *all* open Issues; prioritise the acceptance criteria below. Credit usage is not reliably predictable.

## 1. Why — practical physical installations, not just printable-looking 3D

Wonder Trunks Studio helps an artist/educator design tactile and illuminated objects for installations, then print on **Ultimaker 3 Extended and Ultimaker 2+**. The original Crystal Cluster is the manufacturing benchmark. Large clusters can exceed printer beds and may need multiple pieces, but current automatic cuts yield plain pieces with no shared connector system. It is difficult for an installer to identify which faces mate, which parts to print, and what physical calibration is still required.

**The goal:** Design and Print show an understandable **modular assembly** workflow: choose/manual or automatically plan split planes, inspect real numbered pieces and mating faces, add physically modelled *separate dowels + corresponding blind sockets* when a validated material region allows, generate fit coupons, and download an organised package with parts, connector counts, print/cut notes and honest assembly instructions.

Keep creative, simple defaults. A cluster that already fits a bed must not be pointlessly split. At every step distinguish **geometry/software-validated** from **printed/Cura/manual-unverified**.

## 2. Confirmed code baseline; avoid redundant rebuilds

Before any edits audit the actual, latest versions of these modules and their tests:

- `bed-split.js::planBedAwareSplit` already provides deterministic X/Z cut-grid locations, printer-size clearance and a maximum pieces guard. It presently documents **straight cuts only; no joints** and fails if the model is too tall for an upright cut.
- `fabrication-v1.js::splitPreparedMeshGrid` already splits the **actual prepared Manifold solid**, checks resulting part count, closed solids, bounds and conservation within 0.2% of original volume; exports mesh geometry.
- `split-joints.js::planSplitJoints` currently supports **two alignment bores for one X split** in a qualified solid Crystal base (at least 14 mm; no vault/whole hollow), skipping collisions with LED and mount holes. `splitPreparedMesh` subtracts its bores, and `makeSplitPinCoupon` produces matching standalone pin geometry.
- `studio-v3.js` already has `autoBedSplit` and `splitParts` settings, X split slider, experimental alignment controls and Export split parts / production ZIP buttons. Manual and automatic modes are currently mutually exclusive; their saved fields and functionality must survive.
- The legacy automatic production pack `production-pack.js` includes `05_Assembly/auto-bed-part-XX.stl`, `bed-split-layout.json`, optional separate manual split pegs/plate, assembly warnings and software-vs-physical release gates. It currently warns that automatic parts have **NO alignment connectors**.
- The newer global Print Centre `sensory-studio.js`/ `studio-model-worker.js` offers per-model queue, overrides, prepared geometry and validated ZIP/3MF from native generator families. Those exports are separate from the legacy Crystal production pack; do not silently assume the two pipelines are identical.
- Merged WT-006, WT-007, WT-008, WT-009 provide interactive hardware, saved-model gallery, queue settings and named print packs. WT-010 adds saved-project rename after its merge. These are not to be rewritten.
- Historical [Phase C / Issue #8](https://github.com/connorturansky-svg/crystal-forge/issues/8) tracks automated splitting, real joints, calibration, assembly BOM, installation constraints and physical tests.

Write a concise table in the handover: **existing → implemented in WT-011 → unsupported/deferred → physical test needed**. Use original code names and real verified behaviour rather than historical roadmap labels.

## 3. Primary feature — automatic split layout with real matching interfaces

### 3A. Plan the correct piece layout

1. Reuse `planBedAwareSplit`; do not create a different planning engine. Plan from the **real prepared** manufacturing mesh and the selected printer's actual supported build envelope; account for Y-up model / printer X–Y plate mapping and existing optional 90° bed rotation. Do not invent slicer nesting guarantees.
2. Preserve max-piece limit and configurable clearances. Show: planned number of pieces, cut directions, approximate dimensions, fit-in-bed warning, estimated available material at seams, and connector support status.
3. Provide simple clear **Split mode** choice while retaining legacy saved Boolean settings: `None`, `Manual X plane`, `Automatic bed fit`. Legacy projects and setting IDs must round-trip. Do not forcibly turn on new joints for old projects.
4. A manual X split, a single automatic X split, multiple X cuts and mixed X/Z grid cuts should be deterministically labelled `Part 01...`, with grid/seam identities. Keep each part in a **shared source frame** for mating and preserve original geometry; output separate slicer-ready STLs in a clear coordinate frame (state whether packed or shared; do not mix conventions).

### 3B. Add qualified separate dowels with matching blind sockets

1. **Conservative qualification:** only construct automatically validated connector candidates where a solid integrated Crystal plinth has adequate local thickness/height and distances from external edges, split surfaces, root structures, LEDs, mounting holes, cable routes, vaults, light ports, and other negative geometry. A plain bounding-box check or an assumed filled dome is **not sufficient**.
2. For each eligible adjacency/seam, generate a repeatable set of joint positions (aim for at least two safely separated points when geometry allows). Support X- and Z-normal seams; orient cylinder axes **normal to each seam**, not always in world X. Preserve deterministic IDs and mapping for grid intersections where seams cross.
3. **Separate dowels:** cut paired blind bores into the two *actual* mating part meshes and export independently printable pegs with correct diameter/length and chosen clearance. These are not magic interlocking geometries. Offer constrained dimensions and clearance (reuse `splitPinDiameter`, `splitPinDepth`, `splitPinClearance` where compatible). Do not promise snap-fit, strength, insert retention, or adhesive bond from CAD alone.
4. Verify each socket subtracts meaningful material from the intended part, does not break through unintended external walls or adjoining voids, and keeps a valid closed connected part. Verify the peg is printable, not a zero-volume placeholder. Ensure two bores line up within numeric tolerance in the common coordinate frame and do not accidentally join different seams.
5. For grid layouts where some seams are unsafe, explicitly mark those seams **No validated joints** and provide individual reasons. **If the user explicitly requested joined/registered assembly and a needed seam lacks validated sockets, fail the joined export** rather than silently replacing the request with unjoined pieces. Offer a separately named *plain pieces only* export mode with prominent unjoined warning.
6. For hollow/vaulted/thin/shell or geometrically uncertifiable models, **disable automatic joint request** with a clear reason rather than carving unsupported sockets. Existing manual legacy two-part paths remain functional and preserve their flags.

### 3C. Split integrity validation and efficient Manifold use

- Partition the prepared watertight mesh first. Run actual Manifold subtractive socket operations on split solids, check closure, connectedness and remaining volume. Detect non-finite/degenerate geometry and reject before download.
- Compare original volume to (parts after bores + measured removed socket volumes) with documented tolerance; do not expect *post-cut parts alone* to equal original volume. Count correct intended number of parts and joints; do not include loose pins in the main body count.
- Verify printer-bed envelopes in print coordinates and explain that placement, supports and orientation still require slicer inspection. If cut creates non-printable fragile slivers, reject or warn with conservative evidence—not a fake certified structural assessment.
- Bound expensive operations to existing caps; cancellation/error must not freeze the browser or leak Manifold objects. Avoid a massive main-thread synchronous process. Reuse existing worker architecture where safe; do not restructure the entire app or duplicate a geometry engine.

## 4. Artist-facing Build / Print assembly interface

- In Build or Print, show a discoverable **Modular assembly** section rather than relying on hidden advanced controls. Include plain language:
  - `Single piece`, `Manual split`, `Fit to printer bed`
  - `Add alignment dowels` (optional, only if eligibility passes)
  - `Joint diameter`, `Socket depth`, `Clearance` and a clear `Test joint fit` download
  - `Preview cut layout`, `Prepare assembly` and `Download assembly pack`
- **No fake buttons.** Every visible control must edit real accepted configuration, validate, show status, support keyboard and preserve state or be visibly disabled with an explanation.
- Preview actual numbered part outlines/cut planes/seams **on the 3D object**; highlighting a part or seam in the list highlights the corresponding preview. Avoid doubling the rendered mesh over itself. When the user switches back to the intact model, preserve camera/orbit and normal Crystal editing; no persistent false cut overlays in Design.
- Distinguish `real connector geometry prepared`, `plain cut only`, `connector requested but blocked` and `no split necessary`. Avoid deceptive green "ready to install" labels.
- If updating a cut, joint size, or source geometry, invalidate previous assembly results and related download buttons. Restore only on fresh valid prepared revision. Preserve current Undo/Redo, saved Crystal settings and local backups; existing legacy two-part manual export must not regress.
- Any optional native-family integration **must** use shared validated prepared solids and shape-specific safety certificates, not assume a flat Crystal plinth. It is acceptable to expose **plain split only** for generic families if real joint clearance is not supportable; document exactly which families are supported. Do not add a blanket "connectors supported" checkbox to unsupported shapes.

## 5. Printed test pieces and real assembly packs

### 5A. Mating fit coupon

- Reuse `makeSplitPinCoupon` where appropriate, or implement a small real Manifold **joint-fit coupon** with known nominal peg diameter and several clearance options (for example nominal +0.15, +0.25, +0.35 mm diametral adjustments), explicitly labelled with measured requested dimensions. Follow existing fit-calibration/coupon conventions; do not assert an absolute ideal fit without a physical print.
- Printable peg and matching socket geometry must survive STL and, where supported, 3MF round-trip. Coupon should fit the selected Ultimaker bed, have flat printable bed contact and demonstrate the same orientation and tolerance model as actual joints.
- Manual note instructs: print in intended PLA/PETG + nozzle, fit peg, measure with calipers, record selected clearance; only accept user-entered measurement, never invent physically tested dimensions. Record it without destructive changes to existing pixel-fitting calibration.

### 5B. Assembly package

- Extend the existing `05_Assembly` subtree of the production ZIP, not an unrelated second export engine. Include genuinely prepared part STLs (and 3MF only if validated), separate dowel STL(s), optional coupon, machine-readable `assembly-manifest.json` and a readable numbered assembly guide.
- Manifest schema includes: source model fingerprint/revision where available; chosen printer/nozzle; part names and IDs; real bounds/volume, original coordinate frame; adjacency list with seam axis/plane and mating part IDs; socket/peg IDs, locations, dimensions, clearance and count; unjoined seam status; files actually included; failures/warnings; and `physicalFitVerified:false`, `curaVerified:false`, `structuralRating:null`.
- Generate a practical **BOM and assembly order** from adjacency and the true list of physical parts/pegs. No invented screw lengths, bolt grade, load capacity or overhead safety statement. Identify which mating face belongs to which printed part.
- Keep existing Crystal production files, optical/wiring reports, Cura profile candidate, editable source, production release gates and read-me; do not rename or delete them. Make it clear that model STL coordinates use common origin; in Cura the user must orient/layout parts and inspect actual layers. Warn about opposing cable exits/LED access where parts separate.
- File names must be stable, descriptive and collision-free; all report references must point to files actually inside the ZIP. A partly failed connector computation must **not** yield a manifest claiming all seams have successful joints.

## 6. Acceptance matrix — real tests, representative geometry

### Geometry, planning and safety

- **WT011-01:** Existing unmodified Crystal cluster that fits the UM3 or UM2 bed chooses `no split needed`; no redundant parts/pegs appear.
- **WT011-02:** Oversized **solid-plinth** Crystal with 1 X cut produces 2 numbered manifold parts, matched blind sockets and printable independent dowels with correct orientation and positive volume.
- **WT011-03:** Oversized solid-plinth Crystal requiring a **multi-seam X/Z grid** produces expected numbered pieces, adjacency graph and matching X- and Z-normal socket pairs, with correct peg count and no false socket joining distant parts. If eligibility is unavailable for some seams, it must report/handle them conservatively.
- **WT011-04:** Fail or conservatively disable connectors for thin plinth, vaulted underside, full hollow, LED cavity/mount/wire collision and geometry that cannot prove enough material. No unsupported pockets or silently lost joints.
- **WT011-05:** Original split parts and new socketed parts are manifold, finite and appropriately connected; volumes and removed socket amounts reconcile within defined tolerance, and real output dimensions respect printer limits.
- **WT011-06:** Aerial/no-base Crystal, unreachable seam, too many requested pieces, model too tall for printer and corrupted source mesh fail with specific status, no fabricated output and no frozen browser.

### UI / state / export

- **WT011-07:** In Chromium, user can choose auto/manual split, toggle validated dowels, change diameter/depth/clearance, preview cut seams/part labels, select a part, prepare and download. All buttons and keyboard paths are tested; invalid edit rolls back and stale export disables.
- **WT011-08:** Actual two-part and grid assembly packs include correct individually printable STL names, dowels/coupon when validated, accurate assembly manifest/BOM/guide, existing reports/Cura notes; ZIP signatures, counts and referenced paths verified.
- **WT011-09:** Physical **fit coupon** downloads as real validated mesh with correct user-chosen sizes and readable calibration guide; manual Cura and physical mating remain clearly unverified.
- **WT011-10:** Manual legacy X split and old pin controls, normal single-piece Crystal Export, targeted LED light routing, saved projects, 25/50/100 mm string routing, mount holes, printable pixel coupon, undo/redo and library project state remain unchanged when not opting in.
- **WT011-11:** Existing global Print Centre's named model/job ZIP and 3MF workflow (WT-008/009) survives. Any generic native assembly integration advertises only actually validated support; unsupported variants cannot silently export joined parts.
- **WT011-12:** Latest-head `npm run test:static`, real Manifold geometry suites and browser Chromium interaction suites pass; screenshot uncut, manual split, auto 2-part and grid / joint reject variants. Record actual commit SHA and linked GitHub Actions. Benchmark at least typical, heavy and maximum supported cases with wall-time/memory, no unbounded slow path.

### Manual gates (not achievable by CI alone)

- **WT011-13:** Supply a separate **hands-on validation sheet** for Cura on UM3 Extended / UM2+, PLA/PETG, nozzle 0.25/0.4/0.6/0.8 only where printer compatible, clearances, actual printed dowel/socket mating, glue/retention choice and stability. Mark each **unverified** unless user provides real evidence. No claim of child-safe or overhead-load compliance.
- **WT011-14:** App version once, matching `CHANGELOG.md` and in-app What's New, current `docs/AI_HANDOVER.md` (module map and cautions), `docs/ROADMAP.md` and a focused assembly acceptance guide. Preserve saved user profiles and older backups.

## 7. One full PR, clear checkpoints, no infinite scope

**Stage A — Technical audit and tests:** read `AGENTS.md`, latest handover, existing split planner/geometry/UI/tests, related Issues #8 and #10; verify WT-010 merged and WT-003 still independently owned. Run baseline once. Record feature-gap table and choose the minimum safe shared data contract.

**Stage B — Actual joints on prepared split geometry:** deterministic seam graph, qualified material-aware joint planning and Manifold socket/pin construction, exact two-piece and grid real fixtures with unsafe blockers. Do not change UI until geometry tests pass.

**Stage C — Modular assembly UI:** real preview cut/number/selection and Build/Print controls, accepted state/saved migration, camera-preserving overlay and strict worker/cache freshness. Test click flows.

**Stage D — Fit coupons + production package:** printable calibration samples, tagged part exports, machine-readable assembly/parts metadata, readable instructions, BOM, unchanged old reports. Test real downloads.

**Stage E — Regression and handover:** exact-head static/Chromium/Manifold/benchmark, screenshots, version/changelog and honest physical verification table. Only finalise after test evidence. Stop and report remaining unsupported geometry; never hide failures by weakening validation.

This is a **full-size task**; a few checkpoints in one PR are fine. One integration owner, optional very limited subagents for *independent audit and QA only* if Codex's capacity actually permits; do not spawn agents just to consume credits, and never allow conflicting writes.

**Priority when constrained:** B robust tested geometry for solid-plinth Crystal → D truthful assembly package → C visible controls/preview → generic native adapters. If a nonessential generic-family feature demands a new fabrication architecture, record it as a future milestone rather than jeopardising completed Crystal acceptance.

## 8. Handoff / GitHub collaboration contract

Once the start gates are met, claim Issue #51:

`CLAIM WT-011 — @connorturansky-svg Codex — feat/WT-011-modular-assembly — verified split joints, print coupons and assembly packs`

Create one branch from latest `main`:

`feat/WT-011-modular-assembly`

Open one **draft** PR:

`[WT-011] Verified modular splitting, assembly joints and production packs`

PR description must include:

```
Task issue: #51
Approved spec: prompts/011-modular-assembly.md @ <FULL_40_CHARACTER_PINNED_SHA_FROM_ISSUE_51>
Scope: Real split-part registration joints, assembly preview, fit coupons and truthful printable pack.
Related PRs/duplicates: WT-010 #49 completed; Phase C #8 historical; WT-003 #37 SVG external and untouched; WT-004 separate.
Test evidence: <exact PR head SHA, latest static/Chromium/Manifold/benchmark CI URLs, downloadable artifacts>
Handover: docs/AI_HANDOVER.md plus specific assembly acceptance matrix.
Risks: <unsupported seams, Cura/print/fit/loading and assembly verification still manual>
```

**Never** edit `planning/prompts` from the coding branch; never auto-merge, bypass status checks, force-push main, auto-publish GitHub Pages or invent a physical certification. Finish the approved stage, provide PR/check links and wait for owner release decision.
