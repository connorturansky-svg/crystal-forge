# Crystal Forge — Browser Studio (v0.3.1)

A browser-based, stylised low-poly crystal cluster generator for designing illuminated and 3D-printed installations.

**Open:** https://connorturansky-svg.github.io/crystal-forge/

Runs entirely in Edge / Chrome, with no Python, installation or backend. Three.js currently loads from jsDelivr, so internet access is required.

## Quick start

1. Open the website and go to **Design**.
2. Choose a formation, crystal quantity and overall dimensions.
3. Use **Bottom diameter** and **Top diameter (shoulder)** to tune the recognisable crystal silhouette.
4. Keep **Side corner rounding** low for crisp facets. **Shoulder rounding** and **Tip flat diameter** are independent advanced settings.
5. Click a crystal, then use the toolbar **Move / Rotate / Scale** gizmos; X is red, Y green, Z blue.
6. Select **Build** to preview the base and LED plans; select **Print** for experimental STL export.
7. Use **↓ Save** for a portable JSON project and **↑ Open** to restore it.

Use the **☀ Light / ☾ Dark** theme control, **? Help** and **✦ What's new** buttons in the top toolbar. The theme and editable project are saved in the browser.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| V / G / R / S | Select / Move / Rotate / Scale |
| F | Focus selected object |
| Delete | Delete selected object |
| Ctrl+Z / Ctrl+Y | Undo / Redo |
| Esc | Deselect / close Help |
| Mouse drag / right drag / scroll | Orbit / pan / zoom |

The viewport also has ISO, FRONT, BACK, LEFT, RIGHT and TOP camera presets; solid, wireframe and x-ray display modes.

## Feature status

| Feature | Status |
| --- | --- |
| Six generation patterns, seeded generation | Working prototype |
| Low-poly faceted geometry, top/bottom ratios, rounded side corners | Working prototype |
| Crystal selection, numerical dimensions, XYZ transforms | Working prototype |
| Locking, undo/redo, JSON save/load, light/dark mode | Working prototype |
| Footprint-following base with optional underside access | Experimental |
| LED location previews, 12 mm socket fit planning, BOM CSV | Planning preview only |
| STL download | Experimental — intersecting closed shells |
| Single unioned watertight cluster, hollow crystals, real pixel sockets | **Not implemented yet** |
| Verified supportless printing and orientation optimisation | **Not implemented yet** |
| 3MF, modular splitting, complete mounts and assembly diagrams | Planned |

**Fabrication warning:** This version intentionally does **not** claim to generate a validated, single watertight assembly. STL exports contain intersecting components and need inspection and potentially repair before printing. Physical fit, minimum wall thickness, and printability have not yet been verified in Cura.

## Repository files

- `index.html` — interface, colour-coded panels, light/dark styles, Help and Changelog modal
- `studio-v3.js` — viewport and UI interactions, gizmos, object tree, project files, experimental STL export
- `geometry-v3.js` — explicit flat-faceted crystal geometry, rounded vertical corners, footprint base geometry
- `.github/workflows/pages.yml` — automatic GitHub Pages publishing
- `CHANGELOG.md` — version history

The earlier `app.js` is retained as a reference implementation but is not loaded by the current page.

## Hosting

The workflow automatically deploys pushes to `main` using GitHub Actions. Under **Settings → Pages → Build and deployment**, choose **GitHub Actions** if it has not already been enabled.

## Design goals

The approved longer-term specification is a lightweight **Design / Build / Print** editor, Simple mode by default, with complete advanced tools available without losing settings. Printing targets include 1.2 mm wall thickness, a 45-degree default overhang criterion, supportless-first formations, fully merged bases, real pixel sockets with fit adjustments, and dimensionally correct STL / 3MF exports.

See the in-app **Help** panel for operating instructions and the **What's new** panel for release notes.
