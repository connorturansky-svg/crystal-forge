# WT-019 — True Studio-Wide Model Parity and Complete Shared Tooling

> **Status:** Owner-requested NEW implementation milestone. The owner has explicitly requested preparation of this complete Codex brief; the file and tracking Issue are not themselves a command to merge or deploy.
> **Issue:** [WT-019 #79](https://github.com/connorturansky-svg/crystal-forge/issues/79)
> **Planning ref:** `planning/prompts`
> **Source:** `prompts/019-true-studio-model-parity.md`
> **Supersedes:** Future implementation work in old historical Issues #1, #6, #7 and #9 **only insofar as** those requirements are preserved in #79; #10 remains physical acceptance; #51 stays ON HOLD. Does **not** rewrite the historic WT-018 brief.
> **Intent:** **One application with seven equally capable model builders**, plus imported artwork/meshes where genuine geometry makes the operation possible. Crystal is the reference for shared functionality, **not a reason to degrade other editors or falsify unsupported features**.
> **Owner approval boundaries:** Implementation may be developed in focused draft PRs. **Do not merge to main, auto-deploy GitHub Pages, publish a release, close externally owned PRs, lift WT-011 or assume physical safety/fit.**

## 0. Critical starting reality — audit again before editing

As of **19 November 2026, approximately 12:40 UK time**, last verified `main` was `421f050b9d980356b502ad22483712c1105e2f54`, containing WT-018 workspace recovery #71. The other WT-018 merges can be **feature-branch merges rather than inclusion on main**:

- #72 backed routing (Waves, shaftless Caps, backed Characters, solid Pods) was merged **into the #71 feature branch**, not necessarily main.
- #73 integrated Jordan-derived SVG importing **into #72's branch**, not necessarily main.
- #74 recovered STL/OBJ import **into #73's branch**, not necessarily main.
- #75 implemented a preliminary native **double-click Add pixel** action **into #74's branch**, not necessarily main; its matrix labels most features **L**, not verified P.
- #78 split **Show route** from **Cut channels** in a feature branch stacked on #77, which is still an **open draft** against the #75 branch.
- Planning-only #76 was merged to `planning/prompts`.
- Jordan's distinct SVG subsystem draft [#37](https://github.com/connorturansky-svg/crystal-forge/pull/37) and [Issue #36](https://github.com/connorturansky-svg/crystal-forge/issues/36) remain under external ownership; preserve code provenance and contributor review. Copilot pilot #42 also remains owner-controlled.
- Old historical issues #1, #6–#9 were closed **as superseded/duplicate** only after their outstanding requirements were transferred into [#79](https://github.com/connorturansky-svg/crystal-forge/issues/79), [physical validation #10](https://github.com/connorturansky-svg/crystal-forge/issues/10), and [held modular assembly #51](https://github.com/connorturansky-svg/crystal-forge/issues/51). Their closure is not a feature-complete claim.

**First actions:** Fetch `main`, all PRs, reachability/merge bases, CI, latest docs and code. Read `AGENTS.md`, `docs/AI_HANDOVER.md`, `docs/PRODUCTION_REVIEW.md`, `docs/MODEL_BUILDER_PARITY.md` (on the current WT-018 head if not yet main), `docs/BACKLOG_TRIAGE.md`, `docs/ROADMAP.md`, `docs/FEATURE_SPECIFICATIONS.md`, `docs/ARCHITECTURE.md`, `docs/TESTING.md`, `docs/DESIGN_DECISIONS.md`, `docs/PROJECT_VISION.md`, this prompt and `prompts/HANDOVER_PROTOCOL.md`. Audit source and tests against current commits; the observations above expire as soon as new merges occur.

**Hard dependency:** Do not start overlapping edits on older `main` while #77/#78 or another owner Codex session owns those areas. If WT-018 has not landed, work on a **clean, documented tested integration head** (or limit to a non-overlapping audit PR), and spell out the exact owner merge order. No duplicate import parsers, routing engines or conflicting `sensory-studio.js` edits.

## 1. What the owner means by REAL parity

The seven procedural families:
1. Crystal Clusters
2. Tactile Texture Tiles
3. Cogs & Gears
4. Waves & Organic Forms
5. Buttons & Control Caps
6. Characters & Silhouettes
7. Glowing Pebbles & Light Pods

**Every common tool must behave effectively the same** in terms of visibility, discoverability, pointer/keyboard/touch interaction, exact control, selected-object state, undo/redo, validation, source persistence, derived geometry and Print exports. Every genuine family-specific parameter remains unique to its model. **Do not reduce the stronger Crystal system to a weaker shared denominator**.

Expected normal user journey, regardless of starting generator:

**Home → Create model → Design (edit shape and components) → Build (double-click to add/edit pixel or mount) → select/move/rotate hardware in actual 3D → see live P1/Pn path and arrows → route settings and length warnings → inspect prepared cutaway → save to Library → reopen/sync → prepare current job → valid STL/3MF and production pack.**

Imported SVG/STL/OBJ models must join the same workflow **when import integration is on the tested baseline and topology supports the operation**. Do not pretend a triangulated mesh regains its original procedural source controls or that all meshes support Boolean edits.

A parity feature is not complete merely because it has a button. The same user action must update the authoritative model, show correct visual feedback, survive save/load, and result in correct manufacturing geometry when applicable. Shape limitations may be **B = physically blocked**, with an explicit reason and suggested correction; B is not evidence of a missing UI implementation.

## 2. A rigorous, measurable before/after parity audit

Build or update a **single canonical source-backed parity matrix** (`docs/MODEL_BUILDER_PARITY.md`) that lists **every common feature** against all seven families **and SVG/STL/OBJ types** with:
- P = proven complete by real UI + state + fabrication where relevant;
- L = present but limited / under-tested;
- M = genuinely missing;
- B = blocked by a demonstrated geometry/material constraint;
- N/A = intrinsically nonsensical on this model and approved as an exception.

For each cell record **specific source handler/adapter, exact test fixture, user-visible behaviour, reason for exception and linked remediation PR**. Link tests to criteria; capture before/after screenshots of every family's actual Design/Build/Print experience. Do not promote a cell from L to P because a generic handler was added without interaction and Manifold evidence.

Audit at minimum:
- Creation, preset selection, randomisation/seed (where meaningful), part editing, materials, transformations, scaling/rotation, preview controls.
- Single click selection, double-click context menu, drag, pointer mode, keyboard/touch, undo/redo.
- Measured LED profiles, pixel count/IDs/order, manual/auto placement, parts/backings, mount creation, collision and clearance.
- Show wiring, real physical routing, P1/arrow/orientation, cable pitch, snap, tail entry/exit, transparent/X-ray/section and actual cutters.
- Optical diagnostics, print-fit coupons, imported-model limits, multi-material outputs.
- Project tabs, linked and copied Library objects, templates, favourites/collections, autosave, backups, private vault, multi-tab collision protection, older JSON migrations.
- Print Centre queue, printer/nozzle/material/quality settings, prepared result identity, job cancellation, dimensions, actual STL/3MF files, assembly/production pack and error feedback.
- Help, tooltips, keyboard, tablet/mobile, both colour themes, responsiveness and performance.

Deliver an honest **P0/P1/P2 list**: **P0** common interaction correctness, unsafe manufacturing, broken saved data/exports; **P1** feature discovery and parity; **P2** advanced creative polish. Implement P0/P1 without claiming P2 is a release blocker unless it breaks an advertised feature.

## 3. The shared Design experience — not only Build

Bring all common model-building interactions to parity:
- Consistent Home cards, model tabs, naming, duplication, linked/copy behaviour, project-level vs per-model selections and independent editable state.
- The same organised **Design → Build → Print** navigation, global actions and precision panel. Simple/Advanced modes expose depth without swapping or regenerating the underlying model.
- Whole-model position, rotation, scale and exact dimensions with clear axes and reset; selected **real editable components** get their own meaningful transforms where the generator actually has subparts. Never show pretend Crystal-style child components for indivisible shapes.
- Common visual feedback for selected/hovered/locked/invalid objects; grid/snap, visible rulers/dimensions, seed/preset/regenerate only where applicable, reversible changes and no camera jumps.
- Model-specific features stay available and discoverable: Crystal facets/shape/lean/spacing; Tile pattern/relief; Gear teeth/openwork/shaft; Wave contour; Cap grip/shaft; Character silhouette/pose; Pod wall/cavity. A shared tool must not erase these.
- Consistent selection from centre viewport and settings tree, contextual precision fields, undo/redo, per-model history, and inspector scroll/focus. No duplicate source-of-truth state or stale panels when switching model tabs.
- Standard camera orbit/pan/zoom, reset, fit model, top/bottom/side, free-floating centre framing and independent per-model view state if supported. No off-screen object or orbit pivot mismatch.
- Comparable responsive layouts at desktop/tablet/390px, useful light/dark contrast, keyboard focus, shortcut help, descriptions and accessible touch affordances.

## 4. Critical 3D interaction contract: pixels AND mounts

Apply **identical logic and visible guidance** to all seven where real geometry is eligible.

1. **Single-click marker** selects a Pn/Mn object, highlights it, its relevant route and exact editing card. Clicking a Build list row selects/highlights the same marker; stable identity is separate from mutable order.
2. **Double-click blank valid surface** opens a context menu at the **real raycast placement point**, containing **Add pixel**, **Add mounting hole/feature**, and **Cancel**. Double-click a marker selects/edits it instead of adding a duplicate. Empty space or invalid/occluded surfaces never invent coordinates.
3. Toolbar **Add pixel** and **Add mount** enter recognisable continuous placement with cursor ghost (valid/invalid colour), inline reason and clear Esc/Done. Repeated placement continues until exit; selection and orbit cannot fight. A one-click Add action should not secretly place at a random automatic position when manual positioning is intended.
4. **Click once to select; click-and-hold to drag** an existing marker. Disable orbit only during actual hardware manipulation, not all the time. Provide drag threshold, pointer capture/release, safe cancel/rollback and consistent orbit outside the manipulation. Support keyboard nudge, exact numeric editing and discoverable touch alternative.
5. Pixel rotation changes the two physical **180° opposing IN/OUT** axes, without inventing adjacent fake parallel ports; user can choose starting P1, reverse, change order, delete and receive live routing updates. Reordering must not move the physical pixel.
6. Automatic placement and accepted user placement use the same final geometry and clearance rules: actual body, bore, flange/support, backing, adjacent bores, mounts, thin walls, holes, shaft/cavity conflicts, relief, model outline and roof. Rejected movement reverts cleanly with an **actionable explanation**.
7. Shared named measured **A–G** pixel profile creation/editing works **before placement**, persists across families/computers through the established flows and distinguishes “profile for next placement” from “edit selected fitting”. Do not silently rewrite older fitted pixels or lose custom gumdrop types.
8. Consistent numbered P/M visual representation, fit-test coupon, mount preference, serviceability warning, combined status/report. Distinguish **a valid generic bore**, **a seated mechanical fitting**, and **a physically verified LED retention system**. Do not claim all three when only one is built.
9. For curved/3D bodies and arbitrary imported solids, use correct model/world transforms, surface normals and shape material certificates; no rectangular-bounds approximation masquerading as valid.
10. Keep genuine mount geometry model-aware; Crystal tabs/M3 pockets are not universally appropriate to thin silhouette, cap shaft or hollow pod shells. Where impossible, explain the physical reason and offer a valid supported backing/mount option if one exists.

**Mandatory tests:** genuine Playwright event sequences for all seven: single-click/selection sync; double-click add pixel; double-click add mount (positive where supported, B where impossible); continuous placement; hold-drag; rotate; move invalid; Esc/cancel and orbit; keyboard and touch equivalent; undo/redo; save/reload; cross-family profile reuse. No tests limited to DOM text or mocked no-op events.

## 5. Cable routing must become a coherent shared product

This is a **top user concern**. Make it visible and comprehensible in every Build workspace, while manufacturing only safe proven geometry.

- Provide explicit **Show wiring / Guides** separate from **Cut physical cable channels**. Show all valid planned paths, **P1 → P2 → … → Pn**, EDGE IN/OUT, 3D directional arrows, real centreline lengths and segment budgets in the viewport whether viewed top, underneath or in cutaway. Hiding guides must not remove actual cutter settings; showing guides must not silently machine geometry.
- Use shared standard settings: **25/50/100/custom mm** physical cable pitch; P1/reverse/reorder; pixel axis rotation; independent first-IN/last-OUT tails; strand length and excess displayed in mm; optional validated curve, bend, slack, entry/exit settings where family supports them.
- Every pixel has physically opposed collinear wire IN/OUT directions at 180°, tangent exits and **smooth** curved routes. Measure actual sampled routing length, not Euclidean straight-line centre distance.
- Route data drives both preview and Manifold cutters/wiring report, with warnings and red segments; do not allow a view-only wire line to claim subtraction or a partial/blocked route to be exported as complete.
- Correct actual route bearing material per family: backing/thickness of Tiles and suitable Gears; shape/height of Waves; shaft/retention in Caps; limbs/webs in Characters; shell/cavity/access in Pods; root/base/optical channels in Crystals. Preserve model-specific adapters and validate actual clearance against geometry, not only bounds. Fail closed where unsupported.
- Use existing opt-in positive backing only where geometrically verified; show it consistently in preview and prepared material; do not silently enable on historical projects.
- Extend route snap-to-physical pitch from Crystal where genuinely applicable while protecting P1 and existing mounts; show why links cannot safely be matched and never overrun a selected physical LED pitch.
- The same selected route, length, arrow and cutaway should remain correct after rotating/orbiting the view, changing tabs, undo/reopen and preparing prints. Do not leave ghost overlays over prepared cuts.
- Add positive Manifold/STL/3MF multi-pixel fixtures across each **suitable** model family and negative fixtures for thin/hollow/shaft/window/obstruction/over-length. A family may still have B presets; the tool itself must not disappear or lie.
- Support a user-operable physical cable entry/exit and handling of real wire/flange clearance; report actual limitations until printed bend/strain fits are measured.

No physical cable strain, LED retention or electrical certification from software geometry.

## 6. Lighting, cutaways, print and import parity

- Preserve Crystal's final-solid optical passage sampling and strict mode. Give illuminated native models consistent prepared section/inspect controls and truthful “clear path sampled / obstructed / unknown” explanations where technically supported. Do not promise physically measured brightness or diffusion.
- A **single shared Print Centre** for all: live current revision, queue, per-job UM3 Extended / UM2+ printer/nozzle/material/quality override, preparation progress/cancel/cache invalidation, dimensions, sliced-geometry warnings, STL/3MF output, dual-material where actual geometry supports it, BOM/wiring/production ZIP.
- Distinguish preview from actual Manifold prepared solid. Compare displaced, rotated, scaled and multi-part models in **Z-up export**. Never export old prepared geometry after any relevant Design/Build change.
- SVG extrusion import (Jordan-derived) and STL/OBJ mesh import, once reconciled from WT-018, join the same model-tab/Build/Library/Print lifecycle. Include source/units/orientation, persisted transforms, size limits, validation status and view-only warnings.
- Add appropriate common hardware controls to **validated closed imported solids** only when safe. An STL/OBJ's native parametric design history is not reconstructable; do not pretend it is. Preview-only imported mesh must never be offered unsafe Boolean output. SVG artwork retains supported source-derived extrusion control.
- Actual Cura profile import, real filament/nozzle samples, LED fitting, wire seating, optical quality, thermal/electrical and structural mounting remain [#10](https://github.com/connorturansky-svg/crystal-forge/issues/10) — **physical acceptance is a separate gate**.
- **WT-011 modular print assembly remains ON HOLD**. Keep existing bed-split capability regression-safe but do not implement newly invented joinery or physically claim assembly strength.

## 7. Architecture: true shared tool contract, not seven superficial overlays

Identify the single canonical source for model state, selection, undo, pixel IDs and order, measured profile, viewport location, geometry eligibility, planner result, route overlays, actual cutter, cache fingerprint, export and Library/backup representation.

Prefer **one interaction layer / capability contract** and **shape-specific geometry adapters**, preserving Crystal's specific root/lighting code without silently replacing it. Do not wire arbitrary native models through Crystal-only base-height functions, nor keep independent unsynchronised “pixel hole” and “hardware editor” states.

Preserve compatibility with saved Crystal projects, native old records, original measured pixel profiles, linked revisions/templates, imported source transforms and GitHub vault snapshots. Use additive versioned migrations only where justified with test fixtures and rollback. Existing saved projects must never silently acquire a new backing or milled channel when merely loaded.

Performance and UX: worker-based expensive fabrications, progress and cancellation, stale result rejection, bounded geometry operations, resource disposal across many tabs, clear errors, keyboard and mobile usability. No speculative redesign or new dependencies unless they directly solve a demonstrated issue.

## 8. Test contract and release quality

The acceptance matrix must use unique IDs (WT019-01 onward) with action, expected screen/geometry/state behaviour, exact test name, verified SHA/CI URL and physical/manual gaps.

**Minimum automated matrix:**
- Seven built-in families × create, design edit, one/two pixels, true double-click context, marker select/drag, mount when applicable, profile reuse, P1/reorder, Show wiring, physical routing when eligible, red overlength, invalid material geometry, undo/save/load and Print Centre current mesh export.
- Real screenshots/contact sheet in both themes, at 390px, tablet and desktop; keyboard and touch emulation. Check camera orbit centre, panel sync, menu placement, focus and scroll.
- Positive path with real **Manifold Boolean subtraction**, a connected valid manufactured body, sane bore/cable cuts, STL and 3MF. Compare route sample coordinates, visible cutaway, consumed pitch, exported wire metadata and actual volume/geometry. Negative cases must fail without destroying the previous accepted model.
- SVG with contour hole, extrude, save/reopen, fitting where validated, export; STL binary/ASCII and OBJ with axes/units, good mesh vs open/unclosed preview-only, transform round-trip, import file limits, unsupported model hardware explanation.
- Existing Crystal layout/snap/optics, routing and measured profiles must not regress. Repeat mixed model tabs and linked/duplicate Library, private vault mocked sync/race, stale multi-browser workspaces and historical saved JSON.
- Performance: report preparation time and memory/cancellation for representative and stress configurations; avoid frontend freezes from expensive geometry.

Run `npm run test:static`, `npm test`, `npm run test:browser`, `npm run test:benchmark` and release-version gates as applicable. **Use exact-current-PR-head evidence**, not CI from an older stack. Do not claim physical Cura/printing or manual browser actions were performed without evidence.

## 9. Delivery phases and PR boundaries

**Phase A — Verified baseline and parity map.** Wait for an appropriate owner-reviewed WT-018 integration baseline. Check whether #77 and its #78 stack have reached `main`; list missing code, fix stale docs and current test gaps. Write rigorous before/after matrix and a demo project for every family.

**Phase B — Core interaction parity.** Deliver genuinely consistent pointer/raycast selection, double-click pixel AND mounting menu, continuous add, hold-drag, model-appropriate transforms, panel sync, keyboard/touch, undo/redo, selected state and independent camera. Real browser tests with screenshots. Draft PR; no merge.

**Phase C — Complete shared Hardware/Build.** Shared measured profiles, stable P/M order, auto/manual fitting, backing, real mounts and useful eligibility diagnostics. Demonstrate actual Manifold bores, usable cutaways and safe blocked variants on all families. Draft PR stacked on tested Phase B if necessary.

**Phase D — Visible and manufacturable routing parity.** Prove Show wires vs Cut channels, real P1/IN/OUT/physical pitch/arrows, curved cutter integrity, entry/exit, cutaway, snap where safe and reports. Include all family positive and negative fixtures. Draft PR stacked on tested Phase C if needed.

**Phase E — Studio-wide Design, imports, Library, Print and polish.** Close genuine parity discrepancies; model transforms, selection and precision editing, consistent visual presentation, model tabs, SVG/STL/OBJ when safely compatible, accurate exports and backup round-trips, robust responsive/accessibility.

**Phase F — Independent release candidate review.** Run comprehensive functional/geometry/browser migration tests, fix discovered P0/P1 regressions, verify release metadata/handover/roadmap, create owner walkthrough with sample recipes. Provide honest L/M/B status remaining; no falsely “100%” completion.

Choose a modest number of **reviewable dependent draft PRs** (e.g., interaction, Build/mounting, routing/fabrication, final integration/docs) rather than one unreviewable monolith or dozens of tiny plans. Every draft includes changed modules, tests/screenshots, safety/legacy compatibility, exact-head GitHub Actions, parent SHA and merge order.

**Codex must do actual implementation in this dispatch**, not stop after writing a plan; if an owner merge or conflicting active session blocks safe progress, work on non-conflicting fixtures/docs and leave a clear actionable dependency.

## 10. Final sign-off checklist

The owner can open the final tested candidate and, on **every** built-in builder:
1. See the same discoverable common Design, Build and Print tools alongside unique model-specific options.
2. Single-click select a pixel; double-click a real valid model surface to choose Add pixel or Add mount; place repeatedly; click-hold drag; rotate, nudge, undo and cancel. Keyboard and touch have sensible equivalents.
3. Choose/reuse a measured gumdrop/seed profile across another family, preserve its saved type and verify final print bore/backing.
4. Read P1 → Pn, physical IN/OUT and coloured visible routed guide even while orbiting/using cutaway; choose 25/50/100/custom pitch and distinguish a guide from a successfully machined channel.
5. Save independent model tabs, restore from Library/backup, prepare a current export and download a valid STL/3MF/production pack.
6. Import SVG and appropriate STL/OBJ (when the source stack is merged), preserve dimensions/orientation, see printability status and use shared hardware tools only on validated geometry.
7. Review one concise list of **fully verified**, **limited** and **physically blocked** functions with accurate tested source and owner Cura/printing checks.

**Hard stop rules:** Never auto-merge, deploy, release, delete source, close contributor-owned work, lift WT-011, manufacture unsafe geometry to make a demo pass, silently rewrite saved hardware profiles, or call a visually unified interface genuine functional parity without real interaction + persisted state + prepared-mesh proof.

## Codex launch instruction

Fetch latest GitHub `main` and PR history, read this **exact pinned brief revision**, `AGENTS.md`, the current handover, matrix, acceptance, tests, `prompts/HANDOVER_PROTOCOL.md`, and owner-approved WT-018 status. Establish a safe verified base, implement Phases A–F with separate reviewable draft PRs, run real latest-head tests, update docs and handover, and return URLs, exact SHAs, merge order, known limitations and physical tests requiring the owner. Do not publish a claim of complete parity until every claimed P cell is demonstrated.