# Crystal Forge — Browser Studio v0.5

A browser-based low-poly crystal generator and fabrication prototype for illuminated, hollow, child-safe crystal sculptures. **Open the app:** https://connorturansky-svg.github.io/crystal-forge/

Runs in Edge or Chrome with no installation or Python. JavaScript modules, Three.js and the Manifold WebAssembly geometry library load from the internet. Project files and theme preference are stored locally in your browser; export JSON for backups or moving to another computer.

## Workspaces

- **Design** — Six formation patterns, six crystal families, reproducible seeds, crystal spacing/overlap, angle randomness, top/bottom ratios, separate side/point rounding, coloured materials, individual crystal shaping and XYZ editing, locks and selection.
- **Build** — Six base styles (fitted, square, circle, rounded, organic, miniature crystal crust), independent outward rim width and base depth; a thin shared balloon-style chamber with one underside 12 mm pixel push-fit by default; optional multiple pixels; nominal hole-fit adjustments and screw/magnet/M3/custom mounts.
- **Print** — Press **Prepare print mesh** to Boolean-union the individual crystals and integrated base into a Manifold solid, erode/cut requested cavities, subtract pixel sockets and mounting holes and analyse the result. Inspect the joined mesh in Solid/X-ray, a floating grid-free underside view, colour-coded yellow/purple hole overlays or an overhang heatmap, then download STL or 3MF.
- **Support tools** — Pixel-fit calibration strip (11.8, 11.9, 12.0, 12.1, 12.2 mm), editable cut plane and split-part STLs, basic bill of materials CSV, view snapping, simple/advanced interface, resizable viewport, light/dark mode, in-app Help and Changelog.

### Use

1. Go to **Design** and generate a formation. Keep the side bevel small (0.5–1 mm) to retain the clean, cartoon-like crystalline facets; reduce *shoulder rounding* and *tip flatness* to avoid bulbous or nipple-shaped points.
2. Go to **Build** to select the base shape and how many millimetres its rim extends past the crystals, then select one shared underside pixel (default) or multiple pixels, hollowing and an optional mounting preset.
3. Go to **Print** and click **Prepare print mesh (Boolean union)**. The manufacturing mesh is created **separately** from the fast editable preview.
4. Inspect the resulting report: topological validity, separate material bodies, internal void shells, printer size, number of sockets and mount holes, approximate PLA consumption and likely unsupported triangles.
5. Enable the **colour-coded overhang heatmap** if helpful. Export STL or 3MF only after preparation succeeds, then inspect and slice in Cura.
6. Select a crystal in the viewer or object tree; the shape controls now edit **just that crystal**, highlighted green (red if locked). Use Edit all crystals to return to global mode. Use Floating + BOT to inspect the base without a grid, and Hardware IDs to highlight pixel bores yellow and mounting inserts purple. Save editable projects with ↓ Save.

Changing fabrication-relevant settings invalidates the previously prepared mesh to prevent exporting stale geometry.

## Current capabilities and engineering limits

| Feature | Status |
| --- | --- |
| Six growth patterns, geometry shaping and XYZ handles | Implemented |
| Watertight Boolean union and Manifold 3.5.4 solid validation | Implemented; passing automated representative tests |
| Approximate hollow shell via inward erosion and reinforced root | Implemented; **minimum wall thickness still needs physical/slicer verification** |
| Automatic nominal gumdrop socket holes | Implemented; fit and retention require test prints |
| Screw, magnet, M3 and custom dual mounting holes | Implemented; not structural/load certified |
| STL and 3MF (slicer Z-up) | Implemented; package/file-format checks in automated tests |
| Calibration test strip and modular cut-plane splitting | Implemented; alignment connectors not yet included |
| 45° default overhang screening, heatmap, orientation suggestion | Implemented as **screening**, not support-free certification |
| Printer volume check: UM3 Extended 215×215×300, UM2+ 223×223×205 | Implemented for upright, single-extruder profile |
| Manual LED positioning, retaining clips, true constant-wall structures | Not implemented; balloon cavity now links the base chamber to larger crystals using internal passages |
| One-click supportless redesign, automated snap-fit connectors, full mounting plates | Not implemented |

**Safety and printing:** Manifold validation checks the topology of the Boolean mesh, not every manufacturing constraint. The new shared chamber is made using inward erosion and internal air passages; small/strongly tilted crystals may remain solid or contain inaccessible pockets. Test that the LED opening reaches the chamber and inspect actual wall thickness in Cura. Some hollow cavities or underside roof surfaces may need supports; thin areas, hardware tolerances, pixel spacing, overhead loads and physical strength require validation. For overhead or child-accessible installations, use mechanically rated fixings and independent safety retention. Do not trust printed parts without a suitable physical test.


## Tip safety, orbit controls and domed base

- **Tip radius** is now a true spherical-cap curvature in millimetres, beginning at a tangent to the crystalline pyramid. Its 1.5–8 mm slider avoids the previous flat/nipple-like ends. The default is 3.5 mm, with older tiny-radius settings migrated automatically. Printed surface roughness and child suitability still require real-world checks.
- **Orbit target** recentres on the true cluster bounding-box centre after model rebuilding/regeneration. Orbiting should no longer swing the cluster away from view.
- **Base dome** is independent of the normal base height and outward base width. It uses nested polygonal rings to form a curved mound, up to 50 mm tall.

## Keyboard and viewport

V Select · G Move · R Rotate · S Scale · F Frame · Del Delete · Ctrl+Z Undo · Ctrl+Y Redo · Esc Deselect. XYZ gizmo arrows: X red, Y green, Z blue. Standard camera views include ISO, Front, Back, Left, Right, Top.

## Implementation

- `index.html`: static interface and Help/Changelog.
- `studio-v3.js`: viewport, saved settings, object editing and manufacturing workflow.
- `geometry-v3.js`: editable low-poly procedural geometry and faceted roots.
- `fabrication-v1.js`: Manifold WASM Boolean operations, hollowing, drilling, output and print screening.
- `tests/fabrication.test.mjs`: real Manifold WASM tests, exporter orientation checks, calibration and mounting tests.
- `tests/browser-smoke.mjs`: headless interface test, run by GitHub Actions.
- `.github/workflows/pages.yml`: GitHub Pages deployment.
- `.github/workflows/fabrication-tests.yml`: Node manufacturing tests.
- `.github/workflows/browser-tests.yml`: headless Chromium browser test.
- `qa/latest-fabrication-test.log` and `qa/latest-browser-test.log`: automated CI outcomes.
- `CHANGELOG.md`: version history.

The older `app.js` file is an unreferenced archive of the first demonstration.

## Third-party references

- Manifold documentation: https://manifoldcad.org/docs/jsapi/documents/Using_Manifold.html
- UltiMaker 3 Extended printer manual: https://um-support-files.ultimaker.com/manuals/user-manual/UM3/Ultimaker%203%20-%20User%20manual%20EN%20v1.4.pdf
- UltiMaker 2+ data sheet: https://um-support-files.ultimaker.com/Product-datasheet/Other/Ultimaker%202%2B%20series%20-%20Product%20data%20sheet.pdf
