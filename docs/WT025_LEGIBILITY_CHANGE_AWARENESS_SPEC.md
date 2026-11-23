# WT-025 — Legibility and understandable changes: implementation blueprint

> **Status: research and implementation plan only — NOT SHIPPED.** Canonical [Issue #154](https://github.com/connorturansky-svg/crystal-forge/issues/154). Reviewed against `main` `d2ee1ab84ea41d363d9448df436732a286bf2c54` on 23 November 2026. Recheck main, branches, PRs, Actions and Pages at implementation time. **Do not merge or deploy without owner approval.**

## Read this in one minute

**User problem:** rapid development makes controls hard to read and changes hard to follow. Users should be able to answer, without decoding development notes: **Where am I? What changed? What does this do? Where did that tool go? What do I do next?**

**Design priority:** legibility over slickness. Prefer words, readable spacing, familiar control positions, clear labels and stable navigation. Graphics/icons support words; multiple decorative fonts, dense italic paragraphs and colour-only distinctions do not. Never make users repeatedly dismiss release notices or relearn the app.

**Dependency / explicit non-overlap:** [WT-024 #152](https://github.com/connorturansky-svg/crystal-forge/issues/152) and [draft planning PR #153](https://github.com/connorturansky-svg/crystal-forge/pull/153) own the **two global help checkboxes, hover notes and full inline explanation registry**. Reuse that implementation when available; do not invent a second tooltip, help registry or sidebar. The existing tool finder owns search; do not implement a parallel search engine. WT-023 #147/#148/#151 and supporting #149/#150 are separate branch owners. Never rewrite these branches.

## Evidence and bounded source audit

| Verified at above snapshot | Consequence |
| --- | --- |
| `index.html` base `body` has `font:13px/1.45 Inter,system-ui,Segoe UI,sans-serif`; `.control-tooltip span` is `11.5px`; releases appear in an existing Help/Features/What's new dialog. | First test readability on *real rendered controls*; a new font is not a substitute for adequate text size and line height. Do not globally replace every pixel value without checking compact editors and overlays. |
| `studio-features.css` has `.feature-status` at 11px and `.feature-hint` at 12px. | Auditing small informational/status text is as important as changing the body size. |
| `studio-v3.js` `showInfoTab` already handles keyboard-accessible Help/Features/Changelog tabs and returns focus on close. | Extend these existing entry points. Maintain dialog focus, escape and return-to-control semantics. |
| `tests/release-metadata.mjs` parses versioned `## v... — ...` entries in `CHANGELOG.md`, separately captures the `Unreleased` section and renders generated release history into `index.html`. `scripts/generate-release-metadata.mjs` synchronises release/version. | **Only actual versioned deployed releases count as new-to-user.** Never show unmerged draft notes as released features, and never hand-edit generated history. |
| `studio-tool-registry.js` / `studio-tool-search-core.js` / `studio-tool-finder.js` already implement intent-based search, misspelling tolerance, aliases and keyboard focus. | Preserve stable tool IDs; add historical names and old locations as aliases when moving controls. Search must focus the real setting or explain why unavailable. |
| `AGENTS.md`, `docs/PROJECT_STATUS.md`, `docs/REPOSITORY_MAP.md` and `docs/README.md` are active repository guides; PRs #149/#153 respectively touch some of them. | Keep the research branch isolated. Provide an additive agent entrypoint and link it from root README instead of overwriting other agents' authoritative docs. |
| `.github/workflows/pages.yml` deploys on pushes to main, and retains previous successful release assets. | An accessibility docs plan is **not** a Pages feature. Update actual in-app Help and deployed user guides only alongside tested runtime changes and release metadata. |

**Source-of-truth caution:** the top `Unreleased` changelog section still describes an old draft milestone. Any new reader-facing update mechanism must deliberately exclude it, even though the current What's New archive can render it. Treat `CHANGELOG.md` as release source; do not scrape GitHub PR titles or generate unreviewed release claims.

## Research translated into product decisions

1. **W3C Cognitive Accessibility** recommends clear purpose, familiar and consistent presentation, easily found important actions, search and user testing. Apply this across the eight workspaces, not only in Help. [COGA design patterns](https://www.w3.org/TR/coga-usable/), [findability](https://www.w3.org/WAI/WCAG2/supplemental/objectives/o2-find/).
2. **British Dyslexia Association 2023 guide** suggests readable sans-serif faces, roughly 16–19 px equivalent text, proportional 1.5 line height, bold emphasis, and avoiding long italic/underlined or all-capital passages. Use as a *starting hypothesis* and test with real users. Do **not** promise that a specialised font treats dyslexia. [BDA style guide](https://cdn.bdadyslexia.org.uk/uploads/documents/Advice/style-guide/BDA-Style-Guide-2023.pdf).
3. **WCAG 2.2 AA** is the technical floor, not proof of low cognitive load. Verify readable contrast (1.4.3), resize text (1.4.4), reflow (1.4.10 with genuine 2D canvas exceptions), text-spacing override (1.4.12), visible focus (2.4.7/2.4.11) and target size (2.5.8 and exceptions). 1.4.12 **does not require authoring all text with prescribed spacing**; it requires no loss if users override it. [WCAG 2.2](https://www.w3.org/TR/WCAG22/).
4. **Readable content** is not dumbing down: use short, explicit sentences and familiar terms, while retaining precise manufacturing explanations where they matter. [Home Office readability guide](https://design.homeoffice.gov.uk/accessibility/written-content/readability).
5. **Accessibility preferences are user preferences**; opt-in or easy to adjust when design involves trade-offs. Do not create a mandatory “dyslexia mode” or infer medical status. Use one familiar default and optional display choices if testing justifies them.

## Lane A: legibility foundation — smallest safe runtime PR

**Goal:** make primary controls readable, not redesign page structure.

- Audit *computed* font size, line height, width, contrast, interactive target size and clipping for headings, toolbars, field labels, values, hints, warnings, popovers, Help, Library folders, modal editors, search results and Print Centre in both themes.
- Start with a shared **readability token** approach in CSS, not scattered component-specific inline styles. Initial candidates: main UI text 16px; prose/help 16–18px; secondary explanatory text at least 14–16px; line-height around 1.5; paragraph spacing and 55–75-character reading measure where practical. **These are proposed test targets, not a blanket forced change or WCAG numeric requirements.** Controls may need different spacing when adjusted.
- Keep one familiar sans-serif stack (system UI fallback), consistent heading weight, left alignment, sentence case, short paragraphs. Bold critical terms. Avoid long italics, small light-grey captions, forced justified text and text over busy graphics.
- Use meaningful labels **with** conventional icons; “Warning — socket clearance” is better than an unlabeled amber shape. Preserve stable positions and expand/collapse decisions; avoid unnecessary animation. Respect reduced-motion.
- If a visual density/text-size preference is demonstrated as useful, add a bounded, UI-only setting. Keep it out of models, projects, vault, fingerprints, print jobs and manufacturing logic. Do not implement it merely to hide an unreadable default.
- No global `font-size:!important` sweep. If changes reflow a dial/diagram, maintain label/input association and viewport orientation. Inspect touchscreen and precision numeric editors.

**Primary sources to inspect:** `index.html` embedded style, `sensory-studio.css`, `studio-features.css`, `studio-v3.js`, `sensory-studio.js`, `tests/exact-value-accessibility-browser.mjs`, `tests/studio-workspaces-browser.mjs`.

**Proposed measurable acceptance:** no text clipped at 390px; no unreachable settings at 200% text zoom or browser 400% zoom except inherent 2D drawing areas; all principal controls accessible by keyboard; no important state communicated solely by colour; default light and dark text meets AA contrast, manually reviewed; no saved value changed by layout alone. Record before/after computed measurements and screenshots at matched viewports instead of claiming subjective “looks nicer”.

## Lane B: since your last visit — new functionality, separate runtime PR

**User journey:**
1. Returning user sees **one calm indicator** beside existing What's New (e.g. “3 updates”); no modal appears without request.
2. Opening What's New first shows **Since your last visit** before the existing archive: a maximum of five short, user-relevant cards with **New / Changed / Moved / Fixed / Important** word labels plus icons, not just colours.
3. Each card answers **what changed, why it matters, where to find it** in two short sentences; offer “Open tool” only if a stable real target is available, and say when it requires an open model or Advanced mode. Use the existing tool finder routing and focus logic.
4. “See all changes” opens the existing release archive. “Mark updates as read” is an explicit non-destructive action. The user can reopen the release history whenever needed. An issue fixed in an earlier release is not introduced as newly fixed just because a future build redeploys.
5. When the app first acquires this feature, show an unpressured “Recent changes” recap from the latest **shipped** release; avoid claiming that the entire archive is unread. No mandatory acknowledgement.

**Data contract:** derive release IDs from canonical versioned release entries, ordered from the parsed changelog, never from merged-PR guesses or a lexical sort of dev versions. Introduce a reviewed, bounded structured summary for user-visible changes (for example `{releaseId,changeId,kind,plainTitle,why,toolId?,requires?}`), with deterministic IDs and explicit editorial ownership. Keep one authoritative release source: a structured companion must be validated against the `CHANGELOG.md` versioned parser, not maintained as a competing changelog. Never auto-classify a “fixed” feature from arbitrary PR wording. Validate missing targets at build/test time; show a plain-text fallback, not a dead link.

**Read state:** one versioned **UI-only** localStorage key, e.g. `crystal-forge-seen-updates-v1`, storing acknowledged release IDs or a stable upper watermark plus a bounded exception model. No project/vault/backups or model edits. On missing/blocked/corrupt storage show recent releases with a clear explanation; never crash or silently overwrite other storage. No implicit “read” on opening. Multiple tabs should hear `storage` updates without changing print state. Old tabs and rollback to an older deployment must not create permanent unread loops or delete a newer acknowledgment. Cap retained history; test migrations of the key. Never request remote tracking accounts or analytics as a prerequisite.

**Content quality examples (illustrative, not actual release claims):**

| Kind | Poor | Human-first alternative |
| --- | --- | --- |
| Moved | “WT-022 workspace migration” | “Mounting holes have moved to **Mounting**. Your saved hole positions are unchanged.” |
| Fixed | “Fix FIT-02” | “Some valid Wave pixel sockets previously blocked STL export. Reprepare the model and check the new file in Cura.” |
| New | “Implement semantic registry” | “You can search for ‘magnets in a circle’ to find Mounting patterns.” |
| Important | “Manifold geometry changes” | “An edited model needs a new prepared print file. A viewport preview is not the final mesh.” |

**Avoid:** auto-opening overlays, sticky badges for an old update, autoplay animations, release notes in tiny text, listing every commit, technical PR numbers in primary text, duplicate app settings, hiding the existing full changelog, claims about physical-fit certification.

**Entry points:** `tests/release-metadata.mjs`, `scripts/generate-release-metadata.mjs`, `CHANGELOG.md`, generated section of `index.html`, `studio-v3.js` info dialog, `studio-tool-registry.js`, `studio-tool-finder.js`, `studio-features.css`. Guard against Pages old-tab release versions and partial deploys.

## Lane C: find, orient and explain change

- Keep all eight existing workspace destinations stable; if a control moves, preserve its **old names and expected destination** as aliases in the existing tool finder. When selected, actually focus the target or give a precise enable/prepare instruction.
- Breadcrumb or compact “You are in [workspace] → [setting group]” only where orientation is ambiguous; don't consume toolbar space unnecessarily.
- Reuse WT-024 short/detailed help adjacent to setting. A “Moved from Build” note can be temporary release guidance, **not an extra persistent tooltip system**.
- Preserve scroll/focus/editing state on workspace switch, Help open/close, search result navigation and dynamic rerender. Test with one saved model across multiple workspaces and both Simple/Advanced views.
- Use recognisable icons and box styles consistently, with text label as the authoritative meaning. Don't make every family a different typeface.

## Lane D: human-readable GitHub, agents and Pages

- PR first paragraph **What you'll notice**; next **Where to find it**, **What might break**, **Evidence**, **Not yet done**. See [human-first review checklist](WT025_HUMAN_FIRST_PR_CHECKLIST.md). Screenshots of *real browser UI* before/after for visible changes; code-only diff does not prove legibility.
- Separate `PLANNED`, `IMPLEMENTED (unmerged)`, `MERGED`, `DEPLOYED`, and `PHYSICALLY TESTED` claims, with branch/commit evidence. Use one authoritative `docs/PROJECT_STATUS.md` instead of new conflicting live dashboards. Do not touch its concurrently owned #149 branch.
- Agent handover in [fast start](WT025_CODEX_FAST_START.md): dependencies, narrow lane, exact source entrypoints, executable acceptance, no branch collision. Link from root README. When #149/#153 finish, reconcile links into `AGENTS.md` and `docs/README.md` rather than overwriting their PRs.
- **Pages:** as main deploys on merge, no in-app help or Pages copy should claim new controls before the implementing PR passes staging and owner approval. In the final runtime PR, update Help and What's New generated release metadata and public user guide together, then verify the deployed URL separately. See [current-user guide](WT025_READABLE_USER_GUIDE.md) for honest current functionality.

## Required tests, per implementing PR

| Test layer | Acceptance |
| --- | --- |
| Static/source | Design tokens and CSS selectors; no accidental legacy tooltip overrides; changelog/structured-summary parity; unique stable IDs and action targets; no unreleased entries leaked. |
| Chromium readability | Light/dark at normal and 200% text scaling, 390px viewport, browser zoom at 200%/400% where supported; labels/values visible, no overlapping controls, focus visible, text-spacing override 1.4.12. |
| Keyboard/touch/accessibility | Tab, arrows, Enter, Space, Escape, focus restoration; visible labels and screen-reader names; release updates not announced as repeated intrusive live alerts; manual NVDA/VoiceOver where possible. |
| Release lifecycle | New user, returning user, no updates, 1/6/100 updates, read/close/reopen, corrupt/disabled storage, multi-tab changes, old tab across Pages release and rollback. |
| Regression | Seven builder families × eight workspaces representative flows, tool search with old names, Simple/Advanced, Library restore, saved model reload, Print Centre prepare; exact-head `npm run test:static`, `npm run test:browser`, `npm test` and applicable Pages stage. |
| Human task observation | Give real users unfamiliar updated builds tasks: find moved mounting tool, explain a changed setting, identify next required print step, resume a saved design. Record success and blockers, not a fabricated accessibility score. |

**Independent safety:** no physical print or mechanical fit certification; only owner-led Cura / printed tests under [#10](https://github.com/connorturansky-svg/crystal-forge/issues/10).

## Sequence and file claim boundaries

1. **Research PR (this PR):** documentation only, may merge independently after owner review. No runtime, tests, CSS, workflows or release metadata touched.
2. **A, readability foundation:** small CSS/markup slice; coordinate `index.html` / `sensory-studio.css` with WT-024 and active Library PR first. Do not start a page-wide design rewrite.
3. **B, versioned updates:** own only release-summary helpers and minimal existing info-dialog integration. Avoid manually editing generated changelog HTML. Prefer a source-backed unit-tested pure transformation before UI.
4. **C, navigation refinements:** existing tool finder aliases and focused routing tests; do not regenerate every control.
5. **D, deploy/user education:** update actual in-app Help/Pages copy and CHANGELOG only after shipped behaviour is verified; update `docs/PROJECT_STATUS.md`, `docs/AI_HANDOVER.md` and accessibility acceptance evidence on separate coordinated review.

**Stop if** another branch owns the same file, runtime source changes are not reviewable/testable, current main differs materially, or the change would invalidate prepared geometry or saved workspace state. Record the reason and take a narrower independent slice.

### Formal references

- W3C: https://www.w3.org/TR/coga-usable/ ; https://www.w3.org/TR/WCAG22/
- British Dyslexia Association: https://cdn.bdadyslexia.org.uk/uploads/documents/Advice/style-guide/BDA-Style-Guide-2023.pdf
- Home Office written-content readability: https://design.homeoffice.gov.uk/accessibility/written-content/readability
- Related work: [WT-024 #152](https://github.com/connorturansky-svg/crystal-forge/issues/152), [planning PR #153](https://github.com/connorturansky-svg/crystal-forge/pull/153), [WT-023 #137](https://github.com/connorturansky-svg/crystal-forge/issues/137).
