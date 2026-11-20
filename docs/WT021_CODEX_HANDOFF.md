# WT-021 development handover

## Updated handover after #110 merge

- **New main:** `5732e33` (merged PR #110, exact-head static, browser and fabrication passed). Codex credits exhausted; the independent agent is continuing via draft [PR #113](https://github.com/connorturansky-svg/crystal-forge/pull/113) from that main.
- **Current P0:** measured custom-profile capacity, atomic save and delete safety, complete backup/vault round-trip and conflict-safe recovery. New unit and isolated two-browser Chromium tests are in #113. **Do not claim validated until exact-head CI passes.**
- **Parallel release QA:** PR #111 improves CI trigger coverage; PR #112 tests the actual staged GitHub Pages package. Neither is part of #113. Owner reviews/merges.

## Release state

- The owner merged [#102](https://github.com/connorturansky-svg/crystal-forge/pull/102), [#103](https://github.com/connorturansky-svg/crystal-forge/pull/103), and [#104](https://github.com/connorturansky-svg/crystal-forge/pull/104). The local candidate branch `wt021/integration-after-109` includes the merged UX work from #106 through #109 and the WT-021 follow-up through `19eb524`. The individual follow-up commits are on `wt021/verification-after-104`.
- The local follow-up includes the floating Build render control, visible preparation errors, taller Crystal bases, fresh Library templates, named saved models, and aligned two-material 3MF assemblies. The former integration work is now merged in PR #110. The separate P0 data-integrity follow-up is #113.
- Check [coordination issue #105](https://github.com/connorturansky-svg/crystal-forge/issues/105) for Jordan’s current scope and files before each milestone. Jordan’s UX-02 work merged through [#109](https://github.com/connorturansky-svg/crystal-forge/pull/109). WT-021 retains core geometry, fabrication, fittings, STL/3MF and UX-01. The owner controls merging and deployment.

## Acceptance to finish

The [completion register](WT021_COMPLETION_REGISTER.md) records all 24 acceptance rows and the supporting tests. Five remain partial.

| Requirement | Evidence to gather |
| --- | --- |
| DIM-01 | Use the original owner STL and matching project revision to identify the first stage with divergent dimensions. For the Render actual model failure, obtain the saved Truncated blade fan revision 398. The fresh template already prepares and exports. |
| FIT-02 | Extend measured housing, cutter and stock diagnostics to additional eligible face/profile combinations. Use the calibrated perpendicular Tile test as the paired browser and STL/3MF example. |
| FIT-03 | Verify additional eligible non-underside routes with connected passages, measured clearance, exterior openings, bend radius and sufficient stock. Preserve the rejection of unsupported placements. |
| PAR-02 | Exercise remaining native edit combinations with exact undo, reload preservation and stale-download invalidation. |
| PAR-04 | Confirm direct extruder assignment in the imported 3MF with both tools enabled in Cura Desktop. Desktop accepted PLA profiles on both target printer definitions. Offline CuraEngine emitted separate toolpaths for the extracted primary and secondary bodies. Record physical fit and print evidence under [#10](https://github.com/connorturansky-svg/crystal-forge/issues/10). |

Local candidate `b71f0b9` passed release metadata, all static checks, all ten browser suites and all six fabrication suites. PR #110 passed all three exact-head GitHub checks before merge. P0 profile-integrity draft #113 requires its own exact-head checks.

## Resume

Read [WT021_NOW.md](WT021_NOW.md) and [WT021_RUN_LOG.md](WT021_RUN_LOG.md), then run `npm run wt021:status`. Keep software acceptance under [#79](https://github.com/connorturansky-svg/crystal-forge/issues/79) and the original [WT-021 requirements](../prompts/021-complete-seven-builder-manufacturing-parity.md). Record meaningful changes in the acceptance register, run log, status, and owner summary.
