# Overnight Dual Milestone Handoff — WT-015 + WT-016

> **OWNER REQUEST:** "codex has finished, prepare the next prompt, but as I will run this overnight, make it a big one, possibly it asks for 2x WT's to be worked on".
>
> **Authority:** This is **ONE owner-approved overnight handoff consisting of TWO separate, strictly sequential coding tasks**. It is NOT permission to merge, deploy, expand into WT-011, modify Jordan's SVG PR, or schedule more work beyond WT-016.
>
> **Issue A:** [WT-015 / #58](https://github.com/connorturansky-svg/crystal-forge/issues/58) — [`015-library-collections-templates.md`](./015-library-collections-templates.md)
>
> **Issue B:** [WT-016 / #59](https://github.com/connorturansky-svg/crystal-forge/issues/59) — [`016-safe-cross-device-sync.md`](./016-safe-cross-device-sync.md)
>
> **Immutable full SHA:** Pinned in both issues after index/brief publication. Read all 3 files from **that exact 40-character revision**.
>
> **Verified source baseline when authored:** `main` = `e3af2b87f71724e0bace93222448847709a5fa4a` after merged WT-013 [PR #57](https://github.com/connorturansky-svg/crystal-forge/pull/57); exact-head Chromium, static, fabrication and contributor checks green. Refresh at actual start.
>
> **Owner priorities:** Library favourites, collections, reusable templates and safer cross-device project backup/sync ranked MEDIUM. WT-012 catalogue/routing, WT-013 light passage and WT-014 UI are already merged. WT-011 modular splitting is LOW/ON HOLD. External SVG import WT-003 / draft PR #37 belongs to Jordan and remains isolated.

## Mandatory execution plan

### Phase 0 — Confirm safe baseline

1. Start one owner Codex coding session in `connorturansky-svg/crystal-forge`. Fetch `origin/main`, read `AGENTS.md`, current `docs/AI_HANDOVER.md`, the entire two pinned approved briefs and only relevant existing modules/tests.
2. Confirm WT-013 PR #57 and WT-014 PR #56 merged, Issues #58/#59 unclaimed, no overlapping implementation PR and no local uncommitted changes that would be overwritten. If conflicting work exists, stop/coordinate.
3. Confirm the exact pinned SHA and both specs. No planning branch edits from coding source branches. Keep existing deployment rules.

### Phase A — WT-015: Organise Library

4. Claim Issue #58 and branch `feat/WT-015-library-organisation` from **latest main**.
5. Implement real saved model/project favourites and named virtual collections, create/rename/manage/filter, and proper reusable model/project templates with independent-vs-linked copy. Preserve all old model/scene/print behaviours.
6. Implement additive organisation metadata + local complete backup + **backwards-compatible StudioVault support**, because otherwise new collections will disappear in cloud uploads. No new cloud service.
7. Add deterministic document/vault/Chromium interaction tests including save/reload, linked revision and old workspace. Run static and focused suites; assess hosted CI on final head.
8. Open DRAFT PR #A **to main** titled `[WT-015] Visual Library collections, favourites and reusable templates`, with exact SHA, tested commands, CI/screenshot evidence, release bump/changelog/What's New and handover.
9. **GATE:** if PR A has known regression, failing essential test, absent reviewable PR, missing metadata or untested data migration, **STOP**. Do not proceed to B. Leave PR A draft and report precise blocker rather than spending all credits or fabricating passes.

### Phase B — WT-016: Safe cross-device backups and recovery

10. **Only after A passes:** Claim Issue #59. Branch `feat/WT-016-safe-sync` from the **exact tested head of WT-015**, not main. Do not add new commits to the WT-015 branch after this without consciously reconciling stack.
11. Implement a read-only private GitHub vault preview; explicit choice/confirmation; deterministic non-destructive, idempotent merge with correct model/project/collection/template remapping; SHA-guarded push; safe pre-import backup + JSON restore and clear current remote/local help. Preserve v1 backup compatibility and credential-in-memory policy.
12. Test two device identities with an in-memory/mock GitHub API; corrupted hashes, missing assets, remote SHA race, repeated pull after reload, old backup, imported linked revisions, template references, local quota/write failure, and real browser click/keyboard paths. Never test with actual owner private credentials or upload remote fixtures.
13. Run static/vault/Chromium and exact-head hosted CI. One independent version bump above WT-015, matching Whats New/changelog and handover.
14. Open DRAFT STACKED PR #B to base **`feat/WT-015-library-organisation`** titled `[WT-016] Safe cross-device sync, conflict preview and recovery`. Its diff should contain **only incremental WT-016 changes**, not copied WT-015 changes. Explain PR B is **blocked from merging to main until owner merges PR A**.
15. **Stop.** Do not merge either PR, retarget without owner consent, publish GitHub Pages, assign Jordan, dispatch Copilot, start WT-011, or create WT-017 automatically.

### Honest results & handover

Report all of these to the owner:
- WT-015 Issue #58, feature branch/head, draft PR A URL, CI links, concrete controls, screenshots and limitations.
- WT-016 Issue #59, feature branch/head, **stacked** draft PR B URL/base, CI links, real conflict/rollback evidence and limitations.
- If only WT-015 completed: say why B did **not** start/complete, list failed criteria, and give next safe action. **One reliable PR is better than two unreviewable PRs.**
- Separate manual-only validation: real private GitHub connection, two real PCs, installed Cura/filament/LED fit; no claims of true realtime sync or printed safety.
- Owner merge instructions: review A first, merge A after approval and exact-head CI; then rebase/retarget B to main, run fresh tests, review and merge B separately only with owner approval.

## Constraints

- Two distinct PRs, no single monolithic PR; no unbounded refactoring, no automatic merge or source files pushed to main.
- Do not use subagents that write overlapping files. A single integration owner is preferred. If independent audit/QA agents are available, limit them to non-writing review.
- Respect the user's previous **High** priorities, now delivered; no catalogue/lighting geometry rewrite. Preserve Crystal, Tile/Gear serial routes, native scenes, inspector, Pixel Model Maker panel layout, print jobs and all autosaves.
- Never put private repo credentials/tokens in prompts, issues, files, screenshots, browser localStorage, project data or assistant logs. No employer GitHub-policy bypass.
- If at any time source, instructions or available credits are inadequate, stop with a tested draft PR and clear blockers. Don't conceal failures or fabricate green CI/results.
