# WT-021 — Complete Seven-Builder Functional Parity: Pixels, External Mounting Tabs, Wiring and Ready-to-Print Exports

**Status:** Owner-requested, implementation-authorised scope for Codex. This brief **clarifies and supersedes the incomplete software parity/finish-up portions of WT-020**, but retains its safety, validation, migration, publishing and owner-approval requirements. It is **not** another brainstorming or planning milestone.

**Repository:** \`connorturansky-svg/crystal-forge\`  
**Prompt source:** \`planning/prompts/prompts/021-complete-seven-builder-manufacturing-parity.md\`, using the pinned commit supplied in the launch message.  
**Authoritative software tracker:** [Issue #79](https://github.com/connorturansky-svg/crystal-forge/issues/79). **Do not create another parity issue.**  
**Reference:** [WT-020 full final release brief](./020-final-software-parity-release.md), pinned at \`f9c248fc6933da3d0451f5168e4eab830b5af6fe\`; [WT-019 approved brief](./019-true-studio-model-parity.md) pinned at \`10cdb618b0a0a0f09affbd4cdcab3d2c45525045\`.

## 0. Exact user intent: this is a WORKING APP, not a partial UI

The owner explicitly expects to be able to:

> Open **Buttons & Control Caps**, create a **rotary knob**, **place a pixel on the knob at a chosen supported physical surface**, **add and position external mounting tabs/ears/flanges with fixing holes**, **prepare and download a physically corresponding STL/3MF** and **download an appropriate Cura profile** — then perform the same **shared hardware, manipulation, saving, and printing workflow on ALL SEVEN model families**.

This is the **minimum compulsory end-to-end scenario**, not an illustrative nice-to-have. **An internal through-hole in the existing model is NOT an external mounting tab.** Do not close the task by demonstrating only M1 holes, a visual tab marker, auto-place on the underside instead of the selected face, a bare STL without the mount, or a link to a Cura profile that cannot be generated.

**Deliver user-facing working code** with real Three.js interactions, real Manifold geometry, genuine saved project data, actual exports, and tests. **Do not stop at a plan, audit, checklist, documentation change, proof-of-concept or test-only PR.** Do not downgrade this requirement to “physically blocked” simply because the adapter cannot do it today: build the missing positive-geometry backing, mounting-interface or attachment system first where safe.

Full parity means **equal shared tool availability and behaviour for every applicable model family**, not identical family-specific shapes. Where a *specific physical shape* truly cannot take a feature, users must see a useful constraint and selectable safe alternative; another solid variant in the same family must pass the feature's real end-to-end acceptance tests.

## 1. Reconcile latest GitHub before coding; do not reimplement past stacks

At briefing audit on **19 November 2026**:
- Verified latest \`main\`: \`8f5b0a6f2d7e395c38d5afd85359117745fedee3\` (owner-merged #86, native 2–8 mm **through-holes**). #84 merged to main; #85 was merged to an intermediate feature branch; its tested functionality is contained in later descendants. Do not confuse “PR merged” with “commits included on main” or re-cherry-pick older #82/#83/#85.
- [PR #87](https://github.com/connorturansky-svg/crystal-forge/pull/87) is a **still-unmerged draft to main** on \`wt020/native-camera-framing\`, head \`c703dbb1a9c6316af855547e931fb4da96762466\` at audit. A static release-metadata mismatch was corrected on this head and the static check then passed; browser/fabrication exact-head checks were still pending. Recheck status and do not overwrite that branch.
- Existing native mounting code \`studio-mount-builder.js\` + \`studio-catalogue.js\` + \`sensory-studio.js\` makes **negative vertical through-bores**; the owner is explicitly asking for **positive outward tabs/ears with fixing holes**. They are different manufacturing operations.
- Current \`docs/MODEL_BUILDER_PARITY.md\` marks most capabilities **L (limited)**; no seven-family production and Studio evidence is complete. A code path existing is not a proved capability.
- Pixel/route/face behaviour is still geometry-dependent. The user's prior **openwork Gear P1–P4** reproduction and its truthful impossible-route state remain mandatory regressions.

**Before touching code:** fetch current \`main\`, all active PRs/diffs/checks, Issue #79, \`AGENTS.md\`, \`docs/AI_HANDOVER.md\`, \`docs/ROADMAP.md\`, \`docs/MODEL_BUILDER_PARITY.md\`, \`docs/FEATURE_SPECIFICATIONS.md\`, \`docs/DESIGN_DECISIONS.md\`, \`docs/TESTING.md\`, \`docs/ARCHITECTURE.md\`, complete WT-019/020 briefs and relevant source. Identify main-reachable code, verified PR ancestry, exact-head CI and active collaborator work.

**Work ownership:** Codex owns this application implementation and its tests and code PRs; ChatGPT may maintain the prompt/index/#79 coordination. **Use your own worktree/branch; never edit another session's branch, force-push or overwrite an unreviewed PR.** If #87 has since merged, start on the new main. If it is still pending, either prepare a clean branch based on its tested integration head or build independently against main and document the exact merge order/rebase; avoid simultaneous edits to #87.

## 2. Shared Studio product contract: THE SAME TOOLS ACROSS SEVEN BUILDERS

Families:
1. Crystal Clusters
2. Tactile Texture Tiles
3. Gears & Cogs
4. Waves & Organic Forms
5. Buttons & Control Caps (including rotary knobs, switches, faders)
6. Characters & Silhouettes
7. Glowing Pebbles & Light Pods

For **each family**, implement and prove, in consistent Design/Build/Library/Print locations:
- **Design**: create, named family presets, physical dimensions, unique family controls, whole-model position/scale/rotate, meaningful object or component edit when available, selection, undo/redo, accessible keyboard/touch alternatives, working front/back/top/bottom/ISO cameras, centred orbit, grid/snap, helpful constraints, cutaway/transparency.
- **Build → Pixel**: select a measured A–G/custom LED profile *before* placement; automatic *and* manual actions are explicitly different; real double-click a visible solid face → Add pixel / Add mounting / Cancel; placed pixel Pn appears where clicked on the correct physical side; pick, click-hold drag, precise move and rotate, select new P1, reorder/reverse and delete, all with no accidental orbit. Support common 25/50/100/custom pitch and real input/output lead directions.
- **Build → Mount**: add a **real external tab/ear/flange**, select type, place at a compatible edge/face, move/rotate/size/edit, change bolt-hole style and diameter, choose one or several tabs, add/delete/duplicate, preview and manufacture **positive connected solid plus real negative fixing hole**. Retain existing simple M1 through-hole controls as an independent tool.
- **Build → Wiring**: show P1→Pn guide, smooth real paths, arrows, IN/OUT straight 180° opposing axes at pixels, separate lead/tail, length limits and violations with truthful geometry status. **Show guide** is independent of **Cut cable channels**. Valid cut paths make actual export grooves/cutters; blocked openwork/shaft/cavity cases explain the problem and offer a supported backing/solid style.
- **Build → inspection**: actual fitting seat/access, physical mounting tab and bolt hole, wall/roof support, overlap with pixels/wire channels, optical access when meaningful, safe cutaway and material roles. Do not treat a marker or drawing as printable geometry.
- **Library**: source project save and reopen, collection/template/linked-vs-independent behaviour, undo/redo source integrity, profile persistence, backup JSON and verified recovery/merge; no silent cross-device synchronisation claims.
- **Print Centre**: send the active correct model to a central print queue, prepare valid Manifold solids, preview report + dimensions, export **STL, 3MF, downloadable Cura profile and full production ZIP**, clear print settings. Reject genuinely invalid geometry rather than exporting stale or incomplete cuts. Cura outcomes are recommended profiles; **installed Cura slicing and real-world hardware remain separately unverified.**

Common tools must not disappear merely because the user switches from Crystal to Knob, Gear or Wave. Retain existing richer Crystal capabilities, while making all applicable shared controls coherent. Imported SVG/STL/OBJ should receive shared tools where validated closed source solids make it safe; preserve preview-only gates, real holes/transforms, imported source bytes and the inability to recover original parametric authoring from a triangle mesh.

## 3. P0 deliverable: shared **external mounting tabs**, not just holes

Implement an authoritative reusable **positive/negative mounting feature model** usable from Build by **every one of the seven families** and validated imported solids where structurally feasible.

### 3.1 User choices and clear semantics

A tab is an outward protrusion or attached structural body, e.g.:
- rounded screw ear / lollipop tab with fixing hole;
- rectangular lug / twin-ear tab;
- edge flange / radial flange with one or multiple fixing holes;
- mounting foot/bracket with explicit supported attachment/base;
- optional countersink or counterbore where enough material is certified.

Provide a modest, coherent starter set, **not** a proliferation of disconnected family-specific hardcoded tabs.

Exposed controls: mount style, actual screw/hole diameter (M3 nominal preset, other sane sizes + custom), bolt clearance, ear width/length/height/thickness, root attachment penetration, fillet/rounded edge or reinforcing gusset where manufacturing permits, orientation/face/angle, number/spacing, plane/edge attachment, mirrored pair/symmetry, move/rotate/nudge, validation feedback and reset. Family-specific defaults choose an appropriate connection geometry; keep the entire system editable after placement.

Keep three clearly named behaviours separate:
1. **Mounting hole**: subtract a hole through existing body stock (existing M1 feature).
2. **External mounting tab/ear/flange**: ADD an attached body then subtract its actual fixing opening.
3. **Integral support/backing or separate fixed housing**: adds material to make a valid structural attachment or clearance, when needed; never silently thicken or fill a hollow part.

Selectable side/top/bottom/underside geometry and object-space/world-space transforms must be preserved in raycast hit, attachment transform, inspector and export. Reject unsupported directions with an explicit explanation and alternate mode **instead of silently turning a side tab into an underside hole**.

### 3.2 The KNOB example is the compulsory gold-standard fixture

Create a **Rotary knob** in Buttons & Control Caps (use a realistic solid/backed knob variant or a correctly separated enclosure if the selected moving dial cannot carry fixed tabs).

1. Adjust its width/profile/height/grip and any shaft bore.
2. Pick an LED profile (e.g. 5 mm seed); select a visible supported physical face and place **P1** there with genuine preview/port/cutter agreement; move/edit it.
3. Add **two external mounting ears/tabs**, independently selectable **T1/T2** (or clearly separate names from hole-only M1), positioned at chosen sides or on an optional fixed flange, with **actual M3-sized through holes**. Their outer edges must **extend beyond the original knob/enclosure boundary**; demonstrate that geometry explicitly.
4. Move/rotate/resize the ears, adjust their screw clearance, and inspect positive union into supporting material and negative hole subtractions. Verify no collision with LED, shaft/socket, cable channels or each other.
5. Where a rotary knob is a **moving part**, don't misleadingly fuse stationary external fixing ears to the rotating actuator. Offer a **fixed backing/enclosure/flange as a separate printable component** (or a clearly designated stationary cap variant) with measured motion/shaft clearances and explicitly registered assembly relative to the moving knob. If the user expressly chooses integrated tabs for a nonrotating decorative knob, a connected single-body option may be valid. Build the necessary fixed component, don't silently deem this whole family “not supported”.
6. Save/reload source, view top/bottom/front, inspect a transparent cutaway, prepare print, then **download the STL(s), a valid 3MF, Cura .curaprofile / documented fallback and full ZIP**. Test actual archive contents and **measure geometry**: tab material, hole diameters, original vs extended bounds, cutter volume, connected component count or assembly roles and their relative transforms.

The knob end-to-end test is **P0 release-blocking**. Add a real browser journey with clicks and downloads and a real Manifold/fabrication fixture; no mocked cutters, screenshots-only or source-string assertions.

### 3.3 Apply this mount system to all seven, appropriately

Each family must have at least one end-to-end tested design/variant that can support **P1 pixel + outward fixing tab(s) + prepared STL/3MF + Cura profile**, including:
- **Crystals:** connected structural base ears or a registered base plate, without destroying the root/vault/optical plan.
- **Tiles:** perimeter outward ears, safe wall web and relief clearance.
- **Gears:** backed solid/structural mounting interface outside moving teeth, avoid active rotation/shaft; preserve a blocked openwork fixture with honest reasons.
- **Waves:** well-supported underside/edge feet or flange without disrupting the wave surface/cable route.
- **Control Caps / Knobs:** compulsory rotary knob fixture above with stationary vs moving-part distinction.
- **Characters:** hidden/rear structural flange/tab where appropriate, preserving visible silhouette and touch edges.
- **Pods:** real edge/bottom tabs or registered backing ring on a shell/solid variant, preserving access opening and roof.

A physically unsupported variation does **not** exempt the whole model family. Offer an explicitly selectable, structurally credible compatible variant and test it. Native and Crystal may have family-specific adapters, but **one shared UI/feature contract and verification**.

### 3.4 Real manufacturing safety

- Positives (tabs/backing) must be **connected** where designated as single body, with sufficient rooted contact, no coincident-only faces, nonzero web/roof material and true Manifold Boolean union; moving and stationary assembly parts must remain separately printable and registered.
- Then subtract true fixing holes/seat profiles, including through-cuts that remove measured volume; certify no cutter that misses its target, unacceptable boundary collision, floating tab, wall collapse, hole too close to the edge or unplanned mesh disconnection.
- Validate pixel seat, shaft/cavity, support/retention/optical access, cable path, mount pair spacing and printer envelope **together**, not in isolated validators that permit overlapping features.
- Support print-ready orientation as Z-up millimetres; confirm 3MF coordinate transformations, constituent part placements, shape bounds, volume/dimensions and materials. Do not mix visual overlay meshes into STL.
- Reject operations gracefully without losing previous good state; show specific blocked/warning status and a compatible remedy. Offer fit coupons where relevant, but never call printed dimensions/screw load physically certified (physical Issue #10).
- Preserve undo/redo, stable mount IDs, profile/version/source backups, schema migration and reliable older projects.

## 4. P0 Pixel and wiring parity — finish the **real physical face**, don't dodge it

- Native placement has used vertical through-bores and only remembers top/underside. That **does not** satisfy placing a pixel on a knob's visible side/curve. Where the requested face and safe wall stock allow, design **orientation-aware normal-aligned sockets/seats** or correctly oriented attached backing, with explicit local coordinate, world normal, raycast occlusion and full printed geometry validation. Model/marker/ghost/socket side must agree on all cameras and exports.
- If curved/thin geometry requires reinforcement, let the user opt into a measured reinforcing boss/flange or switch a solid/backed version, with genuine positives and clearance. Maintain conservative rejection for genuinely impossible geometry; do not just flip to the invisible underside.
- Keep serial LED wiring truthful: pixel P1→P2… arrows, 180° IN/OUT at each pixel, smooth bend radii and 25/50/100/custom pitch, separate input/tail, overlength red, independent Show guide vs Cut channels, ordered/reversed P1. Visible on or through appropriate views even if machining is off; physical channel report and exported cutter must match the planner.
- Reproduce the owner's **openwork Gear four-pixel** problem: double-click, wrong-face prevention, P1–P4 markers, clear wiring guide or precise no-safe-route reason, save/reload and honest bore-only STL/3MF. Also test a **solid/backed Gear** with actual manufactured groove and real lengths.
- Handle camera/drag conflict, pointer capture, ESC/Done, invalid placement rollback, hidden faces, negative space, accessible keyboard/touch controls across all seven.

## 5. Cura and Print Centre are part of the same promise

The owner has **Ultimaker 3 Extended and Ultimaker 2+**, often 2.85 mm filament, and uses Cura. The Print Centre must make the expected job unambiguous:

- Printer: **UM3 Extended / UM2+**; nozzles **0.25, 0.4, 0.6, 0.8 mm** where the chosen machine/core actually supports the configuration. Preserve honest AA/core/printer compatibility rules; no invented 0.6 AA installed configuration.
- Material: **PLA / PETG**, material-specific print temperature/speed/profile guidance and optically/translucent vs robust structural intent. Do not invent physically measured temperature for unknown filament brands.
- Quality slider: reliable layer height, wall count, top/bottom layers, infill, supports, adhesion, travel/speed/retraction settings that logically co-vary, bounded to nozzle and printer and documented. Validate settings, reproducibility and resulting Cura .curaprofile formatting.
- Provide an obvious **Download STL** action, **Download 3MF**, **Download Cura profile** and **Download full production pack**. If a current ZIP already includes the profile, preserve it, but the user should not have to hunt inside the ZIP simply to obtain the profile; add a direct profile download and honest import instructions.
- Make sure generated files correspond to exactly the **currently selected model revision, mounts, tabs, LEDs, cable cutters and print settings**. A stale worker/queue result must be invalidated automatically, old job buttons must not export the wrong item, and model revision/geometry fingerprints must be included in manifest.
- Manifest and report must list **pixel count and measured profile**, tab count/types, mounting hole diameters and locations, routing length/blocked conditions, prepared model bounds, material roles, printer/nozzle/material/quality, version and any required manual checks. 3MF and separate STLs must register movable/stationary assemblies correctly.
- Export actual Cura .curaprofile or honest fallback for supported combinations, validate its structure and repeatability with regression tests, distinguish **generated profile** from **real slicing success**; installed Cura verification stays in #10.

## 6. Finish genuinely shared editing, Library and import workflows

- Same surface and selected-object UX for pixel and external tab edits across families, including double-click, select, hold-drag, 1/5mm nudge, rotate, numeric dimensions, symmetry, duplicate/delete and meaningful shape-specific positive-feature presets. Crystal's existing feature richness must not regress.
- Design stage, Build stage, model tab switching, camera, material settings, tool selection, pinned measurement profiles and source state must not reset or interfere across open models.
- Library save/current revision, create collection, duplicate independent or insert linked, backup JSON, autosave, restore and cross-device private-vault flow (if connected) must preserve tabs, mounts, bores, wiring and Cura job configuration; show safe conflict review. No promise of automatic cross-device sync from localStorage alone.
- Import SVG retains actual holes, transforms and contributor provenance; STL/OBJ explicit units/orientation/validation/closed solid handling. For a valid imported mesh offer the same hardware tools where positive attachment/Boolean geometry is provably safe; otherwise preview-only with exact reason. Never regenerate impossible original CAD history.
- Test viewport dark/light contrast, readable controls, 390px phone, tablet and desktop, no hidden/inert tool, keyboard/touch fallbacks and absence of script/worker failures.

## 7. REQUIRE production acceptance tests before claiming completion

Do not mark any family \`P\` without an evidence-linked **real browser and manufacturing** test. Keep the canonical matrix in \`docs/MODEL_BUILDER_PARITY.md\`, with **one row per family** and columns:

\`Design/create/edit | Pixel manual + auto / correct face | External tabs (positive geometry) | Mount holes | Wiring guides/cuts | 3D camera/selection | Library/reload/backup | Print STL+3MF+Cura | Release SHA/evidence\`.

Statuses: \`P\` tested/proved; \`L\` limited; \`M\` missing; \`B\` truly physically blocked *for a specific incompatible design*, with a tested functional variant in same family; \`N/A\` inherently irrelevant, justified. **No blanket P via a text assertion, marker visibility or one Tile test.**

### Mandatory automated journey per each of all seven
1. Create family model, choose a real preset and change a meaningful parametric value; inspect every camera.
2. Add valid manual pixel by **actual Playwright double-click**, select/edit/reposition/rotate and verify selected face, true cutter, saved coordinates, blocked negative attempt.
3. Place at least two **outward positive mounting tabs/ears or registered fixed flange** with two actual screw holes; move them; verify **new positive material visibly extends beyond original bounds** and no hole/cavity/LED collision.
4. Add/reorder two or more physical pixels; Show wires independent of Cut channels; assert paths/arrows and truthful blocked state. Create at least one valid routed variant if possible, and inspect actual cutter results.
5. Save to Library, close/open independent and linked copy, backup/restore JSON, reload browser. Assert same tab/pixel IDs and settings, no unintended duplicate or stale model.
6. Queue current model, prepare real mesh, check Manifold connected/part-count/volume/bounds, download STL, 3MF, standalone Cura profile, ZIP; parse exports and assert tab material and holes are physically present, profile matches printer/nozzle/material/quality. Prove wrong-job exports are impossible.
7. Exercise invalid face, thin edge, overlap, hollow/shaft/openwork constraints and export inhibition without corrupting prior good state.
8. At desktop and phone widths, verify actual enabled controls, pointer focus/camera and no console errors.

Plus focused top-priority fixtures:
- **Control Caps rotary knob** with integrated or fixed stationary mounting assembly and two external M3 tabs, P1 and complete export: **gold-standard release-blocking fixture**.
- **Owner's openwork Gear** with four P markers, blocked routing explained, honest exported bore-only shape; separate **solid Gear** actual routed example.
- **Crystal** complete regression including optical/base/vault/root, richest editing, physical pixel seats/mount and dual-exports.
- **Imported SVG and valid/invalid STL/OBJ**, true geometry/preview-only and round-trip.

Run \`npm run test:static\`, \`npm test\`, \`npm run test:browser\`, \`npm run test:benchmark\`, release metadata verification and any current source-specific tests. Use Playwright pointer/dblclick and file-download assertions; Manifold volume/connectedness/cutter tests; STL/3MF parsers and generated .curaprofile content checks. Capture screenshots, artifact samples and **exact GitHub Actions run links for latest head**. Fix failures rather than removing checks or labelling all blocked.

No browser test mocking \`window.__sensoryStudio\` counts as a real click path when a user-facing action exists. Avoid tests only on generators' \`recipe()\` without executing exported product pipeline.

## 8. Integration, review, published-site gate

- **Recheck #87's actual state on arrival.** If open, preserve its camera and openwork Gear fixes, latest tested HEAD and owner merge choice; coordinate this work without editing #87 directly. If already merged, use new main. \`main\` must ultimately contain the approved software changes, not just feature-branch merges.
- Implement in **one or a small number of substantial reviewable draft PRs**. Prefer a shared attachment/geometry foundation PR and a final full parity + exports integration PR if necessary, **not** dozens of tiny drafts. Link all PRs to **existing Issue #79** and pinned scope.
- Version, CHANGELOG, in-app What’s New, README, Help, architecture/test docs, roadmap, handover and real parity matrix must correspond to actual code. Distinguish current from historical milestones.
- The owner keeps approval over **all merges and deploys**; do not merge, publish or bypass required checks automatically. Provide exact safe merge order and any needed retarget/rebase after an approved merge.
- **After owner approves/merges**, verify the actual \`main\` commit includes all features and a GitHub Pages deploy for that exact SHA succeeded, then run clean-browser end-to-end at \`https://connorturansky-svg.github.io/crystal-forge/\` against the published site, including knob→pixel→external tabs→STL+Cura and a separate Gear and Crystal check. Avoid deleting the user's local saved data. A green CI workflow on a draft is **not proof that the website is published or that the owner's hardware works**.
- No new software issues. Update #79 checklists/comments with evidence and close #79 only if every accepted P0/P1 software capability is verified **on the released site**, or the owner explicitly approves precise documented exceptions. Physical tests #10 remain open; modular assembly #51 stays on hold; Jordan #36/#37 and the Copilot pilot #33/#42 remain independently owned.

## 9. End condition and Codex handover

**You must DO the work and TEST it, not just draft a plan.** The release candidate must support this exact owner walk-through:

**Open app → new Rotary Knob → configure size/grip → Build → choose pixel profile → double-click the visible, supported knob face → place, edit and see P1 → Add external mounting tabs, position TWO tabs and their holes (integrated or fixed backing as physically appropriate) → verify actual positive/negative geometry in cutaway → save/reopen → Print Centre → prepare real mesh → download STL, 3MF, Cura profile and production ZIP → inspect actual tab and pixel features inside the files.**

Repeat the same class of flow with all six other families. Unsupported individual geometry must have an actual workable in-family alternative. Maintain equal shared controls and preserve family-specific tools.

**Final report must include:** latest \`main\` SHA; all draft PR URLs/heads, exact tested CI, 7×feature acceptance matrix and artifacts, detailed knob fixture and real manufactured dimensions, openwork Gear evidence, standalone Cura output verification, print/export downloads, post-merge Pages SHA if approved, known physical/functional restrictions and explicit owner merge order.

**Never call this “fully functional”, “parity complete”, “production ready” or “published” based on controls, draft PRs or partial tests.** If something remains broken, fix it in the milestone or state precisely what remains and why. Preserve the owner's ability to choose when to merge.

### Codex short instruction (implementation, not an audit)

**Implement WT-021 as the missing final parity contract on top of the current tested main/WT-020 stack.** Complete shared 3D hardware placement, genuine external tabs/ears/flanges and mounting bores, truthful wiring, Design/Library/Print, real STL/3MF + standalone Cura exports across **all seven families**, with the **rotary knob P1 + two external mounting tabs + downloadable STL/Cura** as the mandatory end-to-end test. Fix every P0/P1 defect, run exact-head browser and manufacturing acceptance, produce merge-ready draft PRs, leave owner merges/deployment untouched, and verify the live Pages site after owner-approved integration. Keep everything under #79 and preserve #10/#51 and contributor-owned work. Do not stop at planning.
