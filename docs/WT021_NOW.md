# WT-021 — Current actionable state (overwrite the pointer, preserve the log)

**Read this first on each Codex restart.** Keep ≤45 lines; this is an initial snapshot, not a live status service. Actual head and CI must be fetched.

- **Current baseline:** The owner merged #102, #103 and #104, then the UX work in #106 through #109 at `eea22c6`. Local branch `wt021/integration-after-109` combines the WT-021 follow-up at `19eb524` with that base. The original follow-up branch preserves the individual commits.
- **Last confirmed all-three-workflow-green checkpoint:** 8083c547b76b5b1df4b547ffccc3ceb6b5765439. Verify the current SHA separately.
- **Acceptance:** Seven independent family journeys and UX-01 verified at 8083c547b76b5b1df4b547ffccc3ceb6b5765439. Remaining software gates are partial.
- **Authoritative documents:** [completion register](WT021_COMPLETION_REGISTER.md), [approved full WT-021 brief](../prompts/021-complete-seven-builder-manufacturing-parity.md) and [engineering handover](WT021_CODEX_HANDOFF.md).
- **Owner constraints:** owner controls final merge/deploy, not routine commits; GitHub development branch is not review-protected. Real Cura and physical proof are tracked under #10, software parity under #79.

## Next executable step

- **Target:** Measure the original Crystal sample STL when it arrives and compare its extents with the matching project revision. Reproduce the preparation failure with the saved Truncated blade fan revision 398 if available. A fresh copy prepared and exported both formats on deployed `7d746d3`.
- **Checkpoint:** all seven browser fixtures have local Design-to-download evidence. Crystal supports manual through-holes with edge tabs. Rotary Caps explicitly distinguish moving from stationary. The Features and What’s New catalogue passed local navigation, state, layout and keyboard tests.
- **Next test:** Verify the remaining native edit combinations, starting with a prepared Cap whose fitted socket is edited, undone and redone. The equivalent prepared Pod calibration already passed. Local candidate `b71f0b9` passed static, browser and fabrication suites.
- **Then:** continue FIT-03 and PAR-02 from the completion register. Keep physical validation under #10 and verify CI once the follow-up has a confirmed PR destination.

## Resume instruction

Check branch, working tree, actual remote HEAD and relevant exact-head CI. If this task was completed, move to the next unverified dependency instead of rerunning it. Before interruption **overwrite this pointer** with current tested state/one next command, append a terse `WT021_RUN_LOG.md` checkpoint, and update coordination issue #105. The original PR #102 is merged.
