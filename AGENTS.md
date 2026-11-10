# Crystal Forge — instructions for AI coding assistants

**Read this file first, then `docs/AI_HANDOVER.md`.** For a new feature or geometry change, also read `docs/PROJECT_VISION.md`, `docs/FEATURE_SPECIFICATIONS.md`, `docs/DESIGN_DECISIONS.md` and `docs/TESTING.md`. These are project-specific instructions for both ChatGPT and Codex; they complement the source code and never override a newer explicit user request.

## Mission and invariants

Crystal Forge is a browser-based editor for designing **stylised, touch-considerate, 3D-printable illuminated crystal clusters** for a participatory creative installation. It must be approachable to a visual maker, interactive and reproducible, and must not silently sacrifice printability or illumination for appearance.

- Preserve large flat low-poly facets, hexagon-like shafts, deliberate asymmetric/rounded tips, per-crystal shape controls, world-consistent lean patterns and meaningful spacing extremes.
- Preserve **fast editable preview ≠ prepared manufacturing mesh**. Never label overlapping preview shells as printable, and invalidate an old prepared mesh after fabrication-affecting edits.
- The default **Cura-first** path exports a watertight, Boolean-joined exterior with actual LED/mount bores; Cura handles infill/walls. Experimental full hollowing and the optional permanent zero-infill base vault have different purposes and must not be silently conflated.
- One nominal 12 mm gumdrop LED under the base is the simple starting point (nominal LED body ~22 mm); multiple pixels and manual sockets are advanced options. Always preserve hole clearances, actual access and serviceability. A cut socket does **not** prove a shared illuminated channel.
- Preserve the optional open underside vault, tapered integral roof supports, LED side windows, and Cura bridge warnings. Do not claim that 0% infill, a 45° overhang threshold or a topology check certifies support-free printing.
- Respect actual printer envelopes, tolerances, export Z-up orientation, safe/touchable tips, and strong/secondary mounting for any overhead work. Nothing in this app certifies child safety or load-bearing strength.
- Keep Simple/Advanced views attached to **one underlying model**; switching mode must not regenerate or erase edits. Preserve old saved JSON and local browser autosaves when adding settings.

## Architecture (verify against source)

- `index.html` — static HTML/CSS interface, in-app Help/What's new and browser import map.
- `studio-v3.js` — Three.js scene/camera, editing, app state/autosave, workspace UI and Web Worker orchestration.
- `geometry-v3.js` — seeded formation placement, low-poly bodies, base outlines, dome, accents and preview geometry.
- `hardware-layout.js` — authoritative collision-aware LED/mount positions, auto/manual validation.
- `hardware-editor.js` — Build-stage visual holes and manual click/X/Z controls.
- `fabrication-v1.js` — Manifold Boolean fabrication, optional vault/hollowing, cutters, reports, STL/3MF.
- `fabrication-worker.js` — asynchronous/off-main-thread preparation and progress.
- `tests/`, `.github/workflows/` — automated validation. `app.js` is an older unreferenced demo; do not edit it instead of the active modules.

See `docs/ARCHITECTURE.md` for data flow and boundaries.

## Before editing

1. Check `git status`, current branch, remote, latest `origin/main` and open pull requests. Never overwrite uncommitted changes or unreviewed work in another branch/worktree. Do not claim you can check a local working tree when operating only through the GitHub API.
2. Read `AGENTS.md` → `docs/AI_HANDOVER.md` → relevant feature specs and architecture. Read related source and tests; distinguish explicit requirements from exploratory ideas.
3. Work in a short-lived `feat/...`, `fix/...` or `docs/...` branch/worktree unless explicitly authorised otherwise. GitHub `main` is the deployable production branch: its Pages workflow deploys on **every push to main**.
4. Keep patches focused. Preserve existing behaviour or document and test intentionally changed behaviour. Ask about genuinely conflicting goals when safe progress cannot be inferred; otherwise state assumptions.

## Implementation, verification and commits

- Existing source is plain ESM JavaScript and Three.js; prefer small, readable functions and deterministic seeded calculations. Avoid new dependencies without a compelling reason.
- For mesh changes: check root-to-base continuity, connected positive solid counts, no sealed voids when an open passage is required, hole clearances, walls, overhang/bridging, and STL/3MF Z-up output. Verify both preview and manufacturing representations.
- For UI changes: test actual user interactions, keyboard/viewport behaviour, selection, LocalStorage/JSON round-trip, controls in Simple/Advanced, and rerender/invalidation. Inspect console/page errors and screenshots, not only HTML strings.
- Run `npm run test:static`, `npm test`, and `npm run test:browser` where the environment supports them. Browser tests need Chromium and a server on port 4321. See `docs/TESTING.md` for exact commands, budget and manual Cura checks.
- **Never assert tests ran unless their specific run/log evidence exists.** GitHub Actions green for an older commit is not evidence for a newer commit. A passed mesh test is not a real print.
- For significant changes, update affected specs/ADR/roadmap, `CHANGELOG.md` for user-visible changes, and `docs/AI_HANDOVER.md` with current verified state. Keep `index.html`'s displayed version and in-app changelog consistent with release tags; documentation-only changes need no app version bump.
- Commit on a branch, open a PR to main, review diff and test results, and merge only after validation and user/reviewer approval for significant work. Do not force-push over newer work, silently resolve conflicts, or deploy unfinished features.

## Sharing work between ChatGPT and Codex

GitHub is the **source of truth for committed code and documentation**. Only one assistant should actively change the same branch at a time. Codex local worktrees and ChatGPT GitHub branches can coexist; synchronise using PRs, not guessed state. Update `docs/AI_HANDOVER.md` at completion, link CI evidence, and say what remains unverified.

Conflict priority: latest explicit user requirement → validated code/current repo configuration → `docs/FEATURE_SPECIFICATIONS.md` and accepted `docs/DESIGN_DECISIONS.md` → historical notes/roadmap. Record unresolved contradictions rather than making up a decision.
