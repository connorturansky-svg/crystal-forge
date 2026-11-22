# Current work — Crystal Forge / Pixel Model Maker

**Snapshot:** 22 November 2026, after WT-022 B #132 merged and the independent search-release correction #134 opened. **This is not a live dashboard.** Recheck [main](https://github.com/connorturansky-svg/crystal-forge/commits/main), [open PRs](https://github.com/connorturansky-svg/crystal-forge/pulls), [Issue #127](https://github.com/connorturansky-svg/crystal-forge/issues/127) and [Actions](https://github.com/connorturansky-svg/crystal-forge/actions) before working.

## One-minute orientation

- **On production branch `main` at this snapshot:** [#128 WT-022 A](https://github.com/connorturansky-svg/crystal-forge/pull/128) merged precise grouped mounting patterns; [#132 WT-022 B](https://github.com/connorturansky-svg/crystal-forge/pull/132) merged eight focused Home, Library, Design, Build, Pixels, Wiring, Mounting and Print Centre workspaces at `bc33d2e4bd4c88891278229ca68e7ace28915bb9`.
- **Search not yet on `main`:** [#133 WT-022 C](https://github.com/connorturansky-svg/crystal-forge/pull/133) shows “merged” but merged only into stacked base `feat/wt022-workspaces` at `dfa4f0a7ebc84a60f9fc47202b3748448a6ac12a`. This was verified by comparing actual main and feature-branch search source.
- **Required release correction:** [draft #134](https://github.com/connorturansky-svg/crystal-forge/pull/134) is a frozen branch that targets `main` with the existing integrated search implementation. Run/verify **#134-specific** static, Chromium, Manifold/export and edge CI against main; owner decides when to merge. Do not confuse #133's merged label with a production release.
- **Superseded preparation:** [#129](https://github.com/connorturansky-svg/crystal-forge/pull/129) was closed without merge because its test-only search core was integrated into #133/#134.
- **Separate drafts:** [#130 documentation entrypoints](https://github.com/connorturansky-svg/crystal-forge/pull/130) is this repository-navigation update; [#131 docs-only CI efficiency](https://github.com/connorturansky-svg/crystal-forge/pull/131) must be reconciled with the current workflows, and both need exact-head review before an owner merge. They do not deliver WT-022 C.
- **Remaining product and print QA:** [#79 software parity](https://github.com/connorturansky-svg/crystal-forge/issues/79), [#10 physical print/fit acceptance](https://github.com/connorturansky-svg/crystal-forge/issues/10). [#51 modular assemblies](https://github.com/connorturansky-svg/crystal-forge/issues/51) remains held. Software tests cannot certify real pixel or magnet fit.
- **Other contributor drafts:** [#37 SVG engine](https://github.com/connorturansky-svg/crystal-forge/pull/37), [#42 Copilot pilot](https://github.com/connorturansky-svg/crystal-forge/pull/42), [#90 historical startup](https://github.com/connorturansky-svg/crystal-forge/pull/90) and [#101 tip styles](https://github.com/connorturansky-svg/crystal-forge/pull/101) are not automatic merge candidates.

## Credit-efficient Codex resume order

1. Check current `main`, #134 and #127's newest coordination comment, then read [AGENTS.md](../AGENTS.md) and [repository map](REPOSITORY_MAP.md). Do not restart former WT-021 #102 or rebuild the already-merged WT-022 A/B features.
2. **Until #134 is owner-merged**, preserve the existing search implementation; avoid creating a second search rewrite. Review/resolve real #134 check failures if present. After merge, verify the actual deployed Pages app, cross-workspace keyboard/mouse search/focus, seven builders, saved data and STL/3MF pipeline.
3. Prioritise real regressions and physical-print blockers under #79 and #10 over speculative feature expansion. Keep small scope and run targeted tests before exact-head release CI. Owner must approve merges and physical acceptance.
4. Reconcile #130/#131 with current main *after* the search release to avoid conflicting changes to `docs/AI_HANDOVER.md` and workflow files. Leave unrelated contributor branches alone.

## What is authoritative?

- **Requirements:** owner request and [WT-022 Issue #127](https://github.com/connorturansky-svg/crystal-forge/issues/127).
- **Implementation status:** GitHub branch contents and PR target **base**, not only “merged” labels; exact-head Actions evidence, not older logs.
- **Deployment/physical:** Pages is published from `main`. A successful Playwright/Manifold test does not demonstrate physical printer or magnet-sensor fit.
- **History:** `docs/WT021_*.md`, `prompts/START_HERE.md`, and the older roadmap and AI handover chronology preserve previous decisions. Don't use their older active-PR statements as current tasks.

Use [repository map](REPOSITORY_MAP.md) to locate the relevant implementation and tests.
