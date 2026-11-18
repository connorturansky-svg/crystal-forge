# 012 — Creative Catalogue + Shared Pixel-String Routing

> **Status:** **OWNER-APPROVED IMPLEMENTATION SCOPE, PREPARATION ONLY.** The owner expressly requested a combined full-size phase but **DO NOT LAUNCH CODEX OR IMPLEMENT NOW**. A separate direct owner dispatch instruction is required.
> **Task Issue:** [WT-012 / #52](https://github.com/connorturansky-svg/crystal-forge/issues/52).
> **Planning branch:** `planning/prompts`; complete immutable approved **40-character commit SHA pinned on Issue #52**.
> **Main baseline verified:** `9abcecbe0235c889d16139e110e1b8c621472ca1` following merged WT-010 [PR #50](https://github.com/connorturansky-svg/crystal-forge/pull/50). Fetch current `main` at actual implementation start.
> **Supersedes:** Only the **proposed** separate WT-012-routing / WT-013-catalogue implementation order recorded before owner chose a combined phase. No completed or already approved source implementation brief is superseded.
> **WT-011:** [Modular assembly Issue #51](https://github.com/connorturansky-svg/crystal-forge/issues/51) and pinned `prompts/011-modular-assembly.md` @ `51b915da7fa96d07776cd8bfff6bafb5b926e4d5` remain **OWNER-APPROVED BUT ON HOLD / LOW PRIORITY**. No edits, cancellation, closure or silent replacement.
> **External contributor:** Jordan's isolated SVG importer [WT-003 / PR #37](https://github.com/connorturansky-svg/crystal-forge/pull/37) remains **open/draft, unmerged**. It is outside this task. No editing `svg-import/**`, importing it into live Studio or relying on it to be merged.
> **Delivery scale:** One ambitious, **carefully bounded** owner-Codex feature PR that combines two user-ranked HIGH priorities. Aim for **one complete Codex allowance pass**, but usage cannot be reliably predicted or capped. Prioritise actual functionality over broad catalogue claims. One integration owner; independent short audit/test subagents only if available and truly reducing effort.

## 1. User intent and design philosophy

The owner prefers meaningful, creative new **3D model options** AND the ability to position and wire **real addressable pixel-string fittings** on all model shapes that can actually be manufactured safely. Pixel routing cannot be a coloured illustration or a second, unrelated pseudo-wire system. Every generated model must be visually recognisable and genuinely parametric; every promised cable route must cut actual exported material. Existing Crystal Clusters are the **authoritative benchmark** for both software interaction and real geometric behaviour.

Target maker workflow: **Choose a visually distinctive model → adjust shape parameters → Build → place/select and reorder pixels → set physical 25/50/100/custom mm pitch and path settings → inspect direction and warnings → prepare genuine Manifold output → download current Print Centre 3MF/ZIP**. Invalid or unverified shapes must explain what is unsupported, rather than generating pretend print-ready tracks.

### Explicit bounded deliverables

- **Visual catalogue:** exactly **three native families**, **four novel geometric/style mechanisms** total and **at least six visual starting-point presets** (two per family) with real structural differences. Families: **Tactile Texture Tiles**, **Decorative Cogs & Gears**, **Glowing Pebbles & Light Pods**. Do not rebuild all six non-Crystal generator families.
- **Shared physical wiring:** extend real **serial** underside cable tracks to exactly **two initially qualified native model families**: **solid-backed Tactile Tiles** and **solid-body *decorative* Gears with no internal windows/bore/extra fixing holes**. Supporting additional families is explicitly *not* required. Light Pods get new visual geometry but **no promise of routed cables or verified optical cavities** in this phase; their hollow shells often cannot provide proven route-bearing material.
- **Crystal parity:** preserve all existing Crystal creation, editable spikes, contrast and material preview, 180° opposed ports, smooth curves, cable length warnings, root/roof protections, LED position/order, mounting, fit coupons, save/reload and STL/3MF exports. Reuse shared math/IDs where valid; do not rewrite the original Crystal planner.
- **Real integration:** one coherent Design + Build + Library + Print interaction path and corresponding static/Chromium/Manifold evidence.
- **Guardrail:** The word *across all suitable models* expresses the long-term design; it does NOT authorise blanket support for unsafe geometry. This milestone delivers TWO strictly eligible non-Crystal families and a reusable, extensible capability contract.

## 2. Verified existing implementation: reuse, don't duplicate

Read latest `AGENTS.md`, `docs/AI_HANDOVER.md`, `docs/TESTING.md`, relevant current modules and these verified observations before coding:

1. `studio-catalogue.js` registers six non-Crystal generators. Gear recipes already offer multiple decorative rims/openwork styles; Tile patterns are a closed, connected height-field mesh and the tile recipe provides `pixelBoreSupport` with actual backing thickness; Light Pods support Pebble/Swept stone/Lantern/Layered dome shell shapes with optional cavities. These are **not blank generator families**.
2. `tactile-tile-generator.js` already has 9 patterns, 4 outlines, separate top/backed dual-material bodies; `tileGenerator.recipe()` wraps the generated mesh in `pixelBoreSupport`. Avoid creating another independent tile mesh pipeline.
3. `studio-pixel-builder.js` and `studio-pixel-bore-validation.js` currently support placed/checked **vertical pixel bores** (max 16) with stable IDs and conservative material validation, not Crystal-equivalent serial cable channels. This existing bore logic and LED fitting coupons must survive.
4. `sensory-studio.js` already renders model presets via `recipeThumbnail()`/visual picker, generic Build pixel palette, P1/P2 selection/reorder, mouse selection and hold/drag, saved projects and Print Centre. Reuse these to avoid a second pixel editor or independent state.
5. `pixel-string-routing.js` exports `pixelStringAxis`, `pixelStringPort`, `sampleCableCurve` and `planPixelStringRoutes`. Its Crystal route plan uses **Crystal-specific base and hardware facts**. Reuse the shared **curve/port maths** as appropriate, but **DO NOT pass a generic model to a Crystal function that assumes `baseSurfaceHeight(crystals,s)`**.
6. `wire-routing.js`, `hardware-layout.js` and the Crystal manufacturing system already plan serial IN → P1 → … → Pn → OUT, red overlength paths, obstacle rejection and real cut geometry. Preserve exactly; an opt-in native adapter must not silently change any Crystal route.
7. `applyBuildModules()` applies build modifiers to recipes used by both `previewRecipe()` and `studio-model-worker.js`. `studio-geometry.js::prepareRecipe()` uses Manifold and has real `negative` solids. Integrate the approved native channel cutters **only through this authoritative recipe/worker path**, not a separate decorative mesh exported without cuts.
8. Print Centre, model revision invalidation, queue job overrides, named ZIP/3MF packs and manifests were delivered in merged WT-006 through WT-010. Preserve those contracts, including no stale export and unique job names.
9. The following are **not** established by source: every non-Crystal model is routeable; Light Pod cavities illuminate everywhere; LEDs physically retain securely; 3D render colour verifies wall thickness; Cura or actual physical printed fit is proven.

## 3. Creative Catalogue — exactly four new mechanisms, six usable presets

Implement **real geometry**, not six renamed parameter presets or cosmetic-only shaders. Add visual preset cards with accurate distinct generated thumbnails, clear names, short makers' descriptions, and existing edit flow. Keep existing presets, `typeId`, `typeVersion` and older project data compatible; only introduce a migration/version change if actually necessary.

### 3A. Tactile Tiles — two new surface constructions and two presets

1. **Topographic Contour / Terraces:** new continuous sculpted terrain contour bands with controllable **terrace count/softening** or appropriate bounded knobs, guaranteed solid backing and nonzero roof/relief. It must look unlike existing River or Mineral sine relief in actual 3D, not just colour.
2. **Quilt / Padded Cells:** distinct raised repeated quilted/pillow cell construction with adjustable **cell scale/puff**, smooth connection into the plate and continuous printable backing. Must look unlike existing Pebbles or Dots; no detached raised islands.
3. At least one named visual preset for each, with deterministic seed, meaningful thumbnail and real positive-volume geometry. Keep all nine pre-existing patterns and 4 outline shapes intact; dual-material disjoint-volume validation and print frames persist.

### 3B. Decorative Gears — one new true structural body mechanism and two presets

4. Add **one** clearly novel `webStyle` or rim/body topology (e.g. triskelion swept openwork, thick connected lattice or distinctive skeleton), different from current Solid/Sector/Sweep/Teardrop/Lens and existing tooth-only permutations. Add **two** clearly different presets exercising it with useful rim/spoke parameters, real through-windows and adequate webs.
5. Existing `mode:'Mechanical'` tooth geometry, shaft fit and involute constraints must remain untouched. A decorated/openwork gear is **not** claimed to be an engineering-rated gear; do not route cables through it by default.

### 3C. Light Pods — one new true shell construction and two presets

6. Add **one** structurally new pod shell mode (e.g. segmented beacon/ribbed mineral lantern distinct from existing Pebble/Swept stone/Lantern/Layered dome) and **two** recognisably different presets. Use real connected positive and when illuminated, existing actual cavity/access geometry; maintain bounded wall thickness, sensible roof and underside access warnings.
7. Keep existing Pebble and shell styles plus saved records unchanged; no claims of quantitative optics or universal cable paths. **Do not** expand the requested routing feature to thin curved Light Pod shells in this milestone.

### Visual acceptance for all six presets

The same canonical parametric recipe must produce the preset thumbnail, live 3D model and prepared Manifold output. Verify substantive silhouette/topology/relief differences (geometry fingerprint/volume/position assertions or comparable deterministic metrics), not just string comparisons or changed colours. Update picker family/preset cards and contextual sliders; no fake preset links and no new external imagery.

## 4. Shared Pixel Routing — honest and physical for two native families

### 4A. Eligibility adapter and source of truth

- Implement a **small shared native route capability/clearance contract** on the existing recipe/build structure: explicit supported family/style, actual contiguous underside route-bearing material, safe usable perimeter, and independently validated available material/roof thickness along **the entire sampled path**.
- **First supported:** thick solid Tactile backing with enough material above a shallow underside groove (e.g. user-selected backing must satisfy groove depth + conservative roof allowance) and a continuous outer boundary.
- **Second supported:** *decorative Gear with uninterrupted solid disk/body* (`webStyle:'Solid'`, no spoke windows, no shaft bore, no extra fixing holes, adequate thickness). Reject mechanical mode, openwork, pulley recesses, swept thin spokes, narrow rims or any silhouette whose continuous route envelope cannot be certified. A user must still be able to create and edit unsupported models; only routed manufacturing is blocked.
- Reuse existing fitted pixel records `build.pixelHoles`, stable per-hole IDs, physical profile dimensions, checked/failed placement flags and authoritative ordering. Preserve older bore-only models as **bore-only unless user explicitly opts into routing**; do not retroactively cut cable tracks into legacy saved jobs.
- Keep route settings in `model.build` with one opt-in versioned subrecord if truly needed. Avoid new top-level project schema, duplicate hole collections, massive state migration or altering the Crystal model's structure.
- **Fail closed:** uncertain local material thickness, openwork windows, cavities, holes, too-narrow border, nearby mechanical fittings, invalid/overlong wiring, and unsupported transformations require explicit explanation and disabled prepared/export action. A broad `recipe.bounds` box check is not certification.

### 4B. Physical series topology and route maths

- For **one** pixel: distinct **EDGE IN → P1 input** and **P1 output → EDGE OUT**; two distinct physical cable tails even if they use the same pixel.
- For **two or more** pixels: **EDGE IN → P1 IN; P1 OUT → P2 IN; …; Pn OUT → EDGE OUT**. No auto return loop, no paired parallel pseudo-tracks. The saved pixel list defines route sequence, with P1 change/reorder immediately replanning.
- Pixel body in/out axes must remain **180° opposite** as rotated. Construct tangent-compatible, **smooth sampled curves** using existing `sampleCableCurve` and port helpers; do not substitute rigid right-angle joints or falsely claim min bend radius from sparse samples.
- Support existing **25, 50, 100 and custom mm pitch** as physical cable-centreline budgets, not straight Euclidean pixel spacing; include initial/final tail lengths as separate settings when supported. Highlight an exceeded link in red and **block manufacture/export** for that job until corrected. Preserve arrows and segment-length labels.
- Choose/validate separate entry/exit positions on accessible perimeter, allow optional explicit positions if the existing UI/contract supports them safely; never silently route across other pixel bores, embedded solid voids, vents or model window cutouts.
- Recompute on pixel moves, rotations, insert/remove/reorder, geometry/pattern/thickness/outline changes and route setting changes. Cancelled/rejected operations must preserve last valid accepted model and be undoable through existing history. Route planner output and preview are ephemeral derived data; saved source-of-truth stays stable.

### 4C. Real manufacturing channel subtraction and inspection

- Generate a **continuous underside-open cutter** from sampled curves with consistent width/depth and wall clearance. Use a bounded, actual recipe primitive/mesh or safe Manifold union, not viewport-only lines. Ensure cutter geometry is finite and robust, and shares path locations with preview/length reporting.
- **Do not** cut completely through the thin tile plate, floor, edge or gear web. Guarantee appropriate roof/web allowance by conservative preflight geometry analysis and post-cut actual Manifold tests. If a requested route fails, stop that export with actionable reasons; don't silently drop just the track.
- Verify actual **post-cut volume reduction**, number/continuity of required openings, closed/correct geometry and that intended cable ingress/egress reaches the external boundary. Include explicit negative fixtures (too thin, narrow, blocked, overlapping/invalid bore, no safe edge route, length exceeded).
- Don't invent a claim that pixel retention, wire bend strain, solder clearance, light diffusion or actual cable pitch is physically verified. Real prints remain a separate acceptance gate.
- Reuse existing model-preparation workers/recipe output and STL/3MF/ZIP export. Preserve dual-material positive bodies and role alignment where possible; if a certain dual-material surface cannot preserve a continuous certified backing, **explicitly disallow native routing in that configuration**, while leaving the ordinary non-routed model printable.

## 5. Working Design / Build / Library / Print interactions

- **Create/picker:** Accurate new visual thumbnails/cards for each of six presets; choosing one opens a real editable model with contextual shape controls. Changes to actual parameters update the same authoritative state as settings, model thumbnails, save/reload and Print.
- **Build:** A concise, visible `Serial LED string` opt-in for eligible native models, not a second unrelated pixel editor. Reuse numbered P1/P2 selector, click-select/hold-drag, existing profile and coupon controls; add route pitch selector, actual direction, start/reorder, preview toggle and exact status/warnings where missing. Mark ineligible models as `Bore-only — cable routing unavailable` with concrete reasons. Controls must respond to mouse, keyboard and narrow viewport.
- **3D preview:** Show accepted holes and derived spline route with arrows, P1 order and distinguishable **red** overlength/unsafe segments. Overlay is inspection-only; do not merge it into manufactured surface unless actual cutter is approved. Hide or update overlays correctly on model switch and Design/Print transitions.
- **One source of truth:** All warnings/lengths/route curves used in UI must trace to the exact same planner output as actual cutter generation. Avoid two subtly different routing solutions. Keep project history, undo/redo, old saved models and the visual Library intact. No invisible state mutations from simply viewing a model.
- **Prepare/Print:** Existing worker validates the real revised recipe, job source revision and effective machine settings. Stale results cannot be downloaded. A valid routed model exports changed STL/3MF geometry via current Print Centre and existing production pack format. Existing print manifest should truthfully state route mode/state when included, without changing its core schema unnecessarily.
- **No dead controls:** Test every added button/select/slider. If route settings are unsupported or incomplete, disable with explanation; don't show success status for an attempted missing channel.

## 6. Acceptance matrix — finish all essential checks in one reviewable draft PR

### Creative catalogue

**WT012-01** — Picker shows six genuinely new preset cards (2 Tile / 2 Gear / 2 Pod) with truthful distinct generated thumbnails; each click opens the named editable recipe, and parameters change actual visible geometry.

**WT012-02** — Real preparation of each new structural mechanism produces valid nonempty connected Manifold output and meaningful differences in volume/topology/silhouette metrics from pre-existing styles, checked against fixed seeds/parameters and STL/3MF signatures. Old family presets and mechanical Gear mode retain previous behaviour.

### Pixel routing and geometry

**WT012-03** — Eligible solid Tile and eligible solid decorative Gear each accept manually placed checked P1 and P2 with stable IDs; 1-, 2- and 3-pixel cases include correct serial order and distinct first IN/last OUT tails. Pixel rotation always preserves opposite IN/OUT port directions. Save/load preserves order/profile/route settings.

**WT012-04** — `25/50/100/custom mm` measured **curved** centreline tests cover within/equal/exceeded budgets, flagged red error, appropriate segment count and arrows. Swap P1 order and edit rotation in Build to verify deterministic replanning and changed route.

**WT012-05** — Preview lines and physical underside-channel cutters use the same path/cross-section/footprint. Actual Manifold volume difference is positive, accepted tubes are contiguous through prescribed ports and perimeter exits, and exported 3MF/STL/ZIP contain same printed cuts. No 'preview only' paths accepted as manufacturable.

**WT012-06** — Reject thin tile, openwork/mechanical/shafted gear, cavity/negative interference, nearby pixel/mount, unsafe roof/wall, out-of-bounds or missing perimeter route, excessive pitch or otherwise unverified material; report named reason; don't download a supposedly routed part with missing cuts.

### UI, reliability and compatibility

**WT012-07** — End-to-end Chromium click/keyboard tests for new preset cards, model changes, route mode, placement, select, drag, reorder/start, pitch setting, inspector/preview, invalid rollback, successful prepare, blocked prepare, downloaded real outputs and narrow viewport. Screenshots show one valid Tile, valid Gear, rejected unsupported model and preserved Crystal.

**WT012-08** — Model/project Library copy/linked behaviour, save/reload, old bore-only records, multiple model tabs, printer overrides, stale job invalidation and export guards survive unchanged. Do not silently turn on routes for existing documents.

**WT012-09** — **Crystal benchmark:** regression for 1/2/6 pixels, true P1→Pn, 180° opposing physical ports, sampled smooth curves, independent edge tails, 25/50/100 mm warnings, actual cut continuity, measured fit profiles, undo/save and manifold STL/3MF. Do not degrade Crystal to a generic shape adapter.

**WT012-10** — No significant new browser freezes from thumbnail regeneration or channel cutting. Bounded route segments/iterations, current-model-only WebGL work, worker cancellation and material clear-up; verify representative typical, dense, negative cases and record actual execution/runtime where available.

**WT012-11** — Latest exact-head `npm run test:static`, focused catalogue/geometry/Manifold tests, real Chromium smoke and repository native CI pass, with actual logs/artifact screenshots. No fabricated green checks; report failures and dependencies. No physical Cura import, filament print, cable bend/fit, optical output, mechanical load or child safety certification is implied.

**WT012-12** — Single app release version increment, matching `CHANGELOG.md`/in-app What's New, concise updated `docs/AI_HANDOVER.md` and `docs/ROADMAP.md`, with source ownership, build/route data contract, backed-up legacy migration behaviour, tested modes, blocked modes, remaining physical checks and follow-up work.

### Absolutely out of scope

- Generic SVG, STL or OBJ importing, external WT-003 files, arbitrary mesh repair, unknown imported-model routing.
- Full *all-family* universal cable support, curved thin-wall/light-pod route certification, photo-realistic or physically calibrated optical simulation.
- Hollow light pathway continuity guarantees or new transparent-material physics (user ranks these MEDIUM, schedule separately).
- Completely rebuilding the gear/mechanical generator, all seven model families, freeform sculpting or multi-select group gizmos.
- Hardware retaining clips, custom solder strain relief, mounting safety certification, xLights/FPP exports, IP-rated electronics enclosures.
- Modular splitting/dowels/assembly (WT-011 stays open/on hold), Cura optimisation overhaul, private cloud OAuth or AI agent dispatcher.
- Renaming or migrating library schemas unnecessarily, new rendering frameworks/dependencies, or an open-ended catalogue asset collection.

## 7. Budget discipline and implementation stages

**One full-size but bounded feature**. User chose the combined route over two separate large PRs, so avoid expanding beyond **4 genuinely new shape mechanisms + 6 presets + 2 verified native routing families**. There is no reliable numeric Codex-credit guarantee; do not sacrifice correctness to claim full coverage of all families.

**Stage A — Read/audit and baseline:** verify current main & WT-010 merged; read `AGENTS.md`, `docs/AI_HANDOVER.md`, this pinned spec and only relevant generation/routing/worker tests. Identify the smallest common route helper surface and the four exact new geometry mechanisms. Capture baseline static/Manifold/Chromium once.

**Stage B — Bounded geometry catalogue:** add the 4 real mechanisms and 6 preset entry points across the 3 families; ensure connected preview + Manifold prep + old behaviours. If a proposed shape cannot be manufactured, adjust the construction *within the same family* rather than adding unrelated styles.

**Stage C — Two-family serial route adapter:** reuse pure Crystal sample curve/port math and native existing fit/validation records, implement type/style eligibility, correct edge entry and curve planner, physical Boolean cutters; get actual 1/2/3-pixel Manifold tests to pass **before** UI claims. Preserve unmodified Crystal planner.

**Stage D — Contextual Build and print:** wire into existing pixel palette and 3D overlay, opt-in pitch controls, saved build state, status messages, cache invalidation and real worker export. Test all buttons/keyboard and existing current-model Print Centre.

**Stage E — CI and handover:** exact-head static, real Manifold, browser/regression, screenshots and release docs. One **draft PR** only, no force-push direct to main, no auto-merge/deploy. Fix focused regressions; do not start WT-013/WT-011 or close broad physical issues.

If budget or validation makes the combined task too large, **finish a reliable, test-backed slice of both priorities**, clearly report any unmet WT012-XX criteria and keep PR draft. Do not claim completion, hide a safety failure, weaken tests, or silently replace real cutting with previews. Prioritise quality of the two eligible native routing workflows and essential new geometry over adding unsupported families.

One integration owner; optional isolated reviewer/QA agents only if available and not writing to overlapping files. Absolutely no agent dispatch until **separate explicit user instruction**.

## 8. GitHub coordination and handoff contract

**On a future owner instruction to implement only**, claim Issue #52:

`CLAIM WT-012 — @connorturansky-svg Codex — feat/WT-012-creative-routing — native visuals and validated serial wire cuts`

Create `feat/WT-012-creative-routing` **from fresh `main`**, never from the planning branch or WT-011. Open **one draft PR**:

`[WT-012] Creative catalogue and verified native pixel-string routing`

Required PR description fields:

```
Task issue: #52
Approved spec: prompts/012-creative-catalogue-shared-routing.md @ <FULL_40_CHARACTER_IMMUTABLE_SHA_PINNED_ON_ISSUE_52>
Scope: Four new structural styles/six presets across Tiles, Gears and Pods; real serial routing only for qualified solid Tiles and decorative Gears.
Related PRs/duplicates: WT-010 #50 merged; WT-011 #51 on hold/untouched; WT-003 #37 SVG external and untouched; WT-004 separate.
Test evidence: <actual exact head, hosted static/Chromium/Manifold URLs, screenshots and result notes>
Handover: docs/AI_HANDOVER.md plus route eligibility and catalogue acceptance.
Risks: <blocked families, manual Cura/printed cable/LED fit and optical validation unverified>
```

Preserve all user saved records, private tokens and the unrelated external SVG branch. **Do not implement or send this task to Codex until owner explicitly authorises dispatch.** Completion is a tested draft implementation PR, not an autonomous merge.
