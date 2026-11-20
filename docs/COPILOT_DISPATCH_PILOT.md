# WT-005: Copilot issue assignment pilot

This is a one-time, documentation-only test of native GitHub Issue assignment for [WT-005 (#39)](https://github.com/connorturansky-svg/crystal-forge/issues/39), not authorization to enable [automatic dispatch (WT-004)](https://github.com/connorturansky-svg/crystal-forge/issues/38). Only @J-Turansky may initiate the pilot, using their own paid Copilot account. Before assigning, verify that cloud agent is enabled in [Copilot settings](https://github.com/settings/copilot/features) and check the account's usage limits. On the Issue, select **Assignees → Copilot**, review the assignment options, and choose this repository and `main` as the starting branch. No prompt forwarding or credential sharing is needed. If Copilot is missing from the picker, report what appears there rather than using another account or agent. Do not retry the pilot automatically.

## Before coding

Read [AGENTS.md](../AGENTS.md) first, then [docs/AI_HANDOVER.md](AI_HANDOVER.md). Check the assigned Issue, open PRs for duplicate claims, and the relevant approved brief in the [`planning/prompts` branch](https://github.com/connorturansky-svg/crystal-forge/tree/planning/prompts/prompts). For normal production tasks, read the brief at the owner-approved commit, not at the moving branch tip. This pilot takes its scope directly from #39.

## Branch and pull request

Start from the appropriate `main` commit on a separate short-lived branch (the agent branch for this pilot), not from `planning/prompts`. Open a draft PR targeting `main` and review the diff. For normal production tasks, include `Task issue: #<number>` and `Approved spec: prompts/NNN-name.md @ <full 40-character commit SHA>` in the PR description. For this pilot, link #39 and verify that the diff adds only `docs/COPILOT_DISPATCH_PILOT.md`.

`main` is protected. Do not push directly to it, bypass review or required checks, or automatically merge or deploy. A push to `main` can trigger the existing Pages deployment, so production merges require explicit owner authorization. Leave the pilot PR in draft and unmerged.

## Validation and handover

From the repository root (the directory containing `package.json`), run:

```sh
npm run test:static
```

Report the actual result and revision tested. Claim CI passed only with a successful run for the PR's current commit. Static and mesh checks do not prove physical fabrication; claims about printing or fit need evidence from a physical print or fit test.

PR CI separately checks for an app version bump and matching `CHANGELOG.md` and in-app What's New entries, even for documentation-only PRs. That release gate is expected to reject the unchanged metadata in this pilot, even if the local static suite passes. Leave the gate and release metadata untouched; consider handling documentation-only PRs separately as a future workflow improvement.

On #39, link the draft PR and agent session, confirm the changed-file scope, and record any errors or checks that did not run. The collaborator should confirm any usage or billing from their own account, and the owner should confirm whether the live `main` ruleset requires one approval.
