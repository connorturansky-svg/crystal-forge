# Current work — Crystal Forge / Pixel Model Maker

**Snapshot:** 22 November 2026, after merged [WT-022 A #128](https://github.com/connorturansky-svg/crystal-forge/pull/128). **Not a live dashboard.** Always recheck [main](https://github.com/connorturansky-svg/crystal-forge/commits/main), [open PRs](https://github.com/connorturansky-svg/crystal-forge/pulls), [Issues](https://github.com/connorturansky-svg/crystal-forge/issues) and [Actions](https://github.com/connorturansky-svg/crystal-forge/actions) before treating any status as current.

## One-minute orientation

- **Production:** `main`, at snapshot `a6dd812fd04a5d736aed7ec6d7f74352951e5d8a`. [#128](https://github.com/connorturansky-svg/crystal-forge/pull/128) merged the real line/ring/grid mounting layouts (Milestone A). Its PR-head tests passed; main-branch static, fabrication, browser smoke and Pages deployment also passed as of the later audit.
- **Next unfinished product milestone:** [WT-022 Issue #127](https://github.com/connorturansky-svg/crystal-forge/issues/127), **B — dedicated Home, Library, Design, Build, Pixels, Wiring, Mounting and Print Centre workspaces**. Work-in-progress branch `feat/wt022-workspaces` was `d563f02` at snapshot. It already contains editor navigation and focused local browser tests; it was **not** a finished B PR and had not been merged. Recheck remote branch; do not replace its tested work.
- **After B:** WT-022 **C — real cross-workspace tool search**. [Draft prework #129](https://github.com/connorturansky-svg/crystal-forge/pull/129) has a test-only pure ranking helper, 20 sample search phrase fixtures and a handover. It has **no working UI registry or real focus navigation** and must not be presented as the completed feature.
- **Then:** [#79 — software parity](https://github.com/connorturansky-svg/crystal-forge/issues/79), [#10 — Cura/real physical print acceptance](https://github.com/connorturansky-svg/crystal-forge/issues/10). [#51 — modular assemblies](https://github.com/connorturansky-svg/crystal-forge/issues/51) remains held.
- **Separate contributor work:** [#37 isolated SVG engine](https://github.com/connorturansky-svg/crystal-forge/pull/37), [#42 Copilot pilot](https://github.com/connorturansky-svg/crystal-forge/pull/42), and historical [#90 startup](https://github.com/connorturansky-svg/crystal-forge/pull/90) / [#101 tip styling](https://github.com/connorturansky-svg/crystal-forge/pull/101) are not automatic merge candidates. Review their diffs against actual current main first.

## Credit-efficient resume protocol

1. Fetch current `main` and the B branch head. Read [AGENTS.md](../AGENTS.md), [Issue #127](https://github.com/connorturansky-svg/crystal-forge/issues/127) including recent independent QA comments, and [repository map](REPOSITORY_MAP.md). Do not follow the old #102-only instructions.
2. Finish B **on the existing B branch**: reconcile merged #128 by ordinary merge/rebase preserving tested history; migrate old browser smoke tests to the new destination; include `tests/studio-workspaces-browser.mjs` in the CI gate; satisfy release metadata/What's New; run static, real Chromium, Manifold/STL/3MF tests on the **exact final head**. Open a focused draft B PR. **The owner merges**, not Codex or a QA assistant.
3. Only after B is reviewed/merged, integrate #129's test-only search helper into a real shared searchable registry, actual navigation/reveal/focus and availability explanations. Prove keyboard/mouse across Crystal, Gear and another native family with real browser tests and full regression; create focused C PR.
4. Continue owner-approved priorities under #79; keep real printer, fit, tactile comfort, magnet polarity, sensor behaviour and installation safety under #10. Green Manifold/Playwright ≠ physical acceptance.

## Verified truths vs snapshots

- **Authoritative requirements**: current owner request and live [Issue #127](https://github.com/connorturansky-svg/crystal-forge/issues/127) for WT-022; feature-specific accepted spec/PR for other work.
- **Authoritative implementation state**: actual committed source at current `main` or target branch, and exact-head CI logs. A checkpoint issue comment is evidence of a reported test, not proof that subsequent commits passed.
- **Historical planning**: `prompts/START_HERE.md`, `docs/WT021_NOW.md`, old `docs/AI_HANDOVER.md` entries and the long `docs/ROADMAP.md` preserve prior decisions; do **not** treat their earlier present-tense instructions as active goals.
- **Merging/deployment:** production Pages is triggered by `main`. Do not push directly to `main`, delete another agent's work or merge any PR without owner approval. A documentation or test-only improvement is not a new production feature version.

See [repository map](REPOSITORY_MAP.md) for where code, workflow tests, historical docs, and acceptance evidence live.
