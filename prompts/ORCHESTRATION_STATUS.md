# Wonder Trunks Studio — Orchestration status snapshot

> Updated 2026-11-18 via GitHub connector. **Not live.** Recheck Issues/PRs/CI before assigning work. This file is a read-only planning snapshot; task ownership and status belong to GitHub Issues/PRs.

## External contributor pilot

- **WT-001 / Issue #31:** [Independent AI review of PR #30](https://github.com/connorturansky-svg/crystal-forge/issues/31). Ready to give to a contributor now. Review-only, no code write/merging. [Copy/paste invitation](EXTERNAL_AGENT_START.md).
- **Contributor-intake:** [merged PR #32](https://github.com/connorturansky-svg/crystal-forge/pull/32). Issue forms, PR template, CODEOWNERS and AI PR metadata/duplicate-task checks are now on `main`; branch protection/rulesets still require owner administration via Issue #33.
- **Repository permissions:** public read, Issues and PRs enabled, forking allowed. No direct collaborator invitation needed for personal fork + PR. Branch-protection settings could not be changed through current connector and need manual owner configuration.
- **Daily audit:** a ChatGPT automation is enabled for 09:00 Europe/London, beginning 2026-11-19. It inspects PRs, Issues, duplicate claims and CI and reports meaningful blockers, but does **not** dispatch agents or merge. Enabled monitoring depends on its connected environment.
- **Authority:** Only owner approves merging/deployment; no recurring agent dispatch or task assignment is active by default.

## WT-002 — Next owned implementation

- **WT-002 / Issue #34:** [Six-family creative geometry expansion](https://github.com/connorturansky-svg/crystal-forge/issues/34), approved as continuation of Stage B's programme. Specification: `prompts/002-six-family-creative-expansion.md`. Codex should claim after checking existing Issues and current PRs; open a distinct **draft PR** on `main` with the full pinned spec SHA. This does not duplicate independent review WT-001.
- PR #30 and #32 are merged on `main` as of 2026-11-18; last verified main `948cd5ac31330fc1c7da3f1386c9ad60e0328361`.
- **Issue #33:** owner still needs to configure enforceable protection for `main` and contribution/IP terms.

## Existing in-flight work

- **Merged PR #30:** [Stage B: Contextual editing and creative Cogs & Gears](https://github.com/connorturansky-svg/crystal-forge/pull/30). External review WT-001 remains a separate read-only assignment; do not re-implement Stage B.
- **Merged PR #29:** [Unified Wonder Trunks interface](https://github.com/connorturansky-svg/crystal-forge/pull/29). Contextual visual controls were incomplete on first rollout and are within Stage B scope.
- **Legacy Issues #6–#10 and #1** remain open at time of check; they describe earlier fabrication/LED/production phases and an audit. Reconcile their actual remaining acceptance criteria against merged code before adding new tasks, marking closed or creating duplicates. Do not assume their labels reflect current work.

## Candidate future work — not authorised/claimed

| Candidate | Dependency | Duplicate risk | Next action |
|---|---|---|---|
| Expand six remaining generators with genuine tactile/visual geometry | Stage B merged | Scoped and owner-approved as WT-002 | Codex claim Issue #34 and follow pinned specification |
| SVG upload → extrusion → shared Build | Stable generator geometry, shared Build handling | Moderate — already in roadmap | Create owner-reviewed focused prompt |
| STL/OBJ upload → scale, orient, validated mesh Build | SVG/shared geometry conventions | Moderate | Do not dispatch before import feasibility/mesh validation |
| Complete shared direct 3D pixel/manifold tools | Stage B + existing Crystal engine | High — earlier Issues #7, #9 | Reconcile existing implementation with feature tests |
| Combined Library + reliable cross-device workflows | Existing Library/vault; interface parity | Moderate — prior implementation present | Scope only missing behaviours |
| Quick Print and Cura acceptance | Existing Print Centre + prior Issues #6/#8/#10 | High | Audit against true latest code and physical gaps |

## Safe immediate action

Proceed with WT-002 on its own feature branch once the approved spec SHA is pinned in Issue #34. Do not dispatch overlap with WT-001 read-only review, or self-merge; finish owner protection settings tracked under Issue #33.
