# Wonder Trunks Studio — Documentation hub

This index groups existing documents by purpose **without moving their original paths**. Changing old filenames would invalidate earlier PRs, issue references and pinned Codex instructions. Start with the current [active prompt](../prompts/START_HERE.md), rather than an old roadmap status.

## 1. Current delivery and Codex resumption

| Document | Purpose |
| --- | --- |
| [WT-021 handover](WT021_CODEX_HANDOFF.md) | Last verified engineering checkpoint, source pointers and ranked next steps for Codex. |
| [Current next task](WT021_NOW.md) | Small live pointer for resuming after usage cutoff. |
| [Fast Codex workflow](../prompts/active/WT021_FAST_START.md) | Token-efficient test selection and CI batching. |
| [WT-021 completion register](WT021_COMPLETION_REGISTER.md) | Authoritative 24-row acceptance register (23 original manufacturing/parity requirements + UX-01 visual catalogue). |
| [UX-01 features and What's New brief](WT021_FEATURE_CATALOGUE_BRIEF.md) | Real in-app illustrated feature catalogue, safe clickable navigation, accessible UI, source-of-truth release notes. |
| [Overnight owner summary](WT021_OVERNIGHT_SUMMARY.md) | Live short morning report, actual tests, blockers and next action. |
| [WT-021 independent audit](WT021_INDEPENDENT_AUDIT.md) | Original source/test findings, known limits and corrections. |
| [Active prompt / complete source library](../prompts/START_HERE.md) | Full original milestone prompts and one copyable WT-021 execution instruction. |
| [PR #102](https://github.com/connorturansky-svg/crystal-forge/pull/102) | **Only active WT-021 draft PR**. Never merge or deploy without owner approval. |

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

**Status convention:** A specification describes intent; a passing targeted regression supports only its tested fixture. Only the completion register's full feature-specific acceptance evidence can justify a **VERIFIED** status. Draft PR #102 is not production.
