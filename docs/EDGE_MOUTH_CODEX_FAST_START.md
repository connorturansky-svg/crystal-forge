# Codex fast start — actual top-entry hardware bevel (after #121)

**Read this short file first, then docs/EDGE_MOUTH_CODEX_PREWORK.md.** It is support QA and not a product fix. Base main after PR #121 was 9f792e1; always fetch latest actual main.

## Evidence already prepared, do not redo

**NEW: Complete real Chromium reproduction passed.** [QA browser run #44844788817](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44844788817), [evidence artifact #14682137974](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44844788817/artifacts/14682137974). A real mouse placed M1 on the top of a solid Gear, with `edgeFinish` enabled; after save/reload and Print Centre preparation, it downloaded actual STL and 3MF. Both independently decoded exports measured radius **1.6998 mm near the upper M1 lip** and **1.6992 mm inside**, expansion just **0.0006 mm**. The corresponding `tests/edge-mouth-build-browser.mjs` can be run against the current app and later promoted to assert the new 45-degree lead-in. This establishes the actual affected user workflow, not merely the synthetic cutter; the test remains diagnostic and does **not** claim the flaw fixed or a printed part touch-safe.



- Draft QA PR #122 supplies independently validated STL **and 3MF** mesh section helpers, a real-Manifold OFF/ON synthetic bore fixture, a dedicated CI workflow and 11-case acceptance matrix.
- [Exact-head QA run 44842672555](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44842672555) passed. At print-Z 7.75 mm radius = **3.9995 mm**, at Z 6.75 mm = **3.9977 mm**, identical with positive chamfer OFF/ON. Both export formats agree. That is a **confirmed synthetic sharp upper lip**, not yet a demonstrated real Build UX case.
- **Confirmed real native M1 geometry:** [QA run #44844326485](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44844326485) used the supported Build planner for a **top-entry 8 mm manual mount**. STL and 3MF show radius 3.9996 mm near the upper opening versus 3.9981 mm deeper, **with and without** finishing. Exterior stock was chamfered, proving the missing local mouth lead-in is not merely a disabled option.
- **Reference fix exemplar:** [QA run #44844374416 / artifact #14682197240](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44844374416/artifacts/14682197240) contains actual sharp-vs-45° reference STL and 3MF files. The 45° example independently measures radii 4.4852, 4.2474, 4.0000 and 3.9985 mm at print-Z 7.99, 7.75, 7.50 and 6.75 mm. Use this as a regression target, **not** as the production implementation.
- Run these in a checkout with installed dependencies:
  - node tests/helpers/print-section-profile.test.mjs
  - node tests/helpers/three-mf-section-profile.test.mjs
  - node tests/helpers/top-entry-lead-in-spec.test.mjs
  - node tests/edge-mouth-baseline-audit.mjs
  - node tests/edge-mouth-native-mount-audit.mjs
  - node tests/edge-mouth-reference-coupons.mjs
  - node tests/edge-mouth-build-browser.mjs (with Chromium and a server on port 4321)
- The full test source is in QA PR #122; cherry-pick its commits or reuse its files on the geometry PR **after checking concurrent changes**.

**Reusable reference code is now committed:** `tests/helpers/top-entry-lead-in-spec.mjs` and its unit test define a pure 45° circular entry cutter specification, including a **0.1 mm overshoot above the positive top face** to avoid coplanar Boolean subtraction (as used by the tested reference coupon). `tests/edge-mouth-reference-coupons.mjs` uses this helper and sections both exports. Codex can adapt its exact geometry math but **must** add real eligibility, web/collision, retention and exposed-face guards before importing it into production. It is deliberately not connected to Studio.

## Minimal implementation target

1. **The native top-entry M1 has now been reproduced through both the real Chromium Build gesture and exported STL/3MF.** Reuse its fixture and section helpers, then explicitly distinguish exposed top-face cuts from underside pixel insertion, blind pockets, existing countersinks and wire ports. Unsupported face means **do not claim an affected user path**.
2. For proven eligible circular top-entry cuts, evaluate a local conical lead-in cutter in the same negative manufacturing pipeline rather than broad post-Boolean mesh deformation. For nominal radius r and 0.5 mm/45° lead-in, radius at the exposed plane is r+0.5 and below Z=top-0.5 remains r. Preserve through-bore sizes.
3. Guard local stock/overlap/retention/roof and skip **only** unsafe mouths with an actionable warning. Keep optional fitting/shaft and countersink interfaces precise. Preserve #120 crinkle fix and #121 32 raised-Gear combinations.
4. Independently section the *exported* STL and 3MF at 7.99/7.75/7.5/6.75 mm, plus bottom/adjacent stock. Confirm the expected taper and unchanged functional bore, then add real mouse/keyboard/reload/download Chrome evidence for relevant families.
5. Run static + fabrication + Chromium suites and exact-head CI. Deliver a separate focused draft PR with changelog, What's New and handover. Owner alone merges.

**Do not edit or merge QA PR #123's AGENTS/first-print/Pages work in this feature PR.** Pages continuity is a separate release QA/Jordan task; actual tactile feel and LED fit remain owner physical acceptance in issue #10.
