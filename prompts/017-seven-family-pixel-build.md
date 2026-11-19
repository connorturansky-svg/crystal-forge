# WT-017 — Seven-family Build Pixel Fitting Workflow

> Owner requested this direct coding milestone. [Issue #63](https://github.com/connorturansky-svg/crystal-forge/issues/63). Exact approved immutable SHA pinned in the Issue. One draft PR to main, no automatic merging/deployment.
> Starting baseline main `4283400a6abb2fda7b66d4763fd3d808a82bf411`, merged WT-016 PR #62. Always recheck latest main and conflicts.
> Preserve WT-011 on hold and Jordan's independent SVG PR #37 untouched.

## Deliverables

1. Every model family (Crystals, Tiles, Gears, Waves, Control Caps, Characters, Light Pods) displays an obvious **Add pixel** control in Build. Crystal reuses existing Hardware Editor continuous click-to-place, auto LED and P1 selection; the six native families reuse the established numbered pixel/3D click-and-hold drag, automatic location search and editable X/Z/dimensions/rotation.
2. **Create / edit pixel profile** is visible before placing a pixel. Reuse the existing built-in A–G dimensions editor, and keep custom profiles in the browser's established reusable library. Named profiles selected for the next placement are usable on *another* family in the same browser without changing existing saved hole dimensions. Explain on the Build screen when changing a selected Pn affects only that fitting; calibrated actual fit is distinct from nominal measured dimensions.
3. A dangerous or missing printable bore is rejected by the existing conservative `pixelBoreIssue` and actual Manifold geometry with specific message and practical remedy. A separate *opt-in* integrated backing for qualifying native shapes must add **real positive printable geometry**, not merely fake preview markers. Do not auto-enable for existing models or silently overrule cavity/edge/mount/reused bore screening. Legacy geometry unchanged without opt-in.
4. Native Tile/Gear serial routing remains opt-in and verified; other native families clearly say bore-only/not routable, with no unsafe auto-routed channel. Keep Crystal P1→Pn, smooth serial lengths, 180° opposed ends and red warnings. Preserve fit coupons.
5. One valid prepared Manifold/3MF/STL fitting per six native families plus preserved Crystal native fitting regression, rejected unsafe/too-large fitting, save/reload including earlier project data, named profile cross-family use, and working browser Build tests at desktop/mobile.
6. One app version bump, CHANGELOG, What's New, AI handover, tests/screenshot evidence, one draft PR and no merge.

## Acceptance

- WT017-01: Seven families show Build/Add pixel and accessible Create/edit pixel profile; all actions work.
- WT017-02: Creating measured nominal profile before any placement survives opening another native model and selecting it, does not fabricate printed-fit calibration.
- WT017-03: Existing Crystal manual and automatic P1 pixels and saved projects preserve their exact positions and routes. New Add pixel reuses Hardware Editor, not a second Crystal planner.
- WT017-04: Six native family fixture placements pass conservative preflight and produce Manifold closed solids, cut volume reduction, STL and 3MF; where no safe material exists default rejects, then opt-in backing enables a fitting on supported shape with truthful warnings.
- WT017-05: Invalid placement (outside, thin, cavity, overlap) rejects without altering source and displays actionable next step.
- WT017-06: Native routed Tile/Gear still produce opposed serial channels and realistic budget checks; Waves/Caps/Characters/Pods remain clearly bore-only, with no fake channel; custom profiles reflect actual stored body diameter.
- WT017-07: Browser 7-family Build controls, profile creation/reuse, placement/rejection, screenshot; local/backup round-trip and real print job preparation unchanged.
- WT017-08: Exact-head static, Chromium, fabrication/Manifold, contributor checks, captured Build screenshots, release metadata and AI handover; physical prints/Cura fit remain manually unverified.

Do not implement general imported mesh routing, full pod optical cavities, unverified retention/strain relief or universal mechanical attachment. If a specific preset cannot pass material clearance, report it explicitly as unsupported rather than forcing a hole. No new dependencies or large schema migrations. Start on `feat/WT-017-seven-family-pixel-build` and open `[WT-017] Build pixel fittings across seven model families` as a draft PR to main with full pinned spec metadata and exact CI proof.