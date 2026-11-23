# WT-024 — Codex fast start and agent handover

> **Planning documentation, NOT permission to merge or claim this feature live.** Owner has approved the product direction in [issue #152](https://github.com/connorturansky-svg/crystal-forge/issues/152). Read [blueprint](WT024_HELP_SYSTEM_BLUEPRINT.md) and [source audit](WT024_HELP_COVERAGE_AUDIT.md) before the first code change. This entrypoint is intentionally concise so Codex and other chats do not repeat days of research.

## 90-second preflight

1. Read `AGENTS.md`, current `docs/PROJECT_STATUS.md`, #152 and this file; fetch **latest main, PRs, claims, CI/Pages**. Do not use the planning snapshot SHA as latest head.
2. Check conflicts: **#147** transactions, **#151** Templates-first Library, **#148** dependent GitHub vault, **#149** current status/docs, **#150** independent QA. These may have merged; verify rather than assuming. Never edit their branches or confuse old PR #37/#90 with current help code.
3. Inspect exactly: `tooltips.js` (mapping + install), `studio-v3.js` (Description init), `index.html` (topbar, CSS, `#contextHelp`, Help copy), `sensory-studio.js` (schema renderer + dynamic editor creation), `studio-catalogue.js`, `sensory-studio.css`, `tests/browser-smoke.mjs`, `tests/unified-studio-browser.test.mjs`, `studio-tool-finder.js`.
4. Choose a **new short-lived feature branch from latest main**, or explicitly mark stacked if dependent on unmerged #151; no checkout into another agent's working tree. The planning PR is docs-only and should never become an implementation branch containing Library history.
5. Confirm control inventory from code and a real browser. The research audit includes a noted numerical discrepancy (14 vs 15 classic keys); **never trust a fixed manual number over executable discovery**.

## Execution prompt (paste into Codex when development is authorised)

> Implement WT-024 issue #152 on a new isolated feature branch after reading `docs/WT024_HELP_SYSTEM_BLUEPRINT.md`, `docs/WT024_HELP_COVERAGE_AUDIT.md` and current `AGENTS.md`. Replace the legacy Description toggle with two independent global checkbox preferences: Hover notes (concise hover/focus/touch accessible) and Detailed explanations (human, practical, in-flow next to every relevant setting). Reuse `tooltips.js`, add a single shared semantic registry with short and detailed content, extend native `data-model-param` and dynamic pixels/wiring/mounting/print editors rather than duplicating components. Use accessible contrast/keyboard/Escape/hoverable tooltip and preserve `aria-describedby`, focus, 390 px layout, Simple/Advanced and all seven families. Do not add help state to projects/vault/geometry, alter manufactured parts, auto-merge or write to WT-023 branches. Start with a tested core vertical slice, then complete coverage and editorial parity. Run focused tests and exact-head full static/Chromium/Manifold suites before owner review. Update Help, user guides, version/What's New/CHANGELOG only when product code actually ships. Report exact commit, changed files, tested cases, known limitations and owner-only merge requirements.

## Minimal implementation decomposition

- **A — Settings + popup:** preserve `describeControl` compatibility while providing preference state and redesigned topbar; test all four states, migration, keyboard focus/Escape, hover crossing and touch.
- **B — In-flow renderer:** hook existing static .control and dynamic `control(schema,p)` plus contextual native renderer; keep labels/accessibility and focus, guard rerender/lazy content.
- **C — Verified content parity:** complete human copy for all classic controls, native parameter schemas, hardware/pixels/wiring/Print Centre and editable modals; generate coverage manifest; avoid generic placeholders.
- **D — Regression + release:** full seven family/eight workspace Chromium, UI-only persistence, search focus, 390 px, both themes and existing manufacturing pipelines. Only then remove `#contextHelp` and old CSS, update in-app Help/What’s New and external user docs, with release metadata.

## Ready-made QA preflight — check whether #156 is merged

[QA PR #156](https://github.com/connorturansky-svg/crystal-forge/pull/156) adds a standalone tests-only source inventory and unit tests. Once it is on your working branch, run `node tests/helpers/wt024-help-audit.mjs` to print structured gaps; do **not** reimplement the same parser. If #156 is still a draft on another branch, read its diff or use the one-off snippet in the coverage audit, and report the dependency. **Its inventory does not certify native/UI completeness, user comprehension or accessibility.**

## Final release rule and efficient handover

**Do not merge a visible half-finished feature.** Core helper and registry commits are fine on a feature branch, but all 7 families/8 workspaces and applicable modals must pass the coverage and interaction gates before exposing the two checkboxes on main. If implementation spans PRs, stack clearly and merge only the completed user-facing chain after owner approval; an internal-only foundation must remain invisible and inert on production.

For the next Codex session, **start coding rather than re-researching**: use the [source audit's executable snippet](WT024_HELP_COVERAGE_AUDIT.md#reproducible-source-audit-snippet-for-codex-diagnostic-not-a-release-test) to update literal keys, then build the registry and representative Crystal/native vertical slice. Record for every milestone exactly `branch, head SHA, changed files, tests and links, coverage missing, next safe action` in the PR body. Avoid a log that merely says "tested" without an exact command/run.

Reviewers should see screenshots or observations for **both preferences**, actual inline placement, keyboard/touch behaviour and the short-vs-detailed text distinction. Include normal and narrow viewport screenshots and a control-inventory artifact. For new prose use the [plain-language and cognitive readability contract](WT024_HELP_SYSTEM_BLUEPRINT.md#practical-accessibility-typography-and-reading-load); no specialist fonts are required.

## Tests, stop condition and exact-head report

Focused tests: `tests/context-help-coverage.test.mjs` (proposed), `tests/context-help-browser.mjs` (proposed), legacy `tests/browser-smoke.mjs`, `tests/unified-studio-browser.test.mjs` and actual tooltip accessibility checks. Full suites: `npm run test:static`, `npm run test:browser`, `npm test`, plus all relevant existing native-precision, WT-022 search and Pages packaging checks. Do not change CI to skip slow tests. If the environment cannot run Chromium/Manifold, state the limitation and use Actions exact-head verification; never call a test green solely from older main.

**Deliverable:** focused draft PR(s), no owner merge without explicit approval. In PR body record `base HEAD`, `feature HEAD`, dependencies, source/coverage evidence, all four checkbox states, mobile/keyboard checks, release metadata policy, exact CI run URLs, outstanding manual screen-reader and fit limits. Add concise new handover pointers without rewriting #149's doc updates. Print safety under #10 is unchanged.

## Agent boundaries
- Architecture/registry owner: one agent per branch, no competing help system.
- Content editor: can prepare distinct reviewed registry entries or documentation; never overwrite implementation JavaScript concurrently.
- QA agent: test-only/new branch, use executable coverage and real Chromium, report failure not speculative success.
- Other ChatGPT chats: use #152 and docs links as source of truth, ask whether UI work is merged before telling users to use these new checkboxes.

[Detailed blueprint](WT024_HELP_SYSTEM_BLUEPRINT.md) · [Coverage audit](WT024_HELP_COVERAGE_AUDIT.md) · [Future user guide](WT024_HELP_USER_GUIDE_DRAFT.md)
