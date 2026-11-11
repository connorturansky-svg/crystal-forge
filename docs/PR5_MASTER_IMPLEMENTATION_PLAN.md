# Crystal Forge — PR5 master implementation plan

**Started:** 11 November 2026 · **Branch:** `feat/pr5-wiring-diagnostics-roadmap` · **Target version:** v0.10.0 · **Production base:** PR4/v0.9 merged.

This is the single consolidated implementation queue for the unfinished design discussions, engineering risks and future phases. **PR5 contains code for the first wiring/calibration phase plus this plan. The remaining phases are NOT finished merely because they appear here.** An individual code/test/slicer gate is required before advancing each item.

## Five large delivery packages — priority order

These five packages consolidate **all ten original detailed phases** and the newly requested Cura work. Each is intended to be a substantial implementation milestone with its own regression, Cura and physical-print gate. Work already committed in PR5 is clearly distinguished from work still queued.

| Large package | Core deliverables | Original phases | Status |
| --- | --- | --- | --- |
| **A. Cura & reliable fabrication** | Cura profile download, quality/nozzle/material controls, support/roof/bridge diagnostics, nozzle-aware slicing advice, machine volumes | 0, 4, 7, 9 plus the new Cura phase | **Generator now in PR5; validation and advanced advice queued** |
| **B. LEDs, wiring & real light paths** | Measured LED library, retention clips, strain relief, wiring exits, per-pixel controls, cutaway and verified shared illumination | 1, 2, 3 | **Wiring prototype PR5; physical/optical features queued** |
| **C. Modular construction & mounting** | Auto splitting, key/dowel joints, detachable mounting plates, magnets/M3/keyholes, assembly and safety instructions | 5, plus mounting parts of 9 | Queued |
| **D. Creative editor & hardware placement** | Drag/snap hardware editor, individual shapes/multiple selection, model templates, project migrations, materials/look development, contextual help | 0, 6, 8 | Queued |
| **E. Production QA & distributable projects** | 10–60 crystal benchmarks, worker cancellation, real Cura checks, export pack/BOM/wiring diagram, physical print tests, documentation and workshops | 7, 9 | Continuous; final release gate queued |

### GitHub phase trackers — ready for implementation

- **[Package A — Cura & reliable fabrication](https://github.com/connorturansky-svg/crystal-forge/issues/6)** — candidate Cura export coded; real import, bridge, detail and print tests queued.
- **[Package B — Physical LEDs & light paths](https://github.com/connorturansky-svg/crystal-forge/issues/7)** — underside wiring coded; clips, accessible optical channels and print validation queued.
- **[Package C — Modular parts & mounting](https://github.com/connorturansky-svg/crystal-forge/issues/8)** — auto-splitting, dowels, removable plate and assembly queued.
- **[Package D — Studio/editor & placement](https://github.com/connorturansky-svg/crystal-forge/issues/9)** — drag/snap hardware editing, templates, material look-dev and migration queued.
- **[Package E — Production & QA](https://github.com/connorturansky-svg/crystal-forge/issues/10)** — performance budgets, printer sampling, export bundle and reproducible release criteria queued.

The checked boxes in GitHub represent **code implemented on a branch**, not certified mechanical functionality or complete delivery. Each package has an individual review gate; maintain one master plan, no competing backlogs.

### Package A — Slicer-ready fabrication and Cura profiles

**Immediate implementation:** an importable Cura profile generator, with Ultimaker 3 Extended, Ultimaker 2+, selected nozzle diameter, PLA/PETG and Fast-to-Fine quality. Nozzle selection must reject incompatible machine hardware. Profiles use the existing machine/material configuration in Cura; they do not generate G-code or replace printer firmware.

**Quality scale:** increasing quality reduces layer height and speed while generally increasing wall count and top/bottom layers. The separate print-intent selector controls infill for translucent lighting, balance or durability. Never assume zero infill yields open optical channels.

**Remaining scope:** verify imports in actual installed Cura for both machines, generate model-derived nozzle feature warnings, improve bridging and roof assessment, suggest support strategy and nozzle-aware wall requirements, add more printers/materials only after calibration and provide a print-checklist export.

**Acceptance:** machine/nozzle compatibility, real Cura import of the generated archive, correct material and AA core selected, real nozzle test coupons, and sliced layer-by-layer checks.

### Package B — Physical LED mounts and illumination

**Scope:** extend measured profile sections, LED-specific multi-pixel selection, reversible clips and adapters, strain relief, wiring channels/edge exits, cable-length management, optical cutaway diagnosis and targeted root opening (rather than expensive global hollowing). Ensure every *intended* spike has an inspectable light path.

**Acceptance:** physical gumdrop/seed/bullet samples, removable working LED access, inspected cable channels and light passing into each targeted crystal; blocked spikes reported.

### Package C — Modular print and installation

**Scope:** model-splitting based on selected printer X/Y/Z, more cut planes, dowel/alignment keys with measured tolerances, mating detachable plates and keyholes, mounting tabs and M3/magnet pockets, assembly guide, LED access between parts, secondary retention plans.

**Acceptance:** oversized print assembles correctly, separate parts remain connected by tested mechanical joints and all safety limits are communicated. Software cannot certify overhead load capacity.

### Package D — Studio and direct hardware editing

**Scope:** on-canvas drag/snap of LED and mount holes, underside editing, multi-select and transformations, shape presets and batch variations, persistent templates, creative material previews, self-explanatory settings and versioned project migrations.

**Acceptance:** new user completes the Design → Build → Print workflow, preserves selection/locks and hardware after JSON export/reimport, and can undo/redo without losing parts.

### Package E — Production-hardening and project handoff

**Scope:** prepare-worker timing and recovery for 10/16/40/60 crystals, repeat/cancel/cache tests, exact-head CI, STL/3MF/Cura validation, downloadable manufacturing pack, full BOM, wiring map, calibration prints, physical print quality and assembly checklists, workshop guidance and release/version history.

**Acceptance:** reproducible sample project collection, successful real prints for defined cases, validated Cura settings and measured hardware clearance, benchmark budgets, complete project release bundle.

### Dedicated Cura Profile Generator — executable phase inside Package A

- Machines: Ultimaker 3 Extended with AA **0.25 / 0.4 / 0.8 mm**, and Ultimaker 2+ with **0.25 / 0.4 / 0.6 / 0.8 mm**.
- Material choices: PLA / PETG. Select matching actual filament in Cura; avoid prescribing a universal temperature for unknown brands.
- Quality slider: 0 = Fast (taller layers, faster print, fewer shells); 100 = Fine (shorter layers, slower print, more shells and surface layers). Separate intent sets 0% infill for translucent, 10–15% balanced or 25–30% durable.
- Export: machine/nozzle/material-specific custom Cura quality overrides inside a ZIP-form .curaprofile file, with global and extruder sections. Selected printer and print core must already exist in Cura. This is **not** a complete replacement machine/material definition.
- Implemented in PR5: generator module, print-panel controls and downloadable profile. Unit and browser tests cover ZIP structure, option combinations, compatibility and the downloaded file. Real Cura import remains a **manual acceptance gate**.
- Next: model-aware overrides, materials by supplier, estimated print time after slicing, custom visual profile editor, matched Cura project 3MF export, nozzle-aware print orientation and optical-path screening.
- Official references: https://support.ultimaker.com/articles/Knowledge/1667411286867 ; https://support.ultimaker.com/articles/Knowledge/1667411296273 ; https://support.ultimaker.com/articles/Knowledge/1667337922171 ; https://github.com/Ultimaker/Cura/blob/main/plugins/CuraProfileReader/CuraProfileReader.py .

**Delivery rule:** prioritise Package A and the current prototype part of B in PR5. Start follow-on large packages immediately as dedicated GitHub tracking milestones, but implement them in reviewable sub-PRs. Do not label queued mechanical or optical functions as completed merely because they are in the master roadmap.

## Product rules that every phase must preserve

1. Fast, editable Three.js preview is **not** the joined Manifold printable mesh.
2. Retain stylised low-poly facets, rounded touchpoints, per-crystal overrides, locked objects, world-consistent lean and huge spacing extremes.
3. Cura-first remains default: only explicit, opt-in geometry cuts should modify interior material. Zero infill does not ensure an open optical channel.
4. Pixel and mount planning must be the **same authoritative geometry data** used for previews, printing and exports.
5. Reject unprintable/invalid features visibly rather than silently doing something else. Old JSON and autosaves must be preserved or migrated explicitly.
6. Neither manifold topology checks nor preview renders certify safe touch points, support-free printing, watertight outdoor assemblies or load-bearing overhead fixings.
7. Keep GitHub main deployable and perform all large changes in PR branches. Pin exact test SHAs; do not use old green workflow runs as proof.

## Cross-phase priorities and dependencies

| Phase | Priority | Relationship | Current status |
| --- | --- | --- | --- |
| 0. Baseline, legacy files & regression gates | P0 | Required before geometry promotions | Partly implemented before PR5; expand |
| 1. Wiring plan, cut grooves & fit calibration | P0 | Required by LED serviceability | **PR5 code in progress** |
| 2. Physical LED retention & profile library | P1 | Requires measured LEDs, phase 1 | Queued |
| 3. Verified light access and cross-section diagnostics | P0 | Uses socket/chamber connectivity | Queued — do not assume success |
| 4. Bridge, roof, overhang, printer and Cura planning | P0 | Needed for low-infill real prints | Queued; existing heuristic only |
| 5. Modular assembly, mounts and alignment keys | P1 | Depends on geometry/print fixtures | Queued |
| 6. Direct 3D hardware editing and snap workflows | P1 | Depends on planner validations | Queued |
| 7. Preparation performance, error recovery and testing | P0 | Continuous, all stages | Existing worker and baseline tests; expand |
| 8. Optical/material simulation & inspection | P2 | Requires validated geometry | Exploration |
| 9. Production/education release and fabrication guides | P1 | Depends on validated physical prints | Queued |

## Phase 0 — Regression foundation and migration safety

**Pending implementation**
- Add stable versioned project fixtures: v0.3 settings, legacy v0.5 balloon, v0.7 vault, v0.8 huge tapered roots, v0.9 saved profiles, current mixed manual sockets/mounts.
- Exercise import, save, undo/redo, regeneration, locking, selected crystal overrides and Simple/Advanced transitions with those fixtures. Include malicious/malformed profile dimensions and missing arrays.
- Test manual LED and mounting hole placement with real canvas clicks, subsequent X/Z edits, red invalid feedback, ignored invalid exports and JSON round-trip.
- Test world-space one-way/criss-cross/radial lean at 0% randomness after yaw changes and camera recentering under high DPR.
- Add screenshots/actual browser comparisons for fitted, square, round, organic and full-hill bases with shoulder-rounding extremes.
- Verify the exact commit for all three workflows and keep CLI logs as workflow artifacts, not new auto-commits to main (**the latter addressed in PR5**).

**Gate:** zero unexpected changes to legacy designs in reproducible fixtures; no silent invalid hardware; all full Manifold and Playwright checks pass on final PR SHA.

## Phase 1 — Pixel wiring channels, cable exit and measured calibration

**Implemented on PR5 branch (awaiting verification)**
- Add optional wire channel checkbox, edge exit, width, depth and slack; deterministic minimum-length connections across accepted sockets.
- Build previews approved grooves in cyan; planner refuses mount collisions, perimeter crossings and insufficient roof thickness. Restrict while zero-infill vault and experimental whole hollowing are enabled.
- Manifold subtracts the planned underside open grooves, and reports cut segments, estimated length and unconnected LED sites.
- Export a wiring CSV containing segment coordinates, width, depth and length; extend test matrix.
- Generate the five-hole pixel calibration STL from the currently selected/custom profile bore rather than always 12 mm. Correct the diameter slider range for small seeds.

**Outstanding improvements**
- Stop routes crossing unselected/other LED flanges as well as mounting holes.
- Add chosen route origin and cable-exit position (manual as well as nearest safe edge).
- Extend route options from straight/one-bend to nearest-neighbour, manual order, shortest tree and intentionally looped service slack.
- Add a true configurable cross-section with round/flat-bottom channels and relief at acute bends.
- Provide total predicted cable length plus per-segment service slack and a printable wiring/assembly card.
- Ensure automatic routing does not block the browser for 40–60 LEDs; cache polyline tests and invalidate only relevant changes.

**Gate:** planner and manufactured groove shape agree; no positive-material disconnection, roof breakout, mount intersection or hidden void in tested fixtures. Print a multi-LED strip and confirm the actual cable presses into the planned channels.

## Phase 2 — Accurate pixel mounts, retention and editable library

**Pending**
- Pixel profile library with full height/diameter section editor, flange and cap geometries, case/window dimensions, wire entry on both ends, wire gauge, shell material, measured tolerance and profile documentation.
- Named user-owned reusable components; local library export/import, duplicate, rename, delete with collision-safe IDs; maintain backward compatibility and portable JSON.
- Make profile editor easier to understand with a 2D section diagram and interactive labelled dimensions; prevent profiles with impossible flanges or missing measurements.
- Optional *printable* retaining features: adjustable shallow lip, spring tang, clip ring and separate removable carrier. Maintain feasible insertion without damaging translucent filament.
- Selectable press-fit vs glue-fit vs replaceable seat and a cable strain-relief pocket.
- Per-pixel model/profile selection for multi-LED designs rather than only one global profile.
- Pixel-specific five-sample fit coupons that include stepped flange/retainer and wire exits; actual measured width/height gauges.

**Gate:** physical measured LED can be inserted, wired and replaced after print without cracking the base; blind roof and minimum walls verified in Cura. Do not call a nominal fit a safe retention mechanism.

## Phase 3 — Genuine shared illumination access and cross-section diagnosis

**Pending: critical**
- Add an inspectable section/cutaway mode to the prepared model, with a movable plane and live underside/inner shell view.
- Detect LED bore access to the common base chamber and show separate statuses for bore access, chamber, passage, target spike and outside light exit.
- For Cura-first 0% infill, diagnose horizontal skins that may close the crystal roots. Do not mark them connected based only on a zero-infill number or mesh manifoldness.
- Offer **optional targeted root openings**, not expensive whole-cluster erosion by default; keep thin/small spikes solid with visible skipped warnings.
- Improve any hollow tunnel to honour actual rigid orientation, full side-wall profiles, minimum wall targets and mechanical root continuity.
- Create example slices for one LED vs many, small/medium/large crystal widths and upper tip coverage.

**Gate:** in test slices and physical translucent samples, light exits all *intended* spikes from specified underside LEDs; inaccessible voids are either exposed for inspection or reported. A simulation alone is never enough.

## Phase 4 — Roof, bridge, support and printer planning

**Pending**
- A conservative roof span review based on base footprint plus vault buttresses, not simply triangle slopes; distinguish estimated spans from actual Cura G-code.
- Visually flag likely bridge risk and possible 3D overhangs in Print, including full-hill shallow edges and sharp base rim transitions.
- Compare user-specified material/nozzle/layer-height/line-width profiles, top/bottom skins, infill, supports and real printer build volume.
- Allow custom machine X/Y/Z dimensions and common preset selection, with honest height/footprint fit warnings.
- Explore tree-like/tapered integral roof ribs rather than isolated columns, with accessible wiring and optical ports; avoid blocking LED pathways.
- Improve print orientation candidates and option for printable placement on bed while retaining the floating preview; actual split/rotate acceptance in Cura.
- Benchmark low/zero/high infill scenarios; provide Cura-side checklists, never claim "100% supportless" on a heuristic.

**Gate:** Cura renders expected supports, roof bridges and no unintentional holes; physical 0%-infill dome samples document actual spans, sag, roof quality and strength.

## Phase 5 — Modular cutting, assembly and mounting

**Pending**
- Actual split connectors: configurable dowels, keyed plugs, registration sockets and print-toleranced clearance; avoid crossing light channels, LED hardware and mounting holes.
- Expand one X-axis cut into freely positioned horizontal, vertical and multi-plane cuts, plus printer-bed-aware splitting.
- Section IDs, assembly orientation arrows and collision-free registration positions, with individual part STL/3MF and build diagram.
- A genuinely modeled detachable mounting plate with mating fasteners, and keyhole mounting as distinct features. Current "Detachable plate" is a placeholder and must never be represented as an exported part.
- Retain flexible screw/magnet/M3, custom dual hole and edge-tab options. Introduce better printable screw supports and edge webs.
- For overhead installs, explicit secondary-retention mounting and safety notices; no structural/load certification is possible from this tool alone.

**Gate:** print/assemble representative two-piece model; joints seat without destructive force, match preview, preserve light channels and do not weaken required joints.

## Phase 6 — Physical hardware patchbay/editor

**Pending**
- Visibly distinct underside XY/XZ placement plane and selection/highlight of individual sockets, mounts and channels.
- Mouse drag-to-move valid holes, optional grid/snap, shift/duplicate, undo/redo and numeric X/Z fine adjustment without leaving placement mode.
- Manual positions after auto placement, preview of excluded invalid holes, clear explanatory clearance circles and conflict resolution suggestions.
- Per-pixel profile, wiring order, route source/exit, actual depth and optional socket orientation.
- Print/Build tree nodes reflecting genuine hardware with click-to-focus, not duplicated state stores.
- Preserve all manual placements and profile assignments in versioned project JSON and revalidate after geometric changes.

**Gate:** automated pointer tests for valid/invalid moves and export parity; keyboard accessibility and stable orbit/gizmo locking.

## Phase 7 — Performance, reliability and quality

**Pending**
- Gather timings for 10, 16, 40 and 60 crystals across flat/hill/vault, 1 vs multi pixels, mounts, wire cuts and experimental whole-cluster hollowing.
- Profile Manifold union, cavity subtraction, geometry serialization and UI redraw separately. Target responsive browser while worker is running.
- Explicit cancellation, newer-edit invalidation, no stale file downloads, no memory leaks and recovery after WASM worker errors.
- Cache validated manufacturing results, use geometry simplification or optional progressive/detail levels when safe; retain proof of printed geometry.
- Maintain deterministic unit tests, static checks, headless browser, printable Manifold checks, STL/3MF roundtrips and versioned fixtures.
- Keep main GitHub Pages protected from draft PR writes; publish changelog and human-readable release history together.

**Gate:** no uncontrolled stalls or failed reused workers in representative runs; regressions tied to exact commit and CI logs.

## Phase 8 — Optical and material preview

**Exploratory, not photometric verification**
- Independent controls for translucent PLA/PETG colour, thickness impression, multi-LED colours and apparent internal light scattering.
- Cross-section overlays for proposed light channels and predicted occlusions; distinguish optical assumptions from physical validations.
- Simple emitter-size/placement previews, but never imply brightness or safety is calculated from a colour shader.
- Optional 2D printable LED map and physically numbered installation diagram.

**Gate:** aesthetic previews reflect selected options and do not silently modify exported geometry; physical samples calibrate any later optical model.

## Phase 9 — Making the tool usable for workshops/production

**Pending**
- Rewrite onboarding: Choose shape → Build base → Select LED profile → Route wiring → Prepare → Inspect in Cura → Fit-test → Print → Install.
- Contextual descriptions should clearly identify available versus conceptual features (detachable plate, "ceiling mount", support-free, hollowing).
- Download manufacturing report, component/profile bill-of-materials, routed cable lengths, estimated mass, test coupon and assembly checklist.
- Add release notes/version in both HTML and CHANGELOG, robust saved file compatibility and printed safety warnings.
- Real-world sample programme: one LED+flat base, full-hill vaulted base, multi-LED wire routing, magnet/edge-tab piece, split part, then 16-crystal full assembly.

**Gate:** independent user can generate/edit/save, receive actionable print warnings, follow the Cura/physical checks and reproduce the build without hidden assumptions.

## Scope discipline and review rules

- **This PR is intended to be reviewable.** Phases 2–9 remain tracked in this plan until code and evidence exist. High-risk fabricated mechanical changes should receive their own small sub-PRs or sequential commits and physical review.
- Preserve the old saved JSON wire/profile state: missing new fields use safe off-by-default values.
- Do not promote an "experimental" status to "verified" from a code review alone.
- Record each finished phase with commit SHA, tests actually run and manual Cura/print evidence.
- Before merging PR5, complete exact-head static + Manifold + browser CI and manually inspect groove/LED fit and full-hill print issues.
