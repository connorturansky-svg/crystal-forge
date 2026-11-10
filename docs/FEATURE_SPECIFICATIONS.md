# Crystal Forge — feature specifications

**Scope:** requirements recovered from the design conversation and inspected v0.7.0 source. **Status vocabulary:** *implemented (tested representative cases)*, *implemented (partially tested)*, *experimental*, *requested / incomplete*, *proposal*, *not yet verified physically*. An implemented UI control is not proof of its physical effect. Acceptance tests are future contracts, not claims that each has been run.

## F01 — Formation generator and creative variation

- **Intention:** quickly create recognisable but distinct low-poly clusters for an illuminated interactive installation; avoid repetitive identical spikes.
- **Behaviour:** seeded generation of 1–60 large/medium/small crystals using Central Spire, Dense Cluster, Fan, Geode / Crescent, Wall Growth or Organic / Wild patterns; Randomise changes the seed, Regenerate respects current settings.
- **Controls:** count, overall height, spread/footprint, spacing/overlap (0–100%), pattern, repeatable seed and retain locked crystals.
- **Implementation:** `geometry-v3.js::generateFormation`; `studio-v3.js::generate` builds models. Crystal object records include ID, family, position, radius, height, yaw, lean, visibility and per-crystal overrides.
- **Interactions/edge cases:** super-clustered settings intentionally overlap; at 100% a conservative swept projected envelope should not overlap even with lean, but very large footprints can exceed printer volume. Family proportions, locked objects and base footprint affect results. A manually repositioned crystal can still override automatic separation.
- **Status:** implemented; representative seed/spacing checks exist.
- **Acceptance:** repeated identical settings/seed give identical formation; slider extremes visibly differ; 100% generated crystal envelopes do not overlap; preserve-locked works and warns if the resulting composition cannot meet separation.

## F02 — Lean patterns and world-space consistency

- **Intention:** artist-controlled growth movement rather than arbitrary jitter. A group should visibly lean in one common direction, alternate/criss-cross, fan outward or face inward.
- **Behaviour/controls:** Organic / natural, One direction, Criss-cross, Radial outward, Radial inward; **Lean amount** sets strength and **Angle randomness** separately perturbs direction. At zero randomness the chosen preset has a coherent world-space direction.
- **Implementation:** `generateFormation` compensates each crystal's independent yaw so `leanX/leanZ` achieve the intended direction after mesh rotation.
- **Interactions/edge cases:** near-origin radial direction has no unique inward/outward vector; individual manual rotations/scales may alter a previously generated pattern. A local-space direction bug was reported and corrected in v0.7.0.
- **Status:** implemented; world-space dot-product regression tests exist.
- **Acceptance:** zero-randomness One direction has the same projected world direction for all crystals; inward/outward dots have correct signs relative to formation centre; criss-cross alternates; randomness changes deviation without unexpectedly changing overall strength.

## F03 — Crystal silhouette, faceting and softened touch points

- **Intention:** cartoony/crystalline, strong flat faces, broad shaft/shoulder/pyramid, not photorealistic, bulbous or nipple-shaped. Tips should be deliberately rounded for more touch-considerate objects.
- **Behaviour/controls:** Quartz, Shard, Blade, Cubic, Double terminated, Fantasy or Mixed; top/bottom diameter ratios; side corner rounding, tip length, rounded spherical cap, additional shoulder smoothing and round steps. Side rounding should continue across the shoulder rather than end in a hard ring.
- **Implementation:** polygonal rings/triangles in `crystalGeometry`; per-crystal `shape` override falls back to global settings. Tangent spherical cap; shoulder transition influenced by corner radius.
- **Interactions/edge cases:** tiny crystals, extreme top/bottom ratios, rounding approaching tip height, geometry normals/closure, leaning, slicing wall count and printed tip durability. Preserve large flat facets; smoothing must change mesh geometry, not only shader.
- **Status:** implemented; representative closure tests, not physical touch tests.
- **Acceptance:** mesh is closed with no degenerate tip holes; rounded cap has a curved silhouette; no visible hard shoulder discontinuity when side rounding is engaged; facets remain recognisably flat; individual override does not mutate every crystal.

## F04 — Individual editing and object management

- **Intention:** refine selected crystals without losing the rest of the generated composition.
- **Behaviour/controls:** object tree, click-to-select, selection green/locked red, global-vs-individual shape scope, numerical height/radius/position/rotation, XYZ Move/Rotate/Scale gizmos, optional snapping, focus, duplicate/delete, show/hide, lock and undo/redo.
- **Implementation:** `studio-v3.js` state and Three.js `TransformControls`; selection persisted with project, per-crystal shape settings override globals.
- **Interactions/edge cases:** hidden or locked items; changing regeneration parameters; new crystal IDs; invalidation of manufactured geometry; editing during a slow worker job.
- **Status:** implemented; browser tests cover selected shape persistence and scope.
- **Acceptance:** only targeted object changes; locked objects cannot be inadvertently edited; regeneration honours locked items as specified; undo/redo restores relevant state; a prepared mesh cannot be exported after an editing change without regeneration.

## F05 — Viewport, camera, rendering and accessible UI

- **Intention:** inspect a floating sculptural object from any angle rather than a model sat on a table, with even lighting above and below.
- **Behaviour/controls:** orbit around actual model centre, mouse pan/zoom, centre/focus, ISO/front/back/left/right/top/bottom snap views, floating grid-free mode, grid and axes, even studio light toggle, solid/wire/X-ray, per-object colour, optional whole-cluster glow, light/dark UI themes. Colour-coded Design/Build/Print and Simple/Advanced reveal appropriate complexity.
- **Implementation:** Three.js renderer, OrbitControls, scene lights, ResizeObserver and camera tweening in `studio-v3.js`; CSS in `index.html`.
- **Interactions/edge cases:** resize/DPR, long/tall clusters, panned orbit target, zoom with prepared mesh, modal/keyboard focus, older browser/project state.
- **Status:** implemented; headless Chromium tests verify DPR=2 canvas bounds and recentering; subjective aesthetics need human review.
- **Acceptance:** model remains centred during normal regeneration and after explicit recenter; orbit pivots through cluster not empty space; underside is clearly inspectable; switching modes doesn't reset state; no console errors.

## F06 — Integrated root, outline, height and dome

- **Intention:** connect spikes to a manageable common sculpture/base without an oversized lump; permit artistic mound profiles and enough depth for LED hardware.
- **Behaviour/controls:** Integrated, separate visual base, none; Fitted, Square, Circle, Rounded, Organic, Crystal crust styles; outward width, base thickness/depth, independent top-edge fillet and dome/mound height (0–50 mm). Fit-base-for-gumdrop preset sets 25 mm.
- **Implementation:** `baseOutline`, `baseSurfaceHeight`, `baseGeometry`, `crystalRootOffset`, `baseAccentSpecs`.
- **Interactions/edge cases:** crystal roots should follow a domed surface; expanding spacing must update footprint; nominal ~22 mm gumdrop body may not fit shallow bases; overhangs and perimeter fillets affect roof.
- **Status:** implemented; six-style closure and dome tests exist.
- **Acceptance:** clean manifold base with attached roots across styles and domes; base outline encloses intended roots with margin; dome and edge fillet are truly geometric and adjustable independently.

## F07 — Pixel illumination and real socket bores

- **Intention:** light many translucent crystal spikes from one shared pixel where possible; allow alternative multiple LED installations.
- **Behaviour/controls:** one shared pixel (default), multiple pixels, or none; nominal diameter 10–15 mm (12 mm starting point), fit adjustment, show positions, cut holes, glow preview and selectable simulated colour. Build shows **actual planned** socket markers.
- **Implementation:** `planHardware` chooses safe locations; `hardware-editor.js` draws them; `fabrication-v1.js` Boolean-cuts cylinders; a calibration strip produces 11.8–12.2 mm bores.
- **Interactions/edge cases:** shallow base, mounting collisions, undercut/clearance, actual LED housing shape, accessible wiring, retention, roof collisions, opaque internal skins; single LED cannot be assumed to illuminate every branch.
- **Status:** nominal sockets implemented, optical distribution and mechanical retention not verified physically.
- **Acceptance:** enabled valid bores appear in manufacturing STL; disabled bores do not; occupied positions are not reused for mounts; diameter plus fit adjustment is correct; LED can be inserted and removed in test print; light reaches intended branches in Cura cross-section and physical test.

## F08 — Automatic and manual hardware placement

- **Intention:** visually choose where LEDs and fixing hardware actually go; automatic placement is a starting point, not the only workflow.
- **Behaviour/controls:** Automatic or Manual for pixel/mount holes; Build-stage yellow LED/purple mount guides; click-to-place and X/Z numerical edits; invalid positions red and skipped. Mount profiles include wall screws, magnets, M3 inserts and custom dual holes.
- **Implementation:** `hardware-layout.js` is authoritative for both guides and cutters. `hardware-editor.js` controls placement; manufacturing consumes the accepted plan.
- **Interactions/edge cases:** a manual position outside footprint or colliding with a hole or margin must be rejected; changing base outline or crystal count can invalidate saved positions; automatic/multi quantity interactions; manually placed hole need not lie under a crystal; ceiling loads require independent mounting checks.
- **Status:** implemented; test coverage for off-base and overlapping holes, browser interaction still needs dedicated end-to-end manipulation cases.
- **Acceptance:** plotted coordinates match exported bores within tolerance; invalid holes are visibly identified, reported and never silently drilled; saved JSON round-trips manual layout; no overlap with mount/LED or base edge.

## F09 — Cura-first default print strategy

- **Intention:** make print preparation fast and predictable, allowing Cura to choose 0–100% infill and wall count rather than performing a costly whole-cluster volumetric erosion.
- **Behaviour:** default `hollowCrystals=false` gives a single Boolean-joined exterior plus any physical bore cuts. Cura controls infill/skins. Optional experimental complete hollowing remains available, but is not the default.
- **Implementation:** `prepareFabrication` branch in `fabrication-v1.js`, dispatched to worker; `sourceHash` avoids unnecessary rebuilding.
- **Interactions/edge cases:** 0% infill does NOT mean zero solid roofs or open light paths. Cura can bridge/block spike bases with skins. A superficially solid-looking model may need an actual cavity/hole feature.
- **Status:** implemented since v0.6.1, tested on representative fabrication; wide settings need further profiling.
- **Acceptance:** normal prepared exterior validates without whole-shell erosion; speed better than the old slow hollowing path for representative model; Cura can vary infill without mesh errors; LED access and mounting cuts remain real.

## F10 — Optional physically open zero-infill base vault

- **Intention:** prevent a large mound roof collapsing at 0% Cura infill by constructing permanent internal sloped supports without returning to slow full-crystal hollowing.
- **Behaviour/controls:** Zero-infill base structure checkbox and buttress spacing 16–40 mm (default 25); physical open underside recess, integral tapered columns/buttresses, protected socket/mount collars, LED lateral access windows, estimated roof-gap indicator.
- **Implementation:** `fabrication-v1.js::createPrintVault` subtracts cavity minus integrated supports, then cuts bores and cross-drills LED side vents. Vault and whole-cluster experimental hollowing are mutually exclusive in UI.
- **Interactions/edge cases:** very small/short base, unusual outlines/domes, mount collisions, wide spans, no buttresses fitting, overhang quality, LED collar vent penetration and physical accessibility. Heuristic gap is **not exact bridge feasibility**.
- **Status:** implemented, **experimental**, passing representative Manifold topology tests; not validated with a printed test piece.
- **Acceptance:** prepared mesh has physically open underside, one connected printable material body, no unintended sealed cavities, integral roof supports attached, LED bore opens via side vents and report warns about remaining spans. Inspect actual slices and test print before promoting to reliable supportless mode.

## F11 — Experimental whole-crystal hollowing and light tunnels

- **Intention:** when needed, ensure actual internal light channels, despite complexity and compute cost.
- **Behaviour/controls:** opt-in full-cluster hollowing and target wall thickness (0.8–4 mm). Narrow spikes may be skipped rather than cut below target wall; shared base chamber and passages are attempted.
- **Implementation:** Manifold erosion/inset and tunnel operations inside `prepareFabrication`; report exposes hollow ports, inaccessible pocket handling, topology screening and warnings.
- **Interactions/edge cases:** large performance cost (one earlier browser run ~118 seconds), inaccurate constant walls, closed chambers, abrupt geometry, LED channel connectivity and service access.
- **Status:** experimental; representative tests pass but real minimum walls and light distribution are unverified. Avoid silently enabling this with vault mode.
- **Acceptance:** no sealed voids in the tested model, requested eligible spikes visibly receive passages, no accidental broken solid and performance is measured before recommending as normal workflow. Slicer + physical verification required.

## F12 — Print preparation, diagnostics and export

- **Intention:** distinguish a visually pleasing preview from a truly exportable joined model and warn of manufacturability limits.
- **Behaviour/controls:** Prepare print mesh, cancel, show manufacturing, heatmap, overhang angle (default 45°), volume/mass, printer choice, body count, cavities, socket/mount counts, vault supports, estimated gap, orientation and export STL/3MF. Optional split plane and calibration coupon.
- **Implementation:** `studio-v3.js` creates/reuses worker; `fabrication-worker.js` executes `prepareFabrication`; `fabrication-v1.js` outputs geometry/report. Browser preview uses Y-up; exporter maps Y to slicer Z.
- **Interactions/edge cases:** async cancellation, stale result after editing, huge geometry, zero components, disconnected solids, negative-volume inner shells, degenerate triangles, bad cuts, export after error, printer envelope differences and false support-free confidence.
- **Status:** implemented (heuristic printability, not full G-code simulation); STL/3MF binary tests and browser downloads exist.
- **Acceptance:** successful representative model is one manifold joined body where expected; prepared mesh is new or correctly cached; cancel/error prevents stale downloads; exported triangle count/orientation and package format are valid; warnings remain actionable and precise.

## F13 — Persistence, modes, documentation and release history

- **Intention:** continuity over long design sessions and between AI assistants, browsers and project iterations.
- **Behaviour:** auto-save in local browser, portable JSON save/load, Simple/Advanced mode preserving object state, keyboard shortcuts, Help and in-app release history; project documentation in repo.
- **Implementation:** `studio-v3.js` localStorage key `crystal-forge-v3` and project serialization; `index.html`; `AGENTS.md` + `docs/`.
- **Edge cases:** older project settings including legacy hollowing, missing keys, reusing IDs, browser storage cleared, incompatible imported data, stale UI after loading.
- **Status:** implemented; migrations are partial and should be regression-tested with fixtures.
- **Acceptance:** JSON round-trip preserves positions, shapes, manual holes and meaningful settings; old version loads without silent destructive reset; mode toggle only changes control visibility; version and both changelogs agree.

## Deferred/explicitly unfinished features (do not mislabel)

Retention lips/cable strain relief, serviceable LED carriers, calibrated optical simulation, guaranteed shared light passages in Cura-first mode, 100% automated supportless redesign, exact bridge-span computation, reliable auto-orientation, attachment plates/keyholes, split alignment/dowels, assembly drawings, broad printer profiles and drag-manipulable hole handles are incomplete or proposed. See `docs/ROADMAP.md`.

## Cross-feature acceptance scenario — the essential integration test

Create a 16-crystal clustered design with a 25 mm integrated base and dome; test one shared nominal LED, 0% Cura infill, optional vault, a pair of mounting holes and selected crystal overrides. Change lean pattern, spacing, dome and manual hole position. The preview must remain responsive; the build guides and collision planner must agree with prepared cuts; the vault must remain open and connected; STL must be Z-up and fit the printer or warn; Cura slice must reveal any blocked light paths and unsupported roof areas. Preserve state across Simple/Advanced and saved JSON. **No isolated feature test can replace this system-level review.**
