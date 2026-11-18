# 000 — Fresh contributor / AI onboarding

> Status: **reference / onboarding** (not an implementation request)
> Owner: Wonder Trunks Studio project
> Repository: `connorturansky-svg/crystal-forge`
> Planning reference: `planning/prompts`
> Purpose: Enable a new person or AI to contribute **without past conversations**.

## Your first task is understanding, not editing
Do not assume the user's past chat is available or that a previous assistant's plan has been completed. Begin by checking the current main SHA, active PRs and the state of tests. Report discrepancies between documentation and implementation. Do not start coding until the user gives a specific task or approved brief.

## The project in one paragraph
Crystal Forge is evolving into **Wonder Trunks Sensory Model Studio**, a browser-based visual parametric tool for a creative artist/educator to design tactile, playful, illuminated and mechanical objects that can be 3D printed. It's for The Snowsmith's four sensory environments: The Goat Farm (grass/wool/animals), Thawmor River (waves/wind/water), McDigger Mine Co. (crystals/minerals/light) and The Weather Workshop (gears/buttons/controls). It should feel like a visual making toolkit, not a full CAD package. Work must be inclusive, discoverable, reliable and physically manufacturable.

## Understand the user experience before editing
- **Eight agreed interface decisions:** Combined Creative Home; balanced three-column editor with model rail left, pinned interactive real 3D view in centre upper, independently scrolling contextual visual tools centre lower, and independently scrolling precise accordion settings right; illustrated Design palette; shared physical Build tools; open/close right-hand controls; on-demand illustrated help; Combined Library; simple current-model-first Print expanding to multi-model jobs.
- Light theme on first use, user-selectable dark mode, readable bold text and category colours/symbols with labels. All visible controls must work; no misleading placeholder controls.
- The centre-lower panel is for meaningful **visual/interactive choices, geometry-changing cards and sliders**. It must NOT be a cluster of shortcuts that merely open the right-hand settings.
- Real 3D part/pixel selection, manipulation, positioning and fitted geometry matter. Crystal Clusters are the benchmark for capabilities and regression tests, including actual light pathways, LED sockets, physically measured IN/OUT cable routing, safe spacing and truthful print preparation.
- Quick Print opens with the current model; multiple models, saved jobs, Cura profiles and a production package are expandable workflows.
- Every deployed app update gets an app version and What's New/changelog matching the release, separate from saved model revisions.

## Model families and evolving direction
Seven built-in families: Crystal Clusters, Tactile Texture Tiles, Cogs & Gears, Waves & Organic Forms, Buttons & Control Caps, Characters & Silhouettes, Glowing Pebbles & Light Pods. Original, reproducible, high-diversity geometry is expected: e.g. clockwork gears with radically different openwork/spokes/hubs/rims, not merely slightly different tooth counts. Creative use should be tactile, sensory, versatile and visually distinctive; hold onto printability.

Planned additional model sources: **SVG vector upload → extruded solid**, then **validated STL/OBJ import → scale/orient and apply compatible Build operations**. Complex mesh sculpting/repair is out of scope for the first import implementation.

## Existing architecture to inspect (not guaranteed current)
Plain ESM JavaScript, Three.js viewport/preview, Manifold fabrication and STL/3MF exports, hardware placement/routing, save Library, optional private GitHub vault, Cura setup/export and Chromium/Node test suites. Review `studio-v3.js`, `geometry-v3.js`, `sensory-studio.js`, `studio-catalogue.js`, `tactile-tile-generator.js`, `hardware-layout.js`, `hardware-editor.js`, `fabrication-v1.js`, `fabrication-worker.js`, `studio-geometry.js`, `studio-material-export.js` as relevant. Names and scopes can change.

## Hard invariants and honest limits
- Don't confuse 3D preview geometry with printable merged Manifold output.
- Do not remove or weaken manifold validity, connectedness, cut-through, clearance or material-overlap checks just to satisfy tests.
- Pixel fittings must be real cut geometry. Wire IN/OUT directions remain 180° apart; physical paths follow smooth routes and relevant 25/50/100/custom mm real cable spacing. Show problematic paths and block invalid exports.
- Presets/parameters and project/library state must survive save/reload. Respect measured LED profile persistence, linked-vs-independent copies and version history.
- Green browser tests do not establish Cura compatibility, physical LED fit, optical performance, tactile comfort or structural safety.
- Keep the publicly visible source and prompts free of secrets and unlicensed reference images.

## Authority and navigation
The user’s latest explicit approved instruction governs scope. Check `prompts/README.md` on `planning/prompts` for approved briefs and their immutable SHAs; follow the specific pinned brief **only when the user has assigned it**. Then read `AGENTS.md`, `docs/AI_HANDOVER.md`, `docs/PROJECT_VISION.md`, `docs/FEATURE_SPECIFICATIONS.md`, `docs/DESIGN_DECISIONS.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/TESTING.md` on latest main. Verify source and CI.

GitHub `main` is the production/deployment branch (Pages deploys on every push). `planning/prompts` holds specifications and must not be used as a code branch or merged without deliberate separate review and release management. A PR is the transfer point between contributors.

## Required first response from an arriving AI
Before editing, provide:
1. Current main commit, open PRs and real CI status (exact head).
2. Summary of current UX/geometry/data architecture and major invariants.
3. What appears delivered vs unfinished, identifying stale documentation.
4. Approved brief's file path + pinned SHA (if one was assigned).
5. Proposed worktree/branch and test plan; flag material blockers.
Don't ask for the past chat history unless the repo genuinely lacks a critical decision.

## Required response after working
Update `docs/AI_HANDOVER.md` and relevant architecture/roadmap/acceptance docs in the implementation PR as described in `prompts/HANDOVER_PROTOCOL.md`. Report changed modules, rationale, known limits, exact CI URLs, manual fabrication checks and a priority next action. Do not merge or deploy without the owner's explicit approval.
