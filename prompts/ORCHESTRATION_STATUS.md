# Wonder Trunks Studio — Orchestration status snapshot

> Updated 2026-11-18 via GitHub connector. **Not live.** Recheck Issues/PRs/CI before assigning work. This file is a read-only planning snapshot; task ownership and status belong to GitHub Issues/PRs.

## External contributor pilot

- **WT-001 / Issue #31:** [Independent AI review of PR #30](https://github.com/connorturansky-svg/crystal-forge/issues/31). **Independent review delivered**; [archived reproducible findings](reviews/WT-001-stage-b-review.md) show three P1 defects and one P2 UX gap, no P0. Follow-up tracked on Issue #31 and reviewed in PR #35. The read-only pilot is complete; fixes not yet verified.
- **Contributor-intake:** [merged PR #32](https://github.com/connorturansky-svg/crystal-forge/pull/32). Issue forms, PR template, CODEOWNERS and AI PR metadata/duplicate-task checks are now on `main`; branch protection/rulesets still require owner administration via Issue #33.
- **Repository permissions:** public read, Issues and PRs enabled, forking allowed. No direct collaborator invitation needed for personal fork + PR. Branch-protection settings could not be changed through current connector and need manual owner configuration.
- **Daily audit:** a ChatGPT automation is enabled for 09:00 Europe/London, beginning 2026-11-19. It inspects PRs, Issues, duplicate claims and CI and reports meaningful blockers, but does **not** dispatch agents or merge. Enabled monitoring depends on its connected environment.
- **Authority:** Only owner approves merging/deployment; no recurring agent dispatch or task assignment is active by default.

## WT-006 — Next owner-Codex implementation

- **WT-006 / Issue #40:** [Shared interactive Pixel Builder + fit-test workflow](https://github.com/connorturansky-svg/crystal-forge/issues/40). Owner-approved prompt `prompts/006-interactive-pixel-builder.md` will be pinned to an immutable revision in Issue #40. Begin from current main after merged WT-002 PR #35; build genuine in-canvas click-select/hold-drag and fitting selection, real verified bores/wire routes and physical-fitting coupon downloads. No code overlap with WT-003 external importer PR #37. One owned draft PR, no auto-merge.

## WT-002 — Merged milestone

- **WT-002 / Issue #34:** [Merged compact Studio layout and six-family creative geometry expansion](https://github.com/connorturansky-svg/crystal-forge/issues/34), approved as continuation of Stage B's programme. **New Stage C0:** shrink/collapse the model rail, close/restore all auxiliary panels, unify global toolbar and move Home/Library/Design/Build/Print to compact workspace navigation; then expand procedural styles for six families. Specification: `prompts/002-six-family-creative-expansion.md`. Codex completed and owner **merged PR #35** on 2026-11-18; merge SHA `351e2c7cd6bb521f27b238354d8a5bc5c9ac3f35`. The merged milestone includes compact workspace controls, six-family real styles and the three WT-001 P1 fixes. Selected-pixel contextual movement, fitting parity and physical qualification remain open and are in WT-006. This does not duplicate independent review WT-001.
- PR #30 and #32 are merged on `main` as of 2026-11-18; last verified main `948cd5ac31330fc1c7da3f1386c9ad60e0328361`.
- **Issue #33:** owner still needs to configure enforceable protection for `main` and contribution/IP terms.

## Existing in-flight work

- **Merged PR #30:** [Stage B: Contextual editing and creative Cogs & Gears](https://github.com/connorturansky-svg/crystal-forge/pull/30). External review WT-001 is complete; defects are logged in [review findings](reviews/WT-001-stage-b-review.md). Before expanding shared palette/Build/material code, triage its P1s with PR #35 integration owner, avoiding any second competing implementation.
- **Merged PR #29:** [Unified Wonder Trunks interface](https://github.com/connorturansky-svg/crystal-forge/pull/29). Contextual visual controls were incomplete on first rollout and are within Stage B scope.
- **Legacy Issues #6–#10 and #1** remain open at time of check; they describe earlier fabrication/LED/production phases and an audit. Reconcile their actual remaining acceptance criteria against merged code before adding new tasks, marking closed or creating duplicates. Do not assume their labels reflect current work.

## WT-003 — External SVG engine submitted; awaiting hosted verification

- **WT-003 / Issue #36:** [Isolated SVG-to-3D extrusion and print engine](https://github.com/connorturansky-svg/crystal-forge/issues/36). The external AI claimed WT-003 and opened [draft PR #37](https://github.com/connorturansky-svg/crystal-forge/pull/37) at head `0dbd1c80ce255dbcefde73f5ef99d1517bc3a0f0` from its fork, using approved brief `prompts/003-svg-extrusion-engine.md` pinned at `d78d54681eba6ca0cd9987eda8ce6ec56a3195dc`. All five hosted workflow runs currently show **action_required**, pending GitHub maintainer approval, not green CI. Own only new `svg-import/`, isolated SVG fixtures/tests, dedicated CI and dedicated handover files. Read existing `studio-geometry.js` and `studio-material-export.js` but do **not** modify them or any files currently owned by WT-002 PR #35.
- **Integration gate:** External task produces a real standalone import/preview/Manifold/STL/3MF demonstration and a documented adapter. Native Studio, shared Build and Library/Print wiring must be a **later coordinated PR** after #35 is reconciled. Do not represent an isolated importer as shipped in the Studio.
- Do not assign a second coder to any file already being edited by the owner Codex.

## Candidate future work — not authorised/claimed

| Candidate | Dependency | Duplicate risk | Next action |
|---|---|---|---|
| Expand six remaining generators with genuine tactile/visual geometry | Stage B merged | Scoped and owner-approved as WT-002 | Codex claim Issue #34 and follow pinned specification |
| SVG upload → extrusion → shared Build | WT-003 owns isolated SVG importer engine; WT-002 owns Studio shell | High if both edit shared UI/geometry | External AI builds isolated engine under Issue #36; integrate with Studio later |
| STL/OBJ upload → scale, orient, validated mesh Build | SVG/shared geometry conventions | Moderate | Do not dispatch before import feasibility/mesh validation |
| Complete shared direct 3D pixel/manifold tools | Stage B + existing Crystal engine | High — earlier Issues #7, #9 | Reconcile existing implementation with feature tests |
| Combined Library + reliable cross-device workflows | Existing Library/vault; interface parity | Moderate — prior implementation present | Scope only missing behaviours |
| Quick Print and Cura acceptance | Existing Print Centre + prior Issues #6/#8/#10 | High | Audit against true latest code and physical gaps |

## Safe immediate action

Begin WT-006 on its own freshly based branch only after Codex checks current main and open claims. PR #35 is merged, three WT-001 P1s addressed; WT-003 PR #37 remains independent. No auto-merge; main ruleset now exists and requires a static check. Continue owner/agent dispatch setup as separate WT-004/005 tasks.
