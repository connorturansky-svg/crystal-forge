# PR6 — All five development phases in a single pull request

**Release candidate:** v0.11.0 · **Branch:** `feat/pr6-all-phases` · **PR:** https://github.com/connorturansky-svg/crystal-forge/pull/11 · **Base:** merged PR5/v0.10.0

This is a deliberately **large draft pull request** containing code from all five major workstreams. Separate commits, regression tests and human acceptance criteria preserve reviewability. **Presence in this PR does not mean the entire backlog is finished or print-safe.**

## Combined phase implementation / outstanding matrix

| Phase | Working PR6 code | Outstanding for full phase completion |
| --- | --- | --- |
| **A — Cura and reliable fabrication** | Model-aware quality inspection from actual crystal width, nozzle diameter, roof proxy, wire dimensions and Cura settings; downloadable slicer/fit checklist | Real Cura import across nozzle combinations; actual bridge/overhang simulation; Cura print validation, calibrated supports/flow and filament temperature |
| **B — LEDs, wiring and optical pathways** | Per-crystal optical-access candidate audit/CSV, source proximity and caution states; experimental adjustable socket retention compression band; retains PR5 wire routing/profile library | Truly measured component library, per-pixel hardware, independently verified light channels to each spike, removable snap mounts, strain relief and real LED test coupons |
| **C — Modular assembly and mounting** | Conservative split-face alignment dowel planner, optional matching holes in split STLs and separately printable peg coupon | Tested mechanical fit, automatic multiple plane splitting, detachable mounting plates and keys, support/assembly arrangement, physical structural validation |
| **D — Advanced artist editor** | Reusable quartz/needle/geode/soft/blade crystal shape presets, applied globally or to selected unlocked crystals; optional snapped LED/mount X/Z coordinates | True dragging existing holes, full multi-select, saved template gallery, materials/optical previews and comprehensive historical project migration tests |
| **E — Production/quality** | Binary production ZIP with current prepared STL, editable JSON, Cura candidate profile, wiring CSV, optical audit, print checklist, component list and handoff instructions; new CI coverage | Reproducible physical print evidence, calibrated mechanical joints, 10/16/40/60 crystal benchmarks, safe worker memory/cancellation audit, actual installation certification and release documentation |

## Integration gates before merge

- [ ] Static source, import, UI-ID and pure all-phase contract tests pass on **the latest commit**.
- [ ] Manifold checks pass with real material geometry, including optional split dowel mesh and binary STL export.
- [ ] Playwright smoke tests pass for presets, hardware grid, print/optical audit downloads and production ZIP; confirm viewport remains responsive during prepare.
- [ ] Open generated Cura profiles and complete production ZIP in actual Cura 5.x; verify print cores, material, roofs, channels and thin details.
- [ ] Test printed PLA and PETG pixel fit, experimental retaining ridge and alignment dowel pair. Document fit/strength, not just screenshot validation.
- [ ] Check no regressions to PR5 legacy files, notes, manual hole placement, saved profile editor or original multi-LED routing.
- [ ] Resolve all severe failures and explicit manual blockers before marking PR6 ready. Do not auto-merge.

## Important limitations

**Optical audit:** proximity to an LED is not an unobstructed material cavity. Any result means only that a feature is a candidate for slicer review; nothing is reported as proven illuminated.

**Experimental retention:** an adjustable bore restriction may keep a given pixel from falling out, or may crack the part or prevent insertion. It is off by default and must be calibrated physically.

**Split alignment:** dowels are not a load-rated mechanical joint, and aren't designed for hollow/zero-infill-vault bases. Detachable mating plates remain an unfinished feature.

**Printability:** roof span and nozzle checks are heuristics, not Cura's engine. Support-free claims, exact optical transmission and overhead hardware rating still require engineering and testing.

**Production pack:** contains a joined STL of the **last validated prepared mesh**, not an automatic multi-part assembly. Split STLs and dowel pegs remain a separate action. Editing invalidates the prepared mesh and re-enables the export only after a fresh preparation.

## Traceability

Previous master queue: [PR5 master plan](PR5_MASTER_IMPLEMENTATION_PLAN.md). Tracking issues: [A](https://github.com/connorturansky-svg/crystal-forge/issues/6) · [B](https://github.com/connorturansky-svg/crystal-forge/issues/7) · [C](https://github.com/connorturansky-svg/crystal-forge/issues/8) · [D](https://github.com/connorturansky-svg/crystal-forge/issues/9) · [E](https://github.com/connorturansky-svg/crystal-forge/issues/10).

Keep those issues open until their actual end-to-end acceptance gates are met. They serve as checklists for this **one combined PR**, not separate future PR requirements.
