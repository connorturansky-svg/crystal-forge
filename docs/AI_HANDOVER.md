# AI handover — read immediately after AGENTS.md

**Updated:** 11 November 2026. **Repo:** `connorturansky-svg/crystal-forge`. **Production:** v0.8.0 (PR3 merged). **Unmerged:** v0.9.0 on `feat/pr4-help-base-pixels` (draft PR #4).

## PR4 handover (11 November 2026)

- PR: https://github.com/connorturansky-svg/crystal-forge/pull/4. Created from main commit `83633eda52293151172d3db5986b3b275d7eecbd`.
- Implemented three continuous base profiles with dome falloff/side-wall controls; seed/bullet/gumdrop nominal socket shapes and custom pixel-profile editor; saved profile library inside browser/project JSON; contextual Descriptions panel and mounting explanations.
- Fabrication planner accounts for the widest LED flange, Manifold cutter includes blind cap and two shallow underside wire-relief slots. No physical pixel retaining clip or full wiring channel exists yet.
- Added geometry and browser regression tests. The exact-head workflows must be checked; do not claim CI/physical validation from code inspection. The repository could not be cloned in this current tool environment, so no local test was executed.
- Avoid merging until CI and slicer inspections have been reviewed. Live Pages still reflects main.

## One-minute context

Crystal Forge is a static GitHub Pages/Three.js maker for low-poly faceted crystal clusters used in a young-person-facing interactive cave installation. Desired output is physical translucent, illuminated 3D prints, not only previews. The single most important technical distinction: **responsive overlapping preview meshes are not the manufactured, Boolean-joined STL**.

Default manufacturing follows **Cura-first solid exterior** with actual LED and mounting holes. Cura handles infill. An optional open underside **zero-infill vault** adds permanent tapered roof supports, LED collars and lateral side vents. A slower **experimental whole-cluster hollow** mode remains available separately. **0% Cura infill does not guarantee an open light path** or a self-supporting dome; slice-layer and physical tests still matter.

See `docs/FEATURE_SPECIFICATIONS.md` for controls/acceptance, `docs/DESIGN_DECISIONS.md` for reasons, `docs/ROADMAP.md` for outstanding work.

## Current source & recent completed work

- The live application is HTML/CSS + ESM Three.js with Web Worker + Manifold WASM (`index.html`, `studio-v3.js`, `geometry-v3.js`, `hardware-layout.js`, `hardware-editor.js`, `fabrication-v1.js`, `fabrication-worker.js`). `app.js` is an unused older demo.
- Versions v0.6.0–v0.7.0 expanded fully separated spacing, world-aligned lean presets, shoulder continuity, camera/studio lighting, Cura-first printing, Build-stage automatic/manual hole guides, and physical vault/collar geometry.
- Earlier geometry syntax regression was caught by Actions and repaired. World-space lean bug was fixed after user showed inward/one-way orientations rotating inconsistently.
- Last audited main head was `32b7697b8bb62eadee4061513f77d9a9e3066de0` (a CI log commit after release v0.7.0). **Always refetch HEAD** before starting; do not assume this SHA stays current.
- Recent known v0.7.0 Actions: Pages, browser and Manifold fabrication all passed for release commit `e72a9d0c4c1e0b0defefb7ab6072d33ce69cec47`. Some QA logs point to earlier runs; inspect run SHA.

## Current work / status

The shared AI documentation PR #2 was merged into main. The next user-directed refinement is developed in **PR #3**, branch `feat/global-crystal-diameter`. It includes new global crystal width and extreme taper controls with repeatable randomness, real rigid lean, buried root seating, lower/adjustable studio lighting, robust automatic pixel placement, a continuous valid/invalid circular LED cursor, rounded blind LED bores, configurable perimeter fixing tabs, and hover/focus explanations.

The app is **not yet deployed from this branch**. Tests on GitHub Actions must pass for the exact latest PR commit; do not infer physical safety, continuous light paths or Cura support-free performance from a manifold topology report.

## Immediate priorities

1. Review exact-head static, browser (two-click continuous LED mode, hover help, tab UI), and Manifold fabrication tests (tab fusion/hole counts, blind bore roof, extreme taper/root seating).
2. Inspect the new appearance in a real browser and inspect prepared STL in Cura to verify no top-through LED holes, physical hole fit and tab clearance. Print-test tie/bolt tabs before mounting anything overhead.
3. Once approved, merge PR #3 into production main and record deployment SHA in this handover. No independent agent should commit directly to main during PR review.

## Unresolved risks / do not overclaim

- Vault Manifold tests confirm representative connected topology, not actual FDM bridge reliability.
- Sockets may be cut yet fail to illuminate all spikes; Cura can generate solid skins at roots.
- Physical gumdrop retention, wire routing, actual tolerance, safe touch points, overhead mount strength and secondary retention are not certified.
- Experimental full-cluster hollowing is computationally expensive, approximate in wall thickness and may leave small crystals solid.
- Existing Playwright checks operate in headless Chromium and catch logs/downloads but do not mean a human saw the live site and approved its visual output.
- Manual placement UI exists but its actual click/X/Z/export round-trip needs stronger browser regression coverage.
- GitHub Pages deploys automatically on **main** pushes. Existing main browser CI historically commits QA logs back to main; avoid concurrent main writes and check remote head.
- A ChatGPT Chat GitHub connector can commit/read and inspect CI but does not inherently give a local desktop shell or interactive web debugger; Codex local can provide that if properly configured.

## Session handoff convention

End every substantive coding session with: branch + head SHA, changed files, intended user outcome, tests actually run and their links/results, unresolved defects/manual checks, last user decision and immediate next step. Update this file without rewriting historical decisions to fit new code. If work remains uncommitted in Codex local workspace, say that explicitly; the remote GitHub branch does not contain it.
