# WT-021 — Complete Seven-Builder Functional Parity: Pixels, External Mounting Tabs, Wiring and Ready-to-Print Exports

**Status:** Owner-requested, implementation-authorised scope for Codex. This brief **clarifies and supersedes the incomplete software parity/finish-up portions of WT-020**, but retains its safety, validation, migration, publishing and owner-approval requirements. It is **not** another brainstorming or planning milestone.

**Repository:** `connorturansky-svg/crystal-forge`  
**Prompt source:** `prompts/021-complete-seven-builder-manufacturing-parity.md` (on branch `planning/prompts`), using the pinned commit supplied in the launch message.  
**Authoritative software tracker:** [Issue #79](https://github.com/connorturansky-svg/crystal-forge/issues/79). **Do not create another parity issue.**  
**Reference:** [WT-020 full final release brief](./020-final-software-parity-release.md), pinned at `f9c248fc6933da3d0451f5168e4eab830b5af6fe`; [WT-019 approved brief](./019-true-studio-model-parity.md) pinned at `10cdb618b0a0a0f09affbd4cdcab3d2c45525045`.

## OWNER CLARIFICATION — THE DEFINITION OF PARITY (AUTHORITATIVE, TAKES PRIORITY)

**The knob with one pixel and two tabs was ONLY AN EXAMPLE, not the feature target, priority model, or a privileged exception.** The user wants the **same comprehensive Crystal Cluster Build toolkit on all seven builders**. This section overrides any later phrasing describing the knob as the single “gold-standard”, the “minimum compulsory scenario”, or a unique release gate. **All seven model families have equal priority and identical mandatory shared-tool acceptance.**

### Parity means real functional tools, not matched menus

For every family — **Crystal Clusters; Tactile Tiles; Gears; Waves; Buttons & Control Caps; Characters; Pebbles/Pods** — a user should be able to start with ANY normally supported solid design, then use the same shared Design/Build/Library/Print Centre operations that work for Crystals:

1. **Pixels:** create/select measured/custom LED profiles; automatically or manually place one or multiple fitting sockets from the actual model in 3D; choose the intended physical face/entry; click/select/drag/rotate/edit/delete; preview true geometry and cut verified socket bores/retaining details, with P1–Pn order and independent wiring controls.
2. **External tabs/ears/flanges:** add **positive 3D material outward from the design**, attached to an eligible physical edge/face or to a purposeful separate backing/component; select/reposition/rotate/resize, choose style/count/symmetry and true fixing-hole sizes. These are **not** the existing negative-only mounting through-bores, decorative overlays or separate loose floating ears.
3. **Mounting holes:** independently add and precisely position through-holes, countersink/counterbore/seat where safe, custom diameter and depth, in existing stock OR in the outward tabs; preserve the Crystal's available mounting options, including compatible tab, hole, plate or attachment patterns where these are part of its existing Build toolkit.
4. **Cable routing and optical access:** choose/display P1–Pn arrows and wire paths, 25/50/100/custom pitch, smooth routes, input/output and tail, and optionally cut physically viable cable channels; show actual obstructions, overlength, missing stock and unsafe thin-wall conditions. Preserve meaningful optical/cutaway inspection.
5. **Shared interaction and persistence:** identical control semantics, coherent positioning across transformed/rotated models, undo/redo, profiles, save/reload, Library, multiple tabs, JSON backup/restore and correct active model/print job.
6. **Full manufacturing:** prepare up-to-date printable solids with ALL accepted pixels, tabs, holes and channels included, check geometry and export STL/3MF, separately downloadable Cura profile and production ZIP for the selected job and settings.

**The scope is the whole shared Crystal hardware toolset** (not just one pixel + two mounts). Codex must inventory the Crystal Cluster Build interface and its actual geometry/manufacturing features first, extract a **named shared capability contract**, and implement the applicable identical operation for each other family. Preserve richer Crystal-specific geometric/optical controls; don't delete, hide or water down Crystal's functionality to manufacture parity. Family-specific design controls stay individual, but all common hardware tools are consistently available and fully functional.

### Geometry restrictions are per individual MODEL/PLACEMENT, NOT per builder family

- For a particular **thin wall, hollow pod, fragile gear tooth, curved unsupported face, shaft, void, floating tab, insufficient wall/edge clearance, moving component, inaccessible cable or incompatible printer**: the tool must assess the selected parameters and location **before committing or exporting**, show an actionable inline/viewport explanation (e.g. *“Mounting tab cannot attach here: only 1.2 mm of supporting wall; requires 3 mm. Increase wall thickness, choose this stronger edge, or enable a separate backing plate.”*), highlight invalid region and **leave previously valid edits intact**.
- Offer safe recovery: move feature to thicker stock, increase thickness/size, choose another attachment edge, add a user-approved connected reinforcing boss/backing, or attach to a registered stationary mount component. No surprise material fill, no silently moved fitting to the opposite face and no false “ready to print” signal.
- **A family must never lose the Pixel, External Tabs, Mounting Holes or Print tools simply because its default shape is too thin.** Controls remain present and explain compatibility; at least one representative fixture in **every family** must actually accept EACH core feature and export it. Specific unsafe **placements** may legitimately be blocked after meaningful validation.
- “Not applicable”, a disabled button with no explanation, a placeholder shape, a source-only data entry, a mocked unit fixture or separate manually modelled tab unrelated to Build **does not count as parity**. If an adapter is missing, implement it.

### Equal release blockers: seven required full end-to-end acceptance fixtures

Each of the **seven families independently** needs at least one verified, complete product journey that includes: change the design; add manually selected P1 and another LED fitting with actual cutter; add **at least two real external positive tabs** or registered physical mount structures; add at least two real fixing holes (including through tabs where selected); edit/reposition all of them; show truthful serial wiring; save/reload/backup; prepare and inspect actual Manifold solid; download the matching STL, 3MF, standalone Cura profile and ZIP. Verify actual browser interactions, geometry and persisted source. **No single knob success, no single Crystal success, and no average score across families may substitute for 7/7.**

The rotary knob remains a **useful representative acceptance example only**; other family tests are **equally compulsory and equally important**. There must be a family-by-family matrix and recorded proof for all named tools. **Do not call WT-021 complete until every family passes the shared toolkit on an eligible model AND invalid thin/unsupported placements are correctly flagged.** Do not interpret this clarification as a request to build extra specialized knob tools instead of the common infrastructure.

## OWNER CLARIFICATION — VISIBLE NUMBER INPUTS AND PER-CONTROL RESET BUTTONS (P0 SHARED UI PARITY)

**Owner request (19 November 2026):** The user must be able to **type exact numbers into visible boxes beside sliders** and **reset individual sliders to sensible defaults with their own reset buttons**. This applies across **ALL SEVEN model builders**, and to applicable shared Design, Build, positioning, lighting, mounting, wiring, printer/quality and hardware controls. These are baseline usability features, not optional polish, and must not be restricted to Crystal Clusters or the knob example.

### A. Every slider gets an always-visible, linked numeric field

- In each slider row, show an accessible **editable numeric input** alongside the draggable slider, with consistent displayed units (mm, degrees, %, quantity, etc.), meaningful decimal precision and the *same minimum, maximum and step constraints*. Don't make the user click an output label to discover a hidden editor; an existing click-to-edit exact-value implementation may be reused but **the number box must be visible by default**.
- Dragging the slider updates the number immediately. Typing a number and pressing **Enter** or applying a valid change updates the slider, preview/real model and underlying source **exactly once**. Do not introduce duplicate event triggers, desynchronised displayed numbers, stutters or uncontrolled rebuilds.
- While typing, preserve intermediate values (e.g. a temporary '-' or decimal separator) without committing bad settings. **Escape** restores the last committed value. Invalid, NaN, blank, outside-range or incompatible values display a specific inline validation message and leave the previous accepted design intact. Support decimal precision where physically relevant rather than snapping everything to integers; whole-number controls still use integral values.
- Preserve correct **unit conversions** (existing Crystal scales/relative percentage mappings, nozzle size mm vs percentages, mm dimensions, angle fields), and existing valid project values. Avoid hidden rounding that changes geometry or Cura exports. Accessible label, focus/keyboard, selection/Tab and mobile number keyboard must work.

### B. Every adjustable slider gets its own clear Reset control

- Add a small visible and accessible **Reset** button (or an unmistakable reset icon with an accessible name/tooltip) **next to each slider / linked number box**. It resets **only that parameter**, **not the entire model, generator, tab, project or all controls**.
- Determine the reset target using the **authoritative parameter schema/default or selected starting-point/preset policy**. Show that target in the tooltip / accessible label (e.g. 'Reset Body thickness to 8 mm'). Make a consistent, documented rule: ordinarily reset to the last explicitly selected preset's value where that preset defines this setting, otherwise the family factory default; distinguish 'Reset to factory default' from 'Reset to current preset' if both are offered. Do not silently replace custom calibrated pixel-profile dimensions with factory defaults.
- Reset goes through the **same validated edit/commit pipeline** as dragging/typing, updates number and slider together, records **one undo step**, invalidates stale preview/print mesh and immediately updates dependent geometry. Respect linked/read-only model semantics and protect saved revisions. When already at its reset target, disable or de-emphasise reset while keeping it discoverable.
- Apply the same affordance to meaningful **non-slider numeric fields** (e.g. pixel/socket dimensions, bolt sizes, external tab dimensions, cable pitch, print quality and per-model transformations) wherever the user is adjusting a parameter with a defined default; don't add fake resets to computed read-only outputs.

### C. Architecture and end-to-end verification

- Build **one shared schema-driven numeric slider + number + reset component**, reused by the seven model family editors, with a compatible adapter for Crystal's existing sliders and physically meaningful precision/validation. Existing `exact-value-editors.js` click-to-edit and `data-model-param` rendering should be reviewed and adapted instead of layering duplicate editors that fight each other. No one-off knob, tile or Crystal-specific patch.
- Maintain consistent labels, units and layout at 390px mobile, desktop, light/dark theme and for keyboard-only users. Add help text for direct typing and reset behaviour, and update relevant tooltips, Change Log/What's New and user Help.
- Add real Playwright tests **on every family**: drag changes numeric field; type a non-default valid decimal and press Enter; assert actual model settings and geometry change; type invalid value and assert no corruption; reset just one parameter; undo/redo reset; save/reload and verify; change preset and verify correct reset target; switch models and check no cross-tab value leakage. Include Crystal percentage/scale conversion and any printer/quality sliders.
- **P0 parity gate:** every relevant slider in all seven builders exposes a visible editable number and individually functioning reset. No disabled/inert placeholder, decorative arrows, lost model-specific controls, or false 'tested' claims. Record exact-head evidence in the canonical parity matrix and Issue #79.

**This clarification is additive to WT-021**: finish the full shared hardware and manufacturing parity in the rest of this brief. Updating the prompt does not itself modify application code or change the already-running Codex session; Codex must explicitly read this updated revision before implementing it.

## OWNER CLARIFICATION — DRAGGABLE PIXELS, ONE MOUNTING EDITOR AND TRUE 3D RENDER (P0 REGRESSIONS)

**Owner-observed regression, 19 November 2026:** In the published Crystal Cluster Build interface, previously draggable pixel markers no longer drag reliably; a separately headed **“Editable edge tabs”** section is blank or contains no actionable controls; and coloured cable tracks/tab/pixel illustrations appear without a clear, consistent way to see the **actual manufactured 3D geometry**. The owner wants the **same complete, intuitive toolkit in every one of the seven family builders**, retaining Crystal's rich mounting profiles. **These are P0 software acceptance requirements under existing Issue #79, not optional UI changes, not a special knob example.** Screenshots and descriptions are user-observed symptoms; reproduce in browser and identify actual cause before asserting a fix.

### A. Restore genuine click-select → click-and-hold drag of pixels and mounting features

- Restore the owner's familiar two-step **first click selects an existing P1…Pn marker, second click-and-hold drags that same pixel directly around the 3D model**. A quick single click must not orbit the model or duplicate a pixel. The second hold-drag must be usable without an unexplained timeout or a Shift key. Also allow mouse, pen/touch where supported and keyboard/number input as alternatives; maintain Shift-drag where already offered, but **do not require it**.
- Preserve direct drag for **mounting holes and external T1…Tn tabs** with the same logic; do not lose draggable hardware while refactoring UI. Keep camera orbit/pan controls intact on empty scene/background, with correct pointer capture/release/cancel and drag threshold. A marker must remain selectable at its visible rendered coordinates, including overlay DOM marker buttons.
- Investigate actual regressions in `hardware-editor.js` (Crystal DOM marker drag, selected marker and pointer handlers) and `sensory-studio.js` (native `markerAt`, selection, `pixelGesture`, capture and `pointermove`). Review first-click selection versus second-click drag, 180 ms gesture rules, marker DOM rerender, model mode/focus/overlays, frozen `canDrag` state, click interception and camera orbit interactions.
- Live drag shows the correct Pn/Mn/Tn and a valid/invalid preview, applies movement **once** on pointer release via the canonical source/validator, recomputes real routing and distances, invalidates prepared mesh, saves/undoes correctly and rolls back entirely on blocked or cancelled moves. Preview and actual accepted cutter/socket position **must agree**.
- **P0 browser acceptance on ALL SEVEN:** place multiple fittings; click P2 to select; release; click-and-hold P2 then drag to a different valid physical spot; verify source coordinates, marker, actual cutter, route, undo/redo and save/reopen; attempt invalid location and prove rollback. Repeat with a mounting hole and tab. Include a **legacy Crystal** regression with the real DOM marker layer, and automated checks of orbit versus drag, double-click add versus click select, continuous placement and touch/keyboard alternatives. No screenshot-only or simulated source edit masquerading as drag.

### B. Make mounting ONE unified, populated, usable section — restore all established types

- There should be **one primary “Mounting & attachments” section in Build** for every model family, not multiple contradictory “Mounting holes” controls elsewhere plus a stranded “Editable edge tabs” heading. The existing Crystal mounting editor is the functional/design benchmark. The section must group clearly within it: **through/plain mounting holes**, **screw holes including counterbores and countersinks**, **threaded insert pilots/recesses**, **magnet pockets**, **positive external edge tabs/ears/flanges with their fixing holes**, and **registered plate/backing** where supported. Retain existing presets and appropriate diameter, depth, clearance, countersink, screw, magnet and tab controls. Keep hardware roles distinct: a tab adds actual material; a hole cuts real material; an insert pocket is not a screw-clearance hole.
- One clear **Add mounting feature** entry opens a type chooser, with automatic/manual placement choices, measured presets/custom dimensions, quantity/pairs and symmetry, graphical on-model selection, position/rotation, editable numbered M/T items and delete/duplicate. The same controls and terminology must appear for all seven, with model-specific safe adapters rather than hidden entire categories.
- The current `hardware-editor.js` `Editable edge tabs` heading is output when `s.mount==='Edge fixing tabs'` but its edit rows are generated only from `s.manualEdgeTabs||[]`; a default/automatic tab layout can therefore show **no rows, no Add button, and a blank-looking editor**. Fix that state honestly: show auto-generated tabs as selectable/editable records or an obvious **“Convert automatic tabs to editable”** action, plus **Add tab** with clear empty-state guidance. Never show a blank section. Placement should generate connected positive tab geometry and actual negative fixing openings where supported.
- Consolidate old Crystal **Mounting preset / Edge fixing tabs / manual mounting** controls and native `renderMountPalette` and model `Mounting holes` controls into ONE authoritative mounting data/UI contract; preserve legacy project values, conversions, tab positions and migration. Avoid double-creating mounts when opening an editor, and avoid leaving old conflicting controls connected to a different data store.
- **P0 acceptance:** From each of the seven families choose and edit a valid plain hole, recessed screw/countersink hole, magnet pocket/insert feature where structurally safe, and **two physically outward tabs with screw holes**. Test all operations in Build, real cut/union geometry, save/reopen, actual STL/3MF. Test a thin/void/intersecting case that displays exact reason and leaves accepted state intact. Verify the automatic-to-manual tab conversion and populated editable list in **Crystal**, including zero-tabs Add affordance, using real Playwright controls.

### C. “Render actual model” — inspect the manufactured object, not only illustrated guides

- Give the user a prominent, consistent **“Render actual model” / “Prepare & inspect real geometry”** action inside **Build** (plus equivalent entry in Print Centre) on **EVERY ONE of the seven families** and safe validated imports. Clarify terminology: **editable design preview** = illustrative meshes, pixel rings, route lines, tab guides; **manufactured mesh** = actual Boolean-unioned positive bodies with correctly subtracted bores, screw/magnet pockets and physically cut cable channels as they would be exported. A nice-looking preview image or drawn line is **not the manufactured mesh**.
- Reuse the real existing **Prepare print mesh → Show manufacturing mesh in 3D viewport** capability from the Crystal legacy editor where appropriate, but expose it clearly in the unified Studio and use the **SAME authoritative geometry, Manifold preparation and revision fingerprint** for the viewer, STL, 3MF, Cura/ZIP and physical validation. Don't invent a separate fake render/export model.
- After rendering, show the **actual mesh in the interactive 3D viewport** with orbit/zoom and top/bottom/side views, real holes/countersinks, attached positive tabs, actual wire grooves, material roles, optional cross-section/cutaway and an easy **“Back to editable preview”** action. Provide an optional **Guide overlay** for comparison, unmistakably labelled as non-physical. A toggle should let the owner compare illustrated vs actual mesh without exporting and visually confirm a channel/hole/tab exists.
- Make visible statuses unambiguous: **Preview only / Rendering… / Real mesh ready (revision N) / Stale after edit / Cannot manufacture (exact reason)**. On any setting, pixel or tab edit, invalidate older prepared result and prevent viewing/exporting it as current. Show a responsive progress/cancel UI, manage worker lifetime/memory and avoid UI freezes. Do not automatically perform an expensive global Boolean on every slider movement.
- **Routing/export validity:** If a physically required route fails (e.g. P1 IN/OUT no tangent access or P2→P3 exceeds 50 mm), **do not label the model printable or permit STL/3MF/production export with the invalid required feature**. Offer a clearly labelled diagnostic view of accepted solids + blocked route overlay where safe, and explain which positive/cut features are present versus still only planned. Users should be able to inspect the issue without accidentally treating an incomplete mesh as approved.
- **No phantom geometry:** when no tab/body has actually been generated, the true mesh must NOT show a decorative outward tab; when a wiring line has no valid cutter, the actual mesh must NOT pretend it has a channel. Conversely, when preparation succeeds, the rendered mesh must show the exact real tab/hole/groove feature at the correct transform, or reject with a specific error.
- **P0 seven-family tests:** With each builder create pixels + external tabs + holes + a viable route where supported, click **Render actual model**, orbit/cutaway, verify real positive/negative geometry has altered the actual prepared mesh (Manifold volume, bounds, connectedness, position and STL/3MF triangle comparisons), toggle back, modify a setting and prove render/export becomes stale, re-render, inspect and download. Add a blocked-routing fixture (including Crystal P1 IN/OUT and overlength), confirm no false-success ready badge, and check responsive cancel/retry in browser. Test real physical results not just presence of a “Render” button.

**Integration:** Existing WT-021 owner clarification that seven full family journeys are equally P0 remains authoritative; add these three missing workflows to the shared parity matrix. Existing #88 is focused on direct prepared-job STL and Cura downloads and should be reconciled against the Pages fix without becoming a broad untested rewrite. Implement the drag/mount/render fixes in a subsequent reviewable WT-021 draft PR or a coordinated proven integration branch, preserve the now-working published site, and leave all merges/deployment to the owner. Do not mark Issue #79 complete until the **actual public website** proves these interactions and the physically matching prepared outputs.

## OWNER CLARIFICATION — NO BROWSER FREEZES & FIND ANY TOOL (P0, 19 NOVEMBER 2026)

**Owner-reported additional failures:** “Try automatic routing” froze the browser when the Crystal wire layout was unsuitable, and the owner could not find the **downloadable pixel test-fit model** in the left column. The owner wants one final, reliable, searchable, fully functioning Studio with all Crystal hardware tools on **every one of the seven builders**. These two P0 requirements are release blockers under **existing Issue #79**, not new optional ideas.

### Routing must NEVER block the main thread

- **Every** automatic cable routing, auto-pixel placement, topology search, auto tab attachment, complex Boolean preview or other potentially expensive operation must run **off the UI thread** (appropriately cancellable worker, deterministic bounded/async solver). A single `requestAnimationFrame` followed by a long synchronous loop is **not** non-blocking.
- For “Try automatic routing” preserve exact current source settings, positions, actual IN/OUT port directions and accepted geometry. Show status/progress, allow **Cancel**, enforce a realistic deadline or search budget, safely terminate workers, and reject stale results when a model has changed or switched during calculation. Repeated clicks must not queue unlimited searches. On timeout or impossible geometry, show the precise limiting segment/port/obstruction and safe remedies while leaving the prior project **unchanged and editable**. Never pretend a wire route exists, silently lengthen physical cable, suppress an export blocker or leave a forever-spinning state.
- Include real browser stress fixtures for the owner's **four-pixel Crystal layout** with P1 IN and P4 OUT tangent failures and an overlength P2→P3 connection, plus difficult openwork Gear, Pod/Cap and a working simple route. **Test responsiveness DURING computation:** Home/Help/theme/camera still respond; cancelling returns promptly; route timeout/error does not mutate pixel P1…Pn. Undo/redo, reload and manufacturing acceptance remain consistent.
- A preliminary isolated async Crystal worker and regression are under [draft PR #91](https://github.com/connorturansky-svg/crystal-forge/pull/91), which also adds a left search. Codex should review/reuse and reconcile that work against the current main, **not rewrite the same files simultaneously**. The worker fixes the specific synchronous attempt but is not by itself evidence of complete seven-builder performance parity.

### Find controls and downloads from the LEFT panel

- The Design/Build column needs a persistent, visible **“Find tools & downloads”** search field, separate from the existing **right-hand “Search settings”**. It must work across **all seven families**, Design/Build/Print Centre and in responsive layouts, with clear actionable results **not merely a string filter** of controls already visible in the right inspector.
- Index the full shared Crystal toolkit and family-specific controls, including: “pixel test fit”, “calibration strip”, “coupon”, “gumdrop”, “LED profile”, “add pixel”, “wire route”, “automatic routing”, “mounting holes”, “screw holes”, “countersinks”, “magnet pockets”, “external tabs”, “render actual mesh”, “STL”, “3MF”, “Cura profile”, “production ZIP”, “Library” and “backup”. Include meaningful aliases/typos where practical.
- Clicking a result must **open the correct model stage, expand/focus/scroll the actual control, or explicitly perform the requested named download**. It must not silently click unrelated hidden controls, change the active model unexpectedly, or erase settings. Search should work with keyboard and touchscreen, support Escape/clear, show a friendly no-results state and preserve user context.
- The existing Crystal **Print → Generate stepped pixel + wire-relief fit coupon** and **Generate selected pixel-fit test strip (STL)** already produce real STL coupons. The new finder must make these immediately discoverable, and the native Build **Download pixel fit test** must be reachable for the selected/next pixel profile. Users should not have to memorise where the old buttons are.
- Add Playwright checks that search for “pixel test fit”, “magnet”, “Cura”, “render”, and “routing”, navigate to real live controls and verify a downloaded coupon is non-empty, print geometry comes from the selected profile and buttons remain functional. Test all seven families and both active/empty model states; ensure no extra duplicate UI or an empty “Editable edge tabs” result.

### Release coordination

- Last owner-merged release: PR #88 on `main` **`30d8cf34db6ca8d93dfc323aa06ab27b9d05061d`** adds standalone STL and job-specific Cura downloads. Existing Pages fix #89 must remain intact.
- The separate [draft #91](https://github.com/connorturansky-svg/crystal-forge/pull/91) implements a scoped Crystal routing worker and initial left tool finder, rebased against #88 in a merge commit. **Do not treat #91 as the final WT-021 release; prove its current exact-head CI before any owner merge.** The obsolete #90 startup draft must not overwrite #89's working Pages vendor packaging.
- Codex should carry forward verified #91 results if appropriate and complete all remaining WT-021 P0/P1, especially seven-builder pixel drag, unified mounting holes/screw/magnet/external tab UI, actual rendered printable mesh, numeric slider fields and reset, physically correct face-aligned fittings, Library and Print end-to-end evidence. Preserve seven equal family gates and keep physical validation #10 separate. Leave all owner merges/deployment untouched.

## OWNER CLARIFICATION — RESTORE FULL-SIZE 1:1 PIXEL BODY TEST MODELS (P0 FEATURE REGRESSION)

**Owner observation (19 November 2026):** "I can see the pixel fit tool, but what happened to the full size pixel test tool, which actually builds the domed shape of the gumdrop based on the profile I made?" The **full-size POSITIVE LED body replica** and the **NEGATIVE socket-fit calibration coupon** are DIFFERENT deliverables. **Both must exist, work, and be easy to find in every applicable Design/Build/Print workflow, independently of which of the seven model families is active.** Do not claim the calibration strip reproduces the actual LED body.

### Two separately named physical test tools

1. **"Download 1:1 pixel replica (STL/3MF)"**: a standalone **POSITIVE 3D model of ONE complete LED package**, generated from the user's measured/saved profile. For a gumdrop, this must include its genuinely curved/domed tip, straight body, shoulder/collar/flange and the two opposite wire-entry/exit relief shapes; not an empty hole, a rectangular coupon, a marker, a 2D diagram or an abstract cylinder.
2. **"Download pixel/socket fit coupon (STL/3MF)"**: the existing **NEGATIVE** five-size / stepped / wire-relief socket test that helps select an actual printable hole clearance and flange seating. Preserve the existing coupon controls and printed fit measurement workflow exactly; don't replace or mislabel them.

Both actions must be clearly exposed inside **Create/edit pixel profile**, next to or below the A–G dimensions, as well as the common **Build → Pixel fittings** panel and global **Print Centre**. The left **Find tools & downloads** search should return distinct results for `full-size pixel`, `1:1 gumdrop`, `pixel replica`, `dummy LED`, `3D pixel` versus `fit coupon`, `socket calibration`, `test strip`, `bore size`. The user should be able to download the replica directly using the saved currently selected profile or the currently edited A–G values (clearly label saved vs unsaved), with no need to add a crystal or print an entire model first.

### Exact measured shape: authoritative A–G mapping

The existing `pixel-profile-diagram.js`, `pixel-profiles.js` and `index.html` define these 1:1 dimensions in **millimetres**:

- **A = outside body diameter** (the cylindrical housing excluding its wider flange)
- **B = total LED body length including E**, measured flange-underside to highest cap tip — **NEVER add E to B a second time**
- **C = outside flange/collar diameter**, kept at the original profile's measurement (do not apply the socket clearance)
- **D = flange/collar thickness/height at wire end**
- **E = curved upper dome height**, a real smooth cap with measured rise, smoothly joining the cylindrical body and reaching total B
- **F = width of EACH of the two opposing wire-bundle outlet recesses**
- **G = depth of those two wire-bundle outlet recesses** (at 180° to one another, without inventing unmeasured wire lengths)

Support the existing **gumdrop, bullet and seed** kinds with appropriately different truthful external caps/bodies and any physically supported shoulder/flange. Reuse the same saved/custom profiles and correct dimensions used by the fitting planner; **do not change the user's existing saved profile or silently add the printer's bore fit tolerance to the positive body.** Treat physical shape dimension (A) separately from nominal printable socket diameter (A + mathrm{clearance}). The dummy is only a **physical dimensional mock-up**, not a functioning electronic LED, cable strain certification or optical proof.

### Genuine geometry and export, not a drawing

- Construct real **watertight, Manifold-valid positive volume** (printable single solid where possible), with smoothly curved cap and actual symmetric F/G underside wire recesses. Check that the cap/flange/reliefs intersect and form an intended printable shape, not floating parts or nonmanifold slivers.
- Show an interactive **3D replica preview** linked to the A–G editor, with orbit, rotate, numeric dimensions, section/cutaway/edge inspection and an explicit **Render actual pixel model** action if the preview is illustrative. Reuse shared manufacturing rendering instead of an unrelated fake mesh.
- Provide separate one-click **STL** and **3MF** downloads with an informative stable filename such as `pixel-replica-<profile>-1to1.stl`. Both must represent exactly the same Z-up millimetre physical model and honour the current profile revision, without a printer clearance offset or accidental arbitrary scale.
- Reuse safe printing controls (UM3 Extended / UM2+, material, nozzle, quality as applicable), and include the replica as an independently selectable printable job in Print Centre if the user wants to prepare a production ZIP. Do not send a full Crystal Cluster or socket coupon when "pixel replica" is requested.
- Maintain source persistence in existing JSON/Library/backup and across switching between seven builder tabs; custom profiles should remain identifiable. Do not create a new parallel or disconnected store for replica dimensions.

### Mandatory browser and manufacturing evidence

1. For a **custom saved gumdrop A–G profile**, modify A, B, C, D, E, F and G; visually inspect the 3D dummy; download STL and 3MF. Parse both and assert actual width, **full B total height**, flange C/D, curved cap E and two opposite relieved openings F/G, within explicit mesh tolerances. Assert physically positive volume rather than a negative-hole calibration bar.
2. Switch to a **different saved custom profile**, and then a default seed/bullet; prove output changes correspondingly without profile leakage or hidden B+E height error. Never mutate measured dimensions when downloading.
3. Test default gumdrop, minimum feasible nominal size, zero flange/zero wire relief where valid, excessive F/G that must be rejected with a useful reason, and unsupported/degenerate cap heights without freezing the UI.
4. Switch across **ALL seven model families** and verify the same two correctly named tools appear and download the same profile-matched 1:1 dummy/fit coupon, without exporting the family geometry by mistake. Reload and restore the saved profile; verify the same exact replica dimensions and source version.
5. Compare **actual Manifold prepared mesh, STL and 3MF** geometries and their dimensions, orientation, component count and verified validity; test file downloads with actual Playwright events. No mock STL, no source-string-only acceptance.

**GitHub state:** The currently inspected `main` at `30d8cf34db6ca8d93dfc323aa06ab27b9d05061d` has `renderPixelProfileDiagram` as an **annotated 2D SVG**, and `makePixelSeatCoupon`, `makeSteppedPixelCoupon`, `makeCalibrationStrip` as **negative-hole test plates**; the current `pixelFitCoupon` adapter exports a clearance strip rather than a fully modelled pixel replica. The user's recollection of an earlier full-size generator should be treated as a requirement to restore, **not proof that the current implementation already satisfies it**.

Implement and test this as part of the existing **WT-021 true seven-builder parity milestone in Issue #79**. This is **additive**, not a replacement for external mounting, exact-value Reset, pixel dragging, safe routing, seven-family prints or the original physical test coupons. Coordinate with #91's left search rather than creating duplicate search components; preserve #89 and merged #88. Owner controls all merges/deployments, physical proof remains #10.

## 0. Exact user intent: this is a WORKING APP, not a partial UI

The owner expects to open **ANY of the seven model families**, use the **full shared hardware toolset established by Crystal Clusters**, add/edit pixels, real external mounting tabs AND independent mounting holes, and make a genuinely printable STL/3MF with a downloadable Cura profile. A rotary knob with a pixel and two tabs is **only one illustrative example**; it is not the centre of scope, nor does it count as parity if the other six families are incomplete.

**All seven** complete comparable end-to-end scenarios are mandatory. The knob example alone is insufficient. **An internal through-hole in the existing model is NOT an external mounting tab.** Do not close the task by demonstrating only M1 holes, a visual tab marker, auto-place on the underside instead of the selected face, a bare STL without the mount, or a link to a Cura profile that cannot be generated.

**Deliver user-facing working code** with real Three.js interactions, real Manifold geometry, genuine saved project data, actual exports, and tests. **Do not stop at a plan, audit, checklist, documentation change, proof-of-concept or test-only PR.** Do not downgrade this requirement to “physically blocked” simply because the adapter cannot do it today: build the missing positive-geometry backing, mounting-interface or attachment system first where safe.

Full parity means **equal shared tool availability and behaviour for every applicable model family**, not identical family-specific shapes. Where a *specific physical shape* truly cannot take a feature, users must see a useful constraint and selectable safe alternative; another solid variant in the same family must pass the feature's real end-to-end acceptance tests.

## 1. Reconcile latest GitHub before coding; do not reimplement past stacks

At briefing audit on **19 November 2026**:
- Verified latest `main`: `8f5b0a6f2d7e395c38d5afd85359117745fedee3` (owner-merged #86, native 2–8 mm **through-holes**). #84 merged to main; #85 was merged to an intermediate feature branch; its tested functionality is contained in later descendants. Do not confuse “PR merged” with “commits included on main” or re-cherry-pick older #82/#83/#85.
- [PR #87](https://github.com/connorturansky-svg/crystal-forge/pull/87) is a **still-unmerged draft to main** on `wt020/native-camera-framing`, head `c703dbb1a9c6316af855547e931fb4da96762466` at audit. A static release-metadata mismatch was corrected on this head and the static check then passed; browser/fabrication exact-head checks were still pending. Recheck status and do not overwrite that branch.
- Existing native mounting code `studio-mount-builder.js` + `studio-catalogue.js` + `sensory-studio.js` makes **negative vertical through-bores**; the owner is explicitly asking for **positive outward tabs/ears with fixing holes**. They are different manufacturing operations.
- Current `docs/MODEL_BUILDER_PARITY.md` marks most capabilities **L (limited)**; no seven-family production and Studio evidence is complete. A code path existing is not a proved capability.
- Pixel/route/face behaviour is still geometry-dependent. The user's prior **openwork Gear P1–P4** reproduction and its truthful impossible-route state remain mandatory regressions.

**Before touching code:** fetch current `main`, all active PRs/diffs/checks, Issue #79, `AGENTS.md`, `docs/AI_HANDOVER.md`, `docs/ROADMAP.md`, `docs/MODEL_BUILDER_PARITY.md`, `docs/FEATURE_SPECIFICATIONS.md`, `docs/DESIGN_DECISIONS.md`, `docs/TESTING.md`, `docs/ARCHITECTURE.md`, complete WT-019/020 briefs and relevant source. Identify main-reachable code, verified PR ancestry, exact-head CI and active collaborator work.

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

### 3.2 The KNOB is one representative fixture among SEVEN equally mandatory fixtures

Create a **Rotary knob** in Buttons & Control Caps (use a realistic solid/backed knob variant or a correctly separated enclosure if the selected moving dial cannot carry fixed tabs).

1. Adjust its width/profile/height/grip and any shaft bore.
2. Pick an LED profile (e.g. 5 mm seed); select a visible supported physical face and place **P1** there with genuine preview/port/cutter agreement; move/edit it.
3. Add **two external mounting ears/tabs**, independently selectable **T1/T2** (or clearly separate names from hole-only M1), positioned at chosen sides or on an optional fixed flange, with **actual M3-sized through holes**. Their outer edges must **extend beyond the original knob/enclosure boundary**; demonstrate that geometry explicitly.
4. Move/rotate/resize the ears, adjust their screw clearance, and inspect positive union into supporting material and negative hole subtractions. Verify no collision with LED, shaft/socket, cable channels or each other.
5. Where a rotary knob is a **moving part**, don't misleadingly fuse stationary external fixing ears to the rotating actuator. Offer a **fixed backing/enclosure/flange as a separate printable component** (or a clearly designated stationary cap variant) with measured motion/shaft clearances and explicitly registered assembly relative to the moving knob. If the user expressly chooses integrated tabs for a nonrotating decorative knob, a connected single-body option may be valid. Build the necessary fixed component, don't silently deem this whole family “not supported”.
6. Save/reload source, view top/bottom/front, inspect a transparent cutaway, prepare print, then **download the STL(s), a valid 3MF, Cura .curaprofile / documented fallback and full ZIP**. Test actual archive contents and **measure geometry**: tab material, hole diameters, original vs extended bounds, cutter volume, connected component count or assembly roles and their relative transforms.

**Every family** end-to-end test is **P0 release-blocking**, including but not limited to this knob example. Add a real browser journey with clicks and downloads and a real Manifold/fabrication fixture; no mocked cutters, screenshots-only or source-string assertions.

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

Do not mark any family `P` without an evidence-linked **real browser and manufacturing** test. Keep the canonical matrix in `docs/MODEL_BUILDER_PARITY.md`, with **one row per family** and columns:

`Design/create/edit | Pixel manual + auto / correct face | External tabs (positive geometry) | Mount holes | Wiring guides/cuts | 3D camera/selection | Library/reload/backup | Print STL+3MF+Cura | Release SHA/evidence`.

Statuses: `P` tested/proved; `L` limited; `M` missing; `B` truly physically blocked *for a specific incompatible design*, with a tested functional variant in same family; `N/A` inherently irrelevant, justified. **No blanket P via a text assertion, marker visibility or one Tile test.**

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
- **Control Caps rotary knob** with integrated or fixed stationary mounting assembly and two external M3 tabs, P1 and complete export: **one equally important fixture among seven**.
- **Owner's openwork Gear** with four P markers, blocked routing explained, honest exported bore-only shape; separate **solid Gear** actual routed example.
- **Crystal** complete regression including optical/base/vault/root, richest editing, physical pixel seats/mount and dual-exports.
- **Imported SVG and valid/invalid STL/OBJ**, true geometry/preview-only and round-trip.

Run `npm run test:static`, `npm test`, `npm run test:browser`, `npm run test:benchmark`, release metadata verification and any current source-specific tests. Use Playwright pointer/dblclick and file-download assertions; Manifold volume/connectedness/cutter tests; STL/3MF parsers and generated .curaprofile content checks. Capture screenshots, artifact samples and **exact GitHub Actions run links for latest head**. Fix failures rather than removing checks or labelling all blocked.

No browser test mocking `window.__sensoryStudio` counts as a real click path when a user-facing action exists. Avoid tests only on generators' `recipe()` without executing exported product pipeline.

## 8. Integration, review, published-site gate

- **Recheck #87's actual state on arrival.** If open, preserve its camera and openwork Gear fixes, latest tested HEAD and owner merge choice; coordinate this work without editing #87 directly. If already merged, use new main. `main` must ultimately contain the approved software changes, not just feature-branch merges.
- Implement in **one or a small number of substantial reviewable draft PRs**. Prefer a shared attachment/geometry foundation PR and a final full parity + exports integration PR if necessary, **not** dozens of tiny drafts. Link all PRs to **existing Issue #79** and pinned scope.
- Version, CHANGELOG, in-app What’s New, README, Help, architecture/test docs, roadmap, handover and real parity matrix must correspond to actual code. Distinguish current from historical milestones.
- The owner keeps approval over **all merges and deploys**; do not merge, publish or bypass required checks automatically. Provide exact safe merge order and any needed retarget/rebase after an approved merge.
- **After owner approves/merges**, verify the actual `main` commit includes all features and a GitHub Pages deploy for that exact SHA succeeded, then run clean-browser end-to-end at `https://connorturansky-svg.github.io/crystal-forge/` against the published site, including knob→pixel→external tabs→STL+Cura and a separate Gear and Crystal check. Avoid deleting the user's local saved data. A green CI workflow on a draft is **not proof that the website is published or that the owner's hardware works**.
- No new software issues. Update #79 checklists/comments with evidence and close #79 only if every accepted P0/P1 software capability is verified **on the released site**, or the owner explicitly approves precise documented exceptions. Physical tests #10 remain open; modular assembly #51 stays on hold; Jordan #36/#37 and the Copilot pilot #33/#42 remain independently owned.

## 9. End condition and Codex handover

**You must DO the work and TEST it, not just draft a plan.** The release candidate must support this exact owner walk-through:

**For each of the SEVEN builders independently:** Open app → create that model family → edit its unique design parameters → Build → choose a pixel profile → add and edit multiple physical pixels on valid chosen model surfaces → add, place and edit real connected external tabs/ears or separate registered backing → add/edit independent holes and fixing holes in tabs → inspect physical routing/cutaway → save/reopen → Print Centre → prepare real model → download STL, 3MF, Cura profile and production ZIP → inspect actual geometry in those files.

The knob happens to be one of the seven example models, **not the defining goal or sole gold-standard**. Test and demonstrate this workflow with all seven. Unsupported individual geometry must have an actual workable in-family alternative. Maintain equal shared controls and preserve family-specific tools.

**Final report must include:** latest `main` SHA; all draft PR URLs/heads, exact tested CI, 7×feature acceptance matrix and artifacts, detailed knob fixture and real manufactured dimensions, openwork Gear evidence, standalone Cura output verification, print/export downloads, post-merge Pages SHA if approved, known physical/functional restrictions and explicit owner merge order.

**Never call this “fully functional”, “parity complete”, “production ready” or “published” based on controls, draft PRs or partial tests.** If something remains broken, fix it in the milestone or state precisely what remains and why. Preserve the owner's ability to choose when to merge.

### Codex short instruction (implementation, not an audit)

**Implement WT-021 as the missing final parity contract on top of the current tested main/WT-020 stack.** Complete shared 3D hardware placement, genuine external tabs/ears/flanges and mounting bores, truthful wiring, Design/Library/Print, real STL/3MF + standalone Cura exports across **all seven families**, with **each of the SEVEN builders separately demonstrating multiple pixel fittings + real external tabs + independent mounting holes + downloadable STL/3MF/Cura** as equal mandatory end-to-end tests (the knob is just one illustrative fixture). Fix every P0/P1 defect, run exact-head browser and manufacturing acceptance, produce merge-ready draft PRs, leave owner merges/deployment untouched, and verify the live Pages site after owner-approved integration. Keep everything under #79 and preserve #10/#51 and contributor-owned work. Do not stop at planning.
