# Wonder Trunks Studio — Orchestration status snapshot

> Updated 2026-11-18 via GitHub connector. **Not live.** Recheck Issues/PRs/CI before assigning work. This file is a read-only planning snapshot; task ownership and status belong to GitHub Issues/PRs.

## External contributor pilot

- **WT-001 / Issue #31:** [Independent AI review of PR #30](https://github.com/connorturansky-svg/crystal-forge/issues/31). Ready to give to a contributor now. Review-only, no code write/merging. [Copy/paste invitation](EXTERNAL_AGENT_START.md).
- **Contributor-intake:** [draft PR #32](https://github.com/connorturansky-svg/crystal-forge/pull/32), staged on `chore/ai-contributor-intake`; Issue forms, PR template, CODEOWNERS and AI PR metadata/duplicate-task check are **not enabled on main** until owner-reviewed merge.
- **Repository permissions:** public read, Issues and PRs enabled, forking allowed. No direct collaborator invitation needed for personal fork + PR. Branch-protection settings could not be changed through current connector and need manual owner configuration.
- **Daily audit:** a ChatGPT automation is enabled for 09:00 Europe/London, beginning 2026-11-19. It inspects PRs, Issues, duplicate claims and CI and reports meaningful blockers, but does **not** dispatch agents or merge. Enabled monitoring depends on its connected environment.
- **Authority:** Only owner approves merging/deployment; no recurring agent dispatch or task assignment is active by default.

## Existing in-flight work

- **Draft PR #30:** [Stage B: Contextual editing and creative Cogs & Gears](https://github.com/connorturansky-svg/crystal-forge/pull/30). Last observed head `c2d000990597aba0a9d5bf6a6abb7f92199a5b28`. One active implementing PR. **Do not launch another Stage B PR or request another AI to implement the same files while this is in progress.** Review its code and exact-head CI when complete.
- **Merged PR #29:** [Unified Wonder Trunks interface](https://github.com/connorturansky-svg/crystal-forge/pull/29). Contextual visual controls were incomplete on first rollout and are within Stage B scope.
- **Legacy Issues #6–#10 and #1** remain open at time of check; they describe earlier fabrication/LED/production phases and an audit. Reconcile their actual remaining acceptance criteria against merged code before adding new tasks, marking closed or creating duplicates. Do not assume their labels reflect current work.

## Candidate future work — not authorised/claimed

| Candidate | Dependency | Duplicate risk | Next action |
|---|---|---|---|
| Expand the six remaining generators with genuine tactile/visual geometry | Stage B architecture accepted | High — Stage B prompt also covers catalogue roadmap | Audit PR #30 deliverables before scoping |
| SVG upload → extrusion → shared Build | Stable generator geometry, shared Build handling | Moderate — already in roadmap | Create owner-reviewed focused prompt |
| STL/OBJ upload → scale, orient, validated mesh Build | SVG/shared geometry conventions | Moderate | Do not dispatch before import feasibility/mesh validation |
| Complete shared direct 3D pixel/manifold tools | Stage B + existing Crystal engine | High — earlier Issues #7, #9 | Reconcile existing implementation with feature tests |
| Combined Library + reliable cross-device workflows | Existing Library/vault; interface parity | Moderate — prior implementation present | Scope only missing behaviours |
| Quick Print and Cura acceptance | Existing Print Centre + prior Issues #6/#8/#10 | High | Audit against true latest code and physical gaps |

## Safe immediate action

Review and complete the active draft PR #30. Do not grant merge authority, create agents, launch schedules or dispatch the above candidate tasks until the owner has approved the orchestration governance and desired cadence.
