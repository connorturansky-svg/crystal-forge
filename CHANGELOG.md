# Crystal Forge — Changelog

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
