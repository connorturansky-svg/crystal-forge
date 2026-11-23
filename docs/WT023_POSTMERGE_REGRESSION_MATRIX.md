# 23 November 2026 · Whole-Studio post-merge regression and release acceptance

**Source baseline:** `main` `d2ee1ab84ea41d363d9448df436732a286bf2c54` after merged #131 fail-closed CI, #144 WT-023 architecture, and #146 read-only snapshot-index tests. This is an independent **test-only** QA lane. No application geometry, Studio data, GitHub vault access tokens, deployment or manufacturing configuration is changed.

## Actual tests implemented in this PR

**Node/static cross-family test:** `tests/wt023-postmerge-regressions.test.mjs` (included by `tests/studio-documents.test.mjs`, which `npm run test:static` already runs). It creates model documents for all **seven** builders, checks prepared print-job source revisions and export eligibility, adds a pinned Library source, preserves a measured pixel profile, makes two saved historical versions, distinguishes a second identically named project with a colliding model ID, and round-trips every record through the immutable private GitHub Studio vault. It checks that no source data was mutated. This tests data preservation, **not** actual 3D mesh fabrication or a live GitHub account.

**Chromium reload test:** extends `tests/studio-workspaces-browser.mjs`, which the full `.github/workflows/browser-tests.yml` runs. The existing test already navigates all eight workspaces, edits a real mounting hole, handles 390px layout and opens all seven builder families. The new final assertion waits for the actual browser localStorage archive, reloads the page, and compares project identity, every saved model ID/family/revision, tab order, model job references and the placed mounting hole. That catches a regression where workspace navigation appears fine but save/reload silently loses an earlier edit.

**Pre-existing independent suites — do not drop:** `tests/studio-tool-search-browser.mjs` (phrase/focus/unknown query); `tests/mounting-pattern-browser.mjs` and `tests/mounting-pattern-manifold.test.mjs` (linear/circle/grid and dimensional print mesh); `tests/studio-pixel-fit-manifold.test.mjs` and `tests/fit-calibration.test.mjs` (calibrated sockets); `tests/edge-finishing-browser.mjs` (seven builders); `tests/browser-smoke.mjs` (Crystal cap and real STL/3MF downloads); `tests/unified-studio-browser.test.mjs` (Library/Print/backup interactions); `tests/ci-scope.test.mjs` (fail-closed docs-only jobs). The PR workflows run these with the existing guards.

## Test evidence log (fill only after each exact-head result arrives)

| Layer | Required observable evidence | Evidence available at QA start |
|---|---|---|
| Merged main static | Exact-main post #146 static | [45087743661](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45087743661) success |
| Merged main Pages | Correct SHA deployed | [45087743682](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45087743682) success |
| Merged main browser | Chrome full test (not docs-only skip) | [45087743587](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45087743587) in progress |
| Merged main fabrication | Manifold + export and mounting | [45087743675](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45087743675) in progress |
| This branch | Node cross-family test and Chromium saved-state test | Exact-head CI **pending**, not yet a success claim |
| Human physical build | PLA/PETG, actual LED fit, tactile edges and magnetic sensor pattern | **Unverified** — [#10](https://github.com/connorturansky-svg/crystal-forge/issues/10) |

## Release-blocker rules

- No merge if the new static/browser test fails, if an existing manufacturing browser suite regresses, or if model/profile/snapshot IDs change on reload.
- Do not call any CI job successful proof of printed physical fit; printed coupon, caliper measurement and actual hardware insertion are still mandatory for #10.
- [#147 transactional persistence](https://github.com/connorturansky-svg/crystal-forge/pull/147) is separate from merged main and must be reconciled on top of #146 without replacing these tests. Run the same cross-family and browser invariants on its exact integration head.
- [#148 large private GitHub blob recovery](https://github.com/connorturansky-svg/crystal-forge/pull/148) is stacked after #147, must not merge ahead of it, and needs its own complete browser/mock-blob checks.
- Do not conflate jobs marked green because docs-only expensive steps were **skipped** with code paths actually executed; review workflow step logs.

## Codex next task

First reconcile #147 to current main and prove its transaction/rollback behaviour alongside these full-project invariants. Then a separate draft for WT-023B B1 **templates-first Library, read-only collapsed Project groups**; defer interactive project destination chooser (B2) until after owner review. No general visual refactor or changes to real geometry.
