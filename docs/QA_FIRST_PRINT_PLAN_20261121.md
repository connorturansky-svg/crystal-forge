# First-print qualification plan — Crystal Forge after PR #121

**Purpose:** turn strong software export evidence into repeatable, *owner-performed* Cura and physical results. This is a proposed plan, not a report of completed physical validation. Issue #10 stays open until actual observations are recorded. This document is intentionally separate from Codex's live geometry work.

**Baseline to record at each test:** exact merged SHA, app version, saved project/JSON SHA, measured pixel profile ID and dimensions, STL/3MF filename, printer, nozzle, material, Cura version, layer height, support/infill/wall settings, photographs and measurements. Do not mix slicer and file revisions. PR #121's 68.5 mm Gear passed software tests and one CuraEngine 5.13 slice; that is not proof of a successful real print.

## Ready-made comparison models

The independent [QA geometry run #44844374416](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44844374416) generated two matching 32 × 32 × 8 mm, 8 mm-bore reference pieces: **sharp reference** and **0.5 mm / 45° lead-in reference**. Download their STL and 3MF pairs, explanatory README and independently decoded sections from [artifact #14682197240](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44844374416/artifacts/14682197240). Both exported formats measured the conical example's bore radius as approximately 4.485 mm at 7.99 mm print Z, 4.247 mm at 7.75 mm, and 4 mm below the half-millimetre lead-in. **This is sample geometry, not a released Studio feature or a completed physical test.**

UltiMaker's [Cura quality/line-width guidance](https://support.ultimaker.com/s/article/1667337576725) recommends widths around the fitted nozzle size, with typical manual tuning within 75–125% of that size. For the 0.4 mm nozzle, begin with the matching installed Cura preset and check the tiny chamfer in actual layer preview; for AA 0.8, test separately because a 0.5 mm lip is smaller than the normal 0.8 mm line width. [UltiMaker confirms the AA 0.8 PLA core is supported on the UM3 series](https://support.ultimaker.com/s/article/1667337611872). Do not silently enlarge the CAD chamfer without validating neighbouring thin walls and fit.

## Quickest useful sample sequence

| Order / specimen | Printed geometry | Why it matters | Measurements / pass decision |
| --- | --- | --- | --- |
| S1, flat bore coupon | 8 mm bore in 8 mm stock, 0 and 0.5 mm lip chamfer, positive top face | Proves the actual 45-degree rim is visible/comfortable and does not shift shaft fit | Bore at mid-depth with calipers/pins; lip visibly smooth, no sharp flash or distorted top face |
| S2, LED fitting strip | Actual saved A–G measured seed and gumdrop profiles; 3 deliberate clearances around the intended nominal fit | Choose hardware-specific clearance before a costly model | Actual LED body/flange dimensions, insertion, retention, removal, flange seat, wire clearance; record best tested profile, not a universal tolerance |
| S3, repaired openwork Gear | 68.5 mm / 12 teeth / 5 windows / 8 mm bore; Rim rail and Hub and rim where needed | Physically check #120/#121 flat top, spoke walls, raised relief and mechanical fit | Verify 5 windows + bore open, 45-degree top rims, no crinkles, 8 mm shaft fit, intact rim and no fragile loose fins |
| S4, support-free pixel roof / shoulder | Valid conical and pointed sockets, default and support-free shoulder options in Crystal and one native backed solid | Test roof/overhang and insertion flange, not merely Manifold volume | Layer inspection, sagging, internal support debris, retained cap, unchanged flange seat, cavity depth and pixel seating |
| S5, functional wiring | Short straight + two-bend route, P1→Pn and both perimeter exits on an eligible solid Tile | Check real cord/cable passage and bend, not just a rendered arrow | Real wire passed without scraping; route width/depth, corners, exits, no pinched retained LED; reject model if unsafe |
| S6, physical attachment | 3.4 mm pilot, recess/countersink and external backing tab on suitable stationary solid | Verify fastener fit without claiming load rating | Hole dimensions and residual wall; screw head actually seats; tab does not crack; no load claim without separately approved tests |
| S7, illumination | Selected real LED behind actual printed translucent/opaque material | Model may have a physically present light cavity yet poor optical output | Light enters intended feature, acceptable hotspot/diffusion, no unexpected glare/heat; record voltage and temperature under supervised conditions |

For each specimen, keep both **supports OFF** and a Cura layer preview screenshot. Supports-off slicing alone is insufficient: confirm each non-supported layer actually connects to earlier material, particularly conical roofs, bridge starts and slender chamfer rims. If support is required, record why and do not label the design support-free.

## Printer/profile matrix to start with

1. **Ultimaker 2+**, PLA, installed 0.4 mm nozzle: start with Cura's valid PLA machine profile, approximately **0.2 mm layers** as a *trial*. Retain the real nozzle/profile identifier and use the same settings for S1, S2 and S3 to make geometry comparisons meaningful.
2. **Ultimaker 3 Extended**, PLA using an **AA 0.8 print core** if installed: start with a matching supported Cura preset, not a scaled 0.4 mm preset. Trial a 0.2–0.3 mm layer height only if the installed profile permits it, then examine narrow walls, bevels and the support-free roof for coarseness.
3. Do not compare the 0.5 mm chamfer's visible quality between 0.4 and 0.8 mm nozzles without recording line width. UltiMaker documents a line width normally close to nozzle diameter and a usual recommended range of **75–125%** of nozzle size. A coarse nozzle may not faithfully resolve a small lead-in even if the CAD geometry is correct.
4. For dual material, confirm actual printer material pairing, extruder assignment, alignment and support/prime settings in Cura; a valid 3MF resource list is not evidence the printer has mapped each body to the right print core.

Official references:
- Cura quality and line width: https://support.ultimaker.com/s/article/1667337576725
- Cura support behavior: https://support.ultimaker.com/s/article/1667417606331
- UltiMaker 3 series AA 0.8 core compatibility: https://support.ultimaker.com/articles/Knowledge/1667337922171
- Current PLA and printer compatibility: https://support.ultimaker.com/s/article/1667337611872

## Minimum software and file preflight before printing

- Download *fresh* STL and 3MF after the last edit; compare exported dimensions and job ID to the visible Print Centre record and the saved JSON version.
- Verify Z-up orientation, millimetre scale, actual printer build envelope, same material positions, supported stock behind holes/roof and a physical escape for cables.
- Reject non-watertight, zero-area, disconnected or folded mesh when the model expects one connected printed body. Check actual layer toolpaths around holes, openings and raised relief.
- Preserve project JSON and the *exact printed* STL/3MF as evidence; avoid reconstructing a different model from a screenshot.
- If the in-app edge-finishing warning says it skipped a narrow rim, **do not count that rim as touch-safe**. Photograph/measure the actual exposed edge.
- Check visible surfaces and internal openings accessible to visitors. Avoid treating any software report as child-safety, overhead/load, heat or electrical certification.

## Record results

Use `docs/qa/PRINT_TRIAL_RESULTS_TEMPLATE.csv` as a sample log and attach real files/photos to issue #10. Every result must identify model, real printer and measured hardware. For each failed trial: attach the source JSON and generated STL/3MF, record exact reproduction and the corrective adjustment, then link a new *software* defect to issue #79 only when a reproducible product geometry/UI problem remains.

### Reasonable completion gate

The first print milestone is **not** all seven families physically certified. It is: one validated LED fit coupon, one chamfer/openwork model, one support-free roof and one real cable path on a named printer and profile, with actual observations and failures documented. Only then broaden the physical test matrix to Characters, Caps, Pods, Waves, custom imports and other materials.

## Related program work

- Software parity/geometry: #79.
- Owner physical acceptance and first article: #10.
- PR #120: corrected top-chamfer algorithm; #121: raised Gear rim export fix.
- Independent cut-mouth measurement pack: draft #122.
- Native full Build workflow tests remain essential; successful isolated STL sections do not establish a functioning published Studio.
