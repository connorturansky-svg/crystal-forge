# 002 — Stage C: Rich creative geometry across the six remaining model families

> **Status:** OWNER-APPROVED CONTINUATION of the seven-family creative-expansion programme (user's prior approval, confirmed next development phase 2026-11-18)
> **Task:** [WT-002 / Issue #34](https://github.com/connorturansky-svg/crystal-forge/issues/34)
> **Planning branch:** `planning/prompts`
> **Approved revision:** use the **full planning commit SHA posted in Issue #34**. Do not treat the mutable branch tip as the approved revision.
> **Implementation:** not started; create one dedicated **draft PR** based on current `main`.
> **Revision note:** §2A and Stage C0 are the owner's 2026-11-18 addendum on compact model tabs, collapsible panels and global/workspace navigation. The prior pinned SHA is superseded for future WT-002 dispatch.
> **Prerequisite:** PR #30 (contextual palette + creative gears) and PR #32 (contributor workflow) are merged. At briefing, main `948cd5ac31330fc1c7da3f1386c9ad60e0328361`. Verify immediately before starting.

## 1. Why this work matters

Wonder Trunks Studio should be a visually rich making environment for bespoke **tactile, sensory, mechanical and illuminated** objects—not a set of visually similar primitives with renamed presets. The existing Cogs & Gears improvements demonstrate how different outer silhouettes, internal structures, rims and relief can be combined parametrically. Apply the same **genuine structural variety, editability and illustration-led workflow** to the other six families.

The target settings are The Snowsmith Wonder Trunks: Goat Farm (wool, grass, animals), Thawmor River (water, wind, flow), McDigger Mine Co. (mineral, rock, luminous crystal), Weather Workshop (controls, phenomena and moving parts). The user wants surprising original shapes, distinctive at a glance, comfortable to explore, yet honest about actual 3D printability. The original **Crystal Cluster** is the manufacturing and interaction benchmark.

## 2. Live-state and collision audit before coding

1. Read `AGENTS.md`, `docs/AI_HANDOVER.md`, `docs/PROJECT_VISION.md`, `docs/FEATURE_SPECIFICATIONS.md`, `docs/DESIGN_DECISIONS.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md` and `docs/TESTING.md` on latest `main`. Read onboarding and `prompts/HANDOVER_PROTOCOL.md` on `planning/prompts`.
2. Inspect the actual PR #30 merged gear/palette implementation, `studio-catalogue.js`, `tactile-tile-generator.js`, Crystal geometry/adapters, `sensory-studio.js`, `studio-v3.js`, `studio-geometry.js`, preview caches, Manifold export, build modules, persistence and tests.
3. Search open Issues, draft/open PRs and task claims **again**, not just at prompt creation. WT-001 / [Issue #31](https://github.com/connorturansky-svg/crystal-forge/issues/31) is a *read-only external review of merged PR #30*. Do **not** duplicate it. If it reveals confirmed P0 bugs affecting Stage C, record and resolve blockers explicitly before extending the affected engine.
4. Claim [WT-002](https://github.com/connorturansky-svg/crystal-forge/issues/34) with actor and branch; no other AI should implement the same code paths concurrently. Use a dedicated `feat/WT-002-creative-catalogue`-style branch on current `main`. No changes directly to `main` or planning branch.

### Technical invariants

- Real procedural mesh diversity, not changes in colours, labels, camera angle or minor numeric defaults.
- One authoritative parameter/model state for the centre-lower visual choices, right precision settings, preview, Build tools, Library persistence and manufacturing recipe.
- Preview vs real printable Manifold: do not pass off an overlapping preview assembly as a watertight print.
- Preserve Crystal Cluster root/base seating, true light cavities, measured gumdrop/seed sockets, physically curved pixel routing, 180° opposed IN/OUT, 25/50/100/custom mm cable rules, warnings and strict export blocking.
- Preserve meaningful versions/migrations of saved generator parameters, old preset IDs and user-created models. No silently lost details after changing styles.
- Maintain connectedness, wall clearance, material partitions, minimum feature sizes, physically printable details and correct Z-up exports. Avoid disabling strict validators or converting errors to warnings to get green CI.
- All-rights-reserved public repo: use original geometry based on general inspiration, no copied commercial SVG or sculptural assets.

## 2A. Interface hierarchy and flexible workspace — ADDITIONAL OWNER-APPROVED REQUIREMENT

The user's screenshot of the v0.16.0-dev.6 Build workspace exposes a second major usability issue alongside creative variety: the **model selector rail is much too wide** for what is mainly a tab list, there are **two competing global/top bars** (a recovery/reload/Undo/Redo status strip followed by a large Studio header), and global actions are mixed with workflow navigation. Correct this as the **first Stage C0 deliverable** before broad generator UI work, reusing the current shell rather than rewriting the application. Preserve functionality and state.

### A. One coherent global application header

Consolidate the existing top-of-page global status/recovery strip and Studio header into one compact global toolbar, or a single coherent global header with conditional recovery status. Include:

- Studio brand/title, editable current project/model name when appropriate, exact app version and truthful unsaved/saved/recovered state.
- Global access to **Save, Open/backup, Reload Studio, Undo and Redo** (Undo/Redo act on current model/project history; disable clearly when no valid action).
- Global **Simple/Advanced, Light/Dark, Help, Descriptions and What's New**. Preserve keyboard/focus semantics, existing storage/state and all original handlers.
- Recovery banners or backup restoration must remain **visible when genuinely needed**, but should not occupy a permanent extra full-width toolbar after being acknowledged. Do not remove data-recovery functionality or create an accidental destructive reload.
- Fit accessible names and tooltips, usable icon + short text combinations on larger screens, and a compact overflow/More menu on narrower screens. Don't hide essential functions permanently offscreen.

**Global** means independent of Design/Build/Print selection; group these controls in the header rather than in the workspace navigation. Do not multiply duplicate Save/Open/Undo buttons in multiple disconnected toolbars.

### B. Workspace navigation = smaller and visually subordinate

Treat **Home / Library / Design / Build / Print Centre** as workspace destinations, not global application settings. Use a compact, clear segmented/context sub-navigation at the top of the **centre workspace** or immediately below the main header. A small floating toolbar over the viewport is acceptable **only if** it stays clear of the canvas hit area, orbit controls, view presets, overlays and selected-object tools. Prefer a reliably placed slim sub-navigation to a large second page-wide header.

- Avoid the confusing numerals `1 · Design / 2 · Build / 3 · Print Centre` if a clearer label hierarchy serves better; workflow sequence can be indicated contextually.
- Show one active workspace unambiguously. Home/Library can still be genuine full-size destinations with a clear route back to the model; don't force them into an overlay if it makes state or accessibility worse.
- This navigation must be responsive and keyboard navigable, **must not** regenerate, deselect or lose project state, and must not obstruct the 3D viewport or parameter palette.

### C. Model rail = compact, collapsible, icon-only

The **left model selector** is primarily tabs for choosing/editing different models, so it should no longer consume ~a quarter of the workable width.

- Default expanded target: **approximately 160–190 CSS px**, with resizable range **roughly 140–240 px** where space allows. Choose based on tested readability, not rigid values; the screenshot's broad rail is explicitly rejected.
- Provide a visible `Collapse model rail` control. Icon-only mode should be **about 52–60 CSS px**, displaying consistent real thumbnails/icons, an active selection highlight, accessible label/name tooltip on hover/focus/long press, and a compact Add model affordance.
- Optional full hide when explicitly requested, with a persistent compact restore handle or global View menu action. The user must **always** be able to reopen it without reloading.
- Expanded rail may display model names and accessible tab close actions. In icon-only mode, **do not turn the model's small X into an easy accidental destructive click**; expose close via context menu/expanded view or another unambiguous action with unsaved-state safeguards.
- Allow duplicates of the same model family with unambiguous active model selection, tooltip names and preferably differentiated thumbnails.
- Preserve scroll position, selected model, opened tabs and unsaved designs across rail resize/collapse; persist UI display preferences separately from model data.

### D. Close, collapse, resize and restore EVERY auxiliary panel

All **non-essential panels/windows/menus** should be user-dismissible/collapsible, with obvious ways to reopen:

- Left model rail: expanded → icon-only → optionally hidden.
- Right precision/settings panel: expanded → collapsed/hidden, with a clear `Show settings` restore action.
- Centre-lower Design/Build visual palette: expanded → collapsed/hidden; expanding it restores its previous height, scrollbar position and editing context.
- Project explorer/object-tree and settings accordions: independently expandable/collapsible; avoid endlessly long stacked panels by default.
- Dialogs, popovers, help and Library/Home overlays: Escape/close button and a predictable route back. Closing a view must not erase the model; a true app view switch remains deliberate.
- 3D Focus mode: reliable exit button plus Escape. It should not leave invisible modal overlays intercepting pointer events.

Use a compact **View / Panels** menu or discoverable, labelled toggles for restoring any hidden region. Do not treat the main 3D viewport or globally necessary navigation as disposable without a restore path.

Layout resizes must be smooth, avoid horizontal clipping, preserve camera orbit target, preserve current selection/pixel placement and **not trigger generator recomputation**. Persist panel visibility and sizes across reload (local UI preference, scoped to device and safely versioned). On narrow screens, select sensible stacking or drawer behaviour instead of tiny unusable columns. Make keyboard, pointer, touch and screen-reader semantics robust; `aria-expanded`, labels and focus restoration should be correct.

### E. Layout acceptance evidence

Show screenshots/video or Playwright captures for:
1. Default global header + compact model rail, Design selected.
2. Icon-only left rail with multiple models of the same family; active selection clear.
3. Rail fully restored with model names and Add model available.
4. Right settings hidden then restored; exact settings remain unchanged.
5. Centre-lower palette collapsed then restored with same selected object and scroll position.
6. Global Simple/Advanced, theme, Help, Save/Open, Reload and Undo/Redo all functional from their new location, plus real recovery workflow when available.
7. Home → Library → Design → Build → Quick Print → Design does not reset anything.
8. Narrow-screen layout with no off-screen unreachable buttons.
9. Focus 3D closes on Escape and panel controls restore correct layout.

Use the actual Studio rather than a disconnected mockup. Retain the prior `?layout=legacy` option until the new workspace has demonstrated parity. Don't implement placeholders for the View menu or panel controls.

**This is a UI-shell improvement in WT-002, not authorisation to rebuild the entire app or interrupt the six-family geometry scope.** Keep its changes tightly bounded and test it before introducing broad generator controls.

## 3. Core system: combinable style decisions, not static presets

Reuse or carefully extend the PR #30 visual palette and procedural generator schemas to expose independent choices:

`Overall shape → Structure/topology → Pattern/detail → Depth/relief → Dimensions → Controlled variation → Advanced Build`

- Show **actual distinct generated 3D thumbnail** for every major choice; thumbnails must be generated by the matching recipe or representative parametric scene, with camera/lighting that makes cutouts and depth clear. Cache by meaningful parameter fingerprint, regenerate on relevant changes, provide loading/error states.
- When the user selects a style, preserve other independent decisions (e.g. changing a tile's pattern must not reset its dimensions, LED fittings, seed or unrelated shape settings).
- Wherever the geometry permits: style card selected state, useful paired slider + exact numeric input, typed units, reversible Reset, stable Undo/Redo, random Seed/Generate Variation with locked controls, and immediate viewport update.
- Make every visible control perform its advertised action; if a combination is impossible, say *why* and offer a safe adjustment. Do not show fake features.
- Target **at least six visibly distinct design starting points for each of these six families**, with **at least three genuinely different structural construction modes or clearly different topology/relief families** per generator where physically viable. Evaluate visually, not by merely counting presets. Any existing preset only counts if actually distinct.
- Each family should allow modular recombination of main shape and internal/details, not just one all-or-nothing template selection.
- Keep interactive response acceptable: lazy preview generation, mesh caching, bounded complexity, worker/off-main-thread heavy preparation where applicable, progress/cancellation for long jobs.

## 4. Family-specific functional scope

### 4A. Crystal Clusters (benchmark)

Offer a gallery of meaningful formation and spike/base variants while preserving existing Crystal exact controls:

- Tall slender shards; broad truncated prisms; stubby clustered crystals; basalt/columnar-inspired prisms; radial rosettes or fan configurations; uneven cliff/geode-like groupings.
- Independent applicable choices for tip/facet style, branching/growth direction, formation density and base outline/edge. Preserve angle presets plus randomness and extreme spacing where 100% means **no overlapping crystals**.
- Selected crystal local length, taper/facets/rotation/tilt and selected group editing must round-trip without regenerating unrelated geometry.
- Every illuminated spike variant that claims a continuous light path must connect to appropriate real base apertures; retain accurate gumdrop fit, open cavities and wiring checks. A new style requiring a separate optical strategy is either implemented and tested or visibly marked unsupported.

### 4B. Tactile Texture Tiles

Go beyond six heightfield labels that can look alike. Add distinct tactile surface construction modes, for example:

- Basket or braid-like weave; raised soft wool clumps; grassy strands/ridges; rounded pebble field; overlapping scales; fractured mineral/slab pattern; weather/rain pocks; directional ripple or labyrinth paths.
- Independent outline, pattern type, density, height, spacing, feature width, smoothness, rotation, repeat and variation. Where applicable use relief extrusion/geometry, not identical sine functions with different labels.
- Ensure a **continuous, printable backing**; no accidental floating details, zero-width webs, sharp contact hazards or unprintably tiny high-frequency features. Caution that comfort and cleanability require physical sample testing.

### 4C. Waves & Organic Forms

Create different surface/volume families rather than just frequency/direction on one sinusoid:

- Parallel flowing swells, concentric ripples, swirling vortex/eddy, sweeping ribbon-like crest, wind-sculpted dune, intersecting wavefront or gentle saddle, branching river current.
- Distinguish crest geometry/topology, boundary behaviour and relief; provide meaningful amplitude, wavelength, curvature, direction, offset, asymmetry and repeat controls as applicable.
- Preserve solid positive bed-facing underside, minimum thickness, bounded mesh resolution and truthful overhang warnings.

### 4D. Buttons & Control Caps

Expand visuals **without breaking functional hardware fits** for the nine existing control families:

- Scalloped and fluted rotary grips; broad dish/concave knobs; stepped industrial/crown knobs; ergonomic thumb profiles; recessed pointer groove; raised symbol/embossed inset; chunky rocker/toggle appearance; distinct directional pad and fader cap shapes.
- Expose outer shell, grip construction, top profile, tactile mark and dimensions separately when compatible. Preserve measured shaft/socket tolerances and handedness, insert geometry and dual-material separations.
- Buttons are printed covers/interfaces, not automatically electrically functional or safe; keep mechanical tolerance and clearance validation, and warn about unverified switch fit.

### 4E. Characters & Silhouettes

Move from merely extruded flat outlines to original touch-friendly layered forms:

- Distinct goat/sheep poses and personality, stepped animal relief, wool body patterns, sculptural cloud and sun, riverboat configurations, mine-tool/Weather Workshop motifs.
- Combine overall silhouette, pose/proportions, raised features, relief depth, edge smoothing and size. Maintain recognisable designs at practical small sizes.
- Keep horns/limbs/details mechanically connected, adequate bridges and no accidental islands; validate flat base, printable roofs and dual material when used.

### 4F. Glowing Pebbles & Light Pods

Extend the existing smooth/faceted ellipsoid into distinct illuminating shells:

- River-smoothed stone, asymmetrical organic pebble, angular mineral pod, faceted lantern, ribbed diffuser, layered/scalloped dome, sculptural low-profile light housing.
- Independent outline profile, radial/rib/facet structure, texture, wall thickness, opening and cable access where compatible. Render meaningful geometry, not just colouring.
- Preserve **real serviceable internal cavity**, open LED/gumdrop access, physically cut cable route, minimum diffuser wall and separable/connected material bodies. Reject unrealistic enclosed shells masquerading as fitted light fixtures. Actual diffusion, heat and LED fit require real tests.

## 5. Stage sequence — one owned integration effort

Stage C0 — Compact, closable workspace and coherent global header (approved addendum):
- Implement the layout hierarchy and panel controls defined in §2A using the existing Studio shell. Ensure no duplicate global controls and no hidden, un-restorable panels; run independent UI regression checks.
- Capture default, collapsed-rail, closed-settings, closed-palette and narrow-screen views. Preserve current model state, 3D orbit/selection, Build tools and existing history on every transition.

Stage C1 — Baseline/architectural audit:
- Create a short `docs` gap matrix identifying which existing preset families are near-duplicates, which construction modes exist and what can be reused.
- Define compatible family-specific style schema extensions with migration and parameter preservation. Identify honest bounds and restrictions.

Stage C2 — Build real geometry:
- Implement each of six families in tightly separated modules/commits where appropriate; if multi-agent Codex support exists, use research/geometry/UI/QA agents with non-overlapping file ownership and **one integration owner**.
- Fix real recipe validation for each family as geometry is added, not as a final cleanup.

Stage C3 — Visual editing integration:
- Surface actual style galleries + contextual sliders in centre-lower palette, exact values on right, and model-specific error and help messages. No automatic shortcuts to right-hand settings.
- Make thumbnails show actual generated geometry and verify style decisions survive mode switches and individual model tabs.

Stage C4 — Production QA/handover:
- Automated geometry tests, browser user journeys, screenshot/contact sheet for each family, saved-project roundtrips, negative-case error checks, performance smoke checks and updated release notes.
- Keep future SVG extrusion then validated STL/OBJ imports on the roadmap; **do not implement imports in WT-002**.

## 6. Acceptance matrix

For each of six families, provide evidence for:

- **AC-C01** Gallery shows ≥6 meaningful, clearly distinguishable starting shapes; ≥3 substantially different construction approaches when feasible. Screenshot contact sheet at consistent camera/lighting.
- **AC-C02** Each gallery item is generated from real procedural recipe/geometry; style choices actually alter silhouette/topology/relief, not just colour or a name.
- **AC-C03** Major independent choices can be mixed, and a continuous physical parameter changes only the intended part of the geometry.
- **AC-C04** Centre visual palette and right precision input share the same state and remain synchronised for all visible corresponding controls.
- **AC-C05** Undo/Redo, mode switches, model-tab switches, save/reload and Library presets preserve styles, edits, previous versions and parameters.
- **AC-C06** Legacy saved models from before PR #30 load and manufacture with equivalent safe behaviour (backward-compatible defaults or explicit documented migration).
- **AC-C07** Representative variations pass strict Manifold connectedness, no degenerate triangles, valid material body separation and STL/3MF export; deliberately invalid geometry fails with actionable explanation.
- **AC-C08** Crystal Cluster: real root seats, light paths, sockets, opposed cable exit, smooth routes and physical pitch constraints remain valid. Preserve old Crystal fixture tests.
- **AC-C09** Buttons, Pods and Tiles: fit, internal cavity, minimum wall/backing/bridges and support checks remain as applicable; do not certify real-world touch/optical/safety without physical testing.
- **AC-C10** Gallery generation and editing do not freeze browser; inspect performance with a representative complex preset; defer/worker expensive fabrication and invalidate stale prepared meshes after edits.
- **AC-C11** Every visible button, card, slider, reset, randomisation, tooltip and navigation control works as described. Browser tests should exercise click paths, not only DOM presence.
- **AC-C12** Exact-head static, Chromium and real Manifold suites pass. Provide links and any manual test instructions; do not claim unrun Cura/LED/optical checks.
- **AC-C13** Actual code + test diff and visual galleries clearly demonstrate qualitative improvement over pre-Stage C styles for every family.
- **AC-C14** No new duplicate PR/issues created for existing Stage B work, external reviewer task or past fabrication phase issues; document outstanding dependencies separately.
- **AC-C15** Global title, current project, version, save state, Save/Open, Reload Studio, Undo/Redo, Simple/Advanced, theme, Help/Descriptions and What's New are grouped into one coherent top-level toolbar. Every relocated action remains wired and tested.
- **AC-C16** Workspace Home/Library/Design/Build/Print navigation is compact, visually subordinate and separate from global actions; it remains keyboard accessible and does not obstruct canvas tools.
- **AC-C17** Left model rail defaults to a substantially narrower usable width; users can collapse to an approximately 52–60px icon-only tab rail, optionally hide it, and reliably restore it. Duplicate family models remain identifiable and select correctly.
- **AC-C18** Settings/right panel and centre-lower visual palette collapse/restore independently without losing data, object selection, entered values, scroll positions or viewport/camera state. Any hidden panel is discoverably reopenable.
- **AC-C19** All auxiliary menus, dialogs and focus modes provide close/Escape behaviour and clear restoration. Critical recovery warnings remain accessible; closing a view never silently destroys the active model.
- **AC-C20** Layout widths, heights and visibility preferences persist across reload; narrow desktop/mobile widths avoid clipped essential controls; mouse, keyboard, touch and focus/aria behaviour are tested.
- **AC-C21** The UX rearrangement reuses existing state/controllers, neither duplicates live global event handlers nor causes unnecessary geometry regeneration/3D freezes; existing static, browser, Crystal/manufacturing and saved-project regressions remain green.

**Release gate:** New app version and matching CHANGELOG + What's New on implementation PR. Never auto-merge or deploy.

## 7. Deliverable contract

Create one **draft implementation PR** titled `[WT-002] Expand six sensory model families with real geometric styles`. Link:
- **Task issue: #34**
- **Approved spec: prompts/002-six-family-creative-expansion.md @ <FULL_40_CHARACTER_SHA>**
- Scope, Related PRs/duplicates, Test evidence, Handover, Risks (these are required by the contributor contract).
- PR #30/32 for baseline and WT-001 review Issue #31 for read-only findings.

Include **before/after whole-workspace captures** showing the global toolbar, compact/collapsed model rail, closable settings/visual palette and restored layouts, as well as before/after gallery shots for Crystals, Tiles, Waves, Controls, Characters and Light Pods; representative real STL/3MF manufacturing check results; concise architecture discussion and schema migration; exact latest-head CI links; limitations and manual Cura/physical verification list.

Update `docs/AI_HANDOVER.md` with motivation, changed modules, state/data/geometry contracts, tested/unverified claims, original design reasoning and next implementer steps. Update `docs/ROADMAP.md`, acceptance documents, tests and relevant architecture/design docs. Follow `prompts/HANDOVER_PROTOCOL.md`. Update the planning status/index via a **separate coordinated planning action**, not by rewriting this approved prompt.

Do **not** stop at a plan or six sets of superficial presets. Implement and test each family. If major technical blockers make the entire six-family goal impossible within one reliable PR, produce a coherent partial PR with a truthful per-family acceptance matrix and request owner review before splitting follow-on scopes.

Do not grant access to other AI accounts, merge, deploy, disable validation or assume external review results.
