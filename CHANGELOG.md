# Crystal Forge — Changelog

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
