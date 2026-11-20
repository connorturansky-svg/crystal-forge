# WT-021 — Durable Codex run / recovery log

> **Purpose:** Append-only operational checkpoints for uninterrupted overnight sessions and quota-safe restart. The [completion register](WT021_COMPLETION_REGISTER.md) is authoritative for requirement status; this log is chronological evidence, **not** a claim of completion. Follow the [overnight runbook](../prompts/active/WT021_OVERNIGHT_RUNBOOK.md).

## Initial handover checkpoint — 20 November 2026

- **Repository / PR:** `connorturansky-svg/crystal-forge`, existing draft [#102](https://github.com/connorturansky-svg/crystal-forge/pull/102); branch `wt021/integrated-release`.
- **Last checked repository head at runbook creation:** `38b58e5001023f89689c8dc810aa3fedb8bd5071`. Re-check the actual branch tip whenever resuming; this is historical, not a permanent pointer.
- **Checks on that head:** static, Chromium and real Manifold fabrication all reported **success** when checked before authoring this runbook; note that a new runbook commit will have its **own exact-head checks**.
- **Original owner-approved contract:** `prompts/021-complete-seven-builder-manufacturing-parity.md`. **Execution instructions:** `prompts/active/WT021_EXECUTION.md`, `prompts/active/WT021_OVERNIGHT_RUNBOOK.md`.
- **Current acceptance:** 23 rows PARTIAL. Crystal, Gear and Tile have targeted positive/negative fitting-preview evidence, not all seven full end-to-end journeys. All software parity belongs to #79; real Cura/physical validation to #10.
- **Known highest-priority remaining work:** full stock/routed-cut/adjacent-fittings collision in FIT-02; positive+cutter validation in Wave/Cap/Character/Pod; arbitrary-face drag and saved-state rejection; physical side/curved IN→all pixels→OUT channels; independent seven-family acceptance.
- **GitHub approval configuration checked on 20 November 2026:** active ruleset `Protect main — reviewed releases` only targets the default branch; required approving reviews = **0**, required code-owner reviews = **false**; `wt021/integrated-release` reports `protected: false`; PR #102 has no requested/submitted reviews; the optional contributor-contract job is skipped for its current title. **PR owner review is not a reason to pause implementation.** Final merge/deploy still requires the owner's explicit decision. Codex must verify its own push credentials independently.
- **Access/approval prerequisites:** Codex has **not yet checked** its own overnight environment for GitHub push, CI, Node, Manifold, Chromium or credentials. Perform Stage 0 of the runbook at session start. User has not approved merge/deploy/new PR.
- **Exact next step for Codex:** Confirm branch tip and CI, inspect `docs/WT021_COMPLETION_REGISTER.md`, then extend the FIT-02 collision tester to include already-routed cuts and neighbouring socket negatives, create failing Manifold and Chromium fixtures, and implement the production collision check. If CI is red first, diagnose/fix that before new work.
- **Changes pushed in this checkpoint:** documentation organisation and prompt archiving were committed in PR #102. Do not infer any subsequent Codex implementation from this note.

## Additional owner instructions — 20 November 2026 (planning, not implementation)

- Owner added **UX-01 P1**: implement an illustrated, categorised, searchable, accessible, click-through Features & What's New page inside the existing web-app popup. 23 original requirements remain; new UX-01 is **MISSING**, 24 tracked items total. Full original physical parity specification is unchanged.
- **CHANGELOG.md** must receive a concise *Unreleased* user-facing entry after each independently tested feature, in the same coherent commit as implementation/test evidence. Sync What's New and app version history through UX-01; never present draft PR changes as deployed.
- Maintain the concise owner report at `docs/WT021_OVERNIGHT_SUMMARY.md` **during milestones** and before quota cutoff, with exact SHA, evidence, remaining work and next action. A PR #102 comment and Codex chat recap are requested at normal end; this run log remains the detailed technical history.

## Checkpoint template — append for every coherent work increment

### YYYY-MM-DD HH:MM (local/UTC) — [WT-021 row and precise outcome]

- **Branch / latest pushed head:** `...`; **previous last-green SHA:** `...`
- **Changed files / actual behaviour:** ...
- **Commands and tests run:** ...; **exact-head workflows / URLs:** ...
- **Objective measurement and acceptance:** ... (STL/3MF/mm, Chromium action, invalid case)
- **Register rows updated:** ... (PARTIAL / VERIFIED with reason)
- **Unresolved failures / blockers:** ... (minimal reproduction and logs)
- **Git status / push status:** ... (clean or name of uncommitted files)
- **Next exact task, file and command:** ...
- **Can the next session resume without owner input?** yes/no; if no, state required permission precisely.

**Do not overwrite prior checkpoint history.** Append a new entry and keep the most recent actionable one at the bottom.

### 2026-11-20 - FIT-02 native fabrication diagnostics

- Base: 1518a289f421ee5635c749d4fbb8b46f3c222187 on draft #102.
- Native preview and preparation share insertion opening, stock and adjacent-cut checks. Preview reports measured wire cut overlap separately.
- The Gear/Tile test injects physical wire and mounting cuts; both preview warning and manufacturing rejection are exercised for the mounting conflict.
- FIT-02 remains PARTIAL. Next action is the invalid-pose Chromium case and actual routed wall verification in NOW.

- First checkpoint e6dc8a8d1ea61aee9b037a6c7e57d87342ac9d8a failed the exact-head release-metadata gate because a draft note was inside the release entry. Moved the note to a labelled unreleased paragraph and verified node tests/release-metadata.mjs against main. Local Chromium also caught the missing readout text; wired the measured overlap and warnings into the DOM and started the browser retry.

### 2026-11-20 - native preview matrix and rejection persistence

- Static GitHub checks passed on 16d53df02659e96dc017af513b34df3c0f544498. All five browser scripts in the local suite passed when run in two batches after the readout fix.
- Additional local Chromium run proved overlapping Gear-top placement is refused and the saved original pose survives reload. Catalogue Manifold suite passed with compact backed-underside fixtures for Wave, Cap, Character and Beacon Pod, checking actual cutter/envelope equivalence and nearby cut rejection.
- These are selected fixture results. The seven full journeys, routed stock checks and UX-01 remain open. Resume at WT021_NOW.md.

### 2026-11-20 - native backing thickness and export parity

- Previous pushed checkpoint d097fad24e68da884a90bad339ff4a165f711373. Released version is unchanged; the unreleased changelog and in-app draft note were updated.
- Added native Build numeric fitting backing thickness (3–10 mm) with reset to 4 mm. Existing shaped fittings and enabled routes trigger off-thread preparation validation before committing a backing edit.
- Unified Chromium passed with an out-of-range edit, a reset, reload persistence and independent 8 mm Z measurements outside the Tile footprint in both downloaded STL and 3MF. Release metadata passed.
- Next work remains routed roof-stock validation outside intended wire junctions and rejected drag state preservation. PAR-01 and DIM-05 remain PARTIAL.

### 2026-11-20 - native route roof integrity

- Base e9c1ea481d7c75bbe990700f63ed1342f76a4ab0. Manifold intersects the real cutter roof guard with model stock, excluding material beyond its intended exterior boundary and the actual cuts at connected pixel ports. It rejects missing roof stock and other cut interference.
- The catalogue Manifold suite passed with new false-stock and roof-cut fixtures. Existing flat, vaulted, curved and pinned native routes remain covered. This does not certify route side walls or off-underside routing.
- Focused real Chromium Gear test passed: two accepted top fittings, then hold-and-drag one onto the other, reload, and compare both stored poses and normals. Full Chromium regression started.

- Independent native route export evidence: tests/studio-catalogue.test.mjs decoded binary STL and indexed 3MF separately, probing five cross sections including both edges. Both files had 3.2 mm usable width, expected lowered vault section at a 0.2 mm lateral offset, open cable direction through both exterior faces and material beside the openings. Test suite passed; no whole-family gate promoted.

- Added the pinned curved witness in both formats. Surface-normal ray sections between the socket junction and exterior edge preserved 3.2 mm clearance within 0.06 mm and more than 6 mm roof stock in every sampled section. Browser regression including rejected Gear drag passed. Minimum side stock and independent curved radius remain open.

### 2026-11-20 - native route side-wall stock

- Base `960f9c90e4bbe486929aca11ec7ef825aa72bb10`; all three required GitHub workflows passed at that base.
- Production Manifold checks a 0.55 mm side envelope against real stock and neighbouring cuts. A side-cut regression failed before the implementation. The catalogue suite then passed with that case, thin actual stock, and independently decoded STL/3MF straight and curved side-wall probes. FIT-02 and FIT-03 remain PARTIAL.
- Next: create a physically cut planar top fixture in tests/studio-catalogue.test.mjs and measure the route and outlets in both exports.

### 2026-11-20 - flat top serial routes

- Base `efe7b9a291b922700db5e887c172b4c77a332fd6`. Shaped coplanar top seats on eligible solid decorative Gears now have a checked physical upward-opening channel. The route follows the installed fitting rotation and protects the channel floor and side stock.
- Added a failing top route fixture, then passed the catalogue Manifold suite with a solid Gear and a rectangular STL/3MF witness measuring width, depth, side stock and both open ends. Tilted/mixed faces and top vaulting are rejected. FIT-03 remains PARTIAL. Chromium local server was unreachable; exact-head Actions will cover the existing browser suite.
- Next extend tests/unified-studio-browser.test.mjs with the Gear top route, saved state and actual downloads.

### 2026-11-20 - Gear top Chromium and side markers

- Base `439fc789bd8a5c903c89271caf464795248fe50c`. The unified Chromium suite passed with Gear top placement, rejected drag rollback, physical routing after reload and real STL/3MF downloads. An isolated server port resolved the local test connection failure.
- Added a failing side marker fixture, then fixed the marker position and normal to match the production seat. Catalogue Manifold/export regression passed. FIT-01/FIT-03 remain PARTIAL. Next add an accepted side placement and same-face drag using real viewport input.

### 2026-11-20 - square Tile front-wall routes and browser drag

- Base `2c68782d187be2725d38488b6fd09707d0129696`. An initially failing front-route fixture now passes on the actual square Tile mesh. Guides and cutters share front-face coordinates. Manifold rejects inadequate surrounding stock and an adjacent side-wall cut.
- Independently measured exported channel: 3.2 mm usable width, 1.8 mm depth and open passage through both apertures in STL and 3MF. Focused Chromium passed real side placement, held drag, reload, routing, preparation and downloads. FIT-01/FIT-03 remain PARTIAL.
- Next place a short fitting on a genuinely curved Wave face and measure the accepted seat in both formats.

### 2026-11-20 - gentle parallel Wave routes

- Base `c6655a30e33d9a2707e368ce38e32ba14e9f7e36`. Added a failing curved Wave route case, then a groove swept along the same sampled Wave mesh used for manufacturing. Real Manifold tests reject an unsupported convex seat, route wall interference and vaulting on the upward-facing groove.
- Both formats independently prove a 9 mm long, 5.3 mm sized tilted seat and continuous 3.2 × 1.8 mm surface-following wiring across the Wave. Focused Chromium passed real curved placement, rotation, routing, preparation and downloads. FIT-01/FIT-03 remain PARTIAL.
- Next combine validated manual mounts with routed placement, covering real conflicts and state rollback.

### 2026-11-20 - manual mounts with native routes

- Base `766daed9c1c2c3ddd07d90545d964ff2ee951eed`. The initially rejected separated through-hole now routes, prepares and exports alongside serial grooves. Both parsed formats measure 3.4 mm through and 8.7 mm material web.
- Focused Chromium passed safe Gear mounting and refused an edit into the path before changing the saved revision. DIM-05 and PAR-01 remain PARTIAL. Next finish Gear calibration/inspection and independent browser-download measurements.

### 2026-11-20 - independent Gear acceptance journey

- Base `6030de31553a49b289514212297f667df32b7e6f`. A failing real-Manifold routed Gear with backing and two tabs now passes. Upper-route eligibility, perimeter and stock remain tied to the original face.
- Focused Chromium passed all recorded Gear actions and independent STL/3MF measurements. Both tab fixing bores and manual mount bores pass through; calibrated bore measures 12.5 mm and cable width 3.2 mm. STL and Cura standalone outputs match the production ZIP. E2E-G exact-head CI is pending.
- Next preserve eligible Tile front routing with backing and exercise the same full browser/export gate on the Tile.

### 2026-11-20 - independent Tile acceptance journey

- Base `0b57821548d17823fccb3e869019faa376198a26`. Restored front routing with external-tab backing and verified an unsafe backing edit is refused. Both real Manifold and focused Chromium passed.
- Both parsed app downloads retained the 5.5 mm calibrated seat, 3.2 mm routed width, two manual through-holes and two 4 mm external tabs with through-holes. Standalone STL/Cura bytes match the ZIP. E2E-T exact-head checks remain pending.
- Next complete the gentle Wave journey with curved drag, mounting, calibration and matched downloads.

### 2026-11-20 - independent Wave acceptance journey

- Base `eb58e32dd235706e6318e55595e4977a96b6900f`. Focused Chromium passed the gentle Wave width edit, two distinct socket normals, accepted drag, rejected convex seat and the complete routing/mounting/calibration/Library/Print sequence. Independent actual STL/3MF measured the 5.4 mm seat, 3.2 mm route, four open holes and 4 mm external tab thickness. E2E-W exact-head checks pending.
- Next exercise Character and solid Pod backed layouts with a compact A–G profile.

### 2026-11-20 - backed Character, Pod and rotary Cap journeys

- Base `c2cf3d0fe39c495edc287611c16f742b1cac85db` passed static 44661415796, Chromium 44661415832 and fabrication 44661415876. E2E-G/T/W verified at that SHA.
- Added the explicit Stationary display mode for rotary Caps. Initial manufacturing fixture proved that moving controls accepted fixed ears. The updated Manifold fixture refuses that state and accepts the stationary variant.
- Focused and full unified Chromium passed Character, solid Pod and stationary rotary Cap through the actual workflow with mounted routed sockets. Both decoded formats measured 5.45 mm bore, 3.2 mm wire channel, four through-holes and 10 mm tabs. Exact-head checks for these three are pending.

### 2026-11-20 - Crystal journey and UX-01

- Added explicit manual Crystal through-holes alongside external tabs. Unit regression verifies existing saved mounts do not activate implicitly. The full Crystal Chromium fixture passes a real held drag, routing, two tabs and two mounts, calibration and rollback, reload, preparation/cutaway and four downloads. Independently decoded STL/3MF measure 5.4 mm bore, 3.2 mm track, four open holes and 5 mm tab stock.
- Reused the Help dialog for Features. The local Chromium feature script verifies filters, seven picker destinations, real workspace navigation, accessible keyboard focus, no model edits, compact layout and both themes. Generated history and displayed version match CHANGELOG.md.
- Next DIM-03/CAL-01 with successive independently measured physical profile cuts.

### 2026-11-20 - retention and independent calibration

- Exact-head static, Chromium and Manifold passed at `8083c547b76b5b1df4b547ffccc3ceb6b5765439`.
- Export probes distinguish bore clearance, retention and wire width in four physical variants. Previously a requested lip could be omitted silently on a short body. Build now validates the production cut before saving.
- Next CAL-02 linked/copy export evidence.

### 2026-11-20 - linked and local calibration exports

- Compared downloaded STL and 3MF before and after a library edit. The following fitting changed from 4.85 to 5.10 mm and invalidated its previous preparation. The local fit stayed 4.85 mm. CAL-02 remains partial across projects and Crystal.
- Next measure bend radius and centreline length independently.

### 2026-11-20 - native bend constraints and export probes

- Added the 1–60 mm bend control and used the setting for internal links and pinned tails. A 60 mm constraint fails the test fixture with tight pinned bends. STL and 3MF radius and sampled span-length probes passed. DIM-04 and FIT-03 remain partial.

### 2026-11-20 - route continuity at apertures and junctions

- The paired STL/3MF fixture checks a 71.786 mm routed span from aperture to aperture through both bores. Six rays per segment cover a 2.9 mm corridor at two depths. Opposite wall rays independently measure the two 3.2 mm exterior openings. The flanged shaped-socket fixture also passes corridor checks through both junctions.
- DIM-05: both formats measured the parallel recess and tapered countersink, and verified 8.6 mm stock behind the parallel recess. Next verify revised geometry and stale downloads after a real Build edit.

### 2026-11-20 - recessed fixing edit and stale output

- Chromium and independent export probes passed for the Gear counterbore edit. Diameter 9 mm is refused without editing the model, and a valid 5.05 mm edit invalidates its previous job. The 1.4 mm recess and 8.6 mm residual stock remain measurable. The geometry planner rejects non-finite diameters and spacing.

### 2026-11-20 - native recessed fixing stock guard

- Manifold validates continuous stock around each recessed fixing and rejects unrelated cuts that breach that stock. Build uses the same fabrication worker to validate edits before committing. Focused Chromium passed the solid Gear exports and thin Wave rejection.
- Next verify individually positioned recessed mounts and depth adjustment.

### 2026-11-20 - manual underside recessed fixings

- Added counterbore and countersink profiles to individual underside mounts. Chromium measured the 5.1 mm recess, 3.4 mm pilot and 3 mm depth in both downloads and verified invalid depth rollback. Catalogue tests passed manual countersink stock and input guards. Other faces and tab recesses remain open.

### 2026-11-20 - planar top recessed fixings

- Manual planar Gear top recesses use the production stock envelope, which rejects thin stock and blocked entry. Focused Chromium and independent STL/3MF sections confirm the countersink and pilot with an underside counterbore on the same model. External tab recesses remained open at this checkpoint.

### 2026-11-20 - external backing tab recesses

- Reused the recessed fixing cutter and production stock checks on external backing tabs. Manifold and both export decoders passed the 5.1 mm recess, 3.4 mm pilot, 3 mm depth and 5 mm remaining stock. Chromium passed rejected depth, rejected backing reduction and successful STL/3MF downloads.

### 2026-11-20 - recessed library copy and update

- Focused Chromium verified that a linked Gear retains a read-only mounting setup, an independent copy keeps its own edited depth after reload, and accepting a new linked revision refreshes the tab depth and enables fresh STL/3MF preparation.

### 2026-11-20 - prepared section bounds

- Compared the prepared section control ranges to downloaded STL and 3MF for five native journey fixtures and the updated linked Gear. The full unified Chromium journey suite passed. A focused follow-up passed withdrawal of the stale cutaway and both stale downloads after the original Gear depth edit. The revised linked model then prepared successfully, and slider movement left the saved model untouched.

### 2026-11-20 - prepared Gear section profile

- Focused Chromium sampled the actual rendered clipped Mesh through the planar top pilot and countersink. Rays at three heights matched the independently decoded STL and 3MF at the same plane.

### 2026-11-20 - prepared Wave channel and Gear undo

- Full unified Chromium passed. The rendered Wave cross-section and both exports agree on the 3.2 mm channel and both wall positions. Focused Chromium confirmed undo and redo restore the exact Gear tab depths and do not revive stale downloads.

### 2026-11-20 - native conical ceiling and Wave drag undo

- The full unified Chromium suite passed Wave direct-manipulation undo and redo. Added native conical socket roofs on level underside faces with a shared production cutter and real stock validation. Focused Chromium passed thin Gear refusal and both Gear exports, and the catalogue fixture independently confirms flange, retention, straight bore and cone slope in STL and 3MF.

### 2026-11-20 - native conical fixture coverage

- Six native family fixtures passed the conical cutter and positive-housing containment test. Decoded STL and 3MF confirm the expected 6.65 mm apex and 3.3 mm section diameter at 5 mm for every fixture. Native conical coupon parity is next.

### 2026-11-20 - native conical coupon parity

- Selected native shaped sockets initialise the routed coupon’s measurements, clearance, retention and roof profile. Chromium downloaded both coupon formats and checked the apex against the full model. Manifold and both export decoders also matched a retained and flanged conical coupon to the full-model section.

### 2026-11-20 - bent native vaulted channel

- Decoded STL and 3MF passed sweep checks through the upper vault and both exterior openings plus tapered sections at 2.2 and 2.8 mm. Chromium successfully enabled a pinned Tile vault and measured the exported 3.2 mm usable width and 1.4 mm upper width. Build uses the fabrication worker before enabling an active vault.

### 2026-11-20 - active vault route edits

- Active vault changes use the fabrication worker before committing. Chromium rolled back an unsafe perimeter opening and a 5 mm width that left insufficient web on the Tile fixture. A valid 4 mm width and adjusted opening prepared successfully. STL and 3MF measure 4 mm usable width and 2.2 mm at 2.8 mm height.

### 2026-11-20 - wide vault socket junction

- A 6 mm routed fixture exposed partial obstructions at the junction between the round socket and the cutter’s original endpoints. Extending the cutter to the matching bore chord preserves the full usable corridor and planned cable length. STL and 3MF now pass the through-junction and exterior probes, and verify taper and apex. The full Chromium journey suite passed after widening the junction cutter. A focused follow-up verified the 6 mm Tile edit, stale download protection, reload and fresh measured STL/3MF.

### 2026-11-20 - native shaped calibration

- Validate shaped profile and bore-size edits in the production worker. Focused Chromium measured successive flanged Gear exports after clearance and retention updates, including reload and stale-download protection. Static and profile tests passed. The subsequent full Chromium suite passed the oversized conical diameter rollback and the existing family journeys after the tests were updated to await production validation.

### 2026-11-20 - native project snapshot calibration

- Chromium reopened the earlier and later snapshots. Downloaded files measured 4.85 mm for both in the earlier snapshot and 5.10 mm following/4.85 mm local in the later snapshot. A reopened project clears the undo history of the project it replaces.

### 2026-11-20 - Crystal measured fit imports

- Both Crystal profile selectors initialise newly selected measured profiles from their tested nominal bore and preserve existing local values. Import keeps the model’s stored profile data. The full Crystal dimensional browser test passed, including 5.60 mm on the imported copy and 5.30 mm on the locally adjusted original in both downloaded formats. CAL-02 is verified.

### 2026-11-20 - exact shaped socket movement

- Numeric movement and keyboard nudges raycast the intended installation face and use production validation before saving. Fixed a numeric step mismatch left by fractional drag coordinates. Chromium verified a nudge and exact Wave move, a tangent move on a vertical Tile, and rejection of off-surface motion.

### 2026-11-20 - rotation with routed stock validation

- The production worker now validates shaped socket rotation on an enabled route. Focused Chromium refused 90°, reproduced the accepted job, then approved 179°, invalidated both previous exports and prepared matching fresh 3.2 mm channels.

### 2026-11-20 - native cable order and reversal

- An enabled native route validates sequence edits before saving. Reversal changes pixel order and direction and swaps the saved perimeter pins and tail budgets. Focused Wave and Tile browser fixtures passed rejected reorder, fresh reversed Wave STL/3MF, and pinned Tile lead swaps.

### 2026-11-20 - rear Tile wall routing

- Rear-wall Tile routes use mirrored socket coordinates, cutter transforms and stock checks. Chromium placed real sockets from the rear view and independently measured 3.2 mm width, 1.8 mm depth and an open path through both exterior apertures. Manifold rejects mixed faces and a cut that breaches the rear-route guard. Updated the older Gear journey to expect unsafe reorder rollback rather than preparation of an already invalid edit. The previous PR browser workflow failed on that assertion. The corrected full local Chromium suite passed.

### 2026-11-20 - perpendicular Tile walls

- Generalised the Tile wall routing frame to front, rear, left and right. Focused Chromium placed sockets on each new wall and downloaded both files. STL and 3MF preserve width, inward depth and open apertures. Manifold rejects a nearby cut on either perpendicular side.

### 2026-11-20 - two-axis Wave routing

- The Wave cutter and stock guards sample the same triangulated heightfield as the manufactured model. Unit probes compare exported floor height against independently raycast source stock. Focused Chromium placed two sockets with nonzero slope in both directions and verified a 3.2 mm channel and both open apertures in STL and 3MF.

### 2026-11-20 - two-axis Wave bend and measured length

- The pinned two-axis Wave fixture measures an exported 3D centreline span within 0.05 mm of the plan and preserves the sampled bend radius within mesh tolerances. Build uses production validation for active bend-radius edits. Focused Chromium rejects 60 mm without a saved revision change and accepts 6 mm with fresh STL and 3MF.

### 2026-11-20 - edited manufacturing bounds across all families

- Browser tab removal in all six native families blocks the stale STL, 3MF and ZIP. The fresh files match the reduced displayed extents and manifest. Separate Crystal dimension and invalidation evidence covers the remaining family. DIM-02 is verified.

### 2026-11-20 - edited tab recesses and stock

- All six native families passed Manifold and both export decoders for tab counterbore and countersink diameter, through pilot, depth and retained material. Chromium verified edits and stale job handling on Character, Light Pod and Rotary Cap.

### 2026-11-20 - blind native mounting profiles

- Added editable magnet pockets and threaded insert pilots to native mounts. Shared production stock guards validate the blind cuts. Both file formats measure diameter and depth for all six native families, and Chromium verified both Tile pockets and rollback when insufficient stock remains.

### 2026-11-20 - direct blind mount placement

- Added the mounting profile picker before placement. Tile Chromium placed a magnet pocket and insert pilot directly, refused a conflicting placement, reloaded the accepted mounts and measured both exported cuts. The full unified Chromium suite passed. A follow-up verified the native finder focus and repeated the measured placement journey on Gear.

### 2026-11-20 - blind mounting workflow across six native families

- Focused Chromium passed finder, direct placement, editing, conflicts, reload and geometry downloads in Wave, Character, Light Pod and Rotary Cap on fitting backing. The same test covers Tile and Gear.

### 2026-11-20 - Crystal blind preset dimensions

- Crystal Chromium changed the preset from magnet to insert and verified stale downloads. Paired STL/3MF probes measured both stations at 10.2 × 3.2 mm for magnets and 4.2 × 6 mm for inserts, including base stock behind each floor. DIM-05 is verified.

- Crystal Chromium verified conversion of automatic tab positions, editing the populated list, deleting all entries and adding a new tab from the empty editor. Native precision settings distinguish the automatic screw pair from manual attachments.

- All six native Chromium mounting journeys accepted keyboard nudges for both blind profiles and reproduced them after reload in STL and 3MF. PAR-01 is verified.

- Manifold and both export decoders measured retained conical sockets on all six native builders. The cone preserves its expected flange, retention throat, body width and apex. FAB-02 is verified.

- All six native builders passed measured clearance, flange, depth and retention variations. Crystal Chromium verified the unchanged 5.3 mm bore and narrowed 4.9 mm throat. DIM-03 is verified. Native wire-width edits passed both formats without changing the selected socket dimensions.

- Crystal Chromium verified a 4.5 mm wire edit survives reload, blocks stale output, and retains the 5.4 mm fitted bore in both fresh meshes. CAL-01 is verified.

- All six native families passed 6 mm width, 1.8 mm depth, clear socket joins and both apertures in both export formats. Crystal passed a separate 6 mm Build edit and reload with the bore unchanged. DIM-04 is verified.

- Six native vaulted 6 mm routes passed independent roof slope, apex stock, upper passage and aperture measurements in both formats. Each refuses 4 mm backing. Together with Crystal’s asymmetric vaulted witness this verifies FAB-01.

- The full unified Chromium suite passed real overlapping-drag rejection on backed Character, Light Pod and stationary Rotary Cap. FIT-01 is verified. The owner requested an experiment checkpoint. Freeze further feature expansion until a specific draft head has required CI evidence and a current handoff.

- After #102 merged, PR #103 added per-material STL dimensions (`7894c48`), Crystal endpoint dragging (`f368e7a`) and advisory cable lengths (`b0045b2`). Local Chromium confirmed both revised downloads match the prepared bounds and toggling strict lengths invalidates the older files.

- Cura Desktop 5.13 imported the UM3 Extended AA 0.8 mm PLA profile (e601bdc). Offline CuraEngine 5.13 then sliced both decoded 3MF bodies with independent tools across 55 layers. Desktop assignment and physical validation remain open.

- FIT-02 catalogue test passed for perpendicular Tile wall stock. An 18 mm compact fitting has the correct production cutter and rejects a colliding mounting cut. The full gumdrop on the same wall reports missing stock and preparation refuses it.

- Chromium confirmed same-point Tile wall rejection for the full gumdrop and acceptance for the calibrated 18 mm compact profile, with read-only fitting diagnostics and rejection rollback.

- Full unified Chromium suite passed after replacing the exact screen-derived height with a check that the accepted hit is inside the wall. Face normal, profile depth, clearance, measured stock and rejection rollback remain exact checks.

- Full Manifold catalogue suite passed. Independent STL and 3MF probes measured an open 18 mm side socket, 5.15 mm calibrated bore and over 2.8 mm of material behind it.

- Reconciled the handover and status command against GitHub. #102, #103 and #104 are merged. The local candidate awaits a confirmed PR destination. The status command reports 19 verified and five partial acceptance rows.

- FIT-02 full fabrication suite passed for an 11 mm calibrated sloped Wave socket. Preview cutter and manufactured solid agree, and both export formats retain a 5.2 mm bore and more than 2.8 mm of stock behind the seat.

- Full unified Chromium suite passed the calibrated sloped Wave fitting. Real placement retained the 11 mm profile, 0.2 mm clearance and nonvertical normal. The physical preview reported sufficient stock and did not change the saved model.

- FIT-03 full fabrication suite passed a curved Wave cable route with 8 mm body profiles. Both exports retain 5.8 mm channel width, 1.95 mm depth and open inlet and outlet.

- Full unified Chromium suite passed the measured-width Wave route from placement through production download. Both actual files retained 5.8 × 1.95 mm clearance across seven sections and open inlet/outlet.

- Raised Wave routing regression failed under the old slope gates. Bounded slopes up to 6% now prepare an upward-open path. Both complete exports pass seven section checks and both edge openings. Static and Manifold catalogue suites passed.

- Full unified Chromium passed the 6 mm raised Wave fixture through placement, cable routing, save and reload, and STL/3MF download. Both files retain a 3.2 × 1.8 mm channel and clear exterior openings.

- Full unified Chromium passed a Wave relief edit beyond routing limits. It stales both previously prepared downloads and rejects preparation with an actionable message. Undo restores the accepted relief and both export buttons after preparation.

- Updated the Wave route slope diagnostic. Print Centre reports the 6% limit and names Wave height and Wave count as recovery controls. The full Manifold catalogue and unified Chromium suites passed.

- Full unified Chromium passed the prepared Pod fit edit, undo and redo. Each step blocks old downloads until fresh preparation. Both redone meshes measure the 5.60 mm bore.

- Assembled a local candidate on merged main eea22c6. Preserved both sets of release notes and assigned the WT-021 changes version 0.16.0-dev.35.19. Release metadata and static tests passed. Full fabrication passed on the original follow-up. Combined browser and fabrication runs started.

- Combined candidate b71f0b9 passed release metadata, all static checks, all ten browser suites and all six fabrication suites locally. The candidate still awaits a confirmed PR destination and exact-head GitHub CI.

- Full unified Chromium passed the prepared stationary Cap calibration edit, undo and redo. Each step staled both downloads, and fresh STL and 3MF after redo measured a 5.60 mm bore.

- Full unified Chromium passed the layered Character fit edit, undo, redo and stale-download checks. Fresh STL and 3MF both measure the redone 5.60 mm bore.
