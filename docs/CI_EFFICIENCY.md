# CI efficiency — documentation-only pull requests

**Scope:** Conservative test scheduling; **not a new app release**. Authored 22 November 2026. See the exact PR and its logs for the actual implementation status.

## Problem

The comprehensive browser, fabrication and seven-builder edge workflows currently trigger for **every PR** to `main`, including a Markdown-only repository navigation change. This installs NPM/Chromium, runs Manifold benchmarks and may take 10–25 minutes without testing changed runtime code. Such wasted queue time obscures the real product branches.

## Proposed safe behaviour

All three workflow **jobs still run and report their existing check contexts** on each PR. After checkout, a cheap pure-Node gate determines whether changed paths are *only documentation*. For docs-only changes, expensive installs, browser tests, fabrication benchmarks and log uploads are skipped, and the job reports success with an explicit scope message. This does **not** mark the app physically validated.

The exact matcher is `tests/helpers/ci-scope.mjs`; unit coverage is `tests/ci-scope.test.mjs` and runs within the existing required static workflow.

- **Allowed documentation-only:** `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `CHANGELOG.md`, `LICENSE`; Markdown/text/CSV/static illustration files under `docs/` and `prompts/`.
- **Must run full suites:** any runtime JS/CSS/HTML, `index.html`, `package.json` or lockfiles; **any test file** or **any workflow edit**; unknown extensions, missing/invalid base, failed Git diff, push to `main`, or manual `workflow_dispatch`.
- **No checks removed.** The static and release metadata test continue normally. CI changes themselves also run the full expensive suites to check the new workflow.

## Safety criteria

1. A docs-only PR checks in the expensive workflows with no npm install, Chrome or Manifold run.
2. A code or test PR still executes all existing browser/fabrication/edge jobs and uploads the same evidence.
3. A missing Git commit/invalid SHA/failing diff defaults to **full tests**, not a silent skip.
4. Any new runtime-related file extension requires no allowlist change: the default is full tests.
5. Branch protection remains owner-managed. At the 22 Nov audit, the active ruleset `Protect main — reviewed releases` required the `static` context only. The owner should continue checking browser/Manifold evidence before releasing runtime changes, and can independently decide whether to strengthen required checks.
6. This only reduces unnecessary documentation-only PR work. Long runtime QA should continue as is until there is measurable evidence for splitting suites.

## Test and rollback

- Run `node tests/ci-scope.test.mjs` (no NPM dependencies).
- Review exact-head static and full browser/Manifold CI on the workflow-change PR itself.
- To force a full test after merge even when no source changed, use the workflow's existing **Run workflow** / `workflow_dispatch` control (always runs full).
- To roll back this efficiency gate, revert the three affected workflows and the classifier; no application project data or geometric behavior is touched.
