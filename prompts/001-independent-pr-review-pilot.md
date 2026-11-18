# WT-001 — Independent AI review pilot for PR #30

> **Status:** Owner-authorised onboarding pilot — read-only code review; no implementation, no repository merge.
> **Target:** https://github.com/connorturansky-svg/crystal-forge/pull/30
> **Planning branch:** `planning/prompts`
> **Approval:** The owner approved setting up external AI contribution and an immediate handoff path. This brief permits only independent review, not changing production source.
> **Initial context date:** 2026-11-18 (refresh all SHA and CI status before reporting)

## Purpose

Prove that a completely new contributor, knowing nothing of our chats, can learn Wonder Trunks Studio from repository documentation, inspect a real active development PR, identify meaningful issues, and provide a reproducible, actionable independent review — without duplicating Codex's implementation work.

PR #30 implements the Stage B contextual Design/Build editing palette and creative Cogs & Gears. It is already owned by another coding agent. **Do not create another implementation PR for the same feature.**

## Before review

1. Read `prompts/000-contributor-onboarding.md`, `prompts/PROJECT_CONTEXT.md`, `prompts/HANDOVER_PROTOCOL.md`, `prompts/ORCHESTRATION.md` from `planning/prompts`.
2. Read `AGENTS.md`, `docs/AI_HANDOVER.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/TESTING.md` from `main`.
3. Check PR #30's latest head SHA, CI status, changes, screenshots and discussion. Read the actual source/test changes; don't accept PR description claims as evidence. Check for conflicts with other open PRs and Issues #1, #6–#10 where relevant.
4. If PR #30 is merged or closed by the time you start, review its final merged code and report that status rather than assuming it is still a draft.

## Independent acceptance review

### Visual and interaction (actual code/evidence)
- Does the centre-lower palette present real, contextual choices/sliders rather than just links to right-hand settings?
- Are overall-model and selected-part states distinct? Do controls sync with precise right-hand values, saved model state, Undo/Redo and real 3D updates?
- Does the current-model workflow remain stable across Home, Design, Build, Library, Quick Print, resizing and focus?
- Are button actions, keyboard navigation, focus, tooltip semantics, and light-mode contrast usable? Report missing evidence separately from defects.

### Real creative geometry
- Are six gears **structurally different** (spoke and window topology, rim/hub depth, silhouette), not merely tooth-count variants?
- Can styles be combined/editable? Are mechanical properties honestly separated from purely decorative features?
- Are geometry, validity checks, applied pixel bores and export consistent? Preserve Crystal Cluster invariants.

### Regression and traceability
- Inspect saved-data compatibility and old project loading where evidence exists.
- Cite exact commit/test results for static, Chromium and Manifold; inspect failed/untested cases.
- Confirm version, changelog and handover match actual code.
- Document physical Cura/print/fit verification as **not proven by CI**.

## Deliverable

Provide a structured Markdown review to the owner (and optionally PR #30 / GitHub Issue when your GitHub account has comment permissions):
1. Executive summary: pass / changes requested / inconclusive, specifying exact examined commit.
2. P0 blockers, P1 important defects, P2 enhancements, each with source links, reproductions, impact and suggested tests.
3. Requirements that pass (with evidence), are partial, and are not tested.
4. Duplicate-work/dependency risks.
5. Suggested next step and whether PR #30 is safe for owner review/merge.

**Do not** push code, request/approve merges, auto-create branches, install tools, solicit tokens, change contributor permissions, publish secrets or modify Issues without explicit permission. Never assert an inspection/test occurred unless you actually saw the evidence.

## Collaboration permissions

- Public read access: no GitHub account needed to view sources.
- To post comments, the person must sign in to GitHub (or connect their own authorised GitHub tool). If posting is unavailable, return the review to the person who invited you; they can paste it into the PR.
- Fork/PR flow is deliberately unnecessary for this first review pilot. Future implementation assignments may use a personal fork, separate feature branch and draft PR.
