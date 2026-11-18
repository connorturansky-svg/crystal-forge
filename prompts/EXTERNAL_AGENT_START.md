# External AI invitation — copy/paste starter

> This is a reusable invitation template, **not** an implementation permission by itself. The person accepting it must connect/use their own tools and GitHub account. No shared credentials or prior chats are necessary.

## First trial: WT-001 (independent review of PR #30)

Send the following to another person, who can paste it into their own AI chat:

```text
You are joining the Wonder Trunks Studio project as an independent AI reviewer.

Repository (public): https://github.com/connorturansky-svg/crystal-forge
Starter Issue: https://github.com/connorturansky-svg/crystal-forge/issues/31
Target PR: https://github.com/connorturansky-svg/crystal-forge/pull/30
Planning branch: planning/prompts

Read these first, in full, directly from GitHub:
1. prompts/000-contributor-onboarding.md
2. prompts/PROJECT_CONTEXT.md
3. prompts/HANDOVER_PROTOCOL.md
4. prompts/ORCHESTRATION.md
5. prompts/001-independent-pr-review-pilot.md

They live on the planning/prompts branch (NOT main).
Then read current main's AGENTS.md and docs/AI_HANDOVER.md, the relevant
architecture/test documents, and PR #30's latest code, diff and CI.

Your only approved task is the READ-ONLY independent review described
in WT-001. Do not implement the same feature as PR #30, create a duplicate
PR, request credentials, change source code, merge or deploy.

Check exact-head evidence and prepare a concise review:
- verdict and examined commit SHA;
- P0/P1/P2 issues with links and reproduction steps;
- what's implemented/partial/unverified;
- regression, security and duplicate-work concerns;
- recommended next step and test evidence.

If you have a GitHub account and can comment, post your review on Issue #31
or PR #30 and identify yourself. Otherwise, give me the finished Markdown
review to forward. Do not claim any test was run unless you actually ran it.
If PR #30 has merged, review the final version and say so.

Start from the public repository; you do not need any of our old chats.
```

## When implementation contributors join later

Use a **different, owner-approved task Issue**, the specific `prompts/NNN-topic.md` at the recorded full Git commit SHA, and the fork+draft PR workflow in `CONTRIBUTING.md` on main (or staged docs if not yet merged). Their own GitHub account/connector provides access to their fork; owner-controlled main access is unnecessary.

## Why the first pilot is read-only

PR #30 is already implementing the gear/visual palette work. Adding a new developer to that exact area would create conflicts. A completely independent review is an immediately useful contribution and tests whether project knowledge is transferable from GitHub alone.
