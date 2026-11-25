# Owner operations and manual contributor handoff

Owner decision 25 November 2026: retire automatic Copilot dispatch. Manual prompts for Jordan's chosen AI are sufficient. Do not assign tasks to a contributor account, implement dispatch workflows, store contributor tokens, or assume subscription/billing consent. Historical #33/#38/#39 are preserved in GitHub; their auto-dispatch proposal is retired, not implemented.

## Owner-only repository checks (pending)

- [ ] Verify live main rulesets: PR-only changes, appropriate independent review, static/browser/Manifold checks, conversation resolution, no force push/delete, bypass and fork workflow policies. CODEOWNERS alone is not proof of enforcement.
- [ ] Confirm collaborator access only if still desired, using least privilege; confirm intellectual property/licensing and attribution, including Jordan's earlier contribution. Never share credentials.
- [ ] Review the historical documentation pilot #42 if still useful; do not rerun, assign or claim billing/approval verification. No further automated Copilot work planned.
- [ ] Owner alone approves merges, deployment and physical product sign-off. This document does not modify live repository settings.

## Manual contributor workflow

1. Choose an isolated task with a clear scope and verify live main, branch claims, active PR ownership and existing tests. Avoid parallel edits to the same files.
2. Send Jordan a prompt with repository, immutable baseline SHA, task/PR, required behaviour, protected invariants, relevant source paths, tests, expected output and explicit no-auto-merge instruction. Jordan chooses and operates his own AI/account.
3. Contributor creates or updates a focused draft PR with commits, test logs, screenshots as applicable, and limitations. Reconcile with current main; owner reviews exact-head evidence and merges only when approved.

Prompt template:

```text
Repository: connorturansky-svg/crystal-forge
Task / existing PR: [specific assignment]
Baseline main: [verified SHA]
Read AGENTS.md, AI handover, acceptance spec and affected files.
Implement [requirements]; do not touch [other branch ownership].
Preserve saved data and preview vs manufacturing separation.
Run relevant static, browser and Manifold checks; record exact SHA and URLs.
Update relevant guide/help/release metadata if product behaviour changes.
Publish a focused draft PR with evidence and unresolved limitations.
Do not merge, deploy, or use anyone else's credentials.
```
