# AI handover — read immediately after AGENTS.md

**Updated:** 11 November 2026. **Repo:** `connorturansky-svg/crystal-forge`. **Production:** v0.11.0 (PR6 merged). **Active:** draft PR #12 v0.12.0 on `feat/pr7-lightpaths-hardware-print-performance`.

## PR7 handover (11 November 2026)

- PR: https://github.com/connorturansky-svg/crystal-forge/pull/12. Full implementation/physical acceptance: `docs/PR7_MANUFACTURING_COMPLETION.md`.
- **Latest user issue:** lone LED with `wireExit=false` had no physical groove; now explicit warning and one-click route-to-edge, edge cutter actually exits base, other LED flanges are obstacles. 3D cyan volumes show planned width/depth, BOT/Prepare Print show actual cut.
- `pixel-profile-diagram.js`: A–G live measured SVG, clickable letters; B includes cap E. `putSocket` corrected to actual positive Y body depth instead of starting from -3 mm, cap and wire relief honor profile with truncation warnings. Stepped coupon made with the real cavity cutter.
- `light-port-plan.js` makes opt-in vault-to-spike channels and reports cut/skipped bores, not guaranteed optical connection. Detached M3-style plate STL implemented, not load-rated.
- `cura-model-advisor.js` model-derived nozzle recommendation with explicit opt-in; worker-stage timing and extended 10/16/40/60 benchmark added.
- Keep PR7 draft until final SHA static, browser and Manifold tests plus Cura actual slices, LED/wire fit samples, optical and plate strength are reviewed.

## PR6 all-phase handover (11 November 2026)

- PR: https://github.com/connorturansky-svg/crystal-forge/pull/11. Based on main `fb0f2843e8a802a420932a65737b14f58ba715f5` (merged PR5).
- **A:** `print-quality.js` real model nozzle, roof, wire and Cura review; printable checklist.
- **B:** `optical-audit.js` per-spike candidate proximity, explicit unverified statuses, optional `pixelRetentionLip` inside Manifold cutter. Default off.
- **C:** `split-joints.js` conservative base dowel plan, matching split STL recesses, separately printed pegs.
- **D:** `design-workflows.js` shape presets, hardware X/Z grid snapping and Shift-drag repositioning of existing manual holes.
- **E:** `production-pack.js`, reusable `encodeSTL`, a binary one-download ZIP with model, project, Cura candidate and build notes.
- Full accepted/pending matrix: `docs/PR6_ALL_PHASES.md`; tracked issues #6–#10 remain open for real physical/optical/Cura and unfinished advanced work.
- Mandatory: exact-head CI/static/browsers/Manifold tests, physical LED/dowel fit, Cura import, optical/roof review before merging. Preview or model topology does not certify physical safety.

## PR5 handover (11 November 2026)

- PR: https://github.com/connorturansky-svg/crystal-forge/pull/5 · base production SHA `6d43803ff22f4f1c812a498a83196457a38f1690`. PR4 was already merged at start.
- Cura generator added: `cura-profiles.js` and Print controls export a machine-aware .curaprofile ZIP with UM3 Extended AA 0.25/0.4/0.8, UM2+ 0.25/0.4/0.6/0.8, PLA/PETG, quality and print intent. Generated archives are unit-tested but real Cura import is still a manual gate. See `docs/CURA_PROFILE_GENERATOR.md`.
- Master backlog now groups all unfinished items into **five large delivery packages A–E**; the original detailed technical phases remain below. Do not call later packages done.
- Implemented on branch: `wire-routing.js` optional underside route planner shared by hardware/build and Manifold cuts, cyan routing preview, CSV, route metrics and warnings; pixel-specific print-fit coupon; `print-advisor.js` roof-span proxy; custom machine X/Y/Z fit.
- Reduced GitHub Actions noise: browser test output is now an artifact, with no automated main-branch log commit.
- **All known pending phases:** `docs/PR5_MASTER_IMPLEMENTATION_PLAN.md` is the authoritative cross-phase queue. Only features with code and tests are implemented; all mechanical and optical guarantees remain pending real prints.
- Latest CI must be checked at exact PR SHA. New UI/Manifold tests were added. Do not claim physical fit, actual light access or safe roof bridging based on a code test.
- Next action: run/review static + fabrication + browser CI, correct regressions and inspect in Cura; leave PR5 draft until signoff.

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
