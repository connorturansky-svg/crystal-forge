# AI handover — read immediately after AGENTS.md

**Prepared:** 10 November 2026. **Repo:** `connorturansky-svg/crystal-forge`. **Current app release on main:** v0.7.0. **Documentation task branch:** `docs/shared-chatgpt-codex-workflow` (separate from production main).

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

The user asked to add **shared ChatGPT + Codex documentation and reliable PR testing**, not to change the appearance or bump the live app version. This task is being implemented on `docs/shared-chatgpt-codex-workflow`: `AGENTS.md`, design/feature/decision/architecture/history/roadmap/testing/handover/collaboration documents, static checks and PR CI. **Do not merge without confirming the actual branch tests and reviewing the PR.**

## Immediate priorities

1. Verify branch static syntax/import checks and any PR-triggered existing browser/Manifold tests for the exact PR commit.
2. Review PR for no accidental changes to production source, UI or `pages.yml`. If CI logs write to main on PR, guard them.
3. After review, merge the documentation/test changes to main and update this handover with the new merged commit; no app version increment for a documentation-only PR.
4. For feature work following this setup, priority is real Cura/physical validation of vaulted roofs + LED light paths, end-to-end manual hole interactions and systematic performance/legacy-file tests.

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
