# 013 — Prepared Light-Path Checks and Interactive Cross-Section Inspection

> **Status:** Owner-requested NEXT Codex prompt, scope approved for preparing the next owner-Codex task. **This GitHub brief/Issue does not itself launch a coding session.**
> **Task:** [WT-013 / Issue #54](https://github.com/connorturansky-svg/crystal-forge/issues/54).
> **Planning branch / approved version:** `planning/prompts`; immutable full commit SHA pinned in Issue #54. Fetch **that exact commit**, not the current planning tip.
> **Verified source baseline:** `main` at `26023f595a5c67cbe061be59816bcc2c483524fa`, following owner-merged [WT-012 / PR #53](https://github.com/connorturansky-svg/crystal-forge/pull/53). WT-012 final head `efee56dc9aa2465e243a62d3611a4953a9198332` passed hosted static, Chromium, fabrication/Manifold and contributor-contract checks; see PR description for exact links. Refresh latest `main` when Codex starts.
> **One-PR budget:** A focused, substantive milestone, not a complete lighting physics simulator or an all-family rewrite. One integration owner, one feature branch, one draft PR. Avoid redundant full-repository audits, new dependencies, repeated costly benchmark runs or excessive parallel agent activity. Prioritise a correct inspectable Crystal workflow over speculative coverage of all shapes.
> **Owner priority basis:** User ranked *true light pathways and hollow structures* and *better 3D appearance and inspection* as MEDIUM immediately after combined HIGH-priority creative catalogue and shared pixel routing. This phase joins them coherently.
> **External restrictions:** Jordan's [WT-003 / PR #37](https://github.com/connorturansky-svg/crystal-forge/pull/37) is independent and open/draft. [WT-011 / Issue #51](https://github.com/connorturansky-svg/crystal-forge/issues/51) modular print splitting is LOW/ON HOLD; its approved `011` brief is untouched. Do not edit either workstream.

## 1. User outcome

As a maker, I want to design an illuminated cluster, choose its LED and internal light-path construction, prepare the **real printable solid**, then understand at a glance which intended spike has a viable opening and which does not. I want to rotate the model, scrub a cutaway through the genuine prepared geometry, select a crystal or LED opening and see the **actual channel and its limitations**. A beautiful translucent preview is not evidence of a continuous air/light passage. Never silently call a drilled bore or hollow shell a working light source.

This task improves **truth, inspectability, and conservative software-side light-passage checks**. It does not promise optical brightness, actual translucency, printability, bend strength, retention or physical printed fit.

### Bounded feature set

A. **Crystal prepared-mesh light-passage audit** for existing `targetedLightPaths`, `lightPorts` + vault, and `hollowCrystals` modes. Capture per-crystal statuses tied to existing IDs and the actual prepared mesh, not just planned cutters.

B. **Interactive prepared cross-section**: extend existing fixed half-cut to X/Z selectable plane with a bounded offset slider, associated per-crystal selection and optional feature overlay; preserve orbit and existing inspection modes. In the unified Studio, make prepared mesh inspection discoverable for the currently selected Crystal and one existing Pod fixture, without rewriting the entire layout.

C. **Truthful report + opt-in strict gate:** report cleared/suspected blocked/unknown/skipped with reasons and source LED/access; add optional `Require verified accessible passages` acceptance to block invalid current-revision Crystal exports for an opted-in user. It must default **OFF** for existing and new projects unless enabled. Explicit warnings remain visible when off.

D. **Package/QA**: preserve legacy Crystal production ZIP, current global Print Centre 3MF/ZIP, material/body semantics, save/undo, marker routing, version/changelog and exact-head tests.

### What is NOT included

No replacement of current Crystal shell algorithm, arbitrary multi-LED inverse optic solver, realistic photometry/raytracing/brightness prediction, multi-pixel network programming, guaranteed root-to-tip wall-thickness simulation, all-family automatic light-passage cutting, new native pixel routing on Pods, large multi-panel UI rewrite, slicer/OctoPrint integration, SVG/STL/OBJ imports, full modular splitting, printed load claims, new retaining clips/strain relief, new cloud syncing or AI dispatch automation.

## 2. Verified source map — preserve exact invariants

- `fabrication-v1.js::prepareFabrication` already uses Manifold to make **real geometry**. It supports distinct mutually exclusive choices:
  - **Targeted light bores**: `targeted-light-paths.js::planTargetedLightPaths` plans from accepted LED socket roofs along a base tube into eligible crystal roots; manufacturing subtracts cylinders and reports `targetedLightCount`, `targetedLightAcceptedIds`, `targetedLightSkipped`. The planner explicitly warns that plans do not prove final passage continuity.
  - **Direct roof-to-spike ports**: `light-port-plan.js::planCrystalLightPorts` requires `baseVault`; manufacturing cuts and reports `directLightPorts`, `skippedDirectLightPorts`, `lightPortDetails` (including ID/status), yet does not certify LED→port continuity through real vault geometry.
  - **Experimental whole-cluster hollowing**: `hollowCrystals` shells combined material and subtracts proposed shared chambers/shaft tunnels, reports `hollowPorts`, `skippedHollowPorts`, `lightPathScreened`, `internalCavities`. A cavity-free result does not prove every intended spike can receive light.
- `studio-v3.js` has `#sectionCutBtn` toggle + `sectionPlane` fixed X central half-cut, `updateAppearance()` supporting wire/xray/glow, a prepared `manufacturingMesh` and `manufacturingReport`. Existing camera/orbit/selection/fit coupon UI must not regress. Existing manual cut may display preview meshes when not prepared; label the distinction clearly.
- `studio-catalogue.js` Light Pods have real `illuminated` cavity/underside access/cable cuts, shaped by `wt002-pod-shell.js`; `studio-geometry.js::prepareRecipe` produces native Manifold solids. Pods are **not** routable native pixel strings in WT-012; do not change that capability here.
- `sensory-studio.js` owns the unified Home/Design/Build/Library/Print model tabs; `studio-model-worker.js` produces the currently prepared native geometry for Print. Reuse current scene/camera and preparation lifecycle; no second independent model database.
- `production-pack.js` includes Crystal `03_Reports`, assembly warnings and Cura profile candidate; the global Print Centre has a separate per-job manifest from merged WT-009. Add one truthful opt-in/access inspection report to existing **Crystal production pack**, do not replace the archive factory.
- Pixel profiles, stable `P1→Pn`, opposed 180° tails, curved 25/50/100/custom mm wiring and model edits are from WT-006/012 and **must remain unchanged**, including any new serial routing on solid Tiles/Gears.
- `docs/FEATURE_SPECIFICATIONS.md` F07, F11 and release testing describe baseline: topology and cutouts are different from actual physical light transmission or installed Cura layer proof.

## 3. Final-solid light-passage audit — concrete definition

### 3A. Feature correspondence and results

1. Derive a per-crystal audit keyed to real stable Crystal IDs, with corresponding mode, intended endpoint, path/cutter data, source LED socket when present, prepared revision/fingerprint, tested geometry identifier and any skip reason. Avoid a single aggregate "3 ports" success indicator masking two blocked crystals. Include an explicit **not requested** state for a crystal when lighting is disabled.
2. Do **not** count a plan as manufactured until `prepareFabrication` has actually finished Manifold cuts. Differentiate:
   - `passage sampled clear`: on a newly prepared real mesh, a bounded, documented series of probe volumes along intended route centreline is empty of solid within tolerance, and the start is connected to an existing accessible LED socket/open underside by the sampled path. This is software **sampling**, not proof of actual light transmission or measured wall integrity.
   - `blocked`: a probe detects residual material, a missing opening, a disconnected intended segment, a geometry error or an explicitly disallowed collision.
   - `skipped`: existing planner rejected or omitted that crystal; include exact original reason, not a generic pass.
   - `unknown`: cannot establish a reliable test or the mode lacks a suitable distinct path definition.
   - `not requested`: no intended passage for that crystal.
3. Use the **final prepared Manifold solid**, after all light, LED socket, base-vault and mounting/serial wire cuts (not an earlier intermediate). Design a bounded, deterministic pure probe-plan with a small actual-Manifold intersection test or equivalent defensible prepared-solid test. Avoid an unbounded voxel flood fill, bulk mesh reparsing, `O(pixels × triangles × enormous samples)` loops or main-thread WebGL readbacks. **Finite sampled probes cannot prove global topological connectivity; label as sampled, not certified.**
4. Include real **opening access** validation: an internal hole ending blindly inside solid does not pass because the planner drew a line; verify intended source access via sampled endpoint geometry. For `lightPorts`, the vault is a possible source opening but only when actual prepared geometry contains the open path. For balloon hollowing, if a particular spike lacks an individually traceable path, record `unknown` or `skipped` rather than claiming global `lightPathScreened` means every spike passes.
5. Numeric checks must be conservative: cap probe count, step size, route length, radius and runtime. Document tolerances, min-volume/intersection thresholds, limitations near walls/mesh precision and what would cause a false negative or false positive. If a final route cannot be sampled safely at available resolution, return **unknown**, not success. Extra probes must not silently alter manufacturing geometry.
6. Preserve all previously generated cutters and their existing mutual exclusions. Do not introduce a new physical light-bore geometry engine simply to make probes pass. **If an existing accepted bore is found obstructed** and a small safe verified fix is possible in the same module, fix it with regression fixtures; otherwise report failure and leave it open for a subsequent engineering phase.

### 3B. Opt-in strict illumination access

7. Add one clearly named `Require accessible passages` preference for **Crystal** only, default off and independent of `hollowCrystals`, `lightPorts`, `targetedLightPaths` mode toggles. When on and light-path mode enabled, preflight/report must require **every intended, visible selected crystal** have a current-revision `passage sampled clear` status; skipped/blocked/unknown causes a clear fail-closed message. Do not enable when no valid light mode/LED source is present; show an actionable explanation rather than a meaningless green tick.
8. Strict export gate must act on the same current prepared report for Crystal STL, 3MF, Production ZIP and any active global Print Centre path that actually exports that same Crystal. Avoid a separate stale UI flag or allow file-download button to stay enabled when strict mode rejects it. Before dispatch, identify where Crystal's unified/legacy export boundaries diverge and block at their authoritative preparation/export check without breaking old projects. Strict state changes invalidate prepared results/exports.
9. With preference **off**, preserve legacy light-path choices and unverified warnings, including existing projects. Do not automatically alter their geometry, force all crystals to be hollow or retrofit LED routes.

### 3C. Reports and understanding

10. Show an actionable summary: mode name, number sampled clear, skipped, blocked, unknown, intended count, per-crystal reasons, **which LED/socket feeds which path** if known, and concise manual checks. Don't use colour alone: icons/labels and accessible text. Include `Inspect this crystal` control that selects/centres a crystal and highlights corresponding requested path on actual prepared geometry; do not draw an unsupported solid "tunnel" where one was skipped.
11. In `production-pack.js`, add `03_Reports/light-passage-inspection.json` and a short `03_Reports/light-passage-inspection.txt` **only if a prepared audit exists**; both use a versioned schema and include `softwareSamplingOnly:true`, `physicalOpticalVerification:false`, mode, settings, stable IDs, statuses, reasons, geometry revision, probe resolution and caveats. No secrets/private user data, no fabricated source LED assignments. Existing ZIP files and naming remain available. If inspection was not performed, say `not run` in existing readme rather than emitting a fake green report.

## 4. Real cutaway and 3D inspection UI

1. Reuse existing prepared-mesh and scene/camera. Extend **existing** `#sectionCutBtn` with `X / Z` plane selector and a slider supporting signed offset through actual model bounds; show unit **mm** and position as a percentage, plus `Reset section`. In Crystal, always prefer **prepared manufacturing mesh** when active; distinguish fast editable preview when a current prepared mesh is absent or stale. Existing snap camera controls and selected crystal must remain stable.
2. New `Show light paths` overlay displays route **intent** or audited paths and per-crystal statuses. Use the same numeric world position as actual cutter, not fantasy arcs or ambient shaders. Colour with text: clear sampled / blocked / skipped / unknown, and render only reasonably bounded paths for performance; unknown/blocked must never look like a successfully manufactured solid hole.
3. In a compact per-crystal list tied to the current model, select a row to inspect the correct ID, highlight it in scene and optionally move the section plane near its path. On close/disable, remove overlay and restore original preview/manufactured material/opacity and orbit without loss of state.
4. Cutaway and X-ray are **view-only** and never change exported geometry, model parameters or local autosave. Section controls should still be available if the user is looking at a Crystal without a current prepared mesh but display a truthful `Preview only — prepare first to inspect real cuts` message. No background heavy preparation simply because the panel opens.
5. Provide one **limited** inspection for a currently prepared Light Pod (default river and/or beacon preset) to visualise actual underside access and cavity/cable openings. It is a section-view feature with an honest `access geometry visible; illumination not verified` status; **do not** claim per-pod measured lumen continuity or add Pod routing. Leave all other native family behaviour unchanged.

## 5. Controls and feedback contract

- **Every new control functional:** `Prepare / Refresh inspection`, `Require accessible passages`, `Show light paths`, `X / Z section`, `Section position`, `Reset section`, `Inspect Crystal`, `Close inspection` (or accessible equivalent); actual handlers and keyboard support are required. Disable with reason if unsupported or stale.
- Be consistent with existing primary/precision settings and look modes. No multi-layer modal trap; visible warnings should link or focus the offending Crystal.
- Never equate a CSS section overlay with inspecting prepared geometry; test pixel coordinates, model selection and stale-prepared result changes.
- Changes affecting actual light-path geometry must invalidate cached fabrication results and produce new audit only from current revision. Cancelled or older Worker results may not restore export availability. Save/reload must round-trip strict preference correctly. Legacy files retain default-off behaviour.
- Do not add a second general-purpose WebGL viewer or new large dependency. Keep renderer scene disposal/camera interactions deterministic, avoid leaking geometry/materials.

## 6. Automated acceptance matrix

**WT013-01** Real prepared Crystal one-pixel targeted-mode fixture: one accepted spike, valid connected sampled opening result, two separate openings/ends where applicable, and per-spike exact-ID audit with source socket. An intentionally blocked path fails with truthful reason, not `clear`.

**WT013-02** Mixed 6+ Crystal case: some valid, some narrow/skipped, source LEDs/mounts/wires and substantial base dome. Aggregate counts equal per-crystal records; no skipped paths accidentally count as physically open. Unknown cases report unknown.

**WT013-03** `baseVault+lightPorts` fixture: real Manifold output with open underside, individually audited direct paths, explicit source-vault status. An invalid inaccessible/blocked/missing vault endpoint doesn't pass. New checker respects mutual exclusion with `hollowCrystals`.

**WT013-04** `hollowCrystals` balloon case: validate original Manifold positive material body and open access, per-crystal claims only if traceable; aggregate `lightPathScreened` not used as a blanket pass. Regression for narrow strongly tilted spikes and no sealed hidden void claims.

**WT013-05** Strict preference OFF preserves old saved/legacy exports; when ON and a current intended crystal is blocked/skipped/unknown, prepared export is rejected with reason, stale results cannot bypass gate, and toggling OFF restores existing behaviour without modifying geometry. Save/reload and undo/redo tested.

**WT013-06** Movable X and Z section controls against a truly prepared Crystal and actual cavity/bore: slider updates clipping plane, Reset restores its defined state, section toggle and X-ray do not mutate geometry or camera/orbit. Before preparation clearly labels preview-only mode.

**WT013-07** Selecting P1/crystal from inspection list highlights correct stable IDs and path, remains in sync when crystals reorder and models switch; no misleading drawn routes for blocked or skipped. Keyboard and narrow viewport tests actual handlers.

**WT013-08** Prepared Light Pod beacon/river: cutaway shows real underside access/cavity/cable cut, without treating Pod as eligible for native serial string routing or claiming optical certification. Invalid pod profile still blocked by its existing parameter constraints.

**WT013-09** Crystal production ZIP contains real report JSON/TXT with correct generated entry names and actual statuses/revisions if an audit was run; no fabricated pass record when not run. Existing production pack STL, material roles, Cura profile/manual text, mounting/wire reports unchanged. Verify ZIP signature and archive content.

**WT013-10** All unchanged Crystal1/2/6 P1 serial routing, 25/50/100 mm, pixel marker rotation/drag, cavity modes, protective geometry and per-pixel fitting coupons pass; native Tile/Gear WT-012 routed 1/2/3-pixel fixtures, all 6 new visual presets and saved projects survive.

**WT013-11** Exact-head static, Manifold fabrication and Chromium smoke tests plus one bounded representative performance measurement. Screenshots of prepared Crystal X/Z cutaways, selected passing/blocked spike, view-only Pod and narrow viewport. No unverified claims of Cura import, printed light behaviour or child safety.

**WT013-12** Release version increment once, matching `CHANGELOG.md` and in-app What's New, updates `docs/AI_HANDOVER.md`, relevant `docs/ROADMAP.md` and focused test guide. Record source map, strict-setting migration/default-off, audit methodology/tolerances, exact CI links, known unknowns and physical validation checklist.

## 7. Implementation checkpoints — one substantial PR with sane limits

**A. Baseline:** Check current `main`, open PRs and relevant test files, `AGENTS.md`, current `docs/AI_HANDOVER.md`. Confirm WT-012 is merged; WT-011 remains hold; external SVG separate. Run baseline static/fabrication smoke once.

**B. Geometry truth first:** Add a narrowly scoped reusable final-solid path sampler (`light-passage-audit.js` or direct in fabrication if simple). Build deterministic per-crystal intended path maps using existing planned IDs, especially when manufacturing originally stored only aggregate counts. Test final-solid access sampling and fail-closed unknown; record meaningful negative fixtures. **Do not rewrite geometry or add an expensive 3D voxel engine.**

**C. User-facing section/inspection:** Attach a single small inspection controller to existing `studio-v3.js` and/or unified Studio scene; X/Z plane/offset + selected path + readable status. Avoid competing renderers or ambitious common scene-graph rewrites.

**D. Strict setting, reports and downloads:** Only once the audit is genuinely reliable, wire opt-in strict release gate and additive real production report. Preserve unselected and old model behaviour.

**E. QA/handover:** Real latest-head static, Manifold, Chromium, screenshots, source/save regressions, version/changelog/docs. Keep one feature branch, one draft PR; no automatic merge/deployment.

### Stop/fallback rule

If direct volumetric probes cannot establish enough confidence within bounded runtime, **do not label any geometry `clear` or turn on strict mode based on weak proxies**. Use `unknown` with an honest report and still deliver a useful real prepared cutaway / per-spike status inspector. Explicitly document missed acceptance items in the draft PR rather than masking them. No fake green or fake complete flag.

Priority: (1) correct per-spike/audit derived from **final** solid, (2) movable prepared cutaway and readable UI, (3) strict export gate, (4) Pod inspector. Defer the latter if needed rather than compromising Crystal correctness.

## 8. Codex implementation contract — only on owner launch

1. Verify merged PR #53, get latest `main`, read the **exact full pinned** `prompts/013-prepared-light-path-inspector.md` and `AGENTS.md`, then relevant sources/tests, not stale historical sections.
2. Claim [Issue #54](https://github.com/connorturansky-svg/crystal-forge/issues/54) using `CLAIM WT-013 — @connorturansky-svg Codex — feat/WT-013-light-inspection — prepared optical path audit and cutaway`. No duplicate task claim.
3. Create branch `feat/WT-013-light-inspection` from current main; open one **draft PR**: `[WT-013] Prepared light-path diagnostics and interactive cutaway`.
4. In PR description include **exact labels**:

```
Task issue: #54
Approved spec: prompts/013-prepared-light-path-inspector.md @ <FULL_40_CHARACTER_SHA_PINNED_ON_ISSUE_54>
Scope: Per-spike final-Manifold light-passage checks, real movable cutaway, optional strict accessibility export gate and limited Pod inspection.
Related PRs/duplicates: WT-012 #53 merged; WT-011 #51 modular splitting ON HOLD; WT-003 #37 SVG external/draft; WT-004 separate.
Test evidence: <exact head SHA, current hosted static/Chromium/Manifold CI URLs and actual screenshot artifacts>
Handover: docs/AI_HANDOVER.md
Risks: <sampled-only access and manual Cura/optical/printed fit validation; explicitly deferred work>
```

5. Do **not** edit the `planning/prompts` branch from coding PR; do not assign Jordan work, auto-merge, auto-deploy, bypass checks or claim a physical fabrication/optical certification. Stop and report draft PR status, real test logs and any failures.
