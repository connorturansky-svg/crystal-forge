# 003 — SVG-to-3D extrusion engine (independent external AI task)

> **Status:** OWNER-AUTHORISED for an external contributor as an **isolated parallel implementation**.
> **Task:** [WT-003 / Issue #36](https://github.com/connorturansky-svg/crystal-forge/issues/36)
> **Approval contract:** use the immutable full SHA in Issue #36; only that revision of this document governs work.
> **Branch:** fork-based `feat/WT-003-svg-import`, originating from current `main`.
> **Target:** one **draft PR** titled `[WT-003] Isolated SVG import and real extrusion engine`.
> **Dependency:** WT-002 / [PR #35](https://github.com/connorturansky-svg/crystal-forge/pull/35) is already developing the Studio shell and six model generators. **No file overlap.**
> **Release:** no automatic merge/deploy. Final Studio integration occurs only after WT-002 and WT-003 are reconciled.

## 1. Intent — build a real imported model source

Wonder Trunks Sensory Model Studio is a visual, tactile and 3D-printable making tool for creative workshops. Users want to upload an original SVG design or motif (including multi-path clockwork/animal/weather art), accurately size it in mm, extrude it into **real watertight 3D solids** (with interior cutouts where intended), preview the real geometry and prepare an export. It must eventually accept shared LED pixel holes, mounting bores, Library and Print workflows exactly as native model families do.

Avoid building another CAD editor or a decorative SVG billboard. This milestone creates and validates the **underlying import engine** plus a small standalone manual-test harness. It is purposely independent of the currently changing Studio shell. The result should make later native UI integration straightforward rather than forcing another import rewrite.

The **Crystal Cluster manufacturing path** is the reference standard for real Manifold geometry, truthful fit/printability warnings and Z-up export. It must not be changed or regressed.

## 2. Mandatory coordination and file ownership

Before writing code:
1. Read `AGENTS.md`, `CONTRIBUTING.md`, `docs/AI_HANDOVER.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/TESTING.md` on latest main; read `prompts/000-contributor-onboarding.md`, `prompts/PROJECT_CONTEXT.md`, `prompts/ORCHESTRATION.md`, `prompts/HANDOVER_PROTOCOL.md` on `planning/prompts`.
2. Query open GitHub Issues/PRs and read [PR #35](https://github.com/connorturansky-svg/crystal-forge/pull/35) changed filenames. If the main Codex has touched importer modules or assigned the same feature to another AI, **stop collision and report** before duplicating.
3. Claim [WT-003](https://github.com/connorturansky-svg/crystal-forge/issues/36) using `CLAIM WT-003 — @your-github-username — feat/WT-003-svg-import — isolated SVG importer/harness/fixtures`. Claim once; don't claim WT-002.
4. Work in **your own GitHub fork and branch**, never directly on `main`, `planning/prompts` or `feat/WT-002-creative-catalogue`. Use only your own GitHub login/connector/credentials; owner secrets are never needed.
5. **Permitted files:**
   - New `svg-import/` JS modules (parser, canonical contour extraction, dimensional normalization, recipe adapter, validation, serialization, preview if isolated).
   - New `svg-import/demo/` standalone browser demonstration (HTML/CSS/JS in that directory).
   - New `tests/svg-import-*.mjs`, `tests/fixtures/svg-import/` and/or dedicated `.github/workflows/svg-import-checks.yml`.
   - New `docs/SVG_IMPORT_DESIGN.md` and new `docs/SVG_IMPORT_HANDOVER.md`.
   - Optionally new README within `svg-import/`. Keep additions cohesive.
6. **Do not edit:** `index.html`, `sensory-studio.js`, `sensory-studio.css`, `studio-v3.js`, `studio-catalogue.js`, `tactile-tile-generator.js`, `studio-geometry.js`, `studio-pixel-builder.js`, `studio-material-export.js`, `CHANGELOG.md`, `docs/ROADMAP.md`, `docs/AI_HANDOVER.md` or WT-002's test files as part of this isolated task, unless both integration owners explicitly coordinate otherwise. **Read these existing files and call their public APIs**; do not rewrite them.
7. To meet the standard handover protocol without conflicting with WT-002, author detailed `docs/SVG_IMPORT_HANDOVER.md` and link it in the PR. The owner/main Codex will reconcile the summary into `docs/AI_HANDOVER.md` during later integration.

**Important:** A fork's PR branch may be behind current main by the time WT-002 merges. Do not silently overwrite PR #35. Before any eventual merge, rebase and rerun exact-head checks, leaving substantive conflicts for coordinator review.

## 3. Technical architecture — canonical data, no parallel CAD engine

Existing technology (verify current source):
- Plain browser ESM, Three.js `0.165.0`, Manifold `3.5.4`, Playwright and Node scripts.
- `studio-geometry.js` accepts positive `{kind:'extrude',outline,holes,height,position?}` recipe parts, where outline and holes are planar mm contours in X/Z and Y is extrusion height; `prepareRecipe(THREE,wasm,recipe)` is the real Boolean preparation path.
- `studio-material-export.js` exports validated primary/secondary prepared bodies as Z-up STL/3MF.
- Imported source needs to become a `studio recipe` and stable saved model record, not bypass Manifold or invent a second manufacturing exporter.

Design small, pure, testable functions whose interfaces are documented, such as:
- `parseSvgArtwork(svgText, options) → {contours, groups, warnings, diagnostics, sourceMetadata}`
- `normalizeSvgContours(parsed, dimensions) → {outerLoops, holeLoops, transform, actualWidthMm, actualHeightMm}`
- `buildSvgExtrusionRecipe(model) → recipe` (compatible with **unchanged** Studio recipe/manifold modules)
- `validateSvgImport(model)` → stable machine-readable warnings/errors and meaningful user descriptions
- `serializeSvgImport(model) / restoreSvgImport(json)` → versioned record preserving physical mm, path orientation, winding, holes, source hash/name, user transformations and reproducible order.

These names are illustrative, not an enforced architecture. Prefer pure modules with no DOM dependency where practical; isolate DOMParser/SVGLoader to a browser adapter. Follow the current recipe's actual `bounds`/material/positive/negative requirements, rather than guessing fields. A deferred integration adapter should be explicit and small.

## 4. Supported SVG artwork (must be actual geometry)

Baseline import support:
- Closed filled `<path>`, `<polygon>`, `<rect>`, `<circle>` and `<ellipse>` shapes when feasible through SVGLoader/path flattening; allow multiple objects in one SVG.
- Nested/group transforms, transforms and viewBox mapping **where implemented and validated**. Explicitly report unsupported or ambiguous cases rather than showing incorrect geometry.
- Interior holes and compound shapes using correct fill rules/winding; support at least common `evenodd` and `nonzero` semantics when realistically achievable. Preserve through Manifold preparation and STL/3MF export.
- Distinct disconnected artwork items may be imported as multiple named parts or explicitly reported as independent pieces. Do not silently fuse unrelated islands or claim a single connected shell.
- Deterministic curve sampling/flattening with bounded physical tolerance; handle Bezier/quadratic/arc source paths where the chosen parser supports them, and detect degenerate contours or self-intersections. Do not fake circle curves with a handful of jagged segments at high resolution.

Supported relative units and dimensions:
- Interpret/record SVG `viewBox` and file width/height with correct unit conversion where supported (px vs mm etc); **never silently claim pixels mean millimetres**.
- Show/infer visual artwork bounds; ask the user to confirm a physically meaningful target width in mm. Preserve aspect ratio by default.
- Allow optional unlocked width/height scaling with explicit warning that it distorts the shape. Support thickness/extrusion depth in mm, with sensible min/max and precision. Maintain a stable origin and expected Y-up preview/Z-up export.
- Transform/rotate/position the result as a documented recipe action when supported, round-trip source scale and dimensions.

Unsupported safety/quality cases:
- `<script>`, inline event handlers, external URLs, remote images, embedded raster `<image>`, `<foreignObject>`, external stylesheet or `<use>` refs, animations, filters, clipping/masking not geometrically resolved, live fonts/text and stroke-only artwork must **not** run/fetch/execute/quietly disappear. Reject or emit clearly scoped hard warnings with remediation, e.g. convert strokes/text to outlines in a vector editor.
- Do not use `innerHTML` to render untrusted SVG into the Studio. Render only **derived, validated geometry**. Block network fetching caused by imported art; cap input bytes, element count, path count, curve flattening steps and eventual triangle count.
- Ensure malformed XML, blank artwork, open non-filled segments, microscopic features, zero-height extrusion, negative/nonfinite dimensions and excessive complexity return actionable errors without freezing.
- For SVGs containing unsupported content along with valid geometry, choose a strict/clearly explained policy: fail closed when critical geometry would be missing rather than silently produce an incomplete printed part.

## 5. Real 3D extrusion and manufacturing acceptance

- Transform clean loops into actual positive `kind:'extrude'` recipe solids with correctly nested interior negative loops and exact chosen mm depth.
- Use the **existing Manifold** preparation API to produce valid, finite, connected solid bodies for each intentionally connected component. Reject invalid meshes/zero volumes or present multi-body status clearly. Do not weaken existing strict manifold validation.
- Export **real STL and 3MF** through `exportMaterialBodies` (single material baseline), with expected Z-up and unit mm. Compare target measurements/volume/topology against prepared geometry; don't count downloadable empty files as success.
- Preserve interior cutouts after extrusion, including under nested transforms and mm scaling.
- A modest optional edge bevel/rounding is valuable **only** if implemented through actual valid geometry and protected by minimum walls; do not require it to ship the baseline and never depict fake smoothing.
- Evaluate compatibility with shared Build tools using an **automated interface adapter/recipe fixture**, not by modifying live Build UI. Where feasible create a test using the existing cutter strategy that applies a mounting or LED bore to a known solid SVG import and confirms **real nonzero cut volume**. Reject a bore that falls in a pre-existing SVG window (lesson from WT-001 P1). Be honest if a shared Build feature cannot yet operate on arbitrary imported shapes.
- Don't assert that SVG import, fit, light transmission, support requirements or all Cura profiles are physically qualified from automated tests.

## 6. Standalone browser demonstration, not a production Studio panel

Build an isolated `svg-import/demo/index.html` plus its modules/styles, served over a local static HTTP server. This is a **testing harness**, not a new advertised Studio workspace.

It must allow a contributor/owner to:
1. Choose a local SVG file (or select bundled original sample SVGs).
2. See validation messages and an original-artwork **derived** contour preview.
3. Set target width (mm), optional unlocked height, extrusion depth, choose up orientation where offered, and show exact resulting dimensions.
4. Orbit the actual extruded 3D preview and inspect cutouts/underside; never substitute a flat billboard for real 3D.
5. Trigger real Manifold preparation with status/progress/cancellation if the operation may be slow; show connected-part count, bounds, volume and truthful validation.
6. Download a **real prepared STL/3MF** only after a successful preparation.
7. Recover gracefully from invalid/oversized/unsupported files; retain the last valid state until the user intentionally replaces it.
8. Use accessible labels, keyboard support and readable warnings.

A bounded, clean standalone demo proves the engine independently of WT-002. **Do not link it into live Home/Library/Print menus** until the coordinator arranges a later integration task.

## 7. Regression fixtures and adversarial tests

Supply original, permissibly authored SVGs and expected dimensions/geometry outcomes for:
- Rectangle and circular solid; strict mm sizing/depth.
- Compound ring/gear with a central bore and multiple windows.
- Multiple paths and nested transforms with cutouts.
- Filled curves including a Bezier/arc converted to deterministic contours.
- Two separate closed islands; correct multi-body status/rejection policy.
- `evenodd` and `nonzero` winding/hole semantics.
- SVG with width/height units/viewBox requiring correct conversion.
- User-rescaled artwork, locked/unlocked aspect ratio and documented orientation.
- Degenerate/self-intersecting/zero-area/very-small contours; safe diagnostics.
- Empty SVG, malformed XML, unsupported stroke/text/filter/image/external link/embedded script and excessively complex input; no execution/fetch and clear failure.
- Saved model JSON serialize/restore reproduces same contours, dimensions, bounds, volume and export.
- One supported real Build cutter succeeds on solid; an attempted cutter in existing void fails before manufacturing or is blocked by final Manifold guard with an actionable reason.
- Adversarial performance: large-but-allowed inputs remain bounded; cancellation/timeout safe.

Use actual Node/Three.js/Manifold tests where practical, plus browser/Playwright tests of the standalone demo and its download process. Consider adding a **dedicated new workflow** `.github/workflows/svg-import-checks.yml` that exercises your isolated tests without touching current CI scripts or WT-002's files; use safe read-only permissions and no privileged fork-code execution. Run existing `npm run test:static`, `npm test`, `npm run test:browser` as appropriate in the isolated branch and clearly distinguish what is run by CI from manual. CI green for old head is not proof for final head.

## 8. Acceptance gates

- **SVG-01:** Imported clean filled geometry matches its vector source contours; internal holes survive 3D preview and Manifold.
- **SVG-02:** At least five clearly different original sample SVGs actually produce distinct printable solids (not one duplicated silhouette).
- **SVG-03:** Target width and height, depth, aspect lock and coordinate orientation map to verified prepared-mesh mm dimensions.
- **SVG-04:** Supported compound paths and nested transforms work with correct winding/fill; unsupported features never disappear silently.
- **SVG-05:** Real Manifold connectedness/degeneracy/volume checks and STL/3MF export work from the canonical recipe.
- **SVG-06:** Saved canonical record round-trips deterministically; source metadata and physical transforms are preserved.
- **SVG-07:** Invalid/hostile inputs, absurd coordinate scales, unsupported external references and complexity limits are safely rejected.
- **SVG-08:** Browser harness provides real, working upload, preview, controls, validation, prepare and download; every visible button is exercised.
- **SVG-09:** Representative external Build cutter works where applicable; void/collision cases blocked with readable errors.
- **SVG-10:** Tests + screenshots/contact sheet + honest limitations provided on exact PR head; no false physical print/optical guarantees.
- **SVG-11:** Full external ownership isolation: PR does not edit the WT-002 UI/generator files or create a duplicate implementation of SVG integration.
- **SVG-12:** Complete handover docs explain why, data contracts, safety and implementation gaps for a future fresh AI without prior chat context.

## 9. Delivery sequence, parallel agents and hard boundaries

**Phase A — Research/architecture/fixtures:** validate real current recipe/export API, SVG semantics, input security and a concise supported/unsupported feature contract. Create tests before major parser code. If multiple agents are available, split independent path semantics, Manifold geometry, demo UX and QA; avoid concurrent edits of the same file.

**Phase B — Import engine:** parse, normalize, validate, scale and extrude into canonical recipe. Add deterministic tests, real holes, multi-component semantics and strict failure modes.

**Phase C — Standalone demonstration:** real upload + mm controls + Three.js preview + Manifold preparation + STL/3MF download + errors + sensible UX.

**Phase D — Proof and integration-ready handover:** exhaustive fixture and Chromium/Manifold tests, reproducible contact sheet/videos, real dimensions/volume evidence, limitations matrix and adapter guide for future shared Build/Library/Print integration.

The expected result is a **substantial functional implementation**, not only a research report. If later Studio integration is blocked by PR #35, **do not wait**; deliver the tested isolated subsystem and document integration entrypoints.

## 10. Required PR metadata and acceptance evidence

PR title: `[WT-003] Isolated SVG import and real extrusion engine`.

Include lines exactly:
```
Task issue: #36
Approved spec: prompts/003-svg-extrusion-engine.md @ <PINNED_FULL_SHA_FROM_ISSUE_36>
Scope: Isolated SVG parser, recipe adapter, demo and tests; live Studio UI explicitly excluded.
Related PRs/duplicates: #35 is active WT-002; no shared code files edited.
Test evidence: <exact PR head SHA, full CI URLs and any separate local checks>
Handover: docs/SVG_IMPORT_HANDOVER.md and docs/SVG_IMPORT_DESIGN.md
Risks: <limitations; manual Cura and physical checks not claimed>
```

Deliver examples/screenshots for original artwork, calculated mm dimensions, preview cutouts, prepared solid cross-section, actual STL/3MF exports and invalid artwork warnings. Include evidence that the set of paths changed does not overlap PR #35.

**Do not merge or deploy.** Do not give yourself permission to change app version, main codebase or GitHub branch protection. The owner/coordinator will review and schedule integration after WT-002.
