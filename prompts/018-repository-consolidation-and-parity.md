# WT-018 — Repository Consolidation, Backlog Closure and Seven-Builder Parity

> **Status:** Owner-requested implementation brief, saved for a deliberate Codex dispatch; documentation alone does not trigger coding.
> **Repository:** connorturansky-svg/crystal-forge
> **Planning source:** planning/prompts / prompts/018-repository-consolidation-and-parity.md
> **Owner's central requirement:** Stop accumulating overlapping partial milestones. Reconcile the actual code on main, resolve the open PR and issue backlog responsibly, make the seven model builders feel like ONE coherent and comparably capable product, and produce a release candidate the owner can open and review.
> **Scope boundary:** Do not auto-merge, push to main, deploy GitHub Pages, publish a release or override another contributor's branch. Keep WT-011 modular assembly on hold unless the owner explicitly lifts it. Preserve Jordan's WT-003 contribution and attribution.

## 1. Desired outcome and definition of done

Crystal Forge / Pixel Model Maker should emerge from this work as a tidy, maintainable project with:
1. A verified latest-main baseline; no falsely claimed merged feature, broken PR stack, unexamined conflict or lost code.
2. An honest, **small actionable backlog**: completed/duplicate/stale issues and PRs properly explained and closed where justified, unresolved work regrouped into specific prioritised items, and ownership/holds retained.
3. One authoritative current roadmap, handover, changelog and acceptance matrix rather than stale contradictory phase descriptions.
4. All seven model builders matching the strongest **common** functional and user-experience standard, with deliberate exceptions only for model-specific controls or demonstrably unsafe geometry.
5. Real functionality, not matching labels: double-click-to-add pixels and mounts, direct 3D selection/editing, persistent measured profiles, actual visible cable routing where technically possible, useful blocked-route explanations, proper fabrication and Print Centre behaviour.
6. Automated verification of shared behaviour for each of the seven families, compatibility with existing saved projects and representative actual Manifold/STL/3MF exports.
7. A clearly linked set of reviewable **draft PRs** and an owner walkthrough. Merges, deployments and any risk-bearing closures remain with the owner.

**Do not confuse tidy GitHub administration with shipping features.** A closed issue is not evidence of implemented functionality; a PR marked “merged” is not evidence its commits are reachable from main; green tests are not proof of physical LED fit or optical transmission.

## 2. Fresh audit and Git history reconciliation — mandatory first

Before editing fetch latest main, open PRs, issues, recent commits, branch heads and CI. Read AGENTS.md, docs/AI_HANDOVER.md, docs/ROADMAP.md, docs/PROJECT_VISION.md, docs/FEATURE_SPECIFICATIONS.md, docs/DESIGN_DECISIONS.md, docs/ARCHITECTURE.md, docs/TESTING.md, docs/PRODUCTION_REVIEW.md, planning prompt index, acceptance specs and existing tests. Inspect implementation source, not just descriptions.

### Known starting leads from the 19 November 2026 review (RECHECK LIVE)

- Main was observed at f7c5a3ae68862338e9b7a719bbc54c59d839b616 after PR #67.
- PR #66 (stale-tab protection / multi-viewport testing) was “merged” into the #65 feature branch **after #65 was already merged into main**. Check whether its source is actually reachable from main; reconcile safely if absent. Version dev.20 must not be falsely claimed on main.
- PR #68 (native routing in backed Waves, Caps, Characters and Pods) was “merged” into its #67 feature-branch parent, not necessarily main.
- PR #69 (Studio SVG import) was “merged” into the #68 parent branch, not necessarily main.
- PR #70 (STL/OBJ import) was still OPEN, based on #69 rather than main. Inspect its exact head, pending checks, dependency chain and geometry/Library/Build limitations. Do not merge or close until reviewed and correctly integrated.
- Jordan's separate, open/draft SVG engine PR #37 is externally owned; #69 reports using its engine. Verify exact provenance and credit, overlapping paths, integration strategy and what remains open. Never silently close/overwrite #37.
- Open documentation pilot PR #42 needs a specific decision, not automatic closure.
- Open historical issues #1, #6–#10, collaboration issues #31/#33/#38/#39, external SVG #36 and held WT-011 #51 need triage.
- Planning README may still misleadingly describe WT-015/016/017 as not implemented. Verify before correction.

**Deliver an evidence table**: main commit, relevant PR, true merge base, reachability from main, test SHA/checks, impact, overlaps, keeper/source branch, disposition and next action. Use Git ancestry/compare/diffs rather than trusting merged status.

**Reconciliation order**: first capture any unlanded production reliability fixes; then reconcile routing #68, SVG #69, and mesh importer #70 with their shared history, in dependency order; run new exact-head tests on appropriately retargeted integration commits. Do not cherry-pick blindly or replay already merged work. Keep Jordan's draft isolated unless coordination/owner approval allows a distinct integration resolution. If stack resolution conflicts with owner approval, prepare safe draft PR(s), explain merge order and stop at that boundary.

## 3. Issue, PR, branch and planning hygiene

Create a durable **BACKLOG_TRIAGE.md** (or equivalent) referencing each relevant issue and PR. For each: current reality; merged/available/untested; outstanding owner or physical checks; duplicate/superseded relationship; recommended disposition **CLOSE COMPLETE / CLOSE DUPLICATE / KEEP ACTIVE / KEEP ON HOLD / BLOCKED / OWNER DECISION**; relevant exact commit or PR; remaining specific acceptance.

Then apply safe triage:
- Close **clearly proven completed** issues with a succinct evidence comment linking source, tests and any moved physical gates.
- Close true duplicate/obsolete issues only after relocating still-valid acceptance to a surviving authoritative issue. Link the surviving record both ways. Never throw away user intent just to reduce the number.
- For genuinely stale/duplicate PRs: inspect code and comments, compare to current main, preserve useful history/credit, and close with an explanation only if plainly superseded and not externally owned or under owner review. Do not close draft #37, unverified #70, held #51 or any externally owned item without owner approval.
- Where closing is ambiguous, provide a **proposed closure list for owner approval**, not unilateral deletion.
- Distinguish issue closure from PR merging. **Never merge or deploy without owner approval.**
- Do not delete branches (particularly external forks, planning/prompts, holds or work in progress) without explicit owner approval. Recommend pruning unreferenced branches separately.
- Keep physical verification as an honest open gate (e.g. issue #10), with actionable Cura/print/LED/cable/optics test items. Don't close physical acceptance because software CI passed.
- Preserve contributor agreements, protected-main workflows and WT-011 hold.
- Do not create dozens of trivial replacements. Consolidate into a few useful owner-readable workstreams: product parity, import lifecycle, production/physical QA, deferred assembly, contributor/operations (if still useful).

Review in particular historical issues #1 and #6–#9, whose checklists contain features implemented after their creation. Move truly outstanding details into new current-state acceptance, then close historical trackers if their remaining scope is captured elsewhere. Keep #10 open for unverified production QA. Keep explicit owner-controlled operational requests unresolved where no action has been taken.

## 4. Whole-app product audit: seven builders must be peers

**The user has found a serious disparity**: Crystal Clusters offers richer direct hardware interaction, visible routing, precise placement and editing; the other six families often feel like reduced tools. Resolve the underlying inconsistency rather than concealing it with matching headings.

Audit **seven model families × the complete shared capability list**, recording:
- P = implemented + verified; L = limited; M = missing; B = unsafe or unsupported on tested geometry; N/A = fundamentally model-specific/non-applicable.
- Exact source function/handler and test; explicit exception rationale; remediation PR and evidence.
- A before/after parity matrix in docs/MODEL_BUILDER_PARITY.md, connected to a test-enforced registry/fixture where practical.
- Do **not** treat “same visible button” as parity. Test the whole operation, persisted data and exported geometry.

Families: Crystal Clusters; Tactile Texture Tiles; Cogs/Gears; Waves/Organic Forms; Buttons/Control Caps; Characters/Silhouettes; Glowing Pebbles/Light Pods.

### 4A. Consistent model UX and viewport

Shared tools must live in predictable Design / Build / Library / Print positions:
- Same model-tab lifecycle and per-model independent settings, camera, project history and selection.
- Reliable centre-screen 3D preview; orbit, pan, zoom, zoom-to-fit, reset and top/side/underside where meaningful.
- Common select/move/rotate/scale and exact input controls for **whole models** and actual editable subparts. Distinguish the two.
- Clear hover, selected, locked, ghost and invalid states. Panels and precision controls stay synced to the active model.
- Matching Help/tooltips, Simple/Advanced semantics, accessible focus, escape/cancel, keyboard equivalent, touch alternative, light/dark and small-width behaviour.
- Undo/redo, saved/reopened models, duplicates/linked Library revisions, JSON recovery and active job invalidation work the same way.
- Preserve true family-specific controls: Crystal count/lean/formation, Tile pattern/relief, Gear shaft/tooth parameters, Wave contours, Cap grip/shaft, Character pose, Pod shell/cavity. Never fake universally editable subparts on a single-piece generator.

### 4B. Exact pointer interaction — mandatory parity

**On every family**:
1. Single-click an existing pixel/mount marker: select it and show its corresponding Build controls, highlight and route. Clicking the Build row highlights the same 3D marker.
2. **Double-click a blank valid area of the 3D model**: open a contextual menu at the raycast point with **Add pixel**, **Add mounting feature** and Cancel, subject to real eligibility. Double-click on an existing marker edits/selects it; does not add a duplicate.
3. Toolbar **Add pixel** starts continuous manual placement with valid/invalid ghost; clicks add P1, P2… until Esc/Done. Select once; **click and hold/drag** selected marker to move while temporarily disabling camera orbit. Ordinary dragging empty space still orbits.
4. Reorient a pixel and its opposed cable axis. Move hardware precisely with X/Y/Z or applicable native coordinates, step/snap, rotate, delete, cancel/revert, undo/redo. Invalid placement does not overwrite last valid geometry.
5. Offer a keyboard-accessible and touch-friendly equivalent for context actions (never rely only on double-click on mobile).
6. Ensure raycasts correctly account for transformed geometry, raised/curved surfaces, holes, empty space, hidden parts and view modes; do not infer a valid fitting from a bounding rectangle alone.

Build **real Playwright interactions**, including double-click -> context menu -> add pixel, mouse selection -> hold/drag -> save -> reopen, mount handling, Esc, rotate/orbit, keyboard and touch emulation for all seven. Capture screenshots.

### 4C. Pixel fitting and mounting parity

- One authoritative measured A–G pixel profile library, named custom types and print-fit calibration; create/select a profile **before placement** or explicitly edit only the currently selected pixel.
- P1/P2/… and M1/M2/… labels stable and synchronised with precision cards, 3D markers, route reports and manifests. Add, auto-place, select, reorder, Set P1, reverse, nudge, delete and validate consistently.
- Reorder **physical wire order**, not position. Preserve underlying IDs through edits, save/load, old project migration, Library, backing, exports and cross-device restore.
- Real Manifold bores, suitable seat backing, mount clearances and honest shape-specific restrictions. Opt-in positive backing must actually print; never auto-change old projects.
- Refuse unsafe socket placement in open cavities, too-thin walls/roofs, small shafts, holes, edge/part collisions, relief and mount conflicts. Explain a practical fix (smaller profile, move pixel, add backing/increase thickness).
- Mounting: common contextual add/select/move/edit/delete for supported mounting holes/tabs/inserts; preserve model-specific hardware constraints and existing Crystal arrangements. Do not manufacture false load ratings or universal mounts.
- Fit coupon and selected-pixel dimensions remain discoverable in the same place in Build/Print for all applicable families.

### 4D. **Visible, physical cable routing** — highest-priority parity gap

Common Build controls and overlay across all seven wherever routing is opted in:
- **Show wiring** vs **Cut physical cable channels** are separate concepts. A visible guide must not imply the STL contains a cut.
- Visible actual path in 3D / transparent underside / cutaway, with ordered P1 → Pn, opposing 180° IN/OUT ports, directional arrows, distinct EDGE IN and EDGE OUT, red failed segments, curved centreline lengths, available vs required pitch and accessible route diagnostics.
- Common 25/50/100/custom mm physical spacing, independently handled first/last tails, user-adjustable orientation and safe edge endpoints where validated, Set P1, reverse and reorder. Preserve existing Crystal length snap where applicable and extend consistently where safe.
- Same authoritative sampled smooth centreline for overlay, physical cutters, length accounting, wiring reports and exported Manifold STL/3MF. No disconnected decorative grooves, rigid joints or silent partial cuts.
- Recompute and invalidate stale preparation after moving pixels, changing model geometry/thickness, route settings or profile. Fail closed for over-length, missing perimeter entry/exit, blocked thin roof, shell cavity, gear window/shaft, tab/mount collision or disconnected path.
- **Do not call all presets universally routable.** Demonstrate at least one actual, verified multi-pixel route for each suitable family's tested solid/backed fixture, while documenting unsupported styles. The 19 Nov #68 work specifically claims supported backed fixtures for Waves, Caps without shaft, Characters/Cloud and non-hollow Pods: verify whether that code actually landed on main and test rather than duplicating it.
- Crystal-specific root/optical geometry stays behind its real adapter; never pass non-Crystal meshes into Crystal-only base-height algorithms.
- Show accurate physical route overlay **even when the owner rotates the model**. Never fake channel success from viewport lines alone. Provide prepared cutaway comparisons and Manifold post-subtraction evidence.

### 4E. Lighting, print, Library and imports

- Preserve Crystal sampled light-path inspection; offer equivalent prepared cross-section and truthful “confirmed/unknown/blocked” diagnostics for illuminated families where geometry supports it. Physical brightness/diffusion remain unverified.
- All families use the same global Print Centre (current revision, printer/nozzle/material/quality override, progress/cancel, prepared dimensions, STL/3MF, dual-material when supported, manufacturing packs). Reject stale/invalid geometry.
- Imported SVG and STL/OBJ, **once genuinely integrated on main**, must join the same tabs/Build/Library/Print flow **where physically validated**, without pretending imported meshes offer native parametric controls. First reconcile #69/#70, then include them as **additional import-backed parity fixtures**, not duplicate importer projects.
- Verify moving between model types does not erase unsaved custom pixels/profiles, model-specific tools, linked revisions, backups or history.

## 5. Shared implementation approach — no parallel half-editors

Inspect before refactoring. Prefer a shared, capability-driven viewport/selection/hardware UI contract with **family-specific geometry adapters**. Keep model-specific shapes and their manufacturing validation separate; reuse known-good Crystal curve/port math, profile records, storage/Print Centre contracts and Manifold pipeline rather than seven duplicate implementations.

Document the **single source of truth** for: selected model/part/hardware, pixel IDs and order, profile source, transforms, route planner result, actual cutters, render overlays, prepared version/fingerprint, print jobs and backups. Avoid dual state or stale panels. Preserve legacy saved projects, Crystal manual/automatic pixels and routing. No destructive migrations. Use feature flags/versioned additive schema only if essential.

A P or “complete” parity cell requires working UI + accepted state + persistence + correct prepared geometry, not a source-code existence check. Do not degrade Crystal capabilities to force equality.

## 6. Release reliability, CI and physical gates

Run existing test:static, test (Manifold), test:browser (Playwright), test:benchmark and release metadata checks **on each exact proposed PR head** where relevant. Inspect logs, actual browser screenshots, console errors, dimensions and exported STL/3MF (including negative cases).

Minimum scenario per built-in family:
- Create model, switch tabs, exact edit, select and drag 3D marker, double-click add pixel, choose profile, change wire order/pitch, inspect live route/arrow, select mount, save/reload and prepare/export valid fixture.
- Explicit invalid tests: unsafe thin geometry, hole overlap, blocked route, too-short pitch, missing backing, outline/mount collision; control must fail honestly and preserve previous state.
- Cover at least one positive physically routed multi-pixel family fixture where a safe route is supported.
- Check old Crystal JSON, old native saved records, templates, private-vault mocked conflicts, failed imports/backup, two browser tabs, 390px/tablet/desktop, two themes, keyboard and touch entry paths.
- Real Cura machine profiles, slicer layers, printed LED retention, flex/bend, optical output, temperature/electrical and mounting strength remain **manual physical acceptance**. Maintain an owner-friendly sample matrix; do not label software-only tests as a certified printed installation.

Performance: use workers for expensive geometry, cancel/stale-result guards, memory cleanup across tabs, clear error/progress; do not freeze on complex models. Don't solve correctness by weakening geometry guards.

## 7. Roadmap and documentation clean-up — deliver a single current story

Consolidate current-state docs rather than indiscriminately deleting history:
- README front page: honest product status, version, live URL, what seven builders and imports can **actually** do, how to test and known limitations.
- docs/ROADMAP.md: current implemented vs limited vs next, concrete release gates and only **active** priorities; archive historical draft plans without disguising them as latest.
- docs/AI_HANDOVER.md: short current facts, exact modules and merged PRs, active source/test heads, remaining blockers, links to deeper historic records.
- docs/FEATURE_SPECIFICATIONS.md, DESIGN_DECISIONS, ARCHITECTURE and test/acceptance docs where actual changes demand updates.
- Changelog, in-app What's New, visible version and release gate consistent with the actual code on main or tested PR head; document branch-dependent version collisions (dev.20 etc) honestly.
- planning/prompts/README.md: reconcile old statuses 015–017, live PR stack and the new parity/consolidation prompt in a **separate planning-only update** after source review. Never rewrite immutable historical approved briefs.
- Provide a short **owner-friendly report**: “what works now”, “what has been closed and why”, “what remains open and why”, “what I should test”, and “exact merge order”.

One canonical live parity matrix, one active roadmap and one tracked acceptance ledger should be sufficient. Do not create a maze of overlapping documents that reintroduces this problem.

## 8. Delivery sequence, draft PRs and approvals

Work in the following order; adapt only with documented evidence and dependencies:

**A — Baseline & reconciliation plan:** Read everything, verify reachability for #66/#68/#69/#70, create issue/PR disposition ledger and before-parity matrix. Document explicit merge dependencies and conflicts.

**B — Recover unlanded work:** Prepare focused, reviewable draft integration PR(s) against current main or a documented tested stack. Include missing #66 reliability changes and genuinely not-yet-landed routing/SVG/import features without replaying duplicates or modifying Jordan's draft. Test exact head. **Owner merges**, not Codex.

**C — Shared tool parity implementation:** One substantial, reviewable draft PR (or separate dependent UX and geometry PRs if safer) bringing double-click/context add, 3D marker manipulation, cross-family routing overlay, common Build controls, fitting/mount workflows, saved-state parity and real printable eligibility to the highest supported standard. Stack on reconciled tested code where necessary. Keep real model-specific differences.

**D — Independent full product review:** Run all-seven browser interactions, route/manufacturing fixtures, import round-trips where available, storage/responsive tests; fix regressions in their owning PRs. Supply screenshot comparisons and accurate P/L/M/B/N/A after matrix. New missing features warrant narrow follow-up PR(s), not bogus signoff.

**E — Backlog hygiene + release readiness:** Comment and close clearly completed/duplicated issues with evidence, recommend closure for ambiguous/external/owner-held work without unilaterally closing it; update current roadmap, handover, release gates and owner walkthrough. Close/retire obsolete PRs only when their functionality is safely preserved and authority is clear. **Leave main merges, Pages deployment and release publication to the owner.**

Each PR must document: baseline SHA, scope, dependent refs, why it is safe, before/after parity, screenshots, positive and negative Manifold fixtures, exact-head static/browser/fabrication/benchmark results, save-data compatibility, performance, manual Cura/physical checks outstanding, handover, clear merge order. If CI is blocked or time runs out, deliver honest partial drafts and outstanding work instead of claiming full completion.

**Do not stop after an audit or a plan:** implement and test as much as possible in this dispatch, prioritising **recovery of missing source and consistent seven-family interactions**, then fix real parity gaps. Never silently skip the owner's double-click, drag and visible wiring concerns.

## 9. Acceptance gate — no early “all done”

The owner can open a tested release candidate and:
1. Create each of seven families and see a consistent Design/Build workspace.
2. **Double-click on a valid model surface** and add a pixel; select it, hold-drag, rotate, edit its measured profile and undo/reload without losing it.
3. See real numbered pixel routing, entry/exit, arrows, curved physical pitch warning and cutaway on representative routeable models; unavailable variants show a concrete engineering reason, not missing controls.
4. Save several independent models to Library, reopen, restore a backup and prepare accurate STL/3MF/production packs.
5. Import SVG and STL/OBJ **if reconciled source branches have passed their own acceptance**, or see these clearly flagged as not yet on main, never falsely shipped.
6. Review concise merged-vs-unmerged evidence, a short clean issue backlog, and a clearly documented physical testing checklist.

**Completion is not “everything closed”. Completion is accurate Git history, parity demonstrated by actions and exported meshes, trustworthy release documentation, and a sharply defined remaining physical acceptance backlog.**

## Codex starting instruction

Fetch live GitHub state and read this exact planning brief, the prompt library workflow and handover protocol, AGENTS.md, latest main and tests. Start with an accurate commit/PR ancestry audit and seven-family parity matrix, then perform the safe reconciliation, implementation, verification and issue clean-up stages above. Work in separate reviewable draft PRs. Never auto-merge, deploy, publish or remove work owned by another contributor.