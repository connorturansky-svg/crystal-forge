# PR10 — v0.14 software candidate: curved cabling, Cura and private sync

[Draft PR #16](https://github.com/connorturansky-svg/crystal-forge/pull/16) implements the user's latest priorities on a new branch after merged PR9. [Manual acceptance guide](PR10_TEST_GUIDE.md) includes cross-device recovery and physical print tests.

- **P0:** physically opposed 180° LED IN/OUT ports, smooth tangent-led cable routes, 25/50/100/custom interpixel length limits, red warning and fail-closed manufacturing, arrows, Set P1/reverse and selected marker click-hold dragging.
- **P1:** optional GitHub PRIVATE repository vault with memory-only scoped token, local backup before pull/merge, auto-sync while connected, SHA conflict prevention, a named multi-project library, complete local backup import/export, previous GitHub version restoration and custom LED profile/template portability. An old machine's local profiles still require export or upload from that machine.
- **P1:** Cura quality type selection/automatic candidates, and a manual plain-text settings fallback when Cura reports an import is hidden.
- **Validation:** exact-head static, browser and Manifold CI still required; real Cura profile visibility, PLA/PETG slices, measured cable and LED fittings, serviceability and mount loads cannot be certified here.
- **Still open:** robust OAuth account linking, unattended permanent cross-device login, automated bed nesting, measured clips/strain relief, true optical output and installation safety.

All prior PR5–PR9 milestones remain in the history below, but earlier "active" labels refer to their historical release branches.

---

# PR9 — Combined outstanding development (v0.13 experimental)

**Active executable implementation:** [Draft PR #15](https://github.com/connorturansky-svg/crystal-forge/pull/15) combines major software work across [issues #1, #6–#10](https://github.com/connorturansky-svg/crystal-forge/issues). [Hands-on test guide](PR9_TEST_GUIDE.md) provides test cases and physical acceptance boundaries. The live GitHub Pages site remains v0.12 until reviewed merge.

| Track | Implemented in PR9 | Still needs development or physical testing |
| --- | --- | --- |
| B · Serial LED wiring | P1 IN → Pn OUT physical cable-bundle grooves, separate edge entry/output even for one pixel, safe fail-closed routing, stable IDs and RGB index CSV | Actual cable fitting, strain relief, physical light output and LED service clips |
| D · Editor | Numbered P/M/T 3D markers, linked Build cards, reordering, contextual double-click add, adjustable panel sizes, six-family weighted mixing, named local templates and batch selection/edits | Full multi-object gizmo, advanced material simulation, mobile/teacher UI and shared component library |
| A · Print/Cura | Wall/roof and blocked serial-route warnings, cutaway preview, existing profile generator and STL/3MF retained | Actual Cura slice validation, true slicer-aware bridge detection and reliable print tolerances |
| C · Modular | Retained PR7 registered M3 plate, split parts and dowels | Automatic multi-plane bed nesting, tested connectors and load ratings |
| E · QA | Added serial Manifold, identity, template, weighted and browser test fixtures; wiring CSV/production ZIP updates | Thorough memory/cancel stress tests, old project migration fixtures and actual hardware samples |

**Unverified:** browser/manufacturing checks must pass on the latest PR commit. This software cannot certify mechanical/overhead safety, structural strength, optical transmission or physical printing. Open issues remain open for unmet requirements.

## PR8 — merged planning phase

[PR8 #14](https://github.com/connorturansky-svg/crystal-forge/pull/14) merged the design requirements into main; it intentionally did not implement serial wiring or the hardware UI. PR9 implements the first working code.

---

# Next phase — PR8: physical pixel-string routing and identifiable hardware

**Status: planning draft; no implementation in PR8 yet.** [PR8 P0 specification](PR8_CRITICAL_WIRING_AND_HARDWARE.md) supersedes the old side-by-side paired-wire assumption as the **highest-priority** software task. **P0-A:** each pixel has opposed IN/OUT cable tails, the first and last tails reach safe base edges even for one pixel, and explicit pixel ordering defines every physical route (not greedy/side-by-side tracks). **P0-B:** numbered P1/P2/… and M1/M2/… 3D markers linked to Build cards, sortable pixel order, and a double-click contextual Add Pixel / Add Mount menu. **P0-C:** shared planner, true Manifold cuts, regression fixtures, export/persistence consistency. **P1:** targeted real light paths, Cura thin-wall/bridging and measured service/strain relief. Track [#7](https://github.com/connorturansky-svg/crystal-forge/issues/7) and [#9](https://github.com/connorturansky-svg/crystal-forge/issues/9) first, then [#6](https://github.com/connorturansky-svg/crystal-forge/issues/6).

## PR7 — merged baseline (v0.12.0)

[PR7](https://github.com/connorturansky-svg/crystal-forge/pull/13) merged into main on 11 November 2026. It delivered substantial real-but-experimental fabrication, pixel fit, optional two parallel grooves, modular assets, Cura advice and regression tests. **Do not confuse PR7's two parallel lanes with the required serial pixel-string routes**; the latter are not implemented. [PR7 implementation/physical acceptance](PR7_COMPLETE_FABRICATION.md), [PR6 baseline](PR6_ALL_PHASES.md) and [PR5 master plan](PR5_MASTER_IMPLEMENTATION_PLAN.md) retain historical detail. Issues #6–#10 remain open until their unfinished functional and physical gates are met.

# PR6 — Combined five-phase draft

A single [draft PR6](https://github.com/connorturansky-svg/crystal-forge/pull/11) implements changes across all five delivery packages. [Full acceptance matrix](PR6_ALL_PHASES.md) distinguishes working code from advanced/physical features still pending. [Original detailed backlog](PR5_MASTER_IMPLEMENTATION_PLAN.md) and issues #6–#10 remain authoritative.

# Crystal Forge roadmap

**Current master backlog:** [PR5 master implementation plan](PR5_MASTER_IMPLEMENTATION_PLAN.md). It separates completed work, active PR5 wiring/print diagnostics, queued mechanics and exploratory phases, with individual acceptance gates.

Status notation: **BUG** = reproducible or directly evidenced; **RISK / VERIFY** = potential problem not yet proven by a test print; **REQUIRED** = explicit request; **AGREED** = adopted approach; **PROPOSAL** = suggested but not yet accepted; **LONG-TERM** = exploratory. Priority rankings are guidance for the next development session, not user-approved delivery dates.

## P0 — Baseline verification and regressions

| Item | Class / priority | Evidence and next acceptance criterion |
| --- | --- | --- |
| Print a real vault + LED sample | RISK / VERIFY · P0 | v0.7.0 tests show one connected geometry, not reliable bridging or illumination. Slice at 0% infill, record maximum unsupported spans, physical roof quality and whether LED bore side vents reach a usable air chamber. |
| Verify all crystals illuminate from a shared LED | REQUIRED outcome / RISK · P0 | 0% Cura infill can still seal spike bases with skins. Test actual slicing and one real translucent filament sample. Consider a limited targeted opening if full-cavity erosion is too costly. |
| Test manual LED/mount click-to-place end to end | REQUIRED / unfinished tests · P0 | UI was implemented v0.7.0. Existing Playwright smoke checks control existence; add actual click, X/Z editing, red invalid indication, export plan equality and saved JSON round-trip. |
| Confirm world-space lean on real interface | Prior BUG, fixed in source / VERIFY · P0 | Test numerical dot-products already; include browser visual checks for One direction and Radial inward at zero randomness after regeneration and per-crystal yaw. |
| Protect current live `main` from unreviewed changes | AGREED workflow · P0 | Keep PRs from topic branches; GitHub Pages stays main-only. Check latest origin and workflow SHA before merge. |

## P1 — Known limits and unfinished functionality

- **REQUIRED/unfinished:** stronger screen for long roof bridge spans and layer-to-layer support, not just triangle overhang slopes or approximate vault gap. Any red/yellow heatmap must state its approximations; Cura still authoritative for slicing.
- **REQUIRED/unfinished:** accessible LED opening that is not merely a bore with a blind ceiling, plus route into intended spikes. Current vault has side windows, but route into all spikes remains unproved.
- **REQUIRED/unfinished:** performance budgets for preparation on representative 10/16/40/60-crystal combinations, with/without dome, vault, manual features and experimental full hollowing. Current Worker responsiveness/caching improved, but worst-case profiling is not systematic.
- **RISK / VERIFY:** constant wall thickness is not certified in experimental hollowing; narrow spikes may stay solid. Need sample min-wall inspection before recommending for print.
- **RISK / VERIFY:** very wide spacing can exceed build-volume limits; designer should explain why 100% separation and a one-piece base may be incompatible with a selected printer.
- **RISK / VERIFY:** irregular outlines, tall domes and socket/mount arrangements may still produce hard-to-print unsupported features; expand Manifold and Cura configurations.
- **RISK / VERIFY:** saved projects from prior versions may preserve experimental hollowing and geometry settings; add versioned JSON fixtures/migration tests.
- **RISK / VERIFY:** visual Build hardware guides and 3D click plane must clearly distinguish the underside XY/XZ plane from visible upper surfaces; invalid manual holes are excluded rather than force-applied. Ensure UI warns before export.
- **UNFINISHED:** actual LED clips/retaining lips, physical insertion depth, wire channel, cable strain relief and serviceable LED housing.
- **UNFINISHED:** proper part orientation selection and guaranteed support-free construction, including bridge simulation; current 45° heuristic is advisory.
- **UNFINISHED:** auto cut connectors, physical splitting dowels/alignment, build instructions and removable mounting plates/keyholes.
- **UNFINISHED:** comprehensive optical/filament simulation — viewport glow is aesthetic, not an accurate light model.
- **UNFINISHED:** broader printer profiles, Cura profiles, physical tolerance calibration and mechanical testing.
- **KNOWN PROCESS ISSUE:** the browser workflow writes `qa/latest-browser-test.log` back to main as a new commit after successful main pushes. This can create noisy main HEAD changes and complicate concurrent GitHub-API commits. Consider using workflow artifacts/check annotations instead, after reviewing whether historical logs are useful.

## P2 — Agreed improvements not yet finished

- **AGREED direction:** a faster, Cura-first default, with optional vault and experimental full hollowing clearly separated. Improve help/warnings so users understand how wall count, top/bottom skins and light paths interact.
- **AGREED direction:** fully inspectable manually positioned pixels and mounts. Future improvement: in-viewport drag handles, snap/grid and 3D projection suited to underside editing, while keeping `planHardware` authoritative.
- **AGREED direction:** consistent rounded shoulders/safe cap aesthetics at all crystal scales; expand geometry test matrix and visual screenshots.
- **AGREED direction:** keep Worker's cancellation/reuse responsive for large models and avoid UI stalls when clicking Prepare multiple times.

## P3 — Exploratory ideas, NOT approved requirements

- **PROPOSAL:** automated cutaway/cross-section showing the LED-to-spike path, with a diagnostic list of blocked roots.
- **PROPOSAL:** configurable continuous internal tapered ribs or tree-like support branches replacing discrete vault columns where that reduces roof bridging.
- **PROPOSAL:** printability quality presets based on selected layer height/nozzle and printer material, with calibrated bridge distances.
- **PROPOSAL:** automated fixture/retention geometry for particular gumdrop models (requires actual measured parts).
- **PROPOSAL:** additional optical material previews and per-crystal illumination analysis.
- **LONG-TERM:** more robust assembly/panelisation and one-click validated prints of large clusters.

## Completed work to preserve

The following are implemented and should not be re-added as new features: six formation patterns, seeded generation, per-crystal shapes/locks/gizmos, world-space lean presets, wide spacing, centred floating orbit, even lighting, multiple base styles/dome/rim, Cura-first exterior, optional vault, experimental hollowing, nominal pixel and mount bores, automatic/manual hardware planner, Z-up STL/3MF, calibration coupon, report/heatmap and existing Manifold/Playwright CI.

## How to move items

On discovering a reproducible failure, add exact steps, input settings, actual/expected outcome, affected commit and severity. When fixing, reference the regression test and move a short note to `docs/DEVELOPMENT_HISTORY.md` and `CHANGELOG.md` (if user-visible). Do not mark a RISK as BUG without evidence, or a BUG as verified fixed from code inspection alone.


## v0.8 integration — current PR #3 (10 November 2026)

- **Implemented, verification in progress:** slider ranges/global thickness, seeded width randomness, rigid leaning, mound-root seating, softer adjustable studio lighting, blind domed LED bores, auto-placement fallback, continuous LED placement, hover tooltips and printable perimeter fixing ears.
- **Browser regression confirmed on feature commit 137920c0:** hovering a tab-control slider shows an explanation; Build displays edge-tab controls, a valid cursor follows the pointer, and two LED clicks succeed without exiting placement; Escape restores orbit.
- **Manufacturing geometry test pending at time of writing:** new extreme-taper/root-seat and actual Manifold tab/rounded-bore checks must pass on latest PR commit.
- **P0 physical inspection still needed:** open the prepared v0.8 STL in Cura, verify blind LED roof/clearance, root-to-base junctions, holes in tabs and support requirements; test a printed tie/bolt tab and LED fit before any overhead use.
- **P1 future:** continuous placement in underside view, precise drag handles, retained single-pixel move action (continuous placement currently converts to Multi), explicit collision and printer footprint visualisation when scaling crystals.

## PR4 v0.9 draft (11 November 2026)

- **Implemented on branch:** integrated full-hill/plinth modes, dome falloff and side wall controls; generic/custom LED profile selector, library editor, flange-aware socket cutting and shallow underside wire relief; persistent descriptions panel.
- **Verification pending:** review GitHub checks against latest PR4 HEAD, test contour/fillet matching and base roof slicing in Cura, print a measured LED fitting sample and inspect cable exits.
- **Follow-on milestones:** retaining clips, strain relief, full automatic wire routing, actual measured manufacturer's LED models, optical path cross sections and physical safety testing.

## PR7 coupon calibration and source protection update

Implemented on the draft PR7 branch: engraved five/three-size physical fit samples, side-open wire slots in full-body specimens, chosen-hole calibration applied globally to LED sockets with a visible reversible override, and an all-rights-reserved original-source notice. Physical tolerance, actual cable strain relief and real Cura/print tests remain acceptance requirements. Public source visibility remains unchanged.

