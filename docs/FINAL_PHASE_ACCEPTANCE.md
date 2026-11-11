# Crystal Forge v0.15.0 — Final consolidated software phase

**PR:** [#19](https://github.com/connorturansky-svg/crystal-forge/pull/19) · **Status:** draft until exact-HEAD CI and operator acceptance. This is a **software/manufacturing-candidate release**, not a certified physical product. It consolidates unfinished issues #1 and #6–#10 into one reviewable release, with the remaining tests below.

## Delivered software and code-level changes

| Track | Release implementation | Separate acceptance |
| --- | --- | --- |
| A — Cura/printability | Existing UM2+/UM3 Extended profiles, nozzle/material/quality options and model review; production ZIP adds machine-readable software-vs-physical release gates; automatic printer-bed-aware grid cutting with size/height limits | Actual Cura profile visibility, sliced wall/roof/bridging and physical print samples |
| B — LED/wiring/light | Disable orphan local cuts whenever external cable routing is enabled, not only new string designs; suppress duplicate guide overlays while true prepared mesh is shown; refuse to fabricate invalid/over-length serial wiring | Inspect actual underside channels, bend radii, retention, light in every spike |
| C — Modular/assembly | Existing manual split with optional dowels and detachable plates retained; optional auto XY bed splitting into part STLs added to production ZIP, with strict dimensional checks | Auto split has NO new mating connectors; adhesives/fit/structural retention require engineering and physical testing |
| D — Advanced editing | Existing linked P/M/T markers, selection, drag and reorder; Arrow (1 mm) / Shift+Arrow (5 mm) selected pixel/mount nudging with collision rejection | Browser keyboard/touch and long editing workflow review |
| E — QA/project reliability | Earlier private vault + named project backups retained; extended benchmark cases, real Manifold split/route tests, duplicate-overlay browser test, and release-evidence JSON | Stress/cancellation and real cross-machine recovery must be inspected manually |

## Gate 1 — Automated software checks (must pass on exact latest PR SHA)

- [ ] Static repository checks (includes bed split planner fixtures, prior modules and data-loss regressions)
- [ ] Browser smoke test (prepare, cancel/reprepare, routing overlays, downloads, project management)
- [ ] Real Manifold fabrication test (socket relief absence across serial + legacy routes, fail-closed invalid strings, printable grid pieces and conserved volume)
- [ ] No failing lint/syntax, browser console/network errors or web-deployment regressions
- [ ] Record **latest commit SHA** and workflow run links in PR body before merging

## Gate 2 — Manual browser/operator QA

- [ ] Existing named project opens without changing LED profile, nozzle, print dimensions or pixel order
- [ ] Old projects that saved Legacy single/parallel routes no longer have disconnected short socket slots when wiring is ON
- [ ] Pixel string route remains one continuous ordered IN → P1 → P2… → OUT; changing string pitch and bend invalidates a stale prepared STL
- [ ] In Build, switch between raw preview and prepared Manifold model. No translucent duplicate guide lines are overlaid on the actual routed grooves
- [ ] Rotate P1/P2 socket at 0°, 45°, 90°, 180°. Inspect top/bottom X-ray and real prepared mesh
- [ ] Keyboard-selected pixel/mount moves ±1 mm, Shift+Arrow ±5 mm, without leaving the safe base or colliding with another feature
- [ ] Prepare a 10/16/40/60-crystal model, cancel/restart, edit during calculation, and verify no stale exports re-enable
- [ ] Save, export full backup, restore custom measured gumdrop and multiple named projects on second browser/computer; test private GitHub conflict recovery
- [ ] Generate one-piece and oversized two- or four-piece **automatic bed split** ZIPs; verify every STL in Cura and identify needed joining techniques
- [ ] Generate manually split/dowel part ZIP; confirm no behaviour regression
- [ ] Read 03_Reports/production-release-gates.json; all actual physical checks remain unverified by design

## Gate 3 — Actual Cura and real prints (NOT automatically complete)

Use the actual UM2+ and UM3 Extended machines, installed print cores, and real PLA/PETG. These steps **must be performed physically**.

- [ ] Import the generated Cura .curaprofile for the installed **UM2+ 0.8 mm PLA** configuration; if Cura hides it, use exported manual overrides and record the correct base quality type
- [ ] Slice a single gumdrop test coupon, a 2-pixel cable base, a hollow-light sample, a targeted-light sample, and an auto-split assembly
- [ ] Inspect every Cura layer near socket ceilings, spike roots, internal bores, wire grooves, overhangs and 0% infill roof skins
- [ ] Record printed F/G wire relief, hole tolerance, insertion/extraction, and cable strain relief measurements
- [ ] Confirm the chosen real cable string fits 25, 50 or 100 mm route settings, bends without stress and runs through the socket without an unexpected secondary slit
- [ ] Illuminate actual filament cluster with real LED(s) and verify **every intended crystal** receives light
- [ ] Test resin/printed plastic connectors, dowel/sliding plates, and mount hardware under real applicable loads; overhead work needs independent mechanical safety design
- [ ] Print a 16-crystal complete production model using the final accepted Cura profile

## Software signoff and release constraints

1. All **Gate 1** checks green; verify relevant **Gate 2** manual browser tasks. PR may then be merged as a **software release candidate**.
2. Do not mark the product **physical-production ready** without **Gate 3** Cura, print, LED, optical and mechanical evidence.
3. No OAuth/cross-device permanent login is delivered: user-approved scoped private GitHub token per session remains the safe design. No tokens should ever appear in source, generated JSON or release ZIP.
4. No automatic smart keyed joints, structural safety certification, guaranteed constant-wall hollowing, actual optical simulation or slicer engine is claimed. Keep these as future engineering candidates rather than silently inventing material performance.
5. If any core regression fails, keep PR draft and use attached project JSON, affected commit SHA, screenshot, STL and expected/actual description to fix and retest.

**If this is the final development phase for now:** hand off a complete named project, full backup, ZIP, test samples and checklist. Close phase tracker issues only for functionality that has truly passed its defined acceptance gates; physical gates must remain visible.
