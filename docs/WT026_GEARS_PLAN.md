# WT-026 · Cog top controls: design, geometry and acceptance

**Status:** implementation draft, not owner-approved, manufacturing-certified or physically qualified.

## Purpose and design

Extend the existing Cogs & Gears builder rather than inventing an eighth builder. One Gear model contains a versioned, editable list of top grips in its build.gearTopControls. This data flows through project JSON, undo/redo, local persistence and the model's print-job fingerprint. Earlier Gear models without that property are unchanged.

Create a Gear, add a printable grip by choosing a preset or double-clicking its exposed flat top in Design, then click and drag horizontally or enter exact X/Z coordinates. Adjust width, depth, height and rotation independently. Preset families include offset bulbous two-thirds spindle, straight taper, hourglass, mushroom, domed, centred fluted, scalloped and textured dial, rectangular and two-wing grips. Surfaces include smooth, ribs, scallops, diamond texture and horizontal grooves.

**Integral handle, not a free-spinning bearing:** This release models a grip fused to the gear. It does not model a separately rotating handle with axle, bearings, washer or mechanical tolerance stack.

## Data and manufacturing contract

Each control has a stable id and presetId; kind (spindle, knob, rectangular or wing); x, z, rotation in degrees; width, depth and height in mm; profile, surface, join style and joinMm. Supported joins are None, Chamfer and Round. Dimensional validation is finite and bounded; maximum eight grips per Gear.

The Gear generator exposes a non-exported gearHost descriptor with real outer profile, shaft bore, openings/windows and base face elevation. Each grip is a capped, lofted Y-up positive body with 0.4 mm intrusion into its host; where enabled its base shoulder broadens smoothly or linearly into the wheel. The chamfer is an intended 45-degree shoulder; Round is a multi-ring eased transition, not a general CAD fillet operator.

For manufacturing, existing Gear stock plus grips is Boolean-unioned in prepareRecipe. The original measured shaft bore is then cut upward through the entire combined assembly **after** the union, so a centred dial does not plug the hole. The cutter is anchored at the gear origin and does not shift with an off-centre handle. STL/3MF exports come from prepared geometry, not overlapping preview shells. Fail preparation on disconnected positive regions, invalid solids, unsupported placement or failed bores.

Placement checks the grip's shoulder footprint against gear boundary, shaft bore, windows and other grips. Invalid moves are explained with text and red preview tint. A user can always edit placement numerically instead of dragging.

## Safety, usability and known limits

- Supported mounting face is currently the exposed horizontal base top. Raised hub collars, raised rim rails, curved side surfaces, imported geometry and arbitrary faces are not certified placement targets.
- Existing Gear serial routing with a top grip is explicitly rejected in this initial slice, rather than implying it is collision-safe.
- The new grip footprint validation does not yet certify all pixel seats, recessed fixings or cable channels; the manufacturing pipeline remains authoritative and further intersections should be regression-tested.
- A continuous shaft bore is preserved, but manual mounts and moving-gear teeth remain subject to real fit, pinch-point and load tests.
- A curved base spreads the joining material, but it is not a guarantee of strength. Print orientation, nozzle diameter, wall count, material, layer bonding and load direction must be assessed with a test print.
- Diamond knurl and shallow groove details are actual geometry. The user must check their printability at intended nozzle width.
- Do not modify WT-023 persistence or WT-024 two-level help globally to land this feature.

## Follow-on WT-026B — proper saved-model composition

Support choosing a separately saved Buttons & Control Caps model or immutable library revision, copying the parameterised recipe as a component, independently transforming and resizing it, and joining it to a Gear while preserving the Gear's authoritative functional bore. Resolve inherited cap sockets and negative features explicitly; never silently erase a shaft or duplicate a cutter. Maintain independent source model revisions, component IDs and safe undo/redo. Follow with a truly separate bearing-mounted crank-handwheel assembly option; that must be a separate printable body with user-configurable axle and fit tolerance, not mislabeled as an integral grip.

## Research sources

- Autodesk Fusion — combining solid bodies: https://help.autodesk.com/cloudhelp/ENU/Fusion-Model/files/SLD-COMBINE.htm
- Autodesk — handling fillets after joining bodies: https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/Incorrect-fillet-or-chamfer-result-where-the-original-edge-remains-visible-between-two-coincident-bodies-in-Autodesk-Fusion.html
- Prusa — design/model for 3D printing: https://help.prusa3d.com/article/modeling-with-3d-printing-in-mind_164135
- W3C WCAG 2.2 — keyboard, drag alternatives and pointer targets: https://www.w3.org/TR/WCAG22/
- University of York — design for manufacture (3D printing): https://uoy.atlassian.net/wiki/spaces/TSS/pages/303693996/Design%2Bfor%2BManufacture%2B-%2B3D%2BPrinting

## Verification gates before owner review

1. Run npm run test:static including all ten presets, deterministic loft, exact W/D/H, invalid coordinates and legacy fixtures.
2. Run npm test with real Manifold unions, through-bore probe, exposed hole checks, dual-material separation and STL/3MF output checks.
3. Run npm run test:browser and dedicated gear-top-browser test for add, select, size, drag, invalid rollback, undo/redo, keyboard and console errors.
4. Check exact-head GitHub Actions, release-metadata check and cross-family regressions.
5. Physically verify 0.4 mm and 0.8 mm nozzle, PLA/PETG, grip loads, clearances, top and base interfaces and actual slicer orientation. Do not claim a test print without one.
