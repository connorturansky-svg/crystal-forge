# PR8 — Correct pixel-string wiring and identifiable 3D hardware

**Status:** implementation specification / planning only — no application code changed in this draft.  
**Proposed target:** v0.13.0. **Base:** merged PR7/v0.12.0, `e60c64b000e53ce6e1805fd52bebfc0eabf9119e`.  
**Issues:** [#7 — Pixel hardware/wiring](https://github.com/connorturansky-svg/crystal-forge/issues/7), [#9 — Hardware editor](https://github.com/connorturansky-svg/crystal-forge/issues/9), [#6 — Cura and printability](https://github.com/connorturansky-svg/crystal-forge/issues/6), [#10 — QA](https://github.com/connorturansky-svg/crystal-forge/issues/10).

## Why PR8 starts here

User screenshot (11 November 2026) proves the existing **Two parallel wires** option is the wrong real-world abstraction: `wire-routing.js` implements `lanes: 2`, which offsets **two grooves beside each other on one route**. This is **not** two physical cable tails on opposite sides of each pixel. It also uses a nearest-connected tree, not a controllable serial pixel-string order, and adds a perimeter route from only the first socket. This conflicts with a string in which each pixel has an independent **IN** and **OUT** cable tail. For a single pixel, both tails still need physical edge openings.

**Prioritise correcting the fabricated routing and UI contract over any extra aesthetic/editor shaders or speculative geometry.** Route channels are **physical paths for cable bundles/tails**, not one groove per individual electrical conductor, and must not imply that both end cables are electrically joined or energised. An outgoing last-pixel tail can be an unused/terminated tail depending on the actual string.

## Acceptance order

### P0-A — Real pixel-string topology (start first)

- [ ] Replace the exposed two-parallel-wire concept with **Pixel string** routing. Model `edge input -> P1.IN -> P1.OUT -> P2.IN -> … -> Pn.OUT -> edge output`. Every pixel uses **two opposed physical cable ports**; **never** two adjacent side-by-side tracks as a substitute for those ports.
- [ ] Pixel count zero: no routes, no misleading ready status. **One pixel:** two distinct grooves: incoming edge to P1.IN and P1.OUT to outgoing edge. **Many pixels:** one first input perimeter run, `n-1` ordered inter-pixel runs and one final output perimeter run. Route bend segmentation can add further geometric segments; report **logical connections** separately from groove segment count.
- [ ] For the entire string, port orientation follows a per-pixel cable-axis control (manual angle override supported). Cable envelopes use nominal selected pixel profile, cable/channel width and clearance. Ensure the IN/OUT attachments enter opposite sides of the actual housing, with no hidden gap, pinched overlap or unauthorized cut into its retaining geometry.
- [ ] Allow safe **automatic perimeter entry/exit** (each selected independently) and manual position picking, defaulting to clear openings; don't require opposite *edges*, but both separate cable tails must be open to the perimeter for a single pixel. Reject impossible exits and show why.
- [ ] Inter-pixel routes use authoritative **saved list order**, not a greedy spanning-tree ordering. A suggested short path order may be offered as an explicit reversible action, never silently replace a chosen order.
- [ ] Enforce base-wall/roof clearance, fastener/tab collision, other LED sockets, route-to-route collisions and safe bend/strain-relief warnings. Skip invalid paths visibly; do not fabricate a disconnected or misleading “connected” route. A separately confirmed physical wire route is still needed.
- [ ] Persist a versioned route mode, optional stable pixel IDs and ordered IDs, input/output edge positions, port angle and route errors. Explicitly warn when migrating legacy `wireMode='parallel'` projects because identical geometry cannot be preserved under corrected physical semantics without opting in.
- [ ] Update Manifold subtractors, cyan previews, wire route status, numbering, printed production ZIP and wiring CSV in one coherent implementation. Count complete strings and open ends, not just segments. No change to solid/balloon/vault restrictions unless verified.

### P0-B — Pixel and mount identifiers / linked editor

- [ ] Display **P1, P2, …** for accepted LED sockets and **M1, M2, …** for accepted mount holes directly on the 3D base/underside and in the Build list. Mark invalid holes clearly and differentiate perimeter mounting tabs from plain mounting holes (e.g. T1). Labels are **viewport overlays**, not embossed/engraved on the print unless separately requested.
- [ ] A stable saved internal `id` identifies each manual item; visible P/M number is computed from accepted serial order. Auto-placed IDs must remain deterministic for the same formation/settings. Retain selection through reorder/regeneration when the underlying item survives.
- [ ] Single-click a 3D hardware marker: select/highlight it and its connected routes, reveal Build settings, scroll/focus the associated editing card. Clicking the list card selects/highlights the same 3D object; safe keyboard focus/Enter/Escape. Show clear selected/hover/invalid palettes on light, dark and red hardware heatmap backgrounds.
- [ ] Reorder pixel cards by drag handle **and accessible Up/Down buttons**. This updates string route/order/label, without moving the actual X/Z coordinates, profile, cable angles or mount positions. Reordering invalidates any prepared STL/ZIP; undo/redo and JSON save/reload faithfully restore state.
- [ ] Double-click *unoccupied* base/underside -> compact anchored context menu at actual X/Z: **Add pixel hole**, **Add mounting hole**, **Cancel**. Before committing, show collision and perimeter/roof validity; double-click an existing marker opens its settings instead. A drag must never count as double click; orbit, existing click-to-place and pan remain functional.
- [ ] Show both socket and mount identities in the list even if they are **auto-generated**; where manual movement is unavailable, clearly offer “convert to manual” without silently discarding positions. No duplicate logical IDs.

### P0-C — Required regressions before PR8 may merge

- [ ] Pure routing tests for N=0,1,2,6, mixed seed/gumdrop profiles, manual order, rotated IN/OUT ports, two edge openings, unsafe edge, mounting-tab collision, thin roofs, unreachable link and duplicate/missing IDs. Verify route endpoint geometry and ordered logical connection graph, not just `routes.length`.
- [ ] Manifold geometry: real cut openings for P1 IN, Pn OUT and ordered links, stable single connected **solid model**, correct skipped-path warning and no sealed unintended cavity. Verify not overstating real-world cable serviceability.
- [ ] Browser E2E: click P3 marker selects card P3; select M2 card highlights M2; reorder P3 before P2 and verify saved route + 3D overlay + CSV numbering; auto/manual selection, double-click menu, reject duplicate/invalid placement; keyboard actions; JSON roundtrip + undo/redo; download ZIP/STL after Prepare, invalidate after edits.
- [ ] Preserve historical saved projects and existing Design/Build/Print flows. Three CI suites (static, real Manifold and Playwright) must pass on the exact PR head; don't touch `main` before review.
- [ ] Cura/physical acceptance remains separate: inspect real wiring slots, filament prints and actual LED/cable interference. Geometry topology and ZIP signatures do **not** certify wire bend radius, clip strength, electrical behaviour or overhead safety.

### P1 — Remaining PR8 critical fabrication (after wiring/selection)

- [ ] Inspectable LED-to-crystal cutaways and per-crystal actual geometry connectivity, with report of genuinely blocked/rejected paths and clearance/wall warnings; preserve the user's one-LED Simple default.
- [ ] Better minimum-wall/nozzle, roof-span, bridging and support diagnostics linked to UM3 Extended / UM2+ Cura profiles and orientation. Real Cura print layers are a separate manual validation gate.
- [ ] Serviceable LED clip/lip, entry chamfer and strain relief only where measured real components justify exact dimensions; printable specimens/fixture tests.
- [ ] Ensure production pack contains unambiguous assembly/connection order, separate input/output tails, fixing IDs and a caveat that physical installation needs technician approval.

### Deferred (unless necessary for safety or regression)

Advanced shader/material simulation, crystal multi-select, weighted families, complex bed nesting/automatic splitting, broad templates, xLights/FPP controller assignments. These remain in [#8](https://github.com/connorturansky-svg/crystal-forge/issues/8), [#9](https://github.com/connorturansky-svg/crystal-forge/issues/9) and [#1](https://github.com/connorturansky-svg/crystal-forge/issues/1) for later phases.

## Suggested module boundaries (not yet implemented)

- `wire-routing.js`: physical **ordered logical graph**, per-endpoint geometry and obstacles; no pixel-order derivation from route solver. Plan may be separately grouped into logical runs and geometry segments.
- `hardware-layout.js`: stable IDs, accepted ordered sockets, mount/tab IDs and shared clearance/validation. Never duplicate conflicting hardware state in the UI.
- `hardware-editor.js`: numbered overlay, hit-testing, focus synchronization, reorder, context menu and accessibility.
- `studio-v3.js`: new saved settings/order and migration, undo/redo and manufacturing hash invalidation.
- `fabrication-v1.js` / `production-pack.js`: exact cutter/report/ZIP/CSV matching the authoritative plan; stale export rejection.
- `tests/wire-tab-edit.test.mjs`, `tests/fabrication.test.mjs`, `tests/browser-smoke.mjs`: add critical acceptance fixtures. Update `CHANGELOG.md`, `docs/AI_HANDOVER.md`, `docs/ROADMAP.md` and issue checklists after **real code** is implemented.

## Explicit boundaries

This is a *planning draft*, not an implementation. Existing PR7 parallel tracks are still live until a tested PR8 implementation is merged. Preserve v0.12.0 behaviours except where corrected by the requirements above; do not claim electrical wiring or physical Cura validation has been completed.