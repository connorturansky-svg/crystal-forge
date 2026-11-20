# WT-021 development handover

## Release state

- The owner merged [#102](https://github.com/connorturansky-svg/crystal-forge/pull/102), [#103](https://github.com/connorturansky-svg/crystal-forge/pull/103), and [#104](https://github.com/connorturansky-svg/crystal-forge/pull/104). The local candidate branch `wt021/integration-after-109` includes the merged UX work from #106 through #109 and the WT-021 follow-up through `19eb524`. The individual follow-up commits are on `wt021/verification-after-104`.
- The local follow-up includes the floating Build render control, visible preparation errors, taller Crystal bases, fresh Library templates, named saved models, and aligned two-material 3MF assemblies. The branch awaits a confirmed PR destination and exact-head GitHub CI.
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

The latest archived full unified Chromium run passed at `4100daa`. The full Manifold catalogue suite passed at `3189f0f`, including independent 18 mm depth and 5.15 mm bore measurements from both Tile exports. These runs cover local evidence. The acceptance gate still requires CI on the published candidate head.

## Resume

Read [WT021_NOW.md](WT021_NOW.md) and [WT021_RUN_LOG.md](WT021_RUN_LOG.md), then run `npm run wt021:status`. Keep software acceptance under [#79](https://github.com/connorturansky-svg/crystal-forge/issues/79) and the original [WT-021 requirements](../prompts/021-complete-seven-builder-manufacturing-parity.md). Record meaningful changes in the acceptance register, run log, status, and owner summary.
