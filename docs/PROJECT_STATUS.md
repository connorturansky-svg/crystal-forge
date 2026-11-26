# Current work — Crystal Forge / Pixel Model Maker

## WT-023B2b completion candidate — 26 November 2026

Continue existing #175, owner-dispatched after #181 merged. Candidate .35.52 integrates main .35.51 and preserves Info, compact Library, drawer sizing, precision and cog improvements. Read-only saved-version/settings inspection and the shared atomic destination chooser use the existing workspace. See [verification and follow-on dependencies](WT023B2B_LIBRARY_DESTINATIONS.md). Do not treat the dated open-PR table below as live status; exact final-head CI and owner merge review remain required.

## ChatGPT handover — 25 November 2026

Main audited at `66994cc98d3ef9bd68ef38161fd7a2b78fef8dbb`. The owner merged [B2a #172](https://github.com/connorturansky-svg/crystal-forge/pull/172). Main carries v0.16.0-dev.35.42. Its runtime head `cba402317d40bd09a0dd228a1257ebf0c4c0fb88` passed all six substantive [PR workflows](https://github.com/connorturansky-svg/crystal-forge/pull/172/checks). Persistence #147, project folders #151, private backup #148, Models drawer #164/#166 and contextual Help #163 are integrated. See [AI_HANDOVER.md](AI_HANDOVER.md) for source and test commands.

| Open PR | Hold and continuation |
|---|---|
| [#169 Models drawer density and thumbnail zoom](https://github.com/connorturansky-svg/crystal-forge/pull/169) | Draft with conflicts. Five substantive workflows passed old head `6522d776`. Its owner must reconcile current main, shared Help and release metadata after .42. |
| [#158 Gear grips](https://github.com/connorturansky-svg/crystal-forge/pull/158) | Conflicts with main. Its old head `a6f9038b` passed the observed substantive workflows. Its owner needs to reconcile shared runtime and release files and rerun geometry, exports and browser checks. |
| [#167 Viewport Layers](https://github.com/connorturansky-svg/crystal-forge/pull/167) | Planning packet with conflicts. Reconcile it or fold its useful acceptance criteria into [#162](https://github.com/connorturansky-svg/crystal-forge/issues/162) before runtime dispatch. |
| [#171 Model colour picker](https://github.com/connorturansky-svg/crystal-forge/pull/171) | Planning packet with conflicts. Reconcile it or fold its useful acceptance criteria into [#170](https://github.com/connorturansky-svg/crystal-forge/issues/170) before runtime dispatch. |

### Next-session priorities

1. Stabilise the Models drawer in [#169](https://github.com/connorturansky-svg/crystal-forge/pull/169) and [#140](https://github.com/connorturansky-svg/crystal-forge/issues/140). Verify narrow and wide widths, 200% zoom, both themes, long names, keyboard/touch, genuine previews and Retry, WT-024 help and Library actions with the drawer expanded.
2. After owner dispatch, implement B2b under [#139](https://github.com/connorturansky-svg/crystal-forge/issues/139). Use the [existing packet](WT023_PROJECT_LIBRARY_IMPLEMENTATION.md#b2b--project-browser-and-destination-transaction) for read-only saved-version inspection and a single durable destination write. Validate exact IDs, cancel, quota failure, competing tabs and preservation of historical snapshots.
3. Reconcile the existing Gear implementation [#158](https://github.com/connorturansky-svg/crystal-forge/pull/158) before overlapping geometry or viewport work. Preserve previously valid designs and rerun measured clearances and actual STL/3MF export fixtures.

Resources [#141](https://github.com/connorturansky-svg/crystal-forge/issues/141), private backups [#142](https://github.com/connorturansky-svg/crystal-forge/issues/142), Info and Help polish [#154](https://github.com/connorturansky-svg/crystal-forge/issues/154) and [#152](https://github.com/connorturansky-svg/crystal-forge/issues/152), and production evidence [#79](https://github.com/connorturansky-svg/crystal-forge/issues/79) remain in their existing issues. The owner retains physical Cura and print sign-off under [#10](https://github.com/connorturansky-svg/crystal-forge/issues/10). Manual screen-reader QA remains outstanding. One local Chromium tool-search timeout passed on isolated rerun and hosted Chromium passed. If it recurs, capture the mounting preset and setup state before changing search behaviour.

## Historical checkpoints

Use the live GitHub refs and current handover when resuming. The entries below record previous integration states.


## WT-023 integration checkpoint — 23 November 2026

Main at this reconciliation is `b18ff81ee954a2dbb3a257e313b9d1d7354280d5`. It includes the #157 readability release and #160 acceptance guide alongside #150, #153, #155, #156 and #159. [#147](https://github.com/connorturansky-svg/crystal-forge/pull/147) carries project persistence as v0.16.0-dev.35.34. On main-targeted PRs the dedicated seven-builder edge workflow owns browser edge coverage, leaving the core browser workflow time for the rest of the regression suite. Use [#147’s checks](https://github.com/connorturansky-svg/crystal-forge/pull/147/checks) for current exact-head CI. After approval, follow the [WT-023 acceptance guide](WT023_NEXT_SLICES_ACCEPTANCE_20261123.md) to reconcile drafts #151 and #148 independently.

## Post-merge current status — 23 November 2026

**Main (audited):** `d2ee1ab84ea41d363d9448df436732a286bf2c54`, after owner-approved merges [#131](https://github.com/connorturansky-svg/crystal-forge/pull/131), [#144](https://github.com/connorturansky-svg/crystal-forge/pull/144), [#146](https://github.com/connorturansky-svg/crystal-forge/pull/146). [GitHub Pages deploy](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45087743682) and [static tests](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45087743661) passed on this exact main. Browser/fabrication push runs were still running when checked; no unobserved pass is claimed. The new CI classifier was confirmed on #144's documentation-only run: required workflow checks succeeded but Chrome/Manifold heavyweight steps correctly skipped. Do not mistake skipped docs-only work for physical validation.

**Codex in review:** [WT-023A #147](https://github.com/connorturansky-svg/crystal-forge/pull/147), head `8773200f48797c7366b8789de3bd03ab2961c4ff`, **draft, not merged**. Six old-head CI suites passed. Since main has advanced with 24 commits, the owner needs an exact-current-main reconciliation + fresh checks before approving. #147 implements transactional project-switch persistence, legacy snapshot IDs and data recovery. The live Crystal scene is captured when entering Home/Library; independent source review downgraded an earlier speculative last-edit-loss concern.

**Next Codex feature:** [WT-023B #139](https://github.com/connorturansky-svg/crystal-forge/issues/139): *Templates first, collapsible one-level Projects grouped by ID, active vs saved revisions*. Prefer a narrow B1 display-only vertical slice before building the full template destination chooser (B2). May be a dependent draft off #147, but cannot merge until #147 is approved and CI refreshed. The verified read-only selector on main is under `tests/helpers/wt023-project-index.mjs`—do not directly import test helpers into production; relocate/derive pure production code with appropriate tests only when implementing B1.

**Independent cloud QA:** [#148](https://github.com/connorturansky-svg/crystal-forge/pull/148), stacked on #147 and **draft**. This adds an authenticated Git Blob fallback for >1 MB private assets and a matching mocked regression. Static/edge/native/fabrication/measured-profile checks passed, full browser was in progress when checked. **Never merge #148 before #147**; first de-stack onto an accepted main and reconcile app release history.

**Owner decisions:** Collapsible single-level project folders; one active project with `Project : Model` tabs; shared versioned pixel/printer presets with project selection; manual, conflict-safe sync to a private GitHub repository. No PIN or hosted login in this milestone. Owner approves every merge. [#10 physical print trials](https://github.com/connorturansky-svg/crystal-forge/issues/10) remain required; UI/CI cannot certify actual printed fit.

[Codex fast-start](WT023_CODEX_FAST_START.md) · [approved blueprint](WT023_LIBRARY_CLOUD_BLUEPRINT.md) · [source map](REPOSITORY_MAP.md)

---

### Historical WT-022 checkpoint below (retained for evidence; not an active Codex task)

**Snapshot:** 22 November 2026, after merged [WT-022 search release #134](https://github.com/connorturansky-svg/crystal-forge/pull/134). **Not a live dashboard.** Recheck [main](https://github.com/connorturansky-svg/crystal-forge/commits/main), [open PRs](https://github.com/connorturansky-svg/crystal-forge/pulls), [Issues](https://github.com/connorturansky-svg/crystal-forge/issues) and [Actions](https://github.com/connorturansky-svg/crystal-forge/actions).

## One-minute orientation

- **Production** at audit: `main` `f6e1da1b00bc1aeff2add9bcf0486adf59a91d90`, including [#128 line/ring/grid mounting patterns](https://github.com/connorturansky-svg/crystal-forge/pull/128), [#132 eight Home/Library/Design/Build/Pixels/Wiring/Mounting/Print Centre workspaces](https://github.com/connorturansky-svg/crystal-forge/pull/132), and [#134 integrated intelligent tool search](https://github.com/connorturansky-svg/crystal-forge/pull/134). The actual [Pages deployment for this SHA passed](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45063828028). No claim of owner-performed live UI inspection or physical fit is implied.
- **Why #134 existed:** [#133 search](https://github.com/connorturansky-svg/crystal-forge/pull/133) first merged into stacked `feat/wt022-workspaces`, not `main`. #134 delivered those same changes to main. [#129 test-only preparation](https://github.com/connorturansky-svg/crystal-forge/pull/129) was closed as superseded.
- **Open housekeeping:** [#130 documentation entrypoints](https://github.com/connorturansky-svg/crystal-forge/pull/130) reconciles this map and handover onto post-#134 main. [#131 docs-only CI efficiency](https://github.com/connorturansky-svg/crystal-forge/pull/131) overlaps the released browser/static workflows; review/reconcile it separately, with fail-closed full runtime tests, after #130. Neither is a new geometry feature.
- **Next software print-quality priority:** [Issue #79 FIT-02 near-edge sloped Wave pixel fitting](https://github.com/connorturansky-svg/crystal-forge/issues/79). Its centre fixture is already verified; test stock/entry/cutter and safe rollback at the perimeter before expanding scope.
- **Physical owner work:** [#10 actual Cura, pixel and wire fit, optical, tactile and mounting validation](https://github.com/connorturansky-svg/crystal-forge/issues/10) remains open. [#51 modular joints](https://github.com/connorturansky-svg/crystal-forge/issues/51) remains held. Old unrelated drafts #37/#42/#90/#101 are not automatic merge candidates.

## Credit-efficient Codex restart

1. Fetch latest `main`, currently `f6e1da1` at this dated audit, and check PR/issue claims. Read [AGENTS.md](../AGENTS.md), [repository map](REPOSITORY_MAP.md) and [#79's FIT-02 checkpoint](https://github.com/connorturansky-svg/crystal-forge/issues/79#issuecomment-7084711574).
2. **Do not rebuild** #128/#132/#134. Reuse the accepted sloped Wave 11 mm measured-profile fixture and investigate the near-edge valid/rejected boundary in Chromium and production STL/3MF. Only fix a reproduced defect in a focused draft; retain all prior test evidence and history.
3. Keep the missing `support-free shoulder` search entry under [#127](https://github.com/connorturansky-svg/crystal-forge/issues/127) as a separate small follow-up, not part of the FIT-02 geometry PR.
4. Leave the current #130/#131 QA/documentation branches to independent reviewers. Work from the actual merged `main`; no direct pushes/merges without owner approval. Printed fit is not certified by CI.

## Evidence rules

- Actual committed source and GitHub PR **base branch** establish feature delivery; a merged stacked PR alone is insufficient.
- Exact-head Chromium and Manifold STL/3MF evidence validates software, not printed/tactile/thermal/structural safety.
- `docs/WT021_*.md`, `prompts/START_HERE.md` and older roadmap/handover paragraphs are historical, not current work orders.

### WT-022 regression evidence — 22 November 2026

- Production `main` at `bc33d2e4bd4c88891278229ca68e7ace28915bb9`. [Pages build and deploy](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45051989091) succeeded. [Main static](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45051989071), [native precision](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45051989009) and [measured profile recovery](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45051989087) passed.
- Search release source `dfa4f0a7ebc84a60f9fc47202b3748448a6ac12a` merged to main as `f6e1da1` via [#134](https://github.com/connorturansky-svg/crystal-forge/pull/134). Local Chromium used installed Three.js and Manifold dependencies for CDN requests. Each of the seven builders visited all eight destinations with Enter, used ArrowDown and Enter to focus the real edge-finish control, and retained the edit and model identity after reload. The targeted search suite also verified phrase ranking, Advanced mode, unavailable/setup guidance, 390 px navigation and prepared STL readiness.
- Real Manifold passed Crystal and native eight-pocket rings. The Chromium pattern suite verified line, ring and grid workflows and independently sectioned real STL and 3MF downloads across all seven builders. The Gear M1 top-entry opening measured 1.9489 mm radius near the top and 1.6995 mm deeper in both formats, a 0.2494 mm radial lead-in.
- **All six exact-head #134 workflows passed**: [static](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45052243685), [seven-builder edge finishing](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45052243774), [native precision](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45052243657), [measured profile recovery](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45052243725), [full Chromium](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45052243644) and [fabrication/Manifold](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45052243665). Post-merge [Pages deployment succeeded](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45063828028). The owner should still verify the actual published finder before closing #127.
- Printed fit, tactile feel and Cura observations remain open in [#10](https://github.com/connorturansky-svg/crystal-forge/issues/10).

## Next print-quality task — FIT-02 near-edge sloped Wave fitting

Target one compact measured pixel profile on a supported sloped Wave surface near its perimeter. The register already proves the central sloped Wave case. The near-edge case tests whether the remaining stock and insertion path agree when the same profile moves toward the perimeter.

1. Reuse the existing sloped Wave fixture and measured 11 mm profile. Establish a valid centre case, then move the fitting toward the perimeter until the existing minimum-stock envelope is breached. Record the actual pose, clearance, remaining stock and diagnostic.
2. In Chromium, place the valid seat by raycast and save/reload. Attempt the failing placement or drag through the same editor. Verify that the warning identifies the obstruction or missing stock and that the last accepted pose and revision survive.
3. Compare the accepted preview, production Manifold cutter and independently sectioned STL/3MF for entrance, bore diameter, seating depth and wall behind the seat. Use the measured calibration and existing stock limits from the fixture.
4. If a mismatch reproduces, fix the first divergent validation or cutter path in one focused draft under [#79](https://github.com/connorturansky-svg/crystal-forge/issues/79). If the fixture passes, record the new evidence in [FIT-02](WT021_COMPLETION_REGISTER.md) and retain open arbitrary-face combinations. A printed coupon and real LED insertion remain under [#10](https://github.com/connorturansky-svg/crystal-forge/issues/10).
