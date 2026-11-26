# WT-025 / WT-024 interface polish — implementation checkpoint

Refs #154 and #152. This is one shared implementation branch for the owner’s interface refinements, not a second Help registry. Baseline main `66994cc98d3ef9bd68ef38161fd7a2b78fef8dbb` includes #163 and #172. First checkpoint: replace duplicate toolbar actions with one visible Info entry to the existing accessible dialog; preserve feature search, tabs, Escape and focus return. Keep `helpBtn` as stable internal ID. Existing default Help tab retained intentionally.

Tests changed: browser smoke, features keyboard journey, workspace legibility and unified Studio toolbar. No local execution in GitHub API mode; exact-head CI is required. Remaining checkpoints in this same PR: audit native titles and effective off states, reduce repeated triggers, verify clean defaults/migration and the deployed-only since-last-visit summary. Do not merge a partial checkpoint. Coordinate release version with #169 and #158; reconcile current main before final review. No project, geometry or export changes.


## Checkpoint 2 — preference and native-title behaviour

Fresh browsers now start with both optional help controls off, while explicit v1 choices and the legacy Descriptions on/off choice are migrated. The shared registry suppresses ordinary native HTML title hints when hover is off, including newly inserted controls and title changes, restores their latest text when enabled, and keeps existing accessible names/blocked-action reasons. Tests explicitly enable hover when that is what they exercise. Disabled-action reasons remain available intentionally. Remaining: reduce redundant question marks, deployed-only visit summary, verify exact-head CI and manual accessibility/visual gaps. No local browser execution.


## Checkpoint 3 — lower-density help and release highlights

A non-touch desktop hides extra question buttons only when both modes are enabled and that setting has inline guidance; coarse pointers retain touch help. The version highlights read the running build’s generated current/archived release notes, not the unreleased section. Read state is one browser-local key per acknowledged version, explicitly written only by the user; earlier tabs cannot overwrite newer markers. Missing/corrupt/blocked storage is handled conservatively, with no fabricated read status. First visits show the current version only. This is an acknowledgement-based summary, not a remote deployment detector or automatic classification of historical notes. Added pure tests and real browser Info/keyboard and help-density assertions. Final exact-head CI, manual screen-reader/visual checks and release-version coordination remain mandatory.


## Checkpoint 4 — final acceptance hardening

The current release notes have authored Moved/Changed/New labels. The summary supports all five specified categories, leaves unclassified historical notes unchanged and does not guess what old changes meant. A cross-tab acknowledgement restores focus if it hides the focused Mark as read button. Browser tests exercise touch with both modes enabled and read-state persistence across reload. Existing Help/Features navigation remains authoritative; historical notes do not invent deep links. No local browser execution or manual screen-reader claim. The current candidate is not a verified public deployment.


## Checkpoint 5 — reconciliation after WT-026

Candidate v0.16.0-dev.35.50 is based on merged WT-026 (#158) at `2d9a377ba8ffc6fdbb6b6fbf76a9e9bf0e7b17bf`. Preserves gear controls, geometry, tests and .35.49 release history while integrating Info. Static entry point runs both focused suites; shared Library fixture isolation is retained once. Exact new-head CI and manual visual/accessibility review remain required; this is not a release claim.
