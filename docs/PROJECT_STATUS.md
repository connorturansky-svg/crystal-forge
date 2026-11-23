# Current work — Crystal Forge / Pixel Model Maker

## Latest owner-approved work — 22 November 2026

**Authoritative milestone:** [WT-023 Library/project folders and reliable private GitHub sync #137](https://github.com/connorturansky-svg/crystal-forge/issues/137). Four decisions approved: **single-level collapsible projects**, **one active project with `Project : Model` tabs**, **shared version-aware pixel/printer profiles with project selections**, **manual conflict-safe sync to a private GitHub repository**. No PIN, hosted account or automatic whole-Studio cloud sync.

**Production at this audited handoff:** `main` `dddb172a26b5d9e2b70df607951f938069b62ab3`, including merged [#135 Wave export repair](https://github.com/connorturansky-svg/crystal-forge/pull/135) and [#136 search follow-up](https://github.com/connorturansky-svg/crystal-forge/pull/136). Pages deployment succeeded at [run 45083277341](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45083277341). Main static, native precision and measured-profile checks passed; browser/fabrication runs were in progress when audited. All checks must be reverified on the actual later SHA before any claim.

**Codex next:** [#138 WT-023A](https://github.com/connorturansky-svg/crystal-forge/issues/138) **only**, starting from current main; [fast one-page runbook](WT023_CODEX_FAST_START.md). [#144 architecture blueprint](https://github.com/connorturansky-svg/crystal-forge/pull/144) and [#146 test-only project-index prework](https://github.com/connorturansky-svg/crystal-forge/pull/146) are separate drafts. #146 exact-head static and seven-builder edge checks passed at the most recent audit, with longer Chromium/Manifold runs in progress. Use #146's test-only code **only after checking its final CI and owner merge/cherry-pick instruction**; do not duplicate it.

**Independent QA:** [#131 fail-closed docs-only CI optimisation](https://github.com/connorturansky-svg/crystal-forge/pull/131), owned outside Codex; exact-head static/edge/fabrication checks passed, browser still pending at last audit. Never merge #131/#144/#146 automatically. Hardware owner [#10 first-print and fit acceptance](https://github.com/connorturansky-svg/crystal-forge/issues/10) remains open and unrelated to this Library upgrade.

**Source truth:** WT-015/WT-016 collections/templates/private vault are implemented. A saved Studio project in `state.savedProjects` is a **snapshot with `snapshotId`**, often the same `project.id` as its parent. Folders must not silently collapse or delete saved revisions. Prefer additive, reversible source contracts over a new competing store.

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
