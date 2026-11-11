# PR9 combined development — hands-on test guide

**Status:** Experimental v0.13.0 candidate on [draft PR #15](https://github.com/connorturansky-svg/crystal-forge/pull/15). This branch contains working code; the production GitHub Pages website remains v0.12.0 until the PR is merged. Static, browser and Manifold checks must be read at the latest PR commit, not from older runs.

## Open an interactive preview without merging

On GitHub, switch to branch `feat/pr9-combined-roadmap-implementation` and choose **Code → Download ZIP**. Unzip. To use the ESM/WebGL browser modules, serve the folder via **VS Code Live Server** or a local terminal with `python -m http.server 4321`, then open `http://localhost:4321` in Edge or Chrome. Do not open `index.html` as a `file://` URL. Three.js and Manifold dependencies require internet access. Alternatively merge the reviewed PR to test on GitHub Pages.

Make a backup **Print → Download editable JSON** before loading old projects. Templates save only in the current browser's local storage; export JSON for portable backups.

## Test matrix

| Order | Area | Action | Expected result |
| --- | --- | --- | --- |
| 1 | Build / one pixel | Choose **Pixel string IN/OUT**, enable underside grooves, keep one LED, click **BOT** | **P1** has distinct incoming and outgoing cable paths ending at two clear base perimeter points. No duplicated side-by-side parallel lanes. |
| 2 | Build / multi-pixel | Set multiple pixels or create them manually; open Build list | Clear **P1, P2, P3…** labels. Each pixel has an IN and OUT port on opposed physical sides. |
| 3 | Reordering | Press ↑/↓ or drag a manual pixel card | Labels and cable path follow new P order, while X/Z, selected LED profile and stable internal ID remain unchanged. |
| 4 | Linked selection | Click a **P** or **M** label in 3D, then select a card | Model/card highlight each other. Invalid holes are visibly red and excluded from exports. |
| 5 | Context placement | **Double-click an empty base surface**; choose Add Pixel or Add Mount | Context menu opens at that position, validates clearance, and adds the named hardware item; double-click an existing marker edits it. |
| 6 | Perimeter tails | Pick **IN edge** and **OUT edge** independently | One-LED string still gets two clear perimeter openings; overlapping a fixing tab causes an explicit rejected-route warning. |
| 7 | Wire exports | Download wiring CSV and **P1… RGB index CSV** | Order, physical cable endpoints, geometry and RGB three-channel indexing agree. No electrical loop is implied. |
| 8 | Creative | Design → Mixed → adjust six family weights and regenerate with a fixed seed | Family probabilities change reproducibly; 0× suppresses that family. |
| 9 | Group editor | Tick several crystals or Ctrl-click them; move/scale/lock/hide group | Only selected/unlocked crystals transform; other crystals remain unchanged; undo/redo works. |
| 10 | Layout | Drag or keyboard-adjust side-panel dividers | Left/right widths persist in the browser without resetting the model. |
| 11 | Templates | Save a named design, modify model, load it again | Local template restores an editable model. Portable JSON export remains available separately. |
| 12 | Print | Prepare mesh; enable **½ Cutaway** on the prepared geometry | Visual half section reveals modeled cavities and optical channels without modifying STL or actual exported mesh. |
| 13 | Diagnostics | Enable targeted light bores; inspect optical CSV, Cura checklist and print report | Accepted modeled conduits have crystal IDs. Thin wall/roof and blocked cable warnings remain explicit; none claim proven illumination. |
| 14 | Export | Download STL, 3MF and complete production ZIP | Files reflect most recent prepared geometry, ordered cable and pixel maps. Editing geometry invalidates stale exports. |
| 15 | Real Cura | Import STL and selected printer/material/nozzle profile into your installed Cura | Inspect every layer at cable entry/exit, socket roof, spike root, split and mounting areas; record problems. |

## Remaining limitations — do not mistake these for completed features

- **Physical verification cannot be automated here:** actual PLA/PETG bridging, flange fit and clips, mechanical retention, insert/joint strength, optical transmission, child-safe surfaces and overhead loads require real samples and appropriate engineering.
- Serial grooves represent **physical multi-conductor cable bundles**, not independently insulated individual electrical wires or controller power maps. RGB index CSV is a **generic 1-based WS2811 indexing aid**, not an xLights/FPP output/universe configuration.
- Auto hardware locations can be converted to manual for deliberate order/editing. Legacy side-by-side paired grooves remain accessible in saved projects but are explicitly labelled *legacy*.
- The cutaway is a clipped **visual preview**, not a slicer cross section or proof that zero-infill creates an open lumen.
- Automated multi-plane printer-bed split/nesting, measured retaining clips, certified assembly fixtures, optical raytracing, exhaustive material simulation and fully automatic G-code/Cura slicing remain **unverified or not implemented**. Their requirements remain in issues [#6–#10](https://github.com/connorturansky-svg/crystal-forge/issues).

## If a test fails

Record the PR commit SHA, Edge/Chrome version, pixel count, saved project JSON (remove any private names), chosen printer/nozzle/material, intended vs actual route, a screenshot, and whether it fails in the 3D preview, prepared STL, Cura slice or physical print. For geometry issues, include the exact warning text and nearest P/M labels. Avoid reporting a possible thin roof as a proven real printing failure until Cura or a test print demonstrates it.
