# Wonder Trunks Studio — Prompt Library

> **Planning branch:** `planning/prompts` · **Code/deployment branch:** `main`

This folder is the GitHub-backed source of truth for **future approved Codex development briefs** for Crystal Forge / Wonder Trunks Sensory Model Studio. It complements, rather than replaces, `AGENTS.md`, `docs/AI_HANDOVER.md`, the accepted design decisions, the roadmap and the source/tests.

**Do not treat a file's presence as permission to implement it.** The user's explicit go-ahead, an agreed scope, and a particular version of that file are required.

## Brief index

| ID | Brief | Status | Approved revision | Implementation PR |
|---|---|---|---|---|
| 000 | [Fresh contributor / AI onboarding](./000-contributor-onboarding.md) | Reference — always read first; **not a coding task** | No implementation approval needed | — |
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

**Repository:** `connorturansky-svg/crystal-forge`
