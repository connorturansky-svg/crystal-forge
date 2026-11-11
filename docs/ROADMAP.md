# Active PR7 — All remaining fabrication phases

[Draft PR7](https://github.com/connorturansky-svg/crystal-forge/pull/13) contains new work across all five phases. [PR7 implementation and real-world acceptance](PR7_COMPLETE_FABRICATION.md) is the current source of truth; [PR6 baseline](PR6_ALL_PHASES.md) and [PR5 master plan](PR5_MASTER_IMPLEMENTATION_PLAN.md) retain the earlier full backlog. Issues #6–#10 stay open until their real mechanical, optical and Cura test requirements are satisfied.

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

