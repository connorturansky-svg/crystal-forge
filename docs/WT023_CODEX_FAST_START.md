# WT-023 Codex fast start — 23 November 2026

**Read this once, then work directly on the current issue and affected code.** Production `main` was last verified at `d2ee1ab84ea41d363d9448df436732a286bf2c54`; fetch it again before doing anything. The owner must approve every merge. [WT-023 master #137](https://github.com/connorturansky-svg/crystal-forge/issues/137), [next issue #139](https://github.com/connorturansky-svg/crystal-forge/issues/139).

## Owner-approved decisions (do not reopen)

- **One-level, collapsible Project folders**; no nested directory tree.
- **One active editable project**; eventually label model tabs `Project : Model`, no cross-project concurrent editing.
- **Global version-aware Pixel and printer/Cura profiles**, selected per project, no silent remapping of fitted hardware.
- **Private GitHub manual Check / Preview / Merge / Upload**; no PIN, hosted identity service, automatic cross-device sync or public model Library.

## Work that is ALREADY MERGED to main

- **#131** — fail-closed CI efficiency: docs-only PRs skip expensive browser/Manifold steps but preserve required check contexts. Code and test PRs run full checks.
- **#144** — authoritative architecture, backup user guide, AGENTS/repository map/status, and this fast-start entrypoint.
- **#146** — **test-only** project/snapshot grouping helper `tests/helpers/wt023-project-index.mjs`, `tests/wt023-project-index.test.mjs`, `docs/WT023A_PROJECT_INDEX_PREWORK.md`. The helper groups by `project.id` and preserves each `snapshotId`. It is NOT a production import yet.

Do not create a duplicate helper, rewrite the existing Studio vault, rebuild WT-022 search/workspaces or touch physical geometry for this milestone.

## Integration gate — #147 still draft

[Codex WT-023A #147](https://github.com/connorturansky-svg/crystal-forge/pull/147), exact old head `8773200f48797c7366b8789de3bd03ab2961c4ff`: implements stable legacy snapshot IDs and atomic project save/switch; old-head static/full Chromium/native/fabrication/profile/edge suites passed. **Not merged.** Main advanced by 24 commits after #131/#144/#146. Reconcile #147 onto *fresh main*, preserve all post-merge documentation/test work, run exact-head static/focused Chromium/vault and release metadata checks, and leave draft for owner review. No force push, no auto-merge and no synthetic physical fit claims.

Independent [cloud PR #148](https://github.com/connorturansky-svg/crystal-forge/pull/148) already implements a large private GitHub backup read fallback with mocked tests. It includes #147 history as a stack: **do not merge it ahead of #147, modify its branch or duplicate the blob recovery work**.

## Next production job: WT-023B #139, B1 only

After the #147 base is verified (or in a **clearly labelled dependent draft** from #147 while owner review proceeds):
1. Implement the **Library layout** with built-in/reusable Templates first, followed by collapsible **single-level Projects** keyed by immutable `project.id`. Distinguish the active project from saved revisions indexed by `snapshotId`.
2. Promote/reuse #146's pure read-only grouping design in production (do not import from `tests/helpers/`), retaining the source tests and release-version policy. **No new redundant folder database**.
3. Preserve saved models, collections/favourites, project opens, all seven builders, eight workspaces, SVG/mesh imports, keyboard focus, 390px responsive layout and prepared jobs. Use the #147 transactional switch.
4. In **separate B2 PR**, introduce destination chooser (current/existing/new project) for template/model copies with cancel-that-writes-nothing. Do not build B2 within a broad, unreviewable B1 rewrite. Naming and previews are #140; profile catalogues #141.
5. Browser acceptance: two same-name projects with distinct IDs, several snapshots of one project, legacy v1 and measured profile archive, active-vs-history markers, expand/collapse and tab/focus preservation, reload, quota/concurrent-tab failures. No physical printed-fit claim.

## Read only the relevant source

`sensory-studio.js::showLibrary/renderLibraryCards/renderTemplates/renderBuiltInTemplates/saveProjectSnapshot`; `studio-documents.js` project/model IDs and print jobs; `studio-organisation.js` tags and snapshot IDs; `studio-sync-plan.js::projectWorkspaceCandidate`; the merged `tests/wt023-project-index.test.mjs`. See [#139 source-mapped preflight](https://github.com/connorturansky-svg/crystal-forge/issues/139) and `docs/TESTING.md` for browser setup. Use focused `node tests/wt023-project-index.test.mjs`, `npm run test:static`, existing Chromium and manufacturing workflow checks on the exact head. No new hosted auth, backend, geometry, CI workflow or cloud refactor.

**Deliverable:** one **draft** B1 PR with screenshots, exact-head CI, limitations and dependency. Update app version/CHANGELOG for any runtime UI changes. Do not merge or start #140 without review. Report the exact action the owner should take next.
