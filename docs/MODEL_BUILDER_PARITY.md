# WT-018 shared Builder acceptance

P means browser, persisted state and manufacturing evidence together. L means limited or awaiting combined verification. M means missing. B means blocked on named geometry.

| Family | Double-click pixel before → candidate | Manual mount context | Routing source and applicable geometry | Save, profile and Print Centre acceptance |
| --- | --- | --- | --- | --- |
| Crystal Clusters | L → L, existing Crystal context | L, existing Crystal editor | L, Crystal serial planner and cutters | L |
| Tactile Tiles | M → L, Tile Playwright case | M | L, #67 solid backed fixture | L |
| Gears | M → L, shared handler | M | L, #67 solid decorative gear | L |
| Waves | M → L, shared handler | M | L, #72 solid backed fixture | L |
| Control Caps | M → L, shared handler | M | L, #72 backed cap without a shaft | L |
| Characters | M → L, shared handler | M | L, #72 backed Cloud | L |
| Pebbles / Pods | M → L, shared handler | M | L, #72 backed non-hollow fixture | L |

The native Build handler in `sensory-studio.js` raycasts visible model meshes, checks the chosen bore through the same function as manual placement, and commits through the existing pixel state and undo path. Existing marker double-click selects without adding. The shared browser scenario covers a Tile surface, Escape and measured bore placement. Remaining interaction acceptance includes all-family real-pointer fixtures, mount tooling backed by printable geometry, continuous placement with a ghost, keyboard/touch placement at a chosen point, and overlay/cutaway verification. Exercise transformed and recessed geometry, invalid placements and route joins. Keep cavity and shaft exclusions until verified. Physical testing lives in #10.

The native Show routes and arrows control is independent of Cut serial channels. Both use the same planner. The Tile fixture checks that the guide matches the planned cut path and produces no preview cutters or extra export negatives when cuts are off.

## WT-019 acceptance in progress

| ID | Acceptance | Evidence and remaining limits |
| --- | --- | --- |
| WT019-01 | Repeated native manual pixel placement with valid/invalid viewport preview and explicit exit | `sensory-studio.js` validates raycast points through the shared native bore check. `unified-studio-browser.test.mjs` exercises the Tile workflow with real mouse events, placement screenshot and Escape. L across native families until full family verification. Crystal retains its established manual workflow. |
| WT019-02 | Context add and direct manipulation of pixel and mounting hardware | L for pixel work. Native mounting remains M; needs an independent shape-aware geometry contract and tests. |
| WT019-03 | Guide, physical route and prepared shape agreement | L. Existing backed fixture manufacturing evidence covers eligible shapes. Complete route, cutaway and per-family interaction verification remains open. |
| WT019-04 | Design, Library, imports and current Print exports across built-in and imported types | L pending end-to-end matrix. Procedural subpart editing is N/A for imported mesh source. No safe imported-hardware guarantee is made. |

## WT019-05 · Gear placement and routing

The main-targeted integration preserves the checked #82 and #83 source history. The native picker shares the Build mode gate and carries the selected top or underside opening into preview marks. Mesh bores still cut through both faces and native cable channels remain underside-only. The browser suite covers bottom-view Gear double-click and guide visibility with cutting off. The existing openwork check confirms the planner explains why unbacked voids block cutting. Mark L until exact-head verification, including physical validation tracked separately in #10.

WT019-06 extends real viewport double-click coverage to the six native fixtures, including an explicit rejection case where the clicked face is unsupported. Existing Crystal tests remain separate. This is partial coverage: it does not certify on-face retainers, builds with unsupported backs, all-family print/reload, mounts or Studio-wide parity.
