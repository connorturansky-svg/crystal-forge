# Wonder Trunks Studio — Prompt Library

> **Planning branch:** `planning/prompts` · **Code/deployment branch:** `main`

This folder is the GitHub-backed source of truth for **future approved Codex development briefs** for Crystal Forge / Wonder Trunks Sensory Model Studio. It complements, rather than replaces, `AGENTS.md`, `docs/AI_HANDOVER.md`, the accepted design decisions, the roadmap and the source/tests.

**Do not treat a file's presence as permission to implement it.** The user's explicit go-ahead, an agreed scope, and a particular version of that file are required.

## Brief index

| ID | Brief | Status | Approved revision | Implementation PR |
|---|---|---|---|---|
| 000 | [Fresh contributor / AI onboarding](./000-contributor-onboarding.md) | Reference — always read first; **not a coding task** | No implementation approval needed | — |
| 001 | [External AI independent review pilot](./001-independent-pr-review-pilot.md) | Review delivered, **changes requested**: [P1/P2 findings](./reviews/WT-001-stage-b-review.md); [Issue #31](https://github.com/connorturansky-svg/crystal-forge/issues/31) tracks follow-up | Pinned original review task revision under Issue #31 | Reviewed merged PR #30; fixes to be triaged on WT-002 PR #35 |
| 002 | [Compact Studio layout + six-family creative geometry](./002-six-family-creative-expansion.md) | **Merged** 2026-11-18 with Stage C0, six-family styles and WT-001 P1 fixes; [Issue #34](https://github.com/connorturansky-svg/crystal-forge/issues/34) | **5fa48fa20200b67938bd84d807022f214fae8973** | [Merged PR #35](https://github.com/connorturansky-svg/crystal-forge/pull/35) |
| 003 | [Isolated SVG-to-3D extrusion engine](./003-svg-extrusion-engine.md) | **Implementation submitted; hosted CI action required**; [Issue #36](https://github.com/connorturansky-svg/crystal-forge/issues/36) | **d78d54681eba6ca0cd9987eda8ce6ec56a3195dc** | [Draft PR #37](https://github.com/connorturansky-svg/crystal-forge/pull/37), not merged |
| 006 | [Interactive 3D Pixel Builder and printable hardware fit](./006-interactive-pixel-builder.md) | **Merged** on 2026-11-18; [Issue #40](https://github.com/connorturansky-svg/crystal-forge/issues/40) | **f7b575eaaac5c2f5f8bb41fff9c54d7594cbdeaa** | [Merged PR #41](https://github.com/connorturansky-svg/crystal-forge/pull/41) |
| 007 | [Visual saved-project gallery](./007-visual-saved-projects.md) | **Merged** 2026-11-18 after green CI; [Issue #43](https://github.com/connorturansky-svg/crystal-forge/issues/43) | **59015ccdd8ebdc48b3bbb1ae0f485ca75376bd7a** | [Merged PR #44](https://github.com/connorturansky-svg/crystal-forge/pull/44) |
| 008 | [Reliable visual Print Centre queue and per-job settings](./008-print-centre-queue.md) | **Merged** 2026-11-18; [Issue #45](https://github.com/connorturansky-svg/crystal-forge/issues/45) | **7473bf73fd46fd4f0c4668c91f80524bded800bf** | [Merged PR #46](https://github.com/connorturansky-svg/crystal-forge/pull/46) |
| 009 | [Named production packs and print-job manifest](./009-print-export-identity.md) | **Merged** 2026-11-18; [Issue #47](https://github.com/connorturansky-svg/crystal-forge/issues/47) | **9e7423dbcd27cdb7c13683a6fe244e32bc4d8548** | [Merged PR #48](https://github.com/connorturansky-svg/crystal-forge/pull/48) |
| 010 | [Rename saved projects in the visual Library](./010-rename-saved-projects.md) | **Owner-approved mini milestone**; [Issue #49](https://github.com/connorturansky-svg/crystal-forge/issues/49) | **Immutable approved SHA pinned in Issue #49** | To be opened as draft PR |
| — | New implementation briefs will be added here after user review | — | — | — |

Create the first entry when we save an approved brief. Past requirements and ongoing Codex sessions are **not** silently reissued or marked complete by this setup.

## How to use

1. ChatGPT writes a **complete Markdown brief** in `prompts/NNN-short-title.md`, using [`TEMPLATE.md`](./TEMPLATE.md), and updates the index. Use a new numbered file for a new milestone; clarify whether a revision supersedes an older brief.
2. Review the brief with the user. Record the status as `draft`, `approved`, `in progress`, `blocked`, `implemented`, or `superseded` truthfully. The approved **commit SHA**, not merely a moving branch name, is the implementation contract.
3. Give Codex the repository path, `planning/prompts`, exact approved commit SHA and file path. Codex must read the entire brief, relevant `AGENTS.md` and current source/tests before coding.
4. Codex implements in a **separate short-lived feature branch based on current `main`** and opens a draft PR. Planning-only commits must not be merged into `main` just to initiate coding.
5. After implementation, link the PR, exact passing CI head and remaining limitations in the index. Preserve the historical approved brief; use an explicit new revision or addendum for changed scope.

## Important guardrails

- GitHub Pages currently deploys on every push to `main` and requires matching production release metadata. Keep all prompt-only changes on `planning/prompts` until deliberate integration.
- Never include passwords, private tokens, personal health information, unlicensed third-party assets or other confidential data in this **public** repository.
- Do not use this planning branch as a code development branch. Avoid concurrent conflicting writes to its prompt files; coordinate edits via Git commits and fetch before updating.
- Prompt documents are instructions to coding assistants, not evidence of implementation. Only source commits, tests and PR review show what is actually built.
- Maintain Crystal Cluster functional/manufacturing parity, real geometry validation, truthful physical-test status, saved-data compatibility, and new version + changelog entries for app releases.

See [`ORCHESTRATION.md`](./ORCHESTRATION.md) for proposed multi-AI roles, approval rights, duplicate-work prevention and scheduling, plus [`ORCHESTRATION_STATUS.md`](./ORCHESTRATION_STATUS.md) for the latest planning snapshot (recheck GitHub before dispatch). See [`WORKFLOW.md`](./WORKFLOW.md) for exact copy/paste Codex handoff instructions, [`TEMPLATE.md`](./TEMPLATE.md) for brief structure, [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) for settled design/technical intentions, and [`HANDOVER_PROTOCOL.md`](./HANDOVER_PROTOCOL.md) for updates required after **every** implementation. A new contributor should start with [`000-contributor-onboarding.md`](./000-contributor-onboarding.md).

**First external contributor:** use [EXTERNAL_AGENT_START.md](./EXTERNAL_AGENT_START.md) and the live [WT-001 starter Issue](https://github.com/connorturansky-svg/crystal-forge/issues/31). Contributor-intake PR #32 is **merged into main**; task forms and the AI PR contract check are live for new `[WT-###]` PRs. Branch protection and external contributor rights still require owner action under [Issue #33](https://github.com/connorturansky-svg/crystal-forge/issues/33).

**Repository:** `connorturansky-svg/crystal-forge`
