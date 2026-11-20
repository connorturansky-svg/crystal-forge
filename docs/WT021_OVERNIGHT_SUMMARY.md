# WT-021 overnight checkpoint

[PR #102](https://github.com/connorturansky-svg/crystal-forge/pull/102) merged as `3326ac9`. [PR #103](https://github.com/connorturansky-svg/crystal-forge/pull/103) merged print sizes and Crystal wiring controls. [PR #104](https://github.com/connorturansky-svg/crystal-forge/pull/104) merged optional support-free pixel shoulders and is deployed at `7d746d3`.

- Cura Desktop 5.13 imported PLA profiles for both target printers. An offline Ultimaker 3 Extended slice verified separate toolpaths for both exported material bodies. Physical and Desktop dual-extruder checks remain open.
- Print Centre shows dimensions for each STL in a two-material job. Crystal Build supports dragging both cable openings and treating cable lengths as warnings. Local Chromium moved both endpoints, rejected invalid drops, reloaded them, and independently measured both exports against the prepared dimensions. Re-enabling strict lengths invalidated both old downloads.
- Next, measure the owner’s sample STL and compare its axis extents with the matching saved model revision. The original sample is pending.
- Local follow-up moved Render actual model onto the Build viewport and shows preparation errors in the inspector. A conical gumdrop fixture needed 30.88 mm of stock. The profile-based base control raised the model to 31 mm, and preparation passed. A fresh Truncated blade fan exported STL and 3MF on the public release. The exact saved revision 398 remains unavailable.
- Library shows built-in templates separately from saved models. New Cogs start in Design with clean fittings. A browser regression saved a named edited copy and reopened a fresh template with stock geometry. Crystal wire previews stop rendering on other builders.

## Owner experiment checkpoint

- The draft offers verified representative editing and export journeys for all seven builders. Local Chrome and Manifold evidence covers measured fittings, backed mounts and tabs, routed slots, independent calibration, retained ceilings and vaulted tracks. Working on a copy of a saved project keeps the original available for comparison.
- The remaining software work covers the original Crystal size discrepancy, additional fitting-preview diagnostics, route continuity on additional configurations, interaction and undo combinations, cutaway profiles, and Cura import. The original Crystal test project and reported exports are unavailable. Physical Cura and printed fit are tracked in #10.
- Pushing to main triggers the repository’s GitHub Pages workflow. The version and release notes pass the production metadata gate against the current main base. Merge and deployment are owner-controlled.

## Latest checkpoint

- FIT-01 is verified. The full unified Chromium suite passed overlapping drag refusal on backed Character, Light Pod and stationary Rotary Cap, with both accepted poses intact. Combined with the Crystal, Gear, Tile and Wave witnesses this covers all seven builders.
- FAB-01 is verified. All six native 6 mm vaulted fixtures passed both exported sections, including upper clearance through both joins and apertures. Each retains material above the apex and refuses 4 mm backing. Crystal’s separate vaulted fixtures cover the seventh family.
- DIM-04 is verified. Six native fixtures preserved 6 mm usable width, 1.8 mm depth, matching route length and open exterior apertures in STL and 3MF. Crystal also edited to 6 mm and reproduced that width after reload.
- CAL-01 is verified. Crystal changed the route width from 3.2 to 4.5 mm, retained the 5.4 mm bore, and reproduced both measurements in STL and 3MF after reload and fresh preparation.
- DIM-03 is verified. Both formats showed the expected changes from independent native clearance, flange, insertion depth and retention edits. Crystal kept a 5.3 mm straight bore after adding 0.2 mm of retention, with a measured 4.9 mm throat. Widening native cable channels left socket geometry unchanged across all six builders.
- FAB-02 is verified. The six native retained conical fixtures reproduce flange, retention throat, straight bore and apex dimensions in STL and 3MF. The existing Crystal and routed coupon checks cover the other applicable cases.
- PAR-01 is verified. All six native builders nudged both blind mount profiles, reloaded those positions and measured the cuts in fresh files. Crystal converted its automatic tab list, edited it and added a new tab after deleting all entries.
- DIM-05 is verified. Chromium switched Crystal from magnet to insert presets, disabled stale output and measured both downloaded cuts. Magnet pockets measure 10.2 mm across and 3.2 mm deep. Insert pilots measure 4.2 mm across and 6 mm deep. Both retain the expected base stock.
- Native Build accepts a mounting profile before 3D placement. The Tile browser witness placed both blind profiles directly, rejected an overlapping placement and preserved the settings after reload. Both files reproduced the saved diameters and blind floors. The same workflow passed on Gear, Wave, Character, Light Pod and stationary Rotary Cap. The tool finder focuses the mounting-profile picker when opening a native mounting result.
- Native manual mounts support blind magnet pockets and threaded insert pilots. All six families passed STL and 3MF diameter and floor checks. Chromium edited both profiles on a Tile and verified that excessive pocket depth rolled back.
- All six native builders passed counterbore and countersink section measurements on backed tabs. Chromium measured the edited Character, Light Pod and Rotary Cap tab in fresh STL and 3MF and verified that stale downloads were disabled.
- DIM-02 is verified. Removing a tab on six native builders invalidates the older downloads. Fresh STL and 3MF agree on the updated manufacturing bounds and match the viewport, Print Centre and ZIP manifest. Crystal has a separate browser and export dimensional trail.
- A pinned two-axis Wave channel matches the planned three-dimensional span and passes sampled bend checks in both export formats. Chromium refused a 60 mm radius that could not fit and prepared both files after a valid 6 mm edit.
- Gentle Wave routes now follow the triangulated surface in both horizontal directions. Chromium and Manifold verified real socket normals, open apertures and a 3.2 mm track in both export formats. A steep Wave is refused.
- The left and right Tile walls now share the same stock and export checks as the front and rear. Focused Chromium placed sockets directly on each new wall, and Manifold plus independent STL/3MF probes verified 3.2 mm width, 1.8 mm depth and clear apertures.
- Rectangular Tile routes now support shaped sockets on the rear wall. Manifold and Chromium verify 3.2 mm width, 1.8 mm depth and both apertures in STL and 3MF. Mixed faces and a nearby cut that removes surrounding stock are rejected.
- Native routes can reverse the pixel sequence, socket directions, pinned openings and tail limits together. Focused Chromium verified an unsafe Wave reorder preserves the prepared job. The validated reversal produces fresh 3.2 mm files, and the Tile fixture confirms the pin and unequal tail limits swap sides.
- A routed Wave rejects a 90° socket rotation while its valid job remains downloadable. A valid rotation to 179° invalidates the previous files and prepares a 3.2 mm route in fresh STL and 3MF.
- Exact typed coordinates and keyboard nudges resolve shaped sockets against the real surface before saving. Chromium verified curved Wave movement and tangent movement along a vertical Tile face, plus rollback when the move would leave the face.
- Crystal Chromium tests verified measured profile imports and preserved local overrides. The revised import produced a 5.60 mm bore in both formats, while the original retained its locally adjusted 5.30 mm bore.
- Original and revised native project snapshots reopened and prepared independently. Their decoded exports preserve the original 4.85 mm and revised 5.10 mm following fit, while the local fit remains 4.85 mm.
- Focused Chromium measured a flanged Gear before and after independent clearance and retention edits. STL and 3MF agree on the flange, bore, throat and 9 mm depth. The full Chromium rerun passed, including rollback of an oversized conical diameter. The existing calibration journeys wait for production validation before making the next edit.
- A 6 mm native vault initially narrowed at its junction with an 8.3 mm socket. The cutter now reaches the first bore chord wide enough to accept it. Manifold and both export formats confirm the full lower corridor, upper clearance, taper and both exterior openings. Focused Chromium verified a 6 mm Tile width edit after reload, withheld stale downloads and measured both fresh files.
- A pinned Tile vault passed Chromium preparation and both downloads. STL and 3MF agree on upper clearance through the bent channel and both apertures, and on the tapered side walls. Build validates active vaults when switched on and when route settings change. Focused Chromium verified width and edge rollback and measured 4 mm usable width in the edited exports.
- All six native families passed Manifold containment for a backed underside conical socket, and both exported formats matched the apex and slope for each family. Routed native test coupons carry the selected fitting’s geometry and fit settings. Chromium confirmed matching apex in both coupon and full model files.
- Native shaped pixel sockets offer conical roofs on level underside faces. Chromium rejects a 13 mm Gear without changing its model and exports the eligible 18 mm Gear. Manifold and both formats verify bore, taper, flange and retention. The Wave direct-drag journey also passed exact position and normal restoration with undo and redo.
- The full unified Chromium suite passed with a 3.2 mm curved Wave route measured at the same cutaway plane in the viewport, STL and 3MF. Focused Chromium verified exact undo and redo of a Gear tab-depth edit and disabled downloads from the old revision.
- Native journey tests compare prepared X and Z section ranges with fresh STL and 3MF coordinates. Moving the section slider on the revised linked Gear leaves the saved model untouched. A valid recess edit hides the previous cutaway and disables both prior downloads until preparation. At the same clipping plane, the rendered Gear pilot and countersink agree with the STL and 3MF mesh walls at three heights.
- Chromium verified that the recessed Gear build survives library copies and reload. Independent edits stayed local, and the linked copy accepted revision 2 explicitly before preparing fresh STL and 3MF.
- Native external backing tabs accept underside counterbores and countersinks. Export probes measured a 5.1 mm counterbore, 3.4 mm pilot, 3 mm depth and 5 mm remaining stock. Chromium verified the two downloads and confirmed that insufficient recess or backing edits preserve the saved model.
- Planar Gear tops accept manually placed screw recesses alongside underside fixings. Manifold and independently decoded STL and 3MF verify the top taper. Thin or buried stock is refused. Focused Chromium prepared and downloaded a Gear with both faces in use.
- Manual underside counterbores and countersinks use independently editable dimensions and production stock checks. Chromium verified the Gear counterbore in downloaded STL and 3MF and confirmed rollback of an invalid depth.

## Current acceptance

- The register has 18 VERIFIED and 6 PARTIAL rows. All seven model families have browser journey evidence and UX-01 was verified at `8083c547b76b5b1df4b547ffccc3ceb6b5765439`.
- Recess editing applies to supported native mounts and external tabs. Planar top recesses were verified on Gear. Crystal retains its existing mounting workflow. Moving Rotary Caps require Stationary display before adding external tabs.
- [Next software check](WT021_NOW.md) and [full acceptance register](WT021_COMPLETION_REGISTER.md). Physical Cura and printed fit still require owner validation under [#10](https://github.com/connorturansky-svg/crystal-forge/issues/10).

## Earlier implementation and historical results

- Native Build fitting inspection shares the production Manifold checks for blocked insertion, insufficient stock and nearby cut interference. It reports measured wire-cut overlap independently, since contact with a wire relief can be intentional.
- Gear-top and Tile-underside fabrication fixtures exercise actual Boolean wire overlap and confirm that an interfering mounting cut is shown in the preview and rejected by preparation.
- Updated the unreleased changelog, in-app release notes and FIT-02 acceptance evidence.

### Initial checkpoint evidence

- The targeted catalogue/manufacturing test passed locally. Added Chromium assertions for the new diagnostic readout. Exact-head CI is reported on the PR.
- At the initial checkpoint, the register had 23 PARTIAL and one MISSING. Remaining limitations include routed stock protection, browser state preservation for rejected edits, side/curved-face fabrication, the remaining builder journeys and UX-01.
- The next task at that checkpoint was FIT-02.

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

### Native underside channel side walls

- Draft head before this checkpoint was `960f9c90e4bbe486929aca11ec7ef825aa72bb10`, with static, Chromium and Manifold checks green. This report is committed alongside the side-wall change.
- Native preparation now checks actual side stock along the channel shoulders and refuses nearby cuts that erode it. The catalogue Manifold suite passed, including false stock and encroaching-cut fixtures. Independent STL and 3MF measurements found at least 0.55 mm of continuous side stock at sampled straight and pinned curved sections.
- These are underside channel fixtures. Next add a planar top route and measure its exported clearances and perimeter openings before extending routing to side and curved placement. The seven complete journeys, UX-01 and owner Cura/printed checks are still open.

### Flat top routes on solid decorative Gears

- This checkpoint follows side-wall commit `efe7b9a291b922700db5e887c172b4c77a332fd6`.
- Build can plan and cut open top-face serial grooves between coplanar shaped seats on eligible Gears. The catalogue Manifold suite passed. The independent rectangular witness showed a 3.2 mm opening, 1.8 mm depth and both open ends in STL and 3MF. Mixed normals and top vaulting are rejected.
- The default local browser port was occupied. On a separate port, the unified Chromium suite passed the new Gear top Build-and-export journey, including reload, an STL print pack containing three serial links and a separate 3MF download.

### Side-face selection markers

- The marker for a shaped socket now uses its actual point and normal. The catalogue suite reproduced the incorrect side marker and passed after the fix. Next exercise side placement and drag in Chromium before generalising route frames.

### Square Tile front-wall serial routing

- Base was `2c68782d187be2725d38488b6fd09707d0129696`. The browser fixture places and drags a shaped socket on the vertical Tile face, reloads the moved pose, places a second socket, enables routing, then prepares and downloads STL and 3MF. The focused Chromium run passed.
- The catalogue Manifold suite verified a 3.2 mm wide and 1.8 mm deep channel with uninterrupted clearance through the front groove and both open ends in each independently decoded file. Preparation refuses a neighbouring cut that removes side stock.
- Next prove curved-face seating and routing, then finish full family journeys and UX-01. Printed and Cura evidence remain with #10.

### Gentle Wave curved sockets and routing

- Base was `c6655a30e33d9a2707e368ce38e32ba14e9f7e36`. The focused Chromium Wave case placed two sockets with distinct normals and downloaded routed STL and 3MF. Full unified Chromium also passed the preceding Tile checkpoint.
- The actual production Wave mesh supports flat, upward-opening grooves on gentle parallel profiles. Both exported formats show 3.2 mm width and 1.8 mm depth at seven sections and an open path between exterior ends. A sampled shaped seat had 9 mm installed-axis depth and 5.3 mm diameter. A convex location with inadequate stock and a cut in a route wall were rejected.
- Next test concurrent routing and noninterfering manual mounts, then advance the full model-family journeys. Broad multi-axis curved routing, final acceptance and physical Cura/print checks remain open.

### Manual mounting alongside serial wiring

- Base was `766daed9c1c2c3ddd07d90545d964ff2ee951eed`. Native routing accepts validated manual through-holes with adequate channel clearance. Focused Chromium passed the separated Gear mount and rejected a move into the channel without editing the saved model.
- Both formats independently measured a 3.4 mm through-hole and 8.7 mm of continuous material between its wall and the routed channel in the controlled Gear specimen. Next complete the Gear journey with fit calibration, Library/Print inspection and measurements of the browser downloads.

### Gear design-to-download acceptance journey

- Base was `6030de31553a49b289514212297f667df32b7e6f`. The focused Gear Chromium case now covers Design editing, two top sockets, accepted and rejected drags, serial channels, two manual holes, two edited external tabs, calibration, Library snapshot and backup, reload and actual prepared cutaway.
- Real downloads included standalone STL and Cura profiles byte-matched to the ZIP, plus 3MF. The independently decoded model files measured the 12.5 mm calibrated bore and 3.2 mm channel, and confirmed through-holes and 4 mm printed material on both tabs.
- Adding external-tab backing now preserves the original Gear top routing footprint. Exact-head CI gates completion. Next preserve eligible Tile front routing with backing, then complete the Tile journey.

### Tile design-to-download acceptance journey

- Base was `0b57821548d17823fccb3e869019faa376198a26`. External-tab backing now preserves a square Tile’s front wall route where the channel clears the backing. The browser rejected a conflicting backing thickness while retaining the model revision.
- Focused Chromium passed the full Tile sequence with two shaped sockets, two manual mounts, two edited external tabs, calibrated fit, Library snapshot and backup, inspection and four Print Centre downloads. Independent STL and 3MF sections measured a 5.5 mm socket, 3.2 mm route, four through-holes and 4 mm tab stock.
- Next complete the gentle Wave browser sequence and its independent export measurements.

### Wave design-to-download acceptance journey

- Base was `eb58e32dd235706e6318e55595e4977a96b6900f`. Focused Chromium passed Design width editing, two curved sockets, accepted curved drag and rejected convex seating, followed by routing, two real tabs, two mounts, calibration, backup/reload and prepared cutaway.
- Actual browser downloads included matching STL, Cura, production ZIP and independently decoded 3MF. Both models measured a 5.4 mm calibrated seat, 3.2 mm groove, four through-holes and 4 mm tab stock.
- Next complete Character and solid Pod journeys on their backed underside, then Crystal and rotary Cap.

### Backed Character, Pod and stationary rotary Cap journeys

- Last exact-head green was `c2cf3d0fe39c495edc287611c16f742b1cac85db`. GitHub passed static run 44661415796, browser run 44661415832 and fabrication run 44661415876. That covers the independent Gear, Tile and Wave journeys.
- Focused and full unified Chromium runs passed the layered Character, solid Beacon Pod and explicitly stationary rotary Cap cases. Each measured a 5.45 mm calibrated seat, 3.2 mm groove and four open fixing holes with 10 mm attached tabs in both model formats. Their standalone files matched the ZIP.
- The moving rotary mode rejects fixed ears. Switch to Stationary display in Design only when the rotary body itself is fixed. Inspect a physically moving assembly separately.

### Crystal journey and Features catalogue

- Crystal can add independent manual through-holes while edge tabs are enabled. Its full local Chromium journey passed Design, fitting placement and held drag, rejected coordinate rollback, routing, two mounts, two tabs, calibration, Library backup/reload, prepared cutaway and real STL, 3MF, Cura and ZIP downloads. The model files measured a 5.4 mm seat, 3.2 mm groove, four through-holes and 5 mm tab stock.
- The searchable Features tab links to all seven real family pickers and to Design, Build, Library and Print Centre without changing the model. Local Chromium passed keyboard, mobile, both themes and lazy graphics. Version and release notes are generated from CHANGELOG.md and checked for drift.
- All seven independent browser journeys now have local evidence. Exact-head CI remains required. Next finish the calibrated flange, bore, retention and wire-dimension evidence, then remaining software acceptance rows. Cura slicing and physical prints remain under #10.

### Exact-head checks and retention calibration

- Static, Chromium and Manifold passed at `8083c547b76b5b1df4b547ffccc3ceb6b5765439`. All seven independent browser journeys and the Features catalogue have exact-head evidence.
- A four-variant Manifold fixture independently measured bore, flange, retention throat, roof depth and groove width in STL and 3MF. Build refuses retention where the body cannot support the lip.
- Next verify linked and copied profile behaviour in exported files.

### Linked profile and locally calibrated fit

- Browser downloads independently measured a library-linked bore changing from 4.85 to 5.10 mm after a profile edit. A local 4.85 mm fit on another model retained its geometry, and the linked model’s stale STL and 3MF were disabled until preparation.
- Next measure the actual bend radius and centreline length in the exported route.

### Native cable bends

- Build has an editable minimum bend radius, and incompatible pin and radius combinations are rejected during preparation. Independent STL and 3MF probes matched the sampled curved-span lengths within 0.06 mm and found radii of at least 4.75 mm for the 5 mm fixture.
- Next measure the complete path through fitting junctions and apertures.

### Whole cable path through the exported mesh

- Both STL and 3MF passed obstruction checks along the entire 71.786 mm pinned route, including both junctions and both exterior openings. The measured apertures were 3.2 mm wide. A separate shaped-socket specimen preserved uninterrupted clearance.
- Both formats also measured paired 4 mm fastener bores, 6 mm counterbores with 1.4 mm recess depth, 8.6 mm of stock, and the countersink taper on rectangular stock. Next verify the same dimensions after a production-family Build edit.

### Recessed fixing edits in Build

- Chromium edited a solid Gear’s bore from 4 to 5.05 mm and measured both revisions in the downloaded STL and 3MF. The recess remained 1.4 mm deep with 8.6 mm of remaining stock. An out-of-range edit kept the preceding model revision and restored the displayed number. The accepted edit disabled both stale downloads.
- Next validate the actual remaining stock for fixings on interrupted and thin bodies.

### Recessed fixing stock validation

- Build checks the actual Manifold solid before saving an automatic counterbore or countersink. The guard protects 1 mm around the recess and 1.6 mm behind it, and detects nearby cuts that remove that stock.
- The catalogue suite rejected thin and interrupted fixtures and kept the measured solid case. Chromium rejected a thin Wave countersink without changing the accepted control, Build settings or revision. Next add independently placed recessed mounts.

- Wave routing accepts somewhat steeper relief within a 6% surface slope. Test exports preserve the full cable channel at the new limit. Full unified Chromium passed the new relief fixture through save, reload, preparation and both downloads.

- The combined local release candidate b71f0b9 includes the merged accessibility and recovery changes. All ten browser suites and six fabrication suites passed, along with static and release checks. GitHub CI remains pending.
