# Contributing to Wonder Trunks Studio

Thanks for helping build Wonder Trunks Studio, formerly Crystal Forge.

**Current work:** Read [project status](docs/PROJECT_STATUS.md) → [repository map](docs/REPOSITORY_MAP.md) → the assigned issue and its current acceptance. WT-021 #102 and WT-022 #128/#132/#134 have merged; **do not restart their implementation or use the old WT-021 prompt archive as an active branch instruction**. The next manufacturing-quality software task is FIT-02 under [#79](https://github.com/connorturansky-svg/crystal-forge/issues/79), and real printed-fit acceptance remains with the owner under [#10](https://github.com/connorturansky-svg/crystal-forge/issues/10). The fork/own-draft-PR process below remains the default for independent contributors. **No merge or deployment is authorised by this guide.**

**New contributor?** Start with the [onboarding guide on `planning/prompts`](https://github.com/connorturansky-svg/crystal-forge/blob/planning/prompts/prompts/000-contributor-onboarding.md) and the [AI orchestration charter](https://github.com/connorturansky-svg/crystal-forge/blob/planning/prompts/prompts/ORCHESTRATION.md). You do not need our ChatGPT conversation history.

## Access and permission model

- **Read/review:** The repository is public. An AI or human can read it without credentials. A GitHub account is needed to post issue/PR comments.
- **Code contributions:** Fork the repository under **your own GitHub account**, use a separate branch, and propose changes via a **draft pull request** to `main`. Do **not** request the owner's password, token, or direct write access. If your assistant cannot open a PR, produce a patch and review report for your human to submit.
- **Direct collaborator access:** Not required for the fork workflow. Additional access can only be granted by the repository owner through GitHub; this guide does not grant it.
- **Merging and deployment:** Only the owner or an explicitly delegated maintainer can merge. GitHub Pages deploys on pushes to `main`. Neither green CI nor another AI's approval authorises merging.
- **Source rights:** This repository's source is **all rights reserved**, not open source. The right to view/fork via GitHub does not grant general redistribution or reuse rights. Contributors must only submit code/design/assets they are authorised to provide. Ownership or licensing terms for any substantial third-party contribution must be resolved with the project owner before merge.

## Before claiming an implementation task

1. Read `AGENTS.md`, `docs/AI_HANDOVER.md`, source/tests, and the relevant approved specification under `planning/prompts/prompts/`.
2. Check current `main`, open [Issues](https://github.com/connorturansky-svg/crystal-forge/issues), open [PRs](https://github.com/connorturansky-svg/crystal-forge/pulls) and current task claims; avoid duplicating active work.
3. Claim the assigned task by commenting `CLAIM WT-### — @username — branch/fork — intended files` on its Issue. Wait for an explicit owner/orchestrator assignment if the task has another active implementer or unclear boundaries.
4. Obtain a **full pinned planning commit SHA** for the approved brief. A prompt being present in GitHub does not mean anyone may implement it.
5. Fork and branch from appropriate current `main`, not `planning/prompts`. Never push directly to `main` or another contributor's branch.

## Implementation and handover

- Honour Crystal Cluster regression guarantees, actual mesh and hardware geometry, saved-project compatibility and physical safety limits.
- Run applicable static, browser, Manifold/fabrication tests; report **exact SHA and CI links**. Manual Cura, printed fit, optical/tactile/mechanical checks remain separate.
- A draft PR must link its **task Issue** and the exact approved prompt revision, disclose overlaps and list tests/limitations.
- Update `docs/AI_HANDOVER.md` and relevant architecture/roadmap/design/testing/acceptance documents for nontrivial changes. See `prompts/HANDOVER_PROTOCOL.md` on `planning/prompts`.
- Do not add placeholder buttons or claim a feature is complete based only on screenshots.
- Prefer least-privilege credentials. Never share or commit secrets, tokens, private files or sensitive personal information.

## Your first low-risk task

[WT-001: independent AI review of PR #30](https://github.com/connorturansky-svg/crystal-forge/issues/31) is a **read-only review pilot**, not an invitation to implement duplicate code. It can be performed without write access, and findings can be returned as Markdown when GitHub commenting is unavailable.

## Documentation and tooling

- [Prompt library](https://github.com/connorturansky-svg/crystal-forge/tree/planning/prompts/prompts)
- [Orchestration charter](https://github.com/connorturansky-svg/crystal-forge/blob/planning/prompts/prompts/ORCHESTRATION.md)
- [Contributor access and owner protection checklist](docs/AI_CONTRIBUTOR_ACCESS.md)

Contact the owner via the relevant GitHub Issue before proposing changes outside an assigned task.
