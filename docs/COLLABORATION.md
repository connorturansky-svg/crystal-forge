# ChatGPT Chat + Codex Desktop collaboration workflow

**Goal:** continue fast AI-assisted development without losing project intent or overwriting another agent's changes. Repo: `connorturansky-svg/crystal-forge`.

## Source of truth and production guardrail

- **GitHub main** contains the authoritative committed production source and documentation.
- `.github/workflows/pages.yml` publishes **every push to main** to GitHub Pages. Do not commit unfinished code directly there.
- Each discrete task uses a short-lived branch: `feat/....` for functionality, `fix/....` for regressions, `docs/....` for documentation and `test/....` for test infrastructure.
- A GitHub PR is the review/merge boundary. Keep one task/PR focused, particularly for geometry changes.
- For locally running Codex, prefer a separate Git worktree (or at least a clean branch) per simultaneous task. Do not have ChatGPT GitHub write and local Codex work on the **same** branch concurrently.

## Suggested routine — Codex Desktop

Use the desktop application's local folder/project workflow to open or clone the repository and give Codex the initial instruction: **read `AGENTS.md` and `docs/AI_HANDOVER.md` before changing code**. Enable terminal access as appropriate for local testing.

Commands, run in a terminal in a locally cloned repo:

```sh
git fetch origin
git status --short --branch
git switch main
git pull --ff-only origin main
git switch -c feat/short-specific-task
# Optional parallel isolation:
# git worktree add ../crystal-forge-some-task -b fix/specific-regression origin/main
npm install
npm run test:static
npm test
python3 -m http.server 4321
# In a second terminal: npm run test:browser
```

Before pushing: inspect `git diff` and test outputs, commit, `git fetch origin`, review conflicts, and open a PR to main. Never reset or force-push over work not understood. A worktree preserves a separate independent working tree for each active task.

## Suggested routine — ChatGPT Chat with GitHub connector

1. Fetch main ref/tree and any active PRs. Read `AGENTS.md`, `docs/AI_HANDOVER.md`, source and relevant specs **from the latest ref**.
2. Create a new feature/fix branch rooted at the known main commit. Use GitHub API/Git objects to write files and commit to that branch with an expected-head check.
3. Run checks by PR-enabled GitHub Actions. Do not claim to have browsed the site directly unless a real browser tool was used; distinguish CI logs/screenshots from visual human inspection.
4. Open a PR with changed behaviour, tests run and explicit manual checks required. If code needs a local repro, hand the branch to Codex for interactive debugging rather than guessing.
5. Only merge after review, with checks green for that exact commit. Update AI handover and link the PR.

## When switching assistants mid-task

- Commit and push any **finished** coherent work to the task branch, leaving unfinished state described in `docs/AI_HANDOVER.md` and PR notes.
- Tell the next assistant: repo, branch, exact head SHA, intended feature, changed files, current blockers, test evidence (run URLs), assumptions and next smallest safe step.
- If there are uncommitted Codex changes, **do not** treat the remote branch as containing them. ChatGPT should not overwrite that branch; Codex either commits/pushes a safe WIP on its own branch or carries its local work forward.
- If ChatGPT and Codex made different versions, compare commits and manually reconcile on a fresh integration branch; never use blind overwrite or a forced update.

## Review rules

- Cosmetic docs-only changes: quick self-review + static checks, PR merge after review.
- New geometry, export, camera or hardware features: PR with affected spec/decision updates, math/Manifold/browser checks, screenshot evidence where useful, and a Cura/manual test plan.
- Breaking migrations or changes to the printed fabrication output: request explicit user signoff before merging.
- CI must identify the **commit** it tested. A green previous main run does not validate a PR head. For independent PRs, re-test after resolving merge conflicts.

## Living documentation without busywork

At start: AGENTS → HANDOVER → feature/architecture/decisions and relevant source.
At end: HANDOVER always; feature specs/roadmap when requirements or status change; design decisions for significant trade-offs; history/changelog for milestones; architecture only for actual architecture changes. Minor typo/refactor does not require nine files edited.

## Keeping Pages stable

The deployment is main-only. Existing fabric/browser workflows were originally main-push only; PR checks should be added and browser CI's log-writing step restricted to main pushes. Nothing on this documentation branch should trigger production deployment. GitHub branch protections/check requirements may need to be enabled manually in repository settings if desired; do not assume they are configured.

## First Codex Desktop setup (manual)

- Install/sign into Codex Desktop and authenticate GitHub if needed; clone/open the local repo.
- Verify `git remote -v` points to the intended repository and `main` tracks `origin/main`.
- Read AGENTS and HANDOVER with Codex and ask it to run the static and browser/geometry suites locally.
- Keep `main` clean; branch for every feature. Use GitHub PRs to pass work between both assistants.
