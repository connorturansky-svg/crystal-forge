# NNN — [Descriptive milestone title]

> Status: draft
> Owner approval: pending
> Planning ref: planning/prompts
> Approved spec revision: **not pinned until explicitly approved**
> Implementation PR: not started
> Supersedes: none
> Last updated: YYYY-MM-DD

## Purpose and creative intent
Explain WHY the user wants this feature, how it should feel to a maker, and the intended sensory/tactile/educational use. Reference relevant accepted decisions from `prompts/PROJECT_CONTEXT.md`.

## Verified current state
Record latest main SHA, relevant PRs, what the source really does, and which CI/manual tests were verified. Read `AGENTS.md`, `docs/AI_HANDOVER.md`, architecture/roadmap/test docs, and actual source.

## Requirements and design rules
Define measurable UI/geometry/data behaviour. Include scope, constraints, non-goals, compatibility rules, and which existing subsystems must be reused. No placeholders presented as working features.

## Interactions and shared source of truth
For each relevant control specify display, selection, action, validation, progress, Undo/Redo, save/reload, keyboard/pointer use and failure response. Visual controls and exact settings must edit the same authoritative model.

## Fabrication / integration
Specify preview-to-Manifold geometry parity, meshes, walls, cutouts, LED fittings, cable routing, Cura/export, import units and topology constraints as applicable. Preserve Crystal Cluster benchmark and physical-test caveats.

## Acceptance matrix
Include uniquely numbered `AC-NNN-01` etc. State test action, expected behaviour, automated/manual evidence and relevant negative cases. Test all visible buttons and changes that could cause regressions.

## Delivery stages and agent division
Bound parallel research/geometry/UI/QA efforts if available. One integration owner; no conflicting writes. Work in an implementation branch from appropriate current main and open a **draft PR**. Do not auto-merge/deploy.

## Deliverables and evidence
Give final PR URL, exact head SHA, source files, screenshots/contact sheets, static/browser/Manifold CI URLs, failing/untested cases and remaining acceptance criteria. Update release metadata for changes destined for production.

## Mandatory cross-AI handover update
Before calling the work complete, update the repository's `docs/AI_HANDOVER.md` and relevant `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/FEATURE_SPECIFICATIONS.md`, `docs/DESIGN_DECISIONS.md`, `docs/TESTING.md` and acceptance documents **as needed**, in the implementation PR. Record:
- Goals, intent and key trade-offs (why the work was done);
- Exact source modules, important data flows and invariants;
- Implemented, partial, deferred and explicitly rejected behaviours;
- What was tested, exact commit/test links, and what remains manually unverified;
- Save-data migrations, backward compatibility, security and integration considerations;
- Known defects, priority next steps and how a fresh AI can continue.
Prefer concise current-state summaries with links to detailed records over endlessly appending stale narrative.
Follow `prompts/HANDOVER_PROTOCOL.md`. Update the planning branch's `prompts/README.md` index **through a separate coordinated planning update** after the implementation PR is reviewed, not by silently modifying an approved brief.

## Approved instruction to Codex
After user approval pin the full Git commit SHA containing this brief. Codex must retrieve this exact revision, read onboarding docs and current source, implement the approved scope, test the latest head, and open a draft PR without merging.
