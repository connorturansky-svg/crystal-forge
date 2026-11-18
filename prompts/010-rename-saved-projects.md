# 010 — Rename saved projects in the visual Library

> **Status:** Owner-approved small Codex task; implementation not started.
> **Issue:** [WT-010 / #49](https://github.com/connorturansky-svg/crystal-forge/issues/49).
> **Planning:** `planning/prompts`; exact immutable approved **40-character commit SHA** pinned in Issue #49.
> **Verified baseline:** latest `main` `549765b85ddf9a12a1a7aa4a74753a82373f3c8e`, after merged WT-009 [PR #48](https://github.com/connorturansky-svg/crystal-forge/pull/48). Fetch latest before work.
> **Budget constraint:** About 6% Codex credits remain. Scope targeted for roughly **2–3% of total allowance**, NOT guaranteed. One short Codex pass, no subagents or broad investigation.
> **Owner:** Connor's Codex; branch freshly from `main`, one draft PR, no automatic merge/deploy.
> **Non-overlap:** External WT-003 / PR #37 remains a draft independent SVG importer; WT-004 Copilot automation separately blocked.

## Purpose and verified current state

Saved projects are now visual cards with thumbnails, project titles, model counts and explicit `Open project` buttons under Library. However a title typo or duplicate name cannot be corrected from the saved-project cards.

The current `sensory-studio.js` `renderLibraryCards()` loops over `state.savedProjects`, filters by `saved.title.toLowerCase().includes(search.toLowerCase())`, creates `.sms-tile`, appends `modelPicture(thumbnail)`, and adds a single `Open project` button. Its click handler confirms that the current project is backed up before `replaceProject(saved)`. `state.savedProjects` persists via the existing `save()` function. `#smsSaveProject` already saves `copy(project)`; do not modify its existing behaviour.

**Goal:** The artist can rename a **saved snapshot** from its existing Library card without opening it or changing anything except its name.

## Required change — deliberately minimal

1. In `renderLibraryCards()`, add a native **Rename** button next to each saved card's **Open project** action. Give it an accessible label such as `Rename saved project <title>`. Preserve current image, name/count rendering and the existing Open handler.
2. Reuse existing browser prompt patterns: `prompt('Rename saved project',saved.title)` is sufficient; no custom modal or dependency. On Cancel (`null`), do nothing. On submitted name, `trim()`, reject empty/whitespace-only and overly long names (e.g. maximum 100 code points) **without changing anything**; report a simple inline/status message or alert without losing the user's current project. Accept Unicode and ordinary punctuation safely; the title must be escaped on HTML re-render.
3. For valid changed name, update **only** the selected saved project's `title`, call existing `save()`, then `renderLibraryCards()`. Do not touch `project.title`, `smsProjectTitle`, models, saved model library, thumbnails, IDs, revisions, parameter recipes, printer settings, LED/hardware fittings, linked references or backups. If the title is unchanged, no-op.
4. Library search still matches saved project titles: renaming out of the current search results removes that card (expected); clearing search restores it. Model-type filter continues to apply only to model cards.
5. Opening a renamed snapshot works as before: confirmation → backup current project → load the same saved models using renamed project title. Cancel confirmation leaves everything unchanged.
6. Persistence after reload must restore the renamed title. Do not introduce new storage keys, migrations, schema changes, network calls, external services or cloud vault changes.

## Acceptance / tests

- **WT010-01:** A saved-project card visibly presents **Open project** and **Rename** buttons; both are keyboard reachable, accessible and actually connected.
- **WT010-02:** Rename dialog prefills the current title. Cancel, blank name and unchanged name do not mutate `state.savedProjects`, active `project` or change project count.
- **WT010-03:** Valid new title shows immediately on card and in search results; the original preview/model count remain unchanged.
- **WT010-04:** Refresh/reload preserves title; Open action still asks confirmation, keeps the current project backup and restores the intended saved model IDs/parameters with the new title.
- **WT010-05:** Existing Crystal, saved-model independent/linked actions, thumbnail fallback and library search regression do not break. Run `npm run test:static`, one existing **focused** browser test (adapted to exercise Rename/Cancel/Open), and truthfully report exact-head CI results; do not repeatedly execute expensive Manifold locally because no geometry changed.

## Explicit stop rule and deliverables

**This is a single button + validation + persistence + test task**, not a Library redesign. No Delete/Duplicate/Archive/Sort, bulk edits, cloud sync, SVG importer, print queue, geometry, Cura, LED or cable modifications. Prefer edit only `sensory-studio.js`, relevant `tests/unified-studio-browser.test.mjs`, and mandatory release files `index.html`, `CHANGELOG.md`, `docs/AI_HANDOVER.md`. No new packages. One version bump to satisfy the repository gate, no extra roadmap work.

If anything needs a substantial architectural change or creates another task, document that and stop rather than spending credits beyond scope.

## Codex contract

1. Verify merged WT-009 PR #48, fresh `main`, the existing files above and only directly relevant tests. Read `AGENTS.md` and current brief handover first.
2. Claim [Issue #49](https://github.com/connorturansky-svg/crystal-forge/issues/49) with `CLAIM WT-010 — @connorturansky-svg Codex — feat/WT-010-rename-saved-projects — Library title editing`.
3. Work in `feat/WT-010-rename-saved-projects` from current main. Open **one draft PR** titled `[WT-010] Rename saved projects in the visual Library` with these exact metadata labels:

```
Task issue: #49
Approved spec: prompts/010-rename-saved-projects.md @ <FULL_IMMUTABLE_APPROVED_SHA_FROM_ISSUE_49>
Scope: Rename stored saved-project snapshot title in Library with validation and persistence.
Related PRs/duplicates: WT-009 PR #48 merged; WT-003 PR #37 isolated; WT-004 separate.
Test evidence: <exact head SHA + relevant static/browser CI URLs and outcomes>
Handover: docs/AI_HANDOVER.md
Risks: <untested/manual items; no physical geometry change>
```

4. No auto-merge, no deployment, no next-phase implementation. Finish one PR and stop.
