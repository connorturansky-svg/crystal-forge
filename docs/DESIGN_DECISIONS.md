# Architectural and product decisions (ADR log)

## Reading this log

Each decision has **evidence class**: *explicit user requirement*, *jointly adopted design direction*, *implementation choice visible in code* or *new proposed guidance*. A date denotes only what the available conversation and commit history support, not a fabricated meeting. **Accepted** means a chosen design direction; **implemented** means corresponding tracked code exists; **validated** is always qualified to tests. New guidance here must not be mistaken for historical user approval.

### ADR-001 — Stylised, deliberately faceted crystals

- **When/evidence:** 10 Nov 2026 design discussion; explicit preference.
- **Decision/status:** Accepted, implemented. Large clean planar faces, recognisable shafts and pyramidal/asymmetric peaks; rounded corners/tips in the mesh rather than globally smoothed realistic minerals.
- **Why:** Earlier realistic/noisy/overly soft styles appeared visually weak or un-crystal-like.
- **Alternatives:** Photorealistic mineral geometry, highly noisy blobby shapes, flat-cut or needle points — rejected for current visual direction.
- **Consequence:** Every new geometry change must preserve large flat facets while softening vulnerable edges. No safety certification implied.

### ADR-002 — Generator AND individual editor

- **Evidence:** 10 Nov design iteration, user requirement.
- **Decision/status:** Accepted, implemented. Seeded formations plus selection, per-object shape overrides, locks, transforms and tree.
- **Why:** Rapid creative variation must coexist with purposeful fine-tuning.
- **Alternatives:** Generator-only or manual CAD-only — not appropriate.
- **Consequence:** Regeneration must honour preserve-locked and preserve intentional edits where specified; Simple/Advanced share one model.

### ADR-003 — Real Boolean manufacturing separated from preview

- **Evidence:** 10 Nov repository history and source; jointly adopted.
- **Decision/status:** Accepted, implemented. Fast overlapping Three.js preview vs Manifold-validated joined print geometry.
- **Why:** Rendering overlapping meshes is quick but can produce invalid STL components or seams.
- **Alternative:** Export preview triangles as if printable — rejected for normal export.
- **Consequence:** Separate preparation, progress, warnings, export gating and source hash invalidation.

### ADR-004 — The base has independent shape and hardware dimensions

- **Evidence:** user requests for width/depth, mound, edge rounding; implemented.
- **Decision/status:** Accepted. Outline style, outward margin, 25 mm gumdrop base depth preset, dome height and rim fillet are independent.
- **Why:** Base shape is both sculptural and hardware-bearing; one parameter should not unintentionally determine another.
- **Consequence:** Crystal roots follow dome; printer footprint, LED space, support requirements and mounts must be rechecked after changes.

### ADR-005 — Separate control of side, shoulder and touch-tip rounding

- **Evidence:** explicit user visual feedback and v0.4.2/v0.6 fixes.
- **Decision/status:** Accepted, implemented. Genuine spherical/tangential tip and shoulder continuity informed by side corner smoothing.
- **Alternatives:** Shader-only smoothing, simple cap truncation or an independent visible shoulder ridge — rejected.
- **Consequence:** Mesh closure, small-point behaviour and low-poly visual appeal must be regression-tested; touch safety always needs a physical sample.

### ADR-006 — Viewpoint centred on the cluster in floating studio light

- **Evidence:** user reported off-screen/pivot behaviour and dark underside.
- **Decision/status:** Accepted, implemented. Recenter true orbit pivot; even all-round illumination, light toggle and floating inspection.
- **Why:** Rotate a floating sculptural object, not orbit an arbitrary world origin or inspect it on a table.
- **Consequence:** Camera/test invariants must use actual model bounds and DPR-aware layout.

### ADR-007 — Wide spacing extremes and intentional world-space growth

- **Evidence:** explicit user request on 10 Nov and subsequent bug report.
- **Decision/status:** Accepted, implemented. 0% intensely clustered to 100% separate conservative crystal envelopes; lean patterns with strength/randomness separate.
- **Why:** Prior 100% looked crowded and per-crystal yaw made all-in-one and radial presets incoherent.
- **Alternative:** Simple additive random tilt per independently rotated object — rejected.
- **Consequence:** Coordinate frames and generated envelopes require numerical regressions; user-moved crystals may intentionally break automated spacing.

### ADR-008 — Prioritise a single shared underside gumdrop LED

- **Evidence:** design conversation, user intention; implemented default.
- **Decision/status:** Accepted default, with multi/no-lighting alternatives.
- **Why:** Fewer components and simpler installation; internal distribution must be considered from base to spikes.
- **Alternative:** Always put an independent LED under each crystal — advanced only, not the simple default.
- **Consequence:** Socket diameter, 22 mm nominal body clearance, retention and an uninterrupted light path matter more than decorative glow preview.

### ADR-009 — Source-of-truth hardware planning, manual override

- **Evidence:** user later requested visible Build positions and manual hole placement; tracked v0.7.0.
- **Decision/status:** Accepted, implemented. Same planner serves interactive guides and Boolean cutters. Auto and manual modes with collision rejection.
- **Why:** User must be able to design real hardware installations and trust what will be printed.
- **Alternatives:** Fixed automatic positions or separate preview-only hole markers — insufficient.
- **Consequence:** Invalid manual positions red/warned and excluded; no divergent export plan. Drag handles remain future work.

### ADR-010 — Cura-first exterior, not default global erosion

- **Evidence:** explicit user request on 10 Nov 2026 after costly hollowing.
- **Decision/status:** Accepted and implemented v0.6.1: solid joined exterior with real bores; Cura controls 0–100% infill and walls.
- **Why:** Avoid expensive full-model internal eroded offsets and let slicer handle ordinary print density.
- **Alternatives:** Always manually hollow every spike/whole cluster in Manifold — not the default, retained experimental.
- **Trade-off:** A 0% infill slice still has wall/skin rules; it does not guarantee a common glowing chamber.

### ADR-011 — Optional real underside base vault for zero-infill roofs

- **Evidence:** explicit follow-up request on 10 Nov; implementation v0.7.0.
- **Decision/status:** Accepted as optional experimental geometry. Cut open underside with integral tapered buttresses, socket collars and LED side windows.
- **Why:** A large domed roof may bridge too far when Cura has 0% internal infill.
- **Alternatives:** Depend on default Cura infill, add removable supports or return to slow full-cluster hollowing — each undesirable in some scenarios but still possible printing options.
- **Trade-off:** Added Boolean complexity and potential bridge islands; estimated roof gaps are heuristic, not certification. Does not automatically ensure every spike has a light route.

### ADR-012 — Keep full hollowing experimental

- **Evidence:** accepted shift and source `hollowCrystals` flag.
- **Decision/status:** Accepted, implemented as opt-in. Full erosion/channels retained for explicit use, mutually exclusive with base vault in UI.
- **Why:** Some actual light passages may require CAD geometry, but runtime, constant wall and connectivity were problematic.
- **Consequence:** Measure and validate separately; do not enable silently or label Cura-first as full hollowing.

### ADR-013 — Browser-hosted plain ESM and current dependencies

- **Evidence:** implementation choice visible in source; not a separately approved historical preference.
- **Decision/status:** Current implementation, accepted by maintaining existing project: static GitHub Pages, Three.js browser import map, Manifold WASM and Worker, no bundler.
- **Why (inferred):** Low setup friction for an accessible browser designer.
- **Alternative:** Framework/bundled SPA or desktop CAD — not demonstrated as accepted alternatives.
- **Consequence:** CDN availability, browser security/context and Worker support matter; avoid gratuitous rewrite.

### ADR-014 — Tests are evidence-limited

- **Evidence:** existing Playwright, Manifold and export suites; current user explicit requirement to stop assuming.
- **Decision/status:** Accepted current requirement. Distinguish syntax tests, numerical tests, browser interaction/logs, STL topology and actual print checks.
- **Why:** Code looked plausible in past but broke in the browser; an earlier release had a syntax error and later passed CI only after repair.
- **Consequence:** Report exactly which commit, environment and test passed. No claims of optical, safety or print success from a manifold report alone.

### ADR-015 — **New workflow decision for ChatGPT and Codex** (not historical approval)

- **Evidence:** user's present request to create a shared workflow; introduced during documentation setup.
- **Decision/status:** Proposed/implemented as team instructions; actual adoption/merge is reviewable.
- **Choice:** GitHub main as deployed authority; short-lived independent branches/worktrees per assistant/task; PR review and evidence before merge; handover updated at session end.
- **Alternatives considered:** Both assistants committing straight to main (high collision/deployment risk), two permanently divergent branches (documentation drift), or a complete agent-orchestration platform (overkill).
- **Consequences:** Small PR overhead, but stable Pages and clearer collaboration. A PR/merge is a human-controlled promotion step, not background agent work.

## Conflict-resolution record

If source behaviour contradicts an accepted requirement, log a bug rather than rewriting history to say the code is intended. If two historical goals compete — e.g. large hollow light paths vs fast solid-model generation, or a vaulted underside vs a separate access pocket — describe the trade-off and preserve a safe default. Historical implementation alone does not prove an explicit user choice.


### ADR-016 — Separate size, taper and variation (explicit user requirement, v0.8)

- **Decision:** global starting diameter multiplies individual crystal radii while independent signed bottom/top adjustments and seeded width randomness alter taper.
- **Why:** prior maximum widths still looked thin, and making a dramatic crystal should not require hand-editing each shaft.
- **Trade-off:** changing thickness in an existing hand-placed cluster may introduce overlaps; regeneration is a separate deliberate step. Old saved taper ratios remain numeric and compatible.

### ADR-017 — Rigid lean and submerged root perimeter (explicit feedback, v0.8)

- **Decision:** apply lean using quaternion object rotation, not shearing mesh rings. Seat the *entire* tilted lower perimeter inside the base mound.
- **Why:** visual stretching and exposed bottom edges undermined both aesthetics and printable attachment.
- **Consequence:** share transforms between live scene, Worker, tests and previews. A topology check cannot prove mechanical attachment strength.

### ADR-018 — Continuous hardware placement and physical tabs (explicit requests, v0.8)

- **Decision:** the live LED/mount cursor displays an actual bore circle and remains active across repeated clicks with orbit disabled. Perimeter fixing ears are printed solids, evenly distributed on the base outline, with user-configurable through holes.
- **Why:** the user needs intentional, reliable, immediately visible placement of pixels, zip ties and bolts.
- **Alternative:** one-click exit and hidden automatic bores were insufficient. Pure overlay-only tabs were rejected; they must appear in actual manufacturing geometry.
- **Consequence:** the single planning module powers both Build and Manifold; invalid positions are rejected rather than blindly drilled. Mechanical rating is outside the tool.

### ADR-019 — Blind domed LED roof (explicit observed defect, v0.8)

- **Decision:** replace through-drilled LED cutter with a full-diameter underside shaft ending in a rounded, internal dome below the base surface; preserve separate vault side vents.
- **Why:** the previous bore punched through the top, risking appearance, waterproofing and structural continuity.
- **Consequence:** minimum modeled roof is a geometric bound only; Cura layers and physical printed thickness must still be inspected.

