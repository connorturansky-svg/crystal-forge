# Current work — Crystal Forge / Pixel Model Maker

**Snapshot:** 22 November 2026, after WT-022 B #132 merged and the independent search-release correction #134 opened. **This is not a live dashboard.** Recheck [main](https://github.com/connorturansky-svg/crystal-forge/commits/main), [open PRs](https://github.com/connorturansky-svg/crystal-forge/pulls), [Issue #127](https://github.com/connorturansky-svg/crystal-forge/issues/127) and [Actions](https://github.com/connorturansky-svg/crystal-forge/actions) before working.

## One-minute orientation

- **On production branch `main` at this snapshot:** [#128 WT-022 A](https://github.com/connorturansky-svg/crystal-forge/pull/128) merged precise grouped mounting patterns; [#132 WT-022 B](https://github.com/connorturansky-svg/crystal-forge/pull/132) merged eight focused Home, Library, Design, Build, Pixels, Wiring, Mounting and Print Centre workspaces at `bc33d2e4bd4c88891278229ca68e7ace28915bb9`.
- **Search not yet on `main`:** [#133 WT-022 C](https://github.com/connorturansky-svg/crystal-forge/pull/133) shows “merged” but merged only into stacked base `feat/wt022-workspaces` at `dfa4f0a7ebc84a60f9fc47202b3748448a6ac12a`. This was verified by comparing actual main and feature-branch search source.
- **Required release correction:** [draft #134](https://github.com/connorturansky-svg/crystal-forge/pull/134) is a frozen branch that targets `main` with the existing integrated search implementation. Run/verify **#134-specific** static, Chromium, Manifold/export and edge CI against main; owner decides when to merge. Do not confuse #133's merged label with a production release.
- **Superseded preparation:** [#129](https://github.com/connorturansky-svg/crystal-forge/pull/129) was closed without merge because its test-only search core was integrated into #133/#134.
- **Separate drafts:** [#130 documentation entrypoints](https://github.com/connorturansky-svg/crystal-forge/pull/130) is this repository-navigation update; [#131 docs-only CI efficiency](https://github.com/connorturansky-svg/crystal-forge/pull/131) must be reconciled with the current workflows, and both need exact-head review before an owner merge. They do not deliver WT-022 C.
- **Remaining product and print QA:** [#79 software parity](https://github.com/connorturansky-svg/crystal-forge/issues/79), [#10 physical print/fit acceptance](https://github.com/connorturansky-svg/crystal-forge/issues/10). [#51 modular assemblies](https://github.com/connorturansky-svg/crystal-forge/issues/51) remains held. Software tests cannot certify real pixel or magnet fit.
- **Other contributor drafts:** [#37 SVG engine](https://github.com/connorturansky-svg/crystal-forge/pull/37), [#42 Copilot pilot](https://github.com/connorturansky-svg/crystal-forge/pull/42), [#90 historical startup](https://github.com/connorturansky-svg/crystal-forge/pull/90) and [#101 tip styles](https://github.com/connorturansky-svg/crystal-forge/pull/101) are not automatic merge candidates.

## Credit-efficient Codex resume order

1. Check current `main`, #134 and #127's newest coordination comment, then read [AGENTS.md](../AGENTS.md) and [repository map](REPOSITORY_MAP.md). Do not restart former WT-021 #102 or rebuild the already-merged WT-022 A/B features.
2. **Until #134 is owner-merged**, preserve the existing search implementation; avoid creating a second search rewrite. Review/resolve real #134 check failures if present. After merge, verify the actual deployed Pages app, cross-workspace keyboard/mouse search/focus, seven builders, saved data and STL/3MF pipeline.
3. Prioritise real regressions and physical-print blockers under #79 and #10 over speculative feature expansion. Keep small scope and run targeted tests before exact-head release CI. Owner must approve merges and physical acceptance.
4. Review #130 as documentation and keep #131 as a separate workflow change. Reconcile #131 after the search release because both #131 and #134 modify browser and static CI. Leave unrelated contributor branches alone.

## What is authoritative?

- **Requirements:** owner request and [WT-022 Issue #127](https://github.com/connorturansky-svg/crystal-forge/issues/127).
- **Implementation status:** GitHub branch contents and PR target **base**, not only “merged” labels; exact-head Actions evidence, not older logs.
- **Deployment/physical:** Pages is published from `main`. A successful Playwright/Manifold test does not demonstrate physical printer or magnet-sensor fit.
- **History:** `docs/WT021_*.md`, `prompts/START_HERE.md`, and the older roadmap and AI handover chronology preserve previous decisions. Don't use their older active-PR statements as current tasks.

Use [repository map](REPOSITORY_MAP.md) to locate the relevant implementation and tests.

### WT-022 regression evidence — 22 November 2026

- Production `main` at `bc33d2e4bd4c88891278229ca68e7ace28915bb9`. [Pages build and deploy](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45051989091) succeeded. [Main static](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45051989071), [native precision](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45051989009) and [measured profile recovery](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45051989087) passed.
- Search release candidate `dfa4f0a7ebc84a60f9fc47202b3748448a6ac12a` in [#134](https://github.com/connorturansky-svg/crystal-forge/pull/134). Local Chromium used installed Three.js and Manifold dependencies for CDN requests. Each of the seven builders visited all eight destinations with Enter, used ArrowDown and Enter to focus the real edge-finish control, and retained the edit and model identity after reload. The targeted search suite also verified phrase ranking, Advanced mode, unavailable/setup guidance, 390 px navigation and prepared STL readiness.
- Real Manifold passed Crystal and native eight-pocket rings. The Chromium pattern suite verified line, ring and grid workflows and independently sectioned real STL and 3MF downloads across all seven builders. The Gear M1 top-entry opening measured 1.9489 mm radius near the top and 1.6995 mm deeper in both formats, a 0.2494 mm radial lead-in.
- Candidate [static](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45052243685), [seven-builder edge finishing](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45052243774), [native precision](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45052243657) and [measured profile recovery](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45052243725) passed. At this snapshot the full [Chromium](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45052243644) and [fabrication](https://github.com/connorturansky-svg/crystal-forge/actions/runs/45052243665) gates were running. Recheck both before owner merge, then verify the published finder at the resulting Pages deployment.
- Printed fit, tactile feel and Cura observations remain open in [#10](https://github.com/connorturansky-svg/crystal-forge/issues/10).

## Next print-quality task — FIT-02 near-edge sloped Wave fitting

Target one compact measured pixel profile on a supported sloped Wave surface near its perimeter. The register already proves the central sloped Wave case. The near-edge case tests whether the remaining stock and insertion path agree when the same profile moves toward the perimeter.

1. Reuse the existing sloped Wave fixture and measured 11 mm profile. Establish a valid centre case, then move the fitting toward the perimeter until the existing minimum-stock envelope is breached. Record the actual pose, clearance, remaining stock and diagnostic.
2. In Chromium, place the valid seat by raycast and save/reload. Attempt the failing placement or drag through the same editor. Verify that the warning identifies the obstruction or missing stock and that the last accepted pose and revision survive.
3. Compare the accepted preview, production Manifold cutter and independently sectioned STL/3MF for entrance, bore diameter, seating depth and wall behind the seat. Use the measured calibration and existing stock limits from the fixture.
4. If a mismatch reproduces, fix the first divergent validation or cutter path in one focused draft under [#79](https://github.com/connorturansky-svg/crystal-forge/issues/79). If the fixture passes, record the new evidence in [FIT-02](WT021_COMPLETION_REGISTER.md) and retain open arbitrary-face combinations. A printed coupon and real LED insertion remain under [#10](https://github.com/connorturansky-svg/crystal-forge/issues/10).
