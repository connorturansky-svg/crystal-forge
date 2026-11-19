# WT-020 — Final Software Completion, Seven-Builder Parity & Verified Production Release

> **Approval:** Owner explicitly requested the **final software consolidation and Codex implementation brief** on 19 November 2026. Creating/reading this file does not itself perform a merge or deployment.
>
> **Repository:** `connorturansky-svg/crystal-forge`.
> **Canonical active software issue:** [#79 — WT-019 True Model Parity](https://github.com/connorturansky-svg/crystal-forge/issues/79). **DO NOT create a new issue for this work.** Record remaining bugs and acceptance under #79.
> **Planning file:** `prompts/020-final-software-parity-release.md` on `planning/prompts`; use the exact pinned planning commit supplied in the Codex launch instruction.
> **Target:** One coherent, verifiably working, updated and published Crystal Forge / Sensory Model Studio website, with seven model families and safe SVG/STL/OBJ importing, **zero outstanding P0/P1 software parity regressions**, concise current documentation, an accurate backlog, and measured software evidence for every shared tool.
> **Authority:** Owner previously reserved final PR merges, GitHub Pages deployment and physical approval. **Develop, test and create merge-ready draft PRs, but do not autonomously merge, deploy or publish.** If and only if the owner explicitly authorises merges in the active Codex session, merge in reviewed/tested dependency order and verify the actual `main` and Pages SHA. Otherwise give exact merge instructions and continue non-conflicting work on an integration head.
> **Out of scope:** WT-011 modular joining/splitting [#51](https://github.com/connorturansky-svg/crystal-forge/issues/51) remains **ON HOLD**. Real filament/Cura/LED/cable/optical/temperature/structural testing remains **physical #10** and must never be certified from software. Jordan's separate SVG contribution [#36/#37](https://github.com/connorturansky-svg/crystal-forge/pull/37) and owner contributor/Copilot administration [#33/#42](https://github.com/connorturansky-svg/crystal-forge/issues/33) are independently owned. Preserve provenance; do not auto-close or merge their PRs.

## A. What has ALREADY been verified (recheck live before changing any source)

As of **19 November 2026, ~14:46 UK time**:
- Latest verified `main`: `50be3d8dc8fcbe8971c84692edb91993c64566c7`, after **PR #80 merged WT-018 integration**. GitHub Pages [deployment for exactly that SHA](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44529860710) reported success. This **does not prove** all UI interactions work.
- WT-018 branch-only changes #72–#75/#77/#78 were consolidated via #80; **do not re-cherry-pick** old branches. The live `docs/AI_HANDOVER.md`, `docs/ROADMAP.md` and planning index STILL include stale descriptions claiming #80 is draft: **reconcile these facts**.
- [Draft #84](https://github.com/connorturansky-svg/crystal-forge/pull/84), `wt019/main-gear-placement`, is **based on main**, head `bda63968735a8c4e90aa0aa3a1df2bdd42309273`. **Exact-head static, browser and fabrication workflows passed** at audit. It consolidates earlier #82/#83 and partly improves Gear double-click, selected opening and default wire-guide visibility. It still uses an oriented/disclosed **vertical through-bore**, not arbitrary 3D normal-aligned sockets.
- [Draft #85](https://github.com/connorturansky-svg/crystal-forge/pull/85), `wt019/native-family-acceptance`, **stacks on #84**, head `e39755f2cc2baecd90f2ef88b4ff1c6c7015bd4c`. At final audit **static, fabrication AND browser workflow succeeded for that exact head** (browser run [44545834475](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44545834475)). It covers six native family double-click cases, but not complete mounts, all tools, Library/Print and arbitrary face manufacturing. Older browser runs failed; never cite those heads as accepted.
- [`docs/MODEL_BUILDER_PARITY.md`](https://github.com/connorturansky-svg/crystal-forge/blob/main/docs/MODEL_BUILDER_PARITY.md) still classifies most capabilities **L = limited** and native contextual mounting **M = missing**. A bigger test count does not upgrade an L to fully verified P.
- The owner's **actual Gear screenshot** showed P1–P4 on a decorative/openwork gear, but **double-click did not add a pixel, normal Add pixel placed a fitting on the wrong visible face and wiring wasn't visible**. Reproduction is consolidated in [#79](https://github.com/connorturansky-svg/crystal-forge/issues/79), with archived duplicate #81. The user wants all these fixed through real interactions and geometry, not renamed buttons.
- SVG extrusion and STL/OBJ importer **exist on main**, with strict validation/preview-only limits; imported meshes have no reconstructed procedural CAD history. Preserve safe topology gates.

Before editing, read the latest **actual** `AGENTS.md`, current `main`, open PRs and CI, Issue #79 and comments, `docs/AI_HANDOVER.md`, `docs/ROADMAP.md`, `docs/MODEL_BUILDER_PARITY.md`, `docs/BACKLOG_TRIAGE.md`, `docs/PRODUCTION_REVIEW.md`, accepted vision/specifications/design decisions, `docs/TESTING.md`, `prompts/019-true-studio-model-parity.md` pinned at `10cdb618b0a0a0f09affbd4cdcab3d2c45525045`, `prompts/WORKFLOW.md` and `prompts/HANDOVER_PROTOCOL.md`. Compare live source and tests with historical claims.

**Owner has asked the chat assistant to handle planning/index, issue hygiene and status auditing; Codex owns complex implementation, browser interaction testing, Manifold code, integration and app release documentation.** Avoid simultaneously editing planning files or GitHub issue body while a separate assistant is doing those edits. Use comments on #79 for engineering evidence.

## B. Non-negotiable definition of FULL SOFTWARE PARITY

Seven procedural families:
1. Crystal Clusters
2. Tactile Texture Tiles
3. Gears & Cogs
4. Waves & Organic Forms
5. Buttons & Control Caps
6. Characters & Silhouettes
7. Glowing Pebbles & Light Pods

And imported SVG/STL/OBJ **where validation, real mesh/solid geometry and source semantics allow**.

**Every applicable common tool must exist in the same logical workspace and have equivalent actual behaviour across all seven.** This means discovery, operation, feedback, precision controls, selected-object state, proper 3D placement, undo/redo, physical constraints, source persistence, prepared printable mesh, Library and Print Centre—not merely matching buttons. **Preserve the richest shared Crystal features as the target standard**; never delete them to make the weakest builder equal. Family-specific controls stay distinct.

One complete journey, every family:
**Create/Import → Design/preset/transform → Build → double-click real model to add pixel or mount → select, hold-drag, rotate, precisely edit, reorder → show numbered physical string and direction → choose spacing and route options → verify cutaway/Manifold geometry → save, reopen and sync/backup → Print Centre → STL/3MF and production pack**.

A parity capability becomes **P = proved** only after actual browser interaction, state change, save/reopen and true prepared geometry (where relevant). Other statuses: **L limited/under-tested; M missing; B genuine demonstrated physical geometry restriction with a clear explanation in the UI; N/A conceptually inapplicable** with justified exception. Don't change a failing case to N/A/B to falsely achieve an all-green chart.

Implement and verify **all P0/P1 shared functions**. P2 aesthetic/exploratory extras may be archived with explicit owner approval, rather than blocking a dependable software release.

## C. Priority 1 — really FIX the three owner-observed Gear failures

Reproduce the screenshot's **four-pixel decorative/openwork Gear** (ISO, TOP/BOT, front/back, Solid/Wire/X-ray/cutaway). Capture a screenshot and actual event logs/model state. Reproduce in the latest candidate and then verify a genuine fix.

### C1. Real double-click, selection and continuous editing

- On all seven, single-click a hardware marker selects Pn/Mn, opens/synchronises the same hardware inspector and highlights exact item. Double-click on existing marker edits/selects, **never duplicates** it.
- Double-click **visible solid model surface** in Build at actual raycast hit → **Add pixel / Add mounting feature / Cancel** context affordance, anchored to the hit and visibly accessible. No action on empty viewport, through-holes, hidden/back faces or invalid occluded surfaces.
- Toolbar **Place pixel** / **Place mount** enters continuous placement, cursor ghost, correct valid/invalid reasons, Done/Escape, undo and camera orbit restoration; distinguish explicitly from **Add pixel automatically**, which is never claimed to use the clicked visible side.
- Selected hardware can be **click → hold-drag**, with threshold, pointer capture, live validity, cancelled move rollback and no unintended camera rotation. Precise X/Y/Z or supported surface coords, rotation, 1/5mm keyboard nudge and accessible touch/list/context equivalents. Markers and source coordinates remain synced during tab switching and undo/redo.
- Actual Playwright events (dblclick, pointer down/up/drag, view orbit, keyboard and touch emulation) in each family, not just asserting DOM text. Test front/top/bottom and negative hit cases.

### C2. Correct actual visible physical face — not just flipped 2D markers

- Raycast includes mesh/object, triangle/face identity, world-space point and transformed normal, local-space coordinates, intended **entry face** and valid material depth.
- **Selected visible side, preview ghost, Pn marker/port, actual fitting body/cutter/seat, exported 3MF/STL and saved model must agree.**
- The existing native cutter is often **a fixed Y-axis through-bore**; #84 is useful but NOT generic on-surface geometry. For a vertical hole, deliberately explain selected top/bottom opening and show both entrances as appropriate. Do not silently route a click on the front/side to the unseen underside.
- Where physically supported, implement **true 3D normal-aligned fitting** on suitable curved/side faces using appropriate orientation-preserving Boolean geometry and tested remaining roof/wall/edge/shaft/cavity clearance. Where arbitrary face cutting isn't safe, show a precise, user-recoverable **B** message and accessible supported face/backing choices. No false success.
- Test the openwork Gear and solid Gear, Tile, curved Wave, hollow Pod, transformed models, face normals, orientation, surface validity and actual printable geometry. A failed operation leaves prior accepted state intact.

### C3. Visible **and honest** serial wiring

- Separate **Show wiring guides** from **Cut physical cable channels** on every family. The guide is discoverable and displayable **without** enabling manufacturing. Enabling guides never implicitly cuts material.
- Show ordered P1 → P2 → … with **direction arrows**, opposite 180° input/output axes at every pixel, separate first EDGE IN and last EDGE OUT, sampled **curved** centreline lengths, 25/50/100/custom physical pitch, independent lead/tail lengths, red blocked or overlength segments and helpful text.
- In ISO, FRONT, BACK, TOP, BOT, X-ray and cutaway, paths must be visible or intentionally revealed using appropriate depth/overlay, and not falsely appear as grooves on an unrelated physical side. Pixel reorder/Set P1/reverse, move/rotate/delete, pitch/profile/backing changes replan route and warnings.
- One authoritative route data model drives guides, measurements, wire CSV, physical cutter, prepared cutaway and export blocking; a decorative line alone does **not** count as manufactured cable routing.
- In **openwork Gear**, legitimate shaft/window or insufficient solid backing restrictions must explicitly say **why** routing can't be milled and how to obtain a compatible solid/backed result where possible. Don't falsely claim a successful cut through empty space. Provide positive/manufactured and negative/blocked fixture.
- Verify actual Manifold subtraction with connected geometry, sufficient web/roof clearance, valid entry/exit, no disconnected partial channels, real lengths, exported STL/3MF and matching overlay.

**Hard acceptance:** do not mark these three issues solved because #84/#85 are green. The **user's actual Gear workflow** must be a verified browser + manufacturing demonstration with truthful blocked states.

## D. Complete common **Design, Build, Library and Print** parity

### D1. Full Design and viewport

- Same natural Home, model tabs, naming, presets, saved revisions and switching, with independent model state, camera pivot, edit history and selected object. No model off screen or camera orbit around the wrong point.
- Shared **whole-model** selection, position, scale, rotation, exact sizing, centre/fit, camera reset/orbit/pan/zoom, grid/snap and equivalent selected real-component controls where native model actually has editable subparts. Do not fake Crystal-like spikes in an indivisible model or parametric CAD parts inside imported STL.
- Effective preview/per-model overlays, light/dark theme contrast, clear constraints, usable 390px/tablet/desktop layouts, focus/keyboard/touch and help. Simple/Advanced mode must not silently replace edits.
- Preserve Crystal spacing/angle/root/optical controls; Tile pattern/relief; Gear teeth/shaft/style; Wave height/contours; Cap mechanical grip/shaft; Character silhouette; Pod shell/cavity. Don't trade genuine uniqueness for superficial parity.

### D2. Shared Pixel fitting & Mounting

- One real measured A–G/profile library and custom profile workflow, usable **before placing**, consistent 3D placements, apply-next vs edit-selected distinction, stable Pn IDs and independent physical cable order. User custom sizes remain after tab swaps, JSON backup, Library, restored projects and private-vault recovery.
- Add auto/manual, direct 3D select, dragging, rotation, delete/duplicate, Set P1, reverse, reorder, collision feedback, valid/invalid bores and seats, test-fit coupons, optional genuine **positive backing** where safe.
- **Fix missing native mounting**: add contextual add/select/drag/edit/delete with **actual holes/inserts/tabs/mounting geometry**, reliable Mn labels and a model-appropriate clearance validator. Same UI pattern across families; shape-specific mount presets/constraints can differ. Unsafe thin/hollow/shaft layouts must be blocked explicitly, not silently ignored.
- Clearly differentiate generic vertical bore, fully modelled seated/retaining socket, and real-life tested LED fit. Don't claim print-tested retention without #10.

### D3. Light/cutaway and true manufacturing

- Preserve Crystal's verified sampled light-path diagnostics and model-specific cavity/route behaviours. Expose consistent optical/section/transparent inspection where meaningful, with precise checked/blocked/unknown terminology; don't infer physically measured light intensity.
- The same authoritative current geometry drives Show, Prepare Print, worker/Manifold, cutaway, STL/3MF, dimensions and production manifest. Reject stale prep after edits; verify exact Z-up mm dimensions, manifold bodies, negative hardware/route cutters and material roles.
- One global Print Centre across all families and validated imported solids: queue, selected current model, per-job UM3 Extended/UM2+ and supported 0.25/0.4/0.6/0.8mm nozzles, PLA/PETG, quality, progress/cancel/cache invalidation, STL/3MF, generated Cura profiles and manufacturing pack. Unsupported printer/nozzle/material combinations must be explained; don't claim downloaded profiles are installed/sliced successfully without physical evidence.
- Preserve dual-material separation where supported; block dangerous/invalid partially prepared routes without corrupting prior accepted model.

### D4. SVG, STL/OBJ, Library and backups

- SVG retains real holes, transforms, millimetres, extrusion source parameters, source validation and original contributor credit. Unsupported geometry is rejected with useful reason; don't duplicate Jordan's parser or close his independent #37.
- STL binary/ASCII and OBJ: unit/up-axis confirm, scale/rotation/position, source retention, actual watertight/manifold and component checks; preview-only for invalid/open/oversize meshes. Only validated closed solids get actual safe Build/print tools. Do not claim arbitrary triangular meshes restore original parametric design history.
- Cross-family switch, independent model tabs, save/rename, templates/collections/favourites, linked vs independent Library copies, older and new JSON, backup restore, private-vault conflict preview/version, two-tab race/stale-save protection, cross-device restoration using user-supplied backup/sync. Don't assume localStorage syncs computers.
- Actual current Print job identity after queue moves, document revisions and export; stale mesh or wrong model downloaded must fail regression tests.

## E. Genuine release-level test matrix, NOT a checklist of source strings

Use a **canonical per-capability/per-family acceptance ledger** in `docs/MODEL_BUILDER_PARITY.md`, with unique IDs, tested SHA, test path and screenshot/export evidence, plus precise B/N/A exceptions. No blanket P status.

For **each** of the seven generators, end-to-end automated sequences must cover:
1. Create and change a meaningful distinct Design preset/parameter; whole-model transform; save and re-open.
2. Double-click a visible allowed surface; select pixel; drag; rotate/nudge; add second/third fitting; reorder physical wiring; update measured profile; invalid attempt; undo/redo; camera views and switch family.
3. Add and edit a **real manufactured mount** where suitable or show a physically demonstrated restriction. Blocked geometry is different from a missing mount tool.
4. Show route with cutters off, P1/Pn visible arrows and mm budgets; enable physical cuts on a supported solid/backed fixture; inspect cutaway and actual Boolean geometry. Exercise impossible/overlength/occluded/openwork case.
5. Library version/duplicate/linked/backup/restore round-trip; current Print preparation; compare STL and 3MF, coordinates, sizes, serial cable report and production manifest.
6. Browser at desktop, tablet and 390px phone width; accessible keyboard and touch alternatives, both themes, console/log warnings and selected controls.
7. Valid + rejected manufacturing examples; rejected placement/export does not destroy prior good result.

For imported SVG, STL and OBJ test actual user import, units/holes/axis and topology, transform, valid vs preview-only, supported hardware where safe, save/reopen and appropriate export. Crystal-specific tests must assert no regression in individual crystal editing, root/light cavity routing, manual/auto placement and pixel pitch snap.

Run exact-head commands and CI: `npm run test:static`, `npm test`, `npm run test:browser`, `npm run test:benchmark`, release metadata checks and any other current `package.json` scripts. Record GitHub Actions run URLs, screenshots, prepared Manifold results/volume/bounds, exported actual STL/3MF and size/rotation, browser performance/cancellation and old-project migration. Worker/memory errors and freezing are P0/P1 failures.

**Never disable a valid failing test or loosen manufacturing validation to produce a false green.** Screenshots plus code claims cannot stand in for real exported geometry. A pending workflow isn't a pass.

## F. Finish PRs, really reach `main`, prove GitHub Pages is current

**The user wants ONE released, dependable software product—not a pile of apparently merged drafts.**

1. **First** reconcile #84 on current main; #85 on #84. Preserve #82/#83 history already integrated into #84. Run exact-head tests; after the owner merges #84, carefully rebase/retarget #85 onto the new main and retest—don't double-cherry-pick or lose commits. If owner has already merged them, verify main reachability and proceed from newest main.
2. Implement remaining P0/P1 work from sections C–E in as few **reviewable main-targeted draft PRs** as practical (prefer one substantial final integration PR plus one independently reviewable follow-up only if necessary). Don't generate a dozen plans or tiny PRs. If parent approval is delayed, work on a documented tested integration head and provide exact dependency order.
3. PR description: scope, changed modules, P/L/M/B before/after, test evidence at exact head, screenshots and real manufacturing fixture, compatibility, new version, CHANGELOG/What's New, risk, owner actions and URL. Preserve CODEOWNERS and contributor attribution.
4. **No autonomous merge/deploy** under the standing owner boundary. If the owner explicitly authorises in the Codex session, merge only after review and latest-head green CI; otherwise tell owner the exact safe merge order and which approvals are needed.
5. After actual owner-authorised merges, fetch latest `main`, verify target tree/commits are **reachable on main** (not just a PR “merged” into a feature parent), and verify successful **Deploy Crystal Forge to GitHub Pages** run for exactly that main SHA.
6. In a **clean browser**, open `https://connorturansky-svg.github.io/crystal-forge/`; verify visible version equals main, scripts/assets load (no cache/fetch failures), no console errors, owner Gear workflow works or displays honest blocked explanation, plus one other family, imported model, Library save/reopen and Print Centre export. Do not wipe user storage. Only call it “published and live verified” after real public-site browser tests; otherwise distinguish CI/deploy workflow success from browser proof.
7. If public site lags the repository after successful Pages workflow, investigate GitHub Pages branch/root, cache/service worker/assets/URL paths, version and content hashes, and fix via reviewed PR. Recheck after next authorised merge.
8. Close [#79](https://github.com/connorturansky-svg/crystal-forge/issues/79) **only** when software P0/P1 acceptance is actually satisfied on the published SHA with links. Otherwise keep it open with a short current checklist. Keep #10/#51/#36/#33 as above.

## G. Accurate, concise documentation — no stale history masquerading as current status

The current README, roadmap, AI handover and prompt index contain old PR draft statements. Do a focused clean-up:
- **README top**: current deployed version/SHA, true supported workflow, known constraints, links to acceptance/issue #79/#10. Move obsolete PR5/PR7/old v0.15 “active draft” text to a clearly labelled history/archive section, don't erase useful provenance.
- **`docs/ROADMAP.md`**: one small **Current status**, **Software release P0/P1**, **Physical QA #10**, **Held #51**, **Contributor/operations #33/#36** set of sections; historic plans archived/labelled to prevent contradictory “imports not implemented” statements.
- **`docs/AI_HANDOVER.md`**: up-to-date main and true PR merge order, actual single source-of-truth modules, current feature status and next user actions. No stale #71/#80 references as pending.
- Test/architecture/manufacturing docs and user Help updated only to reflect changes and real evidence; the single parity ledger remains authoritative. Keep release version, `CHANGELOG.md`, in-app What's New and assets consistent.
- `planning/prompts/README.md` is being maintained by the ChatGPT assistant; **Codex should propose factual index changes with citations but avoid conflicting simultaneous writes to the planning branch**.
- No newly proliferated issues. Reuse #79 for every future software parity bug; do not close other people’s open PRs without their approval or erase physical acceptance.

## H. Final delivery gate and honest STOP conditions

This milestone is **software finished** only if:
- All seven model builders perform applicable shared workflows at the same standard, with proven and useful exceptions for physically unsuitable geometry.
- The owner's Gear screenshot scenario has documented functioning double-click, right-face placement/valid refusal and visible route or clear honest obstruction.
- Real mounts and paths work where geometry allows; sources, saved state, previews and 3MF/STL agree.
- End-to-end Design/Build/Library/Print/import/backup/current-job tests are passing on the exact release SHA.
- No P0/P1 software parity issue remains open without owner-approved exclusion.
- Latest main/released code, actual Pages deployment and live clean-browser runtime are proven to match. A pending/unmerged PR is **not** a published release.
- README, roadmap, handover, change log, version and issue statuses accurately reflect release reality.
- #10 physical fabrication remains open until printed/sliced/installed tests; #51 held and #36/#37/#33/#42 owner/contributor work remain protected.

If any condition is unfulfilled, **do not say “done”**. Describe the exact failing capability, model family, current commit/PR, evidence, owner action and achievable next step. Still deliver all completed code and tests, not a plan.

### Codex EXECUTION instruction

**Work the entire P0/P1 software completion programme now, do not stop after an audit.** Start with the latest main and #84/#85 status, carry forward tested commits in a safe integration, implement missing functionality across the seven builders and supported imports, run real browser + manufacturing + persistence regression suites, update app-facing docs and release metadata, produce merge-ready draft PR(s), and present an exact owner approval / merge / Pages verification sequence. After an owner-authorised merge, verify actual deployed public functionality. Do not create another issue, start unrelated feature phases or declare physical acceptance.
