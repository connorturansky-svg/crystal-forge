# WT-022 Codex restart card — independent QA and search-core preparation (22 Nov 2026)

**Purpose:** save Codex credits. This branch is independent, does **not** change the Studio UI, existing navigation, manufacturing, mounting patterns, production `main`, or the active Milestone B worktree. It provides a tested *pure ranking engine*, contract examples and restart instructions for Milestone C.

## Verified repository state at preparation

- `main` = `a6dd812fd04a5d736aed7ec6d7f74352951e5d8a` (WT-022 A PR #128 merged 22 Nov at 12:12 UTC).
- PR #128 original head `cb09153`: nine reported CI workflows completed successfully, including static, fabrication and browser.
- Main-branch Pages deployment succeeded at that merge head; main-branch browser smoke and fabrication workflows were still running at the moment of audit. **Recheck, do not infer later results.**
- `feat/wt022-workspaces` = `d563f02f4dbb2f040951f4db411caa109647fc32`, four commits ahead of merge-base `cb09153`, and one merge commit behind `main`. **Do not reset/force-push away its tested work.**
- B has changed workspace routing and seven-family browser selectors. It has no PR yet and must finish the full unified regression matrix.
- Milestone C is unimplemented in the live Studio. Existing `studio-tool-finder.js` still searches seven predefined shortcuts; the right-hand inspector search is a separate local filter.

## In this QA branch

- `tests/helpers/studio-tool-search-core.mjs`: deterministic, side-effect-free text matcher, no framework dependencies. Handles common LED/pixel, cable/wire, magnet/ring, bevel/chamfer, UK spellings, token-order independence, prefix match and optional cautious one-edit typo matches. Results retain the supplied catalogue item and availability status, with score and matched query tokens. Empty/unknown input gives no results.
- `tests/studio-tool-search-core.test.mjs`: 20 common phrase intents from issue #127 plus no-match, availability, typo, limits and invalid-data tests.
- **No live navigation is wired here.** The sample fixture IDs in the test are test-only illustrative labels, **not** actual DOM IDs, installed controls, added Hall sensors, or user-visible functionality.

## Suggested no-rework sequence once Codex credits resume

1. **Finish B before integrating C:** fetch latest `main`; reconcile the existing `feat/wt022-workspaces` branch without losing its history. Fix `tests/unified-studio-browser.test.mjs` selectors and cross-workspace navigation. Verify native + Crystal in desktop and 390 px widths, keyboard focus, persisted model state, 3D click placement, edge finishing, Print Centre real exports. Run full static, Manifold and browser gates. Open one focused draft B PR; user owns merge.
2. **Import this search work after B:** once B is merged, add this QA branch by cherry-pick or reuse the small pure test-helper module/source; avoid merging B over an outdated source or creating competing `searchStudioTools` implementations. Confirm test results on exact branch head.
3. **Make one authoritative registry for C:** list **real** destinations and control anchors from the completed B implementation. Each record needs `id`, `label`, `workspace`, `aliases`, `keywords`, an actual navigation/focus action and current builder availability (with explanation). Reuse this same registry for left and right searches or consolidate their boxes. Never invent controls or return a dead shortcut.
4. **Wire actual behaviour:** picking a result navigates, reveals advanced/collapsed controls where appropriate, focuses the real visible element and announces unavailable controls truthfully. Support ArrowDown/ArrowUp/Enter/Escape, no-results status and proper ARIA. Do not mutate model data merely by searching.
5. **Real Chromium acceptance:** all 17 issue #127 phrase queries, including `magnets in a circle`, `Hall effect`, `4 mounting holes grid`, `fixing ears`, `LED socket`, `wire IN OUT`, `bevel`, `Cura profile`, `STL export`, `save to library`. Assert actual selected workspace, expanded **visible** target and focused control, not only ranking. Test Crystal, Gear and at least one other native builder, including disabled results. Run whole seven-builder regression, unchanged real STL/3MF, Pages assets and legacy layout.
6. **Then continue roadmap:** issue #79 is seven-family software parity, #10 is **real physical print validation**, #51 is held modular assemblies. Keep owner merge/deploy controls. Update changelog and in-app What's New only when user-visible changes actually ship.

## Separate, low-credit owner hardware checks (#10)

The owner has real printed parts, Ultimaker 3 Extended / AA 0.8 / PLA. For each actual physical print, collect: generated project/part/version, STL vs 3MF, Cura layer/nozzle/line/speed/temperature, print duration, nozzle/LED/magnet/cable fit, through vs blind hole verification, top-facing edge safety, any filament grinding, top fan operation and enclosure ventilation. **A software CI pass is not evidence of magnet polarity, Hall switching, tactile safety, retention, or installed load capacity.**

## Independent QA notes

- PR #128 exact-head successful checks do not mean subsequent `main` push checks have finished.
- The B branch was stacked on the pre-merge PR A head. After the merge, it shows normal one-commit divergence. Reconcile by ordinary merge/rebase with due care for preserved tests, not branch deletion.
- The existing repo roadmap header includes stale historical references; read issue #127 and latest PR/CI rather than using old document headings as live status.
