# PR7 — Crystal Forge v0.12 manufacturing completion programme

**Branch:** `feat/pr7-complete-fabrication` · **Draft PR:** https://github.com/connorturansky-svg/crystal-forge/pull/13 · **Base:** PR6/v0.11 merged. All requested phases remain grouped under this single PR.

This document distinguishes **implemented code**, **automated validation**, and **physical acceptance**. A watertight Manifold or passing CI test does not prove a manufacturable or safely installed illuminated sculpture.

## Delivery matrix

| Large phase | PR7 implementation | Remaining physical/advanced acceptance |
| --- | --- | --- |
| **A — Cura & printable geometry** | Targeted bores and full-sphere hollowing remain independent strategies; expanded Cura inspection, layer count, estimated volumetric flow and detailed worker stage feedback | Validate actual Cura imports, bridge layers, per-nozzle strength, 0% infill optical openings and real material settings |
| **B — Pixels & optical connectivity** | Optional real base-to-crystal bores from accepted LED housing, controlled diameter and maximum distance, per-crystal warnings; individual manually placed LED profiles; stepped three-fit coupon with actual flange, internal cap, retention and wire relief | Optical test with real translucent filament; truly uniform wall thickness; verified removable clips and strain relief; confirm every intended crystal is lit |
| **C — Modular hardware** | Registered M3 insert pockets in sculpture, downloadable separate matching plate, optional split/dowel exports, all matching printable parts included in project production pack | Test actual hardware fit and load capacity; complete automated bed-aware multi-plane splitting, alternate plate fasteners and overhead secondary retention |
| **D — Advanced editor** | Individual manual LED type selection added to existing snap/Shift-drag editor; tooltip and status/report integration | Rich persistent reusable template gallery, multi-select and accurate material shader, robust legacy project migrations |
| **E — Reliability, performance, packaging** | Progress stages during Manifold preparation, opt-in benchmark covering 10/16/40/60 crystals, full production bundle with optional physical parts | Exact-head CI across all three suites; Cura and printed samples; worker stress/cancellation and acceptance testing on real printers |

## Physical-light-path option — how it works

Select **Build → Targeted LED-to-crystal bores** (OFF by default) instead of **Balloon hollowing** or **Base vault**. The planner looks for an accepted LED socket, checks source distance, root width, roof thickness and mounting-hole proximity, then builds subtractive connected cylinders from that actual LED bore roof into the crystal spine. Those cylinders are physically removed from the exported Manifold mesh. Unreachable, narrow or obstructed paths are skipped and reported. This avoids globally hollowing the entire combined cluster.

**Important limits:** the tool does not ray-trace light, guarantee minimum actual wall thickness along every facet, or prove that the light path survives Cura slicing and real printer tolerances. A bore may reduce strength or leak through a thin face. A real print and physical LED test are required before calling it suitable for workshop/public use. Turn it off for extremely thin blades.

## Measured LED assembly

- The **global pixel library** still stores seed, bullet and gumdrop housing dimensions.
- With *manual LED placement*, each LED can independently select one of the saved profiles. The accepted hole envelope and cutter use that actual profile's body/flange measurements.
- New stepped coupon prints three **profile-shaped** underside socket variations, instead of only three circular through-holes. Check fit, flange seating, cable bends, extraction force and optional retention ridge before committing to a full build.
- The old four-parameter wire-route geometry continues to be optional. Automatic groove planning is not reliable electrical wiring design; verify strain relief separately.

## Detachable mounting plate

Select **Build → Mounting preset → Detachable plate**. The same authoritative hardware planner searches for two clear M3 insert pockets in the integrated base. After Prepare Print, **Separate M3 mounting plate STL** exports a plate with matching through-holes. The comprehensive production pack also includes valid separate plate/split part assets.

**Restrictions:** requires a solid integrated base and valid plate footprint; nominal holes require actual M3 inserts and bolts, and no printed part is load rated. Plate geometry cannot certify wall/ceiling or festival suspension.

## Print and performance validation

- Existing Cura profiles support UM3 Extended AA 0.25, 0.4, 0.8 and UM2+ 0.25, 0.4, 0.6, 0.8, PLA/PETG, and Fast → Fine quality.
- The print checklist provides estimated layer count and extrusion flow for the selected profile; these are uncalibrated approximations, **not real Cura slice-time predictions**.
- Worker gives progress stage updates during geometry preparation and remains cancelable through the existing UI.
- The existing benchmark still runs its representative solid and vault cases. Set `CRYSTAL_FORGE_BENCH_EXTENDED=1` to add 10, 16, 40 and 60-crystal benchmark cases. Run on the same hardware and log memory plus elapsed time before claiming improvement.

## November fit-test feedback — implemented in PR7

The 5-position simple and stepped calibration strips and the 3-position full-body sample now carry **actual numeric diameter engraving** on their top printable faces (left to right). The full-body socket samples cut **two opposing cable slots entirely through the external walls**. This is coupon-only behaviour; it does **not** silently add exposed cable slots to the finished sculpture.

**How to use it:** select a pixel profile and download a coupon from Print, physically insert a pixel in each labelled seat, choose the best-fitting hole in Print → Fit calibration, and click **Apply tested fit to all pixel sockets**. This sets the shared `pixelFit` clearance used by the authoritative planner and actual Manifold bore cutter for every LED profile. A **⚙ Calibrated Ø…** badge appears next to the adjustment; Reset restores the previous global value. The sample's diameters and selected tolerance are saved in editable project JSON. Re-prepare the manufacturing mesh after applying or resetting the fit.

Limits: nominal printed diameters vary with filament, nozzle, slicer and extrusion settings. The label describes the generated geometry, not a metrology-verified hole. The full-body wire channels allow cables to escape the coupon sidewalls but do not provide a mechanical strain-relief fastener. Re-test when changing pixel housing, nozzle or material.

## Public code visibility and protection

The repository's original code is marked **all rights reserved** in [LICENSE](../LICENSE). This does not prevent public viewing or forking under GitHub's Terms, and the deployed static website necessarily exposes its client JavaScript. Making the source private, if desired, must be an explicit owner decision because it can alter Pages deployment and would not recall past clones.

## Test and merge requirements

- [ ] Latest commit static tests (syntax/imports/default values/ZIP integrity)
- [ ] Latest commit real Manifold test (narrow vs accepted light routes, 0 enclosed voids, separate registered M3 plate, mixed pixel profiles, stepped LED coupon, old tests)
- [ ] Latest commit browser smoke test (new controls, 3D editing, coupon downloads, combined production ZIP)
- [ ] Cura layer inspection of targeted bores, retaining lips, 0% infill skins, roof spans and mounting holes
- [ ] Print at least a 3-position LED coupon, base/optical sample and detachable plate using intended actual PLA/PETG, nozzle and machine
- [ ] Confirm LED inserts/removes without damage, real light path works, and split/detachable hardware fits without loose/dangerous mounting
- [ ] Update all manuals, version, changelog, project release notes and check against the original comprehensive [PR5 backlog](PR5_MASTER_IMPLEMENTATION_PLAN.md) and [PR6 matrix](PR6_ALL_PHASES.md)

Do not merge until the testable code is green and the remaining physical acceptance items are either evidenced or explicitly presented as release blockers. The live GitHub Pages app stays unchanged on main until merge.
