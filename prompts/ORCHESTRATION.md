# Wonder Trunks Studio — Multi-AI orchestration charter

> **Status:** proposed governance / safe defaults, 2026-11-18. Owner approval is required before enabling agent scheduling, assigning external contributors or changing merge permissions.
> **Orchestrator:** ChatGPT acting through the connected GitHub account **only during active conversations or explicitly configured scheduled automations**. This file does not install an autonomous always-running agent.

## Mission

Coordinate human contributors and their independent AI assistants using GitHub as the durable collaboration surface. Convert user-approved goals into bounded, non-duplicative tasks; attach immutable specifications; schedule tasks in dependency order; review evidence; maintain truthful project context and handover. The owner controls final production merges and access rights.

## Single sources of truth

| Kind | Source | Rule |
|---|---|---|
| Committed production code and tests | `main` | A passing CI run applies to its exact SHA only |
| Product decisions / prompt contracts | `planning/prompts/prompts/` | Approved full SHA pin; no task authority merely from file presence |
| Active implementation and review | GitHub Issues + draft PRs | Each task gets a unique ID and one current implementation PR unless deliberately split |
| Current technical handover | `docs/AI_HANDOVER.md` in implementation PR/main | Include intent, changed modules, test URLs, defects, next steps |
| Planning status dashboard | `prompts/ORCHESTRATION_STATUS.md` | Human-readable snapshot, **not** a lock or live source |
| Releases | `main`, `CHANGELOG.md`, in-app What's New | Require approval and new release metadata; never merge merely because tests are green |

## Roles and authority

- **Owner (human):** approves briefs, priorities, contributors and permissions; authorises final merge/deployment; resolves conflicting creative direction.
- **Orchestrator (ChatGPT):** research + specification, issue/PR search, candidate deduplication, proposed priority and timing, agent handoff instructions, PR review recommendations, CI check, follow-up status reports. Can post Issues, comments, planning files and draft PRs when authorised via the connected account. **Cannot confer GitHub permissions or force independently owned AI sessions to run.**
- **Contributor / contributor AI:** reads onboarding + pinned approved brief, checks task claim, works in separate branch or fork, opens draft PR with task ID, tests, screenshots, migration notes and handover documentation. May not self-approve own work.
- **Reviewer / independent AI:** audits diff, acceptance matrix, actual branch head, code safety, saved-data migration, UI consistency and geometry/manufacturing. Logs precise findings; review is advisory and does not substitute for owner authorisation.
- **CI:** enforces mechanical gates after workflows/branch rules are installed; CI green does not establish physical print validity.

## Task lifecycle

`idea → drafted → owner-approved → ready → claimed → in-progress → review → verified → owner-merged → documented`

Additional states: `blocked`, `superseded`, `cancelled`.

Each dispatched task must include:
- task ID, title, source issue URL, immutable approved `prompts/NNN-*.md @ <SHA>`, owner approval;
- component scope, files likely touched, explicit exclusions, dependencies and known overlapping Issues/PRs;
- one assignee or owning team; a claim comment identifying actor, branch and intended work area;
- acceptance criteria, expected tests, screenshot/prototype evidence and deadline/priority when agreed;
- draft PR URL and exact checked head SHA when submitted;
- handover update requirements per `prompts/HANDOVER_PROTOCOL.md`.

### Duplication avoidance and collisions

Before starting or dispatching **every** task:
1. Query open GitHub Issues, PR titles/bodies, branch names and the prompt index; compare intent, acceptance criteria and affected components with older issues **and latest source**.
2. Reconcile any task that is already partially completed; don't create a new Issue if an existing Issue can be updated.
3. Claim a unique task ID in a GitHub Issue, link the assigned user and active PR. A claim is a coordination signal, **not a race-safe distributed mutex**; check again just before creating a branch/PR.
4. Two AI instances may work in parallel only when their file/API boundaries are documented, or after an explicit integration owner agrees how conflicts will be reconciled.
5. Never let two agents push to the same branch. Do not overwrite an existing worktree/commit; require rebasing on current main before acceptance.
6. If two PRs overlap, halt duplicate dispatch; designate one canonical PR and convert the other into review, an additive patch or a superseded task after owner sign-off.

## Timing and scheduling

**Recommended cadence, not activated automatically:**
- On demand: when a new prompt, issue or PR appears, search for overlaps and report the next unblocked task.
- Daily (suggested morning UK time): audit open PRs, CI failures, blocked tasks, recent source changes and claim conflicts.
- Weekly (suggested Monday): update dependency order, outstanding creative/fabrication risks and owner decisions.
- Avoid dispatching work on APIs or code being rewritten by an active integration PR.

A ChatGPT conversation is **not** an always-on service. Future automatic checks require explicit Automations/runner setup with authorised access. Launching other people’s Codex/AI requires their own action or a separately configured, authenticated service; GitHub cannot independently cause arbitrary external chat agents to execute tasks.

## Proposed merge/release policy

- Contributors may open **draft PRs** from their own authorised branch/fork.
- Require a linked approved issue+spec, CI green on latest head, reviewer sign-off and a completed `docs/AI_HANDOVER.md` update before recommending merge.
- For geometry: Manifold source/connectedness/cutouts/volume and STL/3MF checks; manual Cura/physical qualification remains a separate check.
- Default: only the **owner** (or another explicitly designated maintainer) can merge to `main`. The orchestrator or contributors never auto-merge, auto-deploy or bypass protection.
- Configure GitHub branch protection/rulesets, required status checks, review requirement and CODEOWNERS separately on main after owner review; this document alone does **not** enforce them.
- Every production update needs new app version and matching CHANGELOG + What's New as already required.

## External contributor access and licensing

The repo's README says the source is public but **all rights reserved**, not offered as open source. Permission to read/fork does not automatically grant a licence to reuse/distribute contributions. Before inviting outsiders, the owner should agree contributor terms (scope and intellectual-property rights), any CLA/DCO policy, a `CONTRIBUTING.md`, code of conduct where appropriate, and whether contributors work via forks (least privilege) or restricted collaborator permissions.

Do not store private profile tokens, passwords, collaborator credentials, unpublished client files, private designs or sensitive information in a public issue/brief. External contributors must authenticate through **their own** GitHub accounts and keep secrets outside the repo.

## What this charter DOES NOT do yet

- It does not schedule or execute agents, issue real task leases, install a GitHub App, create permissions, enforce branch rules or turn on automerge.
- It does not approve future tasks or claim completion of PRs.
- It does not authorise implementing the current Stage B work again: inspect PR #30 before any overlapping dispatch.

See `prompts/ORCHESTRATION_STATUS.md` for the most recent observed snapshot and `prompts/WORKFLOW.md` for the Codex handoff format.
