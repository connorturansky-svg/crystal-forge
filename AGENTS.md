# Crystal Forge / Wonder Trunks — AI contributor instructions

> **Source/navigation:** [Feature-first source layout](docs/SOURCE_LAYOUT.md) and [repository map](docs/REPOSITORY_MAP.md). Printing helpers begin under `src/printing/`, but core entrypoints and other files remain at root until their active PRs finish. For path-only changes verify both current and historical SHA-scoped Pages release assets, all relative imports and exact-head CI. Do not re-create old root files as compatibility shims, or move Codex-owned WT-023/WT-026 modules without reconciliation.


> **Current entry point:** Read [AI handover](docs/AI_HANDOVER.md) and [project status](docs/PROJECT_STATUS.md) for live-ref checks, merge holds and next assignments. WT-023B2a #172 is merged. B2b requires a new owner dispatch. Verify GitHub refs before picking up existing work.

**Start here:** Read the current [handover](docs/AI_HANDOVER.md) and [project status](docs/PROJECT_STATUS.md), then the relevant issue and source. For B2b, the approved [Library implementation packet](docs/WT023_PROJECT_LIBRARY_IMPLEMENTATION.md) and [#139](https://github.com/connorturansky-svg/crystal-forge/issues/139) cover acceptance. Keep the existing project and snapshot store.

**Branch ownership:** Check current issue and pull request claims. Preserve other contributors’ branches and existing saved projects. The owner approves merges and verified physical fit remains under [#10](https://github.com/connorturansky-svg/crystal-forge/issues/10).

## Historical handoff and branch policy (21 November 2026)

**The former WT-021-only branch exception is historical and retired.** PR #102 has merged, and PRs #117, #118, #120 and #121 have subsequently merged. Do **not** restart coding in PR #102 or assume its branch is the current integration target. At the time of this handover, #121 merged into main as `9f792e1c133ab93cff0fc1ee68d2f23562b40077`; **fetch current `origin/main` before every new task** rather than treating any SHA or status document as a live pointer.

**Read in order for current work:** this file → `docs/AI_HANDOVER.md` → the relevant issue/PR and acceptance document → the affected source and tests. `docs/WT021_COMPLETION_REGISTER.md` and `docs/MODEL_BUILDER_PARITY.md` remain useful as acceptance history, but partial/checkpoint notes must not override newer merged code and issue evidence. `docs/WT021_NOW.md` and the original #102 overnight runbook can contain outdated task pointers; verify before acting.

**Current separate ownership lanes:** Codex owns runtime geometry, hardware, Manifold and production exports under software issue #79; merged independent QA PR #122 supplies measured cut-mouth STL sections, diagnostic fixtures and `docs/EDGE_MOUTH_CODEX_PREWORK.md` without editing runtime modules. Physical printer/Cura/LED/mount approval remains issue #10. Jordan's SVG work #36/#37 and the old Pages recovery PR #90 must not be overwritten; merged Pages QA #112, continuity QA #115 and integrated retention #124 remain distinct; staged A/B browser success is not proof of a real already-open public tab crossing a deployment.

**Use the general branch rule below for all new tasks:** create an isolated `feat/...`, `fix/...` or `qa/...` branch from up-to-date main (or explicitly reviewed stack), commit focused tested work and open a draft PR. The owner alone approves merges, Pages deployment and physical sign-off. No automatic merge/publish. Do not claim code, tests or physical prints succeeded without exact-head evidence. Changelog and What's New must be updated for user-visible product changes; documentation-only QA work does not invent a release version.

## Historical Codex entrypoint (after 21 November 2026 QA merges)

**Historical 21 November checkpoint:** [`docs/CODEX_RESTART_20261121.md`](docs/CODEX_RESTART_20261121.md) is archived context; do not treat it as the next instruction. See [current work](docs/PROJECT_STATUS.md) first. All three supporting PRs **#122 (edge-mouth evidence), #123 (first-print/backlog documentation) and #124 (Pages retention) are merged**. Their tested helpers are available on main; they are **not drafts to merge or branches to cherry-pick**. Snapshot main after #124: `8d19701ac5bd5521140ebe4e1dfcabbedba8c53f`; verify latest actual SHA and test results before coding. The priority remains eligible top-entry negative-cut mouth chamfers in a *new* focused PR. The existing diagnostic audit succeeds while demonstrating the sharp lip; it is **not a passing fix test**. Production Pages historical release retention is now implemented in merged #124; preserve its stage and shared-browser continuity checks.

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
- For significant changes, update affected specs/ADR/roadmap, `CHANGELOG.md` for user-visible changes, and `docs/AI_HANDOVER.md` with current verified state. **For a currently authorised persistent Codex goal, checkpoint the relevant run log and handover after each tested milestone, update `CHANGELOG.md` and the existing in-app What's New for user-visible changes, and post a final report on that goal's actual draft PR. The former PR #102 runbook, its PR-specific report target and completed UX-01 implementation are historical, not standing new tasks.** Keep `index.html`'s displayed version and in-app changelog consistent with release tags; documentation-only changes need no app version bump.
- Commit on a branch, open a PR to main, review diff and test results, and merge only after validation and user/reviewer approval for significant work. Do not force-push over newer work, silently resolve conflicts, or deploy unfinished features.

## Sharing work between ChatGPT and Codex

GitHub is the **source of truth for committed code and documentation**. Only one assistant should actively change the same branch at a time. Codex local worktrees and ChatGPT GitHub branches can coexist; synchronise using PRs, not guessed state. Update `docs/AI_HANDOVER.md` at completion, link CI evidence, and say what remains unverified.

Conflict priority: latest explicit user requirement → validated code/current repo configuration → `docs/FEATURE_SPECIFICATIONS.md` and accepted `docs/DESIGN_DECISIONS.md` → historical notes/roadmap. Record unresolved contradictions rather than making up a decision.


## v0.8 geometry and hardware invariants

- `crystalOrientation` must be used for all preview, worker and test mesh transforms: growth lean is a **rigid object tilt**, not per-ring vertex shear.
- `crystalEndRatios` and `crystalSize` must be shared by visible geometry, base footprint and automatic LED planning. The base must seat the **entire rotated root perimeter**, not just the crystal centre.
- In `Build`, `hardware-editor.js` handles a continuous LED/mount placement tool; disable OrbitControls while placing, retain the tool through repeated clicks, and expose a true moving hole ring with valid/invalid feedback.
- `edge-tabs.js` is the authoritative perimeter-tab layout; `hardware-layout.js`, Build guides and Manifold tab unions/drills must agree. Tab holes are through-holes; no printed fixing is automatically rated for overhead loads.
- `putSocket` makes an intentionally **blind** rounded LED bore. Never cut through the upper exterior or silently remove the minimum roof; side vents on optional vaulted bases are separate.
- `tooltips.js` owns the shared accessible hover/focus help; add explanations when adding new controls.
