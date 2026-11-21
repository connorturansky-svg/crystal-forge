# Codex fast start — actual top-entry hardware bevel (after #121)

**Read this short file first, then docs/EDGE_MOUTH_CODEX_PREWORK.md.** It is support QA and not a product fix. Base main after PR #121 was 9f792e1; always fetch latest actual main.

## Evidence already prepared, do not redo

- Draft QA PR #122 supplies independently validated STL **and 3MF** mesh section helpers, a real-Manifold OFF/ON synthetic bore fixture, a dedicated CI workflow and 11-case acceptance matrix.
- [Exact-head QA run 44842672555](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44842672555) passed. At print-Z 7.75 mm radius = **3.9995 mm**, at Z 6.75 mm = **3.9977 mm**, identical with positive chamfer OFF/ON. Both export formats agree. That is a **confirmed synthetic sharp upper lip**, not yet a demonstrated real Build UX case.
- Run these in a checkout with installed dependencies:
  - node tests/helpers/print-section-profile.test.mjs
  - node tests/helpers/three-mf-section-profile.test.mjs
  - node tests/edge-mouth-baseline-audit.mjs
- The full test source is in QA PR #122; cherry-pick its commits or reuse its files on the geometry PR **after checking concurrent changes**.

## Minimal implementation target

1. Reproduce an actually permitted upward-facing hardware hole in Chromium; explicitly distinguish exposed top-face cuts from underside pixel insertion, blind pockets, existing countersinks and wire ports. Unsupported face means **do not claim an affected user path**.
2. For proven eligible circular top-entry cuts, evaluate a local conical lead-in cutter in the same negative manufacturing pipeline rather than broad post-Boolean mesh deformation. For nominal radius r and 0.5 mm/45° lead-in, radius at the exposed plane is r+0.5 and below Z=top-0.5 remains r. Preserve through-bore sizes.
3. Guard local stock/overlap/retention/roof and skip **only** unsafe mouths with an actionable warning. Keep optional fitting/shaft and countersink interfaces precise. Preserve #120 crinkle fix and #121 32 raised-Gear combinations.
4. Independently section the *exported* STL and 3MF at 7.99/7.75/7.5/6.75 mm, plus bottom/adjacent stock. Confirm the expected taper and unchanged functional bore, then add real mouse/keyboard/reload/download Chrome evidence for relevant families.
5. Run static + fabrication + Chromium suites and exact-head CI. Deliver a separate focused draft PR with changelog, What's New and handover. Owner alone merges.

**Do not edit or merge QA PR #123's AGENTS/first-print/Pages work in this feature PR.** Pages continuity is a separate release QA/Jordan task; actual tactile feel and LED fit remain owner physical acceptance in issue #10.
