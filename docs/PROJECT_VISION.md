# Project vision — why Crystal Forge exists

**Evidence:** earlier design conversations on 10 November 2026, the current project discussion, repository source, README and changelog. When a point is an interpretation rather than a direct request, it is labelled accordingly.

## Creative origin — confirmed user intention

Crystal Forge began as a design tool for a creative, **interactive cave/installation with 3D-printed illuminated gemstones for young people**. The aim was not a general CAD package or scientifically accurate mineral simulator. It was a fast, approachable way to make many distinct tactile-looking, translucent, internally lit formations that can become physical components of an artwork or workshop.

The desired visual language became clearer through iteration: **stylised, cartoony low-poly crystals** with recognisable shafts and peaks, conspicuous large flat faces, clustered large/medium/small forms, somewhat irregular growth, and a compact common base. Earlier tries at volumetric noise or highly realistic crystals were less compelling. Smoothness should selectively soften edges or touchpoints, **not erase faceting** or make melted cylinders, nipples or flat-chopped ends.

The project is both a **generator** (rapid variations, repeatable seeds, coherent patterns) and an **editor** (select a particular crystal, manipulate its own geometry and position, protect locked designs). The user wants immediate 3D feedback, a centred floating inspection experience, and the ability to move between simple creative controls and deeper fabrication settings without losing a formation.

## Intended audiences and actual constraints

- Primary maker: an artist/educator designing installation-ready clusters rather than operating a traditional CAD workflow.
- Intended encounter: young people and installation participants. Rounded/touch-considerate points and reliable attachment matter; this does **not** confer a safety certification.
- Fabrication: consumer/prosumer FDM 3D printing, especially Ultimaker 3 Extended and Ultimaker 2+ profiles, with Cura slicer inspection and different filament appearances.
- Lighting: often **one underside 12 mm nominal gumdrop pixel** (~22 mm body) illuminating multiple crystals. Sometimes more pixels, custom/manual positioning or no lighting. Nominal bore fit, room for the housing, cable access, continuous optical routes and translucent material are important.
- Constraints: browser responsiveness, reliable actual STL/3MF, repeatable prints, manageable supports and material; not just an attractive preview.

## User-experience principles

1. **Create first, refine second.** Seed, family, silhouette, spacing, pattern and lean controls should be inviting and visually responsive. At one end the formation is tightly entwined; at 100% spacing crystal envelopes should not overlap.
2. **Clear, consistent editing.** Selecting a crystal exposes individual shape settings and green highlight (red when locked); deselecting returns to the group. XYZ gizmos, snap views, predictable world-space lean patterns and camera recentering avoid visual disorientation.
3. **Separate creative and engineering concerns.** Design, Build and Print workspaces are colour-coded. Simple mode provides a coherent default; Advanced reveals detail without changing the underlying design.
4. **Honest preview versus print.** Lightweight overlapping solids are fine while editing. Only the Manifold-joined, inspected manufacturing geometry should be exported as the validated print mesh.
5. **Practical illumination.** The real goal is a lit cluster, not a nominal socket count. Light must be able to leave an LED bore and reach the intended volume. Cura infill and skin settings affect light even when the model file is a solid exterior.
6. **Supportless-first, not miraculous.** Prefer slope-supported roofs, modest wall thickness and understandable Cura warnings. Actual bridge length, material, hardware clearance and physical tests remain necessary.
7. **Make iterations recoverable.** Auto-save in browser, portable JSON, a meaningful version/changelog, regression tests and an easy handoff across assistants.

## Significant shift in fabrication philosophy — agreed

Early experiments attempted to explicitly hollow the entire Boolean cluster with a shared internal balloon chamber and separate light passages. The computation could be very slow and generated uncertainty about real wall thickness, lighting and accessibility. On 10 November 2026 the user explicitly preferred **solid exported outer geometry with Cura controlling infill from 0% to 100%**, while retaining real hardware cuts. That became the default in v0.6.1; older experimental hollowing remains opt-in.

The later underside **zero-infill base vault** is not a reversal: it adds only the internal base shape required for practical printing (open chamber, sloped/tapered integral buttresses, socket collars and side vents). Individual crystal infill still belongs to Cura. The user is exploring how to obtain a lightweight, illuminated, reliably printable mound without the cost of full volumetric hollowing.

## Long-term ambition (direction, not a promise)

A creative, trustworthy design-to-print system that can generate expressive clusters quickly, allow deliberate per-object and LED placement, anticipate fabrication hazards, and deliver reusable physical artworks. Desired future tools include smarter bridge/roof inspection, proven shared light channels, fit calibration, mounting/retention hardware, modular splitting/assembly and performance profiling. These are **future directions**, not evidence that they are already solved.

See `docs/FEATURE_SPECIFICATIONS.md` for acceptance criteria and `docs/ROADMAP.md` for priority/status.
