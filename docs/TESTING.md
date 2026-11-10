# Crystal Forge — verification strategy and commands

**Principle:** do not equate source review, a syntax pass, a Manifold pass, a headless browser run, and a real Cura/physical print. Each answers different questions. Report **exact commit SHA**, commands, environment and relevant artifacts. This document distinguishes existing checks from manual gates.

## 1. Test matrix

| Area | Existing automation / proposed static test | What it really verifies | Necessary manual verification |
| --- | --- | --- | --- |
| JS syntax/import references | `npm run test:static` (new) | Node syntax checks; local ESM import targets and essential HTML wiring | Browser/CDN module fetching, actual WebGL support |
| Formation/determinism | `tests/fabrication.test.mjs` | Representative seeded shapes, spacing and lean math | Composition aesthetics, extreme counts/inputs |
| Crystal surfaces | Fabrication tests and geometry edge counting | Representative closed rounded tips, shoulder, base/dome styles | Smoothness/facets, printed tip strength/feel |
| World-space leaning | Fabrication dot-product tests | Common directional lean after per-crystal rotation | Regenerate from UI and visually compare in all patterns |
| Placement/hardware | `planHardware` numeric tests, browser smoke | Hole separation and invalid manual placement | Actual click-to-place and X/Z controls, exported real location, mechanical fit |
| Valid printable mesh | Manifold test via `prepareFabrication` | Positive volume, connected bodies and zero enclosed cavities in tested configurations | Cura repair diagnostics, layer preview, slicing at all height zones |
| Vault/underside | Fabrication vault representative case | Physical open underside and joined integral supports, LED vent count | **0% infill** print, bridge sag, whether vents and crystal roots are optically open |
| LED bore/mounting | Manifold and plan tests | Nominal cylinders cut, count and clearance | Physical fit, wiring, magnets/screw inserts, cable retention |
| STL/3MF | Fabrication exporter tests | STL byte count/orientation/base Z; 3MF ZIP signature | Open in Cura and verify internal/visual geometry and printer profile |
| Browser rendering/UI | `npm run test:browser` | Headless Chromium, DPR/viewport, centre view, controls and downloads; page/console errors collected | Interactive artist evaluation, other viewports/themes, visuals |
| Responsiveness | Browser test UI can open Help while worker runs; optional benchmark | Main thread not immediately locked; measured representative durations | 16–60-crystal heavy job, cancellation, repeat runs and mid-job edits |
| Backward compatibility | Partial localStorage and project tests | Some saved state/selection survives | Load older exported project fixtures; compare material settings |
| Physical print/safety | **No automated certification** | N/A | Touch-point safety, lighting brightness, structural loads and secondary retention |

## 2. Run locally with Codex / human

Requires Node.js 22+, Python 3 and a supported Chromium installation.

```sh
git fetch origin
git status --short --branch
npm install --no-audit --no-fund

# Syntax + local module/HTML contract
npm run test:static

# Actual Manifold geometry and STL/3MF checks (may be slow)
npm test

# In one terminal start a local web server
python3 -m http.server 4321
# In another terminal (after installing browser)
npx playwright install chromium
npm run test:browser

# Optional representative performance measurement
npm run test:benchmark
```

Browser test default URL is `http://127.0.0.1:4321` and can be overridden with `CRYSTAL_FORGE_URL`. Browser WebGL/CDN fetches must work; sandboxed/headless GPU rendering may differ from desktop.

## 3. CI verification and isolation

- `.github/workflows/static-checks.yml` runs lightweight checks on PRs and relevant main changes.
- Existing fabrication and browser workflows should also check **PRs to main** that change app/test code, but **not deploy the PR**. PR checks do not change the GitHub Pages source.
- `.github/workflows/pages.yml` remains production-only for **pushes to main**.
- Existing browser CI writes a success/failure log into `qa/latest-browser-test.log` on **main pushes** only; PR runs must never use a write step to mutate main. Inspect the workflow run SHA, not only a QA file that may be older.
- Test suites may require ~several minutes; note runner timeout and third-party CDN availability. If a workflow is skipped because path filters don't match, report it as **not run**, never passed.

## 4. Geometry and print regression checklist

For every change to `geometry-v3.js`, `fabrication-v1.js`, `hardware-layout.js` or a geometry-sensitive setting:

1. Verify generated triangles are finite and closed where intended; check normal orientation, absence of degenerate faces, and selected shape dimensions.
2. Verify expected number of connected **positive material bodies** and no unexpected negative-volume sealed internal shells. A legal manifold can still have mechanically weak or inaccessible sections.
3. Check roots intersect base, dome elevation positions, side/shoulder/tip transition, hidden objects and arbitrary rotations.
4. Check LED/mount bores are cut at accepted coordinates with enough clearance to outer edge/other holes. Invalid manual positions must be rejected and reported. Check one-pixel and multi-pixel cases.
5. Test default solid exterior, optional `baseVault`, and experimental `hollowCrystals` independently. Never assume one mode's success proves another.
6. Check that base vault, if enabled, has an **open underside**, roof pillars physically joined to model, and socket side vents. Record roof gap as estimated only.
7. Check 0/low/high/full infill scenarios in Cura; watch for horizontal skins blocking base-to-spike light routes and long unsupported roof bridges.
8. STL/3MF should have valid byte sizes/counts, orientation as **Z-up**, base on build plate and model dimensions within chosen printer volume or explicit warning.
9. Compare `prepareFabrication` wall-clock time with reference model and confirm the UI stays interactive and stale result handling works.

### Suggested fixed regression fixtures (future work)

Maintain JSON files for: 1 crystal; 16-crystal tight/dome; 16-crystal wide/lean; 40-crystal heavy; all six bases; narrow tips; one and multiple manual pixels; deliberately invalid mount near the edge; vaulted mound; legacy hollow; old saved project. Fixtures must be deterministic and independent of user-local browser storage. **These fixture files do not yet exist**.

## 5. Manual browser checklist (human or interactive Codex session)

- Open Design, Build and Print; switch Simple ↔ Advanced repeatedly and verify no geometry reset.
- Regenerate with zero randomness in One direction, Criss-cross, Radial inward/outward; view from top and sides. The polar meaning must remain consistent under individual facet rotations.
- Test spacing 0% and 100% with varying counts and maximum lean; review footprint and warning if printer envelope exceeded.
- Select/lock an individual crystal; change only its shoulder radius, height, transform, visibility; regenerate; undo/redo.
- Pan object off centre then press Centre, orbit/snap to bottom, switch floating and even lighting; confirm model stays centred in resizing and high-DPR.
- In Build, enable LED centre overlay; switch placement to Manual, click underside-plane, edit X/Z, move outside base, observe red, and verify only valid holes are cut.
- Enable vault with 25 mm base/various domes, prepare print; inspect real cavity and LED vents in X-ray and export. Disable vault, enable experimental hollowing, compare. No state loss on toggling; two modes must not be simultaneously active.
- Start Prepare, open Help/What's New to confirm responsiveness, cancel/retry, reprepare unchanged design, alter one geometry setting and confirm cache invalidates. Export STL and 3MF and re-open in slicer.
- Test light/dark themes, screen widths, browser console errors; verify Help, changelog and version are consistent.

## 6. Cura inspection checklist (cannot be replaced by topology test)

Use your intended printer/nozzle/filament and print orientation. Suggested exploration, **not certified settings**: 0% infill, 2–3 walls, varying top/bottom skin layers; adjust for material and model.

- Import the *prepared* STL/3MF, not a preview. Confirm orientation, overall dimensions, repair warnings and whether each underside hole is visible at appropriate layers.
- Use Layer Preview, not just solid view. Look below the mound roof for unsupported spans and malformed bridges; roof buttress pitch alone doesn't guarantee short spans everywhere.
- Follow LED bore layer-by-layer into its collar side vents and base void; then follow routes toward selected spike roots. A 0% infill setting can still add closing skins.
- Check mount holes and edge thickness; check wall continuity at spike bases and overhang/support needs; compare default and vault versions.
- Use a small printed test section for fit, roof and illumination, then record material, nozzle, layer height, infill, walls, settings and observations.

## 7. Benchmark design

`npm run test:benchmark` is a deterministic, representative smoke benchmark rather than statistically robust performance profiling. It reports model generation and Manifold preparation timings for a moderate standard case (and may be extended to dome/vault). It should not impose an aggressive fixed CI timing limit because GitHub runner load and WASM cold-start vary; an explicit environment threshold can be used in controlled environments. Future benchmark records should include count, exact settings, platform, warm/cold runs, mesh triangle count, peak memory where available and commit SHA.

A test that only loads code, counts triangles or checks a ZIP signature does **not** prove that a print is safe, well illuminated or support-free.

## 8. Completion evidence template

For each PR, state: **commit**, what changed, commands/workflow run links, environment, passed/failed/skipped checks, remaining manual Cura/physical steps, screenshot or log link and whether production main remained unchanged. Update `docs/AI_HANDOVER.md`.
