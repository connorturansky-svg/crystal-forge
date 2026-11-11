# PR7 — v0.12 manufacturing and usability integration

**GitHub:** https://github.com/connorturansky-svg/crystal-forge/pull/12

**Base:** PR6/v0.11.0 merged on main `d71f7e781b247e4caf422ac600e010b2720614be`.

**Status:** draft until the exact-head static/browser/fabrication jobs pass and real Cura slices and printed specimens have been inspected. This single PR combines all five requested workstreams; the table below distinguishes code and verification from the still-unfinished engineering work.

## A — Optical access and shared illumination

**Implemented**
- Opt-in **open underside vault → tapered crystal bore** manufacturing cuts. The `light-port-plan.js` planner computes per-spike safe candidate radii and skips very small crystals. The Manifold subtractor makes real geometry following each crystal's transformed direction.
- Preparation reports **cut vs skipped ports**, and the optical CSV labels them *modeled / not verified*.
- The old erosion-based whole-cluster hollow remains separate and experimental, for existing project compatibility.

**Still required for full acceptance**
- Cura cross-sectional inspection across the entire length of **each** intended spike: ensure no closed skin, unintended side breakout or locally thin shell. An offset bore does not guarantee access to the shared vault.
- Physical light output with one and multiple real pixels, different translucent filaments and small/tilted/faceted spikes.
- Deliberate combination of wiring retention with the open vault; the existing underside solid-base groove planner cannot operate on open-vault geometry.

## B — Physical LED fittings and underside cable routing

**Implemented**
- Live dimensioned 2D SVG **pixel profile** with **A–G** letters, two-headed measurement arrows, fields focusing when letters are selected, and immediate updates as dimensions change.
- A measures body outside diameter; B total LED body length including E (cap); C flange diameter; D flange thickness; E cap height; F cable bundle width; G cable-exit recess depth. The popup explains the printer **fit adjustment is separate**.
- Fixed the printed socket depth: B is now measured from the **actual print-bed underside**, rather than a cutter coordinate 3 mm below the bed. Cap height and wire depth follow measured values where roof thickness allows; truncated holes are reported.
- Real five-hole stepped calibration coupons using the final socket cutter: body, cap, flange, wire outlets and experimental retention.
- Corrected the **single-pixel routing** experience: if there is only one pixel, routes appear only with an outside-edge exit. A one-click action enables both wiring grooves and the perimeter exit.
- Extended edge-exit cutters beyond the base perimeter for a truly open side groove. Paths avoid unrelated LED collars and mounting holes.
- Changed Build's cyan routing preview from a hairline to a translucent **3D rectangular groove volume with the same width/depth and position as the Manifold cutter**. The *BOT* camera view exposes the underside; **Prepare print mesh** is still necessary to view/export the actual carved geometry.
- Added an explicit route count/length/status explanation.

**Still required**
- Measured manufacturers' tolerances, mechanical cable clips/relief that survives repeated use, safe cable bend radius, physical retention pull tests and a true route mechanism for a vaulted base.
- Press-fitting is not guaranteed by a rectangular groove. Verify insulated cable diameter, its tolerance, bend radius and a separate secure strain-relief method. Do not claim electrical enclosure.

## C — Modular construction

**Implemented**
- Detachable mounting preset now places **matching blind M3-style pockets** in the joined base and exports a separate flat plate STL with paired fixing holes and LED access windows.
- The pre-existing optional experimental split dowels remain available and preserved.

**Still required**
- Test actual M3 inserts, bolt lengths, mating-plate contact and printed web strength, especially around LED cutouts.
- More split planes, keyed joints, print-bed-aware sectioning, measured assembly clearances and independently verified secondary safety retention for overhead use. No software-only load rating.

## D — Cura, editing and reliability

**Implemented**
- `cura-model-advisor.js`: model-derived candidate nozzle from the supported UM3 Extended / UM2+ hardware, screens target feature sizes and provides an approximate maximum layer count. A button lets the artist explicitly adopt the suggestion; it does **not** change hardware or guarantee valid Cura imports.
- Existing shape presets, manual point Shift-drag, material/quality generator and geometry/print reports retained.
- Fabrication worker reports load-vs-Manifold timing; on-screen worker creation count now measures actual newly created workers rather than requests.
- Optional `CRYSTAL_FORGE_BENCHMARK_EXTENDED=1 npm run test:benchmark` runs 10, 16, 40 and 60 crystal synthetic cases. It is **not** a performance certification and can be expensive; CI defaults stay lighter.

**Still required**
- Multi-select/structured object editor, complete external custom pixel library import/export, richer material preview and true sliced support/print-time estimates.
- Browser performance measurements on representative hardware; capture and optimize actual hotspots.

## E — Release, quality assurance and compatibility

**New regression coverage**
- Static/pure checks for the dynamic dimensioned SVG, accepted and missing single-pixel cable exits, machine-compatible nozzle suggestions.
- Manifold tests compare manufactured groove cut volume with a control **without** a perimeter exit, and check the stepped 5-hole coupon has closed geometry.
- Browser tests inspect live profile A–G updates, diagram-letter focus, saved custom measurements and the underside shortcut.
- Existing legacy project JSON and completed PR6 feature tests remain.

**Release requirements**
1. Exact PR7 head passes Static, Browser and Fabrication/Manifold GitHub Actions.
2. Real Cura import and layer-by-layer review of pixel cavity **B and E**, flange **C/D**, wire outlets **F/G**, the perimeter groove and the complete light passages.
3. Print actual PLA and PETG fit coupons, a single-LED wire-outlet specimen, a multi-crystal lit sample, and a detachable plate. Record measured tolerances.
4. Confirm no regression in imported project JSON and existing PR6 geometry/camera/UI controls.
5. Keep PR7 as a draft and main deployable until these checks are reviewed.

This document and the PR represent an integration effort across the full scope, **not** a claim that all pending physical engineering is solved.
