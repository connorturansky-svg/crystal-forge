# Prompt Library — Operating Procedure

## Boundaries
The authoritative **planning** documents are on `planning/prompts` inside `prompts/`. The **application** lives on `main`, which deploys on every push and checks release version/What's New. Keep planning-only commits off main. An approved prompt is an implementation contract **at an exact Git SHA**, not at a mutable branch tip.

## Preparing a future prompt
1. Check current main, ongoing PRs and `prompts/README.md`.
2. Read `prompts/PROJECT_CONTEXT.md`, `prompts/HANDOVER_PROTOCOL.md` and the project source/handover. Avoid repeating completed work.
3. Create `prompts/NNN-topic.md` using `TEMPLATE.md`, and update the index. Mark draft until the user approves.
4. After approval, record approval and the full pinned revision SHA; provide the short Codex instruction below.
5. If scope changes, create a new revision/addendum and reapprove/pin; never silently change a live task.
6. Avoid conflicting concurrent updates to the planning branch; re-fetch its latest blob SHA before editing.

## Short Codex instruction (after approval)
```text
Repo: connorturansky-svg/crystal-forge
Read onboarding: prompts/000-contributor-onboarding.md from planning/prompts.
Read approved prompt: prompts/NNN-topic.md at pinned planning commit <FULL_SHA>.
Also read AGENTS.md and docs/AI_HANDOVER.md on latest main and inspect
actual code, open PRs, tests and docs.
If your checkout is main-only, fetch planning/prompts and read via:
  git fetch origin planning/prompts
  git show <FULL_SHA>:prompts/NNN-topic.md
Work on a separate implementation branch based on appropriate current main.
Implement and test the approved scope, update cross-AI handover docs,
open a draft PR, include exact SHA/CI/evidence and unresolved work.
Do not merge or deploy without explicit approval.
```

## Completing a task
- Implementation PR links to the approved `prompts/NNN-topic.md @ SHA`.
- PR updates source/test/release documentation AND `docs/AI_HANDOVER.md` with what happened and why. A handover update is an **acceptance criterion**.
- PR author reports static, browser, geometry/fabrication checks on the exact head and separates unperformed Cura/physical verification.
- Following review, update prompt index with PR, status and tested SHA; retain original approved specification and provide links to changes/addenda.
- If a contributor is blocked, document the blocker and partial work; do not claim the entire task complete.

## Security and collaboration
- Public repository: never commit secrets, sensitive user information or unlicensed reference imagery.
- Each person/AI has its own worktree and branch. Never have two agents unknowingly edit the same branch.
- If another contributor arrives, they should begin with `prompts/000-contributor-onboarding.md`, not an old chat transcript.
- `AGENTS.md` and docs on main may be older than planning context; compare with latest explicit user-approved brief and real code, and record contradictions.
