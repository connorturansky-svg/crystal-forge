# Open PR triage after main includes PR #121

**Source-level review only.** No PR was merged or closed by this audit; the owner must recheck current main/branches and code diffs. Baseline main was 9f792e1.

| Open PR | Suggested action | Why |
| --- | --- | --- |
| #90 — Pages startup recovery | **Do not merge the historical branch as-is.** Create a newly based targeted startup-diagnostics PR only after checking current recovery tools | Main already has QA-R02 staged asset/import/worker test and svg-import/index.js; main **does not have** studio-startup-recovery.js or the old #90 startup watchdog self-test. The classic pre-import error watchdog, non-destructive Download diagnostics, genuine legacy editor fallback and retry may still add value. Source diff also edits older index.html version and .github/workflows/pages.yml, which would collide with newer production staging checks |
| #101 — global Crystal tip styles | **Audit against merged implementation; likely redundant and should not be merged blindly** | Main now contains tipStyle (rounded/blunt/flat) and newer #116 convex tip fix. Earlier independent review recorded #101 implementation already integrated. Compare its intended test behavior before owner closes as superseded; don't reapply old tip geometry |
| #37 — isolated SVG import/extrusion | **Keep contributor ownership; reconciliation decision after focused diff** | Main already contains svg-import/index.js and a live imported SVG generator; this old isolated contributor PR may still contain a distinct demo/tests or docs. Do not close/merge without reviewing the approved #36 contract and ancestry |
| #42 — Copilot assignment pilot docs | **Low priority, owner operations** | Documentation pilot; no relation to current print-safe geometry. Owner can decide whether to merge, archive or close under repository operations #33 |

## What can be salvaged from #90

From its actual changed filenames, #90 contains a standalone studio-startup-recovery.js classic-script watchdog, tests/studio-startup-recovery.test.mjs, public smoke script, a Pages workflow patch, index.html edits and version updates. Current main has **no** standalone startup-recovery.js, no pages-public-smoke.mjs and no pages-release-assets.test.mjs; it **does** have tests/pages-artifact-browser.mjs and the modern SHA-scoped staged workflow.

Recommended narrow PR if startup still fails on the public app:
1. Reproduce current failure on the exact public Pages SHA and compare Chrome Console/Network and current packaged-module QA before coding.
2. Integrate only the resilient pre-module error reporting and non-destructive recovery UX if still needed; preserve current Help diagnostics, local projects and measured profile data.
3. Rework tests around a **real packaged** failure simulation and modern UI labels, not only the historical vm test.
4. Avoid replacing #112's vendor, release metadata or staged browser gate. Exact-head static+browser+fabrication and Pages stage tests must stay green.
5. Owner manually verifies the public site; do not auto-merge a stale startup fix into main.

The separate old-tab continuity gap from #115 needs historical asset retention, not the same fix as first-load startup recovery. See docs/QA_PAGES_RELEASE_RETENTION_HANDOVER.md in this QA branch.

**This is a triage recommendation rather than proof these PRs should be closed; retain owner control.**
