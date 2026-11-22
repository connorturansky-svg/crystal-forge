# Historical Codex entrypoint — WT-021 (merged)

> **RETIRED ACTIVE INSTRUCTIONS.** This document preserves the WT-021 source-branch prompt provenance and its original #102 workflow. **PR #102 has merged**. For new work on WT-022, read [current project status](../docs/PROJECT_STATUS.md), [repository map](../docs/REPOSITORY_MAP.md), [AGENTS.md](../AGENTS.md) and [Issue #127](https://github.com/connorturansky-svg/crystal-forge/issues/127). Do not restart the branch named below. The remainder is historic.\n

**Status:** Active implementation; not a completed or deployed release.  
**Repository:** `connorturansky-svg/crystal-forge`. **Only working PR:** [#102](https://github.com/connorturansky-svg/crystal-forge/pull/102), **draft**, branch `wt021/integrated-release`.  
**Prompt archive provenance:** exact numbered briefs and companion documents copied from `planning/prompts`, source commit `f16d4cc8aff3fab95330f330145f67951a1c2bc7`. Original source branch unchanged.

## Codex reading order — fast, but complete

1. [Fast start, targeted test matrix and CI batching](active/WT021_FAST_START.md), then the [single live next action](../docs/WT021_NOW.md). Run `npm run wt021:status`.
2. [Active implementation instruction](active/WT021_EXECUTION.md) and [overnight runbook](active/WT021_OVERNIGHT_RUNBOOK.md), including one-time access checks and recovery.
3. [Original full WT-021 approved specification](021-complete-seven-builder-manufacturing-parity.md) — initially read in full; subsequently consult only relevant sections without replacing requirements with a summary.
4. [24-row acceptance register (23 original + UX-01)](../docs/WT021_COMPLETION_REGISTER.md), [engineering handover](../docs/WT021_CODEX_HANDOFF.md) and [independent source audit](../docs/WT021_INDEPENDENT_AUDIT.md).
5. [UX-01 catalogue acceptance](../docs/WT021_FEATURE_CATALOGUE_BRIEF.md) and [owner overnight summary](../docs/WT021_OVERNIGHT_SUMMARY.md) — additional owner-approved P1/reporting requirements.
6. [AGENTS.md](../AGENTS.md) and [testing guide](../docs/TESTING.md) for standing guardrails. Read the **latest relevant** [durable log](../docs/WT021_RUN_LOG.md) checkpoint rather than replaying its entire history.
7. Confirm exact current head and checks, then implement the next unverified P0/P1 acceptance task without routine approval requests.

**Boundaries:** No new PR, no merge, no deployment, no changes to `main`, no work on #90, no unsupported physical-fit claims. Keep unfinished software under [#79](https://github.com/connorturansky-svg/crystal-forge/issues/79) and original STL/Cura/printed verification under [#10](https://github.com/connorturansky-svg/crystal-forge/issues/10). A green existing test suite does not mean the missing seven independent user journeys exist.

## Numbered milestone briefs — original source files

| Brief | Document |
| --- | --- |
| Contributor and AI onboarding | [`000-contributor-onboarding.md`](000-contributor-onboarding.md) |
| WT-001 — independent PR review | [`001-independent-pr-review-pilot.md`](001-independent-pr-review-pilot.md) |
| WT-002 — six-family creative catalogue | [`002-six-family-creative-expansion.md`](002-six-family-creative-expansion.md) |
| WT-003 — SVG extrusion | [`003-svg-extrusion-engine.md`](003-svg-extrusion-engine.md) |
| WT-006 — interactive 3D Pixel Builder | [`006-interactive-pixel-builder.md`](006-interactive-pixel-builder.md) |
| WT-007 — visual saved projects | [`007-visual-saved-projects.md`](007-visual-saved-projects.md) |
| WT-008 — Print Centre queue | [`008-print-centre-queue.md`](008-print-centre-queue.md) |
| WT-009 — print-export identity | [`009-print-export-identity.md`](009-print-export-identity.md) |
| WT-010 — rename Library projects | [`010-rename-saved-projects.md`](010-rename-saved-projects.md) |
| WT-011 — modular assembly (held workstream) | [`011-modular-assembly.md`](011-modular-assembly.md) |
| WT-012 — shared routing | [`012-creative-catalogue-shared-routing.md`](012-creative-catalogue-shared-routing.md) |
| WT-013 — light-path inspection | [`013-prepared-light-path-inspector.md`](013-prepared-light-path-inspector.md) |
| WT-014 — compact editor layout | [`014-pixel-model-maker-layout.md`](014-pixel-model-maker-layout.md) |
| WT-015 — collections and templates | [`015-library-collections-templates.md`](015-library-collections-templates.md) |
| WT-016 — cross-device sync | [`016-safe-cross-device-sync.md`](016-safe-cross-device-sync.md) |
| WT-017 — seven-family pixel Build | [`017-seven-family-pixel-build.md`](017-seven-family-pixel-build.md) |
| WT-018 — repository consolidation | [`018-repository-consolidation-and-parity.md`](018-repository-consolidation-and-parity.md) |
| WT-019 — full shared editor parity | [`019-true-studio-model-parity.md`](019-true-studio-model-parity.md) |
| WT-020 — verified software release requirements | [`020-final-software-parity-release.md`](020-final-software-parity-release.md) |
| WT-021 — current complete manufacturing parity contract | [`021-complete-seven-builder-manufacturing-parity.md`](021-complete-seven-builder-manufacturing-parity.md) |

**Source numbering note:** `004` and `005` do not exist as standalone numbered Markdown files in the `planning/prompts` source snapshot. They have **not** been recreated from memory. Related earlier implementation plans and test guides are retained under [docs history](../docs/history/README.md), including [PR5 master plan](../docs/PR5_MASTER_IMPLEMENTATION_PLAN.md).

## Supporting and historical planning records

- [Prompt library original index / historical statuses](README.md) — retains prior handover instructions; dated status statements must be rechecked.
- [Project context and accepted UX decisions](PROJECT_CONTEXT.md), [owner priority review](OWNER_PRIORITY_REVIEW_2026-11-18.md), [WT-015/016 overnight handover](OVERNIGHT_015_016.md).
- [Agent orchestration rules](ORCHESTRATION.md), [status snapshot](ORCHESTRATION_STATUS.md), [handover protocol](HANDOVER_PROTOCOL.md), [workflow](WORKFLOW.md), [prompt template](TEMPLATE.md), [external-agent guide](EXTERNAL_AGENT_START.md).
- [Independent WT-001 review record](reviews/WT-001-stage-b-review.md).
- [Historical prompts index](archive/README.md), [repository documentation guide](../docs/README.md).

**Do not reinterpret an archived prompt as permission to implement a new task.** The explicitly approved current work is WT-021 inside PR #102.
