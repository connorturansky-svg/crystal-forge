# WT-023 shared resources and private backups — development checkpoint

Issues #141 and #142, parent #137. Single owner-facing project workspace milestone, separate D1/D2/E1/E2 acceptance gates. Continue after B2b #175. This branch contains real isolated candidate logic and tests, not a finished UI. Do not deploy it as a working catalogue or cloud connection centre.

## D1/D2
Reuse pixel-profiles.js, studio-profile-safety.js, studio-documents.js and cura-profiles.js. The new pure resource contract adds immutable revision snapshots and strict validation of new measurements, exact pinned resolution, built-in protection and effective printer-change detection. No schema/storage migration yet. The existing v1 pixel library remains authoritative until a tested additive migration is implemented. Do not add a second independent mutable store. Integrate into guarded workspace and hashed vault round trip; preserve measured A–G records, tags, calibration date, built-in read-only nominal profiles, duplicates/deletion warnings and model/job override scope. Supported Ultimaker presets are checked by existing Cura validator; custom machine definitions remain outstanding. Never claim physical fit or installed Cura import.

## E1/E2
Existing GitHubVault verifies private repo and holds credentials in memory. StudioVault verifies immutable assets and guards manifest SHA. Reuse these clients; do not create another credential path or enable unattended sync. New session-only status function distinguishes actual confirmed upload from connection/check, unsaved changes, changed remote and failed operations. Wire it to the existing real SHA/time and workspace digest; never label a check as upload. Add Library connect/disconnect UI using existing client, guard reconnect/repo switches, preserve two-device preview/recovery. Keep credentials out of logs/storage. No PIN or hosted login.

## Acceptance
Full requirements are preserved in archived/linked #141/#142. Run the focused Node contracts, real browser Library resource edits and cloud connection, mocked two-device conflicts, archive/vault migration and all applicable CI. Reconcile current main and #175 before shared editor integration. Update the user guide and release metadata once actual controls are mounted. No local browser or physical tests claimed by this checkpoint.
