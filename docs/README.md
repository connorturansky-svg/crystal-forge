# Wonder Trunks Studio — Documentation hub

This index groups existing documents by purpose **without moving their original paths**. Changing old filenames would invalidate earlier PRs, issue references and pinned Codex instructions. Start with [current project status](PROJECT_STATUS.md) and the [repository map](REPOSITORY_MAP.md); [the old WT-021 prompt](../prompts/START_HERE.md) is now historical.

## Planned UX: two-level help (WT-024, not yet released)

[WT-024 issue #152](https://github.com/connorturansky-svg/crystal-forge/issues/152) proposes independently switchable **Hover notes** and **Detailed explanations** beside controls throughout all eight workspaces and seven model families. **This is a research/implementation plan, not a current live feature.** Read the [approved UX and engineering blueprint](WT024_HELP_SYSTEM_BLUEPRINT.md), [control coverage audit](WT024_HELP_COVERAGE_AUDIT.md), [Codex/agent fast start](WT024_CODEX_FAST_START.md) and [future user-guide draft](WT024_HELP_USER_GUIDE_DRAFT.md). Current in-app Help and the live Descriptions button remain authoritative until implementation is reviewed and merged.

## 1. Current delivery, contributor navigation and Codex restart

| Document | Purpose |
| --- | --- |
| [Current work](PROJECT_STATUS.md) | **Dated active status and credit-efficient resume order**; recheck live GitHub before coding. |
| [Repository/source map](REPOSITORY_MAP.md) | **Start here to find actual implementation modules, test commands and historical docs.** |
| [WT-022 Issue #127](https://github.com/connorturansky-svg/crystal-forge/issues/127) | WT-022 acceptance and latest independent QA comments; A/B/C released, a small search alias follow-up remains. |
| [Merged Milestone A #128](https://github.com/connorturansky-svg/crystal-forge/pull/128) | Real precision mounting patterns on main. |
| [Merged workspace #132](https://github.com/connorturansky-svg/crystal-forge/pull/132) | Eight workspaces merged into `main`. |
| [Merged search release #134](https://github.com/connorturansky-svg/crystal-forge/pull/134) | Intelligent global tool finder on `main`, including [successful Pages deployment](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45063828028); #129 closed. |
| [AGENTS.md](../AGENTS.md) and [testing](TESTING.md) | Engineering invariants, safety boundaries, CI gates and exact-head evidence. |

**Historical WT-021 records (not active branches):** [original WT-021 handover](WT021_CODEX_HANDOFF.md), [old live pointer](WT021_NOW.md), [completion register](WT021_COMPLETION_REGISTER.md), [feature catalogue brief](WT021_FEATURE_CATALOGUE_BRIEF.md), [original prompt library](../prompts/START_HERE.md), [overnight summary](WT021_OVERNIGHT_SUMMARY.md). Retain these for acceptance provenance but do not interpret their old "active PR #102" text as instructions. #102 has merged.

## 2. Product design and architecture

- [Project vision](PROJECT_VISION.md) — creative goals, physical and sensory design purpose.
- [Architecture](ARCHITECTURE.md) — production code/data pipelines, build/export ownership.
- [Feature specifications](FEATURE_SPECIFICATIONS.md) — functional contracts and expectations.
- [Accepted design decisions](DESIGN_DECISIONS.md) — settled workspace/interaction choices.
- [Six additional model families / first Studio brief](SENSORY_MODEL_STUDIO_V016_BRIEF.md) and [initial acceptance](SENSORY_MODEL_STUDIO_V016_ACCEPTANCE.md).
- [Development history](DEVELOPMENT_HISTORY.md), [roadmap](ROADMAP.md), [changelog](../CHANGELOG.md).

## 3. Manufacturing, print and independent QA

- **New to Studio?** Open the app and choose **Home → New model**. Pick a family, shape it in **Design**, and configure supported fitting options in **Build**. Send it to **Print Centre** and choose **Prepare**; inspect the job message before downloading. The saved project remains editable; the print file is only the prepared snapshot. Use **Help → Troubleshooting** if preparation fails or you cannot find a download.
- [Back up and recover your Studio workspace](BACKUP_RECOVERY.md) — download a backup, review before restoring, and troubleshoot recovery.
- [Testing guide](TESTING.md) — local and CI commands, release gates.
- [Model-builder parity](MODEL_BUILDER_PARITY.md) — cross-family testing context; consult the newer WT-021 register for current acceptance.
- [Cura profile generator](CURA_PROFILE_GENERATOR.md) — compatible machine/nozzle/material profile guidance.
- [Production review](PRODUCTION_REVIEW.md), [final-phase acceptance](FINAL_PHASE_ACCEPTANCE.md), [SVG import handover](SVG_IMPORT_HANDOVER.md).
- Real Cura and physical LED fit must be recorded under [issue #10](https://github.com/connorturansky-svg/crystal-forge/issues/10); software acceptance under [#79](https://github.com/connorturansky-svg/crystal-forge/issues/79).

## 4. Collaboration and repository policy

- [Root AGENTS.md](../AGENTS.md) — AI development rules and explicit WT-021 branch exception.
- [Contributor guide](../CONTRIBUTING.md), [collaboration](COLLABORATION.md) and [AI handover](AI_HANDOVER.md).
- [Contributor access](AI_CONTRIBUTOR_ACCESS.md), [repository protections](REPOSITORY_PROTECTION.md), [backlog triage](BACKLOG_TRIAGE.md).

## 5. Historical plans and PR acceptance guides

- [Historical PR guide index](history/README.md) — PR5–PR14 plans, physical test guides and release notes.
- [Archived README milestone descriptions](history/LEGACY_README_NOTES.md) — old PR5–PR7/v0.8.0 details, retained for reference.
- [Original prompt archive](../prompts/archive/README.md) — WT-000–WT-021 historical prompts, with retained original paths.

**Status convention:** A specification describes intent, and targeted regressions support only their tested fixtures. A milestone is not complete until current exact-head static, real browser, manufacturing and applicable manual gates support it. Do not treat archived WT-021 PR #102 as current; physical validation stays #10.
