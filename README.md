# Crystal Forge / Sensory Model Studio

[Open the browser app](https://connorturansky-svg.github.io/crystal-forge/).

**Need a clearer starting point?** Read the [plain-English Studio quick guide](docs/WT025_READABLE_USER_GUIDE.md) for current controls, finding tools, understanding What's New and preserving your designs.

**Finding the code:** Open the [source folder guide](docs/SOURCE_LAYOUT.md) to find printing, geometry, hardware, Library and UI modules without searching through every root file. The [repository map](docs/REPOSITORY_MAP.md) links features to their actual implementation; nested source moves are gradual to protect GitHub Pages and older browser sessions.

**Accessibility work (readability foundation merged in #157; further improvements planned):** [WT-025 legibility and easy-to-read updates #154](https://github.com/connorturansky-svg/crystal-forge/issues/154) has a [detailed design/acceptance blueprint](docs/WT025_LEGIBILITY_CHANGE_AWARENESS_SPEC.md), [Codex/AI fast start](docs/WT025_CODEX_FAST_START.md) and [human-friendly PR review guide](docs/WT025_HUMAN_FIRST_PR_CHECKLIST.md). It complements, rather than replaces, [WT-024 universal setting explanations #152](https://github.com/connorturansky-svg/crystal-forge/issues/152) / [draft plan #153](https://github.com/connorturansky-svg/crystal-forge/pull/153). Nothing in these planning docs claims shipped features or changes the live Pages app.

## Current development — WT-022 (22 November 2026 snapshot)

**Start with [Current work](docs/PROJECT_STATUS.md) and the [repository/source map](docs/REPOSITORY_MAP.md)**. These explain where the live code, tests, active issues, unmerged branches and historical instructions belong. Recheck GitHub before acting; this README is not a live status feed.

**Merged on `main`:** [#128 precision mounting patterns](https://github.com/connorturansky-svg/crystal-forge/pull/128), [#132 eight workspaces](https://github.com/connorturansky-svg/crystal-forge/pull/132) and [#134 intelligent tool search release](https://github.com/connorturansky-svg/crystal-forge/pull/134) (merged at `f6e1da1`, [Pages deployment passed](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45063828028)). #133 first merged into its stacked workspace branch, so #134 was needed to carry search to `main`; #129 preparatory work is closed. [Current status](docs/PROJECT_STATUS.md) is dated rather than a live dashboard; verify fresh GitHub before further work.

**For Codex:** read [AGENTS.md](AGENTS.md) → [Current work](docs/PROJECT_STATUS.md) → [Issue #79 FIT-02](https://github.com/connorturansky-svg/crystal-forge/issues/79) and its acceptance → [source map](docs/REPOSITORY_MAP.md) → relevant tests. [WT-022 Issue #127](https://github.com/connorturansky-svg/crystal-forge/issues/127) remains useful for regression and the small Support-Free Shoulders search indexing follow-up; do not redo A/B/C. The former WT-021 #102 handover is historical.

The browser app offers seven model families — Crystal Clusters, Tactile Tiles, Gears, Waves, Control Caps, Characters and Light Pods. Design sets up forms; Build configures manufacturable structure and fittings; Print Centre validates true Manifold geometry and STL/3MF exports. Projects save locally, with Library backups and optional private GitHub recovery. The preview is **not** proof that the manufactured file or physical print is safe.

For evidence and next priorities, see [software parity #79](https://github.com/connorturansky-svg/crystal-forge/issues/79), [Cura/physical QA #10](https://github.com/connorturansky-svg/crystal-forge/issues/10), [documentation hub](docs/README.md), [open PRs](https://github.com/connorturansky-svg/crystal-forge/pulls) and [Actions](https://github.com/connorturansky-svg/crystal-forge/actions). Only the owner approves merges and deployments.

## Source visibility and reuse

**Copyright © 2026 Crystal Forge project owner. All rights reserved.**
Crystal Forge is presently developed in a **public GitHub repository** but
its original code is **not offered as open source**. See [LICENSE](LICENSE).
Public GitHub visibility still permits viewing and forking under GitHub's
terms and cannot prevent copies. The hosted browser app must serve its
client-side JavaScript, so a public deployment does not conceal its code.

To restrict access to ongoing source development, consider migrating to a
**private source repository** and hosting the built public website separately.
Changing repository visibility may affect GitHub Pages availability on
the account's plan and does not revoke existing clones/forks.

## Historical development milestones

[PR5–PR14 project history, original release descriptions and old acceptance guides](docs/history/README.md). The full historical README excerpts have been preserved in [legacy release notes](docs/history/LEGACY_README_NOTES.md); they are **not statements of current WT-021 acceptance**.

## Workspaces

- **Design** — Six formation patterns, world-aligned directional lean presets (one-way, criss-cross, radial inward/outward, organic), independent strength/randomness, six crystal families, reproducible seeds, collision-avoiding full spacing range, top/bottom ratios, separate side/point rounding, coloured materials, individual crystal shaping and XYZ editing, locks and selection.
- **Build** — Six base styles, independent width/height/dome; optional physically open **zero-infill base vault** with tapered internal buttresses, LED retaining collars and sideways vents. Automatic or manually placed LED/mounting holes are visible in the Build viewport (yellow/purple; invalid red) with precise X/Z editing.
- **Print** — Press **Prepare print mesh** to Boolean-union the individual crystals and integrated base into a Manifold solid, optionally cut experimental cavities, subtract pixel sockets and mounting holes and analyse the result. Inspect the joined mesh in Solid/X-ray, a floating grid-free underside view, colour-coded yellow/purple hole overlays or an overhang heatmap, then download STL or 3MF.
- **Support tools** — Pixel-fit calibration strip (11.8, 11.9, 12.0, 12.1, 12.2 mm), editable cut plane and split-part STLs, basic bill of materials CSV, view snapping, simple/advanced interface, resizable viewport, light/dark mode, in-app Help and Changelog.

### Use

1. Go to **Design** and generate a formation. Keep the side bevel small (0.5–1 mm) to retain the clean, cartoon-like crystalline facets; reduce *shoulder rounding* and *tip flatness* to avoid bulbous or nipple-shaped points.
2. Go to **Build** to select the base shape and how many millimetres its rim extends past the crystals, then select one shared underside pixel (default) or multiple pixels, hollowing and an optional mounting preset.
3. Go to **Print** and click **Prepare print mesh (Boolean union)**. The manufacturing mesh is created **separately** from the fast editable preview.
4. Inspect the resulting report: topological validity, separate material bodies, internal void shells, printer size, number of sockets and mount holes, approximate PLA consumption and likely unsupported triangles.
5. Enable the **colour-coded overhang heatmap** if helpful. Export STL or 3MF only after preparation succeeds, then inspect and slice in Cura.
6. Select a crystal in the viewer or object tree; the shape controls now edit **just that crystal**, highlighted green (red if locked). Use Edit all crystals to return to global mode. Use Floating + BOT to inspect the base without a grid, and Hardware IDs to highlight pixel bores yellow and mounting inserts purple. Save editable projects with ↓ Save.

Changing fabrication-relevant settings invalidates the previously prepared mesh to prevent exporting stale geometry.

### Zero-infill base mode (v0.7.0)

1. In **Build**, enable **Zero-infill base structure** and choose a buttress spacing. This cuts a real underside chamber from the base while retaining supports that flare into the roof at roughly 45°. The supports are part of the model, not Cura infill or removable Cura supports.
2. The LED bore remains a real Boolean cut; where a vault is generated it includes cross-drilled side vents through the socket's retained collar. The vent allows light to reach the shared chamber but does **not** prove every crystal will glow: Cura can still generate skins across crystal roots.
3. In Cura, start with 0% infill and inspect the complete layer view for long bridges, unsupported horizontal areas and blocking skins. Use **Print → overhang heatmap**, the vault's approximate roof-gap report, and Cura's sliced preview together. Gap screening is a guide, not a geometry-level guarantee.
4. For hand positioning, switch Pixel / Mount placement to Manual, choose **Place / move** in Build and click the 3D viewport. Use X/Z inputs to refine; red holes will be skipped. Do not assume a red or skipped hole was included in STL/3MF.

The optional vault and legacy *experimental full hollowing* are mutually exclusive. Leave full crystal hollowing off to use the Cura-first, faster path. Existing saved projects may retain their old hollowing selection.

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
| Manual LED and mounting-hole placement | Implemented: 3D click-to-place, numerical X/Z and invalid-hole rejection; no drag handles yet |
| Zero-infill base vault and integral buttresses | Optional; physical underside cavity and LED vent cut-outs, **support-free bridging not certified** |
| Retaining clips and true constant-wall crystal structures | Not implemented; test socket retention and Cura skin/light paths |
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
- `hardware-editor.js`: Build-stage real-time hardware guides and manual X/Z placement.
- `geometry-v3.js`: editable low-poly procedural geometry and faceted roots.
- `fabrication-v1.js`: Manifold WASM Boolean operations, optional structural vault, hollowing, drilling, output and print screening.
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

## Working across ChatGPT Chat and Codex Desktop

For active work, begin with [current project status](docs/PROJECT_STATUS.md) and the accepted issue. The [old Codex prompt](prompts/START_HERE.md) and [WT-021 handover](docs/WT021_CODEX_HANDOFF.md) are retained for historical reference. For the standing project rules, read [AGENTS.md](AGENTS.md) followed by [AI handover](docs/AI_HANDOVER.md). The [project vision](docs/PROJECT_VISION.md), [feature contracts](docs/FEATURE_SPECIFICATIONS.md), [design decision log](docs/DESIGN_DECISIONS.md), [architecture](docs/ARCHITECTURE.md), [development history](docs/DEVELOPMENT_HISTORY.md), [roadmap](docs/ROADMAP.md), [testing guide](docs/TESTING.md) and [collaboration workflow](docs/COLLABORATION.md) provide persistent intent and implementation context. GitHub is the canonical committed source; develop features on task branches and review PRs before merging to production main.

Lightweight syntax/wiring checks: `npm run test:static`. Existing representative Manifold tests: `npm test`. Chromium smoke tests: `npm run test:browser` (start local web server first). Timing sample: `npm run test:benchmark`. These checks do not replace Cura or physical prints.


