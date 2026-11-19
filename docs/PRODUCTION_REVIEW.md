# Pixel Model Maker production review

Baseline `fc9f900936a6b8a81a15e634ba37f4808b047389` contains WT-016 through [PR 62](https://github.com/connorturansky-svg/crystal-forge/pull/62) and WT-017 through [PR 64](https://github.com/connorturansky-svg/crystal-forge/pull/64).

## Open the review build

Check out the candidate PR head from GitHub. From its root, run `python -m http.server 4321 --bind 127.0.0.1` and open http://127.0.0.1:4321/. Use a fresh browser profile for the demo and a copy of a project for recovery exercises. The preview needs network access for its normal CDN dependencies.

1. From Home, create a Crystal Cluster and a Tactile Tile. Select each via the bottom rail, change a design setting, resize the side panels, and switch back to confirm the two models retain distinct settings.
2. Open Build, create a measured pixel profile, and place a fitting on a verified solid area. Try the same profile on a second family. For an eligible Tile or decorative Gear, enable serial channels and check P1, direction and cable-length feedback. A bore-only model should keep its fitting actions.
3. Save a project in Library and download a complete backup. Review the JSON file, cancel once and then recover a copy. Open it explicitly from Saved Projects. A private GitHub connection is optional.
4. From Print Centre, prepare a job with matching printer, nozzle and material. Compare the prepared X, Y and Z values to the production-pack manifest. Import the 3MF into Cura and compare its size in millimetres. If using the STL parts, import them together to preserve the common origin.

## Evidence and remaining acceptance

The PR checks identify the exact head. Use `npm run test:static` for static, document and mocked vault checks, `npm test` for Manifold/export checks, `npm run test:benchmark` for representative preparation time and `npm run test:browser` for Chromium over a local server.

| Area | Evidence and scope |
| --- | --- |
| Design and Build | Existing Chromium coverage exercises model switching, resizable panels, hardware selection and a seven-family placement fixture. Manual orbit and independent camera checks on each family remain pending. |
| Fittings and routing | WT-017 supplies representative native fabrication fixtures. Crystal placement, routing and cutaway have separate regressions. A passing example gives no guarantee of seating on every preset. |
| Library and recovery | Chromium covers saved-project and template workflows and JSON recovery. Mock tests exercise conflicting sources and interrupted writes. A stale local tab is blocked from overwriting the newer stored workspace. Live private vault use across two computers remains pending. |
| Print handoff | Chromium downloads a 3MF and pack and compares exported coordinates with the manifest dimensions. Cura and physical checks are pending. |
| Layout | Chromium checks viewport overflow and global-action visibility in four widths and two themes. Detailed visual and keyboard acceptance remains pending. |

## Physical review checklist

- In Cura, confirm actual printer, nozzle, material, size, layer preview, supports, orientation and thin features.
- Print a fitting coupon using the intended material and hardware. Measure the result and test retention and removal.
- Fit the real cable. Check wire exits, pinch points, bend radius and assembly access.
- Check illumination with the actual LEDs and printed material. The geometric audit is limited to sampled paths.

## Issue ledger

- WT-017 #63 and WT-016 #59 have merged implementations. Manual acceptance remains recorded here.
- #10 remains the production QA and physical-validation tracker.
- #51 remains held. External SVG #36/#37 remains isolated.
- Older broad phases #1 and #6–#9 still contain unresolved or unverified scope. The contributor and workflow issues #31, #33, #38 and #39 remain separate.
