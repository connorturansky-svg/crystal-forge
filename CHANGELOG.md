# Crystal Forge — Changelog

## v0.12.0 — 11 November 2026 (PR7 draft)

- Opt-in targeted actual LED-to-crystal Manifold conduits, with cautious root/roof/reach validation and accepted/skipped counts.
- Different manually placed LEDs can select individual saved seed/bullet/gumdrop/custom profiles for exact planning and cutting.
- Three-position stepped LED-fit coupon samples flange, housing cap, experimental retention and wire relief.
- Detachable M3 mounting preset cuts two registered blind base pockets and exports a separate matching printable plate.
- Full production ZIP can include requested valid split STLs, assembly dowels and M3 plate.
- Cura approximate layer/flow guidance, more precise Web Worker progress and optional extended 10/16/40/60 benchmarks.
- Regression tests and [PR7 acceptance document](docs/PR7_COMPLETE_FABRICATION.md); physical light, hardware and Cura acceptance remain required.

## v0.11.0 — 11 November 2026 (PR6 merged, all five phases)

- **A / Cura:** Model-aware thin-feature, roof and nozzle checklists downloadable as text.
- **B / LEDs:** Per-crystal optical uncertainty CSV and optional experimental bore compression ridge, default off.
- **C / Modular:** Optional mating split-face dowel bores and separate printable peg coupon, solid bases only.
- **D / Studio:** Five scope-aware crystal shaping presets, optional snapped manual LED/mount positions, and Shift-drag to reposition existing manual holes.
- **E / Production:** Validated STL, editable project, Cura candidate, parts list, wiring CSV, optical audit, Cura checklist and build note in one ZIP; additional regression tests.
- See `docs/PR6_ALL_PHASES.md`. All phases are represented in the PR; remaining advanced mechanics and real Cura/physical acceptance are **not** falsely marked complete.

## v0.10.0 — 11 November 2026 (PR5 merged)

- **Cura profile generator:** in Print, choose UM3 Extended/UM2+, actual nozzle/print core (0.25 / 0.4 / 0.6 / 0.8 mm where compatible), PLA/PETG, Fast-to-Fine quality and translucent/balanced/durable intent. Download a .curaprofile ZIP with machine/material-specific overrides for layers, shells, speed, cooling and infill. Unsupported UM3 AA 0.6 is blocked with an explanation.
- Added a real-time Cura settings summary, generated ZIP metadata tests and browser download coverage. Preset temperatures remain inherited from Cura's selected material; actual imports and physical prints must be verified.
- Reorganised all unfinished features into **five large delivery packages** (A–E) covering Cura/printability, LED light paths/hardware, modular mounting, creative editor and production hardening; see the master plan and Cura import guide.

- Added optional physical underside cable grooves between accepted pixels, with a deterministic planner, collision/roof checks, cyan Build previews, optional nearest edge exit and best-effort extra slack.
- Manifold prints now cut planned wiring grooves, report the groove count, unconnected pixels and estimated wire length. Added CSV output with segment-by-segment X/Z coordinates and lengths.
- Fit test coupon now follows the selected built-in or custom LED bore diameter rather than always using a 12 mm test. The diameter slider now supports small seed pixels.
- Added a zero-infill roof-span **2D proxy** to draw attention to potentially long unsupported roof areas, with explicit Cura caveats.
- Added user-entered custom printer X/Y/Z dimensions to the existing printer-fit report.
- Improved CI: no browser QA workflow commits to main; logs stay as downloadable run artifacts. New module paths trigger regression runs.
- Added `docs/PR5_MASTER_IMPLEMENTATION_PLAN.md` for remaining phases, dependencies, acceptance and physical test gates.

**Not verified by a passing test alone:** real wire bend radius and strain relief, LED retention, shared optical access, Cura bridging, full-hill floor edges, child-safe surfaces and overhead mount rating. PR5 stays draft until validation.

## v0.9.0 — 11 November 2026 (PR4 merged)

- Base profiles: Flat plinth, smoothly integrated Plinth + dome, and Full dome / hill; independent dome falloff and side-wall amount. Geometry and crystal seating share a radial profile.
- Pixel profiles: generic nominal 5 mm seed, 12 mm bullet and 12 mm gumdrop forms, plus custom measured profiles saved to a reusable library and portable project JSON.
- Actual Manifold socket geometry: flange-clearance envelopes, blind domed internal ceilings and two shallow underside wire-relief openings. These are not automatic complete cable routes or retention clips.
- Persistent contextual Descriptions panel alongside hover/focus help, explaining all existing mounting types and limitations.
- Tests: base closure and root seating, custom pixel planning and bore geometry, headless controls/profile persistence and static wiring.

**Not verified:** Physical pixel fit, optical connectivity, Cura support requirements, overhead load-bearing strength, and full live desktop visual acceptance. This branch does not change live Pages until merged.

## v0.8.0 — 10 November 2026 (feature branch, awaiting PR review)

- Added global crystal starting thickness (50–400%), signed top/bottom width adjustments (-85% to +400%) and deterministic individual width randomness.
- Replaced vertex shearing with true whole-crystal lean rotation, seated the tilted root perimeter inside the mound, and introduced gentler adjustable preview lighting.
- Updated automatic pixel locations to account for the scaled root and search the whole base; manual placement is now a persistent click-to-add tool with a moving circular preview, orbit lock and Escape/Stop.
- LED channel ceilings are rounded and blind, leaving a modeled minimum 2.8 mm roof; retain full-diameter underside entrance and optional vault side vents.
- Added semicircular edge fixing tabs with control over count, holes per tab, hole diameter, thickness and plastic web. Build previews tabs and holes; valid geometry is fused/drilled in the print mesh.
- Added keyboard-focus/hover control explanations and new automated cases for placement, taper, root seating, bores and tabs.
- Physical validation remains required for Cura slicing, tab strength, printed LED fit, lighting continuity and support-free mound roofs.

## v0.7.0 — 10 November 2026

- Fixed One direction, Criss-cross and Radial inward/outward presets by compensating each crystal's local Y rotation; regenerated crystal leans now align consistently in world space.
- Added Build-stage LED and mounting-hole guides, coloured yellow and purple, with invalid manually placed holes flagged red. Select Automatic or Manual, click to position a hole and fine-tune its X/Z coordinates.
- Manual holes feed the same clearance-aware fabrication planner as automatic holes. Invalid holes are reported and excluded from manufacturing cuts.
- Introduced optional **Zero-infill base structure**: a physically open underside cavity, automatic integral columns with flared buttresses supporting the mound roof, retained hardware collars and side access windows through the LED socket.
- Added buttress-spacing controls, estimated bridge-gap reporting and counts for structural supports and LED side ports.
- Reaffirmed limitation: neither 0% Cura infill nor an open base cavity guarantees continuous light into all crystal spikes, and a buttressed roof is not automatically printable without further supports.
- Automated regressions cover world-aligned lean patterns, manual-hole collision handling and nominal base vault topology.

## v0.6.1 — 10 November 2026

- **Cura-first default:** export the Boolean-joined outer crystal cluster with LED and mounting holes, but no internal crystal hollowing. Cura manages 0–100% infill, wall count and skins.
- Experimental shared-channel hollowing remains available as an opt-in slow mode. This avoids the expensive erosion for normal preparations.
- Important: 0% Cura infill alone does not guarantee an uninterrupted light path through every crystal root; inspect slicer layer previews.
- Repaired the geometry source regression caught by CI during the new spacing/lean/shoulder development.

## v0.4.2 — 10 November 2026

- Reworked crystal tips into a **true curved spherical cap tangent to the faceted point**, with a 1.5–8 mm visible radius control. No decorative flat tip or tiny nipple-like end.
- Migrated older tiny tip-radius settings to a broader default, while preserving saved formations and custom edits.
- Recentered the camera orbit around the actual crystal cluster when regenerating or rebuilding the model, while maintaining viewing direction and zoom distance.
- Added a **Base dome / mound height** slider (0–50 mm) independent of base thickness/height. The domed top is built from concentric polygonal rings.
- Added mesh-topology and dome-height assertions to manufacturing tests.
- Rounded caps are a safer design intent, **not a child-safety certification**; printed tip strength, surface roughness and suitability need physical testing.

## v0.5 — 10 November 2026

- Independent per-crystal shape controls through the existing Design panel, with green selected outlines and red locked outlines. Individual changes are retained as shape overrides.
- Separated micro tip-end rounding from shaft corner bevels and shoulder rounding for crisp, softly blunted low-poly points.
- Added **crystal spacing/overlap** and **angle randomness** sliders.
- Added **base outward width**, independent of height, and six profiles: fitted/faceted, square, circle, rounded, organic/bumpy, and mini-crystal crust with actual faceted accents.
- Changed the default illumination from multiple independent pixels to **one shared pixel below the base**. The manufacturing shell now has an interior base plenum with passages intended to connect larger hollow crystals. Small crystals can remain solid.
- Added floating 3D inspection with an optional hidden grid and bottom-view snap.
- Added removable visual outlines for LED bores (yellow) and mounting/insert bores (purple) in the prepared manufacturing view.
- Added shared hole-placement clearances to prevent overlap between LED and mounting holes. Invalid mounting holes are repositioned or skipped, with warnings.
- Extended manufacturing/browser CI checks for base styles, one-pixel illumination, per-crystal shaping, and feature separation.

**Fabrication caveat:** An internally connected light chamber is still not guaranteed for every small crystal, and uniform wall thickness/supportless printing must be verified in Cura. Pixel openings remain nominal and require a fit test.

## v0.4 — 10 November 2026

- Added the **Manifold WebAssembly fabrication engine**: true Boolean unions between low-poly crystals and integrated bases.
- Added experimental **inward-eroded hollow construction** with a reinforcing root to keep clusters structurally connected. Hollowing is an approximation; wall thickness is not physically certified.
- Added real **12 mm nominal gumdrop pixel socket cuts**, adjustable diameter / printer fit, and a five-hole test strip (11.8–12.2 mm).
- Added physically drilled mounting geometry for screw-through, magnet pocket, M3 insert and custom dual-hole presets.
- Added a dedicated **Prepare print mesh** button, manufacturing mesh preview, topological validation, connected-body and internal-cavity reporting.
- Added print-volume screening for Ultimaker 3 Extended and Ultimaker 2+, a basic orientation recommendation, a colour-coded overhang heatmap and warnings.
- Added separate Z-up **STL** and **3MF** export routes for the Manifold-derived manufacturing mesh.
- Added manual planar splitting with separate closed-part STL exports (alignment connectors remain future work).
- Expanded automated tests using actual Manifold WASM, including hollowing, sockets, mounting holes, file format output and Z-up positioning.
- Added an automated headless-browser test workflow to check the UI and manufacturing path.

**Known limitations:** These are development manufacturing features, not a fully qualified fabrication service. In particular, constant wall thickness, supportless printing, mechanical retention, LED fit and print material behaviour are not yet guaranteed.

## v0.3.1 — 10 November 2026

- Added Light and Dark themes, with preferences saved locally.
- Added in-app Help, keyboard shortcuts, a quick-start guide and a Changelog dialog.
- Fixed the base footprint calculation for nonuniformly scaled or newly generated crystals.
- Preserved all XYZ rotation axes when manipulating crystals using the gizmo.
- Enforced crystal locking during direct and numerical editing.
- Corrected the tip-flat parameter so its labelled measurement is a diameter.

## v0.3 — 10 November 2026

- Redesigned the editor around three colour-coded workspaces: Design, Build and Print.
- Added Simple / Advanced modes that share the same model.
- Added side corner-radius, separate shoulder-rounding and tip-flat controls.
- Added top and bottom width ratios for all crystals.
- Added interactive object tree, individual crystal settings and X/Y/Z transform handles.
- Added snap-to-view camera presets, snapping, multiple preview modes, a colour palette and local project saving.
- Added a basic gumdrop pixel-count and socket-diameter planning interface, alongside a bill-of-materials CSV.
- Made STL limitations explicit: this is not yet a Boolean-unioned watertight assembly.

## v0.2 — 10 November 2026

- Switched to deliberately faceted, low-poly shafts and crystal tips.
- Added seeded cluster composition and integrated base geometry.

## v0.1 — 10 November 2026

- First browser-only geometry prototype with interactive preview and STL export.

## Planned fabrication milestones

- Single manifold Boolean union between overlapping crystals and integrated bases.
- Hollow crystal cavities with underside access, consistent wall thickness and supportless-first internal topology.
- Real 12 mm gumdrop socket cuts, fit tolerance calibration prints and wiring paths.
- Print orientation guidance, overhang detection, assembly preparation, 3MF support.
- More crystal families, per-object advanced shaping and robust project-level validation.
