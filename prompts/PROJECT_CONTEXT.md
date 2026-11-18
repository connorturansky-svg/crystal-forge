# Wonder Trunks Studio — Durable project context and accepted UX decisions

> Maintained on planning/prompts. This is **design intent**, not proof of implementation. Verify actual current source, accepted briefs and PRs before claiming a feature works.

## Vision
A friendly, visual, flexible, physically credible browser-based parametric fabrication studio for 3D printing tactile, decorative, mechanical and illuminated objects. Primary project: **The Snowsmith Wonder Trunks** — four installations: The Goat Farm, Thawmor River, McDigger Mine Co. and The Weather Workshop. Typical printing environment: Ultimaker 3 Extended and Ultimaker 2+, PLA/PETG, applicable nozzle/core sizes around 0.25/0.4/0.6/0.8 mm when supported. Prioritise physical and sensory experimentation, accessibility and resilient work across computers.

## Approved refinement — compact and dismissible workspace (2026-11-18)

The original three-column editor decision is retained, but the user rejected the broad left model list and scattered top-level controls visible in the v0.16.0-dev.6 screenshot. The next WT-002 implementation must:

- Reduce the left model selector to a narrow rail (~160–190 px expanded) and let users toggle an icon-only (~52–60 px) view, with an unambiguous active model, access to add models and restore controls.
- Give **every auxiliary panel** a sensible collapse/close and restore path: model rail, right precision settings, centre-lower visual palette, explorer accordions, dialogs and focus view. Persist these layout preferences independently of model geometry.
- Put Studio brand/project/version/status, Undo/Redo, Save/Open/Reload, Simple/Advanced, theme, Help, Descriptions and What's New in one coherent **global app header**. Move Home/Library/Design/Build/Print into compact **workspace sub-navigation** in/near centre content instead of mixing it into global settings. Avoid controls floating over important 3D viewport hit areas.
- Preserve selections, saved models, orbit targets, keyboard navigation, undo history and real Build functionality during panel switches. A collapsed panel must never become unrecoverable.

These are interface hierarchy and state-management requirements, not a request to rewrite the whole editor. See pinned WT-002 brief §2A and AC-C15–AC-C21.

## Eight settled interface decisions
1. **Home:** Combined Creative Home with welcoming visual model categories, recent work and project access; no project setup required to create one model.
2. **Workspace:** three-column architecture; models left, actual pinned rotatable 3D viewport centre upper, independently scrolling visual controls centre lower, independently scrolling precise settings on right; resizable panels and focus view.
3. **Design:** visual parameter palette; meaningful shape previews, style cards and contextual sliders tied to actual model state; selected parts have local controls; advanced values on right.
4. **Build:** illustrated shared Build toolkit for actual pixel sockets, illumination, cable paths, mounting, fitting tests and error overlays. Click select, click-hold drag without unintentional orbiting; actual model geometry changes must be manufactured.
5. **Settings:** predictable collapsible accordion headings, settings search, exact numeric input alongside sliders, relevant help; advanced settings on demand; always-visible warnings.
6. **Help:** help on demand via keyboard/click/hover `?`; short illustrated explanations; obvious red warnings with Show Problem, validated Fix and Undo. No meaningless buttons.
7. **Library:** Combined Library, actual model thumbnails, recent work, search/filter, collections, favourites, linked vs independent copies, shared and user-made presets, distinct model/version history, and robust backup/private cross-device sync.
8. **Print:** simplified **current-model-first Quick Print**; add models when necessary, organise separate jobs by machine, select materials/nozzles, fitting coupons, Cura guidance, STL/3MF and production packages. Optional true bed layout only with grounded dimensions, not simulated as a slicer.

**Global:** first-load high-contrast light mode, user dark preference, meaningful family colours plus labels/icons, short writing. Every deployed update gets a new version + accurate What's New/changelog. Implement visual explorations and precise inputs as one authoritative state; a change in one updates the other.

## Crystal Cluster benchmark — preserve capabilities
Real Crystal geometry and per-crystal edits, variety in silhouettes/facets/tips, spacing from no-overlap to very clustered, angles/randomness, base edge smoothing, actual hollow light paths where provided, measured gumdrop/seed fit bores, 180-degree opposed pixel IN/OUT ports, sampled smooth cable routes, 25/50/100/custom mm cable length limits, P1 order/arrows, access and safe invalid-export blocking. Do not confuse attractive preview with connected print-ready manifold solid or certified lighting.

## Creative breadth expected across seven families
- **Crystals:** meaningful spike/base/formation structural differences.
- **Tactile tiles:** grass, wool, mineral, pebbles, scales, weave, weather, fractal/ripple relief.
- **Cogs and gears:** broad steampunk/clockwork-inspired **original** silhouettes with fundamentally different spokes, openwork, inner topology, rims, hubs, relief and tooth families; distinguish mechanical involute mode from purely decorative designs.
- **Waves and organic forms:** different construction types (river current, spiral/vortex, folds, sculptural ribbons, concentric wavefronts), not only sine frequency changes.
- **Buttons and control caps:** significantly different tactile/ergonomic knob, dial, rocker, fader and button shell profiles, preserving real mounting and switch fit.
- **Characters and silhouettes:** poses, layered relief, chunky tactile figures, interchangeable features where useful.
- **Glowing pebbles and light pods:** organic/faceted/lantern/diffuser shells with real accessible cavities and cable openings.

Custom model imports planned: SVG closed contours extruded with explicit mm scaling/holes, then validated STL and OBJ import with unit confirmation, transforms and compatible physical Build cuts. Do not promise arbitrary non-manifold repair.

## Development rationale and known historical pitfalls
- The first unified Studio shell (PR #29, merged at `5bb3e3ff0e2f1ca2d2be64d902d8b9808c156df3` when checked 2026-11-18) implemented workspace layout, but centre-lower Design panel was initially generic buttons opening right-hand settings. **Explicitly rejected UX:** lower palette being another shortcut navigation list. Replace with real contextual editing.
- Original Cog & Gear presets felt overly similar; genuine mesh topology, distinct openwork/spokes and depth are essential, not six minor tooth-count changes.
- Existing PR #27 introduced rendered model/preset previews, some part offsets and simple vertical pixel holes/engraved coupon. Those holes do **not** automatically mean full cable routing across all generators.
- PR #28 repaired geometry/export issues and release metadata; CI evidence must be checked for the actual head. Never confuse software green with measured physical fit.
- Earlier users lost measured profiles across computers; local browser storage alone is insufficient for trusted cross-device workflow. Preserve backups and explicit private GitHub vault, without embedding tokens.
- Large prepared geometry can freeze UI: worker/progress/cancellation and invalidation matter.
- The user prefers complete, testable implementation rather than design-only documentation.

## Authoritative history and working agreement
- Repo: `connorturansky-svg/crystal-forge`; code deployed from `main`; prompts on `planning/prompts`.
- Full original project brief: `docs/SENSORY_MODEL_STUDIO_V016_BRIEF.md`. Agreed functional specification may have existed as a chat file; it is **not** assumed available in the GitHub repo unless verified.
- Read `prompts/000-contributor-onboarding.md`, `prompts/HANDOVER_PROTOCOL.md`, latest `AGENTS.md` and `docs/AI_HANDOVER.md`, then relevant current source/tests and CI.
- Changes: user approves scope, AI pins specific prompt commit, implementing Codex works separately on draft PR and updates explicit cross-AI handover; only reviewed merges to main.
