# WT-021 — Current actionable state (overwrite the pointer, preserve the log)

**Read this first on each Codex restart.** Keep ≤45 lines; this is an initial snapshot, not a live status service. Actual head and CI must be fetched.

- **Current baseline:** #110 merged into `main` at `5732e33` (exact-head static, Chromium and Manifold all passed). P0 profile-data follow-up is now [draft PR #113](https://github.com/connorturansky-svg/crystal-forge/pull/113), branch `wt021/profile-integrity-after-110`; refresh exact final SHA and CI.
- **Last all-three-workflow-green:** PR #110 exact head `06a632c` (static/Chromium/fabrication). #113 is not yet verified.
- **Acceptance:** Seven independent family journeys and UX-01 verified at 8083c547b76b5b1df4b547ffccc3ceb6b5765439. Remaining software gates are partial.
- **Authoritative documents:** [completion register](WT021_COMPLETION_REGISTER.md), [approved full WT-021 brief](../prompts/021-complete-seven-builder-manufacturing-parity.md) and [engineering handover](WT021_CODEX_HANDOFF.md).
- **Owner constraints:** owner controls final merge/deploy, not routine commits; GitHub development branch is not review-protected. Real Cura and physical proof are tracked under #10, software parity under #79.

## Next executable step

- **Target:** Verify PR #113 safe measured profile save, 31st-profile refusal, wrong-target deletion prevention, private vault and two-browser complete-backup restoration. Confirm all exact-head CI before merge.
- **Checkpoint:** all seven browser fixtures have local Design-to-download evidence. Crystal supports manual through-holes with edge tabs. Rotary Caps explicitly distinguish moving from stationary. The Features and What’s New catalogue passed local navigation, state, layout and keyboard tests.
- **Next test:** Inspect PR #113 browser run failures (if any); reproduce the new Tile quota/retry/restore path and keep all existing Crystal/native tests green. Then resume remaining five partial acceptance rows.
- **Then:** Restore DIM-01 from the original owner STL/project sample, extend FIT-02/FIT-03/PAR-02; physical Cura/printing remains under #10. UX-03 selected-body dimensions remains separate.

## Resume instruction

Check branch, working tree, actual remote HEAD and relevant exact-head CI. If this task was completed, move to the next unverified dependency instead of rerunning it. Before interruption **overwrite this pointer** with current tested state/one next command, append a terse `WT021_RUN_LOG.md` checkpoint, and update coordination issue #105. The original PR #102 is merged.

## After publishing the integration draft

Profile integrity takes priority over new authoring features. Reproduce the findings in issue #79 with disposable profiles and two clean browser contexts. Prevent silent eviction at 31 profiles, make failed calibration writes preserve the prior model and profile library, and round-trip custom profiles through complete backups and the private vault. Test quota errors, retry, conflicts and legacy restoration.

## UX-03 advanced part editing

Track separately from WT-021 P0 manufacturing. Add Reset to default size without changing styling or unrelated settings. Add independent width, depth and height controls for a selected additional body, starting with the raised body of a Rotary Control Cap. Add Reset selected body dimensions. Verify preview, undo and redo, save and reload, measured STL and 3MF parity, and rejection of invalid geometry.
