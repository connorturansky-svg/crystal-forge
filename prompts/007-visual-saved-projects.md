# 007 — Visual saved-project gallery (small owner-Codex milestone)

> **Status:** Owner-approved; implementation not started.
> **Issue:** [WT-007 / #43](https://github.com/connorturansky-svg/crystal-forge/issues/43).
> **Planning branch:** `planning/prompts`; **approved immutable SHA:** pinned on Issue #43, not whatever the planning branch points to later.
> **Baseline checked:** `main` after merged WT-006 PR #41 at `e778555f1cb3316b7482d9ecd9594da64c0a9698`. Fetch latest `main` when beginning.
> **Owner:** Connor's Codex, one short-lived branch and one draft PR; not Jordan's external contributor.
> **Effort cap:** targeted low-complexity UI milestone approximately one quarter or less of WT-006's development *effort*. Actual Copilot/Codex credits cannot be guaranteed; do not exceed scope to spend remaining credits.

## Why this matters

Wonder Trunks Studio needs a **visual library** where an artist can recognise work by its appearance, rather than reading a wall of filenames. The merged app already supports genuine preset cards, project-model cards, thumbnail helpers, linked and independent model insertions and local save/backup. **Only saved projects currently appear as text-only buttons**, even though each saved project contains visual models. This is a contained gap that can be improved without touching expensive geometry or 3D interaction code.

The library should feel consistent with the existing visual model picker and model gallery. Crystal Clusters remain the regression benchmark. No new app architecture is requested.

## Verified source / exact scope

Current `sensory-studio.js`:
- `renderLibraryCards()` already creates `#smsProjectModels`, `#smsSavedModels` and `#smsSavedProjects` grid containers.
- Project models/saved models use `modelPicture()` and `recipeThumbnail()` and render as `.sms-tile` cards.
- Saved projects currently use plain text buttons listing `saved.title` and `saved.models.length`, then `confirm()`, `remember()`, `state.savedProjects.push(copy(project))` and `replaceProject(saved)`.
- Existing `#smsSearch` triggers `renderLibraryCards()`, but the saved-project loop does not filter by project title.
- `model.thumbnail` may be present, but generating complex previews for many saved models could be expensive. **Do not eagerly render all model geometries** as a library-wide thumbnail build.
- WT-006 introduced stable fitting IDs and checked pixel bores; saved project object shape and content must remain unchanged.

## Implementation — deliberately narrow

1. Replace **only the saved-project list UI** in `renderLibraryCards()` with accessible, compact `article.sms-tile` cards, reusing the established CSS and image helper. Show the saved project title, number of models, a single representative thumbnail if one is already stored, and a clearly labelled `Open project` button.
2. For the image, select the first saved model with a valid existing `thumbnail` data URL. If none exists, optionally use a cheap existing generator-preview fallback **only for one model and only if safe/known bounded**; otherwise use the established `modelPicture(null)` placeholder. **Do not introduce batch WebGL thumbnails, new renderer instances, heavy save-time image generation, promises or persistent image caches.** Show no mismatched unrelated stock art.
3. Filter saved-project cards by the existing case-insensitive Library search term against project **title**. The model-type filter should continue to affect model cards as before; do not silently hide all saved projects due to mixed model types (leave project cards title-search-only, and document).
4. Reuse existing open behaviour exactly: on Open, ask confirmation; Cancel does nothing; Confirm creates a backup copy of the current project before switching to the chosen saved snapshot, preserving IDs, materials, parameters, links, settings and fittings. Prevent incidental mutation of the saved snapshot during rendering; use existing `replaceProject` functionality. Avoid redesigning duplicate handling or project-store schema.
5. Use existing `.sms-grid`, `.sms-tile` with minor CSS only if necessary. Clear focus/keyboard labels and no click-on-image surprise; the card's explicit button does the open. Mobile cards should not overflow or cover actions. Retain existing project-model library buttons and model family picker unchanged.

### Hard exclusions

- **Do not edit `svg-import/**` or external [WT-003 / PR #37](https://github.com/connorturansky-svg/crystal-forge/pull/37) files.**
- No SVG/STL/OBJ integration, fabrication paths, cable routing, pixel fitting logic, Crystal geometry or optical simulation.
- No private vault or cloud-token architecture, save migration, schema version change, service worker, new dependencies, re-theme or redesigned Print Centre.
- No large general UI refactor or second issue. Do not use other agents or a huge repository-wide audit. Only inspect immediately relevant files and existing tests.
- Only touch implementation `sensory-studio.js`, optional `sensory-studio.css`, targeted test file(s), and mandated release/handover docs. Any additional source file requires a clear reason in PR.

## Acceptance / budget discipline

**WT007-01:** In a project with at least two models, use existing Library save project. The Saved projects area shows a styled image card with correct title/count; actual stored model image or explicit fallback is shown.

**WT007-02:** Existing Library search filters saved-project titles case-insensitively; clearing search restores all; model cards still filter as before.

**WT007-03:** Click Open project and Cancel: no state change or duplicate backup. Click Open and Confirm: present project saved first, correct chosen project becomes current, and at least two models retain parameter/pixel ID/material fields; reopening Library does not corrupt snapshots.

**WT007-04:** Existing saved model Independent copy / Linked copy buttons, individual model tab Open, model picker, Crystal Cluster editor and Print Centre remain functional. No touch to production geometry/exports.

**WT007-05:** Browser test covers visual structure, filtered state, Cancel/Confirm and screenshot on desktop/mobile. Run `npm run test:static` and focused `npm run test:browser` as appropriate; report exact head and CI results. No need for expensive full geometry benchmark on a UI-only task. Never claim Cura or physical print verification.

**WT007-06:** Bump the app version once and update `CHANGELOG.md` and in-app What's New if the repository's version gate requires it. Add one short truthful `docs/AI_HANDOVER.md` entry (note PR #41 already merged), then stop.

### Scope stop rule

If an acceptance criterion requires a rewrite, new persistence layer, new renderer architecture or interactions beyond saved-project cards, **do not implement that expansion**. Put it in PR risks/follow-up and finish only the safe contained slice. Target **one Codex pass**, no subagents, no large detailed phased roadmap, no repeated full-suite test cycling. The owner explicitly wants to conserve their remaining usage credits; this is a complexity-management instruction, **not a numeric credit guarantee**.

## Handoff

Claim [Issue #43](https://github.com/connorturansky-svg/crystal-forge/issues/43) with `CLAIM WT-007 — @connorturansky-svg Codex — feat/WT-007-visual-projects — saved project cards`.

Create one branch freshly from `main`, name `feat/WT-007-visual-projects`, and open one **draft PR** titled `[WT-007] Visual saved-project gallery`, with these lines:

```
Task issue: #43
Approved spec: prompts/007-visual-saved-projects.md @ <FULL_40_CHARACTER_APPROVED_SHA_PINNED_ON_ISSUE_43>
Scope: Small visual saved-project gallery UI only.
Related PRs/duplicates: WT-006 PR #41 merged; WT-003 PR #37 separate external SVG engine.
Test evidence: <exact head + static and browser URLs/results>
Handover: docs/AI_HANDOVER.md
Risks: <fallback thumbnails, any manual checks and intentionally deferred features>
```

Keep it draft until accurate tests/screenshots. **No auto-merge, no deployment, and no direct writes to `main`.** After acceptance, stop and report rather than inventing the next milestone.
