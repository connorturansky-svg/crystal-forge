# WT-025 — Codex / AI-agent fast start

> **PLANNING ONLY. NOT A RELEASE OR PERMISSION TO MERGE.** Issue [#154](https://github.com/connorturansky-svg/crystal-forge/issues/154). Read [implementation blueprint](WT025_LEGIBILITY_CHANGE_AWARENESS_SPEC.md) and [human-first PR checklist](WT025_HUMAN_FIRST_PR_CHECKLIST.md). This document is the portable handover for other ChatGPT chats, Codex and GitHub agents; do not depend on access to private chats.

## Read first, in this order

1. `AGENTS.md` → current `docs/PROJECT_STATUS.md` → [#154](https://github.com/connorturansky-svg/crystal-forge/issues/154) → this file → only the relevant section of [blueprint](WT025_LEGIBILITY_CHANGE_AWARENESS_SPEC.md).
2. Inspect live main, open PRs, claims, CI and Pages deployment. Baseline `d2ee1ab84ea41d363d9448df436732a286bf2c54` was **only** an audit snapshot.
3. Inspect **WT-024 #152 / draft #153** before touching tooltips or `index.html`; its two-level help registry and user guide are independently owned. Also check WT-023 #147/#148/#151, and #149/#150 docs/QA. Avoid any open claimed file. Owner must approve merges.
4. Start a **separate small feature branch from latest main** or an explicitly reviewed stack. Do not edit another agent's branch/worktree.

## Work assignment: choose only ONE lane per implementation PR

| Lane | Work | Primary files | Do not change |
| --- | --- | --- | --- |
| A | Source audit + readable default text and focus/spacing | `index.html`, `sensory-studio.css`, `studio-features.css`, existing browser accessibility tests | Geometry, storage schemas, help registry from WT-024 |
| B | “Since your last visit”: filtered deployed notes, explicit read state, accessible cards | `tests/release-metadata.mjs`, `CHANGELOG.md`-parity helper, existing `studio-v3.js` info dialog, focused unit/browser tests | WT-024 tooltip renderer, full release parser contract, PR/issue scraping |
| C | Old-name aliases and orientation after tool moves | `studio-tool-registry.js`, `studio-tool-finder.js`, `studio-tool-search-core.js`, focused Chromium tests | Duplicate search implementation or renaming stable IDs |
| D | **Only after tested runtime release:** in-app Help, GitHub Pages user copy and status/changelog handover | `index.html` Help; `CHANGELOG.md` + `node scripts/generate-release-metadata.mjs`; user guide; current status | Any claims about unreleased controls or physical-fit approval |

## Contract: future release summary

- Source is canonical **versioned** changelog entries; exclude `Unreleased` draft notes.
- Cards contain **what / why / where** and a text status (New, Changed, Moved, Fixed, Important), optional real `toolId`; no dead link or decorative-only icon.
- Show up to five first, full history remains in What's New; no forced modal; explicit **Mark updates as read**, reversible access to archive.
- First visit is a calm **Recent changes** recap, not an all-history unread alert.
- Read data is **versioned UI-only localStorage**, never project, vault, autosave, print jobs or geometry; test missing/corrupt/blocked data, two tabs, newer→older Pages rollback and no auto-mark on open.
- Keep existing tab keyboard handling, feature catalogue, focus return, search routing, stable release metadata tests.

## Evidence before owner review

1. Before/after legibility measurements + *real* Chromium screenshots at matched viewports, including 390px and light/dark; verify 200% text-size and 400% browser reflow cases as relevant, no clipped setting labels or keyboard traps.
2. Static checks for contrast, text override behaviour, label/control associations and released-only notes; manual screen-reader gaps stated plainly.
3. Test seven builders and eight workspaces across primary actions; history, aliases, persistence, help and preparation. Run focused tests, then `npm run test:static`, `npm run test:browser`, `npm test` and applicable Pages staged suite **at exact PR head**.
4. PR description begins **What users will notice**; report exact branch/head SHA, changed files, tests with run links, known limitations, release status, overlap/ownership and manual tasks. See [checklist](WT025_HUMAN_FIRST_PR_CHECKLIST.md).
5. Do not edit live Pages documentation, generated release HTML or active `docs/PROJECT_STATUS.md` until implementation is demonstrably delivered and relevant concurrently owned branches are reconciled. No silent UI rework or merge.

## Copy-paste implementation prompt (after owner chooses a lane)

> Continue Crystal Forge WT-025, Issue #154, on a new isolated branch from latest reviewed main. Read AGENTS.md, docs/WT025_CODEX_FAST_START.md and the corresponding lane of docs/WT025_LEGIBILITY_CHANGE_AWARENESS_SPEC.md; verify #152/#153 WT-024 help ownership and active WT-023 PRs before edits. Implement ONE small tested lane only, preserving all seven builder families, eight workspaces, model/vault/print state and existing Help/Features/What's New/search behaviour. Treat legibility as functional accessibility, not a cosmetic redesign; supply plain-language examples and exact browser evidence. If implementing release cards, derive them only from shipped versioned CHANGELOG releases, with explicit user acknowledgement and UI-only storage, including blocked-storage and multi-tab cases. Run exact-head Node/Chromium/Manifold and Pages tests as applicable; update actual user-facing guides/metadata only if implementation ships. Open a draft PR, explain what changed, where users find it and what remains untested, and do not merge or deploy without owner approval.

**Critical distinction:** this research docs PR provides preparation, not working new UI. Current verified usage remains in [readable user guide](WT025_READABLE_USER_GUIDE.md). Follow future updated acceptance/evidence over dated snapshot notes.
