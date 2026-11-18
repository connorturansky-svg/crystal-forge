# Cross-AI handover protocol — required for every approved task

**Goal:** Any new contributor (human, Codex or other AI) can resume the project using repository files, without our conversation history. The handover must state *intent, actual behaviour and evidence*, not just a changelog or AI transcript.

## Required reading order for a fresh agent
1. `prompts/000-contributor-onboarding.md` from `planning/prompts`.
2. `prompts/PROJECT_CONTEXT.md` and the prompt index on the same planning revision.
3. `AGENTS.md` and `docs/AI_HANDOVER.md` from current `main`.
4. `docs/ARCHITECTURE.md`, `docs/PROJECT_VISION.md`, `docs/FEATURE_SPECIFICATIONS.md`, `docs/DESIGN_DECISIONS.md`, `docs/ROADMAP.md`, `docs/TESTING.md`, and the specific task brief.
5. Source, tests, CI runs and open PRs. **Verify**, don't rely on documentation claims.

## Minimum handover content after every implementation PR
Update `docs/AI_HANDOVER.md` (and architecture/design/roadmap docs when affected) before the PR is considered ready:

| Area | Record |
|---|---|
| Purpose | User goal, design intention, accepted trade-offs and rationale |
| State | Implemented, partially working, deferred, rejected; separate scope from evidence |
| Source | Modules changed, APIs, authoritative model/mesh state, design/build/print flow |
| Invariants | Crystal benchmark, cable rules, real hole cuts, manifold checks, persistence and compatibility |
| UX | New screens, controls, selected-part and keyboard semantics, accessibility limits |
| Data | Saved-project format, migration path, measured LED profiles, GitHub vault and backup behaviour |
| Tests | Exact head SHA; static, browser, Manifold, perf and visual results; links to checks |
| Manual | Cura import/slicing, physical fitting, optical output, tactile comfort and mechanical safety — not certified by CI |
| Risks | Known bugs, regressions avoided, unresolved decisions, security and operational caveats |
| Continuation | Next highest-value tasks, blockers, dependencies and how to reproduce failures |

## Handover hygiene
- Write concise **current** facts at the top; archive or clearly label superseded information below instead of accumulating contradictory "current" sections.
- Capture important explanations behind rejected approaches and why a geometry/UX decision was selected.
- Keep requirements separated from actual delivered code and observed test results.
- Keep an explicit acceptance checklist and PR links; don't use unverifiable claims like "fully working".
- Make documentation updates part of PR review/CI conventions. For substantial features, include a human-readable `Handover` subsection in the PR description.
- When a brief is revised, record what changed and whether the implementation must rebase or accept the change. The approved SHA is immutable for that task.
- Don't put secret tokens, personal health details, proprietary reference assets or private communications into repo documents.

## For ChatGPT maintaining planning prompts
For each new approved prompt, reference this protocol and specify what new knowledge the implementing AI must add to `docs/AI_HANDOVER.md`. After completion update `prompts/README.md` on `planning/prompts` with truthful status and PR/test evidence. Do not merge prompt-only commits into `main` just for convenience.
