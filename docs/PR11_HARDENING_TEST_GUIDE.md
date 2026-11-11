# PR11 — v0.14.1 production hardening test and acceptance guide

**Status:** Draft software milestone based on merged PR10/v0.14.0. Green CI does **not** certify actual Cura results, lighting or mounting.

## Automated merge gates
- `npm run test:static` including `tests/production-hardening.test.mjs`.
- `npm test` for real Manifold STL/3MF and groove geometry.
- `npm run test:browser` on a locally served app for UI/download behaviour.
- Require all three GitHub workflows on the exact current PR HEAD. Root `*.js` changes must trigger browser and fabrication checks, including `manufacturing-fingerprint.js`, `github-vault.js` and `project-library.js`.
- Validate that changing physical pixel pitch, bend radius or either cable-tail length makes the prepared-mesh fingerprint change. Visual-only arrows/labels must not.
- Validate all 40 named designs remain recoverable; a 41st save fails explicitly instead of evicting another. Old over-limit data must remain visible in complete backups.
- Validate malformed or over-limit cloud imports make no edits. Interrupted writes must retain a unique pre-import backup and attempt rollback.
- Verify Disconnect, Pull and Restore pause auto-sync. Reconnecting requires a fresh token; no tokens are stored in project JSON or public GitHub source.

## Manual desktop acceptance
1. Download a complete local backup before testing; recover original measured gumdrops from their original browser if still available.
2. Save, open, rename through another saved copy, export, import and inspect several projects. Try adding project 41 and verify it cannot silently remove project 1.
3. Import backup on a second browser/computer. Compare measured profile values, all saved models, and templates.
4. Connect the dedicated PRIVATE GitHub vault with a fine-grained token. Pull + merge, inspect conflicts, and only then deliberately enable auto-sync.
5. In Build, exercise 1/2/6-pixel routing, P1/reverse, opposed ports, drag handles, 25/50/100 mm constraints, red failures and no partial grooves.
6. Prepare a model, change cable spacing/bend/tail setting and check STL/3MF and production ZIP are disabled until re-preparation.
7. Cancel/retry heavy models; edit during preparation; check no stale exports and no browser freeze. Repeat at 10/16/40/60 crystals and record memory and elapsed times.

## Physical print release gates — not covered by CI
- Import actual generated UM2+ 0.8 mm PLA Cura profile or apply the manual settings text, and confirm its visibility under the installed printer/nozzle/material combination.
- Slice exported objects on supported UM2+/UM3 Extended configurations; inspect base roof, 0% infill, wall thickness, blocked root passages and cables layer by layer.
- Print measured gumdrop/LED fit coupons and a translucent connected cluster. Check every intended spike illuminates, real wire pitch and bend/strain relief, and serviceable LED extraction.
- Print modular pegs/plates if used. Check assembled tolerance, fasteners and independent safety retention. No overhead claims without an appropriate separate engineering assessment.

Record the exact commit SHA, saved project JSON, slicer settings, actual-versus-expected results, and images for every failure. Continue tracking issues #1 and #6–#10 until those physical gates are complete.
