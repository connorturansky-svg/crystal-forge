# Codex restart brief — exposed top-facing hardware openings
**21 November 2026 snapshot, after QA-R04 #124. Fetch GitHub main before editing.**

## 60-second state check
- QA support and release work **#122, #123, and #124 are all MERGED**. Do not cherry-pick them, reopen their historical branches, or repeat their preparatory investigation.
- Snapshot `main`: `8d19701ac5bd5521140ebe4e1dfcabbedba8c53f` (#124 integration); check live GitHub/CLI for a newer SHA before using. Production Pages, static and Manifold CI passed at this merge. Full standard browser suite was still in progress at the snapshot.
- The still-open historical PRs **#37, #42, #90, #101** are not blockers for this manufacturing correction. Never merge/rebase their old code into this task.
- Owner controls merges and deployments; all real physical printing and touch/retention assessment remains unverified under issue #10.

## Task: fix the real end-user defect (one focused geometry PR)

**User requirement:** The optional edge-finish checkbox should remove eligible sharp upward-facing audience-touchable lips, including safe manual mounting-hole mouths. Preserve underside, LED retention and functional cut geometry; **no mesh crinkles or large global smoothing**.

**Already reproduced, do not research from scratch:** `tests/edge-mouth-build-browser.mjs` placed a top-facing M1 hole on an actual Gear through Chromium pointer actions, saved/reopened the model, prepared the job and downloaded both STL and 3MF. Enabled top chamfer produces **1.6998 mm** radius near the 3.4 mm hole mouth and **1.6992 mm** deeper: just **0.0006 mm** expansion, proving the lip remains sharp. [CI proof](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44844788817) and [original files/screenshots](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44844788817/artifacts/14682137974). Synthetic Manifold and actual Build planner OFF/ON fixtures agree. Existing top bevel affects the **positive stock before later hardware negative cuts**. This is why the external face rounds but an inserted M1 still has a sharp lip.

**Reference implementation geometry, not runtime code:** `tests/helpers/top-entry-lead-in-spec.mjs` gives a finite-checked local 45° conical cutter with a small overshoot; `tests/edge-mouth-reference-coupons.mjs` builds and independently sections matched sharp/0.5 mm lead-in STL and 3MF. [Reference models](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44844374416/artifacts/14682197240) measure radius 4.4852 at print-Z 7.99 mm, 4.2474 at 7.75, 4 at 7.50 (nominal bore radius 4 mm). **Do not** directly apply this cutter to every negative: require positive top surface, sufficient stock and sufficient distance to other holes, slots, paths and outer edges.

### Required engineering decisions
1. Read `AGENTS.md`, this document, `docs/EDGE_MOUTH_CODEX_FAST_START.md`, `docs/EDGE_MOUTH_CODEX_PREWORK.md`, existing `studio-mount-builder.js`, `studio-catalogue.js`, `studio-geometry.js`, Crystal `fabrication-v1.js`, and direct tests. Do not alter #124 Pages workflows or historical PRs.
2. Establish which **top-side cut types are safe** to enter with a small optional 45° lip. At minimum test the real exposed top manual through-hole. Explicitly skip underside entry, functional pixel retention throats, blind holes without adequate roof, existing countersinks, overlapping routes and near-edge material; report actionable skips.
3. Apply localized geometry in the **native negative cutter pipeline** rather than post-process entire mesh, keeping underlying nominal diameters and deep bore depths unchanged. Determine analogous real Crystal top-contact cases using evidence before promising universal coverage.
4. Reuse/extend independent STL/3MF section parsers. A successful test must assert **top mouth expansion when enabled**, no expansion when disabled and no changes to deep functional diameter, supports, underside or adjacent stock. The current **diagnostic** audit passing means only “defect detected”; it is **not** a repair acceptance gate. Upgrade the test to fail if the lip remains sharp *after* implementing the feature.
5. Test a 0.4 mm/0.8 mm nozzle caveat in Cura documentation rather than falsely claiming physical touch safety. Preserve #120 planar top bevel and #121 raised Gear manufacturing, especially its 32 Gear combinations. Test browser user actions, save/reload, invalidation, STL, 3MF and seven-family regressions.
6. Create a **new** short-lived branch from latest main, a **draft PR** for the runtime fix, and provide exact-head static, Manifold/fabrication, real Chrome and release-metadata evidence. Update `CHANGELOG.md` and in-app What's New if product controls or behavior changes. **Do not merge or deploy.**

## Next work after the mouth-lip fix (not part of this PR)
- **FIT-02 (P0):** faithful positive housing/negative cutter preview and manufactured-file parity across families.
- **FIT-03 (P0):** full actual material-level IN→P1→…→OUT routing, not just overlay lines.
- **PAR-02/PAR-04 (P1):** selected sub-body manipulation; installed Cura printer/nozzle profiles and export import.
- **DIM-01 (P0):** compare original owner 51×49×66 vs 44.7426×44.7718×61.2501 mm only if original saved project/export is supplied.
- **Physical #10:** print S1–S7 coupons from `docs/QA_FIRST_PRINT_PLAN_20261121.md`, not an automated software-complete label.

**Coordination:** [software #79](https://github.com/connorturansky-svg/crystal-forge/issues/79), [agent ownership #105](https://github.com/connorturansky-svg/crystal-forge/issues/105), [physical #10](https://github.com/connorturansky-svg/crystal-forge/issues/10). Preserve one coherent focus: eligible top-facing mouth chamfers, with reproducible print-file evidence.
