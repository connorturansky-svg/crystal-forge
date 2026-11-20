# WT-018 shared Builder acceptance

P means browser, persisted state and manufacturing evidence together. L means limited or awaiting combined verification. M means missing. B means blocked on named geometry.

| Family | Double-click pixel before → candidate | Manual mount context | Routing source and applicable geometry | Save, profile and Print Centre acceptance |
| --- | --- | --- | --- | --- |
| Crystal Clusters | L → L, existing Crystal context | L, existing Crystal editor | L, Crystal serial planner and cutters | L |
| Tactile Tiles | M → L, Tile Playwright case | L (WT-020 draft, verification pending) | L, #67 solid backed fixture | L |
| Gears | M → L, shared handler | L (WT-020 draft, verification pending) | L, #67 solid decorative gear | L |
| Waves | M → L, shared handler | L (WT-020 draft, verification pending) | L, #72 solid backed fixture | L |
| Control Caps | M → L, shared handler | L (WT-020 draft, verification pending) | L, #72 backed cap without a shaft | L |
| Characters | M → L, shared handler | L (WT-020 draft, verification pending) | L, #72 backed Cloud | L |
| Pebbles / Pods | M → L, shared handler | L (WT-020 draft, verification pending) | L, #72 backed non-hollow fixture | L |

The native Build handler in `sensory-studio.js` raycasts visible model meshes, checks the chosen bore through the same function as manual placement, and commits through the existing pixel state and undo path. Existing marker double-click selects without adding. The shared browser scenario covers a Tile surface, Escape and measured bore placement. Remaining interaction acceptance includes all-family real-pointer fixtures, mount tooling backed by printable geometry, continuous placement with a ghost, keyboard/touch placement at a chosen point, and overlay/cutaway verification. Exercise transformed and recessed geometry, invalid placements and route joins. Keep cavity and shaft exclusions until verified. Physical testing lives in #10.

The native Show routes and arrows control is independent of Cut serial channels. Both use the same planner. The Tile fixture checks that the guide matches the planned cut path and produces no preview cutters or extra export negatives when cuts are off.

## WT-019 acceptance in progress

| ID | Acceptance | Evidence and remaining limits |
| --- | --- | --- |
| WT019-01 | Repeated native manual pixel placement with valid/invalid viewport preview and explicit exit | `sensory-studio.js` validates raycast points through the shared native bore check. `unified-studio-browser.test.mjs` exercises the Tile workflow with real mouse events, placement screenshot and Escape. L across native families until full family verification. Crystal retains its established manual workflow. |
| WT019-02 | Context add and direct manipulation of pixel and mounting hardware | L for pixel work. WT-020 draft adds a conservative source-backed M1…Mn through-hole contract on verified solid columns, with physical Manifold and browser fixture tests. It is L until exact-head CI and actual cross-family release acceptance; curved side-facing retainers and load testing remain outside this draft. |
| WT019-03 | Guide, physical route and prepared shape agreement | L. Existing backed fixture manufacturing evidence covers eligible shapes. Complete route, cutaway and per-family interaction verification remains open. |
| WT019-04 | Design, Library, imports and current Print exports across built-in and imported types | L pending end-to-end matrix. Procedural subpart editing is N/A for imported mesh source. No safe imported-hardware guarantee is made. |

## WT019-05 · Gear placement and routing

The main-targeted integration preserves the checked #82 and #83 source history. The native picker shares the Build mode gate and carries the selected top or underside opening into preview marks. Mesh bores still cut through both faces and native cable channels remain underside-only. The browser suite covers bottom-view Gear double-click and guide visibility with cutting off. The existing openwork check confirms the planner explains why unbacked voids block cutting. Mark L until exact-head verification, including physical validation tracked separately in #10.

WT019-06 extends real viewport double-click coverage to the six native fixtures, including an explicit rejection case where the clicked face is unsupported. Existing Crystal tests remain separate. This is partial coverage: it does not certify on-face retainers, builds with unsupported backs, all-family print/reload, mounts or Studio-wide parity.

## WT020-01 — Native mounting integration candidate

The WT-020 native mounting draft is based on the verified #85 six-family fixture tip, not on deployed main. It adds contextual Add mounting feature, toolbar continuous placement, numbered direct-select M markers, 2–8 mm through-hole precision edits, delete and keyboard nudge, guarded negative geometry and preview rings. A positive result must pass the existing solid-column certificate and have a real cutting intersection, with actual Manifold/STL/3MF tests for all six native generator families; it must refuse unsupported side-facing mounts, voids, shaft/cavity interference, pixel overlap and unsafe routing. Native mount placement uses vertical through-holes, not arbitrary normal-aligned sockets, inserts or load-rated fasteners. Crystal keeps its established mount editor. Do not mark the L cells P until latest-head browser/production tests, storage round-trip and full user walk-through are proven. Hardware load, fit and Cura acceptance stay in #10.

## WT-020 native camera framing

The active native solid bounds drive view presets and orbit centring. Hardware overlays are excluded from those bounds. The six native browser fixtures exercise ISO, front, back, bottom and top before surface placement. This camera regression does not upgrade the fitting, mount, routing, persistence or export columns to proved.

## WT-020 openwork Gear acceptance

`tests/unified-studio-browser.test.mjs` exercises four automatically fitted pixels on the Forked Sun Gear, explicit unavailable wiring, workspace reload and bore-only STL and 3MF exports. The solid Gear scenario separately exercises underside viewport placement and routed geometry. Keep these cells L pending exact-head evidence and manual four-fitting workflow, face/cutaway and published-site verification.

## WT-021 shared manufacturing downloads

Print Centre exposes STL, 3MF, Cura profile and the production pack on each prepared job. A multi-material STL download groups the aligned STL parts with material assignments. Each action uses the existing freshness and geometry export gate. Cura uses the selected job's effective settings. The browser test compares the standalone Tile STL and Cura profile byte-for-byte with the corresponding production-pack entries. Keep full family manufacturing acceptance at L: external tabs, selected-face hardware and the complete workflow still require their own evidence for each family.

## WT-021 external backing tabs

The six recipe-based builders share one backing-tab editor under Mounting & attachments. It uses Crystal’s perimeter planner to union external stock and subtract a screw bore. The six-family fabrication fixture checks real union, volume, expanded bounds and STL/3MF. Crystal retains its existing hardware editor. This is limited (L): independent browser journeys, moving/fixed assemblies, drag interaction, other fixing types and public release evidence are pending.

### Tile backing compatibility repair

Tactile Tiles now have an explicitly allowed single-material fitting backing, separate from the legacy integrated-base feature, while dual-material/partitioned recipes remain rejected. All seven-builder parity cells are still limited until actual browser interactions, saved positions, correct Manifold positive tab unions, screw cuts, STL/3MF and live-site checks pass.

## WT-021 measured pixel replica

The shared A–G profile editor exports a positive nominal LED replica as STL or 3MF through Manifold, independently of the negative fit coupon. The browser fixture requests both downloads and measures total B in the STL. This does not establish seven-family release acceptance or exact fit to a physical LED. See #79 and physical validation #10.

The profile editor also exports a single negative Test Socket or an optional five-socket plate. The coupon and Crystal manufacturing share the same underside cutter. Save the tested diametral allowance to the measured profile and current Crystal settings. Recipe-based builders use the measured allowance for their straight bores; full shape parity remains open.

## WT-021 face-aware drag and profile isolation

Native pixel and through-hole drags now raycast the visible model and retain the installation side. Crystal project clearance is keyed by profile; legacy fallback values and coupon variants remain supported. The existing Tile browser journey checks a real top-face mounting drag and reload. Full 7/7 physical sockets, routing, interaction and export acceptance remains open under #79.

## WT-021 Pixel Profile Library discovery

Build shows an active profile selector, profile editing or duplication, and standalone library import/export. Native selection lives in the model build data. A conflicting import creates a copy. Browser-local storage does not sync across computers. Existing pinned revisions and explicit fitting overrides remain separate; complete shape/manufacturing parity and wider Library acceptance remain #79.

## WT-021 configurable native cable openings

Compatible backing can use editable IN/OUT perimeter percentages or automatic exits. Both use the same recessed cutter with an extension outside the stock. Pins may be rejected when no safe bend or corner clearance is available. Tests cover a curved pinned route, invalid placement, genuine fabrication and persisted browser controls. Seven independent manufacturing journeys remain open under #79.

## WT-021 prepared mesh inspection

Build can open the actual prepared manufacturing mesh for each family through the existing shared inspector. A whole-mesh view and cut section use the same prepared result as Print Centre. The Tile browser path renders, returns to Print Centre and exports both formats. Complete seven-family acceptance and physical prints remain separate under #79 and #10.

## WT-021 selected-face and dimensions review

This draft extends the six recipe builders' measured socket cutter to an oriented installation frame. The Manifold fixture covers a top socket, a side socket and refusal at an obstructed opening. It uses a controlled stock block; the fixture does not demonstrate compatible stock on every family or side-face access in the editor. The existing physical wire cutter still requires flat underside backing. Crystal retains its existing underside cutter.

| Family | Selected-face shaped stock | Physical route | Combined browser and export acceptance |
| --- | --- | --- | --- |
| Crystal Clusters | L, existing underside | L, existing Crystal routing and fabrication regressions | L, combined custom profile and off-underside acceptance outstanding |
| Tactile Tiles | L, shared oriented cutter | L, verified underside stock | L, preview, tab and STL workflow exercised; combined off-underside workflow outstanding |
| Gears | L, shared oriented cutter; webs and cavities may block | L, solid underside stock only | L, placement and routed fabrication exercised separately |
| Waves | L, shared oriented cutter | L, compatible underside stock | L, placement and routed fabrication exercised separately |
| Control Caps | L, shared oriented cutter; avoid shaft cavities | L, requires compatible stationary backing | L, placement and routed fabrication exercised separately |
| Characters | L, shared oriented cutter | L, requires compatible stationary backing | L, placement and routed fabrication exercised separately |
| Pebbles / Light Pods | L, shared oriented cutter; illuminated cavities may block | L, compatible solid backing only | L, placement and routed fabrication exercised separately |

Design and prepared dimensions are shown in the exported X × Y × Z orientation. The Chromium Tile case independently reads binary STL vertices and checks the prepared dimensions. Geometry validation and installed Cura resource checks do not verify physical fit, bridge strength or Cura UI import. Track those physical activities in #10 and the remaining software under #79.

### Raised Gear rim manufacturing
- Verify the 68.5 mm, 12-tooth Involute Gear with five openings and an 8 mm bore across all four raised details, both material modes and chamfer on/off. Check connected export bodies, the unchanged lower section, and a continuous raised ring.
- The dual-material Hub ring stays connected through the raised collar. Verify its union matches the single-material volume with and without a shaft bore.
- The rail uses inward contour offsets. A disconnected offset is refused with suggestions to reduce tooth count or increase diameter. A top ledge too narrow for the requested chamfer retains its original geometry with a warning.
- Chromium exercises reopening and manufacturing the raised Gear. Issue #10 retains physical fit, tactile and print acceptance.
